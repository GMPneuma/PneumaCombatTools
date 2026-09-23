import {reportExposure,registerEffectEvents} from "./effect-events.js";
import {createSmoke} from "./aoe/smoke.js";
import {instantEffects,instantId,type InstantId,escapeInstant as esc} from "./instant-catalog.js";
import {temporaryInjury,sleepTarget,igniteTarget,clearInstantCondition,registerInstantLifetimes} from "./instant-lifetime.js";
import {empGM} from "./emp-state.js";
import {createEmp} from "./emp.js";
import {nativeCard,rollHidden,nativeAPI,diceJSON,spendBonusLuck,type RollItem} from "./native-combat.js";
import {checkedLuck} from "./evasion-rules.js";
import {requireCombatSocket} from "./socket-health.js";
import {canRenderCombatCard} from "./card-structure.js";
const M="pneuma-combattools";
export interface InstantState {
  id:InstantId; actor:string; name:string; state:"pending"|"rolling"|"failed"|"resisted"|"applying"|"applied"|"skipped"|"review";
  nonce?:string;user?:string;total?:number;html?:string;damage?:number;damageHTML?:string;summary?:string;
}
export interface InstantRequest {action:string;nonce?:string;total?:number;html?:string}
export function newInstant(id:InstantId,actor:string,name:string):InstantState {return {id,actor,name,state:instantEffects[id].skill?"pending":"failed"};}
export const instantDone=(s:InstantState)=>["resisted","applied","skipped"].includes(s.state);
export function instantContent(s:InstantState,scope="") {
  const e=instantEffects[s.id],button=(a:string,label:string)=>'<button type="button" data-instant-action="'+a+'" data-instant-scope="'+esc(scope)+'">'+label+'</button>';
  const action=s.state==="pending"?button("roll","Resist DV"+e.dv):s.state==="failed"?button("apply","Apply "+esc(e.name)):s.state==="rolling"?button("reset","GM: release roll"):s.state==="review"||s.state==="applying"?button("review","GM: mark resolved after checking target"):"";
  const label={pending:e.eligibility,rolling:"Rolling…",failed:"Effect ready",resisted:"Resisted",applying:"Applying — do not repeat",applied:s.summary??"Applied",skipped:"Unaffected (GM)",review:"Interrupted — GM review required"}[s.state];
  return '<div class="pneuma-instant-effect" data-effect="'+s.id+'" data-state="'+s.state+'" style="--pneuma-ammo-color:'+e.color+'"><strong>'+esc(e.name)+'</strong> <span>'+esc(label)+'</span> '+action
    +(['pending','failed'].includes(s.state)?button("skip","GM: unaffected"):"")
    +(s.state==="applied"&&s.id==="sleep"?button("wake","Wake (touching Action)"):s.state==="applied"&&s.id==="incendiary"?button("extinguish","Extinguish (Action)"):"")
    +(s.html?'<div class="pneuma-instant-roll">'+s.html+'</div>':"")+(s.damageHTML?'<div class="pneuma-instant-damage">'+s.damageHTML+'</div>':"")+'</div>';
}
/** Same serialized GM path for area rows and ad-hoc effect cards. */
const actorWork=new Map<string,Promise<unknown>>();
export function handleInstant(s:InstantState,req:InstantRequest,user:User,save:()=>Promise<unknown>,rollMode="roll"):Promise<void> {
  const next=(actorWork.get(s.actor)??Promise.resolve()).catch(()=>{}).then(()=>resolveInstant(s,req,user,save,rollMode));
  actorWork.set(s.actor,next);void next.finally(()=>{if(actorWork.get(s.actor)===next)actorWork.delete(s.actor);}).catch(()=>{});return next;
}
async function resolveInstant(s:InstantState,req:InstantRequest,user:User,save:()=>Promise<unknown>,rollMode:string) {
  if(game.user?.id!==empGM()?.id)throw Error("An active GM is required.");
  const actor=await fromUuid(s.actor) as Actor|null;
  if(!actor||!user.isGM&&!actor.testUserPermission(user,"OWNER"))throw Error("Only the target owner or GM can resolve this effect.");
  const e=instantEffects[s.id];
  if(req.action==="wake"||req.action==="extinguish") {
    if(s.state!=="applied"||req.action==="wake"&&s.id!=="sleep"||req.action==="extinguish"&&s.id!=="incendiary")throw Error("Condition action unavailable.");
    await clearInstantCondition(actor,s.id==="sleep"?"sleep":"fire");s.summary=s.id==="sleep"?"Awakened; remains Prone":"Extinguished";await save();return;
  }
  if(instantDone(s))return;
  if(req.action==="skip"||req.action==="review"||req.action==="reset") {
    if(!user.isGM)throw Error("GM only.");
    if(req.action==="skip"&&["pending","failed"].includes(s.state)){s.state="skipped";await save();return;}
    if(req.action==="review"&&["review","applying"].includes(s.state)){s.state="applied";s.summary="Resolved after GM review";await save();return;}
    if(req.action==="reset"&&s.state==="rolling"){s.state="pending";delete s.nonce;delete s.user;await save();return;}
    throw Error("Effect state changed.");
  }
  if(req.action==="claim") {
    if(s.state!=="pending"||!req.nonce)throw Error("Resistance is already being resolved.");
    s.state="rolling";s.nonce=req.nonce;s.user=user.id!;await save();return;
  }
  if(req.action==="release"||req.action==="commit") {
    if(s.state!=="rolling"||s.nonce!==req.nonce||s.user!==user.id)throw Error("Resistance reservation expired.");
    if(req.action==="release")s.state="pending";
    else {if(!Number.isFinite(req.total)||typeof req.html!=="string")throw Error("Invalid resistance result.");s.total=req.total;s.html=req.html;s.state=req.total!>e.dv?"resisted":"failed";}
    delete s.nonce;delete s.user;await save();return;
  }
  if(req.action!=="apply"||s.state!=="failed")throw Error("Resolve the resistance check first.");
  if((s.id==="emp"||s.id==="microwaver")&&!game.combat?.started)throw Error("Start combat before applying "+instantEffects[s.id].name+".");
  if(e.damage&&s.damage===undefined) {
    const roll=await new Roll(e.damage).evaluate();s.damage=roll.total!;s.damageHTML=await roll.render();await save();
    const {Dice}=await nativeAPI();await Dice.handle3dDice(roll,rollMode);
  }
  s.state="applying";await save();
  try {
    if(e.damage){const hp=Number(foundry.utils.getProperty(actor,"system.derivedStats.hp.value"));if(!Number.isFinite(hp))throw Error("Target HP unavailable.");await actor.update({"system.derivedStats.hp.value":hp-s.damage!} as never);s.summary=s.damage+" direct HP damage; armor unchanged";reportExposure(actor,s.id);}
    else if(s.id==="emp"||s.id==="microwaver") {const selection=await createEmp(actor,{...(s.id==="microwaver"?{source:"microwaver",seconds:60}:{}),count:2,chooser:"gm",mode:"equal",policy:{foundational:true,cascade:true,electronics:true,immune:game.settings!.get(M,"empImmunity").split(/[\n,;]/)}});s.summary=!selection?"No eligible cyberware or carried electronics":s.id==="microwaver"?"Microwaver selection created — two items; 60 seconds":"EMP selection created — two items; until combat ends";}
    else if(s.id==="flashbang"||s.id==="teargas") {await temporaryInjury(actor,"Damaged Eye");if(s.id==="flashbang")await temporaryInjury(actor,"Damaged Ear");s.summary="Temporary native injury effects: 1 minute; no bonus damage";}
    else if(s.id==="smoke") {
      const token=canvas.tokens?.placeables.find(t=>t.actor?.uuid===actor.uuid);if(!token||!canvas.scene)throw Error("Open the target scene to place smoke.");
      const grid=canvas.scene.grid,feet=["ft","feet","foot"].includes(String(grid.units).toLowerCase()),size=10*Number(grid.size)/(Number(grid.distance)*(feet?0.3048:1));
      await createSmoke(canvas.scene,{shape:"square",origin:canvas.grid!.getCenterPoint(token.center),direction:0,length:size,width:size},"instant:"+actor.uuid+":"+foundry.utils.randomID());s.summary="Smoke area created: 1 minute";
    }
    else if(s.id==="sleep"){await sleepTarget(actor);s.summary="Prone and Unconscious: 1 minute, damage, or a touching Action";}
    else if(s.id==="incendiary"){await igniteTarget(actor);s.summary="On fire: 2 HP at turn end; nonstacking; Action to extinguish";}
    s.state="applied";await save();
  }catch(error){s.state="review";await save();throw error;}
}
type Send=(req:InstantRequest)=>Promise<unknown>;
export async function rollInstant(s:InstantState,send:Send,rollMode="roll") {
  const nonce=foundry.utils.randomID();await send({action:"claim",nonce});let committed=false;
  try {
    const actor=await fromUuid(s.actor) as Actor|null;if(!actor)throw Error("Target unavailable.");
    const name=instantEffects[s.id].skill;
    const item=actor.items.find(i=>String(i.type)==="skill"&&i.name?.toLowerCase()===name.toLowerCase()) as RollItem|undefined;
    if(!item)throw Error(name+" skill is missing.");
    let roll=item.createRoll("skill",actor);
    if(!await roll.handleRollDialog({type:"pneuma-instant",ctrlKey:false,metaKey:false},actor,item))return;
    checkedLuck(Number(foundry.utils.getProperty(actor,"system.stats.luck.value")),0,roll.luck);
    roll=await item.confirmRoll(roll);await spendBonusLuck(actor,roll.luck);await rollHidden(roll);
    await send({action:"commit",nonce,total:roll.resultTotal,html:await nativeCard(roll)});committed=true;
    const {Dice}=await nativeAPI();for(const json of diceJSON(roll))await Dice.handle3dDice(Roll.fromJSON(json) as Roll,rollMode);
  }finally{if(!committed)await send({action:"release",nonce});}
}
export async function bindInstantControls(root:HTMLElement,state:(scope:string)=>InstantState|undefined,send:(scope:string,req:InstantRequest)=>Promise<unknown>,rollMode="roll") {
  for(const b of Array.from(root.querySelectorAll<HTMLButtonElement>("[data-instant-action]"))) {
    const scope=b.dataset.instantScope??"",s=state(scope),a=b.dataset.instantAction!;
    const actor=s?await fromUuid(s.actor) as Actor|null:null;
    if(!s||!actor||!game.user!.isGM&&(!actor.isOwner||["skip","reset","review"].includes(a))){b.remove();continue;}
    b.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();if(b.disabled)return;b.disabled=true;
      try {if(a==="roll")await rollInstant(s,req=>send(scope,req),rollMode);else await send(scope,{action:a});}
      catch(e){ui.notifications!.error((e as Error).message);}finally{b.disabled=false;}
    });
  }
}
interface EffectCard {effect:InstantState;rollMode:string}
export async function createInstantCard(actor:Actor,id:InstantId,source?:ChatMessage) {
  const data:EffectCard={effect:newInstant(id,actor.uuid,actor.name??""),rollMode:source?.blind?"blindroll":source?.whisper.length?"gmroll":"roll"};
  return ChatMessage.create({content:'<section class="rollcard pneuma-instant-card"><h3>'+esc(actor.name)+'</h3>'+instantContent(data.effect)+'</section>',speaker:ChatMessage.getSpeaker({actor}),whisper:source?.whisper??[],blind:source?.blind??false,flags:{[M]:{instant:data}}} as never);
}
interface Wire {instantType:"request"|"reply";id:string;message:string;user:string;request:InstantRequest;gm?:string;error?:string}
const pending=new Map<string,{resolve:()=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();let queue:Promise<unknown>=Promise.resolve();
async function handle(w:Wire) {
  const message=game.messages!.get(w.message) as ChatMessage|undefined,user=game.users!.get(w.user) as User|undefined;
  const saved=message&&foundry.utils.getProperty(message,"flags."+M+".instant") as EffectCard|undefined;
  if(!message||!user||!saved||!instantId(saved.effect.id))throw Error("Effect unavailable.");const data=foundry.utils.deepClone(saved);
  await handleInstant(data.effect,w.request,user,()=>message.update({content:'<section class="rollcard pneuma-instant-card"><h3>'+esc(data.effect.name)+'</h3>'+instantContent(data.effect)+'</section>',["flags."+M+".instant"]:data} as never),data.rollMode);
}
function send(message:string,request:InstantRequest) {
  requireCombatSocket();const gm=empGM();if(!gm)throw Error("An active GM is required.");
  const w:Wire={instantType:"request",id:foundry.utils.randomID(),message,user:game.user!.id!,request};
  if(game.user!.id===gm.id){const next=queue.catch(()=>{}).then(()=>handle(w));queue=next;return next;}
  return new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(w.id);reject(Error("Effect not confirmed by GM."));},30000);pending.set(w.id,{resolve,reject,timer});game.socket!.emit("module."+M,w);});
}
/** Persist the claim before creating a resistance card; never duplicate it on later chat updates. */
const microwavePending=new Set<string>();
export async function dispatchMicrowaver(message:ChatMessage) {
  const data=foundry.utils.getProperty(message,"flags."+M+".exchange") as {disableSource?:string;state?:string;hit?:boolean;defenderActor?:string}|undefined;
  if(game.user?.id!==empGM()?.id||data?.disableSource!=="microwaver"||data.state!=="resolved"||!data.hit||microwavePending.has(message.id!)||foundry.utils.getProperty(message,"flags."+M+".microwaverClaim"))return;
  microwavePending.add(message.id!);
  try {
    const actor=data.defenderActor?await fromUuid(data.defenderActor) as Actor|null:null;
    if(!actor)throw Error("Microwaver target is unavailable.");
    await message.update({["flags."+M+".microwaverClaim"]:true});
    await createInstantCard(actor,"microwaver",message);
  } catch(error) {ui.notifications!.error("Microwaver resistance card interrupted. Use Add effects > Microwaver to resolve manually. "+String(error));}
  finally {microwavePending.delete(message.id!);}
}
export function registerInstantEffects() {
  for(const hook of ["createChatMessage","updateChatMessage"])Hooks.on(hook,(message:ChatMessage)=>{void dispatchMicrowaver(message);});
  registerEffectEvents();
  registerInstantLifetimes();
  Hooks.once("ready",()=>{
    const module=game.modules!.get(M) as unknown as {api?:Record<string,unknown>};module.api={...module.api,instantEffects:{catalog:instantEffects,create:createInstantCard}};
    game.socket!.on("module."+M,(w:Wire)=>{if(w?.instantType==="request"&&game.user?.id===empGM()?.id){const next=queue.catch(()=>{}).then(()=>handle(w));queue=next;void next.then(()=>game.socket!.emit("module."+M,{...w,instantType:"reply",gm:game.user!.id}),e=>game.socket!.emit("module."+M,{...w,instantType:"reply",gm:game.user!.id,error:(e as Error).message}));}
      else if(w?.instantType==="reply"&&w.user===game.user?.id&&w.gm===empGM()?.id){const p=pending.get(w.id);if(!p)return;clearTimeout(p.timer);pending.delete(w.id);if(w.error)p.reject(Error(w.error));else p.resolve();}
    });
  });
  Hooks.on("renderChatMessage",(message:ChatMessage,html:JQuery)=>{const data=foundry.utils.getProperty(message,"flags."+M+".instant") as EffectCard|undefined;if(!data||!canRenderCombatCard(message)||!html[0])return;void bindInstantControls(html[0],()=>data.effect,(_scope,req)=>send(message.id!,req),data.rollMode);});
}
