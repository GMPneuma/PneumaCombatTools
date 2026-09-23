globalThis.Hooks ??= {once(){},on(){}};
import { registerHooks } from "node:module";
import assert from "node:assert/strict";
import { test } from "node:test";
import { evasionOffer, checkedLuck } from "../dist/scripts/evasion-rules.js";
import { evasionDialog } from "../dist/scripts/native-combat.js";
const q=(qualifies=true,free=false,stacks=false)=>({qualifies,free,stacks});
const rules=(rule="flat")=>({reflex:q(),coprocessor:q(),solo:q(),rule,luckCost:2});
const facts={ref:8,coprocessor:false,solo:false,luck:5};
test("RAW, disabled ranged mode, and unaffected melee",()=>{
  assert.equal(evasionOffer(true,"raw",rules(),facts,500,true).penalty,0);
  assert.equal(evasionOffer(true,"raw",rules(),{...facts,ref:7},0,true).allowed,false);
  assert.equal(evasionOffer(true,"raw",rules(),{...facts,ref:7,coprocessor:true},0,true).allowed,true);
  assert.equal(evasionOffer(true,"none",rules(),facts,0,true).allowed,false);
  assert.equal(evasionOffer(false,"none",rules(),facts,0,false).allowed,true);
});
test("free allowances stack by qualifier, not duplicate implants",()=>{
  const config={...rules(),reflex:q(true,true),coprocessor:q(true,true),solo:q(true,true,true)};
  const eligible={...facts,coprocessor:true,solo:true};
  assert.equal(evasionOffer(true,"custom",config,eligible,0,true).free,2);
  assert.equal(evasionOffer(true,"custom",config,eligible,1,true).penalty,0);
  assert.equal(evasionOffer(true,"custom",config,eligible,2,true).penalty,-4);
});
test("cumulative penalties count excess attempts; LUCK and hard caps",()=>{
  const config={...rules("cumulative"),reflex:q(true,true)};
  assert.equal(evasionOffer(true,"custom",config,facts,1,true).penalty,-1);
  assert.equal(evasionOffer(true,"custom",config,facts,3,true).penalty,-3);
  assert.equal(evasionOffer(true,"custom",rules("luckAfterFree"),facts,0,true).cost,2);
  assert.equal(evasionOffer(true,"custom",rules("luckAfterFree"),{...facts,luck:1},0,true).allowed,false);
  assert.equal(evasionOffer(true,"custom",rules("noAdditional"),facts,0,true).allowed,false);
  assert.equal(evasionOffer(true,"custom",config,facts,0,false).allowed,false);
});
test("mandatory LUCK and optional bonus are separate and validated",()=>{
  assert.equal(checkedLuck(5,2,1),2);
  assert.throws(()=>checkedLuck(2,2,1),/Insufficient/);
  assert.throws(()=>checkedLuck(5,0,-1),/Insufficient/);
  assert.throws(()=>checkedLuck(5,1,0.5),/Insufficient/);
});
test("native dialog receives named modifier, forces confirmation, and cancel spends nothing",async()=>{
  const actor={update(){throw new Error("Must not spend inside dialog");}};
  const roll={mods:[],luck:1,addMod(mods){this.mods.push(...mods);},
    async handleRollDialog(event,receivedActor){assert.equal(event.ctrlKey,false);assert.notEqual(event.type,"click");
      assert.equal(receivedActor,actor);return false;}};
  assert.equal(await evasionDialog(roll,actor,{},-2,3),false);
  assert.deepEqual(roll.mods,[{id:"pneuma-ranged-evasion",source:"Additional ranged evasion",value:-2}]);
  assert.equal(roll.luck,1,"mandatory fee never becomes bonus luck");
});

