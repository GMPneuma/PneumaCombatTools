import {registerDisplaySettings} from "./display-settings.js";
import {registerCombatBarSettings} from "./combat-bar-settings.js";
import {registerChatButtons} from "./chat-buttons.js";
import {registerHalfArmor} from "./half-armor.js";
import {registerManualRolls} from "./manual-rolls.js";
import {registerInjuryNotices} from "./injury-notices.js";
import {registerPlayersControl} from "./players-control.js";
import {openTurnMarkerSettings,registerTurnMarkerSettings} from "./turn-marker-settings.js";
import {registerTurnMarker} from "./turn-marker.js";
import {registerSuppression} from "./suppression.js";
import { registerCombatBar } from "./combat-bar.js";
import {registerInjuryMechanics} from "./injury-mechanics.js";
import {registerNativeEffectIntegration} from "./native-effect-integration.js";
import {registerInstantEffects} from "./instant-effects.js";
import { registerSelfCTH, isSelfCTH, selfInitiativeControl, rerollSelfInitiative } from "./self-cth.js";
import { registerHoverEKG } from "./ekg-hover.js";
import { registerMovement } from "./movement.js";
import { bindWeaponAmmo, refreshWeaponAmmo } from "./weapon-ammo.js";
import { registerAmmoChat } from "./ammo-chat.js";
import { DEFAULT_ICON_COLOR, installIconColorNormalization } from "./icon-color.js";
import { registerEmp } from "./emp.js";
import { registerAreaAttacks } from "./aoe/workflow.js";
import { registerSocketHealth } from "./socket-health.js";
import { registerResolutionScroll } from "./resolution-scroll.js";
import { registerGrapple, useGrapple } from "./grapple/workflow.js";
import { grappleMenu, grappleWeaponBlocked } from "./grapple/state.js";
import { registerQuickhack } from "./quickhack/integration.js";
import { registerSettingsLayout } from "./settings-layout.js";
import { enabled as quickhackEnabled } from "./quickhack/settings.js";
import { actorQuickhacks, executeQuickhack } from "./quickhack/workflow.js";
import { connectionFor, trackingCombat, jackOut } from "./quickhack/connections.js";
import { beginForceOut, forceOutEntries } from "./quickhack/force-out.js";
import { hasQuickhackSight } from "./quickhack/sight.js";
import { registerCyberpunkStatuses } from "./status-settings.js";
import { registerEyeHUD } from "./eye-hud.js";
import { registerItemMarkers, decorateItemList } from "./item-markers.js";
import { registerCriticalSettings } from "./critical-settings.js";
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
const isStandalone = (token: Token) => !isSelfCTH(token, selection?.target === token ? selection.attacker : selectedAttacker()) && (!token.isOwner || (selection?.target === token && !!selection.combatOnly));
const selectedAttacker = () => {
  const tokens = canvas.tokens!.controlled.filter(token => token.actor?.isOwner);
  return tokens.length === 1 ? tokens[0] : undefined;
};

