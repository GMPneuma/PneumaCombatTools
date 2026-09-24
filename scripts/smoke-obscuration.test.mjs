import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lineCrossesSmokeCell,attackCrossesSmoke} from '../dist/scripts/aoe/smoke-obscuration.js';
import {smokeAttackDialog} from '../dist/scripts/native-combat.js';
const cell=[10,10,20,10,20,20,10,20],p=(x,y)=>({x,y});
test('smoke intersects crossing attacks and either endpoint, but not clear lines or corner grazes',()=>{
 for(const [a,b] of [[p(0,15),p(30,15)],[p(15,15),p(30,15)],[p(0,15),p(15,15)],[p(15,15),p(15,15)]])assert(lineCrossesSmokeCell(a,b,cell));
 for(const [a,b] of [[p(0,0),p(30,0)],[p(0,20),p(20,0)],[p(0,15),p(5,15)]])assert(!lineCrossesSmokeCell(a,b,cell));
});
test('only active scene smoke counts, including gridless polygons and overlapping clouds',()=>{
 globalThis.foundry={utils:{getProperty:(o,path)=>path.split('.').reduce((v,k)=>v?.[k],o)}};
 globalThis.game={time:{worldTime:100},combats:new Map()};
 const template=data=>({flags:{'pneuma-combattools':{smoke:data}}});
 const active={cells:[cell],expires:160};const scene={templates:[template(active),template(active)]};
 assert(attackCrossesSmoke(p(0,15),p(30,15),scene));
 assert(!attackCrossesSmoke(p(0,15),p(30,15),{templates:[template({...active,expires:99}),{flags:{}}]}));
 assert(!attackCrossesSmoke(p(0,15),p(30,15),null));
 scene.templates[0].flags['pneuma-combattools'].smoke={cells:[[10,10,20,15,10,20]],expires:160};
 assert(attackCrossesSmoke(p(0,15),p(30,15),scene));
});
test('native smoke modifier applies once, preserves other modifiers and forces a review dialog',async()=>{
 const roll={mods:[{id:'other',value:2,source:'Other'}],addMod(mods){this.mods.push(...mods)},async handleRollDialog(event){this.event=event;return true}};
 assert(await smokeAttackDialog(roll,{}, {},{ctrlKey:true},true));
 await smokeAttackDialog(roll,{}, {},{},true);
 assert.deepEqual(roll.mods.map(m=>m.value),[2,-4]);assert.equal(roll.event.ctrlKey,false);
 const clear={...roll,mods:[]};await smokeAttackDialog(clear,{}, {},{ctrlKey:true},false);
 assert.deepEqual(clear.mods,[]);assert.equal(clear.event.ctrlKey,true);
});
