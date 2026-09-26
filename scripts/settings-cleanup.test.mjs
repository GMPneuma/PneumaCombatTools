import assert from 'node:assert/strict';
import {test} from 'node:test';
globalThis.FormApplication=class{};globalThis.foundry={data:{fields:{ObjectField:class{}}}};
const {registerQuickhackSettings}=await import('../dist/scripts/quickhack/settings.js');
test('QuickHack Configure includes and saves rules mode alongside routing, while main settings keep only enable',async()=>{
 const settings=new Map(),values=new Map(),menus=new Map(),writes=[];
 globalThis.game={user:{isGM:true},settings:{register:(_m,k,c)=>{settings.set(k,c);values.set(k,c.default)},registerMenu:(_m,k,c)=>menus.set(k,c),get:(_m,k)=>values.get(k),set:async(_m,k,v)=>{values.set(k,v);writes.push(k)}}};
 registerQuickhackSettings(()=>{});assert.equal(settings.get('quickhackMode').config,false);assert.equal(settings.get('quickhackEnabled').config,true);
 const form=new (menus.get('quickhackMessages').type)();assert.equal(form.getData().mode,'raw');
 const data=Object.fromEntries(form.getData().groups.flatMap(g=>g.rows.map(r=>[r.key,r.value])));await form._updateObject({}, {...data,mode:'loaded'});
 assert.equal(values.get('quickhackMode'),'loaded');assert.deepEqual(writes,['quickhackMode','quickhackRouting']);
 game.user.isGM=false;await form._updateObject({}, {...data,mode:'raw'});assert.equal(values.get('quickhackMode'),'loaded');
});