// Mock the native rendering boundary here; real capture/markup is covered in browser checks.
registerHooks({ resolve(specifier, context, nextResolve) {
 if (specifier === "./damage-application.js" && context.parentURL?.endsWith("/damage-flow.js"))
  return {url:"data:text/javascript,"+encodeURIComponent('export async function captureDamageApplication(actor,name,location,id,apply){await apply(actor);return ["<div>native summary</div>"];}'),shortCircuit:true};
 return nextResolve(specifier,context);
}});
globalThis.FormApplication=class{};
const get=(object,path)=>path.split(".").reduce((value,key)=>value?.[key],object);
const set=(object,path,value)=>{const keys=path.split(".");let node=object;for(const key of keys.slice(0,-1))node=node[key]??={};const last=keys.at(-1);if(last.startsWith("-="))delete node[last.slice(2)];else node[last]=structuredClone(value);};
globalThis.foundry={utils:{getProperty:get,deepClone:structuredClone,randomID:()=>Math.random().toString(36).slice(2)}};
globalThis.DOMParser=class{parseFromString(html){return {body:{innerHTML:html},querySelector:()=>null,querySelectorAll:()=>[]};}};
const {serialized,offer,defenderKey,combatForAttack,resetCombatTracking,migrateActorUsage}=await import("../dist/scripts/combat-resolution.js");
let actor, messages, updates, failResolved, config, combats, failCombat;
function setup() {
  config=rules("luckAfterFree");updates=0;failResolved=false;failCombat=false;
  actor={uuid:"Actor.defender",system:{stats:{ref:{value:8},luck:{value:5}}},items:[],flags:{},
    testUserPermission:user=>user.id==="owner",
    async update(changes){if("system.stats.luck.value" in changes)updates++;for(const [path,value] of Object.entries(changes))set(this,path,value);}};
  const users=[{id:"gm",isGM:true,active:true},{id:"owner",isGM:false,active:true},{id:"stranger",active:true}];
  messages=new Map();
  combats=new Map();
  for(const id of ["combat","other"]) combats.set(id,{id,started:true,round:1,flags:{},combatants:[],
    async update(changes){if(failCombat){failCombat=false;throw new Error("injected combat failure");}
      for(const [path,value] of Object.entries(changes))set(this,path,value);}});
  globalThis.game={users:{get:id=>users.find(u=>u.id===id)},combat:combats.get("combat"),combats:{get:id=>combats.get(id),filter:fn=>[...combats.values()].filter(fn)},
    settings:{get:(_module,key)=>key==="evasionEligibility"?"custom":key==="evasionHomebrew"?config:undefined},
    i18n:{localize:k=>k},messages:{get:id=>messages.get(id),find:fn=>[...messages.values()].find(fn)}};
  globalThis.fromUuid=async()=>({actor});
}
function message(id,combatId="combat") {
  const exchange={combatId,combatEpoch:"",attacker:"Token.a",defender:"Token.d",defenderActor:actor.uuid,attackerName:"Attacker",defenderName:"Defender",
    ranged:true,category:"Ranged",title:"Pistol",dv:13,total:18,html:"attack",dice:[],rollMode:"roll",state:"waiting"};
  const msg={id,flags:{"pneuma-combattools":{exchange}},whisper:[],author:{id:"owner"},
    async update(changes){if(failResolved && changes["flags.pneuma-combattools.exchange"]?.state==="resolved"){failResolved=false;throw new Error("injected write failure");}
      for(const [path,value] of Object.entries(changes))set(this,path,value);}};
  messages.set(id,msg);return msg;
}
const request=(id,action,extra={})=>serialized({id:Math.random()+"",user:"owner",message:id,action,...extra});
const defense=()=>({total:18,html:"defense",dice:[],bonus:1,fee:2,penalty:0});
test("coordinator serializes competing defender responses and cancel releases without spending",async()=>{
  setup();message("a");message("b");
  const attempts=await Promise.allSettled([request("a","claim"),request("b","claim")]);
  assert.equal(attempts.filter(r=>r.status==="fulfilled").length,1);
  const claim=attempts[0].value;
  assert.equal(updates,0);
  await request("a","release",{nonce:claim.nonce});
  const second=await request("b","claim");
  await request("b","release",{nonce:second.nonce});
  assert.equal(actor.system.stats.luck.value,5);
});
test("one confirmed evasion charges fee plus bonus once, ties miss, duplicate commit is harmless",async()=>{
  setup();const msg=message("a");const claim=await request("a","claim");
  await request("a","commit",{nonce:claim.nonce,defense:defense()});
  assert.equal(actor.system.stats.luck.value,2);
  assert.equal(get(combats.get("combat"),"flags.pneuma-combattools.evasionUsage."+defenderKey(actor)+".used"),1);
  assert.equal(get(msg,"flags.pneuma-combattools.exchange.hit"),false);
  await request("a","commit",{nonce:claim.nonce,defense:defense()});
  assert.equal(updates,1);
});
test("partial message failure resumes the exact roll without a second charge",async()=>{
  setup();const msg=message("a");const claim=await request("a","claim");failResolved=true;
  await assert.rejects(request("a","commit",{nonce:claim.nonce,defense:defense()}),/injected/);
  assert.equal(actor.system.stats.luck.value,2);
  assert.equal(get(msg,"flags.pneuma-combattools.exchange.state"),"applying");
  message("b");await assert.rejects(request("b","claim"),/pending payment/);
  await request("a","resume");
  assert.equal(updates,1);
  assert.equal(get(msg,"flags.pneuma-combattools.exchange.state"),"resolved");
});
test("round/settings changes and insufficient combined LUCK reject before any charge",async()=>{
  for(const change of ["round","settings","luck"]) {
    setup();message("a");const claim=await request("a","claim");
    if(change==="round")game.combat.round=2;
    if(change==="settings")config.luckCost=3;
    if(change==="luck")actor.system.stats.luck.value=2;
    await assert.rejects(request("a","commit",{nonce:claim.nonce,defense:defense()}));
    assert.equal(updates,0);
    await request("a","release",{nonce:claim.nonce});
  }
});
test("declining consumes nothing; permissions enforced; GM cancellation works",async()=>{
  setup();const a=message("a");
  await assert.rejects(serialized({id:"x",user:"stranger",message:"a",action:"decline"}),/owner or GM/);
  await request("a","decline");
  assert.equal(updates,0);assert.equal(get(a,"flags.pneuma-combattools.exchange.hit"),true);
  const b=message("b");await request("b","claim");
  await serialized({id:"y",user:"gm",message:"b",action:"cancel"});
  assert.equal(get(b,"flags.pneuma-combattools.exchange.state"),"cancelled");
  assert.equal(updates,0);
});
test("target data uses installed implant and actual allocated Threat Detection rank",()=>{
  setup();actor.system.stats.ref.value=7;config.solo=q(false);
  actor.items=[{type:"cyberware",name:"Reflex Co-Processor",system:{isInstalledInActor:false}}];
  assert.equal(offer(actor,true,game.combat).allowed,false);
  actor.items[0].system.isInstalledInActor=true;
  assert.equal(offer(actor,true,game.combat).allowed,true);
  actor.items=[{type:"role",name:"Solo",system:{abilities:[{name:"Threat Detection",rank:2}]}}];
  config.solo=q(true,true);
  assert.equal(offer(actor,true,game.combat).free,1);
});
test("round advances reset allowance; rewinding cannot restore spent free uses",()=>{
  setup();config.reflex=q(true,true);
  combats.get("combat").flags={"pneuma-combattools":{evasionUsage:{[defenderKey(actor)]:{round:"combat:2",used:1}}}};
  game.combat.round=3;assert.equal(offer(actor,true,game.combat).free,1);
  game.combat.round=1;assert.equal(offer(actor,true,game.combat).allowed,false);
});
test("one actor has independent allowances in simultaneous combats, irrespective of selected combat",async()=>{
  setup();config.reflex=q(true,true);
  const a=message("a","combat"), b=message("b","other");
  const first=await request("a","claim"), second=await request("b","claim");
  assert.equal(first.offer.free,1);assert.equal(second.offer.free,1);
  game.combat=combats.get("other");game.combat.round=4;
  await request("a","commit",{nonce:first.nonce,defense:{...defense(),bonus:0,fee:0}});
  assert.equal(offer(actor,true,combats.get("combat")).free,0);
  assert.equal(offer(actor,true,combats.get("other")).free,1);
  assert.equal(get(a,"flags.pneuma-combattools.exchange.round"),"combat:1");
  await request("b","release",{nonce:second.nonce});
  assert.equal(get(actor,"flags.pneuma-combattools.evasionUsage"),undefined);
  assert.equal(get(actor,"flags.pneuma-combattools.evasionPayment"),undefined);
});
test("shared LUCK is rechecked across independent combat claims",async()=>{
  setup();message("a","combat");message("b","other");
  const first=await request("a","claim"),second=await request("b","claim");
  await request("a","commit",{nonce:first.nonce,defense:defense()});
  await assert.rejects(request("b","commit",{nonce:second.nonce,defense:defense()}),/Insufficient LUCK/);
  assert.equal(actor.system.stats.luck.value,2);
  await request("b","release",{nonce:second.nonce});
});
test("failed Combat write resumes without charging twice or double-counting",async()=>{
  setup();message("a");const claim=await request("a","claim");failCombat=true;
  await assert.rejects(request("a","commit",{nonce:claim.nonce,defense:defense()}),/combat failure/);
  assert.equal(actor.system.stats.luck.value,2);
  await request("a","resume");
  assert.equal(updates,1);
  assert.equal(offer(actor,true,combats.get("combat")).cost,2);
  assert.equal(get(combats.get("combat"),"flags.pneuma-combattools.evasionUsage."+defenderKey(actor)+".used"),1);
  assert.equal(get(actor,"flags.pneuma-combattools.evasionPayment"),undefined);
});
test("combat selection at attack start uses participating tokens and rejects ambiguity",()=>{
  setup();
  const attacker={document:{uuid:"Scene.s.Token.a"}},target={document:{uuid:"Scene.s.Token.d"}};
  for(const combat of combats.values())combat.combatants=[{token:{uuid:attacker.document.uuid}},{token:{uuid:target.document.uuid}}];
  assert.equal(combatForAttack(attacker,target).id,"combat");
  game.combat=undefined;
  assert.throws(()=>combatForAttack(attacker,target),/Select the intended combat/);
  combats.delete("other");assert.equal(combatForAttack(attacker,target).id,"combat");
});
test("reset clears only this Combat, invalidates old cards, and deselection does not reset",async()=>{
  setup();message("a");const claim=await request("a","claim");
  const changes={round:0};resetCombatTracking(combats.get("combat"),changes);
  await combats.get("combat").update(changes);combats.get("combat").started=false;
  assert.equal(get(combats.get("combat"),"flags.pneuma-combattools.evasionUsage"),undefined);
  await assert.rejects(request("a","commit",{nonce:claim.nonce,defense:defense()}),/ended or was reset/);
  await request("a","release",{nonce:claim.nonce});
  combats.get("combat").started=true;combats.get("combat").round=1;
  await assert.rejects(request("a","claim"),/ended or was reset/);
  const selection={active:false};resetCombatTracking(combats.get("other"),selection);
  assert.deepEqual(selection,{active:false});
  assert.equal(updates,0);
});
test("deleted combat cannot redirect a pending attack to the selected combat",async()=>{
  setup();message("a");combats.delete("combat");game.combat=combats.get("other");
  await assert.rejects(request("a","claim"),/ended or was reset/);
  assert.equal(updates,0);
});
test("paid interrupted exchange finishes after Combat deletion without recreating counters",async()=>{
  setup();message("a");const claim=await request("a","claim");failResolved=true;
  await assert.rejects(request("a","commit",{nonce:claim.nonce,defense:defense()}));
  combats.delete("combat");
  await request("a","resume");
  assert.equal(updates,1);
  assert.equal(get(actor,"flags.pneuma-combattools.evasionPayment"),undefined);
});
test("legacy actor usage migrates to its recorded Combat, not current selection",async()=>{
  setup();game.combat=combats.get("other");
  actor.flags={"pneuma-combattools":{evasionUsage:{round:"combat:1",used:2,lastPayment:"old"}}};
  await migrateActorUsage(actor);
  assert.equal(get(combats.get("combat"),"flags.pneuma-combattools.evasionUsage."+defenderKey(actor)+".used"),2);
  assert.equal(get(combats.get("other"),"flags.pneuma-combattools.evasionUsage"),undefined);
  assert.equal(get(actor,"flags.pneuma-combattools.evasionUsage"),undefined);
});
test("migration preserves a charged legacy interrupted payment receipt",async()=>{
  setup();const msg=message("old");
  const data=get(msg,"flags.pneuma-combattools.exchange");
  delete data.combatId;data.round="combat:1";data.state="applying";data.defense=defense();
  actor.system.stats.luck.value=2;
  actor.flags={"pneuma-combattools":{evasionUsage:{round:"combat:1",used:1,lastPayment:"old"}}};
  await migrateActorUsage(actor);await request("old","resume");
  assert.equal(actor.system.stats.luck.value,2);assert.equal(updates,0);
  assert.equal(get(combats.get("combat"),"flags.pneuma-combattools.evasionUsage."+defenderKey(actor)+".used"),1);
  assert.equal(get(actor,"flags.pneuma-combattools.evasionPayment"),undefined);
});
test("older pending cards with no originating combat are never assigned to the current combat",async()=>{
  setup();const msg=message("old");delete get(msg,"flags.pneuma-combattools.exchange").combatId;
  await assert.rejects(request("old","claim"),/older attack/);
  await serialized({id:"cancel",user:"gm",message:"old",action:"cancel"});
});
const {configureDamage}=await import("../dist/scripts/damage-flow.js");
const damageResult=()=>({html:"native damage",values:{total:22,bonus:5,location:"head",ablation:2,ammo:"armorPiercing",ignorePercent:0.5,ignoreBelow:0,lethal:true}});
const damageOptions={useShield:true,damageReductionRole:true,damageReductionAE:false,brainDamageReduction:true};
function hit(id="damage") {
  const msg=message(id);const data=get(msg,"flags.pneuma-combattools.exchange");
  Object.assign(data,{state:"resolved",hit:true,weaponId:"weapon",attackMode:"aimed",location:"head"});
  return msg;
}
async function rolled(id="damage") {
  const msg=hit(id);await request(id,"damageClaim",{nonce:"n"});
  await request(id,"damageCommit",{nonce:"n",damage:damageResult()});return msg;
}
test("damage transfers aimed location and capped Autofire margin against DV or Evasion",()=>{
  const roll={autofireMultiplierMax:4};
  configureDamage(roll,{attackMode:"aimed",location:"head"});assert.equal(roll.isAimed,true);assert.equal(roll.location,"head");
  configureDamage(roll,{attackMode:"autofire",total:22,dv:13});assert.equal(roll.autofireMultiplier,4);
  configureDamage(roll,{attackMode:"autofire",total:22,dv:13,defense:{total:20}});assert.equal(roll.autofireMultiplier,2);
  configureDamage(roll,{attackMode:"autofire",total:20,defense:{total:20}});assert.equal(roll.autofireMultiplier,1,"manual override opens with editable multiplier");
});
test("damage cancellation releases reservation; competing roll and nonowner rejected",async()=>{
  setup();const msg=hit();
  await assert.rejects(request("damage","damageClaim",{user:"stranger",nonce:"x"}),/owner or GM/);
  await request("damage","damageClaim",{nonce:"n"});
  await assert.rejects(request("damage","damageClaim",{nonce:"other"}),/already/);
  await request("damage","damageRelease",{nonce:"n"});assert.equal(get(msg,"flags.pneuma-combattools.exchange.damage"),undefined);
  await request("damage","damageClaim",{nonce:"new"});
  await assert.rejects(request("damage","damageCommit",{nonce:"n",damage:damageResult()}),/expired/);
});
test("damage is applied once to captured defender with native armor and critical values",async()=>{
  setup();const msg=await rolled();let calls=[];
  const original=actor;
  original._applyDamage=async(...args)=>calls.push(args);
  globalThis.fromUuid=async uuid=>({actor:uuid==="Token.d"?original:{testUserPermission:()=>false}});
  const results=await Promise.all([request("damage","damageApply",{options:damageOptions}),request("damage","damageApply",{options:damageOptions})]);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0],[22,5,"head",2,"armorPiercing",0.5,0,true,damageOptions]);
  assert.equal(get(msg,"flags.pneuma-combattools.exchange.damage.status"),"applied");
  assert.equal(updates,0,"native method alone owns damage mutations");
});
test("native partial application failure blocks retry until GM review",async()=>{
  setup();const msg=await rolled();let calls=0;actor._applyDamage=async()=>{calls++;throw new Error("partial armor update");};
  await assert.rejects(request("damage","damageApply",{options:damageOptions}),/interrupted/);
  assert.equal(get(msg,"flags.pneuma-combattools.exchange.damage.status"),"review");
  await assert.rejects(request("damage","damageApply",{options:damageOptions}),/review/);
  assert.equal(calls,1);
  await assert.rejects(request("damage","damageResolved"),/No interrupted/);
  await request("damage","damageResolved",{user:"gm"});
  assert.equal(get(msg,"flags.pneuma-combattools.exchange.damage.status"),"applied");
});
test("failed completion write cannot apply HP twice after reload",async()=>{
  setup();const msg=await rolled();let calls=0;const update=msg.update;
  msg.update=async changes=>{if(changes["flags.pneuma-combattools.exchange"]?.damage?.status==="applied")throw new Error("completion write");return update.call(msg,changes);};
  actor._applyDamage=async()=>{calls++;};
  await assert.rejects(request("damage","damageApply",{options:damageOptions}),/completion write/);
  assert.equal(get(msg,"flags.pneuma-combattools.exchange.damage.status"),"applying");
  await assert.rejects(request("damage","damageApply",{options:damageOptions}),/already applying/);
  assert.equal(calls,1);
});
test("miss override is allowed; private cards and older attacks remain guarded",async()=>{
  setup();const msg=hit();const data=get(msg,"flags.pneuma-combattools.exchange");data.hit=false;
  await request("damage","damageClaim",{nonce:"n"});
  await request("damage","damageRelease",{nonce:"n"});
  data.hit=true;msg.blind=true;
  await assert.rejects(request("damage","damageClaim",{nonce:"n"}),/private/);
  msg.blind=false;delete get(msg,"flags.pneuma-combattools.exchange").weaponId;
  await assert.rejects(request("damage","damageClaim",{nonce:"n"}),/older attack/);
});

