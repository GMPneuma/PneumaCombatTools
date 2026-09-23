import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
function fixture(file, extra={}) {
 const hooks={},frames=[];const ctx={console,Map,Set,requestAnimationFrame:fn=>frames.push(fn),Hooks:{on:(n,f)=>(hooks[n]??=[]).push(f),once(){}},...extra};vm.createContext(ctx);
 let code=readFileSync(file,'utf8').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
 vm.runInContext(code,ctx);
 return {ctx,fire:(n,...args)=>{for(const fn of hooks[n]??[])fn(...args);},flush:()=>{while(frames.length)frames.shift()();},frames};
}
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
test('QuickHack filters HUD events, batches updates, and refreshes only changed card eligibility',()=>{
 let on=true,settingsChange,hudRenders=0;const updated=[];
 const source={document:{uuid:'s'}},target={document:{uuid:'t'}};const view={source,target,self:false};const states={a:true,b:true};
 const f=fixture('dist/scripts/quickhack/integration.js',{
 MODULE:'m',enabled:()=>on,registerQuickhackSheet(){},registerQuickhackSettings:fn=>settingsChange=fn,
 clearForceOut(){},ActorSheet:class{},canvas:{scene:{id:'scene'},tokens:{hud:{rendered:true,render:()=>hudRenders++,clear(){}}}},
 game:{user:{isGM:false},ready:false},ui:{windows:{},chat:{render:()=>assert.fail('Whole chat refresh'),updateMessage:m=>updated.push(m.id)}},
 foundry:{utils:{getProperty:get,flattenObject:o=>o}},resultFlag:m=>m.result,
 resultConnectionValid:(_a,r)=>on&&states[r.connectionId],context:()=>view
 });
 f.ctx.registerQuickhack(f.ctx.context);
 const a={id:'a',visible:true,result:{type:'jackIn',sourceActorUuid:'as',sourceTokenUuid:'s',targetTokenUuid:'t'}},b={...a,id:'b',result:{...a.result,sourceTokenUuid:'other'}};
 f.fire('createChatMessage',a);f.fire('createChatMessage',b);f.flush();hudRenders=0;
 f.fire('updateToken',{uuid:'unrelated'},{x:1});f.fire('updateToken',source.document,{name:'new'});f.flush();assert.equal(hudRenders,0);
 f.fire('updateToken',source.document,{x:1});f.fire('updateToken',target.document,{elevation:2});f.fire('updateWall',{parent:{id:'scene'}});f.flush();assert.equal(hudRenders,1);
 view.self=true;f.fire('updateWall',{parent:{id:'scene'}});f.flush();assert.equal(hudRenders,1);view.self=false;
 f.fire('updateCombat',{}, {round:3});f.flush();assert.deepEqual(updated,[]);
 states.a=false;f.fire('updateCombat',{}, {'flags.m.quickhackConnections.a.state':'ejected'});f.fire('updateCombat',{}, {'flags.m.quickhackConnections.a.state':'ejected'});f.flush();assert.deepEqual(updated,['a']);
 on=false;const previous=hudRenders;f.fire('updateCombat',{}, {round:1});f.fire('updateToken',source.document,{x:5});f.flush();assert.equal(hudRenders,previous);
 settingsChange();f.flush();assert.deepEqual(updated,['a','a','b']);
});
test('movement batches repeated token refreshes and filters combat flags; reordering checks turn identities',()=>{
 const draws=[];const tokens=['a','b'].map(id=>({id,document:{id},visible:false}));
 const scene={id:'scene'},combat={id:'c',started:true,scene,round:1,turn:0,turns:tokens.map(t=>({id:t.id,tokenId:t.id}))};
 const f=fixture('dist/scripts/movement.js',{barCombat:()=>combat,game:{combat,settings:{register(){},get:()=>true}},canvas:{scene,tokens:{placeables:tokens}},CONST:{GRID_TYPES:{SQUARE:1}},recordStep(){},draws});
 vm.runInContext('draw = token => draws.push(token.id);registerMovement();',f.ctx);
 f.fire('canvasReady');f.flush();assert.deepEqual(draws,['a','b']);draws.length=0;
 f.fire('updateCombat',combat,{flags:{empRequests:{}}});f.flush();assert.deepEqual(draws,[]);
 f.fire('refreshToken',tokens[0]);f.fire('updateToken',{object:tokens[0]});f.fire('controlToken',tokens[0]);f.flush();assert.deepEqual(draws,['a']);draws.length=0;
 combat.turn=1;f.fire('updateCombat',combat,{turn:1});f.flush();assert.deepEqual(draws,['b']);draws.length=0;
 combat.turns.reverse();f.fire('updateCombatant',{parent:combat,token:{object:tokens[0]}},{initiative:20});f.flush();assert.deepEqual(draws,['a']);draws.length=0;
 f.fire('refreshToken',tokens[1]);f.fire('canvasTearDown');f.flush();assert.deepEqual(draws,[]);
});
