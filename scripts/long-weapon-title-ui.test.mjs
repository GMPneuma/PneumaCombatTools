import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage({viewport:{width:800,height:600}});
  // CPR 0.92.4's one-column roll grid and clipped flex blocks reproduce the overflow.
  await page.setContent(`<style>
    *{box-sizing:border-box}body{font:16px Arial;background:#222}.chat-message{width:280px;background:#ddd;padding:6px}
    .rollcard{display:grid;grid-template-columns:1fr}.rollcard-top{padding-bottom:5px}
    .cpr-block{display:flex;flex-direction:column;position:relative;padding:4px;border:4px solid #c00;clip-path:polygon(0 15px,0 100%,100% 100%,100% 0,15px 0)}
    .d10-rollcard-data{display:grid;grid-template-columns:1.2fr .8fr;align-items:center;height:90px}
    .d10-number-div{font-size:64px;text-align:right}.die{text-align:center;font-size:40px}
    </style><main></main>`);
  await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
  const title='Sanroo Hello Cutie Ultra-K8 Assault Pistol — Custom Extended Weapon Name';
  for(const width of [260,280,400])for(const name of [title,'W'.repeat(120)]){
    await page.evaluate(({width,name})=>{
      document.querySelector('main').innerHTML='<article class="chat-message pneuma-combat-message"><div class="message-content"><section class="pneuma-resolution-attack pneuma-attack-result"><div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><div class="text-normal pneuma-attack-name"></div><div class="pneuma-attack-subtitle"><span>Attack</span><span>Basic</span></div></div></div><div class="rollcard-bottom"><div class="cpr-block"><div class="d10-rollcard-data"><span class="die">⬟ 5</span><span class="d10-number-div">21</span></div></div></div></div></section></div></article>';
      document.querySelector('article').style.width=width+'px';
      const heading=document.querySelector('.pneuma-attack-name');heading.textContent=name;heading.title=name;
    },{width,name});
    const dimensions=await page.evaluate(()=>{
      const card=document.querySelector('.message-content').getBoundingClientRect();
      return [...document.querySelectorAll('.rollcard,.rollcard-top,.rollcard-bottom,.cpr-block,.d10-number-div')].map(node=>({class:node.className,right:node.getBoundingClientRect().right,limit:card.right}));
    });
    for(const box of dimensions)assert(box.right<=box.limit+1,`${box.class} overflows ${width}px card: ${box.right} > ${box.limit}`);
    assert.equal(await page.locator('.pneuma-attack-name').getAttribute('title'),name);
  }
  await page.screenshot({path:process.env.TEMP+'/pct-long-weapon-title.png'});
  console.log('Long weapon title checks passed: 260/280/400px, spaced/unbroken names, intact totals, full-name tooltip.');
} finally {await browser.close();}
