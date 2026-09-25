import {registerNativeWrapper} from "./native-wrappers.js";
import {gunAmmo} from "./weapon-ammo.js";
import type {EquipmentItem} from "./weapon-data.js";
import {actorEncounter} from "./encounter.js";

declare global { interface SettingConfig { "pneuma-combattools.reportWeaponReloads": boolean; } }
function shouldReport(item: AmmoWeapon): boolean {
  if (!item.actor?.hasPlayerOwner || !game.settings!.get("pneuma-combattools", "reportWeaponReloads")) return false;
  try { return !!actorEncounter(item.actor); } catch { return false; }
}

interface AmmoWeapon extends Item {
  reload(...args: unknown[]): Promise<unknown>;
  load(...args: unknown[]): Promise<unknown>;
  getInstalledItems(type: string): Item[];
}
const active = new WeakSet<AmmoWeapon>();
const observers = new WeakSet<Function>();
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** CPR recreates these instance methods in loadMixins on every item preparation. */
export function observeWeaponAmmo(item: AmmoWeapon): void {
  if (!gunAmmo(item as unknown as EquipmentItem)) return;
  for (const method of ["reload", "load"] as const) {
    const native = item[method];
    if (typeof native !== "function" || observers.has(native)) continue;
    const observed = async function(this: AmmoWeapon, ...args: unknown[]) {
      if (!this.actor || active.has(this)) return native.apply(this, args);
      const beforeAmmo = this.getInstalledItems("ammo")[0]?.id;
      const beforeRounds = gunAmmo(this as unknown as EquipmentItem)!.rounds;
      const player = this.actor.name ?? "Character";
      const report = shouldReport(this);
      active.add(this);
      try {
        const result = await native.apply(this, args);
        const afterAmmo = this.getInstalledItems("ammo")[0]?.id;
        const afterRounds = gunAmmo(this as unknown as EquipmentItem)?.rounds ?? 0;
        const action = beforeAmmo !== afterAmmo ? "changes ammo in" : afterRounds > beforeRounds ? "reloads" : undefined;
        if (action && report && shouldReport(this)) {
          try {
            await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor:this.actor}),
              content:`<p>${escape(player)} ${action} ${escape(this.name ?? "weapon")}</p>`});
          } catch (error) {
            console.error("pneuma-combattools | Ammunition chat message failed", error);
            ui.notifications!.warn("Ammunition changed, but its chat message could not be posted.");
          }
        }
        return result;
      } finally { active.delete(this); }
    };
    observers.add(observed);
    item[method] = observed;
  }
}

export function registerAmmoChat(): void {
  game.settings!.register("pneuma-combattools", "reportWeaponReloads", {
    name: "Report player weapon reloads",
    hint: "During combat, reports reloads and ammunition changes for player-owned characters, including actions performed by the GM. Does not report bows.",
    scope: "world", config: true, type: Boolean, default: true,
  });
  Hooks.once("ready", () => {
    registerNativeWrapper(CONFIG.Item.documentClass.prototype, "loadMixins", function(wrapped, ...args) {
      const result = wrapped(...args);
      observeWeaponAmmo(this);
      return result;
    }, "WRAPPER");
    // Include existing linked actors and unlinked token actors on every scene.
    for (const actor of game.actors!) for (const item of actor.items) observeWeaponAmmo(item as AmmoWeapon);
    for (const scene of game.scenes!) for (const token of scene.tokens)
      if (token.actor) for (const item of token.actor.items) observeWeaponAmmo(item as AmmoWeapon);
  });
}
