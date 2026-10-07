import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:800}});
 await page.setContent('<style>body{font:13px Arial}#token-hud{position:absolute;left:60px;top:70px}.col{width:40px}</style><div id="token-hud"></div>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({path:process.env.PNEUMA_HANDLEBARS_SOURCE});
 await page.addScriptTag({content:(await readFile('dist/scripts/medical-menu.js','utf8')).replaceAll('export ','')});
 await page.evaluate(template=>{
  Handlebars.registerHelper('eq',(a,b)=>a===b);Handlebars.registerHelper('localize',s=>s);
  const rows=[{action:'stabilize',skill:'First Aid',groupLabel:'Stabilize — DV15',choiceLabel:'First Aid (12)',label:'Stabilize — DV15 (1st Aid 12)'},{action:'stabilize',skill:'Paramedic',groupLabel:'Stabilize — DV15',choiceLabel:'Paramedic (10)',label:'Stabilize — DV15 (Para 10)'}];
  const quick=rows.map(row=>({...row,action:'quickFix',item:'injury',groupLabel:'Broken Arm',choiceLabel:row.skill+' — DV13 (12)'}));
  quick.push({action:'quickFix',item:'single',skill:'Paramedic',label:'Damaged Eye — DV15 (Para 10)'});
  document.querySelector('#token-hud').innerHTML=Handlebars.compile(template)({medicalAvailable:true,medical:medicalMenuGroups(rows),medicalQuickFix:medicalMenuGroups(quick)});
  document.querySelector('[data-medical-menu]').hidden=false;
 },await readFile('dist/templates/combat-hud.hbs','utf8'));
 const details=page.locator('.pneuma-medical-choices');assert.equal(await details.count(),2);
 assert.equal(await page.locator('[data-medical-action="stabilize"]').first().isVisible(),false);
 await details.first().locator('summary').click();
 assert.equal(await page.locator('[data-medical-action="stabilize"]').count(),2);
 assert.equal(await page.locator('[data-medical-action="stabilize"][data-medical-skill="Paramedic"]').isVisible(),true);
 await details.nth(1).locator('summary').click();
 assert.equal(await page.locator('[data-medical-item="injury"]').count(),2);
 assert.equal(await page.locator('[data-medical-item="single"]').isVisible(),true,'Single skill remains direct');
 assert.equal(await page.locator('[data-medical-menu]').evaluate(el=>el.scrollWidth<=el.clientWidth),true,'Menu has no horizontal overflow');
 await details.first().locator('summary').click();assert.equal(await page.locator('[data-medical-action="stabilize"]').first().isVisible(),false);
 console.log('Medical submenu browser checks passed: click expansion/collapse, both skills, injury grouping, direct single choices and layout.');
}finally{await browser.close();}
