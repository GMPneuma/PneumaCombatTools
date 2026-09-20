import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isSelfCTH,hasSpeedware,selfInitiativeControl,rerollSelfInitiative,registerSelfCTH} from '../dist/scripts/self-cth.js';
function fixture(){
 globalThis.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
 const item={type:'cyberware',name:'Sandevistan',system:{isInstalledInActor:true},flags:{}};
 const token={isOwner:true,document:{uuid:'Scene.s.Token.t'},actor:{items:[item]}};
 const combatant={id:'ct',initiative:12,token:token.document};const calls=[];
 const combat={uuid:'Combat.c',started:true,combatants:[combatant],rollInitiative:async(...args)=>{calls.push(args);}};
 globalThis.game={user:{isGM:false},combat,combats:new Map([['c',combat]]),settings:{get:()=>true}};
 return {item,token,combatant,combat,calls};
}
test('player-owned tokens are always self; GM can target another token while acting as one',()=>{
 const f=fixture(),other={isOwner:true};assert(isSelfCTH(f.token,other));assert(!isSelfCTH({isOwner:false},f.token));
 game.user.isGM=true;assert(isSelfCTH(f.token,f.token));assert(isSelfCTH(f.token,undefined));assert(!isSelfCTH(other,f.token));
});
test('speedware requires installed, non-EMP cyberware; native source supports renamed items',()=>{
 const f=fixture();assert(hasSpeedware(f.token.actor));f.item.system.isInstalledInActor=false;assert(!hasSpeedware(f.token.actor));
 f.item.system.isInstalledInActor=true;f.item.name='Translated';assert(!hasSpeedware(f.token.actor));f.item._stats={compendiumSource:'Compendium.cpr.Item.nSdoCKRscSOeaZUH'};assert(hasSpeedware(f.token.actor));
 f.item.flags={'pneuma-combattools':{empCombats:['c']}};assert(!hasSpeedware(f.token.actor));
});
test('control visibility, combat prerequisites, setting and permission are rechecked on click',async()=>{
 const f=fixture();assert.equal(selfInitiativeControl(f.token).show,true);assert.equal(selfInitiativeControl(f.token).disabled,false);
 f.combatant.initiative=null;assert.equal(selfInitiativeControl(f.token).disabled,true);await assert.rejects(rerollSelfInitiative(f.token),/Start combat/);
 f.combatant.initiative=12;game.settings.get=()=>false;assert.equal(selfInitiativeControl(f.token).show,false);await assert.rejects(rerollSelfInitiative(f.token),/requires/);
 game.settings.get=()=>true;f.token.isOwner=false;await assert.rejects(rerollSelfInitiative(f.token),/ownership/);
});
test('native reroll targets just this combatant, preserves turn and prevents duplicate pending rolls',async()=>{
 const f=fixture();let release;f.combat.rollInitiative=async(...args)=>{f.calls.push(args);await new Promise(resolve=>release=resolve);};
 const first=rerollSelfInitiative(f.token);await rerollSelfInitiative(f.token);assert.deepEqual(f.calls,[[['ct'],{updateTurn:true}]]);release();await first;
 f.combat.rollInitiative=async()=>{throw Error('native failure');};await assert.rejects(rerollSelfInitiative(f.token),/native failure/);
 f.combat.rollInitiative=async(...args)=>f.calls.push(args);await rerollSelfInitiative(f.token);assert.equal(f.calls.length,2);
});
test('Pneuma HomeBrew is a default-off world setting',()=>{
 fixture();globalThis.Hooks={on(){}};let settings;game.settings.register=(_module,key,value)=>{settings={key,...value};};registerSelfCTH();assert.equal(settings.key,'pneumaHomebrew');assert.equal(settings.name,'Pneuma HomeBrew');assert.equal(settings.scope,'world');assert.equal(settings.default,false);
});