test("selected damage remains reusable while recorded damage applies only once",async()=>{
 setup();const msg=await rolled();const original=actor;let originalCalls=0,selectedCalls=0;
 original._applyDamage=async()=>{originalCalls++;};
 const selected={testUserPermission:u=>u.id==="owner",_applyDamage:async()=>{selectedCalls++;}};
 globalThis.fromUuid=async uuid=>({actor:uuid==="Token.selected"?selected:original});
 await assert.rejects(request("damage","damageApply",{user:"stranger",targetUuid:"Token.selected",options:damageOptions}),/owner or GM/);
 await request("damage","damageApply",{targetUuid:"Token.selected",options:damageOptions});
 await request("damage","damageApply",{options:damageOptions});
 await request("damage","damageApply",{options:damageOptions});
 await request("damage","damageApply",{application:"selected",applicationId:"repeat1",targetUuid:"Token.selected",options:damageOptions});
 await request("damage","damageApply",{application:"selected",applicationId:"repeat1",targetUuid:"Token.selected",options:damageOptions});
 await request("damage","damageApply",{application:"selected",applicationId:"repeat2",targetUuid:"Token.selected",options:damageOptions});
 assert.equal(originalCalls,1);assert.equal(selectedCalls,3);
 assert.equal(get(msg,"flags.pneuma-combattools.exchange.damage.applications").length,4);
 assert.equal(get(msg,"flags.pneuma-combattools.exchange.damage.selectedTargets").length,3);
 assert.deepEqual(get(msg,"flags.pneuma-combattools.exchange.damage.selectedTargets").slice(1).map(row=>row.id),["repeat1","repeat2"]);
 assert.equal(get(msg,"flags.pneuma-combattools.exchange.damage.recordedApplied"),true);
});
test("selected damage recipient requires one controlled owned token",async()=>{
 const {selectedDamageTarget}=await import("../dist/scripts/damage-flow.js");
 globalThis.canvas={tokens:{controlled:[]}};assert.throws(selectedDamageTarget,/exactly one/);
 canvas.tokens.controlled=[{},{}];assert.throws(selectedDamageTarget,/exactly one/);
 canvas.tokens.controlled=[{actor:{isOwner:false},document:{uuid:"Token.smitty"}}];assert.throws(selectedDamageTarget,/owner or GM/);
 canvas.tokens.controlled[0].actor.isOwner=true;assert.equal(selectedDamageTarget(),"Token.smitty");
});


