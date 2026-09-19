import type { EvasionHomebrew } from "./evasion-settings.js";
export interface EvasionFacts { ref: number; coprocessor: boolean; solo: boolean; luck: number }
export interface EvasionOffer { allowed: boolean; penalty: number; cost: number; free: number; reason: string }
export function evasionOffer(ranged: boolean, mode: "raw" | "none" | "custom", rules: EvasionHomebrew,
  facts: EvasionFacts, used: number, inCombat: boolean): EvasionOffer {
  const result = { allowed: true, penalty: 0, cost: 0, free: 0, reason: "No additional cost or penalty" };
  if (!ranged) return result;
  if (mode === "none") return { ...result, allowed: false, reason: "Ranged evasion is disabled" };
  if (mode === "raw") return facts.ref >= 8 || facts.coprocessor ? result
    : { ...result, allowed: false, reason: "Requires REF 8+ or an installed Reflex Co-Processor" };
  const qualified = [facts.ref >= 8 && rules.reflex, facts.coprocessor && rules.coprocessor, facts.solo && rules.solo]
    .filter((row): row is EvasionHomebrew["reflex"] => !!row && row.qualifies);
  if (!qualified.length) return { ...result, allowed: false, reason: "No qualifying ranged-evasion ability" };
  if (!inCombat) return { ...result, allowed: false, reason: "Start combat to track homebrew evasions by round" };
  const grants = qualified.filter(q => q.free);
  const allowance = (grants.some(q => !q.stacks) ? 1 : 0) + grants.filter(q => q.stacks).length;
  result.free = Math.max(0, allowance - used);
  if (result.free) return { ...result, reason: "Free evasion · " + result.free + " remaining" };
  if (rules.rule === "noAdditional") return { ...result, allowed: false, reason: "No evasions remaining" };
  if (rules.rule === "flat") result.penalty = -4;
  else if (rules.rule === "cumulative") result.penalty = -(used - allowance + 1);
  else result.cost = rules.luckCost;
  if (result.cost > facts.luck) return { ...result, allowed: false, reason: "Insufficient LUCK · requires " + result.cost };
  result.reason = result.cost ? "This evasion will spend " + result.cost + " Luck"
    : "Additional ranged evasion: " + result.penalty;
  return result;
}
export function checkedLuck(current: number, fee: number, bonus: number): number {
  if (![current, fee, bonus].every(n => Number.isInteger(n) && n >= 0) || fee + bonus > current)
    throw new Error("Insufficient LUCK for the evasion cost and selected bonus.");
  return current - fee - bonus;
}
export function evasionButtonLabel(offer: EvasionOffer): string {
  return "Evade" + (offer.cost > 0 ? " for " + offer.cost + " Luck" : "") + (offer.penalty ? " at " + offer.penalty : "");
}
