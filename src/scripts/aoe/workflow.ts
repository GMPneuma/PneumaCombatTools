import {tokenEncounter,encounterRef,resolveEncounter,requireParticipants,type EncounterRef} from "../encounter.js";
import {attackCrossesSmoke} from "./smoke-obscuration.js";
import {halfArmorSelected, interactArmorSelected} from "../half-armor.js";
import {automaticNPCEvasion} from "../evasion-settings.js";
import {evasionBlocked} from "../injury-rules.js";
import {ammoProfile,instantId} from "../instant-catalog.js";
import {newInstant,instantContent,instantDone,handleInstant,bindInstantControls,type InstantState,type InstantRequest} from "../instant-effects.js";
import {createSmoke,registerSmoke} from "./smoke.js";
import {empDisabled} from "../emp-state.js";
import {masterStatuses} from "../status-catalog.js";
import {moveEvader,registerAreaMovement} from "./movement.js";
import { MODULE, areaSettings, registerAreaSettings, type AreaSettings } from "./settings.js";
import { areaKind, confirmAreaRoll, type AreaKind, type AreaWeapon } from "./weapon.js";
import { evadeAllowed, winsAreaDefense, type Area, type Point } from "./geometry.js";
import { placeArea, clippedPoints, templateData, areaCoverage } from "./placement.js";
import { requireCombatSocket } from "../socket-health.js";
import { smokeAttackDialog, diceJSON, nativeAPI, nativeCard, rollHidden, spendBonusLuck, type RollItem } from "../native-combat.js";
import { thrownRollItem, improvisedSource } from "../thrown-weapons.js";
import { getTable } from "../dv-hover.js";
import { parseDV } from "../dv-data.js";
import { resolutionSection, rollOutcomeClass, canRenderCombatCard } from "../card-structure.js";
import { rollDamage, damageContent, handleDamage, applyFromCard, type DamageState, type DamageRequest } from "../damage-flow.js";
import type { Exchange } from "../combat-resolution.js";
import { grappleWeaponBlocked } from "../grapple/state.js";
import { checkedLuck } from "../evasion-rules.js";

