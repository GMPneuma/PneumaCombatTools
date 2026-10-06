import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {updateTouchesPath} from '../dist/scripts/update-path.js';
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function fixture(file,extra={}) {
 const hooks={},frames=[];const ctx={console,Map,Set,Promise,updateTouchesPath,foundry:{utils:{getProperty:get}},requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame(){},Hooks:{on:(n,fn)=>(hooks[n]??=[]).push(fn),once:(n,fn)=>(hooks[n]??=[]).push(fn)},...extra};
 vm.createContext(ctx);vm.runInContext(readFileSync('dist/scripts/'+file+'.js','utf8').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,''),ctx);
 return {ctx,fire:(n,...args)=>{for(const fn of hooks[n]??[])fn(...args);},flush:()=>{for(const fn of frames.splice(0))fn();},frames};
}
test('suppression skips combat flag writes and coalesces meaningful expiry requests',async()=>{
 let scans=0;const f=fixture('suppression',{electedGM:()=>({id:'gm'}),game:{user:{id:'gm'},actors:{*[Symbol.iterator](){scans++;}},scenes:[]}});
 f.ctx.registerSuppression();for(let n=0;n<20;n++)f.fire('updateCombat',{}, {'flags.pneuma-combattools.requests':n});
 f.fire('updateCombatant',{}, {'flags.pneuma-combattools.requests':1});
 await new Promise(setImmediate);assert.equal(scans,0);
 f.fire('updateCombat',{}, {round:2});f.fire('updateCombat',{}, {turn:1});f.fire('deleteCombatant',{});f.fire('updateCombatant',{}, {initiative:12});
 await new Promise(setImmediate);assert.equal(scans,1);
});
test('QuickFix skips ordinary inventory before the actor queue and coalesces pending scans',async()=>{
 let scans=0,locks=0;const actor={items:Array.from({length:200},()=>({}))};actor.items.push({flags:{'pneuma-combattools':{quickFix:{}}}});
 const f=fixture('medical',{GMRequests:class{},allActors:()=>{scans++;return [actor];},statusAuthority:()=>true,quickFixExpired:()=>false,withActorMutation:async(_actor,run)=>{locks++;await run();}});
 await Promise.all(Array.from({length:10},()=>f.ctx.expireQuickFixes()));assert.equal(scans,1);assert.equal(locks,1);
});
test('movement updates only tokens of the affected actor, including item-owned effects',()=>{
 const drawn=[],tokens=['a','a','b'].map((id,i)=>({id:String(i),actor:{uuid:id},document:{id:String(i)}}));
 const f=fixture('movement',{drawn,game:{settings:{register(){},get:()=>true}},canvas:{tokens:{placeables:tokens}},CONST:{GRID_TYPES:{SQUARE:1}}});
 vm.runInContext('draw=token=>drawn.push(token.id);registerMovement();',f.ctx);
 f.fire('updateActiveEffect',{parent:{uuid:'unrelated'}});f.flush();assert.deepEqual(drawn,[]);
 f.fire('updateActiveEffect',{parent:{uuid:'item',parent:{uuid:'a'}}});f.fire('deleteActiveEffect',{parent:{uuid:'a'}});f.flush();assert.deepEqual(drawn,['0','1']);
});
test('next marker ignores unrelated tokens/actors/settings and batches relevant events',()=>{
 const counts={refresh:0},token={actor:{uuid:'a'},document:{uuid:'t'}};
 const f=fixture('turn-alerts',{counts,token,game:{settings:{register(){}}},document:{addEventListener(){}}});
 vm.runInContext('watchedToken=token;refreshNextTurnMarker=()=>counts.refresh++;registerTurnAlerts();',f.ctx);
 for(let n=0;n<60;n++)f.fire('refreshToken',{document:{uuid:'other'}});
 f.fire('updateActor',{uuid:'other'});f.fire('updateSetting',{key:'other.setting'});f.flush();assert.equal(counts.refresh,0);
 for(let n=0;n<60;n++)f.fire('refreshToken',token);
 f.fire('updateToken',token.document);f.fire('updateActor',token.actor);assert.equal(f.frames.length,1);f.flush();assert.equal(counts.refresh,1);
});
