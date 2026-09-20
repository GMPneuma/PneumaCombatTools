import { criticalMethods, type CriticalMethod } from "./critical-injury.js";

const MODULE = "pneuma-combattools";
class CriticalInjurySettings extends FormApplication {
  constructor() { super({}); }
  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "pneuma-critical-injury-settings", title: "Critical injuries", width: 420,
      template: "modules/pneuma-combattools/templates/critical-injury-settings.hbs",
      closeOnSubmit: true,
    });
  }
  override getData() {
    return { rows: Object.entries(criticalMethods).map(([method, label]) => ({
      key: "critical" + method, label,
      enabled: game.settings!.get(MODULE, `critical${method as CriticalMethod}`),
    })) };
  }
  protected override async _updateObject(_event: Event, data: Record<string, unknown>) {
    if (!game.user!.isGM) return;
    let changed = false;
    for (const method of Object.keys(criticalMethods) as CriticalMethod[]) {
      const key = `critical${method}` as const;
      const value = data[key] === true;
      if (game.settings!.get(MODULE, key) === value) continue;
      await game.settings!.set(MODULE, key, value);
      changed = true;
    }
    if (changed) await SettingsConfig.reloadConfirm({world: true});
  }
}
export function registerCriticalSettings(): void {
  for (const [method, label] of Object.entries(criticalMethods)) {
    game.settings!.register(MODULE, `critical${method as CriticalMethod}`, {
      name: "Critical injuries: " + label,
      scope: "world", config: false, type: Boolean, default: method !== "Quickhack", requiresReload: true,
    });
  }
  game.settings!.registerMenu(MODULE, "criticalInjuries", {
    name: "Critical injuries", label: "Configure damage types",
    hint: "Choose which damage types allow critical injuries.",
    icon: "fas fa-table", type: CriticalInjurySettings, restricted: true,
  });
}
