import assert from 'node:assert/strict';
import {test} from 'node:test';
import {advanceBarTurn,requestEndTurn,registerBarTurns} from '../dist/scripts/combat-bar-turn.js';
function fixture(){
 const gm={id:'gm',active:true,isGM:true},player={id:'p',active:true,isGM:false},other={id:'other',active:true,isGM:false};
 const users=Object.assign([gm,player,other],{get(id){return this.find(user=>user.id===id);}});
 const combat={id:'c',active:true,started:true,round:1,turn:0,combatant:{id:'a',actor:{testUserPermission:user=>user===player}},async nextTurn(){this.turn++;this.advances++;},advances:0};
 const hooks={},sent=[];let handler;
 globalThis.Hooks={once:(name,fn)=>hooks[name]=fn};globalThis.foundry={utils:{randomID:()=>String(Math.random())}};
 globalThis.game={user:gm,users,combats:new Map([['c',combat]]),socket:{on:(_name,fn)=>handler=fn,emit:(_name,packet)=>sent.push(packet)},modules:new Map()};
 registerBarTurns();hooks.ready();
 const request={barTurn:'request',id:'req',user:'p',combat:'c',round:1,turn:0,combatant:'a'};
 return {gm,player,other,combat,request,sent,receive:packet=>handler(packet)};
}
test('GM advances only the exact current turn for its owner',async()=>{
 const f=fixture();await advanceBarTurn(f.request);assert.equal(f.combat.advances,1);
 await assert.rejects(advanceBarTurn(f.request),/already changed/);assert.equal(f.combat.advances,1);
 f.combat.turn=0;await assert.rejects(advanceBarTurn({...f.request,user:'other'}),/owner/);
 f.combat.active=false;await assert.rejects(advanceBarTurn(f.request),/no longer active/);
});
test('simultaneous GM-routed requests cannot advance two turns',async()=>{
 const f=fixture();f.receive(f.request);f.receive({...f.request,id:'req2'});
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(f.combat.advances,1);
 assert.equal(f.sent.length,2);assert.equal(f.sent[0].error,undefined);assert.match(f.sent[1].error,/already changed/);
});
test('player request waits for GM acknowledgement; missing GM reports an error',async()=>{
 const f=fixture();game.user=f.player;const done=requestEndTurn(f.combat);
 assert.equal(f.sent[0].barTurn,'request');assert.equal(f.combat.advances,0);
 f.receive({barTurn:'result',id:f.sent[0].id,user:'p',gm:'gm'});await done;
 f.gm.active=false;await assert.rejects(requestEndTurn(f.combat),/active GM/);
});
