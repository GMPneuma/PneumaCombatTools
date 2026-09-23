declare global { interface SettingConfig { "pneuma-combattools.showArmorControls": boolean } }
/** Native CPR rounds remaining SP with Math.round; at 50%, odd integer SP rounds up. */
export function armorIgnorePercent(original:number,half?:boolean,interact?:boolean):number {
  if(interact===false)return 100;
  if(half===undefined||original>=100)return original;
  return half?Math.max(50,original):original===50?0:original;
}
export function halfArmorControl(original:number,interact=true):string {
  return '<div class="pneuma-armor-controls"><button type="button" class="pneuma-interact-armor" aria-pressed="'+interact+'" title="Apply armor SP and armor ablation">Interact With Armor</button>'
    +'<button type="button" class="pneuma-half-armor" aria-pressed="'+(original===50)+'" data-original-ignore="'+original+'"'+(!interact||original>=100?' disabled':'')+' title="Use half armor SP, rounded up, when applying damage">Half Armor SP</button></div>';
}
function selected(event:Event,selector:string):boolean|undefined {
  const element=event.currentTarget as Element|null;
  const card=element?.closest(".pneuma-manual-card, .pneuma-aoe-card, .message");
  const button=card?.querySelector(selector);
  return button?button.getAttribute("aria-pressed")==="true":undefined;
}
export const halfArmorSelected=(event:Event)=>selected(event,".pneuma-half-armor");
export const interactArmorSelected=(event:Event)=>selected(event,".pneuma-interact-armor");
export function bindHalfArmor(root:HTMLElement,show=true):void {
  if(!show){root.querySelectorAll(".pneuma-armor-controls, .pneuma-half-armor").forEach(node=>node.remove());return;}
  for(const link of Array.from(root.querySelectorAll<HTMLElement>('[data-action="applyDamage"]'))) {
    const card=link.closest(".rollcard")??link.parentElement!;
    if(!card.querySelector(".pneuma-half-armor"))card.insertAdjacentHTML("beforeend",halfArmorControl(Number(link.dataset.ignoreArmorPercent)||0));
  }
  // Upgrade older saved cards that only contained Half Armor SP.
  for(const half of Array.from(root.querySelectorAll<HTMLElement>(".pneuma-half-armor"))) {
    if(!half.closest(".pneuma-armor-controls")){half.insertAdjacentHTML("beforebegin",halfArmorControl(Number(half.dataset.originalIgnore)||0));half.remove();}
  }
  for(const controls of Array.from(root.querySelectorAll<HTMLElement>(".pneuma-armor-controls"))) {
    if(controls.dataset.bound)continue;controls.dataset.bound="true";
    const half=controls.querySelector<HTMLButtonElement>(".pneuma-half-armor")!,interact=controls.querySelector<HTMLButtonElement>(".pneuma-interact-armor")!;
    const links=Array.from((controls.closest(".rollcard")??controls.parentElement!).querySelectorAll<HTMLElement>('[data-action="applyDamage"]'));
    const original=links.map(link=>({link,ignore:Number(link.dataset.ignoreArmorPercent)||0,ablation:link.dataset.ablation??"0"}));
    const update=()=>{
      const enabled=interact.getAttribute("aria-pressed")==="true";
      half.disabled=!enabled||Number(half.dataset.originalIgnore)>=100;
      for(const {link,ignore,ablation} of original){link.dataset.ignoreArmorPercent=String(armorIgnorePercent(ignore,half.getAttribute("aria-pressed")==="true",enabled));link.dataset.ablation=enabled?ablation:"0";}
    };
    for(const button of [interact,half])button.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();if(button.disabled)return;
      button.setAttribute("aria-pressed",String(button.getAttribute("aria-pressed")!=="true"));update();
    });update();
  }
}
export function registerHalfArmor():void {
  game.settings!.register("pneuma-combattools","showArmorControls",{name:"Show armor controls on normal damage cards",hint:"Show Interact With Armor and Half Armor SP on normal damage cards for everyone. Off by default. Damage rolls from the chat-roll menu always show them.",scope:"world",config:true,type:Boolean,default:false,onChange:()=>ui.chat?.render(false)});
  Hooks.on("renderChatMessage",(message:ChatMessage,html:JQuery)=>{
    const root=html[0];if(!root)return;
    const manual=foundry.utils.getProperty(message,"flags.pneuma-combattools.manualRoll.kind")==="damage";
    const show=manual||game.settings!.get("pneuma-combattools","showArmorControls");
    const values=["exchange.damage","aoe.exchange.damage","manualRoll.damage"].map(path=>foundry.utils.getProperty(message,"flags.pneuma-combattools."+path+".result.values") as {ignorePercent:number;interactArmor?:boolean}|undefined).find(Boolean);
    if(show&&values)for(const result of Array.from(root.querySelectorAll<HTMLElement>(".pneuma-damage-result"))) {
      if(!result.querySelector(".pneuma-half-armor"))result.insertAdjacentHTML("beforeend",halfArmorControl(values.ignorePercent,values.interactArmor!==false));
    }
    bindHalfArmor(root,show);
  });
}
