import { registerEyeHUD } from "./eye-hud.js";
import { registerItemMarkers, decorateItemList } from "./item-markers.js";
import { registerCriticalSettings } from "./critical-injury.js";
import { registerCombatResolution } from "./combat-resolution.js";
import { registerArmorShortcut } from "./armor-shortcut.js";
import { canShowQuickhack, attackEntries, thrownEntries, grenadeEntries, attackFromHUD, type MenuWeapon, type AttackMode } from "./attack-menu.js";
import { registerHoverDV } from "./dv-hover.js";
import { registerEvasionSettings } from "./evasion-settings.js";

declare global {
interface SettingConfig {
  "pneuma-combattools.maNoAblation": boolean;
  "pneuma-combattools.targetedRightClick": boolean;
  "pneuma-combattools.tightHUD": boolean;
  "pneuma-combattools.iconColor": string | null;
  "pneuma-combattools.hudScale": number;
  "pneuma-combattools.statusIconScale": number;
}
}

const MODULE_ID = "pneuma-combattools";
const TEMPLATE = `modules/${MODULE_ID}/templates/combat-hud.hbs`;
const label = (key: string) => game.i18n!.localize(`PNEUMA_COMBAT_TOOLS.${key}`);
let selection: { target: Token; attacker: Token | undefined; combatOnly?: boolean; anchor: { x: number; y: number } } | undefined;
const isStandalone = (token: Token) => !token.isOwner || (selection?.target === token && !!selection.combatOnly);
const selectedAttacker = () => {
  const tokens = canvas.tokens!.controlled.filter(token => token.actor?.isOwner);
  return tokens.length === 1 ? tokens[0] : undefined;
};

