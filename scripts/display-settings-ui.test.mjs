import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:620,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<style>body{font:14px Arial;background:#eee;padding:20px}.form-group{display:flex;flex-wrap:wrap;align-items:center;margin:14px 0}.form-group label{flex:1}.form-fields{width:220px}select,input[type=range]{width:220px}.notes{width:100%;font-size:12px;color:#555}button{padding:8px}footer{margin-top:20px}</style><h2></h2><form><div id="rows"></div><footer><button type="button" data-close>Done</button></footer></form>');
 await page.evaluate(()=>{
  window.FormApplication=class{activateListeners(){}close(){}render(){}};window.foundry={data:{fields:{DataField:class{}}}};
  window.values={eyeHUDDock:'right',crewHUDIntegration:true,biomonitorShowHP:true,forcePlayerHUDAnimations:false,eyeHUDAnimateMessages:true,biomonitorFlashSeconds:8,targetedRightClick:true,tightHUD:false,hudScale:1,statusIconScale:1,iconColor:'#ffc36a',combatBarDock:'bottom-left'};
  const labels={eyeHUDDock:'Biomonitor position',crewHUDIntegration:'Integrate with Crew Tools HUD',biomonitorShowHP:'Show Biomonitor HP numbers',forcePlayerHUDAnimations:'Force animated HUD messages for players',eyeHUDAnimateMessages:'Animate HUD messages and effect icons',biomonitorFlashSeconds:'Biomonitor indicator flash duration',targetedRightClick:'Right-click owned targets',tightHUD:'Compact Token HUD',hudScale:'HUD size',statusIconScale:'Status picker icon size',iconColor:'Combat Tools icon color'};
  window.defs=new Map(Object.entries(values).map(([key,value])=>['pneuma-combattools.'+key,{key,namespace:'pneuma-combattools',name:labels[key]??key,hint:'',config:true,scope:['forcePlayerHUDAnimations','iconColor'].includes(key)?'world':'client',type:typeof value==='boolean'?Boolean:typeof value==='number'?Number:String,choices:key==='eyeHUDDock'?{left:'Top left',right:'Top right'}:undefined,range:typeof value==='number'?{min:0,max:60,step:1}:undefined}]));
  window.menus={};window.writes=[];window.game={i18n:{localize:s=>s},user:{isGM:true,can(){return this.isGM}},modules:new Map([['pneuma-crewtools',{active:true}]]),settings:{settings:defs,get:(_m,k)=>values[k],set:async(_m,k,v)=>{writes.push([k,v]);values[k]=v},registerMenu:(_m,k,c)=>menus[k]=c}};window.ui={notifications:{error:s=>{throw Error(s)}}};
  window.renderTemplate=async(_path,{settings})=>settings.map(s=>`<div class="form-group"><label>${s.name}</label><div class="form-fields">${s.isCheckbox?`<input type="checkbox" name="${s.id}" ${s.value?'checked':''}>`:s.isSelect?`<select name="${s.id}">${Object.entries(s.choices).map(([v,t])=>`<option value="${v}" ${v===s.value?'selected':''}>${t}</option>`).join('')}</select>`:`<input name="${s.id}" type="${s.isRange?'range':'text'}" value="${s.value}" ${s.range?`min="${s.range.min}" max="${s.range.max}" step="${s.range.step}"`:''}>`}</div></div>`).join('');
 });
 const source=(await readFile('dist/scripts/display-settings.js','utf8')).replace(/^import .*;\s*/gm,'').replaceAll('export ','');
 await page.addScriptTag({content:'(()=>{'+source+';registerDisplaySettings();window.nativeSettingRows=nativeSettingRows;})();'});
 await page.evaluate(()=>{window.show=async(key)=>{window.editor=new menus[key].type();const data=await editor.getData();document.querySelector('h2').textContent=menus[key].name;document.querySelector('#rows').innerHTML=data.settingsHTML;editor.activateListeners([document.querySelector('form')]);};return show('biomonitorSettings');});
 assert.equal(await page.evaluate(()=>defs.get('pneuma-combattools.eyeHUDDock').config),false);
 assert.equal(await page.locator('[data-position-conflict]').isVisible(),false);
 await page.evaluate(()=>{values.combatBarDock='top-right';return show('biomonitorSettings');});assert.equal(await page.locator('[data-position-conflict]').isVisible(),true);
 await page.locator('[name$="eyeHUDDock"]').selectOption('left');await page.waitForFunction(()=>values.eyeHUDDock==='left');assert.equal(await page.locator('[data-position-conflict]').isVisible(),false);
 await page.locator('[name$="biomonitorShowHP"]').uncheck();await page.waitForFunction(()=>values.biomonitorShowHP===false);
 await page.screenshot({path:tmpdir()+'/pct-biomonitor-submenu.png'});
 await page.evaluate(()=>show('tokenHUDSettings'));await page.locator('[name$="tightHUD"]').check();await page.waitForFunction(()=>values.tightHUD===true);await page.screenshot({path:tmpdir()+'/pct-token-hud-submenu.png'});
 await page.evaluate(()=>{game.user.isGM=false;return show('tokenHUDSettings');});assert.equal(await page.locator('[name$="iconColor"]').count(),0);assert.equal(await page.locator('[name$="tightHUD"]').count(),1);
 await page.evaluate(()=>{values.forcePlayerHUDAnimations=true;game.modules.get('pneuma-crewtools').active=false;return show('biomonitorSettings');});
 for(const key of ['forcePlayerHUDAnimations','eyeHUDAnimateMessages','crewHUDIntegration'])assert.equal(await page.locator(`[name$="${key}"]`).count(),0);
 assert.deepEqual(errors,[]);console.log('Submenu fields, scope filtering, writes, conditional integrations and position conflict pass.');
}finally{await browser.close();}
