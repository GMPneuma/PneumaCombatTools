import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:900,height:700}});
 // Document hooks coalesce rendering into the next animation frame.
 const evaluate=page.evaluate.bind(page);
 page.evaluate=async (...args)=>{const result=await evaluate(...args);await evaluate(()=>new Promise(requestAnimationFrame));return result;};
 await page.setContent('<style>body{margin:0}#hud{position:absolute;inset:0;pointer-events:none;transform-origin:0 0}.placeable-hud input,.placeable-hud .control-icon{background:rgba(0,0,0,.6);border:1px solid #333;color:white;box-shadow:0 0 10px #000;border-radius:3px}</style><div id="hud"></div>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({content:await readFile(process.env.PNEUMA_PIXI_SOURCE,'utf8')});
 await page.evaluate(()=>{
  const app=new PIXI.Application({width:900,height:700,backgroundColor:0x777777});document.body.prepend(app.view);
  app.stage.eventMode='static';app.stage.hitArea=new PIXI.Rectangle(0,0,900,700);
  const layer=new PIXI.Container();layer.eventMode='static';app.stage.addChild(layer);
  const token=new PIXI.Container();token.eventMode='static';token.interactiveChildren=false;token.hitArea=new PIXI.Rectangle(0,0,100,100);token.position.set(400,300);layer.addChild(token);
  token.addChild(new PIXI.Graphics().beginFill(0x224466).drawRect(0,0,100,100).endFill());
  const nativeArrow=new PIXI.Text('↶');nativeArrow.eventMode='static';nativeArrow.position.set(105,-30);token.addChild(nativeArrow);
  app.renderer.render(app.stage);const boundary=new PIXI.EventBoundary(app.stage);
  window.oldArrowReachable=boundary.hitTest(510,280)===nativeArrow;
  token.removeChild(nativeArrow);nativeArrow.destroy();
  window.hooks={};window.Hooks={on:(n,f)=>(hooks[n]??=[]).push(f),once(){}};
  window.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  const scene={id:'scene',grid:{distance:2,units:'m'},tokens:[],flags:{}};
  const participant={id:'p',tokenId:'t'};const combat={id:'c',scene,active:true,started:true,round:1,turn:0,turns:[participant],combatants:[participant]};
  const record={combat:'c',turn:'p:1',start:{x:100,y:200,elevation:5},spent:3};
  const doc={id:'t',uuid:'Scene.scene.Token.t',parent:scene,x:400,y:300,elevation:5,flags:{'pneuma-combattools':{movement:record}}};
  // This HUD fixture applies positions immediately; animation/source divergence is covered in movement.test.mjs.
  Object.defineProperty(doc,'_source',{get:()=>({x:doc.x,y:doc.y,elevation:doc.elevation})});
  token.document=doc;token.actor={system:{derivedStats:{walk:{value:12}}}};token.w=100;token.h=100;token.isOwner=true;token.isPreview=false;
  token.tooltip={text:'',style:{}};token.getCenterPoint=p=>({x:p.x+50,y:p.y+50});token.checkCollision=()=>false;doc.object=token;
  window.movementEnabled=true;window.movementSetting=undefined;window.writes=[];doc.update=async(data,options)=>{
   writes.push({data,options});if(window.rejectNext){window.rejectNext=false;throw Error('Update rejected');}
   for(const fn of hooks.preUpdateToken)fn(doc,data,options);
   for(const [key,value]of Object.entries(data)){if(key==='flags.pneuma-combattools.movement')doc.flags['pneuma-combattools'].movement=value;else doc[key]=value;}
   token.position.set(doc.x,doc.y);for(const fn of hooks.updateToken)fn(doc);return doc;
  };
  scene.tokens.push(doc);window.token=token;window.doc=doc;window.app=app;
  window.canvas={app,activeLayer:layer,tokens:layer,hud:{element:[document.getElementById('hud')]},grid:{type:1,size:100},scene};layer.placeables=[token];
  window.CONST={GRID_TYPES:{SQUARE:1}};window.ui={notifications:{error:text=>window.error=text,warn:text=>window.error=text}};
  window.game={combat,combats:Object.assign(new Map([['c',combat]]),{find(fn){return [...this.values()].find(fn);}}),user:{id:'gm',isGM:true},users:[{id:'gm',active:true,isGM:true}],settings:{register:(_module,key,config)=>{if(key==='movementTracking')window.movementSetting=config;},get:()=>window.movementEnabled}};
 });
 const rules=(await readFile('dist/scripts/combat-bar-state.js','utf8')).replace('const MODULE = '+JSON.stringify('pneuma-combattools')+';','')+'\n'+await readFile('dist/scripts/movement-rules.js','utf8');
 const movement=(await readFile('dist/scripts/movement.js','utf8')).replace(/^import .*;\s*/gm,'');
 await page.addScriptTag({type:'module',content:rules+'\nconst grappleFor=()=>undefined;const movementEntry=()=>undefined;const areaSettings=()=>({evadeMove:false});\n'+movement+'\nregisterMovement();hooks.refreshToken.forEach(fn=>fn(token));'});
 const counter=page.locator('.pneuma-movement-hud input'),reset=page.getByRole('button',{name:'Reset',exact:true});
 await reset.waitFor();assert.equal(await page.evaluate(()=>oldArrowReachable),false,'Original token-child arrow must reproduce the missed hit');
 assert.deepEqual(await page.evaluate(()=>({name:movementSetting.name,scope:movementSetting.scope,default:movementSetting.default})),{name:'Enable movement counters',scope:'world',default:true});
 await page.evaluate(()=>{movementEnabled=false;movementSetting.onChange();});assert.equal(await page.locator('.pneuma-movement-hud').count(),0);
 await page.evaluate(()=>{movementEnabled=true;movementSetting.onChange();});
 assert.equal(await counter.inputValue(),'3 / 6');assert.equal(await counter.evaluate(n=>getComputedStyle(n).fontSize),'24px');
 // Inspect rendered bounds before the deferred redraw: animation must never carry the origin along.
 assert.deepEqual(await page.evaluate(()=>{
  const marker=canvas.tokens.children.find(c=>c.name==='pneuma-movement');
  const bounds=()=>{const b=marker.getBounds();return [b.x,b.y,b.width,b.height];};
  const initial=bounds(),samples=[];
  for(let x=410;x<=700;x+=10){token.x=x;hooks.refreshToken.forEach(fn=>fn(token));samples.push(JSON.stringify(bounds())===JSON.stringify(initial));}
  token.position.set(400,300);
  app.stage.position.set(30,20);app.stage.scale.set(1.2);
  const zoomed=bounds();app.stage.position.set(0,0);app.stage.scale.set(1);
  return {fixed:samples.every(Boolean),panZoom:Math.abs(zoomed[0]-(initial[0]*1.2+30))<0.01&&Math.abs(zoomed[1]-(initial[1]*1.2+20))<0.01,interactive:marker.eventMode};
 }),{fixed:true,panZoom:true,interactive:'none'});
 // Drag previews get independent scene-space markers and remove them when the preview is destroyed.
 await page.evaluate(()=>{
  const preview=new PIXI.Container();
  Object.assign(preview,{document:{...doc,x:600,y:400},actor:token.actor,w:100,h:100,isOwner:true,isPreview:true,_original:token,tooltip:token.tooltip,getCenterPoint:token.getCenterPoint,checkCollision:()=>false});
  preview.position.set(600,400);canvas.tokens.addChild(preview);window.preview=preview;
  hooks.refreshToken.forEach(fn=>fn(preview));
 });
 assert.equal(await page.evaluate(()=>canvas.tokens.children.filter(c=>c.name==='pneuma-movement').length),2);
 assert.equal(await page.evaluate(()=>{
  const markers=canvas.tokens.children.filter(c=>c.name==='pneuma-movement');const before=markers.map(c=>c.getBounds().x);
  preview.x+=100;hooks.refreshToken.forEach(fn=>fn(preview));
  return markers.every((c,i)=>c.getBounds().x===before[i]);
 }),true);
 await page.evaluate(()=>{hooks.destroyToken.forEach(fn=>fn(preview));preview.destroy();});
 assert.equal(await page.evaluate(()=>canvas.tokens.children.filter(c=>c.name==='pneuma-movement').length),1);
 const run=page.locator('.pneuma-movement-run');
 for(const [spent,color,isRun] of [[6,'rgb(111, 220, 122)',false],[7,'rgb(255, 212, 90)',true],[12,'rgb(255, 212, 90)',true],[13,'rgb(255, 102, 102)',true],[3,'rgb(111, 220, 122)',false]]){
  await page.evaluate(spent=>{doc.flags['pneuma-combattools'].movement.spent=spent;hooks.refreshToken.forEach(fn=>fn(token));},spent);
  assert.equal(await counter.evaluate(n=>getComputedStyle(n).color),color);
  assert.equal(await run.isVisible(),isRun);
  if(isRun){assert.match(await counter.getAttribute('title'),/uses your Action/);const runBox=await run.boundingBox(),countBox=await counter.boundingBox(),resetBox=await reset.boundingBox();assert(runBox.y>=countBox.y+countBox.height);assert.equal(runBox.y,resetBox.y);assert(runBox.x>=resetBox.x+resetBox.width);assert.equal(runBox.height,26);assert.equal(resetBox.height,26);}
 }
 await page.screenshot({path:process.env.TEMP+'/pneuma-movement-sizing.png'});
 const inputBox=await counter.boundingBox(),resetBox=await reset.boundingBox();assert(resetBox.y>=inputBox.y+inputBox.height);
 await reset.click();await page.waitForFunction(()=>doc.x===100&&doc.y===200&&doc.flags['pneuma-combattools'].movement.spent===0&&!document.querySelector('.pneuma-movement-hud'));
 assert.equal(await counter.count(),0);assert.equal(await page.evaluate(()=>canvas.tokens.children.some(c=>c.name==='pneuma-movement')),false);assert.equal(await page.evaluate(()=>writes.length),1);
 assert.equal(await page.evaluate(()=>writes[0].options.pneumaMoveDelta),-6);
 // The native #hud transform moves/scales both boxes; mouse clicks still hit the Reset control.
 await page.evaluate(()=>{doc.x=400;token.x=400;doc.flags['pneuma-combattools'].movement.spent=2;doc.flags['pneuma-combattools'].movement.hidden=false;document.getElementById('hud').style.transform='translate(30px,20px) scale(1.2)';hooks.refreshToken.forEach(fn=>fn(token));});
 await reset.click();await page.waitForFunction(()=>doc.x===100&&!document.querySelector('.pneuma-movement-hud'));assert.equal(await counter.count(),0);
 await page.evaluate(async()=>{await doc.update({x:200},{});});assert.equal(await counter.inputValue(),'1 / 6');
 await page.evaluate(()=>{rejectNext=true;});await reset.click();await page.waitForFunction(()=>window.error?.includes('Update rejected'));assert.equal(await reset.isEnabled(),true);
 await page.evaluate(()=>{token.isOwner=false;hooks.refreshToken.forEach(fn=>fn(token));});assert.equal(await reset.isVisible(),false);
 await page.evaluate(()=>{game.user={id:'viewer',isGM:false};token.actor.uuid='Actor.pc';token.actor.hasPlayerOwner=true;hooks.refreshToken.forEach(fn=>fn(token));});
 assert.equal(await counter.isVisible(),true,'Players can see another player-owned token counter');
 assert.equal(await reset.isVisible(),false,'Only owners can reset');
 await page.evaluate(()=>{token.actor.hasPlayerOwner=false;hooks.updateActor.forEach(fn=>fn(token.actor));});
 assert.equal(await page.locator('.pneuma-movement-hud').count(),0,'NPC counter hidden from players');
 assert.equal(await page.evaluate(()=>canvas.tokens.children.some(c=>c.name==='pneuma-movement')),false,'NPC start marker hidden too');
 await page.evaluate(()=>{game.user.isGM=true;hooks.updateUser.forEach(fn=>fn(game.user));});
 assert.equal(await counter.isVisible(),true,'GM can see NPC counters');
 await page.evaluate(()=>{game.user.isGM=false;token.actor.hasPlayerOwner=true;token.isOwner=true;hooks.updateActor.forEach(fn=>fn(token.actor));});
 assert.equal(await reset.isVisible(),true,'Owner retains reset');
 assert.equal(await page.evaluate(()=>{const marker=canvas.tokens.children.find(c=>c.name==='pneuma-movement');token.visible=false;hooks.refreshToken.forEach(fn=>fn(token));return marker.visible;}),false,'Visibility updates synchronously before queued drawing');
 assert.equal(await page.locator('.pneuma-movement-hud').count(),0,'Invisible tokens never reveal counters');
 await page.evaluate(()=>{token.visible=true;hooks.refreshToken.forEach(fn=>fn(token));});
 await page.evaluate(()=>hooks.destroyToken.forEach(fn=>fn(token)));assert.equal(await page.locator('.pneuma-movement-hud').count(),0);
 assert.equal(await page.evaluate(()=>canvas.tokens.children.some(c=>c.name==='pneuma-movement')),false);
 await page.evaluate(()=>hooks.refreshToken.forEach(fn=>fn(token)));
 await page.evaluate(()=>hooks.canvasTearDown.forEach(fn=>fn()));
 assert.equal(await page.evaluate(()=>canvas.tokens.children.some(c=>c.name==='pneuma-movement')),false,'Scene teardown removes detached markers');
 console.log('Movement UI checks passed: reproduced old hit failure, real clicks reset position/counter, larger stacked boxes, pan/zoom, failed-update retry, ownership and cleanup.');
} finally {await browser.close();}
