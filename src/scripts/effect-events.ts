const MODULE="pneuma-combattools";
const received=new Set<string>();
type Exposure={effectEvent:"exposure";id:string;actor:string;kind:"poison"|"biotoxin"};
function receive(event:Exposure) {
  if(event?.effectEvent!=="exposure"||typeof event.id!=="string"||typeof event.actor!=="string"||!["poison","biotoxin"].includes(event.kind)||received.has(event.id))return;
  received.add(event.id);if(received.size>200)received.delete(received.values().next().value!);
  Hooks.callAll?.("pneumaCombatToolsExposure",event.actor,event.kind);
}
export function reportExposure(actor:Actor,kind:string) {
  if(kind!=="poison"&&kind!=="biotoxin")return;
  const event:Exposure={effectEvent:"exposure",id:foundry.utils.randomID(),actor:actor.uuid,kind};
  receive(event);game.socket?.emit("module."+MODULE,event);
}
export function registerEffectEvents(){Hooks.once("ready",()=>game.socket!.on("module."+MODULE,receive));}
