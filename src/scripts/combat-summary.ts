import {escapeHTML,primaryGM} from "./shared.js";
import {masterStatuses} from "./status-catalog.js";
const PATH="flags.pneuma-combattools.combatSummary";
interface Critical {actor:string;actorName:string;item:string;name:string}
interface Tracking {partial:boolean;baseline:string[];criticals:Critical[]}
interface EffectSnapshot {actor:Actor;uuid:string;name:string}
export interface CombatSummarySnapshot {actors:Actor[];round:number;players:number;npcs:number;defeated:string[];criticals:Critical[];partial:boolean;effects:EffectSnapshot[]}
const tracking=(combat:Combat)=>foundry.utils.getProperty(combat,PATH) as Tracking|undefined;
const participantActors=(combat:Combat)=>[...new Map(Array.from(combat.combatants??[]).flatMap(row=>row.actor?[[row.actor.uuid,row.actor] as const]:[])).values()];
const initial=(combat:Combat,partial:boolean):Tracking=>({partial,baseline:participantActors(combat).flatMap(actor=>actor.items.filter(item=>String(item.type)==="criticalInjury").map(item=>item.uuid)),criticals:[]});
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
 const seed=(combat:Combat)=>{if(combat.started&&!tracking(combat))enqueue(async()=>{if(combat.started&&!tracking(combat))await combat.update({[PATH]:initial(combat,true)} as never);});};
 Hooks.once("ready",()=>{for(const combat of game.combats??[])seed(combat);});
 Hooks.on("updateCombat",seed);
 Hooks.on("createCombatant",(row:Combatant)=>{
  const combat=row.parent,actor=row.actor;if(!combat?.started||!actor)return;
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
 const actors=participantActors(combat),data=tracking(combat),criticals=[...(data?.criticals??[])];
 // Reconcile remaining items if a creation hook was missed; never include preexisting injuries.
 if(data)for(const actor of actors.filter(actor=>actor.hasPlayerOwner))for(const item of actor.items.filter(item=>String(item.type)==="criticalInjury")) {
  if(!data.baseline.includes(item.uuid)&&!criticals.some(entry=>entry.item===item.uuid))criticals.push({actor:actor.uuid,actorName:actor.name??"Character",item:item.uuid,name:item.name??"Critical injury"});
 }
 const dead=masterStatuses.find(status=>status.name==="Dead")?.id;
 return {actors,round:Math.max(0,combat.round??0,previousRound),players:actors.filter(actor=>actor.hasPlayerOwner).length,npcs:actors.filter(actor=>!actor.hasPlayerOwner).length,
  defeated:Array.from(combat.combatants??[]).filter(row=>row.isDefeated||!!dead&&row.actor?.effects.some(effect=>!effect.disabled&&effect.statuses.has(dead))).map(row=>row.name??row.actor?.name??"Participant"),
  criticals,partial:!data||data.partial,effects:actors.flatMap(actor=>Array.from(actor.allApplicableEffects?.()??actor.effects).filter(effect=>!effect.disabled).map(effect=>({actor,uuid:effect.uuid,name:effect.name??"Status effect"})))};
}
export function combatSummaryHTML(summary:CombatSummarySnapshot):string {
 const e=escapeHTML,lines:string[]=[];
 const groups=new Map<string,Critical[]>();for(const injury of summary.criticals){const entries=groups.get(injury.actor)??[];entries.push(injury);groups.set(injury.actor,entries);}
 for(const entries of groups.values())lines.push(`<li>${e(entries[0]!.actorName)}: ${entries.map(injury=>{
  const actor=summary.actors.find(actor=>actor.uuid===injury.actor);
  return e(injury.name)+(actor&&!actor.items.some(item=>item.uuid===injury.item)?" (no longer present)":"");
 }).join(", ")}</li>`);
 const cleared=summary.effects.filter(before=>!Array.from(before.actor.allApplicableEffects?.()??before.actor.effects).some(effect=>effect.uuid===before.uuid&&!effect.disabled));
 const remaining=summary.actors.flatMap(actor=>Array.from(actor.allApplicableEffects?.()??actor.effects).filter(effect=>!effect.disabled).map(effect=>`${actor.name}: ${effect.name}`));
 return `<div class="pneuma-combat-summary"><p><strong>Encounter summary</strong> — Reached round ${summary.round}. ${summary.players} player characters; ${summary.npcs} NPCs.</p>
 ${summary.partial?'<p class="notes">Partial injury record: tracking began after this encounter started.</p>':""}
 <p><strong>Player critical injuries applied:</strong> ${summary.criticals.length}</p>${lines.length?`<ul>${lines.join("")}</ul>`:""}
 <p><strong>Defeated / dead:</strong> ${summary.defeated.length?summary.defeated.length+" — "+summary.defeated.map(e).join(", "):"None marked"}</p>
 <p><strong>Effects cleared during automatic cleanup:</strong> ${cleared.length?cleared.map(effect=>e(effect.actor.name)+": "+e(effect.name)).join("; "):"None observed"}</p>
 <p><strong>Effects remaining for review:</strong> ${remaining.length?remaining.map(e).join("; "):"None"}</p></div>`;
}
