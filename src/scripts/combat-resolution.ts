import { empDisabled } from "./emp-rules.js";
import { requireCombatSocket } from "./socket-health.js";
import { grappleWeaponBlocked } from "./grapple/state.js";
import { PendingCardRefresh } from "./pending-card-refresh.js";
import { setItemMarker } from "./item-markers.js";
import type { CriticalMethod } from "./critical-injury.js";
import { resolutionSection, rollOutcomeClass } from "./card-structure.js";
import { damageContent, handleDamage, renderDamage, type DamageState, type DamageRequest } from "./damage-flow.js";
import { homebrew } from "./evasion-settings.js";
import { checkedLuck, evasionButtonLabel, evasionOffer, type EvasionOffer } from "./evasion-rules.js";
import { attackDialog, registerAttackDialog, diceJSON, evasionDialog, nativeAPI, nativeCard, registerEvasionDialog, rollHidden, spendBonusLuck,
  type RollItem } from "./native-combat.js";
import { distanceWithElevation, parseDV } from "./dv-data.js";
import { getTable } from "./dv-hover.js";
import type { AttackMode } from "./attack-menu.js";

const MODULE = "pneuma-combattools";
const CHANNEL = "module." + MODULE;
declare global {
  interface SettingConfig {
    "pneuma-combattools.combatResolution": boolean;
    "pneuma-combattools.hideAttackWeapon": boolean;
  }
}
interface Usage { round: string; used: number; lastPayment?: string }
interface Defense { total: number; html: string; dice: string[]; bonus: number; fee: number; penalty: number }
export interface Exchange {
  attacker: string; defender: string; defenderActor: string; attackerName: string; defenderName: string;
  ranged: boolean; category: string; title: string; dv?: number; total: number; html: string; dice: string[];
  rollMode: string; state: "waiting" | "applying" | "resolved" | "cancelled"; defense?: Defense;
  combatId?: string | null; combatEpoch?: string; round?: string; hit?: boolean;
  coverUp?:boolean; weaponType?: string; damageFormula?: string; thrownSource?: object; improvised?: boolean; improvisedDice?: number; criticalMethod?: CriticalMethod; weaponId?: string; attackMode?: AttackMode; location?: string; unaware?: boolean; damage?: DamageState;
}
interface Request { id: string; user: string; message: string; action: "claim" | "release" | "decline" | "commit" | "resume" | "cancel" | DamageRequest["action"];
  statusEffects?: string[]; nonce?: string; defense?: Defense; damage?: DamageRequest["damage"]; options?: DamageRequest["options"]; targetUuid?: string; application?: DamageRequest["application"]; applicationId?: string }
interface Claim { user: string; message: string; nonce: string; offer: EvasionOffer; round: string }
const claims = new Map<string, Claim>();
const pending = new Map<string, { resolve(value: Claim | undefined): void; reject(error: Error): void }>();
const retry = new Map<string, { nonce: string; defense: Defense }>();
let queue: Promise<unknown> = Promise.resolve();
let trackingReady = true;
const flag = <T>(doc: object, name: string): T | undefined =>
  foundry.utils.getProperty(doc, "flags." + MODULE + "." + name) as T | undefined;