test("evasion button matches current paid, penalized and free offers",async()=>{
 const {evasionButtonLabel}=await import("../dist/scripts/evasion-rules.js");
 assert.equal(evasionButtonLabel(evasionOffer(true,"custom",rules("luckAfterFree"),facts,0,true)),"Evade for 2 Luck");
 assert.equal(evasionButtonLabel(evasionOffer(true,"custom",rules("flat"),facts,0,true)),"Evade at -4");
 assert.equal(evasionButtonLabel(evasionOffer(true,"custom",rules("cumulative"),facts,2,true)),"Evade at -3");
 assert.equal(evasionButtonLabel(evasionOffer(true,"custom",{...rules("luckAfterFree"),reflex:q(true,true)},facts,0,true)),"Evade");
});

test("damage statuses validate limit and apply to the exact recipient after native damage",async()=>{
 setup();const msg=await rolled();globalThis.CONFIG={statusEffects:[{id:"prone"},{id:"stunned"},{id:"blind"},{id:"dead"}]};
 await assert.rejects(request("damage","damageStatuses",{statusEffects:["prone","stunned","blind","dead"]}),/up to three/);
 await assert.rejects(request("damage","damageStatuses",{statusEffects:["prone","prone"]}),/duplicated/);
 await assert.rejects(request("damage","damageStatuses",{statusEffects:["missing"]}),/no longer/);
 await assert.rejects(request("damage","damageStatuses",{user:"stranger",statusEffects:["prone"]}),/participant/);
 await request("damage","damageStatuses",{statusEffects:["prone","stunned","blind"]});
 const calls=[];actor._applyDamage=async()=>calls.push("hp");actor.toggleStatusEffect=async(id,options)=>calls.push([id,options]);
 await assert.rejects(request("damage","damageApply",{options:damageOptions}),/changed/);
 assert.equal(calls.length,0);
 await request("damage","damageApply",{options:damageOptions,statusEffects:["prone","stunned","blind"]});
 assert.deepEqual(calls,["hp",["prone",{active:true}],["stunned",{active:true}],["blind",{active:true}]]);
 await request("damage","damageStatuses",{statusEffects:[]});
 assert.deepEqual(get(msg,"flags.pneuma-combattools.exchange.damage.statusEffects"),[]);
});
test("status failure never retries HP, and status edits wait for GM review",async()=>{
 setup();await rolled();globalThis.CONFIG={statusEffects:[{id:"prone"}]};
 await request("damage","damageStatuses",{statusEffects:["prone"]});
 let hp=0;actor._applyDamage=async()=>hp++;actor.toggleStatusEffect=async()=>{throw Error("status failure");};
 await assert.rejects(request("damage","damageApply",{options:damageOptions,statusEffects:["prone"]}),/interrupted/);
 await assert.rejects(request("damage","damageApply",{options:damageOptions,statusEffects:["prone"]}),/review/);
 await assert.rejects(request("damage","damageStatuses",{statusEffects:[]}),/review/);
 assert.equal(hp,1);
});
test("repeat selected-target damage activates statuses without toggling them off",async()=>{
 setup();await rolled();globalThis.CONFIG={statusEffects:[{id:"prone"}]};
 await request("damage","damageStatuses",{statusEffects:["prone"]});
 let hp=0;const effects=[];
 const original=actor;
 const selected={testUserPermission:u=>u.id==="owner",_applyDamage:async()=>hp++,
   toggleStatusEffect:async(id,options)=>effects.push([id,options])};
 globalThis.fromUuid=async uuid=>({actor:uuid==="Token.selected"?selected:original});
 for(const applicationId of ["first","second"]) await request("damage","damageApply",{
   application:"selected",applicationId,targetUuid:"Token.selected",options:damageOptions,statusEffects:["prone"]});
 assert.equal(hp,2);assert.deepEqual(effects,[["prone",{active:true}],["prone",{active:true}]]);
});

