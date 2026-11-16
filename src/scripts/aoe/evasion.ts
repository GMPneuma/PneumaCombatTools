import {defenderKey, offer} from "../combat-resolution.js";
import {evasionBlocked} from "../injury-rules.js";
import {checkedLuck, type EvasionOffer} from "../evasion-rules.js";
import {MODULE, type AreaSettings} from "./settings.js";

interface Usage {round:string; used:number; lastPayment?:string}
const usage = (combat:Combat|undefined, key:string) => combat
  ? foundry.utils.getProperty(combat, `flags.${MODULE}.${key}`) as Usage|undefined : undefined;
export const areaRound = (combat?:Combat) => combat?.started ? `${combat.id}:${combat.round}` : "outside-combat";

export function areaEvasionOffer(actor:Actor, settings:AreaSettings, combat?:Combat):EvasionOffer {
  const base:EvasionOffer={allowed:true,penalty:0,cost:0,free:0,reason:"No additional cost or penalty"};
  const blocked=evasionBlocked(actor);
  if(blocked)return {...base,allowed:false,reason:blocked};
  if(settings.evade==="none")return {...base,allowed:false,reason:"AoE evasion is disabled"};
  if(settings.evadeOnce) {
    if(!combat?.started)return {...base,allowed:false,reason:"Start combat to track one AoE evasion per round"};
    const previous=usage(combat,"areaEvasionUsage."+defenderKey(actor));
    if(previous && Number(previous.round.split(":")[1])>Number(combat.round))
      return {...base,allowed:false,reason:"Combat round moved backward. Return to the latest round."};
    if(previous?.round===areaRound(combat)&&previous.used>0)
      return {...base,allowed:false,reason:"AoE evasion already used this round"};
  }
  const result=settings.evade==="everyone"?base:offer(actor,true,combat,settings.evade==="homebrew"?"custom":"raw");
  return {...result,penalty:result.penalty+(settings.evadePenalty??0)};
}

/** Payment and counters use receipts so retrying a saved roll cannot spend twice. */
export async function recordAreaEvasion(actor:Actor, settings:AreaSettings, combat:Combat|undefined,
  receipt:string, round:string, cost:number, bonus=0):Promise<void> {
  const paid=foundry.utils.getProperty(actor,`flags.${MODULE}.areaEvasionPayment`)===receipt;
  if(!paid) {
    const luck=Number(foundry.utils.getProperty(actor,"system.stats.luck.value"));
    await actor.update({"system.stats.luck.value":checkedLuck(luck,cost,bonus),
      [`flags.${MODULE}.areaEvasionPayment`]:receipt} as Parameters<Actor["update"]>[0]);
  }
  if(!combat?.started)return;
  const changes:Record<string,unknown>={};
  // Track every AoE attempt, so enabling the limit mid-round does not grant another attempt.
  for(const name of ["areaEvasionUsage",...(settings.evade==="homebrew"?["evasionUsage"]:[])]) {
    const key=name+"."+defenderKey(actor), previous=usage(combat,key);
    if(previous?.lastPayment===receipt)continue;
    changes[`flags.${MODULE}.${key}`]={round,used:(previous?.round===round?previous.used:0)+1,lastPayment:receipt};
  }
  if(Object.keys(changes).length)await combat.update(changes);
}
