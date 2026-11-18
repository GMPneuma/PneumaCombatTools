import assert from "node:assert/strict";
import {test} from "node:test";
import {registerInjuryNotices,applyInjuryMoveFloor,scheduleInjuryReminder,deliverInjuryReminders} from "../dist/scripts/injury-notices.js";
import {listHUDMessages,dismissHUDMessage} from "../dist/scripts/hud-messages.js";
import {crackedSkullDamage} from "../dist/scripts/damage-application.js";
const get=(o,p)=>p.split(".").reduce((v,k)=>v?.[k],o);
function setup(names=[]){
 globalThis.foundry={utils:{getProperty:get,randomID:()=>"notice"}};
 const actor={name:"A",uuid:"Actor.a",items:names.map(name=>({type:"criticalInjury",name})),effects:[],system:{stats:{move:{value:-2}}},flags:{},testUserPermission:()=>true,async update(data){for(const [k,v]of Object.entries(data)){let o=this;const parts=k.split(".");for(const key of parts.slice(0,-1))o=o[key]??={};o[parts.at(-1)]=structuredClone(v);}}};
 const gm={id:"gm",isGM:true,active:true};const users=[gm];users.get=()=>gm;
 globalThis.game={user:gm,users};return actor;
}
test("Cracked Skull triples only penetration, preserving reductions, bonus and nonlethal cap",()=>{
 assert.equal(crackedSkullDamage(12,17,3,30,true),20);
 assert.equal(crackedSkullDamage(12,17,30,30,true),0);
 assert.equal(crackedSkullDamage(12,17,3,5,false),4);
 assert.equal(crackedSkullDamage(12,17,3,0,false),0);
});
test("MOVE floor preserves explicit immobilization and does not create or stack modifiers",()=>{
 for(const name of ["Collapsed Lung","Broken Leg","Dismembered Leg"]){
  const actor=setup([name]);applyInjuryMoveFloor(actor);assert.equal(actor.system.stats.move.value,1);assert.equal(actor.effects.length,0);
  actor.system.stats.move.value=0;actor.effects=[{statuses:new Set(),disabled:false,changes:[{key:"system.stats.move.value",mode:5,value:"0"}]}];
  applyInjuryMoveFloor(actor);assert.equal(actor.system.stats.move.value,0);
 }
 const actor=setup([]);applyInjuryMoveFloor(actor);assert.equal(actor.system.stats.move.value,-2);
});
test("next-turn injury reminders are advisory, wait for target's turn and are delivered only once",async()=>{
 const actor=setup(["Spinal Injury","Damaged Ear"]),combat={id:"c",round:1,turn:2,started:true,combatant:{actor}};
 await scheduleInjuryReminder(actor,combat,"Spinal Injury");
 await scheduleInjuryReminder(actor,combat,"Damaged Ear","a:1");
 await scheduleInjuryReminder(actor,combat,"Damaged Ear","a:1");
 const read=()=>get(actor,"flags.pneuma-combattools.injuryReminders");
 assert.equal(read().length,2);await deliverInjuryReminders(combat);assert(read().every(r=>!r.delivered));
 combat.round=2;combat.turn=1;await deliverInjuryReminders(combat);assert(read().every(r=>r.delivered));
 await scheduleInjuryReminder(actor,combat,"Damaged Ear","a:1");assert.equal(read().filter(r=>r.movementTurn==="a:1").length,1);
 assert.equal(actor.system.stats.move.value,-2);assert.equal(actor.effects.length,0);
 await deliverInjuryReminders(combat);
 for(const n of listHUDMessages())dismissHUDMessage(n.source,n.id);
});

test('startup prepares each injured world or synthetic actor once',()=>{
 const injured=setup(['Broken Leg']),synthetic=setup(['Collapsed Lung']),healthy=setup([]);
 synthetic.uuid='Scene.off.Token.n.Actor.synthetic';healthy.uuid='Actor.healthy';
 const prepared=[];
 for(const actor of [injured,synthetic,healthy])actor.prepareData=()=>prepared.push(actor.uuid);
 game.actors=[injured,healthy];game.scenes=[{tokens:[{actor:injured},{actor:injured},{actor:synthetic}]}];
 game.settings={register(){}};globalThis.CONFIG={Actor:{documentClass:class{applyActiveEffects(){}}}};
 globalThis.libWrapper={register(){}};
 const ready=[];globalThis.Hooks={on(){},once(name,fn){if(name==='ready')ready.push(fn);}};
 registerInjuryNotices();
 // The first ready listener initializes injuries. A separate listener imports Foundry's roll class.
 ready[0]();
 assert.deepEqual(prepared,[injured.uuid,synthetic.uuid]);
});
