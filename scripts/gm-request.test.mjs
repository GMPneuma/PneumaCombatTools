import assert from 'node:assert/strict';
import {test} from 'node:test';
import {GMRequests} from '../dist/scripts/gm-request.js';

function fixture(){
 const gm={id:'gm',active:true,isGM:true},player={id:'player',active:true};
 globalThis.game={user:player,users:[gm,player]};
 const requests=new GMRequests(),timers=new Map();let serial=0;
 const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
 globalThis.setTimeout=(fn,delay)=>{const id=++serial;timers.set(id,{fn,delay});return id;};
 globalThis.clearTimeout=id=>timers.delete(id);
 return {gm,requests,timers,reply:(id='a',extra={})=>requests.reply({id,user:'player',gm:'gm',...extra},extra.value),restore(){globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}};
}
test('GM confirmation accepts only the matching recipient, request and elected authority; preserves grapple payloads',async()=>{
 const f=fixture();try{
  let emits=0,done=false;const pending=f.requests.request('a',()=>emits++,15000,'Check before retrying').then(value=>{done=true;return value;});
  f.reply('unknown');f.reply('a',{user:'other'});f.reply('a',{gm:'other'});await Promise.resolve();assert.equal(done,false);assert.equal(f.timers.size,1);
  f.reply('a',{value:'claim-123'});assert.equal(await pending,'claim-123');assert.equal(emits,1);assert.equal(f.timers.size,0);
  f.reply('a',{error:'Late error'});assert.equal(done,true);
 }finally{f.restore();}
});
test('GM rejection, synchronous socket failure and synchronous acknowledgement settle without abandoned timers',async()=>{
 const f=fixture();try{
  const denied=f.requests.request('a',()=>{},30000,'Unconfirmed');f.reply('a',{error:'Patient changed'});await assert.rejects(denied,/Patient changed/);
  await assert.rejects(f.requests.request('a',()=>{throw Error('Disconnected');},30000,'Unconfirmed'),/Disconnected/);
  assert.equal(await f.requests.request('a',()=>f.reply('a',{value:'ok'}),30000,'Unconfirmed'),'ok');assert.equal(f.timers.size,0);
 }finally{f.restore();}
});
test('timeouts do not cancel work or retry; late replies cannot resolve a different request',async()=>{
 const f=fixture();try{
  let emitted=0;const pending=f.requests.request('a',()=>emitted++,30000,'Not confirmed; check the patient before retrying');
  const rejection=assert.rejects(pending,/Not confirmed; check the patient/);
  const [id,timer]=[...f.timers][0];assert.equal(timer.delay,30000);f.timers.delete(id);timer.fn();await rejection;
  f.reply('a');assert.equal(emitted,1);
  const next=f.requests.request('b',()=>emitted++,30000,'Unconfirmed');f.reply('a');assert.equal(f.timers.size,1);f.reply('b');await next;assert.equal(emitted,2);
 }finally{f.restore();}
});
test('duplicate pending IDs cannot replace waiters, missing GM stops emission, GM change requires confirmation review',async()=>{
 const f=fixture();try{
  let emitted=0;const first=f.requests.request('a',()=>emitted++,30000,'GM changed; check the card');
  await assert.rejects(f.requests.request('a',()=>emitted++,30000,'Unconfirmed'),/already awaiting/);assert.equal(emitted,1);
  f.gm.active=false;game.users.push({id:'new',active:true,isGM:true});f.reply('a',{gm:'new'});f.reply('a');assert.equal(f.timers.size,1);
  const rejected=assert.rejects(first,/GM changed/);const [id,timer]=[...f.timers][0];f.timers.delete(id);timer.fn();await rejected;
  game.users=game.users.filter(user=>!user.isGM);await assert.rejects(f.requests.request('b',()=>emitted++,30000,'Unconfirmed'),/active GM/);assert.equal(emitted,1);
 }finally{f.restore();}
});
