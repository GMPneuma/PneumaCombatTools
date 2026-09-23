import {masterStatuses} from "./status-catalog.js";
import {empReferences,activeDisables} from "./emp-rules.js";
import {getItemMarkers} from "./item-markers.js";
/** Read native injury items as well as markers, including the interval before status synchronization. */
export function hasInjury(actor:Actor,name:string):boolean {
  const status=masterStatuses.find(s=>s.name===name&&s.binding?.kind==="injury");
  if(!status)return false;
  if(Array.from(actor.effects??[]).some(e=>!e.disabled&&!foundry.utils.getProperty(e,"system.isSuppressed")&&e.statuses.has(status.id)))return true;
  return Array.from(actor.items??[]).some(item=>{
    if(String(item.type)!=="criticalInjury")return false;
    const source=String(foundry.utils.getProperty(item,"_stats.compendiumSource")??foundry.utils.getProperty(item,"flags.core.sourceId")??"");
    return foundry.utils.getProperty(item,"flags.pneuma-combattools.statusId")===status.id||source.endsWith("."+status.binding!.itemId)||item.name===status.binding!.itemName;
  });
}
export function evasionBlocked(actor:Actor):string|undefined {
  if(hasInjury(actor,"Dismembered Leg"))return "Cannot evade: Dismembered Leg.";
  if(Array.from(actor.items??[]).some(item=>String(item.type)==="cyberware"
    &&foundry.utils.getProperty(item,"system.type")==="cyberLeg"
    &&foundry.utils.getProperty(item,"system.isFoundational")===true
    &&(foundry.utils.getProperty(item,"system.isInstalledInActor")??foundry.utils.getProperty(item,"system.isInstalled"))===true
    &&(empReferences(item).some(id=>game.combats?.get(id)?.started)||activeDisables(item).some(e=>e.source!=="cyberware-malfunction")||!!getItemMarkers(item).disabled)))return "Cannot evade: disabled Cyberleg.";
  return undefined;
}
