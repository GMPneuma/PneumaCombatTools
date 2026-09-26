globalThis.Hooks ??= {once(){},on(){}};
import assert from "node:assert/strict";
import {test} from "node:test";
import {registerHooks} from "node:module";
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o),set=(o,p,v)=>{const keys=p.split('.');for(const k of keys.slice(0,-1))o=o[k]??={};o[keys.at(-1)]=v;};
registerHooks({resolve(s,c,next){if(s==="/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js")return {shortCircuit:true,url:'data:text/javascript,export default {handle3dDice:async(r,mode)=>globalThis.diceModes.push(mode)}'};return next(s,c);}});
globalThis.FormApplication=class{};globalThis.foundry={utils:{getProperty:get,setProperty:set,deepClone:structuredClone,randomID:()=>String(++serial)}};
let serial=0;
class Collection extends Map {[Symbol.iterator](){return this.values()}filter(fn){return [...this.values()].filter(fn)}find(fn){return [...this.values()].find(fn)}some(fn){return [...this.values()].some(fn)}}
class Doc {constructor(data,parent){Object.assign(this,data);this.id=data._id??String(++serial);this.parent=parent;this.uuid=parent?parent.uuid+"."+(data.type?"Item":"ActiveEffect")+"."+this.id:undefined;this.effects=new Collection();this.statuses=new Set(data.statuses??[])}async update(changes){for(const [k,v] of Object.entries(changes))set(this,k,v);return this}}
class Actor extends Doc {constructor(){super({name:'Target',type:'character',system:{derivedStats:{hp:{value:40}},stats:{luck:{value:3}}}});this.uuid='Actor.'+this.id;this.items=new Collection();this.effects=new Collection();this.isOwner=true}testUserPermission(u){return u.id==='owner'}async createEmbeddedDocuments(type,rows){if(this.failCreate)throw Error('write failed');return rows.map(r=>{const d=new Doc(r,this);(type==='Item'?this.items:this.effects).set(d.id,d);return d})}async deleteEmbeddedDocuments(type,ids){for(const id of ids)(type==='Item'?this.items:this.effects).delete(id)}async updateEmbeddedDocuments(type,rows){for(const row of rows)await (type==='Item'?this.items:this.effects).get(row._id).update(row)}async toggleStatusEffect(id){if(!this.effects.some(e=>e.statuses.has(id)))await this.createEmbeddedDocuments('ActiveEffect',[{statuses:[id]}])}}
globalThis.Actor=Actor;globalThis.Item=Doc;
const {masterStatuses}=await import('../dist/scripts/status-catalog.js');
const {instantEffects,ammoProfile}=await import('../dist/scripts/instant-catalog.js');
const {handleInstant,newInstant,instantContent}=await import('../dist/scripts/instant-effects.js');
const {temporaryInjury,expireInstantActor,sleepTarget,clearInstantCondition,igniteTarget,burnTurn,registerInstantLifetimes,finishTimedEffects}=await import('../dist/scripts/instant-lifetime.js');
const {damageStatusChoices,validateDamageStatuses}=await import('../dist/scripts/damage-status.js');
function setup(){
 const gm={id:'gm',isGM:true,active:true},owner={id:'owner',isGM:false,active:true},actor=new Actor();
 globalThis.canvas={scene:{id:'s'}};
 globalThis.game={user:gm,users:new Collection([[gm.id,gm],[owner.id,owner]]),time:{worldTime:100},settings:{get:()=>''},i18n:{localize:s=>s},actors:[actor],scenes:[],combats:new Collection(),packs:{get:pack=>({getDocument:async id=>{const s=masterStatuses.find(s=>s.binding?.pack===pack&&s.binding.itemId===id);return {type:'criticalInjury',toObject:()=>({_id:id,name:s.name,type:'criticalInjury',effects:[],system:{}})}}})}};
 globalThis.fromUuid=async uuid=>uuid===actor.uuid?actor:null;globalThis.CONFIG={statusEffects:[{id:'prone',name:'Prone'}]};globalThis.diceModes=[];
 globalThis.Roll=class {constructor(formula){this.formula=formula}async evaluate(){this.total=this.formula==='3d6'?12:8;return this}async render(){return '<div>'+this.total+'</div>'}};
 globalThis.ui={notifications:{error:m=>{throw Error(m)}}};globalThis.hooks={};globalThis.Hooks={on:(n,f)=>{(hooks[n]??=[]).push(f)},once:(n,f)=>{(hooks[n]??=[]).push(f)}};
 let saves=0;return {actor,gm,owner,save:async()=>{saves++},saves:()=>saves};
}
async function resist(f,id,total){const s=newInstant(id,f.actor.uuid,f.actor.name);await handleInstant(s,{action:'claim',nonce:'n'},f.owner,f.save);await handleInstant(s,{action:'commit',nonce:'n',total,html:'<div>native</div>'},f.owner,f.save);return s}
test('eligibility is nine grenade types, two rocket types; no basic/expansive/rubber',()=>{
 const ids=['armorPiercing',...Object.keys(instantEffects),'smart'];assert.equal(ids.filter(id=>ammoProfile(id,'grenade')).length,9);assert.deepEqual(ids.filter(id=>ammoProfile(id,'rocket')),['armorPiercing','smart']);for(const id of ['basic','rubber','expansive'])assert.equal(ammoProfile(id,'grenade'),undefined);
});
test('resistance must beat DV; tied poison check fails, higher check resists',async()=>{const f=setup();assert.equal((await resist(f,'poison',13)).state,'failed');const s=await resist(f,'poison',14);await handleInstant(s,{action:'apply'},f.owner,f.save);assert.equal(s.state,'resisted');assert.equal(f.actor.system.derivedStats.hp.value,40)});
test('poison and biotoxin bypass armor, roll once, and do not apply twice',async()=>{for(const [id,amount] of [['poison',8],['biotoxin',12]]){const f=setup();f.actor.armor=11;const s=await resist(f,id,0);await handleInstant(s,{action:'apply'},f.owner,f.save,'blindroll');await handleInstant(s,{action:'apply'},f.owner,f.save);assert.equal(f.actor.system.derivedStats.hp.value,40-amount);assert.equal(f.actor.armor,11);assert.deepEqual(diceModes,['blindroll']);assert.equal(s.state,'applied')}});
test('unowned targets, other users reservations, and non-GM immunity skips are rejected',async()=>{const f=setup(),s=newInstant('poison',f.actor.uuid,'T');await assert.rejects(handleInstant(s,{action:'claim',nonce:'n'},{id:'stranger'},f.save),/owner/);await handleInstant(s,{action:'claim',nonce:'n'},f.owner,f.save);await assert.rejects(handleInstant(s,{action:'commit',nonce:'n',total:30,html:''},f.gm,f.save),/reservation/);await handleInstant(s,{action:'reset'},f.gm,f.save);await assert.rejects(handleInstant(s,{action:'skip'},f.owner,f.save),/GM/);await handleInstant(s,{action:'skip'},f.gm,f.save);assert.equal(s.state,'skipped')});
test('failed application requires GM review; retry never repeats target writes',async()=>{const f=setup(),s=await resist(f,'flashbang',0);f.actor.failCreate=true;await assert.rejects(handleInstant(s,{action:'apply'},f.owner,f.save),/write failed/);assert.equal(s.state,'review');await assert.rejects(handleInstant(s,{action:'apply'},f.owner,f.save),/resistance/);await handleInstant(s,{action:'review'},f.gm,f.save);assert.equal(s.state,'applied')});
test('flashbang applies two native injuries with no HP damage; tear gas only eye',async()=>{for(const [id,n] of [['flashbang',2],['teargas',1]]){const f=setup(),s=await resist(f,id,0);await handleInstant(s,{action:'apply'},f.owner,f.save);assert.equal(f.actor.items.size,n);assert.equal(f.actor.system.derivedStats.hp.value,40);assert.equal(f.actor.effects.filter(e=>e.duration?.seconds===60&&e.duration?.startTime===100&&e.origin).length,n)}});
test('temporary injury expiry preserves permanent injuries and extends repeated temporary exposure',async()=>{const f=setup();await f.actor.createEmbeddedDocuments('Item',[{name:'Damaged Ear',type:'criticalInjury'}]);await temporaryInjury(f.actor,'Damaged Ear');assert.equal(get([...f.actor.items][0],'flags.pneuma-combattools.instantLifetime'),undefined);await temporaryInjury(f.actor,'Damaged Eye');game.time.worldTime=120;await temporaryInjury(f.actor,'Damaged Eye');await expireInstantActor(f.actor,160);assert.equal(f.actor.items.size,2);await expireInstantActor(f.actor,180);assert.equal(f.actor.items.size,1);assert.equal([...f.actor.items][0].name,'Damaged Ear')});
test('sleep waking and expiry preserve prone and pre-existing unconsciousness',async()=>{const f=setup();await sleepTarget(f.actor);await clearInstantCondition(f.actor,'sleep');assert.equal(f.actor.effects.size,1);assert.ok([...f.actor.effects][0].statuses.has(masterStatuses.find(s=>s.name==='Prone').id));await f.actor.createEmbeddedDocuments('ActiveEffect',[{statuses:[masterStatuses.find(s=>s.name==='Unconscious').id]}]);await sleepTarget(f.actor);await expireInstantActor(f.actor,1000);assert.equal(f.actor.effects.size,2)});
test('incendiary cannot stack and applies only once per ended turn; extinguishing stops it',async()=>{const f=setup();await igniteTarget(f.actor);await igniteTarget(f.actor);assert.equal(f.actor.effects.size,1);await burnTurn(f.actor,'c:1:0');await burnTurn(f.actor,'c:1:0');assert.equal(f.actor.system.derivedStats.hp.value,38);await burnTurn(f.actor,'c:2:0');assert.equal(f.actor.system.derivedStats.hp.value,36);await clearInstantCondition(f.actor,'fire');await burnTurn(f.actor,'c:3:0');assert.equal(f.actor.system.derivedStats.hp.value,36)});
test('EMP is gated on started combat before claiming application',async()=>{const f=setup(),s=await resist(f,'emp',0);await assert.rejects(handleInstant(s,{action:'apply'},f.owner,f.save),/Start combat/);assert.equal(s.state,'failed')});
test('Add effects exposes reusable instant effects and retains normal status choices',()=>{setup();assert.ok(damageStatusChoices().some(s=>s.id==='instant:poison'));assert.deepEqual(validateDamageStatuses(['instant:smoke','instant:flashbang','prone']),['instant:smoke','instant:flashbang','prone']);assert.throws(()=>validateDamageStatuses(['instant:unknown']),/available/);assert.throws(()=>validateDamageStatuses(['instant:poison','instant:poison']),/duplicated/)});
test('HP loss wakes module sleep without standing target up',async()=>{const f=setup();registerInstantLifetimes();await sleepTarget(f.actor);hooks.preUpdateActor[0](f.actor);f.actor.system.derivedStats.hp.value--;hooks.updateActor[0](f.actor);await new Promise(r=>setTimeout(r,0));assert.equal(f.actor.effects.size,1)});
test('effect names and scope attributes are escaped',()=>{setup();const s=newInstant('poison','a','T');assert.match(instantContent(s,'"<unsafe>'),/&quot;&lt;unsafe&gt;/)});