interface TargetRow {
  instant?:InstantState; uuid:string; actor:string; name:string; img:string; eligible:boolean;
  state:"waiting"|"rolling"|"hit"|"miss"|"other"; total?:number; html?:string;
  claim?:{nonce:string;user:string;expires:number}; damage?:DamageState; moved?:boolean; coverUp?:boolean; moveCost?:number;
}
export interface AreaAttack {
  ammoType?:string; smokeId?:string; scene:string; kind:AreaKind; area:Area; intended:Point; settings:AreaSettings; templateId?:string;
  phase:"scatter"|"responses"; exchange:Exchange; rows:TargetRow[]; special:boolean; areaHidden?:boolean; resolutionComplete?:boolean; effectsResolved?:boolean; attackDiceRevealed?:boolean;
}
interface Request {
  aoeType:"request"; id:string; user:string; message:string; action:string; target?:string;
  instantRequest?:InstantRequest; nonce?:string; total?:number; html?:string; area?:Area; damageRequest?:DamageRequest; hidden?:boolean; point?:Point;
}
interface Reply {aoeType:"reply";id:string;user:string;gm:string;error?:string}
const flag=(message:ChatMessage)=>foundry.utils.getProperty(message,`flags.${MODULE}.aoe`) as AreaAttack|undefined;
const gm=()=>game.users?.filter(u=>u.active&&u.isGM).sort((a,b)=>a.id.localeCompare(b.id))[0];
const owns=(actor:Actor,user:User=game.user!)=>user.isGM||actor.testUserPermission(user,"OWNER");
const esc=(s:unknown)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
const errors=(e:unknown)=>{console.error(MODULE,e);ui.notifications!.error((e as Error).message);};
async function actorAt(uuid:string) {const doc=await fromUuid(uuid) as TokenDocument|null;if(!doc?.actor)throw Error("Area attack token is unavailable.");return doc.actor;}
export function pixelsPerUnit() {
  const size=Number(canvas.scene?.grid.size), distance=Number(canvas.scene?.grid.distance);
  if(!(size>0&&distance>0))throw Error("Set a valid scene grid scale before using area attacks.");
  const units=String(canvas.scene?.grid.units??"").trim().toLowerCase();
  const factor=["ft","feet","foot"].includes(units)?0.3048:1;
  return size/(distance*factor);
}
export function makeArea(kind:AreaKind, source:Token, point:Point, s:AreaSettings):Area {
  const scale=pixelsPerUnit(),direction=Math.atan2(point.y-source.center.y,point.x-source.center.x);
  const shape=kind==="shell"?s.shellShape:kind==="explosive"?s.blastShape:s.suppressionShape;
  if(kind==="explosive")return {shape:s.blastShape,origin:canvas.grid!.getCenterPoint(point),direction:0,length:(s.blastShape==="circle"?s.blastRadius:s.blastSize)*scale,width:s.blastSize*scale};
  if(shape==="raw")return {shape:"circle",origin:source.center,direction:0,length:s.suppressionRange*scale,width:0};
  const size=(kind==="shell"?s.shellSize:s.suppressionSize)*scale;
  let origin:Point=source.center;
  if(kind==="shell") {
    const offset=Math.max(source.w,source.h)/2;
    origin={x:origin.x+Math.cos(direction)*offset,y:origin.y+Math.sin(direction)*offset};
  }
  if(shape==="square")return {shape:"square",origin:{x:origin.x+Math.cos(direction)*size/2,y:origin.y+Math.sin(direction)*size/2},
    wallOrigin:origin,direction,length:size,width:size};
  let length=(kind==="shell"?s.shellRange:s.suppressionRange)*scale;
  if(kind==="suppression"&&shape!=="cone")length=s.corridorMax>0?s.corridorMax*scale:Math.hypot(canvas.dimensions!.width,canvas.dimensions!.height);
  return {shape:shape==="cone"?"cone":"ray",origin,direction,length,
    width:(kind==="shell"?s.shellWidth:s.suppressionWidth)*Number(canvas.scene!.grid.size),
    angle:kind==="shell"?s.shellAngle:s.suppressionAngle};
}
function targets(data:AreaAttack):TargetRow[] {
  if(canvas.scene?.id!==data.scene)throw Error("Open the original scene to collect area targets.");
  if(data.ammoType==="smoke")return [];
  const covered=areaCoverage(data.area);
  return (canvas.tokens?.placeables??[]).filter(t=>t.actor && !["container","blackIce","demon"].includes(String(t.actor.type))
    && (data.kind==="explosive"||t.document.uuid!==data.exchange.attacker)
    && covered({x:t.x,y:t.y,width:t.w,height:t.h})
    ).map(t=>({
      ...(instantId(data.ammoType)&&data.ammoType!=="incendiary"?{instant:newInstant(data.ammoType,t.actor!.uuid,t.name??"",rowEncounter(data,t.document.uuid))} : {}),
      uuid:t.document.uuid,actor:t.actor!.uuid,name:t.name??"",img:t.document.texture.src??"",
      eligible:!evasionBlocked(t.actor!)&&evadeAllowed(Number(foundry.utils.getProperty(t.actor!,"system.stats.ref.value")),data.settings.evade),
      state:data.kind==="shell" && data.exchange.total<=13?"miss":"waiting",
    }));
}
function rowEncounter(data:AreaAttack,uuid:string):EncounterRef {return encounterRef(resolveEncounter(data.exchange),data.scene,[data.exchange.attacker,uuid]);}
const btn=(action:string,icon:string,title:string,target="")=>`<button type="button" data-aoe-action="${action}" data-aoe-target="${esc(target)}" title="${esc(title)}" aria-label="${esc(title)}"><i class="fas ${icon}" aria-hidden="true"></i></button>`;
const awaitingResponses=(data:AreaAttack)=>data.phase==="scatter"||data.rows.some(r=>["waiting","rolling"].includes(r.state));
export function areaContent(data:AreaAttack):string {
  const waiting=awaitingResponses(data),profile=ammoProfile(data.ammoType);
  let attackHTML="";
  if(!waiting){
    const native=new DOMParser().parseFromString(data.exchange.html,"text/html");
    native.querySelectorAll('[data-action="rollDamage"]').forEach(button=>button.remove());
    attackHTML=native.body.innerHTML;
  }
  const attack=waiting?"<p>Attack rolled — awaiting responses.</p>":`<div class="pneuma-aoe-attack">${attackHTML}</div>`;
  const rows=data.rows.map(r=>`<div role="listitem" class="pneuma-aoe-target" data-aoe-row="${esc(r.uuid)}" data-state="${r.state}" style="--pneuma-ammo-color:${profile?.color??"#d44a40"}">
    <img src="${esc(r.img)}" alt="" width="24" height="24"><span class="pneuma-aoe-name">${esc(r.name)}</span><span class="pneuma-aoe-response">
    ${r.state==="waiting" ? (data.kind==="suppression"?btn("roll","fa-brain","Concentration",r.uuid):btn("roll","fa-person-running","Evade",r.uuid))
      +(data.settings.coverUp&&data.kind!=="suppression"?btn("other","fa-shield","Cover Up: Prone, double SP and ablation",r.uuid):"")+(data.kind==="suppression"?"":btn("decline","fa-xmark","Don't Evade",r.uuid))
      : esc(r.state==="hit"?(data.kind==="suppression"?"Suppressed: Move to cover; Run if needed":r.coverUp?"Cover Up · Prone · SP ×2 / ablation ×2":"Hit"):r.state==="miss"?"Avoided":r.state==="rolling"?"Rolling…":"Cover Up — GM review")}
    ${["waiting","hit"].includes(r.state)&&!r.damage?btn("exclude","fa-user-slash","GM: exclude target (cover / not on foot)",r.uuid):""}
    ${r.state==="miss"&&!r.damage?btn("forcehit","fa-crosshairs","GM: override as affected",r.uuid):""}
    ${r.state==="other"?btn("hit","fa-check","GM: affected",r.uuid)+btn("miss","fa-xmark","GM: unaffected",r.uuid):""}
    ${r.state==="rolling"?btn("reset","fa-unlock","GM: release unfinished response",r.uuid):""}
    ${r.state==="miss"&&data.kind!=="suppression"&&r.total!==undefined&&!r.moved?btn("move","fa-person-walking","Move outside AoE",r.uuid):""}
    ${r.state==="hit"&&data.exchange.damage?.result ? btn("apply","fa-bolt",r.damage?.recordedApplied?"Damage applied":"Apply shared damage (Shift: options)",r.uuid):""}
    ${r.damage&&["review","applying"].includes(r.damage.status)?btn("damageResolved","fa-check-double","GM: mark resolved after checking damage",r.uuid):""}
    ${r.moved&&r.moveCost?`<span>Move: ${r.moveCost.toFixed(1)}m</span>`:""}</span></div>${r.html?`<div class="pneuma-aoe-defense ${rollOutcomeClass(r.state==="miss")}">${r.html}</div>`:""}
    ${r.state==="hit"&&r.instant?instantContent(r.instant,r.uuid):""}
    `).join("");
  const applications=data.rows.flatMap(r=>r.damage?.applications??[]).join("");
  return `<section class="rollcard pneuma-aoe-card" data-state="${data.phase==="scatter"?"scatter":waiting?"waiting":"resolved"}"><div class="rollcard-top"><div class="cpr-block"><h3>${esc(data.exchange.title)}${profile?" · "+esc(profile.name):""}</h3></div></div>
    ${resolutionSection("attack",attack)}
    ${resolutionSection("result",data.phase==="scatter"?"<div class='pneuma-aoe-reposition'><strong>Missed — choose the landing point</strong><p>The gray area marks the original aim and is inactive.</p><p>GM: place the new blast center inside that square. Targets are determined after placement.</p></div>"+btn("scatter","fa-crosshairs","Place landing point"): `<div role="list" class="pneuma-aoe-targets">${rows||"<p>No tokens in the area.</p>"}</div>`)}
    <div class="pneuma-aoe-actions">${btn("show",data.areaHidden?"fa-eye":"fa-eye-slash",data.areaHidden?"Show attack area":"Hide attack area")}${data.phase==="responses"?btn("add","fa-user-plus","GM: add selected token (manual coverage override)"):""}
    ${data.kind!=="suppression"&&data.phase!=="scatter"&&!data.special&&!data.exchange.damage?btn("damage","fa-droplet","Roll shared damage"):""}
    ${data.exchange.damage?.status==="rolling"?btn("damageReset","fa-unlock","GM: release unfinished damage roll"):""}</div>
    ${data.special&&!profile&&!data.effectsResolved?btn("effectsResolved","fa-check-double","GM: mark manual effects resolved"):""}
    ${data.special&&!profile?"<p>Special ammunition: resolve its effects manually. Grenade-specific effects are not automated yet.</p>":""}
    ${data.ammoType==="smoke"?"<p>Smoke: 1 minute.</p>"+(data.smokeId?btn("removeSmoke","fa-cloud","GM: remove smoke"):""):""}
    ${data.kind==="explosive"?"<p>Cover and terrain: GM resolves durability. GM: exclude targets protected by cover that survives the damage.</p>":""}
    ${data.exchange.damage?damageContent(data.exchange,"roll"):""}
    ${applications?`<div class="pneuma-damage-applications pneuma-aoe-applications">${applications}</div>`:""}</section>`;
}
function rowExchange(data:AreaAttack,row:TargetRow):Exchange {
  return {...data.exchange,coverUp:!!row.coverUp,defender:row.uuid,defenderActor:row.actor,defenderName:row.name,hit:row.state==="hit",
    damage:row.damage??(data.exchange.damage?.result?{...data.exchange.damage,status:"rolled",applications:[],recordedApplied:false}:undefined)};
}
function complete(data:AreaAttack):boolean {
  if(data.phase!=="responses"||data.rows.some(r=>["waiting","rolling","other"].includes(r.state)))return false;
  if(data.exchange.damage?.status==="rolling")return false;
  return data.rows.every(r=>r.state==="miss"
    ? data.kind==="suppression"||r.total===undefined||!!r.moved
    : data.kind==="suppression"||(data.ammoType==="smoke"?!!data.smokeId:r.instant?(instantDone(r.instant)&& (data.ammoType!=="incendiary"||!!r.damage?.recordedApplied)):data.special?!!data.effectsResolved:r.damage?.status==="applied"&&!!r.damage.recordedApplied));
}
async function save(message:ChatMessage,data:AreaAttack) {
  if(data.ammoType==="smoke"&&data.phase==="responses"&&!data.smokeId) {
    const scene=game.scenes!.get(data.scene) as Scene|undefined;if(!scene)throw Error("Smoke scene unavailable.");
    data.smokeId=await createSmoke(scene,data.area,message.id!,resolveEncounter(data.exchange)??null);
  }
  const reveal=data.attackDiceRevealed===false&&!awaitingResponses(data);
  if(reveal)data.attackDiceRevealed=true;
  const resolved=complete(data);
  if(resolved&&!data.resolutionComplete){data.areaHidden=true;await syncTemplate(message,data);}
  data.resolutionComplete=resolved;
  await message.update({content:areaContent(data),[`flags.${MODULE}.aoe`]:data} as Parameters<ChatMessage["update"]>[0]);
  // Persist first: later saves and chat rerenders must never repeat the animation.
  if(reveal)void revealAttackDice(data).catch(error=>console.warn(MODULE,"Area attack dice display failed",error));
}
async function revealAttackDice(data:AreaAttack):Promise<void> {
  if(!data.exchange.dice.length)return;
  const {Dice}=await nativeAPI();
  for(const json of data.exchange.dice)await Dice.handle3dDice(Roll.fromJSON(json) as Roll,data.exchange.rollMode);
}
const pending=new Map<string,{resolve:()=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
let queue:Promise<unknown>=Promise.resolve();
export async function handleAreaRequest(req:Request) {
  if(game.user?.id!==gm()?.id)throw Error("An active GM is required.");
  const message=game.messages!.get(req.message) as ChatMessage|undefined, user=game.users!.get(req.user) as User|undefined;
  const saved=message&&flag(message);
  if(!message||!saved||!user)throw Error("Area attack is unavailable.");
  const data=foundry.utils.deepClone(saved);
  const combat=resolveEncounter(data.exchange);
  if(combat&&req.target)requireParticipants(combat,[req.target]);
  const row=data.rows.find(r=>r.uuid===req.target);
  if(req.action==="instant") {
    if(!row?.instant||row.state!=="hit"||!req.instantRequest||data.phase!=="responses")throw Error("Instant effect unavailable.");
    await handleInstant(row.instant,req.instantRequest,user,()=>save(message,data),data.exchange.rollMode);return;
  }
  if(req.action==="removeSmoke") {
    if(!user.isGM||data.ammoType!=="smoke")throw Error("GM only.");
    const scene=game.scenes!.get(data.scene) as Scene|undefined;
    if(data.smokeId&&scene?.templates.has(data.smokeId))await scene.deleteEmbeddedDocuments("MeasuredTemplate",[data.smokeId]);return;
  }
  if(req.action==="show") {
    if(!user.isGM)throw Error("Only the GM can show or hide the attack area.");
    if(typeof req.hidden!=="boolean")throw Error("Choose whether to show or hide the area.");
    data.areaHidden=req.hidden;
    // A deliberate reveal of a completed card must survive later saves.
    data.resolutionComplete=complete(data);
    await syncTemplate(message,data);await save(message,data);return;
  }
  if(req.action==="effectsResolved") {
    if(!user.isGM||!data.special||data.phase!=="responses"||data.rows.some(r=>["waiting","rolling","other"].includes(r.state)))throw Error("GM: resolve all responses first.");
    data.effectsResolved=true;await save(message,data);return;
  }
  if(req.action==="add") {
    if(!user.isGM||!req.target||data.phase==="scatter")throw Error("GM only.");
    const token=await fromUuid(req.target) as TokenDocument|null;
    if(!token?.actor||token.parent?.id!==data.scene)throw Error("Select a token in the attack scene.");
    if(row)return;
    data.effectsResolved=false;
    data.rows.push({...(instantId(data.ammoType)&&data.ammoType!=="incendiary"?{instant:newInstant(data.ammoType,token.actor.uuid,token.name??"",rowEncounter(data,token.uuid))} : {}),uuid:token.uuid,actor:token.actor.uuid,name:token.name??"",img:token.texture.src??"",eligible:!evasionBlocked(token.actor)&&evadeAllowed(Number(foundry.utils.getProperty(token.actor,"system.stats.ref.value")),data.settings.evade),state:"waiting"});
    await save(message,data);return;
  }
  if(req.action==="scatter"){
    if(!user.isGM||data.phase!=="scatter"||!req.area||canvas.scene?.id!==data.scene)throw Error("Only the GM can place a missed blast in its original scene.");
    const p=req.area.origin, half=data.settings.blastSize*pixelsPerUnit()/2;
    if(Math.abs(p.x-data.intended.x)>half||Math.abs(p.y-data.intended.y)>half)throw Error("Landing point must be inside the intended blast square.");
    data.area={...data.area,origin:p,wallOrigin:p};data.phase="responses";data.rows=targets(data);await syncTemplate(message,data);await save(message,data);return;
  }
  if(req.action==="damage"){
    if(!req.damageRequest||data.kind==="suppression"||data.special||data.phase==="scatter")throw Error("Damage is unavailable.");
    if(req.target) {
      if(!row||row.state!=="hit"||!["damageApply","damageResolved"].includes(req.damageRequest.action))throw Error("Select an affected target.");
      if(req.damageRequest.targetUuid && req.damageRequest.targetUuid!==row.uuid)throw Error("Damage target changed.");
      const exchange=rowExchange(data,row);
      await handleDamage(req.damageRequest,user,exchange,async()=>{row.damage=exchange.damage;
        if(data.ammoType==="incendiary"&&row.damage?.recordedApplied&&!row.instant) {
          row.instant=newInstant("incendiary",row.actor,row.name,rowEncounter(data,row.uuid));
          if(!row.damage.penetrated){row.instant.state="skipped";row.instant.summary="No penetrating damage";}
        }
        await save(message,data);});
    } else {
      if(!["damageClaim","damageRelease","damageCommit","damageReset","damageStatuses"].includes(req.damageRequest.action))throw Error("Invalid shared damage action.");
      await handleDamage(req.damageRequest,user,data.exchange,()=>save(message,data));
    }
    return;
  }
  if(!row||data.phase!=="responses"||!owns(await actorAt(row.uuid),user))throw Error("Only this target's owner or GM can respond.");
  if(data.kind!=="suppression"&&["claim","commit","move"].includes(req.action)){
    const blocked=evasionBlocked(await actorAt(row.uuid));if(blocked)throw Error(blocked);
    row.eligible=evadeAllowed(Number(foundry.utils.getProperty(await actorAt(row.uuid),"system.stats.ref.value")),data.settings.evade);
  }
  if(req.action==="move") {
    if(row.state!=="miss"||row.total===undefined||data.kind==="suppression")throw Error("Target did not evade.");
    if(row.moved)return;
    if(canvas.scene?.id!==data.scene||!req.point||![req.point.x,req.point.y].every(Number.isFinite))throw Error("Open the attack scene and select a destination.");
    const token=canvas.tokens!.placeables.find(t=>t.document.uuid===row.uuid);if(!token)throw Error("Target unavailable.");
    const point=canvas.grid!.getCenterPoint(req.point);
    if(areaCoverage(data.area)({x:point.x-token.w/2,y:point.y-token.h/2,width:token.w,height:token.h}))throw Error("Move completely outside the affected area.");
    if(token.checkCollision(point,{origin:token.center,type:"move",mode:"any"}))throw Error("That move crosses a blocking wall.");
    row.moveCost=await moveEvader(token,point,!!data.settings.evadeMove,!!data.settings.evadeBorrow,message.id!+":"+row.uuid,rowEncounter(data,row.uuid));
    row.moved=true;await save(message,data);return;
  }
  if(req.action==="forcehit"){if(!user.isGM||row.state!=="miss"||row.damage||row.instant&&row.instant.state!=="pending")throw Error("GM only.");row.state="hit";data.effectsResolved=false;
  } else if(req.action==="exclude") { if(!user.isGM||!["waiting","hit"].includes(row.state)||row.damage||row.instant&&!["pending","failed"].includes(row.instant.state))throw Error("GM only; damage or effect already started.");row.state="miss";
  } else if(req.action==="reset"){
    if(!user.isGM)throw Error("GM only.");row.state="waiting";delete row.claim;
  } else if(["hit","miss"].includes(req.action)){
    if(!user.isGM||row.state!=="other")throw Error("GM review is required.");row.state=req.action as "hit"|"miss";
  } else if(req.action==="claim") {
    if(row.state==="rolling"&&row.claim&&row.claim.expires<Date.now()){row.state="waiting";delete row.claim;}
    if(row.state!=="waiting"||!req.nonce||data.kind!=="suppression"&&!row.eligible)throw Error("This response is unavailable.");
    row.state="rolling";row.claim={nonce:req.nonce,user:user.id!,expires:Date.now()+120000};
  } else if(req.action==="release"||req.action==="commit") {
    if(row.claim?.nonce!==req.nonce||row.claim?.user!==user.id)throw Error("Response reservation expired.");
    if(req.action==="release"){row.state="waiting";delete row.claim;}
    else {
      if(!Number.isFinite(req.total)||typeof req.html!=="string")throw Error("Invalid defense roll.");
      row.total=req.total;row.html=req.html;
      row.state=winsAreaDefense(req.total!,data.exchange.total,data.kind==="suppression"?true:data.kind==="shell"?true:false)?"miss":"hit";
      delete row.claim;
    }
  } else if(req.action==="other"||req.action==="decline") {
    if(row.state!=="waiting"||req.action==="other"&&(data.kind==="suppression"||!data.settings.coverUp||!areaSettings().coverUp)||req.action==="decline"&&data.kind==="suppression")throw Error("This response is unavailable.");
    if(req.action==="other") {
      const actor=await actorAt(row.uuid),prone=masterStatuses.find(s=>s.name==="Prone")!;
      if(!Array.from(actor.effects).some(e=>!e.disabled&&e.statuses.has(prone.id)))await actor.createEmbeddedDocuments("ActiveEffect",[{name:prone.name,img:prone.img,statuses:[prone.id],changes:[]}]);
      row.coverUp=true;
    }
    row.state="hit";
  }
  else throw Error("Unknown area response.");
  await save(message,data);
}
function send(message:string,action:string,extra:Partial<Request>={}) {
  requireCombatSocket();const authority=gm();if(!authority)throw Error("An active GM must be connected for area attacks.");
  const req:Request={...extra,aoeType:"request",id:foundry.utils.randomID(),user:game.user!.id,message,action};
  if(authority.id===game.user!.id){const next=queue.catch(()=>{}).then(()=>handleAreaRequest(req));queue=next;return next;}
  return new Promise<void>((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(req.id);reject(Error("Area response was not confirmed by the GM."));},30000);
    pending.set(req.id,{resolve,reject,timer});game.socket!.emit(`module.${MODULE}`,req);
  });
}
const starting=new Set<string>();
export async function startAreaAttack(source:Token,target:Token,itemId:string,mode:string) {
  const actor=source.actor, original=actor?.items.get(itemId) as AreaWeapon|undefined;
  if(!actor||!original||!owns(actor)||starting.has(actor.uuid))return;
  const kind=areaKind(original,mode);if(!kind)return;
  requireCombatSocket();if(!gm())throw Error("An active GM is required for area attacks.");
  if(String(original.type)!=="ammo"&&grappleWeaponBlocked(actor,original))throw Error("Grappled characters cannot use weapons requiring two hands.");
  const ammoType=String(String(original.type)==="ammo"?foundry.utils.getProperty(original,"system.type")??"":original._getLoadedAmmoProp?.("type")??"");
  const variety=String(original.type)==="ammo"?"grenade":String(original._getLoadedAmmoProp?.("variety")??(foundry.utils.getProperty(original,"system.weaponType")==="rocketLauncher"?"rocket":"grenade"));
  const profile=kind==="explosive"?ammoProfile(ammoType,variety):undefined;
  if(ammoType==="smart"&&profile&&!actor.items.some(i=>String(i.type)==="cyberware"&&i.name?.toLowerCase().includes("targeting scope")&&!!(foundry.utils.getProperty(i,"system.isInstalledInActor")??foundry.utils.getProperty(i,"system.isInstalled"))&&!empDisabled(i)))throw Error("Smart rockets require installed, operational Targeting Scope cyberware.");
  starting.add(actor.uuid);
  try {
    const scene=canvas.scene!.id!,s=areaSettings();
    const combat=tokenEncounter(scene,[source.document.uuid]);
    const encounter=encounterRef(combat,scene,[source.document.uuid]);
    const sourcePosition={x:source.x,y:source.y};
    const area=await placeArea(p=>makeArea(kind,source,p,ammoType==="smoke"?{...s,blastShape:"square",blastSize:10}:s),target.center,
      kind==="shell"?"Aim the shell area in front of the attacker.":kind==="suppression"?"Aim suppressive fire.":"Place the blast center.",profile?.color);
    if(!area||canvas.scene?.id!==scene)return;
    const validate=()=>{const current=resolveEncounter(encounter);if(current&&ammoType!=="smoke")requireParticipants(current,(canvas.tokens?.placeables??[]).filter(t=>t.actor&&!['container','blackIce','demon'].includes(String(t.actor.type))&&areaCoverage(area)({x:t.x,y:t.y,width:t.w,height:t.h})).map(t=>t.document.uuid));};
    validate();
    let item:RollItem=original, thrownSource:object|undefined;
    if(String(original.type)==="ammo"){
      const snapshot=await improvisedSource() as {name:string;system:Record<string,unknown>};
      snapshot.name=original.name??"Grenade";snapshot.system={...snapshot.system,damage:"6d6",
        dvTable:"DV Grenade Launcher",installedItems:{list:[original.id]},hasInstalled:true};
      thrownSource=snapshot;item=thrownRollItem(snapshot,actor);
    }
    let roll=item.createRoll(kind==="suppression"?"suppressive":"attack",actor);
    const ammoOK=()=>String(original.type)==="ammo"?Number(foundry.utils.getProperty(original,"system.amount"))>0:!item.hasAmmo||item.hasAmmo(roll);
    if(!ammoOK())throw Error(kind==="suppression"?"Suppressive fire requires 10 bullets in the magazine.":"No ammunition available.");
    let dv:number|undefined=kind==="shell"?13:undefined;
    if(kind==="explosive"){
      const distance=canvas.grid!.measurePath([source.center,area.origin],{}).distance * Number(canvas.scene!.grid.size) / Number(canvas.scene!.grid.distance) / pixelsPerUnit();
      if(String(original.type)==="ammo"&&distance>25)throw Error("Thrown grenades have a maximum range of 25m/yd.");
      dv=parseDV((await getTable(String(foundry.utils.getProperty(item,"system.dvTable"))))?.getResultsForRoll(distance)[0]?.text);
      if(dv===undefined)throw Error("No native ranged DV table is available for this distance.");
    }
    if(!await smokeAttackDialog(roll,actor,item,{ctrlKey:false,metaKey:false,type:"pneuma-area"},attackCrossesSmoke(source.center,kind==="explosive"?area.origin:target.center)))return;
    if(canvas.scene?.id!==scene||source.x!==sourcePosition.x||source.y!==sourcePosition.y||!owns(actor)||actor.items.get(itemId)!==original||areaKind(original,mode)!==kind||!ammoOK())throw Error("The weapon, scene, ownership or ammunition changed.");
    if(String(original.type)!=="ammo"&&grappleWeaponBlocked(actor,original))throw Error("Grappled characters cannot use weapons requiring two hands.");
    checkedLuck(Number(foundry.utils.getProperty(actor,"system.stats.luck.value")),0,roll.luck);
    const currentAmmo=String(String(original.type)==="ammo"?foundry.utils.getProperty(original,"system.type")??"":original._getLoadedAmmoProp?.("type")??"");
    if(currentAmmo!==ammoType)throw Error("Ammunition changed during targeting. Start the attack again.");
    const blastFormula=kind==="explosive"?item.createRoll("damage",actor,{damageType:"attack"}).formula:undefined;
    validate();
    roll=await confirmAreaRoll(item,roll);await spendBonusLuck(actor,roll.luck);
    if(String(original.type)==="ammo")await original.update({"system.amount":Number(foundry.utils.getProperty(original,"system.amount"))-1} as Parameters<Item["update"]>[0]);
    await rollHidden(roll);roll.entityData={actor:actor.id!,token:source.id!,item:itemId,tokens:[]};
    let firstAttackHTML="",firstAttackDice:string[]=[];
    if(profile&&ammoType==="smart"&&dv!==undefined&&roll.resultTotal<=dv&&dv-roll.resultTotal<=4) {
      firstAttackHTML=await nativeCard(roll);firstAttackDice=diceJSON(roll);
      const path="/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js";
      const native=await import(path) as {CPRRoll:new(title:string,formula:string)=>import("../native-combat.js").NativeRoll & {additionalMods:unknown[]}};
      const retry=new native.CPRRoll("Smart rocket — second chance","1d10");retry.addMod([{value:10,source:"Smart ammunition"}]);
      if(await retry.handleRollDialog({type:"pneuma-smart",ctrlKey:false,metaKey:false},actor,item)) {
        retry.formula="1d10";retry.mods=[{value:10,source:"Smart ammunition"}];retry.additionalMods=[];
        checkedLuck(Number(foundry.utils.getProperty(actor,"system.stats.luck.value")),0,retry.luck);
        await spendBonusLuck(actor,retry.luck);await rollHidden(retry);roll=retry;
      } else {firstAttackHTML="";firstAttackDice=[];}
    }
    const title=(game.settings!.get(MODULE,"hideAttackWeapon")?"Area attack":original.name??"Area attack")+(kind==="suppression"?" — Suppressive Fire":kind==="shell"?" — Shells":" — Blast");
    roll.rollTitle=title;
    const exchange:Exchange={...encounter,attacker:source.document.uuid,attackerName:source.name??"",defender:source.document.uuid,defenderActor:actor.uuid,defenderName:source.name??"",
      ranged:true,category:"Ranged",title,total:roll.resultTotal,html:(firstAttackHTML?"<div class=\"pneuma-smart-first\">"+firstAttackHTML+"</div>":"")+await nativeCard(roll),dice:[...firstAttackDice,...diceJSON(roll)],dv,
      state:"resolved",hit:true,weaponId:itemId,attackMode:"attack",weaponType:String(foundry.utils.getProperty(original,"system.weaponType")),
      criticalMethod:kind==="explosive"?(String(original.type)!=="ammo"&&foundry.utils.getProperty(original,"system.weaponType")==="rocketLauncher"?"Rocket":"Grenade"): "Ranged",
      location:"body",...(kind==="shell"?{damageFormula:"3d6"}:{}),rollMode:game.settings!.get("core","rollMode")??"roll",...(thrownSource?{thrownSource}: {})};

    const data:AreaAttack={scene,kind,area,...(profile?{ammoType}:{}),intended:area.origin,settings:s,exchange,rows:[],attackDiceRevealed:false,
      phase:kind==="explosive"&&roll.resultTotal<=dv!?"scatter":"responses",
      special:kind==="explosive"&&(profile?!profile.damaging:!!ammoType&&!["basic","armorPiercing"].includes(ammoType))};
    if(kind==="explosive"){exchange.areaAmmo={type:ammoType,variety};exchange.damageFormula=blastFormula;}
    if(data.phase==="responses")data.rows=targets(data);
    const messageData={content:areaContent(data),speaker:ChatMessage.getSpeaker({actor,token:source.document}),flags:{[MODULE]:{aoe:data}}} as Parameters<typeof ChatMessage.applyRollMode>[0];
    ChatMessage.applyRollMode(messageData,exchange.rollMode as "roll");await ChatMessage.create(messageData);
  } finally {starting.delete(actor.uuid);}
}
async function respond(message:ChatMessage,data:AreaAttack,row:TargetRow,automatic=false) {
  const nonce=foundry.utils.randomID();await send(message.id!,"claim",{target:row.uuid,nonce});
  let committed=false;
  try {
    const actor=await actorAt(row.uuid), name=data.kind==="suppression"?"Concentration":"Evasion";
    const item=actor.items.find(i=>String(i.type)==="skill"&&i.name?.toLowerCase()===name.toLowerCase()) as RollItem|undefined;
    if(!item)throw Error(name+" skill is missing.");
    let roll=item.createRoll("skill",actor);
    if(data.kind!=="suppression"&&data.settings.evadePenalty)roll.addMod([{value:data.settings.evadePenalty,source:"Area evasion homebrew"}]);
    if(automatic){if(!automaticArea(actor,data))throw Error("Automatic area evasion requires RAW rules.");roll.luck=0;}
    else if(!await roll.handleRollDialog({ctrlKey:false,metaKey:false,type:"pneuma-area"},actor,item))return;
    checkedLuck(Number(foundry.utils.getProperty(actor,"system.stats.luck.value")),0,roll.luck);
    if(data.kind!=="suppression"){const blocked=evasionBlocked(actor);if(blocked)throw Error(blocked);}
    roll=await item.confirmRoll(roll);await spendBonusLuck(actor,roll.luck);await roll.roll();
    roll.entityData={actor:actor.id!,token:row.uuid.split(".").at(-1)!,item:item.id!,tokens:[]};
    await send(message.id!,"commit",{target:row.uuid,nonce,total:roll.resultTotal,html:await nativeCard(roll)});committed=true;
  } finally {if(!committed)await send(message.id!,"release",{target:row.uuid,nonce});}
}
async function moveOutside(message:ChatMessage,data:AreaAttack,row:TargetRow) {
  if(canvas.scene?.id!==data.scene)throw Error("Open the attack scene first.");
  const token=canvas.tokens!.placeables.find(t=>t.document.uuid===row.uuid);if(!token||!owns(token.actor!))return;
  const chosen=await placeArea(p=>({shape:"square",origin:canvas.grid!.getCenterPoint(p),direction:0,length:token.w,width:token.h}),token.center,"Choose a position outside the blast.");
  if(!chosen)return;
  const box={x:chosen.origin.x-token.w/2,y:chosen.origin.y-token.h/2,width:token.w,height:token.h};
  if(areaCoverage(data.area)(box))throw Error("The entire token must be outside the blast.");
  if(token.checkCollision(chosen.origin,{origin:token.center,type:"move",mode:"any"}))throw Error("That move crosses a blocking wall.");
  await send(message.id!,"move",{target:row.uuid,point:chosen.origin});
}