const escape = (text: unknown) => String(text ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
function authority(): User | undefined { return game.users?.filter(user => user.active && user.isGM).sort((a,b) => a.id.localeCompare(b.id))[0]; }
export const defenderKey = (actor: Actor): string => encodeURIComponent(actor.uuid).replaceAll(".", "%2E");
function exchangeCombatId(data: Exchange): string | null | undefined {
  // Older confirmed exchanges have an unambiguous round reference; pending ones do not.
  if (data.combatId !== undefined) return data.combatId;
  if (data.round === "outside-combat") return null;
  return data.round?.split(":")[0];
}
function exchangeCombat(data: Exchange): Combat | undefined {
  const id = exchangeCombatId(data);
  return id ? game.combats?.get(id) as Combat | undefined : undefined;
}
function roundKey(combat?: Combat): string {
  return combat?.started ? combat.id + ":" + combat.round : "outside-combat";
}
function claimKey(data: Exchange, actor: Actor): string {
  return String(exchangeCombatId(data)) + ":" + actor.uuid;
}
function currentCombat(data: Exchange): Combat | undefined {
  const id = exchangeCombatId(data);
  if (id === undefined) throw new Error("This older attack has no combat reference. Cancel it and start a new attack.");
  if (id === null) return;
  const combat = exchangeCombat(data);
  if (!combat?.started || (flag<string>(combat, "evasionEpoch") ?? "") !== (data.combatEpoch ?? ""))
    throw new Error("The originating combat ended or was reset. Cancel this attack and start a new one.");
  return combat;
}
export function combatForAttack(attacker: Token, defender: Token): Combat | undefined {
  const matches = (combat: Combat) => combat.started && [attacker, defender].every(token =>
    combat.combatants.some(combatant => combatant.token?.uuid === token.document.uuid));
  const combats = game.combats?.filter(matches) ?? [];
  const selected = combats.find(combat => combat.id === game.combat?.id);
  if (selected) return selected;
  if (combats.length > 1) throw new Error("Select the intended combat in the combat tracker before attacking.");
  return combats[0];
}
async function tokenActor(uuid: string): Promise<Actor> {
  const token = await fromUuid(uuid) as TokenDocument | null;
  if (!token?.actor) throw new Error("The combat token or actor no longer exists.");
  return token.actor;
}
export function offer(actor: Actor, ranged: boolean, combat?: Combat): EvasionOffer {
  if (!ranged) return { allowed: true, penalty: 0, cost: 0, free: 0, reason: "Free evasion" };
  const get = (key: string) => foundry.utils.getProperty(actor, key);
  const items = Array.from(actor.items);
  const coName = game.i18n!.localize("CPR.global.itemType.cyberware.reflexCoProcessor");
  const coprocessor = items.some(item => !empDisabled(item) && String(item.type) === "cyberware"
    && (item.name?.toLowerCase() === "reflex co-processor" || item.name === coName
      || String(foundry.utils.getProperty(item, "flags.core.sourceId") ?? "").endsWith(".0z0v50kDAgHvMquv"))
    && foundry.utils.getProperty(item, "system.isInstalledInActor") === true);
  const solo = items.some(item => String(item.type) === "role"
    && (item.name?.toLowerCase() === "solo" || foundry.utils.getProperty(item, "system.roleName") === "solo")
    && ((foundry.utils.getProperty(item, "system.abilities") ?? []) as { name: string; rank: number }[])
      .some(ability => ["threat detection", game.i18n!.localize("CPR.global.role.solo.ability.threatDetection").toLowerCase()]
        .includes(ability.name.toLowerCase()) && Number(ability.rank) >= 2));
  const usage = combat ? flag<Usage>(combat, "evasionUsage." + defenderKey(actor)) : undefined;
  const mode = game.settings!.get(MODULE, "evasionEligibility");
  if (ranged && mode === "custom" && usage?.round.startsWith(combat?.id + ":")
    && Number(usage.round.split(":")[1]) > Number(combat?.round)) {
    return { allowed: false, penalty: 0, cost: 0, free: 0,
      reason: "Combat round moved backward. Return to the latest round before using tracked evasions." };
  }
  return evasionOffer(ranged, mode, homebrew(),
    { ref: Number(get("system.stats.ref.value")), coprocessor, solo, luck: Number(get("system.stats.luck.value")) },
    usage?.round === roundKey(combat) ? usage.used : 0, !!combat?.started);
}
export function exchangeContent(data: Exchange): string {
  if (data.state !== "resolved") return '<div class="pneuma-resolution-card">' + resolutionSection("pending", '<div class="rollcard pneuma-pending-exchange"><div class="rollcard-top"><div class="cpr-block">'
    + '<div class="pneuma-pending-title">' + escape(data.title) + '</div>'
    + '<p class="pneuma-pending-status">' + (data.state === "cancelled" ? "Exchange cancelled by GM" : data.state === "applying" ? "Finishing evasion payment…" : "Waiting for defense choice")
    + '</p></div></div></div><div class="pneuma-pending-controls"></div>') + '</div>';
  const doc = new DOMParser().parseFromString(data.html, "text/html");
  let legacyDamage = "";
  doc.querySelectorAll('[data-action="rollDamage"]').forEach(node => {
    if (!legacyDamage) legacyDamage = node.outerHTML;
    node.remove();
  });
  doc.querySelectorAll(".rollcard-subtitle").forEach(node => node.classList.add("pneuma-attack-subtitle"));
  // Scope expandable defense details separately from the attack's identically named classes.
  let defense = "";
  if (data.defense) {
    const part = new DOMParser().parseFromString(data.defense.html, "text/html");
    for (const node of Array.from(part.querySelectorAll("[data-visible-element]"))) {
      const name = node.getAttribute("data-visible-element")!;
      part.querySelectorAll("." + name).forEach(el => el.classList.replace(name, "pneuma-defense-" + name));
      node.setAttribute("data-visible-element", "pneuma-defense-" + name);
    }
    part.querySelectorAll(".rollcard-top .cpr-block > .text-small").forEach(node => node.remove());
    if (data.defense.fee) {
      const heading = part.querySelector(".rollcard-top .cpr-block > .text-normal")
        ?? part.querySelector(".rollcard-top .cpr-block");
      if (heading) {
        heading.classList.add("pneuma-evasion-heading");
        const cost = part.createElement("span"); cost.className = "pneuma-evasion-cost";
        cost.textContent = data.defense.fee + " LUCK";
        cost.title = "Evasion cost: " + data.defense.fee + " LUCK";
        heading.append(cost);
      }
    }
    defense = resolutionSection("evade", part.body.innerHTML,
      "pneuma-defense-result " + rollOutcomeClass(!data.hit));
  }
  const opposed = data.unaware ? "Defender unaware — no evasion" : data.defense ? "Evasion " + data.defense.total : data.ranged ? "DV " + data.dv : "Defense declined";
  const damageControl = data.weaponId
    ? '<button type="button" class="pneuma-result-damage" data-action="pneumaRollDamage" aria-label="Roll damage" title="Roll damage (Shift-click for options; manual override allowed)"><i class="fas fa-droplet" aria-hidden="true"></i></button>'
    : legacyDamage;
  return '<div class="pneuma-resolution-card">'
    + resolutionSection("attack", doc.body.innerHTML, "pneuma-attack-result " + rollOutcomeClass(!!data.hit))
    + defense + resolutionSection("result", '<p class="pneuma-combat-outcome" title="' + escape(opposed) + '">' + damageControl + '<strong class="pneuma-result-summary">'
    + escape(data.attackerName) + ' <span class="' + (data.hit ? "pneuma-hit" : "pneuma-miss") + '">'
    + (data.hit ? "hits" : "misses") + '</span> ' + escape(data.defenderName)
    + '</strong></p>') + damageContent(data) + '</div>';
}
async function writeExchange(message: ChatMessage, data: Exchange): Promise<void> {
  const changes: Record<string, unknown> = { ["flags." + MODULE + ".exchange"]: data, content: exchangeContent(data) };
  if (!data.damage && flag<Exchange>(message, "exchange")?.damage)
    changes["flags." + MODULE + ".exchange.-=damage"] = null;
  await message.update(changes);
}
async function revealDice(data: Exchange): Promise<void> {
  if (!data.dice.length && !data.defense?.dice.length) return;
  const { Dice } = await nativeAPI();
  for (const json of [...data.dice, ...(data.defense?.dice ?? [])]) {
    await Dice.handle3dDice(Roll.fromJSON(json) as Roll, data.rollMode);
  }
}
async function finish(message: ChatMessage, data: Exchange, actor: Actor): Promise<void> {
  const defense = data.defense;
  if (defense) {
    // The receipt is written atomically with native LUCK, then removed after both documents commit.
    const paid = flag<string>(actor, "evasionPayment") === message.id
      || flag<Usage>(actor, "evasionUsage")?.lastPayment === message.id;
    const combat = paid ? exchangeCombat(data) : currentCombat(data);
    if (!paid) {
      const current = Number(foundry.utils.getProperty(actor, "system.stats.luck.value"));
      const luck = checkedLuck(current, defense.fee, defense.bonus);
      await actor.update({ "system.stats.luck.value": luck,
        ["flags." + MODULE + ".evasionPayment"]: message.id } as Parameters<Actor["update"]>[0]);
    }
    // Never recreate counters on an ended/reset/deleted Combat during payment recovery.
    if (combat?.started && (flag<string>(combat, "evasionEpoch") ?? "") === (data.combatEpoch ?? "")) {
      const key = "evasionUsage." + defenderKey(actor);
      const usage = flag<Usage>(combat, key);
      if (usage?.lastPayment !== message.id) {
        const round = data.round!;
        const used = (usage?.round === round ? usage.used : 0) + (data.ranged ? 1 : 0);
        await combat.update({ ["flags." + MODULE + "." + key]: { round, used, lastPayment: message.id } });
      }
    }
  }
  data.hit = defense ? data.total > defense.total : !data.ranged || data.total > data.dv!;
  data.state = "resolved";
  await writeExchange(message, data);
  claims.delete(claimKey(data, actor));
  if (flag<string>(actor, "evasionPayment") === message.id)
    await actor.update({ ["flags." + MODULE + ".-=evasionPayment"]: null });
  void revealDice(data).catch(error => console.warn(MODULE, "Dice display failed", error));
}
export async function handleCombatRequest(request: Request): Promise<Claim | undefined> {
  if (!trackingReady) throw new Error("Evasion tracking migration is not finished. Wait and retry; reload if migration reported an error.");
  const message = game.messages?.get(request.message) as ChatMessage | undefined;
  const stored = message && flag<Exchange>(message, "exchange");
  const user = game.users?.get(request.user) as User | undefined;
  if (!message || !stored || !user?.active) throw new Error("Combat exchange is unavailable.");
  if (request.action.startsWith("damage")) {
    if (!user.isGM && (message.blind || (message.whisper.length && !message.whisper.includes(user.id) && message.author?.id !== user.id)))
      throw new Error("This is a private exchange.");
    const data = foundry.utils.deepClone(stored);
    await handleDamage(request as DamageRequest, user, data, () => writeExchange(message, data));
    return;
  }
  const actor = await tokenActor(stored.defender);
  if (!user.isGM && !actor.testUserPermission(user, "OWNER")) throw new Error("Only the defender's owner or GM can respond.");
  if (!user.isGM && message.whisper.length && !message.whisper.includes(user.id) && message.author?.id !== user.id)
    throw new Error("This is a private exchange.");
  const data = foundry.utils.deepClone(stored);
  const claim = claims.get(claimKey(data, actor));
  if (request.action === "release") {
    if (claim && claim.nonce === request.nonce && claim.user === user.id) claims.delete(claimKey(data, actor));
    return;
  }
  if (data.state === "resolved" || data.state === "cancelled") {
    if (flag<string>(actor, "evasionPayment") === message.id)
      await actor.update({ ["flags." + MODULE + ".-=evasionPayment"]: null });
    return;
  }
  if (request.action === "cancel") {
    const paid = flag<string>(actor, "evasionPayment") === message.id
      || flag<Usage>(actor, "evasionUsage")?.lastPayment === message.id;
    if (!user.isGM || (data.state === "applying" && paid))
      throw new Error("Only a GM can cancel, and a charged payment must finish first.");
    data.state = "cancelled"; await writeExchange(message, data); claims.delete(claimKey(data, actor)); return;
  }
  if (request.action === "resume") {
    if (data.state !== "applying") throw new Error("There is no payment to finish.");
    await finish(message, data, actor); return;
  }
  if (data.state !== "waiting") throw new Error("Finish the pending payment before continuing.");
  const combat = currentCombat(data);
  const unfinished = game.messages?.find(other => {
    const exchange = flag<Exchange>(other, "exchange");
    return other.id !== message.id! && exchange?.defenderActor === actor.uuid && exchange.state === "applying";
  });
  if (unfinished) throw new Error("Finish the defender's pending payment on the earlier card first.");
  if (request.action === "claim") {
    if (claim?.user === user.id && claim.message === message.id!) return claim;
    if (claim && game.users?.get(claim.user)?.active) throw new Error("Another Evasion dialog is already open for this defender.");
    const choice = offer(actor, data.ranged, combat);
    if (!choice.allowed) throw new Error(choice.reason);
    const next = { user: user.id!, message: message.id!, nonce: foundry.utils.randomID(), offer: choice, round: roundKey(combat) };
    claims.set(claimKey(data, actor), next); return next;
  }
  if (request.action === "decline") {
    if (claim && game.users?.get(claim.user)?.active) throw new Error("Close the open Evasion dialog first.");
    await finish(message, data, actor); return;
  }
  if (!claim || claim.nonce !== request.nonce || claim.user !== user.id || claim.message !== message.id!)
    throw new Error("Review evasion: the reservation expired. Try again.");
  const current = offer(actor, data.ranged, combat);
  if (!current.allowed || claim.round !== roundKey(combat) || current.penalty !== claim.offer.penalty || current.cost !== claim.offer.cost)
    throw new Error("Review evasion: conditions changed. Try again with the new cost.");
  const defense = request.defense;
  if (!defense || !Number.isFinite(defense.total) || defense.penalty !== current.penalty || defense.fee !== current.cost)
    throw new Error("Invalid Evasion result.");
  try { checkedLuck(Number(foundry.utils.getProperty(actor, "system.stats.luck.value")), defense.fee, defense.bonus); }
  catch (error) { throw new Error("Review evasion: " + (error as Error).message); }
  data.defense = defense; data.round = claim.round; data.state = "applying";
  // Persist the exact roll before charging: a retry finishes it without another roll or payment.
  await writeExchange(message, data);
  await finish(message, data, actor);
}
export function serialized(request: Request): Promise<Claim | undefined> {
  const next = queue.then(() => handleCombatRequest(request));
  queue = next.catch(() => undefined);
  return next;
}
async function request(message: string, action: Request["action"], extra: Partial<Request> = {}): Promise<Claim | undefined> {
  requireCombatSocket();
  const gm = authority();
  if (!gm) throw new Error("An active GM is required for combat resolution.");
  const packet: Request = { ...extra, id: foundry.utils.randomID(), user: game.user!.id, message, action };
  if (gm.id === game.user!.id) return serialized(packet);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(packet.id); reject(new Error("GM response timed out. Retry this card.")); }, 15000);
    pending.set(packet.id, { resolve: value => { clearTimeout(timer); pending.delete(packet.id); resolve(value); },
      reject: error => { clearTimeout(timer); pending.delete(packet.id); reject(error); } });
    game.socket!.emit(CHANNEL, { kind: "request", gm: gm.id, packet });
  });
}
async function respond(message: ChatMessage, evade: boolean): Promise<void> {
  const data = flag<Exchange>(message, "exchange")!;
  if (data.state === "applying") { await request(message.id!, "resume"); retry.delete(message.id!); return; }
  if (!evade) { await request(message.id!, "decline"); return; }
  const previous = retry.get(message.id!);
  if (previous) {
    try { await request(message.id!, "commit", previous); retry.delete(message.id!); }
    catch (error) {
      if ((error as Error).message.startsWith("Review evasion:")) {
        retry.delete(message.id!);
        await request(message.id!, "release", { nonce: previous.nonce });
      }
      throw error;
    }
    return;
  }
  const claim = await request(message.id!, "claim");
  if (!claim) return;
  try {
    const actor = await tokenActor(data.defender);
    const name = game.i18n!.localize("CPR.global.itemType.skill.evasion");
    const skill = actor.items.find(item => String(item.type) === "skill"
      && (item.name === name || item.name?.toLowerCase() === "evasion")) as RollItem | undefined;
    if (!skill) throw new Error("The defender has no Evasion skill item.");
    const roll = skill.createRoll("skill", actor);
    if (!await evasionDialog(roll, actor, skill, claim.offer.penalty, claim.offer.cost)) return;
    checkedLuck(Number(foundry.utils.getProperty(actor, "system.stats.luck.value")), claim.offer.cost, roll.luck);
    await rollHidden(roll);
    const result = { nonce: claim.nonce, defense: { total: roll.resultTotal, html: await nativeCard(roll),
      dice: diceJSON(roll), bonus: roll.luck, fee: claim.offer.cost, penalty: claim.offer.penalty } };
    retry.set(message.id!, result);
    await request(message.id!, "commit", result);
    retry.delete(message.id!);
  } catch (error) {
    if ((error as Error).message.startsWith("Review evasion:")) retry.delete(message.id!);
    throw error;
  } finally {
    // Keep the claim while a submitted result can still be retried.
    if (!retry.has(message.id!)) await request(message.id!, "release", { nonce: claim.nonce });
  }
}
export async function startCombatExchange(attacker: Token, target: Token, itemId: string, mode: AttackMode, event: JQuery.ClickEvent, thrown?: { item: RollItem; source: object; improvised: boolean }): Promise<void> {
  requireCombatSocket();
  if (!authority()) throw new Error("An active GM is required for combat resolution.");
  const combat = combatForAttack(attacker, target);
  const combatId = combat?.id ?? null;
  const combatEpoch = combat ? flag<string>(combat, "evasionEpoch") ?? "" : "";
  const actor = attacker.actor!;
  const item = thrown?.item ?? actor.items.get(itemId) as RollItem;
  if (!item || typeof item.createRoll !== "function") throw new Error("Native weapon roll is unavailable.");
  let ranged = !!foundry.utils.getProperty(item, "system.isRanged");
  const type = String(foundry.utils.getProperty(item, "system.weaponType"));
  if (type.toLowerCase().includes("melee") || ["unarmed", "martialArts"].includes(type)) ranged = false;
  const category = ranged ? "Ranged" : ["unarmed", "martialArts"].includes(type) ? "Unarmed" : "Melee";
  // Native createRoll displays its own out-of-bullets warning but does not abort.
  let roll = item.createRoll(mode, actor);
  if (ranged && item.hasAmmo && !item.hasAmmo(roll)) return;
  let dv: number | undefined;
  if (ranged) {
    const distance = distanceWithElevation(canvas.grid!.measurePath([attacker.center, target.center], {}).distance,
      attacker.document.elevation, target.document.elevation);
    const tableName = String(foundry.utils.getProperty(item, "system.dvTable") ?? "") + (mode === "autofire" ? " (Autofire)" : "");
    dv = parseDV((await getTable(tableName))?.getResultsForRoll(distance)[0]?.text);
    if (dv === undefined) throw new Error("No ranged DV is available for this weapon and distance.");
  }
  const choice = await attackDialog(roll, actor, item, event, !!thrown?.improvised);
  if (!choice.confirmed) return;
  if (!thrown && grappleWeaponBlocked(actor, item)) throw new Error("Grappled characters cannot use weapons requiring two hands.");
  if (ranged && item.hasAmmo && !item.hasAmmo(roll)) {
    ui.notifications!.warn(game.i18n!.localize("CPR.messages.weaponAttackOutOfBullets"));
    return;
  }
  currentCombat({ combatId, combatEpoch } as Exchange);
  checkedLuck(Number(foundry.utils.getProperty(actor, "system.stats.luck.value")), 0, roll.luck);
  roll = await item.confirmRoll(roll);
  await spendBonusLuck(actor, roll.luck);
  await rollHidden(roll);
  roll.entityData = { actor: actor.id!, token: attacker.id, item: itemId, tokens: [target.id] };
  if (mode === "aimed") await actor.update({ "flags.cyberpunk-red-core.aimedLocation": roll.location } as Parameters<Actor["update"]>[0]);
  const title = game.settings!.get(MODULE, "hideAttackWeapon") ? category : item.name ?? category;
  roll.rollTitle = title;
  const data: Exchange = { weaponType: type, ...(thrown ? { thrownSource: thrown.source, improvised: thrown.improvised, improvisedDice: choice.improvisedDice } : {}), criticalMethod: type === "grenadeLauncher" ? "Grenade" : type === "rocketLauncher" ? "Rocket" : undefined, weaponId: itemId, attackMode: mode, location: roll.location, unaware: choice.unaware, combatId, combatEpoch, attacker: attacker.document.uuid, defender: target.document.uuid, defenderActor: target.actor!.uuid,
    attackerName: attacker.name ?? "", defenderName: target.name ?? "", ranged, category, title, dv,
    total: roll.resultTotal, html: await nativeCard(roll), dice: diceJSON(roll),
    rollMode: game.settings!.get("core", "rollMode") ?? "roll", state: "waiting" };
  if (choice.unaware) { data.state = "resolved"; data.hit = !ranged || data.total > dv!; }
  const messageData = { content: exchangeContent(data), speaker: ChatMessage.getSpeaker({ actor, token: attacker.document }),
    flags: { [MODULE]: { exchange: data } } } as Parameters<typeof ChatMessage.applyRollMode>[0];
  ChatMessage.applyRollMode(messageData, data.rollMode as "roll");
  await ChatMessage.create(messageData);
  if (thrown && !thrown.improvised) {
    const original = actor.items.get(itemId);
    if (original) await setItemMarker(original, "used", { label: "Used" });
  }
  if (choice.unaware) void revealDice(data).catch(error => console.warn(MODULE, error));
}
/** Resetting a Combat removes only its transient counters; deselecting it must not. */
export function resetCombatTracking(_combat: Combat, changes: Record<string, unknown>): void {
  if (changes.round === undefined || Number(changes.round) !== 0) return;
  changes["flags." + MODULE + ".-=evasionUsage"] = null;
  changes["flags." + MODULE + ".evasionEpoch"] = foundry.utils.randomID();
}
/** Move the first test version's counters to their recorded Combat without choosing a current combat. */
export async function migrateActorUsage(actor: Actor): Promise<void> {
  const old = flag<Usage>(actor, "evasionUsage");
  if (!old) return;
  const combat = game.combats?.get(old.round.split(":")[0]!) as Combat | undefined;
  if (combat?.started && !flag<string>(combat, "evasionEpoch")) {
    const key = "evasionUsage." + defenderKey(actor);
    if (!flag<Usage>(combat, key))
      await combat.update({ ["flags." + MODULE + "." + key]: old });
  }
  const payment = old.lastPayment ? game.messages?.get(old.lastPayment) : undefined;
  const pendingPayment = payment && flag<Exchange>(payment, "exchange")?.state === "applying";
  const changes: Record<string, unknown> = { ["flags." + MODULE + ".-=evasionUsage"]: null };
  if (pendingPayment) changes["flags." + MODULE + ".evasionPayment"] = old.lastPayment;
  await actor.update(changes);
}
/** Styling metadata only; never use these attributes to authorize an action. */
export function decorateCombatMessage(root: HTMLElement, data: Exchange): void {
  root.classList.add("pneuma-combat-message");
  root.dataset.pneumaExchangeState = data.state;
  root.dataset.pneumaDamageState = data.damage?.status ?? "none";
  root.dataset.pneumaOutcome = data.state === "resolved" ? (data.hit ? "hit" : "miss") : "none";
}
export function registerCombatResolution(): void {
  for (const [key, name, hint, value] of [
    ["combatResolution", "Combat resolution", "Attack cards from Combat Tools offer Evade / Do not Evade. Requires an active GM.", true],
    ["hideAttackWeapon", "Hide attack weapon names", "Use Ranged, Melee or Unarmed instead of weapon names on Combat Tools attack cards.", false],
  ] as const) game.settings!.register(MODULE, key, { name, hint, scope: "world", config: true, type: Boolean, default: value });
  registerEvasionDialog();
  registerAttackDialog();
  const pendingCards = new PendingCardRefresh(message => { ui.chat?.updateMessage(message); });
  const refreshPending = () => pendingCards.refresh();
  Hooks.on("createChatMessage", (message: ChatMessage) => pendingCards.remember(message));
  Hooks.on("updateChatMessage", (message: ChatMessage) => pendingCards.remember(message));
  Hooks.on("deleteChatMessage", (message: ChatMessage) => { if (message.id) pendingCards.forget(message.id); });
  Hooks.on("updateActor", (actor: Actor) => pendingCards.refresh(actor.uuid));
  for (const hook of ["createItem", "updateItem", "deleteItem", "createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
    Hooks.on(hook, (doc: { parent?: { uuid?: string; parent?: { uuid?: string } } }) => {
      const owner = doc.parent;
      if (owner?.uuid) pendingCards.refresh(owner.uuid);
      if (owner?.parent?.uuid) pendingCards.refresh(owner.parent.uuid);
    });
  }
  Hooks.on("preUpdateCombat", resetCombatTracking);
  const clearCombatClaims = (combat: Combat) => {
    for (const [key, claim] of claims) {
      const message = game.messages?.get(claim.message);
      const data = message && flag<Exchange>(message, "exchange");
      if (data && exchangeCombatId(data) === combat.id) claims.delete(key);
    }
  };
  Hooks.on("updateCombat", (combat: Combat, changes: { round?: number | null }) => {
    if (changes.round !== undefined && Number(changes.round) === 0) clearCombatClaims(combat);
    if (combat.id) pendingCards.refresh(undefined, combat.id);
  });
  Hooks.on("deleteCombat", (combat: Combat) => { clearCombatClaims(combat); if (combat.id) pendingCards.refresh(undefined, combat.id); });
  Hooks.on("updateSetting", (setting: { key?: string }) => {
    if (setting.key?.startsWith(MODULE + ".evasion")) refreshPending();
  });
  Hooks.once("ready", () => {
    for (const message of game.messages ?? []) pendingCards.remember(message);
    if (authority()?.id === game.user!.id) {
      trackingReady = false;
      const actors = new Map<string, Actor>();
      for (const actor of game.actors ?? []) actors.set(actor.uuid, actor);
      for (const scene of game.scenes ?? []) for (const token of scene.tokens)
        if (token.actor) actors.set(token.actor.uuid, token.actor);
      void (async () => {
        for (const actor of actors.values()) await migrateActorUsage(actor);
        trackingReady = true;
        refreshPending();
      })().catch(error => {
        console.error(MODULE, error);
        ui.notifications!.error("Could not migrate evasion counters. Reload after resolving the document update error.");
      });
    }
    game.socket!.on(CHANNEL, async (wire: { kind: string; gm?: string; packet?: Request; id?: string; user?: string; error?: string; value?: Claim }) => {
      if (wire.kind === "reply" && wire.user === game.user!.id && wire.id) {
        const waiting = pending.get(wire.id);
        if (wire.error) waiting?.reject(new Error(wire.error)); else waiting?.resolve(wire.value);
      }
      if (wire.kind !== "request" || wire.gm !== game.user!.id || authority()?.id !== game.user!.id || !wire.packet) return;
      try { const value = await serialized(wire.packet);
        game.socket!.emit(CHANNEL, { kind: "reply", id: wire.packet.id, user: wire.packet.user, value });
      } catch (error) {
        game.socket!.emit(CHANNEL, { kind: "reply", id: wire.packet.id, user: wire.packet.user, error: String((error as Error).message) });
      }
    });
  });
  Hooks.on("renderChatMessage", (message: ChatMessage, html: JQuery) => {
    const data = flag<Exchange>(message, "exchange");
    if (!data || !message.visible || (message.blind && !game.user!.isGM)) return;
    if (html[0]) decorateCombatMessage(html[0], data);
    if (data.state === "cancelled") return;
    html.find(".message-sender").text(data.attackerName + " → " + data.defenderName);
    if (data.state === "resolved") {
      void renderDamage(message, data, html, (action, extra) => request(message.id!, action, extra))
        .catch(error => console.warn(MODULE, error));
      return;
    }
    void tokenActor(data.defender).then(actor => {
      if (!actor.isOwner || html.find(".pneuma-defense-controls").length) return;
      let choice: EvasionOffer;
      let available = true;
      try { choice = offer(actor, data.ranged, currentCombat(data)); }
      catch (error) {
        available = false;
        choice = { allowed: false, penalty: 0, cost: 0, free: 0, reason: (error as Error).message };
      }
      const panel = document.createElement("div"); panel.className = "pneuma-defense-controls";
      for (const [text, evade] of data.state === "applying" ? [["Finish payment", true] as const]
        : [[data.ranged ? evasionButtonLabel(choice) : "Free evasion", true] as const, ["Do not Evade", false] as const]) {
        const button = document.createElement("button"); button.type = "button"; button.textContent = text;
        if (evade && data.state === "waiting") {
          const icon = document.createElement("i"); icon.className = "fas fa-person-running pneuma-evade-icon";
          icon.setAttribute("aria-hidden", "true");
          button.prepend(icon, document.createTextNode(" "));
        }
        button.disabled = data.state === "waiting" && (!available || (evade && !choice.allowed));
        if (data.state === "waiting" && (evade || !available)) {
          button.title = choice.reason;
          button.setAttribute("aria-description", choice.reason);
        }
        button.addEventListener("click", async () => {
          const buttons = panel.querySelectorAll("button"); buttons.forEach(b => b.disabled = true);
          try { await respond(message, evade); }
          catch (error) { ui.notifications!.error((error as Error).message); }
          finally { buttons.forEach(b => b.disabled = false); }
        });
        panel.append(button);
      }
      if (game.user!.isGM && data.state === "waiting") {
        const cancel = document.createElement("button");
        cancel.className = "pneuma-cancel-exchange"; cancel.type = "button"; cancel.textContent = "Cancel exchange";
        cancel.addEventListener("click", () => {
          void request(message.id!, "cancel").catch(error => ui.notifications!.error(error.message));
        });
        panel.append(cancel);
      }
      const controls = html.find(".pneuma-pending-controls");
      (controls.length ? controls : html.find(".message-content")).append(panel);
    }).catch(error => console.warn(MODULE, error));
  });
}
