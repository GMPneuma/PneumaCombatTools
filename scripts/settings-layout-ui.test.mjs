import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || "playwright");
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
 const page=await browser.newPage({viewport:{width:640,height:1000}});
 await page.setContent('<form style="width:560px;font:14px Arial;background:#eee;padding:16px"></form>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addStyleTag({content:await readFile('dist/styles/homebrew-badge.css','utf8')});
 await page.evaluate(()=>{
  window.settingsHooks={};
  window.Hooks={once:(event,fn)=>{if(event==='init')fn();},on:(event,fn)=>(settingsHooks[event]??=[]).push(fn)};
  window.game={system:{id:'cyberpunk-red-core'}};
 });
 await page.addScriptTag({content:(await readFile('dist/scripts/settings-layout.js','utf8')).replaceAll('export ','')+'\nwindow.groupModuleSettings=groupModuleSettings;'});
 await page.addScriptTag({content:(await readFile('dist/scripts/homebrew-badge.js','utf8')).replaceAll('export ','')});
 const result=await page.evaluate(()=>{
  const form=document.querySelector('form');
  const defs={combatBarDock:['bottom-left','top-right','bottom-docked'],combatBarOrientation:['vertical','horizontal']};
  const keys=['routeSheetAttacks','injuryTurnEndReminder','movementTracking','showArmorControls','ablateBlockedHits','maNoAblation','npcAutoEvasion','combatBar','turnMarkerEnabled','turnMarkerDisplay','quickhackEnabled','quickhackMode',...Object.keys(defs),'combatBarSize','combatBarFullWidth','combatBarResizeMacros','criticalInjuries','eyeHUD','eyeHUDDock','biomonitorShowHP','hoverDV','hoverAutofire'];
  for(const key of keys){const row=document.createElement('div');row.className='form-group';row.innerHTML='<label for="setting-'+key+'">'+key+'</label>'+(defs[key]?'<select id="setting-'+key+'" name="pneuma-combattools.'+key+'">'+defs[key].map(v=>'<option>'+v+'</option>').join('')+'</select>':'<input id="setting-'+key+'" name="pneuma-combattools.'+key+'" type="checkbox">');form.append(row);}
  const menu=document.createElement("div");menu.className="form-group submenu";menu.innerHTML='<label>Turn Indicator</label><button type="button" data-key="pneuma-combattools.turnMarkerSettings">Configure</button>';form.append(menu);menu.querySelector("button").addEventListener("click",()=>window.indicatorMenuOpened=true);
  form.querySelector('[name$=combatBar]').checked=true;form.querySelector('[name$=turnMarkerEnabled]').checked=true;
  for(let pass=0;pass<2;pass++){groupModuleSettings(form);for(const fn of settingsHooks.renderSettingsConfig??[])fn({},[form]);}
  const radios=[...form.querySelectorAll('input[type=radio]')];
  const initial=radios.map(r=>r.checked);
  radios[2].click();
  return {count:radios.length,initial,checked:radios.map(r=>r.checked),values:Object.fromEntries(new FormData(form)),groups:[...form.querySelectorAll('legend')].map(l=>l.textContent),hidden:form.querySelector('select[name$="Orientation"]').closest('.form-group').hidden};
 });
 const positionLayout=await page.evaluate(()=>{
   const row=document.querySelector('.pneuma-bar-position-row');
   const box=e=>e.getBoundingClientRect();
   return {height:box(row).height,labelBottom:box(row.querySelector(':scope > label')).bottom,radiosTop:box(row.querySelector('.pneuma-bar-positions')).top};
 });
 assert.ok(positionLayout.radiosTop>=positionLayout.labelBottom,'Radios are beneath the position label');
 assert.equal(await page.locator('[name$=combatBarFullWidth]').isVisible(),false);
 assert.equal(await page.locator('[name$=combatBarResizeMacros]').isVisible(),false);
 assert.equal(result.count,5);assert.deepEqual(result.initial,[false,true,false,false,false]);assert.deepEqual(result.checked,[false,false,true,false,false]);
 assert.equal(result.values['pneuma-combattools.combatBarDock'],'top-right');assert.equal(result.values['pneuma-combattools.combatBarOrientation'],'horizontal');assert.equal(result.hidden,true);
 assert.deepEqual(result.groups,['Attack & Damage Cards','Evasion & Area Attacks','Movement & Initiative','Turn Indicator','Injuries & Effects','QuickHack','Combat Bar','Token HUD & Targeting','Biomonitor']);
 assert.equal(await page.locator('[name="pneuma-combattools.routeSheetAttacks"]').isChecked(),false);
 assert.equal(await page.locator('[name="pneuma-combattools.routeSheetAttacks"]').evaluate(n=>n.closest('fieldset').dataset.combatSettingsGroup),'combat');
 const blocked=page.locator('[name="pneuma-combattools.ablateBlockedHits"]');
 assert.equal(await blocked.isChecked(),false);
 assert.equal(await blocked.evaluate(n=>n.closest('fieldset').dataset.combatSettingsGroup),'combat');
 assert.equal(await blocked.evaluate(n=>n.closest('.form-group').previousElementSibling.querySelector('input').name),'pneuma-combattools.maNoAblation');
 const blockedLabel=page.locator('label[for="setting-ablateBlockedHits"]');
 assert.equal(await blockedLabel.locator('.pneuma-homebrew-rule-icon').count(),1);
 assert.equal(await blockedLabel.locator('.pneuma-homebrew-badge').count(),0);
 assert.equal(await blockedLabel.locator('i').getAttribute('aria-label'),'Homebrew rule');
 assert.equal(await blockedLabel.locator('i').evaluate(n=>getComputedStyle(n).color),'rgb(198, 40, 40)');
 assert.equal(await page.locator('label[for="setting-maNoAblation"] .pneuma-homebrew-badge').count(),1);
 await blockedLabel.click();assert.equal(await blocked.isChecked(),true);
 assert.equal(await page.locator('form').evaluate(n=>new FormData(n).get('pneuma-combattools.ablateBlockedHits')),'on');
 await blocked.focus();await page.keyboard.press('Space');assert.equal(await blocked.isChecked(),false);
 assert.equal(await page.locator('form').evaluate(n=>new FormData(n).has('pneuma-combattools.ablateBlockedHits')),false);
 await page.locator('[data-key="pneuma-combattools.turnMarkerSettings"]').click();assert.equal(await page.evaluate(()=>indicatorMenuOpened),true);
 assert.equal(await page.locator('[data-key="pneuma-combattools.turnMarkerSettings"]').evaluate(n=>n.closest('fieldset').dataset.combatSettingsGroup),'turn-marker');
 await page.locator('input[type=radio]').nth(2).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('input[type=radio]').nth(3).isChecked(),true);
 await page.locator('input[type=radio]').nth(4).click();
 assert.equal(await page.locator('select[name$="combatBarDock"]').inputValue(),'bottom-docked');
 assert.equal(await page.locator('[name$=combatBarFullWidth]').isVisible(),true);
 const dockLayout=await page.evaluate(()=>{
   const row=document.querySelector('.pneuma-bar-position-row'),box=e=>e.getBoundingClientRect();
   return {height:box(row).height,radiosRight:box(row.querySelector('.pneuma-bar-positions')).right,optionsLeft:box(row.querySelector('.pneuma-bar-dock-options')).left};
 });
 assert.equal(dockLayout.height,positionLayout.height,'Position changes preserve settings height');
 assert.ok(dockLayout.optionsLeft>dockLayout.radiosRight,'Dock options sit to the right of radios');
 assert.equal(await page.locator('[name$=combatBarResizeMacros]').isVisible(),true);
 assert.equal(await page.locator('select[name$="combatBarOrientation"]').inputValue(),'horizontal');
 await page.locator('[data-hover-dv-mode]').selectOption('autofire');assert.equal(await page.locator('[name$="hoverDV"]').isChecked(),true);assert.equal(await page.locator('[name$="hoverAutofire"]').isChecked(),true);
 await page.locator('[data-hover-dv-mode]').selectOption('single');assert.equal(await page.locator('[name$="hoverAutofire"]').isChecked(),false);
 await page.locator('[data-hover-dv-mode]').selectOption('off');assert.equal(await page.locator('[name$="hoverDV"]').isChecked(),false);
 for(const [key,id] of [['turnMarkerEnabled','turn-marker'],['quickhackEnabled','quickhack'],['combatBar','combat-bar']]) {
  const master=page.locator('[name="pneuma-combattools.'+key+'"]');
  await master.uncheck();
  assert.ok(await page.locator('[data-combat-settings-group="'+id+'"] .form-group').evaluateAll(rows=>rows.slice(1).every(row=>row.inert&&row.getAttribute('aria-disabled')==='true')));
  assert.equal(await page.locator('[data-combat-settings-group="'+id+'"] .form-group').first().locator('input').getAttribute('name'),'pneuma-combattools.'+key);
  await master.check();
  assert.ok(await page.locator('[data-combat-settings-group="'+id+'"] .form-group').evaluateAll(rows=>rows.every(row=>!row.inert)));
 }
 await page.screenshot({path:tmpdir()+'/pct-settings-cleanup.png'});
 // Check the compact editor at its configured width with native field wrappers and hints.
 await page.evaluate(()=>{
   const form=document.querySelector('form'),row=document.querySelector('.pneuma-bar-position-row');
   form.replaceChildren(row);form.style.width='420px';form.id='pneuma-combat-bar-settings';
   row.querySelector(':scope > label').textContent='Combat Bar Position';
   const hints={combatBarFullWidth:['Use full screen width','Bottom-Docked only: extend beneath the sidebar and shorten it to leave room for the dock.'],combatBarResizeMacros:['Resize Macro Bar to match Combat Bar','Bottom-Docked only: match native macro slots to the combat portraits. Disable to retain native macro sizing.']};
   for(const [key,[title,hint]] of Object.entries(hints)){
     const input=form.querySelector('[name$="'+key+'"]'),setting=input.closest('.form-group');
     setting.querySelector('label').textContent=title;
     const fields=document.createElement('div');fields.className='form-fields';input.before(fields);fields.append(input);
     const note=document.createElement('p');note.className='notes';note.textContent=hint;setting.append(note);
   }
 });
 const compactHeight=await page.locator('.pneuma-bar-position-row').evaluate(e=>e.getBoundingClientRect().height);
 await page.locator('input[type=radio]').nth(0).click();
 assert.equal(await page.locator('.pneuma-bar-position-row').evaluate(e=>e.getBoundingClientRect().height),compactHeight);
 await page.locator('input[type=radio]').nth(4).click();
 assert.equal(await page.locator('.pneuma-bar-position-row').evaluate(e=>e.getBoundingClientRect().height),compactHeight);
 assert.ok(await page.locator('form').evaluate(e=>e.scrollWidth===e.clientWidth),'Compact editor has no horizontal overflow');
 await page.screenshot({path:tmpdir()+'/pct-combat-position-layout.png'});

 console.log('Settings browser checks passed: grouping, saved values, radio selection, keyboard navigation, native submission, blocked-hit ablation label and homebrew marker, and repeated rendering.');
} finally {await browser.close();}
