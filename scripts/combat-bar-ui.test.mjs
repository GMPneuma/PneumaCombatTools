import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const output=process.env.PNEUMA_TEST_DIST??'dist';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1000,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const evaluate=page.evaluate.bind(page);
 page.evaluate=async(...args)=>{const result=await evaluate(...args);await evaluate(()=>new Promise(requestAnimationFrame));return result;};
 const click=async(locator,options)=>{await locator.click(options);await page.evaluate(()=>{});};
 await page.setContent('<style>body{margin:0;background:#34383b;color:#eee;font:14px Arial}.app{background:#171a1d;border:1px solid #555;box-shadow:0 0 12px #000}button{background:#363636;color:inherit;border:1px solid #666;border-radius:3px;cursor:pointer}button:hover{box-shadow:0 0 5px orange}#ui-left{position:fixed;top:0;bottom:0;width:220px;pointer-events:none}#controls{height:180px;width:80px}#players{position:absolute;bottom:10px;left:15px;width:200px;height:90px;border:1px solid #555;box-sizing:border-box}#players h3{margin:4px}#players p{margin:6px}</style><div id="ui-left"><div id="controls"></div><div id="players" class="app"><h3>Players</h3><p>● GM</p><p>● Player</p></div></div>');
 // Load the pre-existing stylesheet only: a server with cached manifest metadata must style the new bar.
 const manifest=JSON.parse(await readFile(output+'/module.json','utf8'));
 assert(!manifest.styles.includes('styles/combat-bar.css'));
 await page.addStyleTag({content:await readFile(output+'/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>{
  window.hooks={};window.Hooks={on:(h,f)=>(hooks[h]??=[]).push(f),callAll:(h,...args)=>window.emit(h,...args)};window.emit=(h,...args)=>{for(const fn of hooks[h]??[])fn(...args);};
  window.settings={};window.configs={};window.openCombatBarSettings=()=>{calls.settingsOpened=(calls.settingsOpened??0)+1;};window.calls={select:[],ping:[],pan:[],next:0,previous:0,mode:[],activate:0};
  window.gm={id:'gm',isGM:true,active:true,hasPermission:()=>true};window.player={id:'p',isGM:false,active:true,hasPermission:()=>window.pingPermission};window.pingPermission=true;
  const scene={id:'scene'};
  window.makeToken=(id,name,color)=>{
   const actor={id,name,img:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="120" height="180" fill="${color}"/><text x="60" y="95" font-size="44" text-anchor="middle" fill="white">${name.slice(0,1)}</text></svg>`),testUserPermission:u=>u===player};
   const token={id,name,actor,isOwner:true,isVisible:true,controlled:false,center:{x:100,y:200},control:()=>{calls.select.push(id);token.controlled=true;emit('controlToken');}};
   token.document={id,uuid:'Scene.scene.Token.'+id,parent:scene,hidden:false,_source:{x:0,y:0,elevation:0},object:token,texture:{src:'WRONG-TOKEN-ART.png'}};
   actor.temporaryEffects=[{img:actor.img,name:'Prone'},{img:actor.img,name:'Dead',getFlag:()=>true}];
   actor.sheet={render:force=>{calls.sheets??=[];calls.sheets.push({id,force});}};
   return token;
  };
  window.tokens=[makeToken('t1','Violet','#784462'),makeToken('t2','Solo','#365b74'),makeToken('t3','Hidden Guard','#744d36')];
  window.combat={id:'fight',active:true,started:true,scene,round:1,turn:0,flags:{},canUserModify:()=>true,
   nextTurn:async()=>{calls.next++;if(window.deferTurn)await new Promise(resolve=>window.resolveTurn=resolve);combat.turn=(combat.turn+1)%combat.turns.length;emit('updateCombat');},
   previousTurn:async()=>{calls.previous++;combat.turn=Math.max(0,combat.turn-1);emit('updateCombat');},
   update:async data=>{const mode=data['flags.pneuma-combattools.combatBarMovement'];calls.mode.push(mode);if(window.rejectMode)throw Error('Mode update failed');combat.flags={'pneuma-combattools':{combatBarMovement:mode}};emit('updateCombat');}
  };
  combat.turns=tokens.map((token,i)=>({id:'c'+i,name:token.name,actor:token.actor,token:token.document,sceneId:'scene',visible:true,hidden:i===2,isDefeated:false,players:i===0?[player]:[]}));
  Object.defineProperty(combat,'combatant',{get:()=>combat.turns[combat.turn]});
  for(const participant of combat.turns){
   participant.actor.testUserPermission=u=>participant.players.includes(u);
   Object.defineProperty(participant,'visible',{get:()=>game.user.isGM||!participant.hidden||participant.players.includes(game.user)});
  }
  const users=Object.assign([gm,player],{get(id){return this.find(u=>u.id===id);}});
  window.game={user:gm,users,combats:[combat],settings:{register:(_m,k,c)=>{configs[k]=c;settings[k]=c.default;},get:(_m,k)=>settings[k],set:async(_m,k,v)=>{calls.mode.push(v);if(window.rejectMode)throw Error('Mode update failed');settings[k]=v;configs[k].onChange?.();}}};
  game.i18n={localize:key=>key};
  window.canvas={ready:true,scene,tokens:{placeables:tokens,activate:()=>calls.activate++},ping:async p=>calls.ping.push(p),animatePan:async p=>calls.pan.push(p)};
  canvas.stage={scale:{x:0.25}};
  window.CONFIG={Canvas:{pings:{types:{PULL:'pull'}}}};
  const ping=canvas.ping;
  canvas.ping=async(p,options)=>{calls.pingOptions=options;return ping(p);};
  for(const token of tokens)Object.defineProperty(token,'visible',{configurable:true,get:()=>token.isVisible});
  window.foundry={utils:{getProperty:(o,k)=>k.split('.').reduce((v,p)=>v?.[p],o)}};
  window.ui={notifications:{error:m=>window.lastError=m,warn:m=>window.lastWarning=m}};
  ui.combat={viewed:{id:'sidebar-preview'},template:'native-tracker',async getData(){return {combat:this.viewed,user:game.user};},async _onCombatantControl(event){calls.nativeControl={action:event.currentTarget.dataset.control,id:event.currentTarget.closest('.combatant').dataset.combatantId,combat:this.viewed.id};}};
  ui.combat._onCombatControl=async function(event){calls.initiative={action:event.currentTarget.dataset.control,combat:this.viewed.id};};
  // Foundry v12 CombatTracker methods, verified against the installed native source.
  ui.combat._onPingCombatant=async function(combatant){
   calls.nativePing=(calls.nativePing??0)+1;
   if(!canvas.ready||combatant.sceneId!==canvas.scene.id)return;
   if(!combatant.token.object.visible)return ui.notifications.warn(game.i18n.localize('COMBAT.WarnNonVisibleToken'));
   await canvas.ping(combatant.token.object.center);
  };
  ui.combat._onPanToCombatant=async function(combatant){
   calls.nativePan=(calls.nativePan??0)+1;
   if(!canvas.ready||combatant.sceneId!==canvas.scene.id)return;
   if(!combatant.token.object.visible)return ui.notifications.warn(game.i18n.localize('COMBAT.WarnNonVisibleToken'));
   const {x,y}=combatant.token.object.center;
   await canvas.animatePan({x,y,scale:Math.max(canvas.stage.scale.x,0.5)});
  };
  const nativeControl=ui.combat._onCombatantControl;
  ui.combat._onCombatantControl=async function(event){
   const action=event.currentTarget.dataset.control;
   const participant=this.viewed.turns.find(c=>c.id===event.currentTarget.closest('.combatant').dataset.combatantId);
   if(action==='pingCombatant')return this._onPingCombatant(participant);
   if(action==='panToCombatant')return this._onPanToCombatant(participant);
   return nativeControl.call(this,event);
  };
  window.renderTemplate=async(_path,data)=>(data.user.isGM?'<nav>'+[['rollAll','fas fa-users'],['rollNPC','fas fa-users-cog'],['resetAll','fas fa-undo']].map(([action,icon])=>`<a class="combat-control" data-control="${action}"><i class="${icon}"></i></a>`).join('')+'</nav>':'')+'<ol>'+data.combat.turns.filter(c=>c.visible).map(c=>`<li class="combatant" data-combatant-id="${c.id}">${(data.user.isGM?['toggleHidden','toggleDefeated','rollInitiative','pingCombatant','panToCombatant']:['pingCombatant','panToCombatant']).map(action=>`<a class="combatant-control" data-control="${action}" title="${action}"><i class="fas fa-eye"></i></a>`).join('')}</li>`).join('')+'</ol>';
  window.MouseInteractionManager={LONG_PRESS_DURATION_MS:500};
 });
 const state=await readFile(output+'/scripts/combat-bar-state.js','utf8');
 const source=(await readFile(output+'/scripts/combat-bar.js','utf8')).replace(/^import .*;\s*/gm,'').replace('const MODULE = "pneuma-combattools";','');
 const flyouts=(await readFile(output+'/scripts/combat-bar-flyout.js','utf8')).replace(/^import .*;\s*/gm,'');
 await page.addScriptTag({type:'module',content:state+'\n'+flyouts+'\nconst registerBarTurns=()=>{};const requestEndTurn=async combat=>{calls.gmRequests=(calls.gmRequests??0)+1;return combat.nextTurn();};\n'+source+'\nregisterCombatBar();emit("canvasReady");'});
 const bar=page.locator('#pneuma-combat-bar');await bar.waitFor();
 assert.equal(await bar.locator('li').count(),3);
 for(const layout of ['vertical','horizontal']){
  await page.evaluate(value=>game.settings.set('pneuma-combattools','combatBarOrientation',value),layout);
  for(const [action,label] of [['rollAll','Roll Initiative All'],['rollNPC','Roll Initiative NPC'],['resetAll','Reset Initiative']]){
   await bar.locator('header span').hover();
   await bar.locator('.pneuma-bar-initiative button').first().waitFor();
   assert.equal(await bar.locator('.pneuma-bar-initiative button').count(),3);
   assert.equal(await bar.getByRole('button',{name:label,exact:true}).locator('i').getAttribute('class'),{rollAll:'fas fa-users',rollNPC:'fas fa-users-cog',resetAll:'fas fa-undo'}[action]);
   await click(bar.getByRole('button',{name:label,exact:true}));
   assert.deepEqual(await page.evaluate(()=>calls.initiative),{action,combat:'fight'});
   assert.equal(await page.evaluate(()=>ui.combat.viewed.id),'sidebar-preview');
   assert.equal(await bar.locator('.pneuma-bar-initiative').count(),0);
  }
 }
 await page.evaluate(()=>game.settings.set('pneuma-combattools','combatBarOrientation','vertical'));
 assert.equal(await bar.locator('.active').count(),1);
 assert.equal(await bar.getByRole('button',{name:'End Turn',exact:true}).count(),1);
 const portrait=bar.locator('li').first().locator('[data-action=token]');
 assert.equal(await portrait.locator('img').getAttribute('src'),await page.evaluate(()=>tokens[0].actor.img));
 const size=await portrait.locator('img').boundingBox();assert.equal(size.width,size.height);assert.equal(size.width,40);
 assert.equal(await portrait.locator('img').evaluate(img=>getComputedStyle(img).borderRadius),'0px');
 const box=await bar.boundingBox(),players=await page.locator('#players').boundingBox();assert.equal(box.x,players.x);assert(box.y+box.height<=players.y-5);
 assert.equal(box.width,60);assert(box.x<50);assert.equal(await bar.locator('.pneuma-bar-name').count(),0);
 assert.equal(await bar.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0.5)');
 const endBox=await bar.getByRole('button',{name:'End Turn',exact:true}).boundingBox();assert(endBox.x>=box.x+box.width);
 assert.equal(await bar.getByRole('button',{name:'No Movement',exact:true}).locator('i').getAttribute('class'),'fas fa-hand');
 await portrait.hover();assert.equal(await bar.locator('.pneuma-bar-statuses img').count(),2);
 assert.equal(await bar.locator('.pneuma-bar-statuses img').last().getAttribute('title'),'Dead');
 await click(portrait,{button:'right'});assert.equal(await bar.locator('.pneuma-bar-controls .combatant-control').count(),5);
 await click(bar.locator('[data-control=toggleDefeated]'));assert.deepEqual(await page.evaluate(()=>calls.nativeControl),{action:'toggleDefeated',id:'c0',combat:'fight'});
 assert.equal(await page.evaluate(()=>ui.combat.viewed.id),'sidebar-preview');
 await click(portrait);assert.deepEqual(await page.evaluate(()=>calls.select),['t1']);
 await click(portrait,{modifiers:['Shift']});assert.equal(await page.evaluate(()=>calls.pan.length),1);assert.equal(await page.evaluate(()=>calls.select.length),1);
 await click(portrait,{delay:620});assert.equal(await page.evaluate(()=>calls.ping.length),1);assert.equal(await page.evaluate(()=>calls.select.length),1);
 // Canceled hold must never ping after leaving the bar.
 await portrait.hover();await page.mouse.down();await page.mouse.move(900,100);await page.mouse.up();await page.waitForTimeout(550);assert.equal(await page.evaluate(()=>calls.ping.length),1);
 await click(bar.getByRole('button',{name:'Next turn',exact:true}));assert.equal(await page.evaluate(()=>calls.next),1);
 assert.equal(await bar.locator('.active').getAttribute('data-entry-id'),'c1');
 await click(bar.getByRole('button',{name:'Previous turn',exact:true}));assert.equal(await page.evaluate(()=>calls.previous),1);
 await click(bar.getByRole('button',{name:'No Movement',exact:true}));assert.equal(await bar.getByRole('button',{name:'No Movement',exact:true}).getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{rejectMode=true;});await click(bar.getByRole('button',{name:'Free-Move',exact:true}));
 assert.equal(await page.evaluate(()=>lastError),'Mode update failed');assert.equal(await bar.getByRole('button',{name:'No Movement',exact:true}).getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{rejectMode=false;game.user=player;tokens[1].isOwner=false;emit('updateUser');});
 await bar.locator('header span').hover();assert.equal(await bar.locator('.pneuma-bar-initiative').count(),0,'Players have no initiative controls');
 assert.equal(await bar.locator('li').count(),2);assert.equal(await bar.locator('footer').count(),0);assert.equal(await bar.getByRole('button',{name:'Next turn',exact:true}).count(),0);
 await click(bar.locator('li').nth(1).locator('[data-action=token]'));assert.equal(await page.evaluate(()=>calls.select.length),1,'Unowned token cannot be selected');
 await page.evaluate(()=>{pingPermission=false;});await click(portrait,{delay:620});assert.equal(await page.evaluate(()=>calls.ping.length),1);
 await page.evaluate(()=>{combat.turns[1].hidden=true;emit('updateCombatant');});assert.equal(await bar.locator('li').count(),1);
 await page.evaluate(()=>{combat.turns[1].hidden=false;tokens[1].isVisible=false;combat.canUserModify=()=>false;emit('updateCombatant');});assert.equal(await bar.locator('li').count(),2);
 const unseen=bar.locator('li').nth(1).locator('[data-action=token]');
 await click(unseen,{modifiers:['Shift']});await click(unseen,{delay:620});assert.equal(await page.evaluate(()=>calls.pan.length),1);assert.equal(await page.evaluate(()=>calls.ping.length),1);
 await click(unseen,{button:'right'});assert.equal(await bar.locator('.pneuma-bar-controls .combatant-control').count(),2);
 assert.equal(await bar.locator('[data-control=panToCombatant]').getAttribute('aria-disabled'),null);
 await click(bar.locator('[data-control=panToCombatant]'));assert.equal(await page.evaluate(()=>calls.nativeControl.action),'toggleDefeated');
 assert.equal(await page.evaluate(()=>lastWarning),'COMBAT.WarnNonVisibleToken');
 assert.equal(await page.evaluate(()=>calls.pan.length),1);
 assert.equal(await page.evaluate(()=>calls.pan[0].scale),0.5,'Native pan zoom floor is preserved');
 assert((await page.evaluate(()=>calls.nativePan))>=2);
 await page.keyboard.press('Escape');await portrait.hover();assert.equal(await bar.locator('.pneuma-bar-statuses').count(),0);
 assert.equal(await bar.getByRole('button',{name:'End Turn',exact:true}).isVisible(),true);
 await page.evaluate(()=>{deferTurn=true;});await click(bar.getByRole('button',{name:'End Turn',exact:true}));
 assert.equal(await bar.getByRole('button',{name:'End Turn',exact:true}).isDisabled(),true);assert.equal(await page.evaluate(()=>calls.next),2);
 await page.evaluate(()=>{resolveTurn();deferTurn=false;});assert.equal(await bar.getByRole('button',{name:'End Turn',exact:true}).count(),0);
 assert.equal(await page.evaluate(()=>calls.gmRequests),1);
 await page.evaluate(()=>{game.user=gm;tokens[1].isVisible=true;combat.started=false;emit('updateCombat');});
 assert.equal(await bar.locator('header').count(),0);assert.equal(await bar.getByRole('button',{name:'Combat Move',exact:true}).isDisabled(),true);
 await click(bar.getByRole('button',{name:'No Movement',exact:true}));assert.equal(await page.evaluate(()=>settings.combatBarMovement),'none');
 await page.evaluate(()=>{document.getElementById('players').style.height='150px';});
 await page.waitForTimeout(50);const moved=await bar.boundingBox(),newPlayers=await page.locator('#players').boundingBox();assert(moved.y+moved.height<=newPlayers.y-5);
 await page.evaluate(()=>{combat.started=true;combat.turn=0;for(let i=3;i<20;i++)combat.turns.push({...combat.turns[1],id:'c'+i,name:'Combatant '+i});emit('updateCombat');});
 assert(await bar.locator('ol').evaluate(el=>el.scrollHeight>el.clientHeight),'Long list scrolls');assert.equal(await bar.locator('footer').isVisible(),true);
 await page.evaluate(()=>{combat.turn=19;emit('updateCombat');});
 assert.equal(await bar.locator('.pneuma-bar-end').isVisible(),true,'Vertical turn changes reveal End Turn');
 assert(await bar.locator('ol').evaluate(el=>el.scrollTop>0));
 await page.evaluate(()=>{combat.turn=0;emit('updateCombat');});
 assert.equal(await bar.locator('.pneuma-bar-end').isVisible(),true,'Returning to the first turn scrolls back');
 await page.evaluate(()=>{combat.turns.splice(3);emit('updateCombat');});
 if(process.env.PNEUMA_BAR_SCREENSHOT)await page.screenshot({path:process.env.PNEUMA_BAR_SCREENSHOT});
 await page.evaluate(()=>{settings.combatBar=false;configs.combatBar.onChange();});assert.equal(await bar.count(),0);
 const blocked=await page.evaluate(()=>hooks.preUpdateToken[0](tokens[1].document,{x:5},{},player.id));assert.equal(blocked,false,'Hidden client display must not disable movement rules');
 await page.evaluate(()=>{settings.combatBar=true;configs.combatBar.onChange();});assert.equal(await bar.count(),1);
 // A real double-click must survive the selection hook between clicks.
 await page.evaluate(()=>{game.user=player;tokens[0].controlled=false;emit('controlToken');emit('updateUser');});
 const ownPortrait=bar.locator('[data-entry-id=c0] [data-action=token]');
 await ownPortrait.dblclick({delay:80});assert.deepEqual(await page.evaluate(()=>calls.sheets),[{id:'t1',force:true}]);
 await bar.locator('[data-entry-id=c1] [data-action=token]').dblclick({delay:80});assert.equal(await page.evaluate(()=>calls.sheets.length),1,'Denied viewers cannot open sheets');
 await page.evaluate(()=>{combat.turns[1].actor.testUserPermission=(_u,level)=>level==='OBSERVER';tokens[1].isVisible=false;emit('updateActor');});
 await bar.locator('[data-entry-id=c1] [data-action=token]').dblclick({delay:80});assert.equal(await page.evaluate(()=>calls.sheets.length),2,'Observer access opens an unseen actor sheet without pan or ping');
 await page.evaluate(()=>{combat.turns[1].token=null;emit('updateCombatant');});
 await bar.locator('[data-entry-id=c1] [data-action=token]').dblclick({delay:80});assert.equal(await page.evaluate(()=>calls.sheets.length),3,'Actor-only combatants can open their sheet');
 // Display preferences are client-scoped and available to players.
 assert.deepEqual(await page.evaluate(()=>['combatBarSize','combatBarOrientation','combatBarMinimized'].map(k=>configs[k].scope)),['client','client','client']);
 const movementBefore=await page.evaluate(()=>settings.combatBarMovement);
 for(const layout of ['vertical','horizontal']){
  await page.evaluate(layout=>game.settings.set('pneuma-combattools','combatBarOrientation',layout),layout);
  for(const px of [32,40,48,64,80,96]){
   await page.evaluate(px=>game.settings.set('pneuma-combattools','combatBarSize',String(px)),px);
   const imageBox=await ownPortrait.locator('img').boundingBox();assert.equal(imageBox.width,px);assert.equal(imageBox.height,px);
   const first=await bar.locator('li').first().boundingBox(),second=await bar.locator('li').nth(1).boundingBox();
   if(layout==='horizontal'){assert(second.x>first.x);assert.equal(second.y,first.y);}else{assert(second.y>first.y);assert.equal(second.x,first.x);}
  }
  await click(bar.getByRole('button',{name:'Minimize combat bar',exact:true}));
  assert.equal(await bar.locator('li').count(),0);assert.equal(await bar.locator('.pneuma-bar-end').count(),0);
  assert((await bar.boundingBox()).width<=54);assert(await bar.getByRole('button',{name:'Combat Bar settings',exact:true}).isVisible());
  assert.equal(await bar.locator('footer').count(),0,'Minimized players have no GM controls');
  await click(bar.getByRole('button',{name:'Restore combat bar',exact:true}));assert.equal(await bar.locator('li').count(),2);
 }
 await click(bar.getByRole('button',{name:'Combat Bar settings',exact:true}));assert.equal(await page.evaluate(()=>calls.settingsOpened),1);await page.evaluate(()=>game.settings.set('','combatBarOrientation','vertical'));assert.equal(await bar.getAttribute('data-orientation'),'vertical');
 assert.equal(await page.evaluate(()=>settings.combatBarMovement),movementBefore);
 await page.evaluate(()=>{game.user=gm;emit('updateUser');});
 // Both orientations anchor movement above Players at the screen left, across sizes and minimization.
 for(const layout of ['vertical','horizontal']){
  await page.evaluate(value=>game.settings.set('pneuma-combattools','combatBarOrientation',value),layout);
  for(const px of [32,40,48,64,80,96]){
   await page.evaluate(value=>game.settings.set('pneuma-combattools','combatBarSize',String(value)),px);
   for(const minimized of [true,false]){
    await page.evaluate(value=>game.settings.set('pneuma-combattools','combatBarMinimized',value),minimized);
    const root=await bar.boundingBox(),footer=await bar.locator('footer').boundingBox(),display=await bar.locator('.pneuma-bar-display').boundingBox();
    assert.equal(footer.x,root.x+5,'Movement stays inside the left edge');
    assert.equal(footer.y+footer.height,(await page.locator('#players').boundingBox()).y-11,'Movement stays fixed above Players');
    assert.equal(footer.y+footer.height,root.y+root.height-5,'Movement occupies the bottom of the shared bar');
    assert(footer.y>=root.y&&footer.x+footer.width<=root.x+root.width,'Movement is inside the same surface');
    if(!minimized){
     const header=await bar.locator('header').boundingBox(),list=await bar.locator('ol').boundingBox();
     if(layout==='horizontal'){assert.equal(header.y,root.y+5);assert(header.x>=list.x+list.width);assert(list.x>=footer.x+footer.width);}
     else {assert(header.y+header.height<=list.y);assert(list.y+list.height<=footer.y);}
    }
   }
  }
 }
 if(process.env.PNEUMA_BAR_SCREENSHOTS){
  for(const orientation of ['vertical','horizontal']){
   await page.evaluate(o=>{game.settings.set('','combatBarOrientation',o);game.settings.set('','combatBarSize','40');},orientation);
   await page.screenshot({path:process.env.PNEUMA_BAR_SCREENSHOTS+'-'+orientation+'.png'});
  }
  await page.evaluate(()=>game.settings.set('','combatBarSize','96'));
 }
 assert.equal(await page.evaluate(()=>configs.combatBarPlacement),undefined,'Top placement removed');
 for(const orientation of ['horizontal','vertical']){
  await page.evaluate(value=>game.settings.set('pneuma-combattools','combatBarOrientation',value),orientation);
  await click(bar.getByRole('button',{name:'Minimize combat bar',exact:true}));
  assert.equal(await bar.locator('footer button').count(),4);assert(await bar.getByRole('button',{name:'Combat Bar settings',exact:true}).isVisible());
  assert.equal(await bar.locator('li, header, .pneuma-bar-end').count(),0);
  await click(bar.getByRole('button',{name:'Free-Move',exact:true}));
  assert.equal(await page.evaluate(()=>settings.combatBarMovement),'free');
  assert.equal(await bar.getByRole('button',{name:'Free-Move',exact:true}).getAttribute('aria-pressed'),'true');
  const bounds=await bar.boundingBox();
  for(const control of await bar.locator('footer button').all()){
   const box=await control.boundingBox();assert(box.x>=bounds.x&&box.x+box.width<=bounds.x+bounds.width&&box.y>=bounds.y&&box.y+box.height<=bounds.y+bounds.height);
  }
  await click(bar.getByRole('button',{name:'Restore combat bar',exact:true}));
 }
 const previous=bar.getByRole('button',{name:'Previous turn',exact:true}),next=bar.getByRole('button',{name:'Next turn',exact:true});
 let prevBox=await previous.boundingBox(),nextBox=await next.boundingBox();assert.equal(prevBox.width,49);assert.equal(prevBox.height,18);assert.equal(nextBox.y,prevBox.y);assert(nextBox.x>=prevBox.x+prevBox.width);
 await page.evaluate(()=>game.settings.set('','combatBarOrientation','horizontal'));
 prevBox=await previous.boundingBox();nextBox=await next.boundingBox();assert.equal(prevBox.width,22);assert(nextBox.y>prevBox.y);assert.equal(prevBox.x,nextBox.x);
 assert.equal(await previous.textContent(),'←');assert.equal(await next.textContent(),'→');
 const horizontalEnd=await bar.locator('.pneuma-bar-end').boundingBox();assert(horizontalEnd.y+horizontalEnd.height<=(await bar.boundingBox()).y);
 await ownPortrait.hover();const statusBox=await bar.locator('.pneuma-bar-statuses').boundingBox();assert(statusBox.y+statusBox.height<=horizontalEnd.y);
 await page.evaluate(()=>{for(let i=3;i<35;i++)combat.turns.push({...combat.turns[1],id:'c'+i});emit('updateCombat');});
 assert(await bar.locator('ol').evaluate(el=>el.scrollWidth>el.clientWidth));
 await page.evaluate(()=>{combat.turn=34;emit('updateCombat');});
 assert.equal(await bar.locator('.pneuma-bar-end').isVisible(),true,'Horizontal turn changes reveal End Turn');
 assert(await bar.locator('ol').evaluate(el=>el.scrollLeft>0));
 await page.evaluate(()=>{combat.turn=0;emit('updateCombat');});
 await bar.locator('ol').evaluate(el=>el.scrollLeft=el.scrollWidth);await page.waitForTimeout(50);assert.equal(await bar.locator('.pneuma-bar-end').isVisible(),false);
 await page.evaluate(()=>{combat.started=false;emit('updateCombat');});
 await click(bar.getByRole('button',{name:'Minimize combat bar',exact:true}));
 assert.equal(await bar.getByRole('button',{name:'Combat Move',exact:true}).isDisabled(),true);
 await click(bar.getByRole('button',{name:'No Movement',exact:true}));assert.equal(await page.evaluate(()=>settings.combatBarMovement),'none');
 await click(bar.getByRole('button',{name:'Restore combat bar',exact:true}));
 assert.equal(await bar.locator('header').count(),0);
 // GM navigation works outside combat even when the token is not rendered visible.
 const scenePortrait=bar.locator('li').first().locator('[data-action=token]');
 const beforeNavigation=await page.evaluate(()=>({pan:calls.pan.length,ping:calls.ping.length}));
 await page.evaluate(()=>{Object.defineProperty(tokens[0],'visible',{configurable:true,value:false});pingPermission=true;});
 await click(scenePortrait,{modifiers:['Shift']});await click(scenePortrait,{delay:620});
 assert.deepEqual(await page.evaluate(()=>({pan:calls.pan.length,ping:calls.ping.length})),{pan:beforeNavigation.pan+1,ping:beforeNavigation.ping+1});
 await page.evaluate(()=>{Object.defineProperty(tokens[0],'visible',{configurable:true,value:true});});
 await click(scenePortrait,{modifiers:['Shift']});await click(scenePortrait,{delay:620});
 assert.deepEqual(await page.evaluate(()=>({pan:calls.pan.length,ping:calls.ping.length})),{pan:beforeNavigation.pan+2,ping:beforeNavigation.ping+2});
 await page.evaluate(()=>{combat.turns.splice(3);combat.started=true;Object.defineProperty(tokens[0],'visible',{configurable:true,value:false});emit('updateCombat');});
 const gmUnseen=bar.locator('[data-entry-id=c0] [data-action=token]');
 await click(gmUnseen,{button:'right'});await click(bar.locator('[data-control=panToCombatant]'));
 await click(gmUnseen,{button:'right'});await click(bar.locator('[data-control=pingCombatant]'));
 assert.deepEqual(await page.evaluate(()=>({pan:calls.pan.length,ping:calls.ping.length})),{pan:beforeNavigation.pan+3,ping:beforeNavigation.ping+3});
 // Shift-hold pulls through native ping without the release also causing a local pan.
 await click(gmUnseen,{modifiers:['Shift'],delay:620});
 assert.deepEqual(await page.evaluate(()=>calls.pingOptions),{pull:true,style:'pull'});
 assert.deepEqual(await page.evaluate(()=>({pan:calls.pan.length,ping:calls.ping.length})),{pan:beforeNavigation.pan+3,ping:beforeNavigation.ping+4});
 await page.evaluate(()=>{game.user=player;emit('updateUser');});
 await click(gmUnseen,{modifiers:['Shift'],delay:620});
 assert.equal(await page.evaluate(()=>calls.ping.length),beforeNavigation.ping+4,'Players cannot pull others');

 // Collapsed Players must not let horizontal portraits overlap native macros.
 await page.evaluate(()=>{
   game.user=gm;
   game.settings.set('','combatBarOrientation','horizontal');
   game.settings.set('','combatBarMinimized',false);
   document.getElementById('players').style.height='40px';
   const hotbar=document.createElement('div');hotbar.id='hotbar';hotbar.style.cssText='position:fixed;left:120px;right:20px;bottom:10px;height:80px;background:#222';
   document.body.append(hotbar);emit('renderHotbar');
 });
 await page.waitForFunction(()=>document.getElementById('pneuma-combat-bar').getBoundingClientRect().bottom<=document.getElementById('hotbar').getBoundingClientRect().top-5);
 await page.screenshot({path:process.env.TEMP+'/pneuma-combat-bar-macro-clearance.png'});
 await page.evaluate(()=>document.getElementById('hotbar').style.height='110px');
 await page.waitForFunction(()=>document.getElementById('pneuma-combat-bar').getBoundingClientRect().bottom<=document.getElementById('hotbar').getBoundingClientRect().top-5);
 await page.evaluate(()=>document.getElementById('hotbar').style.display='none');
 await page.waitForFunction(()=>Math.abs(document.getElementById('pneuma-combat-bar').getBoundingClientRect().bottom-document.getElementById('players').getBoundingClientRect().top+6)<1);
 await page.evaluate(()=>{
   document.getElementById('ui-left').style.zIndex='40';
   document.getElementById('controls').style.height='410px';
   game.settings.set('','combatBarOrientation','vertical');emit('renderSceneControls');
 });
 await page.waitForFunction(()=>document.getElementById('pneuma-combat-bar').getBoundingClientRect().top>=418);
 assert.ok(await bar.evaluate(e=>Number(getComputedStyle(e).zIndex)<40),'Canvas tools stack above bar');
 await page.evaluate(()=>game.settings.set('','combatBarDock','top-right'));
 await page.waitForFunction(()=>document.getElementById('pneuma-combat-bar').dataset.dock==='top-right');
 let geometry=await bar.evaluate(e=>({bar:e.getBoundingClientRect().toJSON(),footer:e.querySelector('footer').getBoundingClientRect().toJSON(),header:e.querySelector('header').getBoundingClientRect().toJSON(),list:e.querySelector('ol').getBoundingClientRect().toJSON()}));
 assert.equal(geometry.bar.top,8);assert.ok(geometry.footer.top<geometry.list.top&&geometry.header.top>geometry.list.top,'Top-right vertical order');
 assert.ok(Math.abs(geometry.footer.right-geometry.bar.right)<10,'Movement controls right aligned');
 await page.screenshot({path:process.env.TEMP+'/pct-bar-top-right-vertical.png'});
 await page.evaluate(()=>game.settings.set('','combatBarOrientation','horizontal'));
 geometry=await bar.evaluate(e=>({bar:e.getBoundingClientRect().toJSON(),footer:e.querySelector('footer').getBoundingClientRect().toJSON(),header:e.querySelector('header').getBoundingClientRect().toJSON(),list:e.querySelector('ol').getBoundingClientRect().toJSON()}));
 assert.ok(geometry.footer.left>geometry.list.left&&geometry.header.left<geometry.list.left,'Top-right horizontal order');
 assert.ok(Math.abs(geometry.footer.top-geometry.bar.top)<10,'Movement controls top aligned');
 for(const orientation of ['vertical','horizontal']) {
   await page.evaluate(o=>game.settings.set('','combatBarOrientation',o),orientation);
   await page.addStyleTag({content:'#pneuma-combat-bar {overflow:hidden}'});
   const end=bar.locator('.pneuma-bar-end');assert.equal(await end.isVisible(),true,'Top-right End Turn visible: '+orientation);
   const e=await end.boundingBox();
   assert.ok(e.x>=0&&e.y>=0&&e.x+e.width<=1000&&e.y+e.height<=800);
   assert.equal(await end.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el;}),true,'End Turn is not clipped: '+orientation);
 }
 await page.addStyleTag({content:'#pneuma-combat-bar {overflow:visible}'});
 await bar.locator('li').nth(1).click({button:'right'});
 await page.waitForSelector('.pneuma-bar-controls');
 const flyout=await bar.locator('.pneuma-bar-controls').boundingBox(),dock=await bar.boundingBox();
 assert.ok(flyout.y-dock.y-dock.height>=3&&flyout.y-dock.y-dock.height<=6,'Non-active flyout stays close to bar');
 await page.screenshot({path:process.env.TEMP+'/pct-bar-top-right-horizontal.png'});
 await page.evaluate(()=>{emit('canvasTearDown');canvas.ready=false;});assert.equal(await bar.count(),0);
 assert.deepEqual(errors,[]);console.log('Combat bar browser checks passed: portraits, positioning, selection, ping, pan, visibility, turn controls, mode writes, scroll and cleanup.');
}finally{await browser.close();}
