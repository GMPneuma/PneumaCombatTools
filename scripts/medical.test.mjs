import assert from 'node:assert/strict';
import {test} from 'node:test';
let serial=0;
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function set(o,p,v){const keys=p.split('.');for(const key of keys.slice(0,-1))o=o[key]??={};if(keys.at(-1).startsWith('-='))delete o[keys.at(-1).slice(2)];else o[keys.at(-1)]=v;}
class Collection extends Map {[Symbol.iterator](){return this.values();}filter(fn){return [...this].filter(fn);}some(fn){return [...this].some(fn);}find(fn){return [...this].find(fn);}}
class Doc {
 constructor(data,parent){Object.assign(this,data);this.id=data._id??String(++serial);this.parent=parent;this.uuid=(parent?.uuid??'Actor')+'.'+this.id;this.effects=new Collection();this.items=new Collection();this.statuses=new Set(data.statuses??[]);}
 async update(changes){for(const [k,v]of Object.entries(changes))set(this,k,v);}
 async createEmbeddedDocuments(type,rows){return rows.map(data=>{const doc=new Doc(data,this);(type==='Item'?this.items:this.effects).set(doc.id,doc);return doc;});}
 async deleteEmbeddedDocuments(type,ids){for(const id of ids)(type==='Item'?this.items:this.effects).delete(id);}
 async updateEmbeddedDocuments(type,rows){for(const row of rows)await (type==='Item'?this.items:this.effects).get(row._id).update(row);}
 testUserPermission(user){return user.id==='owner';}
}
globalThis.Actor=Doc;globalThis.Item=Doc;globalThis.FormApplication=class{};globalThis.Hooks={on(){},once(){}};
globalThis.foundry={utils:{getProperty:get,setProperty:set,randomID:()=>String(++serial)}};
const {medicalEntries,markMedicalDamage,needsStabilization,stabilizationDV,resolveMedical,expireQuickFixes,registerMedical}=await import('../dist/scripts/medical.js');
const {masterStatuses}=await import('../dist/scripts/status-catalog.js');
const {finishTimedEffects}=await import('../dist/scripts/instant-lifetime.js');
const {injuryTreatmentChoices,stabilizationStates,nativeTreatmentSkill}=await import('../dist/scripts/medical-rules.js');
let enabled;
async function setup(){
 enabled=true;const users=[{id:'gm',isGM:true,active:true},{id:'owner',active:true}];users.get=id=>users.find(u=>u.id===id);
 globalThis.game={user:users[0],users,time:{worldTime:100},settings:{get:()=>enabled},combats:new Collection(),actors:[],scenes:[]};
 globalThis.CONFIG={statusEffects:masterStatuses};globalThis.canvas={tokens:{hud:null}};
 const source=new Doc({name:'Medic',type:'character',isOwner:true,system:{stats:{luck:{value:2},tech:{value:8}}}}),target=new Doc({name:'Patient',type:'character',hasPlayerOwner:true,system:{derivedStats:{hp:{value:30,max:40}},stats:{body:{value:6},will:{value:7}}}});
 game.actors=[source,target];const scene={id:'scene',grid:{size:100}};
 const sourceToken={uuid:'Scene.scene.Token.s',actor:source,parent:scene,x:0,y:0},targetToken={uuid:'Scene.scene.Token.t',actor:target,parent:scene,x:100,y:0};
 globalThis.fromUuid=async uuid=>[sourceToken,targetToken,source,target].find(d=>d.uuid===uuid);
 await source.createEmbeddedDocuments('Item',[{name:'First Aid',type:'skill',system:{level:0,stat:'tech'}},{name:'Paramedic',type:'skill',system:{level:4,stat:'tech'}},{name:'Medtech',type:'role',system:{rank:4}},{name:'Speedheal',type:'drug',system:{amount:2}}]);
 await markMedicalDamage(target,40);
 const request=(action,extra={})=>resolveMedical({medicalType:'request',id:String(++serial),user:'owner',source:sourceToken.uuid,target:targetToken.uuid,action,hp:target.system.derivedStats.hp.value,...extra});
 return {source,target,sourceToken,targetToken,request};
}
test('Needs Stabilization has no penalties, is optional, and marks real HP loss regardless of ownership',async()=>{
 const f=await setup();assert(needsStabilization(f.target));assert.deepEqual([...f.target.effects][0].changes,[]);
 f.target.effects.clear();enabled=false;await markMedicalDamage(f.target,40);assert.equal(f.target.effects.size,0);
 enabled=true;await markMedicalDamage(f.target,20);assert.equal(f.target.effects.size,0);
 f.target.hasPlayerOwner=false;await markMedicalDamage(f.target,40);assert.equal(f.target.effects.size,1);f.target.effects.clear();
 f.target.hasPlayerOwner=true;await Promise.all([markMedicalDamage(f.target,40),markMedicalDamage(f.target,40)]);assert.equal(f.target.effects.size,1);
 await finishTimedEffects({id:'ended',combatants:[{actor:f.target}]});assert(needsStabilization(f.target));
});
test('native HP hooks recognize flat and nested damage updates, not healing',async()=>{
 const f=await setup(),hooks={};game.settings.register=()=>{};Hooks.on=(name,fn)=>(hooks[name]??=[]).push(fn);Hooks.once=()=>{};registerMedical();
 for(const changes of [{'system.derivedStats.hp.value':29},{system:{derivedStats:{hp:{value:29}}}}]){const options={};hooks.preUpdateActor[0](f.target,changes,options);assert.equal(options.pneumaMedicalHP,30);}
 const options={};hooks.preUpdateActor[0](f.target,{'system.derivedStats.hp.value':35},options);assert.equal(options.pneumaMedicalHP,undefined);
 f.target.effects.clear();f.target.system.derivedStats.hp.value=29;
 hooks.updateActor[0](f.target,{'system.derivedStats.hp.value':29},{});
 await new Promise(resolve=>setTimeout(resolve,0));assert(needsStabilization(f.target),'GM detects remote damage even without originating preUpdate options');
});
test('stabilization uses wound-state DV and ties fail; success clears the marker',async()=>{
 const f=await setup();assert.equal(stabilizationDV(f.target),10);f.target.system.derivedStats.hp.value=19;assert.equal(stabilizationDV(f.target),13);
 await f.request('stabilize',{total:13});assert(needsStabilization(f.target));await f.request('stabilize',{total:14});assert(!needsStabilization(f.target));
});
test('mortally wounded stabilization restores 1 HP and adds one minute of unconsciousness',async()=>{
 const f=await setup();f.target.system.derivedStats.hp.value=-4;assert.equal(stabilizationDV(f.target),15);
 await f.request('stabilize',{total:16});assert.equal(f.target.system.derivedStats.hp.value,1);assert(!needsStabilization(f.target));assert.equal([...f.target.effects][0].duration.seconds,60);
});
test('Speedheal consumes one dose, caps BODY + WILL healing, and preserves stabilization requirement',async()=>{
 const f=await setup(),stock=f.source.items.find(i=>i.name==='Speedheal');await f.request('speedheal');assert.equal(stock.system.amount,1);assert.equal(f.target.system.derivedStats.hp.value,40);assert(needsStabilization(f.target));
 f.target.system.derivedStats.hp.value=20;await assert.rejects(f.request('speedheal'),/no longer/);assert.equal(stock.system.amount,1);
 game.time.worldTime+=86400;await assert.rejects(f.request('speedheal'),/no longer/);
 const speedheal=masterStatuses.find(s=>s.name==='Speed Heal');assert(f.target.effects.some(e=>e.statuses.has(speedheal.id)));
 await finishTimedEffects({id:'ended',combatants:[{actor:f.target}]});assert(!f.target.effects.some(e=>e.statuses.has(speedheal.id)));assert(needsStabilization(f.target));
 await f.request('speedheal');assert.equal(f.target.system.derivedStats.hp.value,33);assert.equal(stock.system.amount,0);
});
test('medical menu is always available; Speedheal requires Medtech, stock and nonmortal target',async()=>{
 const f=await setup();assert(medicalEntries(f.source,f.target).some(r=>r.action==='speedheal'));
 f.source.items.find(i=>i.name==='Medtech').system.rank=0;assert.deepEqual(medicalEntries(f.source,f.target).map(r=>r.action),['stabilize','stabilize']);
 f.source.items.find(i=>i.name==='Medtech').system.rank=4;f.target.system.derivedStats.hp.value=0;assert(medicalEntries(f.source,f.target).find(r=>r.action==='speedheal').disabled);
 f.target.effects.clear();enabled=false;assert(!medicalEntries(f.source,f.target).some(r=>r.action==='stabilize'));
 assert.deepEqual(medicalEntries(undefined,f.target),[]);
 f.target.system.derivedStats.hp.value=40;assert.deepEqual(medicalEntries(f.source,f.target),[]);
});
test('Medical treatment works with automatic stabilization disabled and without a status marker',async()=>{
 const f=await setup();enabled=false;f.target.effects.clear();await f.request('speedheal');assert.equal(f.target.system.derivedStats.hp.value,40);
 f.target.system.derivedStats.hp.value=19;await assert.rejects(f.request('stabilize',{total:14}),/no longer/);await f.target.createEmbeddedDocuments('ActiveEffect',[{name:'Needs Stabilization',statuses:['pneuma-needs-stabilization']}]);await f.request('stabilize',{total:14});assert(!needsStabilization(f.target));
});
test('cross-actor treatment checks source ownership, adjacency and stale patient HP',async()=>{
 const f=await setup();await assert.rejects(f.request('stabilize',{user:'missing',total:20}),/control/);
 f.targetToken.x=300;await assert.rejects(f.request('stabilize',{total:20}),/next to/);f.targetToken.x=100;
 await assert.rejects(f.request('stabilize',{total:20,hp:29}),/HP changed/);assert(needsStabilization(f.target));
});
test('Quick Fix uses the selected native skill DV, suppresses effects and restores them after 24 hours',async()=>{
 const f=await setup();const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Broken Arm',type:'criticalInjury',system:{quickFix:{dvFirstAid:13,dvParamedic:15},treatment:{type:'paramedicSurgery'},deathSaveIncrease:true}}]);
 const [effect]=await injury.createEmbeddedDocuments('ActiveEffect',[{name:'Penalty',disabled:false}]);
 await f.request('quickFix',{item:injury.id,skill:'Paramedic',total:14});assert.equal(effect.disabled,false);
 await f.request('quickFix',{item:injury.id,skill:'First Aid',total:14});assert.equal(effect.disabled,true);assert.equal(injury.system.deathSaveIncrease,false);assert(f.target.items.has(injury.id));
 await expireQuickFixes();assert.equal(effect.disabled,true);game.time.worldTime+=86400;await expireQuickFixes();assert.equal(effect.disabled,false);assert.equal(injury.system.deathSaveIncrease,true);assert.equal(get(injury,'flags.pneuma-combattools.quickFix'),undefined);
});
test('Quick Fix is permanent treatment where the native injury specifies it',async()=>{
 const f=await setup();const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Foreign Object',type:'criticalInjury',system:{quickFix:{dvFirstAid:13,dvParamedic:13},treatment:{type:'quickFix'}}}]);
 await f.request('quickFix',{item:injury.id,skill:'First Aid',total:14});assert(!f.target.items.has(injury.id));
});
test('Quick Fix offers separate eligible skills at zero ranks and full HP',async()=>{
 const f=await setup();f.target.system.derivedStats.hp.value=40;f.source.items.find(i=>i.name==='Paramedic').system.level=0;
 const [leg,both]=await f.target.createEmbeddedDocuments('Item',[{name:'Broken Leg',type:'criticalInjury',system:{quickFix:{dvFirstAid:0,dvParamedic:13},treatment:{type:'paramedicSurgery'}}},{name:'Foreign Object',type:'criticalInjury',system:{quickFix:{dvFirstAid:13,dvParamedic:15},treatment:{type:'quickFix'}}}]);
 const rows=medicalEntries(f.source,f.target).filter(r=>r.action==='quickFix');
 assert.deepEqual(rows.filter(r=>r.item===leg.id).map(r=>r.skill),['Paramedic']);
 assert.deepEqual(rows.filter(r=>r.item===both.id).map(r=>r.skill),['First Aid','Paramedic']);assert.match(rows.find(r=>r.item===both.id&&r.skill==='Paramedic').label,/DV15/);
 await f.request('quickFix',{item:leg.id,skill:'Paramedic',total:14});assert(get(leg,'flags.pneuma-combattools.quickFix'));
});
test('non-Medtech characters can Quick Fix using native medical skills',async()=>{
 const f=await setup();f.source.items.find(i=>i.name==='Medtech').system.rank=0;
 const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Foreign Object',type:'criticalInjury',system:{quickFix:{dvFirstAid:13,dvParamedic:13},treatment:{type:'quickFix'}}}]);
 const rows=medicalEntries(f.source,f.target);assert(!rows.some(r=>r.action==='speedheal'));assert.deepEqual(rows.filter(r=>r.action==='quickFix').map(r=>r.skill),['First Aid','Paramedic']);
 await f.request('quickFix',{item:injury.id,skill:'First Aid',total:14});assert(!f.target.items.has(injury.id));
});
test('combat end restores temporary Quick Fix injuries and preserves stabilization',async()=>{
 const f=await setup();const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Broken Arm',type:'criticalInjury',system:{quickFix:{dvFirstAid:13},treatment:{type:'paramedicSurgery'},deathSaveIncrease:true}}]);
 const [effect]=await injury.createEmbeddedDocuments('ActiveEffect',[{name:'Penalty',disabled:false}]);
 await f.request('quickFix',{item:injury.id,skill:'First Aid',total:14});
 await expireQuickFixes({id:'ended',combatants:[{actor:f.target}]});
 assert(f.target.items.has(injury.id));assert.equal(effect.disabled,false);assert.equal(injury.system.deathSaveIncrease,true);assert.equal(get(injury,'flags.pneuma-combattools.quickFix'),undefined);assert(needsStabilization(f.target));
});
test('Quick Fix tracks the patient scene encounter rather than the GM viewed scene',async()=>{
 const f=await setup();const combat={id:'patient-combat',active:true,started:true,scene:{id:'scene'},combatants:[{actor:f.target,token:f.targetToken}]};game.combats.set(combat.id,combat);canvas.scene={id:'other-scene'};
 const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Broken Arm',type:'criticalInjury',system:{quickFix:{dvFirstAid:13},treatment:{type:'paramedicSurgery'},deathSaveIncrease:true}}]);
 await f.request('quickFix',{item:injury.id,skill:'First Aid',total:14});assert.equal(get(injury,'flags.pneuma-combattools.quickFix.combat'),combat.id);
 await expireQuickFixes({id:'unrelated',combatants:[]});assert(get(injury,'flags.pneuma-combattools.quickFix'));
 await expireQuickFixes(combat);assert.equal(get(injury,'flags.pneuma-combattools.quickFix'),undefined);
});
test('Medical and Treatment share native DVs, zero-rank eligibility and permanent QuickFix rules',async()=>{
 const f=await setup();
 for(const system of [{quickFix:{dvFirstAid:13,dvParamedic:15},treatment:{type:'quickFix'}},{quickFix:{dvFirstAid:0,dvParamedic:13},treatment:{type:'paramedicSurgery',dvParamedic:15,dvSurgery:13}}]){
  const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Injury',type:'criticalInjury',system}]);
  const reference=injuryTreatmentChoices(injury).filter(row=>row.stage==='QuickFix'&&nativeTreatmentSkill(f.source,row.skill));
  const menu=medicalEntries(f.source,f.target).filter(row=>row.item===injury.id);
  assert.deepEqual(menu.map(row=>row.skill),reference.map(row=>row.skill));reference.forEach(row=>assert(menu.some(entry=>entry.label.includes('DV'+row.dv+' ('))));
 }
 for(const [hp,state]of [[30,0],[19,1],[0,2]]){f.target.system.derivedStats.hp.value=hp;assert.equal(stabilizationDV(f.target),stabilizationStates[state].dv);}
});