Hooks.once("init", () => {
  if (game.system!.id !== "cyberpunk-red-core") return;
  registerSocketHealth();
  registerAmmoChat();
  registerManualRolls();
  registerHalfArmor();
  registerChatButtons();
  registerSelfCTH();
  registerQuickhack(() => { const target = canvas.tokens?.hud?.object ?? undefined; const source = selection && selection.target === target ? selection.attacker : selectedAttacker(); return {source, target, self:isSelfCTH(target,source)}; });
  registerGrapple();
  registerResolutionScroll();
  registerCyberpunkStatuses();
  registerEyeHUD();
  registerHoverDV();
  registerHoverEKG();
  registerArmorShortcut();
  registerItemMarkers();
  registerEvasionSettings();
  registerCombatResolution();
  registerCombatBar();
  registerTurnMarker();
  registerTurnMarkerSettings();
  registerSuppression();
  registerPlayersControl();
  registerMovement();
  registerInjuryMechanics();
  registerInjuryNotices();
  registerEmp();
  registerInstantEffects();
  registerNativeEffectIntegration();
  registerAreaAttacks();
  registerCriticalSettings();
  registerSettingsLayout();
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
    scope: "world", config: true, default: DEFAULT_ICON_COLOR,
    // Foundry v12 accepts DataField instances; the pinned settings typings omit this overload.
    // @ts-expect-error Native ColorField provides validation and the settings color picker.
    type: new foundry.data.fields.ColorField(),
    onChange: refreshHUDPosition,
  });
  Hooks.once("setup", () => installIconColorNormalization(game.settings!));
  for (const key of ["hudScale", "statusIconScale"] as const) {
    game.settings!.register(MODULE_ID, key, {
      name: `PNEUMA_COMBAT_TOOLS.${key}Name`, hint: `PNEUMA_COMBAT_TOOLS.${key}Hint`,
      scope: "client", config: true, type: Number, default: 1,
      range: { min: 0.5, max: 2, step: 0.1 }, onChange: refreshHUDPosition,
    });
  }
  registerDisplaySettings();
  registerCombatBarSettings();
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
        "--pneuma-cth-icon-color": game.settings!.get(MODULE_ID, "iconColor") || DEFAULT_ICON_COLOR,
        "--pneuma-status-icon-size": `${36 * game.settings!.get(MODULE_ID, "statusIconScale")}px`,
      }).removeClass("large").addClass("pneuma-readable-hud")
        .toggleClass("pneuma-tight-hud", game.settings!.get(MODULE_ID, "tightHUD"));
    }
    override getData(options = {}) {
      const attacker = selection && selection.target === this.object ? selection.attacker : selectedAttacker();
      const selfCTH = isSelfCTH(this.object ?? undefined, attacker);
      if (selfCTH) return {...super.getData(options), standalone: false, selfCTH: true, grappleActions:grappleMenu(this.object??undefined,this.object??undefined), selfAlertHUD: game.settings!.get(MODULE_ID,"eyeHUD"), selfInitiative: selfInitiativeControl(this.object!), selfThrown:[...thrownEntries(Array.from(this.object!.actor!.items) as unknown as MenuWeapon[]),...grenadeEntries(Array.from(this.object!.actor!.items) as unknown as MenuWeapon[])]};
      const connection = attacker?.actor && this.object?.actor ? connectionFor(attacker.actor, this.object.actor.uuid) : undefined;
      const sight = !!attacker && !!this.object && quickhackEnabled() && hasQuickhackSight(attacker, this.object);
      const ejectNetrunners = forceOutEntries(this.object?.actor ?? undefined);
      const offensiveQuickhacks = !!attacker?.actor && attacker.actor.uuid !== this.object?.actor?.uuid
        && quickhackEnabled() && canShowQuickhack(Array.from(attacker.actor.items) as unknown as MenuWeapon[]);
      return {
        ...super.getData(options),
        ejectNetrunners,
        offensiveQuickhacks,
        standalone: isStandalone(this.object!),
        attackTitle: game.user!.isGM && attacker ? game.i18n!.format("PNEUMA_COMBAT_TOOLS.AttackAs", { name: attacker.name }) : label("Attack"),
        weapons: attacker ? [...attackEntries(Array.from(attacker.actor!.items) as unknown as MenuWeapon[]), ...thrownEntries(Array.from(attacker.actor!.items) as unknown as MenuWeapon[])].map(row => ({...row, deferred: ("deferred" in row && row.deferred) || grappleWeaponBlocked(attacker.actor!, attacker.actor!.items.get(row.id!)!)})) : [],
        grappleActions: grappleMenu(attacker, this.object ?? undefined),
        grenades: attacker ? grenadeEntries(Array.from(attacker.actor!.items) as unknown as MenuWeapon[]) : [],
        weaponEmpty: label(attacker ? "NoEquippedWeapons" : "SelectAttacker"),
        quickhacks: attacker?.actor && quickhackEnabled() ? actorQuickhacks(attacker.actor) : [],
        quickhackConnected: sight && connection?.state === "active",
        quickhackJackInDisabled: connection?.state === "ejected" || (connection?.state !== "active" && !sight),
        quickhackJackAction: connection?.state === "active" ? "jack-out" : "jack-in",
        quickhackStatus: connection?.state === "active" ? "Jacked-In" : connection?.state === "ejected" ? "Ejected" : "Not Jacked-In",
        quickhackNote: (!trackingCombat() ? "Outside combat — QuickHack requires a tracked connection" : "") + (sight ? "" : " — No line of sight"),
        controls: [
          { action: "attack", icon: "fa-gun", title: label("Attack") },
          { action: "melee", icon: "", title: label("CloseCombat") },
          { action: "thrown", icon: "fa-bomb", title: label("Thrown") },
          { action: "quickhacks", icon: "fa-microchip", title: label("Quickhacks") },
        ].filter(control => (control.action !== "quickhacks" || offensiveQuickhacks || ejectNetrunners.length > 0)),
      };
    }

    override activateListeners(html: JQuery) {
      if (!isStandalone(this.object!)) super.activateListeners(html);
      // The standalone template has no editable attributes or native status tray.
      else BasePlaceableHUD.prototype.activateListeners.call(this, html);
    }
  };
});

