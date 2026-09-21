const MODULE = "pneuma-combattools";
/** Order existing native rows; settings remain registered under their original keys/scopes. */
const groups = [
  { id: "combat", title: "Combat & Evasion", keys: ["combatResolution", "hideAttackWeapon", "evasionEligibility", "configureEvasion", "areaSettingsMenu", "maNoAblation", "movementTracking", "empImmunity", "pneumaHomebrew"] },
  { id: "injuries", title: "Critical Injuries", keys: ["criticalInjuries"] },
  { id: "quickhack", title: "QuickHack", keys: ["quickhackEnabled", "quickhackMode", "quickhackMessages"] },
  { id: "token-hud", title: "Token HUD & Targeting", keys: ["targetedRightClick", "tightHUD", "hudScale", "iconColor", "hoverDV", "hoverAutofire", "alwaysShowEKG"] },
  { id: "status-hud", title: "Status HUD & Biomonitor", keys: ["eyeHUD", "eyeHUDAnimateMessages", "biomonitorShowHP", "biomonitorFlashSeconds", "eyeHUDPreview"] },
  { id: "statuses", title: "Status Effects", keys: ["statusIconScale", "customStatusesMenu"] },
] as const;

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
}

export function registerSettingsLayout(): void {
  Hooks.on("renderSettingsConfig", (_app: SettingsConfig, html: JQuery) => {
    if (html[0]) groupModuleSettings(html[0]);
  });
}
