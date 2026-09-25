const MODULE = "pneuma-combattools";
export const COMBAT_BAR_SETTING_KEYS = ["combatBar", "combatBarDock", "combatBarSize", "combatBarOrientation", "combatBarNameOnly", "combatBarDefaultMovement"] as const;
/** Order existing native rows; settings remain registered under their original keys/scopes. */
const groups = [
  { id: "combat", title: "Attack & Damage Cards", keys: ["hideAttackWeapon", "showArmorControls", "maNoAblation", "reportWeaponReloads"] },
  { id: "evasion", title: "Evasion & Area Attacks", keys: ["evasionEligibility", "configureEvasion", "npcAutoEvasion", "areaSettingsMenu"] },
  { id: "movement", title: "Movement & Initiative", keys: ["movementTracking", "pneumaHomebrew"] },
  { id: "injuries", title: "Injuries & Effects", keys: ["criticalInjuries", "injuryTurnEndReminder", "empBehaviorMenu", "customStatusesMenu"] },
  { id: "quickhack", title: "QuickHack", keys: ["quickhackEnabled", "quickhackMode", "quickhackMessages"] },
  { id: "combat-bar", title: "Combat Bar", keys: COMBAT_BAR_SETTING_KEYS },
  { id: "token-hud", title: "Token HUD & Targeting", keys: ["targetedRightClick", "tightHUD", "hudScale", "iconColor", "statusIconScale", "hoverDV", "hoverAutofire", "alwaysShowEKG"] },
  { id: "status-hud", title: "Status HUD & Biomonitor", keys: ["eyeHUD", "eyeHUDDock", "crewHUDIntegration", "biomonitorShowHP", "forcePlayerHUDAnimations", "eyeHUDAnimateMessages", "biomonitorFlashSeconds"] },
] as const;

/** Keep native saved fields and submission behavior; present their paired values as one choice. */
export function combatBarPositionControls(root: HTMLElement): void {
  const dock = root.querySelector<HTMLSelectElement>(`select[name="${MODULE}.combatBarDock"]`);
  const orientation = root.querySelector<HTMLSelectElement>(`select[name="${MODULE}.combatBarOrientation"]`);
  if (!dock || !orientation) return;
  const dockRow = dock.closest<HTMLElement>(".form-group")!;
  const orientationRow = orientation.closest<HTMLElement>(".form-group")!;
  dock.hidden = true;
  orientationRow.hidden = true;
  if (dockRow.querySelector(".pneuma-bar-positions")) return;
  const choices = document.createElement("div");
  choices.className = "pneuma-bar-positions";
  choices.setAttribute("role", "radiogroup");
  choices.setAttribute("aria-label", "Combat bar position");
  const radios: HTMLInputElement[] = [];
  for (const [position, direction, title] of [
    ["bottom-left", "horizontal", "Bottom left horizontal"],
    ["bottom-left", "vertical", "Bottom left vertical"],
    ["top-right", "horizontal", "Top right horizontal"],
    ["top-right", "vertical", "Top right vertical"],
  ] as const) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    // Unnamed presentation controls never enter Foundry's settings submission.
    radio.checked = dock.value === position && orientation.value === direction;
    radio.tabIndex = radio.checked ? 0 : -1;
    radio.addEventListener("change", () => {
      for (const sibling of radios) { sibling.checked = sibling === radio; sibling.tabIndex = sibling === radio ? 0 : -1; }
      for (const [select, value] of [[dock, position], [orientation, direction]] as const) {
        if (select.value === value) continue;
        select.value = value;
        select.dispatchEvent(new Event("change", {bubbles:true}));
      }
    });
    radio.addEventListener("keydown", event => {
      const step = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : ["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const next = radios[(radios.indexOf(radio) + step + radios.length) % radios.length]!;
      next.focus(); next.click();
    });
    radios.push(radio);
    label.append(radio, document.createTextNode(title));
    choices.append(label);
  }
  dock.after(choices);
}


export function groupModuleSettings(root: HTMLElement): void {
  const rows = new Map<HTMLElement, string>();
  root.querySelectorAll<HTMLElement>(`[name^="${MODULE}."], button[data-key^="${MODULE}."]`).forEach(control => {
    const row = control.closest<HTMLElement>(".form-group");
    const key = (control.getAttribute("name") ?? control.dataset.key ?? "").slice(MODULE.length + 1);
    if (row && !rows.has(row)) rows.set(row, key);
  });
  if (!rows.size) return;
  let wrapper = root.querySelector<HTMLElement>(".pneuma-combat-settings");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "pneuma-combat-settings";
    rows.keys().next().value!.before(wrapper);
  }
  // Move, never clone: retain native listeners, draft values, menus and permission filtering.
  for (const row of rows.keys()) row.remove();
  wrapper.replaceChildren();
  const appendGroup = (id: string, title: string, entries: HTMLElement[]) => {
    if (!entries.length) return;
    const group = document.createElement("fieldset");
    group.dataset.combatSettingsGroup = id;
    const legend = document.createElement("legend");
    legend.textContent = title;
    group.append(legend, ...entries);
    wrapper!.append(group);
  };
  for (const group of groups) {
    const ordered: HTMLElement[] = [];
    for (const key of group.keys) for (const [row, rowKey] of rows) if (rowKey === key) {
      ordered.push(row);
      rows.delete(row);
    }
    appendGroup(group.id, group.title, ordered);
  }
  // Future settings stay accessible instead of disappearing when their group is not yet assigned.
  appendGroup("other", "Other Settings", [...rows.keys()]);
  combatBarPositionControls(root);
}

export function registerSettingsLayout(): void {
  Hooks.on("renderSettingsConfig", (_app: SettingsConfig, html: JQuery) => {
    if (html[0]) groupModuleSettings(html[0]);
  });
}