Hooks.once("init", () => {
  if (game.system!.id !== "cyberpunk-red-core") return;
  registerEyeHUD();
  registerHoverDV();
  registerArmorShortcut();
  registerItemMarkers();
  registerEvasionSettings();
  registerCombatResolution();
  registerCriticalSettings();
  game.settings!.register(MODULE_ID, "maNoAblation", {
    name: "MA does not ablate armor", hint: "Martial Arts retains half SP, but does not ablate armor when applying damage from a resolution card.",
    scope: "world", config: true, type: Boolean, default: false,
  });
  game.settings!.register(MODULE_ID, "targetedRightClick", {
    name: "PNEUMA_COMBAT_TOOLS.TargetedRightClickName",
    hint: "PNEUMA_COMBAT_TOOLS.TargetedRightClickHint",
    scope: "client", config: true, type: Boolean, default: true,
  });
  game.settings!.register(MODULE_ID, "tightHUD", {
    name: "PNEUMA_COMBAT_TOOLS.TightHUDName", hint: "PNEUMA_COMBAT_TOOLS.TightHUDHint",
    scope: "client", config: true, type: Boolean, default: false, onChange: refreshHUDPosition,
  });
  game.settings!.register(MODULE_ID, "iconColor", {
    name: "PNEUMA_COMBAT_TOOLS.IconColorName", hint: "PNEUMA_COMBAT_TOOLS.IconColorHint",
    scope: "world", config: true, default: null,
    // Foundry v12 accepts DataField instances; the pinned settings typings omit this overload.
    // @ts-expect-error Native ColorField provides validation and the settings color picker.
    type: new foundry.data.fields.ColorField(),
    onChange: refreshHUDPosition,
  });
  for (const key of ["hudScale", "statusIconScale"] as const) {
    game.settings!.register(MODULE_ID, key, {
      name: `PNEUMA_COMBAT_TOOLS.${key}Name`, hint: `PNEUMA_COMBAT_TOOLS.${key}Hint`,
      scope: "client", config: true, type: Number, default: 1,
      range: { min: 0.5, max: 2, step: 0.1 }, onChange: refreshHUDPosition,
    });
  }
  // Use Foundry's click/unclick handlers so combat clicks never call Token.control().
  CONFIG.Token.objectClass = class CombatToken extends CONFIG.Token.objectClass {
    private combatClick = false;

    private canOpenCombatMenu() {
      return canvas.activeLayer === canvas.tokens && this.isVisible && !this.isPreview && !!this.actor
        && canvas.controls?.ruler?.state !== Ruler.STATES.MEASURING;
    }

    private useCombatMenu(event: PIXI.FederatedPointerEvent) {
      return this.canOpenCombatMenu() && (!this.isOwner || event.shiftKey
        || (this.isTargeted && !!game.settings!.get(MODULE_ID, "targetedRightClick")));
    }

    protected override _canHUD(user: User, event: PIXI.FederatedPointerEvent) {
      return super._canHUD(user, event) || this.useCombatMenu(event);
    }

    protected override _onClickRight(event: PIXI.FederatedPointerEvent) {
      this.combatClick = this.useCombatMenu(event);
      selection = { target: this, attacker: selectedAttacker(), combatOnly: this.combatClick && event.shiftKey, anchor: event.getLocalPosition(canvas.stage!) };
      if (!this.combatClick) return super._onClickRight(event);
      event.stopPropagation();
    }

    protected override _onUnclickRight(event: PIXI.FederatedPointerEvent) {
      if (!this.combatClick) return super._onUnclickRight(event);
      this.combatClick = false;
      event.stopPropagation();
      // Native MouseInteractionManager only emits unclick for clicks, never completed drags.
      if (!this.canOpenCombatMenu()) return;
      const hud = canvas.tokens!.hud;
      if (hud.object === this) hud.render(true);
      else hud.bind(this);
    }

    protected override _onClickRight2(event: PIXI.FederatedPointerEvent) {
      if (!this.useCombatMenu(event)) return super._onClickRight2(event);
      // A combat double-click must not open token configuration or change targets.
      event.stopPropagation();
    }
  };
  // Extend the configured HUD: retain native positioning, lifecycle, and renderTokenHUD hooks.
  CONFIG.Token.hudClass = class CombatTokenHUD extends CONFIG.Token.hudClass {
    override get template() {
      return this.object && isStandalone(this.object) ? TEMPLATE : super.template;
    }

    override setPosition() {
      const token = this.object;
      if (!token || !this.element.length) return;
      super.setPosition();
      const oneByOne = token.document.width === 1 && token.document.height === 1;
      const anchor = !oneByOne && selection?.target === token ? selection.anchor : token.center;
      // #hud already follows canvas zoom. Cancel it once for the entire Token HUD.
      const scale = game.settings!.get(MODULE_ID, "hudScale") / canvas.stage!.scale.x;
      this.element.css({
        width: 100, height: 100, left: anchor.x - 50 * scale, top: anchor.y - 50 * scale,
        transform: `scale(${scale})`,
        "--pneuma-cth-icon-color": game.settings!.get(MODULE_ID, "iconColor") ?? "",
        "--pneuma-status-icon-size": `${36 * game.settings!.get(MODULE_ID, "statusIconScale")}px`,
      }).removeClass("large").addClass("pneuma-readable-hud")
        .toggleClass("pneuma-tight-hud", game.settings!.get(MODULE_ID, "tightHUD"));
    }
    override getData(options = {}) {
      const attacker = selection && selection.target === this.object ? selection.attacker : selectedAttacker();
      return {
        ...super.getData(options),
        standalone: isStandalone(this.object!),
        attackTitle: game.user!.isGM && attacker ? game.i18n!.format("PNEUMA_COMBAT_TOOLS.AttackAs", { name: attacker.name }) : label("Attack"),
        weapons: attacker ? [...attackEntries(Array.from(attacker.actor!.items) as unknown as MenuWeapon[]), ...thrownEntries(Array.from(attacker.actor!.items) as unknown as MenuWeapon[])] : [],
        grenades: attacker ? grenadeEntries(Array.from(attacker.actor!.items) as unknown as MenuWeapon[]) : [],
        weaponEmpty: label(attacker ? "NoEquippedWeapons" : "SelectAttacker"),
        controls: [
          { action: "target", icon: "fa-crosshairs", title: label("Target"), active: this.object!.isTargeted },
          { action: "attack", icon: "fa-gun", title: label("Attack") },
          { action: "melee", icon: "", title: label("MeleeAttack") },
          { action: "brawling", icon: "fa-hand-fist", title: label("Brawling") },
          { action: "thrown", icon: "fa-bomb", title: label("Thrown") },
          { action: "quickhacks", icon: "fa-microchip", title: label("Quickhacks") },
        ].filter(control => (control.action !== "target" || isStandalone(this.object!))
          && (control.action !== "quickhacks" || !!attacker?.actor
            && canShowQuickhack(Array.from(attacker.actor.items) as unknown as MenuWeapon[]))),
      };
    }

    override activateListeners(html: JQuery) {
      if (!isStandalone(this.object!)) super.activateListeners(html);
      // The standalone template has no editable attributes or native status tray.
      else BasePlaceableHUD.prototype.activateListeners.call(this, html);
    }
  };
});

