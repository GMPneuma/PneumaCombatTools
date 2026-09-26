import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const output=process.env.PNEUMA_TEST_DIST??'dist';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:900,height:700}});
 await page.setContent('<body></body>');await page.addStyleTag({content:await readFile(output+'/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>{
  window.hooks={};window.Hooks={on:(k,f)=>(hooks[k]??=[]).push(f)};
  window.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  window.PIXI={Point:class{constructor(x,y){this.x=x;this.y=y;}}};
  window.viewer={uuid:'Actor.viewer',isOwner:true,items:[{type:'role',name:'Medtech',system:{rank:4}}]};
  window.target={id:'t',x:200,y:200,w:100,h:100,isVisible:true,isPreview:false,actor:{uuid:'Actor.target',items:[],system:{derivedStats:{hp:{value:40,max:40}}}}};target.document={actor:target.actor};
  window.values={alwaysShowEKG:false};window.game={user:{id:'player',isGM:false,character:viewer},settings:{register:(_m,k,c)=>{window.setting=c;},get:(_m,k)=>values[k]}};
  const layer={controlled:[]};window.canvas={tokens:layer,activeLayer:layer,stage:{toGlobal:p=>p},app:{screen:{width:900,height:700},view:{getBoundingClientRect:()=>({left:0,top:0,width:900,height:700})}}};
 });
 const biomonitor=await readFile(output+'/scripts/biomonitor.js','utf8'),hover=(await readFile(output+'/scripts/ekg-hover.js','utf8')).replace(/^import .*;\s*/gm,'');
 const helper=(await readFile(output+'/scripts/eye-hud.js','utf8')).match(/export function hasBiomonitor[\s\S]*?\n}/)[0];
 await page.addScriptTag({type:'module',content:helper+'\n'+biomonitor+'\n'+hover+'\nregisterHoverEKG();window.setEKGPaused=setEKGPaused;window.loaded=true;'});await page.waitForFunction(()=>window.loaded);
 await page.evaluate(()=>hooks.hoverToken.forEach(fn=>fn(target,true)));
 const panel=page.locator('.pneuma-hover-ekg'),state=page.locator('.pneuma-hover-ekg .pneuma-eye-vitals');
 await panel.waitFor();assert.equal(await state.getAttribute('data-state'),'normal');
 assert((await panel.boundingBox()).y>=300);assert.equal(await panel.innerText(),'');
 assert.equal(await page.locator('.pneuma-hover-ekg .pneuma-eye-trace-dot').evaluate(n=>getComputedStyle(n).animationName),'pneuma-ekg');
 await page.evaluate(()=>setEKGPaused(true));
 const traceDot=page.locator('.pneuma-hover-ekg .pneuma-eye-trace-dot');
 assert.equal(await traceDot.evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
 await page.evaluate(()=>{hooks.hoverToken.forEach(fn=>fn(target,false));hooks.hoverToken.forEach(fn=>fn(target,true));});
 assert.equal(await traceDot.evaluate(n=>getComputedStyle(n).animationPlayState),'paused','New hover traces inherit pause');
 for(const [hp,expected]of [[30,'wounded'],[15,'serious'],[5,'critical'],[0,'flatline']]){
  await page.evaluate(hp=>{target.actor.system.derivedStats.hp.value=hp;hooks.updateActor.forEach(fn=>fn(target.actor));},hp);assert.equal(await state.getAttribute('data-state'),expected);
 }
 assert.equal(await traceDot.evaluate(n=>getComputedStyle(n).animationPlayState),'paused','Health changes retain pause');
 await page.evaluate(()=>setEKGPaused(false));
 assert.equal(await traceDot.evaluate(n=>getComputedStyle(n).animationPlayState),'running');
 await page.evaluate(()=>{window.trace= document.querySelector('.pneuma-hover-ekg svg');hooks.refreshToken.forEach(fn=>fn(target));});assert.equal(await page.evaluate(()=>trace===document.querySelector('.pneuma-hover-ekg svg')),true);
 await page.evaluate(()=>{viewer.items[0].system.rank=0;hooks.updateItem.forEach(fn=>fn({parent:viewer}));});assert.equal(await panel.count(),0);
 await page.evaluate(()=>{game.user.isGM=true;hooks.updateUser.forEach(fn=>fn(game.user));});assert.equal(await panel.count(),0,'GM still needs role or world override');
 await page.evaluate(()=>{values.alwaysShowEKG=true;setting.onChange();});assert.equal(await panel.count(),1);assert.equal(await page.evaluate(()=>setting.scope),'world');assert.equal(await page.evaluate(()=>setting.default),false);
 await page.evaluate(()=>{target.isVisible=false;hooks.refreshToken.forEach(fn=>fn(target));});assert.equal(await panel.count(),0);
 await page.evaluate(()=>{target.isVisible=true;values.alwaysShowEKG=false;viewer.items[0]={type:'role',name:'Localized',system:{rank:1},_stats:{compendiumSource:'Compendium.cyberpunk-red-core.core_roles.Item.8wRoRsRQnpt3Je00'}};hooks.hoverToken.forEach(fn=>fn(target,true));});assert.equal(await panel.count(),1);
 await page.evaluate(()=>{canvas.tokens.controlled=[{actor:{isOwner:true,items:[]}}];hooks.controlToken.forEach(fn=>fn());});assert.equal(await panel.count(),0,'Selected non-Medtech overrides assigned Medtech');
 await page.evaluate(()=>{target.actor.items=[{type:'cyberware',name:'Biomonitor',system:{isInstalledInActor:true}}];hooks.createItem.forEach(fn=>fn({parent:target.actor}));});assert.equal(await panel.count(),1,'Non-Medtech sees installed target Biomonitor');
 await page.evaluate(()=>{target.actor.items[0].system.isInstalledInActor=false;hooks.updateItem.forEach(fn=>fn({parent:target.actor}));});assert.equal(await panel.count(),0,'Uninstalled Biomonitor grants no visibility');
 await page.evaluate(()=>{target.actor.items[0]={type:'cyberware',name:'Renamed monitor',system:{isInstalledInActor:true},_stats:{compendiumSource:'Compendium.core.Item.0d2bEozOFhfPgkUP'}};hooks.updateItem.forEach(fn=>fn({parent:target.actor}));});assert.equal(await panel.count(),1,'Native source identifies renamed Biomonitor');
 await page.evaluate(()=>{target.actor.items=[];hooks.deleteItem.forEach(fn=>fn({parent:target.actor}));});assert.equal(await panel.count(),0,'Removing target Biomonitor refreshes visibility');
 await page.evaluate(()=>{canvas.tokens.controlled=[];hooks.controlToken.forEach(fn=>fn());});assert.equal(await panel.count(),1);
 await page.evaluate(()=>hooks.hoverToken.forEach(fn=>fn(target,false)));assert.equal(await panel.count(),0);
 console.log('Hover EKG browser checks passed: Medtech gating, GM override, all health states, stable animation, placement, visibility, ownership selection and hover cleanup.');
}finally{await browser.close();}
