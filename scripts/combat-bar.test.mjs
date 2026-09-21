import assert from 'node:assert/strict';
import {test} from 'node:test';
import {barCombat,barEntries,canEndTurn,movementMode,movementBlocked,registerBarMovement} from '../dist/scripts/combat-bar-state.js';

const getProperty=(object,key)=>key.split('.').reduce((o,k)=>o?.[k],object);
const collection=items=>Object.assign(items,{get(id){return this.find(item=>item.id===id);}});
test('movement warnings have a shared five-second cooldown per reason while every move remains blocked',()=>{
 const f=fixture();registerBarMovement(()=>{});f.settings.combatBarMovement='combat';f.combat.combatant=undefined;
 const original=Date.now;let now=10000;Date.now=()=>now;
 try{
  const block=doc=>f.hooks.preUpdateToken[0](doc,{x:99},{},'p');
  assert.equal(block(f.token.document),false);assert.equal(block({...f.token.document,uuid:'other'}),false);assert.equal(f.warnings.length,1);
  now+=4999;assert.equal(block(f.token.document),false);assert.equal(f.warnings.length,1);
  now++;assert.equal(block(f.token.document),false);assert.equal(f.warnings.length,2);
  f.settings.combatBarMovement='none';assert.equal(block(f.token.document),false);assert.match(f.warnings.at(-1),/paused/);
  assert.equal(block(f.token.document),false);assert.equal(f.warnings.length,3);
 }finally{Date.now=original;}
});
function fixture(){
 const gm={id:'gm',active:true,isGM:true},player={id:'p',active:true,isGM:false},offline={id:'off',active:false,isGM:false};
 const scene={id:'scene'};
 const actor={id:'a',name:'Actor',img:'actor-art.webp',testUserPermission:u=>u.id==='p'};
 const token={id:'t',name:'Token Name',actor,isOwner:true,isVisible:true,isPreview:false,controlled:false};
 token.document={id:'t',uuid:'Scene.scene.Token.t',parent:scene,hidden:false,_source:{x:10,y:20,elevation:0},object:token};
 const participant={id:'c1',name:'Combat Name',actor,token:token.document,sceneId:'scene',visible:true,hidden:false,isDefeated:false,players:[player]};
 const combat={id:'fight',active:true,started:true,scene,round:1,turn:0,turns:[participant],combatant:participant,flags:{},canUserModify:()=>true};
 const settings={combatBar:true,combatBarMovement:'default',combatBarDefaultMovement:'default'};
 const hooks={},configs={},warnings=[];
 globalThis.canvas={ready:true,scene,tokens:{placeables:[token]}};
 const writes=[];
 globalThis.game={user:player,users:collection([gm,player,offline]),combats:collection([combat]),settings:{get:(_m,k)=>settings[k],register:(_m,k,v)=>configs[k]=v,set:async(_m,k,v)=>{writes.push([k,v]);settings[k]=v;}}};
 globalThis.foundry={utils:{getProperty}};
 globalThis.Hooks={on:(h,fn)=>(hooks[h]??=[]).push(fn)};
 globalThis.ui={notifications:{warn:message=>warnings.push(message)}};
 return {gm,player,offline,scene,actor,token,participant,combat,settings,hooks,configs,warnings,writes};
}

