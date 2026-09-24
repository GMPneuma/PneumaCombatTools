import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:740,height:480}});
 await page.setContent('<style>body{font:16px Arial;background:#eee;padding:16px}.form-group{display:flex}label{flex:1}.form-fields{display:flex;flex:1}select{width:100%;height:30px}#settings-config .form-group button{flex:0 0 24px}fieldset{margin:0}button{box-sizing:border-box}</style><form id="settings-config"><div class="pneuma-combat-settings"><fieldset><legend>Evasion &amp; Area Attacks</legend><div class="form-group"><label>Ranged Evasion</label><div class="form-fields pneuma-evasion-controls"><select aria-label="Evasion"><option>Homebrew</option></select><button type="button" data-key="pneuma-combattools.configureEvasion"><i>☷</i><span>Homebrew</span></button></div></div></fieldset></div></form>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>{document.querySelector('button').onclick=()=>window.menuOpened=true;});
 for(const width of [650,480,360]) {
  await page.locator('form').evaluate((el,w)=>el.style.width=w+'px',width);
  const dimensions=await page.locator('button').evaluate(el=>{const b=el.getBoundingClientRect(),s=el.querySelector('span').getBoundingClientRect(),select=el.previousElementSibling.getBoundingClientRect(),f=el.closest('fieldset').getBoundingClientRect();return {fits:el.scrollWidth<=el.clientWidth,labelInside:s.left>=b.left&&s.right<=b.right,noOverlap:select.right<=b.left&&select.width>=80,inBounds:b.right<=f.right,height:b.height};});
  assert.deepEqual(dimensions,{fits:true,labelInside:true,noOverlap:true,inBounds:true,height:28});
 }
 await page.locator('button').click();assert.equal(await page.evaluate(()=>window.menuOpened),true);
 await page.locator('form').evaluate(el=>el.style.width='650px');
 await mkdir('dist/test-artifacts',{recursive:true});await page.screenshot({path:'dist/test-artifacts/settings-homebrew.png'});
 const source=(await readFile('dist/scripts/eye-hud.js','utf8')).replace(/^import .*$/gm,'').replaceAll('export ','');
 for(const crewActive of [false,true]) {
  const context=await browser.newContext();const p=await context.newPage();
  await p.evaluate(active=>{window.FormApplication=class{};window.Hooks={on(){},once(){}};window.registerHUDMessages=()=>{};window.values={eyeHUDDock:'right',crewHUDIntegration:false};window.registered={};window.game={modules:{get:id=>id==='pneuma-crewtools'?{active}:{}},settings:{register:(_m,k,v)=>registered[k]=v,registerMenu(){},get:(_m,k)=>values[k]??registered[k]?.default}};},crewActive);
  await p.addScriptTag({content:source+';registerEyeHUD();'});
  assert.deepEqual(await p.evaluate(()=>({dock:registered.eyeHUDDock.default,integration:registered.crewHUDIntegration.default,visible:registered.crewHUDIntegration.config,savedDock:game.settings.get('', 'eyeHUDDock'),savedIntegration:game.settings.get('', 'crewHUDIntegration')})),{dock:'left',integration:true,visible:crewActive,savedDock:'right',savedIntegration:false});
  await context.close();
 }
 console.log('Homebrew button fits at three settings widths; menu click and HUD defaults with/without Crew availability passed; saved preferences preserved.');
} finally {await browser.close();}
