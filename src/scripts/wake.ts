import {masterStatuses} from "./status-catalog.js";
import {primaryGM} from "./shared.js";
import {requireCombatSocket} from "./socket-health.js";
const channel="module.pneuma-combattools";
const unconscious=masterStatuses.find(s=>s.name==="Unconscious")!.id;
export const isUnconscious=(actor:Actor|undefined|null)=>!!actor&&Array.from(actor.allApplicableEffects?.()??actor.effects).some(e=>!e.disabled&&!e.isSuppressed&&e.statuses.has(unconscious));
export function canWake(source:Token|undefined,target:Token|undefined):boolean {
  return !!source?.actor&&!!target?.actor&&source.actor.uuid!==target.actor.uuid&&source.actor.isOwner&&!isUnconscious(source.actor)&&isUnconscious(target.actor);
}
interface WakeRequest {wake:"request"|"reply";id:string;user:string;source?:string;target?:string;error?:string}
const pending=new Map<string,{resolve:()=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
export async function resolveWake(sourceId:string,targetId:string,user:User):Promise<void> {
  const source=await fromUuid(sourceId) as TokenDocument|null,target=await fromUuid(targetId) as TokenDocument|null;
  if(!source?.actor||!target?.actor||source.parent?.id!==target.parent?.id||source.actor.uuid===target.actor.uuid||!source.actor.testUserPermission(user,"OWNER"))throw Error("Select your character to wake another token.");
  if(isUnconscious(source.actor))throw Error("An unconscious character cannot wake someone else.");
  if(!isUnconscious(target.actor))return;
  await target.actor.toggleStatusEffect(unconscious,{active:false});
}
export async function wakeUsingAction(source:Token,target:Token):Promise<void> {
  requireCombatSocket();const gm=primaryGM();if(!gm)throw Error("An active GM is required to wake another character.");
  if(!canWake(source,target))throw Error("Select your conscious character and an unconscious target.");
  if(game.user!.id===gm.id)return resolveWake(source.document.uuid,target.document.uuid,game.user!);
  const id=foundry.utils.randomID();
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(Error("The GM did not respond to the wake request."));},15000);
    pending.set(id,{resolve,reject,timer});
    game.socket!.emit(channel,{wake:"request",id,user:game.user!.id,source:source.document.uuid,target:target.document.uuid});
  });
}
export function registerWake():void {
  Hooks.once("ready",()=>game.socket!.on(channel,async(packet:WakeRequest)=>{
    if(packet?.wake==="reply"&&packet.user===game.user!.id){const job=pending.get(packet.id);if(!job)return;clearTimeout(job.timer);pending.delete(packet.id);if(packet.error)job.reject(Error(packet.error));else job.resolve();return;}
    if(packet?.wake!=="request"||game.user!.id!==primaryGM()?.id)return;
    const user=game.users?.get(packet.user) as User|undefined;if(!user||!packet.source||!packet.target)return;
    let error:string|undefined;try{await resolveWake(packet.source,packet.target,user);}catch(e){error=e instanceof Error?e.message:String(e);}
    game.socket!.emit(channel,{wake:"reply",id:packet.id,user:packet.user,error});
  }));
}
