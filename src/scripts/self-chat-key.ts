import {registerNativeWrapper} from "./native-wrappers.js";
import {registerSelfOperationCapture,selfOperationUser,selfUserFromContent} from "./self-chat-operation.js";

const MODULE="pneuma-combattools";
const pressed=new Set<string>();
export const selfChatHeld=():boolean=>pressed.size>0;

function display():void {
  document.getElementById("pneuma-self-chat-held")?.remove();
  if(!selfChatHeld())return;
  const label=document.createElement("span");
  label.id="pneuma-self-chat-held";label.textContent="SELF chat — key held";
  label.className="pneuma-chat-button";
  label.dataset.chatRole="gm";label.dataset.chatKind="action";
  label.setAttribute("role","status");
  // Card-scoped themes do not inherit into the body-level overlay. Reuse their
  // public button tokens on each press instead of copying theme colors.
  const sample=document.querySelector<HTMLElement>('.chat-message .pneuma-chat-button[data-chat-role="gm"]')
    ??document.querySelector<HTMLElement>('.chat-message.pneuma-chat-card');
  if(sample){
    const skin=getComputedStyle(sample);
    for(const property of Array.from(skin))if(property.startsWith("--pneuma-chat-button-"))
      label.style.setProperty(property,skin.getPropertyValue(property));
  }
  document.body.append(label);
}
function clear():void {pressed.clear();display();}

/** Local creation-time override. Saved audiences on existing messages remain authoritative. */
export function registerSelfChatKey():void {
  game.keybindings!.register(MODULE,"holdSelfChat",{
    name:"Hold for SELF chat",hint:"While holding this key, new chat output from this client goes to Self. Hold through confirmation. Existing shared cards retain their audience.",
    editable:[{key:"AltLeft"},{key:"AltRight"}],restricted:false,
    reservedModifiers:["Alt","Control","Shift"],
    onDown:context=>{pressed.add(context.event.code);display();return false;},
    onUp:context=>{pressed.delete(context.event.code);display();return false;}
  });
  Hooks.once("ready",()=>{
    if(game.system?.id==="cyberpunk-red-core")void registerSelfOperationCapture(selfChatHeld).catch(error=>ui.notifications!.error("Self chat roll capture: "+String(error)));
    // Foundry ignores keybindings in text inputs. Track configured bindings there
    // too so ALT+Enter chat submission works, without swallowing native shortcuts.
    window.addEventListener("keydown",event=>{
      if(event.repeat)return;
      const bindings=game.keybindings!.get(MODULE,"holdSelfChat");
      if(bindings.some(binding=>binding.key===event.code&&(binding.modifiers??[]).every(modifier=>
        modifier==="Alt"?event.altKey:modifier==="Control"?event.ctrlKey||event.metaKey:modifier==="Shift"?event.shiftKey:false))){
        pressed.add(event.code);display();
      }
    },true);
    window.addEventListener("keyup",event=>{if(pressed.delete(event.code))display();},true);
    window.addEventListener("blur",clear);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)clear();});
    registerNativeWrapper(game.settings!,"get",function(wrapped,namespace:string,key:string){
      return selfChatHeld()&&namespace==="core"&&key==="rollMode"?"selfroll":wrapped(namespace,key);
    },"MIXED");
    registerNativeWrapper(CONFIG.ChatMessage.documentClass,"createDocuments",function(wrapped,rows:object[]=[],options:object={}){
      const heldUser=selfChatHeld()?game.user?.id:undefined;
      const captured=rows.map(row=>{
        const user=selfUserFromContent((row as {content?:unknown}).content)??heldUser;
        if(!user)return row;
        const copy=foundry.utils.deepClone(row) as Record<string,unknown>;
        copy.whisper=[user];copy.blind=false;
        const flags=(copy.flags as Record<string,any>|undefined)?.[MODULE];
        for(const state of [flags?.exchange,flags?.aoe?.exchange,flags?.manualRoll])if(state)state.rollMode="selfroll";
        return copy;
      });
      // Explicit audiences survive native creation even if ALT was released.
      return wrapped(captured,heldUser?{...options,rollMode:"selfroll"}:options);
    },"WRAPPER");
    Hooks.on("preCreateChatMessage",(message:ChatMessage,_data:unknown,_options:unknown,userId:string)=>{
      const recipient=selfUserFromContent(message.content)??(selfChatHeld()&&userId===game.user?.id?userId:undefined);
      if(recipient)message.updateSource({whisper:[recipient],blind:false});
    });
    const installed=new WeakSet<object>();
    const installDice=()=>{
      const dice=(game as unknown as {dice3d?:object}).dice3d;
      if(!dice||installed.has(dice))return;
      registerNativeWrapper(dice,"showForRoll",function(wrapped,roll:unknown,user:User|undefined,synchronize:unknown,whisper:unknown,blind:unknown,...rest:unknown[]){
        const recipient=selfOperationUser(roll)??(selfChatHeld()&&user?.id===game.user?.id?game.user?.id:undefined);
        return recipient?wrapped(roll,user,false,[recipient],false,...rest):wrapped(roll,user,synchronize,whisper,blind,...rest);
      },"WRAPPER");
      installed.add(dice);
    };
    installDice();Hooks.on("diceSoNiceReady",installDice);
  });
}
