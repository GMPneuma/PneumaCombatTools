import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.route('http://grapple.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/')return route.fulfill({contentType:'text/html',body:'<main id="card"></main>'});
  if(path.endsWith('.webp')||path.endsWith('.svg'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'});
  const root=resolve('dist'),file=resolve(root,'.'+path);assert.ok(file.startsWith(root+sep));
  await route.fulfill({contentType:'text/javascript',body:await readFile(file,'utf8')});
 });
 await page.goto('http://grapple.test/');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(async()=>{
  window.hooks={};window.Hooks={on:(k,f)=>(hooks[k]??=[]).push(f),once:()=>{}};
  window.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  window.g={id:'grab',revision:2,scene:'scene',combat:'combat',purpose:'grab',state:'active',note:'Grappled',source:{token:'a',actor:'Actor.a',name:'A'},target:{token:'b',actor:'Actor.b',name:'B'},attack:{total:15,html:'<div class="native-roll cpr-block"><img src="systems/cyberpunk-red-core/icons/dice/black/d10_7.svg"><button class="native-detail">Details</button></div>'},defense:{total:10,html:'<div class="native-roll cpr-block"><img src="systems/cyberpunk-red-core/icons/dice/red/d10_1_fail.svg"></div>'}};
  const scene={id:'scene',tokens:[{uuid:'a',actor:{testUserPermission:u=>u.id==='player'}},{uuid:'b',actor:{testUserPermission:()=>false}}]};
  window.game={user:{id:'player',isGM:false},scenes:new Map([['scene',scene]]),combats:new Map([['combat',{flags:{'pneuma-combattools':{grapples:{grab:g}}}}]]),messages:[]};
  window.message={visible:true,isContentVisible:true,flags:{'pneuma-combattools':{grapple:{scene:'scene',id:'grab'}}}};
  const mod=await import('/scripts/grapple/workflow.js');Object.assign(window,{renderGrapple:mod.renderGrapple,grappleContent:mod.grappleContent});
  window.wrap=nodes=>{nodes=Array.isArray(nodes)?nodes:[nodes];return {0:nodes[0],find:q=>wrap(nodes.flatMap(n=>Array.from(n.querySelectorAll(q)))),attr:(k,v)=>{nodes.forEach(n=>n.setAttribute(k,v));},text:v=>{nodes.forEach(n=>n.textContent=v);},empty:()=>{nodes.forEach(n=>n.replaceChildren());return wrap(nodes);},append:n=>{nodes.forEach(p=>p.append(n));},replaceWith:html=>{nodes.forEach(n=>n.outerHTML=html);}};};
 });
 if(process.env.PNEUMA_CHAT_DICE_SOURCE)await page.addScriptTag({content:await readFile(process.env.PNEUMA_CHAT_DICE_SOURCE,'utf8')});
 else await page.evaluate(()=>Hooks.on('renderChatMessage',(_m,html)=>{for(const img of html[0].querySelectorAll('img'))img.src='modules/pneuma-chat-dice/icons/dice/purple-green/d10_7.webp';}));
 for(const first of [true,false]) {
  await page.evaluate(first=>{
   const root=document.querySelector('#card');root.innerHTML=grappleContent(g);window.originalCard=root.firstElementChild;window.originalDice=[...root.querySelectorAll('img')];
   window.details=0;root.querySelector('.native-detail').addEventListener('click',()=>details++);
   const draw=()=>renderGrapple(message,wrap(root)),dice=()=>hooks.renderChatMessage.forEach(fn=>fn(message,wrap(root)));
   if(first){dice();draw();}else{draw();dice();}
  },first);
  assert.equal(await page.evaluate(()=>originalCard===document.querySelector('.pneuma-grapple-card')),true);
  assert.equal(await page.evaluate(()=>originalDice.every((img,i)=>img===document.querySelectorAll('#card img')[i])),true);
  assert.equal(await page.locator('img[src*="modules/pneuma-chat-dice/"]').count(),2);
  if(process.env.PNEUMA_CHAT_DICE_SOURCE){
   assert.match(await page.locator('#card img').first().getAttribute('src'),/purple-green\/d10_7.webp$/);
   assert.match(await page.locator('#card img').last().getAttribute('src'),/red-blue\/d10_skull.webp$/);
  }
  await page.locator('.native-detail').click();assert.equal(await page.evaluate(()=>details),1);
  await page.evaluate(()=>{g.note='Choke: 1/3';for(let i=0;i<3;i++)renderGrapple(message,wrap(document.querySelector('#card')));});
  assert.equal(await page.locator('.pneuma-grapple-note').innerText(),'Choke: 1/3');
  assert.equal(await page.locator('.pneuma-grapple-controls button').count(),0);
  assert.equal(await page.locator('img[src*="modules/pneuma-chat-dice/"]').count(),2);
 }
 await page.evaluate(()=>{g.state='ended';g.note='Released';renderGrapple(message,wrap(document.querySelector('#card')));});
 assert.equal(await page.locator('.pneuma-grapple-card').getAttribute('data-state'),'ended');
 assert.equal(await page.locator('.pneuma-grapple-controls button').count(),0);
 assert.equal(await page.locator('img[src*="modules/pneuma-chat-dice/"]').count(),2);
 await page.evaluate(()=>{message.isContentVisible=false;g.note='PRIVATE';renderGrapple(message,wrap(document.querySelector('#card')));});
 assert.equal(await page.locator('.pneuma-grapple-note').innerText(),'Released');
 // A fresh Foundry render contains new roll markup before all module render hooks run.
 await page.evaluate(()=>{message.isContentVisible=true;g.state='choice';const root=document.querySelector('#card');root.innerHTML=grappleContent(g);hooks.renderChatMessage.forEach(fn=>fn(message,wrap(root)));renderGrapple(message,wrap(root));});
 assert.equal(await page.locator('.pneuma-grapple-controls button').count(),2);
 assert.equal(await page.locator('img[src*="modules/pneuma-chat-dice/"]').count(),2);
 // Contest styling uses the shared classes, including ties and older unstyled cards.
 for(const purpose of ['grab','break'])for(const [attack,defense,sourceWins] of [[15,10,true],[10,15,false],[15,15,false]]){
  await page.evaluate(({purpose,attack,defense})=>{
   g.purpose=purpose;g.attack.total=attack;g.defense.total=defense;
   const root=document.querySelector('#card');root.innerHTML=grappleContent(g);
   // Simulate a card saved before winner/loser styling was added.
   root.querySelectorAll('.pneuma-grapple-rolls > div').forEach(n=>n.className='');
   hooks.renderChatMessage.forEach(fn=>fn(message,wrap(root)));
   window.preservedDice=[...root.querySelectorAll('img')];renderGrapple(message,wrap(root));
  },{purpose,attack,defense});
  const rows=page.locator('.pneuma-grapple-rolls > div');
  assert.equal(await rows.nth(0).getAttribute('class'),sourceWins?'pneuma-roll-winner':'pneuma-roll-loser');
  assert.equal(await rows.nth(1).getAttribute('class'),sourceWins?'pneuma-roll-loser':'pneuma-roll-winner');
  const backgrounds=await rows.evaluateAll(ns=>ns.map(n=>getComputedStyle(n.querySelector('.cpr-block'),'::before').backgroundImage));
  assert.match(backgrounds[sourceWins?0:1],/40, 122, 53/);
  assert.match(backgrounds[sourceWins?1:0],/181, 32, 32/);
  assert.equal(await page.evaluate(()=>preservedDice.every((n,i)=>n===document.querySelectorAll('#card img')[i])),true);
  assert.equal(await page.locator('img[src*="modules/pneuma-chat-dice/"]').count(),2);
 }
 await page.evaluate(()=>{delete g.defense;g.state='waiting';const root=document.querySelector('#card');root.innerHTML=grappleContent(g);renderGrapple(message,wrap(root));});
 assert.equal(await page.locator('.pneuma-roll-winner,.pneuma-roll-loser').count(),0);
 console.log('Grapple chat dice browser checks passed: both hook orders, preserved nodes/listeners, repeated renders, state changes, privacy and fresh message render.');
}finally{await browser.close();}
