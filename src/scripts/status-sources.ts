import {type StatusDefinition} from "./status-catalog.js";
const MODULE="pneuma-combattools";
export interface StatusTemplate {itemUuid?:string;effectUuid?:string}
declare global {interface SettingConfig {"pneuma-combattools.statusTemplates":Record<string,StatusTemplate>}}
export function statusTemplates():Record<string,StatusTemplate> {
  // Retired native Item replacements must never be used again. Leave their world
  // documents untouched; only standalone supplemental effect templates are supported.
  return Object.fromEntries(Object.entries(game.settings!.get(MODULE,"statusTemplates")??{}).filter(([,value])=>!value.itemUuid));
}
export async function saveStatusTemplate(id:string,value:StatusTemplate|null):Promise<void> {
  if(!game.user?.isGM)throw Error("Only the GM can configure status effects.");
  const next={...statusTemplates()};
  if(value)next[id]=value;else delete next[id];
  await game.settings!.set(MODULE,"statusTemplates",next);
}
export function nativeEffectsForStatus(item:Item,status:StatusDefinition):ActiveEffect[] {
  return Array.from(item.effects).filter(effect=>status.binding?.kind==="injury"
    || foundry.utils.getProperty(effect,"flags."+MODULE+".statusId")===status.id
    || (status.binding?.effectNames?status.binding.effectNames.includes(effect.name??"")
      : [status.name,status.name+" Primary"].includes(effect.name??"")));
}
/** Resolve the installed source afresh; an empty effect list is not inferred from the catalog. */
export async function nativeStatusItem(status:StatusDefinition):Promise<Item|null> {
  if(status.binding) {
    const pack=game.packs?.get(status.binding.pack);
    const id=status.binding.itemId||(await pack?.getIndex())?.find(row=>row.name===status.binding!.itemName)?._id;
    const item=id?await pack?.getDocument(id):null;
    return item as Item|null ?? null;
  }
  if(!["drugs","pharma","addiction"].includes(status.group))return null;
  const name=({"Antibiotics":"Antibiotic","Speed Heal":"Speedheal"} as Record<string,string>)[status.name]??status.name.replace(/ Addiction$/,"");
  for(const packId of ["cyberpunk-red-core.core_drugs","cyberpunk-red-core.dlc_hornets-pharmacy"]) {
    const pack=game.packs?.get(packId);
    const row=(await pack?.getIndex())?.find(row=>row.name===name);
    if(row)return await pack!.getDocument(row._id) as Item;
  }
  return null;
}
