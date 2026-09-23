import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:620,height:480}});
 await page.setContent(`<div class="window-app" id="attack" style="position:absolute;top:60px;left:30px;width:500px;height:350px;display:flex;flex-direction:column"><header class="window-header" style="height:30px;flex:none">Thrown Weapon</header><section class="window-content"><form class="dialog-sheet"><div>Rolling for Thrown Weapon</div><div class="dialog-grid"><ol class="dialog-list"><li class="dialog-item flexrow"><span>Additional Mods:</span><div class="dialog-item-input"><input name="additionalMods" value="1,-2"></div></li><li class="pneuma-improvised-damage-choice"><label>Improvised damage (GM agreed)<select><option>3d6</option></select></label></li><li class="pneuma-unaware-choice"><label><input type="checkbox">Defender is unaware</label></li><li class="total-mods">Total Mods: -1</li></ol></div><div class="situational">${'<p>Situational modifier option</p>'.repeat(15)}</div><div class="dialog-footer" style="display:flex"><button name="confirm">Confirm</button><button name="cancel">Cancel</button></div></form></section></div>`);
 await page.addStyleTag({content:'body{font:14px Arial;background:#333}.window-header{color:white;padding:5px;box-sizing:border-box}.window-content{background:#ddd;padding:10px;flex:1}.dialog-list{list-style:none;padding:0}.dialog-item{display:flex;justify-content:space-between}.dialog-footer button{flex:1;height:32px}input{border:0}li{padding:5px 0}'});
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 const code=(await readFile('dist/scripts/native-combat.js','utf8')).replace(/^import .*$/gm,'');
 await page.addScriptTag({type:'module',content:code+'\nwindow.layoutAttackDialog=layoutAttackDialog;'});
 await page.waitForFunction(()=>!!window.layoutAttackDialog);
 await page.evaluate(()=>{
  window.changes=0;window.confirms=0;
  document.querySelector('[name=additionalMods]').addEventListener('change',()=>changes++);
  document.querySelector('[name=confirm]').addEventListener('click',e=>{e.preventDefault();confirms++});
  window.app={setPosition:({height,top})=>{const root=document.querySelector('#attack');root.style.height=height+'px';root.style.top=top+'px';}};
  layoutAttackDialog(app,document.querySelector('#attack'));layoutAttackDialog(app,document.querySelector('#attack'));
 });
 await page.waitForFunction(()=>document.querySelector('#attack').getBoundingClientRect().bottom<=innerHeight-7);
 assert.equal(await page.locator('.pneuma-attack-dialog-body').count(),1);
 assert.equal(await page.locator('.pneuma-modifier-hint').count(),1);
 const footer=await page.locator('.dialog-footer').boundingBox();assert.ok(footer.y+footer.height<=480);
 assert.ok(await page.locator('.pneuma-attack-dialog-body').evaluate(n=>n.scrollHeight>n.clientHeight));
 await page.locator('[name=additionalMods]').fill('2,-3');await page.locator('[name=additionalMods]').dispatchEvent('change');
 await page.locator('[name=confirm]').click();assert.equal(await page.evaluate(()=>confirms),1);assert.ok(await page.evaluate(()=>changes)>0);
 assert.equal(await page.locator('[name=additionalMods]').inputValue(),'2,-3');
 assert.equal(await page.locator('[name=additionalMods]').evaluate(n=>getComputedStyle(n).borderTopWidth),'1px');
 await page.screenshot({path:process.env.TEMP+'/pct-attack-dialog-short.png'});
 await page.setViewportSize({width:620,height:900});
 await page.evaluate(()=>{document.querySelector('.situational').remove();layoutAttackDialog(app,document.querySelector('#attack'));});
 await page.waitForFunction(()=>document.querySelector('#attack').getBoundingClientRect().height<450);
 assert.ok(await page.locator('.pneuma-attack-dialog-body').evaluate(n=>n.scrollHeight<=n.clientHeight+1));
 console.log('Attack dialog checks passed: viewport sizing, fixed footer, scrollable body, visible modifiers, idempotent layout and preserved native inputs/listeners.');
} finally {await browser.close()}
