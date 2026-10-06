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
  if(path.startsWith('/systems/')||path.startsWith('/icons/'))return route.fulfill({status:404,body:''});
  const visual=path.startsWith('/visual/');
  const root=resolve(visual?'../PneumaVisualTools/dist':'dist'),file=resolve(root,"."+(visual?path.slice(7):path));assert.ok(file.startsWith(root));
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
  const {areaContent}=await import("/scripts/aoe/workflow.js");data.rows.forEach(row=>row.state="rolling");
  const root=document.querySelector("#card");root.innerHTML=areaContent(data);
  for(const f of hooks.renderChatMessage)await f(message,{0:root,find:s=>({toArray:()=>[...root.querySelectorAll(s)]})});
 });
 assert.equal(await page.locator('[data-aoe-row="owned"] [data-aoe-action="retryResponse"]').isDisabled(),true,'No locally saved roll is available on this client');
 assert.equal(await page.locator('[data-aoe-row="unowned"] button').count(),0,'Foreign response retries remain hidden');
 await page.evaluate(()=>data.rows.forEach(row=>row.state="waiting"));
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
  data.exchange.damage={status:"rolled",result:{html:"DAMAGE",values:{total:20,bonus:0,location:"body",ablation:1,ammo:"basic",ignorePercent:0,ignoreBelow:0,lethal:true}}};
  data.rows[0].damage={applications:['<div class="pneuma-damage-applied">Target damage result</div>']};
  document.querySelector('#card').innerHTML=areaContent(data);
 });
 assert.equal(await page.locator('[data-aoe-action="apply"] .fa-bolt').count(),2);
 assert.equal(await page.locator('[data-pneuma-section="damage-apply"]').count(),1);
 assert.equal(await page.locator('[data-pneuma-section="damage-roll"]').count(),1);
 assert.match(await page.locator('[data-pneuma-section="damage-roll"]').textContent(),/DAMAGE/);
 assert.equal(await page.locator('.pneuma-resolution-damage-apply .pneuma-aoe-applications .pneuma-damage-applied').count(),1);
 assert.equal(await page.locator('.pneuma-aoe-targets .pneuma-damage-applied').count(),0);
 await page.evaluate(async()=>{
  const {standardizeAreaLayout,areaContent}=await import('/scripts/aoe/workflow.js');
  const legacy=document.createElement('div');legacy.innerHTML='<section class="pneuma-aoe-card"><div class="pneuma-aoe-targets"><div class="pneuma-aoe-target" data-aoe-row="owned"><span class="pneuma-aoe-name">Target</span><button data-aoe-action="decline">Decline</button><button data-aoe-action="apply">Apply</button></div><div class="pneuma-instant-effect">Effect</div></div><div class="pneuma-damage-result"><span data-native-die>6</span></div><div class="pneuma-aoe-applications"><div class="pneuma-damage-applied">Receipt</div></div></section>';
  const die=legacy.querySelector('[data-native-die]'),apply=legacy.querySelector('[data-aoe-action="apply"]');standardizeAreaLayout(legacy);standardizeAreaLayout(legacy);
  if(legacy.querySelector('[data-native-die]')!==die || legacy.querySelector('[data-aoe-action="apply"]')!==apply)throw Error('Legacy native nodes were replaced');
  if(!apply.closest('.pneuma-resolution-damage-apply') || legacy.querySelector('.pneuma-aoe-targets .pneuma-instant-effect'))throw Error('Legacy lower ordering failed');
  const effectOnly=document.createElement('div');effectOnly.innerHTML=areaContent({...data,special:true,ammoType:'poison',exchange:{...data.exchange,damage:undefined},rows:[{...data.rows[0],state:'hit',instant:{id:'poison',actor:'actor',name:'Target',state:'pending'}}]});
  if(effectOnly.querySelector('.pneuma-aoe-targets [data-instant-action]') || !effectOnly.querySelector('.pneuma-resolution-effects [data-instant-action="roll"]'))throw Error('Effect-only resistance stayed in attack resolution');
  const completed=document.createElement('div');completed.innerHTML=areaContent({...data,rows:[{...data.rows[0],state:'hit',damage:{recordedApplied:true,applications:['<div class="pneuma-damage-applied">Receipt</div>']}}]});
  if(completed.querySelector('[data-aoe-action="apply"]') || !completed.querySelector('.pneuma-resolution-damage-apply .pneuma-damage-applied'))throw Error('Completed target duplicated controls or lost its receipt');
 });
 assert.equal(await page.locator('.pneuma-aoe-targets [data-aoe-action="apply"]').count(),0);
 assert.equal(await page.locator('.pneuma-resolution-damage-apply [data-aoe-action="apply"]').count(),2);
 assert.equal(await page.evaluate(()=>document.querySelector('[data-pneuma-section="damage-roll"]').getBoundingClientRect().bottom <= document.querySelector('[data-pneuma-section="damage-apply"]').getBoundingClientRect().top),true);
 const combined=await page.evaluate(async()=>{
  const {arrangeAreaEffectControls}=await import('/scripts/instant-effects.js');
  const {areaContent}=await import('/scripts/aoe/workflow.js');const {styleChatButtons}=await import('/scripts/chat-buttons.js');
  const host=document.createElement('div');host.id='inline-layout-check';host.className='pneuma-combat-message';document.body.append(host);
  const result=[];
  for(const width of [260,300,400])for(const state of ['pending','failed','applied','resisted']){
    host.style.width=width+'px';host.innerHTML=areaContent({...data,rows:[{...data.rows[0],damage:undefined,state:'hit',instant:{id:'poison',actor:'actor',name:'Target',state,total:state==='pending'?undefined:12}}]});arrangeAreaEffectControls(host);styleChatButtons(host);
    const row=host.querySelector('.pneuma-aoe-resolution-target');
    const controls=[row.querySelector(':scope > img'),row.querySelector('[data-aoe-action="apply"]'),...row.querySelectorAll(':scope > .pneuma-aoe-target-gm > button')];
    const centers=controls.map(el=>{const r=el.getBoundingClientRect();return r.y+r.height/2;});
    const effect=row.querySelector('.pneuma-aoe-inline-effect'),effectRect=effect.getBoundingClientRect();
    if(effectRect.top<controls[0].getBoundingClientRect().bottom||getComputedStyle(effect).borderLeftWidth!=='3px'||getComputedStyle(effect.querySelector('strong')).position==='absolute')throw Error('Effect must be a named colored row below damage');
    const effectCenters=[...effect.querySelectorAll('.pneuma-effect-application,.pneuma-effect-resistance,.pneuma-effect-gm-slot')].filter(el=>el.getBoundingClientRect().height).map(el=>{const r=el.getBoundingClientRect();return r.y+r.height/2;});
    if(Math.max(...effectCenters)-Math.min(...effectCenters)>2)throw Error('Effect controls misaligned');
    result.push({width,state,centers,rects:controls.map(el=>el.getBoundingClientRect().toJSON()),oneLine:Math.max(...centers)-Math.min(...centers)<2,overflow:row.scrollWidth>row.clientWidth,
      portrait:!!row.querySelector(':scope > img'),apply:!!row.querySelector('[data-aoe-action="apply"]'),
      total:state==='pending'||getComputedStyle(row.querySelector('.pneuma-effect-resistance strong, .pneuma-effect-resistance summary')).position!=='absolute'});
  }
  return result;
 });
 for(const row of combined){assert.equal(row.oneLine,true,JSON.stringify(row));assert.equal(row.overflow,false,JSON.stringify(row));assert.equal(row.total,true);}
 await page.locator('#inline-layout-check').screenshot({path:'docs/aoe-combined-row-check.png'});
 await page.locator('#inline-layout-check').evaluate(el=>el.remove());

 await page.evaluate(async()=>{
  const {areaContent}=await import('/scripts/aoe/workflow.js');
  document.querySelector('#card').innerHTML=areaContent({...data,phase:'scatter',rows:[],exchange:{...data.exchange,damage:undefined}});
  const {styleChatButtons}=await import('/scripts/chat-buttons.js');styleChatButtons(document.querySelector('#card'));
 });
 assert.equal(await page.locator('[data-aoe-action="scatter"]').innerText(),'Place New Target Center');
 assert.equal(await page.locator('[data-aoe-action="scatter"]').evaluate(el=>el.classList.contains('pneuma-chat-icon')),false);
 await page.screenshot({path:process.env.TEMP+'/pct-aoe-scatter.png'});
 await page.evaluate(async()=>{
  window.draws=0;window.destroyed=0;window.clipCalls=0;
  class Graphics {clear(){return this}lineStyle(){return this}beginFill(){return this}drawPolygon(){draws++;return this}endFill(){return this}destroy(){destroyed++}}
  window.PIXI={Graphics,Point:class {constructor(x,y){this.x=x;this.y=y}},Polygon:class{constructor(points){this.points=points}},Circle:class{}};
  window.CONFIG={Canvas:{polygonBackends:{move:{create:(_o,c)=>{clipCalls++;return c.boundaryShapes[0]}},sight:{create:(_o,c)=>c.boundaryShapes[0]}}}};
  window.canvas={stage:{addChild(){},worldTransform:{applyInverse:p=>p}},app:{view:document.querySelector("canvas"),screen:{width:380,height:300}}};
  canvas.scene={grid:{size:100,distance:2}};canvas.templates={preview:{addChild(){}}};
  class Document {constructor(data){Object.assign(this,data)}updateSource(data){Object.assign(this,data)}}
  class Template {
   constructor(document){window.previewDocument=document;this.document=document;this.template=new Graphics();this.isVisible=true;this.hasPreview=false;this.renderFlags={set:()=>{for(const f of hooks.refreshMeasuredTemplate)f(this)}}}
   async draw(){this.renderFlags.set({});return this}highlightGrid(){}destroy(){destroyed++}
  }
  CONFIG.MeasuredTemplate={documentClass:Document,objectClass:Template};
  window.ui={notifications:{info(){}}};
  const {placeArea}=await import("/scripts/aoe/placement.js");
  window.startPreview=()=>{window.previewResult="pending";window.previewPromise=placeArea(p=>({shape:"square",origin:p,direction:0,length:100,width:100}),{x:100,y:100},"Choose a new center inside the gray area.","#ef9b36",p=>p.x<200).then(r=>previewResult=r)};
  const highlight={visible:true};canvas.interface={grid:{getHighlightLayer:()=>highlight}};
  const template={document:{hidden:true,x:0,y:0,flags:{"pneuma-combattools":{areaShape:data.area}}},isVisible:true,hasPreview:false,visible:true,template:new Graphics(),highlightGrid(){}};
  for(const f of hooks.refreshMeasuredTemplate)f(template);
  if(template.visible||highlight.visible)throw Error("Hidden area still visible to GM");
  template.document.hidden=false;
  for(const f of hooks.refreshMeasuredTemplate)f(template);
  if(!template.visible||!highlight.visible)throw Error("Revealed area stayed hidden");
  template.document.object=template;template.document.hidden=true;
  for(const f of hooks.updateMeasuredTemplate)f(template.document);
  // Native GM refreshState can restore visible; renderable must still block it.
  template.visible=true;highlight.visible=true;
  if(template.renderable||highlight.renderable)throw Error("Hidden GM blast can render after state refresh");
  template.document.hidden=false;
  for(const f of hooks.updateMeasuredTemplate)f(template.document);
  if(!template.renderable||!highlight.renderable)throw Error("Manual reveal failed");
  window.hudCleared=0;canvas.hud={token:{clear(){hudCleared++;}}};
  startPreview();
 });
 assert.equal(await page.locator('.pneuma-area-placement').count(),1);
 assert.equal(await page.evaluate(()=>hudCleared),1);
 assert.match(await page.locator('.pneuma-area-placement').innerText(),/Right-click \/ Esc: cancel/);
 await page.locator('canvas').dispatchEvent('pointermove',{clientX:120,clientY:120});
 assert.equal(await page.evaluate(()=>previewDocument.fillColor),'#ef9b36');
 await page.locator('canvas').dispatchEvent('pointermove',{clientX:300,clientY:120});
 assert.equal(await page.evaluate(()=>previewDocument.hidden),true);
 await page.locator('canvas').dispatchEvent('pointerdown',{clientX:300,clientY:120,button:0});
 assert.equal(await page.evaluate(()=>previewResult),'pending');
 await page.locator('canvas').dispatchEvent('pointermove',{clientX:120,clientY:120});
 assert.equal(await page.evaluate(()=>previewDocument.hidden),false);
 await page.screenshot({path:process.env.TEMP+'/pct-aoe-placement.png'});
 await page.keyboard.press("Escape");
 assert.equal(await page.locator('.pneuma-area-placement').count(),0);
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
 await page.evaluate(async()=>{
  game.user={id:'gm',isGM:true};game.users=[{id:'gm',active:true,isGM:true}];let deleted;
  game.scenes={get:()=>({templates:{has:id=>['blast','aim'].includes(id)},deleteEmbeddedDocuments:async(_type,ids)=>{deleted=ids}})};
  const msg={flags:{'pneuma-combattools':{aoe:{scene:'s',templateId:'blast',aimTemplateId:'aim'}}}};
  for(const fn of hooks.deleteChatMessage??[])fn(msg);
  await Promise.resolve();if(JSON.stringify(deleted)!==JSON.stringify(['blast','aim']))throw Error('Original aim marker not cleaned up');
 });
 await page.evaluate(async()=>{
  const {areaContent}=await import('/scripts/aoe/workflow.js');
  const root=document.querySelector('#card') ?? Object.assign(document.body.appendChild(document.createElement('div')),{id:'card'});
  fromUuid=async uuid=>({actor:{...targetActor,testUserPermission:()=>uuid==='owned'}});
  data.ammoType=undefined;data.special=false;data.kind='explosive';data.phase='responses';data.exchange.damage=undefined;data.effectsResolved=false;
  const row={uuid:'owned',actor:'actor',name:'Player',img:'',eligible:true,state:'hit'};data.rows=[row];
  const render=async()=>{root.innerHTML=areaContent(data);for(const fn of hooks.renderChatMessage??[])await fn(message,{0:root,find:s=>({toArray:()=>[...root.querySelectorAll(s)]})});};
  await render();
  const reset=root.querySelector('[data-aoe-action="reset"]');
  if(!reset||reset.textContent.trim()||!reset.querySelector('.fa-rotate-left')||reset.title!=='Reset Player Action'||reset.getAttribute('aria-label')!=='Reset Player Action'||reset.disabled||!reset.closest('.pneuma-aoe-target-gm'))throw Error('Missing direct GM reset');
  if(root.querySelector('[data-aoe-action="exclude"], [data-aoe-action="forcehit"]'))throw Error('Old GM override remains after response');
  const {styleChatButtons}=await import('/scripts/chat-buttons.js');styleChatButtons(root);
  if(reset.textContent.trim()||!getComputedStyle(reset,'::before').content.includes('GM'))throw Error('Direct reset must keep GM badge and tooltip');
  for(const kind of ['explosive','suppression'])for(const width of [260,310,380]){
    data.kind=kind;row.coverUp=kind==='explosive';root.style.width=width+'px';await render();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const reset=root.querySelector('[data-aoe-action="reset"]');
    if(reset.closest('details')||!reset.getBoundingClientRect().height)throw Error('GM action must be directly visible');
    const name=root.querySelector('.pneuma-aoe-name').getBoundingClientRect(),button=reset.getBoundingClientRect();
    if(button.top>name.bottom||button.bottom<name.top)throw Error('Reset left player line: '+kind+' '+width);
    const description=root.querySelector('.pneuma-aoe-response-description').getBoundingClientRect();
    if(description.top<button.bottom-1)throw Error('Description must be below player controls');
  }
  data.kind='explosive';delete row.coverUp;root.style.width='';
  row.state='waiting';await render();
  if(root.querySelector('[data-aoe-action="reset"]')||!root.querySelector('[data-aoe-action="exclude"]')||!root.querySelector('[data-aoe-action="decline"]'))throw Error('Original choices not restored');
  row.state='hit';row.damage={status:'applying'};await render();
  if(!root.querySelector('[data-aoe-action="reset"]').disabled)throw Error('Applied work must not reset');
  data.exchange.title='Very long custom grenade weapon name '.repeat(5);root.style.width='260px';await render();
  const heading=root.querySelector('.pneuma-attack-name');
  if(heading.title!==data.exchange.title||getComputedStyle(heading).textOverflow!=='ellipsis'||heading.scrollWidth<=heading.clientWidth)throw Error('Long heading must truncate with full tooltip');
  game.user={id:'def',isGM:false};await render();
  if(root.querySelector('[data-aoe-action="reset"]'))throw Error('Player sees GM reset');
 });
 await page.evaluate(async()=>{
  const {createInstantCard,renderInstantEffects}=await import('/scripts/instant-effects.js');
  const root=document.querySelector('#card');game.user={id:'gm',isGM:true};
  let serial=0;foundry.utils.randomID=()=>String(++serial);
  message.whisper=[];message.blind=false;
  message.update=async changes=>{for(const [key,value]of Object.entries(changes)){let out=message;const parts=key.split('.');for(const part of parts.slice(0,-1))out=out[part]??={};out[parts.at(-1)]=structuredClone(value);}};
  const actor={uuid:'Actor.poison',name:'Poison <target>',isOwner:true};fromUuid=async()=>actor;
  await createInstantCard(actor,'poison',message,{combatId:null});
  await createInstantCard({...actor,uuid:'Actor.other',name:'Other'},'biotoxin',message,{combatId:null});
  const entries=Object.values(message.flags['pneuma-combattools'].attachedEffects);
  entries[0].effect.state='resisted';entries[0].effect.total=17;
  root.innerHTML='<div class="message-content"><div class="original-attack">Attack and damage</div></div>';
  for(let i=0;i<2;i++)await renderInstantEffects(message,{0:root});
  if(root.querySelectorAll('.pneuma-attached-effects').length!==2||!root.querySelector('.original-attack'))throw Error('Attached effects lost or duplicated original card');
  if(root.querySelector('.pneuma-attached-target h4').textContent!=='Poison <target>'||root.querySelector('.pneuma-attached-target target'))throw Error('Effect target escaping or repeated Effects label');
  if(!root.querySelector('[data-effect-state="resisted"][aria-label*="Resisted"]')||!root.querySelector('[data-instant-action="roll"]'))throw Error('Independent effect states');
  root.innerHTML='<div class="original-attack">Updated damage</div>';await renderInstantEffects(message,{0:root});
  if(root.querySelectorAll('.pneuma-attached-effects').length!==2)throw Error('Effects did not survive parent content update');
  game.user={id:'player',isGM:false};message.blind=true;root.innerHTML='';await renderInstantEffects(message,{0:root});
  if(root.querySelector('.pneuma-attached-effects'))throw Error('Blind effect leaked');
 });
 await page.evaluate(async()=>{
  const {areaContent}=await import('/scripts/aoe/workflow.js');
  CONFIG.statusEffects=[];
  const actor={uuid:'Actor.repeat',isOwner:true,items:[],effects:[]};fromUuid=async()=>({actor});game.user={id:'gm',isGM:true};
  const fixture={...data,exchange:{...data.exchange,attacker:actor.uuid,damage:{status:'rolled',result:{html:'<span>Damage 10</span>',values:{total:10,ignorePercent:0}}}},rows:[]};
  const card={id:'repeat-card',visible:true,isContentVisible:true,flags:{'pneuma-combattools':{aoe:fixture}}};
  const host=document.createElement('div');host.innerHTML=areaContent(fixture);document.body.append(host);
  const wrapper={0:host,find:s=>({toArray:()=>[...host.querySelectorAll(s)]})};
  for(let i=0;i<3;i++)for(const render of hooks.renderChatMessage)await render(card,wrapper);
  if(host.querySelectorAll('.pneuma-aoe-effects-picker button').length!==3)throw Error('Repeated AoE rendering duplicates effect picker slots');
  host.remove();
 });
 for(const file of ['chat-cards.css','chat-hub.css','chat-theme.css'])await page.addStyleTag({content:await readFile(resolve('../PneumaVisualTools/dist',file),'utf8')});
 await page.evaluate(async()=>{
  const {damageContent}=await import('/scripts/damage-flow.js');
  const {renderInstantEffects}=await import('/scripts/instant-effects.js');
  const host=document.createElement('div');document.body.append(host);
  const exchange={state:'resolved',hit:true,ranged:true,defenderName:'Ranged target',damage:{status:'applied',result:{html:'<div>Damage 10</div>',values:{total:10,ignorePercent:0}},applications:['<div class="pneuma-damage-applied">10 damage applied</div>']}};
  const target={uuid:'Actor.rangedTarget',name:'Ranged target',isOwner:true,effects:[],testUserPermission:()=>true,toggleStatusEffect:async(id)=>{window.rangedApplied??=[];rangedApplied.push(id);}};
  game.user={id:'gm',isGM:true,active:true};game.users=[game.user];game.users.get=id=>game.users.find(user=>user.id===id);fromUuid=async()=>target;
  foundry.utils.deepClone=value=>structuredClone(value);CONFIG.statusEffects=[{id:'prone',name:'Prone'}];
  const card={id:'ranged-card',visible:true,isContentVisible:true,blind:false,whisper:[],flags:{'pneuma-combattools':{exchange,attachedEffects:{rangedEffect:{effect:{id:'status',statusId:'prone',actor:target.uuid,name:target.name,state:'failed',encounter:{combatId:null}},rollMode:'roll'}}}}};
  card.update=async changes=>{for(const [key,value]of Object.entries(changes)){let out=card;const parts=key.split('.');for(const part of parts.slice(0,-1))out=out[part]??={};out[parts.at(-1)]=structuredClone(value);}};
  game.messages=new Map([[card.id,card]]);window.rangedApplied=[];window.rangedErrors=[];ui.notifications.error=error=>rangedErrors.push(error);
  host.innerHTML='<div class="message-content">'+damageContent(exchange)+'</div>';
  await renderInstantEffects(card,{0:host});
  const apply=host.querySelector('[data-instant-action="apply"]');
  if(!apply||!apply.getBoundingClientRect().height||!host.querySelector('.pneuma-damage-effect-results .pneuma-attached-effects'))throw Error('Normal ranged effect Apply is hidden or mounted outside its result slot');
  apply.click();for(let i=0;i<12;i++)await new Promise(resolve=>setTimeout(resolve,0));
  if(JSON.stringify(rangedApplied)!==JSON.stringify(['prone'])||rangedErrors.length||card.flags['pneuma-combattools'].attachedEffects.rangedEffect.effect.state!=='applied')throw Error('Ranged effect click did not apply: '+JSON.stringify({applied:rangedApplied,errors:rangedErrors}));
  await renderInstantEffects(card,{0:host});
  if(host.querySelector('[data-instant-action="apply"]')||!host.querySelector('.pneuma-effect-complete'))throw Error('Ranged effect completion did not render');
  host.remove();
 });
 await page.evaluate(async()=>{
  const {areaContent}=await import('/scripts/aoe/workflow.js');
  const {instantContent,arrangeAreaEffectControls,bindInstantControls,renderInstantEffects}=await import('/scripts/instant-effects.js');
  const {installRollPopovers}=await import('/visual/chat-presentation.js');
  const {styleChatButtons}=await import('/scripts/chat-buttons.js');
  const host=document.createElement('div');document.body.replaceChildren(host);
  game.user={id:'gm',isGM:true};message.blind=false;
  const priorGet=game.settings.get;game.settings.get=(module,key)=>module==='pneuma-visualtools'?false:priorGet(module,key);
  const actor={uuid:'Actor.poison',name:'Poison',isOwner:true};fromUuid=async()=>actor;
  for(const skin of ['technical','cyberpunk'])for(const width of [260,300,400])for(const state of ['pending','failed','applied','resisted','skipped','review','rolling']){
    host.className='chat-message pneuma-chat-card pneuma-theme-'+skin;host.style.width=width+'px';
    const effect={id:'poison',actor:actor.uuid,name:'A long target name',state,total:['pending','rolling'].includes(state)?undefined:12};
    const fixture={...data,special:true,ammoType:'poison',exchange:{...data.exchange,title:'Poison Grenade',damage:undefined},rows:[{...data.rows[0],uuid:'owned',actor:actor.uuid,damage:undefined,instant:effect,state:'hit'}]};
    host.innerHTML='<div class="message-content pvt-full-section">'+areaContent(fixture)+'</div>';
    arrangeAreaEffectControls(host);installRollPopovers(host);styleChatButtons(host);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const row=host.querySelector('.pneuma-aoe-resolution-target');
    const effectRow=row.querySelector('.pneuma-aoe-inline-effect');
    const centers=[...effectRow.querySelectorAll('.pneuma-effect-resistance,.pneuma-effect-application,.pneuma-effect-gm-slot')].filter(el=>el.getBoundingClientRect().height).map(el=>{const r=el.getBoundingClientRect();return r.y+r.height/2;});
    if(effectRow.getBoundingClientRect().top<row.querySelector(':scope > img').getBoundingClientRect().bottom||getComputedStyle(effectRow.querySelector('strong')).position==='absolute')throw Error('Named effect must sit below target line');
    if(Math.max(...centers)-Math.min(...centers)>2||row.scrollWidth>row.clientWidth)throw Error('Skinned row alignment: '+skin+' '+width+' '+state);
    const gm=effectRow.querySelector('.pneuma-effect-gm-slot'),application=effectRow.querySelector('.pneuma-effect-application');
    const rightmost=gm.querySelector('button')?gm:application;
    if(Math.abs(rightmost.getBoundingClientRect().right-effectRow.getBoundingClientRect().right)>1)throw Error('GM button or result must sit at the right edge: '+skin+' '+width+' '+state);
    if(!gm.querySelector('button')&&gm.getBoundingClientRect().width)throw Error('Empty GM slot must not reserve space');
    if(row.querySelectorAll('.pneuma-effect-gm-controls').length>1||row.querySelector('[data-instant-action="extinguish"]'))throw Error('Duplicate menu or extinguish');
    for(const override of row.querySelectorAll('.pneuma-effect-gm-controls button'))if(override.closest('details')||!override.getBoundingClientRect().height||!getComputedStyle(override,'::before').content.includes('GM'))throw Error('GM action must be visible without a submenu');
  }
  // Move live controls repeatedly without dropping listeners or effect scope.
  const effect={id:'poison',actor:actor.uuid,name:'Target',state:'failed'};
  host.innerHTML='<div class="message-content pvt-full-section"><div class="pneuma-aoe-resolution-target" data-aoe-row="owned" data-aoe-actor="'+actor.uuid+'"><img><span class="pneuma-aoe-name">Target</span><div class="pneuma-aoe-target-damage"></div><div class="pneuma-aoe-target-effects">'+instantContent(effect,'owned',true)+'</div></div></div>';
  const requests=[];
  await bindInstantControls(host,()=>effect,async()=>requests.push(['stale']));
  await bindInstantControls(host,()=>effect,async(scope,req)=>requests.push([scope,req.action]));
  const skip=host.querySelector('[data-instant-action="skip"]');
  const legacyMenu=document.createElement('details');legacyMenu.className='pneuma-effect-gm-controls';skip.before(legacyMenu);legacyMenu.innerHTML='<summary>GM</summary><div></div>';legacyMenu.querySelector('div').append(skip);
  arrangeAreaEffectControls(host);arrangeAreaEffectControls(host);skip.click();await Promise.resolve();
  if(JSON.stringify(requests)!==JSON.stringify([['owned','skip']])||host.querySelectorAll('.pneuma-effect-gm-controls').length!==1)throw Error('Moved GM handler changed');
  message.flags['pneuma-combattools'].attachedEffects={first:{effect,rollMode:'roll'}};
  for(let i=0;i<3;i++)await renderInstantEffects(message,{0:host});
  if(host.querySelectorAll('[data-attached-effect="first"][data-instant-action="skip"]').length!==1)throw Error('Attached GM controls duplicated');
  game.user={id:'player',isGM:false};await renderInstantEffects(message,{0:host});
  if(host.querySelector('[data-attached-effect="first"][data-instant-action="skip"]'))throw Error('Attached GM action leaked to player');
  const playerEffect=host.querySelector('.pneuma-attached-effects .pneuma-aoe-inline-effect');
  if(playerEffect.querySelector('.pneuma-effect-gm-slot').getBoundingClientRect().width||Math.abs(playerEffect.querySelector('.pneuma-effect-application').getBoundingClientRect().right-playerEffect.getBoundingClientRect().right)>1)throw Error('Player action must reach the right edge without a reserved GM cell');
  // Several effects on one target retain separate borders, names and GM menus.
  game.user={id:'gm',isGM:true};host.style.width='260px';
  message.flags['pneuma-combattools'].attachedEffects={first:{effect:{...effect,id:'emp',state:'pending'},rollMode:'roll'},second:{effect:{...effect,id:'incendiary'},rollMode:'roll'},third:{effect:{...effect,id:'sleep',state:'pending'},rollMode:'roll'}};
  await renderInstantEffects(message,{0:host});installRollPopovers(host);styleChatButtons(host);
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const effects=[...host.querySelectorAll('.pneuma-aoe-inline-effect')];
  if(effects.length!==4||effects.some(row=>row.scrollWidth>row.clientWidth||!row.querySelector('strong')||row.querySelectorAll('.pneuma-effect-gm-controls').length!==1))throw Error('Multiple effects lost their independent rows '+JSON.stringify(effects.map(row=>({width:row.clientWidth,scroll:row.scrollWidth,gm:row.querySelectorAll('.pneuma-effect-gm-controls').length,html:row.innerHTML}))));
  for(let i=1;i<effects.length;i++)if(effects[i].getBoundingClientRect().top<effects[i-1].getBoundingClientRect().bottom)throw Error('Effect rows overlap');
  if(effects[2].querySelector('.pneuma-effect-resistance'))throw Error('Skill-less fire must not show Resist');
  for(const apply of host.querySelectorAll('.pneuma-effect-apply'))if(getComputedStyle(apply).whiteSpace!=='nowrap'||apply.querySelector('span')?.getBoundingClientRect().height>28)throw Error('Apply label must stay on one line '+JSON.stringify({whiteSpace:getComputedStyle(apply).whiteSpace,height:apply.querySelector('span')?.getBoundingClientRect().height}));
  if(host.querySelector('details.pneuma-effect-gm-controls, details.pvt-target-controls'))throw Error('GM submenu remains');
  for(const skin of ['technical','cyberpunk']){
    host.className='chat-message pneuma-chat-card pneuma-theme-'+skin;
    const glyph=host.querySelector('.pneuma-effect-glyph');
    if(getComputedStyle(glyph).filter==='none'||skin==='technical'&&getComputedStyle(glyph).filter!=='brightness(0)')throw Error('Light-theme glyphs must be dark; Hub glyphs need a contrasting tint');
  }
  host.id='effect-rows-check';
 });
 await page.locator('#effect-rows-check').screenshot({path:'docs/aoe-effect-rows-check.png'});
 await page.evaluate(async()=>{
  const {instantContent}=await import('/scripts/instant-effects.js');
  const {installRollPopovers}=await import('/visual/chat-presentation.js');
  const host=document.querySelector('#effect-rows-check');
  const {arrangeInlineRollDetails}=await import('/scripts/inline-roll.js');
  const native='<section class="rollcard"><div class="rollcard-top"><div class="cpr-block"><div class="text-normal">Resist Torture/Drugs</div><div class="text-small">Skill</div></div></div><div class="d10-rollcard-data"><div class="d10-dice-div"><img src="/icons/d10.svg" alt="6"></div><div class="d10-number-div">6</div><div class="d10-data-div"><div class="d10-data-details hide" style="display:none">Roll: 1 + WILL: 3 + Skill: 2 = 6</div></div></div></section>';
  for(const skin of ['technical','cyberpunk'])for(const width of [260,300,400]){
    host.className='chat-message pneuma-chat-card pneuma-theme-'+skin;host.style.width=width+'px';
    host.innerHTML='<div class="message-content pvt-full-section">'+instantContent({id:'poison',actor:'actor',name:'Target',state:'applied',total:6,html:native,damage:9,damageHTML:'<span>Damage calculation</span>'},'owned',true)+instantContent({id:'poison',actor:'other',name:'Other',state:'failed',total:6,html:native},'other',true)+'</div>';
    arrangeInlineRollDetails(host);installRollPopovers(host);
    const row=host.querySelector('.pneuma-aoe-inline-effect'),roll=row.querySelector('.pneuma-effect-resistance > details'),summary=roll.querySelector('summary'),details=document.getElementById(summary.getAttribute('aria-controls'));
    if(summary.dataset.pvtPopover==='true'||roll.open||details.getBoundingClientRect().height)throw Error('Resistance must start collapsed without a hover popup: '+JSON.stringify({skin,width,popup:summary.dataset.pvtPopover,open:roll.open,hidden:details.hidden,display:getComputedStyle(details).display,height:details.getBoundingClientRect().height}));
    summary.click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));installRollPopovers(host);
    const r=row.getBoundingClientRect(),d=details.getBoundingClientRect(),label=row.querySelector('strong').getBoundingClientRect();
    if(!roll.open||d.width<r.width-12||d.top<label.bottom||row.scrollWidth>row.clientWidth)throw Error('Resistance expansion must span the area beneath its row: '+JSON.stringify({skin,width,row:r.toJSON(),details:d.toJSON()}));
    for(const graphic of details.querySelectorAll('img,.d10-dice-div,.d10-number-div'))if(graphic.getBoundingClientRect().height)throw Error('Expanded resistance must be text only');
    const calculation=details.querySelector('.pneuma-calculation-text');
    if(!calculation.getBoundingClientRect().height||!calculation.textContent.includes('WILL: 3'))throw Error('Native calculation data lost');
    if(host.querySelectorAll('.pneuma-effect-resistance > details[open]').length!==1)throw Error('Expansion affected another target');
    summary.click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(details.getBoundingClientRect().height)throw Error('Resistance did not collapse');
  }
  host.className='chat-message pneuma-chat-card pneuma-theme-technical';host.style.width='300px';host.querySelector('.pneuma-effect-resistance > details').open=true;
 });
 await page.locator('#effect-rows-check').screenshot({path:'docs/aoe-resistance-expansion-check.png'});
 await page.evaluate(async()=>{
  const {areaContent}=await import('/scripts/aoe/workflow.js');
  const {compactDamageApplication}=await import('/scripts/damage-application.js');
  const {installRollPopovers}=await import('/visual/chat-presentation.js');
  const {instantContent}=await import('/scripts/instant-effects.js');
  const host=document.querySelector('#effect-rows-check');
  const native='<div class="rollcard"><span class="clickable" data-action="toggleVisibility" data-visible-element="d6-data-details">32</span><div class="d6-data-details hide"><div class="text-normal">Damage Rolled: 27</div><div class="text-normal">Reduced By Armor: 0</div><div class="text-normal">Critical Damage: +5</div><hr><div class="text-normal">HP Reduced By: 32</div></div><a data-action="reverseDamage" title="Reverse damage">↶</a></div>';
  const localize=game.i18n.localize;game.i18n.localize=key=>key==='CPR.global.location.body'?'Body':localize(key);
  const rows=['Rage','Yamm itation','Calli'].map((name,index)=>({...data.rows[0],uuid:'receipt-'+index,actor:'Actor.receipt'+index,name,state:'hit',instant:undefined,damage:{status:'applied',recordedApplied:true,applications:[compactDamageApplication(native,name,'body','receipt-'+index)]}}));
  host.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-action="toggleVisibility"]');if(!trigger)return;
    host.querySelectorAll('.'+trigger.dataset.visibleElement).forEach(el=>el.classList.toggle('hide'));
  });
  for(const skin of ['native','technical','cyberpunk'])for(const width of [260,300,400]){
    host.className='chat-message pneuma-combat-message'+(skin==='native'?'':' pneuma-chat-card pneuma-theme-'+skin);host.style.width=width+'px';
    host.innerHTML='<div class="message-content pvt-full-section">'+areaContent({...data,special:false,ammoType:undefined,exchange:{...data.exchange,damage:{status:'applied',result:{html:'<span>Shared damage 27</span>',values:{total:27,ignorePercent:0}}}},rows})+'</div>';
    for(const target of host.querySelectorAll('.pneuma-aoe-resolution-target'))target.querySelector('.pneuma-aoe-target-effects').innerHTML=instantContent({id:'incendiary',actor:target.dataset.aoeActor,name:'Target',state:'applied'},'',true)+instantContent({id:'biotoxin',actor:target.dataset.aoeActor,name:'Target',state:'applied',total:9,damage:11,damageHTML:'<span>3d6 = 11; direct HP damage</span>'},'',true);
    const {arrangeInlineRollDetails}=await import('/scripts/inline-roll.js');arrangeInlineRollDetails(host);
    if(skin!=='native')installRollPopovers(host);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const targets=[...host.querySelectorAll('.pneuma-aoe-resolution-target')],target=targets[0],total=target.querySelector('.pneuma-applied-number'),details=target.querySelector('.pneuma-applied-details'),portrait=target.querySelector(':scope > img'),name=target.querySelector('.pneuma-aoe-name');
    const lineBefore=portrait.getBoundingClientRect();
    if(total.dataset.pvtPopover==='true'||details.getBoundingClientRect().height)throw Error('Applied total must use collapsed native expansion');
    total.click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const r=target.getBoundingClientRect(),d=details.getBoundingClientRect(),t=total.getBoundingClientRect(),n=name.getBoundingClientRect();
    if(d.width<r.width-2||d.left>r.left+2||d.top<lineBefore.bottom||Math.abs(portrait.getBoundingClientRect().top-lineBefore.top)>1||n.top<t.top-10||n.top>t.bottom)throw Error('Receipt must expand below a stable full-width target line: '+JSON.stringify({skin,width,before:lineBefore.toJSON(),after:portrait.getBoundingClientRect().toJSON(),target:r.toJSON(),details:d.toJSON(),total:t.toJSON(),name:n.toJSON()}));
    if(targets.slice(1).some(row=>row.querySelector('.pneuma-applied-details').getBoundingClientRect().height))throw Error('Receipt expansion changed another target');
    if(!target.querySelector('.pneuma-damage-applied-row [data-action="reverseDamage"]'))throw Error('Native Undo must remain beside applied total');
    const effects=[...target.querySelectorAll('.pneuma-aoe-inline-effect')];
    const effect=effects[1],label=effect.querySelector('strong'),damage=effect.querySelector('.pneuma-instant-damage');
    const resistance=effect.querySelector('.pneuma-effect-resistance').getBoundingClientRect(),damageRect=damage.getBoundingClientRect();
    if(Math.abs(damageRect.top+damageRect.height/2-resistance.top-resistance.height/2)>1||damageRect.left<resistance.right||!damage.textContent.startsWith('Damage'))throw Error('Resistance and effect damage must share one line');
    const fireStatus=effects[0].querySelector('.pneuma-effect-application').getBoundingClientRect(),toxinStatus=effect.querySelector('.pneuma-effect-application').getBoundingClientRect();
    if(Math.abs(fireStatus.right-toxinStatus.right)>1||Math.abs(fireStatus.right-effect.getBoundingClientRect().right)>1)throw Error('Completed skill-less and resisted effect statuses must align at the right edge');
    if(Math.abs(target.querySelector('.pneuma-damage-applied-row').getBoundingClientRect().right-r.right)>1)throw Error('Damage result must not reserve an empty GM column');
    damage.querySelector('summary').click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const breakdown=document.getElementById(damage.querySelector('summary').getAttribute('aria-controls')).getBoundingClientRect();
    if(breakdown.width<effect.clientWidth-12||breakdown.top<damage.querySelector('summary').getBoundingClientRect().bottom)throw Error('Effect damage breakdown must expand beneath the full effect row: '+JSON.stringify({skin,width,breakdown:breakdown.toJSON(),effect:effect.getBoundingClientRect().toJSON(),summary:damage.querySelector('summary').getBoundingClientRect().toJSON()}));
    if(host.scrollWidth>host.clientWidth)throw Error('Completed resolution overflows '+skin+' '+width+' '+JSON.stringify([...host.querySelectorAll('*')].filter(n=>{const b=n.getBoundingClientRect(),h=host.getBoundingClientRect();return b.width&&b.right>h.right+1}).map(n=>({cls:n.className,text:n.textContent.slice(0,70),box:n.getBoundingClientRect().toJSON()}))));
    total.click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(details.getBoundingClientRect().height)throw Error('Receipt must collapse on a second click');
  }
  host.className='chat-message pneuma-combat-message pneuma-chat-card pneuma-theme-technical';host.style.width='300px';host.querySelector('.pneuma-applied-number').click();
 });
 await page.locator('#effect-rows-check').screenshot({path:'docs/aoe-applied-details-check.png'});
 await page.evaluate(async()=>{
  const {styleChatButtons}=await import('/scripts/chat-buttons.js');
  const host=document.querySelector('#effect-rows-check');
  const icon='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path fill="white" d="M11 1 3 10h5l-1 7 8-10h-5z"/></svg>');
  for(const skin of ['native','technical','cyberpunk']){
    host.className='chat-message pneuma-combat-message'+(skin==='native'?'':' pneuma-chat-card pneuma-theme-'+skin);
    host.innerHTML='<button type="button" class="pneuma-damage-status-slot"><img src="'+icon+'" alt="EMP"></button>';
    styleChatButtons(host);
    const button=host.querySelector('button'),img=button.querySelector('img'),imageStyle=getComputedStyle(img),buttonStyle=getComputedStyle(button);
    if(imageStyle.backgroundColor!=='rgba(0, 0, 0, 0)'||imageStyle.borderWidth!=='0px'||imageStyle.boxShadow!=='none')throw Error('Effect selection image must be a transparent glyph, not a filtered rectangle: '+skin);
    if(skin!=='cyberpunk'&&(imageStyle.filter!=='brightness(0)'||buttonStyle.backgroundColor==='rgb(51, 51, 51)'))throw Error('Dark effect glyph needs a light themed button: '+skin);
    if(skin==='cyberpunk'&&!imageStyle.filter.includes('invert'))throw Error('Hub effect glyph must retain its contrasting tint');
    if(!img.complete)await new Promise(resolve=>img.addEventListener('load',resolve,{once:true}));
    if(!img.naturalWidth)throw Error('Transparent status asset did not load');
  }
 });
 await page.evaluate(async()=>{
  const {registerCombatResolution}=await import('/scripts/combat-resolution.js');
  const previous=(hooks.renderChatMessage??[]).length;registerCombatResolution();
  const render=hooks.renderChatMessage.slice(previous);
  const fixture={state:'resolved',cannotEvade:'Target cannot evade',disableSource:'microwaver',attackerName:'Source',defenderName:'Target'};
  const card={id:'override',visible:true,flags:{'pneuma-combattools':{exchange:fixture}}};
  const host=document.createElement('div');host.innerHTML='<div class="message-sender"></div><div class="pneuma-cannot-evade">Target cannot evade</div>';document.body.append(host);
  const wrapper={0:host,find:s=>{const nodes=[...host.querySelectorAll(s)];return {length:nodes.length,text:value=>nodes.forEach(node=>node.textContent=value),append:node=>nodes[0]?.append(node)};}};
  game.user={id:'gm',isGM:true};
  for(let i=0;i<3;i++)for(const callback of render)await callback(card,wrapper);
  if(host.querySelectorAll('.pneuma-evasion-override').length!==1)throw Error('Repeated exchange render duplicated Allow evasion');
  game.user={id:'player',isGM:false};for(const callback of render)await callback(card,wrapper);
  if(host.querySelector('.pneuma-evasion-override'))throw Error('Saved Allow evasion leaked to a player');
  host.remove();
 });
 console.log("AoE browser checks passed, including both VisualTools skins, effect states, right-aligned actions without reserved GM space and live GM handlers; exchange override rerender checks passed.");
}finally{await browser.close();}
