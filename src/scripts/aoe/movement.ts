import {areaSettings,MODULE} from "./settings.js";
import type {Point} from "./geometry.js";
interface Movement {turn:string;spent:number;debt:number;escape?:{id:string;cost:number}}
const key="aoeMovement";
let queue:Promise<unknown>=Promise.resolve();
export function movementWork<T>(work:()=>Promise<T>):Promise<T>{const next=queue.catch(()=>{}).then(work);queue=next;return next;}
const authority=()=>game.users?.filter(u=>u.active&&u.isGM).sort((a,b)=>a.id.localeCompare(b.id))[0]?.id===game.user?.id;
export function movementEntry(token:TokenDocument) {
  const combat=game.combat;
  if(!combat?.started)return;
  const participant=combat.combatants.find(c=>c.token?.uuid===token.uuid);
  if(!participant)return;
  const index=combat.turns.findIndex(c=>c.id===participant.id);
  const turn=String(Number(combat.round)-(Number(combat.turn)<index?1:0));
  const walk=foundry.utils.getProperty(token.actor!,"system.derivedStats.walk.value");
  const budget=Math.max(0,walk!==undefined&&Number.isFinite(Number(walk))?Number(walk):Number(foundry.utils.getProperty(token.actor!,"system.stats.move.value"))*2||0);
  const saved=foundry.utils.getProperty(participant,`flags.${MODULE}.${key}`) as Movement|undefined;
  const current:Movement=saved?.turn===turn?{...saved}:{turn,spent:Math.min(saved?.debt??0,budget),debt:Math.max(0,(saved?.debt??0)-budget)};
  return {participant,budget,current,remaining:Math.max(0,budget-current.spent)};
}
export function chargeMovement(remaining:number,debt:number,budget:number,distance:number,borrow:boolean) {
  const shortage=Math.max(0,distance-remaining);
  if(shortage>0.001&&!borrow)throw Error("Insufficient MOVE to reach that position.");
  if(shortage+debt>budget+0.001)throw Error("That escape exceeds available MOVE plus next turn's MOVE.");
  return {spent:Math.min(remaining,distance),debt:debt+shortage};
}
export function distanceMoved(a:Point,b:Point):number {
  const units=String(canvas.scene?.grid.units??"").toLowerCase();
  return canvas.grid!.measurePath([a,b],{}).distance*(["ft","feet","foot"].includes(units)?0.3048:1);
}
/** The caller validates coverage/walls; token movement and its receipt share one update. */
export async function moveEvader(token:Token,point:Point,costs:boolean,borrow:boolean,receipt:string) {
  return movementWork(async()=>{
    const entry=movementEntry(token.document);
    if(costs&&!entry)throw Error("Start/select this token's combat to track evasion MOVE.");
    const prior=foundry.utils.getProperty(token.document,`flags.${MODULE}.aoeEscape`) as {id:string;cost:number}|undefined;
    if(prior?.id===receipt)return prior.cost;
    const reserved=entry?.current.escape?.id===receipt?entry.current.escape:undefined;
    const cost=reserved?.cost??(costs?distanceMoved(token.center,point):0);
    if(entry&&costs&&!reserved){
      const charge=chargeMovement(entry.remaining,entry.current.debt,entry.budget,cost,borrow);
      entry.current.spent+=charge.spent;entry.current.debt=charge.debt;entry.current.escape={id:receipt,cost};
      // Reserve first so an interrupted move cannot grant movement twice.
      await entry.participant.update({[`flags.${MODULE}.${key}`]:entry.current} as never);
    }
    await token.document.update({x:point.x-token.w/2,y:point.y-token.h/2,[`flags.${MODULE}.aoeEscape`]:{id:receipt,cost}} as never, {pneumaAreaMove:true} as never);
    return cost;
  });
}
export function movementHUD(actor:Actor):{id:string;text:string;detail:string}[] {
  if(!areaSettings().evadeMove)return [];
  const participant=game.combat?.combatants.find(c=>c.actor?.uuid===actor.uuid);
  if(!participant?.token)return [];
  const entry=movementEntry(participant.token);if(!entry)return [];
  const n=(v:number)=>Math.round(v*100)/100;
  return [{id:"aoe-move",text:`MOVE: ${n(entry.remaining)}m remaining${entry.current.debt?` · Next turn −${n(entry.current.debt)}m`:""}`,detail:"AoE movement homebrew. Tracks ordinary token movement and evasion; does not change the MOVE stat."}];
}
export function registerAreaMovement(){
  Hooks.on("preUpdateToken",(doc:TokenDocument,changes:Record<string,unknown>,options:Record<string,unknown>)=>{
    if(options.pneumaAreaMove||!areaSettings().evadeMove||!("x" in changes||"y" in changes))return;
    if(doc.object)options.pneumaAreaFrom={x:doc.object.center.x,y:doc.object.center.y};
  });
  Hooks.on("updateToken",(doc:TokenDocument,_changes:unknown,options:Record<string,unknown>)=>{
    if(!authority()||options.pneumaAreaMove)return;
    const start=options.pneumaAreaFrom as Point|undefined;if(!start||!doc.object||![start.x,start.y].every(Number.isFinite))return;
    const distance=typeof options.pneumaMoveDelta === "number" ? options.pneumaMoveDelta : distanceMoved(start,doc.object.center);
    void movementWork(async()=>{const entry=movementEntry(doc);if(entry){entry.current.spent=Math.max(0,entry.current.spent+distance);await entry.participant.update({[`flags.${MODULE}.${key}`]:entry.current} as never);}}).catch(e=>ui.notifications!.error(String(e)));
  });
  Hooks.on("updateCombat",(combat:Combat,changes:Record<string,unknown>)=>{
    if(!authority()||!areaSettings().evadeMove||!("round" in changes||"turn" in changes))return;
    if(!combat.started){void movementWork(async()=>{for(const participant of combat.combatants)await participant.update({[`flags.${MODULE}.${key}`]:null} as never);}).catch(e=>ui.notifications!.error(String(e)));return;}
    if(!combat.combatant?.token)return;
    const token=combat.combatant.token;
    void movementWork(async()=>{const entry=movementEntry(token);if(entry)await entry.participant.update({[`flags.${MODULE}.${key}`]:entry.current} as never);}).catch(e=>ui.notifications!.error(String(e)));
  });
}
