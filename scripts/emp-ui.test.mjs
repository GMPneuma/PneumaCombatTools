import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 const root=resolve('dist');
 await page.route('http://pneuma.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/')return route.fulfill({contentType:'text/html',body:'<style>.control-icon{width:32px;height:32px;border:1px solid}</style><body><div id="hud"><div class="col right"></div></div></body>'});
  const file=resolve(root,'.'+path.replace('/modules/pneuma-combattools/','/'));assert(file.startsWith(root+sep));
  await route.fulfill({contentType:file.endsWith('.png')?'image/png':'text/javascript',body:await readFile(file)});
 });
 await page.goto('http://pneuma.test/');
 await page.evaluate(()=>{
  const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
  window.FormApplication=class{activateListeners(){}};window.behavior={};window.menus={};window.settingConfigs={};window.hooks={};window.Hooks={once:(n,f)=>(hooks[n]??=[]).push(f),on:(n,f)=>(hooks[n]??=[]).push(f)};
  let serial=0;window.foundry={data:{fields:{ObjectField:class{}}},utils:{getProperty:get,randomID:()=>String(++serial)}};
  window.gm={id:'gm',isGM:true,active:true};window.owner={id:'owner',isGM:false,active:true};
  window.actor={uuid:'Actor.a',name:'Actor <test>',isOwner:true,items:[{id:'a',name:'Cyberarm <img src=x onerror=alert(1)>',type:'cyberware',system:{isInstalledInActor:true,isFoundational:true}},{id:'b',name:'Option',type:'cyberware',system:{isInstalledInActor:true,installedIn:['a']}}],testUserPermission:u=>u.id==='owner'};
  window.canvas={scene:{id:'s'}};window.combat={id:'c',active:true,scene:{id:'s'},combatants:[{actor,token:{uuid:'Scene.s.Token.a',parent:{id:'s'}}}],started:true,flags:{},async update(changes){for(const [p,v]of Object.entries(changes)){const parts=p.split('.');let node=this;for(const part of parts.slice(0,-1))node=node[part]??={};node[parts.at(-1)]=structuredClone(v);}}};
  const users=Object.assign([gm,owner],{get:id=>[gm,owner].find(u=>u.id===id)});
  window.game={user:gm,users,combat,combats:new Map([['c',combat]]),settings:{register:(_m,k,c)=>settingConfigs[k]=c,registerMenu:(_m,k,c)=>menus[k]=c,get:(_m,k)=>k==='empBehavior'?behavior:''},messages:new Map()};
  window.fromUuid=async()=>actor;window.messages=[];
  window.ChatMessage={create:async data=>{const message={...data,id:'m'+messages.length};messages.push(message);game.messages.set(message.id,message);return message;}};
  window.ui={notifications:{info:text=>{window.info=text;},warn:text=>{window.warning=text;},error:text=>{window.failure=text;}}};
  window.Dialog=class{constructor(data){this.data=data;}render(){document.querySelector('.dialog')?.remove();const root=document.createElement('section');root.className='dialog';root.innerHTML=this.data.content;for(const [id,config]of Object.entries(this.data.buttons)){const button=document.createElement('button');button.dataset.button=id;button.textContent=config.label;button.onclick=()=>config.callback?.([root]);root.append(button);}document.body.append(root);return this;}};
  window.wrap=element=>({0:element,length:element?1:0,find:selector=>wrap(element?.querySelector(selector)),first(){return this;},append(node){element?.append(node);}});
 });
 await page.addScriptTag({type:'module',content:'import {registerEmp,chooseEmp,configureEmp,createEmp} from "/scripts/emp.js"; Object.assign(window,{chooseEmp,configureEmp,createEmp});registerEmp();window.loaded=true;'});
 await page.waitForFunction(()=>window.loaded);
 await page.evaluate(()=>(hooks.renderTokenHUD??[]).forEach(f=>f({object:{actor}},wrap(document.getElementById('hud')))));
 assert.equal(await page.locator('[title="EMP: disable cyberware"]').count(),0);
 await page.evaluate(()=>configureEmp(actor));
 assert.equal(await page.locator('select[name="mode"] option').count(),4);
 await page.selectOption('select[name="chooser"]','player');await page.locator('[data-button="create"]').click();
 await page.waitForFunction(()=>messages.length===1);
 assert.deepEqual(await page.evaluate(()=>messages[0].whisper),['gm','owner']);
 assert(!await page.evaluate(()=>messages[0].content.includes('<test>')));
 await page.evaluate(async()=>{game.user=owner;window.request=Object.values(combat.flags['pneuma-combattools'].empRequests)[0];await chooseEmp(combat,request);});
 assert.equal(await page.locator('.pneuma-emp-choice').count(),2);assert.equal(await page.locator('.pneuma-emp-choice img').count(),0);
 assert.match(await page.locator('.pneuma-emp-selection').innerText(),/in Cyberarm/);
 await page.locator('[data-button="apply"]').click();assert.match(await page.evaluate(()=>warning),/exactly 2/);
 await page.evaluate(async()=>{game.user=gm;await chooseEmp(combat,{...request,chooser:'random',mode:'system'});});
 assert.equal(await page.locator('.pneuma-emp-choice input:disabled').count(),2);
 assert.match(await page.locator('.pneuma-emp-selection').innerText(),/first draw 50.0%/);
 await page.evaluate(()=>{document.querySelector('.dialog').remove();game.user={id:'stranger',isGM:false};actor.isOwner=false;return chooseEmp(combat,request);});
 assert.equal(await page.locator('.dialog').count(),0);
 await page.evaluate(()=>{document.body.insertAdjacentHTML('beforeend',messages[0].content);combat.started=false;hooks.renderChatMessage.forEach(f=>f(messages[0],wrap(document.body)));});
 assert.equal(await page.locator('[data-emp-select]').isDisabled(),true);assert.equal(await page.locator('[data-emp-select]').innerText(),'Combat ended');

 // Player sees a saved random shortlist, never its unoffered parent or siblings.
 await page.evaluate(async()=>{
  game.user=gm;combat.started=true;actor.isOwner=true;
  actor.items=[{id:'host',name:'Secret Parent',type:'cyberware',system:{isInstalledInActor:true,isFoundational:true}},
   ...Array.from({length:5},(_,i)=>({id:'opt'+i,name:'Option '+i,type:'cyberware',system:{isInstalledInActor:true,installedIn:['host']}}))];
  behavior={player:{method:'shortlist',shortlistMethod:'no-foundation',skipAffected:false}};
  const saved=await createEmp(actor,{count:1,chooser:'player',mode:'equal',policy:{foundational:true,cascade:true,electronics:false,immune:[]},origin:'shortlist-source'});
  window.shortlist=combat.flags['pneuma-combattools'].empRequests[saved.id];
  game.user=owner;await chooseEmp(combat,shortlist);
 });
 assert.equal(await page.locator('.pneuma-emp-choice').count(),2);
 assert(!await page.locator('.pneuma-emp-selection').innerText().then(t=>t.includes('Secret Parent')));
 const offers=await page.locator('.pneuma-emp-choice').allTextContents();
 await page.evaluate(async()=>{behavior={player:{method:'manual'}};await chooseEmp(combat,shortlist)});
 assert.deepEqual(await page.locator('.pneuma-emp-choice').allTextContents(),offers,'Rerender and settings changes preserve the draw');
 await page.evaluate(async()=>{await chooseEmp(combat,{...shortlist,method:'equal'});});
 assert.equal(await page.locator('.pneuma-emp-choice').count(),0,'Player random draw does not list target inventory');
 await page.evaluate(()=>{
  const message=messages.at(-1);shortlist.affectedNames=['Selected item','Secret Parent'];shortlist.selectedNames=['Selected item'];
  document.querySelectorAll('.pneuma-emp-card').forEach(el=>el.remove());document.body.insertAdjacentHTML('beforeend',message.content);
  hooks.renderChatMessage.forEach(fn=>fn(message,wrap(document.body)));
 });
 assert.equal(await page.locator('.pneuma-emp-result').innerText(),'Disabled: Selected item');
 assert.equal(await page.evaluate(()=>menus.empBehaviorMenu.restricted),true);
 assert.equal(await page.evaluate(()=>settingConfigs.empImmunity.config),false);

 // Render the shipped settings template with Foundry v12-compatible helpers.
 await page.addScriptTag({content:await readFile(process.env.PNEUMA_HANDLEBARS_SOURCE,'utf8')});
 await page.evaluate(()=>{
  Handlebars.registerHelper('checked',v=>new Handlebars.SafeString(v?'checked':''));
  Handlebars.registerHelper('selectOptions',(choices,{hash})=>new Handlebars.SafeString(Object.entries(choices).map(([value,label])=>'<option value="'+Handlebars.escapeExpression(value)+'" '+(value===hash.selected?'selected':'')+'>'+Handlebars.escapeExpression(label)+'</option>').join('')));
  game.user=gm;
  foundry.utils.expandObject=data=>{const result={};for(const [key,value]of Object.entries(data)){const parts=key.split('.');let node=result;for(const part of parts.slice(0,-1))node=node[part]??={};node[parts.at(-1)]=value;}return result;};
  window.writes=[];game.settings.set=async(_m,key,value)=>{writes.push({key,value});if(key==='empBehavior')behavior=value;};
 });
 const template=await readFile('dist/templates/emp-settings.hbs','utf8');
 await page.evaluate(t=>{
  document.querySelector('.dialog')?.remove();document.querySelectorAll('.pneuma-emp-card').forEach(el=>el.remove());
  window.settingsApp=new menus.empBehaviorMenu.type();const root=document.createElement('section');root.id='pneuma-emp-settings';
  root.innerHTML=Handlebars.compile(t)(settingsApp.getData());document.body.append(root);settingsApp.activateListeners([root]);
 },template);
 assert.equal(await page.locator('[name="includeBioware"]').isChecked(),true);
 assert(await page.locator('[data-bioware-label] .pneuma-homebrew-badge').isVisible());
 await page.locator('[name="includeBioware"]').check();
 await page.locator('summary').filter({hasText:'Internal frame'}).click();
 assert.equal(await page.locator('[name="frameNoMove"]').isChecked(),false);
 assert.equal(await page.locator('[name="frameActionPenalty"]').isChecked(),false);
 assert.equal(await page.locator('[name="frameReduceMove"]').isChecked(),false);
 await page.locator('[name="frameReduceMove"]').check();
 await page.locator('[name="frameMoveReduction"]').fill('3');
 await page.locator('[name="frameNoMove"]').check();
 await page.locator('[name="frameActionPenalty"]').check();
 await page.locator('[name="framePenalty"]').fill('4');
 await page.locator('summary').filter({hasText:'Protection'}).click();
 await page.selectOption('[name="hardened"]','consume');
 assert.equal(await page.locator('[name="gm.method"] option').count(),2);
 assert.equal(await page.locator('[name="player.method"] option').count(),3);
 assert.equal(await page.locator('[data-emp-profile="gm"] [data-random-options]').isVisible(),false);
 await page.selectOption('[name="gm.method"]','random');
 assert(await page.locator('[data-emp-profile="gm"] [data-random-options]').isVisible());
 await page.selectOption('[name="player.method"]','shortlist');
 assert(await page.locator('[data-shortlist-options]').last().isVisible());
 await page.selectOption('[name="foundationWeight"]','foundation-more');
 await page.locator('[name="includeFashionware"]').uncheck();
 await page.locator('[name="includeFoundational"]').uncheck();
 assert.equal(await page.locator('[data-foundation-weight]').isVisible(),false);
 await page.locator('[name="includeFoundational"]').check();
 assert.equal(await page.locator('[data-foundation-weight]').isVisible(),true);
 await page.locator('[name="gm.skipAffected"]').uncheck();
 await page.evaluate(async()=>{
  const form=document.querySelector('.pneuma-emp-settings'),data=Object.fromEntries(new FormData(form));
  form.querySelectorAll('input[type=checkbox]').forEach(el=>data[el.name]=el.checked);
  await settingsApp._updateObject(new Event('submit'),data);
 });
 assert.equal(await page.evaluate(()=>behavior.includeBioware),true);
 assert.equal(await page.evaluate(()=>behavior.frameReduceMove),true);
 assert.equal(await page.evaluate(()=>behavior.frameMoveReduction),3);
 assert.equal(await page.evaluate(()=>behavior.frameNoMove),true);
 assert.equal(await page.evaluate(()=>behavior.frameActionPenalty),true);
 assert.equal(await page.evaluate(()=>behavior.framePenalty),4);
 assert.equal(await page.evaluate(()=>behavior.hardened),'consume');
 assert.equal(await page.evaluate(()=>settingsApp.getData().includeBioware),true);
 assert.equal(await page.evaluate(()=>behavior.gm.method),'random');
 assert.equal(await page.evaluate(()=>behavior.gm.skipAffected),false);
 assert.equal(await page.evaluate(()=>behavior.player.method),'shortlist');
 assert.equal(await page.evaluate(()=>behavior.foundationWeight),'foundation-more');
 assert.equal(await page.evaluate(()=>settingsApp.getData().profiles[1].method),'shortlist');
 const denied=await page.evaluate(async()=>{game.user=owner;try{await settingsApp._updateObject(new Event('submit'),{});return false}catch{return true}});
 assert(denied);
 console.log('EMP browser checks passed: settings template/save, chooser methods, fixed shortlist, limited player visibility, permissions, native configuration and ended card.');
} finally {await browser.close();}