Hooks.on("renderTokenHUD", async (hud: TokenHUD, html: JQuery, data: { standalone: boolean; attackTitle: string }) => {
  const token = hud.object;
  if (game.system!.id !== "cyberpunk-red-core" || !token?.actor) return;
  if (!data.standalone) {
    const controls = await renderTemplate(TEMPLATE, data);
    if (hud.object !== token || hud.element[0] !== html[0]) return;
    html.find(".col.right").first().append(controls);
  }
  const attacker = selection?.target === token ? selection.attacker : selectedAttacker();
  if (attacker?.actor && html[0]) decorateItemList(html[0], attacker.actor);
  html.find<HTMLButtonElement>("[data-attack-mode]").on("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!attacker) return ui.notifications!.warn(label("SelectAttacker"));
    const button = event.currentTarget;
    try {
      await attackFromHUD(attacker, token, button.dataset.itemId!, button.dataset.attackMode as AttackMode, event);
    } catch (error) {
      console.error(MODULE_ID, error);
      ui.notifications!.error(label("AttackFailed"));
    }
  });
  html.find("[data-combat-action]").on("click keydown", event => {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key ?? "")) return;
    event.preventDefault();
    event.stopPropagation();
    const action = event.currentTarget.dataset.combatAction;
    if (action === "target") return token.setTarget(!token.isTargeted, { releaseOthers: false });
    const panel = html.find(".pneuma-combat-menu");
    if (!action || !["attack", "melee", "brawling", "thrown", "quickhacks"].includes(action)) return;
    const open = panel.attr("data-open") !== action || !panel.hasClass("active");
    panel.attr("data-open", action).toggleClass("active", open);
    html.find('[data-combat-control]:not([data-combat-action="target"])')
      .removeClass("active").attr("aria-expanded", "false");
    $(event.currentTarget).toggleClass("active", open).attr("aria-expanded", String(open));
    panel.find(".combat-heading").text(action === "attack" ? data.attackTitle : event.currentTarget.title);
    const weaponPanel = action !== "quickhacks";
    panel.find(".combat-weapons").prop("hidden", !weaponPanel);
    panel.find("[data-attack-category]").each((_index, row) => {
      row.hidden = row.dataset.attackCategory !== action;
    });
    panel.find(".combat-empty").prop("hidden", panel.find("[data-attack-category]").toArray().some(row => !row.hidden));
    panel.find(".combat-description").prop("hidden", weaponPanel).text(weaponPanel ? "" : label("QuickhacksPlaceholder"));
  });
});

Hooks.on("targetToken", (user: User, token: Token) => {
  const hud = canvas.tokens?.hud;
  if (user.id !== game.user!.id || hud?.object !== token) return;
  hud.element.find('[data-combat-action="target"]')
    .toggleClass("active", token.isTargeted).attr("aria-pressed", String(token.isTargeted));
});
Hooks.on("canvasTearDown", () => {
  selection = undefined;
});

// Reposition only the open HUD; no token redraws or canvas-wide work on zoom.
function refreshHUDPosition() {
  const hud = canvas.tokens?.hud;
  if (game.system?.id === "cyberpunk-red-core" && hud?.object && hud.rendered) hud.setPosition();
}
Hooks.on("canvasPan", refreshHUDPosition);