test('remote HP loss wakes Sleep without a local preUpdate hook',async()=>{const f=setup();registerInstantLifetimes();await sleepTarget(f.actor);f.actor.system.derivedStats.hp.value-=3;hooks.updateActor[0](f.actor);await new Promise(r=>setTimeout(r,0));assert.equal(f.actor.effects.size,1);assert.ok([...f.actor.effects][0].statuses.has(masterStatuses.find(s=>s.name==='Prone').id))});
test('remote combat advance burns the previous actor once without local preUpdate',async()=>{const f=setup();registerInstantLifetimes();await igniteTarget(f.actor);const c={id:'c',started:true,round:1,turn:0,combatant:{actor:f.actor}};hooks.createCombat[0](c);c.turn=1;c.combatant={actor:null};hooks.updateCombat[0](c);await new Promise(r=>setTimeout(r,0));assert.equal(f.actor.system.derivedStats.hp.value,38);hooks.updateCombat[0](c);await new Promise(r=>setTimeout(r,0));assert.equal(f.actor.system.derivedStats.hp.value,38)});

test('native fire status severity, suppression, and nonstacking work without lifetime flags',async()=>{
 const f=setup();const fire=name=>masterStatuses.find(s=>s.name===name).id;
 await f.actor.createEmbeddedDocuments('ActiveEffect',[{name:'On Fire (Strong)',statuses:[fire('On Fire (Strong)')]},{name:'On Fire (Mild)',statuses:[fire('On Fire (Mild)')]}]);
 await igniteTarget(f.actor);assert.equal(f.actor.effects.size,2);
 await burnTurn(f.actor,'native:1');assert.equal(f.actor.system.derivedStats.hp.value,36);
 [...f.actor.effects][0].isSuppressed=true;await burnTurn(f.actor,'native:2');assert.equal(f.actor.system.derivedStats.hp.value,34);
 await clearInstantCondition(f.actor,'fire');await burnTurn(f.actor,'native:3');assert.equal(f.actor.system.derivedStats.hp.value,34);
});
test('one minute expires after twenty rounds at the application turn, not world-time drift',async()=>{
 const f=setup();const c={id:'clock',scene:canvas.scene,active:true,combatants:[{actor:f.actor}],started:true,round:4,turn:1,turns:[{},{}]};game.combat=c;game.combats.set(c.id,c);
 await sleepTarget(f.actor);await temporaryInjury(f.actor,'Damaged Eye');
 const sleep=[...f.actor.effects].find(e=>e.name==='Sleep');assert.equal(sleep.duration.rounds,20);assert.equal(sleep.duration.seconds,null);assert.equal(sleep.duration.combat,'clock');
 c.round=23;game.time.worldTime=10000;await expireInstantActor(f.actor);assert.equal(f.actor.items.size,1);assert.ok(f.actor.effects.has(sleep.id));
 c.round=24;c.turn=0;await expireInstantActor(f.actor);assert.equal(f.actor.items.size,1);
 c.turn=1;await expireInstantActor(f.actor);assert.equal(f.actor.items.size,0);assert.equal(f.actor.effects.has(sleep.id),false);
 assert.ok([...f.actor.effects].some(e=>e.statuses.has(masterStatuses.find(s=>s.name==='Prone').id)));
});

