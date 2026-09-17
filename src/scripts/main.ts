const MODULE_ID = "pneuma-combattools";
const label = (key: string) => game.i18n!.localize(`PNEUMA_COMBAT_TOOLS.${key}`);
let combatHUD: CombatHUD;
let canvasClicks: AbortController | undefined;

class CombatHUD extends BasePlaceableHUD<Token> {
  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "pneuma-combat-hud",
      template: `modules/${MODULE_ID}/templates/combat-hud.hbs`,
      classes: ["placeable-hud", "pneuma-combattools"],
    });
  }

  override async _render(...args: Parameters<BasePlaceableHUD<Token>["_render"]>) {
    await super._render(...args);
    // Use Foundry's canvas HUD container so pan and zoom follow the token.
    if (!this.object) return;
    this.element.appendTo("#hud");
    this.setPosition();
  }

  override setPosition() {
    if (!this.object || !this.element?.length) return;
    const { x, y, w, h } = this.object;
    this.element.css({ left: x, top: y, width: w, height: h });
  }

  override getData(options = {}) {
    const controlled = canvas.tokens!.controlled.filter(token => token.actor?.isOwner);
    const attacker = controlled.length === 1 ? controlled[0] : null;
    return {
      ...super.getData(options),
      attacker: attacker?.name ?? label("SelectAttacker"),
      targeted: this.object!.isTargeted,
      weapons: attacker ? Array.from(attacker.actor!.items)
        .filter(item => String(item.type) === "weapon" && foundry.utils.getProperty(item, "system.equipped") === "equipped")
        .map(item => ({ id: item.id, name: item.name, img: item.img }))
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")) : [],
      weaponEmpty: label(attacker ? "NoEquippedWeapons" : "SelectAttacker"),
      controls: [
        { action: "target", icon: "fa-crosshairs", title: label("Target"), active: this.object!.isTargeted },
        { action: "attack", icon: "fa-gun", title: label("Attack") },
        { action: "thrown", icon: "fa-bomb", title: label("Thrown") },
        { action: "quickhacks", icon: "fa-microchip", title: label("Quickhacks") },
      ],
    };
  }

  override activateListeners(html: JQuery) {
    super.activateListeners(html);
    html.on("contextmenu", event => event.preventDefault());
    html.find("[data-combat-action]").on("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const action = event.currentTarget.dataset.combatAction;
      if (!action) return;
      if (action === "close") return this.clear();
      if (action === "target") {
        this.object!.setTarget(!this.object!.isTargeted, { releaseOthers: false });
        return;
      }
      const panel = html.find(".combat-menu");
      const close = panel.attr("data-open") === action && !panel.prop("hidden");
      panel.attr("data-open", close ? "" : action).prop("hidden", close);
      html.find("[data-combat-action]:not([data-combat-action=target])")
        .removeClass("active").attr("aria-expanded", "false");
      if (!close) {
        $(event.currentTarget).addClass("active").attr("aria-expanded", "true");
        panel.find("strong").text(event.currentTarget.title);
        panel.find(".combat-weapons").prop("hidden", action !== "attack");
        panel.find(".combat-description").text(label({
          attack: "AttackPlaceholder",
          thrown: "ThrownPlaceholder",
          quickhacks: "QuickhacksPlaceholder",
        }[action as "attack" | "thrown" | "quickhacks"]));
      }
    });
  }
}

function openCombatHUD(token: Token) {
  if (game.system!.id !== "cyberpunk-red-core" || !token.isVisible || !token.actor) return;
  if (combatHUD.object === token) return combatHUD.clear();
  canvas.tokens!.hud.clear();
  combatHUD.bind(token);
}

// Read canvas input directly: unowned tokens need no native HUD permission.
function registerCanvasClicks() {
  canvasClicks?.abort();
  canvasClicks = new AbortController();
  const view = canvas.app!.view as HTMLCanvasElement;
  const options = { capture: true, signal: canvasClicks.signal };
  let press: { token: Token; x: number; y: number; id: number } | null = null;
  view.addEventListener("pointerdown", event => {
    press = null;
    if (event.button !== 2 || canvas.activeLayer !== canvas.tokens) return;
    const token = canvas.tokens.hover;
    if (!token?.isVisible || token.isOwner || !token.actor) return;
    press = { token, x: event.clientX, y: event.clientY, id: event.pointerId };
  }, options);
  view.addEventListener("pointermove", event => {
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5) press = null;
  }, options);
  view.addEventListener("pointerup", event => {
    const click = press;
    press = null;
    if (!click || event.button !== 2 || event.pointerId !== click.id) return;
    if (Math.hypot(event.clientX - click.x, event.clientY - click.y) > 5) return;
    if (canvas.activeLayer !== canvas.tokens || canvas.tokens.hover !== click.token) return;
    openCombatHUD(click.token);
  }, options);
  view.addEventListener("pointercancel", () => { press = null; }, options);
  view.addEventListener("pointerleave", () => { press = null; }, options);
}

Hooks.once("init", () => {
  combatHUD = new CombatHUD();
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") combatHUD.clear();
  });
  document.addEventListener("pointerdown", event => {
    if (!(event.target instanceof Element && event.target.closest("#pneuma-combat-hud"))) combatHUD.clear();
  });
});

Hooks.on("canvasReady", registerCanvasClicks);

Hooks.on("renderTokenHUD", (hud: TokenHUD, html: JQuery) => {
  combatHUD.clear();
  if (game.system!.id !== "cyberpunk-red-core" || !hud.object?.actor) return;
  const button = $("<div>", {
    class: "control-icon",
    role: "button",
    tabindex: 0,
    title: label("Title"),
    "aria-label": label("Title"),
  }).append($('<i class="fas fa-crosshairs" aria-hidden="true"></i>'));
  button.on("click keydown", event => {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key ?? "")) return;
    event.preventDefault();
    event.stopPropagation();
    openCombatHUD(hud.object!);
  });
  html.find(".col.right").append(button);
});

Hooks.on("targetToken", (user: User, token: Token) => {
  if (user.id === game.user!.id && combatHUD.object === token) combatHUD.render();
});
Hooks.on("controlToken", () => combatHUD.clear());
Hooks.on("updateToken", (document: TokenDocument) => {
  if (combatHUD.object?.document === document) combatHUD.clear();
});
Hooks.on("deleteToken", (document: TokenDocument) => {
  if (combatHUD.object?.document === document) combatHUD.clear();
});
Hooks.on("canvasTearDown", () => {
  canvasClicks?.abort();
  combatHUD.clear();
});
