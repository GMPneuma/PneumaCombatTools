import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:800,height:900}});
 await page.route('http://controls.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/')return route.fulfill({contentType:'text/html',body:'<main id="host" class="pneuma-combat-message"></main>'});
  if(!path.startsWith('/scripts/'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="white" d="M2 2h14v14H2z"/></svg>'});
  const root=resolve('dist'),file=resolve(root,'.'+path);assert.ok(file.startsWith(root));
  return route.fulfill({contentType:'text/javascript',body:await readFile(file)});
 });
 await page.goto('http://controls.test/');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addStyleTag({content:'body{font:14px Arial;background:#eee}button{box-sizing:border-box}img{max-width:100%}'});
 await page.evaluate(async()=>{
  window.FormApplication=class {};window.Hooks={on(){},once(){},off(){}};
  window.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
  window.game={user:{id:'gm',isGM:true},modules:new Map(),settings:{get:()=>false},i18n:{localize:k=>k}};
  window.CONFIG={statusEffects:[]};window.canvas={};
  const {masterStatuses}=await import('/scripts/status-catalog.js');CONFIG.statusEffects=masterStatuses;
  window.lookupCount=0;window.fromUuid=async()=>{lookupCount++;return {uuid:'Actor.target',isOwner:true,effects:[]};};
  const {damageContent}=await import('/scripts/damage-flow.js');
  const {manualContent}=await import('/scripts/manual-rolls.js');
  const {areaContent}=await import('/scripts/aoe/workflow.js');
  const {renderDamageStatusPicker}=await import('/scripts/damage-status.js');
  const {styleChatButtons}=await import('/scripts/chat-buttons.js');
  const {instantContent,bindInstantControls}=await import('/scripts/instant-effects.js');
  const {arrangeInlineRollDetails}=await import('/scripts/inline-roll.js');
  const {compactDamageApplication}=await import('/scripts/damage-application.js');
  const host=document.querySelector('#host');
  const damage={status:'rolled',result:{html:'<div class="rollcard"><strong>17</strong></div>',values:{ignorePercent:0,interactArmor:true}}};
  const exchange={title:'Attack',damage};
  const area={scene:'s',kind:'explosive',phase:'responses',area:{shape:'square',origin:{x:50,y:50},direction:0,length:500,width:500},settings:{coverUp:true,evade:'raw'},exchange,rows:[{uuid:'owned',actor:'Actor.target',name:'Target',img:'/icons/target.svg',eligible:true,state:'hit'}]};
  for(const width of [260,300,400])for(const family of ['normal','manual','aoe'])for(const locked of [false,true]){
   host.style.width=width+'px';
   host.innerHTML=family==='normal'?damageContent(exchange):family==='manual'?manualContent({kind:'damage',title:'Damage',rollMode:'roll',damage}):areaContent(area);
   const picker=host.querySelector('.pneuma-damage-effects-slot,.pneuma-aoe-effects-picker');
   // Exercise the real renderer and decorator together, including repeated render.
   for(let n=0;n<3;n++){renderDamageStatusPicker(picker,['instant:incendiary'],locked,false,async()=>{});styleChatButtons(host);}
   const buttons=[...picker.querySelectorAll('button')];
   if(buttons.length!==(locked?0:3))throw Error('Incorrect picker state '+family);
   if(!locked){
    const rects=buttons.map(b=>b.getBoundingClientRect());
    for(let n=0;n<3;n++){
     if(Math.abs(rects[n].width-24)>1||Math.abs(rects[n].height-24)>1)throw Error('Decorated slot must match its 24px track: '+JSON.stringify({family,width,rect:rects[n].toJSON()}));
     if(n&&rects[n].left<rects[n-1].right)throw Error('Picker slots overlap');
    }
   }
   if(picker.scrollWidth>picker.clientWidth||host.scrollWidth>host.clientWidth)throw Error('Picker overflow '+family+' '+width);
  }
  const native='<section class="rollcard"><div class="d10-dice-div"><img src="/icons/die.svg"></div><div class="d10-number-div">11</div><div class="d10-data-details" style="display:none"><div>Roll: 6</div><div>WILL: 3 + Skill: 2 = 11</div></div></section>';
  for(const width of [260,300,400])for(const gm of [true,false])for(const state of ['pending','rolling','failed','resisted','applying','applied','skipped','review']){
   game.user.isGM=gm;host.style.width=width+'px';
   const effect={id:'poison',actor:'Actor.target',name:'Target',state,...(state==='pending'?{}:{total:11,html:native}),...(state==='applied'?{damage:9,damageHTML:'<div>2d6 = 9; direct HP damage</div>'}:{})};
   host.innerHTML=instantContent(effect,'target',true)+instantContent({...effect,id:'incendiary'},'fire',true);
   lookupCount=0;await bindInstantControls(host,()=>effect,async()=>{});styleChatButtons(host);
   if(lookupCount>1)throw Error('Binding repeated actor lookup across one target');
   if(!gm&&host.querySelector('[data-chat-role="gm"]'))throw Error('GM control visible to player');
   for(const row of host.querySelectorAll('.pneuma-aoe-inline-effect')){
    if(row.scrollWidth>row.clientWidth)throw Error('Effect row overflow '+JSON.stringify({width,gm,state}));
    const controls=[...row.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().height);
    const rects=controls.map(b=>b.getBoundingClientRect());
    for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)if(rects[i].left<rects[j].right&&rects[j].left<rects[i].right&&rects[i].top<rects[j].bottom&&rects[j].top<rects[i].bottom)throw Error('Effect buttons overlap');
    const gmButton=row.querySelector('[data-chat-role="gm"]');
    if(gmButton&&Math.abs(gmButton.getBoundingClientRect().right-row.getBoundingClientRect().right)>1)throw Error('GM control is not right-most');
    const damage=row.querySelector('.pneuma-instant-damage'),resistance=row.querySelector('.pneuma-effect-resistance');
    if(damage&&resistance){
     const d=damage.getBoundingClientRect(),r=resistance.getBoundingClientRect();
     if(Math.abs(d.top+d.height/2-r.top-r.height/2)>1||d.left<r.right)throw Error('Resistance and damage must share one line');
    }
   }
   arrangeInlineRollDetails(host); // Repeated preparation must not duplicate regions.
   for(const roll of host.querySelectorAll('details')){
    const summary=roll.querySelector('summary'),region=document.getElementById(summary.getAttribute('aria-controls'));
    if(!region||!region.hidden)throw Error('Missing collapsed disclosure');
    summary.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const row=region.closest('.pneuma-aoe-inline-effect'),rr=row.getBoundingClientRect(),dr=region.getBoundingClientRect();
    if(region.hidden||dr.width<rr.width-12||dr.top<summary.getBoundingClientRect().bottom||region.querySelector('img,.rollcard'))throw Error('Disclosure must be full-width plain text');
    if(row.scrollWidth>row.clientWidth)throw Error('Opening a breakdown must not widen the effect row');
    if(!region.textContent.includes('WILL: 3')&&!region.textContent.includes('2d6 = 9'))throw Error('Calculation lost');
    summary.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    if(!region.hidden)throw Error('Disclosure failed to collapse');
   }
   // Both calculations can stay open without sharing/overlapping one grid cell.
   const rolls=[...host.querySelectorAll('.pneuma-aoe-inline-effect:first-child details')];
   for(const roll of rolls)roll.open=true;
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   if(rolls.length===2){
    const regions=rolls.map(roll=>document.getElementById(roll.querySelector('summary').getAttribute('aria-controls')).getBoundingClientRect());
    if(regions[0].top<regions[1].bottom&&regions[1].top<regions[0].bottom)throw Error('Resistance and damage breakdowns overlap: '+JSON.stringify(regions.map(r=>r.toJSON())));
   }
  }
  for(const width of [260,400]){
   host.style.width=width+'px';
   const receipt=compactDamageApplication('<div><a data-action="toggleVisibility" data-visible-element="d6-data-details">17</a><div class="d6-data-details"><div>Damage 17</div><div>Armor 0</div></div><a data-action="reverseDamage">Undo</a></div>','Target','body','notes');
   const applications=[receipt+'<p class="pneuma-injury-damage">Cracked Skull: penetrating headshot damage ×3; bonus damage unchanged.</p><p class="pneuma-cover-up-damage">Cover Up: armor SP ×2; all worn armor ablates ×2.</p>'];
   host.innerHTML=areaContent({...area,rows:[{...area.rows[0],damage:{status:'applied',recordedApplied:true,applications},instant:{id:'incendiary',actor:'Actor.target',name:'Target',state:'applied'}}]});
   const row=host.querySelector('.pneuma-aoe-resolution-target'),details=row.querySelector('.pneuma-applied-details');
   const before=row.querySelector('img').getBoundingClientRect();
   for(const expanded of [true,false]){
    details.classList.toggle('hide',!expanded);
    const receiptBottom=(expanded?details:row.querySelector('.pneuma-damage-applied-row')).getBoundingClientRect().bottom;
    const injury=row.querySelector('.pneuma-injury-damage').getBoundingClientRect(),cover=row.querySelector('.pneuma-cover-up-damage').getBoundingClientRect(),effects=row.querySelector('.pneuma-aoe-target-effects').getBoundingClientRect();
    if(injury.top<receiptBottom||cover.top<injury.bottom||effects.top<cover.bottom)throw Error('Receipt notes overlap disclosure or target effects');
    if(Math.abs(row.querySelector('img').getBoundingClientRect().top-before.top)>1)throw Error('Receipt notes moved the portrait');
   }
  }
 });
 // Observe only eligible cards, and never rescan the whole root on a mutation.
 await page.evaluate(async()=>{
  const {styleChatButtons}=await import('/scripts/chat-buttons.js');
  const NativeObserver=window.MutationObserver;let observers=0;
  window.MutationObserver=class extends NativeObserver{constructor(callback){super(callback);observers++;}};
  const ordinary=document.createElement('div');ordinary.textContent='Ordinary chat';document.body.append(ordinary);styleChatButtons(ordinary);
  if(observers)throw Error('Ordinary chat acquired a mutation observer');
  const card=document.createElement('div');card.className='pneuma-combat-message';card.innerHTML='<div class="pneuma-defense-controls"><button data-chat-action="evade">Localized label</button></div><div id="calculation"></div>';document.body.append(card);styleChatButtons(card);
  if(observers!==1||!card.querySelector('i.fa-person-running'))throw Error('Explicit action metadata did not control decoration');
  let scans=0;const query=card.querySelectorAll.bind(card);card.querySelectorAll=(s)=>{scans++;return query(s);};
  card.querySelector('#calculation').textContent='Native calculation expanded';
  const button=document.createElement('button');button.dataset.instantAction='review';button.textContent='Localized review';card.append(button);
  await new Promise(r=>setTimeout(r,20));
  if(scans||button.dataset.chatKind!=='recovery'||button.dataset.chatRole!=='gm')throw Error('Mutation triggered a root rescan or missed new controls');
  window.MutationObserver=NativeObserver;
 });
 console.log('Card controls passed: normal/manual/AoE decorated picker geometry; 260/300/400px effect state matrix; GM visibility/alignment; plain full-width disclosures; bounded actor lookups and targeted observers.');
}finally{await browser.close();}