test('Stabilize and QuickFix list both native skills with healer skill plus STAT bases',async()=>{
 const f=await setup();f.source.items.find(item=>item.name==='First Aid').system.level=4;f.source.items.find(item=>item.name==='Paramedic').system.level=2;
 f.target.system.derivedStats.hp.value=0;
 const rows=medicalEntries(f.source,f.target).filter(row=>row.action==='stabilize');
 assert.deepEqual(rows.map(row=>[row.skill,row.label]),[['First Aid','Stabilize — DV15 (1st Aid 12)'],['Paramedic','Stabilize — DV15 (Para 10)']]);
 const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Broken Arm',type:'criticalInjury',system:{quickFix:{dvFirstAid:13,dvParamedic:15}}}]);
 assert.deepEqual(medicalEntries(f.source,f.target).filter(row=>row.item===injury.id).map(row=>row.label),['Broken Arm — DV13 (1st Aid 12)','Broken Arm — DV15 (Para 10)']);
 injury.system.quickFix.dvFirstAid=0;assert.deepEqual(medicalEntries(f.source,f.target).filter(row=>row.item===injury.id).map(row=>row.skill),['Paramedic']);
});

test('medical submenus group dual skills and preserve direct single-skill actions',async()=>{
 const {medicalMenuGroups}=await import('../dist/scripts/medical-menu.js');
 const f=await setup();
 const groups=medicalMenuGroups(medicalEntries(f.source,f.target).filter(row=>row.action==='stabilize'));
 assert.equal(groups.length,1);assert.equal(groups[0].label,'Stabilize — DV10');assert.equal(groups[0].submenu,true);
 assert.deepEqual(groups[0].choices.map(row=>[row.skill,row.label]),[['First Aid','First Aid (8)'],['Paramedic','Paramedic (12)']]);
 const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Broken Arm',type:'criticalInjury',system:{quickFix:{dvFirstAid:0,dvParamedic:13}}}]);
 const single=medicalMenuGroups(medicalEntries(f.source,f.target).filter(row=>row.item===injury.id));
 assert.equal(single[0].submenu,false);assert.equal(single[0].choices[0].label,'Broken Arm — DV13 (Para 12)');
 assert.equal(single[0].choices[0].item,injury.id);assert.equal(single[0].choices[0].skill,'Paramedic');
});
