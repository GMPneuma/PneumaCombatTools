import {nativeCriticalTable} from "./native-lookup.js";
import type { Exchange } from "./combat-resolution.js";
import {nativeCard, diceJSON, type NativeRoll} from "./native-combat.js";
import {escapeHTML as esc} from "./shared.js";

export const criticalMethods = {
  Ranged: "Ranged attacks", Melee: "Melee attacks", Unarmed: "Unarmed attacks", Autofire: "Autofire",
  Explosion: "Explosions", Grenade: "Grenades", Rocket: "Rockets", Quickhack: "Quickhacks",
} as const;
export type CriticalMethod = keyof typeof criticalMethods;
type CriticalSettings = Record<`pneuma-combattools.critical${CriticalMethod}`, boolean>;
declare global { interface SettingConfig extends CriticalSettings {} }

export function criticalMethod(data: Exchange): CriticalMethod {
  if (data.criticalMethod) return data.criticalMethod;
  return data.attackMode === "autofire" ? "Autofire" : data.category === "Unarmed" ? "Unarmed" : data.ranged ? "Ranged" : "Melee";
}
export function damageSixes(roll: NativeRoll): number {
  return (roll._roll?.dice ?? []).filter(die => die.faces === 6)
    .reduce((total, die) => total + die.results.filter(result => result.result === 6 && result.active !== false && !result.discarded).length, 0);
}
export function criticalLocation(data: Exchange): "head" | "body" {
  return data.attackMode === "aimed" && data.location === "head" ? "head" : "body";
}
export function hasCriticalInjury(data: Exchange): boolean {
  return (data.damage?.result?.sixes ?? 0) >= 2
    && game.settings!.get("pneuma-combattools", `critical${criticalMethod(data)}`) !== false;
}
export interface InlineInjury { name:string; targetName:string; target?:string; item:string; total:number; html:string; dice:string[]; applied?:boolean; allowReroll?:boolean; receipt?:string; replacesReceipt?:string }
// Foundry expands dotted update keys. Token UUIDs must not be used as raw flag keys.
export const injuryKey = (target:string):string => encodeURIComponent(target).replaceAll(".","%2E");
export function injuryResult(injuries:Record<string,InlineInjury>|undefined,target:string):InlineInjury|undefined {
  return injuries?.[injuryKey(target)] ?? injuries?.[target] ?? foundry.utils.getProperty(injuries ?? {},target) as InlineInjury|undefined;
}
/** Keep native table probabilities, but fetch each injury once and yield during long rerolls. */
export async function drawCriticalInjury(table: RollTable, lookup: (name: string) => Promise<Item>, hasInjury: (name: string) => boolean, duplicate: unknown) {
  const items = new Map<string, Item>();
  for (let attempt = 0; attempt < 1000; attempt++) {
    if (attempt && attempt % 16 === 0) await new Promise<void>(resolve => setTimeout(resolve, 0));
    const result = await table.draw({displayChat:false} as Parameters<RollTable["draw"]>[0]);
    if (result.results.length !== 1) throw Error("The injury table must return one injury.");
    const name = result.results[0]!.text!;
    let item = items.get(name);
    if (!item) {
      item = await lookup(name);
      if (!item || String(item.type) !== "criticalInjury") throw Error("The rolled injury item is unavailable.");
      items.set(name, item);
    }
    if (duplicate === "reroll" && hasInjury(item.name!)) {
      if (table.results.contents.every(row => {
        const known = items.get(row.text ?? ""); return known && hasInjury(known.name!);
      })) throw Error("This character already has every injury on this table.");
      continue;
    }
    return {result, item};
  }
  throw Error("No unused injury found. Check the actor's existing injuries.");
}
/** Use the native table, duplicate policy, roll card and injury item without publishing a separate message. */
export async function rollCriticalInjury(data: Exchange, targetUuid: string, replacesReceipt?:string): Promise<InlineInjury> {
  if (!hasCriticalInjury(data)) throw new Error("This damage roll does not qualify for a critical injury.");
  const token = await fromUuid(targetUuid) as TokenDocument | null;
  const actor = token?.actor;
  if (!actor?.isOwner) throw new Error("Only the recipient's owner or GM can apply an injury.");
  const utilsPath = "/systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js";
  const utils = (await import(utilsPath)).default as {
    GetCompendiumDoc(pack: string, name: string): Promise<RollTable | Item>;
    GetCompendiumIdByLabel(label: string): string | null;
  };
  const tableName = criticalLocation(data) === "head" ? "Critical Injuries (Head)" : "Critical Injuries (Body)";
  const tablePack = game.settings!.get("cyberpunk-red-core", "criticalInjuryRollTableCompendium" as never) as string;
  if (!game.packs!.get(tablePack)) throw new Error("The configured critical injury table compendium is unavailable.");
  await game.packs!.get(tablePack)!.getIndex();
  const native = await nativeCriticalTable(tablePack, criticalLocation(data));
  if (!native && !game.packs!.get(tablePack)!.index.find(entry => entry.name === tableName))
    throw new Error("The configured compendium has no " + tableName + " table.");
  const table = native ?? await utils.GetCompendiumDoc(tablePack, tableName) as RollTable;
  const injuryPack = native ? "cyberpunk-red-core.core_critical-injuries-" + criticalLocation(data) : utils.GetCompendiumIdByLabel(tableName);
  if (!table || !injuryPack) throw new Error("The native " + tableName + " table or injury compendium is unavailable.");
  await game.packs!.get(injuryPack)?.getIndex();
  const duplicate = game.settings!.get("cyberpunk-red-core", "preventDuplicateCriticalInjuries" as never);
  const hasInjury = (name:string) => actor.items.some(item => String(item.type)==="criticalInjury" && item.name===name
    && (!replacesReceipt || foundry.utils.getProperty(item,"flags.pneuma-combattools.injuryReceipt")!==replacesReceipt));
  if (duplicate === "reroll" && table.results.contents.every(result => hasInjury(result.text ?? "")))
    throw Error("This character already has every injury on this table.");
  const {result, item} = await drawCriticalInjury(table, name => utils.GetCompendiumDoc(injuryPack, name) as Promise<Item>, hasInjury, duplicate);
  if (hasInjury(item.name!)) {
    if (duplicate === "warn") ui.notifications!.warn(actor.name + " already has " + item.name + ".");
  }
  const path = "/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js";
  const {CPRTableRoll} = await import(path) as {CPRTableRoll:new(name:string,roll:Roll,template:string)=>NativeRoll & {rollCardExtraArgs:Record<string,unknown>}};
  const roll = new CPRTableRoll(item.name!,result.roll,"systems/cyberpunk-red-core/templates/chat/cpr-critical-injury-rollcard.hbs");
  roll.resultTotal = result.roll.total!;
  roll.rollCardExtraArgs = {tableName:table.name,itemName:item.name,itemImg:item.img};
  const description = await TextEditor.enrichHTML(String(foundry.utils.getProperty(item,"system.description") ?? ""));
  const card = new DOMParser().parseFromString(await nativeCard(roll),"text/html");
  for (const link of Array.from(card.querySelectorAll<HTMLElement>('[data-action="itemEdit"]'))) {
    link.removeAttribute("data-action");
    link.className = "content-link";
    link.dataset.uuid = item.uuid;
  }
  return {name:item.name!,targetName:actor.name!,item:item.uuid,total:result.roll.total!,html:card.body.innerHTML+description,dice:diceJSON(roll)};
}

export function criticalInjuryRow(result:InlineInjury|undefined, label:string):string {
  const content = result
    ? '<details><summary>'+esc(result.total)+' — '+esc(result.name)+(result.applied?'':' — application pending')+'</summary><div class="pneuma-critical-details">'+result.html+'</div></details>'
    : '<strong>Critical Injury'+(label?' — '+esc(label):'')+'</strong>';
  const roll = !result || !result.applied || result.allowReroll
    ? '<button type="button" class="pneuma-apply-critical" title="'+(result?.allowReroll?'Re-roll critical injury':result?'Finish injury application':'Roll critical injury')+'" aria-label="Roll or finish critical injury"><i class="fas fa-heart-crack" aria-hidden="true"></i></button>' : '';
  const reroll = result?.applied && !result.allowReroll && game.user?.isGM
    ? '<button type="button" class="pneuma-critical-reroll" data-gm-only="true" title="Allow re-roll" aria-label="Allow re-roll"><i class="fas fa-rotate-left" aria-hidden="true"></i></button>' : '';
  return '<div class="pneuma-critical-row">'+content+roll+reroll+'</div>';
}
