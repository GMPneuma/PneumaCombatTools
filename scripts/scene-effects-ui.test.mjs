import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.route('http://hazard.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let body;
  if(path.startsWith('/visual/'))return route.fulfill({contentType:'text/javascript',body:await readFile(resolve('../PneumaVisualTools/dist',path.slice('/visual/'.length)))});
  if(path==='/')return route.fulfill({contentType:'text/html',body:'<main class="message pneuma-combat-message"></main>'});
  if(path.endsWith('/cpr-rolls.js'))body='export class CPRDamageRoll {constructor(title,formula){window.nativeRolls++;this.rollTitle=title;this.formula=formula;this.rollCard="damage";}async roll(){this.resultTotal=7;}wasCritical(){return true;}}';
  else if(path.endsWith('/cpr-dice-handler.js'))body='export default {handle3dDice:async()=>{}}';
  else if(path.endsWith('/cpr-chat.js'))body='export default window.nativeChat;';
  else {const root=resolve('dist'),file=resolve(root,'.'+path);assert.ok(file.startsWith(root));body=await readFile(file);}
  await route.fulfill({contentType:'text/javascript',body});
 });
 await page.goto('http://hazard.test/');await page.evaluate(installMockLibWrapper);
 await page.addStyleTag({content:'*{box-sizing:border-box}body{font:14px Arial;background:#ddd;padding:30px}.chat-message{width:350px}.rollcard{margin:0}.d6-data-details{display:none}'});
 for(const file of ['chat-cards.css','chat-hub.css','chat-theme.css'])await page.addStyleTag({content:await readFile(resolve('../PneumaVisualTools/dist',file),'utf8')});
 const results=await page.evaluate(async()=>{
  window.FormApplication=class {};window.nativeRolls=0;window.calls=[];window.canvas={scene:{id:'scene'}};
  const hooks={};window.Hooks={once(){},on:(name,fn)=>(hooks[name]??=[]).push(fn)};
  let seq=0;window.foundry={utils:{randomID:()=>String(++seq),deepClone:value=>structuredClone(value),getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  window.CONFIG={statusEffects:[]};window.ui={notifications:{error:message=>{throw Error(message);}},chat:{updateMessage(){}}};
  const gm={id:'gm',isGM:true,active:true};const messages=new Map();messages.find=fn=>[...messages.values()].find(fn);
  const provider={apply:async(_source,_index,_card,_amount,_avoided,applyDamage)=>{if (_avoided) return "Avoided";await applyDamage();return 'Applied';}};
  window.game={user:gm,users:Object.assign([gm],{get:id=>id===gm.id?gm:undefined}),messages,modules:new Map([['provider',{active:true,api:{sceneEffects:provider}}],['pneuma-combattools',{}]]),settings:{get:(_m,k)=>k==='rollMode'?'gmroll':k==='chatSkin'?'compact-hub':k==='chatPortraitSource'?'token':''},i18n:{localize:k=>k}};
  window.nativeChat={RenderDamageApplicationCard(){throw Error('Receipt escaped capture');}};
  const actor={uuid:'Actor.one',name:'Target',isOwner:true,items:[],_applyDamage:async function(...args){calls.push(args);await nativeChat.RenderDamageApplicationCard({actor:this,hpReduction:7,rawDamageDealt:7,location:'body'});}};
  window.fromUuid=async uuid=>uuid===actor.uuid?actor:({uuid,documentName:'Token',name:'Target',actor});
  window.Roll={validate:()=>true};
  window.renderTemplate=async(path,roll)=>path==='damage'?`<div class="rollcard"><div class="rollcard-top"><div class="cpr-block">Damage</div></div><div class="rollcard-bottom"><span class="dice-result">7</span><a data-action="applyDamage" data-total-damage="7" data-bonus-damage="0" data-damage-location="body" data-ablation="2" data-ammo-variety="basic" data-ignore-armor-percent="50" data-ignore-below-sp="0" data-damage-lethal="true"></a></div></div>`:'<div class="rollcard"><a data-action="toggleVisibility" data-visible-element="d6-data-details">7</a><div class="d6-data-details">Native breakdown</div><a data-action="reverseDamage">Undo</a></div>';
  window.ChatMessage={applyRollMode(){},create:async data=>{const m={...data,id:'card'+ ++seq,visible:true,whisper:[],async update(changes){for(const [path,value] of Object.entries(changes)){const keys=path.split('.');let dest=this;for(const key of keys.slice(0,-1))dest=dest[key]??={};dest[keys.at(-1)]=structuredClone(value);}return this;}};messages.set(m.id,m);return m;}};
  const api=await import('/scripts/scene-effects.js');api.registerSceneEffects();
  const req={provider:'provider',group:'g',source:'s1',index:0,target:'Token.one',title:'Fire trap',label:'Direct Damage',formula:'1d6',damage:{armor:'half',ablation:2}};
  const id=await api.createSceneEffect(req),message=messages.get(id),state=()=>message.flags['pneuma-combattools'].sceneEffect;
  await api.resolveSceneEffect(id,'roll',0,state().revision);await api.createSceneEffect({...req,source:'s2',target:'Token.two',avoidance:{skill:'Evasion',dv:13}});
  await api.createSceneEffect({...req,source:'s3',target:'Token.three',avoidance:{skill:'Evasion',dv:13}});
  let avoidanceBlocked=false;try{await api.resolveSceneEffect(id,'apply',1,state().revision);}catch{avoidanceBlocked=true;}
  for (const [row,total] of [[1,13],[2,14]]) {
    const check={sceneEffectType:'request',id:'req',user:'gm',message:id,row,nonce:'n'+row};
    await api.resolveSceneAvoidance({...check,action:'claim'});await api.resolveSceneAvoidance({...check,action:'commit',total});
  }
  const root=document.querySelector('main');root.innerHTML=message.content;
  const wrap=nodes=>Object.assign({length:nodes.length,find:s=>wrap(nodes.flatMap(n=>[...n.querySelectorAll(s)])),toArray:()=>nodes,remove:()=>nodes.forEach(n=>n.remove()),append:n=>nodes[0]?.append(n),prop:()=>wrap(nodes),attr:()=>wrap(nodes)},nodes);
  for(const hook of hooks.renderChatMessage)await hook(message,wrap([root]));
  const bolts=root.querySelectorAll('.pneuma-apply-damage[data-pneuma-damage-target="recorded"]').length;
  const selected=root.querySelectorAll('[data-pneuma-damage-target="selected"]').length;
  const nativeButtons=root.querySelectorAll('[data-action="applyDamage"]').length;
  const effectSlots=root.querySelectorAll('.pneuma-damage-status-slot:not(:disabled)').length;
  await api.resolveSceneEffect(id,'damageStatuses',0,state().revision,{action:'damageStatuses',statusEffects:['instant:flashbang']});
  if(message.flags['pneuma-combattools'].attachedEffects)throw Error('Attached effect created before damage');
  const apply={action:'damageApply',statusEffects:['instant:flashbang'],options:{useShield:false,damageReductionRole:true,damageReductionAE:true,brainDamageReduction:true},interactArmor:true,halfArmor:true};
  const revision=state().revision;await api.resolveSceneEffect(id,'apply',0,revision,apply);
  const attached=message.flags['pneuma-combattools'].attachedEffects;
  const scope=Object.keys(attached??{})[0];
  if(calls.length!==1 || attached?.[scope]?.effect.state!=='pending')throw Error('Damage must resolve before the resistance stage');
  const instant=await import('/scripts/instant-effects.js');
  await instant.handleInstantRequest({message:id,user:'gm',scope,request:{action:'claim',nonce:'resist'}});
  await instant.handleInstantRequest({message:id,user:'gm',scope,request:{action:'commit',nonce:'resist',total:16,html:'<div>Native resistance</div>'}});
  if(message.flags['pneuma-combattools'].attachedEffects[scope].effect.state!=='resisted')throw Error('Successful resistance must skip effect application');
  let stale=false;try{await api.resolveSceneEffect(id,'apply',0,revision,apply);}catch{stale=true;}
  await api.resolveSceneEffect(id,'apply',0,state().revision,apply);
  await api.resolveSceneEffect(id,'apply',1,state().revision,{...apply,statusEffects:[],interactArmor:false});
  root.className='chat-message pneuma-combat-message';root.innerHTML='<header class="message-header"><h4 class="message-sender">Fire trap</h4><span class="message-metadata">Just now</span></header><div class="message-content">'+message.content+'</div>';
  window.CONST={CHAT_MESSAGE_STYLES:{OOC:1,IC:2,EMOTE:3}};message.speaker={alias:'Fire trap'};
  await instant.renderInstantEffects(message,wrap([root]));
  const visual=await import('/visual/chat-cards.js');visual.renderChatCard(message,root);
  const presentation=await import('/visual/chat-presentation.js');presentation.arrangeChatCard(root,message);
  const section=root.querySelector('.pneuma-resolution-effects'),rail=root.querySelector('.pneuma-participant-rail');
  const hazardAction=root.querySelector('.pneuma-rail-action')?.textContent;
  const attachedVisible=root.querySelectorAll('.pneuma-attached-effects').length;
  const fullWidth=section.getBoundingClientRect().width>root.getBoundingClientRect().width*0.95;
  const railEndsBeforeEffects=rail.getBoundingClientRect().bottom<=section.getBoundingClientRect().top;
  return {hazardAction,attachedVisible,fullWidth,railEndsBeforeEffects,effectSlots,avoidanceBlocked,nativeRolls,calls,bolts,selected,nativeButtons,stale,states:state().rows.map(r=>r.state),receipts:root.querySelectorAll('.pneuma-damage-applied').length,undo:root.querySelectorAll('[data-action="reverseDamage"]').length};
 });
 assert.equal(results.hazardAction,'Hazard');assert.equal(results.attachedVisible,1);assert.equal(results.fullWidth,true);assert.equal(results.railEndsBeforeEffects,true);assert.equal(results.effectSlots,6);assert.equal(results.nativeRolls,1);assert.equal(results.bolts,2);assert.equal(results.selected,0);assert.equal(results.nativeButtons,0);assert.equal(results.stale,true);
 assert.equal(results.avoidanceBlocked,true);assert.deepEqual(results.states,['applied','applied','avoided']);assert.equal(results.calls.length,2);assert.equal(results.calls[0][3],2);assert.equal(results.calls[0][5],50);assert.equal(results.calls[1][3],0);assert.equal(results.calls[1][5],100);assert.equal(results.receipts,2);assert.equal(results.undo,2);
 await page.locator('main').screenshot({path:'docs/hazard-damage-flow-preview.png'});
 console.log('Native hazard damage: shared native roll, recorded-target controls, armor, duplicate prevention and captured receipts/Undo passed.');
} finally {await browser.close();}
