import {instantEffects} from "./instant-catalog.js";
/** Use the same configured statuses as the native token HUD. */
export function damageStatusChoices(): { id: string; name: string; img: string }[] {
  return [...Object.entries(instantEffects).map(([id,e])=>({id:"instant:"+id,name:"Instant: "+e.name,img:"icons/svg/aura.svg"})), ...CONFIG.statusEffects.filter(effect => !!effect.id).map(effect => ({
    id: effect.id!, name: game.i18n!.localize(effect.name ?? effect.label ?? effect.id!),
    img: effect.img ?? effect.icon ?? "",
  }))];
}
export function validateDamageStatuses(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 3 || value.some(id => typeof id !== "string"))
    throw new Error("Choose up to three effects.");
  if (!value.length) return [];
  const choices = new Set(damageStatusChoices().map(effect => effect.id));
  if (new Set(value).size !== value.length || value.some(id => !choices.has(id)))
    throw new Error("A selected status effect is duplicated or no longer available.");
  return [...value];
}
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);


export async function chooseDamageStatuses(selected: string[], slot = selected.length): Promise<string[] | null> {
  const current = selected[slot];
  const choices = damageStatusChoices();
  const content = '<form class="pneuma-damage-status-picker">'
    + '<label class="pneuma-damage-status-choice"><input type="radio" name="statusEffect" value=""'
    + (!current ? ' checked' : '') + '>None</label>'
    + choices.map((effect,index) => (index===0?"<h4>Instant Effects</h4>":!effect.id.startsWith("instant:")&&choices[index-1]!.id.startsWith("instant:")?"<h4>Status Effects</h4>":"") + '<label class="pneuma-damage-status-choice"><input type="radio" name="statusEffect" value="'
      + escape(effect.id) + '"' + (current === effect.id ? " checked" : "")
      + (selected.includes(effect.id) && current !== effect.id ? " disabled" : "") + '>'
      + (effect.img ? '<img src="' + escape(effect.img) + '" alt="" width="20" height="20">' : "")
      + '<span>' + escape(effect.name) + '</span></label>').join("") + '</form>';
  return Dialog.prompt({
    title: current ? "Change status effect" : "Add effects", content, label: "Save", rejectClose: false,
    callback: html => {
      const id = html[0]!.querySelector<HTMLInputElement>('input:checked')?.value ?? "";
      const next = [...selected];
      if (slot < next.length) { if (id) next[slot] = id; else next.splice(slot, 1); }
      else if (id) next.push(id);
      return validateDamageStatuses(next);
    },
  });
}
