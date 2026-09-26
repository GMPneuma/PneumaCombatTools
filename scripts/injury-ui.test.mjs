import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:"msedge",headless:true});
try{
 const page=await browser.newPage({viewport:{width:360,height:600}});
 page.on("pageerror",error=>console.error(error.message));
 await page.route("http://injury.test/**",async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==="/")return route.fulfill({contentType:"text/html",body:'<div id="card"></div>'});
  const file=resolve("dist","."+path);assert.ok(file.startsWith(resolve("dist")));
  return route.fulfill({contentType:"text/javascript",body:await readFile(file)});
 });
 await page.goto("http://injury.test/");
 await page.evaluate(async()=>{
  const M="pneuma-combattools",get=(o,p)=>p.split(".").reduce((v,k)=>v?.[k],o);
  const set=(o,p,v)=>{const keys=p.split(".");for(const k of keys.slice(0,-1))o=o[k]??={};o[keys.at(-1)]=structuredClone(v);};
  window.foundry={utils:{getProperty:get,deepClone:value=>structuredClone(value)}};
  const hooks={};window.Hooks={on:(k,f)=>(hooks[k]??=[]).push(f),once(){}};
  window.ui={notifications:{error:e=>{window.testError=String(e);}}};
  const gm={id:"gm",active:true,isGM:true},owner={id:"owner",active:true};
  window.actor={uuid:"Actor.a",isOwner:true,items:[{type:"criticalInjury",name:"Broken Ribs"}],effects:[],system:{derivedStats:{hp:{value:30}}},testUserPermission:u=>u.id==="owner",async update(data){for(const [k,v]of Object.entries(data))set(this,k,v);}};
  window.game={user:gm,users:[gm,owner],combats:new Map([["c",{id:"c",started:true}]]),messages:[],modules:new Map()};game.messages.get=id=>game.messages.find(m=>m.id===id);
  window.fromUuid=async()=>actor;
  const {registerInjuryMechanics,warnBrokenRibs}=await import("/scripts/injury-mechanics.js");
  window.draw=async message=>{const root=document.querySelector("#card");root.innerHTML=message.content;for(const f of hooks.renderChatMessage)await f(message,{0:root,find:s=>({toArray:()=>[...root.querySelectorAll(s)]})});};
  window.ChatMessage={getSpeaker:()=>({}),async create(data){const m={...data,id:"m",async update(data){for(const[k,v]of Object.entries(data))set(this,k,v);await draw(this);}};game.messages.push(m);await draw(m);return m;}};
  registerInjuryMechanics();await warnBrokenRibs({uuid:"Token.a",actor,name:"Rage"},{combat:"c",turn:"p:1",spent:3,onFoot:6});
 });
 await page.evaluate(async()=>{actor.items=[];await draw(game.messages[0]);});
 assert.equal(await page.locator('[data-state="withdrawn"]').count(),1);
 assert.equal(await page.getByRole('button',{name:'Apply 5 damage'}).isDisabled(),true);
 await page.evaluate(async()=>{actor.items=[{type:'criticalInjury',name:'Broken Ribs'}];game.combats.get('c').flags={'pneuma-combattools':{evasionEpoch:'reset'}};await draw(game.messages[0]);});
 assert.equal(await page.getByRole('button',{name:'Apply 5 damage'}).isDisabled(),true);
 await page.evaluate(async()=>{delete game.combats.get('c').flags;await draw(game.messages[0]);});
 const button=page.getByRole("button",{name:"Apply 5 damage"});
 assert.equal(await button.isEnabled(),true);assert.equal(await page.evaluate(()=>actor.system.derivedStats.hp.value),30);
 assert.equal(await page.evaluate(()=>document.querySelector("#card").scrollWidth<=360),true);
 await button.click();await page.locator('[data-state="applied"]').waitFor({timeout:5000}).catch(async error=>{console.error(await page.evaluate(()=>({error:window.testError,hp:actor.system.derivedStats.hp.value,card:game.messages[0]})));throw error;});assert.equal(await button.count(),0);
 assert.equal(await page.evaluate(()=>actor.system.derivedStats.hp.value),25);
 assert.match(await page.locator("#card").innerText(),/5 damage applied directly to HP/);
 console.log("Broken Ribs browser card: manual button, applied state, HP and width passed.");
}finally{await browser.close();}
