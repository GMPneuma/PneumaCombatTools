import { allActors, escapeHTML as esc } from "./shared.js";
import { registerEmpRefresh } from "./emp-refresh.js";
import { updateTouchesPath } from "./update-path.js";
import {actorEncounter,encounterRef,resolveEncounter,type EncounterRef} from "./encounter.js";
import {registerEmpSettings} from "./emp-settings.js";
import {applyEmpBehavior,empBehavior} from "./emp-behavior.js";
import {EMP_MODULE as MODULE, eligibleEmpItems, empGroup, empWeight, type EmpItem, randomEmp, disableLabel} from "./emp-rules.js";
import {frameMovementBlocked, empGM, empRequests, empRandomSelection, empSelectionPool, empWork, applyEmpSelection, finishEmp, reconcileEmp, installEmpNativeGuards, type EmpRequest} from "./emp-state.js";
import {requireCombatSocket} from "./socket-health.js";
declare global {interface SettingConfig {"pneuma-combattools.empImmunity":string}}

const report = (error:unknown) => ui.notifications!.error(error instanceof Error ? error.message : String(error));
let nativeReady: Promise<void> = Promise.resolve();
const pending = new Map<string,{resolve:()=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
interface Wire {empType:"select"|"reply"; id:string;combat:string;request:string;user:string;selected:string[];gm?:string;error?:string}
async function submit(combat:Combat, request:string, selected:string[]) {
  requireCombatSocket();
  if (!empGM()) throw Error("An active GM is required to apply EMP.");
  if (game.user!.isGM && empGM()?.id === game.user!.id) return empWork(() => applyEmpSelection(combat,request,selected,game.user!));
  const id=foundry.utils.randomID();
  await new Promise<void>((resolve,reject) => {
    const timer=setTimeout(()=>{pending.delete(id);reject(Error("EMP was not confirmed by the GM. The selection remains available to retry."));},10000);
    pending.set(id,{resolve,reject,timer});
    game.socket!.emit(`module.${MODULE}`,{empType:"select",id,combat:combat.id!,request,user:game.user!.id!,selected} satisfies Wire);
  });
}
export async function chooseEmp(combat:Combat,request:EmpRequest) {
  if (!combat.started || request.state !== "pending") return;
  const actor=await fromUuid(request.actor) as Actor|null;
  const chooser=request.sourceActor?await fromUuid(request.sourceActor) as Actor|null:actor;
  if (!actor || (!game.user!.isGM && (request.chooser !== "player" || !chooser?.isOwner))) return;
  const all=Array.from(actor.items) as unknown as (Item & EmpItem)[];
  const eligible=empSelectionPool(request,all);
  const random=empRandomSelection(request);
  const count=Math.min(request.count,eligible.length);
  if (!count && !request.selected) return ui.notifications!.warn("No eligible cyberware or carried electronics.");
  const groupSizes=new Map<string,number>();
  for(const item of eligible){const group=empGroup(item,all);groupSizes.set(group,(groupSizes.get(group)??0)+1);}
  const total=eligible.reduce((n,i)=>n+empWeight(i,request.mode),0);
  const visible=random&&!game.user!.isGM?[]:eligible;
  const rows=visible.map(item=>{
    const parent=request.method==="shortlist"&&!game.user!.isGM?undefined:all.find(i=>i.id===item.system.installedIn?.[0]);
    const odds=request.mode==="system"?1/groupSizes.size/groupSizes.get(empGroup(item,all))!:empWeight(item,request.mode)/total;
    return `<label class="pneuma-emp-choice"><input type="checkbox" name="item" value="${esc(item.id)}" ${random ? "disabled" : ""}> <span>${esc(item.name)}${parent?` <small>in ${esc(parent.name)}</small>`:""}${item.system.isFoundational?" <small>(foundational)</small>":""}${random?` <small>first draw ${(odds*100).toFixed(1)}%</small>`:""}</span></label>`;
  }).join("");
  const dialog=new Dialog({title:`${disableLabel(request.source)} — ${actor.name}`,content:`<form class="pneuma-emp-selection"><p>${random?"Randomly disable up to":"Choose"} ${count} item(s), ${request.seconds?"for "+request.seconds+" seconds":"until combat ends"}.</p><p>${request.policy.cascade?"Installed options also lose power with their host. Immunity excludes direct targets only.":"Only selected items will be disabled."}</p>${request.method==="shortlist"?"<p>Showing only "+eligible.length+" randomly offered component(s).</p>":""}${rows}</form>`,buttons:{apply:{label:random?"Draw and disable":"Disable selected",callback:html=>{
    const root=(html as JQuery)[0]!;
    const selected=Array.from(root.querySelectorAll<HTMLInputElement>('input[name="item"]:checked')).map(input=>input.value);
    if(!random&&!request.selected&&selected.length!==count){ui.notifications!.warn(`Choose exactly ${count} items.`);void chooseEmp(combat,request);return;}
    void submit(combat,request.id,selected).catch(report);
  }},cancel:{label:"Cancel"}},default:"cancel"},{width:460});
  dialog.render(true);
}
export async function createEmp(actor:Actor,options:Pick<EmpRequest,"count"|"chooser"|"mode"|"policy"> & Partial<Pick<EmpRequest,"source"|"sourceActor"|"seconds"|"origin">>, encounter?:Partial<EncounterRef>) {
  const combat=encounter?resolveEncounter(encounter):actorEncounter(actor);
  if (!game.user!.isGM||!combat?.started) throw Error("A GM must start combat before creating an EMP effect.");
  if (!Number.isInteger(options.count)||options.count<1||options.count>50) throw Error("EMP count must be between 1 and 50.");
  if(options.seconds!==undefined&&(!Number.isFinite(options.seconds)||options.seconds<=0))throw Error("Disablement duration must be positive.");
  const prior=options.origin?Object.values(empRequests(combat)).find(r=>r.origin===options.origin&&r.actor===actor.uuid):undefined;
  if(prior){if(prior.state==="pending"&&prior.chooser!=="player")await chooseEmp(combat,prior);return prior;}
  const request:EmpRequest={encounter:encounterRef(combat,encounter?.combatScene??combat.scene?.id,encounter?.combatTokens),...applyEmpBehavior(options,empBehavior()),id:foundry.utils.randomID(),actor:actor.uuid,state:"pending"};
  if(!eligibleEmpItems(Array.from(actor.items) as unknown as EmpItem[],request.policy,request.source).length){ui.notifications!.info("No eligible cyberware or electronics for "+disableLabel(request.source)+".");return;}
  if(request.method==="shortlist"){
    const all=Array.from(actor.items) as unknown as EmpItem[];
    request.offered=randomEmp(eligibleEmpItems(all,request.policy,request.source),all,request.count*2,request.mode,Math.random,!!request.policy.skipAffected&&request.policy.cascade).map(item=>item.id!);
  }
  const chooser=request.sourceActor?await fromUuid(request.sourceActor) as Actor|null:actor;
  await combat.update({[`flags.${MODULE}.empRequests.${request.id}`]:request});
  const recipients=game.users!.filter(u=>u.isGM||(request.chooser==="player"&&!!chooser?.testUserPermission(u,"OWNER"))).map(u=>u.id!);
  const message=await ChatMessage.create({content:`<div class="pneuma-emp-card"><strong>${esc(disableLabel(request.source))} — ${esc(actor.name)}</strong><p>${request.method==="shortlist"?"Player chooses from a saved shortlist":empRandomSelection(request)?"Random selection":request.chooser==="player"?(request.sourceActor?"Netrunner chooses":"Owner chooses"):"GM chooses"}: ${request.count} item(s). Disabled ${request.seconds?"for "+request.seconds+" seconds":"until combat ends"}.</p><button type="button" data-emp-select>Choose affected items</button></div>`,whisper:recipients,flags:{[MODULE]:{emp:{combat:combat.id,request:request.id}}}} as never);
  if(message)await combat.update({[`flags.${MODULE}.empRequests.${request.id}.message`]:message.id});
  if(request.chooser!=="player")await chooseEmp(combat,request);
  return request;
}
export function registerEmp() {
  registerEmpSettings();
  Hooks.on("preUpdateToken",(doc:TokenDocument,changes:Record<string,unknown>,_options:unknown,userId:string)=>{
    if(frameMovementBlocked(doc.actor,changes,!!game.users?.get(userId)?.isGM)){ui.notifications!.warn("Cannot move: Internal Frame disabled.");return false;}
  });
  registerEmpRefresh(report);
  game.settings!.register(MODULE,"empImmunity",{name:"EMP: immune items",hint:"GM-maintained list of exact item names or compendium source UUIDs, separated by semicolons. Excludes direct selection; installed options still lose power if their host is disabled.",scope:"world",config:false,type:String,default:""});
  Hooks.once("setup",()=>{nativeReady=installEmpNativeGuards();void nativeReady.catch(report);});
  Hooks.once("ready",()=>{
    const module=game.modules!.get(MODULE) as unknown as {api?:Record<string,unknown>};
    module.api={...module.api,emp:{create:createEmp}};
    game.socket!.on(`module.${MODULE}`,(wire:Wire)=>{
      if(wire?.empType==="select"&&empGM()?.id===game.user?.id){
        void empWork(async()=>{
          const combat=game.combats!.get(wire.combat) as Combat|undefined,user=game.users!.get(wire.user) as User|undefined;
          if(!combat||!user||!Array.isArray(wire.selected))throw Error("Invalid EMP selection.");
          await applyEmpSelection(combat,wire.request,wire.selected,user);
        }).then(()=>game.socket!.emit(`module.${MODULE}`,{...wire,empType:"reply",gm:game.user!.id}),error=>game.socket!.emit(`module.${MODULE}`,{...wire,empType:"reply",gm:game.user!.id,error:String(error.message??error)}));
      }else if(wire?.empType==="reply"&&wire.user===game.user?.id&&wire.gm===empGM()?.id){
        const entry=pending.get(wire.id);if(!entry)return;clearTimeout(entry.timer);pending.delete(wire.id);
        if(wire.error)entry.reject(Error(wire.error));else entry.resolve();
      }
    });
    void nativeReady.then(async()=> {
      if(empGM()?.id===game.user?.id)await empWork(reconcileEmp);
      for(const actor of allActors())if(actor.items.some(item=>!!foundry.utils.getProperty(item,"flags.pneuma-combattools.timedDisables")||foundry.utils.getProperty(item,`flags.${MODULE}.empCombats`)))actor.prepareData();
    }).catch(report);
  });
  Hooks.on("renderChatMessage",(message:ChatMessage,html:JQuery)=>{
    const ref=foundry.utils.getProperty(message,`flags.${MODULE}.emp`) as {combat:string;request:string}|undefined;
    if(!ref)return;
    const combat=game.combats?.get(ref.combat) as Combat|undefined,request=combat&&empRequests(combat)[ref.request];
    const button=html[0]?.querySelector<HTMLButtonElement>("[data-emp-select]");if(!button)return;
    button.dataset.gmOnly=String(request?.chooser!=="player");
    button.disabled=!combat?.started||!request||request.state!=="pending";
    html[0]?.querySelectorAll(".pneuma-emp-result").forEach(el=>el.remove());
    const names=request?.method==="shortlist"&&!game.user?.isGM?request.selectedNames:request?.affectedNames;
    if(request?.state==="applied"&&!names?.length){const result=document.createElement("p");result.className="pneuma-emp-result";result.textContent="No items disabled.";button.before(result);}
    if(request?.resistedNames?.length){const result=document.createElement("p");result.className="pneuma-emp-result";result.textContent="Hardened — unaffected: "+request.resistedNames.join(", ");button.before(result);}
    if(names?.length){const result=document.createElement("p");result.className="pneuma-emp-result";result.textContent="Disabled: "+names.join(", ");button.before(result);}
    if(button.disabled)button.textContent=combat?.started&&request?.state==="applied"?disableLabel(request.source)+" applied":"Combat ended";
    button.addEventListener("click",()=>{if(combat&&request)void chooseEmp(combat,request);});
  });
  const cardStates = new Map<string, Map<string, { message?: string; signature: string }>>();
  const snapshot = (combat: Combat) => new Map(Object.values(empRequests(combat)).map(request =>
    [request.id, { message: request.message, signature: JSON.stringify([combat.started, request]) }]));
  Hooks.once("ready", () => { for (const combat of game.combats ?? []) cardStates.set(combat.id!, snapshot(combat)); });
  Hooks.on("createCombat", (combat: Combat) => { cardStates.set(combat.id!, snapshot(combat)); });
  const refreshCards = (combat: Combat, deleted = false) => {
    const prior = cardStates.get(combat.id!) ?? new Map();
    const next = deleted ? new Map() : snapshot(combat);
    const messages = new Set<string>();
    for (const id of new Set([...prior.keys(), ...next.keys()])) {
      const old = prior.get(id), current = next.get(id);
      if (old?.signature === current?.signature) continue;
      if (old?.message) messages.add(old.message);
      if (current?.message) messages.add(current.message);
    }
    if (deleted) cardStates.delete(combat.id!); else cardStates.set(combat.id!, next);
    for (const id of messages) { const message = game.messages?.get(id); if (message) void ui.chat?.updateMessage(message as ChatMessage, false); }
  };
  Hooks.on("updateCombat",(combat:Combat,changes:Record<string,unknown>)=>{
    if (["round", "turn", "flags."+MODULE+".empRequests"].some(path => updateTouchesPath(changes,path))) refreshCards(combat);
    if(("round" in changes)&&!combat.started&&empGM()?.id===game.user?.id)void empWork(()=>finishEmp(combat)).catch(report);
  });
  Hooks.on("deleteCombat",(combat:Combat)=>{
    if(empGM()?.id===game.user?.id)void empWork(()=>finishEmp(combat,true)).catch(report);
    refreshCards(combat,true);
  });
}
