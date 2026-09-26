import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:660,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<style>body{font:14px Arial;background:#eee;color:#222;padding:20px}#pneuma-turn-marker-settings{width:480px}.form-group{margin:16px 0;display:flex;flex-wrap:wrap;align-items:center}.form-group label{flex:1}.form-fields{display:flex;align-items:center;gap:8px;width:275px}input[type=range]{width:230px}input[type=text]{width:190px}select{width:275px}.notes{font-size:12px;color:#555;width:100%}button{padding:6px 12px}.range-value{min-width:28px}.flexrow{display:flex;gap:8px}.flexrow>*{flex:1}</style><h2>Animated Turn Indicator</h2><div id="pneuma-turn-marker-settings"></div>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addScriptTag({path:'D:/OneDrive/Development/Git/PneumaCrewTools/node_modules/.pnpm/handlebars@4.7.9/node_modules/handlebars/dist/handlebars.min.js'});
 await page.evaluate(()=>{
  Handlebars.registerHelper('checked',value=>value?'checked':'');Handlebars.registerHelper('selectOptions',(choices,options)=>new Handlebars.SafeString(Object.entries(choices).map(([key,label])=>`<option value="${key}" ${key===options.hash.selected?'selected':''}>${label}</option>`).join('')));
  window.FormApplication=class{activateListeners(){}close(){window.editorClosed=true;}render(){window.renderPending=show();return this;}};
  window.windowErrors=[];window.ui={notifications:{error:s=>windowErrors.push(s)}};window.canvas={ready:false};
  window.configs=new Map();window.values={};window.writes=[];
  const user={id:'player',isGM:false,getFlag(_m,k){return k==='turnIndicatorDefault'?this.localDefault:this.profile},async setFlag(_m,k,profile){await new Promise(resolve=>setTimeout(resolve,10));if(k==='turnIndicatorDefault')this.localDefault=profile;else this.profile=profile;writes.push(profile);},async unsetFlag(_m,k){if(k==='turnIndicatorDefault')delete this.localDefault;else delete this.profile;}};
  window.game={user,users:[user],settings:{settings:configs,register:(m,k,c)=>{configs.set(m+'.'+k,c);values[k]=c.default;},get:(_m,k)=>values[k],set:async(_m,k,v)=>{values[k]=v;}}};window.foundry={data:{fields:{ColorField:class{}}}};window.hooks=new Map();let hookId=0;window.Hooks={on(name,fn){const id=++hookId;hooks.set(id,{name,fn});return id;},off(name,id){hooks.delete(id);},callAll(name,...args){for(const h of hooks.values())if(h.name===name)h.fn(...args);}};
 });
 const files=['turn-marker-art','turn-marker-profile','turn-marker','turn-marker-settings'];const sources=await Promise.all(files.map(name=>readFile('dist/scripts/'+name+'.js','utf8')));
 await page.addScriptTag({type:'module',content:sources.map(s=>s.replace(/^import .*;\s*/gm,'')).join('\n')+'\nconst MODULE=INDICATOR_MODULE;registerTurnMarker();window.Editor=TurnMarkerSettings;'});await page.waitForFunction(()=>window.Editor);
 await page.evaluate(async template=>{window.template=template;window.editor=new Editor();window.show=async()=>{document.querySelector('#pneuma-turn-marker-settings').innerHTML=Handlebars.compile(template)(await editor.getData());editor.activateListeners([document.querySelector('#pneuma-turn-marker-settings form')]);};await show();},await readFile('dist/templates/turn-marker-settings.hbs','utf8'));
 assert.equal(await page.locator('[data-indicator-mode]').allTextContents().then(a=>a.join(',')),'Default Indicator,My Indicator');
 assert.equal(await page.locator('[data-use-default]').isChecked(),true);
 for(const key of ['turnMarkerEnabled','turnMarkerForceDefault','turnMarkerDisplay'])assert.equal(await page.locator(`[name$="${key}"]`).count(),0);
 assert.deepEqual(await page.evaluate(()=>[...configs].filter(([,c])=>c.config).map(([k])=>k.split('.').at(-1))),['turnMarkerEnabled','turnMarkerForceDefault','turnMarkerDisplay']);
 assert.equal(await page.locator('[data-use-default]').isChecked(),true);
 await page.locator('[data-indicator-mode="default"]').click();await page.waitForFunction(()=>editor.mode==='default');await page.evaluate(()=>renderPending);
 assert.equal(await page.locator('[name$="turnMarkerStyle"]').isDisabled(),false);
 assert.equal(await page.locator('[data-use-gm-default]').isChecked(),true);
 await page.locator('[name$="turnMarkerStyle"]').selectOption('fixer');await page.waitForFunction(()=>game.user.localDefault?.turnMarkerStyle==='fixer');
 assert.equal(await page.evaluate(()=>values.turnMarkerStyle),'segmented');assert.equal(await page.evaluate(()=>game.user.profile),undefined);assert.equal(await page.locator('[data-use-gm-default]').isChecked(),false);
 await page.screenshot({path:tmpdir()+'/pct-local-default-indicator.png'});
 await page.locator('[data-use-gm-default]').check();await page.waitForFunction(()=>!game.user.localDefault);await page.evaluate(()=>renderPending);assert.equal(await page.locator('[name$="turnMarkerStyle"]').inputValue(),'segmented');
 await page.locator('[data-indicator-mode="personal"]').click();await page.waitForFunction(()=>editor.mode==='personal');await page.evaluate(()=>renderPending);
 await page.evaluate(()=>{game.user.localDefault={turnMarkerStyle:'fixer',turnMarkerColor:'#123456'};return show();});
 assert.equal(await page.locator('[name$="turnMarkerStyle"]').inputValue(),'fixer');
 await page.locator('[data-use-default]').uncheck();await page.waitForFunction(()=>game.user.profile?.turnMarkerStyle==='fixer');await page.evaluate(()=>renderPending);assert.equal(await page.locator('[name$="turnMarkerColor"]').inputValue(),'#123456');
 await page.locator('[data-use-default]').check();await page.waitForFunction(()=>!game.user.profile);await page.evaluate(()=>renderPending);assert.equal(await page.locator('[name$="turnMarkerStyle"]').inputValue(),'fixer');
 await page.evaluate(()=>{delete game.user.localDefault;return show();});
 await page.locator('[name$="turnMarkerStyle"]').selectOption('medtech');
 await page.evaluate(()=>{const el=document.querySelector('[name$="turnMarkerThickness"]');for(let n=1;n<=10;n++){el.value=n;el.dispatchEvent(new Event('input',{bubbles:true}));}});
 await page.waitForFunction(()=>game.user.profile?.turnMarkerThickness===10&&game.user.profile?.turnMarkerStyle==='medtech');
 assert.equal(await page.evaluate(()=>values.turnMarkerStyle),'segmented');assert.equal(await page.locator('[data-use-default]').isChecked(),false);
 await page.locator('[name$="turnMarkerColor"]').fill('#12abef');await page.locator('[name$="turnMarkerColor"]').dispatchEvent('change');await page.waitForFunction(()=>game.user.profile?.turnMarkerColor==='#12abef');
 await page.screenshot({path:tmpdir()+'/pct-personal-indicator-settings.png'});
 await page.locator('[data-use-default]').check();await page.waitForFunction(()=>!game.user.profile);await page.evaluate(()=>renderPending);assert.equal(await page.locator('[name$="turnMarkerStyle"]').inputValue(),'segmented');
 await page.evaluate(()=>{game.user.isGM=true;});await page.locator('[data-indicator-mode="default"]').click();await page.waitForFunction(()=>editor.mode==='default');await page.evaluate(()=>renderPending);assert.equal(await page.locator('[name$="turnMarkerStyle"]').isDisabled(),false);
 await page.locator('[name$="turnMarkerStyle"]').selectOption('solo');await page.waitForFunction(()=>values.turnMarkerStyle==='solo');
 await page.screenshot({path:tmpdir()+'/pct-default-indicator-settings.png'});
 await page.evaluate(async()=>{
  const actor={id:'npc',type:'mook'},parent={tokens:new Map()};window.testToken={id:'boss',name:'Boss',actor,parent,getFlag(){return this.profile},async setFlag(_m,_k,p){this.profile=p},async unsetFlag(){delete this.profile}};parent.tokens.set('boss',testToken);await editor.close();window.editor=new Editor(testToken);await show();
 });
 assert.equal(await page.locator('[data-indicator-mode="token"]').count(),1);assert.equal(await page.locator('[data-use-inherited]').isChecked(),true);
 await page.locator('[name$="turnMarkerStyle"]').selectOption('lawman');await page.waitForFunction(()=>testToken.profile?.turnMarkerStyle==='lawman');assert.equal(await page.evaluate(()=>values.turnMarkerStyle),'solo');assert.equal(await page.locator('[data-use-inherited]').isChecked(),false);
 await page.screenshot({path:tmpdir()+'/pct-token-indicator-settings.png'});
 await page.locator('[data-use-inherited]').check();await page.waitForFunction(()=>!testToken.profile);await page.evaluate(()=>renderPending);assert.equal(await page.locator('[name$="turnMarkerStyle"]').inputValue(),'solo');

 await page.evaluate(async()=>{
  window.secondToken={...testToken,id:'second',name:'Second NPC',profile:undefined};testToken.parent.tokens.set('second',secondToken);
  Hooks.callAll('controlToken',{document:secondToken},true);await editor.writes;await renderPending;
 });
 assert.match(await page.locator('fieldset legend').textContent(),/Second NPC/);
 await page.locator('[name$="turnMarkerStyle"]').selectOption('fixer');await page.waitForFunction(()=>secondToken.profile?.turnMarkerStyle==='fixer');assert.equal(await page.evaluate(()=>testToken.profile),undefined,'Selection changes never write to previous token');
 await page.screenshot({path:tmpdir()+'/pct-token-indicator-settings.png'});
 await page.evaluate(async()=>{game.user.isGM=false;window.editor=new Editor(testToken);await show();});assert.equal(await page.locator('[data-indicator-mode="token"]').count(),0);
 await page.locator('[data-close]').click();assert.equal(await page.evaluate(()=>editorClosed),true);assert.deepEqual(await page.evaluate(()=>windowErrors),[]);assert.deepEqual(errors,[]);
 console.log('Default/My buttons, player read-only default, personal style/color, rapid final slider value, reset inheritance, GM default editing and Close pass.');
}finally{await browser.close();}
