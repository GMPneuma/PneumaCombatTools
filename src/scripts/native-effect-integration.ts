import {registerNativeWrapper} from "./native-wrappers.js";
import {withActorMutation} from "./actor-mutation.js";
import {isDamageCaptureView,blockedArmorApplication} from "./damage-application.js";
import {reportExposure} from "./effect-events.js";
import {igniteTarget} from "./instant-lifetime.js";
const MODULE="pneuma-combattools";
// Per-dialog context survives awaits; the stack covers only synchronous Ctrl-skip calls.
const contexts:string[]=[];
const dialogContext=new WeakMap<object,string>();
interface NativeDamageApplication {
  actor:Actor;hpReduction:number;rawDamageDealt?:number;damage?:number;location?:string;
  ablation?:number;armorData?:{equipped:boolean;value:number};pneumaBlockedAblation?:boolean;
}
export function installNativeEffectIntegration(chat:object,dialog:object,actorPrototype:object) {
  const applications=new WeakMap<Actor,{hpReduction:number;rawDamageDealt:number;blockedAblation:number;pending?:Promise<unknown>}>();
  registerNativeWrapper(chat,"RenderDamageApplicationCard",function(wrapped,data:NativeDamageApplication){
    const application=applications.get(data.actor);
    if(application){
      application.hpReduction=data.hpReduction;application.rawDamageDealt=data.rawDamageDealt??0;
      // Shield-only and brain receipts omit rawDamageDealt. Critical bonus damage
      // may still reduce HP when armor stops the actual hit.
      if(application.blockedAblation>0&&data.rawDamageDealt===0&&data.ablation===0
        &&Number(data.damage)>0&&data.armorData?.equipped&&data.armorData.value>0
        &&(data.location==="body"||data.location==="head")){
        const actor=data.actor as Actor & {_ablateArmor(location:string,amount:number):Promise<void>};
        const amount=application.blockedAblation;
        application.pending=(async()=>{
          await actor._ablateArmor(data.location!,amount);
          data.ablation=amount;data.pneumaBlockedAblation=true;
          const message=await wrapped(data) as ChatMessage|undefined;
          // Managed receipts are corrected during capture rendering. Ordinary
          // native receipts keep CPR's message, speaker, visibility and Undo.
          if(message&&typeof message.content==="string")await message.update({content:blockedArmorApplication(message.content)});
          return message;
        })();
        // CPR starts rendering without awaiting it. Keep failures owned by the
        // application and keep its actor queue locked until ablation completes.
        void application.pending.catch(()=>{});
        return application.pending;
      }
    }
    return wrapped(data);
  },"WRAPPER");
  registerNativeWrapper(chat,"RenderRollCard",async function(wrapped,roll:{rollCardExtraArgs?:{ammoType?:string}}){
    const ammo=roll.rollCardExtraArgs?.ammoType;
    const message=await wrapped(roll) as ChatMessage|undefined;
    if(message&&["poison","biotoxin","incendiary"].includes(ammo??""))await message.update({["flags."+MODULE+".ammoType"]:ammo} as never);
    return message;
  },"WRAPPER");
  registerNativeWrapper(chat,"damageApplication",function(wrapped,event:Event){
    const target=event.currentTarget instanceof Element?event.currentTarget:event.target instanceof Element?event.target:undefined;
    const id=target?.closest<HTMLElement>("[data-message-id]")?.dataset.messageId;
    const message=id?game.messages?.get(id):undefined;
    const ammo=message?foundry.utils.getProperty(message,"flags."+MODULE+".ammoType"):undefined;
    contexts.push(typeof ammo==="string"?ammo:"");
    try{return wrapped(event);}finally{contexts.pop();}
  },"WRAPPER");
  registerNativeWrapper(dialog,"showDialog",async function(wrapped,data:object,...args:unknown[]){
    const ammo=dialogContext.get(data)??contexts.at(-1);
    const result=await wrapped(data,...args);
    if(ammo&&result&&typeof result==="object")dialogContext.set(result,ammo);
    return result;
  },"WRAPPER");
  registerNativeWrapper(actorPrototype,"_applyDamage",async function(this:Actor,wrapped,...args:unknown[]){
    const form=args[8];
    const ammo=(form&&typeof form==="object"?dialogContext.get(form):undefined)??contexts.at(-1);
    const actor=this;
    const run=async()=>{
      const amount=Number(args[3]);
      const application:{hpReduction:number;rawDamageDealt:number;blockedAblation:number;pending?:Promise<unknown>}={
        hpReduction:0,rawDamageDealt:0,
        blockedAblation:game.settings?.get(MODULE,"ablateBlockedHits")&&Number.isFinite(amount)&&amount>0?amount:0
      };
      applications.set(actor,application);
      try {
        let result:unknown;
        try{result=await wrapped(...args);}finally{await application.pending;}
        if(application.hpReduction>0&&ammo){
          if(ammo==="incendiary"&&application.rawDamageDealt>0)await igniteTarget(actor);
          else if(ammo!=="incendiary")await reportExposure(actor,ammo);
        }
        return result;
      }finally{applications.delete(actor);}
    };
    // Managed capture already holds this actor's queue; unrelated native calls still join it.
    return isDamageCaptureView(actor)?run():withActorMutation(actor,run);
  },"WRAPPER");
}
export function registerNativeEffectIntegration() {
  Hooks.once("ready",async()=>{
    const chatPath="/systems/cyberpunk-red-core/modules/chat/cpr-chat.js",dialogPath="/systems/cyberpunk-red-core/modules/dialog/cpr-dialog-application.js";
    try{const [chat,dialog]=await Promise.all([import(chatPath),import(dialogPath)]);installNativeEffectIntegration(chat.default,dialog.default,CONFIG.Actor.documentClass.prototype);}
    catch(error){ui.notifications!.error("Native effect integration: "+(error as Error).message);}
  });
}
