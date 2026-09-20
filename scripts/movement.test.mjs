import assert from 'node:assert/strict';
import {test} from 'node:test';
import {recordStep} from '../dist/scripts/movement-rules.js';
const start=()=>({combat:'c',turn:'1',start:{x:0,y:0,elevation:0},spent:0});
test('left then up uses one collision test and counts one square when clear',()=>{
 let calls=0;let record=recordStep(start(),{x:0,y:0},{x:-100,y:0},100,()=>{throw Error('No check for first step');});
 record=recordStep(record,{x:-100,y:0},{x:-100,y:-100},100,(a,b)=>{calls++;assert.deepEqual(a,{x:0,y:0});assert.deepEqual(b,{x:-100,y:-100});return false;});
 assert.equal(record.spent,1);assert.equal(calls,1);
 record=recordStep(record,{x:-100,y:-100},{x:-200,y:-100},100,()=>{throw Error('Never reuse merged diagonal');});assert.equal(record.spent,2);
});
test('blocked shortcut counts two; retracing and long detours are not discounted',()=>{
 let record=recordStep(start(),{x:0,y:0},{x:100,y:0},100,()=>false);
 record=recordStep(record,{x:100,y:0},{x:100,y:100},100,()=>true);assert.equal(record.spent,2);
 record=recordStep(record,{x:100,y:100},{x:100,y:0},100,()=>false);assert.equal(record.spent,3);
 let long=recordStep(start(),{x:0,y:0},{x:300,y:0},100,()=>false);
 long=recordStep(long,{x:300,y:0},{x:300,y:300},100,()=>false);assert.equal(long.spent,6);
});
test('straight diagonals cost one per space; invalid and zero moves do not spend',()=>{
 assert.equal(recordStep(start(),{x:0,y:0},{x:400,y:400},100,()=>false).spent,4);
 const record=start();assert.equal(recordStep(record,{x:0,y:0},{x:0,y:0},100,()=>false),record);
 assert.throws(()=>recordStep(record,{x:0,y:0},{x:NaN,y:0},100,()=>false),/coordinates/);
});

// Exercise document hooks as well as the distance calculation.
globalThis.FormApplication=class {};
globalThis.Hooks={once(){},on(){}};
const {registerMovement,currentMovement,resetMovement}=await import('../dist/scripts/movement.js');
function fixture(){
 const hooks={};globalThis.Hooks={on:(name,fn)=>(hooks[name]??=[]).push(fn),once(){}};
 const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);globalThis.foundry={utils:{getProperty:get}};
 const scene={id:'scene',grid:{units:'m',distance:2},tokens:[],flags:{}};
 const doc={id:'t',uuid:'Scene.scene.Token.t',x:0,y:0,elevation:5,_source:{x:0,y:0,elevation:5},parent:scene,flags:{}};
 const token={document:doc,isOwner:true,getCenterPoint:p=>({x:p.x+50,y:p.y+50}),checkCollision:()=>false};doc.object=token;scene.tokens.push(doc);
 const participant={id:'p',tokenId:'t'};const combat={id:'c',scene,started:true,round:1,turn:0,combatants:[participant],turns:[participant]};
 globalThis.canvas={grid:{size:100,type:1},scene};globalThis.CONST={GRID_TYPES:{SQUARE:1}};
 globalThis.game={combat,combats:new Map([['c',combat]]),user:{id:'gm'},users:[{id:'gm',active:true,isGM:true}],settings:{register(){},get:()=>true}};
 registerMovement();
 function commit(changes,options={}){for(const fn of hooks.preUpdateToken)fn(doc,changes,options);for(const [key,value]of Object.entries(changes)){if(key==='flags.pneuma-combattools.movement')doc.flags={'pneuma-combattools':{movement:value}};else {doc[key]=value;if(key in doc._source)doc._source[key]=value;}}return options;}
 doc.update=async(changes,options)=>commit(changes,options);
 return {doc,token,combat,hooks,commit};
}
test('accepted updates atomically persist movement, signed AoE deltas, reset and turn rollover',async()=>{
 const f=fixture();assert.equal(f.commit({x:100}).pneumaMoveDelta,2);assert.equal(currentMovement(f.doc).spent,1);
 assert.equal(f.commit({y:100}).pneumaMoveDelta,0);assert.equal(currentMovement(f.doc).spent,1);
 let resetOptions;const original=f.doc.update;f.doc.update=async(data,options)=>{resetOptions=options;return original(data,options);};
 await resetMovement(f.token);assert.equal(f.doc.x,0);assert.equal(f.doc.y,0);assert.equal(f.doc.elevation,5);assert.equal(currentMovement(f.doc).spent,0);assert.equal(resetOptions.pneumaMoveDelta,-2);assert.equal(currentMovement(f.doc).hidden,true);
 f.commit({x:100});assert.equal(currentMovement(f.doc).hidden,false);
 f.commit({x:200});f.combat.round=2;assert.equal(currentMovement(f.doc),undefined);f.commit({x:300});assert.equal(currentMovement(f.doc).spent,1);assert.equal(currentMovement(f.doc).start.x,200);
 f.combat.started=false;assert.equal(currentMovement(f.doc),undefined);
});
test('cancelled update does not persist and evasion gets its own reset origin',()=>{
 const f=fixture(),changes={x:100};for(const fn of f.hooks.preUpdateToken)fn(f.doc,changes,{});assert.equal(currentMovement(f.doc),undefined);
 f.commit({x:100});f.commit({x:400},{pneumaAreaMove:true});assert.equal(currentMovement(f.doc).start.x,400);assert.equal(currentMovement(f.doc).spent,0);
});
test('rapid arrow moves use committed positions while prepared coordinates animate',async()=>{
 const f=fixture();
 assert.equal(f.commit({x:-100}).pneumaMoveDelta,2);
 f.doc.x=-23;f.doc.y=7;f.doc.elevation=2;
 assert.equal(f.commit({x:-200}).pneumaMoveDelta,2);
 assert.equal(currentMovement(f.doc).spent,2);
 assert.deepEqual(currentMovement(f.doc).last,{from:{x:-100,y:0},to:{x:-200,y:0},cost:1});
 f.doc.x=-141;f.doc.y=-12;
 assert.equal(f.commit({y:-100}).pneumaMoveDelta,0);
 assert.equal(currentMovement(f.doc).spent,2);
 f.doc.x=-160;f.doc.y=-40;
 const unchanged={x:-200};for(const fn of f.hooks.preUpdateToken)fn(f.doc,unchanged,{});
 assert.equal(unchanged['flags.pneuma-combattools.movement'],undefined);
 f.combat.round=2;
 f.commit({x:-300});
 assert.deepEqual(currentMovement(f.doc).start,{x:-200,y:-100,elevation:5});
 await resetMovement(f.token);
 assert.equal(f.doc.x,-200);assert.equal(f.doc.y,-100);assert.equal(f.doc.elevation,5);
 assert.equal(currentMovement(f.doc).spent,0);
});
