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
 const app=new PIXI.Application({width:500,height:500,backgroundColor:0x222933,antialias:true});document.body.appendChild(app.view);
 const primary=new PIXI.Container();app.stage.addChild(primary);const grid=new PIXI.Graphics();grid.lineStyle(1,0x626970,.65);for(let n=0;n<=500;n+=100){grid.moveTo(n,0).lineTo(n,500);grid.moveTo(0,n).lineTo(500,n)}primary.addChild(grid);
 const cells=[];for(let x=0;x<5;x++)for(let y=0;y<5;y++)if(!(x>=3&&y<=1))cells.push([x*100,y*100,(x+1)*100,y*100,(x+1)*100,(y+1)*100,x*100,(y+1)*100]);
 window.smokeDoc={id:'smoke',parent:{id:'s'},flags:{'pneuma-combattools':{smoke:{cells,expires:60,created:0,source:'test'}}}};
 window.canvas={app,primary,scene:{id:'s',templates:[smokeDoc]}};const {registerSmoke}=await import('/scripts/aoe/smoke.js');registerSmoke();hooks.createMeasuredTemplate[0](smokeDoc);
 window.smokeContainer=primary.children[1];window.startX=smokeContainer.children[1].x;app.ticker.update(performance.now()+100);
 if(smokeContainer.children.length!==1+cells.length*3)throw Error('Missing affected-square smoke');
 const token=new PIXI.Graphics();token.beginFill(0x45a3cc).drawCircle(250,250,30).endFill();primary.addChild(token);
 });
 await page.locator('[data-instant-action="skip"]').click();assert.equal(await page.evaluate(()=>requests[0].action),'skip');
 await page.waitForFunction(()=>smokeContainer.children[1].x!==startX);
 assert.equal(await page.locator('#card').evaluate(e=>e.scrollWidth<=e.clientWidth+2),true);
 await page.screenshot({path:resolve(tmpdir(),'pneuma-instant-smoke-preview.png')});
 await page.evaluate(()=>{hooks.canvasTearDown[0]();if(!smokeContainer.destroyed)throw Error('Smoke not destroyed on scene change');hooks.canvasReady[0]();if(canvas.primary.children.length!==3)throw Error('Smoke did not restore from scene data');});
 assert.deepEqual(errors,[]);console.log('Instant UI and PIXI smoke checks passed: compact cards, owner controls, animation, per-cell coverage, reload and teardown.');
}finally{await browser.close()}
