import type { StatusDefinition } from "./status-catalog.js";
/** Foundry v12 counts disabled Actor effects as selected in its native HUD choices. */
export function correctStatusChoices<T extends Record<string, {isActive:boolean;isOverlay:boolean;cssClass:string}>>(choices:T,actor:Actor|null|undefined):T {
  const active=new Set<string>(), overlays=new Set<string>();
  for(const effect of actor?.allApplicableEffects()??[]) {
    if(effect.disabled||effect.isSuppressed||(effect as ActiveEffect & {system?:{isSuppressed?:boolean}}).system?.isSuppressed)continue;
    for(const id of effect.statuses) {
      active.add(id);
      if(foundry.utils.getProperty(effect,"flags.core.overlay"))overlays.add(id);
    }
  }
  for(const [id,choice] of Object.entries(choices)) {
    choice.isActive=active.has(id);choice.isOverlay=overlays.has(id);
    const classes=choice.cssClass.split(/\s+/).filter(value=>value&&value!=="active"&&value!=="overlay");
    if(choice.isActive)classes.push("active");
    if(choice.isOverlay)classes.push("overlay");
    choice.cssClass=classes.join(" ");
  }
  return choices;
}
/** Move native nodes rather than replace them: Foundry keeps its click/right-click handlers. */
export function groupStatusHUD(root: HTMLElement, statuses: StatusDefinition[], separateCustomStatuses = false): void {
  const tray = root.querySelector<HTMLElement>(".status-effects:not(.pneuma-combat-menu)");
  if (!tray || tray.dataset.pneumaGrouped) return;
  const icons = Array.from(tray.querySelectorAll<HTMLElement>(".effect-control"));
  if (!icons.length) return;
  tray.dataset.pneumaGrouped = "true";
  tray.classList.add("pneuma-status-tray");
  const general = document.createElement("div"); general.className = "pneuma-status-grid";
  const groups = new Map<string, HTMLElement>([["general", general]]);
  const generalSection = document.createElement("details"); generalSection.className = "pneuma-status-group"; generalSection.open = true;
  const generalTitle = document.createElement("summary"); generalTitle.textContent = "General";
  generalSection.append(generalTitle, general); tray.append(generalSection);
  const sections = [["head", "Crit Head"], ["body", "Crit Body"], ["pharma", "Pharmaceuticals"], ["drugs", "Drugs"], ["addiction", "Addiction"]];
  if (separateCustomStatuses && statuses.some(status => status.group === "custom")) sections.unshift(["custom", "Custom User Statuses"]);
  for (const [group, title] of sections) {
    const details = document.createElement("details"); details.className = "pneuma-status-group";
    const summary = document.createElement("summary"); summary.textContent = title!;
    const grid = document.createElement("div"); grid.className = "pneuma-status-grid";
    details.append(summary, grid); tray.append(details); groups.set(group!, grid);
  }
  const nameOf=(icon:HTMLElement)=>statuses.find(status=>status.id===icon.dataset.statusId)?.name??icon.title;
  icons.sort((a,b)=>nameOf(a).localeCompare(nameOf(b),"en",{sensitivity:"base"}));
  for (const icon of icons) {
    const id = icon.dataset.statusId;
    const status = statuses.find(status => status.id === id);
    if (!status || ["Lightly Wounded", "Seriously Wounded", "Mortally Wounded", "Quick Fix"].includes(status.name)) { icon.remove(); continue; }
    (groups.get(status.group) ?? general).append(icon);
  }
}
