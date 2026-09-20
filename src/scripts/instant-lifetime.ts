import {masterStatuses} from "./status-catalog.js";
import {applyCombatStatus, syncActorStatuses} from "./status-sync.js";
import {empGM} from "./emp-state.js";
const M="pneuma-combattools", key="flags."+M+".instantLifetime";
interface Lifetime {kind:"injury"|"sleep"|"fire";expires?:number;lastTurn?:string}
const life=(doc:object)=>foundry.utils.getProperty(doc,key) as Lifetime|undefined;
const status=(name:string)=>{const s=masterStatuses.find(s=>s.name===name);if(!s)throw Error("Missing status: "+name);return s;};
const active=(e:ActiveEffect)=>!e.disabled;
/** Import the native injury only when absent. Repeated temporary injuries extend their own expiry. */
export async function temporaryInjury(actor:Actor,name:string) {
  const s=status(name),b=s.binding!;
  const matches=actor.items.filter(i=>String(i.type)==="criticalInjury"&&(i.name===b.itemName||foundry.utils.getProperty(i,"flags."+M+".statusId")===s.id||String(foundry.utils.getProperty(i,"_stats.compendiumSource")??foundry.utils.getProperty(i,"flags.core.sourceId")??"").endsWith("."+b.itemId)));
  if(matches.some(i=>!life(i)))return;
  const expires=game.time!.worldTime+60;
  if(matches.length){for(const i of matches)await i.update({[key]:{kind:"injury",expires}} as never);return;}
  const source=await game.packs!.get(b.pack)?.getDocument(b.itemId) as Item|undefined;
  if(!source)throw Error("Native "+name+" injury is unavailable.");
  const data=source.toObject();delete (data as {_id?:string})._id;
  foundry.utils.setProperty(data,key,{kind:"injury",expires});
  foundry.utils.setProperty(data,"flags."+M+".statusId",s.id);
  await actor.createEmbeddedDocuments("Item",[data] as never,{pneumaStatusSync:true} as never);
  await syncActorStatuses(actor);
}
const hpValues=new Map<string,number>();
export async function sleepTarget(actor:Actor) {
  hpValues.set(actor.uuid,Number(foundry.utils.getProperty(actor,"system.derivedStats.hp.value")));
  await applyCombatStatus(actor,status("Prone").id);
  const s=status("Unconscious"),matches=actor.effects.filter(e=>active(e)&&e.statuses.has(s.id));
  if(matches.some(e=>!life(e)))return;
  const expires=game.time!.worldTime+60;
  if(matches.length){for(const e of matches)await e.update({[key]:{kind:"sleep",expires}} as never);return;}
  await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Sleep — Unconscious",img:s.img,statuses:[s.id],changes:[],duration:{seconds:60,startTime:game.time!.worldTime},flags:{[M]:{instantLifetime:{kind:"sleep",expires}}}}] as never);
}
export async function igniteTarget(actor:Actor) {
  if(actor.effects.some(e=>active(e)&&life(e)?.kind==="fire"))return;
  const s=status("On Fire (Mild)");
  await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Incendiary — On Fire (Mild)",img:s.img,statuses:[s.id],changes:[],flags:{[M]:{instantLifetime:{kind:"fire"}}}}] as never);
}
export async function clearInstantCondition(actor:Actor,kind:"sleep"|"fire") {
  const ids=actor.effects.filter(e=>life(e)?.kind===kind).map(e=>e.id!);
  if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
}
export async function expireInstantActor(actor:Actor,now=game.time!.worldTime) {
  const items=actor.items.filter(i=>life(i)?.expires!==undefined&&life(i)!.expires!<=now).map(i=>i.id!);
  if(items.length){await actor.deleteEmbeddedDocuments("Item",items,{pneumaStatusSync:true} as never);await syncActorStatuses(actor);}
  const effects=actor.effects.filter(e=>life(e)?.expires!==undefined&&life(e)!.expires!<=now).map(e=>e.id!);
  if(effects.length)await actor.deleteEmbeddedDocuments("ActiveEffect",effects);
}
function actors():Actor[] {
  const all=new Map<string,Actor>();
  for(const a of game.actors??[])all.set(a.uuid,a);
  for(const s of game.scenes??[])for(const t of s.tokens)if(t.actor)all.set(t.actor.uuid,t.actor);
  return [...all.values()];
}
let work:Promise<unknown>=Promise.resolve();
const enqueue=(run:()=>Promise<unknown>)=>{if(game.user?.id!==empGM()?.id)return;work=work.catch(()=>{}).then(run);void work.catch(e=>ui.notifications!.error("Instant effects: "+(e as Error).message));};
export async function burnTurn(actor:Actor,turn:string) {
  const effects=actor.effects.filter(e=>active(e)&&life(e)?.kind==="fire");
  if(!effects.length||effects.some(e=>life(e)?.lastTurn===turn))return;
  // Persist the turn before HP writes so duplicate combat updates cannot burn twice.
  for(const e of effects)await e.update({[key+".lastTurn"]:turn} as never);
  const hp=Number(foundry.utils.getProperty(actor,"system.derivedStats.hp.value"));
  if(!Number.isFinite(hp))throw Error("Target HP is unavailable.");
  await actor.update({"system.derivedStats.hp.value":hp-2} as never);
}
export function registerInstantLifetimes() {
  type Turn={actor?:Actor;round:number;turn:number;started:boolean};
  const previous=new Map<string,Turn>();
  const rememberCombat=(c:Combat)=>previous.set(c.id!,{actor:c.combatant?.actor??undefined,round:c.round??0,turn:c.turn??0,started:c.started});
  const rememberHP=(a:Actor)=>hpValues.set(a.uuid,Number(foundry.utils.getProperty(a,"system.derivedStats.hp.value")));
  const refresh=()=>{
    for(const a of actors())rememberHP(a);
    for(const c of game.combats??[])rememberCombat(c);
    enqueue(async()=>{for(const a of actors())await expireInstantActor(a);});
  };
  Hooks.once("ready",refresh);Hooks.on("canvasReady",refresh);
  Hooks.on("createActor",rememberHP);Hooks.on("createToken",(t:TokenDocument)=>{if(t.actor)rememberHP(t.actor);});
  Hooks.on("deleteActor",(a:Actor)=>hpValues.delete(a.uuid));
  Hooks.on("updateWorldTime",()=>enqueue(async()=>{for(const a of actors())await expireInstantActor(a);}));
  // preUpdate is local to the initiating client. Cached values also cover remote writes received by the elected GM.
  Hooks.on("preUpdateActor",rememberHP);
  Hooks.on("updateActor",(a:Actor)=>{const before=hpValues.get(a.uuid),after=Number(foundry.utils.getProperty(a,"system.derivedStats.hp.value"));hpValues.set(a.uuid,after);if(before!==undefined&&after<before)enqueue(()=>clearInstantCondition(a,"sleep"));});
  Hooks.on("createCombat",rememberCombat);Hooks.on("preUpdateCombat",rememberCombat);
  Hooks.on("deleteCombat",(c:Combat)=>previous.delete(c.id!));
  Hooks.on("updateCombat",(c:Combat)=>{const p=previous.get(c.id!);rememberCombat(c);if(!p?.actor||!p.started||!c.started)return;
    if((c.round??0)>p.round||c.round===p.round&&(c.turn??0)>p.turn)enqueue(()=>burnTurn(p.actor!,c.id+":"+p.round+":"+p.turn));
  });
}
