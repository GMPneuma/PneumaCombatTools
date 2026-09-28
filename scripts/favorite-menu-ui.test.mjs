import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:700,height:700}});
 await page.setContent('<button data-pneuma-manual-rolls style="position:absolute;left:150px;top:550px">ROLL</button>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>{
  window.M='pneuma-combattools';window.saved=[{kind:'skill',name:'Deleted Skill'},{kind:'roleAbility',subtype:'mainRoleAbility',name:'Removed Ability'}];
  window.game={user:{isGM:false,update:async changes=>{saved=Object.values(changes)[0];}}};
  window.foundry={utils:{getProperty:()=>saved}};window.canvas={tokens:{controlled:[]}};
  window.basePrompt=window.statPrompt=window.damagePrompt=window.criticalPrompt=async()=>{};
  window.report=error=>{window.failure=error.message;};
 });
 const favorites=(await readFile('dist/scripts/roll-favorites.js','utf8')).replace(/^import .*;\s*/gm,'');
 const manual=await readFile('dist/scripts/manual-rolls.js','utf8');
 const menu=manual.slice(manual.indexOf('let closeRollFlyout'),manual.indexOf('export function registerManualRolls'));
 await page.addScriptTag({type:'module',content:favorites+'\n'+menu+'\nwindow.openMenu=openManualRolls;'});
 await page.waitForFunction(()=>typeof window.openMenu==="function");
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.evaluate(()=>openMenu());
 assert.equal(await page.locator('[data-remove-favorite]').count(),2);
 const row=page.locator('.pneuma-roll-favorite-row').first();
 const bounds=await row.boundingBox(),remove=await row.locator('[data-remove-favorite]').boundingBox();
 assert.ok(remove.width>=24 && remove.x+remove.width<=bounds.x+bounds.width+1);
 await row.locator('[data-remove-favorite]').click();
 await page.waitForFunction(()=>saved.length===1);
 assert.equal(await page.locator('.pneuma-roll-favorite-row').count(),1);
 await page.locator('[data-remove-favorite]').focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>saved.length===0);
 assert.equal(await page.locator('.pneuma-roll-favorite-row').count(),0);
 assert.equal(await page.evaluate(()=>window.failure),undefined);
 console.log('Favorite menu: stale entries removed with no token, mouse and keyboard, compact layout passed.');
} finally {await browser.close();}
