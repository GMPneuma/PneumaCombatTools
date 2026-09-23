
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<style>body{background:#333;color:white}#players{position:fixed;bottom:10px;left:15px;width:200px;background:#222}h3{margin:4px;cursor:pointer}ol{margin:4px}</style><div id="players"></div>');
 await page.addStyleTag({content:await readFile('dist/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>{
  window.hooks={};window.Hooks={on:(n,f)=>(hooks[n]??=[]).push(f),once:(n,f)=>(hooks[n]??=[]).push(f)};
  window.emit=(n,...args)=>{for(const fn of hooks[n]??[])fn(...args)};
  window.saved='online';window.users=[{name:'Online player',active:true},{name:'Offline player',active:false}];
  window.configs={};window.game={settings:{register:(_m,k,c)=>configs[k]=c,get:()=>saved,set:async(_m,k,v)=>{saved=v;configs[k].onChange();}}};
  window.PlayerList=class {
   constructor(){this._showOffline=false;}
   getData(){return {users:users.filter(u=>this._showOffline||u.active)};}
   _onToggleOfflinePlayers(e){e.preventDefault();this._showOffline=!this._showOffline;this.render();}
   render(){const root=document.getElementById('players');root.replaceChildren();const heading=document.createElement('h3');heading.textContent='Players';root.append(heading);const list=document.createElement('ol');for(const user of this.getData().users){const row=document.createElement('li');row.textContent=user.name;list.append(row);}root.append(list);heading.addEventListener('click',this._onToggleOfflinePlayers.bind(this));this.element=[root];emit('renderPlayerList',this,[root]);return this;}
  };
  window.ui={players:new PlayerList(),notifications:{error:msg=>{throw Error(msg)}}};
  window.registerNativeWrapper=(owner,key,fn)=>{const old=owner[key];owner[key]=function(...args){return fn.call(this,old.bind(this),...args)}};
 });
 let source=await readFile('dist/scripts/players-control.js','utf8');
 source=source.replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
 await page.addScriptTag({content:source+'\nregisterPlayersControl();emit("setup");ui.players.render();'});
 const header=page.locator('#players h3'),rows=page.locator('#players li');
 assert.equal(await rows.count(),1);
 await header.click();assert.equal(await rows.count(),2);assert.equal(await page.evaluate(()=>saved),'all');
 await header.click();assert.equal(await page.locator('#players ol').isVisible(),false);assert.equal(await header.getAttribute('aria-expanded'),'false');
 const collapsed=await page.locator('#players').boundingBox();
 await page.evaluate(()=>{users.push({name:'New arrival',active:true});ui.players.render();});
 assert.equal(await page.locator('#players ol').isVisible(),false,'User activity cannot expand a minimized panel');
 await header.focus();await page.keyboard.press('Enter');
 assert.equal(await rows.count(),2);assert(await page.locator('#players ol').isVisible());assert.equal(await header.evaluate(el=>el===document.activeElement),true);
 assert((await page.locator('#players').boundingBox()).height>collapsed.height);
 await page.keyboard.press(' ');assert.equal(await rows.count(),3);
 await page.keyboard.press(' ');assert.equal(await page.locator('#players ol').isVisible(),false);
 await page.evaluate(()=>{ui.players=new PlayerList();ui.players.render();});
 assert.equal(await page.locator('#players ol').isVisible(),false,'Minimized survives application recreation');
 await header.click();assert.equal(await rows.count(),2);
 for(let i=0;i<3;i++)await page.evaluate(()=>ui.players.render());
 assert.equal(await page.locator('.pneuma-players-mode').count(),1);
 assert.deepEqual(errors,[]);
 console.log('Players browser checks passed: three-state cycle, native filtering, keyboard restore, persistence, joins and compact height.');
}finally{await browser.close();}