test("critical injury counts only active damage d6 sixes and chooses the attack location",async()=>{
 const {damageSixes,criticalLocation,hasCriticalInjury,criticalMethod}=await import("../dist/scripts/critical-injury.js");
 const roll={_roll:{dice:[{faces:6,results:[{result:6,active:true},{result:6},{result:6,active:false},{result:6,discarded:true},{result:5}]},
   {faces:10,results:[{result:6}]}]},_critRoll:{dice:[{faces:6,results:[{result:6}]}]}};
 assert.equal(damageSixes(roll),2);
 assert.equal(criticalLocation({attackMode:"aimed",location:"head"}),"head");
 assert.equal(criticalLocation({attackMode:"attack",location:"head"}),"body");
 assert.equal(criticalLocation({attackMode:"aimed",location:"leg"}),"body");
 setup();game.settings.get=()=>true;
 const data={ranged:true,damage:{result:{sixes:2}}};
 assert.equal(hasCriticalInjury(data),true);assert.equal(hasCriticalInjury({...data,damage:{result:{sixes:1}}}),false);
 assert.equal(hasCriticalInjury({...data,damage:{result:{}}}),false);
 assert.equal(criticalMethod({...data,attackMode:"autofire"}),"Autofire");
 for(const method of ["Explosion","Grenade","Rocket","Quickhack"]) assert.equal(criticalMethod({...data,criticalMethod:method}),method);
 game.settings.get=(_module,key)=>key!=="criticalRanged";assert.equal(hasCriticalInjury(data),false);
 const registered=[];game.settings.register=(module,key,options)=>registered.push([key,options.default]);
 const {registerCriticalSettings}=await import("../dist/scripts/critical-settings.js");game.settings.registerMenu=()=>{};
 registerCriticalSettings();assert.equal(registered.length,8);assert.ok(registered.every(([key,value])=>value===(key!=="criticalQuickhack")));
});
test("critical injury verifies recipient ownership before native mutation",async()=>{
 const {applyCriticalInjury}=await import("../dist/scripts/critical-injury.js");
 setup();game.settings.get=()=>true;globalThis.fromUuid=async()=>({actor:{isOwner:false}});
 await assert.rejects(applyCriticalInjury({ranged:true,damage:{result:{sixes:2}}},"Token.foreign"),/owner or GM/);
});

