import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || "playwright");
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
 const page=await browser.newPage();
 await page.setContent('<main><ol><li class="total-mods">Total Mods</li></ol></main>');
 await page.evaluate(()=>{
  window.CONFIG={statusEffects:[{id:"prone",name:"Prone"},{id:"stunned",name:"Stunned"},{id:"blind",name:"Blind"},{id:"dead",name:"Dead"}]};
  window.foundry={utils:{randomID:()=>"application-test"}};
  window.game={settings:{get:()=>true},i18n:{localize:()=>"Damage",format:()=>"Apply damage"},user:{isGM:true},users:{get:()=>({active:true})}};
  window.hooks={};window.Hooks={on:(name,fn)=>{(window.hooks[name]??=[]).push(fn);}};
  window.wrap=nodes=>({length:nodes.length,find:s=>window.wrap(nodes.flatMap(n=>[...n.querySelectorAll(s)])),
   prop:(key,value)=>{nodes.forEach(n=>n[key]=value);return window.wrap(nodes);},attr:(key,value)=>{nodes.forEach(n=>n.setAttribute(key,value));return window.wrap(nodes);},remove:()=>nodes.forEach(n=>n.remove()),first:()=>window.wrap(nodes.slice(0,1)),before:n=>nodes[0]?.before(n),after:n=>nodes[0]?.after(n),
   append:n=>nodes[0]?.append(n),on:(event,fn)=>nodes.forEach(n=>n.addEventListener(event,fn))});
 });
 const native=(await readFile(new URL('../dist/scripts/native-combat.js',import.meta.url),'utf8')).replace(/^import .*$/gm,'');
 await page.addScriptTag({type:'module',content:native+'\nObject.assign(window,{attackDialog,registerAttackDialog});'});
 await page.waitForFunction(()=>!!window.attackDialog);
 const aware=await page.evaluate(async()=>{
  registerAttackDialog();let turn=0;
  const roll={async handleRollDialog(event){
   if(event.ctrlKey||event.type==='click')throw new Error('GM must see awareness choice');
   for(const hook of hooks.renderCPRRollDialog)hook({rollData:this},wrap([document.body]));
   for(const hook of hooks.renderCPRRollDialog)hook({rollData:this},wrap([document.body]));
   const rows=document.querySelectorAll('.pneuma-unaware-choice');if(rows.length!==1)throw new Error('Duplicate awareness rows');
   const input=rows[0].querySelector('input');if(input.checked)throw new Error('Checkbox leaked between attacks');
   if(turn++===0){input.checked=true;input.dispatchEvent(new Event('change'));}
   return true;
  }};
  return [await attackDialog(roll,{},{},{type:'click',ctrlKey:true}),await attackDialog(roll,{},{},{type:'click'})];
 });
 assert.deepEqual(aware,[{confirmed:true,unaware:true},{confirmed:true,unaware:false}]);
 const structure = await readFile(new URL('../dist/scripts/card-structure.js', import.meta.url), 'utf8');
 await page.addScriptTag({type:'module',content:structure+'\nwindow.resolutionSection=resolutionSection;'});
 await page.waitForFunction(()=>!!window.resolutionSection);
 const statusSource = await readFile(new URL('../dist/scripts/damage-status.js', import.meta.url), 'utf8');
 await page.addScriptTag({type:'module',content:statusSource+'\nObject.assign(window,{chooseDamageStatuses,damageStatusChoices,validateDamageStatuses});'});
 await page.waitForFunction(()=>!!window.chooseDamageStatuses);
 const criticalSource = await readFile(new URL('../dist/scripts/critical-injury.js', import.meta.url), 'utf8');
 await page.addScriptTag({type:'module',content:criticalSource.replace('import(utilsPath)', 'Promise.resolve({default:window.criticalUtils})')+'\nObject.assign(window,{hasCriticalInjury,criticalLocation,damageSixes,applyCriticalInjury});'});
 await page.waitForFunction(()=>!!window.hasCriticalInjury);
 const applicationSource = await readFile(new URL('../dist/scripts/damage-application.js', import.meta.url), 'utf8');
 await page.addScriptTag({type:'module',content:applicationSource+'\nObject.assign(window,{compactDamageApplication,captureWithChat,captureDamageApplication});'});
 await page.waitForFunction(()=>!!window.compactDamageApplication);
 const damage=(await readFile(new URL('../dist/scripts/damage-flow.js',import.meta.url),'utf8')).replace(/^import .*$/gm,'');
 await page.addScriptTag({type:'module',content:damage.replace('import(path)', 'Promise.resolve({default:window.nativeDamageDialog})')+'\nObject.assign(window,{damageValues,damageContent,renderDamage,rollDamage});'});
 const combat=(await readFile(new URL('../dist/scripts/combat-resolution.js',import.meta.url),'utf8')).replace(/^import .*$/gm,'');
 await page.addScriptTag({type:'module',content:combat+'\nwindow.exchangeContent=exchangeContent;window.decorateCombatMessage=decorateCombatMessage;'});
 await page.waitForFunction(()=>!!window.exchangeContent);
 const states=await page.evaluate(()=>{
  const root=document.createElement('li');root.className='chat-message';
  const snapshots=[];
  for(const state of ['waiting','applying','resolved','cancelled']) {
   for(const damage of [undefined,'rolling','rolled','applying','applied','review']) {
    decorateCombatMessage(root,{state,hit:true,damage:damage?{status:damage}:undefined});
    snapshots.push({root:root.className,exchange:root.dataset.pneumaExchangeState,
      damage:root.dataset.pneumaDamageState,outcome:root.dataset.pneumaOutcome});
   }
  }
  decorateCombatMessage(root,{state:'resolved',hit:false});
  return {snapshots,last:{...root.dataset}};
 });
 assert.equal(states.snapshots.length,24);
 for(const entry of states.snapshots){
  assert.equal(entry.root,'chat-message pneuma-combat-message');
  assert.equal(entry.outcome,entry.exchange==='resolved'?'hit':'none');
  assert.ok(['none','rolling','rolled','applying','applied','review'].includes(entry.damage));
 }
 assert.deepEqual(states.last,{pneumaExchangeState:'resolved',pneumaDamageState:'none',pneumaOutcome:'miss'});
 const layout=await page.evaluate(()=>{
  const attack='<div class="rollcard"><div class="rollcard-top"><div class="cpr-block">Heavy Pistol<div class="rollcard-subtitle"><div class="rollcard-subtitle-center">Attack</div><div class="rollcard-subtitle-right"><a data-action="rollDamage">drop</a></div><div class="rollcard-subtitle-2-center">Smart</div></div></div></div><div class="rollcard-bottom"><div class="cpr-block">24</div></div></div>';
  const defense='<div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><div class="text-normal">Evasion</div><div class="text-small">Skill</div></div></div><div class="rollcard-bottom"><div class="cpr-block"><span data-visible-element="d10-data-details">10</span><div class="d10-data-details hide">mods</div></div></div></div>';
  const data={state:'resolved',hit:true,weaponId:'weapon',attackerName:'Pex',defenderName:'Yam',html:attack,defense:{html:defense,total:10}};
  document.body.innerHTML=exchangeContent(data);
  const win=document.querySelector('.pneuma-attack-result').className;
  const loss=document.querySelector('.pneuma-defense-result').className;
  const duplicate=document.body.textContent.includes('Skill')||document.body.textContent.includes('Yam · Evasion');
  const drop=document.querySelector('.pneuma-combat-outcome [data-action="pneumaRollDamage"]');
  const sourceDrop=document.querySelector('.pneuma-attack-result [data-action="rollDamage"]');
  const scoped=document.querySelector('[data-visible-element="pneuma-defense-d10-data-details"]');
  document.body.innerHTML=exchangeContent({...data,hit:false});
  return {win,loss,duplicate,drop:!!drop,sourceDrop:!!sourceDrop,scoped:!!scoped,
    missDrop:!!document.querySelector('.pneuma-combat-outcome [data-action="pneumaRollDamage"]'),missWin:document.querySelector('.pneuma-defense-result').className};
 });
 assert.match(layout.win,/winner/);assert.match(layout.loss,/loser/);assert.equal(layout.duplicate,false);
 assert.equal(layout.drop,true);assert.equal(layout.sourceDrop,false);assert.equal(layout.scoped,true);
 assert.equal(layout.missDrop,true);assert.match(layout.missWin,/winner/);
 const result=await page.evaluate(async()=>{
  const html='<div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><div class="text-normal">Heavy Pistol</div><div class="rollcard-subtitle-2-center">Smart</div><a class="clickable" data-action="applyDamage" data-total-damage="22" data-bonus-damage="5" data-damage-location="head" data-damage-lethal="true" data-ablation="2" data-ignore-armor-percent="0.5" data-ammo-variety="armorPiercing"></a></div></div><span class="clickable" data-action="toggleVisibility" data-visible-element="d6-data-details">22</span><div class="d6-data-details hide">Dice details</div></div>';
  const values=damageValues(html);
  const data={state:'resolved',hit:true,weaponId:'weapon',attacker:'a',defender:'d',attackerName:'Attacker',defenderName:'Defender',title:'Ranged',ranged:true,dv:13,total:18,
   html:'<div class="rollcard"><a class="clickable" data-action="rollDamage">Blood drop</a></div>'};
  const pending=exchangeContent(data);
  const rolled=window.damageFixture={...data,damage:{status:'rolled',user:'gm',nonce:'n',result:{html,values}}};
  document.body.innerHTML='<div class="message-content">'+exchangeContent(rolled)+'</div>';
  window.fromUuid=async()=>({actor:{isOwner:true}});
  const requests=[];
  await renderDamage({id:'msg'},rolled,wrap([document.body]),async action=>requests.push(action));
  return {header:document.querySelector('.pneuma-damage-heading')?.textContent,
   weaponRepeated:document.querySelector('.pneuma-damage-result')?.textContent.includes('Heavy Pistol'),
   bolts:document.querySelectorAll('.pneuma-damage-application .fa-bolt').length,
   destinations:[...document.querySelectorAll('.pneuma-apply-damage')].map(n=>n.dataset.pneumaDamageTarget),
   values,pending,applyButtons:[...document.querySelectorAll('.pneuma-damage-recipient')].map(n=>n.textContent),
   nativeApply:document.querySelectorAll('[data-action="applyDamage"]').length,
   detail:document.querySelector('[data-visible-element="d6-data-details"]')?.textContent,
   unaware:exchangeContent({...data,unaware:true}),requests};
 });
 assert.deepEqual(result.values,{total:22,bonus:5,location:'head',ablation:2,ammo:'armorPiercing',ignorePercent:0.5,ignoreBelow:0,lethal:true});
 assert.match(result.pending,/pneumaRollDamage/);
 assert.equal(await page.locator(".pneuma-damage-application button").count(),3);assert.equal(await page.locator("a.pneuma-apply-damage").count(),2);
 assert.equal(result.header,'DamageSmart');assert.equal(result.weaponRepeated,false);assert.equal(result.bolts,2);assert.deepEqual(result.destinations,['recorded','selected']);
 assert.deepEqual(result.applyButtons,[' Defender',' to selected target']);
 assert.equal(result.nativeApply,0);assert.equal(result.detail,'22');assert.equal(result.requests.length,0);
 assert.match(result.unaware,/Defender unaware/);
 const applied=await page.evaluate(async()=>{
  const data={...window.damageFixture,damage:{...window.damageFixture.damage,status:'applied',recordedApplied:true}};
  document.body.innerHTML='<div class="message-content">'+exchangeContent(data)+'</div>';
  await renderDamage({id:'msg'},data,wrap([document.body]),async()=>{throw Error('Disabled bolt must not run');});
  const recorded=document.querySelector('[data-pneuma-damage-target="recorded"]');recorded.click();
  return {recorded:recorded.getAttribute('aria-disabled'),selected:document.querySelector('[data-pneuma-damage-target="selected"]').getAttribute('aria-disabled'),
   afterDice:!!(document.querySelector('[data-visible-element="d6-data-details"]').compareDocumentPosition(document.querySelector('.pneuma-damage-application')) & Node.DOCUMENT_POSITION_FOLLOWING)};
 });
 assert.equal(applied.recorded,'true');assert.equal(applied.selected,null);assert.equal(applied.afterDice,true);

 // Sections must not expose the saved attack/damage while defense is pending.
 const sections = await page.evaluate(async () => {
   const fixture = window.damageFixture;
   const snapshots = [];
   for (const state of ["waiting", "applying", "cancelled"]) {
     document.body.innerHTML = exchangeContent({...fixture, state, title: "Pending weapon"});
     snapshots.push({
       state, kinds: [...document.querySelectorAll("[data-pneuma-section]")].map(n => n.dataset.pneumaSection),
       hasRoll: !!document.querySelector(".pneuma-attack-result, .pneuma-damage-result"),
       slot: !!document.querySelector(".pneuma-resolution-pending-body .pneuma-pending-controls"),
     });
   }
   document.body.innerHTML = '<div class="message-content">' + exchangeContent(fixture) + '</div>';
   await renderDamage({id:"sections"}, fixture, wrap([document.body]), async()=>{});
   const kinds = [...document.querySelectorAll("[data-pneuma-section]")].map(n=>n.dataset.pneumaSection);
   const structure = [...document.querySelectorAll(".pneuma-resolution-section")].every(n =>
     n.querySelector(":scope > .pneuma-resolution-label") && n.querySelector(":scope > .pneuma-resolution-body"));
   const applicationInside = !!document.querySelector(".pneuma-resolution-damage-apply-body .pneuma-apply-damage");
   const dropInside = !!document.querySelector(".pneuma-resolution-result-body [data-action=pneumaRollDamage]");
   const recovering = {...fixture, damage:{status:"rolling", user:"gm", nonce:"n"}};
   document.body.innerHTML = '<div class="message-content">' + exchangeContent(recovering) + '</div>';
   await renderDamage({id:"recovery"}, recovering, wrap([document.body]), async()=>{});
   const recovery = !!document.querySelector(".pneuma-resolution-recovery-body button");
   const prematureApply = !!document.querySelector(".pneuma-resolution-damage-apply");
   const cancelled = exchangeContent({...fixture,state:"cancelled"});
   return {snapshots,kinds,structure,applicationInside,dropInside,recovery,prematureApply,cancelled};
 });
 for (const snapshot of sections.snapshots) {
   assert.deepEqual(snapshot.kinds,["pending"]); assert.equal(snapshot.hasRoll,false); assert.equal(snapshot.slot,true);
 }
 assert.deepEqual(sections.kinds,["attack","result","damage-roll","damage-apply"]);
 assert.equal(sections.structure,true); assert.equal(sections.applicationInside,true); assert.equal(sections.dropInside,true);
 assert.equal(sections.recovery,true); assert.equal(sections.prematureApply,false);
 assert.match(sections.cancelled,/Exchange cancelled by GM/);

 const presentationCSS=await readFile(new URL("../src/styles/pneuma-combattools.css",import.meta.url),"utf8");
 await page.addStyleTag({content:presentationCSS});

 const presentation=await page.evaluate(()=>{
   document.body.className="";
   document.body.innerHTML='<div id="chat-log"><div class="chat-message pneuma-combat-message" style="width:300px">'+exchangeContent({
     ...window.damageFixture,defense:{total:14,fee:1,html:'<div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><div class="text-normal">Evasion</div></div></div><div class="rollcard-bottom">14</div></div>'}
   })+'</div></div>';
   const labels=[...document.querySelectorAll(".pneuma-resolution-attack-label,.pneuma-resolution-evade-label,.pneuma-resolution-result-label,.pneuma-resolution-damage-roll-label")];
   const cost=document.querySelector(".pneuma-evasion-cost");
   const heading=cost.parentElement;
   const baseHidden=labels.every(label=>getComputedStyle(label).display==="none");
   const skin=document.createElement("style");skin.textContent=".pneuma-resolution-label{display:block}";document.head.append(skin);
   const skinCanShow=labels.every(label=>getComputedStyle(label).display==="block");skin.remove();
   const slot=document.createElement("button");slot.className="pneuma-damage-status-slot";slot.innerHTML='<img alt="status">';
   document.querySelector(".pneuma-combat-message").append(slot);
   const native=document.createElement("style");native.textContent="#chat-log .chat-message button{background:white}";document.head.append(native);
   return {labelCount:labels.length,baseHidden,skinCanShow,cost:cost.textContent,
     inHeader:!!cost.closest(".rollcard-top"),standalone:document.querySelectorAll("p.pneuma-evasion-cost").length,
     right:cost.getBoundingClientRect().right>=heading.getBoundingClientRect().right-12,
     buttonBackground:getComputedStyle(slot).backgroundColor,imageBackground:getComputedStyle(slot.firstElementChild).backgroundColor};
 });
 assert.equal(presentation.labelCount,4);assert.equal(presentation.baseHidden,true);assert.equal(presentation.skinCanShow,true);
 assert.equal(presentation.cost,"1 LUCK");assert.equal(presentation.inHeader,true);assert.equal(presentation.standalone,0);assert.equal(presentation.right,true);
 assert.equal(presentation.buttonBackground,"rgb(51, 51, 51)");assert.equal(presentation.imageBackground,"rgb(51, 51, 51)");

 // A skin can turn labels into side strips without rebuilding native content.
 const css = await readFile(new URL("../src/styles/pneuma-combattools.css", import.meta.url), "utf8");
 await page.addStyleTag({content:css});
 await page.addStyleTag({content:'.pneuma-resolution-section{display:grid;grid-template-columns:24px minmax(0,1fr)}.pneuma-resolution-label{writing-mode:vertical-rl}.pneuma-resolution-body{grid-column:2}'});
 const skin = await page.evaluate(() => {
   document.body.className="chat-message pneuma-combat-message";
   document.body.style.width="280px";
   document.body.innerHTML=exchangeContent({...window.damageFixture,defense:{html:'<div class="rollcard"><div class="cpr-block">Evasion</div></div>',total:10}});
   const label=document.querySelector(".pneuma-resolution-attack-label");
   const body=document.querySelector(".pneuma-resolution-attack-body");
   const drop=document.querySelector("[data-action=pneumaRollDamage]");
   return {mode:getComputedStyle(label).writingMode,bodyWidth:body.getBoundingClientRect().width,
     buttonWidth:drop.getBoundingClientRect().width,evade:!!document.querySelector(".pneuma-resolution-evade-body .rollcard")};
 });
 assert.equal(skin.mode,"vertical-rl"); assert.ok(skin.bodyWidth>0); assert.ok(skin.buttonWidth>0); assert.equal(skin.evade,true);



 const inCard = await page.evaluate(async () => {
   const data={...window.damageFixture,damage:{...window.damageFixture.damage,statusEffects:["prone"]}};
   document.body.innerHTML='<div class="message-content">'+exchangeContent(data)+'</div>';
   window.sent=[];let dialogs=0;let cancel=false;
   window.ui={notifications:{error:message=>{throw Error(message);}}};
   window.nativeDamageDialog={showDialog:async defaults=>{dialogs++;return cancel?undefined:{...defaults,useShield:false};}};
   await renderDamage({id:"in-card"},data,wrap([document.body]),async(action,extra)=>{sent.push({action,...extra});});
   const bolt=document.querySelector('[data-pneuma-damage-target="recorded"]');
   bolt.click();await new Promise(resolve=>setTimeout(resolve,0));
   bolt.dispatchEvent(new MouseEvent("click",{bubbles:true,shiftKey:true}));await new Promise(resolve=>setTimeout(resolve,0));
   cancel=true;bolt.dispatchEvent(new MouseEvent("click",{bubbles:true,shiftKey:true}));await new Promise(resolve=>setTimeout(resolve,0));
   return {sent,dialogs,options:document.querySelectorAll(".pneuma-damage-options").length};
 });
 assert.equal(inCard.options,0);assert.equal(inCard.dialogs,2);assert.equal(inCard.sent.length,2);
 assert.equal(inCard.sent[0].options.useShield,true);assert.equal(inCard.sent[1].options.useShield,false);
 assert.deepEqual(inCard.sent[0].statusEffects,["prone"]);assert.equal(inCard.sent[0].targetUuid,"d");

 const picker = await page.evaluate(async () => {
   let disabled;
   const oldWrap=window.wrap;window.wrap=nodes=>Object.assign(oldWrap(nodes),{0:nodes[0]});
   window.Dialog={prompt:async config=>{
     const div=document.createElement("div");div.innerHTML=config.content;
     disabled=div.querySelector('input[value="stunned"]').disabled;
     div.querySelector('input[value="dead"]').checked=true;
     return config.callback(wrap([div]));
   }};
   const selected=await chooseDamageStatuses(["prone","stunned"],2);
   window.Dialog.prompt=async config=>{
     const div=document.createElement("div");div.innerHTML=config.content;
     div.querySelector('input[value=""]').checked=true;
     return config.callback(wrap([div]));
   };
   const removed=await chooseDamageStatuses(selected,1);
   window.wrap=oldWrap;
   const data={...window.damageFixture,damage:{...window.damageFixture.damage,statusEffects:selected}};
   document.body.className="chat-message pneuma-combat-message";
   document.body.style.width="300px";
   document.body.innerHTML='<div class="message-content">'+exchangeContent(data)+'</div>';
   await renderDamage({id:"slots"},data,wrap([document.body]),async()=>{});
   const slots=[...document.querySelectorAll(".pneuma-damage-status-slot")];
   const rect=slots[0].getBoundingClientRect();
   const right=document.querySelector(".pneuma-damage-status-effects").getBoundingClientRect();
   const recipient=document.querySelector(".pneuma-damage-recipient").getBoundingClientRect();
   const icons=slots.filter(slot=>slot.querySelector("img")).length;
   const background=getComputedStyle(slots[0]).backgroundColor;
   document.body.innerHTML='<div class="message-content">'+exchangeContent({...data,damage:{...data.damage,statusEffects:[]}})+'</div>';
   await renderDamage({id:"empty-slots"}, {...data,damage:{...data.damage,statusEffects:[]}},wrap([document.body]),async()=>{});
   return {background,selected,removed,disabled,icons,square:rect.width===rect.height,right:right.left>=recipient.right,
     empty:[...document.querySelectorAll(".pneuma-damage-status-slot")].map(slot=>slot.textContent)};
 });
 assert.deepEqual(picker.selected,["prone","stunned","dead"]);
 assert.deepEqual(picker.removed,["prone","dead"]);assert.equal(picker.disabled,true);
 assert.equal(picker.background,"rgb(51, 51, 51)");assert.equal(picker.icons,3);assert.equal(picker.square,true);assert.equal(picker.right,true);
 assert.deepEqual(picker.empty,["+","+","+"]);
 const critical = await page.evaluate(async () => {
   const data={...window.damageFixture,attackMode:"aimed",location:"head",
     damage:{...window.damageFixture.damage,result:{...window.damageFixture.damage.result,sixes:2}}};
   document.body.innerHTML='<div class="message-content">'+exchangeContent(data)+'</div>';
   const calls=[];
   const table={name:"Critical Injuries (Head)"};
   const index=[{name:table.name}];
   window.game.packs=new Map([["tables",{getIndex:async()=>index,index}],["injuries",{getIndex:async()=>[]} ]]);
   window.game.settings.get=(module,key)=>key==="criticalInjuryRollTableCompendium"?"tables":true;
   window.criticalUtils={GetCompendiumDoc:async(pack,name)=>{calls.push([pack,name]);return table;},GetCompendiumIdByLabel:()=>"injuries"};
   window.fromUuid=async uuid=>({actor:{isOwner:true,sheet:{_drawCriticalInjuryTable:async(t,pack,iteration)=>calls.push([uuid,t.name,pack,iteration])}}});
   await renderDamage({id:"critical"},data,wrap([document.body]),async()=>{});
   const icons=[...document.querySelectorAll(".pneuma-apply-critical")];
   icons[0].click();
   await new Promise(resolve=>setTimeout(resolve,0));
   window.canvas={tokens:{controlled:[{actor:{isOwner:true},document:{uuid:"Token.selected"}}]}};
   icons[1].click();
   await new Promise(resolve=>setTimeout(resolve,0));
   const count=icons.length;
   window.game.settings.get=()=>false;
   document.body.innerHTML='<div class="message-content">'+exchangeContent(data)+'</div>';
   await renderDamage({id:"disabled-critical"},data,wrap([document.body]),async()=>{});
   const disabledCount=document.querySelectorAll(".pneuma-apply-critical").length;
   window.game.settings.get=()=>true;
   return {count,disabledCount,calls};
 });
 assert.equal(critical.count,2);assert.equal(critical.disabledCount,0);
 assert.deepEqual(critical.calls,[["tables","Critical Injuries (Head)"],["d","Critical Injuries (Head)","injuries",0],
   ["tables","Critical Injuries (Head)"],["Token.selected","Critical Injuries (Head)","injuries",0]]);


 const applications = await page.evaluate(async () => {
   const native='<div class="rollcard"><div class="rollcard-top"><a data-action="reverseDamage">undo</a></div><div class="d6-number-div"><span class="clickable" data-action="toggleVisibility" data-visible-element="d6-data-details">7</span></div><div class="d6-data-details hide">12 - 5 armor = 7</div></div>';
   const originalCalls=[];const chat={RenderDamageApplicationCard:data=>{originalCalls.push(data.actor);}};
   const original=chat.RenderDamageApplicationCard;
   const actor={name:"Actor",hp:30,update:async function(){this.hp-=7;}};
   let renderCount=0;
   window.renderTemplate=async(path,data)=>{renderCount++;if(data.actor.hp!==23)throw Error("Mutation used wrong receiver");return native;};
   const rows=await captureWithChat(chat,actor,"Token name","body","first",async view=>{
     await view.update();
     chat.RenderDamageApplicationCard({actor,hpReduction:1});
     chat.RenderDamageApplicationCard({actor:view,hpReduction:7,location:"body"});
   });
   const restored=chat.RenderDamageApplicationCard===original;
   let failed=false;
   try {await captureWithChat(chat,actor,"Actor","body","fail",async()=>{throw Error("damage failed");});} catch{failed=true;}
   const restoredAfterFailure=chat.RenderDamageApplicationCard===original;
   const second=compactDamageApplication(native,"Another token","head","second");
   const data={...window.damageFixture,damage:{...window.damageFixture.damage,applications:[...rows,second]}};
   document.body.innerHTML='<div class="message-content">'+exchangeContent(data)+'</div>';
   // Native chatListeners uses the clicked data-visible-element to toggle only that class.
   document.body.addEventListener("click",event=>{
     const target=event.target.closest('[data-action="toggleVisibility"]');
     if(target)document.querySelectorAll("."+target.dataset.visibleElement).forEach(n=>n.classList.toggle("hide"));
   },{once:true});
   document.querySelector(".pneuma-applied-number").click();
   const detail=[...document.querySelectorAll(".pneuma-applied-details")];
   const row=document.querySelector(".pneuma-damage-applied-row");
   const children=[...row.children].map(n=>n.getBoundingClientRect());
   return {restored,restoredAfterFailure,failed,renderCount,nativeCalls:originalCalls.length,hp:actor.hp,
     count:document.querySelectorAll(".pneuma-damage-applied-row").length,
     firstName:row.querySelector(".pneuma-applied-name").textContent,
     expanded:!detail[0].classList.contains("hide"),secondHidden:detail[1].classList.contains("hide"),
     undo:detail[0].querySelector('[data-action="reverseDamage"]')!==null,
     horizontal:children[0].left<children[1].left&&children[1].left<children[2].left,
     larger:parseFloat(getComputedStyle(row.querySelector(".pneuma-applied-number")).fontSize)>parseFloat(getComputedStyle(row).fontSize)};
 });
 assert.equal(applications.restored,true);assert.equal(applications.restoredAfterFailure,true);assert.equal(applications.failed,true);
 assert.equal(applications.renderCount,1);assert.equal(applications.nativeCalls,1);assert.equal(applications.hp,23);
 assert.equal(applications.count,2);assert.equal(applications.firstName,"Token name");
 assert.equal(applications.expanded,true);assert.equal(applications.secondHidden,true);assert.equal(applications.undo,true);
 assert.equal(applications.horizontal,true);assert.equal(applications.larger,true);


 const scrollSource=await readFile(new URL("../dist/scripts/resolution-scroll.js",import.meta.url),"utf8");
 await page.addScriptTag({type:"module",content:scrollSource+"\nObject.assign(window,{registerResolutionScroll});"});
 const scrolling=await page.evaluate(async()=>{
   document.body.className="";document.body.style.width="";
   document.body.innerHTML='<div id="chat-log" style="height:220px;overflow:auto"><div style="height:350px"></div><div class="chat-message pneuma-combat-message" data-message-id="scroll" style="height:100px"></div><div style="height:200px"></div></div>';
   const log=document.querySelector("#chat-log");
   const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   foundry.utils.getProperty=(object,path)=>path==="flags.pneuma-combattools.exchange"?object.exchange:undefined;
   registerResolutionScroll();
   const message={id:"scroll",visible:true,exchange:{}};
   for(const hook of hooks.renderChatMessage??[])hook(message);
   await frames();const history=log.scrollTop;
   for(const hook of hooks.updateChatMessage??[])hook(message);
   await frames();
   let card=log.querySelector(".chat-message");
   const fits=card.getBoundingClientRect().top>=log.getBoundingClientRect().top
     &&card.getBoundingClientRect().bottom<=log.getBoundingClientRect().bottom;
   card.style.height="420px";await frames();
   const grew=Math.abs(card.getBoundingClientRect().bottom-log.getBoundingClientRect().bottom)<2;
   const replacement=card.cloneNode();replacement.style.height="140px";card.replaceWith(replacement);card=replacement;
   for(const hook of hooks.renderChatMessage??[])hook(message);
   await frames();
   const rerender=card.getBoundingClientRect().top>=log.getBoundingClientRect().top
     &&card.getBoundingClientRect().bottom<=log.getBoundingClientRect().bottom;
   return {history,fits,grew,rerender};
 });
 assert.equal(scrolling.history,0);assert.equal(scrolling.fits,true);assert.equal(scrolling.grew,true);assert.equal(scrolling.rerender,true);


 const damageDialogs=await page.evaluate(async()=>{
   const events=[],sent=[];let rolled=0,cancel=false;
   const roll={handleRollDialog:async event=>{events.push(event);return !cancel;},_roll:{dice:[]}};
   const item={id:"weapon",createRoll:()=>roll,confirmRoll:async value=>value};
   window.fromUuid=async()=>({actor:{id:"actor",items:{get:()=>item}}});
   window.nativeAPI=async()=>({Dice:{handle3dDice:async()=>{}}});
   window.rollHidden=async()=>{rolled++;};window.diceJSON=()=>[];
   window.nativeCard=async()=>'<a data-action="applyDamage" data-total-damage="10" data-damage-location="body"></a>';
   const data={...window.damageFixture,attackMode:"attack",location:"body"};
   await rollDamage("normal",data,async action=>sent.push(action));
   await rollDamage("shift",data,async action=>sent.push(action),true);
   cancel=true;await rollDamage("cancel",data,async action=>sent.push(action),true);
   return {events,sent,rolled};
 });
 assert.equal(damageDialogs.events[0].ctrlKey,true);
 assert.notEqual(damageDialogs.events[0].type,"click");
 assert.equal(damageDialogs.events[1].ctrlKey,false);assert.equal(damageDialogs.rolled,2);
 assert.equal(damageDialogs.sent.filter(action=>action==="damageCommit").length,2);
 assert.equal(damageDialogs.sent.filter(action=>action==="damageRelease").length,3);



 const improvisedUI=await page.evaluate(async()=>{
   const outcomes=[];
   for (const isGM of [false,true]) {
     game.user.isGM=isGM;
     const roll={async handleRollDialog(event){
       if(event.ctrlKey || event.type==="click")throw Error("Improvised must show attack dialog");
       document.body.innerHTML='<ol><li class="total-mods">Total Mods</li></ol><button class="cpr-dialog-button" name="confirm">Confirm</button>';
       const render=()=>{for(const hook of hooks.renderCPRRollDialog)hook({rollData:this},wrap([document.body]));};
       render();render();
       const select=document.querySelector(".pneuma-improvised-damage-choice select");
       if(document.querySelectorAll(".pneuma-improvised-damage-choice").length!==1)throw Error("duplicate");
       if(!document.querySelector('[name="confirm"]').disabled)throw Error("Missing choice allowed");
       if(select.options.length!==7)throw Error("Incorrect dice choices");
       select.value="4";select.dispatchEvent(new Event("change"));
       render();
       if(document.querySelector(".pneuma-improvised-damage-choice select").value!=="4")throw Error("Choice lost on render");
       if(document.querySelector('[name="confirm"]').disabled)throw Error("Valid choice blocked");
       if(!!document.querySelector(".pneuma-unaware-choice")!==isGM)throw Error("Awareness visibility");
       return true;
     }};
     outcomes.push(await attackDialog(roll,{},{},{type:"click",ctrlKey:true},true));
   }
   let rejected=false;
   try {await attackDialog({handleRollDialog:async()=>true},{},{},{},true);}catch(e){rejected=/Choose improvised/.test(e.message);}
   const cancelled=await attackDialog({handleRollDialog:async()=>false},{},{},{},true);
   const data={...window.damageFixture,damage:undefined,improvised:true,improvisedDice:4};
   window.fromUuid=async()=>({actor:{isOwner:true}});
   document.body.innerHTML=exchangeContent(data);
   await renderDamage({id:"improv"},data,wrap([document.body]),async()=>{});
   return {outcomes,rejected,cancelled:cancelled.confirmed,
     dropdown:!!document.querySelector(".pneuma-improvised-damage"),
     unlocked:!document.querySelector('[data-action="pneumaRollDamage"]').hasAttribute("aria-disabled")};
 });
 assert.deepEqual(improvisedUI.outcomes,[{confirmed:true,unaware:false,improvisedDice:4},{confirmed:true,unaware:false,improvisedDice:4}]);
 assert.equal(improvisedUI.rejected,true);assert.equal(improvisedUI.cancelled,false);
 assert.equal(improvisedUI.dropdown,false);assert.equal(improvisedUI.unlocked,true);
 const carriedDamage=await page.evaluate(async()=>{
   let dice;
   window.thrownRollItem=(_source,_actor,selected)=>{
     dice=selected;
     return {id:"thrown",createRoll:()=>({handleRollDialog:async()=>true,_roll:{dice:[]}}),confirmRoll:async roll=>roll};
   };
   window.fromUuid=async()=>({actor:{id:"actor"}});
   const sent=[];
   await rollDamage("improvised-carried",{...damageFixture,damage:undefined,improvised:true,improvisedDice:4,thrownSource:{},attackMode:"attack"},async action=>sent.push(action));
   return {dice,sent};
 });
 assert.equal(carriedDamage.dice,4);assert.equal(carriedDamage.sent.includes("damageCommit"),true);
 console.log('Combat flow browser checks passed: awareness checkbox/reset, native damage metadata, scoped application control, retained expandable result.');
} finally {await browser.close();}
