import test from 'node:test';
import assert from 'node:assert/strict';
import {PendingCardRefresh} from '../dist/scripts/pending-card-refresh.js';
import {quickhackLookup, quickhackId, availableQuickhacks} from '../dist/scripts/quickhack/availability.js';
import {drawCriticalInjury} from '../dist/scripts/critical-injury.js';

const property=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);

test('large pending history refreshes only the requested actor and does not overlap async renders',async()=>{
  const frames=[],finished=[],updated=[];
  globalThis.requestAnimationFrame=fn=>frames.push(fn);
  globalThis.game={user:{isGM:true}};
  globalThis.ui={chat:{element:{find:()=>({length:1})}}};
  let membershipChecks=0;
  const tracker=new PendingCardRefresh(message=>{
    updated.push(message.id);return new Promise(resolve=>finished.push(resolve));
  },message=>message.scope);
  for(let i=0;i<10000;i++) {
    const actors=['Actor.'+i];
    actors.includes=function(value){membershipChecks++;return Array.prototype.includes.call(this,value);};
    tracker.remember({id:String(i),visible:true,scope:{actors,combat:'combat'}});
  }
  const flush=()=>{const callbacks=frames.splice(0);for(const callback of callbacks)callback();};
  for(let i=0;i<20;i++)tracker.refresh('Actor.1');
  assert.equal(frames.length,1);flush();
  assert.deepEqual(updated,['1']);assert.equal(membershipChecks,0,'unrelated card scopes are not traversed');
  tracker.refresh('Actor.1');flush();assert.deepEqual(updated,['1'],'one outstanding render per card');
  finished.shift()();await new Promise(resolve=>setImmediate(resolve));flush();
  assert.deepEqual(updated,['1','1'],'changes during a render get one trailing refresh');
  tracker.forget('1');finished.shift()();await new Promise(resolve=>setImmediate(resolve));
  tracker.refresh('Actor.1');assert.equal(frames.length,0);
});

test('quickhack inventory matching uses one catalog snapshot and notices later setting edits',()=>{
  let reads=0;
  const saved=Array.from({length:50},(_,i)=>({id:'custom-'+i,name:'Custom '+i,dv:10,description:''}));
  globalThis.game={settings:{get:()=>{reads++;return saved;}}};
  const lookup=quickhackLookup();
  const programs=Array.from({length:120},(_,i)=>({id:String(i),type:'program',name:'Custom '+(i%50),system:{}}));
  assert.equal(availableQuickhacks(programs,'owned',true,lookup).length,50);
  for(const item of programs)assert.match(quickhackId(item,lookup),/^custom-/);
  assert.equal(reads,1);
  saved[0].name='Renamed';
  assert.equal(quickhackId({...programs[0],name:'Renamed'}),'custom-0');
  assert.equal(quickhackId(programs[0]),undefined);
});

test('duplicate injury draws reuse loaded documents and yield without changing native results',async()=>{
  let draws=0,lookups=0,timerRan=false;
  const table={results:{contents:[{text:'Owned'},{text:'New'}]},draw:async()=>{
    draws++;return {results:[{text:draws<=40?'Owned':'New'}],roll:{total:7}};
  }};
  setTimeout(()=>{timerRan=true;},0);
  const result=await drawCriticalInjury(table,async name=>{lookups++;return {name,type:'criticalInjury'};},name=>name==='Owned','reroll');
  assert.equal(draws,41);assert.equal(lookups,2);assert.equal(result.item.name,'New');assert.equal(result.result.roll.total,7);
  assert.equal(timerRan,true,'long rerolls allow rendering/input timers to run');
  await assert.rejects(drawCriticalInjury({...table,draw:async()=>({results:[]})},async()=>{},()=>false,'reroll'),/one injury/);
});

test('grenade toolbar processes individual changed templates without rescanning the collection',async()=>{
  globalThis.FormApplication=class{};
  globalThis.foundry={utils:{getProperty:property}};
  const hooks={},templates=Array.from({length:100},(_,i)=>({id:String(i),hidden:false,flags:{'pneuma-combattools':{grenadeCombat:'combat'}}}));
  let scans=0;
  templates.filter=function(fn){scans++;return Array.prototype.filter.call(this,fn);};
  const scene={templates};for(const template of templates)template.parent=scene;
  globalThis.canvas={scene};globalThis.game={user:{isGM:true}};
  globalThis.Hooks={on:(name,fn)=>hooks[name]=fn,once(){}};
  const controls=[{name:'token',tools:[]}];globalThis.ui={controls:{controls,render(){}}};
  const {registerFootprintControl}=await import('../dist/scripts/aoe/footprint-control.js');
  registerFootprintControl(async()=>{},assert.fail);hooks.getSceneControlButtons(controls);
  assert.equal(scans,1);
  for(const template of templates){template.hidden=true;hooks.updateMeasuredTemplate(template);}
  assert.equal(scans,1);assert.equal(controls[0].tools[0].visible,false);
  templates[0].hidden=false;hooks.updateMeasuredTemplate(templates[0]);assert.equal(controls[0].tools[0].visible,true);
  hooks.deleteMeasuredTemplate(templates[0]);assert.equal(controls[0].tools[0].visible,false);
});
