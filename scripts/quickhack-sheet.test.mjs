import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.route('http://sheet.test/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   await route.fulfill(path==='/'?{contentType:'text/html',body:'<main></main>'}:{contentType:'text/javascript',body:await readFile(resolve('dist','.'+path),'utf8')});
 });
 await page.goto('http://sheet.test/');
 const result=await page.evaluate(async()=>{
   window.FormApplication=class {};
   let hook;window.Hooks={on:(_name,fn)=>{hook=fn;}};
   let enabled=true;
   window.game={system:{id:'cyberpunk-red-core'},settings:{get:()=>enabled},modules:new Map()};
   const {registerQuickhackSheet}=await import('/scripts/quickhack/sheet.js');
   const actions=[];registerQuickhackSheet(async(action,actor)=>{actions.push([action,actor]);});
   const root=document.querySelector('main');
   root.innerHTML='<div class="weapon-grid" data-item-id="launcher"><a data-roll-type="attack"><i></i></a><a data-roll-type="damage"><i></i></a></div>';
   const actor={uuid:'Actor.a',items:new Map([['launcher',{type:'weapon',flags:{'pneuma-combattools':{action:'quickhack'}}}]])};
   let native=0;root.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>native++));
   hook({actor},{0:root});root.querySelector('[data-roll-type="attack"] i').click();root.querySelector('[data-roll-type="damage"]').click();
   enabled=false;root.querySelector('a').click();
   return {actions,native};
 });
 assert.deepEqual(result,{actions:[['jack-in','Actor.a'],['quickhack','Actor.a']],native:0});
 console.log('QuickHack sheet controls: actions dispatched; native rolls and disabled actions blocked.');
} finally {await browser.close();}
