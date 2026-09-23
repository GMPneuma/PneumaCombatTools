import type {EmpMethod} from "./emp-behavior.js";
import {effectDuration,durationExpired,type EffectDuration} from "./effect-duration.js";
import {registerNativeWrapper} from "./native-wrappers.js";
import {EMP_MODULE as MODULE, empReferences, empDisabled, type EmpItem, type EmpPolicy, type EmpRandom, type DisableSource, timedDisables, activeDisables, disableLabel, empHardened, internalFrame, eligibleEmpItems, expandEmp, randomEmp} from "./emp-rules.js";
export {empDisabled};
export interface EmpRequest { id: string; actor: string; count: number; chooser: "gm" | "player" | "random"; mode: EmpRandom; policy: EmpPolicy; state: "pending" | "applied"; selected?: string[]; affectedNames?: string[]; message?: string; source?:DisableSource; sourceActor?:string; seconds?:number; duration?:EffectDuration; origin?:string; method?:EmpMethod; offered?:string[]; selectedNames?:string[]; resistedNames?:string[] }
export interface EmpRecord {actor: string; items: string[]; timed?:boolean}
const path = `flags.${MODULE}`;
export const empGM = () => game.users?.filter(u => u.active && u.isGM).sort((a,b) => a.id!.localeCompare(b.id!))[0];
export const empRequests = (combat: Combat) => foundry.utils.getProperty(combat, `${path}.empRequests`) as Record<string,EmpRequest> | undefined ?? {};
export const empRecords = (combat: Combat) => foundry.utils.getProperty(combat, `${path}.empRecords`) as Record<string,EmpRecord> | undefined ?? {};
let queue: Promise<unknown> = Promise.resolve();
export function empWork<T>(operation: () => Promise<T>): Promise<T> {const next = queue.catch(() => {}).then(operation); queue = next; return next;}
export const empRandomSelection=(request:EmpRequest)=>request.chooser==="random"||!!request.method&&!["manual","shortlist"].includes(request.method);
export function empSelectionPool<T extends EmpItem>(request:EmpRequest,all:T[]):T[] {
  const eligible=eligibleEmpItems(all,request.policy,request.source);
  return request.method==="shortlist"?eligible.filter(item=>request.offered?.includes(item.id!)):eligible;
}
const itemsFor = (actor: Actor) => Array.from(actor.items) as unknown as (Item & EmpItem)[];
export async function applyEmpSelection(combat: Combat, requestId: string, selected: string[], user: User): Promise<void> {
  if (empGM()?.id !== game.user?.id || !combat.started) throw Error("EMP requires a started combat and an active GM.");
  const request = empRequests(combat)[requestId];
  if (!request) throw Error("EMP selection is unavailable.");
  const actor = await fromUuid(request.actor) as Actor | null;
  const chooser=request.sourceActor?await fromUuid(request.sourceActor) as Actor|null:actor;
  if (!actor || (!user.isGM && (request.chooser !== "player" || !chooser?.testUserPermission(user,"OWNER")))) throw Error("You cannot resolve this EMP selection.");
  if (request.state === "applied") return;
  const all=itemsFor(actor),eligible=empSelectionPool(request,all);
  const random=empRandomSelection(request);
  const chosen=request.selected?all.filter(i=>request.selected!.includes(i.id!)):random
    ?randomEmp(eligible,all,request.count,request.mode,Math.random,!!request.policy.skipAffected&&request.policy.cascade)
    :eligible.filter(i=>selected.includes(i.id!));
  if(!request.selected&&(new Set(selected).size!==selected.length||!random&&(chosen.length!==Math.min(request.count,eligible.length)||chosen.length!==selected.length)))
    throw Error("Choose "+Math.min(request.count,eligible.length)+" currently eligible items.");
  if (!chosen.length) throw Error("No eligible cyberware or carried electronics.");
  // Save the exact draw before writes: retries must not select a second set of items.
  if (!request.selected) {
    await combat.update({[`${path}.empRequests.${request.id}.selected`]:chosen.map(i => i.id!)});
  }
  const resisted=request.policy.hardened&&(request.source===undefined||request.source==="emp"||request.source==="microwaver")?chosen.filter(i=>empHardened(i,all)):[];
  const effective=chosen.filter(i=>!resisted.includes(i));
  const affected = expandEmp(effective,all,request.policy.cascade);
  const duration=request.seconds?(request.duration??effectDuration(request.seconds)):undefined;
  if(duration&&!request.duration)await combat.update({[path+".empRequests."+request.id+".duration"]:duration});
  await combat.update({[`${path}.empRecords.${request.id}`]:{actor:actor.uuid,items:affected.map(i => i.id!),...(duration?{timed:true}:{})}});
  for (const item of affected) {
    if(duration){
      await item.update({[path+".timedDisables."+request.id]:{source:request.source??"emp",label:disableLabel(request.source),duration}} as never);
      await syncDisableMarker(item);
    }else {
    const refs = [...new Set([...empReferences(item),combat.id!])];
    await item.update({[`${path}.empCombats`]:refs,[`${path}.itemMarkers.emp`]:{label:"Disabled — EMP",description:"Disabled until combat ends."}} as never);
    }
    if (String(item.type) === "cyberware" && item.system.isFoundational && ["cyberArm","cyberLeg"].includes(item.system.type ?? "")) {
      if (!actor.effects.some(e => foundry.utils.getProperty(e,path+".empItem") === item.id && (duration?foundry.utils.getProperty(e,path+".disableRequest")===request.id:foundry.utils.getProperty(e,path+".empCombat")===combat.id&&!foundry.utils.getProperty(e,path+".disableRequest")))) {
        await actor.createEmbeddedDocuments("ActiveEffect",[{name:`${disableLabel(request.source)}: ${item.name} Disabled`,img:`systems/cyberpunk-red-core/icons/compendium/status/broken_${item.system.type === "cyberArm" ? "arm" : "leg"}.svg`,statuses:["pneuma-emp-limb"],changes:[],...(duration?{duration}:{}),flags:{[MODULE]:{empItem:item.id,empCombat:combat.id,...(duration?{disableRequest:request.id}:{}),disableSource:request.source??"emp"}}}] as never);
      }
    }
  }
  for(const item of affected.filter(internalFrame))if((request.policy.frameNoMove||request.policy.framePenalty||request.policy.frameMoveReduction)&&!actor.effects.some(e=>foundry.utils.getProperty(e,path+".frameRequest")===request.id&&foundry.utils.getProperty(e,path+".empItem")===item.id)){
    await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Internal Frame Disabled",img:"icons/svg/lightning.svg",changes:[],...(duration?{duration}:{}),flags:{[MODULE]:{empItem:item.id,empCombat:combat.id,frameRequest:request.id,frameMoveReduction:request.policy.frameMoveReduction??0,frameNoMove:!!request.policy.frameNoMove,framePenalty:request.policy.framePenalty??0,...(duration?{disableRequest:request.id}:{})}}}] as never);
  }
  await syncDisabledLimbs(actor);
  await combat.update({[`${path}.empRequests.${request.id}.state`]:"applied",[`${path}.empRequests.${request.id}.affectedNames`]:affected.map(item=>item.name??"Item"),[path+".empRequests."+request.id+".selectedNames"]:effective.map(item=>item.name??"Item"),[path+".empRequests."+request.id+".resistedNames"]:resisted.map(item=>item.name??"Item")});
}
async function removeReferences(actor: Actor, combatId: string, ids?: string[]) {
  for (const item of actor.items) {
    if (ids && !ids.includes(item.id!)) continue;
    if (!empReferences(item).includes(combatId)) continue;
    const refs = empReferences(item).filter(id => id !== combatId);
    await item.update({[`${path}.empCombats`]:refs,...(!refs.length ? {[`${path}.itemMarkers.-=emp`]:null} : {})} as never);
  }
  const effects = actor.effects.filter(e => foundry.utils.getProperty(e,path+".empCombat") === combatId&&!foundry.utils.getProperty(e,path+".disableRequest"));
  if (effects.length) await actor.deleteEmbeddedDocuments("ActiveEffect",effects.map(e => e.id!));
  await syncDisabledLimbs(actor);
}
export async function finishEmp(combat: Combat, deleted = false) {
  for (const record of Object.values(empRecords(combat))) {
    const actor = await fromUuid(record.actor) as Actor | null;
    if (actor&&!record.timed) await removeReferences(actor,combat.id!,record.items);
  }
  if (!deleted) await combat.update({[`${path}.empRecords`]:null,[`${path}.empRequests`]:null} as never);
}
export async function reconcileEmp() {
  // One startup pass also cleans stale markers if a combat was deleted while this module was unavailable.
  const actors = new Map<string,Actor>();
  for (const actor of game.actors ?? []) actors.set(actor.uuid,actor);
  for (const scene of game.scenes ?? []) for (const token of scene.tokens) if (token.actor) actors.set(token.actor.uuid,token.actor);
  for (const actor of actors.values()) {
    await expireDisablements(actor);
    const refs = new Set(Array.from(actor.items).flatMap(empReferences));
    for (const effect of actor.effects) {const id=foundry.utils.getProperty(effect,`${path}.empCombat`);if (typeof id === "string"&&!foundry.utils.getProperty(effect,`${path}.disableRequest`)) refs.add(id);}
    for (const id of refs) if (!game.combats?.get(id)?.started) await removeReferences(actor,id);
  }
  for (const combat of game.combats ?? []) {
    if (!combat.started) {if (Object.keys(empRecords(combat)).length) await finishEmp(combat);continue;}
    for (const request of Object.values(empRequests(combat))) if (request.selected && request.state === "pending") await applyEmpSelection(combat,request.id,request.selected,game.user!);
  }
}
/** Reuse CPR suppression, preserving every native effect's disabled state and item installation. */
export async function installEmpNativeGuards() {
  const effect = CONFIG.ActiveEffect.documentClass.prototype as ActiveEffect & {determineSuppression():void;system:{isSuppressed:boolean}};
  registerNativeWrapper(effect,"determineSuppression",function(wrapped,...args) {const result=wrapped(...args);if (this.parent instanceof Item && empDisabled(this.parent)) this.system.isSuppressed = true;return result;},"WRAPPER");
  const modulePath = "/systems/cyberpunk-red-core/modules/item/cpr-item.js";
  const native = (await import(modulePath)).default.prototype as Item & {createRoll(...args:unknown[]):unknown;confirmRoll(...args:unknown[]):unknown};
  for (const method of ["createRoll","confirmRoll"] as const) {
    registerNativeWrapper(native,method,function(wrapped,...args) {
      if (empDisabled(this)) {ui.notifications!.warn(`${this.name}: temporarily disabled (${activeDisables(this).map(e=>e.label).join(", ")||"EMP"}).`);throw Error("Item disabled by EMP or cyberware malfunction.");}
      return wrapped(...args);
    },"MIXED");
  }
}

