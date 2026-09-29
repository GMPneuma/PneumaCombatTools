import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){
  if(s==='/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js')return {shortCircuit:true,url:'data:text/javascript,'+encodeURIComponent('export default {handle3dDice:(roll,mode)=>game.dice3d.showForRoll(roll,game.user,true,globalThis.audience,mode==="blindroll")}')};
  return next(s,c);
}});
import {nativeAPI,showDiceAs} from '../dist/scripts/native-combat.js';
function setup(){
  const gm={id:'gm'},attacker={id:'attacker'},defender={id:'defender'},calls=[],finish=[];
  globalThis.audience=['allowed-recipient'];
  globalThis.game={user:gm,users:new Map([gm,attacker,defender].map(u=>[u.id,u])),modules:new Map([['dice-so-nice',{active:true}]]),
    dice3d:{showForRoll:(...args)=>{calls.push(args);return new Promise(resolve=>finish.push(resolve));}}};
  globalThis.libWrapper={register:(_m,path,fn)=>{
    const keys=path.split('.'),method=keys.pop(),owner=keys.reduce((o,k)=>o[k],globalThis),original=owner[method];
    owner[method]=function(...args){return fn.call(this,original.bind(this),...args);};
  }};
  return {gm,attacker,defender,calls,finish};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('simultaneous replays use distinct roller styles and preserve all visibility arguments',async()=>{
  const c=setup(),attack={face:10},defense={face:7};
  await nativeAPI(); // Wait for module loading, whose microtask timing differs across Node versions.
  const pending=Promise.all([showDiceAs(attack,'roll','attacker'),showDiceAs(defense,'blindroll','defender')]);
  await flush();
  assert.deepEqual(c.calls,[[attack,c.attacker,true,audience,false],[defense,c.defender,true,audience,true]]);
  assert.equal(game.user,c.gm,'never change global user');
  c.finish.forEach(resolve=>resolve());await pending;
  const normal=game.dice3d.showForRoll(attack,c.gm,false,null,false);assert.equal(c.calls.at(-1)[1],c.gm,'roll mapping cleaned up');
  c.finish.at(-1)();await normal;
});
test('old cards, missing users, and GM rolls retain native fallback',async()=>{
  const c=setup();const pending=Promise.all([undefined,'deleted','gm'].map(id=>showDiceAs({},'selfroll',id)));
  await flush();assert.equal(c.calls.length,3);assert(c.calls.every(args=>args[1]===c.gm));
  c.finish.forEach(resolve=>resolve());await pending;
});
test('DSN inactive leaves native alternative dice integration unchanged',async()=>{
  const c=setup();game.modules.get('dice-so-nice').active=false;
  const pending=showDiceAs({},'roll','attacker');await flush();assert.equal(c.calls[0][1],c.gm);
  c.finish[0]();await pending;
});
