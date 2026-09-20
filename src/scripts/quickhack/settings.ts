import { MODULE, LEGACY_MODULE, type QuickhackMode } from "./availability.js";
import { DEFAULT_ROUTING_CONFIG, normalizeRoutingConfig, type RoutingConfig } from "./routing-config.js";

declare global {
  interface SettingConfig {
    "pneuma-combattools.quickhackEnabled": boolean;
    "pneuma-combattools.quickhackMode": QuickhackMode;
    "pneuma-combattools.quickhackRouting": RoutingConfig;
  }
}
export const label = (key: string, data: Record<string, string | number> = {}) =>
  game.i18n!.format("PNEUMA_COMBAT_TOOLS.Quickhack." + key, data);
export const enabled = () => game.system?.id === "cyberpunk-red-core"
  && game.settings!.get(MODULE, "quickhackEnabled") && !game.modules?.get(LEGACY_MODULE)?.active;
export const mode = () => game.settings!.get(MODULE, "quickhackMode");
export const routing = () => normalizeRoutingConfig(game.settings!.get(MODULE, "quickhackRouting"));

class QuickhackSettings extends FormApplication {
  constructor() { super({}); }
  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "pneuma-quickhack-settings", title: "QuickHack message settings", width: 610,
      template: `modules/${MODULE}/templates/quickhack-settings.hbs`, closeOnSubmit: true,
    });
  }
  override getData() {
    const config = routing();
    return { rows: [
      { key: "npcToPlayerJackInAudience", title: label("Settings.Question.DetectedJackInAudience"), choices: { targetOwners: "Only the Target and GM", public: "Everyone" } },
      { key: "npcToPlayerJackInShowTotals", title: label("Settings.Question.JackInTotals"), choices: { true: "Show totals", false: "Hide totals" } },
      { key: "npcToPlayerJackInRevealAttacker", title: "NPC Jack-In: identify attacker", choices: { true: "Show NPC name", false: "Unknown Netrunner" } },
      { key: "npcToPlayerQuickhackAudience", title: label("Settings.Question.QuickhackAudience"), choices: { targetOwners: "Only the Target and GM", public: "Everyone" } },
      { key: "npcToPlayerQuickhackRevealAttacker", title: "NPC QuickHack: identify attacker", choices: { true: "Show NPC name", false: "Unknown Netrunner" } },
      { key: "playerToNpcJackInAudience", title: label("Settings.Question.ShareNpcAwareness"), choices: { sourceOwners: "Only the Attacker and GM", public: "Everyone", gm: "Only GM" } },
    ].map(row => ({ ...row, value: String(config[row.key as keyof RoutingConfig]) })) };
  }
  protected override async _updateObject(_event: Event, data: Record<string, unknown>) {
    if (!game.user!.isGM) return;
    await game.settings!.set(MODULE, "quickhackRouting", normalizeRoutingConfig({
      npcToPlayerJackInAudience: String(data.npcToPlayerJackInAudience),
      npcToPlayerJackInShowTotals: data.npcToPlayerJackInShowTotals === "true",
      npcToPlayerJackInRevealAttacker: data.npcToPlayerJackInRevealAttacker === "true",
      npcToPlayerQuickhackAudience: String(data.npcToPlayerQuickhackAudience),
      npcToPlayerQuickhackRevealAttacker: data.npcToPlayerQuickhackRevealAttacker === "true",
      playerToNpcJackInAudience: String(data.playerToNpcJackInAudience),
    }));
  }
}
export function registerQuickhackSettings(refresh: () => void) {
  game.settings!.register(MODULE, "quickhackEnabled", { name: "Enable QuickHack", hint: "Enable QuickHack controls, rolls, effects and macros. Disable the standalone Pneuma Quickhack module before using this integration.",
    scope: "world", config: true, type: Boolean, default: true, onChange: refresh });
  game.settings!.register(MODULE, "quickhackMode", { name: "QuickHack rules mode", scope: "world", config: true,
    type: String, default: "raw", choices: { raw: "RAW", owned: "Must Buy QuickHack", loaded: "Must Be Loaded in Equipped Cyberdeck" }, onChange: refresh });
  game.settings!.register(MODULE, "quickhackRouting", { scope: "world", config: false,
    // @ts-expect-error Foundry v12 supports ObjectField settings; pinned typings omit this overload.
    type: new foundry.data.fields.ObjectField(), default: DEFAULT_ROUTING_CONFIG });
  game.settings!.registerMenu(MODULE, "quickhackMessages", { name: "QuickHack message settings", label: "Configure messages", hint: "Configure visibility, totals and attacker identity.", icon: "fas fa-comments", type: QuickhackSettings, restricted: true });
}
