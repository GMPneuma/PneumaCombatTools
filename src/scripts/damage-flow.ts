import {interactArmorSelected, halfArmorSelected, halfArmorControl, armorIgnorePercent} from "./half-armor.js";
import {reportExposure} from "./effect-events.js";
import {igniteTarget} from "./instant-lifetime.js";
import {instantId} from "./instant-catalog.js";
import {createInstantCard} from "./instant-effects.js";
import { applyCombatStatus } from "./status-sync.js";
import { thrownRollItem } from "./thrown-weapons.js";
import { captureDamageApplication } from "./damage-application.js";
import { applyCriticalInjury, damageSixes, hasCriticalInjury, criticalLocation } from "./critical-injury.js";
import { chooseDamageStatuses, damageStatusChoices, validateDamageStatuses } from "./damage-status.js";
import { resolutionSection } from "./card-structure.js";
import { diceJSON, nativeAPI, rollHidden, nativeCard, type NativeRoll, type RollItem } from "./native-combat.js";
import type { Exchange } from "./combat-resolution.js";

export interface DamageValues {
  total: number; bonus: number; location: string; ablation: number; ammo: string;
  interactArmor?: boolean; ignorePercent: number; ignoreBelow: number; lethal: boolean;
}
export interface DamageResult { ammoType?:string; html: string; values: DamageValues; sixes?: number }
export interface DamageState {
  status: "rolling" | "rolled" | "applying" | "applied" | "review";
  selectedTargets?: {id:string; uuid:string; name:string}[];
  user: string; nonce: string; penetrated?: boolean; statusEffects?: string[]; applications?: string[]; result?: DamageResult; appliedTo?: string; recordedApplied?: boolean; application?: "recorded" | "selected"; applicationId?: string;
}
export interface DamageOptions { useShield: boolean; damageReductionRole: boolean; damageReductionAE: boolean; brainDamageReduction: boolean }
export interface DamageRequest {
  action: "damageClaim" | "damageRelease" | "damageCommit" | "damageApply" | "damageReset" | "damageResolved" | "damageStatuses";
  interactArmor?: boolean; halfArmor?: boolean; statusEffects?: string[]; nonce?: string; damage?: DamageResult; options?: DamageOptions; targetUuid?: string; application?: "recorded" | "selected"; applicationId?: string;
}
export async function damageActor(uuid: string): Promise<Actor> {
  const token = await fromUuid(uuid) as TokenDocument | null;
  if (!token?.actor) throw new Error("The combat token or actor no longer exists.");
  return token.actor;
}
function configureAreaAmmo(roll:NativeRoll,data:Exchange):void {
  if (data.areaAmmo) {
    const native=roll as NativeRoll & {rollCardExtraArgs:Record<string,unknown>};
    native.rollCardExtraArgs={...native.rollCardExtraArgs,ammoType:data.areaAmmo.type,ammoVariety:data.areaAmmo.variety,ablationValue:data.areaAmmo.type==="armorPiercing"?2:1};
  }
}
export function configureDamage(roll: NativeRoll, data: Exchange): void {
  if (data.damageFormula) roll.formula = data.damageFormula;
  configureAreaAmmo(roll,data);
  roll.location = data.location ?? "body";
  roll.isAimed = data.attackMode === "aimed";
  if (data.attackMode === "autofire") {
    const margin = data.total - (data.defense?.total ?? data.dv!);
    const maximum = Number(roll.autofireMultiplierMax);
    if (!Number.isFinite(maximum) || maximum < 1)
      throw new Error("No valid Autofire margin or weapon maximum is available.");
    // A reported miss may be overridden; leave a usable multiplier for the native dialog to review.
    roll.autofireMultiplier = Math.min(Math.max(Number.isFinite(margin) ? margin : 1, 1), maximum);
  }
}
export function damageValues(html: string): DamageValues {
  const node = new DOMParser().parseFromString(html, "text/html").querySelector<HTMLElement>('[data-action="applyDamage"]');
  if (!node) throw new Error("Native damage card has no damage application data.");
  const get = (key: string) => node.getAttribute("data-" + key) ?? "";
  const number = (key: string, integer = true) => {
    const value = integer ? parseInt(get(key), 10) : parseFloat(get(key));
    return Number.isFinite(value) ? value : 0;
  };
  const location = get("damage-location");
  return { total: number("total-damage"), bonus: number("bonus-damage"),
    location: ["head", "brain"].includes(location) ? location : "body",
    ablation: number("ablation"), ammo: get("ammo-variety"), ignorePercent: number("ignore-armor-percent", false),
    ignoreBelow: number("ignore-below-sp"), lethal: /true/i.test(get("damage-lethal")) };
}
export function damageContent(data: Exchange, mode: "full" | "roll" = "full"): string {
  const damage = data.damage;
  if (!damage) return "";
  const labels = { rolling: "Damage roll in progress", rolled: "Damage rolled — awaiting application", applying: "Damage application in progress — do not apply again",
    applied: "Damage resolved", review: "Damage application interrupted — GM must check HP, armor, shield and effects before marking resolved" };
  let html = "";
  if (damage.result) {
    const doc = new DOMParser().parseFromString(damage.result.html, "text/html");
    doc.querySelectorAll('[data-action="applyDamage"]').forEach(node => node.remove());
    const header = doc.querySelector(".rollcard-top .cpr-block");
    if (header) {
      const ammo = header.querySelector(".rollcard-subtitle-2-center")?.textContent?.trim() ?? "";
      const row = doc.createElement("div"); row.className = "pneuma-damage-heading";
      const label = doc.createElement("span"); label.className = "pneuma-damage-label";
      label.textContent = game.i18n!.localize("CPR.global.generic.damage");
      const ammoLabel = doc.createElement("span"); ammoLabel.className = "pneuma-damage-ammo"; ammoLabel.textContent = ammo;
      row.append(label, ammoLabel);
      header.replaceChildren(row);
    }
    html = doc.body.innerHTML + halfArmorControl(damage.result.values.ignorePercent,damage.result.values.interactArmor!==false);
  }
  const status = ["rolled", "applied"].includes(damage.status) ? ""
    : '<p class="pneuma-damage-status">' + labels[damage.status] + '</p>';
  const escape = (value:string) => value.replace(/[&<>"']/g, char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]!);
  const targets = (damage.selectedTargets ?? []).map(target=>'<li data-application-id="'+escape(target.id)+'">'+escape(target.name)+'</li>').join("");
  const history = targets ? '<div class="pneuma-damage-targets"><strong>Applied to</strong><ol class="pneuma-damage-target-history" aria-label="Applied to selected targets">'+targets+'</ol></div>' : "";
  const actions = mode === "full" && damage.result ? resolutionSection("damage-apply",
    '<div class="rollcard-bottom pneuma-damage-application"><div class="cpr-block pneuma-damage-application-box"></div></div>'
      + history + '<div class="pneuma-damage-applications">' + (damage.applications ?? []).join("") + '</div>') : "";
  return '<div class="pneuma-damage-result">' + resolutionSection("damage-roll", html + status)
    + actions + (mode === "full" ? '<div class="pneuma-resolution-recovery-slot"></div>' : "") + "</div>";
}
export function recordedDamageApplied(data: Exchange): boolean {
  const damage = data.damage;
  return damage?.recordedApplied ?? (!!damage && damage.status === "applied" && !damage.application
    && (!damage.appliedTo || damage.appliedTo === data.defender));
}
/** Called only by the existing serialized GM coordinator. */
export async function handleDamage(request: DamageRequest, user: User, data: Exchange,
  save: () => Promise<void>): Promise<void> {
  if (data.state !== "resolved") throw new Error("Damage requires a resolved attack.");

  if (request.action === "damageStatuses") {
    const attacker = await damageActor(data.attacker);
    const defender = await damageActor(data.defender);
    if (!user.isGM && !attacker.testUserPermission(user, "OWNER") && !defender.testUserPermission(user, "OWNER"))
      throw new Error("Only an exchange participant's owner or GM can edit damage effects.");
    if (!data.damage?.result || !["rolled", "applied"].includes(data.damage.status))
      throw new Error("Damage effects cannot change while damage is pending or requires GM review.");
    data.damage.statusEffects = validateDamageStatuses(request.statusEffects);
    await save(); return;
  }
  const applying = request.action === "damageApply" || request.action === "damageResolved";
  const application = request.application ?? (request.targetUuid && request.targetUuid !== data.defender ? "selected" : "recorded");
  const destination = request.action === "damageApply" && application === "selected" ? request.targetUuid : data.defender;
  if (!destination) throw new Error("Select exactly one token to apply damage.");
  const actor = await damageActor(applying ? destination : data.attacker);
  if (!user.isGM && !actor.testUserPermission(user, "OWNER")) throw new Error("Only this actor's owner or GM can continue.");
  const damage = data.damage;
  if (request.action === "damageClaim") {
    if (damage) throw new Error("Damage is already being rolled or has been rolled.");
    if (data.improvised && (!Number.isInteger(data.improvisedDice) || data.improvisedDice! < 1 || data.improvisedDice! > 6))
      throw new Error("This older improvised attack has no damage choice. Start a new attack.");
    if (!data.weaponId || !data.attackMode || !request.nonce) throw new Error("This older attack lacks damage context. Use the native weapon damage roll.");
    data.damage = { status: "rolling", user: user.id!, nonce: request.nonce }; await save(); return;
  }
  if (!damage) throw new Error("No damage roll is pending.");
  if (request.action === "damageReset") {
    if (!user.isGM || damage.status !== "rolling") throw new Error("Only a GM can release an unfinished damage roll.");
    delete data.damage; await save(); return;
  }
  if (request.action === "damageRelease") {
    if (damage.status === "rolling" && damage.user === user.id && damage.nonce === request.nonce) {
      delete data.damage; await save();
    }
    return;
  }
  if (request.action === "damageCommit") {
    if (damage.user !== user.id || damage.nonce !== request.nonce) throw new Error("Damage reservation expired.");
    if (damage.status !== "rolling") return;
    const result = request.damage;
    if (!result || ![result.values.total, result.values.bonus, result.values.ablation, result.values.ignorePercent, result.values.ignoreBelow].every(Number.isFinite))
      throw new Error("Invalid damage result.");
    if (result.sixes !== undefined && (!Number.isInteger(result.sixes) || result.sixes < 0)) throw new Error("Invalid damage dice.");
    damage.result = result; damage.status = "rolled"; await save(); return;
  }
  if (request.action === "damageResolved") {
    if (!user.isGM || !["review", "applying"].includes(damage.status)) throw new Error("No interrupted application to resolve.");
    if (damage.application !== "selected") damage.recordedApplied = true;
    damage.status = "applied"; await save(); return;
  }
  if (request.action !== "damageApply") return;
  if (request.applicationId && damage.applicationId === request.applicationId) return;
  if (application === "recorded" && recordedDamageApplied(data)) return;
  if (!["rolled", "applied"].includes(damage.status) || !damage.result) throw new Error("Damage is already applying or requires GM review.");
  if (!request.options || !Object.values(request.options).every(value => typeof value === "boolean")) throw new Error("Missing native damage options.");
  const target = actor as Actor & { _applyDamage(...args: unknown[]): Promise<void> };
  if (typeof target._applyDamage !== "function") throw new Error("Native damage application is unavailable.");
  const effects = validateDamageStatuses((damage.statusEffects ?? []).slice(0, 3));
  const requestedEffects = validateDamageStatuses(request.statusEffects ?? []);
  if (JSON.stringify(effects) !== JSON.stringify(requestedEffects))
    throw new Error("Damage status effects changed. Review the updated card and apply again.");
  if (effects.length && typeof actor.toggleStatusEffect !== "function")
    throw new Error("Native status application is unavailable.");
  damage.statusEffects = effects;
  const v = damage.result.values;
  const interact=request.interactArmor??v.interactArmor;
  damage.recordedApplied = recordedDamageApplied(data);
  damage.application = application;
  damage.applicationId = request.applicationId ?? foundry.utils.randomID();
  damage.appliedTo = destination;
  damage.status = "applying"; await save();
  try {
    const token = await fromUuid(destination) as TokenDocument | null;
    const summaries = await captureDamageApplication(actor, token?.name ?? actor.name ?? "", v.location, damage.applicationId!,
      view => target._applyDamage.call(view, v.total, v.bonus, v.location, (interact===false || data.coverUp || data.weaponType === "martialArts" && game.settings!.get("pneuma-combattools", "maNoAblation")) ? 0 : v.ablation, v.ammo, data.coverUp?2*armorIgnorePercent(v.ignorePercent,request.halfArmor,interact)-100:armorIgnorePercent(v.ignorePercent,request.halfArmor,interact), data.coverUp?v.ignoreBelow/2:v.ignoreBelow, v.lethal, request.options),
      data.coverUp?{ablation:interact===false?0:2*v.ablation,ignorePercent:armorIgnorePercent(v.ignorePercent,request.halfArmor,interact),ignoreBelow:v.ignoreBelow}:undefined, native=>{damage.penetrated=Number(native.rawDamageDealt)>0&&native.hpReduction>0;},data.attackMode==="aimed"&&v.location==="head");
    if(damage.penetrated) {
      const ammo=damage.result.ammoType;
      if(ammo==="incendiary")await igniteTarget(actor);
      else if(ammo)reportExposure(actor,ammo);
    }
    damage.applications = [...(damage.applications ?? []), ...summaries];
    if (application === "selected") damage.selectedTargets = [...(damage.selectedTargets ?? []), {
      id:damage.applicationId!, uuid:destination, name:token?.name ?? actor.name ?? "Target"
    }];
    for (const id of effects) {
      const instant=id.startsWith("instant:")?id.slice(8):"";
      if(instantId(instant)) {
        const visibility={blind:data.rollMode==="blindroll",whisper:["gmroll","blindroll"].includes(data.rollMode??"")?game.users!.filter(u=>u.isGM).map(u=>u.id!):data.rollMode==="selfroll"?[user.id!]:[]} as ChatMessage;
        await createInstantCard(actor,instant,visibility);
      } else await applyCombatStatus(actor, id);
    }
  } catch (error) {
    damage.status = "review"; await save();
    throw new Error("Damage or status application was interrupted. Check HP, armor, shield and effects before continuing: " + (error as Error).message);
  }
  // If this write fails, the persisted applying state prevents a second HP change.
  if (application === "recorded") damage.recordedApplied = true;
  damage.status = "applied"; await save();
}
const retry = new Map<string, { nonce: string; damage: DamageResult }>();
type Send = (action: DamageRequest["action"], extra?: Partial<DamageRequest>) => Promise<unknown>;
export async function rollDamage(id: string, data: Exchange, send: Send, showDialog = false): Promise<void> {
  const previous = retry.get(id);
  if (previous) { await send("damageCommit", previous); retry.delete(id); return; }
  const nonce = foundry.utils.randomID();
  await send("damageClaim", { nonce });
  try {
    const actor = await damageActor(data.attacker);
    const item = data.thrownSource ? thrownRollItem(data.thrownSource, actor, data.improvisedDice)
      : actor.items.get(data.weaponId!) as RollItem | undefined;
    if (!item?.createRoll) throw new Error("The original weapon is unavailable.");
    let roll = item.createRoll("damage", actor, { damageType: data.attackMode });
    configureDamage(roll, data);
    if (!await roll.handleRollDialog({ type: "pneuma-damage", ctrlKey: !showDialog, metaKey: false }, actor, item)) return;
    roll = await item.confirmRoll(roll);
    if(data.areaAmmo)configureAreaAmmo(roll,data);
    await rollHidden(roll);
    roll.rollTitle = data.title;
    // The native global application button is replaced with our original-defender control.
    roll.entityData = { actor: actor.id!, token: data.attacker.split(".").at(-1)!, item: item.id!, tokens: [] };
    const html = await nativeCard(roll);
    const result = { nonce, damage: { ammoType:(roll as NativeRoll & {rollCardExtraArgs?:{ammoType?:string}}).rollCardExtraArgs?.ammoType, html, values: damageValues(html), sixes: damageSixes(roll) } };
    retry.set(id, result);
    await send("damageCommit", result); retry.delete(id);
    const { Dice } = await nativeAPI();
    for (const json of diceJSON(roll)) await Dice.handle3dDice(Roll.fromJSON(json) as Roll, data.rollMode);
  } finally {
    if (!retry.has(id)) await send("damageRelease", { nonce });
  }
}
export function selectedDamageTarget(): string {
  const tokens = canvas.tokens?.controlled ?? [];
  if (tokens.length !== 1) throw new Error("Select exactly one token to apply damage.");
  const token = tokens[0]!;
  if (!token.actor?.isOwner) throw new Error("Only the selected actor’s owner or GM can apply damage.");
  return token.document.uuid;
}
export async function applyFromCard(data: Exchange, send: Send, shiftKey: boolean, targetUuid = data.defender, application: "recorded" | "selected" = "recorded", halfArmor?: boolean, interactArmor?: boolean): Promise<void> {
  const actor = await damageActor(targetUuid);
  if (!actor.isOwner) throw new Error("Only the selected actor’s owner or GM can apply damage.");
  let options: DamageOptions = { useShield: true, damageReductionRole: true, damageReductionAE: true, brainDamageReduction: true };
  if (shiftKey) {
    const path = "/systems/cyberpunk-red-core/modules/dialog/cpr-dialog-application.js";
    const Dialog = (await import(path)).default as { showDialog(data: object, options: object): Promise<DamageOptions | undefined> };
    const location = data.damage!.result!.values.location;
    const chosen = await Dialog.showDialog({ ...options, allowedActors: [actor], forbiddenActors: [], count: 0,
      showBrainDamageReduction: location === "brain",
      allowedTypesMessage: game.i18n!.format("CPR.chat.damageApplication.prompt.allowedTypes", { location }) }, {
      title: game.i18n!.localize("CPR.chat.damageApplication.prompt.title"),
      template: "systems/cyberpunk-red-core/templates/dialog/cpr-damage-application-prompt.hbs",
    }).catch(() => undefined);
    if (!chosen) return;
    options = { useShield: !!chosen.useShield, damageReductionRole: !!chosen.damageReductionRole,
      damageReductionAE: !!chosen.damageReductionAE, brainDamageReduction: !!chosen.brainDamageReduction };
  }
  await send("damageApply", { halfArmor, interactArmor, targetUuid, application, applicationId: foundry.utils.randomID(), options,
    statusEffects: (data.damage?.statusEffects ?? []).slice(0, 3) });
}
export async function renderDamage(message: ChatMessage, data: Exchange, html: JQuery, send: Send, manual?: {canEditEffects: boolean}): Promise<void> {
  if (!manual && !data.weaponId || html.find(".pneuma-damage-controls, .pneuma-damage-recovery-controls").length) return;
  const attacker = manual ? {isOwner:false} : await damageActor(data.attacker);
  const defender = manual ? {isOwner:true} : await damageActor(data.defender);
  const panel = document.createElement("div"); panel.className = "pneuma-damage-controls";
  const recoveryPanel = document.createElement("div"); recoveryPanel.className = "pneuma-damage-recovery-controls";
  const button = (label: string, run: (event: MouseEvent) => Promise<unknown>, destination?: "recorded" | "selected") => {
    const node = document.createElement(destination ? "a" : "button");
    if (destination) {
      node.className = "pneuma-apply-damage";
      node.dataset.pneumaDamageTarget = destination;
      node.title = (destination === "recorded" ? "Apply damage to " + data.defenderName : "Apply damage to the selected token") + " (Shift-click for options)";
      node.setAttribute("aria-label", node.title);
      node.setAttribute("role", "button"); node.tabIndex = 0;
      const icon = document.createElement("i"); icon.className = "fas fa-bolt"; icon.setAttribute("aria-hidden", "true");
      node.append(icon);
      const row = document.createElement("div"); row.className = "pneuma-damage-recipient";
      row.append(node, document.createTextNode(" " + label)); panel.append(row);
      if (!manual && hasCriticalInjury(data)) {
        const injury = document.createElement("a"); injury.className = "pneuma-apply-critical";
        injury.dataset.pneumaDamageTarget = destination;
        injury.title = "Roll/apply " + criticalLocation(data) + " critical injury to " + (destination === "recorded" ? data.defenderName : "the selected token");
        injury.setAttribute("aria-label", injury.title); injury.setAttribute("role", "button"); injury.tabIndex = 0;
        const die = document.createElement("i"); die.className = "fas fa-dice"; die.setAttribute("aria-hidden", "true");
        injury.append(die); row.append(injury);
        let rolling = false;
        injury.addEventListener("click", async event => {
          event.preventDefault(); event.stopPropagation(); if (rolling) return;
          rolling = true; injury.setAttribute("aria-disabled", "true");
          try { await applyCriticalInjury(data, destination === "recorded" ? data.defender : selectedDamageTarget()); }
          catch (error) { ui.notifications!.error((error as Error).message); }
          finally { rolling = false; injury.removeAttribute("aria-disabled"); }
        });
        injury.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); injury.click(); }
        });
      }
      node.addEventListener("keydown", event => {
        if ((event as KeyboardEvent).key === "Enter" || (event as KeyboardEvent).key === " ") { event.preventDefault(); node.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: (event as KeyboardEvent).shiftKey })); }
      });
    } else {
      (node as HTMLButtonElement).type = "button"; node.textContent = label; recoveryPanel.append(node);
    }
    const locked = destination === "recorded" && recordedDamageApplied(data);
    if (locked) node.setAttribute("aria-disabled", "true");
    let busy = false;
    node.addEventListener("click", async event => {
      event.preventDefault(); event.stopPropagation();
      if (busy || locked) return;
      busy = true; node.setAttribute("aria-disabled", "true");
      if (node instanceof HTMLButtonElement) node.disabled = true;
      try { await run(event as MouseEvent); } catch (error) { ui.notifications!.error((error as Error).message); ui.chat?.updateMessage(message); }
      finally {
        busy = false; node.removeAttribute("aria-disabled");
        if (node instanceof HTMLButtonElement) node.disabled = false;
      }
    });
  };
  const drop = html.find('[data-action="pneumaRollDamage"]');

  if (attacker.isOwner && !data.damage && (!data.improvised || data.improvisedDice)) drop.on("click", event => {
    event.preventDefault(); event.stopPropagation();
    void rollDamage(message.id!, data, send, !!event.shiftKey).catch(error => { ui.notifications!.error(error.message); ui.chat?.updateMessage(message); });
  });
  else drop.prop("disabled", true).attr("aria-disabled", "true").attr("title", data.damage ? "Damage already started or resolved" : data.improvised && !data.improvisedDice ? "This older improvised attack has no damage choice. Start a new attack" : "Only the attacker owner or GM can roll damage");
  const status = data.damage?.status;
  if (attacker.isOwner && status === "rolling" && retry.has(message.id!))
    button("Finish damage roll", () => rollDamage(message.id!, data, send));
  if (data.damage?.result && (attacker.isOwner || defender.isOwner || game.user!.isGM)) {

    const statusBox = document.createElement("div"); statusBox.className = "pneuma-damage-status-effects";
    statusBox.setAttribute("role", "group"); statusBox.setAttribute("aria-label", "Damage status effects");
    const selected = (data.damage.statusEffects ?? []).slice(0, 3);
    const choices = damageStatusChoices();
    for (let slot = 0; slot < 3; slot++) {
      const effect = choices.find(effect => effect.id === selected[slot]);
      const edit = document.createElement("button"); edit.type = "button"; edit.className = "pneuma-damage-status-slot";
      edit.dataset.pneumaStatusSlot = String(slot);
      edit.title = selected[slot] ? "Change or remove " + (effect?.name ?? selected[slot]) : "Add effects";
      edit.setAttribute("aria-label", edit.title);
      if (selected[slot]) {
        edit.dataset.statusId = selected[slot]!;
        const icon = document.createElement("img"); icon.src = effect?.img || "icons/svg/aura.svg"; icon.alt = effect?.name ?? selected[slot]!;
        edit.append(icon);
      } else edit.textContent = "+";
      edit.disabled = manual?.canEditEffects === false || !["rolled", "applied"].includes(status!);
      edit.addEventListener("click", async event => {
        event.preventDefault(); event.stopPropagation();
        const slots = statusBox.querySelectorAll<HTMLButtonElement>("button");
        slots.forEach(button => { button.disabled = true; });
        try {
          const effects = await chooseDamageStatuses(selected, slot);
          if (effects !== null) await send("damageStatuses", { statusEffects: effects });
        } catch (error) { ui.notifications!.error((error as Error).message); }
        finally { slots.forEach(button => { button.disabled = manual?.canEditEffects === false || !["rolled", "applied"].includes(status!); }); }
      });
      statusBox.append(edit);
    }
    panel.append(statusBox);
    if (!manual) button(data.defenderName, event => applyFromCard(data, send, event.shiftKey, data.defender, "recorded", halfArmorSelected(event), interactArmorSelected(event)), "recorded");
    button("to selected target", event => applyFromCard(data, send, event.shiftKey, selectedDamageTarget(), "selected", halfArmorSelected(event), interactArmorSelected(event)), "selected");
  }
  if (!manual && game.user!.isGM && status === "rolling") button("Release unfinished damage roll", () => send("damageReset"));
  if (!manual && game.user!.isGM && (status === "review" || status === "applying"))
    button("Mark resolved after GM review", () => send("damageResolved"));
  const actions = html.find(".pneuma-damage-application-box");
  if (panel.childElementCount) (actions.length ? actions : html.find(".message-content")).append(panel);
  if (recoveryPanel.childElementCount) {
    const recovery = document.createElement("div");
    recovery.innerHTML = resolutionSection("recovery", "");
    recovery.querySelector(".pneuma-resolution-body")!.append(recoveryPanel);
    const slot = html.find(".pneuma-resolution-recovery-slot");
    (slot.length ? slot : html.find(".message-content")).append(recovery.firstElementChild!);
  }
}
