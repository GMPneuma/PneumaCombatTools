import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){
  if(s==='/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js')return {shortCircuit:true,url:'data:text/javascript,'+encodeURIComponent('export default {handle3dDice:(roll,mode)=>game.dice3d.showForRoll(roll,game.user,true,globalThis.audience,mode==="blindroll")}')};
  return next(s,c);
}});
import {nativeAPI,showDiceAs,messageDiceAudience} from '../dist/scripts/native-combat.js';
function setup(){
  const gm={id:'gm',isGM:true},attacker={id:'attacker'},defender={id:'defender'},calls=[],finish=[];
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

test('GM replay keeps player self-roll and GM-roll recipients while retaining dice style',async()=>{
  const c=setup();
  const pending=Promise.all([showDiceAs({},'selfroll','attacker'),showDiceAs({},'gmroll','defender')]);
  await flush();
  assert.deepEqual(c.calls.map(args=>[args[1].id,args[3],args[4]]),[['attacker',['attacker'],true],['defender',['gm','defender'],false]]);
  c.finish.forEach(resolve=>resolve());await pending;
});

test('exact card audiences override native modes independently and mappings are removed afterward',async()=>{
  const c=setup(),privateRoll={},publicRoll={};
  const pending=Promise.all([showDiceAs(privateRoll,'roll','attacker',{whisper:['gm','attacker'],blind:false}),
    showDiceAs(publicRoll,'blindroll','defender',{whisper:[],blind:false})]);
  await flush();
  assert.deepEqual(c.calls.map(args=>[args[1].id,args[3],args[4]]),[['attacker',['gm','attacker'],false],['defender',null,false]]);
  c.finish.forEach(resolve=>resolve());await pending;
  const normal=game.dice3d.showForRoll(privateRoll,c.gm,false,['ordinary'],true);
  assert.deepEqual(c.calls.at(-1),[privateRoll,c.gm,false,['ordinary'],true]);c.finish.at(-1)();await normal;
  assert.deepEqual(messageDiceAudience({whisper:['attacker',null,{id:'gm'}],blind:true}),{whisper:['attacker','gm'],blind:true});
});

test('private audience also applies to native alternative dice integration without changing its user',async()=>{
  const c=setup();game.modules.get('dice-so-nice').active=false;
  const pending=showDiceAs({},'roll','attacker',{whisper:['attacker'],blind:false});await flush();
  assert.equal(c.calls[0][1],c.gm);assert.deepEqual(c.calls[0][3],['attacker']);assert.equal(c.calls[0][4],true);
  c.finish[0]();await pending;
});

test('blind card dice synchronize only to GMs and animate locally only for an allowed GM',async()=>{
  const c=setup();
  let pending=showDiceAs({},'roll','attacker',{whisper:['gm','attacker'],blind:true});await flush();
  assert.deepEqual(c.calls[0].slice(3,5),[['gm'],false]);c.finish[0]();await pending;
  game.user=c.attacker;
  pending=showDiceAs({},'roll','attacker',{whisper:['gm','attacker'],blind:true});await flush();
  assert.deepEqual(c.calls[1].slice(3,5),[['gm'],true]);c.finish[1]();await pending;
});

test('public replay reaches every remote client; self replay reaches only its owner and hides on the GM sender',async()=>{
  const c=setup();
  const pending=Promise.all([showDiceAs({},'roll','attacker',{whisper:[],blind:false}),showDiceAs({},'selfroll','attacker')]);await flush();
  const remoteRecipients=args=>[c.attacker,c.defender].filter(user=>!args[3]||args[3].includes(user.id)).map(user=>user.id);
  assert.deepEqual(remoteRecipients(c.calls[0]),['attacker','defender']);assert.equal(c.calls[0][4],false);
  assert.deepEqual(remoteRecipients(c.calls[1]),['attacker']);assert.equal(c.calls[1][4],true);
  c.finish.forEach(resolve=>resolve());await pending;
});