test("native ammo rejection stops attack before dialog, confirmation, LUCK or chat",async()=>{
 const {startCombatExchange}=await import("../dist/scripts/combat-resolution.js");
 for(const mode of ["attack","aimed","autofire"]) {
  setup();game.users.filter=()=>[{id:"gm",isGM:true,active:true}];game.user={isGM:false};
  let dialogs=0,confirms=0;
  const roll={luck:2,handleRollDialog:async()=>{dialogs++;return true;}};
  const item={system:{isRanged:true,weaponType:"heavyPistol"},createRoll:received=>{assert.equal(received,mode);return roll;},
    hasAmmo:received=>{assert.equal(received,roll);return false;},confirmRoll:async()=>{confirms++;}};
  actor.items={get:()=>item};
  const token={actor,document:{uuid:"Token.a"}},target={actor,document:{uuid:"Token.d"}};
  await startCombatExchange(token,target,"gun",mode,{});
  assert.equal(dialogs,0);assert.equal(confirms,0);assert.equal(updates,0);assert.equal(messages.size,0);
 }
});
test("ammo changing during the dialog stops confirmation; sufficient ammo and melee continue",async()=>{
 const {startCombatExchange}=await import("../dist/scripts/combat-resolution.js");
 for(const scenario of ["depleted","loaded","melee"]) {
  setup();game.users.filter=()=>[{id:"gm",isGM:true,active:true}];game.user={isGM:false};
  game.tables={getName:()=>({getResultsForRoll:()=>[{text:"13"}]})};
  globalThis.canvas={grid:{measurePath:()=>({distance:5})}};
  let ammo=true,confirms=0;const warnings=[];
  globalThis.ui={notifications:{warn:message=>warnings.push(message)}};
  const roll={luck:0,handleRollDialog:async()=>{if(scenario==="depleted")ammo=false;return true;}};
  const item={system:{isRanged:scenario!=="melee",weaponType:"heavyPistol",dvTable:"Pistol"},
    createRoll:()=>roll,hasAmmo:()=>scenario==="melee"?false:ammo,
    confirmRoll:async()=>{confirms++;throw Error("confirmation reached");}};
  actor.items={get:()=>item};
  const token={actor,center:{x:0,y:0},document:{uuid:"Token.a",elevation:0}};
  const target={actor,center:{x:5,y:0},document:{uuid:"Token.d",elevation:0}};
  if(scenario==="depleted") {
   await startCombatExchange(token,target,"gun","attack",{});
   assert.equal(confirms,0);assert.deepEqual(warnings,["CPR.messages.weaponAttackOutOfBullets"]);
  } else {
   await assert.rejects(startCombatExchange(token,target,"gun","attack",{}),/confirmation reached/);
   assert.equal(confirms,1);assert.equal(warnings.length,0);
  }
  assert.equal(updates,0);assert.equal(messages.size,0);
 }
});

