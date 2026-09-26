import { primaryGM as electedGM } from "./shared.js";
import {hasInjury} from "./injury-rules.js";
import {postHUDMessage} from "./hud-messages.js";
import {registerNativeWrapper} from "./native-wrappers.js";
declare global {interface SettingConfig {"pneuma-combattools.injuryTurnEndReminder":boolean}}
const M="pneuma-combattools",path="flags."+M+".injuryReminders";
export const injuryGuidance:Record<string,string>={
 "Dismembered Arm":"Arm lost. Drop items held in that arm; it cannot be used.",
 "Dismembered Hand":"Hand lost. Drop items held in that hand; it cannot be used.",
 "Broken Arm":"Arm unusable. Drop items held in that hand.",
 "Crushed Fingers":"Apply −4 to actions involving the injured hand using the native modifier.",
 "Broken Jaw":"Apply −4 to actions involving speech using the native modifier.",
 "Crushed Windpipe":"You cannot speak. Adjudicate speech-dependent actions.",
 "Spinal Injury":"Next turn: no Action; Move Action remains available.",
 "Damaged Ear":"Hearing Perception −2. Over 4 m/yd on foot: no Move Action next turn.",
 "Lost Ear":"Hearing Perception −4. Over 4 m/yd on foot: no Move Action next turn.",
 "Damaged Eye":"Ranged attacks −2; select −2 for vision-based Perception.",
 "Lost Eye":"Ranged attacks −4; select −4 for vision-based Perception.",
 "Broken Ribs":"Over 4 m/yd on foot: apply the injury's 5 damage at turn end.",
 "Foreign Object (Body)":"Over 4 m/yd on foot: apply the injury's 5 damage at turn end.",
 "Foreign Object (Head)":"Over 4 m/yd on foot: apply the injury's 5 damage at turn end.",
};
const primary=()=>electedGM()?.id===game.user?.id;
type Reminder={combat:string;round:number;turn:number;injury:string;movementTurn?:string;delivered?:boolean};
const reminders=(actor:Actor)=>foundry.utils.getProperty(actor,path) as Reminder[]|undefined??[];
function alert(actor:Actor,text:string,id?:string){
 const recipients=game.users?.filter(u=>u.active&&(u.isGM||actor.testUserPermission(u,"OWNER"))).map(u=>u.id!)??[];
 if(recipients.length)postHUDMessage({source:M,id,text:((actor.name??"Character")+": "+text).slice(0,200),recipients,duration:30});
}
let queue=Promise.resolve();
function enqueue(fn:()=>Promise<void>){if(primary()){queue=queue.catch(()=>{}).then(fn);void queue.catch(e=>ui.notifications!.error("Injury reminder: "+String(e)));}}
export async function scheduleInjuryReminder(actor:Actor,combat:Combat,injury:string,movementTurn?:string){
 const rows=reminders(actor).filter(r=>!r.delivered||!movementTurn||r.movementTurn===movementTurn);
 if(rows.some(r=>r.combat===combat.id&&r.injury===injury&&r.movementTurn===movementTurn))return;
 await actor.update({[path]:[...rows,{combat:combat.id!,round:Number(combat.round),turn:Number(combat.turn),injury,...(movementTurn?{movementTurn}:{})}]} as never);
}
export async function deliverInjuryReminders(combat:Combat){
 const actor=combat.combatant?.actor;if(!actor||!combat.started)return;
 const due=reminders(actor).filter(r=>!r.delivered&&r.combat===combat.id&&(Number(combat.round)>r.round||Number(combat.round)===r.round&&Number(combat.turn)>r.turn));
 if(!due.length)return;
 await actor.update({[path]:reminders(actor).map(r=>due.includes(r)?{...r,delivered:true}:r)} as never);
 const active=due.filter(r=>hasInjury(actor,r.injury));
 if(active.some(r=>r.injury==="Spinal Injury"))alert(actor,"SPINAL INJURY — No Action this turn. You may still take a Move Action.");
 if(active.some(r=>r.injury!=="Spinal Injury"))alert(actor,"EAR INJURY — No Move Action this turn after moving over 4 m/yd last turn.");
}
export function applyInjuryMoveFloor(actor:Actor){
 if(!["Collapsed Lung","Broken Leg","Dismembered Leg"].some(n=>hasInjury(actor,n)))return;
 // Preserve explicit immobilization/override effects, including disabled frames.
 const effects=typeof actor.allApplicableEffects==="function"?Array.from(actor.allApplicableEffects()):Array.from(actor.effects);
 if(effects.some(e=>!e.disabled&&!e.isSuppressed&&!foundry.utils.getProperty(e,"system.isSuppressed")&&e.changes.some(c=>c.key==="system.stats.move.value"&&c.mode===5&&Number(c.value)<=0)))return;
 const stats=actor.system as unknown as {stats:{move:{value:number}}};
 if(Number.isFinite(stats.stats?.move?.value))stats.stats.move.value=Math.max(1,stats.stats.move.value);
}
export function registerInjuryNotices(){
 game.settings!.register(M,"injuryTurnEndReminder",{name:"Injury damage: turn-end HUD reminder",hint:"Remind owners and GM about unpaid Broken Ribs / Foreign Object movement-damage cards. Does not apply damage or spend actions.",scope:"world",config:true,type:Boolean,default:true});
 const known=new Map<string,Set<string>>();
 const snapshot=(actor:Actor)=>new Set(Object.keys(injuryGuidance).filter(n=>hasInjury(actor,n)));
 const check=async(actor:Actor)=>{
  const before=known.get(actor.uuid)??new Set<string>(),after=snapshot(actor);known.set(actor.uuid,after);
  if(reminders(actor).some(r=>!after.has(r.injury)))await actor.update({[path]:reminders(actor).filter(r=>after.has(r.injury))} as never);
  for(const injury of after)if(!before.has(injury)){
   alert(actor,injury+" — "+injuryGuidance[injury]);
   if(injury==="Spinal Injury")for(const combat of game.combats??[])if(combat.started&&combat.combatants.some(c=>c.actor?.uuid===actor.uuid))await scheduleInjuryReminder(actor,combat,injury);
  }
 };
 Hooks.once("ready",()=>{
  for(const actor of game.actors??[])known.set(actor.uuid,snapshot(actor));
  for(const scene of game.scenes??[])for(const token of scene.tokens)if(token.actor)known.set(token.actor.uuid,snapshot(token.actor));
  registerNativeWrapper(CONFIG.Actor.documentClass.prototype,"applyActiveEffects",function(wrapped,...args){const result=wrapped(...args);applyInjuryMoveFloor(this as Actor);return result;},"WRAPPER");
  for(const actor of game.actors??[])actor.prepareData();
 });
 for(const hook of ["createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(hook,(doc:Item|ActiveEffect)=>{
  const actor=doc.parent instanceof Actor?doc.parent:doc.parent instanceof Item?doc.parent.parent:null;
  if(actor instanceof Actor)enqueue(()=>check(actor));
 });
 Hooks.on("updateToken",(token:TokenDocument,changes:Record<string,unknown>)=>{
  const partial=foundry.utils.getProperty(changes,"flags."+M+".movement")??changes["flags."+M+".movement"];
  if(!partial||!token.actor)return;
  const record={...foundry.utils.getProperty(token,"flags."+M+".movement"),...partial} as {onFoot?:number;combat:string;turn:string};
  enqueue(async()=>{
   const combat=game.combats?.get(record.combat);if(!combat?.started)return;
   if(!(Number(record.onFoot)>4)){
    const rows=reminders(token.actor!).filter(r=>r.combat!==combat.id||r.movementTurn!==record.turn||r.delivered);
    if(rows.length!==reminders(token.actor!).length)await token.actor!.update({[path]:rows} as never);
    return;
   }
   for(const injury of ["Damaged Ear","Lost Ear"])if(hasInjury(token.actor!,injury))await scheduleInjuryReminder(token.actor!,combat as Combat,injury,record.turn);
  });
 });
 type Turn={actor?:Actor;round:number;turn:number};
 const previous=new Map<string,Turn>();
 const remember=(c:Combat)=>previous.set(c.id!,{actor:c.combatant?.actor??undefined,round:Number(c.round),turn:Number(c.turn)});
 Hooks.once("ready",()=>{for(const c of game.combats??[])remember(c);});
 Hooks.on("createCombat",remember);
 Hooks.on("updateCombat",(combat:Combat)=>{
  const old=previous.get(combat.id!);remember(combat);
  enqueue(async()=>{
   if(!combat.started){await clear(combat);return;}
   const advanced=old&&(Number(combat.round)>old.round||Number(combat.round)===old.round&&Number(combat.turn)>old.turn);
   if(!advanced)return;
   if(old.actor&&game.settings!.get(M,"injuryTurnEndReminder")){
    const pending=game.messages?.filter(m=>{
     const r=foundry.utils.getProperty(m,"flags."+M+".brokenRibs") as {actor:string;combat:string;applied?:boolean;distance:number;turn:string}|undefined;
     const index=combat.turns.findIndex(c=>c.actor?.uuid===old.actor!.uuid);
     const participant=combat.turns[index];
     const turn=participant?.id+":"+String(old.round-(old.turn<index?1:0));
     return r?.actor===old.actor!.uuid&&r.combat===combat.id&&r.turn===turn&&!r.applied&&r.distance>4;
    })??[];
    if(pending.length)alert(old.actor,"TURN END — "+pending.length+" movement-injury damage card(s) pending. Apply 5 HP per injury from chat.");
   }
   await deliverInjuryReminders(combat);
  });
 });
 async function clear(combat:Combat){const actors=new Map<string,Actor>();for(const a of game.actors??[])actors.set(a.uuid,a);for(const scene of game.scenes??[])for(const token of scene.tokens)if(token.actor)actors.set(token.actor.uuid,token.actor);for(const actor of actors.values())if(reminders(actor).some(r=>r.combat===combat.id))await actor.update({[path]:reminders(actor).filter(r=>r.combat!==combat.id)} as never);}
 Hooks.on("deleteCombat",(c:Combat)=>{previous.delete(c.id!);enqueue(()=>clear(c));});
 const shown=new WeakSet<object>();
 Hooks.once("ready",async()=>{
  const native="/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js";
  const rolls=await import(native);
  registerNativeWrapper(rolls.CPRRoll.prototype,"handleRollDialog",async function(wrapped,event:unknown,actor:Actor,...args:unknown[]){
   const skill=String(this.skillName??"").toLowerCase();
   if(actor&&/^(perception|conversation|persuasion|interrogation|oratory|acting|singing)$/.test(skill)&&!shown.has(this)){
    shown.add(this);
    const injuries=skill==="perception"?["Lost Eye","Damaged Eye","Lost Ear","Damaged Ear"]:["Broken Jaw","Crushed Windpipe"];
    const notes=injuries.filter(n=>hasInjury(actor,n)).map(n=>injuryGuidance[n]);
    if(notes.length)postHUDMessage({source:M,text:notes.join(" ").slice(0,200),duration:30});
   }
   return wrapped(event,actor,...args);
  },"WRAPPER");
 });
}