test('combat end clears manual timed effects but preserves critical injuries and other combats',async()=>{
 const f=setup(),c={id:'ending',combatants:[{actor:f.actor}]};
 const injury=masterStatuses.find(s=>s.name==='Damaged Eye');
 await f.actor.createEmbeddedDocuments('Item',[{name:'Damaged Eye',type:'criticalInjury'}]);
 await f.actor.createEmbeddedDocuments('ActiveEffect',[
  {name:'Manual buff',statuses:['manual'],duration:{seconds:3600,startTime:100}},
  {name:'Timed unconscious',statuses:[masterStatuses.find(s=>s.name==='Unconscious').id],duration:{rounds:20,startRound:1,combat:'ending'}},
  {name:'Another encounter',statuses:['other'],duration:{rounds:20,startRound:1,combat:'other'}},
  {name:'Critical injury',statuses:[injury.id],duration:{rounds:20,startRound:1,combat:'ending'}},
  {name:'Addiction',statuses:['addiction']}
 ]);
 await finishTimedEffects(c);
 assert.deepEqual([...f.actor.effects].map(e=>e.name),['Another encounter','Critical injury','Addiction']);
});

test('timed item effects expire without deleting drug inventory',async()=>{
 const f=setup();const [drug]=await f.actor.createEmbeddedDocuments('Item',[{name:'Manual medication',type:'drug'}]);
 const effect=new Doc({name:'Medication effect',duration:{seconds:10,startTime:100}},drug);drug.effects.set(effect.id,effect);
 f.actor.allApplicableEffects=function*(){yield* this.effects;yield* drug.effects;};
 await f.actor.createEmbeddedDocuments('ActiveEffect',[{name:'Linked marker',origin:drug.uuid,statuses:['manual'],duration:{seconds:10,startTime:100}}]);
 await expireInstantActor(f.actor,111);assert.equal(f.actor.items.size,1);assert.equal(effect.disabled,true);assert.equal(f.actor.effects.size,0);
});

