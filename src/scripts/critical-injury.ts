import type { Exchange } from "./combat-resolution.js";
import type { NativeRoll } from "./native-combat.js";

export const criticalMethods = {
  Ranged: "Ranged attacks", Melee: "Melee attacks", Unarmed: "Unarmed attacks", Autofire: "Autofire",
  Explosion: "Explosions", Grenade: "Grenades", Rocket: "Rockets", Quickhack: "Quickhacks",
} as const;
export type CriticalMethod = keyof typeof criticalMethods;
type CriticalSettings = Record<`pneuma-combattools.critical${CriticalMethod}`, boolean>;
declare global { interface SettingConfig extends CriticalSettings {} }

export function registerCriticalSettings(): void {
  for (const [method, label] of Object.entries(criticalMethods)) {
    game.settings!.register("pneuma-combattools", `critical${method as CriticalMethod}`, {
      name: "Critical injuries: " + label, hint: "Allow the injury dice control when damage rolls two or more sixes. Does not change native bonus damage.",
      scope: "world", config: true, type: Boolean, default: true, requiresReload: true,
    });
  }
}
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
/** Delegate injury items, effects, duplicate policy and chat to the native sheet workflow. */
export async function applyCriticalInjury(data: Exchange, targetUuid: string): Promise<void> {
  if (!hasCriticalInjury(data)) throw new Error("This damage roll does not qualify for a critical injury.");
  const token = await fromUuid(targetUuid) as TokenDocument | null;
  const actor = token?.actor;
  if (!actor?.isOwner) throw new Error("Only the recipient's owner or GM can apply an injury.");
  const sheet = actor.sheet as ActorSheet & {
    _drawCriticalInjuryTable?: (table: RollTable, compendium: string, iteration: number) => Promise<void>;
  };
  if (typeof sheet?._drawCriticalInjuryTable !== "function")
    throw new Error("Native critical injury application is unavailable.");
  const utilsPath = "/systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js";
  const utils = (await import(utilsPath)).default as {
    GetCompendiumDoc(pack: string, name: string): Promise<RollTable>;
    GetCompendiumIdByLabel(label: string): string | null;
  };
  const tableName = criticalLocation(data) === "head" ? "Critical Injuries (Head)" : "Critical Injuries (Body)";
  const tablePack = game.settings!.get("cyberpunk-red-core", "criticalInjuryRollTableCompendium" as never) as string;
  if (!game.packs!.get(tablePack)) throw new Error("The configured critical injury table compendium is unavailable.");
  await game.packs!.get(tablePack)!.getIndex();
  if (!game.packs!.get(tablePack)!.index.find(entry => entry.name === tableName))
    throw new Error("The configured compendium has no " + tableName + " table.");
  const table = await utils.GetCompendiumDoc(tablePack, tableName);
  const injuryPack = utils.GetCompendiumIdByLabel(tableName);
  if (!table || !injuryPack) throw new Error("The native " + tableName + " table or injury compendium is unavailable.");
  await game.packs!.get(injuryPack)?.getIndex();
  await sheet._drawCriticalInjuryTable(table, injuryPack, 0);
}
