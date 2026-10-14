import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s==='/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js')return {shortCircuit:true,url:'data:text/javascript,export default {handle3dDice:async()=>{}}'};return next(s,c);}});
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSceneEffect,resolveSceneEffect,resolveSceneAvoidance,getSceneAvoidanceResult,rollSceneAvoidance,sceneEffectContent} from '../dist/scripts/scene-effects.js';
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function setup(){
 let rolls=0,applied=0,seq=0;const messages=new Map();messages.find=fn=>[...messages.values()].find(fn);
 const gm={id:'gm',isGM:true,active:true},provider={apply:async()=>{applied++;return 'Condition spawned.';}};
 globalThis.game={user:gm,users:[gm],messages,modules:new Map([['provider',{active:true,api:{sceneEffects:provider}}]]),settings:{get:()=> 'gmroll'}};
 globalThis.foundry={utils:{getProperty:get,deepClone:structuredClone}};
 globalThis.fromUuid=async uuid=>({uuid,documentName:'Token',name:'<Target>',actor:{}});
 globalThis.ChatMessage={applyRollMode:(data,mode)=>{data.mode=mode;},create:async data=>{const message={...structuredClone(data),id:'m'+ ++seq,async update(changes){this.content=changes.content;this.flags['pneuma-combattools'].sceneEffect=structuredClone(changes['flags.pneuma-combattools.sceneEffect']);return this;}};messages.set(message.id,message);return message;}};
 globalThis.Roll=class {static validate(){return true;}async evaluate(){rolls++;this.total=7;return this;}async render(){return '<div class="dice-roll">7</div>';}};
 const req={provider:'provider',group:'activation:0',source:'source-one',index:0,target:'Token.one',title:'<Hazard>',label:'Damage',formula:'2d6'};
 const state=id=>messages.get(id).flags['pneuma-combattools'].sceneEffect;
 return {req,state,provider,rolls:()=>rolls,applied:()=>applied};
}
test('area effects share one persisted roll, append confirmed targets and apply each only once',async()=>{
 const f=setup(),id=await createSceneEffect(f.req);
 assert.equal(await createSceneEffect(f.req),id);assert.equal(f.state(id).rows.length,1);assert.equal(game.messages.get(id).mode,'gmroll');
 await resolveSceneEffect(id,'roll',0,f.state(id).revision);assert.equal(f.rolls(),1);
 await createSceneEffect({...f.req,source:'source-two',target:'Token.two'});assert.equal(f.state(id).rows.length,2);assert.equal(f.state(id).amount,7);
 const rev=f.state(id).revision;
 await resolveSceneEffect(id,'apply',0,rev);await assert.rejects(()=>resolveSceneEffect(id,'apply',0,rev),/changed/);
 await resolveSceneEffect(id,'apply',0,f.state(id).revision);await resolveSceneEffect(id,'apply',1,f.state(id).revision);
 assert.equal(f.applied(),2);assert.equal(f.rolls(),1);assert.match(sceneEffectContent(f.state(id)),/data-state="resolved"/);assert.match(sceneEffectContent(f.state(id)),/&lt;Hazard&gt;/);
});
test('condition results need no damage roll; failed applications enter review and never replay',async()=>{
 const f=setup(),id=await createSceneEffect({...f.req,formula:'',label:'Spawn condition'});
 f.provider.apply=async()=>{throw Error('partial creation');};
 await resolveSceneEffect(id,'apply',0,0);assert.equal(f.state(id).rows[0].state,'review');assert.equal(f.rolls(),0);
 f.provider.apply=async()=>{throw Error('must not retry');};await resolveSceneEffect(id,'apply',0,f.state(id).revision);assert.equal(f.state(id).rows[0].result,'partial creation');
});
test('players cannot create or apply cards and unrolled damage cannot apply',async()=>{
 const f=setup(),id=await createSceneEffect(f.req);await resolveSceneEffect(id,'apply',0,0);assert.equal(f.applied(),0);
 game.user={id:'player',isGM:false};await assert.rejects(()=>createSceneEffect(f.req),/active GM/);await assert.rejects(()=>resolveSceneEffect(id,'roll',0,0),/active GM/);
});
test('completed condition spawns publish results without another application control or roll',async()=>{
 const f=setup(),id=await createSceneEffect({...f.req,formula:'',label:'Condition instance',result:'Instance created.'});
 assert.equal(f.state(id).rows[0].state,'applied');assert.doesNotMatch(sceneEffectContent(f.state(id)),/data-scene-effect-action/);
 await resolveSceneEffect(id,'apply',0,0);assert.equal(f.applied(),0);assert.equal(f.rolls(),0);
});