test('Quickhack Overheat burns 4 at turn end once; System Reset wakes on damage without standing',async()=>{
 const {applyQuickhackCondition}=await import('../dist/scripts/quickhack/conditions.js');const f=setup();
 await applyQuickhackCondition(f.actor,'overheat');await applyQuickhackCondition(f.actor,'overheat');assert.equal(f.actor.effects.size,1);assert.equal(f.actor.system.derivedStats.hp.value,40);
 await burnTurn(f.actor,'c:1:0');await burnTurn(f.actor,'c:1:0');assert.equal(f.actor.system.derivedStats.hp.value,36);
 await applyQuickhackCondition(f.actor,'system-reset');const prone=masterStatuses.find(s=>s.name==='Prone').id;await clearInstantCondition(f.actor,'sleep');assert(f.actor.effects.some(e=>e.statuses.has(prone)));
});
test('Quickhack MOVE effects roll once, preserve stronger repeats, and expire without editing base MOVE',async()=>{
 const {applyQuickhackCondition}=await import('../dist/scripts/quickhack/conditions.js');const f=setup();globalThis.CONST={ACTIVE_EFFECT_MODES:{ADD:2}};
 globalThis.Roll=class{async evaluate(){this.total=4;return this;}};f.actor.system.stats.move={value:6};
 assert.equal(await applyQuickhackCondition(f.actor,'slow','blindroll'),4);const effect=[...f.actor.effects][0];assert.deepEqual(effect.changes,[{key:'system.stats.move.value',mode:2,value:'-4',priority:20}]);assert.equal(f.actor.system.stats.move.value,6);assert.deepEqual(diceModes,['blindroll']);
 game.time.worldTime=120;globalThis.Roll=class{async evaluate(){this.total=2;return this;}};assert.equal(await applyQuickhackCondition(f.actor,'slow'),4);assert.equal(f.actor.effects.size,1);
 await applyQuickhackCondition(f.actor,'impair-movement');assert.equal(f.actor.effects.size,2);await expireInstantActor(f.actor,180);assert.equal(f.actor.effects.size,0);assert.equal(f.actor.system.stats.move.value,6);
});
test('Sonic Shock applies temporary native injury and deafness, preserving permanent conditions',async()=>{
 const {applyQuickhackCondition}=await import('../dist/scripts/quickhack/conditions.js');const f=setup();await applyQuickhackCondition(f.actor,'sonic-shock');assert.equal(f.actor.items.size,1);assert.equal(f.actor.system.derivedStats.hp.value,40);assert(f.actor.effects.some(e=>e.statuses.has(masterStatuses.find(s=>s.name==='Deafened').id)));await expireInstantActor(f.actor,160);assert.equal(f.actor.items.size,0);assert.equal(f.actor.effects.size,0);
 await f.actor.createEmbeddedDocuments('Item',[{name:'Damaged Ear',type:'criticalInjury'}]);await f.actor.toggleStatusEffect(masterStatuses.find(s=>s.name==='Deafened').id);await applyQuickhackCondition(f.actor,'sonic-shock');await expireInstantActor(f.actor,300);assert.equal(f.actor.items.size,1);assert(f.actor.effects.some(e=>e.statuses.has(masterStatuses.find(s=>s.name==='Deafened').id)));
});

