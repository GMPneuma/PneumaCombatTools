import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const source=(await readFile('dist/scripts/native-wrappers.js','utf8'))+'\n'+(await readFile('dist/scripts/chat-result-delay.js','utf8')).replace(/^import .*$/gm,'');
  for (const isGM of [true,false]) {
    const page=await browser.newPage();
    await page.setContent('<ol id="chat-log"><li class="chat-message" data-message-id="card"><div class="message-content"><p>Attack 12</p><button>Roll damage</button></div></li></ol>');
    await page.evaluate(isGM=>{
      const hooks=new Map();window.Hooks={once:(name,fn)=>hooks.set(name,fn),on:(name,fn)=>hooks.set(name,fn)};
      window.game={user:{isGM},messages:[],settings:{register(){},get:()=> '0.5'}};
      window.foundry={utils:{getProperty:(obj,path)=>path.split('.').reduce((v,k)=>v?.[k],obj)}};
      class Message {
        id='card';visible=true;isContentVisible=true;content='<p data-pneuma-roll-result="damage">Damage 18</p><button>Apply</button>';
        async getHTML(){const root=document.createElement('div');root.className='message-content';root.innerHTML=this.content;return root;}
      }
      window.CONFIG={ChatMessage:{documentClass:Message}};window.message=new Message();
      window.libWrapper={register:(_module,path,fn)=>{
        const keys=path.split('.'),method=keys.pop(),owner=keys.reduce((o,k)=>o[k],window),original=owner[method];
        owner[method]=function(...args){return fn.call(this,original.bind(this),...args);};
      }};
      window.startDelay=()=>{
        hooks.get('ready')();window.started=performance.now();
        window.clicks=0;document.querySelector('button').addEventListener('click',()=>window.clicks++);
        window.message.getHTML().then(content=>{
          document.querySelector('.message-content').replaceWith(content);window.finished=performance.now();
        });
      };
    },isGM);
    await page.addScriptTag({type:'module',content:source+'\nregisterChatResultDelay(); window.loaded=true;'});
    await page.waitForFunction(()=>window.loaded);
    await page.evaluate(()=>startDelay());
    assert.equal(await page.locator('.message-content').innerText(),'Attack 12\n\nRoll damage');
    assert.equal(await page.locator('.message-content').evaluate(node=>node.inert),false);
    await page.getByRole('button',{name:'Roll damage',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.clicks),1,'previous card stays clickable during delay');
    await page.waitForFunction(()=>window.finished!==undefined);
    assert((await page.evaluate(()=>finished-started))>=490);
    assert.match(await page.locator('.message-content').innerText(),/Damage 18/);
    assert.equal(await page.locator('.message-content').evaluate(node=>node.inert),false);
    // A second view uses the already-expired deadline, even without DSN installed.
    assert((await page.evaluate(async()=>{const start=performance.now();await message.getHTML();return performance.now()-start;}))<200);
    await page.close();
  }
  console.log('Chat delay browser checks passed: GM/player clients, clickable previous content, timed reveal, immediate rerender, DSN absent.');
} finally {await browser.close();}
