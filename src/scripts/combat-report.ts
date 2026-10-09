import type {CombatSummarySnapshot} from "./combat-summary.js";
import {masterStatuses} from "./status-catalog.js";
import {escapeHTML} from "./shared.js";
const get=(doc:object,path:string)=>foundry.utils.getProperty(doc,path);
const woundNames=new Set(["Lightly Wounded","Seriously Wounded","Mortally Wounded"]);
/** Recognized conditions, never arbitrary equipment modifier names. */
export function summaryConditionNames(effect:ActiveEffect):string[] {
 if(effect.disabled||effect.isSuppressed||get(effect,"system.isSuppressed"))return [];
 return masterStatuses.filter(status=>status.group==="general"&&!woundNames.has(status.name)&&effect.statuses?.has(status.id)).map(status=>status.name);
}
const effects=(actor:Actor)=>Array.from(actor.allApplicableEffects?.()??actor.effects);
export interface CombatReportParticipant {name:string;player:boolean;hp?:number;maxHP?:number;wound?:string;conditions:string[];injuries:string[]}
export interface CombatReport {version:1;name:string;scene?:string;round:number;recordedAt:string;players:number;npcs:number;participants:CombatReportParticipant[];defeated:string[];injuryAdditions:string[];partialInjuries:boolean;cleared:string[]}
export function buildCombatReport(summary:CombatSummarySnapshot):CombatReport {
 const participants=summary.actors.map(actor=>{
  const hpValue=get(actor,"system.derivedStats.hp.value"),maxValue=get(actor,"system.derivedStats.hp.max");
  const hp=typeof hpValue==="number"&&Number.isFinite(hpValue)?hpValue:undefined,max=typeof maxValue==="number"&&Number.isFinite(maxValue)&&maxValue>0?maxValue:undefined;
  const conditions=[...new Set(effects(actor).flatMap(summaryConditionNames))];
  const injuryItems=Array.from(actor.items).filter(item=>String(item.type)==="criticalInjury");
  const injuries=injuryItems.map(item=>(item.name??"Critical injury")+(get(item,"flags.pneuma-combattools.quickFix")?" (QuickFix suppression active)":""));
  for(const status of masterStatuses.filter(status=>status.binding?.kind==="injury"&&effects(actor).some(effect=>!effect.disabled&&!effect.isSuppressed&&effect.statuses?.has(status.id)))) {
    const present=injuryItems.some(item=>item.name===status.name||item.name===status.binding!.itemName||get(item,"flags.pneuma-combattools.statusId")===status.id||String(get(item,"_stats.compendiumSource")??get(item,"flags.core.sourceId")??"").endsWith("."+status.binding!.itemId));
    if(!present)injuries.push(status.name+" (status marker; no injury item)");
  }
  return {name:actor.name??"Character",player:!!actor.hasPlayerOwner,...(actor.hasPlayerOwner?{hp,maxHP:max,wound:hp!==undefined&&max!==undefined?(conditions.includes("Dead")?"Dead":hp<1?"Mortally Wounded":hp<Math.ceil(max/2)?"Seriously Wounded":hp<max?"Lightly Wounded":"Full HP"):undefined}:{}),conditions,injuries};
 });
 const cleared=summary.effects.filter(before=>!effects(before.actor).some(effect=>effect.uuid===before.uuid&&summaryConditionNames(effect).length)).map(before=>before.actor.name+": "+before.name);
 return {version:1,name:summary.name??"Encounter",scene:summary.scene,round:summary.round,recordedAt:new Date().toISOString(),players:summary.players,npcs:summary.npcs,participants,defeated:[...summary.defeated],partialInjuries:summary.partial,
 injuryAdditions:summary.criticals.map(injury=>injury.actorName+": "+injury.name+(summary.actors.find(actor=>actor.uuid===injury.actor)?.items.some(item=>item.uuid===injury.item)?"":" (no longer present)")),cleared};
}
function participantDetails(row:CombatReportParticipant):string {
 const details:string[]=[];
 if(row.player){details.push(row.hp!==undefined&&row.maxHP!==undefined?`HP ${row.hp}/${row.maxHP}`:"HP unavailable");if(row.wound)details.push(row.wound);}
 if(row.conditions.length)details.push("Conditions: "+row.conditions.join(", "));
 if(row.injuries.length)details.push("Current injuries: "+row.injuries.join(", "));
 return details.length?details.join(" · "):"No recognized conditions or critical injury items";
}
/** Escape Discord formatting and neutralize mentions in names; never ping when pasted. */
const markdownText=(value:string)=>value.replace(/[\r\n]+/g," ").replace(/([\\`*_~|>#[\]])/g,"\\$1").replace(/@/g,"@\u200b");
export function combatReportMarkdown(report:CombatReport):string {
 const text=markdownText,lines=["## Combat-end snapshot — "+text(report.name)];
 if(report.scene)lines.push("**Scene:** "+text(report.scene));
 lines.push("**Round reached:** "+report.round,"**Encounter participants:** "+report.players+" player characters; "+report.npcs+" NPCs","**Recorded (UTC):** "+report.recordedAt,"State captured after automatic cleanup; not an attack-by-attack log.");
 for(const [title,player] of [["Player condition at combat end",true],["NPC condition at combat end",false]] as const){
  const rows=report.participants.filter(row=>row.player===player);if(rows.length)lines.push("","### "+title,...rows.map(row=>"- **"+text(row.name)+":** "+text(participantDetails(row))));
 }
 if(report.defeated.length)lines.push("","### Defeated / dead markers",...report.defeated.map(name=>"- "+text(name)),"These are recorded markers, not confirmed kills.");
 if(report.injuryAdditions.length)lines.push("","### Recorded player injury item additions",...report.injuryAdditions.map(row=>"- "+text(row)));
 if(report.partialInjuries)lines.push("","Injury additions are a partial record: tracking began during the encounter or was incomplete.");
 if(report.cleared.length)lines.push("","### Conditions cleared during automatic cleanup",...report.cleared.map(row=>"- "+text(row)));
 return lines.join("\n");
}
export function combatReportHTML(report:CombatReport):string {
 const e=escapeHTML,players=report.participants.filter(row=>row.player);
 const stabilization=report.participants.filter(row=>row.conditions.includes("Needs Stabilization")).map(row=>row.name);
 const injuryCount=report.participants.reduce((total,row)=>total+row.injuries.length,0);
 const rows=players.map(row=>{
  const hp=row.hp!==undefined&&row.maxHP!==undefined?`HP ${row.hp}/${row.maxHP}`:"HP unavailable";
  const urgent=row.conditions.filter(name=>["Dead","Unconscious"].includes(name));
  return `<li><strong>${e(row.name)}</strong>: ${hp}${row.injuries.length?` · ${row.injuries.length} ${row.injuries.length===1?"injury":"injuries"}`:""}${urgent.length?" · "+urgent.map(e).join(", "):""}</li>`;
 });
 return `<div class="pneuma-combat-summary"><p><strong>${e(report.name)} — Combat ended</strong><br>Round reached ${report.round} · ${report.players} PCs · ${report.npcs} NPCs</p>
 ${rows.length?"<ul>"+rows.join("")+"</ul>":""}
 ${stabilization.length?`<p><strong>Needs Stabilization:</strong> ${stabilization.map(e).join(", ")}</p>`:""}
 <p>Current injuries: ${injuryCount} · Defeated/dead markers: ${report.defeated.length} · Conditions cleared: ${report.cleared.length}<br>Recorded player injury additions: ${report.injuryAdditions.length}${report.partialInjuries?" (partial record)":""}</p></div>`;
}
