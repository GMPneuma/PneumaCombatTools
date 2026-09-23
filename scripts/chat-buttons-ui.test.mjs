import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:760,height:740}});
 await page.setContent(`<main class="chat-message"><h3>Chat button states</h3>
 <section class="pneuma-defense-controls"><button>Evade</button><button>Do not Evade</button><button class="pneuma-cancel-exchange">Cancel exchange</button></section>
 <section class="pneuma-manual-controls"><button id="apply">Apply to selected token</button><button>Mark resolved after GM review</button><button disabled title="Waiting for damage roll">Apply injury</button><button class="pneuma-damage-status-slot">+</button></section>
 <section><button id="half" class="pneuma-half-armor" aria-pressed="false">Half Armor SP</button><button class="pneuma-half-armor" aria-pressed="true">Half Armor SP</button></section>
 <section class="pneuma-aoe-card"><button data-aoe-action="apply" title="Apply shared damage"><i class="test-bolt"></i></button><button data-aoe-action="apply" disabled title="Damage applied"><i class="test-bolt"></i></button><button data-aoe-action="reset" title="Release roll"><i class="test-reset"></i></button></section>
 <section class="pneuma-grapple-controls"><button>Roll Brawling</button><button>End (GM)</button></section>
 <section class="pneuma-quickhack-actions"><button>Force Out</button></section>
 <section><button data-emp-select>Choose affected items</button><button data-instant-action="roll">Resist DV15</button><button data-ribs-apply>Apply 5 damage</button></section>
 <section class="pneuma-group-action"><button>Roll</button></section><a class="pneuma-group-total">15</a><button id="native">Native control</button></main>`);
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.addStyleTag({content:`body{font:14px Arial;background:#ddd;padding:20px}section{margin:12px 0}.test-bolt::before{content:"ϟ"}.test-reset::before{content:"↻"} .pneuma-defense-controls{display:flex;gap:4px} button:hover { padding:20px; border-width:7px; font-size:25px; font-weight:bold; transform:scale(1.3); margin:10px; width:500px; }`});
 await page.addScriptTag({type:'module',content:(await readFile('dist/scripts/chat-buttons.js','utf8'))+'\nwindow.styleChatButtons=styleChatButtons;'});
 await page.waitForFunction(()=>!!window.styleChatButtons);
 await page.evaluate(()=>{
  styleChatButtons(document.querySelector('main'));styleChatButtons(document.querySelector('main'));
  document.querySelector('#half').onclick=event=>event.currentTarget.setAttribute('aria-pressed',event.currentTarget.getAttribute('aria-pressed')==='true'?'false':'true');
  document.querySelector('#apply').onclick=event=>{event.currentTarget.disabled=true;};
 });
 await page.evaluate(()=>{
   const row=document.createElement('div');row.className='pneuma-armor-controls';row.style.width='280px';row.id='armor-layout';
   row.innerHTML='<button class="pneuma-interact-armor" aria-pressed="true">Interact With Armor</button><button class="pneuma-half-armor" aria-pressed="false">Half Armor SP</button>';
   document.querySelector('main').append(row);styleChatButtons(row);
 });
 const armorButtons=page.locator('#armor-layout button');
 const left=await armorButtons.nth(0).boundingBox(),right=await armorButtons.nth(1).boundingBox();
 assert.equal(left.y,right.y,'Armor controls stay side by side at chat width');
 assert.ok(left.x+left.width<=right.x&&right.x+right.width<=left.x+281,'Both controls fit without overlap or overflow');
 await armorButtons.nth(0).hover();assert.deepEqual(await armorButtons.nth(0).boundingBox(),left);
 await page.screenshot({path:process.env.TEMP+'/pct-armor-controls.png'});
 assert.equal(await page.locator('#native').getAttribute('class'),null);
 assert.equal(await page.locator('.pneuma-group-total').getAttribute('class'),'pneuma-group-total');
 assert.equal(await page.locator('[data-chat-kind=recovery]').count(),2);
 assert.equal(await page.locator('[data-chat-kind=cancel]').count(),2);
 const half=page.locator('#half'),before=await half.boundingBox();
 const off=await half.evaluate(n=>getComputedStyle(n).backgroundColor);
 await half.hover();assert.deepEqual(await half.boundingBox(),before,'hover must not move or resize');
 await half.click();assert.deepEqual(await half.boundingBox(),before,'selected state must not move or resize');
 await page.waitForFunction(before=>getComputedStyle(document.getElementById('half')).backgroundColor!==before,off);
 assert.notEqual(await half.evaluate(n=>getComputedStyle(n).backgroundColor),off);
 assert.equal(await half.evaluate(n=>getComputedStyle(n,'::before').content),'"☑"');
 await half.focus();assert.deepEqual(await half.boundingBox(),before,'focus must not move or resize');
 const apply=page.locator('#apply'),applyBox=await apply.boundingBox();await apply.click();
 await page.waitForFunction(()=>document.querySelector('#apply').getAttribute('aria-busy')==='true');
 assert.deepEqual(await apply.boundingBox(),applyBox,'busy state must keep dimensions');
 await page.evaluate(()=>document.querySelector('#apply').disabled=false);
 await page.waitForFunction(()=>!document.querySelector('#apply').hasAttribute('aria-busy'));
 assert.equal(await page.locator('[data-aoe-action=apply][disabled]').getAttribute('aria-label'),'Applied');
 await page.evaluate(()=>{const b=document.createElement('button');b.dataset.instantAction='review';b.textContent='GM: mark resolved';document.querySelector('main').append(b)});
 await page.waitForFunction(()=>document.querySelector('[data-instant-action=review]').classList.contains('pneuma-chat-button'));
 await page.addStyleTag({content:':root {--pneuma-chat-button-selected:rgb(70,30,100);--pneuma-chat-button-height:32px}'});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#half')).backgroundColor==='rgb(70, 30, 100)');
 assert.equal(await page.locator('[data-aoe-action=reset]').evaluate(n=>getComputedStyle(n).height),'32px');
 await page.mouse.move(740,720);
 await page.screenshot({path:process.env.TEMP+'/pct-chat-buttons.png',fullPage:true});
 console.log('Chat button checks passed: all chat families, toggle states, completed/recovery/cancel, async controls, busy feedback, skin tokens and stable hover/focus/selected geometry.');
} finally {await browser.close()}
