import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 await page.setContent('<style>body{font:16px Arial;background:#ddd;padding:20px}li{list-style:none;padding:8px}.total-mods{border-top:1px solid #c00}label{display:flex;gap:8px}</style><h3>Attack</h3><ol><li>Additional modifiers: +2</li><li class="total-mods">Total Mods: <span></span></li></ol>');
 await page.addScriptTag({content:await readFile(process.env.PNEUMA_JQUERY_SOURCE,'utf8')});
 await page.evaluate(()=>{window.Hooks={on:(name,fn)=>window.hook=fn};});
 const code=(await readFile('dist/scripts/native-combat.js','utf8')).replace(/^import .*$/gm,'');
 await page.addScriptTag({type:'module',content:code+'\nwindow.startSmoke=smokeAttackDialog;registerAttackDialog();'});
 await page.waitForFunction(()=>window.startSmoke);
 await page.evaluate(()=>{
  window.roll={mods:[{id:'other',value:2,source:'Other'}],addMod(mods){this.mods.push(...mods)},removeMod(id){this.mods=this.mods.filter(m=>m.id!==id)},handleRollDialog(){app.render();return new Promise(resolve=>window.finish=resolve)}};
  window.app={rollData:roll,render(){document.querySelector('.total-mods span').textContent=String(roll.mods.reduce((n,m)=>n+m.value,0));hook(this,$('body'));}};
  window.pending=startSmoke(roll,{}, {},{},true);
 });
 assert.equal(await page.locator('.total-mods span').innerText(),'-2');
 await page.locator('.pneuma-smoke-choice input').check();
 assert.equal(await page.locator('.total-mods span').innerText(),'2');
 assert.equal(await page.locator('.pneuma-smoke-choice input').isChecked(),true);
 await page.evaluate(()=>app.render());assert.equal(await page.locator('.pneuma-smoke-choice').count(),1);
 await page.locator('.pneuma-smoke-choice input').uncheck();
 assert.equal(await page.locator('.total-mods span').innerText(),'-2');
 assert.equal(await page.evaluate(()=>roll.mods.filter(m=>m.id==='heavilyObscured-coreBook').length),1);
 await page.screenshot({path:process.env.TEMP+'/pct-smoke-dialog.png'});
 await page.evaluate(async()=>{finish(true);await pending;});
 console.log('Smoke dialog checks passed: native modifier total, ignore/reapply, rerender persistence and no duplicate rows.');
}finally{await browser.close();}
