import assert from 'node:assert/strict';
import {test} from 'node:test';
import {effectLifetime,effectExpired,effectEndsWithCombat,quickFixExpired,suppressionExpired} from '../dist/scripts/effect-lifetime.js';
import {masterStatuses} from '../dist/scripts/status-catalog.js';
globalThis.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
function fixture(){
 const actor={uuid:'Actor.patient'},combat={id:'c',started:false,combatants:[{actor}]};
 const combats=new Map();combats[Symbol.iterator]=function(){return this.values();};
 globalThis.game={time:{worldTime:100},combats};
 const effect=(name,statuses=[],extra={})=>({name,statuses:new Set(statuses),parent:actor,...extra});
 return {actor,combat,effect};
}
test('persistent addiction, stabilization and death beat misleading duration and combat links',()=>{
 const f=fixture();
 for(const [name,ids]of [['Addiction',['speedheal']],['Needs Stabilization',['pneuma-needs-stabilization']],['Dead',['dead']]]){
  const e=f.effect(name,ids,{duration:{seconds:1,startTime:0},flags:{'pneuma-combattools':{endWithCombat:'c'}}});
  assert.equal(effectLifetime(e).kind,'persistent');assert(effectLifetime(e).protected);assert.equal(effectExpired(e),false);assert.equal(effectEndsWithCombat(e,f.actor,f.combat),false);
 }
});
test('Prone clears every participant combat; Speed Heal ignores world time and observes explicit combat links',()=>{
 const f=fixture(),prone=f.effect('Prone',['prone'],{flags:{'pneuma-combattools':{endWithCombat:'older'}}});
 assert(effectEndsWithCombat(prone,f.actor,f.combat));
 const speed=f.effect('Speed Heal',['speedheal'],{duration:{seconds:1,startTime:0},flags:{'pneuma-combattools':{endWithCombat:'other'}}});
 assert.equal(effectExpired(speed),false);assert.equal(effectEndsWithCombat(speed,f.actor,f.combat),false);
 delete speed.flags;assert(effectEndsWithCombat(speed,f.actor,f.combat));
 game.combats.set('other',{id:'other',started:true,combatants:[{actor:f.actor}]});assert.equal(effectEndsWithCombat(prone,f.actor,f.combat),false);
});
test('native durations expire at their own turn and do not follow a different combat; untracked effects stay',()=>{
 const f=fixture(),c={id:'c',started:true,round:1,turn:0,turns:[{},{}],combatants:[]};game.combats.set(c.id,c);
 const timed=f.effect('Timed',[],{duration:{combat:'c',rounds:0,turns:1,startRound:1,startTurn:0,startTime:0}});
 assert.equal(effectExpired(timed),false);c.turn=1;assert(effectExpired(timed));
 assert.equal(effectEndsWithCombat(timed,f.actor,{id:'other',combatants:[{actor:f.actor}]}),false);
 assert.equal(effectEndsWithCombat(f.effect('Custom'),f.actor,f.combat),false);
 const injury=masterStatuses.find(s=>s.binding?.kind==='injury');assert.equal(effectEndsWithCombat(f.effect(injury.name,[injury.id]),f.actor,f.combat),false);
 assert.equal(effectLifetime(f.effect('Disable marker',[],{flags:{'pneuma-combattools':{disableRequest:'request'}}})).kind,'managed');
});

test('all On Fire severities and legacy fire clear at participant combat end, retaining timers and other-combat guards',()=>{
 const f=fixture();
 for(const status of masterStatuses.filter(s=>s.name.startsWith('On Fire ('))){
  const fire=f.effect('Renamed fire',[status.id],{flags:{'pneuma-combattools':{endWithCombat:'old'}}});
  assert.equal(effectLifetime(fire).kind,'combat');assert(effectEndsWithCombat(fire,f.actor,f.combat));
  assert.equal(effectEndsWithCombat(fire,f.actor,{id:'unrelated',combatants:[]}),false);
  assert(effectEndsWithCombat(f.effect(status.name),f.actor,f.combat));
 }
 const legacy=f.effect('Old ignition',[],{flags:{'pneuma-combattools':{instantLifetime:{kind:'fire'}}}});
 assert(effectEndsWithCombat(legacy,f.actor,f.combat));
 const timed=f.effect('On Fire (Mild)',[],{duration:{seconds:1,startTime:0}});
 assert(effectExpired(timed));assert(effectEndsWithCombat(timed,f.actor,f.combat));
 game.combats.set('linked',{id:'linked',started:true,combatants:[]});
 assert.equal(effectEndsWithCombat(f.effect('On Fire (Mild)',[],{flags:{'pneuma-combattools':{endWithCombat:'linked'}}}),f.actor,f.combat),false);
 game.combats.set('other',{id:'other',started:true,combatants:[{actor:f.actor}]});
 assert.equal(effectEndsWithCombat(legacy,f.actor,f.combat),false);
});
test('QuickFix restoration respects its saved combat, next patient combat and existing 24-hour fallback',()=>{
 const f=fixture();assert.equal(quickFixExpired({combat:'other',expires:101},f.actor,f.combat),false);
 assert(quickFixExpired({combat:'c',expires:101},f.actor,f.combat));assert(quickFixExpired({combat:null,expires:101},f.actor,f.combat));
 assert.equal(quickFixExpired({combat:null,expires:101},f.actor,{id:'unrelated',combatants:[]}),false);assert(quickFixExpired({combat:'other',expires:100},f.actor));
});
test('suppression expires after the next target turn, on combat end or participant removal',()=>{
 fixture();const c={id:'c',started:true,round:3,turn:0,turns:[{id:'target'},{id:'other'}]};game.combats.set(c.id,c);
 const expiry={combat:'c',combatant:'target',round:3};assert.equal(suppressionExpired(expiry),false);c.turn=1;assert(suppressionExpired(expiry));
 c.turn=0;c.turns.shift();assert(suppressionExpired(expiry));c.started=false;assert(suppressionExpired(expiry));
});