/** One display marker; the independent causes remain authoritative. */
export async function syncDisableMarker(item:Item) {
  const labels=[...new Set(activeDisables(item).map(e=>e.label))];
  const old=foundry.utils.getProperty(item,path+".itemMarkers.cyberware");
  if(labels.length)await item.update({[path+".itemMarkers.cyberware"]:{label:"Disabled — "+labels.join(", "),description:"Temporarily inoperable; restores when all disabling effects expire."}} as never);
  else if(old)await item.update({[path+".itemMarkers.-=cyberware"]:null} as never);
}
/** Apply functional limb consequences without importing a physical injury or stacking repeated hits. */
export async function syncDisabledLimbs(actor:Actor) {
  await syncDisabledFrames(actor);
  const legs=Array.from(actor.items).filter(item=>String(item.type)==="cyberware"&&foundry.utils.getProperty(item,"system.type")==="cyberLeg"&&foundry.utils.getProperty(item,"system.isFoundational")&&(foundry.utils.getProperty(item,"system.isInstalledInActor")??foundry.utils.getProperty(item,"system.isInstalled"))&&empDisabled(item));
  const severity=Math.max(0,...legs.map(item=>empReferences(item).some(id=>game.combats?.get(id)?.started)||activeDisables(item).some(e=>e.source!=="cyberware-malfunction")?6:4));
  const old=actor.effects.find(e=>foundry.utils.getProperty(e,path+".disabledLegPenalty"));
  const injuryPenalty=Array.from(actor.items).reduce((n,i)=>String(i.type)==="criticalInjury"?Math.max(n,i.name==="Dismembered Leg"?6:i.name==="Broken Leg"?4:0):n,0);
  const amount=Math.max(0,severity-injuryPenalty);
  if(!amount){if(old)await actor.deleteEmbeddedDocuments("ActiveEffect",[old.id!]);return;}
  const data={name:"Disabled Cyberleg — MOVE penalty",img:"systems/cyberpunk-red-core/icons/compendium/status/broken_leg.svg",changes:[{key:"system.stats.move.value",mode:2,value:String(-amount),priority:20},{key:"system.stats.move.value",mode:4,value:"1",priority:21}],flags:{[MODULE]:{disabledLegPenalty:true}}};
  if(old){if(old.changes?.[0]?.value!==String(-amount))await old.update(data as never);}else await actor.createEmbeddedDocuments("ActiveEffect",[data] as never);
}
export async function expireDisablements(actor:Actor) {
  for(const item of actor.items){
    const changes:Record<string,unknown>={};
    for(const [id,effect] of Object.entries(timedDisables(item)))if(durationExpired(effect.duration))changes[path+".timedDisables.-="+id]=null;
    if(Object.keys(changes).length){await item.update(changes as never);await syncDisableMarker(item);}
  }
  const stale=actor.effects.filter(effect=>{
    const id=foundry.utils.getProperty(effect,path+".disableRequest"),itemId=foundry.utils.getProperty(effect,path+".empItem");
    return typeof id==="string"&&!Array.from(actor.items).some(item=>item.id===itemId&&timedDisables(item)[id]&&!durationExpired(timedDisables(item)[id]!.duration));
  });
  if(stale.length)await actor.deleteEmbeddedDocuments("ActiveEffect",stale.map(e=>e.id!));
  await syncDisabledLimbs(actor);
}
export async function sweepDisablements() {
  const actors=new Map<string,Actor>();for(const a of game.actors??[])actors.set(a.uuid,a);for(const scene of game.scenes??[])for(const t of scene.tokens)if(t.actor)actors.set(t.actor.uuid,t.actor);
  for(const actor of actors.values())await expireDisablements(actor);
}

