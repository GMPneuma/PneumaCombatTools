import type {Exchange} from "./combat-resolution.js";
import type {DamageRequest} from "./damage-flow.js";
import {weaponArmor} from "./close-armor.js";

const expanded=new WeakMap<ChatMessage,string>();
type Send=(action:DamageRequest["action"],extra:Partial<DamageRequest>)=>Promise<unknown>;

export function renderDamageEditor(root:HTMLElement,message:ChatMessage,data:Exchange,effects:HTMLElement,editable:boolean,send:Send):void {
  const damage=data.damage, result=damage?.result;
  const body=root.querySelector<HTMLElement>(".pneuma-damage-result .pneuma-resolution-damage-roll-body");
  if(!damage || !result || !body || body.querySelector(".pneuma-damage-editor"))return;
  body.closest(".pneuma-damage-result")?.querySelector(":scope > .pneuma-armor-controls")?.remove();
  const total=result.values.total+(result.flatBonus??0);
  const number=body.querySelector<HTMLElement>(".d6-number-div");
  const value=number?.querySelector<HTMLElement>('[data-action="toggleVisibility"],span');
  if(value)value.textContent=String(total);
  const anchor=number??document.createElement("div");
  if(!number){anchor.textContent=String(total);body.append(anchor);}
  anchor.classList.add("pneuma-damage-number");
  if(result.flatBonus)anchor.title=result.values.total+" rolled + "+result.flatBonus+" bonus";
  body.querySelectorAll(".pneuma-bonus-total,.pneuma-armor-controls,.pneuma-damage-label").forEach(node=>node.remove());
  body.classList.add("pneuma-compact-damage");

  const toggle=document.createElement("button");
  toggle.type="button";toggle.className="pneuma-modify-damage";toggle.title="Modify damage";
  toggle.setAttribute("aria-label",toggle.title);
  toggle.innerHTML='<i class="fas fa-pen" aria-hidden="true"></i>';
  anchor.append(toggle);
  const editor=document.createElement("div");editor.className="pneuma-damage-editor";
  const reveal=(open:boolean)=>{editor.hidden=!open;toggle.setAttribute("aria-expanded",String(open));};
  reveal(expanded.get(message)===damage.nonce);
  toggle.addEventListener("click",event=>{
    event.preventDefault();event.stopPropagation();
    const open=editor.hidden;
    if(open)expanded.set(message,damage.nonce);else expanded.delete(message);
    reveal(open);
  });
  function row(){
    const line=document.createElement("div");line.className="pneuma-damage-editor-row";editor.append(line);return line;
  }
  const armor=result.armorOptions;
  const interact=armor?.interact??(result.values.interactArmor!==false);
  const ablate=armor?.ablate??(weaponArmor(data.weaponType)?.ablate!==false && result.values.ablation>0);
  function armorButton(line:HTMLElement,key:"interact"|"ablate"|"always"|"half",label:string,active:boolean,available:boolean){
    const button=document.createElement("button");button.type="button";button.textContent=label;
    const on=active && available;
    button.className="pneuma-armor-toggle";
    button.setAttribute("aria-pressed",String(on));
    const indicator=document.createElement("span");
    indicator.className="pneuma-armor-toggle-state";
    indicator.setAttribute("aria-hidden","true");
    indicator.textContent=on?"✓":"";
    button.append(indicator);
    button.disabled=!editable||!available;
    button.addEventListener("click",async()=>{
      button.disabled=true;
      try{await send("damageArmor",{nonce:damage!.nonce,armorOption:key,enabled:!active});}
      catch(error){ui.notifications!.error((error as Error).message);}
      finally{button.disabled=!editable||!available;}
    });
    line.append(button);
  }
  const first=row();
  armorButton(first,"interact","Interact w/armor",interact,true);
  armorButton(first,"ablate","Ablate Armor",ablate,interact && result.values.ablation>0);
  const second=row();
  armorButton(second,"half","Halve Armor",armor?.half??(result.values.ignorePercent===50),interact && result.values.ignorePercent<100);
  armorButton(second,"always","Always Ablate",armor?.always??!!game.settings!.get("pneuma-combattools","ablateBlockedHits"),interact && ablate);
  const label=document.createElement("label");label.textContent="Bonus Damage ";
  const bonus=document.createElement("input");bonus.type="number";bonus.step="1";bonus.min="0";
  bonus.value=String(result.flatBonus??0);bonus.disabled=!editable;
  bonus.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();bonus.blur();}});
  bonus.addEventListener("change",async()=>{
    if(!bonus.reportValidity())return;
    bonus.disabled=true;
    try{await send("damageBonus",{nonce:damage.nonce,flatBonus:Number(bonus.value)});}
    catch(error){bonus.value=String(result.flatBonus??0);ui.notifications!.error((error as Error).message);}
    finally{bonus.disabled=!editable;}
  });
  label.append(bonus);row().append(label);
  const last=row();
  if(effects.childElementCount)last.append("Add Effects",effects);
  else last.hidden=true;
  body.append(editor);
}
