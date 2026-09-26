import assert from 'node:assert/strict';
import {test} from 'node:test';
import {suppressionExpiry,expireSuppression} from '../dist/scripts/suppression.js';
const M='pneuma-combattools';
function fixture(turn=0){
 const gm={id:'gm',isGM:true,active:true};
 const actor={uuid:'Actor.target',effects:[],async deleteEmbeddedDocuments(_type,ids){this.effects=this.effects.filter(e=>!ids.includes(e.id));}};
 const turns=['a','b','c'].map(id=>({id,token:{uuid:'Token.'+id}}));
 const combat={id:'combat',started:true,round:1,turn,turns};
 globalThis.game={users:[gm],user:gm,actors:[actor],scenes:[],combats:new Map([['combat',combat]]),combat:{round:99,turn:99}};
 globalThis.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
 const add=(id,token)=>actor.effects.push({id,flags:{[M]:{suppressionExpiry:suppressionExpiry(combat,token)}}});
 return {actor,combat,add};
}
test('suppression survives the next turn and expires only after it ends in its originating encounter',async()=>{
 const f=fixture();f.add('one','Token.b');assert.equal(f.actor.effects[0].flags[M].suppressionExpiry.round,1);
 await expireSuppression();assert.equal(f.actor.effects.length,1);
 f.combat.turn=1;await expireSuppression();assert.equal(f.actor.effects.length,1);
 f.combat.turn=2;await expireSuppression();assert.equal(f.actor.effects.length,0);
});
test('a current or already-finished target turn expires after next round, including last-token wrap',async()=>{
 for(const initial of [1,2]){
  const f=fixture(initial);f.add('one','Token.b');assert.equal(f.actor.effects[0].flags[M].suppressionExpiry.round,2);
  f.combat.turn=2;await expireSuppression();assert.equal(f.actor.effects.length,1);
  f.combat.round=2;f.combat.turn=1;await expireSuppression();assert.equal(f.actor.effects.length,1);
  f.combat.turn=2;await expireSuppression();assert.equal(f.actor.effects.length,0);
 }
 const f=fixture();f.add('last','Token.c');f.combat.round=2;f.combat.turn=0;await expireSuppression();assert.equal(f.actor.effects.length,0);
});
test('overlapping suppression, reset/deletion, removed combatants and GM authority preserve unrelated effects',async()=>{
 const f=fixture();f.add('one','Token.b');f.actor.effects.push({id:'unrelated',flags:{}});
 f.combat.turn=1;f.add('later','Token.b');f.combat.turn=2;await expireSuppression();assert.deepEqual(f.actor.effects.map(e=>e.id),['unrelated','later']);
 game.user={id:'player'};f.combat.started=false;await expireSuppression();assert.equal(f.actor.effects.length,2);
 game.user=game.users[0];await expireSuppression();assert.deepEqual(f.actor.effects.map(e=>e.id),['unrelated']);
 f.combat.started=true;f.add('removed','Token.b');f.combat.turns=f.combat.turns.filter(c=>c.id!=='b');await expireSuppression();assert.equal(f.actor.effects.length,1);
 f.add('deleted','Token.a');game.combats.clear();await expireSuppression();assert.equal(f.actor.effects.length,1);
 assert.equal(suppressionExpiry(undefined,'Token.a'),undefined);
});
