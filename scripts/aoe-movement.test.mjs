import assert from "node:assert/strict";
import {test} from "node:test";
globalThis.FormApplication=class{};globalThis.Hooks={once(){}};
const {chargeMovement,movementEntry,moveEvader,registerAreaMovement,movementWork}=await import("../dist/scripts/aoe/movement.js");
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function fixture(){
 globalThis.foundry={utils:{getProperty:get}};const flags={};
 const actor={uuid:"a",system:{derivedStats:{walk:{value:12}}}};
 const document={uuid:"t",actor,flags:{},async update(data){Object.assign(this.flags,{'pneuma-combattools':{aoeEscape:data['flags.pneuma-combattools.aoeEscape']}});token.center={x:data.x+50,y:data.y+50}}};
 const participant={id:"c",actor,token:document,flags,async update(data){flags['pneuma-combattools']={aoeMovement:structuredClone(data['flags.pneuma-combattools.aoeMovement'])}}};
 const token={document,w:100,h:100,center:{x:50,y:50}};document.object=token;
 const combat={started:true,round:1,turn:0,turns:[participant],combatants:[participant],combatant:participant};
 globalThis.game={user:{id:"gm"},users:[{id:"gm",active:true,isGM:true}],combat,settings:{get:()=>({evadeMove:true})}};
 globalThis.canvas={scene:{grid:{units:"m"}},grid:{measurePath:([a,b])=>({distance:Math.hypot(b.x-a.x,b.y-a.y)/50})}};
 return {token,participant,combat};
}
test("movement shortfall is optional and cannot exceed next-turn budget",()=>{
 assert.throws(()=>chargeMovement(3,0,12,5,false),/Insufficient/);
 assert.deepEqual(chargeMovement(3,0,12,5,true),{spent:3,debt:2});
 assert.throws(()=>chargeMovement(0,10,12,3,true),/next turn/);
});
test("evasion cost is recorded once and debt reduces the next turn",async()=>{
 const f=fixture();await f.participant.update({'flags.pneuma-combattools.aoeMovement':{turn:"1",spent:10,debt:0}});
 await moveEvader(f.token,{x:250,y:50},true,true,"escape");
 assert.equal(movementEntry(f.token.document).remaining,0);assert.equal(movementEntry(f.token.document).current.debt,2);
 await moveEvader(f.token,{x:250,y:50},true,true,"escape");assert.equal(movementEntry(f.token.document).current.debt,2);
 f.combat.round=2;assert.equal(movementEntry(f.token.document).remaining,10);
 await f.participant.update({'flags.pneuma-combattools.aoeMovement':movementEntry(f.token.document).current});
 f.combat.round=3;assert.equal(movementEntry(f.token.document).remaining,12);
});
test("RAW relocation costs nothing; homebrew requires combat",async()=>{
 const f=fixture();game.combat=null;
 await moveEvader(f.token,{x:1050,y:50},false,false,"raw");
 await assert.rejects(moveEvader(f.token,{x:1150,y:50},true,false,"cost"),/combat/);
});
test("player-originated token movement reaches GM accounting",async()=>{
 const f=fixture(),hooks={};globalThis.Hooks={on:(key,fn)=>hooks[key]=fn};registerAreaMovement();
 game.user={id:"player"};const options={};hooks.preUpdateToken(f.token.document,{x:150},options);
 assert.deepEqual(options.pneumaAreaFrom,{x:50,y:50});f.token.center={x:200,y:50};game.user={id:"gm"};hooks.updateToken(f.token.document,{x:150},options);
 await movementWork(async()=>{});assert.equal(movementEntry(f.token.document).remaining,9);
});

test("interrupted token move reuses its reserved MOVE charge",async()=>{
 const f=fixture(),update=f.token.document.update;let fail=true;
 f.token.document.update=async function(data){if(fail){fail=false;throw Error("write failed")}return update.call(this,data)};
 await assert.rejects(moveEvader(f.token,{x:250,y:50},true,false,"retry"),/write failed/);
 assert.equal(movementEntry(f.token.document).remaining,8);
 await moveEvader(f.token,{x:250,y:50},true,false,"retry");assert.equal(movementEntry(f.token.document).remaining,8);
});
