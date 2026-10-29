import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const output=process.env.PNEUMA_TEST_DIST??'dist';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:900,height:700}});
 await page.setContent('<body></body>');await page.addStyleTag({content:await readFile(output+'/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>{
  window.FormApplication=class {};window.CONST={TOKEN_DISPOSITIONS:{FRIENDLY:1},DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};window.hooks={};window.Hooks={on:(k,f)=>(hooks[k]??=[]).push(f)};
  window.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  window.PIXI={Point:class{constructor(x,y){this.x=x;this.y=y;}}};
  window.viewer={uuid:'Actor.viewer',isOwner:true,items:[{type:'role',name:'Medtech',system:{rank:4}}]};
  window.target={id:'t',x:200,y:200,w:100,h:100,isVisible:true,isPreview:false,actor:{uuid:'Actor.target',items:[],system:{derivedStats:{hp:{value:40,max:40}}}}};target.document={actor:target.actor,disposition:-1};target.actor.getUserLevel=u=>target.actor.owner===u.id?3:0;target.actor.testUserPermission=u=>u.isGM||target.actor.owner===u.id;
  window.values={ekgVisibility:{matrix:{medtech_other:'ekg'},biomonitor:'none'}};window.game={user:{id:'player',isGM:false,character:viewer},users:[{id:'player',isGM:false},{id:'other',isGM:false}],settings:{registerMenu:()=>{},register:(_m,k,c)=>{window.setting=c;},get:(_m,k)=>values[k]}};
  const layer={controlled:[]};window.canvas={tokens:layer,activeLayer:layer,stage:{toGlobal:p=>p},app:{screen:{width:900,height:700},view:{getBoundingClientRect:()=>({left:0,top:0,width:900,height:700})}}};
 });
 const biomonitor=await readFile(output+'/scripts/biomonitor.js','utf8'),hover=(await readFile(output+'/scripts/ekg-hover.js','utf8')).replace(/^import .*;\s*/gm,'');
 const policy=(await readFile(output+'/scripts/ekg-settings.js','utf8')).replace(/const MODULE = [^;]+;/,'');
 const helper=(await readFile(output+'/scripts/eye-hud.js','utf8')).match(/export function hasBiomonitor[\s\S]*?\n}/)[0];
 await page.addScriptTag({type:'module',content:policy+'\n'+helper+'\n'+biomonitor+'\n'+hover+'\nregisterHoverEKG();window.setEKGPaused=setEKGPaused;window.hoverEKGAccess=hoverEKGAccess;window.EKGSettings=EKGSettings;window.loaded=true;'});await page.waitForFunction(()=>window.loaded);
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
 await page.evaluate(()=>{
  const original=viewer.items.some.bind(viewer.items);window.eligibilityScans=0;
  viewer.items.some=(...args)=>{eligibilityScans++;return original(...args);};
  for(let i=0;i<100;i++){target.x++;hooks.refreshToken.forEach(fn=>fn(target));}
 });
 assert.equal(await page.evaluate(()=>eligibilityScans),0,'Animation frames must not rescan eligibility');
 await page.evaluate(()=>{window.trace= document.querySelector('.pneuma-hover-ekg svg');hooks.refreshToken.forEach(fn=>fn(target));});assert.equal(await page.evaluate(()=>trace===document.querySelector('.pneuma-hover-ekg svg')),true);
 await page.evaluate(()=>{canvas.tokens.controlled=[{actor:{items:[]}}];hooks.controlToken.forEach(fn=>fn());});assert.equal(await panel.count(),1,'Selection does not override assigned character');
 for(const row of ['gm','player','medtech'])for(const col of ['owned','playerOwned','friendly','other'])for(const level of ['none','ekg','hp']){
  const actual=await page.evaluate(({row,col,level})=>{game.user.isGM=row==='gm';viewer.items[0].system.rank=row==='medtech'?1:0;target.actor.owner=col==='owned'?'player':col==='playerOwned'?'other':undefined;target.document.disposition=col==='friendly'?1:-1;values.ekgVisibility={matrix:{[row+'_'+col]:level},biomonitor:'none'};return hoverEKGAccess(target);},{row,col,level});assert.equal(actual,level,row+'/'+col);
 }
 await page.evaluate(()=>{game.user.isGM=false;viewer.items[0].system.rank=0;target.actor.owner='player';target.actor.system.derivedStats.hp.value=23;values.ekgVisibility={matrix:{player_owned:'hp'},biomonitor:'none'};setting.onChange();});
 assert.equal(await panel.innerText(),'23 / 40');
 await page.evaluate(()=>{target.actor.system.derivedStats.hp.value=24;hooks.updateActor.forEach(fn=>fn(target.actor));});assert.equal(await panel.innerText(),'24 / 40','HP updates within the same waveform state');
 await page.evaluate(()=>{values.ekgVisibility.matrix.player_owned='ekg';setting.onChange();});assert.equal(await panel.innerText(),'');assert(!(await panel.getAttribute('aria-label')).includes('24'));
 for(const audience of ['none','anyone','medtech'])for(const rank of [0,1]){
  const actual=await page.evaluate(({audience,rank})=>{viewer.items[0].system.rank=rank;target.actor.owner=undefined;target.actor.items=[{type:'cyberware',name:'Biomonitor',system:{isInstalledInActor:true}}];values.ekgVisibility={matrix:{player_other:'none',medtech_other:'none'},biomonitor:audience};return hoverEKGAccess(target);},{audience,rank});assert.equal(actual,audience==='anyone'||audience==='medtech'&&rank?'ekg':'none');
 }
 await page.evaluate(()=>{values.ekgVisibility.matrix.medtech_other='hp';setting.onChange();});assert.equal(await panel.innerText(),'24 / 40','Free EKG never downgrades HP');
 await page.evaluate(()=>{target.isVisible=false;hooks.refreshToken.forEach(fn=>fn(target));});assert.equal(await panel.count(),0);
 await page.evaluate(()=>{target.isVisible=true;hooks.hoverToken.forEach(fn=>fn(target,true));});assert.equal(await panel.count(),1);
 await page.evaluate(()=>hooks.canvasTearDown.forEach(fn=>fn()));assert.equal(await panel.count(),0);
 await page.evaluate(async()=>{window.savedPolicies=[];game.settings.set=async(_m,_k,value)=>savedPolicies.push(value);game.user.isGM=false;await new EKGSettings()._updateObject(null,{gm_owned:'hp'});});assert.equal(await page.evaluate(()=>savedPolicies.length),0);
 await page.evaluate(async()=>{game.user.isGM=true;await new EKGSettings()._updateObject(null,{gm_owned:'hp',player_owned:'ekg',biomonitor:'medtech'});});assert.equal(await page.evaluate(()=>savedPolicies[0].matrix.player_owned),'ekg');assert.equal(await page.evaluate(()=>savedPolicies[0].biomonitor),'medtech');
 const settingsData=await page.evaluate(()=>new EKGSettings().getData());
 assert.equal(settingsData.rows.length,3);assert(settingsData.rows.every(row=>row.cells.length===4&&row.cells.every(cell=>cell.options.length===3)));assert.equal(settingsData.biomonitor.length,3);
 console.log('Hover EKG: 36 matrix combinations, assigned Medtech rank, Biomonitor grants, HP overlays, cached motion and teardown passed.');
}finally{await browser.close();}
