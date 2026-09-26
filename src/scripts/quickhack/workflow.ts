import {tokenEncounter,encounterRef,resolveEncounter} from "../encounter.js";
import { requireCombatSocket } from "../socket-health.js";
import { availableQuickhacks, quickhackId, MODULE, type QuickhackItem } from "./availability.js";
import { getQuickhack } from "./catalog.js";
import { enabled, label, mode, routing } from "./settings.js";
import { roleFor, canOperate, criticalD10, gmAudience, nativeQuickhackRoll, publicAudience } from "./rolls.js";
import { escapeHTML, postResult, type QuickhackResult } from "./messages.js";
import { isQuickhackSuccessful, isQuickhackTargetAlerted, isTargetAware, isWithinJackInRange } from "./rules.js";
import { resolveJackInRouting, resolveQuickhackRouting } from "./routing-config.js";
import { requestEffect } from "./effects.js";
import { activeConnection, establishConnection, isEjected } from "./connections.js";
import { hasQuickhackSight } from "./sight.js";

export const actorQuickhacks = (actor: Actor) => {
  const items = [...actor.items] as unknown as QuickhackItem[];
  return availableQuickhacks(items, mode(), enabled()).map(hack => ({
    ...hack, img: items.find(item => quickhackId(item) === hack.id && item.img)?.img
      ?? [...game.items ?? []].find(item => quickhackId(item as unknown as QuickhackItem) === hack.id && item.img)?.img
      ?? `modules/${MODULE}/styles/quickhacks/${hack.id}-gray.png`,
  }));
};
export function validTokens(source: Token, target: Token) {
  if (!enabled() || !source.actor || !target.actor || !canOperate(source.actor)
    || source === target || !target.isVisible || !roleFor(source.actor)
    || canvas.tokens?.get(source.id!) !== source || canvas.tokens?.get(target.id!) !== target) return false;
  const distance = Number(canvas.scene?.grid.distance);
  if (!(distance > 0) || !canvas.grid) return false;
  return isWithinJackInRange(canvas.grid.measurePath([source.center, target.center], {}).distance / distance);
}
const pending = new Set<string>();
export async function executeQuickhack(source: Token, target: Token, id: string) {
  try { requireCombatSocket(); } catch (error) { ui.notifications!.error((error as Error).message); return; }
  if (!validTokens(source, target)) {
    if (enabled()) ui.notifications!.warn("QuickHack requires an owned Netrunner token and another visible target within 25 squares.");
    return;
  }
  if (!hasQuickhackSight(source, target)) { ui.notifications!.warn("Line of sight to this target is required for Jack-In and QuickHack."); return; }
  const actor = source.actor!;
  if (pending.has(actor.uuid)) return;
  let combat:Combat|undefined;
  try{combat=tokenEncounter(source.document.parent?.id,[source.document.uuid,target.document.uuid]);}catch(error){ui.notifications!.error((error as Error).message);return;}
  const encounter=encounterRef(combat,source.document.parent?.id,[source.document.uuid,target.document.uuid]);
  const connection = activeConnection(actor, target.actor!.uuid,undefined,combat);
  if (id === "jack-in" && isEjected(actor, target.actor!.uuid,combat)) { ui.notifications!.warn("Ejected: cannot Jack In to this target again during this encounter."); return; }
  if (id !== "jack-in" && !connection) { ui.notifications!.warn("An active Jack-In connection to this target is required. Start combat to track connections."); return; }
  if (id === "jack-in" && connection) { ui.notifications!.info("Already jacked into this target."); return; }
  if (combat && id === "jack-in" && !game.users!.some(user => user.isGM && user.active)) { ui.notifications!.warn("An active GM is required to track Jack-In connections."); return; }
  const hack = getQuickhack(id);
  if (id !== "jack-in" && (!hack || !actorQuickhacks(actor).some(entry => entry.id === id))) {
    ui.notifications!.warn("This QuickHack is unavailable under the current rules mode."); return;
  }
  pending.add(actor.uuid);
  try {
    const combatUuid = combat?.uuid;
    const valid = () => resolveEncounter(encounter)?.uuid === combatUuid && validTokens(source, target) && hasQuickhackSight(source, target) && (id === "jack-in" ? !isEjected(actor, target.actor!.uuid,combat) : !!activeConnection(actor, target.actor!.uuid, connection!.id,combat) && actorQuickhacks(actor).some(entry => entry.id === id));
    const role = roleFor(actor)!;
    if (!Number.isFinite(Number(foundry.utils.getProperty(role, "system.rank")))) throw new Error(label("Error.InterfaceUnreadable", { actor: actor.name! }));
    const roll = await nativeQuickhackRoll(actor, role, hack ? `${hack.name} · DV${hack.dv}` : label("Roll.JackInCardTitle"),
      actor.hasPlayerOwner ? publicAudience() : gmAudience(), valid, source, false);
    if (!roll || !valid()) return;
    const scenario = { sourceIsPlayer: actor.hasPlayerOwner, targetIsPlayer: target.actor!.hasPlayerOwner };
    const base = { ...encounter, combatUuid, sourceActorUuid: actor.uuid, targetActorUuid: target.actor!.uuid,
      sourceTokenUuid: source.document.uuid, targetTokenUuid: target.document.uuid };
    if (hack) {
      const success = isQuickhackSuccessful(roll.total, hack.dv);
      const alreadyAware=!!connection?.awareness?.alerted;
      const alerted = alreadyAware||isQuickhackTargetAlerted({ success, silentOnSuccess: hack.silentOnSuccess, targetIsPlayer: scenario.targetIsPlayer });
      const route = resolveQuickhackRouting(routing(), scenario);
      const data: QuickhackResult = { ...base, type: "quickhack", connectionId: connection?.id, quickhackId: hack.id, success, alerted, ...route };
      const detail = (route.showInterfaceTotal ? `<p>${label("Quickhack.InterfaceSummary", { interface: roll.total })}</p>` : "")
        + `<p>${label(alerted ? "Quickhack.AwarenessShort" : "Quickhack.UnawareShort", { target: escapeHTML(target.name) })}</p>`;
      const message = await postResult(source, target, data, `${hack.name} · DV${hack.dv}`, label(success ? "Quickhack.SuccessShort" : "Quickhack.FailureShort"), detail, roll.content);
      if (message && combatUuid) await establishConnection(message);
      if (message && success && valid()) await requestEffect(message);
    } else {
      const automatic = !!roleFor(target.actor!);
      const will = Number(foundry.utils.getProperty(target.actor!, "system.stats.will.value"));
      if (!automatic && !Number.isFinite(will)) throw new Error(label("Error.TargetWillUnreadable", { actor: target.actor!.name! }));
      const willTotal = automatic ? 0 : will + await criticalD10();
      if (!valid()) return;
      const alerted = automatic || isTargetAware(roll.total, willTotal);
      const route = resolveJackInRouting(routing(), { ...scenario, targetAware: alerted });
      const data: QuickhackResult = { ...base, type: "jackIn", success: !alerted, alerted, ...route };
      const message = await postResult(source, target, data, label("Roll.JackInCardTitle"), label(alerted ? "Result.DetectedShort" : "Result.UndetectedShort"),
        route.showTotals ? `<p>${label("Result.ContestSummary", { interface: roll.total, will: automatic ? label("Result.Automatic") : willTotal })}</p>` : "", roll.content);
      if (combatUuid && message && valid()) await establishConnection(message);
    }
  } catch (error) {
    console.error(MODULE, error); ui.notifications!.error(error instanceof Error ? error.message : "QuickHack failed.");
  } finally { pending.delete(actor.uuid); }
}
