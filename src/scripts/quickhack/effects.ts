import { requireCombatSocket } from "../socket-health.js";
import { MODULE } from "./availability.js";
import { primaryGM } from "./content.js";
import { getQuickhack } from "./catalog.js";
import { enabled, label } from "./settings.js";
import { canOperate, quickhackDamage } from "./rolls.js";
import { escapeHTML, resultFlag } from "./messages.js";
import { resultConnectionValid } from "./connections.js";

const applying = new Set<string>();
const channel = `module.${MODULE}`;
export async function requestEffect(message: ChatMessage) {
  if (!enabled()) return;
  requireCombatSocket();
  if (primaryGM()) return resolveEffect(message.id!, game.user!.id);
  if (!game.users!.some(user => user.active && user.isGM)) {
    ui.notifications!.warn(label("Effect.ActiveGmRequired")); return;
  }
  game.socket!.emit(channel, { quickhackType: "effect", messageId: message.id, requesterId: game.user!.id });
}
async function effectSummary(message: ChatMessage, text: string, failed = false) {
  if (!enabled()) return;
  const wrapper = document.createElement("div"); wrapper.innerHTML = message.content ?? "";
  const slot = wrapper.querySelector(".pneuma-quickhack-effect");
  if (slot) { slot.textContent = text; slot.classList.toggle("failure", failed); }
  await message.update({ content: wrapper.innerHTML, ["flags." + MODULE + ".quickhack.effectResolved"]: true,
    ["flags." + MODULE + ".quickhack.effectFailed"]: failed });
}
/** Chat creation and module sockets can reach the GM in either order. */
export async function waitForResult(id: string): Promise<ChatMessage | undefined> {
  const existing = game.messages!.get(id) as ChatMessage | undefined;
  if (existing) return existing;
  return new Promise(resolve => {
    const finish = (message?: ChatMessage) => { clearTimeout(timeout); Hooks.off("createChatMessage", hook); resolve(message); };
    const hook = Hooks.on("createChatMessage", (message: ChatMessage) => { if (message.id === id) finish(message); });
    const timeout = setTimeout(() => finish(), 8000);
    const found = game.messages!.get(id) as ChatMessage | undefined; if (found) finish(found);
  });
}
export async function resolveEffect(messageId: string, requesterId: string) {
  if (!enabled() || !primaryGM() || applying.has(messageId)) return;
  applying.add(messageId);
  let message: ChatMessage | undefined;
  try {
    message = await waitForResult(messageId);
    const result = message && resultFlag(message);
    if (!enabled() || !message || !result || result.type !== "quickhack" || !result.success || result.effectResolved) return;
    const requester = game.users!.get(requesterId) as User | undefined;
    const source = await fromUuid(result.sourceActorUuid) as Actor | null;
    const target = await fromUuid(result.targetActorUuid) as Actor | null;
    const hack = getQuickhack(result.quickhackId ?? "");
    if (!requester || !source || !target || !hack || message.author?.id !== requesterId || !canOperate(source, requester)) return;
    if (!resultConnectionValid(source, result)) return;
    if (!enabled()) return;
    // Claim before target writes. Failure is reported for manual resolution, never replayed automatically.
    await message.update({ ["flags." + MODULE + ".quickhack.effectResolved"]: true });
    if (!enabled()) return;
    let key = "Effect.Summary." + hack.id;
    const details: Record<string, string | number> = { target: escapeHTML(target.name) };
    if (hack.id === "sonic-shock") {
      const pack = game.packs!.get("cyberpunk-red-core.core_critical-injuries-head");
      const index = await pack?.getIndex();
      const entry = index?.find(document => document.name === "Damaged Ear");
      const injury = entry ? await pack!.getDocument(entry._id) as Item | undefined : undefined;
      if (!injury) throw new Error(label("Effect.DamagedEarMissing"));
      const { _id, ...data } = injury.toObject();
      if (!enabled()) return;
      await target.createEmbeddedDocuments("Item", [data as never]);
    } else if (hack.id === "overheat") {
      const sourceToken = await fromUuid(result.sourceTokenUuid) as TokenDocument | null;
      const targetToken = await fromUuid(result.targetTokenUuid) as TokenDocument | null;
      if (!targetToken) throw new Error("QuickHack target token no longer exists.");
      await quickhackDamage(source, sourceToken ?? undefined, targetToken, hack.name, hack.automaticDamageFormula!, true);
    } else if (hack.id === "slow") {
      details.amount = (await new Roll("1d6").evaluate()).total!;
    } else if (hack.id === "system-reset") {
      const registered = new Set(CONFIG.statusEffects.map(status => typeof status === "string" ? status : status.id));
      const statuses = ["unconscious", "prone"].filter(id => registered.has(id));
      if (statuses.length && enabled()) await target.createEmbeddedDocuments("ActiveEffect", [{ name: "QuickHack: System Reset", img: "icons/svg/unconscious.svg", statuses,
        flags: { [String(MODULE)]: { quickhackEffect: hack.id } } }]);
      if (statuses.length < 2) key = "Effect.Summary.system-reset-manual";
    }
    await effectSummary(message, label(key, details));
  } catch (error) {
    console.error(MODULE, error);
    if (message) await effectSummary(message, label("Effect.ManualResolutionRequired"), true);
    ui.notifications!.error(label("Effect.ManualResolutionRequired"));
  } finally { applying.delete(messageId); }
}
export async function rollResultDamage(message: ChatMessage) {
  if (!enabled()) return;
  const result = resultFlag(message);
  const hack = getQuickhack(result?.quickhackId ?? "");
  if (!result?.success || result.type !== "quickhack" || !hack?.damageFormula) return;
  const source = await fromUuid(result.sourceActorUuid) as Actor | null;
  const sourceToken = await fromUuid(result.sourceTokenUuid) as TokenDocument | null;
  const targetToken = await fromUuid(result.targetTokenUuid) as TokenDocument | null;
  if (!source || !targetToken?.actor || targetToken.actor.uuid !== result.targetActorUuid || !canOperate(source)) return;
  if (!resultConnectionValid(source, result)) return;
  await quickhackDamage(source, sourceToken ?? undefined, targetToken, hack.name, hack.damageFormula, false);
}
export function registerQuickhackEffects() {
  game.socket!.on(channel, (payload: { quickhackType?: string; messageId?: string; requesterId?: string }) => {
    if (enabled() && payload?.quickhackType === "effect" && typeof payload.messageId === "string" && typeof payload.requesterId === "string")
      void resolveEffect(payload.messageId, payload.requesterId);
  });
}
