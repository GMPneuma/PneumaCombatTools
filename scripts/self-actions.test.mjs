import {test} from 'node:test';import assert from 'node:assert/strict';
globalThis.Hooks={once(){},on(){}};globalThis.FormApplication=class{};
globalThis.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
const {hasMartialArts,performSelfAction}=await import('../dist/scripts/self-actions.js');
test('MA Recovery uses trained Martial Art, beats DV13 strictly, and stands up on either completed result',async()=>{
 for(const total of [13,14]){
  const removed=[],messages=[],events=[];const roll={luck:0,resultTotal:total,roll:async()=>{},wasCritical:()=>false,handleRollDialog:async event=>{events.push(event);return true;}};
  const skill={type:'skill',name:'Custom Style',system:{skillType:'martialArt',level:1},createRoll:()=>roll,confirmRoll:async r=>r};
  const actor={uuid:'actor',isOwner:true,system:{stats:{luck:{value:0}}},items:[skill],effects:[{statuses:new Set(['prone'])}],toggleStatusEffect:async(id,options)=>removed.push([id,options.active])};
  globalThis.game={settings:{get:()=> 'roll'}};globalThis.renderTemplate=async()=>'<div>Native roll</div>';
  globalThis.ChatMessage={getSpeaker:()=>({}),applyRollMode(){},create:async data=>messages.push(data)};
  await performSelfAction(actor,'recovery',undefined,true);
  assert.ok(removed.some(([id,active])=>id==='prone'&&!active));assert.equal(events[0].ctrlKey,true);
  assert.match(messages[0].content,total===14?/without spending an Action/:/using your Action/);
  removed.length=0;roll.handleRollDialog=async()=>false;await performSelfAction(actor,'recovery');assert.equal(removed.length,0);assert.equal(messages.length,1);
  skill.system.level=0;await assert.rejects(performSelfAction(actor,'recovery'),/Martial Art/);
  skill.system.level=1;actor.isOwner=false;await assert.rejects(performSelfAction(actor,'recovery'),/do not control/);
  skill.system.skillType='generic';assert.equal(hasMartialArts(actor),false);
 }
});

test('MA Recovery appears only while prone with a trained martial art',async()=>{const {selfActions}=await import('../dist/scripts/self-actions.js');globalThis.game={settings:{get:()=>false}};const actor={items:[{type:'skill',system:{skillType:'martialArt',level:1}}],effects:[]};assert.equal(selfActions(actor).some(a=>a.action==='recovery'),false);actor.effects.push({statuses:new Set(['prone'])});assert.equal(selfActions(actor).some(a=>a.action==='recovery'),true);actor.items[0].system.level=0;assert.equal(selfActions(actor).some(a=>a.action==='recovery'),false);});