test('Microwaver has native Cybertech resistance and creates a timed two-item GM selection',async()=>{
 const f=setup();game.combat={id:'c',started:true,flags:{},async update(data){for(const [k,v]of Object.entries(data))set(this,k,v)}};
 game.combats.set('c',game.combat);
 await f.actor.createEmbeddedDocuments('Item',[{name:'Cyberarm',type:'cyberware',system:{isInstalledInActor:true,isFoundational:true},flags:{}}]);
 globalThis.ChatMessage={create:async()=>({id:'card'})};globalThis.Dialog=class{render(){}};
 const s=await resist(f,'microwaver',15);s.encounter={combatId:'c',combatEpoch:''};
 assert.equal(s.state,'failed','DV ties fail');
 await handleInstant(s,{action:'apply'},f.gm,f.save);
 const request=Object.values(game.combat.flags['pneuma-combattools'].empRequests)[0];
 assert.equal(request.count,2);assert.equal(request.seconds,60);assert.equal(request.source,'microwaver');assert.equal(request.chooser,'gm');
 assert.equal(f.actor.system.derivedStats.hp.value,40);
 assert.equal(ammoProfile('microwaver','grenade'),undefined);
});
test('Microwaver dispatches once after a hit, preserves privacy, and skips misses',async()=>{
 const f=setup(),made=[];globalThis.ChatMessage={create:async data=>{made.push(data);return {id:'child'}},getSpeaker:()=>({})};
 const {dispatchMicrowaver}=await import('../dist/scripts/instant-effects.js');
 const m={id:'attack',whisper:['gm'],blind:true,flags:{'pneuma-combattools':{exchange:{combatId:null,disableSource:'microwaver',state:'waiting',hit:false,defenderActor:f.actor.uuid}}},async update(data){for(const [k,v]of Object.entries(data))set(this,k,v)}};
 await dispatchMicrowaver(m);assert.equal(made.length,0);
 Object.assign(m.flags['pneuma-combattools'].exchange,{state:'resolved',hit:false});await dispatchMicrowaver(m);assert.equal(made.length,0);
 m.flags['pneuma-combattools'].exchange.hit=true;
 await Promise.all([dispatchMicrowaver(m),dispatchMicrowaver(m)]);await dispatchMicrowaver(m);
 assert.equal(made.length,1);assert.deepEqual(made[0].whisper,['gm']);assert.equal(made[0].blind,true);assert.equal(made[0].flags['pneuma-combattools'].instant.effect.id,'microwaver');
});

