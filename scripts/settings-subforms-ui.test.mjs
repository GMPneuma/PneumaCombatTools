import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:740,height:1000}});
 await page.setContent('<style>body{font:14px Arial;background:#eee;padding:16px}section{width:620px;margin-bottom:20px}input,select,button{box-sizing:border-box;height:28px}button{cursor:pointer}.form-group{display:flex;flex-wrap:wrap;align-items:center;margin:8px 0}.form-group>label{flex:3}.form-fields{display:flex;flex:2}.notes{color:#555;font-size:12px}.sheet-footer>*{flex:1}</style><section class="pneuma-combat-settings"><fieldset><legend>Evasion</legend><div class="form-group"><label>Show armor controls on normal damage cards</label><input type="checkbox"></div><div class="form-group"><label>Ranged Evasion</label><div class="form-fields pneuma-evasion-controls"><select><option>Homebrew</option></select><button><i>≡</i> Homebrew</button></div></div></fieldset></section><section id="pneuma-quickhack-settings"></section><section id="pneuma-custom-statuses"></section>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({path:tmpdir()+'/pneuma-handlebars-4.7.8.min.js'});
 await page.evaluate(()=>{window.MODULE='pneuma-combattools';window.FormApplication=class{};window.game={settings:{get:()=>({})},i18n:{format:k=>k}};window.normalizeRoutingConfig=()=>({});Handlebars.registerHelper('localize',s=>s);Handlebars.registerHelper('selectOptions',(choices,options)=>new Handlebars.SafeString(Object.entries(choices).map(([v,t])=>'<option value="'+v+'"'+(v===options.hash.selected?' selected':'')+'>'+t+'</option>').join('')));});
 await page.addScriptTag({content:(await readFile('dist/scripts/quickhack/settings.js','utf8')).replace(/^import .*$/gm,'').replaceAll('export ','')+'\nwindow.QuickhackSettings=QuickhackSettings;'});
 await page.evaluate(({quick,custom})=>{
 document.querySelector('#pneuma-quickhack-settings').innerHTML=Handlebars.compile(quick)(new QuickhackSettings().getData());
 document.querySelector('#pneuma-custom-statuses').innerHTML=Handlebars.compile(custom)({rows:[{id:'jail',name:'In Jail',img:'modules/pneuma-combattools/styles/in-jail.svg'}]});
 },{quick:await readFile('dist/templates/quickhack-settings.hbs','utf8'),custom:await readFile('dist/templates/custom-statuses.hbs','utf8')});
 assert.equal(await page.locator('#pneuma-quickhack-settings fieldset').count(),3);
 assert.equal(await page.locator('#pneuma-quickhack-settings select').count(),6);
 assert.equal(await page.getByLabel('Status name',{exact:true}).inputValue(),'In Jail');
 const button=await page.locator('.pneuma-evasion-controls button').boundingBox();assert.equal(button.height,28);
 const label=await page.locator('.pneuma-combat-settings label').first().boundingBox();assert.ok(label.height<25,'Long checkbox label stays on one line with available space');
 await page.screenshot({path:tmpdir()+'/pct-settings-polish.png'});
 console.log('Settings subform browser checks passed.');
} finally {await browser.close();}