test('combat rows use actor portraits and exactly the native tracker visibility',()=>{
 const f=fixture();assert.equal(barEntries()[0].img,'actor-art.webp');assert.equal(barEntries()[0].name,'Combat Name');
 f.participant.hidden=true;f.participant.visible=false;assert.deepEqual(barEntries(),[]);
 game.user=f.gm;f.participant.visible=true;assert.equal(barEntries()[0].hidden,true);
 game.user=f.player;f.participant.hidden=false;f.participant.visible=false;assert.deepEqual(barEntries(),[]);
});
test('hidden or unseen scene tokens remain listed when native tracker permits them',()=>{
 const f=fixture();f.token.document.hidden=true;assert.equal(barEntries().length,1);
 f.token.document.hidden=false;f.token.isVisible=false;assert.equal(barEntries().length,1);
 game.user=f.gm;assert.equal(barEntries().length,1);
 game.user=f.player;f.participant.token=null;assert.equal(barEntries().length,1);assert.equal(barEntries()[0].token,undefined);
 f.participant.actor=null;assert.equal(barEntries()[0].img,'icons/svg/mystery-man.svg');
});
test('players see visible combatants owned by others, in native turn order',()=>{
 const f=fixture();const second={...f.participant,id:'c2',name:'Enemy',players:[]};
 f.token.isOwner=false;f.combat.turns=[second,f.participant];f.combat.combatant=second;
 assert.deepEqual(barEntries().map(e=>[e.name,e.active]),[['Enemy',true],['Combat Name',false]]);
});
test('outside combat GM sees connected player-owned scene tokens; players see own tokens',()=>{
 const f=fixture();f.combat.started=false;
 assert.equal(barEntries()[0].name,'Token Name');game.user=f.gm;assert.equal(barEntries().length,1);
 f.player.active=false;assert.equal(barEntries().length,0);
 game.user=f.player;assert.equal(barEntries().length,1);
 f.token.isOwner=false;assert.equal(barEntries().length,0);
 f.token.isOwner=true;f.token.document.hidden=true;assert.equal(barEntries().length,0);
});
test('selected sidebar encounter cannot redirect the bar or movement of another scene',()=>{
 const f=fixture();game.combat={id:'preview'};
 assert.equal(barCombat(),f.combat);assert.equal(barCombat('elsewhere'),undefined);
 f.settings.combatBarMovement='none';
 const offscene={...f.token.document,parent:{id:'elsewhere'}};
 assert.equal(movementBlocked(offscene,{x:50},'p'),true);
 assert.equal(movementBlocked(f.token.document,{x:50},'p'),true);
 f.settings.combatBarMovement='free';assert.equal(movementBlocked(offscene,{x:50},'p'),false);
});
test('End Turn shows for the current actor owner even without Combat document update permission',()=>{
 const f=fixture();assert.equal(canEndTurn(f.combat),true);
 f.combat.canUserModify=()=>false;
 assert.equal(canEndTurn(f.combat),true);
 f.combat.turns=[f.participant,f.participant,f.participant];f.combat.turn=1;
 assert.equal(canEndTurn(f.combat),true);
 f.actor.testUserPermission=()=>false;assert.equal(canEndTurn(f.combat),false);
 game.user=f.gm;assert.equal(canEndTurn(f.combat),true);
 f.combat.started=false;assert.equal(canEndTurn(f.combat),false);
});
test('No Movement blocks position and elevation, while allowing GM and nonmovement edits',()=>{
 const f=fixture();f.settings.combatBarMovement='none';
 for(const change of [{x:0},{y:0},{elevation:5}]){assert.equal(movementBlocked(f.token.document,change,'p'),true);assert.equal(movementBlocked(f.token.document,change,'gm'),false);}
 for(const change of [{x:10,y:20,elevation:0},{rotation:90},{hidden:true}])assert.equal(movementBlocked(f.token.document,change,'p'),false);
 f.combat.started=false;f.settings.combatBarMovement='none';assert.equal(movementBlocked(f.token.document,{x:0},'p'),true);
});
test('Combat Move allows only the current token, not another token of the same actor or a noncombatant',()=>{
 const f=fixture();f.settings.combatBarMovement='combat';
 assert.equal(movementBlocked(f.token.document,{x:0},'p'),false);
 const twin={...f.token.document,uuid:'Scene.scene.Token.twin'};
 assert.equal(movementBlocked(twin,{x:0},'p'),true);
 assert.equal(movementBlocked({...twin,parent:{id:'another-scene'}},{x:0},'p'),true);
 f.combat.combatant=undefined;assert.equal(movementBlocked(f.token.document,{x:0},'p'),true);
 f.combat.started=false;assert.equal(movementBlocked(twin,{x:0},'p'),false);
});
test('Default and Free-Move leave native movement unchanged; disabling bar does not lift a lock',()=>{
 const f=fixture();f.combat.combatant=undefined;
 for(const mode of ['default','free']){f.settings.combatBarMovement=mode;assert.equal(movementBlocked(f.token.document,{x:0},'p'),false);}
 f.settings.combatBar=false;f.settings.combatBarMovement='none';assert.equal(movementBlocked(f.token.document,{x:0},'p'),true);
});
test('successful combat start applies GM default once; manual modes survive settings changes and combat end',()=>{
 const f=fixture();game.user=f.gm;registerBarMovement(()=>{});
 assert.equal(f.configs.combatBarDefaultMovement.scope,'world');assert.equal(f.configs.combatBarDefaultMovement.default,'default');
 f.settings.combatBarDefaultMovement='combat';f.combat.started=false;
 const changes={round:1,turn:0},options={};f.hooks.preUpdateCombat[0](f.combat,changes,options);assert.equal(options.pneumaBarCombatStarted,true);assert.equal(f.writes.length,0,'Uncommitted start does not change movement');
 f.combat.started=true;game.user=f.player;f.hooks.updateCombat[0](f.combat,changes,options);assert.equal(f.writes.length,0,'Player client never writes world setting');
 game.user=f.gm;f.hooks.updateCombat[0](f.combat,changes,options);assert.deepEqual(f.writes,[['combatBarMovement','combat']]);
 f.settings.combatBarDefaultMovement='free';assert.equal(movementMode(),'combat');const turn={turn:1},turnOptions={};f.hooks.preUpdateCombat[0](f.combat,turn,turnOptions);f.hooks.updateCombat[0](f.combat,turn,turnOptions);assert.equal(f.writes.length,1);
 f.settings.combatBarMovement='none';assert.equal(f.hooks.preUpdateToken[0](f.token.document,{x:0},{},'p'),false);assert.match(f.warnings[0],/paused/);
 f.combat.started=false;assert.equal(movementMode(),'none');assert.equal(movementBlocked(f.token.document,{x:0},'p'),true);
 f.settings.combatBarMovement='combat';assert.equal(movementMode(),'default');
});