function avoidanceSetup(){
 const f=setup();game.users.push({id:'player',isGM:false,active:true},{id:'other',isGM:false,active:true});
 globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};
 globalThis.fromUuid=async uuid=>({uuid,documentName:'Token',name:'Target',actor:{testUserPermission:user=>user.id==='player'}});
 const request=(id,row,action,nonce='n',total)=>({sceneEffectType:'request',id:'req',user:'player',message:id,row,action,nonce,total,html:'<div>Native roll</div>'});
 return {...f,request};
}
test('owners avoid independently; totals must beat DV and success skips provider damage once',async()=>{
 const f=avoidanceSetup(),calls=[];f.provider.apply=async(...args)=>{calls.push(args);return args[4]?'Avoided':'Applied';};
 const id=await createSceneEffect({...f.req,avoidance:{skill:'Evasion',dv:13}});
 await createSceneEffect({...f.req,source:'source-two',target:'Token.two',avoidance:{skill:'Evasion',dv:13}});
 assert.equal(game.messages.get(id).mode,'roll');assert.match(sceneEffectContent(f.state(id)),/Roll Evasion/);
 await resolveSceneEffect(id,'roll',0,f.state(id).revision);
 await assert.rejects(()=>resolveSceneEffect(id,'apply',0,f.state(id).revision),/avoidance/);
 await assert.rejects(()=>resolveSceneAvoidance({...f.request(id,0,'claim'),user:'other'}),/own/);
 await resolveSceneAvoidance(f.request(id,0,'claim'));
 await resolveSceneAvoidance(f.request(id,1,'claim','second'));
 await assert.rejects(()=>resolveSceneAvoidance(f.request(id,0,'claim','duplicate')),/progress/);
 await resolveSceneAvoidance(f.request(id,0,'commit','n',14));
 await resolveSceneAvoidance(f.request(id,0,'commit','n',14));
 assert.equal(calls.length,1);assert.equal(calls[0][4],true);assert.equal(f.state(id).rows[0].state,'avoided');
 await resolveSceneAvoidance(f.request(id,1,'commit','second',13));
 assert.equal(f.state(id).rows[1].state,'ready');
 await resolveSceneEffect(id,'apply',1,f.state(id).revision);
 assert.equal(calls.length,2);assert.equal(calls[1][3],7);assert.equal(f.state(id).rows[1].state,'applied');
});
test('cancelled checks release their claim; invalid totals and provider failures cannot apply effects',async()=>{
 const f=avoidanceSetup(),id=await createSceneEffect({...f.req,formula:'',avoidance:{skill:'Resist Torture/Drugs',dv:12}});
 await resolveSceneAvoidance(f.request(id,0,'claim'));
 await resolveSceneAvoidance(f.request(id,0,'release'));
 assert.equal(f.state(id).rows[0].avoidance.claim,undefined);
 await resolveSceneAvoidance(f.request(id,0,'claim','retry'));
 await assert.rejects(()=>resolveSceneAvoidance(f.request(id,0,'commit','retry',NaN)),/total/);
 f.provider.apply=async()=>{throw Error('Source changed');};
 await resolveSceneAvoidance(f.request(id,0,'commit','retry',15));
 assert.equal(f.state(id).rows[0].state,'review');
 await resolveSceneEffect(id,'apply',0,f.state(id).revision);assert.equal(f.applied(),0);
});

test('native avoidance dialog cancellation releases the row without spending Luck or applying anything',async()=>{
 const f=avoidanceSetup();let dialogs=0;foundry.utils.randomID=()=> 'cancel-nonce';globalThis.ui={chat:{updateMessage(){}}};
 const actor={isOwner:true,items:[{id:'skill',name:'Evasion',type:'skill',createRoll:()=>({handleRollDialog:async()=>{dialogs++;return false;}})}]};
 globalThis.fromUuid=async uuid=>({uuid,documentName:'Token',name:'Target',actor});
 const id=await createSceneEffect({...f.req,formula:'',avoidance:{skill:'Evasion',dv:13}});
 await rollSceneAvoidance(game.messages.get(id),0);
 assert.equal(dialogs,1);assert.equal(f.state(id).rows[0].avoidance.claim,undefined);assert.equal(f.applied(),0);
});

test('native avoidance confirms and rolls once, spends chosen Luck, and automatically skips success',async()=>{
 const f=avoidanceSetup();let confirmations=0,rolls=0,ids=0;
 foundry.utils.randomID=()=> String(++ids);globalThis.ui={chat:{updateMessage(){}}};globalThis.renderTemplate=async()=>'<div>Native skill result</div>';
 const native={luck:2,resultTotal:15,rollCard:'native',handleRollDialog:async()=>true,wasCritical:()=>false,roll:async()=>{rolls++;}};
 const actor={uuid:'Actor.target',isOwner:true,system:{stats:{luck:{value:5}}},items:[{id:'skill',name:'Evasion',type:'skill',createRoll:()=>native,confirmRoll:async r=>{confirmations++;return r;}}],update:async changes=>{actor.system.stats.luck.value=changes['system.stats.luck.value'];}};
 globalThis.fromUuid=async uuid=>({uuid,documentName:'Token',name:'Target',actor});
 const id=await createSceneEffect({...f.req,formula:'',avoidance:{skill:'Evasion',dv:13}});
 await rollSceneAvoidance(game.messages.get(id),0);
 assert.equal(confirmations,1);assert.equal(rolls,1);assert.equal(actor.system.stats.luck.value,3);
 assert.equal(f.state(id).rows[0].state,'avoided');assert.equal(f.state(id).rows[0].avoidance.total,15);
});

test('avoidance query matches identity and returns a detached completed result',async()=>{
 const f=avoidanceSetup(),id=await createSceneEffect({...f.req,formula:'',avoidance:{skill:'Evasion',dv:13}});
 const query={cardId:id,provider:f.req.provider,source:f.req.source,index:0,target:f.req.target};
 assert.equal(getSceneAvoidanceResult(query),null);
 await resolveSceneAvoidance(f.request(id,0,'claim'));
 await resolveSceneAvoidance(f.request(id,0,'commit','n',13));
 const result=getSceneAvoidanceResult(query);
 assert.deepEqual(result,{skill:'Evasion',dv:13,total:13,passed:false});
 result.total=99;assert.equal(getSceneAvoidanceResult(query).total,13);
 for(const [key,value] of Object.entries({cardId:'missing',provider:'other',source:'other',index:1,target:'other'})) assert.equal(getSceneAvoidanceResult({...query,[key]:value}),null);
});
