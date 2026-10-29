import {ekgPolicy,registerEKGSettings,type EKGLevel} from "./ekg-settings.js";
import {createEKGTrace,vitalState} from "./biomonitor.js";
import {hasBiomonitor} from "./eye-hud.js";
const MODULE="pneuma-combattools";

export function isMedtech(actor:Actor|undefined):boolean {
  return !!actor?.items.some(item=>{
    if(String(item.type)!=="role"||!(Number(foundry.utils.getProperty(item,"system.rank"))>0))return false;
    const source=String(foundry.utils.getProperty(item,"_stats.compendiumSource")??foundry.utils.getProperty(item,"flags.core.sourceId")??"");
    return source.endsWith(".8wRoRsRQnpt3Je00")||item.name?.trim().toLowerCase()==="medtech"
      ||String(foundry.utils.getProperty(item,"system.roleName")??"").toLowerCase()==="medtech";
  });
}
function viewer():Actor|undefined {return game.user?.character??undefined;}
let hovered:Token|undefined,panel:HTMLDivElement|undefined;
let shownState="";
let cachedTarget:Token|undefined, cachedAllowed:EKGLevel="none";
function clear(){panel?.remove();panel=undefined;shownState="";}
export function hoverEKGAccess(target:Token|undefined):EKGLevel {
 const actor=target?.actor,user=game.user;if(!actor||!user)return "none";
 const medtech=isMedtech(viewer()),row=user.isGM?"gm":medtech?"medtech":"player";
 const owned=(actor.getUserLevel(user)??0)>=CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
 const playerOwned=game.users?.some(player=>!player.isGM&&actor.testUserPermission(player,"OWNER"));
 const column=owned?"owned":playerOwned?"playerOwned":target.document.disposition===CONST.TOKEN_DISPOSITIONS.FRIENDLY?"friendly":"other";
 const policy=ekgPolicy(),level=policy.matrix[row+"_"+column]??"none";
 if(level==="hp"||level==="ekg")return level;
 return (policy.biomonitor==="anyone"||policy.biomonitor==="medtech"&&medtech)&&hasBiomonitor(actor)?"ekg":"none";
}
function position(){
  if(!panel||!hovered||!canvas.stage||!canvas.app)return;
  const bounds=(canvas.app.view as HTMLCanvasElement).getBoundingClientRect();
  const below=hovered.nameplate?.visible?Math.max(hovered.h,hovered.nameplate.y+hovered.nameplate.height):hovered.h;
  const point=canvas.stage.toGlobal(new PIXI.Point(hovered.x+hovered.w/2,hovered.y+below));
  const x=bounds.left+point.x*bounds.width/canvas.app.screen.width;
  const y=bounds.top+point.y*bounds.height/canvas.app.screen.height+8;
  panel.style.left=`${Math.max(8,Math.min(x-panel.offsetWidth/2,window.innerWidth-panel.offsetWidth-8))}px`;
  panel.style.top=`${y}px`;
}
function refresh(recheck=true){
  if(recheck||cachedTarget!==hovered){cachedTarget=hovered;cachedAllowed=hoverEKGAccess(hovered);}
  const target=hovered;
  if(!target?.actor||["container", "blackIce", "demon"].includes(String(target.actor.type))||!target.isVisible||target.isPreview||canvas.activeLayer!==canvas.tokens||cachedAllowed==="none"){clear();return;}
  const hp=Number(foundry.utils.getProperty(target.actor,"system.derivedStats.hp.value"));
  const max=Number(foundry.utils.getProperty(target.actor,"system.derivedStats.hp.max"));
  const state=Number.isFinite(hp)&&Number.isFinite(max)&&max>0?vitalState(hp,max):"unknown";
  if(!panel){panel=document.createElement("div");panel.className="pneuma-hover-ekg";panel.setAttribute("role","img");document.body.append(panel);}
  const displayKey=JSON.stringify([state,cachedAllowed,cachedAllowed==="hp"?hp:null,cachedAllowed==="hp"?max:null]);
  if(shownState!==displayKey){
    shownState=displayKey;const vitals=document.createElement("div");vitals.className="pneuma-eye-vitals";vitals.dataset.state=state;vitals.append(createEKGTrace(state));if(cachedAllowed==="hp"){const label=document.createElement("span");label.className="pneuma-hover-hp";label.textContent=state==="unknown"?"HP unavailable":`${hp} / ${max}`;vitals.append(label);}
    panel.replaceChildren(vitals);
    panel.setAttribute("aria-label",`EKG: ${state==="unknown"?"HP unavailable":state}${cachedAllowed==="hp"&&state!=="unknown"?`, ${hp} / ${max} HP`:""}`);
  }
  position();
}
export function registerHoverEKG(){
  registerEKGSettings(()=>refresh());
  Hooks.on("hoverToken",(token:Token,entered:boolean)=>{if(entered)hovered=token;else if(hovered===token)hovered=undefined;else return;refresh();});
  Hooks.on("controlToken",()=>refresh());
  Hooks.on("updateUser",()=>refresh());
  Hooks.on("updateActor",(actor:Actor)=>{if(actor.uuid===hovered?.actor?.uuid||actor.uuid===viewer()?.uuid)refresh();});
  for(const hook of ["createItem","updateItem","deleteItem"])Hooks.on(hook,(item:Item)=>{if(item.parent?.uuid===viewer()?.uuid||item.parent?.uuid===hovered?.actor?.uuid)refresh();});
  Hooks.on("updateToken",(token:TokenDocument)=>{if(token===hovered?.document||token.actor?.uuid===viewer()?.uuid)refresh();});
  Hooks.on("refreshToken",(token:Token)=>{if(token===hovered){if(!token.isVisible||token.isPreview||canvas.activeLayer!==canvas.tokens)clear();else if(panel)position();else refresh(false);}});
  Hooks.on("deleteToken",(token:TokenDocument)=>{if(token===hovered?.document){hovered=undefined;clear();}});
  Hooks.on("canvasPan",position);
  Hooks.on("canvasTearDown",()=>{hovered=undefined;clear();});
  window.addEventListener("resize",position);
  window.addEventListener("blur",()=>{hovered=undefined;clear();});
}
