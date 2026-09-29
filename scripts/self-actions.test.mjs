import {test} from 'node:test';import assert from 'node:assert/strict';
globalThis.Hooks={once(){},on(){}};globalThis.FormApplication=class{};
globalThis.CONFIG={statusEffects:[{id:'prone'}]};
globalThis.foundry={utils:{randomID:()=>crypto.randomUUID(),getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
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

test('prone characters without trained MA get Get Up, which clears Prone and reports once',async()=>{
 const {selfActions}=await import('../dist/scripts/self-actions.js');
 const messages=[],modes=[];
 globalThis.game={settings:{get:()=> 'gmroll'}};
 globalThis.ChatMessage={getSpeaker:({actor})=>({alias:actor.name}),applyRollMode:(data,mode)=>modes.push(mode),create:async data=>messages.push(data)};
 const actor={uuid:'get-up',name:'A & B',isOwner:true,items:[],effects:[],toggleStatusEffect:async(id,{active})=>{
   assert.equal(active,false);actor.effects=actor.effects.filter(effect=>!effect.statuses.has(id));
 }};
 assert.equal(selfActions(actor).some(a=>a.action==='getUp'),false);
 actor.effects=[{statuses:new Set(['prone'])}];
 assert.deepEqual(selfActions(actor).map(a=>a.label),['Get Up']);
 actor.items=[{type:'skill',system:{skillType:'martialArt',level:0}}];
 assert.deepEqual(selfActions(actor).map(a=>a.label),['Get Up']);
 actor.items[0].system.level=1;
 assert.deepEqual(selfActions(actor).map(a=>a.label),['MA Recovery']);
 actor.items=[];
 actor.isOwner=false;await assert.rejects(performSelfAction(actor,'getUp'),/do not control/);assert.equal(messages.length,0);
 actor.isOwner=true;
 await Promise.all([performSelfAction(actor,'getUp'),performSelfAction(actor,'getUp')]);
 assert.equal(actor.effects.length,0);assert.equal(messages.length,1);
 assert.match(messages[0].content,/A &amp; B gets up using their Action/);
 assert.equal(messages[0].speaker.alias,actor.name);assert.deepEqual(modes,['gmroll']);
 assert.equal(selfActions(actor).some(a=>a.action==='getUp'),false);
 await performSelfAction(actor,'getUp');assert.equal(messages.length,1);
 actor.effects=[{statuses:new Set(['prone']),disabled:true}];
 assert.equal(selfActions(actor).some(a=>a.action==='getUp'),false);
});

test('Get Up and MA Recovery remove only registered Prone IDs',async()=>{
 const {masterStatuses}=await import('../dist/scripts/status-catalog.js');
 const catalogId=masterStatuses.find(status=>status.name==='Prone').id;
 try{
  for(const id of [catalogId,'prone'])for(const action of ['getUp','recovery']){
   globalThis.CONFIG={statusEffects:[{id}]};
   const removed=[],messages=[];
   const roll={luck:0,resultTotal:14,roll:async()=>{},wasCritical:()=>false,handleRollDialog:async()=>true};
   const skill={type:'skill',system:{skillType:'martialArt',level:1},createRoll:()=>roll,confirmRoll:async r=>r};
   const actor={uuid:'registered-prone',isOwner:true,name:'Character',system:{stats:{luck:{value:0}}},items:action==='recovery'?[skill]:[],effects:[{statuses:new Set([id])}],toggleStatusEffect:async(statusId,{active})=>{
    if(!CONFIG.statusEffects.some(status=>status.id===statusId))throw Error('Invalid status ID '+statusId);
    assert.equal(active,false);removed.push(statusId);actor.effects=[];
   }};
   globalThis.game={settings:{get:()=> 'roll'}};globalThis.renderTemplate=async()=>'<div>Native roll</div>';
   globalThis.ChatMessage={getSpeaker:()=>({}),applyRollMode(){},create:async data=>messages.push(data)};
   await performSelfAction(actor,action);
   assert.deepEqual(removed,[id]);assert.equal(actor.effects.length,0);assert.equal(messages.length,1);
  }
 }finally{globalThis.CONFIG={statusEffects:[{id:'prone'}]};}
});
