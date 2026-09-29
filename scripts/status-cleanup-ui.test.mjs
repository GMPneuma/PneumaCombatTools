import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:850,height:850}});
 page.on('pageerror',error=>{throw error;});
 await page.setContent('<style>body{font:14px Arial;background:#333;padding:20px}.window{width:720px;background:#eee;padding:12px;box-sizing:border-box}.form-group{display:flex;flex-wrap:wrap;margin:9px 0}.form-group label{flex:1}.notes{flex:0 0 100%;margin:4px 0;color:#444;font-size:12px}.flexrow{display:flex;gap:8px}button{padding:6px;flex:1}input{vertical-align:middle}li{margin-bottom:4px}</style><div class="window"><h2>Clean Status Effects</h2><div id="content"></div></div>');
 await page.addScriptTag({path:'node_modules/.pnpm/handlebars@4.7.9/node_modules/handlebars/dist/handlebars.js'});
 const template=await readFile('src/templates/status-cleanup.hbs','utf8');
 await page.evaluate(template=>{
  Handlebars.registerHelper('checked',value=>value?'checked':'');
  window.render=Handlebars.compile(template);
  window.baseRows=[
   {id:'expired',actor:'Solo <one>',name:'Prone',reason:'References an ended or missing combat',operation:'Clear status effect',selected:true},
   {id:'injury',actor:'Solo <one>',name:'Broken Arm',reason:'Permanent critical injury',operation:'Remove injury item and linked status',selected:false,injury:true,blocked:true},
   {id:'blocked',actor:'Netrunner',name:'Sleep',reason:'Blocked: actor is in a started encounter',operation:'Clear status effect',blocked:true}
  ];
  window.game={user:{isGM:true}};
  window.cleanupRows=(_scope,include)=>baseRows.map(r=>({...r,actor:{name:r.actor},blocked:r.injury?!include:r.blocked}));
  window.applyCleanup=async(_scope,ids)=>ids.map(id=>'Cleared '+id);
  const wrap=root=>({find:selector=>({on:(name,fn)=>root.querySelectorAll(selector).forEach(el=>el.addEventListener(name,fn))})});
  window.FormApplication=class{
   activateListeners(){}
   render(){const root=document.getElementById('content');root.innerHTML=render(this.getData());this.activateListeners(wrap(root));root.querySelector('form').addEventListener('submit',event=>{event.preventDefault();this._updateObject(event,{effects:[...root.querySelectorAll('[name=effects]:checked:not(:disabled)')].map(e=>e.value)});});return this;}
  };
 },template);
 const source=await readFile('dist/scripts/status-cleanup.js','utf8');
 const form=source.slice(source.indexOf('export class StatusCleanup'),source.indexOf('const notices'));
 await page.addScriptTag({type:'module',content:form+'\nwindow.form=new StatusCleanup();form.render();'});
 assert.equal(await page.locator('[value=expired]').isChecked(),true);
 assert.equal(await page.locator('[value=injury]').isDisabled(),true);
 assert.equal(await page.locator('[value=blocked]').isDisabled(),true);
 assert.match(await page.locator('#content').innerText(),/Solo <one>/);
 assert.equal(await page.locator('one').count(),0);
 await page.getByLabel('Include permanent critical injuries').check();
 assert.equal(await page.locator('[value=injury]').isEnabled(),true);
 assert.equal(await page.locator('[value=injury]').isChecked(),false);
 await page.locator('[value=injury]').check();
 await page.getByRole('button',{name:'Clear Selected'}).click();
 assert.match(await page.locator('#content').innerText(),/Cleared injury/);
 assert.equal(await page.locator('[value=blocked]').isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:process.env.TEMP+'/pneuma-status-cleanup.png',fullPage:true});
 console.log('Cleanup window: actual template/class, protected defaults, injury opt-in, submission/results and escaped names passed.');
}finally{await browser.close();}