test('expiration checks departing actor, round participants and out-of-combat time only',async()=>{
 const f=setup(),second=new Actor(),outside=new Actor();game.actors.push(second,outside);
 for(const actor of [f.actor,second,outside])await actor.createEmbeddedDocuments('ActiveEffect',[{name:'Timed',duration:{seconds:1,startTime:0}}]);
 const combat={id:'turn-test',started:true,round:1,turn:0,combatant:{actor:f.actor},combatants:[{actor:f.actor},{actor:second}]};
 game.combats=new Collection([[combat.id,combat]]);registerInstantLifetimes();hooks.createCombat[0](combat);
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 hooks.updateCombat[0](combat);await flush();assert.equal(f.actor.effects.size,1,'Unrelated update does not expire effects');
 hooks.updateWorldTime[0]();await flush();assert.equal(outside.effects.size,0);assert.equal(second.effects.size,1);assert.equal(f.actor.effects.size,1);
 combat.turn=1;combat.combatant={actor:second};hooks.updateCombat[0](combat);await flush();assert.equal(f.actor.effects.size,0);assert.equal(second.effects.size,1);
 combat.round=2;combat.turn=0;combat.combatant={actor:f.actor};hooks.updateCombat[0](combat);await flush();assert.equal(second.effects.size,0);
});

test('saved outside-combat Sleep retains world time when a combat starts before application',async()=>{const f=setup(),s=newInstant('sleep',f.actor.uuid,'Target',{combatId:null});s.state='failed';game.combat={id:'new',active:true,started:true,scene:canvas.scene,round:1,turn:0,combatants:[{actor:f.actor}]};game.combats.set('new',game.combat);await handleInstant(s,{action:'apply'},f.owner,f.save);const sleep=f.actor.effects.find(e=>e.name==='Sleep');assert.equal(sleep.duration.seconds,60);assert.equal(sleep.duration.combat,null);});
test('saved instant effect refuses a reset encounter before HP writes',async()=>{const f=setup(),s=newInstant('poison',f.actor.uuid,'Target',{combatId:'c',combatEpoch:'before'});s.state='failed';s.damage=8;game.combats.set('c',{id:'c',started:true,flags:{'pneuma-combattools':{evasionEpoch:'after'}}});await assert.rejects(handleInstant(s,{action:'apply'},f.owner,f.save),/reset/);assert.equal(f.actor.system.derivedStats.hp.value,40);});


