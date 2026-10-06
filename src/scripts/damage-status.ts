import { escapeHTML as escape } from "./shared.js";
import {instantEffects} from "./instant-catalog.js";
import {masterStatuses} from "./status-catalog.js";
const effectGroups = {instant:"Attack Effects",body:"Body Crits",head:"Head Crits",drugs:"Drugs",pharma:"Pharma",misc:"Misc"} as const;
type EffectGroup = keyof typeof effectGroups;
/** Use configured token statuses, grouped by the module catalog; custom effects go in Misc. */
export function canonicalDamageStatus(id: string): string {
  if (id === 'instant:incendiary') return masterStatuses.find(s => s.name === 'On Fire (Mild)')!.id;
  if (id === 'instant:emp' || id === 'instant:microwaver') return masterStatuses.find(s => s.name === 'EMP')!.id;
  return id;
}
export function inherentDamageStatuses(ammo?: string): string[] {
  return ammo && Object.hasOwn(instantEffects, ammo) && ammo !== 'smoke'
    ? [canonicalDamageStatus('instant:' + ammo)] : [];
}
export function damageStatusChoices(): { id: string; name: string; img: string; group:EffectGroup }[] {
  const statuses = [...CONFIG.statusEffects];
  for (const name of ['EMP', 'On Fire (Mild)', 'On Fire (Strong)', 'On Fire (Deadly)']) {
    const definition = masterStatuses.find(s=>s.name===name)!;
    if (!statuses.some(s=>s.id===definition.id)) statuses.push(definition);
  }
  return [...Object.entries(instantEffects).filter(([id])=>!["incendiary","emp","microwaver"].includes(id)).map(([id,e])=>({id:"instant:"+id,name:e.name,img:"icons/svg/aura.svg",group:"instant" as const})),
    ...statuses.filter(effect=>!!effect.id).map(effect=>{
      const name=game.i18n!.localize(effect.name??effect.label??effect.id!);
      const definition=masterStatuses.find(status=>status.id===effect.id || status.name===name);
      const group=definition?.group;
      return {id:effect.id!,name,img:effect.img??effect.icon??"",group:["EMP","On Fire (Mild)","On Fire (Strong)","On Fire (Deadly)"].includes(name)?"instant" as const:group&&["body","head","drugs","pharma"].includes(group)?group as EffectGroup:"misc" as const,
        excluded:/addict|\bwounded\b/i.test(name)||/addict|\bwounded\b/i.test(definition?.name??"")};
    }).filter(effect=>!effect.excluded)];
}
export function validateDamageStatuses(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 3 || value.some(id => typeof id !== "string"))
    throw new Error("Choose up to three effects.");
  if (!value.length) return [];
  const choices = new Set(damageStatusChoices().map(effect => effect.id));
  const canonical = value.map(canonicalDamageStatus);
  if (new Set(canonical).size !== canonical.length || canonical.some(id => !choices.has(id)))
    throw new Error("A selected status effect is duplicated or no longer available.");
  return value.map(id=>id === "instant:microwaver" ? id : canonicalDamageStatus(id));
}



export async function chooseDamageStatuses(selected: string[], slot = selected.length): Promise<string[] | null> {
  const original = selected[slot];
  const current = original ? canonicalDamageStatus(original) : undefined;
  const choices = damageStatusChoices();
  const content = '<form class="pneuma-damage-status-picker">'
    + '<label class="pneuma-damage-status-choice"><input type="radio" name="statusEffect" value=""'
    + (!current ? ' checked' : '') + '>None</label>'
    + Object.entries(effectGroups).map(([group,title])=>{
      const rows=choices.filter(effect=>effect.group===group);if(!rows.length)return "";
      const open=current?rows.some(effect=>effect.id===current):group==="instant";
      return '<details class="pneuma-effect-category"'+(open?' open':'')+'><summary>'+title+' <span>'+rows.length+'</span></summary>'
        + rows.map(effect=>'<label class="pneuma-damage-status-choice"><input type="radio" name="statusEffect" value="'+escape(effect.id)+'"'
          +(current===effect.id?' checked':'')+(selected.some(id=>canonicalDamageStatus(id)===effect.id)&&current!==effect.id?' disabled':'')+'>'
          +(effect.img?'<img src="'+escape(effect.img)+'" alt="" width="20" height="20">':'')+'<span>'+escape(effect.name)+'</span></label>').join("")+'</details>';
    }).join("") + '</form>';
  return Dialog.prompt({
    title: current ? "Change status effect" : "Add effects", content, label: "Save", rejectClose: false,
    callback: html => {
      const id = html[0]!.querySelector<HTMLInputElement>('input:checked')?.value ?? "";
      const next = [...selected];
      if (slot < next.length) { if (id) next[slot] = original && canonicalDamageStatus(original)===id ? original : id; else next.splice(slot, 1); }
      else if (id) next.push(id);
      return validateDamageStatuses(next);
    },
  });
}

/** Read-only selection after any target starts resolution; no empty add slots. */
export function lockedDamageStatuses(selected:string[]):string {
  const choices=damageStatusChoices();
  return '<span class="pneuma-damage-status-locked" title="Effect selection locked: resolution has started" aria-label="Effect selection locked">'+selected.map(id=>{
    const choice=choices.find(c=>c.id===canonicalDamageStatus(id));
    return '<img src="'+escape(choice?.img||'icons/svg/aura.svg')+'" alt="'+escape(choice?.name??id)+'" title="'+escape((choice?.name??id)+' — Selection locked')+'">';
  }).join('')+'</span>';
}

/** Shared selector for normal, manual and area damage. Re-render replaces slots. */
export function renderDamageStatusPicker(root:HTMLElement, selected:string[], locked:boolean, disabled:boolean,
  save:(effects:string[])=>Promise<unknown>):void {
  root.replaceChildren();
  root.setAttribute('role','group');
  root.setAttribute('aria-label','Damage status effects');
  if(locked){root.innerHTML=lockedDamageStatuses(selected);return;}
  const choices=damageStatusChoices();
  for(let slot=0;slot<3;slot++) {
    const choice=choices.find(effect=>effect.id===canonicalDamageStatus(selected[slot]??''));
    const button=document.createElement('button');button.type='button';button.className='pneuma-damage-status-slot';
    button.dataset.pneumaStatusSlot=String(slot);
    button.title=selected[slot]?'Change or remove '+(choice?.name??selected[slot]):'Add effects';
    button.setAttribute('aria-label',button.title);button.disabled=disabled;
    if(selected[slot]) {
      button.dataset.statusId=selected[slot];
      const image=document.createElement('img');image.src=choice?.img||'icons/svg/aura.svg';image.alt=choice?.name??selected[slot]!;
      button.append(image);
    } else button.textContent='+';
    button.addEventListener('click',async event=>{
      event.preventDefault();event.stopPropagation();if(button.disabled)return;
      const buttons=Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
      buttons.forEach(node=>{node.disabled=true;});
      try {const effects=await chooseDamageStatuses(selected,slot);if(effects!==null)await save(effects);}
      catch(error){ui.notifications!.error(error instanceof Error?error.message:String(error));}
      finally {buttons.forEach(node=>{node.disabled=disabled;});}
    });
    root.append(button);
  }
}
