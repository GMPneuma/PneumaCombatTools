import {GMRequests} from "./gm-request.js";
import {requireCombatSocket} from "./socket-health.js";
import {checkedLuck} from "./evasion-rules.js";
import {nativeCard, rollHidden, spendBonusLuck, diceJSON, showSavedDice, messageDiceAudience, type RollItem} from "./native-combat.js";
import {escapeHTML as esc, primaryGM} from "./shared.js";
import {resolutionSection, canRenderCombatCard} from "./card-structure.js";

const MODULE = "pneuma-combattools";
const path = `flags.${MODULE}.sceneEffect`;
export interface SceneEffectRequest {
  provider: string; group: string; source: string; index: number; target: string;
  title: string; label: string; formula?: string; result?: string; avoidance?: {skill: string; dv: number};
}
interface Row {source: string; index: number; target: string; name: string; state: "ready" | "applying" | "applied" | "review" | "avoided"; result?: string; avoidance?: {skill: string; dv: number; total?: number; html?: string; claim?: {user: string; nonce: string}}}
interface EffectCard {provider: string; group: string; title: string; label: string; formula: string; amount?: number; rollHTML?: string; rows: Row[]; revision: number}
interface Provider {apply(source: string, index: number, card: string, amount?: number, avoided?: boolean): Promise<string>}
const dataOf = (message: ChatMessage) => foundry.utils.getProperty(message, path) as EffectCard | undefined;
export interface SceneAvoidanceQuery {cardId: string; provider: string; source: string; index: number; target: string}
export interface SceneAvoidanceResult {skill: string; dv: number; total: number; passed: boolean}
/** Read a completed check without exposing card storage. */
export function getSceneAvoidanceResult(query: SceneAvoidanceQuery): SceneAvoidanceResult | null {
  const message = game.messages?.get(query.cardId) as ChatMessage | undefined;
  const data = message && dataOf(message);
  if (!data || data.provider !== query.provider) return null;
  const check = data.rows.find(row => row.source === query.source && row.index === query.index && row.target === query.target)?.avoidance;
  if (!check || !Number.isFinite(check.total)) return null;
  return {skill: check.skill, dv: check.dv, total: check.total!, passed: check.total! > check.dv};
}
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(work: () => Promise<T>): Promise<T> {const next = queue.catch(() => {}).then(work); queue = next; return next;}
function gm(): void {if (!game.user?.isGM || game.user.id !== primaryGM()?.id) throw Error("The active GM resolves scene effect cards.");}
function provider(id: string): Provider {
  const module = game.modules?.get(id) as unknown as {active?: boolean; api?: {sceneEffects?: Provider}} | undefined;
  if (!module?.active || !module.api?.sceneEffects?.apply) throw Error("The scene effect provider is unavailable. Enable its module and reload.");
  return module.api.sceneEffects;
}
export function sceneEffectContent(data: EffectCard): string {
  const rolled = !data.formula || data.amount !== undefined;
  return `<section class="rollcard pneuma-scene-effect-card" data-state="${data.rows.every(r => ["applied", "avoided"].includes(r.state)) ? "resolved" : "pending"}"><div class="rollcard-top"><div class="cpr-block">${esc(data.title)}</div></div>`
    + resolutionSection("result", `<p>${esc(data.label)}</p>`)
    + (data.formula ? resolutionSection("damage-roll", data.rollHTML ?? `<p>${esc(data.formula)}</p><button type="button" data-scene-effect-action="roll">Roll shared amount</button>`) : "")
    + resolutionSection("effects", data.rows.map((row, index) => `<div class="pneuma-scene-effect-target" data-state="${row.state}"><strong>${esc(row.name)}</strong> `
      + (row.state === "ready" && rolled && (!row.avoidance || row.avoidance.total !== undefined) ? `<button type="button" data-scene-effect-action="apply" data-row="${index}">Apply effect</button>` : `<span>${esc(row.state)}</span>`)
      + (row.state === "ready" && row.avoidance && row.avoidance.total === undefined ? `<button type="button" data-scene-effect-action="avoid" data-row="${index}">${row.avoidance.claim ? "Roll in progress" : "Roll " + esc(row.avoidance.skill)} (DV ${row.avoidance.dv})</button>` : "")
      + (row.avoidance?.total !== undefined ? `<p>Avoidance: ${row.avoidance.total} vs DV ${row.avoidance.dv} — ${row.avoidance.total > row.avoidance.dv ? "passed" : "failed"}</p>${row.avoidance.html ?? ""}` : "")
      + (row.result ? `<p>${esc(row.result)}</p>` : "")
      + (["review", "applying"].includes(row.state) ? "<p>GM: check the target and source hazard card. This effect cannot be repeated from this card.</p>" : "") + "</div>").join("")) + "</section>";
}
async function save(message: ChatMessage, data: EffectCard): Promise<void> {
  data.revision++;
  if (!await message.update({content: sceneEffectContent(data), [path]: data} as object)) throw Error("Scene effect card could not be saved.");
}
export function createSceneEffect(request: SceneEffectRequest): Promise<string> {
  return serial(async () => {
    gm(); provider(request.provider);
    if (!request.group || !request.source || !Number.isInteger(request.index) || request.index < 0) throw Error("Invalid scene effect reference.");
    if (request.avoidance && (!request.avoidance.skill.trim() || !Number.isFinite(request.avoidance.dv) || request.avoidance.dv < 0)) throw Error("Invalid avoidance skill or DV.");
    const formula = request.formula ?? "";
    if (formula && (!/^[\d\s+dD*\/().-]+$/.test(formula) || !Roll.validate(formula))) throw Error("Invalid scene effect formula.");
    const token = await fromUuid(request.target) as TokenDocument | null;
    if (token?.documentName !== "Token" || !token.actor) throw Error("Scene effect target is unavailable.");
    const existing = game.messages?.find(message => {const d = dataOf(message); return d?.provider === request.provider && d.group === request.group;});
    const data: EffectCard = existing ? foundry.utils.deepClone(dataOf(existing)!) : {provider: request.provider, group: request.group, title: request.title, label: request.label, formula, rows: [], revision: 0};
    if (data.formula !== formula || data.title !== request.title || data.label !== request.label) throw Error("The scene effect group changed.");
    if (data.rows.some(row => row.source === request.source && row.index === request.index)) return existing!.id!;
    data.rows.push({source: request.source, index: request.index, target: request.target, name: token.name,
      ...(request.avoidance && request.result === undefined ? {avoidance: {skill: request.avoidance.skill, dv: request.avoidance.dv}} : {}),
      state: request.result === undefined ? "ready" : "applied", ...(request.result === undefined ? {} : {result: request.result})});
    if (existing) {await save(existing, data); return existing.id!;}
    const messageData = {content: sceneEffectContent(data), speaker: {alias: request.title}, flags: {[MODULE]: {sceneEffect: data}}} as Parameters<typeof ChatMessage.applyRollMode>[0];
    ChatMessage.applyRollMode(messageData, request.avoidance ? "roll" : game.settings!.get("core", "rollMode") as "roll");
    const message = await ChatMessage.create(messageData);
    if (!message) throw Error("Scene effect card creation was cancelled.");
    return message.id!;
  });
}
export function resolveSceneEffect(id: string, action: string, rowIndex: number, revision: number): Promise<void> {
  return serial(async () => {
    gm();
    const message = game.messages?.get(id) as ChatMessage | undefined;
    const saved = message && dataOf(message);
    if (!message || !saved || saved.revision !== revision) throw Error("This scene effect card changed. Review its current state.");
    const data = foundry.utils.deepClone(saved);
    if (action === "roll") {
      if (!data.formula || data.amount !== undefined) return;
      const roll = await new Roll(data.formula).evaluate();
      if (!Number.isFinite(roll.total)) throw Error("The scene effect roll did not produce a number.");
      data.amount = Math.max(0, Math.floor(roll.total!)); data.rollHTML = await roll.render();
      await save(message, data); return;
    }
    const row = data.rows[rowIndex];
    if (action !== "apply" || !row || row.state !== "ready" || data.formula && data.amount === undefined) return;
    if (row.avoidance && (row.avoidance.total === undefined || row.avoidance.total > row.avoidance.dv)) throw Error("Resolve avoidance before applying the effect.");
    const handler = provider(data.provider);
    row.state = "applying"; await save(message, data);
    try {row.result = await handler.apply(row.source, row.index, message.id!, data.amount); row.state = "applied";}
    catch (error) {row.state = "review"; row.result = error instanceof Error ? error.message : String(error);}
    await save(message, data);
  });
}
type AvoidanceRequest = {sceneEffectType: "request"; id: string; user: string; message: string; row: number; action: "claim" | "release" | "commit"; nonce: string; total?: number; html?: string};
const requests = new GMRequests();
const retries = new Map<string, AvoidanceRequest>();
/** Authority validates ownership and a per-row claim; other targets may respond concurrently. */
export function resolveSceneAvoidance(request: AvoidanceRequest): Promise<void> {
  return serial(async () => {
    gm();
    const message = game.messages?.get(request.message) as ChatMessage | undefined;
    const saved = message && dataOf(message);
    const data = saved && foundry.utils.deepClone(saved);
    const row = data?.rows[request.row], avoidance = row?.avoidance;
    const user = game.users?.find(u => u.id === request.user);
    const token = row && await fromUuid(row.target) as TokenDocument | null;
    if (!message || !data || !row || !avoidance || !user || !token?.actor || (!user.isGM && !token.actor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER))) throw Error("You do not own this effect's target.");
    if (!request.nonce) throw Error("Missing avoidance claim.");
    if (request.action === "commit" && avoidance.total !== undefined && avoidance.claim?.nonce === request.nonce && avoidance.claim.user === user.id) return;
    if (row.state !== "ready" || avoidance.total !== undefined) throw Error("This avoidance check is already resolved.");
    if (request.action === "claim") {
      if (avoidance.claim && (avoidance.claim.nonce !== request.nonce || avoidance.claim.user !== user.id)) throw Error("Another avoidance roll is in progress.");
      avoidance.claim = {user: user.id!, nonce: request.nonce};
    } else {
      if (avoidance.claim?.nonce !== request.nonce || avoidance.claim.user !== user.id) throw Error("This avoidance claim changed.");
      if (request.action === "release") delete avoidance.claim;
      else if (request.action === "commit") {
        if (!Number.isFinite(request.total)) throw Error("Invalid avoidance total.");
        avoidance.total = request.total;
        avoidance.html = request.html;
        if (request.total! > avoidance.dv) {
          row.state = "applying";
          await save(message, data);
          try {row.result = await provider(data.provider).apply(row.source, row.index, message.id!, undefined, true); row.state = "avoided";}
          catch (error) {row.state = "review"; row.result = error instanceof Error ? error.message : String(error);}
        }
      } else throw Error("Unknown avoidance action.");
    }
    await save(message, data);
  });
}
function sendAvoidance(request: AvoidanceRequest): Promise<void> {
  requireCombatSocket();
  if (game.user?.id === primaryGM()?.id) return resolveSceneAvoidance(request);
  return requests.request(request.id, () => game.socket!.emit(`module.${MODULE}`, request), 30000, "Avoidance was not confirmed. Click again to resend the same result.");
}
export async function rollSceneAvoidance(message: ChatMessage, rowIndex: number): Promise<void> {
  const row = dataOf(message)?.rows[rowIndex], avoidance = row?.avoidance;
  if (!row || !avoidance) throw Error("Avoidance is unavailable.");
  const key = `${message.id}:${rowIndex}`, previous = retries.get(key);
  if (previous) {await sendAvoidance({...previous, id: foundry.utils.randomID()}); retries.delete(key); return;}
  const token = await fromUuid(row.target) as TokenDocument | null, actor = token?.actor;
  if (!actor || !game.user?.isGM && !actor.isOwner) throw Error("You do not own this effect's target.");
  const item = actor.items.find(i => String(i.type) === "skill" && (i.id === avoidance.skill || i.name.toLowerCase() === avoidance.skill.toLowerCase())) as RollItem | undefined;
  if (!item?.createRoll) throw Error(`Missing native skill: ${avoidance.skill}.`);
  const nonce = foundry.utils.randomID();
  const request = (action: AvoidanceRequest["action"]): AvoidanceRequest => ({sceneEffectType: "request", id: foundry.utils.randomID(), user: game.user!.id!, message: message.id!, row: rowIndex, action, nonce});
  await sendAvoidance(request("claim"));
  let rolled = false;
  try {
    let roll = item.createRoll("skill", actor);
    if (!await roll.handleRollDialog({type: "pneuma-scene-avoidance", ctrlKey: false, metaKey: false}, actor, item)) return;
    checkedLuck(Number(foundry.utils.getProperty(actor, "system.stats.luck.value")), 0, roll.luck);
    roll = await item.confirmRoll(roll);
    await spendBonusLuck(actor, roll.luck);
    await rollHidden(roll); rolled = true;
    const commit = {...request("commit"), total: roll.resultTotal, html: await nativeCard(roll)};
    retries.set(key, commit);
    await sendAvoidance(commit); retries.delete(key);
    await showSavedDice(diceJSON(roll), "roll", game.user!.id, messageDiceAudience(message));
  } finally {
    if (!rolled) await sendAvoidance(request("release"));
    ui.chat?.updateMessage(message);
  }
}
export function registerSceneEffects(): void {
  const module = game.modules!.get(MODULE) as unknown as {api?: Record<string, unknown>};
  module.api = {...module.api, sceneEffects: {version: 3, create: createSceneEffect, getAvoidanceResult: getSceneAvoidanceResult}};
  Hooks.once("ready", () => game.socket!.on(`module.${MODULE}`, (packet: AvoidanceRequest | {sceneEffectType: "reply"; id: string; user: string; gm: string; error?: string}) => {
    if (packet?.sceneEffectType === "reply") requests.reply(packet, undefined);
    else if (packet?.sceneEffectType === "request" && game.user?.id === primaryGM()?.id) {
      const reply = (error?: string) => game.socket!.emit(`module.${MODULE}`, {sceneEffectType: "reply", id: packet.id, user: packet.user, gm: game.user!.id, error});
      void resolveSceneAvoidance(packet).then(() => reply(), error => reply(String(error)));
    }
  }));
  Hooks.on("renderChatMessage", async (message: ChatMessage, html: JQuery) => {
    const data = dataOf(message); if (!data) return;
    const buttons = html.find<HTMLButtonElement>("[data-scene-effect-action]");
    if (!canRenderCombatCard(message)) {buttons.remove(); return;}
    for (const button of buttons.toArray()) {
      const action = button.dataset.sceneEffectAction!, rowIndex = Number(button.dataset.row);
      if (action === "avoid") {
        const row = data.rows[rowIndex];
        const token = row && await fromUuid(row.target) as TokenDocument | null;
        if (!token?.actor || !game.user?.isGM && !token.actor.isOwner) {button.remove(); continue;}
        if (row?.avoidance?.claim) {
          button.disabled = !retries.has(`${message.id}:${rowIndex}`);
          if (!button.disabled) button.textContent = "Retry sending avoidance result";
        }
      } else if (!game.user?.isGM || game.user.id !== primaryGM()?.id) {button.remove(); continue;}
      button.addEventListener("click", event => {
        event.preventDefault(); if (button.disabled) return;
        button.disabled = true;
        void (action === "avoid" ? rollSceneAvoidance(message, rowIndex) : resolveSceneEffect(message.id!, action, rowIndex, data.revision))
          .catch(error => ui.notifications!.error(String(error))).finally(() => {button.disabled = false; ui.chat?.updateMessage(message);});
      });
    }
  });
}
