import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();await page.setContent('<input aria-label="Chat"><button>Send</button>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>{
  const card=document.createElement('div');card.className='chat-message pneuma-chat-card';
  card.style.cssText='--pneuma-chat-button-gm-background:rgb(12,34,56);--pneuma-chat-button-gm-color:rgb(210,220,230);--pneuma-chat-button-gm-border:rgb(70,80,90)';
  document.body.append(card);
 });
 await page.evaluate(installMockLibWrapper);
 await page.evaluate(()=>{
  window.hooks={};window.Hooks={once:(k,f)=>hooks[k]=f,on:(k,f)=>hooks[k]=f};
  window.foundry={utils:{deepClone:value=>structuredClone(value)}};
  window.game={user:{id:'self'},keybindings:{register:(_m,_k,c)=>window.binding=c,get:()=>binding.editable},settings:{get:()=> 'gmroll'}};
  window.CONFIG={ChatMessage:{documentClass:{createDocuments:async rows=>rows}}};
 });
 const source=(await readFile('dist/scripts/native-wrappers.js','utf8'))+'\n'+(await readFile('dist/scripts/self-chat-operation.js','utf8')).replace(/^import .*$/gm,'')+'\n'+(await readFile('dist/scripts/self-chat-key.js','utf8')).replace(/^import .*$/gm,'');
 await page.addScriptTag({type:'module',content:source+'\nObject.assign(window,{installSelfOperationCapture,selfChatHeld,markSelfContent});registerSelfChatKey();hooks.ready();'});
 await page.waitForFunction(()=>!!window.binding);
 await page.getByRole('textbox').focus();await page.keyboard.down('Alt');
 assert.equal(await page.locator('#pneuma-self-chat-held').innerText(),'SELF chat — key held');
 assert.deepEqual(await page.locator('#pneuma-self-chat-held').evaluate(node=>{
  const s=getComputedStyle(node);return {background:s.backgroundColor,color:s.color,border:s.borderTopColor,size:s.fontSize,height:node.getBoundingClientRect().height,position:s.position,pointer:s.pointerEvents,badge:getComputedStyle(node,'::before').content};
 }),{background:'rgb(12, 34, 56)',color:'rgb(210, 220, 230)',border:'rgb(70, 80, 90)',size:'20px',height:56,position:'fixed',pointer:'none',badge:'"SELF"'});
 assert.equal(await page.evaluate(()=>game.settings.get('core','rollMode')),'selfroll');
 assert.deepEqual(await page.evaluate(()=>CONFIG.ChatMessage.documentClass.createDocuments([{content:'test'}])),[{content:'test',whisper:['self'],blind:false}]);
 await page.keyboard.up('Alt');assert.equal(await page.locator('#pneuma-self-chat-held').count(),0);
 assert.equal(await page.evaluate(()=>game.settings.get('core','rollMode')),'gmroll');
 await page.evaluate(()=>{
  class Roll {handleRollDialog(){}async roll(){await window.rollGate;this._roll={};}}
  class Dialog {constructor(roll){this.rollData=roll;}confirmDialog(){return this.rollData.roll();}}
  const renderer={RenderRollCard(){},renderTemplate:async(_path,roll)=>markSelfContent('<div>Skill or attack result</div>',roll)};
  installSelfOperationCapture(Dialog.prototype,Roll.prototype,{handle3dDice(){}},selfChatHeld,renderer);
  window.rollGate=new Promise(resolve=>window.finishRoll=resolve);
  document.querySelector('button').onclick=()=>{
   const roll=new Roll();window.delayedResult=new Dialog(roll).confirmDialog().then(async()=>
    CONFIG.ChatMessage.documentClass.createDocuments([{content:await renderer.renderTemplate('card',roll),flags:{'pneuma-combattools':{exchange:{rollMode:'roll'}}}}]));
  };
 });
 await page.keyboard.down('Alt');await page.getByRole('button').click();await page.keyboard.up('Alt');
 const captured=await page.evaluate(async()=>{finishRoll();return await delayedResult;});
 assert.deepEqual(captured[0].whisper,['self']);assert.equal(captured[0].blind,false);
 assert.equal(captured[0].flags['pneuma-combattools'].exchange.rollMode,'selfroll');
 await page.evaluate(()=>binding.editable=[{key:'KeyQ'}]);
 await page.keyboard.down('Alt');assert.equal(await page.locator('#pneuma-self-chat-held').count(),0);await page.keyboard.up('Alt');
 await page.keyboard.down('q');assert.equal(await page.locator('#pneuma-self-chat-held').count(),1);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.locator('#pneuma-self-chat-held').count(),0);
 await page.keyboard.up('q');console.log('Hold-Self browser fixture passed: ALT in chat input, audience, release, rebinding and blur.');
}finally{await browser.close();}
