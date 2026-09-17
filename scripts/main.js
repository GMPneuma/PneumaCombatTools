const MODULE_ID = "pneuma-combattools";
const label = key => game.i18n.localize(`PNEUMA_COMBAT_TOOLS.${key}`);
let combatHUD;

class CombatHUD extends BasePlaceableHUD {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "pneuma-combat-hud",
      template: `modules/${MODULE_ID}/templates/combat-hud.hbs`,
      classes: ["placeable-hud", "pneuma-combattools"],
    });
  }

  getData(options = {}) {
    const controlled = canvas.tokens.controlled.filter(token => token.actor?.isOwner);
    const attacker = controlled.length === 1 ? controlled[0] : null;
    return {
      ...super.getData(options),
      attacker: attacker?.name ?? label("SelectAttacker"),
      targeted: this.object.isTargeted,
      controls: [
        { action: "target", icon: "fa-crosshairs", title: label("Target"), active: this.object.isTargeted },
        { action: "attack", icon: "fa-gun", title: label("Attack") },
        { action: "thrown", icon: "fa-bomb", title: label("Thrown") },
        { action: "quickhacks", icon: "fa-microchip", title: label("Quickhacks") },
      ],
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on("contextmenu", event => event.preventDefault());
    html.find("[data-combat-action]").on("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const action = event.currentTarget.dataset.combatAction;
      if (action === "close") return this.clear();
      if (action === "target") {
        this.object.setTarget(!this.object.isTargeted, { releaseOthers: false });
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
        panel.find("p").text(label({
          attack: "AttackPlaceholder",
          thrown: "ThrownPlaceholder",
          quickhacks: "QuickhacksPlaceholder",
        }[action]));
      }
    });
  }
}

function openCombatHUD(token) {
  if (game.system.id !== "cyberpunk-red-core" || !token.isVisible || !token.actor) return;
  if (combatHUD.object === token) return combatHUD.clear();
  canvas.tokens.hud.clear();
  combatHUD.bind(token);
}

// Listen to token clicks without changing native HUD permissions or handlers.
function onTokenRightClick() {
  if (!this.isOwner && canvas.activeLayer === canvas.tokens) openCombatHUD(this);
}

Hooks.once("init", () => {
  combatHUD = new CombatHUD();
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") combatHUD.clear();
  });
  document.addEventListener("pointerdown", event => {
    if (!event.target.closest?.("#pneuma-combat-hud")) combatHUD.clear();
  });
});

Hooks.on("drawToken", token => {
  token.off("rightclick", onTokenRightClick);
  token.on("rightclick", onTokenRightClick);
});

Hooks.on("renderTokenHUD", (hud, html) => {
  combatHUD.clear();
  if (game.system.id !== "cyberpunk-red-core" || !hud.object?.actor) return;
  const button = $("<div>", {
    class: "control-icon",
    role: "button",
    tabindex: 0,
    title: label("Title"),
    "aria-label": label("Title"),
  }).append($('<i class="fas fa-crosshairs" aria-hidden="true"></i>'));
  button.on("click keydown", event => {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    openCombatHUD(hud.object);
  });
  html.find(".col.right").append(button);
});

Hooks.on("targetToken", (user, token) => {
  if (user.id === game.user.id && combatHUD.object === token) combatHUD.render();
});
Hooks.on("controlToken", () => combatHUD.clear());
Hooks.on("updateToken", document => {
  if (combatHUD.object?.document === document) combatHUD.clear();
});
Hooks.on("deleteToken", document => {
  if (combatHUD.object?.document === document) combatHUD.clear();
});
Hooks.on("canvasTearDown", () => combatHUD.clear());
