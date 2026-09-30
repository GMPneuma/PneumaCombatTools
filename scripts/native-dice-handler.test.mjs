import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const local='/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js';
const cdn='https://assets.forge-vtt.com/bazaar/systems/cyberpunk-red-core/v0.92.4/';
const handler=cdn+'modules/extern/cpr-dice-handler.js';
// Two separate module instances, matching the affected Forge client's identity check.
registerHooks({resolve(s,c,next){
  if([local,handler].includes(s))return {shortCircuit:true,url:'data:text/javascript,'+encodeURIComponent(`export default {handle3dDice:async roll=>globalThis.animations.push(roll)}; // ${s}`)};
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
  const {rollHidden,nativeAPI}=await import('../dist/scripts/native-combat.js?forge-test');
  await rollHidden({async roll(){this._roll={total:5};await live.handle3dDice(this._roll);this._critRoll={total:1};await live.handle3dDice(this._critRoll);}});
  assert.equal(animations.length,0);
  const {Dice}=await nativeAPI();assert.equal(Dice,live);
  const replay={total:5};await Dice.handle3dDice(replay);
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
  await Dice.handle3dDice({total:6});assert.equal(animations.length,1);
});
