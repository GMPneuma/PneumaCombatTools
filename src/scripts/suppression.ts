import { primaryGM as electedGM } from "./shared.js";
const M="pneuma-combattools";
interface Expiry {combat:string;combatant:string;round:number}
/** The current turn does not count as the next turn if suppression lands mid-turn. */
export function suppressionExpiry(combat:Combat|undefined,token:string):Expiry|undefined {
  if(!combat?.started)return;
  const index=combat.turns.findIndex(c=>c.token?.uuid===token);
  if(index<0)return;
  return {combat:combat.id!,combatant:combat.turns[index]!.id!,round:Number(combat.round)+(index>Number(combat.turn)?0:1)};
}
export async function expireSuppression(){
  const gm=electedGM();
  if(!gm||gm.id!==game.user?.id)return;
  const actors=new Map<string,Actor>();
  for(const actor of game.actors??[])actors.set(actor.uuid,actor);
  for(const scene of game.scenes??[])for(const token of scene.tokens)if(token.actor)actors.set(token.actor.uuid,token.actor);
  for(const actor of actors.values()){
    const ids=Array.from(actor.effects).filter(effect=>{
      const expiry=foundry.utils.getProperty(effect,`flags.${M}.suppressionExpiry`) as Expiry|undefined;
      if(!expiry)return false;
      const combat=game.combats?.get(expiry.combat);
      if(!combat?.started)return true;
      const index=combat.turns.findIndex(c=>c.id===expiry.combatant);
      return index<0||Number(combat.round)>expiry.round||Number(combat.round)===expiry.round&&Number(combat.turn)>index;
    }).map(e=>e.id!);
    if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
  }
}
export function registerSuppression(){
  let queue:Promise<unknown>=Promise.resolve();
  const refresh=()=>{queue=queue.catch(()=>{}).then(expireSuppression);void queue.catch(error=>console.error(M,"Suppression expiry failed",error));};
  Hooks.once("ready",refresh);
  for(const event of ["updateCombat","deleteCombat","deleteCombatant"])Hooks.on(event,refresh);
}
