import {forceOutEntries, beginForceOut} from "./quickhack/force-out.js";
import {clearInstantCondition} from "./instant-lifetime.js";

let closeStatusMenu: (() => void) | undefined;
export function closeStatusActions(): void { closeStatusMenu?.(); }
/** Body-mounted panel uses the same surface tokens as CTH attack options. */
export function bindStatusActions(container: HTMLElement, actor: Actor, refresh: () => void): void {
  closeStatusMenu?.();
  if (!actor.isOwner) return;
  container.addEventListener("contextmenu", event => {
    const light = (event.target as HTMLElement).closest<HTMLElement>('[data-kind="fire"], [data-kind="intrusion"]');
    if (!light || !container.contains(light) || !actor.isOwner) return;
    event.preventDefault(); event.stopPropagation(); closeStatusMenu?.();
    const actions = light.dataset.kind === "fire"
      ? [{name: "Extinguish", icon: "fa-fire-extinguisher", run: () => extinguishStatus(actor).then(refresh)}]
      : forceOutEntries(actor).map((row, index, rows) => ({
        name: "Eject Netrunner — " + row.name + (rows.filter(other => other.name === row.name).length > 1 ? " (" + (index + 1) + ")" : ""),
        icon: "fa-plug-circle-xmark", run: () => ejectStatus(actor, row.messageId)
      }));
    if (!actions.length) return;
    const panel = document.createElement("div"); panel.className = "pneuma-status-actions pneuma-panel";
    panel.setAttribute("role", "menu"); panel.setAttribute("aria-label", "Status actions");
    const controller = new AbortController();
    const close = () => { controller.abort(); panel.remove(); if (closeStatusMenu === close) closeStatusMenu = undefined; };
    closeStatusMenu = close;
    for (const action of actions) {
      const button = document.createElement("button"); button.type = "button"; button.setAttribute("role", "menuitem");
      const icon = document.createElement("i"); icon.className = "fas " + action.icon; icon.setAttribute("aria-hidden", "true");
      const label = document.createElement("span"); label.textContent = action.name;
      button.append(icon, label); panel.append(button);
      button.addEventListener("click", () => { close(); void action.run().catch(reportStatusError); });
    }
    document.body.append(panel);
    const anchor = light.getBoundingClientRect(), bounds = panel.getBoundingClientRect();
    panel.style.left = Math.max(8, Math.min(anchor.left, window.innerWidth - bounds.width - 8)) + "px";
    panel.style.top = Math.max(8, Math.min(anchor.bottom + 4, window.innerHeight - bounds.height - 8)) + "px";
    panel.querySelector<HTMLButtonElement>("button")?.focus({preventScroll:true});
    document.addEventListener("pointerdown", e => { if (!panel.contains(e.target as Node)) close(); }, {capture:true, signal:controller.signal});
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); const buttons = Array.from(panel.querySelectorAll("button"));
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    }, {signal:controller.signal});
    window.addEventListener("resize", close, {signal:controller.signal});
    document.addEventListener("scroll", e => { if (!panel.contains(e.target as Node)) close(); }, {capture:true, signal:controller.signal});
  });
}
function reportStatusError(error: unknown): void { ui.notifications!.error(error instanceof Error ? error.message : String(error)); }
export async function extinguishStatus(actor: Actor): Promise<void> {
  if (actor.isOwner) await clearInstantCondition(actor, "fire");
}
export async function ejectStatus(actor: Actor, messageId: string): Promise<void> {
  if (!actor.isOwner || !forceOutEntries(actor).some(row => row.messageId === messageId)) return;
  await beginForceOut({id:messageId});
}