test('damage statuses without durations clear only with their originating encounter',async()=>{
 const {applyCombatStatus}=await import('../dist/scripts/status-sync.js');const f=setup();
 const c={id:'damage-combat',combatants:[{actor:f.actor}]},other={id:'other',combatants:[{actor:f.actor}]};
 const prone=masterStatuses.find(s=>s.name==='Prone').id;
 await applyCombatStatus(f.actor,prone,c,true);
 const effect=f.actor.effects.find(e=>e.statuses.has(prone));
 assert.equal(get(effect,'flags.pneuma-combattools.endWithCombat'),c.id);
 await applyCombatStatus(f.actor,prone,other,true);
 assert.equal(get(effect,'flags.pneuma-combattools.endWithCombat'),c.id,'reapplication retains original ownership');
 await finishTimedEffects(other);assert.ok(f.actor.effects.has(effect.id));
 c.combatants=[];await finishTimedEffects(c);assert.equal(f.actor.effects.has(effect.id),false,'cleanup also reaches removed participants');
});

test('damage cleanup preserves preexisting statuses, outside-combat statuses, death and injuries',async()=>{
 const {applyCombatStatus}=await import('../dist/scripts/status-sync.js');const f=setup(),c={id:'damage-combat',combatants:[{actor:f.actor}]};
 const prone=masterStatuses.find(s=>s.name==='Prone').id,dead=masterStatuses.find(s=>s.name==='Dead').id;
 await applyCombatStatus(f.actor,prone,null,true);await applyCombatStatus(f.actor,prone,c,true);
 await applyCombatStatus(f.actor,dead,c,true);
 await applyCombatStatus(f.actor,masterStatuses.find(s=>s.name==='Broken Leg').id,c,true);
 await finishTimedEffects(c);
 assert.ok(f.actor.effects.some(e=>e.statuses.has(prone)));assert.ok(f.actor.effects.some(e=>e.statuses.has(dead)));assert.equal(f.actor.items.size,1);
});

test('damage statuses clear through both delete and reset combat hooks',async()=>{
 const {applyCombatStatus}=await import('../dist/scripts/status-sync.js');
 for(const action of ['deleteCombat','updateCombat']) {
  const f=setup(),c={id:'damage-combat',started:true,round:1,turn:0,combatants:[{actor:f.actor}]};game.combats.set(c.id,c);
  await applyCombatStatus(f.actor,masterStatuses.find(s=>s.name==='Prone').id,c,true);
  registerInstantLifetimes();for(const hook of hooks.createCombat??[])hook(c);
  c.started=false;for(const hook of hooks[action]??[])hook(c);
  await new Promise(r=>setTimeout(r,0));assert.equal(f.actor.effects.size,0,action);
 }
});


test('incendiary damage followup and sleep prone clear at the saved encounter end',async()=>{
 const f=setup(),c={id:'fire-combat',started:true,combatants:[]};game.combats.set(c.id,c);
 const state=newInstant('incendiary',f.actor.uuid,f.actor.name,{combatId:c.id,combatEpoch:''});
 await handleInstant(state,{action:'apply'},f.owner,f.save);
 assert.equal(f.actor.effects.size,1);assert.equal(get([...f.actor.effects][0],'flags.pneuma-combattools.endWithCombat'),c.id);
 await sleepTarget(f.actor,c);await finishTimedEffects({id:'other',combatants:[{actor:f.actor}]});assert.equal(f.actor.effects.size,3);
 await finishTimedEffects(c);assert.equal(f.actor.effects.size,0);
});


