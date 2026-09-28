import {test} from 'node:test';import assert from 'node:assert/strict';
import {nextCombatant,notifyTurnChange,registerTurnAlerts} from '../dist/scripts/turn-alerts.js';
import {registerHUDMessages,listHUDMessages} from '../dist/scripts/hud-messages.js';
test('next turn wraps, respects defeated skipping, and never marks the current combatant',()=>{
 const turns=[{id:'a'},{id:'b',isDefeated:true},{id:'c'}];const c={started:true,turn:0,turns,settings:{skipDefeated:true}};
 assert.equal(nextCombatant(c),turns[2]);c.turn=2;assert.equal(nextCombatant(c),turns[0]);c.settings.skipDefeated=false;c.turn=0;assert.equal(nextCombatant(c),turns[1]);c.turns=[turns[0]];assert.equal(nextCombatant(c),undefined);
});
test('turn popups stay out of HUD list; duplicates, hidden turns and GM clients stay quiet',()=>{
 const hooks={},flashes=[],sounds=[];
 globalThis.Hooks={on:(key,fn)=>hooks[key]=fn,once(){}};globalThis.document={addEventListener(){}};
 globalThis.foundry={utils:{randomID:()=> 'id'},audio:{AudioHelper:{play:async(...args)=>sounds.push(args)}}};
 globalThis.game={user:{id:'player',isGM:false},modules:new Map([['pneuma-combattools',{}]]),settings:{get:()=>true,register(){}},combats:[]};
 registerHUDMessages(()=>{},(notice,remove)=>{if(!remove)flashes.push(notice);});registerTurnAlerts();
 const mine={id:'mine',visible:true,token:{},actor:{testUserPermission:()=>true}},other={id:'other',visible:true,token:{},actor:{testUserPermission:()=>false}};
 const combat={id:'combat',active:true,started:false,round:0,turn:0,turns:[other,mine],combatant:other,settings:{skipDefeated:true}};
 hooks.createCombat(combat);combat.started=true;combat.round=1;notifyTurnChange(combat);
 assert.equal(flashes.at(-1).text,'Your turn is next');assert.equal(listHUDMessages().length,0);assert.equal(sounds.length,0);
 combat.turn=1;combat.combatant=mine;notifyTurnChange(combat);notifyTurnChange(combat);
 assert.equal(flashes.length,2);assert.equal(flashes.at(-1).text,"It's your turn!");assert.equal(sounds.length,0);assert.equal(flashes.at(-1).id,"current-turn");assert.equal(listHUDMessages().length,0);
 mine.token.hidden=true;combat.round++;notifyTurnChange(combat);assert.equal(flashes.length,2);
 mine.token.hidden=false;game.user.isGM=true;combat.round++;notifyTurnChange(combat);assert.equal(flashes.length,2);
});

test('next marker is subtle, reuses geometry, pauses in static mode, and hides secret tokens',async()=>{
 const {refreshNextTurnMarker}=await import('../dist/scripts/turn-alerts.js');
 const ticks=new Set();let art,draws=0;
 class Container {constructor(){art=this;this.children=[];this.position={set(){}};}addChild(child){this.children.push(child);}destroy(){this.destroyed=true;}}
 globalThis.PIXI={Container,Graphics:class {constructor(){this.scale={set:value=>this.size=value};}lineStyle(){return this;}drawCircle(){draws++;return this;}}};
 const next={tokenId:'next',sceneId:'scene',visible:true},c={active:true,started:true,turn:0,turns:[{},next],settings:{skipDefeated:true},scene:{id:'scene'}};
 const token={w:100,h:100,visible:true,renderable:true,document:{},addChildAt(){}};
 const settings={turnMarkerEnabled:true,nextTurnMarker:true,turnMarkerDisplay:'animated'};
 globalThis.game={user:{isGM:false},settings:{get:(_m,key)=>settings[key]},combats:new Map([['c',c]])};
 globalThis.document={hidden:false};globalThis.canvas={ready:true,scene:{id:'scene',grid:{size:100}},tokens:{get:()=>token},app:{ticker:{add:t=>ticks.add(t),remove:t=>ticks.delete(t)}}};
 refreshNextTurnMarker();assert.equal(draws,3);assert.equal(ticks.size,1);
 const before=art.children.map(r=>r.size);[...ticks][0](1);assert.ok(art.children.every(r=>r.alpha>=0&&r.alpha<=.28));assert.ok(art.children.every((r,i)=>r.size>before[i]));assert.equal(new Set(art.children.map(r=>r.size)).size,3);
 refreshNextTurnMarker();assert.equal(draws,3);
 settings.turnMarkerDisplay='static';refreshNextTurnMarker();assert.equal(ticks.size,0);assert.equal(art.children.length,3);
 token.document.hidden=true;refreshNextTurnMarker();assert.equal(art.destroyed,true);
});
