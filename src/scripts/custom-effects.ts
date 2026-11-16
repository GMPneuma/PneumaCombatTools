import {actorEncounter} from "./encounter.js";
import {type EffectDuration} from "./effect-duration.js";
const MODULE = "pneuma-combattools";
export interface EffectStatus {id:string;name:string;img:string;effectUuid?:string;color?:string}
const creationFlags=["createdByCombatTools","syncMarker","suppressionSource","coverSource","grappleId","speedhealOperation","quickhackEffect","empStatus","frameConsequences","disabledLegPenalty"];
/** Shared by attribution and removal; native Item effects are never inferred by name. */
export function isCombatToolsEffect(effect:ActiveEffect,customs:EffectStatus[]=game.settings!.get(MODULE,"customStatuses")??[]):boolean {
  if(effect.description?.includes("Created by Pneuma Combat Tools.")||creationFlags.some(key=>foundry.utils.getProperty(effect,"flags."+MODULE+"."+key)))return true;
  if(!(effect.parent instanceof Actor))return false;
  return customs.some(status=>effect.statuses.has(status.id)||effect.name===status.name);
}
const statusToggles=new WeakMap<Actor,Promise<unknown>>();
/** Separate from actor mutation locks: damage workflows can already hold that lock. */
export function queueStatusToggle<T>(actor:Actor,run:()=>Promise<T>):Promise<T> {
  const next=(statusToggles.get(actor)??Promise.resolve()).catch(()=>{}).then(run);
  statusToggles.set(actor,next);
  void next.finally(()=>{if(statusToggles.get(actor)===next)statusToggles.delete(actor);}).catch(()=>{});
  return next;
}
export function freshStatusDuration(actor:Actor,duration:EffectDuration={}) {
  const fresh={seconds:duration.seconds??null,rounds:duration.rounds??null,turns:duration.turns??null,startTime:game.time!.worldTime,startRound:null as number|null,startTurn:null as number|null,combat:null as string|null};
  if(typeof duration.seconds==="number")return fresh;
  if(typeof duration.rounds!=="number"&&typeof duration.turns!=="number")return fresh;
  const combat=actorEncounter(actor);
  if(combat?.started)return {...fresh,combat:combat.id!,startRound:combat.round??0,startTurn:combat.turn??0};
  if((duration.turns??0)>0)throw Error("A turn-based status effect requires the actor to participate in an active combat.");
  return {...fresh,seconds:(duration.rounds??0)*3,rounds:null,turns:null};
}
export function markCombatToolsEffect<T extends {flags?:object}>(data:T):T {
  const flags=data.flags as Record<string,object>|undefined;
  data.flags={...flags,[MODULE]:{...flags?.[MODULE],createdByCombatTools:true}};
  return data;
}
const normalized=(name:string)=>game.i18n!.localize(name).trim().toLowerCase();
/** Read owned documents on every toggle, including disabled effects. */
export function matchingStatusEffects(actor:Actor,ids:string[],name:string):ActiveEffect[] {
  const effects=new Set<ActiveEffect>([
    ...actor.effects,
    ...Array.from(actor.items).flatMap(item=>Array.from(item.effects).filter(effect=>effect.transfer!==false))
  ]);
  const byId=Array.from(effects).filter(effect=>ids.some(id=>effect.statuses.has(id)));
  return byId.length?byId:Array.from(effects).filter(effect=>normalized(effect.name??"")===normalized(name));
}
export async function toggleExistingEffects(effects:ActiveEffect[],ids:string[],requested?:boolean):Promise<boolean> {
  const active=requested??!effects.some(effect=>!effect.disabled&&!effect.isSuppressed&&!foundry.utils.getProperty(effect,"system.isSuppressed"));
  for(const effect of effects) {
    if(!active&&isCombatToolsEffect(effect)){await effect.delete();continue;}
    const statuses=[...new Set([...effect.statuses,...ids])];
    if(effect.disabled===active||statuses.length!==effect.statuses.size)
      await effect.update({disabled:!active,statuses});
  }
  return active;
}
/** Native CPR editor requires a real Actor or Item parent. Keep templates on world Items. */
export async function createCustomEffectTemplate(status:EffectStatus):Promise<ActiveEffect> {
  const item=await Item.create({name:status.name,type:"gear",img:status.img,
    flags:{[MODULE]:{customStatusTemplate:status.id}}} as never) as Item & {createEffect(render:boolean):Promise<unknown>};
  if(!item)throw Error("Could not create the custom effect Item.");
  await item.createEffect(false);
  const effect=Array.from(item.effects)[0];
  if(!effect)throw Error("The system did not create an effect.");
  await effect.update({name:status.name,img:status.img,statuses:[status.id],transfer:false});
  return effect;
}
export async function applyCustomEffect(actor:Actor,status:EffectStatus):Promise<void> {
  const source=await fromUuid(status.effectUuid! as Parameters<typeof fromUuid>[0]);
  if(!(source instanceof ActiveEffect))throw Error("Custom effect template is missing. Use Edit effect in Custom statuses to repair it.");
  const {_id,...data}=source.toObject();
  // Instances retain native modifiers/flags, but do not inherit a template's identity or start time.
  delete data.origin;
  data.name=status.name;data.img=status.img;data.disabled=false;data.transfer=false;
  data.statuses=[...new Set([...source.statuses,status.id])];
  data.duration=freshStatusDuration(actor,data.duration);
  markCombatToolsEffect(data);
  await actor.createEmbeddedDocuments("ActiveEffect",[data] as Parameters<Actor["createEmbeddedDocuments"]>[1]);
}
