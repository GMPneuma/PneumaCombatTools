import assert from 'node:assert/strict';
import {test} from 'node:test';
import {MARKER_STYLES} from '../dist/scripts/turn-marker-art.js';
import {registerTurnMarker,refreshTurnMarker} from '../dist/scripts/turn-marker.js';
let graphics=0;
class Container {
 constructor(){this.scale={set:()=>{}};this.children=[];this.visible=true;this.renderable=true;this.position={set:(x,y)=>{this.x=x;this.y=y}};}
 addChild(child){this.children.push(child);child.parent=this;return child;}
 addChildAt(child,index){this.children.splice(index,0,child);child.parent=this;return child;}
 destroy(){this.destroyed=true;for(const child of [...this.children])child.destroy();if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
}
class Graphics extends Container {
 constructor(){super();graphics++;}
 lineStyle(){return this;}moveTo(){return this;}lineTo(){return this;}arc(){return this;}beginFill(){return this;}drawCircle(){return this;}endFill(){return this;}
}
function fixture(){
 globalThis.canvas={ready:false};refreshTurnMarker();
 globalThis.PIXI={Container,Graphics};globalThis.window={matchMedia:()=>({matches:false})};globalThis.document={hidden:false,addEventListener(){}};
 globalThis.foundry={data:{fields:{ColorField:class{constructor(options){this.options=options}}}}};
 const hooks={},configs=new Map(),values=new Map(),ticks=new Set();
 globalThis.Hooks={on:(name,fn)=>{(hooks[name]??=[]).push(fn)}};
 const tokens=['a','b'].map(id=>Object.assign(new Container(),{id,w:100,h:100,document:{id},isPreview:false}));
 for(const token of tokens)Object.defineProperty(token.document,'actor',{get:()=>token.actor});
 const scene={id:'scene',grid:{size:100}};
 const combat={active:true,started:true,scene,combatant:{tokenId:'a',sceneId:'scene',visible:true}};
 const ticker={add:fn=>ticks.add(fn),remove:fn=>ticks.delete(fn)};
 Object.assign(canvas,{ready:true,scene,tokens:{get:id=>tokens.find(t=>t.id===id)},app:{ticker}});
 globalThis.game={user:{isGM:false},combat:{scene:{id:'unrelated'}},combats:new Map([['combat',combat]]),settings:{register:(_m,key,config)=>{configs.set(key,config);values.set(key,config.default)},get:(_m,key)=>values.get(key)}};
 registerTurnMarker();
 const set=(key,value)=>{values.set(key,value);configs.get(key).onChange(value)};
 const emit=(name,...args)=>hooks[name]?.forEach(fn=>fn(...args));
 return {tokens,combat,configs,values,ticks,set,emit};
}
test('marker follows active scene turn, token movement and cleanup; tracker selection is irrelevant',()=>{
 const f=fixture();refreshTurnMarker();assert.equal(f.tokens[0].children.length,1);assert.equal(f.ticks.size,1);
 const old=f.tokens[0].children[0];f.tokens[0].position.set(500,200);f.emit('refreshToken',f.tokens[0]);assert.equal(f.tokens[0].children[0],old);
 f.combat.combatant.tokenId='b';f.emit('updateCombat');assert.equal(old.destroyed,true);assert.equal(f.tokens[1].children.length,1);assert.equal(f.ticks.size,1);
 f.combat.started=false;f.emit('updateCombat');assert.equal(f.ticks.size,0);assert.equal(f.tokens[1].children.length,0);
 f.combat.started=true;f.emit('updateCombat');f.emit('canvasTearDown');assert.equal(f.ticks.size,0);assert.equal(f.tokens[1].children.length,0);
});
test('hidden, secret, unseen and foreign-scene tokens never expose a player marker',()=>{
 const f=fixture();for(const key of ['hidden','isSecret']){f.tokens[0].document[key]=true;refreshTurnMarker();assert.equal(f.ticks.size,0);f.tokens[0].document[key]=false;}
 f.tokens[0].visible=false;refreshTurnMarker();assert.equal(f.ticks.size,0);f.tokens[0].visible=true;
 f.combat.combatant.visible=false;refreshTurnMarker();assert.equal(f.ticks.size,0);f.combat.combatant.visible=true;
 f.combat.combatant.sceneId='other';refreshTurnMarker();assert.equal(f.ticks.size,0);
 f.combat.combatant.sceneId='scene';refreshTurnMarker();assert.equal(f.ticks.size,1);
 f.tokens[0].visible=false;f.emit('refreshToken',f.tokens[0]);assert.equal(f.tokens[0].children.length,0);assert.equal(f.ticks.size,0);
});
test('static, off, speed zero and background tabs stop animation; legacy low opacity clamps to 50%',()=>{
 const f=fixture();refreshTurnMarker();f.set('turnMarkerDisplay','static');assert.equal(f.ticks.size,0);assert.equal(f.tokens[0].children.length,1);
 f.set('turnMarkerDisplay','off');assert.equal(f.tokens[0].children.length,0);
 f.set('turnMarkerDisplay','animated');f.set('turnMarkerSpeed',0);assert.equal(f.ticks.size,0);
 f.set('turnMarkerSpeed',1);document.hidden=true;refreshTurnMarker();assert.equal(f.ticks.size,0);
 document.hidden=false;refreshTurnMarker();assert.equal(f.ticks.size,1);
 f.set('turnMarkerOpacity',0);assert.equal(f.ticks.size,1);assert.equal(f.tokens[0].children[0].alpha,.5);
});
test('each style caches geometry; frames do not allocate graphics or redraw paths',()=>{
 const f=fixture();for(const style of Object.keys(MARKER_STYLES)){
  f.set('turnMarkerStyle',style);const root=f.tokens[0].children[0],count=graphics;
  for(let n=0;n<120;n++)for(const tick of f.ticks)tick(1);
  assert.equal(graphics,count);assert.equal(f.tokens[0].children[0],root);
  f.emit('refreshToken',f.tokens[0]);assert.equal(graphics,count);
 }
 const old=f.tokens[0].children[0];f.tokens[0].w=200;f.emit('refreshToken',f.tokens[0]);assert.equal(old.destroyed,true);assert.equal(f.tokens[0].children[0].x,100);
 f.emit('destroyToken',f.tokens[0]);assert.equal(f.ticks.size,0);
});
test('default appearance is world scoped; local display, distance, thickness 10 and blank colors remain',()=>{
 const f=fixture();assert.deepEqual(Object.keys(f.configs.get('turnMarkerStyle').choices),['off',...Object.keys(MARKER_STYLES)]);
 assert.equal(f.configs.get('turnMarkerSpeed').range.max,2);assert.equal(f.configs.get('turnMarkerOpacity').range.min,.5);assert.equal(f.configs.get('turnMarkerDistance').default,8);assert.equal(f.configs.get('turnMarkerDistance').range.max,50);assert.equal(f.configs.get('turnMarkerThickness').range.max,10);
 for(const [key,config] of f.configs)assert.equal(config.scope,['turnMarkerDisplay','turnMarkerEnabled','turnMarkerForceDefault'].includes(key)?'client':'world');
 refreshTurnMarker();const old=f.tokens[0].children[0];f.set('turnMarkerDistance',30);assert.equal(old.destroyed,true);
 f.set('turnMarkerThickness',10);
 assert.equal(f.configs.get('turnMarkerColor').type.options.blank,true);
 for(const color of ['',null,'#12ABef'])f.set('turnMarkerColor',color);
 assert.equal(f.tokens[0].children.length,1);
 game.combats.set('ambiguous',{...f.combat});refreshTurnMarker();assert.equal(f.ticks.size,0);
});

test('user profile updates refresh the current token; clearing it restores the default',()=>{
 const f=fixture();const owner={id:'p',isGM:false,character:{id:'actor'},getFlag(){return this.profile}};game.users=[owner];f.tokens[0].actor={id:'actor',type:'character',testUserPermission:()=>true};refreshTurnMarker();const old=f.tokens[0].children[0];owner.profile={turnMarkerStyle:'medtech',turnMarkerSpeed:0};f.emit('updateUser',owner);assert.equal(old.destroyed,true);assert.equal(f.ticks.size,0);delete owner.profile;f.emit('updateUser',owner);assert.equal(f.ticks.size,1);
});

test('viewer master off destroys all indicators; force-default bypasses personal profiles without modifying them',()=>{
 const f=fixture(),owner={id:'player',isGM:false,character:{id:'pc'},profile:{turnMarkerStyle:'medtech',turnMarkerSpeed:0},getFlag(){return this.profile}};game.users=[owner];f.tokens[0].actor={id:'pc',type:'character',testUserPermission:()=>true};refreshTurnMarker();assert.equal(f.ticks.size,0);assert.equal(f.tokens[0].children.length,1);
 const personal=f.tokens[0].children[0];f.set('turnMarkerForceDefault',true);assert.equal(personal.destroyed,true);assert.equal(f.ticks.size,1);assert.equal(owner.profile.turnMarkerStyle,'medtech');
 f.set('turnMarkerEnabled',false);assert.equal(f.tokens[0].children.length,0);assert.equal(f.ticks.size,0);f.emit('updateUser',owner);assert.equal(f.tokens[0].children.length,0);
 f.set('turnMarkerEnabled',true);assert.equal(f.ticks.size,1);f.set('turnMarkerForceDefault',false);assert.equal(f.ticks.size,0);assert.equal(f.tokens[0].children.length,1);
 f.tokens[0].actor.type='mook';f.emit('updateActor');assert.equal(f.ticks.size,1);f.set('turnMarkerEnabled',false);assert.equal(f.tokens[0].children.length,0);
});

test('token overrides beat player profiles, refresh on updateToken, and obey viewer switches',()=>{
 const f=fixture(),owner={id:'p',isGM:false,character:{id:'pc'},getFlag:()=>({turnMarkerStyle:'medtech',turnMarkerSpeed:1})};game.users=[owner];f.tokens[0].actor={id:'pc',type:'character',testUserPermission:()=>true};const doc=f.tokens[0].document;doc.profile={turnMarkerStyle:'solo',turnMarkerSpeed:0};doc.getFlag=()=>doc.profile;
 refreshTurnMarker();assert.equal(f.ticks.size,0);f.set('turnMarkerForceDefault',true);assert.equal(f.ticks.size,1);f.set('turnMarkerForceDefault',false);assert.equal(f.ticks.size,0);delete doc.profile;f.emit('updateToken',doc);assert.equal(f.ticks.size,1);doc.profile={turnMarkerStyle:'off'};f.emit('updateToken',doc);assert.equal(f.tokens[0].children.length,0);
});

test('editor preview works outside combat, stays local, and restores the combat indicator on close',async()=>{
 const {previewTurnMarker,endTurnMarkerPreview}=await import('../dist/scripts/turn-marker.js');
 const f=fixture(),owner={};f.tokens[1].isOwner=true;f.combat.started=false;
 const profile={turnMarkerStyle:'solo',turnMarkerColor:'#12abef',turnMarkerThickness:3,turnMarkerDistance:20,turnMarkerOpacity:.8,turnMarkerSpeed:1};
 previewTurnMarker(owner,f.tokens[1].document,profile);assert.equal(f.tokens[1].children.length,1);assert.equal(f.tokens[0].children.length,0);assert.equal(f.combat.started,false);assert.equal(f.tokens[1].document.profile,undefined);
 f.set('turnMarkerForceDefault',true);assert.equal(f.tokens[1].children[0].alpha,.8);
 f.set('turnMarkerEnabled',false);assert.equal(f.tokens[1].children.length,0);f.set('turnMarkerEnabled',true);
 f.set('turnMarkerDisplay','static');assert.equal(f.ticks.size,0);assert.equal(f.tokens[1].children.length,1);
 f.combat.started=true;f.emit('updateCombat');assert.equal(f.tokens[0].children.length,0);
 endTurnMarkerPreview(owner);assert.equal(f.tokens[1].children.length,0);assert.equal(f.tokens[0].children.length,1);
 previewTurnMarker(owner,f.tokens[1].document,profile);f.emit('canvasTearDown');assert.equal(f.tokens[1].children.length,0);refreshTurnMarker();assert.equal(f.tokens[0].children.length,1);
});

test('preview refuses unowned and hidden tokens and cleans up separate editor sessions',async()=>{
 const {previewTurnMarker,endTurnMarkerPreview}=await import('../dist/scripts/turn-marker.js');
 const f=fixture(),first={},second={},profile={turnMarkerStyle:'scanner',turnMarkerColor:'#ffc36a',turnMarkerThickness:2,turnMarkerDistance:8,turnMarkerOpacity:.7,turnMarkerSpeed:1};
 f.combat.started=false;previewTurnMarker(first,f.tokens[1].document,profile);assert.equal(f.tokens[1].children.length,0);
 f.tokens[1].isOwner=true;f.tokens[1].document.hidden=true;refreshTurnMarker();assert.equal(f.tokens[1].children.length,0);
 f.tokens[1].document.hidden=false;refreshTurnMarker();assert.equal(f.tokens[1].children.length,1);
 f.tokens[0].isOwner=true;previewTurnMarker(second,f.tokens[0].document,profile);assert.equal(f.tokens[1].children.length,0);
 endTurnMarkerPreview(first);assert.equal(f.tokens[0].children.length,1);
 f.emit('destroyToken',f.tokens[0]);assert.equal(f.ticks.size,0);endTurnMarkerPreview(second);assert.equal(f.tokens[0].children.length,0);
});

test('viewer local default renders for NPCs and force-default; other player customization still wins normally',()=>{
 const f=fixture();game.user.getFlag=(_m,key)=>key==='turnIndicatorDefault'?{turnMarkerStyle:'fixer',turnMarkerSpeed:0}:undefined;
 refreshTurnMarker();assert.equal(f.ticks.size,0);assert.equal(f.tokens[0].children.length,1);
 const player={id:'other',isGM:false,character:{id:'pc'},getFlag:()=>({turnMarkerStyle:'solo',turnMarkerSpeed:1})};game.users=[player];f.tokens[0].actor={id:'pc',type:'character',testUserPermission:()=>true};f.emit('updateActor');assert.equal(f.ticks.size,1);
 f.set('turnMarkerForceDefault',true);assert.equal(f.ticks.size,0);
 game.user.getFlag=()=>undefined;f.emit('updateUser');assert.equal(f.ticks.size,1);
});

test('display dropdown has only Animated/Static; legacy Off migrates to master disabled',async()=>{
 const f=fixture();assert.deepEqual(f.configs.get('turnMarkerDisplay').choices,{animated:'Animated',static:'Static'});
 game.settings.set=async(_m,key,value)=>f.set(key,value);
 f.set('turnMarkerDisplay','off');
 // Register against a hook collector to await the asynchronous native ready handler.
 const original=Hooks.on;let ready;Hooks.on=(name,fn)=>{if(name==='ready')ready=fn;return original(name,fn)};
 registerTurnMarker();f.set('turnMarkerDisplay','off');await ready();
 assert.equal(f.values.get('turnMarkerEnabled'),false);assert.equal(f.values.get('turnMarkerDisplay'),'animated');assert.equal(f.ticks.size,0);
 f.set('turnMarkerEnabled',true);assert.equal(f.ticks.size,1);
});
