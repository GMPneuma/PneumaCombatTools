import assert from 'node:assert/strict';
import {test} from 'node:test';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
import {GMRequests} from '../dist/scripts/gm-request.js';

// CPR's automatic playback reads the core setting unless explicitly overridden.
registerHooks({resolve(specifier,context,next){
 if(specifier==='/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js')return {shortCircuit:true,url:'data:text/javascript,'+encodeURIComponent('export class CPRDamageRoll {constructor(){Object.assign(this,globalThis.mockDamageRoll());this.rollCardExtraArgs={ablationValue:2};}}')};
 if(specifier==='/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js')return {shortCircuit:true,url:'data:text/javascript,'+encodeURIComponent(`export default {async handle3dDice(roll,mode){
  mode ??= game.settings.get('core','rollMode');
  const whisper=mode==='selfroll'?[game.user.id]:mode==='gmroll'?['gm']:mode==='roll'?['gm','owner','other']:null;
  await game.dice3d.showForRoll(roll,game.user,true,whisper,mode==='blindroll');
 }};`)};
 return next(specifier,context);
}});
globalThis.FormApplication=class{};globalThis.Hooks={on(){},once(){}};
const native=await import('../dist/scripts/native-combat.js');
const {nativeQuickhackRoll,criticalD10,quickhackDamage}=await import('../dist/scripts/quickhack/rolls.js');
const {checkedLuck}=await import('../dist/scripts/evasion-rules.js');
const get=(o,p)=>p.split('.').reduce((value,key)=>value?.[key],o);
function setup(coreMode='roll'){
 let serial=0,evaluations=0;const calls=[],cards=[];
 const gm={id:'gm',isGM:true,active:true},owner={id:'owner',active:true},other={id:'other',active:true};
 const users=new Map([gm,owner,other].map(user=>[user.id,user]));
 globalThis.game={user:owner,users,system:{id:'cyberpunk-red-core'},modules:new Map([['dice-so-nice',{active:true}]]),
  settings:{get:(_scope,key)=>key==='rollMode'?coreMode:key==='quickhackEnabled'?true:undefined},
  dice3d:{async showForRoll(roll,user,sync,whisper,blind){calls.push({total:roll.total,user:user.id,whisper,blind});}},messages:new Map()};
 installMockLibWrapper();
 globalThis.foundry={utils:{getProperty:get,randomID:()=>String(++serial),deepClone:structuredClone}};
 globalThis.ChatMessage={getSpeaker:()=>({}),getWhisperRecipients:()=>[gm],create:async data=>{const message={...data,id:'message'};cards.push(message);return message;}};
 globalThis.renderTemplate=async()=>'<div class="rollcard"><button data-action="applyDamage"></button></div>';
 globalThis.Roll=class{constructor(total=4){this.total=total;}async evaluate(){return this;}toJSON(){return {total:this.total};}static fromJSON(json){return Object.assign(new this(),JSON.parse(json));}};
 globalThis.DOMParser=class{parseFromString(){return {querySelector:()=>({getAttribute:key=>({'data-total-damage':'14','data-damage-location':'body','data-damage-lethal':'true'}[key]??'')})};}};
 const actor={isOwner:true,uuid:'Actor.owner',items:[],system:{stats:{luck:{value:5}}},testUserPermission:()=>true};
 const item={id:'skill',type:'skill',name:'Brawling',system:{stat:'dex'},
  createRoll(){return {luck:0,resultTotal:14,rollCard:'native',mods:[],handleRollDialog:async()=>true,wasCritical:()=>true,
   async roll(){evaluations++;const {Dice}=await native.nativeAPI();this._roll=new Roll(10);await Dice.handle3dDice(this._roll);this._critRoll=new Roll(4);await Dice.handle3dDice(this._critRoll);}};},confirmRoll:async roll=>roll};
 actor.items=[item];actor.items.get=id=>actor.items.find(item=>item.id===id);
 globalThis.fromUuid=async id=>id.startsWith('Actor.')?actor:{actor};
 globalThis.mockDamageRoll=()=>item.createRoll();
 return {actor,item,calls,cards,users,evaluations:()=>evaluations};
}
function isolated(file,extra={}){
 const context={console,Map,Set,Promise,setTimeout,clearTimeout,structuredClone,FormApplication,Hooks,game,foundry,fromUuid,Roll,DOMParser,
  ...native,GMRequests,checkedLuck,requireCombatSocket(){},spendBonusLuck:native.spendBonusLuck,damageSixes:()=>0,ui:{chat:{updateMessage(){}}},...extra};
 vm.createContext(context);
 const source=readFileSync(new URL('../dist/scripts/'+file+'.js',import.meta.url),'utf8')
  .replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
 vm.runInContext(source,context);return context;
}

test('visible QuickHack/ejection rolls ignore core blind/self modes and use the exact private card audience',async()=>{
 for(const mode of ['roll','blindroll','selfroll']){
  const f=setup(mode),audience={whisper:['gm','owner'],blind:false};
  const result=await nativeQuickhackRoll(f.actor,f.item,'Eject Netrunner',audience,()=>true,undefined,false);
  assert.equal(result.total,14);assert.equal(f.evaluations(),1);
  assert.deepEqual(f.calls,[{total:10,user:'owner',whisper:['gm','owner'],blind:false},{total:4,user:'owner',whisper:['gm','owner'],blind:false}]);
 }
});