Hooks.on("renderTokenHUD", async (hud: TokenHUD, html: JQuery, data: { standalone: boolean; selfCTH?: boolean; attackTitle: string; quickhackStatus: string }) => {
  const token = hud.object;
  if (game.system!.id !== "cyberpunk-red-core" || !token?.actor) return;
  if (!data.standalone) {
    const controls = await renderTemplate(TEMPLATE, data);
    if (hud.object !== token || hud.element[0] !== html[0]) return;
    html.find(".col.right").first().append(controls);
  }
  if(game.user?.isGM&&!data.selfCTH){
    html.find(".col.right").first().append('<div class="control-icon" role="button" tabindex="0" data-token-indicator title="Animated Turn Indicator: This Token" aria-label="Animated Turn Indicator: This Token"><i class="fas fa-gear" aria-hidden="true"></i></div>');
    html.find("[data-token-indicator]").on("click keydown",event=>{if(event.type==="keydown"&&!["Enter"," "].includes(event.key??""))return;event.preventDefault();event.stopPropagation();openTurnMarkerSettings(token.document);});
  }
  if (data.selfCTH) {
    html.find("[data-self-settings-toggle]").on("click keydown",event=>{
      if(event.type==="keydown"&&!["Enter"," "].includes(event.key??""))return;
      event.preventDefault();event.stopPropagation();const panel=html.find("[data-self-settings-menu]");
      const open=panel.prop("hidden");panel.prop("hidden",!open);$(event.currentTarget).attr("aria-expanded",String(open));
    });
    html.find("[data-turn-animation]").on("click",event=>{
      event.preventDefault();event.stopPropagation();openTurnMarkerSettings(token.document);
      html.find("[data-self-settings-menu]").prop("hidden",true);html.find("[data-self-settings-toggle]").attr("aria-expanded","false");
    });
    html.find("[data-self-close-toggle]").on("click keydown",event=>{
      if(event.type==="keydown"&&!["Enter"," "].includes(event.key??""))return;
      event.preventDefault();event.stopPropagation();const panel=html.find("[data-self-close-menu]");panel.prop("hidden",!panel.prop("hidden"));
    });
    html.find<HTMLButtonElement>("[data-self-grapple]").on("click",async event=>{
      event.preventDefault();event.stopPropagation();if(event.currentTarget.disabled)return;
      await useGrapple(token,token,event.currentTarget.dataset.selfGrapple!);
      if(hud.object===token)hud.render(true);
    });
    html.find("[data-self-thrown-toggle]").on("click keydown",event=>{if(event.type==="keydown"&&!["Enter"," "].includes(event.key??""))return;event.preventDefault();event.stopPropagation();const panel=html.find("[data-self-thrown-menu]");panel.prop("hidden",!panel.prop("hidden"));});
    html.find<HTMLButtonElement>("[data-self-throw]").on("click",async event=>{
      event.preventDefault();event.stopPropagation();const button=event.currentTarget;if(button.disabled)return;button.disabled=true;
      try{
        const id=button.dataset.selfThrow!;
        const grenade=grenadeEntries(Array.from(token.actor!.items) as unknown as MenuWeapon[]).some(item=>item.id===id);
        if(grenade){const {startAreaAttack}=await import("./aoe/workflow.js");await startAreaAttack(token,token,id,"attack");}
        else {const targets=[...game.user!.targets].filter(target=>target!==token);if(targets.length!==1)throw Error("Target one other token for a thrown weapon. Grenades use ground placement.");await attackFromHUD(token,targets[0]!,id,"attack",event);}
      }catch(error){ui.notifications!.error((error as Error).message);}finally{button.disabled=false;}
    });
    html.find<HTMLElement>("[data-self-alert-hud]").on("click keydown",async event=>{
      if(event.type==="keydown"&&!["Enter"," "].includes(event.key??""))return;
      event.preventDefault();event.stopPropagation();const button=event.currentTarget;
      if(button.getAttribute("aria-disabled")==="true")return;
      button.setAttribute("aria-disabled","true");
      try{await game.settings!.set(MODULE_ID,"eyeHUD",!game.settings!.get(MODULE_ID,"eyeHUD"));}
      catch(error){ui.notifications!.error(error instanceof Error?error.message:String(error));}
      finally{if(hud.object===token)hud.render(true);}
    });
    html.find<HTMLElement>("[data-self-initiative]").on("click keydown",async event=>{
      if(event.type==="keydown"&&!["Enter"," "].includes(event.key??""))return;
      event.preventDefault();event.stopPropagation();const button=event.currentTarget;
      if(button.getAttribute("aria-disabled")==="true")return;
      button.setAttribute("aria-disabled","true");
      try{await rerollSelfInitiative(token);}
      catch(error){ui.notifications!.error(error instanceof Error?error.message:String(error));}
      finally{if(hud.object===token)hud.render(true);}
    });
    return;
  }
  const attacker = selection?.target === token ? selection.attacker : selectedAttacker();
  if (attacker?.actor && html[0]) bindWeaponAmmo(html[0], attacker.actor);
  if (attacker?.actor && html[0]) decorateItemList(html[0], attacker.actor);
  html.find<HTMLButtonElement>("[data-grapple-action]").on("click", async event => {
    event.preventDefault(); event.stopPropagation();
    if (attacker) await useGrapple(attacker, token, event.currentTarget.dataset.grappleAction!);
  });
  html.find<HTMLButtonElement>("[data-eject-message]").on("click", async event => {
    event.preventDefault(); event.stopPropagation();
    const button = event.currentTarget;
    if (button.disabled || !forceOutEntries(token.actor ?? undefined).some(row => row.messageId === button.dataset.ejectMessage)) return;
    const message = {id:button.dataset.ejectMessage!};
    button.disabled = true;
    try { await beginForceOut(message); }
    catch (error) { ui.notifications!.error(error instanceof Error ? error.message : "Eject NetRunner failed."); }
    finally { button.disabled = false; }
  });
  html.find<HTMLButtonElement>("[data-quickhack-id]").on("click", async event => {
    event.preventDefault(); event.stopPropagation();
    const button = event.currentTarget;
    if (!attacker?.actor || !token.actor || !quickhackEnabled() || button.disabled) return;
    button.disabled = true;
    try {
      if (button.dataset.quickhackId === "jack-out") await jackOut(attacker.actor, token.actor.uuid);
      else await executeQuickhack(attacker, token, button.dataset.quickhackId!);
    } catch (error) { ui.notifications!.error(error instanceof Error ? error.message : "Jack Out failed."); }
    finally { if (hud.object === token) hud.render(true); }
  });
  html.find<HTMLButtonElement>("[data-attack-mode]").on("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!attacker) return ui.notifications!.warn(label("SelectAttacker"));
    const button = event.currentTarget;
    if (button.disabled || button.getAttribute("aria-disabled") === "true") return;
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
    const panel = html.find(".pneuma-combat-menu");
    if (!action || !["attack", "melee", "thrown", "quickhacks"].includes(action)) return;
    const open = panel.attr("data-open") !== action || !panel.hasClass("active");
    panel.attr("data-open", action).toggleClass("active", open);
    html.find('[data-combat-control]')
      .removeClass("active").attr("aria-expanded", "false");
    $(event.currentTarget).toggleClass("active", open).attr("aria-expanded", String(open));
    const colors = getComputedStyle(event.currentTarget);
    panel.find(".combat-heading").text(action === "quickhacks" ? data.quickhackStatus : action === "attack" ? data.attackTitle : event.currentTarget.title)
      .css({ backgroundColor: colors.backgroundColor, color: colors.color, borderColor: colors.borderColor });
    const weaponPanel = action !== "quickhacks";
    panel.find(".combat-quickhacks").prop("hidden", weaponPanel || !quickhackEnabled());
    panel.find(".combat-weapons").prop("hidden", !weaponPanel);
    panel.find("[data-attack-category]").each((_index, row) => {
      row.hidden = action === "melee" ? !["melee", "brawling"].includes(row.dataset.attackCategory ?? "") : row.dataset.attackCategory !== action;
    });
    panel.find(".combat-empty").prop("hidden", panel.find("[data-attack-category]").toArray().some(row => !row.hidden));
    panel.find(".combat-description").prop("hidden", true);
  });
});

Hooks.on("canvasTearDown", () => {
  selection = undefined;
});

for (const hook of ["createItem", "updateItem", "deleteItem"]) Hooks.on(hook, (item: Item) => {
  const hud = canvas.tokens?.hud, token = hud?.object;
  const attacker = selection?.target === token ? selection?.attacker : selectedAttacker();
  if (attacker?.actor && item.parent?.uuid === attacker.actor.uuid && hud?.element[0])
    refreshWeaponAmmo(hud.element[0], attacker.actor);
});

// Reposition only the open HUD; no token redraws or canvas-wide work on zoom.
function refreshHUDPosition() {
  const hud = canvas.tokens?.hud;
  if (game.system?.id === "cyberpunk-red-core" && hud?.object && hud.rendered) hud.setPosition();
}
Hooks.on("canvasPan", refreshHUDPosition);
