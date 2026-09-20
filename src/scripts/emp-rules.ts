export const EMP_MODULE = "pneuma-combattools";
export interface EmpItem {
  id: string | null; name: string | null; type: string; flags?: unknown;
  system: { isFoundational?: boolean; isInstalledInActor?: boolean; isInstalled?: boolean; isElectronic?: boolean;
    installedIn?: string[]; installedItems?: {list?: string[]}; type?: string; equipped?: string };
}
export type EmpRandom = "equal" | "foundation-more" | "foundation-less" | "system";
export interface EmpPolicy { foundational: boolean; cascade: boolean; electronics: boolean; immune: string[] }
export function empReferences(item: {flags?: unknown}): string[] {
  const value = (item.flags as {"pneuma-combattools"?: {empCombats?: string[]}} | undefined)?.[EMP_MODULE]?.empCombats;
  return Array.isArray(value) ? value.filter(id => typeof id === "string") : [];
}
export function empDisabled(item: {flags?: unknown}): boolean {
  return empReferences(item).some(id => game.combats?.get(id)?.started);
}
export function eligibleEmpItems<T extends EmpItem>(items: T[], policy: EmpPolicy): T[] {
  const immune = new Set(policy.immune.map(v => v.trim().toLowerCase()).filter(Boolean));
  return items.filter(item => {
    const source = foundry.utils.getProperty(item, "_stats.compendiumSource") ?? foundry.utils.getProperty(item, "flags.core.sourceId");
    if (!item.id || immune.has(item.name?.toLowerCase() ?? "") || immune.has(String(source).toLowerCase()) || empDisabled(item)) return false;
    if (item.type === "cyberware") return !!(item.system.isInstalledInActor ?? item.system.isInstalled) && (policy.foundational || !item.system.isFoundational);
    return policy.electronics && !!item.system.isElectronic && (item.system.equipped === "carried" || item.system.equipped === "equipped");
  });
}
export function empGroup(item: EmpItem, items: EmpItem[]): string {
  let current = item; const seen = new Set<string>();
  while (current.id && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = items.find(i => i.id === current.system.installedIn?.[0]);
    if (!parent) break;
    current = parent;
  }
  return current.id ?? item.id ?? "other";
}
export function empWeight(item: EmpItem, mode: EmpRandom): number {
  return item.system.isFoundational ? mode === "foundation-more" ? 2 : mode === "foundation-less" ? 0.5 : 1 : 1;
}
export function randomEmp<T extends EmpItem>(eligible: T[], all: T[], count: number, mode: EmpRandom, random = Math.random): T[] {
  const pool = [...eligible], result: T[] = [];
  while (result.length < count && pool.length) {
    const groups = new Map<string, number>();
    for (const item of pool) {const group = empGroup(item, all); groups.set(group, (groups.get(group) ?? 0) + 1);}
    const weights = pool.map(item => mode === "system" ? 1 / groups.get(empGroup(item, all))! : empWeight(item, mode));
    let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);
    let index = weights.findIndex(weight => (roll -= weight) < 0);
    if (index < 0) index = pool.length - 1;
    result.push(pool.splice(index, 1)[0]!);
  }
  return result;
}
/** Immunity protects against direct selection; a powered-down host cannot power its installed options. */
export function expandEmp<T extends EmpItem>(selected: T[], all: T[], cascade: boolean): T[] {
  const result = new Map(selected.map(item => [item.id, item]));
  if (cascade) for (const item of result.values()) for (const child of all) {
    if (!result.has(child.id) && (child.system.installedIn?.includes(item.id!) || item.system.installedItems?.list?.includes(child.id!))) result.set(child.id, child);
  }
  return [...result.values()];
}
