import {empDisabled} from "./emp-rules.js";
const MODULE="pneuma-combattools";
declare global {interface SettingConfig {"pneuma-combattools.pneumaHomebrew":boolean}}
/** GM ownership covers every token: retain target actions when acting as a different token. */
export function isSelfCTH(token:Token|undefined,attacker:Token|undefined):boolean {
  return !!token?.isOwner&&(!game.user?.isGM||!attacker||attacker===token);
}
export function hasSpeedware(actor:Actor|undefined):boolean {
  return !!actor?.items.some(item=>{
    if(String(item.type)!=="cyberware"||!foundry.utils.getProperty(item,"system.isInstalledInActor")||empDisabled(item)||foundry.utils.getProperty(item,"flags.pneuma-combattools.itemMarkers.disabled"))return false;
    const source=String(foundry.utils.getProperty(item,"_stats.compendiumSource")??foundry.utils.getProperty(item,"flags.core.sourceId")??"");
    return ["UX79WfUt7Yungbx7","nSdoCKRscSOeaZUH"].some(id=>source.endsWith("."+id))
      ||["sandevistan","kerenzikov"].some(name=>(item.name??"").toLowerCase().includes(name));
  });
}
function participant(token:Token){
  const combat=game.combat;
  if(!combat?.started)return;
  const combatant=combat.combatants.find(entry=>entry.token?.uuid===token.document.uuid);
  return combatant&&combatant.initiative!==null&&combatant.initiative!==undefined?{combat,combatant}:undefined;
}
export function selfInitiativeControl(token:Token){
  const enabled=game.settings!.get(MODULE,"pneumaHomebrew")&&token.isOwner&&hasSpeedware(token.actor??undefined);
  const available=enabled&&!!participant(token);
  return {show:enabled,disabled:!available,title:available?"Re-roll Initiative — uses your Action (Pneuma HomeBrew)":"Re-roll Initiative — requires an existing initiative in started combat; uses your Action"};
}
const pending=new Set<string>();
export async function rerollSelfInitiative(token:Token){
  if(!selfInitiativeControl(token).show)throw Error("Initiative reroll requires Pneuma HomeBrew, token ownership and installed functional speedware.");
  const entry=participant(token);if(!entry)throw Error("Start combat and roll initiative before using the speedware reroll.");
  const key=entry.combat.uuid+":"+entry.combatant.id;
  if(pending.has(key))return;
  pending.add(key);
  try{
    // Native CPR handles REF, initiative effects, critical dice, chat, and preserving the acting combatant.
    await entry.combat.rollInitiative([entry.combatant.id!],{updateTurn:true});
  }finally{pending.delete(key);}
}
export function registerSelfCTH(){
  const refresh=()=>{const hud=canvas.tokens?.hud;if(hud?.object&&hud.rendered)hud.render(true);};
  game.settings!.register(MODULE,"pneumaHomebrew",{name:"Speedware allows Rerolling Initiative",hint:"Installed functional speedware allows an Action to re-roll initiative from the self CTH. Other homebrew settings remain independent.",scope:"world",config:true,type:Boolean,default:false,onChange:refresh});
  for(const hook of ["createItem","updateItem","deleteItem"])Hooks.on(hook,(item:Item)=>{if(item.parent?.uuid===canvas.tokens?.hud?.object?.actor?.uuid)refresh();});
  for(const hook of ["updateCombat","deleteCombat","createCombatant","updateCombatant","deleteCombatant"])Hooks.on(hook,refresh);
}
