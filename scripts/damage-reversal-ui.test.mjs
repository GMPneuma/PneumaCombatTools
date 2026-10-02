import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();const base=resolve('dist');
 await page.route('http://pneuma.test/**',async route=>{
  const url=new URL(route.request().url());if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<body></body>'});
  const path=resolve(base,'.'+url.pathname);assert(path.startsWith(base+sep));await route.fulfill({contentType:'text/javascript',body:await readFile(path)});
 });
 await page.goto('http://pneuma.test/');
 await page.evaluate(()=>{
  let serial=0;window.foundry={utils:{randomID:()=>String(++serial),getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  window.gm={id:'gm',isGM:true,active:true};window.owner={id:'owner',isGM:false};window.stranger={id:'other',isGM:false};
  window.calls=[];window.actor={uuid:'Actor.a',id:'a',testUserPermission:u=>u.id==='owner',async _reverseDamage(...args){calls.push(args);if(this.fail)throw Error('armor update failed');}};
  window.game={user:gm,users:Object.assign([gm,owner,stranger],{get:id=>[gm,owner,stranger].find(u=>u.id===id)}),actors:new Map([['a',actor]]),messages:new Map()};
  window.fromUuid=async uuid=>uuid===actor.uuid?actor:null;window.ui={notifications:{error:e=>{window.lastError=e;}}};
  window.receipt=(id,legacy=false)=>'<div class="pneuma-damage-applied" '+(legacy?'':'data-damage-instance="'+id+'" data-damage-actor="Actor.a"')+'><div class="pneuma-applied-details pneuma-applied-details-'+id+'"><a data-action="reverseDamage" data-actor-id="a" data-hp-reduction="7" data-location="body" data-ablation="2" data-shield-ablation="0"><i>undo</i></a></div></div>';
  window.message={id:'m',content:receipt('first')+receipt('second')+receipt('legacy',true)+receipt('failed')+receipt('click')+receipt('unclaimed'),visible:true,isContentVisible:true,blind:false,whisper:[],flags:{},async update(changes){if(this.failSave)throw Error('save failed');for(const [path,value]of Object.entries(changes)){let out=this;const parts=path.split('.');for(const part of parts.slice(0,-1))out=out[part]??={};out[parts.at(-1)]=value;}}};game.messages.set('m',message);
 });
 await page.addScriptTag({type:'module',content:'import {reverseDamageOnce,bindDamageReversal} from "/scripts/damage-reversal.js";Object.assign(window,{reverseDamageOnce,bindDamageReversal});'});
 await page.waitForFunction(()=>!!window.reverseDamageOnce);
 await page.evaluate(async()=>{
  const req={message:'m',instance:'first',user:'gm'};
  await Promise.all([reverseDamageOnce(req),reverseDamageOnce(req)]);await reverseDamageOnce(req);
  if(calls.length!==1||JSON.stringify(calls[0])!==JSON.stringify([7,'body',2,0]))throw Error('Duplicate or non-native reversal');
  await reverseDamageOnce({...req,instance:'second'});if(calls.length!==2)throw Error('Separate application blocked');
  await reverseDamageOnce({...req,instance:'legacy'});if(calls.length!==3)throw Error('Legacy receipt failed');
  let denied=false;try{await reverseDamageOnce({...req,instance:'failed',user:'other'});}catch{denied=true;}if(!denied||calls.length!==3)throw Error('Owner permission failed');
  denied=false;try{await reverseDamageOnce({...req,instance:'failed',user:'owner'});}catch{denied=true;}if(!denied||calls.length!==3||message.flags['pneuma-combattools'].damageReversals.failed)throw Error('Owner allowed to reverse damage');
  actor.fail=true;try{await reverseDamageOnce({...req,instance:'failed'});}catch{}actor.fail=false;
  await reverseDamageOnce({...req,instance:'failed'});if(calls.length!==4||message.flags['pneuma-combattools'].damageReversals.failed!=='review')throw Error('Interrupted reversal repeated');
  message.failSave=true;try{await reverseDamageOnce({...req,instance:'unclaimed'});}catch{}message.failSave=false;
  if(calls.length!==4)throw Error('Reversed without persistent claim');
  window.root=document.createElement('div');root.innerHTML=message.content;document.body.append(root);
  window.nativeClicks=0;root.addEventListener('click',()=>nativeClicks++);bindDamageReversal(message,root);
  if(root.querySelector('[data-damage-instance="first"] .pneuma-reversal-status')?.textContent.trim()!=='Damage reversed'||root.querySelectorAll('[data-damage-instance="first"] .fa-check').length!==1)throw Error('Missing success indicator');
  if(root.querySelector('[data-damage-instance="failed"] .pneuma-reversal-status')?.dataset.state!=='review')throw Error('Interrupted reversal shows success');
  if(root.querySelector('[data-damage-instance="first"] a').getAttribute('aria-disabled')!=='true')throw Error('Used button active after rerender');
  root.querySelector('[data-damage-instance="first"] a i').click();
  const click=root.querySelector('[data-damage-instance="click"] a i');click.click();click.click();
 });
 await page.waitForFunction(()=>message.flags['pneuma-combattools'].damageReversals.click==='reversed');
 assert.equal(await page.evaluate(()=>calls.length),5);assert.equal(await page.evaluate(()=>nativeClicks),0);
 await page.waitForFunction(()=>root.querySelector('[data-damage-instance="click"] .pneuma-reversal-status')?.textContent.trim()==='Damage reversed');
 await page.evaluate(()=>{root.innerHTML=message.content;bindDamageReversal(message,root);root.querySelector('[data-damage-instance="click"] a i').click();});
 assert.equal(await page.evaluate(()=>calls.length),5);
 await page.evaluate(()=>{
  game.user=owner;root.innerHTML=message.content;bindDamageReversal(message,root);
  if([...root.querySelectorAll('[data-action="reverseDamage"]')].some(button=>!button.hidden))throw Error('Player sees reverse control');
  if(!root.querySelector('[data-damage-instance="first"] .pneuma-reversal-status'))throw Error('Player lost reversal status');
  root.querySelector('[data-damage-instance="unclaimed"] a i').click();
  if(calls.length!==5||nativeClicks!==0)throw Error('Player click reached native reversal');
  game.user=gm;bindDamageReversal(message,root);
  if([...root.querySelectorAll('[data-action="reverseDamage"]')].some(button=>button.hidden))throw Error('GM reverse control hidden');
 });
 console.log('Damage reversal browser checks passed: once per instance, concurrent requests, native arguments, legacy cards, rerenders, permissions, failed writes and interrupted reversal.');
}finally{await browser.close();}
