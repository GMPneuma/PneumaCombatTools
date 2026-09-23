import {effectDuration} from "../effect-duration.js";
import {temporaryInjury,sleepTarget} from "../instant-lifetime.js";
import {applyCombatStatus} from "../status-sync.js";
import {masterStatuses} from "../status-catalog.js";
import {nativeAPI} from "../native-combat.js";
const M="pneuma-combattools";
const status=(name:string)=>{const entry=masterStatuses.find(s=>s.name===name);if(!entry)throw Error("Missing native status: "+name);return entry.id;};
export async function applyQuickhackCondition(actor:Actor,id:string,rollMode="roll"):Promise<number|undefined> {
  if(id==="overheat") {await applyCombatStatus(actor,status("On Fire (Strong)"));return;}
  if(id==="sonic-shock") {
    await temporaryInjury(actor,"Damaged Ear");
    const deaf=status("Deafened");
    const existing=actor.effects.find(e=>!e.disabled&&e.statuses.has(deaf));
    if(existing){if(foundry.utils.getProperty(existing,"flags."+M+".quickhackEffect")==="sonic-shock")await existing.update({duration:effectDuration(60)} as never);}
    else await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Deafened",img:"icons/svg/deaf.svg",statuses:[deaf],duration:effectDuration(60),flags:{[M]:{quickhackEffect:id}}}] as never);
    return;
  }
  if(id==="system-reset") {await sleepTarget(actor);return;}
  if(id!=="slow"&&id!=="impair-movement")return;
  let amount=1;
  if(id==="slow") {const roll=await new Roll("1d6").evaluate();amount=roll.total!;const {Dice}=await nativeAPI();await Dice.handle3dDice(roll,rollMode);}
  const old=actor.effects.find(e=>foundry.utils.getProperty(e,"flags."+M+".quickhackEffect")===id);
  // Refresh this hack's duration; keep the stronger penalty instead of stacking identical hacks.
  const penalty=Math.max(amount,old&&!old.disabled?Number(foundry.utils.getProperty(old,"flags."+M+".quickhackAmount"))||0:0);
  const data={name:id==="slow"?"Slow":"Impair Movement",img:"icons/svg/downgrade.svg",disabled:false,duration:effectDuration(60),
    changes:[{key:"system.stats.move.value",mode:CONST.ACTIVE_EFFECT_MODES.ADD,value:String(-penalty),priority:20}],
    flags:{[M]:{quickhackEffect:id,quickhackAmount:penalty}}};
  if(old)await old.update(data as never);else await actor.createEmbeddedDocuments("ActiveEffect",[data] as never);
  return penalty;
}
