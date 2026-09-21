import assert from "node:assert/strict";
import {test} from "node:test";
import {hasInjury,evasionBlocked} from "../dist/scripts/injury-rules.js";
import {warnBrokenRibs,applyRibsDamage,installInjuryRollGuards,ribsContent,registerInjuryMechanics} from "../dist/scripts/injury-mechanics.js";
const M="pneuma-combattools",path=`flags.${M}.brokenRibs`;
const get=(o,p)=>p.split(".").reduce((v,k)=>v?.[k],o);
const set=(o,p,v)=>{const keys=p.split(".");for(const k of keys.slice(0,-1))o=o[k]??={};o[keys.at(-1)]=structuredClone(v);};
function fixture(){
 globalThis.foundry={utils:{getProperty:get,deepClone:structuredClone}};
 const users=[{id:"gm",active:true,isGM:true},{id:"owner",active:true},{id:"other",active:true}];users.get=id=>users.find(u=>u.id===id);
 const actor={uuid:"Actor.a",name:"A <name>",items:[],effects:[],flags:{},system:{derivedStats:{hp:{value:30}},armor:{sp:11}},testUserPermission:u=>u.id==="owner",updates:0,async update(data){this.updates++;for(const [k,v]of Object.entries(data))set(this,k,v);}};
 const combat={id:"c",started:true};const messages=[];messages.get=id=>messages.find(m=>m.id===id);
 globalThis.game={users,user:users[0],combats:new Map([["c",combat]]),messages,i18n:{localize:k=>k}};
 globalThis.ui={notifications:{warn(){},error(){}}};globalThis.fromUuid=async()=>actor;
 globalThis.ChatMessage={getSpeaker:()=>({}),async create(data){const message={...data,id:"m"+messages.length,async update(data){if(this.fail){this.fail=false;throw Error("card failure");}for(const [k,v]of Object.entries(data))set(this,k,v);}};messages.push(message);return message;}};
 const doc={uuid:"Scene.s.Token.t",name:actor.name,actor};const record={combat:"c",turn:"p:1",spent:3,onFoot:6};
 const ribs=()=>actor.items.push({type:"criticalInjury",name:"Broken Ribs"});
 const leg=()=>actor.items.push({type:"criticalInjury",name:"Dismembered Leg"});
 const cyber=()=>{const item={type:"cyberware",system:{type:"cyberLeg",isFoundational:true,isInstalledInActor:true},flags:{[M]:{empCombats:["c"]}}};actor.items.push(item);return item;};
 return {actor,doc,record,combat,messages,users,ribs,leg,cyber};
}
test("native injury sources, live markers, and installed disabled Cyberlegs block evasion",()=>{
 const f=fixture();assert.equal(evasionBlocked(f.actor),undefined);f.leg();assert.match(evasionBlocked(f.actor),/Dismembered Leg/);
 f.actor.items[0].name="Renamed";f.actor.items[0]._stats={compendiumSource:"Compendium.foo.vRhxMWgOHYROHeHm"};assert.equal(hasInjury(f.actor,"Dismembered Leg"),true);
 f.actor.items=[];f.actor.effects=[{statuses:new Set(["q9dsx9ocwnanvksd"]),disabled:true}];assert.equal(evasionBlocked(f.actor),undefined);
 f.actor.effects[0].disabled=false;assert.match(evasionBlocked(f.actor),/Dismembered/);f.actor.effects[0].system={isSuppressed:true};assert.equal(evasionBlocked(f.actor),undefined);
 f.actor.effects=[];const leg=f.cyber();assert.match(evasionBlocked(f.actor),/Cyberleg/);
 leg.system.isInstalledInActor=false;assert.equal(evasionBlocked(f.actor),undefined);leg.system.isInstalledInActor=true;f.combat.started=false;assert.equal(evasionBlocked(f.actor),undefined);
 leg.flags[M].itemMarkers={disabled:{label:"Disabled"}};assert.match(evasionBlocked(f.actor),/Cyberleg/);
 leg.system.type="cyberArm";assert.equal(evasionBlocked(f.actor),undefined);leg.system.type="cyberLeg";leg.system.isFoundational=false;assert.equal(evasionBlocked(f.actor),undefined);
});
test("threshold is strictly over 4; one owner-private card per turn, no automatic damage",async()=>{
 const f=fixture();await warnBrokenRibs(f.doc,f.record);assert.equal(f.messages.length,0);f.ribs();
 await warnBrokenRibs(f.doc,{...f.record,onFoot:4});assert.equal(f.messages.length,0);
 await Promise.all([warnBrokenRibs(f.doc,f.record),warnBrokenRibs(f.doc,{...f.record,onFoot:8})]);assert.equal(f.messages.length,1);
 assert.equal(f.actor.updates,0);assert.deepEqual(f.messages[0].whisper,["gm","owner"]);assert.match(f.messages[0].content,/A &lt;name&gt;/);
 await warnBrokenRibs(f.doc,{...f.record,turn:"p:2"});assert.equal(f.messages.length,2);
});
test("reset withdraws unpaid warning and recrossing reuses it; permissions and combat end enforced",async()=>{
 const f=fixture();f.ribs();await warnBrokenRibs(f.doc,f.record);const m=f.messages[0];
 await assert.rejects(applyRibsDamage(m.id,f.users[2]),/owner/);
 await warnBrokenRibs(f.doc,{...f.record,onFoot:0});assert.doesNotMatch(m.content,/data-ribs-apply/);await assert.rejects(applyRibsDamage(m.id,f.users[1]),/no longer/);
 await warnBrokenRibs(f.doc,f.record);assert.equal(f.messages.length,1);f.combat.started=false;await assert.rejects(applyRibsDamage(m.id,f.users[1]),/no longer/);assert.equal(f.actor.updates,0);
});
test("Apply bypasses armor exactly once, including concurrent clicks and failed card writes",async()=>{
 const f=fixture();f.ribs();await warnBrokenRibs(f.doc,f.record);const m=f.messages[0];m.fail=true;
 await assert.rejects(applyRibsDamage(m.id,f.users[1]),/card failure/);assert.equal(f.actor.system.derivedStats.hp.value,25);
 await Promise.all([applyRibsDamage(m.id,f.users[1]),applyRibsDamage(m.id,f.users[0])]);assert.equal(f.actor.updates,1);assert.equal(f.actor.system.armor.sp,11);assert.equal(get(m,path).applied,true);
 await warnBrokenRibs(f.doc,{...f.record,onFoot:0});assert.match(m.content,/5 damage applied/);
 await warnBrokenRibs(f.doc,{...f.record,turn:"p:2"});await applyRibsDamage(f.messages[1].id,f.users[1]);assert.equal(f.actor.system.derivedStats.hp.value,20);
});
test("native sheet, Ctrl-skip, and late injury guards leave other skills alone",async()=>{
 const f=fixture();globalThis.libWrapper={register(_module,path,fn){const keys=path.split(".");let owner=globalThis;for(const k of keys.slice(0,-1))owner=owner[k];const key=keys.at(-1),original=owner[key];owner[key]=function(...args){return fn.call(this,original.bind(this),...args);};}};
 class Roll {constructor(skillName){this.skillName=skillName;}async handleRollDialog(){return true;}async roll(){return "rolled";}}
 class Item {createRoll(_type,_actor,name){return new Roll(name);}}
 installInjuryRollGuards(Item.prototype,Roll.prototype);const item=new Item();const open=item.createRoll("skill",f.actor,"Evasion");
 f.leg();assert.throws(()=>item.createRoll("skill",f.actor,"Evasion"),/Cannot evade/);assert.throws(()=>open.roll(),/Cannot evade/);
 const direct=new Roll("Evasion");assert.equal(await direct.handleRollDialog({ctrlKey:true},f.actor),false);
 const concentration=item.createRoll("skill",f.actor,"Concentration");assert.equal(await concentration.roll(),"rolled");
 f.actor.items=[];assert.equal(await open.roll(),"rolled");
});
test("accepted movement hooks merge partial updates with committed records; non-GM creates nothing",async()=>{
 const f=fixture();f.ribs();const hooks={};globalThis.Hooks={on:(k,fn)=>hooks[k]=fn,once(){}};registerInjuryMechanics();
 set(f.doc,`flags.${M}.movement`,f.record);hooks.updateToken(f.doc,{flags:{[M]:{movement:{onFoot:6}}}});await warnBrokenRibs(f.doc,f.record);assert.equal(f.messages.length,1);
 game.user=f.users[1];await warnBrokenRibs(f.doc,{...f.record,turn:"p:3"});assert.equal(f.messages.length,1);
});

test("an old movement card cannot apply after its combat is reset",async()=>{
 const f=fixture();f.ribs();await warnBrokenRibs(f.doc,f.record);set(f.combat,`flags.${M}.evasionEpoch`,"reset");
 await assert.rejects(applyRibsDamage(f.messages[0].id,f.users[0]),/no longer/);assert.equal(f.actor.updates,0);
 await warnBrokenRibs(f.doc,f.record);assert.equal(f.messages.length,2);await applyRibsDamage(f.messages[1].id,f.users[0]);assert.equal(f.actor.updates,1);
});