test("melee bypasses ranged homebrew while thrown remains subject to it",()=>{
 setup();actor.system.stats.ref.value=1;
 assert.equal(offer(actor,false).allowed,true);assert.equal(offer(actor,false).cost,0);
 assert.equal(offer(actor,true).allowed,false);
});
test("improvised damage uses the attack choice; older cards without a choice are rejected",async()=>{
 setup();const msg=hit();const data=get(msg,"flags.pneuma-combattools.exchange");
 data.improvised=true;
 await assert.rejects(request("damage","damageClaim",{nonce:"n"}),/Start a new attack/);
 data.improvisedDice=4;
 await request("damage","damageClaim",{nonce:"n"});
 assert.equal(get(msg,"flags.pneuma-combattools.exchange.improvisedDice"),4);
});
test("MA homebrew removes only ablation and retains native armor penetration",async()=>{
 for(const type of ["martialArts","unarmed","mediumMelee"]) for(const enabled of [false,true]){
  setup();const msg=await rolled();get(msg,"flags.pneuma-combattools.exchange").weaponType=type;
  game.settings.get=(_module,key)=>key==="maNoAblation"?enabled:undefined;
  let args;actor._applyDamage=async(...values)=>{args=values;};
  await request("damage","damageApply",{options:damageOptions});
  assert.equal(args[3],type==="martialArts"&&enabled?0:2);
  assert.equal(args[5],0.5);
 }
});

