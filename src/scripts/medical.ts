import {sceneEncounter} from "./encounter.js";
import {allActors,escapeHTML,primaryGM} from "./shared.js";
import {findNativeItem} from "./native-lookup.js";
import {nativeCard,spendBonusLuck,type RollItem} from "./native-combat.js";
import {checkedLuck} from "./evasion-rules.js";
import {statusAuthority,syncActorStatuses} from "./status-sync.js";
import {masterStatuses} from "./status-catalog.js";
import {requireCombatSocket} from "./socket-health.js";
import {postTreatment} from "./treatment-card.js";

declare global {interface SettingConfig {"pneuma-combattools.enableStabilization":boolean}}
const M="pneuma-combattools",STATUS="pneuma-needs-stabilization",DAY=86400;
const get=(doc:object,path:string)=>foundry.utils.getProperty(doc,path);
export const medicalEnabled=()=>!!game.settings?.get(M,"enableStabilization");
export const needsStabilization=(actor:Actor)=>actor.effects.some(effect=>!effect.disabled&&effect.statuses.has(STATUS));
export const medicalHP=(actor:Actor)=>Number(get(actor,"system.derivedStats.hp.value"));
const maximum=(actor:Actor)=>Number(get(actor,"system.derivedStats.hp.max"));
export const stabilizationDV=(actor:Actor)=>medicalHP(actor)<1?15:medicalHP(actor)<Math.ceil(maximum(actor)/2)?13:10;
const medtech=(actor:Actor)=>Number(get(findNativeItem(actor.items,"Medtech")??{},"system.rank"))>0;
const dose=(actor:Actor)=>Array.from(actor.items).find(item=>String(item.type)==="drug"&&findNativeItem([item],"Speedheal")&&Number(get(item,"system.amount"))>0);
const hasSpeedheal=(actor:Actor)=>actor.effects.some(effect=>!effect.disabled&&(effect.statuses.has("speedheal")||effect.statuses.has(masterStatuses.find(status=>status.name==="Speed Heal")!.id)));
export const quickFixed=(item:Item)=>!!get(item,`flags.${M}.quickFix`);
interface Choice {name:string;item:RollItem;dv:number}
function skills(actor:Actor,injury?:Item):Choice[] {
  return ["First Aid","Paramedic"].flatMap(name=>{
    const item=findNativeItem(actor.items,name) as RollItem|undefined;
    const dv=injury?Number(get(injury,"system.quickFix."+(name==="First Aid"?"dvFirstAid":"dvParamedic"))):0;
    return item&&String(item.type)==="skill"&&(!injury||dv>0)?[{name,item,dv}]:[];
  });
}
export interface MedicalEntry {action:string;label:string;item?:string;skill?:string;disabled?:boolean;title?:string}
export function medicalEntries(source:Actor|undefined,target:Actor|undefined):MedicalEntry[] {
  if(!target||!["character","mook"].includes(String(target.type)))return [];
  const dead=masterStatuses.find(status=>status.name==="Dead")?.id;
  const unavailable=target.effects.some(effect=>!effect.disabled&&(effect.statuses.has("dead")||!!dead&&effect.statuses.has(dead)));
  const rows:MedicalEntry[]=needsStabilization(target)?[{action:"stabilize",label:"Stabilize — DV"+stabilizationDV(target),disabled:unavailable||!source||!skills(source).length,title:!source?"Select a character to provide medical care":"Action; First Aid or Paramedic"}]:[];
  if(source&&!unavailable&&medtech(source)) {
    if(medicalHP(target)<maximum(target)&&dose(source))rows.push({action:"speedheal",label:"SpeedHeal",disabled:medicalHP(target)<1||hasSpeedheal(target),title:"BODY + WILL HP; Speed Heal status blocks reuse until combat ends; cannot heal Mortally Wounded"});
    for(const injury of target.items.filter(item=>String(item.type)==="criticalInjury"&&!quickFixed(item)&&skills(source,item).length>0))
      for(const choice of skills(source,injury))rows.push({action:"quickFix",item:injury.id!,skill:choice.name,label:injury.name+" — "+choice.name+" DV"+choice.dv,title:"Quick Fix: 1 minute; use the injury's native skill and DV"});
  }
  return rows;
}
/** Every real character/token HP decrease is eligible, including native and direct damage. */
const damageWork=new Map<string,Promise<void>>();
export async function markMedicalDamage(actor:Actor,before:number):Promise<void> {
  const key=actor.uuid;
  const next=(damageWork.get(key)??Promise.resolve()).catch(()=>{}).then(async()=>{
    if(!medicalEnabled()||!["character","mook"].includes(String(actor.type))||!(medicalHP(actor)<before))return;
    if(!needsStabilization(actor))await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Needs Stabilization",img:"icons/svg/regen.svg",statuses:[STATUS],changes:[]}]);
  });
  damageWork.set(key,next);
  try{await next;}finally{if(damageWork.get(key)===next)damageWork.delete(key);}
}
interface Request {medicalType:"request";id:string;user:string;source:string;target:string;action:string;item?:string;skill?:string;total?:number;hp:number}
interface Reply {medicalType:"reply";id:string;user:string;gm:string;error?:string}
let work:Promise<unknown>=Promise.resolve();
export function resolveMedical(request:Request):Promise<void> {
  const next=work.catch(()=>{}).then(()=>applyMedical(request));work=next;return next;
}
async function applyMedical(req:Request):Promise<void> {
  if(game.user?.id!==primaryGM()?.id)throw Error("An active GM is required.");
  const user=game.users?.get(req.user) as User|undefined,source=await fromUuid(req.source as Parameters<typeof fromUuid>[0]) as TokenDocument|null,target=await fromUuid(req.target as Parameters<typeof fromUuid>[0]) as TokenDocument|null;
  if(!user||!source?.actor||!target?.actor||!user.isGM&&!source.actor.testUserPermission(user,"OWNER"))throw Error("Choose a character you control and a patient.");
  if(source.parent?.id!==target.parent?.id)throw Error("Both characters must be in the same scene.");
  const grid=source.parent?.grid,size=Number(grid?.size);
  if(source.uuid!==target.uuid&&size>0&&Math.max(Math.abs(source.x-target.x),Math.abs(source.y-target.y))>size)throw Error("Move next to the patient first.");
  const healer=source.actor,patient=target.actor;
  if(!medicalEntries(healer,patient).some(row=>row.action===req.action&&row.item===req.item&&!row.disabled))throw Error("This medical action is no longer available.");
  if(medicalHP(patient)!==req.hp)throw Error("Patient HP changed. Reopen Medical and try again.");
  if(req.action==="speedheal") {
    const stock=dose(healer)!;
    const amount=Number(get(patient,"system.stats.body.value"))+Number(get(patient,"system.stats.will.value"));
    if(!Number.isFinite(amount)||amount<=0)throw Error("Patient BODY/WILL are unavailable.");
    // Mark the patient before consuming stock so partial failures cannot grant a second dose.
    const status=masterStatuses.find(status=>status.name==="Speed Heal")!;
    const encounter=sceneEncounter(target.parent?.id);
    const combat=encounter?.combatants.some(row=>row.token?.uuid===target.uuid)?encounter:undefined;
    await patient.createEmbeddedDocuments("ActiveEffect",[{name:status.name,img:status.img,statuses:[status.id],changes:[],...(combat?{flags:{[M]:{endWithCombat:combat.id}}}:{})}] as never);
    await stock.update({"system.amount":Number(get(stock,"system.amount"))-1} as never);
    await patient.update({"system.derivedStats.hp.value":Math.min(maximum(patient),medicalHP(patient)+amount)} as never);
  }else if(req.action==="stabilize") {
    if(!Number.isFinite(req.total)||req.total!<=stabilizationDV(patient))return;
    if(medicalHP(patient)<1) {
      await patient.update({"system.derivedStats.hp.value":1} as never);
      const status=masterStatuses.find(s=>s.name==="Unconscious")!;
      if(!patient.effects.some(e=>!e.disabled&&e.statuses.has(status.id)))await patient.createEmbeddedDocuments("ActiveEffect",[{name:"Unconscious",img:status.img,statuses:[status.id],changes:[],duration:{seconds:60,startTime:game.time!.worldTime}}] as never);
    }
    await patient.deleteEmbeddedDocuments("ActiveEffect",patient.effects.filter(e=>e.statuses.has(STATUS)).map(e=>e.id!));
  }else if(req.action==="quickFix") {
    const injury=patient.items.get(req.item!)!,options=skills(healer,injury);
    if(!Number.isFinite(req.total)||!options.some(option=>option.name===req.skill&&req.total!>option.dv))return;
    if(get(injury,"system.treatment.type")==="quickFix") {
      const markers=patient.effects.filter(e=>e.origin===injury.uuid||e.statuses.has(masterStatuses.find(s=>s.binding?.itemId===injury.id)?.id??""));
      await patient.deleteEmbeddedDocuments("Item",[injury.id!]);
      if(markers.length)await patient.deleteEmbeddedDocuments("ActiveEffect",markers.map(e=>e.id!));
    }else {
      const encounter=sceneEncounter(target.parent?.id);
      const saved={combat:encounter?.combatants.some(row=>row.token?.uuid===target.uuid)?encounter.id:null,expires:game.time!.worldTime+DAY,effects:injury.effects.filter(e=>!e.disabled).map(e=>e.id!),deathSave:get(injury,"system.deathSaveIncrease")};
      await injury.update({[`flags.${M}.quickFix`]:saved,"system.deathSaveIncrease":false} as never);
      if(saved.effects.length)await injury.updateEmbeddedDocuments("ActiveEffect",saved.effects.map(_id=>({_id,disabled:true})));
      const status=masterStatuses.find(s=>s.name==="Quick Fix")!;
      await patient.createEmbeddedDocuments("ActiveEffect",[{name:"Quick Fix — "+injury.name,img:status.img,statuses:[status.id],changes:[],origin:injury.uuid}] as never);
    }
    await syncActorStatuses(patient);
  }
}
const pending=new Map<string,{resolve:()=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
async function send(req:Request) {
  requireCombatSocket();const gm=primaryGM();if(!gm)throw Error("An active GM is required.");
  if(game.user!.id===gm.id)return resolveMedical(req);
  return new Promise<void>((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(req.id);reject(Error("Medical action not confirmed. Check the patient and inventory before retrying."));},30000);
    pending.set(req.id,{resolve,reject,timer});game.socket!.emit("module."+M,req);
  });
}
export async function performMedical(source:Token,target:Token,action:string,itemId?:string,skipDialog=false,selectedSkill?:string) {
  if(!source.actor?.isOwner||!target.actor)throw Error("Select a character you control.");
  const row=medicalEntries(source.actor,target.actor).find(row=>row.action===action&&row.item===itemId&&(!selectedSkill||row.skill===selectedSkill)&&!row.disabled);
  if(!row)throw Error("Medical action unavailable.");
  const gridSize=Number(source.document.parent?.grid.size);
  if(source.document.parent?.id!==target.document.parent?.id||source.document.uuid!==target.document.uuid&&gridSize>0&&Math.max(Math.abs(source.document.x-target.document.x),Math.abs(source.document.y-target.document.y))>gridSize)throw Error("Move next to the patient first.");
  const hp=medicalHP(target.actor);let total:number|undefined,html="",dv=0,skill:string|undefined;
  if(action!=="speedheal") {
    const choices=skills(source.actor,itemId?target.actor.items.get(itemId):undefined).filter(choice=>!selectedSkill||choice.name===selectedSkill);
    const choice=choices.length===1?choices[0]:await Dialog.prompt({title:row.label,content:'<select name="medicalSkill">'+choices.map((c,i)=>'<option value="'+i+'">'+escapeHTML(c.name)+(c.dv?' — DV'+c.dv:'')+'</option>').join('')+'</select>',label:"Roll",rejectClose:false,callback:html=>choices[Number(html[0]!.querySelector<HTMLSelectElement>('select')!.value)]});
    if(!choice)return;
    skill=choice.name;
    dv=action==="stabilize"?stabilizationDV(target.actor):choice.dv;
    let roll=choice.item.createRoll("skill",source.actor);roll.rollTitle=row.label+" — DV"+dv;
    if(!await roll.handleRollDialog({type:"pneuma-medical",ctrlKey:skipDialog,metaKey:false},source.actor,choice.item))return;
    checkedLuck(Number(get(source.actor,"system.stats.luck.value")),0,roll.luck);
    roll=await choice.item.confirmRoll(roll);await spendBonusLuck(source.actor,roll.luck);await roll.roll();total=roll.resultTotal;html=await nativeCard(roll);
  }
  await send({medicalType:"request",id:foundry.utils.randomID(),user:game.user!.id!,source:source.document.uuid,target:target.document.uuid,action,item:itemId,skill,total,hp});
  await postTreatment(source,target,row.label,html,total,dv);
}
export async function expireQuickFixes(combat?:Combat) {
  for(const actor of allActors())if(statusAuthority(actor))for(const item of actor.items) {
    const saved=get(item,`flags.${M}.quickFix`) as {combat?:string|null;expires:number;effects:string[];deathSave:boolean}|undefined;
    if(!saved)continue;
    const ended=combat&&(saved.combat===combat.id||!saved.combat&&combat.combatants.some(row=>row.actor?.uuid===actor.uuid));
    if(!ended&&saved.expires>game.time!.worldTime)continue;
    await item.update({[`flags.${M}.-=quickFix`]:null,"system.deathSaveIncrease":saved.deathSave} as never);
    const effects=saved.effects.filter(id=>item.effects.has(id));
    if(effects.length)await item.updateEmbeddedDocuments("ActiveEffect",effects.map(_id=>({_id,disabled:false})));
    const markers=actor.effects.filter(e=>e.origin===item.uuid&&e.name?.startsWith("Quick Fix"));
    if(markers.length)await actor.deleteEmbeddedDocuments("ActiveEffect",markers.map(e=>e.id!));
    await syncActorStatuses(actor);
  }
}
export function registerMedical() {
  game.settings!.register(M,"enableStabilization",{name:"Enable Stabilization Function",hint:"Automatically apply Needs Stabilization after character/token HP loss. Medical actions are always available.",scope:"world",config:true,type:Boolean,default:false});
  const previousHP=new Map<string,number>();
  const remember=(actor:Actor)=>previousHP.set(actor.uuid,medicalHP(actor));
  Hooks.on("createActor",remember);Hooks.on("createToken",(token:TokenDocument)=>{if(token.actor)remember(token.actor);});
  Hooks.on("deleteActor",(actor:Actor)=>previousHP.delete(actor.uuid));
  Hooks.on("canvasReady",()=>{for(const actor of allActors())remember(actor);});
  Hooks.on("preUpdateActor",(actor:Actor,changes:object,options:Record<string,unknown>)=>{remember(actor);const next=get(changes,"system.derivedStats.hp.value")??(changes as Record<string,unknown>)["system.derivedStats.hp.value"];if(next!==undefined&&Number(next)<medicalHP(actor))options.pneumaMedicalHP=medicalHP(actor);});
  Hooks.on("updateActor",(actor:Actor,_changes:object,options:Record<string,unknown>)=>{
    const before=options.pneumaMedicalHP??previousHP.get(actor.uuid);remember(actor);
    if(before!==undefined&&statusAuthority(actor))void markMedicalDamage(actor,Number(before)).catch(error=>ui.notifications!.error(String(error)));
    const hud=canvas.tokens?.hud;if(hud?.object?.actor?.uuid===actor.uuid)hud.render(true);
  });
  const expire=()=>void expireQuickFixes().catch(error=>ui.notifications!.error(String(error)));
  Hooks.on("updateWorldTime",expire);
  Hooks.on("pneumaCombatCleanupFinished",(combat:Combat)=>{void expireQuickFixes(combat).catch(error=>ui.notifications!.error(String(error)));});
  Hooks.once("ready",()=>{
    for(const actor of allActors())remember(actor);
    expire();game.socket!.on("module."+M,(wire:Request|Reply)=>{
      if(wire?.medicalType==="request"&&game.user?.id===primaryGM()?.id)void resolveMedical(wire).then(()=>game.socket!.emit("module."+M,{medicalType:"reply",id:wire.id,user:wire.user,gm:game.user!.id}),error=>game.socket!.emit("module."+M,{medicalType:"reply",id:wire.id,user:wire.user,gm:game.user!.id,error:String(error.message??error)}));
      if(wire?.medicalType==="reply"&&wire.user===game.user?.id&&wire.gm===primaryGM()?.id){const entry=pending.get(wire.id);if(!entry)return;clearTimeout(entry.timer);pending.delete(wire.id);if(wire.error)entry.reject(Error(wire.error));else entry.resolve();}
    });
  });
}