/** Aggregate overlapping frame consequences; retain the strongest penalty only. */
export function disabledFrameConsequences(actor:Actor):{noMove:boolean;penalty:number;moveReduction:number} {
  const markers=actor.effects.filter(e=>{
    const flags=foundry.utils.getProperty(e,path) as {frameRequest?:string;empItem?:string;empCombat?:string;disableRequest?:string}|undefined;
    if(!flags?.frameRequest)return false;
    const item=actor.items.get(flags.empItem??"");
    return !!item&&empDisabled(item)&&(flags.disableRequest?activeDisables(item).includes(timedDisables(item)[flags.disableRequest]!):!!game.combats?.get(flags.empCombat??"")?.started);
  });
  return {moveReduction:Math.max(0,...markers.map(e=>Number(foundry.utils.getProperty(e,path+".frameMoveReduction"))||0)),noMove:markers.some(e=>!!foundry.utils.getProperty(e,path+".frameNoMove")),penalty:Math.max(0,...markers.map(e=>Number(foundry.utils.getProperty(e,path+".framePenalty"))||0))};
}
async function syncDisabledFrames(actor:Actor) {
  const {noMove,penalty,moveReduction}=disabledFrameConsequences(actor);
  const old=actor.effects.find(e=>foundry.utils.getProperty(e,path+".frameConsequences"));
  const changes=[...(noMove?[{key:"system.stats.move.value",mode:5,value:"0",priority:100}]:moveReduction?[{key:"system.stats.move.value",mode:2,value:String(-moveReduction),priority:20},{key:"system.stats.move.value",mode:4,value:"0",priority:99}]:[]),...(penalty?[{key:"bonuses.allActions",mode:2,value:String(-penalty),priority:20}]:[])];
  if(!changes.length){if(old)await actor.deleteEmbeddedDocuments("ActiveEffect",[old.id!]);return;}
  const data={name:"Disabled Internal Frame",img:"icons/svg/lightning.svg",changes,flags:{[MODULE]:{frameConsequences:true}}};
  if(old){if(JSON.stringify(old.changes)!==JSON.stringify(changes))await old.update(data as never);}else await actor.createEmbeddedDocuments("ActiveEffect",[data] as never);
}
export function frameMovementBlocked(actor:Actor| null|undefined,changes:Record<string,unknown>,isGM:boolean):boolean {
  return !isGM&&!!actor&&["x","y","elevation"].some(k=>k in changes)&&disabledFrameConsequences(actor).noMove;
}
