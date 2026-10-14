import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
import {consumeHazardAttack,installHazardAttackGuard} from '../dist/scripts/hazard-attacks.js';
registerHooks({resolve(specifier,context,next){
 if(specifier==='/systems/cyberpunk-red-core/modules/item/cpr-item.js')return {shortCircuit:true,url:'data:text/javascript,export default globalThis.HazardNativeItem'};
 if(specifier==='/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js')return {shortCircuit:true,url:'data:text/javascript,export const CPRAttackRoll=globalThis.HazardAttackRoll'};
 return next(specifier,context);
}});
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function setup(){
 const gm={id:'gm',active:true,isGM:true};
 globalThis.game={user:gm,users:[gm],scenes:[],combats:new Map()};
 globalThis.foundry={utils:{getProperty:get}};
 let updates=0;
 const actor={id:'body',uuid:'Scene.s.Token.body.Actor.body',isToken:true,flags:{},async update(data){updates++;this.flags['pneuma-combattools']={hazardAttack:data['flags.pneuma-combattools.hazardAttack']};return this;}};
 const token={actor,actorId:'body',parent:{id:'s'},flags:{'pneuma-scenetools':{hazardBody:'hazard'}}};
 game.scenes=[{tokens:[token]}];
 const combat={id:'c',scene:{id:'s'},active:true,started:true,round:1,flags:{},combatants:[]};game.combats.set('c',combat);
 return {actor,token,combat,updates:()=>updates};
}
test('hazard round allowance persists, blocks concurrent rolls and resets on a new round or encounter epoch',async()=>{
 const f=setup();const results=await Promise.allSettled([consumeHazardAttack(f.actor,{}),consumeHazardAttack(f.actor,{})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/already attacked/);assert.equal(f.updates(),1);
 await assert.rejects(()=>consumeHazardAttack(f.actor,{}),{code:'HAZARD_ATTACK_SPENT'});
 f.combat.round++;await consumeHazardAttack(f.actor,{});assert.equal(f.updates(),2);
 f.combat.flags={'pneuma-combattools':{evasionEpoch:'new'}};await consumeHazardAttack(f.actor,{});assert.equal(f.updates(),3);
});
test('explicit confirmation and native wrapper share one allowance for the same roll',async()=>{
 const f=setup(),roll={};await consumeHazardAttack(f.actor,roll);await consumeHazardAttack(f.actor,roll);assert.equal(f.updates(),1);
});
test('nonhazards and condition instances are unaffected; outside combat no round allowance is stored',async()=>{
 let f=setup();delete f.token.flags['pneuma-scenetools'].hazardBody;f.token.flags['pneuma-scenetools'].hazardCondition={};
 await consumeHazardAttack(f.actor,{});await consumeHazardAttack(f.actor,{});assert.equal(f.updates(),0);
 f=setup();f.combat.started=false;await consumeHazardAttack(f.actor,{});await consumeHazardAttack(f.actor,{});assert.equal(f.updates(),0);
});
test('inactive GMs and failed writes cannot proceed to native confirmation',async()=>{
 const f=setup();game.user={id:'other',isGM:true};await assert.rejects(()=>consumeHazardAttack(f.actor,{}),/active GM/);
 game.user=game.users[0];f.actor.update=async()=>undefined;await assert.rejects(()=>consumeHazardAttack(f.actor,{}),/could not be saved/);
});
test('native item confirmation enforces the limit without sheet routing and leaves damage and skill rolls alone',async()=>{
 const f=setup();installMockLibWrapper();let confirmations=0;
 globalThis.HazardAttackRoll=class{};
 globalThis.HazardNativeItem=class {constructor(){this.parent=f.actor;}confirmRoll(roll){confirmations++;return roll;}};
 await installHazardAttackGuard();const item=new HazardNativeItem();
 await item.confirmRoll(new HazardAttackRoll());await assert.rejects(()=>item.confirmRoll(new HazardAttackRoll()),/already attacked/);
 await item.confirmRoll({type:'damage'});await item.confirmRoll({type:'skill'});assert.equal(confirmations,3);assert.equal(f.updates(),1);
});
