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
let enabled;
async function setup(){
 enabled=true;const users=[{id:'gm',isGM:true,active:true},{id:'owner',active:true}];users.get=id=>users.find(u=>u.id===id);
 globalThis.game={user:users[0],users,i18n:{localize:s=>s},time:{worldTime:100},settings:{get:()=>enabled},combats:new Collection(),actors:[],scenes:new Collection()};
 globalThis.CONFIG={statusEffects:masterStatuses};globalThis.canvas={tokens:{hud:null}};
 const source=new Doc({name:'Medic',type:'character',isOwner:true,system:{stats:{luck:{value:2}}}}),target=new Doc({name:'Patient',type:'character',hasPlayerOwner:true,system:{derivedStats:{hp:{value:30,max:40}},stats:{body:{value:6},will:{value:7}}}});
 game.actors=[source,target];const scene={id:'scene',grid:{size:100}};
 const sourceToken={uuid:'Scene.scene.Token.s',actor:source,parent:scene,x:0,y:0},targetToken={uuid:'Scene.scene.Token.t',actor:target,parent:scene,x:100,y:0};
 globalThis.fromUuid=async uuid=>[sourceToken,targetToken,source,target].find(d=>d.uuid===uuid);
 await source.createEmbeddedDocuments('Item',[{name:'First Aid',type:'skill',system:{level:0}},{name:'Paramedic',type:'skill',system:{level:4}},{name:'Medtech',type:'role',system:{rank:4}},{name:'Speedheal',type:'drug',system:{amount:2}}]);
 await markMedicalDamage(target,40);
 const request=(action,extra={})=>resolveMedical({medicalType:'request',id:String(++serial),user:'owner',source:sourceToken.uuid,target:targetToken.uuid,action,hp:target.system.derivedStats.hp.value,...extra});
 return {source,target,sourceToken,targetToken,request};
}

// Regression cases for the October 4 code sweep.
const {registerHooks}=await import('node:module');
registerHooks({
 resolve(specifier,context,next){
  if(specifier==='/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js')return {shortCircuit:true,url:'data:text/javascript,'+encodeURIComponent('export default {async handle3dDice(){throw Error("injected DSN failure");}}')};
  return next(specifier,context);
 },
 load(url,context,next){const result=next(url,context);return url.endsWith('/dist/scripts/aoe/workflow.js')?{...result,source:String(result.source)+'\nexport {respond as testRespond};'}:result;}
});
const {performMedical}=await import('../dist/scripts/medical.js');
const {createInstantCard,handleInstantRequest,handleInstant}=await import('../dist/scripts/instant-effects.js');
const {burnTurn}=await import('../dist/scripts/instant-lifetime.js');
foundry.utils.deepClone=structuredClone;

test('generic status requests traverse the real dispatcher; apply/skip are idempotent and skip is GM-only',async()=>{
 const f=await setup();game.messages=new Collection();
 const message=new Doc({content:'Damage',flags:{},whisper:[],blind:false});game.messages.set(message.id,message);
 const status=masterStatuses.find(s=>s.name==='Prone').id;let applied=0;
 f.target.toggleStatusEffect=async id=>{assert.equal(id,status);applied++;};
 await createInstantCard(f.target,'status',message,{combatId:null},status);
 const scope=Object.keys(get(message,'flags.pneuma-combattools.attachedEffects'))[0];
 const request=(action,user='gm')=>handleInstantRequest({message:message.id,user,scope,request:{action}});
 await assert.rejects(request('skip','owner'),/GM only/);
 await request('apply','owner');await request('apply','owner');assert.equal(applied,1);
 assert.equal(get(message,'flags.pneuma-combattools.attachedEffects.'+scope+'.effect.state'),'applied');
 await createInstantCard(f.target,'status',message,{combatId:null},status);
 const second=Object.keys(get(message,'flags.pneuma-combattools.attachedEffects')).at(-1);
 await handleInstantRequest({message:message.id,user:'gm',scope:second,request:{action:'skip'}});
 assert.equal(get(message,'flags.pneuma-combattools.attachedEffects.'+second+'.effect.state'),'skipped');assert.equal(applied,1);
 await createInstantCard(f.target,'status',message,{combatId:null},'removed-status');
 await assert.rejects(handleInstantRequest({message:message.id,user:'gm',scope:Object.keys(get(message,'flags.pneuma-combattools.attachedEffects')).at(-1),request:{action:'apply'}}),/unavailable/);
});

