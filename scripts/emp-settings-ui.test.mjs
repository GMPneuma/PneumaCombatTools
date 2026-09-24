import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:650,height:950}});
 await page.setContent('<style>body{font:14px Arial;background:#eee;padding:16px}#pneuma-emp-settings{width:500px}.form-group{display:flex;align-items:center;gap:8px;margin:8px 0;flex-wrap:wrap}.form-group>label{flex:2}select{height:28px}p.notes{font-size:12px;color:#555;margin:6px 0}fieldset{border:1px solid #aaa}legend{font-weight:bold}button{width:100%;height:28px}textarea{box-sizing:border-box}</style><section id="pneuma-emp-settings"></section>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({path:process.env.PNEUMA_HANDLEBARS_SOURCE});
 await page.evaluate(()=>{
 window.FormApplication=class{activateListeners(){}};window.markHomebrew=()=>{};
 window.saved={empBehavior:{},empImmunity:''};window.game={user:{isGM:true},settings:{get:(_,k)=>saved[k],set:async(_,k,v)=>saved[k]=v}};
 window.foundry={utils:{expandObject:data=>{const out={};for(const [key,v]of Object.entries(data)){const parts=key.split('.');if(parts.length===2)(out[parts[0]]??={})[parts[1]]=v;else out[key]=v;}return out;}}};
 Handlebars.registerHelper('checked',v=>v?'checked':'');
 Handlebars.registerHelper('selectOptions',(choices,options)=>new Handlebars.SafeString(Object.entries(choices).map(([v,t])=>`<option value="${v}"${v===options.hash.selected?' selected':''}>${t}</option>`).join('')));
 });
 for(const file of ['emp-behavior','emp-settings'])await page.addScriptTag({content:(await readFile(`dist/scripts/${file}.js`,'utf8')).replace(/^import .*$/gm,'').replaceAll('export ','')});
 await page.evaluate(template=>{
 window.render=()=>{const form=new EmpSettingsForm();const root=document.querySelector('#pneuma-emp-settings');root.innerHTML=Handlebars.compile(template)(form.getData());form.activateListeners([root]);window.save=()=>{const data={};root.querySelectorAll('[name]').forEach(el=>data[el.name]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value);return form._updateObject({},data);};};render();
 },await readFile('dist/templates/emp-settings.hbs','utf8'));
 assert.equal(await page.locator('details[open]').count(),0);
 await mkdir('dist/test-artifacts',{recursive:true});
 await page.screenshot({path:'dist/test-artifacts/emp-settings-default.png'});
 await page.selectOption('[name="player.method"]','shortlist');
 assert(await page.locator('[data-shortlist-options]').last().isVisible());
 await page.locator('summary').filter({hasText:'Internal frame'}).click();
 assert(!await page.locator('[name="framePenalty"]').isVisible());
 await page.check('[name="frameActionPenalty"]');await page.fill('[name="framePenalty"]','4');
 await page.check('[name="frameReduceMove"]');await page.fill('[name="frameMoveReduction"]','3');
 await page.check('[name="frameNoMove"]');assert(!await page.locator('[name="frameMoveReduction"]').isVisible());
 await page.evaluate(async()=>{await save();render();});
 assert.equal(await page.locator('[name="framePenalty"]').inputValue(),'4');
 assert.equal(await page.locator('[name="frameMoveReduction"]').inputValue(),'3');
 assert.equal(await page.locator('details[open]').count(),1);
 await page.uncheck('[name="frameNoMove"]');assert(await page.locator('[name="frameMoveReduction"]').isVisible());
 await page.locator('summary').filter({hasText:'Protection'}).click();await page.fill('[name="immunity"]','Shielded implant');await page.selectOption('[name="hardened"]','consume');
 await page.evaluate(async()=>{await save();render();});assert.equal(await page.locator('details[open]').count(),2);
 assert.equal(await page.locator('[name="immunity"]').inputValue(),'Shielded implant');
 assert(await page.locator('#pneuma-emp-settings').evaluate(el=>el.scrollWidth<=el.clientWidth));
 await page.screenshot({path:'dist/test-artifacts/emp-settings-configured.png'});
 await page.locator('.pneuma-emp-settings-body').evaluate(el=>el.scrollTop=el.scrollHeight);
 await page.screenshot({path:'dist/test-artifacts/emp-settings-frame.png'});
 console.log('EMP settings layout, conditional controls, and save/reopen checks passed.');
} finally {await browser.close();}
