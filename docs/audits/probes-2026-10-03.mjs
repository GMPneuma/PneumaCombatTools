// Audit only: reproduce current defects without modifying runtime source.
// Run after node scripts/build.mjs, from the repository root.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

const root=new URL('../../',import.meta.url);
if(await readFile(new URL('dist/scripts/actor-mutation.js',root),'utf8').then(()=>true,()=>false))
 throw Error('Historical baseline-only probes. For corrected behavior run node --test scripts/audit-regressions.test.mjs.');
const fixture=await readFile(new URL('scripts/medical.test.mjs',root),'utf8');
const helpers=fixture.slice(0,fixture.indexOf("test('Needs Stabilization"))
 .replaceAll("'../dist/", "'"+new URL('dist/',root).href);
const code=helpers+String.raw`
const {registerHooks}=await import('node:module');
registerHooks({
 resolve(specifier,context,next){
  if(specifier==='/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js')return {shortCircuit:true,url:'data:text/javascript,'+encodeURIComponent('export default {async handle3dDice(){throw Error("injected DSN failure");}}')};
  return next(specifier,context);
 },
 load(url,context,next){const result=next(url,context);return url.endsWith('/dist/scripts/aoe/workflow.js')?{...result,source:String(result.source)+'\nexport {respond as auditRespond};'}:result;}
});
const {performMedical}=await import(REPO+'dist/scripts/medical.js');
const {createInstantCard,handleInstantRequest,handleInstant}=await import(REPO+'dist/scripts/instant-effects.js');
const {burnTurn}=await import(REPO+'dist/scripts/instant-lifetime.js');
const evidence=[];
async function probe(name,fn){const result=await fn();evidence.push({name,...result});console.log(JSON.stringify(evidence.at(-1)));}

await probe('Generic added statuses fail in the actual request dispatcher',async()=>{
 const f=await setup();game.messages=new Collection();
 const message=new Doc({id:'message',content:'Damage',flags:{},whisper:[],blind:false});
 game.messages.set(message.id,message);
 await createInstantCard(f.target,'status',message,{combatId:null},'prone');
 const scope=Object.keys(get(message,'flags.pneuma-combattools.attachedEffects'))[0];
 for(const action of ['apply','skip'])await assert.rejects(handleInstantRequest({message:message.id,user:'gm',scope,request:{action}}),/Effect unavailable/);
 return {actions:['apply','skip'],error:'Effect unavailable',state:get(message,'flags.pneuma-combattools.attachedEffects.'+scope+'.effect.state')};
});

await probe('Quick Fix restoration loses recovery state when effect restoration fails',async()=>{
 const f=await setup();
 const [injury]=await f.target.createEmbeddedDocuments('Item',[{name:'Broken Arm',type:'criticalInjury',system:{quickFix:{dvFirstAid:13},treatment:{type:'paramedicSurgery'},deathSaveIncrease:true}}]);
 const [effect]=await injury.createEmbeddedDocuments('ActiveEffect',[{name:'Penalty',disabled:false}]);
 await f.request('quickFix',{item:injury.id,skill:'First Aid',total:14});
 const update=injury.updateEmbeddedDocuments.bind(injury);let fail=true;
 injury.updateEmbeddedDocuments=async(...args)=>{if(fail)throw Error('injected effect write failure');return update(...args);};
 const combat={id:'ended',combatants:[{actor:f.target}]};
 await assert.rejects(expireQuickFixes(combat),/injected/);
 fail=false;await expireQuickFixes(combat);
 assert.equal(get(injury,'flags.pneuma-combattools.quickFix'),undefined);assert.equal(effect.disabled,true);
 return {afterRetry:{penaltyDisabled:effect.disabled,recoveryFlagPresent:false,deathSaveIncrease:injury.system.deathSaveIncrease}};
});

await probe('Speed Heal partial failure consumes dose and blocks retry without healing',async()=>{
 const f=await setup(),stock=f.source.items.find(i=>i.name==='Speedheal');
 const update=f.target.update.bind(f.target);
 f.target.update=async changes=>{if('system.derivedStats.hp.value' in changes)throw Error('injected HP write failure');return update(changes);};
 await assert.rejects(f.request('speedheal'),/injected/);
 f.target.update=update;await assert.rejects(f.request('speedheal'),/no longer available/);
 assert.equal(stock.system.amount,1);assert.equal(f.target.system.derivedStats.hp.value,30);
 return {hp:30,dosesRemaining:1,retry:'blocked',speedHealStatusPresent:f.target.effects.some(e=>e.name==='Speed Heal')};
});

await probe('Medical spends LUCK and evaluates a roll before checking for an active GM',async()=>{
 const f=await setup();let rolls=0,cards=0;
 const skill=f.source.items.find(i=>i.name==='First Aid');
 f.source.items.delete(f.source.items.find(i=>i.name==='Paramedic').id);
 skill.createRoll=()=>({luck:1,resultTotal:20,rollCard:'fixture',handleRollDialog:async()=>true,wasCritical:()=>false,roll:async()=>{rolls++;}});
 skill.confirmRoll=async roll=>roll;globalThis.renderTemplate=async()=>'<div class="rollcard">20</div>';
 globalThis.ChatMessage={getSpeaker:()=>({}),applyRollMode(){},create:async()=>{cards++;}};
 game.users[0].active=false;game.user=game.users[1];game.socket={connected:true};
 await assert.rejects(performMedical({actor:f.source,document:f.sourceToken,name:'Medic'},{actor:f.target,document:f.targetToken,name:'Patient'},'stabilize',undefined,true),/active GM/);
 assert.equal(f.source.system.stats.luck.value,1);assert.equal(rolls,1);assert.equal(cards,0);
 return {luckBefore:2,luckAfter:1,rolls,chatCards:cards};
});

await probe('Rapid healing can erase a queued damage stabilization event',async()=>{
 const f=await setup();f.target.effects.clear();
 const pending=markMedicalDamage(f.target,40);f.target.system.derivedStats.hp.value=40;await pending;
 assert.equal(needsStabilization(f.target),false);
 return {hpAtDamageEvent:30,hpAfterHealing:40,needsStabilization:false};
});

await probe('Independent damage queues overwrite concurrent HP changes',async()=>{
 const f=await setup();const fire=masterStatuses.find(s=>s.name==='On Fire (Mild)');
 await f.target.createEmbeddedDocuments('ActiveEffect',[{name:fire.name,statuses:[fire.id],changes:[]}]);
 const update=f.target.update.bind(f.target),pending=[];
 f.target.update=changes=>new Promise((resolve,reject)=>{
  pending.push({changes,resolve,reject});
  if(pending.length===2){for(const row of pending)update(row.changes).then(row.resolve,row.reject);}
 });
 const poison={id:'poison',actor:f.target.uuid,name:f.target.name,encounter:{combatId:null},state:'failed',damage:8,damageHTML:'8'};
 await Promise.all([handleInstant(poison,{action:'apply'},game.user,async()=>{}),burnTurn(f.target,'combat:round:turn')]);
 const writes=pending.map(row=>row.changes['system.derivedStats.hp.value']);
 assert.deepEqual([...writes].sort((a,b)=>a-b),[22,28]);assert.notEqual(f.target.system.derivedStats.hp.value,20);assert.equal(poison.state,'applied');
 return {hpBefore:30,poisonDamage:8,fireDamage:2,absoluteHPWrites:writes,expectedHP:20,actualHP:f.target.system.derivedStats.hp.value,bothOperationsCompleted:true};
});

await probe('Area defense loses its paid roll when DSN playback fails',async()=>{
 const f=await setup();game.messages=new Collection();foundry.utils.deepClone=structuredClone;
 f.target.system.stats.luck={value:2};f.target.system.stats.ref={value:8};
 const [skill]=await f.target.createEmbeddedDocuments('Item',[{name:'Evasion',type:'skill'}]);let rolls=0;
 skill.createRoll=()=>({luck:1,resultTotal:18,rollCard:'fixture',handleRollDialog:async()=>true,wasCritical:()=>false,roll:async function(){rolls++;this._roll={toJSON:()=>({total:18})};}});
 skill.confirmRoll=async roll=>roll;globalThis.Roll={fromJSON:JSON.parse};
 globalThis.renderTemplate=async()=>'<div class="rollcard">18</div>';
 const row={uuid:f.targetToken.uuid,actor:f.target.uuid,name:'Patient',img:'',eligible:true,state:'waiting'};
 const data={scene:'scene',kind:'explosive',phase:'responses',special:false,area:{shape:'square',origin:{x:0,y:0},direction:0,length:100,width:100},settings:{evade:'raw',evadePenalty:0,coverUp:false},exchange:{combatId:null,title:'Grenade',html:'',total:20,rollMode:'roll',dice:[]},rows:[row],attackDiceRevealed:false};
 const message=new Doc({content:'',whisper:[],blind:false,flags:{'pneuma-combattools':{aoe:data}}});game.messages.set(message.id,message);
 const {auditRespond}=await import(REPO+'dist/scripts/aoe/workflow.js');
 await assert.rejects(auditRespond(message,data,row),/injected DSN/);
 const saved=get(message,'flags.pneuma-combattools.aoe.rows')[0];
 assert.equal(saved.state,'waiting');assert.equal(saved.total,undefined);assert.equal(f.target.system.stats.luck.value,1);
 return {rolls,luckBefore:2,luckAfter:1,cardState:saved.state,savedTotal:null};
});
console.log('AUDIT_EVIDENCE='+JSON.stringify(evidence));
`;
const directory=await mkdtemp(tmpdir()+'/pct-audit-');
const file=directory+'/probes.mjs';
await writeFile(file,'const REPO='+JSON.stringify(root.href)+';\n'+code);
const result=spawnSync(process.execPath,[file],{encoding:'utf8'});
process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');
if(result.error)throw result.error;
process.exitCode=result.status??1;
