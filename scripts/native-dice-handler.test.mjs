import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
import {installSelfOperationCapture,tagSelfOperation} from '../dist/scripts/self-chat-operation.js';
const registrations=installMockLibWrapper();
function capture(dice){installSelfOperationCapture({confirmDialog(){}},{handleRollDialog(){},roll(){}},dice,()=>false,{RenderRollCard(){}});}
const local='/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js';
const cdn='https://assets.forge-vtt.com/bazaar/systems/cyberpunk-red-core/v0.92.4/';
const handler=cdn+'modules/extern/cpr-dice-handler.js';
// Two separate module instances, matching the affected Forge client's identity check.
registerHooks({resolve(s,c,next){
  if([local,handler].includes(s))return {shortCircuit:true,url:'data:text/javascript,'+encodeURIComponent(`export default {handle3dDice:async (roll,mode)=>{globalThis.animations.push(roll);globalThis.lastDiceMode=mode}}; // ${s}`)};
  return next(s,c);
}});
const {nativeDiceHandlerURL}=await import('../dist/scripts/native-combat.js');
function environment(scripts=[],resources=[]){
  globalThis.document={querySelectorAll:()=>scripts.map(src=>({src}))};
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{getEntriesByType:()=>resources.map(name=>({name}))}});
}
test('running CPR script takes precedence over a second handler and survives timing eviction',()=>{
  environment([cdn+'cpr.js'],['https://example.test'+local,handler]);
  assert.equal(nativeDiceHandlerURL(),handler);
  environment([cdn+'cpr.js']);assert.equal(nativeDiceHandlerURL(),handler);
  environment(['https://example.test/systems/cyberpunk-red-core/cpr.js']);
  assert.equal(nativeDiceHandlerURL(),'https://example.test'+local);
});
test('resource fallback preserves exact URL and ignores unrelated packages',()=>{
  environment([],['https://example.test/modules/unrelated/cpr-dice-handler.js',handler+'?version=1']);
  assert.equal(nativeDiceHandlerURL(),handler+'?version=1');
  environment();assert.equal(nativeDiceHandlerURL(),local);
});
test('Forge suppresses the live CDN instance and replays once, leaving other rolls visible',async()=>{
  environment([cdn+'cpr.js']);globalThis.animations=[];
  const live=(await import(handler)).default;
  assert.notEqual(live,(await import(local)).default);
  capture(live);const shared=live.handle3dDice;Object.defineProperty(live,'handle3dDice',{writable:false});
  const {rollHidden,nativeAPI}=await import('../dist/scripts/native-combat.js?forge-test');
  await rollHidden({async roll(){this._roll={total:5};await live.handle3dDice(this._roll);this._critRoll={total:1};await live.handle3dDice(this._critRoll);}});
  assert.equal(animations.length,0);
  const {Dice}=await nativeAPI();assert.equal(Dice,live);
  assert.equal(Dice.handle3dDice,shared);
  const replay={total:5};tagSelfOperation(replay,'user');await Dice.handle3dDice(replay,'publicroll');assert.equal(lastDiceMode,'selfroll');
  assert.deepEqual(animations,[replay]);
  const unrelated={total:8};await live.handle3dDice(unrelated);
  assert.deepEqual(animations,[replay,unrelated]);
});
test('local fallback suppresses initial animation and permits replay',async()=>{
  environment();globalThis.animations=[];
  const live=(await import(local)).default;
  const {rollHidden,nativeAPI}=await import('../dist/scripts/native-combat.js?local-test');
  await rollHidden({async roll(){this._roll={total:6};await live.handle3dDice(this._roll);}});
  assert.equal(animations.length,0);
  const {Dice}=await nativeAPI();assert.equal(Dice,live);
  const shared=Dice.handle3dDice;Object.defineProperty(Dice,'handle3dDice',{writable:false});capture(Dice);assert.equal(Dice.handle3dDice,shared);
  const replay={total:6};tagSelfOperation(replay,'user');await Dice.handle3dDice(replay,'publicroll');assert.equal(lastDiceMode,'selfroll');assert.equal(animations.length,1);
  assert.equal(registrations.filter(call=>call.path.endsWith('.handle3dDice')).length,2);
});
