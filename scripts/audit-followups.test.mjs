import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {spendBonusLuck} from '../dist/scripts/native-combat.js';
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function fixture(file,extra={}) {
 const ctx={console,Map,Set,Promise,...extra};vm.createContext(ctx);
 vm.runInContext(readFileSync('dist/scripts/'+file+'.js','utf8').replace(/^import .*;\s*$/gm,'').replace(/^export \{.*\}.*;\s*$/gm,'').replace(/^export /gm,''),ctx);
 return ctx;
}
test('Slow saves its penalty before optional dice playback; rejection or pending playback does not block it',async()=>{
 for(const failing of [true,false]){
  const saved=[],warnings=[],audience={whisper:['gm','owner'],blind:false};let shown=0;
  const actor={effects:[],createEmbeddedDocuments:async(_type,rows)=>saved.push(...rows)};
  const ctx=fixture('quickhack/conditions',{console:{warn:()=>warnings.push(true)},game:{user:{id:'owner'}},
   foundry:{utils:{getProperty:get}},CONST:{ACTIVE_EFFECT_MODES:{ADD:2}},effectDuration:()=>({seconds:60}),penaltyFlags:()=>({}),
   Roll:class{total=4;async evaluate(){return this;}},
   showDiceAs:async(roll,mode,user,recipients)=>{shown++;assert.equal(saved.length,1);assert.equal(roll.total,4);assert.equal(mode,'gmroll');assert.equal(user,'owner');assert.equal(recipients,audience);if(failing)throw Error('DSN failure');await new Promise(()=>{});}
  });
  assert.equal(await ctx.applyQuickhackCondition(actor,'slow','gmroll',null,audience),4);
  assert.equal(saved[0].changes[0].value,'-4');assert.equal(shown,1);assert.equal(warnings.length,failing?1:0);
 }
});
test('simultaneous LUCK spends read the latest balance; insufficient balance rejects without a lost deduction',async()=>{
 globalThis.foundry={utils:{getProperty:get}};
 for(const initial of [2,1]){
  const writes=[];const actor={uuid:'Actor.luck',system:{stats:{luck:{value:initial}}},async update(change){await new Promise(resolve=>setImmediate(resolve));writes.push(change);this.system.stats.luck.value=change['system.stats.luck.value'];}};
  const results=await Promise.allSettled([spendBonusLuck(actor,1),spendBonusLuck(actor,1)]);
  assert.equal(actor.system.stats.luck.value,0);assert.equal(writes.length,initial);
  assert.equal(results.filter(r=>r.status==='rejected').length,2-initial);
 }
});
test('a failed LUCK write releases the actor queue for a later retry',async()=>{
 globalThis.foundry={utils:{getProperty:get}};let fail=true;
 const actor={uuid:'Actor.luck-failure',system:{stats:{luck:{value:2}}},async update(change){if(fail){fail=false;throw Error('write failed');}this.system.stats.luck.value=change['system.stats.luck.value'];}};
 await assert.rejects(spendBonusLuck(actor,1),/write failed/);await spendBonusLuck(actor,1);assert.equal(actor.system.stats.luck.value,1);
});
test('completed fire cards do not subscribe to condition refresh; sleep keeps its Wake refresh',()=>{
 let scope;const ctx=fixture('instant-effects',{registerConditionCardRefresh:fn=>scope=fn,registerEffectEvents(){},registerFlashbangEvents(){},getFlashbangState(){},getTearGasState(){},game:{modules:new Map([["pneuma-combattools",{}]])},registerInstantLifetimes(){},Hooks:{on(){},once(){}},foundry:{utils:{getProperty:get}}});
 ctx.registerInstantEffects();const fire={id:'incendiary',state:'applied',actor:'Actor.a'},sleep={...fire,id:'sleep'};
 for(const data of [{instant:{effect:fire}},{attachedEffects:{a:{effect:fire}}},{aoe:{rows:[{instant:fire}]}}])assert.equal(scope({flags:{'pneuma-combattools':data}}),undefined);
 const tracked=scope({flags:{'pneuma-combattools':{attachedEffects:{a:{effect:fire},b:{effect:sleep}}}}});assert.deepEqual([...tracked.actors],['Actor.a']);
});
