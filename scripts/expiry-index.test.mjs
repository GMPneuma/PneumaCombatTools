import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerExpiryIndex} from '../dist/scripts/expiry-index.js';

test('expiry checks visit changed actors and follow off-scene token rebinding',()=>{
  const hooks=new Map(), visits=[];
  globalThis.Hooks={on:(name,fn)=>hooks.set(name,fn),once:(name,fn)=>hooks.set(name,fn)};
  globalThis.Actor=class {constructor(uuid){this.uuid=uuid;this.id=uuid;}};
  const base=new Actor('base'),untimed=new Actor('untimed'),offScene=new Actor('token-actor');
  const token={actorId:base.id,actor:offScene,actorLink:false};
  Object.assign(offScene,{timed:true,isToken:true,token});
  globalThis.game={actors:[base,untimed],scenes:[{tokens:[token]}]};
  const candidates=registerExpiryIndex(actor=>{visits.push(actor.uuid);return !!actor.timed;});
  hooks.get('ready')();
  game.actors=game.scenes={*[Symbol.iterator](){throw Error('Repeated world scan');}};
  visits.length=0;
  assert.deepEqual(candidates(),[offScene]);assert.deepEqual(visits,[]);
  untimed.timed=true;
  hooks.get('createItem')({parent:untimed});
  assert.deepEqual(new Set(candidates()),new Set([offScene,untimed]));
  assert.deepEqual(visits,['untimed']);
  // An inherited item edit can replace the synthetic document without changing its UUID.
  const replacement=Object.assign(new Actor(offScene.uuid),{timed:true,isToken:true,token});
  token.actor=replacement;hooks.get('updateItem')({parent:base});
  assert(candidates().includes(replacement));assert(!candidates().includes(offScene));
  token.actorLink=true;token.actor=base;hooks.get('updateToken')(token,{actorLink:true});
  assert.deepEqual(candidates(),[untimed]);
  hooks.get('deleteActor')(untimed);assert.deepEqual(candidates(),[]);
});
