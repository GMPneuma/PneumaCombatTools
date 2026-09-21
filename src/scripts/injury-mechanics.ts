import {evasionBlocked,hasInjury} from "./injury-rules.js";
import {registerNativeWrapper} from "./native-wrappers.js";
import {requireCombatSocket} from "./socket-health.js";
import type {MoveRecord} from "./movement-rules.js";
const MODULE="pneuma-combattools",path=`flags.${MODULE}.brokenRibs`,channel=`module.${MODULE}`;
const gm=()=>game.users?.filter(u=>u.active&&u.isGM).sort((a,b)=>a.id.localeCompare(b.id))[0];
const get=<T>(doc:object,key=path)=>foundry.utils.getProperty(doc,key) as T|undefined;
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
let queue:Promise<unknown>=Promise.resolve();
function work<T>(fn:()=>Promise<T>):Promise<T>{const next=queue.catch(()=>{}).then(fn);queue=next;return next;}
interface RibsCard {actor:string;token:string;name:string;combat:string;turn:string;epoch:string;distance:number;applied?:boolean}
export function ribsContent(data:RibsCard):string {
  const eligible=data.distance>4;
  return `<div class="pneuma-injury-card rollcard" data-injury="broken-ribs" data-state="${data.applied?"applied":eligible?"pending":"withdrawn"}"><div class="rollcard-top"><div class="cpr-block">${escape(data.name)} &mdash; Broken Ribs</div></div><div class="rollcard-bottom"><p>${data.applied?"5 damage applied directly to HP.":eligible?`Moved ${Number(data.distance.toFixed(2))}m/yd on foot. At the end of this turn: 5 damage directly to HP.`:"Movement reset to 4m/yd or less; no damage due."}</p>${!data.applied&&eligible?'<button type="button" data-ribs-apply>Apply 5 damage</button>':""}</div></div>`;
}
/** Runs after accepted movement only. The saved movement snapshot avoids animation/preview and rapid-move races. */
export async function warnBrokenRibs(doc:TokenDocument,record:MoveRecord):Promise<void> {
  if(game.user?.id!==gm()?.id||!doc.actor||!Number.isFinite(record.onFoot))return;
  const actor=doc.actor;
  return work(async()=>{
    const combat=game.combats?.get(record.combat);if(!combat?.started)return;
    const epoch=get<string>(combat,`flags.${MODULE}.evasionEpoch`)??"";
    const message=game.messages?.find(m=>{const d=get<RibsCard>(m);return d?.actor===actor.uuid&&d.combat===record.combat&&d.turn===record.turn&&d.epoch===epoch;});
    if(message){const d=foundry.utils.deepClone(get<RibsCard>(message)!);if(!d.applied&&d.distance!==record.onFoot){d.distance=record.onFoot!;await message.update({content:ribsContent(d),[path]:d} as never);}return;}
    if(record.onFoot!<=4||!hasInjury(actor,"Broken Ribs"))return;
    const data:RibsCard={actor:actor.uuid,token:doc.uuid,name:doc.name??actor.name??"Character",combat:record.combat,turn:record.turn,epoch,distance:record.onFoot!};
    // Injury reminders are shared with the affected player's owners and GMs, never other players' private NPC data.
    const whisper=game.users?.filter(u=>u.isGM||actor.testUserPermission(u,"OWNER")).map(u=>u.id!)??[];
    await ChatMessage.create({content:ribsContent(data),speaker:ChatMessage.getSpeaker({actor,token:doc}),whisper,flags:{[MODULE]:{brokenRibs:data}}} as never);
  });
}
export async function applyRibsDamage(id:string,user:User):Promise<void> {
  return work(async()=>{
    if(game.user?.id!==gm()?.id)throw Error("An active GM must apply the injury damage.");
    const message=game.messages?.get(id) as ChatMessage|undefined,saved=message&&get<RibsCard>(message),data=saved&&foundry.utils.deepClone(saved);
    if(!message||!data)throw Error("Injury warning is unavailable.");
    const actor=await fromUuid(data.actor) as Actor|null;
    if(!actor||(!user.isGM&&!actor.testUserPermission(user,"OWNER")))throw Error("Only the character's owner or GM can apply this damage.");
    if(data.applied)return;
    if(data.distance<=4||!game.combats?.get(data.combat)?.started||(get<string>(game.combats!.get(data.combat)!,`flags.${MODULE}.evasionEpoch`)??"")!==data.epoch)throw Error("This movement warning is no longer active.");
    const receipts=get<Record<string,string[]>>(actor,`flags.${MODULE}.ribsApplications`)??{};
    const messages=receipts[data.combat]??[];
    if(!messages.includes(id)){
      const hp=Number(foundry.utils.getProperty(actor,"system.derivedStats.hp.value"));
      if(!Number.isFinite(hp))throw Error("Character HP is unavailable.");
      // HP and receipt share one actor update, so retrying a failed card write cannot apply twice.
      await actor.update({"system.derivedStats.hp.value":hp-5,[`flags.${MODULE}.ribsApplications`]:{...receipts,[data.combat]:[...messages,id]}} as never);
    }
    data.applied=true;await message.update({content:ribsContent(data),[path]:data} as never);
  });
}
export function installInjuryRollGuards(itemPrototype:object,rollPrototype:object):void {
  const actors=new WeakMap<object,Actor>();
  const isEvasion=(roll:{skillName?:string})=>["evasion",game.i18n?.localize("CPR.global.itemType.skill.evasion").toLowerCase()].includes(roll.skillName?.toLowerCase()??"");
  const check=(roll:{skillName?:string},actor:Actor)=>{if(isEvasion(roll)){const reason=evasionBlocked(actor);if(reason){ui.notifications!.warn(reason);throw Error(reason);}}};
  registerNativeWrapper(itemPrototype,"createRoll",function(wrapped,type:string,actor:Actor,...args:unknown[]){
    const roll=wrapped(type,actor,...args);if(roll&&typeof roll==="object"){actors.set(roll,actor);check(roll,actor);}return roll;
  },"MIXED");
  registerNativeWrapper(rollPrototype,"handleRollDialog",async function(wrapped,event:unknown,actor:Actor,...args:unknown[]){
    actors.set(this,actor);if(isEvasion(this)){const reason=evasionBlocked(actor);if(reason){ui.notifications!.warn(reason);return false;}}
    const result=await wrapped(event,actor,...args);if(result)check(this,actor);return result;
  },"MIXED");
  registerNativeWrapper(rollPrototype,"roll",function(wrapped,...args:unknown[]){const actor=actors.get(this);if(actor)check(this,actor);return wrapped(...args);},"MIXED");
}
interface Packet {ribsType:"apply"|"result";id:string;user:string;message?:string;error?:string;gm?:string}
const pending=new Map<string,{resolve:()=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
function requestDamage(message:string):Promise<void>{
  requireCombatSocket();const authority=gm();if(!authority)throw Error("An active GM is required to apply injury damage.");
  if(game.user!.id===authority.id)return applyRibsDamage(message,game.user!);
  const id=foundry.utils.randomID();return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(Error("GM response timed out. Retry the injury card."));},15000);
    pending.set(id,{resolve,reject,timer});game.socket!.emit(channel,{ribsType:"apply",id,user:game.user!.id,message});
  });
}
export function registerInjuryMechanics():void {
  Hooks.on("updateToken",(doc:TokenDocument,changes:Record<string,unknown>)=>{
    const record=get<MoveRecord>(changes,`flags.${MODULE}.movement`)??changes[`flags.${MODULE}.movement`] as MoveRecord|undefined;
    if(record)void warnBrokenRibs(doc,foundry.utils.deepClone({...get<MoveRecord>(doc,`flags.${MODULE}.movement`),...record})).catch(e=>ui.notifications!.error(String(e)));
  });
  Hooks.on("renderChatMessage",async(message:ChatMessage,html:JQuery)=>{
    const data=get<RibsCard>(message);if(!data)return;
    const actor=await fromUuid(data.actor) as Actor|null;
    for(const button of html.find<HTMLButtonElement>("[data-ribs-apply]").toArray()){
      if(!actor||(!game.user?.isGM&&!actor.isOwner)){button.remove();continue;}
      button.disabled=data.applied===true||data.distance<=4||!game.combats?.get(data.combat)?.started;
      button.addEventListener("click",async event=>{event.preventDefault();if(button.disabled)return;button.disabled=true;try{await requestDamage(message.id!);}catch(e){ui.notifications!.error(String(e));button.disabled=false;}});
    }
  });
  Hooks.once("ready",async()=>{
    game.socket!.on(channel,(p:Packet)=>{
      if(!p||!["apply","result"].includes(p.ribsType))return;
      if(p.ribsType==="result"){
        if(p.user!==game.user?.id||p.gm!==gm()?.id)return;const wait=pending.get(p.id);if(!wait)return;
        clearTimeout(wait.timer);pending.delete(p.id);if(p.error)wait.reject(Error(p.error));else wait.resolve();
      }else if(game.user?.id===gm()?.id){const user=game.users?.get(p.user) as User|undefined;if(!user||!p.message)return;
        const reply=(error?:string)=>game.socket!.emit(channel,{ribsType:"result",id:p.id,user:p.user,gm:game.user!.id,error});
        void applyRibsDamage(p.message,user).then(()=>reply(),e=>reply(String(e)));
      }
    });
    try{const path="/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js";const rolls=await import(path);installInjuryRollGuards(CONFIG.Item.documentClass.prototype,rolls.CPRRoll.prototype);}
    catch(e){ui.notifications!.error("Injury roll integration: "+String(e));}
  });
}
