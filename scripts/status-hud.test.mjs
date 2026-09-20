import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || "playwright");
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
 const page=await browser.newPage();
 const css=await readFile(new URL("../dist/styles/pneuma-combattools.css",import.meta.url),"utf8");
 await page.setContent('<div id="token-hud" class="pneuma-readable-hud" style="--pneuma-status-icon-size:36px"><div class="status-effects"></div></div>');
 await page.addStyleTag({content:css});
 const catalog=await readFile(new URL("../dist/scripts/status-catalog.js",import.meta.url),"utf8");
 await page.addScriptTag({type:"module",content:catalog+"\nwindow.masterStatuses=masterStatuses;"});
 const hud=await readFile(new URL("../dist/scripts/status-hud.js",import.meta.url),"utf8");
 await page.addScriptTag({type:"module",content:hud+"\nwindow.groupStatusHUD=groupStatusHUD;"});
 await page.waitForFunction(()=>window.groupStatusHUD && window.masterStatuses);
 const result=await page.evaluate(()=>{
   const root=document.querySelector("#token-hud"),tray=root.querySelector(".status-effects");
   let clicks=0,contexts=0;
   for(const s of masterStatuses){
     const icon=document.createElement("img");icon.className="effect-control";icon.dataset.statusId=s.id;icon.title=s.name;
     icon.addEventListener("click",()=>clicks++);icon.addEventListener("contextmenu",e=>{e.preventDefault();contexts++;});
     tray.append(icon);
   }
   const before=[...tray.querySelectorAll(".effect-control")];
   groupStatusHUD(root,masterStatuses);groupStatusHUD(root,masterStatuses);
   const groups=[...tray.querySelectorAll("details")];
   const closed=groups.every(g=>!g.open);
   const grouped=groups.map(g=>({name:g.querySelector("summary").textContent,count:g.querySelectorAll(".effect-control").length}));
   groups[0].open=true;
   groups[0].querySelector(".effect-control").click();
   groups[0].querySelector(".effect-control").dispatchEvent(new MouseEvent("contextmenu",{bubbles:true}));
   const all=[...tray.querySelectorAll(".effect-control")];
   return {closed,grouped,clicks,contexts,count:all.length,sameNodes:all.every(n=>before.includes(n)),headingColor:getComputedStyle(groups[0].querySelector("summary")).color,display:getComputedStyle(tray).display};
 });
 assert.equal(result.headingColor,"rgb(240, 240, 224)");assert.equal(result.closed,true);assert.equal(result.count,65);assert.equal(result.sameNodes,true);
 assert.deepEqual(result.grouped,[{name:"Crit Head",count:11},{name:"Crit Body",count:11},{name:"Pharmaceuticals",count:5},{name:"Drugs",count:10}]);
 assert.equal(result.clicks,1);assert.equal(result.contexts,1);assert.equal(result.display,"block");
 const visibility = await page.evaluate(() => {
   const root = document.querySelector("#token-hud");
   const tray = root.querySelector(".status-effects");
   const combat = document.createElement("div");
   combat.className = "pneuma-combat-column";
   combat.innerHTML = '<section class="status-effects pneuma-combat-menu active"></section>';
   root.append(combat);
   const visible = () => getComputedStyle(combat).display !== "none";
   const before = visible();
   tray.classList.add("active");
   const during = visible();
   tray.classList.remove("active");
   return {before, during, after: visible()};
 });
 assert.deepEqual(visibility, {before:true, during:false, after:true});
 console.log("Status HUD browser checks passed: collapsed groups, complete catalog, retained native click/right-click handlers.");
}finally{await browser.close();}
