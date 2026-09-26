import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage({viewport:{width:850,height:650}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('http://instant.test/**',async route=>{const path=new URL(route.request().url()).pathname;if(path==='/')return route.fulfill({contentType:'text/html',body:'<style>body{margin:0;background:#292d33;color:#eee;font:13px Arial}#card{position:absolute;left:520px;top:10px;width:310px}button{background:#ddd;color:#111}canvas{position:absolute;left:0;top:0}.rollcard h3{font-size:15px}</style><div id="card"></div>'});const root=resolve('dist'),file=resolve(root,'.'+path);assert.ok(file.startsWith(root));return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body:await readFile(file)})});
await page.goto('http://instant.test/');await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
await page.addScriptTag({path:process.env.PNEUMA_PIXI_SOURCE||resolve(tmpdir(),'pneuma-pixi-7.4.3.min.js')});
await page.evaluate(async()=>{
 window.FormApplication=class{};window.hooks={};window.Hooks={on:(n,f)=>{(hooks[n]??=[]).push(f)},once:(n,f)=>{(hooks[n]??=[]).push(f)}};
 window.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};window.game={user:{id:'gm',isGM:true},users:[],time:{worldTime:0},scenes:[],modules:new Map(),settings:{get:()=>false}};
 const {areaContent}=await import('/scripts/aoe/workflow.js');const {newInstant,instantContent,bindInstantControls}=await import('/scripts/instant-effects.js');
 const s=newInstant('poison','Actor.target','Target');window.effect=s;window.requests=[];window.fromUuid=async()=>({isOwner:true});
 document.querySelector('#card').innerHTML=areaContent({scene:'s',kind:'explosive',ammoType:'poison',phase:'responses',special:true,settings:{},area:{},exchange:{title:'Poison Grenade',html:'<p>Native attack result: 18</p>',total:18},rows:[{uuid:'token',actor:'Actor.target',name:'Target',img:'',eligible:true,state:'hit',instant:s}]})+'<h3>Other reusable effects</h3>'+instantContent(newInstant('incendiary','Actor.target','Target'))+instantContent({...newInstant('flashbang','Actor.target','Target'),state:'applied',summary:'Damaged Eye and Damaged Ear: 1 minute'});
 await bindInstantControls(document.querySelector('#card'),scope=>scope==='token'?s:undefined,async(_scope,r)=>requests.push(r));
 const {styleChatButtons}=await import('/scripts/chat-buttons.js');styleChatButtons(document.querySelector('#card'));
 const app=new PIXI.Application({width:500,height:500,backgroundColor:0x222933,antialias:true});document.body.appendChild(app.view);
 const primary=new PIXI.Container();app.stage.addChild(primary);const grid=new PIXI.Graphics();grid.lineStyle(1,0x626970,.65);for(let n=0;n<=500;n+=100){grid.moveTo(n,0).lineTo(n,500);grid.moveTo(0,n).lineTo(500,n)}primary.addChild(grid);
 const cells=[];for(let x=0;x<5;x++)for(let y=0;y<5;y++)if(!(x>=3&&y<=1))cells.push([x*100,y*100,(x+1)*100,y*100,(x+1)*100,(y+1)*100,x*100,(y+1)*100]);
 window.smokeDoc={id:'smoke',parent:{id:'s'},flags:{'pneuma-combattools':{smoke:{cells,expires:60,created:0,source:'test'}}}};
 window.canvas={app,primary,scene:{id:'s',templates:[smokeDoc]}};const {registerSmoke}=await import('/scripts/aoe/smoke.js');registerSmoke();hooks.createMeasuredTemplate[0](smokeDoc);
 window.smokeContainer=primary.children[1];window.startX=smokeContainer.children[1].x;app.ticker.update(performance.now()+100);
 if(smokeContainer.children.length!==1+cells.length*3)throw Error('Missing affected-square smoke');
 const token=new PIXI.Graphics();token.beginFill(0x45a3cc).drawCircle(250,250,30).endFill();primary.addChild(token);
 });
 const poison=page.locator('[data-effect="poison"]');
 assert.equal(await poison.locator('strong').innerText(),'Poison DV13');
 assert.equal(await poison.locator('[data-instant-action="roll"]').innerText(),'Resist');
 assert.equal(await poison.locator('.fa-shield-halved').count(),1);
 assert.ok(!(await poison.innerText()).includes('Meat target'));
 assert.equal(await poison.locator('[data-instant-action="skip"]').getAttribute('data-chat-role'),'gm');
 await page.locator('[data-instant-action="skip"]').click();assert.equal(await page.evaluate(()=>requests[0].action),'skip');
 await page.waitForFunction(()=>smokeContainer.children[1].x!==startX);
 assert.equal(await page.locator('#card').evaluate(e=>e.scrollWidth<=e.clientWidth+2),true);
 await page.evaluate(()=>{
   smokeDoc.hidden=true;hooks.updateMeasuredTemplate.forEach(fn=>fn(smokeDoc));
   if(!smokeContainer.destroyed)throw Error('Hidden smoke still drawn');
   smokeDoc.hidden=false;hooks.updateMeasuredTemplate.forEach(fn=>fn(smokeDoc));
   smokeContainer=canvas.primary.children.find(c=>c.mask);
   if(!smokeContainer||smokeContainer.destroyed)throw Error('Restored smoke missing');
 });
 await page.evaluate(async()=>{
  const {instantContent,newInstant}=await import('/scripts/instant-effects.js');
  const result=document.createElement('section');result.id='inline-results';
  result.innerHTML='<h3>Jimbo</h3>'+instantContent({...newInstant('teargas','Actor.target','Jimbo'),state:'resisted',total:15,html:'<div class="rollcard">Resist Torture/Drugs: 9 + 6 = 15</div>'})+'<h3>Malina</h3>'+instantContent({...newInstant('teargas','Actor.target','Malina'),state:'failed',total:6,html:'<div class="rollcard">Resist Torture/Drugs: 2 + 4 = 6</div>'});
  document.querySelector('#card').replaceChildren(result);
  const {styleChatButtons}=await import('/scripts/chat-buttons.js');styleChatButtons(result);
 });
 const pendingButtons=page.locator('#inline-results [data-state="failed"] button');
 const applyBox=await pendingButtons.first().boundingBox(),gmBox=await pendingButtons.last().boundingBox();
 assert.equal(applyBox.y,gmBox.y,'Pending action and GM override fit on one line at chat width');
 await page.evaluate(async()=>{
  const {bindInstantControls,instantContent,newInstant}=await import('/scripts/instant-effects.js');
  const {masterStatuses}=await import('/scripts/status-catalog.js');
  const old=window.fromUuid,actor={isOwner:true,effects:[]};window.fromUuid=async()=>actor;
  for(const [id,name,effectName,action] of [['sleep','Unconscious','Sleep','wake'],['incendiary','On Fire (Mild)','On Fire (Mild)','extinguish']]){
   const state={...newInstant(id,'Actor.target','Target'),state:'applied'},root=document.createElement('div');
   actor.effects=[{name:effectName,statuses:new Set([masterStatuses.find(s=>s.name===name).id])}];
   root.innerHTML=instantContent(state);await bindInstantControls(root,()=>state,async()=>{});
   if(!root.querySelector('[data-instant-action="'+action+'"]'))throw Error('Active followup hidden');
   actor.effects=[];root.innerHTML=instantContent(state);await bindInstantControls(root,()=>state,async()=>{});
   if(root.querySelector('[data-instant-action="'+action+'"]'))throw Error('Stale followup still visible');
  }
  window.fromUuid=old;
 });
 const totals=page.locator('#inline-results summary');assert.equal(await totals.count(),2);
 assert.equal(await totals.nth(0).innerText(),'15');assert.equal(await totals.nth(1).innerText(),'6');
 assert.equal(await page.locator('#inline-results .rollcard').first().isVisible(),false);
 await totals.first().click();assert.equal(await page.locator('#inline-results .rollcard').first().isVisible(),true);
 await totals.first().press('Enter');assert.equal(await page.locator('#inline-results .rollcard').first().isVisible(),false);
 assert.equal(await page.locator('#card').evaluate(n=>n.scrollWidth<=n.clientWidth+2),true);
 await page.screenshot({path:resolve(tmpdir(),'pneuma-instant-smoke-preview.png')});
 await page.evaluate(()=>{hooks.canvasTearDown[0]();if(!smokeContainer.destroyed)throw Error('Smoke not destroyed on scene change');hooks.canvasReady[0]();if(canvas.primary.children.length!==3)throw Error('Smoke did not restore from scene data');});
 assert.deepEqual(errors,[]);console.log('Instant UI and PIXI smoke checks passed: compact cards, owner controls, animation, per-cell coverage, reload and teardown.');
}finally{await browser.close()}
