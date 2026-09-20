import { isQuickhackLauncher } from "./availability.js";
import { itemView } from "./content.js";
import { enabled } from "./settings.js";

/** Reuse CPR's weapon-row controls, as the standalone QuickHack module did. */
export function registerQuickhackSheet(execute: (action: string, actorUuid: string) => Promise<void>) {
  Hooks.on("renderActorSheet", (app: ActorSheet, html: JQuery) => {
    const root = html[0];
    if (!root) return;
    for (const row of Array.from(root.querySelectorAll<HTMLElement>(".weapon-grid[data-item-id]"))) {
      const item = app.actor.items.get(row.dataset.itemId!);
      if (!item || !isQuickhackLauncher(itemView(item))) continue;
      for (const [roll, action, title, icon] of [
        ["attack", "jack-in", "Jack In", "fa-network-wired"],
        ["damage", "quickhack", "QuickHack Target", "fa-microchip"],
      ]) {
        const control = row.querySelector<HTMLElement>(`[data-roll-type="${roll}"]`);
        if (!control) continue;
        control.dataset.combatToolsQuickhack = action;
        control.title = title!;
        control.dataset.tooltip = title;
        control.hidden = !enabled();
        const glyph = control.querySelector("i");
        if (glyph) glyph.className = `fas ${icon} fa-fw red-fg`;
      }
      row.querySelectorAll<HTMLElement>(".weapon-mode").forEach(control => { control.hidden = true; });
    }
    // Capture before CPR's native attack/damage listeners, including after a setting change.
    root.addEventListener("click", event => {
      const control = (event.target as Element).closest<HTMLElement>("[data-combat-tools-quickhack]");
      if (!control) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (enabled()) void execute(control.dataset.combatToolsQuickhack!, app.actor.uuid)
        .catch(error => { console.error(error); ui.notifications!.error("QuickHack failed. See the console for details."); });
    }, true);
  });
}
