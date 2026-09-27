import { attackFromHUD, attackEntries, thrownEntries, type AttackMode, type MenuWeapon } from "./attack-menu.js";
import { areaKind } from "./aoe/weapon.js";
import { registerNativeWrapper } from "./native-wrappers.js";
import { primaryGM } from "./shared.js";

const MODULE = "pneuma-combattools";
declare global { interface SettingConfig { "pneuma-combattools.routeSheetAttacks": boolean; } }
interface AttackSheet {
  actor: Actor;
  token?: TokenDocument | null;
  _getFireCheckbox(event: JQuery.ClickEvent): string;
}
interface NativeSheetClass {
  prototype: object;
  _getItemId(event: JQuery.ClickEvent): string;
}
interface NativeUtils { GetEventDatum(event: JQuery.ClickEvent, key: string): string; }

/** An explicit token sheet never silently switches to another copy of the actor. */
export function sheetAttacker(sheet: AttackSheet): Token | undefined {
  const actor = sheet.actor;
  if (!actor.isOwner || !canvas.tokens) return;
  const valid = (token: Token) => token.actor?.uuid === actor.uuid && token.can(game.user!, "control");
  const explicit = sheet.token ?? (actor.isToken ? actor.token : null);
  if (explicit) {
    const token = canvas.tokens.get(explicit.id!);
    return token?.document.uuid === explicit.uuid && valid(token) ? token : undefined;
  }
  const controlled = canvas.tokens.controlled.filter(valid);
  if (controlled.length) return controlled.length === 1 ? controlled[0] : undefined;
  const candidates = canvas.tokens.placeables.filter(valid);
  return candidates.length === 1 ? candidates[0] : undefined;
}

const installed = new WeakSet<object>();
export function installSheetAttackRouting(sheetClass: NativeSheetClass, utils: NativeUtils): void {
  if (installed.has(sheetClass.prototype)) return;
  registerNativeWrapper(sheetClass.prototype, "_onRoll", async function(this: AttackSheet, wrapped, event: JQuery.ClickEvent) {
    if (!game.settings!.get(MODULE, "routeSheetAttacks") || utils.GetEventDatum(event, "data-roll-type") !== "attack")
      return wrapped(event);
    const attacker = sheetAttacker(this);
    if (!attacker || !primaryGM()) return wrapped(event);
    const itemId = sheetClass._getItemId(event);
    const item = this.actor.items.get(itemId) as unknown as MenuWeapon | undefined;
    const mode = this._getFireCheckbox(event) as AttackMode;
    if (!item || !["attack", "aimed", "autofire", "suppressive"].includes(mode)) return wrapped(event);
    const items = Array.from(this.actor.items) as unknown as MenuWeapon[];
    const entry = [...attackEntries(items), ...thrownEntries(items).map(row => ({...row, autofire:false}))].find(row => row.id === itemId);
    if (!entry || (["autofire", "suppressive"].includes(mode) && !entry.autofire)) return wrapped(event);
    const targets = [...game.user!.targets];
    if (targets.length > 1) return wrapped(event);
    const target = targets[0];
    if (target && (target === attacker || !target.actor || !target.isVisible || canvas.tokens?.get(target.id) !== target))
      return wrapped(event);
    if (!target && !areaKind(item, mode)) return wrapped(event);
    // The existing dispatcher owns ammo, rolls and placement. Never fall back after it starts.
    try { await attackFromHUD(attacker, target ?? attacker, itemId, mode, event); }
    catch (error) {
      console.error(MODULE + " | Character-sheet attack failed", error);
      ui.notifications!.error(error instanceof Error ? error.message : "Combat Tools attack failed.");
    }
  }, "MIXED");
  installed.add(sheetClass.prototype);
}

export function registerSheetAttacks(): void {
  game.settings!.register(MODULE, "routeSheetAttacks", {
    name: "Route character-sheet attacks through Combat Tools",
    hint: "Use Combat Tools for supported sheet attacks with an unambiguous scene token and target. Area weapons open placement without a target. Otherwise use the normal system roll.",
    scope: "world", config: true, type: Boolean, default: false,
  });
  Hooks.once("ready", async () => {
    try {
      const sheetPath = "/systems/cyberpunk-red-core/modules/actor/sheet/cpr-actor-sheet.js";
      const utilsPath = "/systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js";
      const [sheet, utils] = await Promise.all([import(sheetPath), import(utilsPath)]);
      installSheetAttackRouting(sheet.default as NativeSheetClass, utils.default as NativeUtils);
    } catch (error) {
      console.error(MODULE + " | Character-sheet attack routing unavailable", error);
      if (game.settings!.get(MODULE, "routeSheetAttacks")) ui.notifications!.warn("Combat Tools sheet routing is unavailable; native sheet attacks remain enabled.");
    }
  });
}
