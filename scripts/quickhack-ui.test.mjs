import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const { chromium } = await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
 const page=await browser.newPage();
 await page.route('http://quickhack.test/**', async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/') return route.fulfill({contentType:'text/html',body:'<main id="card"></main>'});
  const root=resolve('dist');const file=resolve('dist','.'+path);
  assert.ok(file.startsWith(root));
  await route.fulfill({contentType:'text/javascript',body:await readFile(file,'utf8')});
 });
 await page.goto('http://quickhack.test/');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(async()=>{
  window.FormApplication=class {};window.enabled=true;window.hooks={};
  window.Hooks={on:(name,fn)=>(hooks[name]??=[]).push(fn),once:()=>{}};
  window.foundry={data:{fields:{ObjectField:class {}}},utils:{getProperty:(obj,path)=>path.split('.').reduce((v,k)=>v?.[k],obj)}};
  window.game={system:{id:'cyberpunk-red-core'},settings:{register:()=>{},registerMenu:()=>{},get:(_m,k)=>k==='quickhackEnabled'?window.enabled:'raw'},modules:new Map(),user:{isGM:true,id:'gm'},users:[],i18n:{format:k=>k,localize:k=>k}};
  window.ChatMessage={getWhisperRecipients:()=>[],getSpeaker:()=>({}),create:async data=>({...data,id:'card'})};
  window.fromUuid=async uuid=>({uuid,testUserPermission:()=>true});
  const {postResult}=await import('/scripts/quickhack/messages.js');
  const {registerQuickhack}=await import('/scripts/quickhack/integration.js');registerQuickhack();
  window.message=await postResult({name:'<script>unsafe()</script>',actor:{hasPlayerOwner:true},document:{}},{name:'Target & friend',actor:{},document:{}},
   {type:'quickhack',sourceActorUuid:'Actor.a',targetActorUuid:'Actor.b',quickhackId:'synapse-burnout',success:true,alerted:true,audience:'public',revealAttacker:true},'Synapse Burnout','SUCCESS','<p>Interface 17 vs. DV 15</p>', '<div class="rollcard"><div class="rollcard-top">Duplicate title</div><div class="rollcard-bottom"><div class="cpr-block"><div class="d10-number-div"><span data-action="toggleVisibility">17</span></div></div></div></div>');
  const root=document.querySelector('#card');root.innerHTML=message.content;
  window.wrap=root=>({0:root,find:selector=>({remove:()=>root.querySelectorAll(selector).forEach(node=>node.remove())})});
  for(const callback of hooks.renderChatMessage)await callback(message,wrap(root));
 });
 assert.equal(await page.locator('[data-pneuma-section="result"]').count(),1);
 assert.equal(await page.locator('#card script').count(),0);
 assert.equal(await page.locator('[data-quickhack-action]').count(),2);
 assert.equal(await page.locator('.pneuma-quickhack-card .pneuma-quickhack-roll').count(),1);
 assert.equal(await page.locator('.pneuma-quickhack-roll .rollcard-top').isVisible(),false);
 assert.equal(await page.locator('.pneuma-quickhack-roll .rollcard-bottom').isVisible(),true);
 assert.equal(await page.locator('.pneuma-quickhack-actions button').count(),2);
 await page.setViewportSize({width:380,height:700});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 // Existing controls are blocked immediately, even before the chat rerender completes.
 const blocked=await page.evaluate(()=>{
  enabled=false;let reached=false;const button=document.querySelector('[data-quickhack-action]');
  button.addEventListener('click',()=>{reached=true;});button.click();return !reached;
 });
 assert.equal(blocked,true);
 await page.evaluate(async()=>{for(const callback of hooks.renderChatMessage)await callback(message,wrap(document.querySelector('#card')));});
 assert.equal(await page.locator('[data-quickhack-action]').count(),0);
 // Native damage links are also removed while the master switch is disabled.
 await page.evaluate(async()=>{
  const root=document.querySelector('#card');root.innerHTML='<a data-action="applyDamage">Apply damage</a>';
  const damage={flags:{'pneuma-combattools':{quickhack:{type:'damage'}}}};
  for(const callback of hooks.renderChatMessage)await callback(damage,wrap(root));
 });
 assert.equal(await page.locator('[data-action="applyDamage"]').count(),0);
 console.log('QuickHack browser checks passed: native card sections, escaped names, live master-off click guard and removed damage controls.');
} finally { await browser.close(); }
