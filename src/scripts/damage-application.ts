import {hasInjury} from "./injury-rules.js";
import {registerNativeWrapper} from "./native-wrappers.js";
interface CoverUpDamage {ablation:number;ignorePercent:number;ignoreBelow:number}

interface NativeDamageData { actor: Actor; hpReduction: number; location?: string; [key: string]: unknown }
interface NativeDamageChat { RenderDamageApplicationCard(data: NativeDamageData): unknown }

const damageCaptures = new WeakMap<Actor, NativeDamageData[]>();
const installedChats = new WeakSet<object>();
function installDamageCapture(chat: NativeDamageChat) {
  if (installedChats.has(chat)) return;
  registerNativeWrapper(chat,"RenderDamageApplicationCard",function(wrapped,data: NativeDamageData) {
    const captured = damageCaptures.get(data.actor);
    if (captured) {captured.push(data);return Promise.resolve();}
    return wrapped(data);
  },"MIXED");
  installedChats.add(chat);
}

/** Repack the native result and breakdown; no damage formula is calculated here. */
export function compactDamageApplication(html: string, name: string, location: string, id: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const number = doc.querySelector<HTMLElement>('[data-action="toggleVisibility"][data-visible-element="d6-data-details"]');
  const details = doc.querySelector<HTMLElement>(".d6-data-details");
  if (!number || !details) throw new Error("Native damage application card is missing its total or breakdown.");
  const scope = "pneuma-applied-details-" + id.replace(/[^a-zA-Z0-9_-]/g, "");
  details.classList.replace("d6-data-details", scope);
  details.classList.add("pneuma-applied-details", "hide");
  number.dataset.visibleElement = scope; number.classList.add("pneuma-applied-number");
  const row = doc.createElement("div"); row.className = "pneuma-damage-applied-row";
  const recipient = doc.createElement("span"); recipient.className = "pneuma-applied-name"; recipient.textContent = name;
  const where = doc.createElement("span"); where.className = "pneuma-applied-location";
  where.textContent = game.i18n!.localize("CPR.global.location." + location);
  row.append(recipient, number, where);
  // Keep the native undo glyph inside the expandable native breakdown.
  const undo = doc.querySelector('[data-action="reverseDamage"]');
  if (undo) details.append(undo);
  const card = doc.createElement("div"); card.className = "rollcard pneuma-damage-applied";
  card.append(row, details);
  return card.outerHTML;
}

/** Capture only this call's native summary, using a distinct actor view as its identity. */
export async function captureDamageApplication(actor: Actor, name: string, location: string, id: string,
  apply: (actorView: Actor) => Promise<void>, coverUp?:CoverUpDamage, inspect?: (data:NativeDamageData)=>void, aimedHead=false): Promise<string[]> {
  const path = "/systems/cyberpunk-red-core/modules/chat/cpr-chat.js";
  const chat = (await import(path)).default as NativeDamageChat;
  return captureWithChat(chat, actor, name, location, id, apply,coverUp,inspect,aimedHead);
}
export async function captureWithChat(chat: NativeDamageChat, actor: Actor, name: string, location: string, id: string,
  apply: (actorView: Actor) => Promise<void>, coverUp?:CoverUpDamage, inspect?: (data:NativeDamageData)=>void, aimedHead=false): Promise<string[]> {
  installDamageCapture(chat);
  // Native getters and mutations still execute on the real document. Only the
  // actor reference passed to its summary renderer is distinct for this call.
  const view = new Proxy(actor, { get(target, key) {
    const value = Reflect.get(target, key, target) as unknown;
    return typeof value === "function" ? value.bind(target) : value;
  } });
  const captured: NativeDamageData[] = [];
  damageCaptures.set(view,captured);
  try {
    await apply(view);
    if(coverUp){
      const native=actor as Actor & {getEquippedArmors(location:string):Item[];_ablateArmor(location:string,amount:number):Promise<void>};
      const amount=native.getEquippedArmors(location).length?coverUp.ablation:0;
      if(amount)await native._ablateArmor(location,amount);
      for(const data of captured){data.ablation=amount;data.ignoreArmorPercent=coverUp.ignorePercent;data.ignoreBelowSP=coverUp.ignoreBelow;}
    }
    if(aimedHead&&location==="head"&&hasInjury(actor,"Cracked Skull")){
      for(const data of captured){
        const raw=Number(data.rawDamageDealt),total=Number(data.totalDamageDealt),reduction=Number(data.totalDamageReduction);
        if(!(raw>0)||!Number.isFinite(total)||!Number.isFinite(reduction))continue;
        const current=Number(foundry.utils.getProperty(actor,"system.derivedStats.hp.value"));
        const before=current+data.hpReduction;
        const corrected=crackedSkullDamage(raw,total,reduction,before,data.damageLethal!==false);
        await actor.update({"system.derivedStats.hp.value":before-corrected} as never);
        data.pneumaCrackedSkull=true;data.rawDamageDealt=raw*1.5;data.totalDamageDealt=total+raw/2;data.hpReduction=corrected;
      }
    }
    for (const data of captured) inspect?.(data);
    if (!captured.length) throw new Error("Native damage applied without a captured result. Check the recipient before continuing.");
    return await Promise.all(captured.map(async (data, index) => compactDamageApplication(
      await renderTemplate("systems/cyberpunk-red-core/templates/chat/cpr-damage-application-card.hbs", data),
      name, data.location ?? location, id + "-" + index)+(data.pneumaCrackedSkull?'<p class="pneuma-injury-damage">Cracked Skull: penetrating headshot damage ×3; bonus damage unchanged.</p>':"")+(coverUp?'<p class="pneuma-cover-up-damage">Cover Up: armor SP ×2; armor ablation ×2, including blocked damage.</p>':"")));
  } finally {
    damageCaptures.delete(view);
  }
}

/** Native raw head damage is already x2; add only one extra penetrating-damage share. */
export function crackedSkullDamage(raw:number,total:number,reduction:number,hp:number,lethal:boolean):number {
 const taken=Math.max(0,total+raw/2-reduction);
 return !lethal&&taken>=hp?Math.max(0,hp-1):taken;
}
