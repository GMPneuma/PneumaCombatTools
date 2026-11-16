import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Handlebars from 'handlebars';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
Handlebars.registerHelper('checked',v=>v?'checked':'');
Handlebars.registerHelper('selectOptions',(choices,{hash})=>new Handlebars.SafeString(Object.entries(choices).map(([value,label])=>`<option value="${value}" ${value===hash.selected?'selected':''}>${label}</option>`).join('')));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:850}});
 const source=(await readFile('dist/scripts/aoe/settings.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'');
 await page.addScriptTag({content:`window.FormApplication=class{activateListeners(){}};window.markHomebrew=()=>{};window.saved={};window.game={user:{isGM:true},settings:{get:()=>saved,set:async(m,k,v)=>{window.saved=v;}}};${source};window.form=new AreaSettingsForm();`});
 const data=await page.evaluate(()=>form.getData());
 const html=Handlebars.compile(await readFile('src/templates/area-settings.hbs','utf8'))(data);
 await page.setContent(`<style>*{box-sizing:border-box}body{font:14px Arial;background:#282828;margin:16px;color:#222}.window-app{width:720px;height:650px;background:#eee;display:flex;flex-direction:column}.window-header{padding:8px;background:#333;color:white;font-weight:bold}.window-content{padding:10px;flex:1;min-height:0}input,select,button{font:inherit;height:30px;border:1px solid #999;border-radius:3px;background:transparent;color:inherit}input[type=checkbox]{width:20px;height:20px}h3{border-bottom:1px solid #933}p{line-height:1.4}form .notes,form .hint{flex:0 0 100%}.sheet-footer button{width:100%}</style><section class="window-app"><header class="window-header">Area Attacks &amp; Suppressive Fire</header><main class="window-content">${html}</main></section>`);
 await page.addStyleTag({content:await readFile('src/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>form.activateListeners({0:document.querySelector('form')}));
 assert.deepEqual(await page.locator('[name=evade] option').allTextContents(),['RAW','Follow Homebrew Evasion','Homebrew: Anyone','Homebrew: No one']);
 await page.selectOption('[name=evade]','homebrew');await page.check('[name=evadeOnce]');
 assert.match(await page.locator('[data-evasion-help]').textContent(),/free attempts/);
 assert.equal(await page.locator('[name=evadeBorrow]').isDisabled(),true);
 await page.check('[name=evadeMove]');assert.equal(await page.locator('[name=evadeBorrow]').isEnabled(),true);
 await page.click('[data-area-select=blast]');await page.fill('[name=blastSize]','12');await page.click('[data-area-select=shell]');await page.click('[data-area-select=blast]');assert.equal(await page.inputValue('[name=blastSize]'),'12');
 await page.evaluate(async()=>{const values=Object.fromEntries(new FormData(document.querySelector('form')));for(const input of document.querySelectorAll('input[type=checkbox]'))values[input.name]=input.checked;await form._updateObject(null,values);});
 assert.equal(await page.evaluate(()=>saved.evadeOnce),true);assert.equal(await page.evaluate(()=>saved.evade),'homebrew');
 await page.locator('.pneuma-area-help').evaluate(el=>el.open=true);
 for(const width of [720,900,1100]){
  await page.locator('.window-app').evaluate((el,w)=>el.style.width=w+'px',width);
  assert.equal(await page.locator('form').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  const bounds=await page.locator('[name=evade]').boundingBox();assert.ok(bounds.width>250);
  const layout=await page.evaluate(()=>{
   const columns=[...document.querySelectorAll('.pneuma-area-rule-column')];
   const details=document.querySelector('.pneuma-area-help').getBoundingClientRect();
   return columns.flatMap(column=>[...column.children].filter(el=>el.tagName!=='LEGEND').map(el=>({bottom:el.getBoundingClientRect().bottom,panelBottom:column.getBoundingClientRect().bottom,detailsTop:details.top})));
  });
  for(const box of layout){assert.ok(box.bottom<=box.panelBottom,'Control overflows its panel');assert.ok(box.bottom<=box.detailsTop,'Control overlaps Rule details');}
 }
 await page.locator('.window-app').evaluate(el=>el.style.width='720px');
 await page.click('[data-area-select=shell]');
 await page.locator('.window-app').screenshot({path:'docs/area-settings-preview.png'});
 console.log('AoE settings: options, dependent controls, draft retention, saving, and panel containment with native note sizing and expanded details at 720/900/1100px passed.');
}finally{await browser.close();}
