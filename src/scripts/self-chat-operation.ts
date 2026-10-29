import {registerNativeWrapper} from "./native-wrappers.js";

const recipients=new WeakMap<object,string>();
export const selfOperationUser=(operation:unknown):string|undefined=>
  operation&&typeof operation==="object"?recipients.get(operation):undefined;
export function tagSelfOperation(operation:object,user:string):void {recipients.set(operation,user);}
export function selfUserFromContent(content:unknown):string|undefined {
  return typeof content==="string"?content.match(/data-pneuma-self-user="([a-zA-Z0-9_-]+)"/)?.[1]:undefined;
}
export function markSelfContent(html:string,operation:unknown):string {
  const user=selfOperationUser(operation);
  return user?html.replace(/^(\s*<[\w-]+)/,`$1 data-pneuma-self-user="${user}"`):html;
}

/** Keep visibility on each roll, never in a global pending-operation flag. */
export function installSelfOperationCapture(dialog:object,rollPrototype:object,dice:object,held:()=>boolean,chat:object,initiative?:Function):void {
  const capture=(roll:object)=>{if(held()&&game.user?.id)tagSelfOperation(roll,game.user.id);};
  registerNativeWrapper(dialog,"confirmDialog",function(wrapped,...args:unknown[]){
    const roll=this.rollData??this.object;
    if(roll&&typeof roll==="object")capture(roll);
    return wrapped(...args);
  },"WRAPPER");
  registerNativeWrapper(rollPrototype,"handleRollDialog",function(wrapped,...args:unknown[]){
    capture(this);return wrapped(...args);
  },"WRAPPER");
  registerNativeWrapper(rollPrototype,"roll",function(wrapped,...args:unknown[]){
    capture(this);
    const user=selfOperationUser(this);
    if(user)for(const key of ["_roll","_critRoll"]){
      const prior=Object.getOwnPropertyDescriptor(this,key);let value=this[key];
      if(value)tagSelfOperation(value,user);
      Object.defineProperty(this,key,{configurable:true,enumerable:true,
        get:()=>prior?.get?prior.get.call(this):value,
        set:(next:object)=>{value=next;prior?.set?.call(this,next);if(next)tagSelfOperation(next,user);}});
    }
    return wrapped(...args);
  },"WRAPPER");
  registerNativeWrapper(dice,"handle3dDice",function(wrapped,roll:object,mode?:string){
    return wrapped(roll,selfOperationUser(roll)?"selfroll":mode);
  },"WRAPPER");
  registerNativeWrapper(chat,"RenderRollCard",async function(wrapped,roll:any){
    const user=selfOperationUser(roll);
    if(!user)return wrapped(roll);
    // CPR v0.92.4 renderer, retaining its template, chat setup and speaker.
    // Foundry's global renderTemplate descriptor cannot be wrapped by libWrapper.
    roll.criticalCard=roll.wasCritical();
    if(initiative?.prototype.isPrototypeOf(roll)&&!roll.calculateCritical)roll.criticalCard=false;
    const html=markSelfContent(await renderTemplate(roll.rollCard,roll),roll);
    const data=this.ChatDataSetup(html,"selfroll");
    data.whisper=[user];data.blind=false;
    if(roll.entityData){
      const {actor:actorId,token:tokenId}=roll.entityData;
      const actors=game.actors as unknown as {tokens:Record<string,Actor>;get(id:string):Actor|undefined};
      const actor=(tokenId?actors.tokens[tokenId]:undefined)??actors.get(actorId);
      data.speaker={actor,alias:actor?.name};
    }
    return ChatMessage.create(data);
  },"MIXED");
}

export async function registerSelfOperationCapture(held:()=>boolean):Promise<void> {
  const base="/systems/cyberpunk-red-core/modules/";
  const [dialog,rolls,dice,chat]=await Promise.all([import(base+"dialog/cpr-dialog-application.js"),import(base+"rolls/cpr-rolls.js"),import(base+"extern/cpr-dice-handler.js"),import(base+"chat/cpr-chat.js")]);
  installSelfOperationCapture(dialog.default.prototype,rolls.CPRRoll.prototype,dice.default,held,chat.default,rolls.CPRInitiative);
}
