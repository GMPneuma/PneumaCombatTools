import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || "playwright");
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
 const page=await browser.newPage({viewport:{width:540,height:500}});
 await page.setContent('<style>body{font:16px sans-serif;background:#eee;padding:14px}.dialog-list{list-style:none;padding:0;border:1px solid #c00}.dialog-item{padding:5px}.dialog-item:nth-child(even){background:#ffc7be}.pneuma-evasion-note{font-weight:bold}.total-mods{border-top:1px solid #c00}</style><h3>Evasion</h3><ol class="dialog-list"><li class="dialog-item">Stat (DEX): 4</li><li class="dialog-item">Skill (Evasion): 2</li><li class="dialog-item">Additional Mods:</li><li class="dialog-item">Spend LUCK: 0</li><li class="dialog-item">Should roll criticals: ✓</li><li class="dialog-item total-mods">Total Mods: <span class="total-mod-value">+0</span></li></ol>');
 await page.evaluate(()=>{
   window.hooks={};window.Hooks={on:(name,fn)=>window.hooks[name]=fn};
   window.wrap=(nodes)=>({find:selector=>window.wrap(nodes.flatMap(node=>[...node.querySelectorAll(selector)])),
     remove:()=>nodes.forEach(node=>node.remove()),first:()=>window.wrap(nodes.slice(0,1)),
     before:node=>nodes[0]?.before(node)});
 });
 const source=(await readFile(new URL("../dist/scripts/native-combat.js",import.meta.url),"utf8")).replace(/^import .*$/gm,"");
 await page.addScriptTag({type:"module",content:source+'\nwindow.evasionDialog=evasionDialog;window.registerEvasionDialog=registerEvasionDialog;'});
 await page.waitForFunction(()=>!!window.evasionDialog);
 await page.evaluate(async()=>{
   window.registerEvasionDialog();
   window.runDialog=async(penalty,fee)=>{
     const roll={mods:[],luck:0,addMod(mods){this.mods.push(...mods);},async handleRollDialog(){
       const html=window.wrap([document.body]);
       window.hooks.renderCPRRollDialog({rollData:this},html);
       window.hooks.renderCPRRollDialog({rollData:this},html);
       document.querySelector(".total-mod-value").textContent=String(this.mods.reduce((sum,mod)=>sum+mod.value,0));
       return false;
     }};
     return window.evasionDialog(roll,{}, {},penalty,fee);
   };
   await window.runDialog(-2,0);
 });
 assert.equal(await page.locator(".pneuma-evasion-note").count(),1);
 assert.equal(await page.locator(".pneuma-evasion-note").textContent(),"Additional ranged evasion: -2");
 assert.equal(await page.locator(".total-mod-value").textContent(),"-2");
 assert.equal(await page.locator(".pneuma-evasion-note").evaluate(el=>el.nextElementSibling.classList.contains("total-mods")),true);
 await page.evaluate(()=>window.runDialog(0,2));
 assert.equal(await page.locator(".pneuma-evasion-note").count(),1);
 assert.equal(await page.locator(".pneuma-evasion-note").textContent(),"This evasion will spend 2 Luck");
 assert.equal(await page.locator(".total-mod-value").textContent(),"0");
 await page.screenshot({path:new URL("../docs/evasion-dialog-preview.png",import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1")});
 console.log("Pre-roll browser checks passed: penalty/fee above Total Mods, no duplicate rows on rerender, fee excluded from roll modifiers.");
} finally {await browser.close();}