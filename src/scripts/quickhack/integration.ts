import { MODULE, LEGACY_MODULE } from "./availability.js";
import { registerQuickhackSheet } from "./sheet.js";
import { enabled, registerQuickhackSettings } from "./settings.js";
import { initializeQuickhackContent, primaryGM } from "./content.js";
import { beginForceOut, clearForceOut, registerForceOut } from "./force-out.js";
import { registerQuickhackEffects, rollResultDamage } from "./effects.js";
import { resultFlag, escapeHTML } from "./messages.js";
import { canOperate } from "./rolls.js";
import { executeQuickhack, actorQuickhacks } from "./workflow.js";
import { registerConnections, connectionFor, resultConnectionValid } from "./connections.js";

export async function executeActorAction(action: string, actorUuid: string, quickhackId?: string) {
  if (!enabled()) return;
  const actor = await fromUuid(actorUuid) as Actor | null;
  if (!actor || !canOperate(actor)) return;
  const controlled = canvas.tokens?.controlled.filter(token => token.actor?.uuid === actor.uuid) ?? [];
  const active = controlled.length ? controlled : actor.getActiveTokens();
  const targets = [...game.user!.targets];
  if (active.length !== 1 || targets.length !== 1) { ui.notifications!.warn("Select one source token and target one other token."); return; }
  if (action === "jack-in" || quickhackId) await executeQuickhack(active[0]!, targets[0]!, action === "jack-in" ? "jack-in" : quickhackId!);
  else if (action === "quickhack") {
    const hacks = actorQuickhacks(actor);
    if (!hacks.length) { ui.notifications!.warn("No QuickHacks available under the current rules mode."); return; }
    const id = await Dialog.prompt({ title: "QuickHack Target", content: `<div class="form-group"><label>QuickHack</label><select name="quickhack">`
      + hacks.map(hack => `<option value="${hack.id}">${escapeHTML(hack.name)} — DV${hack.dv}</option>`).join("") + "</select></div>",
      label: "Perform QuickHack", rejectClose: false,
      callback: html => String(html.find<HTMLSelectElement>('[name="quickhack"]').val() ?? ""),
    });
    if (id && enabled()) await executeQuickhack(active[0]!, targets[0]!, id);
  }
}
const cards = new Map<string, {message: ChatMessage; valid?: boolean}>();
let cardsQueued = false, forceCards = false;
function refreshCards(force = false) {
  forceCards ||= force;
  if (cardsQueued) return;
  cardsQueued = true;
  requestAnimationFrame(() => {
    cardsQueued = false;
    const force = forceCards; forceCards = false;
    for (const entry of cards.values()) {
      const result = resultFlag(entry.message);
      if (!result) {if(force && entry.message.visible && (!entry.message.blind || game.user?.isGM))void ui.chat?.updateMessage(entry.message,false);continue;}
      const valid = resultConnectionValid({uuid:result.sourceActorUuid} as Actor,
        {...result,connectionId:result.type === "jackIn" ? entry.message.id! : result.connectionId});
      if (force || entry.valid !== valid) {
        entry.valid = valid;
        if (entry.message.visible && (!entry.message.blind || game.user?.isGM)) void ui.chat?.updateMessage(entry.message, false);
      }
    }
  });
}
function refreshQuickhack() {
  if (!enabled()) clearForceOut();
  canvas.tokens?.hud?.clear();
  for (const app of Object.values(ui.windows)) if (app instanceof ActorSheet) app.render(false);
  refreshCards(true);
  if (game.ready && enabled() && primaryGM()) void initializeQuickhackContent().catch(reportError);
}
function reportError(error: unknown) { console.error(MODULE, error); ui.notifications!.error(error instanceof Error ? error.message : "QuickHack failed."); }
export function registerQuickhack(context: () => {source?: Token; target?: Token; self?: boolean} = () => ({})) {
  registerQuickhackSheet(executeActorAction);
  registerQuickhackSettings(refreshQuickhack);
  let hudQueued = false;
  const refreshSight = () => {
    if (!enabled() || !canvas.tokens?.hud?.rendered || context().self || hudQueued) return;
    hudQueued = true;
    requestAnimationFrame(() => {
      hudQueued = false;
      if (enabled() && canvas.tokens?.hud?.rendered && !context().self) canvas.tokens.hud.render(true);
    });
  };
  const remember = (message: ChatMessage) => {
    const result = resultFlag(message);
    if (result && message.id) {
      cards.set(message.id, {message, valid:resultConnectionValid({uuid:result.sourceActorUuid} as Actor,
        {...result,connectionId:result.type === "jackIn" ? message.id : result.connectionId})});
      const {source,target} = context();
      if ([source?.document.uuid,target?.document.uuid].some(id => id && [result.sourceTokenUuid,result.targetTokenUuid].includes(id))) refreshSight();
    } else if (message.id) {
      if(foundry.utils.getProperty(message,`flags.${MODULE}.quickhack`))cards.set(message.id,{message});
      else cards.delete(message.id);
    }
  };
  Hooks.on("createChatMessage", remember);
  Hooks.on("updateChatMessage", remember);
  Hooks.on("deleteChatMessage", (message: ChatMessage) => {remember(message);cards.delete(message.id!);});
  Hooks.on("deleteCombat", () => {if(enabled()){refreshSight();refreshCards();}});
  Hooks.on("updateToken", (token: TokenDocument, changes: Record<string,unknown>) => {
    const {source,target} = context();
    if (token !== source?.document && token !== target?.document) return;
    if (["x","y","elevation","hidden","actorId","actorLink","width","height"].some(key => key in changes)) refreshSight();
  });
  for (const hook of ["createWall","updateWall","deleteWall"]) Hooks.on(hook, (wall: WallDocument) => {
    if (wall.parent?.id === canvas.scene?.id) refreshSight();
  });
  Hooks.once("ready", async () => {
    for (const message of game.messages ?? []) remember(message);
    const module = game.modules!.get(MODULE) as unknown as { api?: Record<string, unknown> };
    module.api = { ...module.api, quickhack: { execute: executeQuickhack, executeActorAction, connectionFor } };
    registerConnections(); registerQuickhackEffects(); registerForceOut();
    if (game.modules!.get(LEGACY_MODULE)?.active && game.user!.isGM)
      ui.notifications!.warn("Disable Pneuma Quickhack to use Combat Tools QuickHack. The standalone module controls its own functions.");
    if (primaryGM()) {
      try { await initializeQuickhackContent(); } catch (error) { reportError(error); }
    }
  });
  Hooks.on("updateCombat", (_combat: Combat, changes: Record<string, unknown>) => {
    if (!enabled()) return;
    const keys = Object.keys(foundry.utils.flattenObject(changes));
    if (keys.some(key => key.startsWith(`flags.${MODULE}.quickhackConnections`)) || "active" in changes || changes.round === 0 || changes.round === 1) {
      refreshSight();refreshCards();
    }
  });
  Hooks.on("renderChatMessage", async (message: ChatMessage, html: JQuery) => {
    const state = ((message.flags as Record<string, unknown>)[MODULE] as { quickhack?: unknown } | undefined)?.quickhack;
    if (!state) return;
    const root = html[0]; if (!root) return;
    // Capture also blocks already-rendered native damage controls after the switch changes.
    root.addEventListener("click", event => {
      if (!enabled()) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    if (!enabled()) { html.find("button, a[data-action], [data-quickhack-action]").remove(); return; }
    const result = resultFlag(message); if (!result) return;
    const source = await fromUuid(result.sourceActorUuid) as Actor | null;
    const target = await fromUuid(result.targetActorUuid) as Actor | null;
    for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>("[data-quickhack-action]"))) {
      const actor = button.dataset.quickhackAction === "damage" ? source : target;
      const connectionId = result.type === "jackIn" ? message.id! : result.connectionId;
      if (!actor || !canOperate(actor) || !enabled() || !source || !resultConnectionValid(source, { ...result, connectionId })) { button.remove(); continue; }
      button.addEventListener("click", async event => {
        event.preventDefault(); event.stopPropagation(); if (!enabled() || button.disabled) return;
        button.disabled = true;
        try { if (button.dataset.quickhackAction === "damage") await rollResultDamage(message); else await beginForceOut(message); }
        catch (error) { reportError(error); } finally { button.disabled = false; }
      });
    }
  });
}
