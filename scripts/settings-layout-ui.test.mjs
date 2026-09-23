import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || "playwright");
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
 const page=await browser.newPage({viewport:{width:640,height:1000}});
 await page.setContent('<form style="width:560px;font:14px Arial;background:#eee;padding:16px"></form>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({content:(await readFile('dist/scripts/settings-layout.js','utf8')).replaceAll('export ','')+'\nwindow.groupModuleSettings=groupModuleSettings;'});
 const result=await page.evaluate(()=>{
  const form=document.querySelector('form');
  const defs={combatBarDock:['bottom-left','top-right'],combatBarOrientation:['vertical','horizontal']};
  const keys=['injuryTurnEndReminder','movementTracking','showArmorControls','npcAutoEvasion','combatBar',...Object.keys(defs),'combatBarSize','criticalInjuries','eyeHUD','eyeHUDDock','biomonitorShowHP'];
  for(const key of keys){const row=document.createElement('div');row.className='form-group';row.innerHTML='<label>'+key+'</label>'+(defs[key]?'<select name="pneuma-combattools.'+key+'">'+defs[key].map(v=>'<option>'+v+'</option>').join('')+'</select>':'<input name="pneuma-combattools.'+key+'" type="checkbox">');form.append(row);}
  groupModuleSettings(form);groupModuleSettings(form);
  const radios=[...form.querySelectorAll('input[type=radio]')];
  const initial=radios.map(r=>r.checked);
  radios[2].click();
  return {count:radios.length,initial,checked:radios.map(r=>r.checked),values:Object.fromEntries(new FormData(form)),groups:[...form.querySelectorAll('legend')].map(l=>l.textContent),hidden:form.querySelector('select[name$="Orientation"]').closest('.form-group').hidden};
 });
 assert.equal(result.count,4);assert.deepEqual(result.initial,[false,true,false,false]);assert.deepEqual(result.checked,[false,false,true,false]);
 assert.equal(result.values['pneuma-combattools.combatBarDock'],'top-right');assert.equal(result.values['pneuma-combattools.combatBarOrientation'],'horizontal');assert.equal(result.hidden,true);
 assert.deepEqual(result.groups,['Attack & Damage Cards','Evasion & Area Attacks','Movement & Initiative','Injuries & Effects','Combat Bar','Status HUD & Biomonitor']);
 await page.locator('input[type=radio]').nth(2).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('input[type=radio]').nth(3).isChecked(),true);
 await page.screenshot({path:tmpdir()+'/pct-settings-cleanup.png'});
 console.log('Settings browser checks passed: grouping, saved values, radio selection, keyboard navigation, native submission and repeated rendering.');
} finally {await browser.close();}
