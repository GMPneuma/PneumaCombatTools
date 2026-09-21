import {installMockLibWrapper} from "./lib-wrapper-fixture.mjs";
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {empDisabled,eligibleEmpItems,randomEmp,expandEmp,empReferences} from '../dist/scripts/emp-rules.js';
import {applyEmpSelection,finishEmp,reconcileEmp} from '../dist/scripts/emp-state.js';
const module='pneuma-combattools',key=`flags.${module}`;
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
const collection=rows=>Object.assign(rows,{get:id=>rows.find(r=>r.id===id)});
function update(data){for(const [path,value] of Object.entries(data)){const parts=path.split('.');let node=this;for(const part of parts.slice(0,-1))node=node[part]??={};const last=parts.at(-1);if(last.startsWith('-='))delete node[last.slice(2)];else node[last]=structuredClone(value);}return Promise.resolve(this);}
function fixture(){
 const gm={id:'gm',isGM:true,active:true},player={id:'p',isGM:false,active:true};
 globalThis.foundry={utils:{getProperty:get}};
 const item=(id,sys={})=>({id,name:id,type:'cyberware',flags:{},system:{isInstalled:true,isInstalledInActor:true,isElectronic:true,...sys},effects:[{id:'e',disabled:false},{id:'prior',disabled:true}],update});
 const arm=item('arm',{isFoundational:true,type:'cyberArm',installedItems:{list:['weapon','cosmetic']}});
 const weapon=item('weapon',{installedIn:['arm']}),cosmetic=item('cosmetic',{installedIn:['arm']}),eye=item('eye',{isFoundational:true});
 const actor={id:'a',uuid:'Actor.a',items:collection([arm,weapon,cosmetic,eye]),effects:collection([{id:'injury',name:'Broken Arm',flags:{}}]),testUserPermission:user=>user.id==='p',
 async createEmbeddedDocuments(_type,rows){this.effects.push(...rows.map((r,i)=>({...structuredClone(r),id:`status-${this.effects.length+i}`})));},
 async deleteEmbeddedDocuments(_type,ids){this.effects=collection(this.effects.filter(e=>!ids.includes(e.id)));}};
 const policy={foundational:true,cascade:true,electronics:true,immune:[]};
 const request={id:'r',actor:actor.uuid,count:1,chooser:'player',mode:'equal',policy,state:'pending'};
 const combat={id:'c',started:true,flags:{[module]:{empRequests:{r:request}}},update};
 globalThis.game={user:gm,users:collection([gm,player]),combats:collection([combat]),actors:[actor],scenes:[]};
 globalThis.fromUuid=async uuid=>uuid===actor.uuid?actor:null;
 return {actor,arm,weapon,cosmetic,eye,combat,request,policy,gm,player};
}
test('eligibility honors installation, foundation policy, immunity, carried electronics',()=>{
 const f=fixture();f.actor.items.push({id:'radio',name:'Radio',type:'gear',system:{isElectronic:true,equipped:'carried'}},{id:'stored',name:'Stored',type:'gear',system:{isElectronic:true,equipped:'owned'}});
 assert.deepEqual(eligibleEmpItems(f.actor.items,{...f.policy,foundational:false,immune:['cosmetic']}).map(i=>i.id),['weapon','radio']);
 f.weapon.system.isInstalledInActor=false;assert(!eligibleEmpItems(f.actor.items,f.policy).includes(f.weapon));
});
test('random draw has no duplicates and foundational weights change thresholds',()=>{
 const f=fixture(),pool=[f.arm,f.weapon];
 assert.equal(randomEmp(pool,pool,1,'equal',()=>0.6)[0].id,'weapon');
 assert.equal(randomEmp(pool,pool,1,'foundation-more',()=>0.6)[0].id,'arm');
 assert.equal(randomEmp(pool,pool,1,'foundation-less',()=>0.4)[0].id,'weapon');
 assert.equal(new Set(randomEmp(f.actor.items,f.actor.items,20,'equal',()=>0).map(i=>i.id)).size,4);
 // Arm group collectively has 50%, even with three items; eye group has 50%.
 assert.equal(randomEmp(f.actor.items,f.actor.items,1,'system',()=>0.51)[0].id,'eye');
});
test('nested hosts expand once, including immune dependents, with cycles bounded',()=>{
 const f=fixture();assert.deepEqual(expandEmp([f.arm],f.actor.items,true).map(i=>i.id),['arm','weapon','cosmetic']);
 f.weapon.system.installedItems={list:['arm']};assert.equal(expandEmp([f.arm],f.actor.items,true).length,3);
 assert.deepEqual(expandEmp([f.arm],f.actor.items,false),[f.arm]);
});
test('apply stores combat references and preserves existing effect and installation state; duplicate is idempotent',async()=>{
 const f=fixture(),prior=structuredClone(f.arm.system),effects=structuredClone(f.arm.effects);
 f.arm.flags={[module]:{itemMarkers:{disabled:{label:'Disabled',description:'Pre-existing'}}}};
 await applyEmpSelection(f.combat,'r',['arm'],f.player);
 assert(empDisabled(f.arm));assert(empDisabled(f.weapon));assert.equal(get(f.combat,`${key}.empRecords.r`).items.length,3);
 assert.deepEqual(f.arm.system,prior);assert.deepEqual(f.arm.effects,effects);
 assert.equal(f.actor.effects.length,2);assert.deepEqual(f.actor.effects[1].changes,[]);
 await applyEmpSelection(f.combat,'r',['arm'],f.player);assert.equal(f.actor.effects.length,2);
 f.combat.started=false;assert(!empDisabled(f.arm));await finishEmp(f.combat);
 assert.deepEqual(empReferences(f.arm),[]);assert(get(f.arm,`${key}.itemMarkers.disabled`));assert(!get(f.arm,`${key}.itemMarkers.emp`));
 assert.deepEqual(f.arm.effects,effects);assert.deepEqual(f.actor.effects.map(e=>e.id),['injury']);
});
test('owners cannot select for GM requests or other actors; stale and duplicate selections fail',async()=>{
 const f=fixture();await assert.rejects(applyEmpSelection(f.combat,'r',['arm'],{id:'stranger'}),/cannot resolve/);
 f.request.chooser='gm';await assert.rejects(applyEmpSelection(f.combat,'r',['arm'],f.player),/cannot resolve/);f.request.chooser='player';
 await assert.rejects(applyEmpSelection(f.combat,'r',['missing'],f.player),/Choose/);
 await assert.rejects(applyEmpSelection(f.combat,'r',['arm','arm'],f.player),/Choose/);
 f.combat.started=false;await assert.rejects(applyEmpSelection(f.combat,'r',['arm'],f.player),/started combat/);
});
test('interrupted writes resume the original selection on reload',async()=>{
 const f=fixture();let fail=true;f.weapon.update=async function(data){if(fail){fail=false;throw Error('interrupted');}return update.call(this,data);};
 await assert.rejects(applyEmpSelection(f.combat,'r',['arm'],f.player),/interrupted/);
 assert.deepEqual(get(f.combat,`${key}.empRequests.r.selected`),['arm']);
 await reconcileEmp();assert.equal(get(f.combat,`${key}.empRequests.r.state`),'applied');assert(empDisabled(f.weapon));assert(!empDisabled(f.eye));
});
test('overlapping references survive one combat ending; stale deletion records are cleaned on startup',async()=>{
 const f=fixture();await applyEmpSelection(f.combat,'r',['arm'],f.player);
 const other={id:'other',started:true,flags:{},update};game.combats.push(other);f.arm.flags[module].empCombats.push('other');
 f.combat.started=false;await finishEmp(f.combat,true);assert(empDisabled(f.arm));assert(get(f.arm,`${key}.itemMarkers.emp`));assert(!empDisabled(f.weapon));
 game.combats=collection([]);await reconcileEmp();assert.deepEqual(empReferences(f.arm),[]);assert(!get(f.arm,`${key}.itemMarkers.emp`));assert.deepEqual(f.actor.effects.map(e=>e.id),['injury']);
});