test('hidden NPC QuickHack rolls and Jack-In WILL defense remain animation-free',async()=>{
 const f=setup();await nativeQuickhackRoll(f.actor,f.item,'Hidden NPC Interface',{whisper:['gm'],blind:true},()=>true,undefined,false);
 assert.equal(f.evaluations(),1);assert.equal(f.calls.length,0);
 await criticalD10();assert.equal(f.calls.length,0);
});

test('player QuickHack damage animates publicly while automatic and NPC damage stay hidden',async()=>{
 for(const [player,automatic] of [[true,false],[false,false],[true,true]]){
  const f=setup('blindroll');f.actor.hasPlayerOwner=player;
  await quickhackDamage(f.actor,undefined,{actor:{id:'target'}},'Synapse Burnout','2d6',automatic);
  assert.equal(f.evaluations(),1);assert.equal(f.cards.length,1);
  assert.equal(f.calls.length,player&&!automatic?2:0);
  if(player&&!automatic){assert(f.calls.every(call=>call.whisper===null&&!call.blind));assert.equal(f.cards[0].blind,false);}
  else assert.equal(f.cards[0].blind,true);
 }
});

test('deferred QuickHack rolls wait for final audience and cancelled rolls never animate',async()=>{
 const f=setup('blindroll');
 const result=await nativeQuickhackRoll(f.actor,f.item,'Jack-In',{whisper:[],blind:false},()=>true,undefined,false,false,false);
 assert.equal(f.calls.length,0);
 await native.showSavedDice(result.dice,'roll',result.roller,{whisper:['owner'],blind:false});
 assert.equal(f.calls.length,2);assert(f.calls.every(call=>call.whisper.join()==='owner'&&!call.blind));
 f.item.createRoll=()=>({handleRollDialog:async()=>false});
 assert.equal(await nativeQuickhackRoll(f.actor,f.item,'Cancelled',{whisper:[],blind:false}),null);
 assert.equal(f.calls.length,2);
});

test('damage commit retry replays exact saved main/critical dice once without reevaluation or audience drift',async()=>{
 const f=setup();game.user=f.users.get('gm');
 const message={whisper:['owner'],blind:false};game.messages.set('damage-card',message);
 const context=isolated('damage-flow');let fail=true,commits=0;
 const send=async action=>{if(action==='damageCommit'){commits++;if(fail)throw Error('lost acknowledgment');}};
 const data={attacker:'Token.owner',weaponId:'skill',attackMode:'attack',title:'Damage',rollMode:'selfroll'};
 await assert.rejects(context.rollDamage('damage-card',data,send,true),/lost acknowledgment/);
 assert.equal(f.evaluations(),1);assert.equal(f.calls.length,0);
 fail=false;message.whisper=['other'];game.settings.get=()=> 'roll';
 await context.rollDamage('damage-card',data,send,true);
 assert.equal(commits,2);assert.equal(f.evaluations(),1);
 assert.deepEqual(f.calls.map(call=>[call.total,call.whisper]),[[10,['owner']],[4,['owner']]]);
});

test('Group Check commit retry preserves saved dice and original audience, without another skill roll or LUCK payment',async()=>{
 const f=setup();const context=isolated('manual-rolls',{M:'pneuma-combattools'});let fail=true,commits=0;
 context.send=async(_id,request)=>{if(request.action==='commit'){commits++;if(fail)throw Error('lost acknowledgment');}};
 const message={id:'group-card',whisper:['gm','owner'],blind:false};
 const data={rollMode:'gmroll',skill:'Brawling',rows:[{user:'owner',actor:f.actor.uuid}]};
 await assert.rejects(context.rollGroup(message,data,'owner',true),/lost acknowledgment/);
 assert.equal(f.evaluations(),1);assert.equal(f.calls.length,0);
 fail=false;message.whisper=['other'];
 await context.rollGroup(message,data,'owner',true);
 assert.equal(commits,2);assert.equal(f.evaluations(),1);
 assert.deepEqual(f.calls.map(call=>[call.total,call.whisper]),[[10,['gm','owner']],[4,['gm','owner']]]);
 assert.equal(f.actor.system.stats.luck.value,5);
});

test('AoE Evasion and suppression Concentration use originating card visibility, not responder core roll mode',async()=>{
 for(const kind of ['shell','suppression']){
  const f=setup('roll');f.item.name=kind==='shell'?'Evasion':'Concentration';
  const context=isolated('aoe/workflow',{MODULE:'pneuma-combattools',findNativeItem:()=>f.item,evasionBlocked:()=>undefined});
  context.send=async()=>{};
  const message={id:'area-card',whisper:['gm','owner'],blind:true};
  await context.respond(message,{kind,settings:{},exchange:{rollMode:'blindroll'}},{uuid:'Token.owner'},false,true);
  assert.equal(f.evaluations(),1);
  assert.deepEqual(f.calls.map(call=>[call.total,call.whisper,call.blind]),[[10,['gm'],true],[4,['gm'],true]]);
 }
});
