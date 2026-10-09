import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:550,height:900}});
 await page.setContent('<style>body{font:14px Arial;padding:12px}section{box-sizing:border-box;border:1px solid #555;padding:8px}button{width:100%}</style><section class="pneuma-status-cleanup-card"></section>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({content:(await readFile('dist/scripts/chat-buttons.js','utf8')).replaceAll('export ','')});
 await page.addScriptTag({content:(await readFile('dist/scripts/shared.js','utf8')).replaceAll('export ','')});
 await page.addScriptTag({content:(await readFile('dist/scripts/status-catalog.js','utf8')).replaceAll('export ','')});
 await page.addScriptTag({content:(await readFile('dist/scripts/combat-report.js','utf8')).replace(/^import .*$/gm,'').replaceAll('export ','')});
 await page.addScriptTag({content:(await readFile('dist/scripts/combat-summary.js','utf8')).replace(/^import .*$/gm,'').replaceAll('export ','')});
 await page.evaluate(()=>{
  window.foundry={utils:{getProperty:(object,path)=>path.split(".").reduce((value,key)=>value?.[key],object)}};
  const actor={uuid:'Actor.player',name:'Solo <one>',hasPlayerOwner:true,items:[],effects:[{uuid:'addiction',name:'Addiction',disabled:false}]};
  const summary={actors:[actor],round:5,players:1,npcs:3,defeated:['Guard'],partial:false,criticals:[{actor:actor.uuid,actorName:actor.name,item:'injury',name:'Broken Arm'}],effects:[{actor,uuid:'fire',name:'On Fire'},{actor,uuid:'addiction',name:'Addiction'}]};
  document.querySelector('section').innerHTML=combatSummaryHTML(summary)+'<button data-copy-combat-summary data-chat-icon="fa-copy">Copy Discord Markdown</button><button data-status-cleanup data-gm-only="true">Clear Token Status Effects</button>';
  styleChatButtons(document.querySelector('section'),true);
 });
 assert.equal(await page.locator('.pneuma-combat-summary').count(),1);
 assert.equal(await page.locator('[data-copy-combat-summary]').evaluate(el=>el.classList.contains('pneuma-chat-button')),true);
 assert.equal(await page.locator('[data-copy-combat-summary]').getAttribute('data-chat-role'),'player');
 assert.equal(await page.locator('[data-status-cleanup]').getAttribute('data-chat-role'),'gm');
 assert.equal(await page.locator('[data-copy-combat-summary] .fa-copy').count(),1);

 assert.ok(!(await page.locator('.pneuma-combat-summary').textContent()).includes('Broken Arm'));
 assert.ok((await page.locator('.pneuma-combat-summary').textContent()).includes('Recorded player injury additions: 1'));
 for(const width of [260,300,400]){
  await page.locator('section').evaluate((el,width)=>el.style.width=width+'px',width);
  assert.ok(await page.locator('section').evaluate(el=>el.scrollWidth<=el.clientWidth),'Summary fits width '+width);
  assert.equal(await page.locator('[data-status-cleanup]').isVisible(),true);
 }
 console.log('Combat summary browser checks passed: escaped content, removed injuries, cleanup button and 260/300/400px layout.');
}finally{await browser.close();}