test('QuickFix expiry retains failed recovery data, continues other injuries, and safely retries',async()=>{
 const f=await setup();const rows=[];
 for(const name of ['Broken Arm','Broken Leg']){
  const [injury]=await f.target.createEmbeddedDocuments('Item',[{name,type:'criticalInjury',system:{quickFix:{dvFirstAid:13},treatment:{type:'paramedicSurgery'},deathSaveIncrease:true}}]);
  const [effect]=await injury.createEmbeddedDocuments('ActiveEffect',[{name:'Penalty',disabled:false}]);
  await f.request('quickFix',{item:injury.id,skill:'First Aid',total:14});rows.push({injury,effect});
 }
 const update=rows[0].injury.updateEmbeddedDocuments.bind(rows[0].injury);let fail=true;
 rows[0].injury.updateEmbeddedDocuments=async(...args)=>{if(fail)throw Error('injected effect write failure');return update(...args);};
 const combat={id:'ended',combatants:[{actor:f.target}]};
 await assert.rejects(expireQuickFixes(combat),/injected/);
 assert(get(rows[0].injury,'flags.pneuma-combattools.quickFix'));assert.equal(rows[0].effect.disabled,true);
 assert.equal(rows[1].effect.disabled,false);assert.equal(get(rows[1].injury,'flags.pneuma-combattools.quickFix'),undefined);
 fail=false;await Promise.all([expireQuickFixes(combat),expireQuickFixes(combat)]);
 assert.equal(get(rows[0].injury,'flags.pneuma-combattools.quickFix'),undefined);assert.equal(rows[0].effect.disabled,false);assert.equal(rows[0].injury.system.deathSaveIncrease,true);
});

test('SpeedHeal resumes a failed HP write without consuming a second dose or adding another marker',async()=>{
 const f=await setup(),stock=f.source.items.find(i=>i.name==='Speedheal'),update=f.target.update.bind(f.target);
 f.target.update=async changes=>{if('system.derivedStats.hp.value' in changes)throw Error('injected HP failure');return update(changes);};
 await assert.rejects(f.request('speedheal'),/injected/);
 assert.equal(stock.system.amount,1);assert.equal(f.target.system.derivedStats.hp.value,30);assert(get(f.target,'flags.pneuma-combattools.speedhealOperation'));
 assert.equal(medicalEntries(f.source,f.target).find(r=>r.action==='speedheal').disabled,false);
 f.target.update=update;await f.request('speedheal');
 assert.equal(stock.system.amount,1);assert.equal(f.target.system.derivedStats.hp.value,40);assert.equal(get(f.target,'flags.pneuma-combattools.speedhealOperation'),undefined);
 assert.equal(f.target.effects.filter(e=>e.name==='Speed Heal').length,1);assert(needsStabilization(f.target));
});

