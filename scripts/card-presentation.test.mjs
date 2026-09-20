import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.route('http://cards.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/')return route.fulfill({contentType:'text/html',body:'<main></main>'});
  const root=resolve('dist'),file=resolve(root,'.'+path);assert.ok(file.startsWith(root+sep));
  await route.fulfill({contentType:'text/javascript',body:await readFile(file,'utf8')});
 });
 await page.goto('http://cards.test/');
 await page.evaluate(async()=>{
  window.hooks={};window.Hooks={on:(k,f)=>(hooks[k]??=[]).push(f)};
  window.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  window.game={user:{isGM:false}};
  const {registerResolutionScroll}=await import('/scripts/resolution-scroll.js');registerResolutionScroll();
  window.frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 });
 for(const kind of ['exchange','grapple','quickhack']){
  const result=await page.evaluate(async kind=>{
   document.body.innerHTML='<div id="chat-log" style="height:220px;overflow:auto"><div style="height:350px"></div><div class="chat-message" style="height:100px"><span class="decorated">Custom dice</span></div><div style="height:200px"></div></div>';
   const log=document.querySelector('#chat-log');let card=log.querySelector('.chat-message');card.dataset.messageId=kind;
   const original=card.querySelector('.decorated');
   const message={id:kind,visible:true,isContentVisible:true,flags:{'pneuma-combattools':{[kind]:{state:'active'}}}};
   const render=()=>hooks.renderChatMessage.forEach(fn=>fn(message,{0:card}));
   render();await frames();const history=log.scrollTop;
   const scope=card.classList.contains('pneuma-combat-message')&&card.dataset.pneumaCardKind===kind;
   const preserved=original===card.querySelector('.decorated');
   hooks.updateChatMessage.forEach(fn=>fn(message));await frames();
   const fits=card.getBoundingClientRect().bottom<=log.getBoundingClientRect().bottom+1&&card.getBoundingClientRect().top>=log.getBoundingClientRect().top;
   card.style.height='420px';await frames();
   const grew=Math.abs(card.getBoundingClientRect().bottom-log.getBoundingClientRect().bottom)<2;
   const replacement=card.cloneNode(true);replacement.style.height='140px';card.replaceWith(replacement);card=replacement;
   render();await frames();const replaced=card.getBoundingClientRect().bottom<=log.getBoundingClientRect().bottom+1;
   hooks.deleteChatMessage.forEach(fn=>fn(message));await frames();log.scrollTop=0;
   card.style.height='450px';await frames();const detached=log.scrollTop===0;
   return {history,scope,preserved,fits,grew,replaced,detached};
  },kind);
  assert.deepEqual(result,{history:0,scope:true,preserved:true,fits:true,grew:true,replaced:true,detached:true},kind);
 }
 for(const mode of ['ordinary','hidden','blind','invisible']){
  const result=await page.evaluate(async mode=>{
   document.body.innerHTML='<div id="chat-log" style="height:220px;overflow:auto"><div style="height:350px"></div><div class="chat-message" data-message-id="private" style="height:100px"></div></div>';
   const root=document.querySelector('.chat-message'),log=document.querySelector('#chat-log');
   const message={id:'private',visible:mode!=='invisible',isContentVisible:mode!=='hidden',blind:mode==='blind',flags:mode==='ordinary'?{}:{'pneuma-combattools':{grapple:{}}}};
   hooks.renderChatMessage.forEach(fn=>fn(message,{0:root}));hooks.updateChatMessage.forEach(fn=>fn(message));await frames();
   return {scroll:log.scrollTop,decorated:root.classList.contains('pneuma-combat-message')};
  },mode);
  assert.deepEqual(result,{scroll:0,decorated:false},mode);
 }
 console.log('Shared card checks passed: attack, grapple and QuickHack growth/re-render scrolling, preserved nodes, history, privacy, and observer cleanup.');
}finally{await browser.close();}
