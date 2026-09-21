import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||"playwright");
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
 const page=await browser.newPage({viewport:{width:380,height:700}});
 await page.route("http://aoe.test/**",async route=>{
  const path=new URL(route.request().url()).pathname.replace("/modules/pneuma-combattools/","/");
  if(path==="/")return route.fulfill({contentType:"text/html",body:'<div id="card"></div><canvas width="380" height="300" style="width:380px;height:300px"></canvas>'});
  const root=resolve("dist"),file=resolve("dist","."+path);assert.ok(file.startsWith(root));
  await route.fulfill({contentType:path.endsWith(".png")?"image/png":"text/javascript",body:await readFile(file)});
 });
 await page.goto("http://aoe.test/");
 await page.addStyleTag({content:await readFile("dist/styles/pneuma-combattools.css","utf8")});
 await page.evaluate(async()=>{
  window.FormApplication=class {activateListeners(){}};window.hooks={};window.Hooks={on:(k,f)=>{(hooks[k]??=[]).push(f);return 1},once(){},off(){}};
  window.foundry={data:{fields:{ObjectField:class{}}},utils:{getProperty:(o,p)=>p.split(".").reduce((v,k)=>v?.[k],o)}};
  window.game={user:{id:"def",isGM:false},users:[],modules:new Map(),settings:{get:()=>({coverUp:false}),register(){},registerMenu(_m,_k,config){window.SettingsForm=config.type}},i18n:{localize:k=>k}};
  window.targetActor={items:[],effects:[],system:{stats:{ref:{value:8}}}};
  window.fromUuid=async uuid=>({actor:{...targetActor,testUserPermission:()=>uuid==="owned"}});
  const {areaContent,registerAreaAttacks}=await import("/scripts/aoe/workflow.js");
  window.data={scene:"s",kind:"explosive",phase:"responses",area:{shape:"square",origin:{x:50,y:50},direction:0,length:500,width:500},
   settings:{coverUp:true,evade:"raw"},exchange:{title:"Grenade <unsafe>",html:'<div class="rollcard">ATTACK</div>',total:20},
   rows:[{uuid:"owned",actor:"actor",name:"Target & Ally",img:"",eligible:true,state:"waiting"},{uuid:"unowned",actor:"other",name:"NPC",img:"",eligible:false,state:"waiting"}]};
  window.message={id:"message",visible:true,isContentVisible:true,flags:{"pneuma-combattools":{aoe:data}}};
  document.querySelector("#card").innerHTML=areaContent(data);registerAreaAttacks();
  const root=document.querySelector("#card");const html={0:root,find:s=>({toArray:()=>[...root.querySelectorAll(s)]})};
  for(const f of hooks.renderChatMessage??[])await f(message,html);
 });
 assert.equal(await page.locator('[data-aoe-row="owned"] button[data-aoe-action="roll"]').count(),1);
 assert.equal(await page.locator('[data-aoe-row="unowned"] button').count(),0);
 assert.equal(await page.locator('[data-aoe-action="other"]').count(),0);
 assert.equal(await page.locator('[data-aoe-action="scatter"], [data-aoe-action="add"]').count(),0);
 assert.equal(await page.locator("#card").textContent().then(s=>s.includes("ATTACK")),false);
 assert.equal(await page.locator("#card unsafe").count(),0);
 assert.equal(await page.evaluate(()=>document.querySelector("#card").scrollWidth<=380),true);
 assert.equal(await page.locator('[data-aoe-action="show"]').count(),0);
 const evade=page.locator('[data-aoe-row="owned"] button[data-aoe-action="roll"]');
 assert.equal(await evade.isEnabled(),true);
 await page.evaluate(async()=>{
  targetActor.items=[{type:"criticalInjury",name:"Dismembered Leg"}];
  const root=document.querySelector("#card"),{areaContent}=await import("/scripts/aoe/workflow.js");root.innerHTML=areaContent(data);
  for(const f of hooks.renderChatMessage)await f(message,{0:root,find:s=>({toArray:()=>[...root.querySelectorAll(s)]})});
 });
 assert.equal(await evade.isDisabled(),true);assert.match(await evade.getAttribute("title"),/Dismembered Leg/);
 await page.evaluate(async()=>{
  targetActor.items=[];const root=document.querySelector("#card"),{areaContent}=await import("/scripts/aoe/workflow.js");root.innerHTML=areaContent(data);
  for(const f of hooks.renderChatMessage)await f(message,{0:root,find:s=>({toArray:()=>[...root.querySelectorAll(s)]})});
 });
 assert.equal(await evade.isEnabled(),true);

 await page.evaluate(async()=>{
  fromUuid=async()=>null;
  const {areaContent}=await import("/scripts/aoe/workflow.js");data.areaHidden=true;game.user.isGM=true;
  const root=document.querySelector("#card");root.innerHTML=areaContent(data);
  for(const f of hooks.renderChatMessage)await f(message,{find:s=>({toArray:()=>[...root.querySelectorAll(s)]})});
 });
 assert.equal(await page.locator('[data-aoe-action="show"][aria-label="Show attack area"]').count(),1);
 await page.evaluate(async()=>{
  const {areaContent}=await import("/scripts/aoe/workflow.js");
  data.rows.forEach(r=>r.state="hit");
  data.exchange.html='<div class="rollcard"><span data-native-dice>20</span><a data-action="rollDamage"><i class="fas fa-droplet"></i></a></div>';
  document.querySelector('#card').innerHTML=areaContent(data);
 });
 assert.equal(await page.locator('.pneuma-aoe-attack [data-action="rollDamage"]').count(),0);
 assert.equal(await page.locator('[data-native-dice]').textContent(),'20');
 assert.equal(await page.locator('[data-aoe-action="damage"] .fa-droplet').count(),1);
 await page.evaluate(async()=>{
  const {areaContent}=await import("/scripts/aoe/workflow.js");
  data.exchange.damage={status:"rolled",result:{html:"DAMAGE"}};
  data.rows[0].damage={applications:['<div class="pneuma-damage-applied">Target damage result</div>']};
  document.querySelector('#card').innerHTML=areaContent(data);
 });
 assert.equal(await page.locator('[data-aoe-action="apply"] .fa-bolt').count(),2);
 assert.equal(await page.locator('[data-pneuma-section="damage-apply"]').count(),0);
 assert.equal(await page.locator('[data-pneuma-section="damage-roll"]').count(),1);
 assert.match(await page.locator('[data-pneuma-section="damage-roll"]').textContent(),/DAMAGE/);
 assert.equal(await page.locator('.pneuma-damage-result + .pneuma-aoe-applications .pneuma-damage-applied').count(),1);
 assert.equal(await page.locator('.pneuma-aoe-targets .pneuma-damage-applied').count(),0);
 await page.evaluate(async()=>{
  window.draws=0;window.destroyed=0;window.clipCalls=0;
  class Graphics {clear(){return this}lineStyle(){return this}beginFill(){return this}drawPolygon(){draws++;return this}endFill(){return this}destroy(){destroyed++}}
  window.PIXI={Graphics,Point:class {constructor(x,y){this.x=x;this.y=y}},Polygon:class{constructor(points){this.points=points}},Circle:class{}};
  window.CONFIG={Canvas:{polygonBackends:{move:{create:(_o,c)=>{clipCalls++;return c.boundaryShapes[0]}},sight:{create:(_o,c)=>c.boundaryShapes[0]}}}};
  window.canvas={stage:{addChild(){},worldTransform:{applyInverse:p=>p}},app:{view:document.querySelector("canvas"),screen:{width:380,height:300}}};
  canvas.scene={grid:{size:100,distance:2}};canvas.templates={preview:{addChild(){}}};
  class Document {constructor(data){Object.assign(this,data)}updateSource(data){Object.assign(this,data)}}
  class Template {
   constructor(document){this.document=document;this.template=new Graphics();this.isVisible=true;this.hasPreview=false;this.renderFlags={set:()=>{for(const f of hooks.refreshMeasuredTemplate)f(this)}}}
   async draw(){this.renderFlags.set({});return this}highlightGrid(){}destroy(){destroyed++}
  }
  CONFIG.MeasuredTemplate={documentClass:Document,objectClass:Template};
  window.ui={notifications:{info(){}}};
  const {placeArea}=await import("/scripts/aoe/placement.js");
  window.startPreview=()=>{window.previewResult="pending";window.previewPromise=placeArea(p=>({shape:"square",origin:p,direction:0,length:100,width:100}),{x:100,y:100},"Place").then(r=>previewResult=r)};
  const highlight={visible:true};canvas.interface={grid:{getHighlightLayer:()=>highlight}};
  const template={document:{hidden:true,x:0,y:0,flags:{"pneuma-combattools":{areaShape:data.area}}},isVisible:true,hasPreview:false,visible:true,template:new Graphics(),highlightGrid(){}};
  for(const f of hooks.refreshMeasuredTemplate)f(template);
  if(template.visible||highlight.visible)throw Error("Hidden area still visible to GM");
  template.document.hidden=false;
  for(const f of hooks.refreshMeasuredTemplate)f(template);
  if(!template.visible||!highlight.visible)throw Error("Revealed area stayed hidden");
  startPreview();
 });
 await page.keyboard.press("Escape");
 assert.equal(await page.evaluate(()=>previewResult),null);
 assert.equal(await page.evaluate(()=>destroyed),1);
 await page.evaluate(()=>startPreview());
 await page.locator("canvas").click({position:{x:150,y:150}});
 const placed=await page.evaluate(()=>({result:previewResult,destroyed,clipCalls}));
 assert.equal(placed.result.shape,"square");assert.equal(placed.destroyed,2);assert.ok(placed.clipCalls>=2);
 await page.evaluate(()=>startPreview());
 await page.locator("canvas").click({button:"right",position:{x:100,y:100}});
 assert.equal(await page.evaluate(()=>previewResult),null);
 assert.equal(await page.evaluate(()=>destroyed),3);
 await page.evaluate(()=>{
  const form=document.createElement("form");document.body.append(form);
  form.innerHTML=['shell','blast','suppression'].map(prefix=>'<select name="'+prefix+'Shape"><option>square</option><option>cone</option><option>ray</option><option>raw</option></select>'+['Size','Width','Angle','Range'].map(key=>'<div class="form-group" style="display:flex"><input name="'+prefix+key+'" value="45"></div>').join('')).join('')+'<div class="form-group"><input name="corridorMax" value="40"></div>';
  form.insertAdjacentHTML("beforeend",'<output data-area-summary="shell"></output><button type="button" data-area-field="shellAngle" data-area-value="90">90°</button><button type="button" data-area-field="shellWidth" data-area-value="1">1 square</button>');
  window.settingsEditor=new SettingsForm();settingsEditor.activateListeners({0:form});
  const visible=name=>getComputedStyle(form.querySelector('[name="'+name+'"]').parentElement).display!=="none";
  if(!visible("shellSize")||visible("shellAngle")||visible("shellWidth"))throw Error("Square settings visibility");
  const selector=form.querySelector('[name="shellShape"]');selector.value="cone";selector.dispatchEvent(new Event("change"));
  if(visible("shellSize")||!visible("shellAngle")||!visible("shellRange")||visible("shellWidth"))throw Error("Cone settings visibility");
  selector.value="ray";selector.dispatchEvent(new Event("change"));
  if(!visible("shellWidth")||!visible("shellRange")||visible("shellAngle"))throw Error("Ray settings visibility");
  if(form.querySelector('[name="shellAngle"]').value!=="45")throw Error("Inactive shape values were lost");
  form.querySelector('[data-area-field="shellWidth"]').click();
  if(!form.querySelector('output').value.includes("1-square ray"))throw Error("Ray preset summary");
  selector.value="cone";selector.dispatchEvent(new Event("change"));form.querySelector('[data-area-field="shellAngle"]').click();
  if(!form.querySelector('output').value.includes("90° cone"))throw Error("Cone preset summary");
 });
 await page.evaluate(async()=>{
  let saved;game.settings.set=async(_m,_k,data)=>{saved=data};game.user.isGM=true;
  const original=settingsEditor.getData();
  if(original.profiles.length!==3)throw Error("Missing attack editor section");
  await settingsEditor._updateObject(new Event("submit"),{...original,shellShape:"cone",shellAngle:90,blastShape:"circle",blastRadius:7});
  if(saved.shellAngle!==90||saved.blastRadius!==7||saved.shellShape!=="cone")throw Error("Settings save");
  game.settings.get=()=>saved;
  const reopened=new SettingsForm().getData();
  if(reopened.profiles[0].angle!==90||reopened.profiles[1].radius!==7)throw Error("Settings reopen");
 });
 if(process.env.PNEUMA_HANDLEBARS_SOURCE){
  await page.addScriptTag({path:process.env.PNEUMA_HANDLEBARS_SOURCE});
  const template=await readFile("dist/templates/area-settings.hbs","utf8");
  await page.evaluate(template=>{
   Handlebars.registerHelper("checked",v=>v?"checked":"");
   Handlebars.registerHelper("selectOptions",(choices,options)=>new Handlebars.SafeString(Object.entries(choices).map(([value,label])=>'<option value="'+Handlebars.escapeExpression(value)+'" '+(value===options.hash.selected?'selected':'')+'>'+Handlebars.escapeExpression(label)+'</option>').join('')));
   window.openAreaEditor=()=>{
    const app=new SettingsForm();const host=document.createElement("div");host.id="rendered-area-editor";host.style.cssText="width:580px;height:660px";
    host.innerHTML=Handlebars.compile(template)(app.getData());document.body.replaceChildren(host);app.activateListeners({0:host});
   };
   const button=document.createElement("button");button.id="open-editor";button.textContent="Configure";button.onclick=openAreaEditor;document.body.replaceChildren(button);
  },template);
  await page.locator("#open-editor").click();
  assert.equal(await page.locator('[data-area-profile]').count(),3);
  assert.equal(await page.locator('[data-area-profile][open]').count(),1);
  assert.equal(await page.locator('[name="blastShape"]').isVisible(),false);
  await page.locator('[data-area-profile="blast"] > summary').click();
  assert.equal(await page.locator('[name="blastShape"]').isVisible(),true);
  await page.locator('[name="blastShape"]').selectOption("square");
  assert.equal(await page.locator('[name="blastRadius"]').isVisible(),false);
  assert.equal(await page.locator('[name="blastSize"]').isVisible(),true);
  await page.locator('[data-area-profile="blast"] > summary').click();
  assert.match(await page.locator('[data-area-summary="blast"]').textContent(),/square/);

  assert.equal(await page.locator('[name="evade"] option').count(),3);
  assert.deepEqual(await page.locator('[name="blastShape"] option').allTextContents(),["Square","Circle"]);
  assert.equal(await page.locator('[name="shellDV"], [name="evadeTies"]').count(),0);
  await page.locator('[name="shellShape"]').selectOption("cone");
  await page.locator('[data-area-field="shellAngle"][data-area-value="45"]').click();
  assert.match(await page.locator('[data-area-summary="shell"]').textContent(),/45° cone/);
  assert.equal(await page.locator('button[type="submit"]').isVisible(),true);
 }
 console.log("AoE browser checks passed: owner controls, Cover Up hiding, compact escaped markup, wall-polygon preview, place/cancel cleanup.");
}finally{await browser.close();}