test('SpeedHeal lost stock confirmation and overlapping resume calls consume and heal only once',async()=>{
 const f=await setup(),stock=f.source.items.find(i=>i.name==='Speedheal'),update=stock.update.bind(stock);f.target.system.derivedStats.hp.value=10;
 let fail=true;stock.update=async changes=>{await update(changes);if(fail&&'system.amount' in changes){fail=false;throw Error('lost stock confirmation');}};
 await assert.rejects(f.request('speedheal'),/lost stock/);assert.equal(stock.system.amount,1);
 const results=await Promise.allSettled([f.request('speedheal'),f.request('speedheal')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(stock.system.amount,1);assert.equal(f.target.system.derivedStats.hp.value,23);
});
test('SpeedHeal lost HP confirmation retries the same operation without a second heal',async()=>{
 const f=await setup(),stock=f.source.items.find(i=>i.name==='Speedheal'),update=f.target.update.bind(f.target);f.target.system.derivedStats.hp.value=10;
 const request={medicalType:'request',id:String(++serial),user:'owner',source:f.sourceToken.uuid,target:f.targetToken.uuid,action:'speedheal',hp:10};
 let fail=true;f.target.update=async changes=>{await update(changes);if(fail&&'system.derivedStats.hp.value' in changes){fail=false;throw Error('lost HP confirmation');}};
 await assert.rejects(resolveMedical(request),/lost HP/);await resolveMedical(request);
 assert.equal(stock.system.amount,1);assert.equal(f.target.system.derivedStats.hp.value,23);
});

function medicalRoll(f,onRoll=()=>{}) {
 const skill=f.source.items.find(i=>i.name==='First Aid');f.source.items.delete(f.source.items.find(i=>i.name==='Paramedic').id);
 let rolls=0,cards=0;
 skill.createRoll=()=>({luck:1,resultTotal:20,rollCard:'fixture',handleRollDialog:async()=>true,wasCritical:()=>false,roll:async()=>{rolls++;onRoll();}});
 skill.confirmRoll=async roll=>roll;globalThis.renderTemplate=async()=>'<div class="rollcard">20</div>';
 globalThis.ChatMessage={getSpeaker:()=>({}),applyRollMode(){},create:async()=>{cards++;}};
 return {counts:()=>({rolls,cards}),perform:()=>performMedical({actor:f.source,document:f.sourceToken,name:'Medic'},{actor:f.target,document:f.targetToken,name:'Patient'},'stabilize',undefined,true)};
}
test('medical preflight rejects missing GM or disconnected socket before any roll or LUCK payment',async()=>{
 const f=await setup(),r=medicalRoll(f);game.users[0].active=false;game.user=game.users[1];game.socket={connected:true};
 await assert.rejects(r.perform(),/active GM/);assert.equal(f.source.system.stats.luck.value,2);assert.deepEqual(r.counts(),{rolls:0,cards:0});
 game.users[0].active=true;game.socket.connected=false;await assert.rejects(r.perform(),/disconnected/);assert.equal(f.source.system.stats.luck.value,2);
});
test('medical retains paid roll through patient HP changes and retries without reroll, repayment or duplicate chat',async()=>{
 const f=await setup(),r=medicalRoll(f,()=>{f.target.system.derivedStats.hp.value=29;});game.socket={connected:true};
 await assert.rejects(r.perform(),/HP changed/);assert(needsStabilization(f.target));assert.equal(f.source.system.stats.luck.value,1);assert.deepEqual(r.counts(),{rolls:1,cards:1});
 await r.perform();assert(!needsStabilization(f.target));assert.equal(f.source.system.stats.luck.value,1);assert.deepEqual(r.counts(),{rolls:1,cards:1});
});
test('a GM disconnect after the medical roll preserves its chat result and retry uses the same roll',async()=>{
 const f=await setup(),r=medicalRoll(f,()=>{game.users[0].active=false;});game.socket={connected:true};
 await assert.rejects(r.perform(),/active GM/);assert.deepEqual(r.counts(),{rolls:1,cards:1});assert.equal(f.source.system.stats.luck.value,1);
 game.users[0].active=true;await r.perform();assert(!needsStabilization(f.target));assert.deepEqual(r.counts(),{rolls:1,cards:1});assert.equal(f.source.system.stats.luck.value,1);
});
test('medical native-card rendering failure retains the paid roll for retry',async()=>{
 const f=await setup(),r=medicalRoll(f);game.socket={connected:true};let fail=true;
 globalThis.renderTemplate=async()=>{if(fail){fail=false;throw Error('injected render failure');}return '<div class="rollcard">20</div>';};
 await assert.rejects(r.perform(),/injected render/);assert(needsStabilization(f.target));assert.equal(f.source.system.stats.luck.value,1);
 await r.perform();assert(!needsStabilization(f.target));assert.equal(f.source.system.stats.luck.value,1);assert.deepEqual(r.counts(),{rolls:1,cards:1});
});
test('healing before the queued marker write does not erase a recorded damage event',async()=>{
 const f=await setup();f.target.effects.clear();const pending=markMedicalDamage(f.target,40);f.target.system.derivedStats.hp.value=40;await pending;assert(needsStabilization(f.target));
});
test('poison and fire share HP serialization; simultaneous burn calls apply once per turn',async()=>{
 const f=await setup(),fire=masterStatuses.find(s=>s.name==='On Fire (Mild)');
 await f.target.createEmbeddedDocuments('ActiveEffect',[{name:fire.name,statuses:[fire.id],changes:[]}]);
 const update=f.target.update.bind(f.target);let active=0,peak=0;const writes=[];
 f.target.update=async changes=>{active++;peak=Math.max(peak,active);writes.push(changes['system.derivedStats.hp.value']);await new Promise(r=>setTimeout(r,1));await update(changes);active--;};
 const poison={id:'poison',actor:f.target.uuid,name:f.target.name,encounter:{combatId:null},state:'failed',damage:8,damageHTML:'8'};
 await Promise.all([handleInstant(poison,{action:'apply'},game.user,async()=>{}),burnTurn(f.target,'round:turn'),burnTurn(f.target,'round:turn')]);
 assert.equal(f.target.system.derivedStats.hp.value,20);assert.equal(peak,1);assert.equal(writes.length,2);assert.equal(poison.state,'applied');
});

async function areaFixture() {
 const f=await setup();game.messages=new Collection();globalThis.ui={notifications:{warn(){}}};
 globalThis.DOMParser=class{parseFromString(html){return {querySelectorAll:()=>[],querySelector:()=>null,body:{innerHTML:html}}}};
 f.target.system.stats.luck={value:2};f.target.system.stats.ref={value:8};const [skill]=await f.target.createEmbeddedDocuments('Item',[{name:'Evasion',type:'skill'}]);let rolls=0;
 skill.createRoll=()=>({luck:1,resultTotal:18,rollCard:'fixture',handleRollDialog:async()=>true,wasCritical:()=>false,roll:async function(){rolls++;this._roll={toJSON:()=>({total:18})};}});
 skill.confirmRoll=async roll=>roll;globalThis.Roll={fromJSON:JSON.parse};globalThis.renderTemplate=async()=>'<div class="rollcard">18</div>';
 const row={uuid:f.targetToken.uuid,actor:f.target.uuid,name:'Patient',img:'',eligible:true,state:'waiting'};
 const data={scene:'scene',kind:'explosive',phase:'responses',special:false,area:{shape:'square',origin:{x:0,y:0},direction:0,length:100,width:100},settings:{evade:'raw',evadePenalty:0,coverUp:false},exchange:{combatId:null,title:'Grenade',html:'',total:20,rollMode:'roll',dice:[]},rows:[row],attackDiceRevealed:false};
 const message=new Doc({content:'',whisper:[],blind:false,flags:{'pneuma-combattools':{aoe:data}}});game.messages.set(message.id,message);
 const {testRespond}=await import('../dist/scripts/aoe/workflow.js');
 return {...f,message,data,row,respond:()=>testRespond(message,data,row),rolls:()=>rolls};
}
test('DSN failure cannot discard an evaluated area-defense roll',async()=>{
 const f=await areaFixture();await f.respond();const saved=get(f.message,'flags.pneuma-combattools.aoe.rows')[0];
 assert.equal(saved.state,'hit');assert.equal(saved.total,18);assert.equal(f.target.system.stats.luck.value,1);assert.equal(f.rolls(),1);
});
test('failed area commit enables saved-response retry and uses the original roll with no extra LUCK',async()=>{
 const f=await areaFixture(),update=f.message.update.bind(f.message);let fail=true;
 const button={dataset:{aoeTarget:f.row.uuid},disabled:true,remove(){this.removed=true;}};
 globalThis.CSS={escape:s=>s};globalThis.document={querySelectorAll:()=>[{querySelectorAll:()=>[button]}]};
 try{
 f.message.update=async changes=>{if(fail&&changes['flags.pneuma-combattools.aoe']?.rows[0]?.state==='hit'){fail=false;throw Error('injected commit failure');}return update(changes);};
 await assert.rejects(f.respond(),/injected commit/);assert.equal(get(f.message,'flags.pneuma-combattools.aoe.rows')[0].state,'rolling');assert.equal(button.disabled,false);
 await f.respond();assert.equal(get(f.message,'flags.pneuma-combattools.aoe.rows')[0].total,18);assert.equal(f.target.system.stats.luck.value,1);assert.equal(f.rolls(),1);
 assert.equal(button.removed,true);
 }finally{delete globalThis.document;delete globalThis.CSS;}
});
