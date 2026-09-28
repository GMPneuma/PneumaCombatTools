import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rollFavorites,toggleRollFavorite,rollFavorite} from '../dist/scripts/roll-favorites.js';
const skill=name=>({kind:'skill',name});
test('three personal favorites shared across skills and roles, serialized additions and removal',async()=>{
 const flags={};globalThis.foundry={utils:{getProperty:()=>flags.saved}};
 globalThis.game={user:{update:async changes=>{flags.saved=structuredClone(Object.values(changes)[0]);}}};
 const actor={isOwner:true,items:[...['A','B','C'].map(name=>({id:name,type:'skill',name})),{id:'tech',type:'role',system:{abilities:[{name:'Upgrade',hasRoll:true}]}}]};
 const role={kind:'roleAbility',subtype:'subRoleAbility',name:'Upgrade'};
 const results=await Promise.allSettled([skill('A'),role,skill('B'),skill('C')].map(f=>toggleRollFavorite(actor,f)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,3);assert.equal(rollFavorites().length,3);
 assert.ok(rollFavorites().every(f=>!('actor' in f)&&!('item' in f)));
 await toggleRollFavorite(actor,role);await toggleRollFavorite(actor,skill('C'));assert.deepEqual(rollFavorites().map(f=>f.name),['A','B','C']);
 const events=[];const other={isOwner:true,items:[{id:'different-id',type:'skill',name:'A'}],sheet:{_onRoll:async e=>events.push(e)}};
 globalThis.document={createElement:()=>({dataset:{}})};
 await rollFavorite(other,skill('A'),true);assert.equal(events[0].currentTarget.dataset.itemId,'different-id');assert.equal(events[0].ctrlKey,true);
 assert.deepEqual(rollFavorites().map(f=>f.name),['A','B','C']);
 other.isOwner=false;await assert.rejects(rollFavorite(other,skill('A')),/do not control/);
});

test('stale favorites can be removed without an actor and replaced within the three-slot limit',async()=>{
 const {removeRollFavorite}=await import('../dist/scripts/roll-favorites.js');
 let saved=[skill('Deleted'),skill('Renamed'),{kind:'roleAbility',subtype:'mainRoleAbility',name:'Removed roll'}];
 globalThis.foundry={utils:{getProperty:()=>saved}};globalThis.game={user:{update:async changes=>{saved=structuredClone(Object.values(changes)[0]);}}};
 const actor={isOwner:true,items:[{type:'skill',name:'New'}]};
 await removeRollFavorite(saved[0]);await toggleRollFavorite(actor,skill('New'));assert.equal(rollFavorites().length,3);
 await toggleRollFavorite(actor,skill('Renamed'));assert.equal(rollFavorites().length,2);
 const remaining=rollFavorites();await Promise.all(remaining.map(removeRollFavorite));assert.deepEqual(rollFavorites(),[]);
});
