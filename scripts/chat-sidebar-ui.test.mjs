import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
globalThis.Hooks={once(){},on(){}};
globalThis.FormApplication=class{};
const {instantContent}=await import('../dist/scripts/instant-effects.js');
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:470,height:1165}});
 // Native v12 sidebar rules. No Visual Tools skin: native cards must contain
 // their own positioned content rather than depending on a styled card root.
 await page.setContent(`<style>
 *{box-sizing:border-box}body{margin:0;height:100vh;position:fixed;inset:0;overflow:hidden}
 #ui-right{position:relative;height:100vh;width:400px}
 #sidebar{display:flex;flex-direction:column;height:calc(100% - 10px);margin:5px;overflow:hidden}
 #sidebar>*{flex:1}#sidebar-tabs{flex:0 0 32px;margin-bottom:5px}
 #chat{display:flex;flex-direction:column;overflow:hidden}
 #chat-log{flex:1;height:calc(100% - 130px);margin:0;padding:0;overflow-y:auto;overflow-x:hidden;list-style:none}
 #chat-controls{flex:0 0 28px}#chat-form{height:100px;flex:0 0 100px;margin:0 6px 6px}
 #chat-form textarea{height:100%;width:100%;resize:none}
 .chat-message{margin:3px;padding:5px}
 </style><div id="ui-right"><aside id="sidebar"><nav id="sidebar-tabs"></nav>
 <section id="chat"><ol id="chat-log"></ol><div id="chat-controls">Public Roll</div>
 <form id="chat-form"><textarea></textarea></form></section></aside></div>`);
 await page.addStyleTag({content:await readFile(new URL('../dist/styles/pneuma-combattools.css',import.meta.url),'utf8')});
 const markup=instantContent({id:'incendiary',actor:'Actor.test',name:'Patient',state:'failed'},'',true);
 await page.evaluate(markup=>{
  const log=document.querySelector('#chat-log');
  log.innerHTML='<li style="height:8800px"></li><li class="chat-message"><div class="pneuma-aoe-effect-target">'+markup+'</div></li>';
 },markup);
 const result=await page.evaluate(()=>{
  const chat=document.querySelector('#chat'),log=document.querySelector('#chat-log'),form=document.querySelector('#chat-form');
  const initialOverflow=chat.scrollHeight-chat.clientHeight;
  document.querySelector('.chat-message').scrollIntoView({block:'center'});
  document.querySelector('[data-instant-action="apply"]').focus();
  const row=document.querySelector('.pneuma-aoe-inline-effect').getBoundingClientRect();
  const labelsContained=Array.from(document.querySelectorAll('.pneuma-aoe-inline-effect > strong, .pneuma-aoe-inline-effect > span:not(.pneuma-effect-actions)')).every(e=>{
   const r=e.getBoundingClientRect();return r.top>=row.top-1&&r.bottom<=row.bottom+1;
  });
  return {initialOverflow,labelsContained,outerScroll:chat.scrollTop,logScroll:log.scrollTop,formBottom:form.getBoundingClientRect().bottom,chatBottom:chat.getBoundingClientRect().bottom};
 });
 assert.equal(result.labelsContained,true,'hidden labels must scroll with their effect row');
 assert.equal(result.initialOverflow,0,'compact effect labels must not escape the chat-log clipping boundary');
 assert.equal(result.outerScroll,0,'showing/focusing a card must not scroll the entire chat tab');
 assert.ok(result.logScroll>0,'the message history remains scrollable');
 assert.ok(Math.abs(result.chatBottom-result.formBottom-6)<1,'the composer stays at the bottom');
 console.log('Chat sidebar checks passed: native compact AoE labels contained, history scrolls, composer stays at bottom.');
}finally{await browser.close();}
