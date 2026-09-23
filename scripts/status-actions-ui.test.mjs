import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
 const page=await browser.newPage({viewport:{width:700,height:500}});
 await page.setContent('<body style="background:#17222c"><section id="pneuma-eye-hud" style="left:20px;top:20px;width:220px;height:130px;overflow:auto"><div id="lamps" class="pneuma-eye-lamps"><span class="pneuma-eye-lamp is-on" data-kind="fire">ON FIRE</span><span class="pneuma-eye-lamp is-on" data-kind="intrusion">NEURAL INTRUSION</span></div></section></body>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({type:'module',content:'const forceOutEntries=()=>[{messageId:"a",name:"Pex"},{messageId:"b",name:"Unknown Netrunner"},{messageId:"c",name:"Unknown Netrunner"}]; const beginForceOut=async m=>window.ejected=m.id; const clearInstantCondition=async()=>window.extinguished=true; const game={messages:{get:id=>({id})}}; const ui={notifications:{error:console.error}};'+(await readFile('dist/scripts/neural-intrusion.js','utf8')).replace(/^import .*;\s*/gm,'')+';window.closeStatusActions=closeStatusActions;bindStatusActions(document.getElementById("lamps"),{isOwner:true},()=>{});'});
 const dimensions=()=>page.locator('#pneuma-eye-hud').evaluate(e=>[e.offsetWidth,e.offsetHeight,e.scrollWidth,e.scrollHeight]);
 const before=await dimensions();
 await page.locator('[data-kind="intrusion"]').click({button:'right'});
 assert.equal(await page.locator('body > .pneuma-status-actions').count(),1);
 assert.deepEqual(await dimensions(),before);
 assert.equal(await page.locator('.pneuma-status-actions button').count(),3);
 assert.match(await page.locator('.pneuma-status-actions').innerText(),/Unknown Netrunner \(3\)/);
 const row=page.locator('.pneuma-status-actions button').first();const bounds=await row.boundingBox();await row.hover();assert.deepEqual(await row.boundingBox(),bounds);
 assert.equal(await row.locator('i').evaluate(e=>getComputedStyle(e).fontSize),'14px');
 await page.screenshot({path:process.env.TEMP+'/pct-status-floating.png'});
 await row.click();assert.equal(await page.evaluate(()=>window.ejected),'a');
 await page.locator('[data-kind="fire"]').click({button:'right'});await page.getByRole('menuitem',{name:'Extinguish'}).click();assert.equal(await page.evaluate(()=>window.extinguished),true);
 await page.locator('[data-kind="intrusion"]').click({button:'right'});await page.keyboard.press('Escape');assert.equal(await page.locator('.pneuma-status-actions').count(),0);
 await page.evaluate(()=>{Object.assign(document.getElementById('pneuma-eye-hud').style,{left:'480px',top:'400px'});});
 await page.locator('[data-kind="intrusion"]').click({button:'right'});const menu=await page.locator('.pneuma-status-actions').boundingBox();assert.ok(menu.x>=8&&menu.x+menu.width<=692&&menu.y+menu.height<=492);
 await page.evaluate(()=>{closeStatusActions();document.getElementById('lamps').remove();});await page.waitForFunction(()=>!document.querySelector('.pneuma-status-actions'));
 console.log('Floating status menu passed: layout stability, compact icons, actions, dismissal, edge clamping and cleanup.');
} finally {await browser.close();}