async function syncTemplate(message:ChatMessage,data:AreaAttack) {
  const scene=game.scenes!.get(data.scene) as Scene|undefined;if(!scene)return;
  const values={...templateData(data.area,scene),fillColor:data.phase==="scatter"?"#737980":ammoProfile(data.ammoType)?.color??"#d44a40",borderColor:data.phase==="scatter"?"#737980":ammoProfile(data.ammoType)?.color??"#ffffff",hidden:!!data.areaHidden,user:message.author?.id??game.user!.id,
    flags:{[MODULE]:{areaMessage:message.id,areaShape:data.area}}};
  const old=data.templateId?scene.templates.get(data.templateId):undefined;
  if(old)await old.update(values as Parameters<MeasuredTemplateDocument["update"]>[0]);
  else {
    const created=await scene.createEmbeddedDocuments("MeasuredTemplate",[values as never]);
    data.templateId=created?.[0]?.id??undefined;
  }
}

function automaticArea(actor:Actor,data:AreaAttack) {
  const s=data.settings;
  return automaticNPCEvasion(actor)&&data.kind!=="suppression"&&s.evade==="raw"&&!s.evadePenalty&&!s.evadeMove&&!s.evadeBorrow&&!s.coverUp;
}
const autoRows=new Set<string>();
export async function automateArea(message:ChatMessage) {
  const data=flag(message);if(!data||data.phase!=="responses"||game.user?.id!==gm()?.id||autoRows.has(message.id!))return;
  autoRows.add(message.id!);
  try{
    for(const original of data.rows){
      const current=flag(message);const row=current?.rows.find(r=>r.uuid===original.uuid);
      if(!current||row?.state!=="waiting"||!row.eligible)continue;
      const actor=await actorAt(row.uuid);if(!automaticArea(actor,current)||evasionBlocked(actor))continue;
      await respond(message,current,row,true);
    }
  }finally{autoRows.delete(message.id!);}
}
export function registerAreaAttacks() {
  Hooks.on("updateChatMessage",(message:ChatMessage)=>{void automateArea(message).catch(errors);});
  registerAreaSettings();registerAreaMovement();registerSmoke();
  const refreshActors=new Set<string>();let refreshQueued=false;
  for(const hook of ["createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(hook,(doc:Item|ActiveEffect)=>{
    const parent=doc.parent,actor=parent instanceof Actor?parent:parent?.parent instanceof Actor?parent.parent:undefined;
    if(!actor)return;refreshActors.add(actor.uuid);if(refreshQueued)return;refreshQueued=true;
    requestAnimationFrame(()=>{
      refreshQueued=false;
      for(const message of game.messages??[]){const data=flag(message);if(message.visible&&(!message.blind||game.user?.isGM)&&data?.phase==="responses"&&data.rows.some(r=>refreshActors.has(r.actor)&&["waiting","rolling"].includes(r.state)))ui.chat?.updateMessage(message);}
      refreshActors.clear();
    });
  });
  Hooks.on("refreshMeasuredTemplate",(template:MeasuredTemplate)=>{
    const area=foundry.utils.getProperty(template.document,`flags.${MODULE}.areaShape`) as Area|undefined;
    if(!area||!template.template)return;
    // Native hidden templates remain visible to GMs; hide the whole area for everyone.
    template.visible=!template.document.hidden&&template.isVisible&&!template.hasPreview;
    const highlight=canvas.interface?.grid.getHighlightLayer(template.highlightId);
    if(highlight)highlight.visible=template.visible;
    if(!template.visible)return;
    const points=clippedPoints(area).map((n,i)=>n-(i%2?template.document.y:template.document.x));
    template.shape=new PIXI.Polygon(points);
    template.template.clear().lineStyle(2,Number(template.document.borderColor),0.8).beginFill(Number(template.document.fillColor),0).drawPolygon(points).endFill();
    template.highlightGrid();
  });
  Hooks.on("createChatMessage",(message:ChatMessage)=>{
    const data=flag(message);if(!data||game.user?.id!==gm()?.id)return;
    const next=queue.catch(()=>{}).then(async()=>{await syncTemplate(message,data);await save(message,data);});queue=next;void next.then(()=>automateArea(message)).catch(errors);
  });
  Hooks.on("deleteChatMessage",(message:ChatMessage)=>{
    const data=flag(message);if(!data?.templateId||game.user?.id!==gm()?.id)return;
    const scene=game.scenes!.get(data.scene) as Scene|undefined;
    if(scene?.templates.has(data.templateId))void scene.deleteEmbeddedDocuments("MeasuredTemplate",[data.templateId]).catch(errors);
  });
  Hooks.once("ready",()=>game.socket!.on(`module.${MODULE}`,(p:Request|Reply)=>{
    if(!p||!["request","reply"].includes(p.aoeType))return;
    if(p.aoeType==="reply"){
      if(p.user!==game.user!.id||p.gm!==gm()?.id)return;const wait=pending.get(p.id);if(!wait)return;
      clearTimeout(wait.timer);pending.delete(p.id);if(p.error)wait.reject(Error(p.error));else wait.resolve();
    } else if(game.user!.id===gm()?.id) {
      const reply=(error?:string)=>game.socket!.emit(`module.${MODULE}`,{aoeType:"reply",id:p.id,user:p.user,gm:game.user!.id,error});
      const next=queue.catch(()=>{}).then(()=>handleAreaRequest(p));queue=next;void next.then(()=>reply(),e=>reply((e as Error).message));
    }
  }));
  Hooks.on("renderChatMessage",async(message:ChatMessage,html:JQuery)=>{
    const data=flag(message);if(!data||!canRenderCombatCard(message))return;
    if(html[0])await bindInstantControls(html[0],scope=>data.rows.find(r=>r.uuid===scope)?.instant,(scope,instantRequest)=>send(message.id!,"instant",{target:scope,instantRequest}),data.exchange.rollMode);
    // Shared roll only: controls stay by targets; application results follow the roll.
    html.find<HTMLElement>('.pneuma-aoe-card > .pneuma-damage-result > [data-pneuma-section="damage-apply"], .pneuma-aoe-card > .pneuma-damage-result > .pneuma-resolution-recovery-slot').toArray().forEach(node=>node.remove());
    // Also update previously saved AoE cards without replacing their native dice nodes.
    html.find<HTMLElement>('.pneuma-aoe-attack [data-action="rollDamage"]').toArray().forEach(button=>button.remove());
    for(const button of html.find<HTMLButtonElement>("[data-aoe-action]").toArray()){
      const action=button.dataset.aoeAction!,row=data.rows.find(r=>r.uuid===button.dataset.aoeTarget);
      if(action==="damage"||action==="apply")button.innerHTML='<i class="fas '+(action==="damage"?"fa-droplet":"fa-bolt")+'" aria-hidden="true"></i>';
      if(action==="show") {
        if(!game.user!.isGM){button.remove();continue;}
        const label=data.areaHidden?"Show attack area":"Hide attack area";
        button.title=label;button.setAttribute("aria-label",label);
        button.innerHTML='<i class="fas '+(data.areaHidden?"fa-eye":"fa-eye-slash")+'" aria-hidden="true"></i>';
      }
      if(action==="other"&&!areaSettings().coverUp){button.remove();continue;}
      const actor=await actorAt(row?.uuid??data.exchange.attacker).catch(()=>null);
      const gmOnly=["removeSmoke","scatter","hit","miss","exclude","forcehit","add","reset","damageReset","damageResolved","effectsResolved"].includes(action);
      if(action!=="show"&&(!actor||!owns(actor)||gmOnly&&!game.user!.isGM)){button.remove();continue;}
      if(action==="roll"&&data.kind!=="suppression"&&row){
        const blocked=actor?evasionBlocked(actor):undefined;
        const eligible=actor?evadeAllowed(Number(foundry.utils.getProperty(actor,"system.stats.ref.value")),data.settings.evade):row.eligible;
        if(blocked||!eligible){button.disabled=true;button.title=blocked??"RAW evasion requires REF 8+.";}
      }
      if(action==="apply"&&(row?.damage?.recordedApplied||["review","applying"].includes(row?.damage?.status??"")))button.disabled=true;
      button.addEventListener("click",async event=>{
        event.preventDefault();event.stopPropagation();if(button.disabled)return;button.disabled=true;
        try {
          if(action==="show")await send(message.id!,"show",{hidden:!data.areaHidden});
          else if(action==="scatter"){
            if(canvas.scene?.id!==data.scene)throw Error("Open the attack scene first.");
            const area=await placeArea(p=>({...data.area,origin:canvas.grid!.getCenterPoint(p),wallOrigin:canvas.grid!.getCenterPoint(p)}),data.intended,"Place the new blast center inside the gray square. Gray = inactive original aim.",ammoProfile(data.ammoType)?.color);
            if(area)await send(message.id!,"scatter",{area});
          } else if(action==="add") {const selected=canvas.tokens?.controlled??[];if(selected.length!==1)throw Error("Select exactly one token to add.");await send(message.id!,"add",{target:selected[0]!.document.uuid});}
          else if(action==="roll"&&row)await respond(message,data,row);
          else if(action==="move"&&row)await moveOutside(message,data,row);
          else if(action==="damage")await rollDamage(message.id!,data.exchange,(a,extra)=>send(message.id!,"damage",{damageRequest:{...extra,action:a}}),event.shiftKey);
          else if(action==="apply"&&row)await applyFromCard(rowExchange(data,row),(a,extra)=>send(message.id!,"damage",{target:row.uuid,damageRequest:{...extra,action:a}}),event.shiftKey,row.uuid,"recorded",halfArmorSelected(event),interactArmorSelected(event));
          else if(action==="damageReset"||action==="damageResolved")await send(message.id!,"damage",{target:row?.uuid,damageRequest:{action}});
          else await send(message.id!,action,{target:row?.uuid});
        }catch(e){errors(e);}finally{button.disabled=false;}
      });
    }
  });
}