test("leg injuries block melee and ranged claims and invalidate an open defense without charging",async()=>{
 setup();actor.items.push({type:"criticalInjury",name:"Dismembered Leg"});
 assert.equal(offer(actor,false,game.combat).allowed,false);assert.equal(offer(actor,true,game.combat).allowed,false);
 message("injury");await assert.rejects(request("injury","claim"),/Cannot evade/);
 actor.items=[];const claim=await request("injury","claim");actor.items.push({type:"criticalInjury",name:"Dismembered Leg"});
 await assert.rejects(request("injury","commit",{nonce:claim.nonce,defense:defense()}),/conditions changed/);assert.equal(updates,0);await request("injury","release",{nonce:claim.nonce});
});


test("half armor uses native 50 percent without double halving or losing armor bypass",async()=>{
 for(const [original,half,expected] of [[0,true,50],[50,true,50],[50,false,0],[100,true,100]]) {
  setup();const msg=await rolled();msg.flags["pneuma-combattools"].exchange.damage.result.values.ignorePercent=original;
  const calls=[];actor._applyDamage=async(...args)=>calls.push(args);
  await request("damage","damageApply",{options:damageOptions,halfArmor:half});
  assert.equal(calls[0][5],expected);
 }
});


test("armor interaction off bypasses SP and ablation without changing stored roll",async()=>{
 setup();const msg=await rolled();const calls=[];actor._applyDamage=async(...args)=>calls.push(args);
 await request("damage","damageApply",{options:damageOptions,interactArmor:false,halfArmor:true});
 assert.equal(calls[0][3],0);assert.equal(calls[0][5],100);
 assert.equal(msg.flags["pneuma-combattools"].exchange.damage.result.values.ablation,2);
});
