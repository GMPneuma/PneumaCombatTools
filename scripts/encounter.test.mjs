import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sceneEncounter,displayedEncounter,tokenEncounter,encounterRef,resolveEncounter,actorEncounter} from '../dist/scripts/encounter.js';
import {effectDuration,durationExpired} from '../dist/scripts/effect-duration.js';
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function fixture(){
 const scene={id:'s'},actor={uuid:'Actor.a'},a={uuid:'Scene.s.Token.a',parent:scene,actor},b={uuid:'Scene.s.Token.b',parent:scene,actor:{uuid:'Actor.b'}};
 const combat={id:'a',uuid:'Combat.a',active:true,started:true,scene,round:1,turn:0,turns:[{},{}],flags:{},combatants:[{actor,token:a},{actor:b.actor,token:b}]};
 const other={...combat,id:'b',uuid:'Combat.b',active:false,flags:{}};
 globalThis.foundry={utils:{getProperty:get}};globalThis.canvas={scene};
 globalThis.game={combat:other,combats:new Map([['a',combat],['b',other]]),time:{worldTime:10}};
 return {scene,actor,a,b,combat,other};
}
test('tracker selection never wins over the active scene encounter',()=>{const f=fixture();assert.equal(sceneEncounter(),f.combat);game.combat=undefined;assert.equal(sceneEncounter(),f.combat)});
test('dual token membership is allowed when only one encounter is active',()=>{const f=fixture();assert.equal(tokenEncounter('s',[f.a.uuid,f.b.uuid]),f.combat)});
test('two active encounters fail even if only one has the requested tokens',()=>{const f=fixture();f.other.active=true;f.other.combatants=[];assert.throws(()=>tokenEncounter('s',[f.a.uuid]),/Multiple active/);assert.equal(displayedEncounter(),undefined)});
test('unstarted and foreign-scene encounters do not qualify',()=>{const f=fixture();f.combat.started=false;f.other.active=true;f.other.scene={id:'other'};assert.equal(sceneEncounter(),undefined)});
test('the same actor on a different token is not membership',()=>{const f=fixture();assert.throws(()=>tokenEncounter('s',['Scene.s.Token.copy']),/participating tokens/)});
test('missing one participant cannot silently become outside combat',()=>{const f=fixture();f.combat.combatants.pop();assert.throws(()=>tokenEncounter('s',[f.a.uuid,f.b.uuid]),/participating tokens/)});
test('scene-less encounters qualify only through tokens in the action scene',()=>{const f=fixture();f.combat.scene=null;assert.equal(sceneEncounter('s'),f.combat);assert.equal(sceneEncounter('elsewhere'),undefined)});
test('saved action survives tracker, canvas and active-encounter changes',()=>{const f=fixture(),ref=encounterRef(f.combat,'s',[f.a.uuid,f.b.uuid]);f.combat.active=false;f.other.active=true;canvas.scene={id:'other'};assert.equal(resolveEncounter(ref),f.combat)});
for(const change of ['end','delete','reset','scene','participant'])test('saved action rejects '+change+' without selecting replacement',()=>{const f=fixture(),ref=encounterRef(f.combat,'s',[f.a.uuid,f.b.uuid]);if(change==='end')f.combat.started=false;if(change==='delete')game.combats.delete('a');if(change==='reset')f.combat.flags={'pneuma-combattools':{evasionEpoch:'new'}};if(change==='scene')f.combat.scene={id:'other'};if(change==='participant')f.combat.combatants.pop();f.other.active=true;assert.throws(()=>resolveEncounter(ref));});
test('outside-combat action remains outside when combat starts',()=>{const f=fixture(),ref=encounterRef(undefined,'s',[f.a.uuid]);assert.equal(resolveEncounter(ref),undefined);assert.equal(effectDuration(60,resolveEncounter(ref)).seconds,60)});
test('timers use supplied encounter independently of tracker and canvas',()=>{const f=fixture();f.other.round=80;const d=effectDuration(60,f.combat);assert.equal(d.combat,'a');assert.equal(d.startRound,1);game.time.worldTime=9999;assert.equal(durationExpired(d),false);f.combat.round=21;assert.equal(durationExpired(d),true)});
test('actor-only actions reject duplicate tokens instead of guessing',()=>{const f=fixture();f.combat.combatants.push({actor:f.actor,token:{...f.a,uuid:'copy'}});assert.throws(()=>actorEncounter(f.actor),/multiple tokens/);assert.equal(actorEncounter({...f.actor,isToken:true,token:f.a}),f.combat)});
