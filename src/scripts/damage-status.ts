import { escapeHTML as escape } from "./shared.js";
import {instantEffects} from "./instant-catalog.js";
import {masterStatuses} from "./status-catalog.js";
const effectGroups = {instant:"Instant Effects",body:"Body Crits",head:"Head Crits",drugs:"Drugs",pharma:"Pharma",misc:"Misc"} as const;
type EffectGroup = keyof typeof effectGroups;
/** Use configured token statuses, grouped by the module catalog; custom effects go in Misc. */
export function damageStatusChoices(): { id: string; name: string; img: string; group:EffectGroup }[] {
  return [...Object.entries(instantEffects).map(([id,e])=>({id:"instant:"+id,name:e.name,img:"icons/svg/aura.svg",group:"instant" as const})),
    ...CONFIG.statusEffects.filter(effect=>!!effect.id).map(effect=>{
      const name=game.i18n!.localize(effect.name??effect.label??effect.id!);
      const definition=masterStatuses.find(status=>status.id===effect.id || status.name===name);
      const group=definition?.group;
      return {id:effect.id!,name,img:effect.img??effect.icon??"",group:group&&["body","head","drugs","pharma"].includes(group)?group as EffectGroup:"misc" as const,
        excluded:/addict|\bwounded\b/i.test(name)||/addict|\bwounded\b/i.test(definition?.name??"")};
    }).filter(effect=>!effect.excluded)];
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



export async function chooseDamageStatuses(selected: string[], slot = selected.length): Promise<string[] | null> {
  const current = selected[slot];
  const choices = damageStatusChoices();
  const content = '<form class="pneuma-damage-status-picker">'
    + '<label class="pneuma-damage-status-choice"><input type="radio" name="statusEffect" value=""'
    + (!current ? ' checked' : '') + '>None</label>'
    + Object.entries(effectGroups).map(([group,title])=>{
      const rows=choices.filter(effect=>effect.group===group);if(!rows.length)return "";
      const open=current?rows.some(effect=>effect.id===current):group==="instant";
      return '<details class="pneuma-effect-category"'+(open?' open':'')+'><summary>'+title+' <span>'+rows.length+'</span></summary>'
        + rows.map(effect=>'<label class="pneuma-damage-status-choice"><input type="radio" name="statusEffect" value="'+escape(effect.id)+'"'
          +(current===effect.id?' checked':'')+(selected.includes(effect.id)&&current!==effect.id?' disabled':'')+'>'
          +(effect.img?'<img src="'+escape(effect.img)+'" alt="" width="20" height="20">':'')+'<span>'+escape(effect.name)+'</span></label>').join("")+'</details>';
    }).join("") + '</form>';
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
