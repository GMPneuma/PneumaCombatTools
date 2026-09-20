import { visibleChoke, type ChokeSequence } from "./rules.js";
export const MODULE = "pneuma-combattools";
export interface Participant { token: string; actor: string; name: string }
export interface SkillResult { total: number; html: string }
export interface Grapple {
  id: string; revision: number; scene: string; combat?: string; message?: string;
  source: Participant; target: Participant;
  state: "waiting" | "choice" | "active" | "ended";
  purpose: "grab" | "break"; breaks?: string; endedBy?: string;
  attack: SkillResult; defense?: SkillResult; note: string; choke?: ChokeSequence;
  lastAction?: "release" | "choke" | "throw";
  tokenPlacement?: { scaleX: number; scaleY: number };
  operation?: { action: string; user: string };
}
export const property = <T>(doc: object, key: string) => foundry.utils.getProperty(doc, `flags.${MODULE}.${key}`) as T | undefined;
export function grapples(scene: Scene | undefined): Grapple[] {
  if (!scene) return [];
  const outsideCombat = Object.values(property<Record<string,Grapple>>(scene,"grapples") ?? {});
  const encounters = Array.from(game.combats?.values() ?? []).flatMap(combat => Object.values(property<Record<string,Grapple>>(combat,"grapples") ?? {}));
  return [...outsideCombat,...encounters.filter(g => g.scene === scene.id)];
}
export function grappleFor(token: TokenDocument): Grapple | undefined {
  return grapples(token.parent as Scene).find(g => g.state === "active" && [g.source.token, g.target.token].includes(token.uuid));
}
export function actorGrapples(actor: Actor): Grapple[] {
  return Array.from(game.scenes ?? []).flatMap(scene => grapples(scene)).filter(g => g.state === "active" && [g.source.actor, g.target.actor].includes(actor.uuid));
}
export function grappleHUD(actor: Actor): { id: string; text: string; detail: string }[] {
  return actorGrapples(actor).flatMap(g => {
    const attacking = actor.uuid === g.source.actor;
    const name = attacking ? g.target.name : g.source.name;
    const combat = game.combats?.get(g.choke?.combat ?? "");
    const count = visibleChoke(g.choke, combat?.started ? combat.id : undefined, Number(combat?.round));
    return [{ id: g.id, text: `${attacking ? "Grappling" : "Grappled by"}: ${name}`, detail: "−2 Actions. No two-handed weapons. " + (attacking ? "Grabbing hand occupied; held token follows movement." : "Cannot use Move Action; dragged by attacker.") },
      ...(count || g.choke?.combat === "" ? [{ id: g.id + "-choke", text: `${attacking ? "Choking" : "Being choked by"}: ${name} — ${count ? `${count}/3` : "GM tracks rounds"}`, detail: "Consecutive rounds" }] : [])];
  });
}
export function needsTwoHands(item: object): boolean {
  const system = (item as {system?: {handsReq?:number;modifiers?:{secondaryWeapon?:{handsReq?:number}}}})?.system;
  return Number(system?.handsReq ?? system?.modifiers?.secondaryWeapon?.handsReq) >= 2;
}
export function grappleWeaponBlocked(actor: Actor, item: object): boolean {
  return needsTwoHands(item) && actorGrapples(actor).length > 0;
}
export function grappleMenu(source: Token | undefined, target: Token | undefined): { action: string; label: string }[] {
  if (!source?.actor || !target?.actor) return [];
  const own = grappleFor(source.document), theirs = grappleFor(target.document);
  if (own && (source === target || [own.source.token, own.target.token].includes(target.document.uuid))) {
    return own.source.token === source.document.uuid ? [{action:"choke",label:"Choke"},{action:"throw",label:"Throw"},{action:"release",label:"Release"}]
      : [{action:"escape",label:"Escape"}];
  }
  if (theirs?.source.token === target.document.uuid) return [{action:"break",label:"Break Grapple"}];
  return source !== target && !own && !theirs ? [{action:"grab",label:"Grab"}] : [];
}
