import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerNativeWrapper} from '../dist/scripts/native-wrappers.js';
import {captureWithChat} from '../dist/scripts/damage-application.js';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
import {installInjuryRollGuards} from '../dist/scripts/injury-mechanics.js';
import {installNativeEffectIntegration} from '../dist/scripts/native-effect-integration.js';
test('missing dependency blocks damage before any mutation, without replacing native methods',async()=>{
 delete globalThis.libWrapper;let applied=false;const chat={RenderDamageApplicationCard(){}};const original=chat.RenderDamageApplicationCard;
 await assert.rejects(captureWithChat(chat,{},'A','body','id',async()=>{applied=true;}),/requires libWrapper/);
 assert.equal(applied,false);assert.equal(chat.RenderDamageApplicationCard,original);
});

test('strict libWrapper fixture rejects duplicate target registrations, including alias paths',()=>{
 installMockLibWrapper();const owner={run(){}};globalThis.wrapperAliasA=owner;globalThis.wrapperAliasB=owner;
 libWrapper.register('example','wrapperAliasA.run',wrapped=>wrapped(),'MIXED');
 assert.throws(()=>libWrapper.register('example','wrapperAliasB.run',wrapped=>wrapped(),'MIXED'),/already been registered/);
 delete globalThis.wrapperAliasA;delete globalThis.wrapperAliasB;
});

test('shared handlers register once, preserve WRAPPER priority and allow MIXED cancellation',()=>{
 const calls=installMockLibWrapper(),events=[];
 const owner={run(value){events.push('native');return value+this.extra;},extra:2};
 registerNativeWrapper(owner,'run',function(wrapped,n){events.push('observer');const result=wrapped(n);return typeof result==='number'?result*2:result;},'WRAPPER');
 registerNativeWrapper(owner,'run',function(wrapped,n){events.push('guard');return n<0?'blocked':wrapped(n+1);},'MIXED');
 assert.equal(calls.length,1);assert.equal(calls[0].type,'MIXED');
 assert.equal(owner.run(3),12);assert.deepEqual(events,['observer','guard','native']);
 events.length=0;assert.equal(owner.run(-1),'blocked');assert.deepEqual(events,['observer','guard']);
});

test('async handlers preserve receiver, arguments, rejection and independent overlapping calls',async()=>{
 const calls=installMockLibWrapper();const owner={base:4,async run(n){await Promise.resolve();if(n<0)throw Error('native failure');return this.base+n;}};
 const wrap=async function(wrapped,n){await Promise.resolve();return await wrapped(n+1)+this.base;};
 registerNativeWrapper(owner,'run',wrap,'WRAPPER');registerNativeWrapper(owner,'run',wrap,'WRAPPER');
 registerNativeWrapper(owner,'run',async function(wrapped,n){return await wrapped(n)*2;},'WRAPPER');
 assert.deepEqual(await Promise.all([owner.run(1),owner.run(2)]),[20,22]);assert.equal(calls.length,1);
 await assert.rejects(owner.run(-3),/native failure/);
});

test('failed registration can be retried without losing the handler',()=>{
 const calls=installMockLibWrapper(),register=libWrapper.register;const owner={run:()=>3};let fail=true;
 libWrapper.register=(...args)=>{if(fail){fail=false;throw Error('registration failed');}return register(...args);};
 const wrap=wrapped=>wrapped()+1;
 assert.throws(()=>registerNativeWrapper(owner,'run',wrap,'WRAPPER'),/registration failed/);
 registerNativeWrapper(owner,'run',wrap,'WRAPPER');assert.equal(owner.run(),4);assert.equal(calls.length,1);
});

test('native effect integration and managed damage capture share the damage-card method',async()=>{
 const calls=installMockLibWrapper();let nativeCards=0;
 const chat={RenderDamageApplicationCard(){nativeCards++;},RenderRollCard(){},damageApplication(){}};
 installNativeEffectIntegration(chat,{showDialog(){}},{_applyDamage(){}});
 const actor={};
 await assert.rejects(captureWithChat(chat,actor,'A','body','test',async view=>{
  await chat.RenderDamageApplicationCard({actor:view,hpReduction:3,rawDamageDealt:8});
  assert.equal(nativeCards,0,'Managed card capture still suppresses the duplicate native card');
  throw Error('stop before template rendering');
 }),/stop before template rendering/);
 assert.equal(calls.filter(call=>call.path.endsWith('.RenderDamageApplicationCard')).length,1);
 chat.RenderDamageApplicationCard({actor,hpReduction:3,rawDamageDealt:8});assert.equal(nativeCards,1,'Unmanaged native cards still render');
});

test('EMP guard and actual injury integration coexist on createRoll in either startup order',()=>{
 for(const injuryFirst of [false,true]){
  const calls=installMockLibWrapper();globalThis.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  globalThis.game={i18n:{localize:k=>k},combats:new Map()};globalThis.ui={notifications:{warn(){}}};
  class Roll {constructor(skillName){this.skillName=skillName;}async handleRollDialog(){return true;}roll(){return 12;}}
  class Item {createRoll(type,actor,skill){return new Roll(skill);}}
  const emp=()=>registerNativeWrapper(Item.prototype,'createRoll',function(wrapped,...args){if(this.disabled)throw Error('Item disabled by EMP');return wrapped(...args);},'MIXED');
  if(!injuryFirst)emp();installInjuryRollGuards(Item.prototype,Roll.prototype);if(injuryFirst)emp();
  assert.equal(calls.filter(c=>c.path.endsWith('.createRoll')).length,1);
  const actor={items:[],effects:[]},item=new Item();assert.equal(item.createRoll('skill',actor,'Evasion').roll(),12);
  actor.items.push({type:'criticalInjury',name:'Dismembered Leg'});assert.throws(()=>item.createRoll('skill',actor,'Evasion'),/Dismembered Leg/);
  actor.items=[];item.disabled=true;assert.throws(()=>item.createRoll('skill',actor,'Evasion'),/EMP/);
 }
});
test('registration aliases the actual owner and preserves receiver, arguments and return values',()=>{
 const calls=installMockLibWrapper();const owner={value:2,run(n){return this.value+n;}};
 registerNativeWrapper(owner,'run',function(wrapped,n){return wrapped(n)*2;},'WRAPPER');
 assert.equal(owner.run(3),10);assert.equal(calls[0].module,'pneuma-combattools');
 assert.throws(()=>registerNativeWrapper(owner,'missing',()=>{},'MIXED'),/unavailable/);
});
