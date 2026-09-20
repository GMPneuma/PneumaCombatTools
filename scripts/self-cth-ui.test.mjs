import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();await page.setContent('<div id="token-hud" class="placeable-hud"><div class="col right"></div><button data-native>Native</button></div>');
 await page.addScriptTag({content:await readFile(process.env.PNEUMA_JQUERY_SOURCE,'utf8')});await page.addScriptTag({content:await readFile(process.env.PNEUMA_HANDLEBARS_SOURCE,'utf8')});
 await page.evaluate(template=>{
  Handlebars.registerHelper('eq',(a,b)=>a===b);Handlebars.registerHelper('localize',s=>s);window.renderTemplate=async()=>Handlebars.compile(template)(window.renderData);
  window.hooks={};window.Hooks={on:(n,f)=>(hooks[n]??=[]).push(f),once:(n,f)=>(hooks[n]??=[]).push(f)};
  window.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)},data:{fields:{ColorField:class{}}}};
  window.settings={};window.game={system:{id:'cyberpunk-red-core'},user:{isGM:false},settings:{register:(_m,k,c)=>settings[k]=c.default,get:(_m,k)=>settings[k],set:async(_m,k,v)=>{settings[k]=v;}},i18n:{localize:s=>s,format:s=>s}};
  class NativeToken{_canHUD(){return true;}_onClickRight(){canvas.tokens.controlled=[this];}_onUnclickRight(){}_onClickRight2(){}}
  class NativeHUD{get template(){return 'native';}getData(){return{id:'token-hud',classes:'placeable-hud'};}activateListeners(){}render(){window.renders=(window.renders??0)+1;}}
  window.CONFIG={Token:{objectClass:NativeToken,hudClass:NativeHUD}};window.BasePlaceableHUD=class{};window.Ruler={STATES:{MEASURING:1}};
  const layer={controlled:[]};window.canvas={tokens:layer,activeLayer:layer,stage:{},controls:{ruler:{state:0}}};window.ui={notifications:{error:text=>window.failure=text}};
 },await readFile('src/templates/combat-hud.hbs','utf8'));
 const main=(await readFile('dist/scripts/main.js','utf8')).replace(/^import .*;\s*/gm,'');
 const names=[...new Set([...main.matchAll(/^\s+(register\w+)\(\);/gm)].map(m=>m[1]))].filter(n=>n!=='registerSelfCTH');
 const stubs=names.map(name=>`const ${name}=()=>{};`).join('\n')+'\nconst registerQuickhack=()=>{},decorateItemList=()=>{},connectionFor=()=>undefined,quickhackEnabled=()=>false,forceOutEntries=()=>[],attackEntries=()=>[],thrownEntries=()=>[],grenadeEntries=()=>[],grappleMenu=()=>[],trackingCombat=()=>undefined;';
 const emp=await readFile('dist/scripts/emp-rules.js','utf8'),self=(await readFile('dist/scripts/self-cth.js','utf8')).replace(/^import .*;\s*/gm,'');
 await page.addScriptTag({type:'module',content:emp+'\n'+self+'\n'+stubs+'\n'+main+'\nhooks.init.forEach(fn=>fn());window.loaded=true;'});await page.waitForFunction(()=>window.loaded);
 await page.evaluate(()=>{
  window.own=Object.assign(new CONFIG.Token.objectClass(),{isOwner:true,isVisible:true,actor:{isOwner:true,items:[{type:'cyberware',name:'Kerenzikov',system:{isInstalledInActor:true}}]},document:{uuid:'Token.own'}});
  window.enemy=Object.assign(new CONFIG.Token.objectClass(),{isOwner:false,isVisible:true,actor:{isOwner:false,items:[]},document:{uuid:'Token.enemy'}});
  window.event={shiftKey:false,getLocalPosition:()=>({x:0,y:0}),stopPropagation(){}};
  window.rolls=[];game.combat={uuid:'Combat.c',started:true,combatants:[{id:'c',initiative:15,token:own.document}],rollInitiative:async(...args)=>rolls.push(args)};
  game.combats=new Map();canvas.tokens.controlled=[own];window.hud=new CONFIG.Token.hudClass();canvas.tokens.hud=hud;
  window.show=async(token,shift=false)=>{event.shiftKey=shift;token._onClickRight(event);hud.object=token;hud.element=$('#token-hud');hud.element.find('.pneuma-combat-column').remove();window.renderData=hud.getData();if(renderData.standalone)hud.element.html(Handlebars.compile(window.sourceTemplate)(renderData));for(const fn of hooks.renderTokenHUD)await fn(hud,hud.element,renderData);};
 });
 await page.evaluate(template=>window.sourceTemplate=template,await readFile('src/templates/combat-hud.hbs','utf8'));
 await page.evaluate(()=>show(own));assert.equal(await page.locator('[data-self-cth]').count(),1);assert.equal(await page.locator('[data-combat-action]').count(),0);assert.equal(await page.locator('[data-self-initiative]').count(),0);assert.equal(await page.locator('[data-native]').count(),1);
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>document.querySelector('#token-hud').style.setProperty('--pneuma-cth-icon-color','#12ab34'));
 assert.equal(await page.locator('[data-self-cth] > [data-self-alert-hud] .fa-bell').count(),1);
 assert.equal(await page.locator('[data-self-cth] > section, [data-self-cth] > strong, [data-self-cth] .notes').count(),0);
 assert.equal(await page.locator('[data-self-alert-hud] > i').evaluate(n=>getComputedStyle(n).color),'rgb(18, 171, 52)');
 await page.evaluate(()=>settings.eyeHUD=false);
 await page.locator('[data-self-alert-hud]').dispatchEvent('click');await page.waitForFunction(()=>settings.eyeHUD===true);
 await page.evaluate(()=>show(own));
 await page.locator('[data-self-alert-hud]').dispatchEvent('keydown',{key:'Enter'});await page.waitForFunction(()=>settings.eyeHUD===false);
 await page.evaluate(()=>{settings.pneumaHomebrew=true;return show(own,true);});assert.equal(await page.locator('[data-self-cth] > [data-self-initiative] .fa-dice-d10').count(),1);assert.equal(await page.locator('[data-self-initiative] > i').evaluate(n=>getComputedStyle(n).color),'rgb(18, 171, 52)');assert.equal(await page.locator('[data-combat-action]').count(),0);
 await page.locator('[data-self-initiative]').dispatchEvent('click');assert.deepEqual(await page.evaluate(()=>rolls),[[['c'],{updateTurn:true}]]);
 await page.evaluate(()=>{settings.pneumaHomebrew=false;});await page.locator('[data-self-initiative]').dispatchEvent('click');assert.equal(await page.evaluate(()=>rolls.length),1);
 await page.evaluate(()=>{canvas.tokens.controlled=[own];return show(enemy);});assert.equal(await page.locator('[data-combat-action]').count(),3);assert.equal(await page.locator('[data-self-initiative]').count(),0);
 console.log('Self CTH browser checks passed: own-token replacement, native controls retained, setting toggle, Shift-right-click, D10 native reroll and target actions.');
}finally{await browser.close();}
