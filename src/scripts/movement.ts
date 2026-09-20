import {recordStep,type MoveRecord,type MovePoint} from "./movement-rules.js";
import {grappleFor} from "./grapple/state.js";
import {movementEntry} from "./aoe/movement.js";
import {areaSettings} from "./aoe/settings.js";
const MODULE="pneuma-combattools",flag=`flags.${MODULE}.movement`;
// Prepared coordinates can follow token animation; source coordinates are the committed destination.
function committedPosition(doc:TokenDocument){
  return {x:doc._source.x,y:doc._source.y,elevation:doc._source.elevation};
}
declare global {interface SettingConfig {"pneuma-combattools.movementTracking":boolean}}
export function movementTurn(doc:TokenDocument):{combat:Combat;turn:string}|undefined {
  const combat=game.combat;
  if(!combat?.started||combat.scene?.id!==doc.parent?.id)return;
  const participant=combat.combatants.find(c=>c.tokenId===doc.id);if(!participant)return;
  const index=combat.turns.findIndex(c=>c.id===participant.id);
  return {combat,turn:participant.id+":"+String(Number(combat.round)-(Number(combat.turn)<index?1:0))};
}
export function currentMovement(doc:TokenDocument, context=movementTurn(doc)):MoveRecord|undefined {
  const saved=foundry.utils.getProperty(doc,flag) as MoveRecord|undefined;
  return context&&saved?.combat===context.combat.id&&saved.turn===context.turn?saved:undefined;
}
function initial(doc:TokenDocument):MoveRecord|undefined {
  const context=movementTurn(doc);if(!context)return;
  return {combat:context.combat.id!,turn:context.turn,start:committedPosition(doc),spent:0};
}
const active=()=>game.settings!.get(MODULE,"movementTracking")&&canvas.grid?.type===CONST.GRID_TYPES.SQUARE;
function nextRecord(token:Token,doc:TokenDocument,to:MovePoint):MoveRecord|undefined {
  const previous=currentMovement(doc)??initial(doc);if(!previous)return;
  const {x,y}=committedPosition(doc);
  return recordStep(previous,{x,y},to,canvas.grid!.size,(from,destination)=>token.checkCollision(token.getCenterPoint(destination),{origin:token.getCenterPoint(from),type:"move",mode:"any"}));
}
export async function resetMovement(token:Token) {
  const record=currentMovement(token.document);
  if(!record||!token.isOwner||!active())return;
  const grapple=grappleFor(token.document);
  if(grapple?.target.token===token.document.uuid)return ui.notifications!.warn("A held token moves with its grappler.");
  await token.document.update({x:record.start.x,y:record.start.y,elevation:record.start.elevation,[flag]:{...record,spent:0,last:null,hidden:true}} as never,{pneumaMovementReset:true,pneumaMoveDelta:-record.spent*metersPerSpace()} as never);
}
function metersPerSpace(){const units=String(canvas.scene?.grid.units??"").toLowerCase();return Number(canvas.scene?.grid.distance??2)*(["ft","feet","foot"].includes(units)?0.3048:1);}
interface Display {container:PIXI.Container;marker:PIXI.Graphics;hud:HTMLDivElement;label:HTMLInputElement;run:HTMLSpanElement;reset:HTMLButtonElement;markerKey?:string;stateKey?:string}
const displays=new Map<Token,Display>();
function clear(token:Token){const display=displays.get(token);if(display){display.container.destroy({children:true});display.hud.remove();displays.delete(token);}}
function draw(token:Token,previewRecord?:MoveRecord){
  const original=(token as Token & {_original?:Token})._original;
  const doc=original?.document??token.document;
  if(!active()){clear(token);return;}
  const context=movementTurn(doc);
  if(!token.visible||!token.actor||(!game.user?.isGM&&!token.actor.hasPlayerOwner)||!context){clear(token);return;}
  const record=previewRecord??(token.isPreview?nextRecord(token,doc,{x:token.document.x,y:token.document.y}):currentMovement(doc,context));
  if(!record||record.hidden){clear(token);return;}
  // Native HUD HTML lives outside Token's restricted PIXI hit area and follows canvas pan/zoom.
  const host=canvas.hud?.element[0]??document.getElementById("hud");
  if(!host)return;
  let display=displays.get(token);
  if(!display){
    const container=new PIXI.Container();container.name="pneuma-movement";
    const marker=new PIXI.Graphics();container.addChild(marker);token.addChild(container);
    const hud=document.createElement("div");hud.className="placeable-hud pneuma-movement-hud";
    const run=document.createElement("span");run.className="control-icon pneuma-movement-run";run.textContent="run";run.hidden=true;
    const controls=document.createElement("div");controls.className="pneuma-movement-controls";
    const attribute=document.createElement("div");attribute.className="attribute";
    const label=document.createElement("input");label.type="text";label.readOnly=true;label.tabIndex=-1;
    label.setAttribute("aria-label","Movement spent / maximum");attribute.append(label);
    const reset=document.createElement("button");reset.type="button";reset.className="control-icon";reset.textContent="Reset";
    reset.title="Return to starting position and clear movement spent";
    for(const type of ["pointerdown","mousedown","dblclick"])reset.addEventListener(type,event=>event.stopPropagation());
    reset.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();if(reset.disabled)return;reset.disabled=true;
      void resetMovement(token).catch(error=>ui.notifications!.error(String(error))).finally(()=>{reset.disabled=false;});
    });
    controls.append(reset,run);hud.append(attribute,controls);host.append(hud);display={container,marker,hud,label,run,reset};displays.set(token,display);
  }
  if(display.hud.parentElement!==host)host.append(display.hud);
  const perSpace=metersPerSpace(),entry=areaSettings().evadeMove?movementEntry(doc):undefined;
  const nativeWalk=foundry.utils.getProperty(token.actor,"system.derivedStats.walk.value");
  const maxMeters=Math.max(0,Number(nativeWalk??Number(foundry.utils.getProperty(token.actor,"system.stats.move.value"))*2)||0);
  const spent=entry?entry.current.spent/perSpace+(token.isPreview?record.spent-(currentMovement(doc)?.spent??0):0):record.spent;
  const n=(value:number)=>Number(value.toFixed(2));
  const top=token.tooltip?.text ? Math.min(-8,token.tooltip.y-token.tooltip.height-4) : -8;
  const stateKey=[spent,maxMeters,perSpace,token.x,token.y,token.w,token.h,top,token.isOwner,token.isPreview,record.start.x,record.start.y].join(":");
  if(display.stateKey===stateKey)return;
  display.stateKey=stateKey;
  const label=`${n(spent)} / ${n(maxMeters/perSpace)}`;
  if(display.label.value!==label)display.label.value=label;
  const running=spent*perSpace>maxMeters+0.001;
  const exceeded=spent*perSpace>maxMeters*2+0.001;
  display.hud.classList.toggle("is-running",running);
  display.hud.classList.toggle("is-over-budget",exceeded);
  display.run.hidden=!running;
  display.label.title=exceeded?"Exceeds Move + Run allowance. Run uses your Action.":running?"Run uses your Action for additional movement.":"Normal movement allowance.";
  display.hud.style.left=`${token.x+token.w/2}px`;
  display.hud.style.top=`${token.y+top}px`;
  display.reset.hidden=!token.isOwner||token.isPreview;
  const markerKey=[record.start.x-token.x,record.start.y-token.y,token.w,token.h].join(":");
  if(display.markerKey!==markerKey){display.markerKey=markerKey;display.marker.clear().lineStyle(2,0xffffff,0.45).drawRect(record.start.x-token.x,record.start.y-token.y,token.w,token.h);}
}
export function registerMovement(){
  game.settings!.register(MODULE,"movementTracking",{name:"Enable movement counters",hint:"GM world setting: enable or disable movement tracking, counters, start markers, and Reset controls for everyone. Player-owned counters are shared; NPC counters are GM-only. Does not block excess movement.",scope:"world",config:true,type:Boolean,default:true,onChange:()=>{for(const token of canvas.tokens?.placeables??[])draw(token);}});
  Hooks.on("preUpdateToken",(doc:TokenDocument,changes:Record<string,unknown>,options:Record<string,unknown>)=>{
    if(options.pneumaMovementReset||!active()||!("x" in changes||"y" in changes)||!doc.object)return;
    const from=committedPosition(doc);
    const to={x:Number(changes.x??from.x),y:Number(changes.y??from.y)};
    if(to.x===from.x&&to.y===from.y)return;
    const grapple=grappleFor(doc);
    if(options.pneumaAreaMove||grapple?.target.token===doc.uuid){
      // Resolved evasion / held-token placement is a new reset origin; never undo another workflow's movement.
      options.pneumaMoveDelta=0;
      const fresh=initial(doc);if(fresh)changes[flag]={...fresh,start:{...to,elevation:Number(changes.elevation??from.elevation)}};
      return;
    }
    const record=nextRecord(doc.object,doc,to);if(!record)return;
    options.pneumaMoveDelta=(record.spent-(currentMovement(doc)?.spent??0))*metersPerSpace();
    changes[flag]=record;
  });
  const queued=new Set<Token>();let scheduled=false;
  const enqueue=(token:Token)=>{
    queued.add(token);if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;const tokens=[...queued];queued.clear();for(const token of tokens)draw(token);});
  };
  let turns=new Map<string,string>();
  const refreshTurns=(force=false)=>{
    const next=new Map<string,string>(),combat=game.combat;
    if(combat?.started&&combat.scene?.id===canvas.scene?.id)combat.turns.forEach((c,index)=>{
      if(c.tokenId)next.set(c.tokenId,c.id+":"+String(Number(combat.round)-(Number(combat.turn)<index?1:0)));
    });
    for(const token of canvas.tokens?.placeables??[])if(force||turns.get(token.id!)!==next.get(token.id!))enqueue(token);
    turns=next;
  };
  Hooks.on("refreshToken",(token:Token)=>enqueue(token));
  Hooks.on("updateToken",(doc:TokenDocument)=>{if(doc.object)enqueue(doc.object);});
  Hooks.on("controlToken",(token:Token)=>enqueue(token));
  Hooks.on("updateActor",(actor:Actor)=>{for(const token of canvas.tokens?.placeables??[])if(token.actor?.uuid===actor.uuid)enqueue(token);});
  Hooks.on("updateUser",()=>refreshTurns(true));
  Hooks.on("destroyToken",(token:Token)=>{queued.delete(token);clear(token);});
  Hooks.on("canvasTearDown",()=>{queued.clear();turns.clear();for(const token of displays.keys())clear(token);});
  Hooks.on("canvasReady",()=>refreshTurns(true));
  Hooks.on("updateCombat",(combat:Combat,changes:Record<string,unknown>)=>{
    if(combat.id===game.combat?.id||"active" in changes)if(["round","turn","active","scene"].some(key=>key in changes))refreshTurns();
  });
  Hooks.on("deleteCombat",()=>refreshTurns(true));
  for(const hook of ["createCombatant","updateCombatant","deleteCombatant"])Hooks.on(hook,(participant:Combatant,changes:Record<string,unknown>={})=>{
    if(participant.parent?.id!==game.combat?.id)return;
    if(hook!=="updateCombatant"||["initiative","tokenId"].some(key=>key in changes))refreshTurns();
    const token=participant.token?.object;if(token)enqueue(token);
  });
  const clearCombat=(combat:Combat)=>{
    const gm=game.users?.filter(user=>user.active&&user.isGM).sort((a,b)=>a.id!.localeCompare(b.id!))[0];
    if(gm?.id!==game.user?.id)return;
    for(const doc of combat.scene?.tokens??[])if((foundry.utils.getProperty(doc,flag) as MoveRecord|undefined)?.combat===combat.id)void doc.update({[flag]:null} as never).catch(error=>ui.notifications!.error(String(error)));
  };
  Hooks.on("updateCombat",(combat:Combat,changes:Record<string,unknown>)=>{if("round" in changes&&!combat.started)clearCombat(combat);});
  Hooks.on("deleteCombat",clearCombat);
  Hooks.once("setup",()=>{
    CONFIG.Token.objectClass=class MovementToken extends CONFIG.Token.objectClass {
      protected override _onDragLeftStart(event:PIXI.FederatedEvent){super._onDragLeftStart(event);if(active())draw(this,currentMovement(this.document)??initial(this.document));}
      protected override _onDragEnd(){super._onDragEnd();draw(this);}
    };
  });
}
