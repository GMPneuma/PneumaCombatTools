import {summaryConditionNames,buildCombatReport,combatReportHTML} from "./combat-report.js";
import {primaryGM} from "./shared.js";
import {masterStatuses} from "./status-catalog.js";
const PATH="flags.pneuma-combattools.combatSummary";
interface Critical {actor:string;actorName:string;item:string;name:string}
interface Participant {actor:string;name:string;defeated:boolean}
interface Tracking {partial:boolean;baseline:string[];criticals:Critical[];participants?:Participant[]}
interface EffectSnapshot {actor:Actor;uuid:string;name:string}
export interface CombatSummarySnapshot {name?:string;scene?:string;actors:Actor[];round:number;players:number;npcs:number;defeated:string[];criticals:Critical[];partial:boolean;effects:EffectSnapshot[]}
const tracking=(combat:Combat)=>foundry.utils.getProperty(combat,PATH) as Tracking|undefined;
const participantActors=(combat:Combat)=>[...new Map(Array.from(combat.combatants??[]).flatMap(row=>row.actor?[[row.actor.uuid,row.actor] as const]:[])).values()];
const roster=(combat:Combat):Participant[]=>Array.from(combat.combatants??[]).flatMap(row=>row.actor?[{actor:row.actor.uuid,name:row.name??row.actor.name??"Participant",defeated:row.isDefeated}]:[]);
const initial=(combat:Combat,partial:boolean):Tracking=>({partial,participants:roster(combat),baseline:participantActors(combat).flatMap(actor=>actor.items.filter(item=>String(item.type)==="criticalInjury").map(item=>item.uuid)),criticals:[]});
let writes:Promise<unknown>=Promise.resolve();
function enqueue(run:()=>Promise<unknown>):void {
 if(game.user?.id!==primaryGM()?.id)return;
 writes=writes.catch(()=>{}).then(run);void writes.catch(error=>ui.notifications!.error("Combat summary: "+String(error)));
}
export async function waitCombatSummary():Promise<void>{await writes;}
export function registerCombatSummary():void {
 Hooks.on("preUpdateCombat",(combat:Combat,changes:Record<string,unknown>)=>{
  if(game.user?.isGM&&!combat.started&&typeof changes.round==="number"&&changes.round>0)changes[PATH]=initial(combat,false);
 });
 const remember=(combat:Combat,extra:Participant[]=[])=>{
  const rows=[...roster(combat),...extra];
  enqueue(async()=>{const data=tracking(combat);if(!data)return;
   const participants=new Map((data.participants??[]).map(row=>[row.actor,row]));
   for(const row of rows)participants.set(row.actor,row);
   await combat.update({[PATH]:{...data,participants:[...participants.values()]}} as never);
  });
 };
 Hooks.on("deleteCombatant",(row:Combatant)=>{if(row.parent?.started&&row.actor)remember(row.parent,[{actor:row.actor.uuid,name:row.name??row.actor.name??"Participant",defeated:row.isDefeated}]);});
 Hooks.on("updateCombatant",(row:Combatant)=>{if(row.parent?.started)remember(row.parent);});
 const seed=(combat:Combat)=>{if(combat.started&&!tracking(combat))enqueue(async()=>{if(combat.started&&!tracking(combat))await combat.update({[PATH]:initial(combat,true)} as never);});};
 Hooks.once("ready",()=>{for(const combat of game.combats??[])seed(combat);});
 Hooks.on("updateCombat",seed);
 Hooks.on("createCombatant",(row:Combatant)=>{
  const combat=row.parent,actor=row.actor;if(!combat?.started||!actor)return;
  remember(combat);
  const existing=actor.items.filter(item=>String(item.type)==="criticalInjury").map(item=>item.uuid);
  enqueue(async()=>{const data=tracking(combat);if(data)await combat.update({[PATH]:{...data,baseline:[...new Set([...data.baseline,...existing])]}} as never);});
 });
 Hooks.on("createItem",(item:Item)=>{
  const actor=item.parent as Actor|undefined;
  if(String(item.type)!=="criticalInjury"||!actor?.hasPlayerOwner)return;
  const combats=Array.from(game.combats??[]).filter(combat=>combat.started&&combat.combatants.some(row=>row.actor?.uuid===actor.uuid));
  if(combats.length!==1)return;
  const combat=combats[0]!,entry={actor:actor.uuid,actorName:actor.name??"Character",item:item.uuid,name:item.name??"Critical injury"};
  enqueue(async()=>{
   const data=tracking(combat)??initial(combat,true);
   if(data.criticals.some(entry=>entry.item===item.uuid))return;
   await combat.update({[PATH]:{...data,criticals:[...data.criticals,entry]}} as never);
  });
 });
}
export function captureCombatSummary(combat:Combat,previousRound=0):CombatSummarySnapshot {
 const data=tracking(combat),actors=participantActors(combat),criticals=[...(data?.criticals??[])];
 for(const row of data?.participants??[]) {
  const actor=(typeof fromUuidSync==="function"?fromUuidSync(row.actor as Parameters<typeof fromUuidSync>[0]):Array.from(game.actors??[]).find(actor=>actor.uuid===row.actor)) as Actor|null|undefined;
  if(actor&&!actors.some(current=>current.uuid===actor.uuid))actors.push(actor);
 }
 // Reconcile remaining items if a creation hook was missed; never include preexisting injuries.
 if(data)for(const actor of actors.filter(actor=>actor.hasPlayerOwner))for(const item of actor.items.filter(item=>String(item.type)==="criticalInjury")) {
  if(!data.baseline.includes(item.uuid)&&!criticals.some(entry=>entry.item===item.uuid))criticals.push({actor:actor.uuid,actorName:actor.name??"Character",item:item.uuid,name:item.name??"Critical injury"});
 }
 const dead=masterStatuses.find(status=>status.name==="Dead")?.id;
 return {name:combat.name??"Encounter",scene:combat.scene?.name??undefined,actors,round:Math.max(0,combat.round??0,previousRound),players:actors.filter(actor=>actor.hasPlayerOwner).length,npcs:actors.filter(actor=>!actor.hasPlayerOwner).length,
  defeated:[...new Set([...(data?.participants??[]).filter(row=>row.defeated).map(row=>row.name),...Array.from(combat.combatants??[]).filter(row=>row.isDefeated||!!dead&&row.actor?.effects.some(effect=>!effect.disabled&&effect.statuses.has(dead))).map(row=>row.name??row.actor?.name??"Participant"),...actors.filter(actor=>!!dead&&actor.effects.some(effect=>!effect.disabled&&effect.statuses.has(dead))).map(actor=>actor.name??"Participant")])],
  criticals,partial:!data||data.partial,effects:actors.flatMap(actor=>Array.from(actor.allApplicableEffects?.()??actor.effects).filter(effect=>summaryConditionNames(effect).length).map(effect=>({actor,uuid:effect.uuid,name:summaryConditionNames(effect).join(", ")})))};
}
export function combatSummaryHTML(summary:CombatSummarySnapshot):string {return combatReportHTML(buildCombatReport(summary));}