test('native effect suppression and roll guard restore automatically without flipping disabled flags',async()=>{
 const f=fixture();
 const registrations=installMockLibWrapper();
 globalThis.Item=class {};
 globalThis.NativeEmpItem=class extends Item {createRoll(){return 'native-roll';}confirmRoll(){return 'confirmed';}};
 const item=Object.assign(new NativeEmpItem(),f.arm);
 globalThis.CONFIG={ActiveEffect:{documentClass:class{constructor(){this.system={};}determineSuppression(){this.system.isSuppressed=!!this.nativeSuppressed;}}}};
 globalThis.ui={notifications:{warn(){}}};
 const {registerHooks}=await import('node:module');
 const hook=registerHooks({resolve(specifier,context,next){if(specifier==='/systems/cyberpunk-red-core/modules/item/cpr-item.js')return {shortCircuit:true,url:'data:text/javascript,export default globalThis.NativeEmpItem'};return next(specifier,context);}});
 try {
  const {installEmpNativeGuards}=await import('../dist/scripts/emp-state.js');await installEmpNativeGuards();
  assert.deepEqual(registrations.map(r=>r.type),['MIXED','MIXED','MIXED']);
  const effect=new CONFIG.ActiveEffect.documentClass();effect.parent=item;effect.disabled=true;
  assert.equal(item.createRoll(),'native-roll');
  item.flags={[module]:{empCombats:['c']}};effect.determineSuppression();assert.equal(effect.system.isSuppressed,true);assert.equal(effect.disabled,true);
  assert.throws(()=>item.createRoll(),/disabled by EMP/);assert.throws(()=>item.confirmRoll(),/disabled by EMP/);
  f.combat.started=false;effect.determineSuppression();assert.equal(effect.system.isSuppressed,false);assert.equal(effect.disabled,true);assert.equal(item.confirmRoll(),'confirmed');
  effect.nativeSuppressed=true;effect.determineSuppression();assert.equal(effect.system.isSuppressed,true);
 } finally {hook.deregister();}
});

test('EMP removes cyberweapons from shared attack/DV eligibility until combat ends',async()=>{
 const f=fixture();const {availableWeapons}=await import('../dist/scripts/weapon-data.js');
 f.weapon.system.isWeapon=true;
 assert(availableWeapons(f.actor.items).includes(f.weapon));
 await applyEmpSelection(f.combat,'r',['arm'],f.player);
 assert(!availableWeapons(f.actor.items).includes(f.weapon));
 f.combat.started=false;assert(availableWeapons(f.actor.items).includes(f.weapon));
});
