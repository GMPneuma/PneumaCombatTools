import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:550,height:900}});
 await page.setContent('<style>body{font:14px Arial;padding:12px}section{box-sizing:border-box;border:1px solid #555;padding:8px}button{width:100%}</style><section class="pneuma-status-cleanup-card"></section>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({content:(await readFile('dist/scripts/shared.js','utf8')).replaceAll('export ','')});
 await page.addScriptTag({content:'const masterStatuses=[];'+(await readFile('dist/scripts/combat-summary.js','utf8')).replace(/^import .*$/gm,'').replaceAll('export ','')});
 await page.evaluate(()=>{
  const actor={uuid:'Actor.player',name:'Solo <one>',items:[],effects:[{uuid:'addiction',name:'Addiction',disabled:false}]};
  const summary={actors:[actor],round:5,players:1,npcs:3,defeated:['Guard'],partial:false,criticals:[{actor:actor.uuid,actorName:actor.name,item:'injury',name:'Broken Arm'}],effects:[{actor,uuid:'fire',name:'On Fire'},{actor,uuid:'addiction',name:'Addiction'}]};
  document.querySelector('section').innerHTML=combatSummaryHTML(summary)+'<button data-status-cleanup>Clear Token Status Effects</button>';
 });
 assert.equal(await page.locator('.pneuma-combat-summary').count(),1);
 assert.ok((await page.locator('li').textContent()).includes('Solo <one>: Broken Arm (no longer present)'));
 for(const width of [260,300,400]){
  await page.locator('section').evaluate((el,width)=>el.style.width=width+'px',width);
  assert.ok(await page.locator('section').evaluate(el=>el.scrollWidth<=el.clientWidth),'Summary fits width '+width);
  assert.equal(await page.locator('[data-status-cleanup]').isVisible(),true);
 }
 console.log('Combat summary browser checks passed: escaped content, removed injuries, cleanup button and 260/300/400px layout.');
}finally{await browser.close();}
