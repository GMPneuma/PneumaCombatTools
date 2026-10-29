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
  const defs={combatBarDock:['bottom-left','top-right'],combatBarOrientation:['vertical','horizontal']};
  const keys=['routeSheetAttacks','injuryTurnEndReminder','movementTracking','showArmorControls','ablateBlockedHits','maNoAblation','npcAutoEvasion','combatBar','turnMarkerEnabled','turnMarkerDisplay','quickhackEnabled','quickhackMode',...Object.keys(defs),'combatBarSize','criticalInjuries','eyeHUD','eyeHUDDock','biomonitorShowHP','hoverDV','hoverAutofire'];
  for(const key of keys){const row=document.createElement('div');row.className='form-group';row.innerHTML='<label for="setting-'+key+'">'+key+'</label>'+(defs[key]?'<select id="setting-'+key+'" name="pneuma-combattools.'+key+'">'+defs[key].map(v=>'<option>'+v+'</option>').join('')+'</select>':'<input id="setting-'+key+'" name="pneuma-combattools.'+key+'" type="checkbox">');form.append(row);}
  const menu=document.createElement("div");menu.className="form-group submenu";menu.innerHTML='<label>Turn Indicator</label><button type="button" data-key="pneuma-combattools.turnMarkerSettings">Configure</button>';form.append(menu);menu.querySelector("button").addEventListener("click",()=>window.indicatorMenuOpened=true);
  form.querySelector('[name$=combatBar]').checked=true;form.querySelector('[name$=turnMarkerEnabled]').checked=true;
  for(let pass=0;pass<2;pass++){groupModuleSettings(form);for(const fn of settingsHooks.renderSettingsConfig??[])fn({},[form]);}
  const radios=[...form.querySelectorAll('input[type=radio]')];
  const initial=radios.map(r=>r.checked);
  radios[2].click();
  return {count:radios.length,initial,checked:radios.map(r=>r.checked),values:Object.fromEntries(new FormData(form)),groups:[...form.querySelectorAll('legend')].map(l=>l.textContent),hidden:form.querySelector('select[name$="Orientation"]').closest('.form-group').hidden};
 });
 assert.equal(result.count,4);assert.deepEqual(result.initial,[false,true,false,false]);assert.deepEqual(result.checked,[false,false,true,false]);
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
 console.log('Settings browser checks passed: grouping, saved values, radio selection, keyboard navigation, native submission, blocked-hit ablation label and homebrew marker, and repeated rendering.');
} finally {await browser.close();}
