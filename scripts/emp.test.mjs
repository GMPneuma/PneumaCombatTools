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
 const actor={id:'a',uuid:'Actor.a',items:collection([arm,weapon,cosmetic,eye]),effects:collection([{id:'injury',name:'Broken Arm',flags:{},statuses:new Set()}]),testUserPermission:user=>user.id==='p',
 async createEmbeddedDocuments(_type,rows){this.effects.push(...rows.map((r,i)=>({...structuredClone(r),update,statuses:new Set(r.statuses??[]),id:`status-${this.effects.length+i}`})));},
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

test('Quickhack eligibility preserves options but excludes protected foundations and electronics',()=>{
 const f=fixture();
 f.eye.system.type='cyberEye';
 f.actor.items.push({id:'port',name:'Neuroport Cyberdeck Port',type:'cyberware',system:{isInstalledInActor:true}},{id:'radio',name:'Radio',type:'gear',system:{isElectronic:true,equipped:'carried'}});
 assert.deepEqual(eligibleEmpItems(f.actor.items,f.policy,'short-circuit').map(i=>i.id),['weapon','cosmetic']);
 assert.deepEqual(eligibleEmpItems(f.actor.items,f.policy,'cyberware-malfunction').map(i=>i.id),['arm','weapon','cosmetic','eye']);
});
test('Malfunction selection belongs to the attacker and expires independently of EMP',async()=>{
 const f=fixture();game.time={worldTime:100};game.combat=f.combat;Object.assign(f.combat,{round:1,turn:0,turns:[{}]});
 const attacker={uuid:'Actor.runner',testUserPermission:u=>u.id==='runner'};
 globalThis.fromUuid=async id=>id===attacker.uuid?attacker:id===f.actor.uuid?f.actor:null;
 Object.assign(f.request,{source:'cyberware-malfunction',sourceActor:attacker.uuid,seconds:60});
 await assert.rejects(applyEmpSelection(f.combat,'r',['arm'],f.player),/cannot resolve/);
 await applyEmpSelection(f.combat,'r',['arm'],{id:'runner'});
 assert(empDisabled(f.arm));assert(empDisabled(f.weapon));
 assert.equal(get(f.arm,key+'.timedDisables.r.duration').rounds,20);
 assert.equal(f.actor.effects.filter(e=>get(e,key+'.disableRequest')).length,1);
 f.arm.flags[module].empCombats=['c'];
 f.combat.round=21;
 const {expireDisablements}=await import('../dist/scripts/emp-state.js');
 await expireDisablements(f.actor);
 assert(empDisabled(f.arm),'EMP remains after Quickhack expiry');assert(!empDisabled(f.weapon));
 assert(!get(f.arm,key+'.timedDisables.r'));
 assert.equal(f.actor.effects.filter(e=>get(e,key+'.disableRequest')).length,0);
});
test('overlapping timed hits retain later causes until combat deletion',async()=>{
 const f=fixture();game.time={worldTime:100};game.combat=f.combat;Object.assign(f.combat,{round:1,turn:0,turns:[{}]});
 Object.assign(f.request,{source:'short-circuit',seconds:60,chooser:'gm',policy:{...f.policy,cascade:false}});
 await applyEmpSelection(f.combat,'r',['weapon'],f.gm);
 f.combat.round=6;game.time.worldTime=115;
 f.combat.flags[module].empRequests.second={...f.request,id:'second',state:'pending',selected:undefined,duration:undefined};
 await applyEmpSelection(f.combat,'second',['weapon'],f.gm);
 const {expireDisablements}=await import('../dist/scripts/emp-state.js');
 f.combat.round=21;await expireDisablements(f.actor);assert(empDisabled(f.weapon));
 await finishEmp(f.combat,true);game.combats=collection([]);
 assert(!empDisabled(f.weapon));assert(!get(f.weapon,key+'.itemMarkers.cyberware'));
 assert.deepEqual(get(f.weapon,key+'.timedDisables'),{});
});
test('disabled cyberleg applies a temporary broken-limb penalty without permanent injury damage',async()=>{
 const f=fixture();game.time={worldTime:0};game.combat=f.combat;Object.assign(f.combat,{round:1,turn:0,turns:[{}]});
 f.arm.system.type='cyberLeg';Object.assign(f.request,{source:'cyberware-malfunction',seconds:60});
 await applyEmpSelection(f.combat,'r',['arm'],f.player);
 const penalty=f.actor.effects.find(e=>get(e,key+'.disabledLegPenalty'));
 assert.equal(penalty.changes[0].value,'-4');
 assert.equal(f.actor.items.length,4);
 const {evasionBlocked}=await import('../dist/scripts/injury-rules.js');
 // No inherited EMP dismemberment restriction from a broken leg.
 assert.equal(evasionBlocked(f.actor),undefined);
 f.combat.round=21;const {expireDisablements}=await import('../dist/scripts/emp-state.js');
 await expireDisablements(f.actor);assert(!f.actor.effects.some(e=>get(e,key+'.disabledLegPenalty')));
 assert.equal(f.actor.effects[0].id,'injury');
});

test('configured random modes exclude Fashionware and preserve source count, chooser and restrictions',async()=>{
 const {applyEmpBehavior,normalizeEmpBehavior}=await import('../dist/scripts/emp-behavior.js');
 const f=fixture();f.cosmetic.system.type='fashionware';
 for(const method of ['equal','foundation-more','foundation-less','no-foundation']){
  const options=applyEmpBehavior({...f.request,count:3,chooser:'gm'},normalizeEmpBehavior({gm:{method,skipAffected:false}}));
  assert.equal(options.count,3);assert.equal(options.chooser,'gm');
  const pool=eligibleEmpItems(f.actor.items,options.policy);
  assert(!pool.includes(f.cosmetic));
  assert.equal(pool.includes(f.arm),method!=='no-foundation');
  assert.equal(options.policy.skipAffected,false);
 }
 const raw=applyEmpBehavior(f.request,normalizeEmpBehavior({}));
 assert(eligibleEmpItems(f.actor.items,raw.policy).includes(f.cosmetic));
 const restricted=applyEmpBehavior({...f.request,policy:{...f.policy,foundational:false}},normalizeEmpBehavior({player:{method:'foundation-more'}}));
 assert.equal(restricted.policy.foundational,false);
});
test('overlap option avoids spending two picks on a host and its options in either draw order',()=>{
 const f=fixture(),pool=[f.arm,f.weapon,f.eye];
 assert.deepEqual(randomEmp(pool,f.actor.items,2,'equal',()=>0,true).map(i=>i.id),['arm','eye']);
 assert.deepEqual(randomEmp(pool,f.actor.items,2,'equal',()=>0.4,true).map(i=>i.id),['weapon','eye']);
 assert.deepEqual(randomEmp(pool,f.actor.items,2,'equal',()=>0,false).map(i=>i.id),['arm','weapon']);
 assert.equal(randomEmp([f.arm,f.weapon],f.actor.items,2,'equal',()=>0,true).length,1);
});
test('shortlist application only accepts saved offers and never broadens a changed inventory',async()=>{
 const f=fixture();Object.assign(f.request,{method:'shortlist',offered:['weapon','eye'],count:1});
 await assert.rejects(applyEmpSelection(f.combat,'r',['arm'],f.player),/Choose/);
 await applyEmpSelection(f.combat,'r',['weapon'],f.player);
 assert(empDisabled(f.weapon));assert(!empDisabled(f.arm));assert.deepEqual(f.combat.flags[module].empRequests.r.selectedNames,['weapon']);
 const g=fixture();Object.assign(g.request,{method:'shortlist',offered:['weapon','missing'],count:2});
 await applyEmpSelection(g.combat,'r',['weapon'],g.player);
 assert.deepEqual(g.combat.flags[module].empRequests.r.selected,['weapon']);
});
test('player random method retains player ownership and retries the saved draw after interruption',async()=>{
 const f=fixture();Object.assign(f.request,{method:'equal',count:1,policy:{...f.policy,cascade:true}});
 await assert.rejects(applyEmpSelection(f.combat,'r',[],{id:'stranger'}),/cannot resolve/);
 const random=Math.random;Math.random=()=>0;
 let fail=true;f.weapon.update=async function(data){if(fail){fail=false;throw Error('interrupted random');}return update.call(this,data)};
 try {
  await assert.rejects(applyEmpSelection(f.combat,'r',[],f.player),/interrupted random/);
  assert.deepEqual(f.combat.flags[module].empRequests.r.selected,['arm']);
  Math.random=()=>0.99;await reconcileEmp();
  assert(empDisabled(f.arm));assert(empDisabled(f.weapon));assert(!empDisabled(f.eye));
 }finally{Math.random=random;}
});
test('behavior normalizer rejects invalid methods and GM shortlist while preserving explicit false',async()=>{
 const {normalizeEmpBehavior}=await import('../dist/scripts/emp-behavior.js');
 assert.equal(normalizeEmpBehavior({gm:{method:'shortlist'}}).gm.method,'manual');
 assert.equal(normalizeEmpBehavior({player:{method:'bogus'}}).player.method,'manual');
 assert.equal(normalizeEmpBehavior({player:{method:'shortlist',shortlistMethod:'no-foundation',skipAffected:false}}).player.skipAffected,false);
});

test('BioWare homebrew excludes only named cyberware or native identities when enabled across methods',async()=>{
 const {applyEmpBehavior,normalizeEmpBehavior}=await import('../dist/scripts/emp-behavior.js');
 const f=fixture();
 const items=[
  {id:'lace',name:' Grafted Muscle and Bone Lace ',type:'cyberware',system:{isInstalledInActor:true}},
  {id:'antibodies',name:'Enhanced Antibodies',type:'cyberware',system:{isInstalledInActor:true}},
  {id:'renamed',name:'Renamed',type:'cyberware',system:{isInstalledInActor:true},_stats:{compendiumSource:'Compendium.core.Item.Lx9FSNDEIxLZ7Pyh'}},
  {id:'legacy',name:'Renamed too',type:'cyberware',system:{isInstalledInActor:true},flags:{core:{sourceId:'Compendium.core.Item.hQzMZYd3Tt0SIE1v'}}},
  {id:'other',name:'Other Cyberware',type:'cyberware',system:{isInstalledInActor:true}},
  {id:'gear',name:'Enhanced Antibodies',type:'gear',system:{isElectronic:true,equipped:'carried'}}
 ];
 assert.equal(normalizeEmpBehavior({}).includeBioware,true);
 assert.equal(eligibleEmpItems(items,applyEmpBehavior(f.request,normalizeEmpBehavior({})).policy).length,6);
 for(const chooser of ['gm','player','random'])for(const method of ['manual','equal','foundation-more','foundation-less','no-foundation','shortlist']){
  const settings=normalizeEmpBehavior({excludeBioware:true,[chooser]:{method}});
  const options=applyEmpBehavior({...f.request,chooser},settings);
  assert.deepEqual(eligibleEmpItems(items,options.policy).map(i=>i.id),['other','gear']);
  settings.includeBioware=true;
  assert.equal(options.policy.excludeBioware,true,'Request policy is a snapshot');
 }
});

test('hardening covers self, child and sibling; protected draws consume picks without disabling hosts or rerolling',async()=>{
 const {empHardened}=await import('../dist/scripts/emp-rules.js');
 const f=fixture();f.cosmetic.system.providesHardening=true;
 assert(empHardened(f.arm,f.actor.items));assert(empHardened(f.weapon,f.actor.items));assert(empHardened(f.cosmetic,f.actor.items));
 assert(!empHardened(f.eye,f.actor.items));
 assert.deepEqual(eligibleEmpItems(f.actor.items,{...f.policy,hardened:'exclude'}).map(i=>i.id),['eye']);
 assert(eligibleEmpItems(f.actor.items,{...f.policy,hardened:'exclude'},'cyberware-malfunction').includes(f.arm));
 Object.assign(f.request,{method:'equal',policy:{...f.policy,hardened:'consume'}});
 const prior=Math.random;Math.random=()=>0;
 try{await applyEmpSelection(f.combat,'r',[],f.player);}finally{Math.random=prior;}
 assert.deepEqual(f.request.selected,['arm']);assert.deepEqual(f.request.affectedNames,[]);
 assert.deepEqual(f.request.resistedNames,['arm']);assert.equal(f.request.state,'applied');
 assert(!empDisabled(f.arm));assert(!empDisabled(f.weapon));
 await applyEmpSelection(f.combat,'r',[],f.player);assert(!empDisabled(f.eye));
});
test('Internal Frame consequences use native action penalty, block player movement, and restore at combat end',async()=>{
 const {frameMovementBlocked,disabledFrameConsequences}=await import('../dist/scripts/emp-state.js');
 const f=fixture();f.eye.name='Implanted Linear Frame Beta';f.request.policy={...f.policy,frameNoMove:true,framePenalty:3};
 await applyEmpSelection(f.combat,'r',['eye'],f.player);
 assert.deepEqual(disabledFrameConsequences(f.actor),{noMove:true,penalty:3,moveReduction:0});
 assert(frameMovementBlocked(f.actor,{x:100},false));assert(!frameMovementBlocked(f.actor,{x:100},true));
 assert(!frameMovementBlocked(f.actor,{rotation:90},false));
 const effect=f.actor.effects.find(e=>get(e,key+'.frameConsequences'));
 assert(effect.changes.some(c=>c.key==='bonuses.allActions'&&c.value==='-3'));
 assert(effect.changes.some(c=>c.key==='system.stats.move.value'&&c.value==='0'));
 f.combat.started=false;await finishEmp(f.combat);
 assert(!frameMovementBlocked(f.actor,{x:100},false));assert(!f.actor.effects.some(e=>get(e,key+'.frameConsequences')));
});
test('overlapping timed Internal Frame penalties use strongest remaining request and expire independently',async()=>{
 const {expireDisablements,disabledFrameConsequences}=await import('../dist/scripts/emp-state.js');
 const f=fixture();game.time={worldTime:100};game.combat=f.combat;Object.assign(f.combat,{round:1,turn:0,turns:[{}]});
 f.eye.name='Internal Linear Frame';
 Object.assign(f.request,{source:'cyberware-malfunction',seconds:6,policy:{...f.policy,frameNoMove:true,framePenalty:4}});
 await applyEmpSelection(f.combat,'r',['eye'],f.player);
 f.combat.flags[module].empRequests.second={...f.request,id:'second',state:'pending',selected:undefined,duration:undefined,seconds:12,policy:{...f.policy,framePenalty:2}};
 await applyEmpSelection(f.combat,'second',['eye'],f.player);
 assert.deepEqual(disabledFrameConsequences(f.actor),{noMove:true,penalty:4,moveReduction:0});
 assert.equal(f.actor.effects.filter(e=>get(e,key+'.frameConsequences')).length,1);
 f.combat.round=3;await expireDisablements(f.actor);
 assert.deepEqual(disabledFrameConsequences(f.actor),{noMove:false,penalty:2,moveReduction:0});
 f.combat.round=5;await expireDisablements(f.actor);
 assert.deepEqual(disabledFrameConsequences(f.actor),{noMove:false,penalty:0,moveReduction:0});
});

test('shared eligibility applies to manual, random and shortlist with independent foundation weighting',async()=>{
 const {normalizeEmpBehavior,applyEmpBehavior}=await import('../dist/scripts/emp-behavior.js');
 const f=fixture();f.cosmetic.system.type='fashionware';f.weapon.name='Enhanced Antibodies';
 for(const method of ['manual','random','shortlist'])for(const includeFashionware of [true,false])for(const includeBioware of [true,false])for(const includeFoundational of [true,false]){
  const settings=normalizeEmpBehavior({player:{method},includeFashionware,includeBioware,includeFoundational,foundationWeight:'foundation-less'});
  const options=applyEmpBehavior(f.request,settings),pool=eligibleEmpItems(f.actor.items,options.policy);
  assert.equal(options.method,method);assert.equal(options.mode,'foundation-less');
  assert.equal(pool.includes(f.cosmetic),includeFashionware);assert.equal(pool.includes(f.weapon),includeBioware);assert.equal(pool.includes(f.arm),includeFoundational);
  assert.deepEqual(normalizeEmpBehavior(settings),settings,'Saved settings normalize without changing eligibility');
 }
 const old=normalizeEmpBehavior({gm:{method:'foundation-more'},player:{method:'shortlist',shortlistMethod:'no-foundation'},excludeBioware:true});
 assert.equal(old.gm.method,'random');assert.equal(old.player.method,'shortlist');assert.equal(old.foundationWeight,'foundation-more');assert.equal(old.includeFashionware,false);assert.equal(old.includeBioware,false);
 const noFoundation=normalizeEmpBehavior({player:{method:'shortlist',shortlistMethod:'no-foundation'}});
 assert.equal(noFoundation.includeFoundational,false);
});

test('frame MOVE reduction uses strongest active value, yields to no-move and restores on expiry',async()=>{
 const {expireDisablements}=await import('../dist/scripts/emp-state.js');
 const {normalizeEmpBehavior,applyEmpBehavior}=await import('../dist/scripts/emp-behavior.js');
 const f=fixture();game.time={worldTime:100};game.combat=f.combat;Object.assign(f.combat,{round:1,turn:0,turns:[{}]});
 assert.equal(applyEmpBehavior(f.request,normalizeEmpBehavior({})).policy.frameMoveReduction,0);
 assert.equal(applyEmpBehavior(f.request,normalizeEmpBehavior({frameReduceMove:true,frameMoveReduction:3})).policy.frameMoveReduction,3);
 f.eye.name='Internal Linear Frame';
 Object.assign(f.request,{source:'cyberware-malfunction',seconds:12,policy:{...f.policy,frameMoveReduction:3}});
 await applyEmpSelection(f.combat,'r',['eye'],f.player);
 const consequence=()=>f.actor.effects.find(e=>get(e,key+'.frameConsequences'));
 assert(consequence().changes.some(c=>c.mode===2&&c.value==='-3'));
 assert(consequence().changes.some(c=>c.mode===4&&c.value==='0'));
 f.combat.flags[module].empRequests.second={...f.request,id:'second',state:'pending',selected:undefined,duration:undefined,seconds:6,policy:{...f.policy,frameMoveReduction:5,frameNoMove:true}};
 await applyEmpSelection(f.combat,'second',['eye'],f.player);
 assert(consequence().changes.some(c=>c.mode===5&&c.value==='0'));
 assert(!consequence().changes.some(c=>c.mode===2));
 f.combat.round=3;await expireDisablements(f.actor);
 assert(consequence().changes.some(c=>c.mode===2&&c.value==='-3'));
 f.combat.round=5;await expireDisablements(f.actor);assert(!consequence());
});

for(const end of ['reset','delete','reload'])test(`timed limb disablement clears on ${end} without advancing world time`,async()=>{
 const f=fixture();game.time={worldTime:100};game.combat=f.combat;Object.assign(f.combat,{round:1,turn:0,turns:[{}]});
 f.arm.system.type='cyberLeg';Object.assign(f.request,{source:'cyberware-malfunction',seconds:60});
 await applyEmpSelection(f.combat,'r',['arm'],f.player);
 assert(empDisabled(f.arm));assert(f.actor.effects.some(e=>get(e,key+'.disabledLegPenalty')));
 if(end==='reset'){f.combat.started=false;await finishEmp(f.combat);}
 else if(end==='delete'){await finishEmp(f.combat,true);game.combats=collection([]);}
 else {game.combats=collection([]);await reconcileEmp();}
 assert(!empDisabled(f.arm));assert(!empDisabled(f.weapon));
 assert(!get(f.arm,key+'.itemMarkers.cyberware'));
 assert.deepEqual(f.actor.effects.map(e=>e.id),['injury']);
 assert.equal(game.time.worldTime,100);
});

test('ending one combat preserves a timed disablement from another ongoing combat',async()=>{
 const f=fixture();game.time={worldTime:100};game.combat=f.combat;Object.assign(f.combat,{round:1,turn:0,turns:[{}]});
 Object.assign(f.request,{source:'cyberware-malfunction',seconds:60});
 await applyEmpSelection(f.combat,'r',['arm'],f.player);
 const other={id:'other',started:true,round:1,turn:0,turns:[{}]};game.combats.push(other);
 f.arm.flags[module].timedDisables.other={...structuredClone(f.arm.flags[module].timedDisables.r),duration:{rounds:20,startRound:1,startTurn:0,combat:'other',startTime:100}};
 f.combat.started=false;await finishEmp(f.combat);
 assert(empDisabled(f.arm));assert(!get(f.arm,key+'.timedDisables.r'));
 assert(get(f.arm,key+'.timedDisables.other'));assert(get(f.arm,key+'.itemMarkers.cyberware'));
 assert(!empDisabled(f.weapon));
});
