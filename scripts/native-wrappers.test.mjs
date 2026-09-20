import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerNativeWrapper} from '../dist/scripts/native-wrappers.js';
import {captureWithChat} from '../dist/scripts/damage-application.js';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
test('missing dependency blocks damage before any mutation, without replacing native methods',async()=>{
 delete globalThis.libWrapper;let applied=false;const chat={RenderDamageApplicationCard(){}};const original=chat.RenderDamageApplicationCard;
 await assert.rejects(captureWithChat(chat,{},'A','body','id',async()=>{applied=true;}),/requires libWrapper/);
 assert.equal(applied,false);assert.equal(chat.RenderDamageApplicationCard,original);
});
test('registration aliases the actual owner and preserves receiver, arguments and return values',()=>{
 const calls=installMockLibWrapper();const owner={value:2,run(n){return this.value+n;}};
 registerNativeWrapper(owner,'run',function(wrapped,n){return wrapped(n)*2;},'WRAPPER');
 assert.equal(owner.run(3),10);assert.equal(calls[0].module,'pneuma-combattools');
 assert.throws(()=>registerNativeWrapper(owner,'missing',()=>{},'MIXED'),/unavailable/);
});
