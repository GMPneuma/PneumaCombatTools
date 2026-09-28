import {nativeCard,spendBonusLuck,type RollItem} from "./native-combat.js";
import {hasInstantCondition} from "./instant-lifetime.js";
import {extinguishStatus,ejectStatus} from "./neural-intrusion.js";
import {forceOutEntries} from "./quickhack/force-out.js";
import {masterStatuses} from "./status-catalog.js";
export const hasMartialArts=(actor:Actor)=>actor.items.some(item=>String(item.type)==="skill"
  &&foundry.utils.getProperty(item,"system.skillType")==="martialArt"&&Number(foundry.utils.getProperty(item,"system.level"))>=1);
const proneIds=()=>["prone",masterStatuses.find(s=>s.name==="Prone")!.id];
const isProne=(actor:Actor)=>Array.from(actor.allApplicableEffects?.()??actor.effects).some(effect=>!effect.disabled&&!effect.isSuppressed&&proneIds().some(id=>effect.statuses.has(id)));
export function selfActions(actor:Actor){
  if(["container", "blackIce", "demon"].includes(String(actor.type)))return [];
  return [
    ...(hasInstantCondition(actor,"fire")?[{action:"extinguish",label:"Extinguish",icon:"fa-fire-extinguisher",disabled:false}]:[]),
    ...forceOutEntries(actor).map(row=>({action:"eject",message:row.messageId,label:"Eject Netrunner — "+row.name,icon:"fa-plug-circle-xmark",disabled:false})),
    ...(hasMartialArts(actor)&&isProne(actor)?[{action:"recovery",label:"MA Recovery",icon:"fa-person-arrow-up-from-line",disabled:false}]:[])
  ];
}
const recovering=new Set<string>();
export async function performSelfAction(actor:Actor,action:string,message?:string,skipDialog=false):Promise<void>{
  if(["container", "blackIce", "demon"].includes(String(actor.type)))return;
  if(!actor.isOwner)throw Error("You do not control this character.");
  if(action==="extinguish"){if(hasInstantCondition(actor,"fire"))await extinguishStatus(actor);}
  else if(action==="eject"){if(!message)throw Error("Choose a connected Netrunner.");await ejectStatus(actor,message,skipDialog);}
  else if(action==="recovery"){
    if(!hasMartialArts(actor))throw Error("MA Recovery requires a Martial Art skill of 1 or higher.");
    if(!isProne(actor)||recovering.has(actor.uuid))return;
    recovering.add(actor.uuid);
    try{
      const skill=actor.items.filter(item=>String(item.type)==="skill"&&foundry.utils.getProperty(item,"system.skillType")==="martialArt"&&Number(foundry.utils.getProperty(item,"system.level"))>=1)
        .sort((a,b)=>Number(foundry.utils.getProperty(b,"system.level"))-Number(foundry.utils.getProperty(a,"system.level")))[0] as RollItem;
      let roll=skill.createRoll("skill",actor);
      roll.rollTitle="MA Recovery — DV13";
      if(!await roll.handleRollDialog({type:"pneuma-recovery",ctrlKey:skipDialog,metaKey:false},actor,skill))return;
      if(!actor.isOwner||!hasMartialArts(actor)||!isProne(actor))return;
      roll=await skill.confirmRoll(roll);await spendBonusLuck(actor,roll.luck);await roll.roll();
      const success=roll.resultTotal>13;
      const content=await nativeCard(roll)+'<p class="pneuma-ma-recovery-result">'+(success?"MA Recovery succeeds: get up without spending an Action.":"MA Recovery fails: get up using your Action.")+'</p>';
      const data={content,speaker:ChatMessage.getSpeaker({actor})};
      ChatMessage.applyRollMode(data as never,game.settings!.get("core","rollMode") as never);
      await ChatMessage.create(data);
      for(const id of new Set(proneIds()))await actor.toggleStatusEffect(id,{active:false});
    }finally{recovering.delete(actor.uuid);}
  }
}