test('damage cleanup disables native drug effects without deleting inventory or tagging unrelated markers',async()=>{
 const {applyCombatStatus}=await import('../dist/scripts/status-sync.js');const f=setup(),c={id:'drug-combat',combatants:[{actor:f.actor}]};
 const stim=masterStatuses.find(s=>s.name==='Stim');
 const [drug]=await f.actor.createEmbeddedDocuments('Item',[{name:stim.binding.itemName,type:'drug'}]);
 const native=new Doc({name:stim.binding.effectNames[0],disabled:true},drug);drug.effects.set(native.id,native);
 drug.updateEmbeddedDocuments=async (_type,rows)=>{for(const row of rows)await drug.effects.get(row._id).update(row)};
 f.actor.allApplicableEffects=function*(){yield* this.effects;yield* drug.effects};
 await f.actor.createEmbeddedDocuments('Item',[{name:'Broken Leg',type:'criticalInjury'}]);
 await applyCombatStatus(f.actor,stim.id,c,true);
 assert.equal(native.disabled,false);assert.equal(get(native,'flags.pneuma-combattools.endWithCombat'),c.id);
 const injury=f.actor.effects.find(e=>e.statuses.has(masterStatuses.find(s=>s.name==='Broken Leg').id));
 assert.equal(get(injury,'flags.pneuma-combattools.endWithCombat'),undefined);
 await finishTimedEffects(c);assert.equal(native.disabled,true);assert.equal(f.actor.items.size,2);assert.equal(f.actor.effects.some(e=>e.statuses.has(stim.id)),false);
});

test('temporary eye and ear statuses appear in the affected Biomonitor and clear at combat end',async()=>{
 const {collectHUDConditions}=await import('../dist/scripts/hud-conditions.js');
 for(const names of [['Damaged Eye'],['Damaged Eye','Damaged Ear'],['Damaged Ear']]){
  const f=setup(),c={id:'temporary',started:true,round:1,turn:0,turns:[{},{}],combatants:[{actor:f.actor}]};game.combats.set(c.id,c);
  f.actor.allApplicableEffects=function*(){yield* this.effects;};
  await f.actor.createEmbeddedDocuments('Item',[{name:'Broken Arm',type:'criticalInjury'}]);
  for(const name of names)await temporaryInjury(f.actor,name,c);
  for(const name of names){const status=masterStatuses.find(s=>s.name===name);assert(f.actor.effects.some(e=>e.statuses.has(status.id)));assert(collectHUDConditions(f.actor).medical.some(r=>r.title===name));}
  await finishTimedEffects({id:'another',combatants:[{actor:f.actor}]});assert.equal(f.actor.items.size,names.length+1);
  await finishTimedEffects(c);assert.deepEqual([...f.actor.items].map(i=>i.name),['Broken Arm']);
  for(const name of names)assert(!collectHUDConditions(f.actor).medical.some(r=>r.title===name));
 }
});
test('permanent eye injury remains permanent after tear gas and combat cleanup',async()=>{
 const f=setup(),c={id:'temporary',started:true,round:1,turn:0,combatants:[{actor:f.actor}]};
 await f.actor.createEmbeddedDocuments('Item',[{name:'Damaged Eye',type:'criticalInjury'}]);
 await temporaryInjury(f.actor,'Damaged Eye',c);const id=masterStatuses.find(s=>s.name==='Damaged Eye').id;
 assert(f.actor.effects.some(e=>e.statuses.has(id)));await finishTimedEffects(c);assert.equal(f.actor.items.size,1);assert(f.actor.effects.some(e=>e.statuses.has(id)));
});

test('wake and extinguish reject stale followups and never reapply conditions',async()=>{
 const {hasInstantCondition}=await import('../dist/scripts/instant-lifetime.js');
 for(const [id,kind,action] of [['sleep','sleep','wake'],['incendiary','fire','extinguish']]){
  const f=setup(),s={...newInstant(id,f.actor.uuid,'Target'),state:'applied'};
  await assert.rejects(handleInstant(s,{action},f.owner,f.save),/no longer active/);
  if(kind==='sleep')await sleepTarget(f.actor,null);else await igniteTarget(f.actor,null);
  assert(hasInstantCondition(f.actor,kind));await handleInstant(s,{action},f.owner,f.save);
  assert(!hasInstantCondition(f.actor,kind));assert.equal(s.state,'applied');
  await assert.rejects(handleInstant(s,{action},f.owner,f.save),/no longer active/);
 }
});
