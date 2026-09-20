import {createEKGTrace,vitalState} from "./biomonitor.js";
const MODULE="pneuma-combattools";
declare global {interface SettingConfig {"pneuma-combattools.alwaysShowEKG":boolean}}
export function isMedtech(actor:Actor|undefined):boolean {
  return !!actor?.items.some(item=>{
    if(String(item.type)!=="role"||!(Number(foundry.utils.getProperty(item,"system.rank"))>0))return false;
    const source=String(foundry.utils.getProperty(item,"_stats.compendiumSource")??foundry.utils.getProperty(item,"flags.core.sourceId")??"");
    return source.endsWith(".8wRoRsRQnpt3Je00")||item.name?.trim().toLowerCase()==="medtech"
      ||String(foundry.utils.getProperty(item,"system.roleName")??"").toLowerCase()==="medtech";
  });
}
function viewer():Actor|undefined {
  const selected=canvas.tokens?.controlled??[];
  if(selected.length)return selected.length===1&&selected[0]?.actor?.isOwner?selected[0].actor:undefined;
  return game.user?.character??undefined;
}
let hovered:Token|undefined,panel:HTMLDivElement|undefined;
let shownState="";
function clear(){panel?.remove();panel=undefined;shownState="";}
function permitted(){return game.settings!.get(MODULE,"alwaysShowEKG")||isMedtech(viewer());}
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
function refresh(){
  const target=hovered;
  if(!target?.actor||!target.isVisible||target.isPreview||canvas.activeLayer!==canvas.tokens||!permitted()){clear();return;}
  const hp=Number(foundry.utils.getProperty(target.actor,"system.derivedStats.hp.value"));
  const max=Number(foundry.utils.getProperty(target.actor,"system.derivedStats.hp.max"));
  const state=Number.isFinite(hp)&&Number.isFinite(max)&&max>0?vitalState(hp,max):"unknown";
  if(!panel){panel=document.createElement("div");panel.className="pneuma-hover-ekg";panel.setAttribute("role","img");document.body.append(panel);}
  if(shownState!==state){
    shownState=state;const vitals=document.createElement("div");vitals.className="pneuma-eye-vitals";vitals.dataset.state=state;vitals.append(createEKGTrace(state));panel.replaceChildren(vitals);
    panel.setAttribute("aria-label",`EKG: ${state==="unknown"?"HP unavailable":state}`);
  }
  position();
}
export function registerHoverEKG(){
  game.settings!.register(MODULE,"alwaysShowEKG",{name:"Always show EKG",hint:"Show the hovered token EKG to everyone. When off, only a selected owned Medtech (or assigned Medtech when none is selected) can see it. No numeric HP is shown.",scope:"world",config:true,type:Boolean,default:false,onChange:refresh});
  Hooks.on("hoverToken",(token:Token,entered:boolean)=>{if(entered)hovered=token;else if(hovered===token)hovered=undefined;else return;refresh();});
  Hooks.on("controlToken",refresh);
  Hooks.on("updateUser",refresh);
  Hooks.on("updateActor",(actor:Actor)=>{if(actor.uuid===hovered?.actor?.uuid||actor.uuid===viewer()?.uuid)refresh();});
  for(const hook of ["createItem","updateItem","deleteItem"])Hooks.on(hook,(item:Item)=>{if(item.parent?.uuid===viewer()?.uuid)refresh();});
  Hooks.on("updateToken",(token:TokenDocument)=>{if(token===hovered?.document||token.actor?.uuid===viewer()?.uuid)refresh();});
  Hooks.on("refreshToken",(token:Token)=>{if(token===hovered){if(!token.isVisible)clear();else refresh();}});
  Hooks.on("deleteToken",(token:TokenDocument)=>{if(token===hovered?.document){hovered=undefined;clear();}});
  Hooks.on("canvasPan",position);
  Hooks.on("canvasTearDown",()=>{hovered=undefined;clear();});
  window.addEventListener("resize",position);
  window.addEventListener("blur",()=>{hovered=undefined;clear();});
}
