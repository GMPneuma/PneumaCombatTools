import { primaryGM as electedGM } from "./shared.js";
import { masterStatuses, type StatusDefinition } from "./status-catalog.js";
import { groupStatusHUD } from "./status-hud.js";
import { nativeStatusIds as nativeIds, boundStatusActive, registerStatusSync, syncActorStatuses } from "./status-sync.js";
import { registerNativeWrapper } from "./native-wrappers.js";
import {isCombatToolsEffect,queueStatusToggle,applyCustomEffect,matchingStatusEffects,toggleExistingEffects,type EffectStatus} from "./custom-effects.js";
import {StatusManager,statusManagerRows} from "./status-manager.js";
import {validateStatusColor,registerStatusColors,refreshStatusColors,paintStatusMenu} from "./status-colors.js";
import {statusTemplates,nativeStatusItem,nativeEffectsForStatus} from "./status-sources.js";
const MODULE = "pneuma-combattools";
const creationNote = "Created by Pneuma Combat Tools.";
export function labelCombatEffects(actor:Actor,root:HTMLElement,manageEffect?:(event:MouseEvent)=>unknown):void {
  const effects=[...actor.effects,...Array.from(actor.items??[]).flatMap(item=>Array.from(item.effects))];
  const actorEffects=new Map<string,ActiveEffect>(effects.map(effect=>[effect.uuid,effect]));
  const owned=new Set(effects.filter(effect=>isCombatToolsEffect(effect,customStatuses())).map(effect=>effect.uuid));
  const labeled=owned;
  for (const row of Array.from(root.querySelectorAll<HTMLElement>(".effect[data-effect-id]"))) {
    const effect=actorEffects.get(row.dataset.effectId ?? "");
    const actions=row.querySelector(".effect-actions");
    // Earlier versions assigned the actor origin to module markers, exposing CPR's trash icon.
    if (!game.user?.isGM && effect?.parent===actor && effect.origin===actor.uuid && owned.has(effect.uuid))
      actions?.querySelector('[data-action="delete"]')?.remove();
    if (manageEffect && game.user?.isGM && actor.isOwner && effect?.parent===actor && (!effect.origin || effect.origin===actor.uuid)
      && actions && !actions.querySelector('[data-action="delete"]')) {
      const link=document.createElement("a");
      link.className="effect-control";
      link.dataset.action="delete";
      link.dataset.tooltip=game.i18n!.localize("CPR.characterSheet.rightPane.effects.delete");
      link.setAttribute("aria-label",link.dataset.tooltip);
      link.innerHTML='<i class="fas fa-trash-can"></i>';
      link.addEventListener("click",event=>{
        if (game.user?.isGM && actor.isOwner && effect.parent===actor && (!effect.origin || effect.origin===actor.uuid)) manageEffect(event);
      });
      actions.append(link);
    }
    if (!labeled.has(row.dataset.effectId ?? "")) continue;
    const name=row.querySelector(".effect-item > .text-semi");
    if (!name || name.querySelector(".pneuma-effect-author")) continue;
    const label=document.createElement("small");
    label.className="pneuma-effect-author";
    label.textContent=" (Combat Tools)";
    name.append(label);
  }
}
export interface CustomStatus extends EffectStatus {}
declare global { interface SettingConfig {
  "pneuma-combattools.customStatuses": CustomStatus[] | null;
  "pneuma-combattools.separateCustomStatuses": boolean;
} }
const jail: CustomStatus = { id: "pneuma-in-jail", name: "In Jail", img: "modules/pneuma-combattools/styles/in-jail.svg" };
export function validateCustomStatuses(rows: CustomStatus[]): CustomStatus[] {
  const ids = new Set(masterStatuses.map(status => status.id));
  const names = new Set(masterStatuses.map(status => status.name.toLowerCase()));
  return rows.map(row => {
    const name = String(row.name ?? "").trim(), img = String(row.img ?? "").trim();
    const id = String(row.id ?? "");
    if (!id || ids.has(id)) throw new Error("Custom status IDs must be unique.");
    if (!name || name.length > 80 || names.has(name.toLowerCase())) throw new Error("Enter a unique status name (up to 80 characters).");
    if (!img || /^(javascript|data):/i.test(img)) throw new Error("Choose a valid icon path.");
    ids.add(id); names.add(name.toLowerCase());
    const color=validateStatusColor(row.color);
    return { id, name, img, ...(row.effectUuid?{effectUuid:String(row.effectUuid)}:{}),...(color?{color}:{}) };
  });
}
function legacyMap(): CustomStatus[] {
  try {
    // Settings remain available after disabling the old module.
    const entry = game.settings!.storage.get("world")?.get("condition-lab-triggler.activeConditionMap");
    const value = entry?.value;
    const rows = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(rows) ? rows.map(row => ({ id: row.id, name: row.name, img: row.img ?? row.icon })) : [];
  } catch { return []; }
}
export function customStatuses(): CustomStatus[] {
  const saved = game.settings!.get(MODULE, "customStatuses");
  if (saved !== null) return saved;
  const known = new Set(masterStatuses.map(status => status.id));
  const imported = legacyMap().filter(row => row.id && row.name && row.img && !known.has(row.id)
    && !masterStatuses.some(status => status.name.toLowerCase() === row.name.toLowerCase()));
  if (!imported.some(row => row.name.toLowerCase() === "in jail")) imported.push(jail);
  return imported;
}
export function configuredStatuses(): StatusDefinition[] {
  return [...masterStatuses, ...customStatuses().map(status => ({ ...status, group: "custom" as const }))];
}
let moduleDefinitions = new Set<object>();
export function registeredNativeStatuses(){return CONFIG.statusEffects.filter(status=>!moduleDefinitions.has(status));}
export function installStatusList(): void {
  const native = CONFIG.statusEffects.filter(status=>!moduleDefinitions.has(status));
  nativeIds.clear();
  const added = configuredStatuses().filter(status=>{
    const source = native.find(effect=>effect.id===status.id) ?? native.find(effect=>
      effect.id===status.name.toLowerCase() || (effect.name && game.i18n!.localize(effect.name).toLowerCase()===status.name.toLowerCase()));
    if (source && source.id!==status.id) nativeIds.set(status.id,source.id);
    return !source;
  }).map(status=>({id:status.id,name:status.name,img:status.img,description:creationNote,flags:{[String(MODULE)]:{createdByCombatTools:true}}}));
  moduleDefinitions = new Set(added);
  CONFIG.statusEffects = [...native,...added];
  canvas.tokens?.hud?.render();
  void refreshStatusColors().catch(error=>ui.notifications!.error("Status colors: "+(error as Error).message));
}
export function registerCyberpunkStatuses(): void {
  // Sheet toggles and batch updates also remove module instances when disabled.
  Hooks.on("updateActiveEffect",(effect:ActiveEffect,changes:{disabled?:boolean},_options:object,userId:string)=>{
    const actor=effect.parent instanceof Actor?effect.parent:effect.parent instanceof Item?effect.parent.parent:null;
    if(changes.disabled!==true||userId!==game.user?.id||!(actor instanceof Actor)||!effect.disabled||!isCombatToolsEffect(effect,customStatuses()))return;
    void effect.delete().catch(error=>ui.notifications!.error("Remove Combat Tools effect: "+(error as Error).message));
  });
  registerStatusColors(async()=>(await statusManagerRows()).map(row=>({...row,aliases:[nativeIds.get(row.id)??row.id]})));
  Hooks.on("renderActorSheet",(sheet:ActorSheet & {manageEffect?:(event:MouseEvent)=>unknown},html:JQuery)=>{
    if (html[0]) labelCombatEffects(sheet.actor,html[0],sheet.manageEffect?.bind(sheet));
  });
  registerNativeWrapper(CONFIG.Actor.documentClass.prototype,"toggleStatusEffect",async function(wrapped,id,options = {}) {
    return queueStatusToggle(this,async()=>{
      const catalogId = Array.from(nativeIds).find(([,native])=>native===id)?.[0] ?? id;
      const nativeId = nativeIds.get(id) ?? id;
      if (options.overlay) return wrapped(nativeId,options);
      const configured=CONFIG.statusEffects.find(status=>status.id===nativeId);
      const custom=customStatuses().find(status=>status.id===catalogId);
      const template=statusTemplates()[catalogId];
      const definition=configured??custom??masterStatuses.find(s=>s.id===catalogId);
      const bound=boundStatusActive(this,catalogId);
      if (bound !== undefined) {
        await syncActorStatuses(this,[catalogId],false,options.active);
        return !!boundStatusActive(this,catalogId)||!!definition&&matchingStatusEffects(this,[nativeId,catalogId],definition.name??"").some(effect=>!effect.disabled&&!effect.isSuppressed&&!foundry.utils.getProperty(effect,"system.isSuppressed"));
      }
      if (definition) {
        const sources=matchingStatusEffects(this,[nativeId,catalogId],definition.name??"");
        if(sources.length)return toggleExistingEffects(sources,[nativeId,catalogId],options.active);
      }
      const effectUuid=template?.effectUuid??custom?.effectUuid;
      if(effectUuid&&definition&&options.active!==false){
        const catalog=masterStatuses.find(status=>status.id===catalogId);
        const native=catalog?await nativeStatusItem(catalog):null;
        const registeredChanges=foundry.utils.getProperty(configured??{},"changes") as unknown[]|undefined;
        if(registeredChanges?.length||(native&&catalog&&nativeEffectsForStatus(native,catalog).length))return wrapped(nativeId,options);
        await applyCustomEffect(this,{id:catalogId,name:definition.name??catalogId,img:definition.img??"icons/svg/aura.svg",effectUuid});return true;
      }
      return wrapped(nativeId,options);
    });
  },"MIXED");
  Hooks.on("preCreateActiveEffect",(effect:ActiveEffect)=>{
    if (effect.parent instanceof Actor && effect.description?.includes(creationNote))
      effect.updateSource({["flags."+MODULE+".createdByCombatTools"]:true});
    const statuses = new Set(effect.statuses);
    for (const [legacy,native] of nativeIds) if (statuses.has(native)) statuses.add(legacy);
    if (statuses.size!==effect.statuses.size) effect.updateSource({statuses:[...statuses]});
  });
  game.settings!.register(MODULE, "customStatuses", { scope: "world", config: false, type: Array, default: null, onChange: installStatusList });
  game.settings!.register(MODULE, "separateCustomStatuses", {
    scope: "world", config: false, type: Boolean, default: false,
    onChange: () => { canvas.tokens?.hud?.render(); }
  });
  game.settings!.register(MODULE,"statusTemplates",{scope:"world",config:false,type:Object,default:{}});
  game.settings!.registerMenu(MODULE, "customStatusesMenu", {
    name: "Status effects", label: "Configure status effects", hint: "System effects, system statuses, Combat Tools effects, and user effects.",
    icon: "fas fa-list", type: StatusManager, restricted: true,
  });
  Hooks.once("ready", async () => {
    const gm = electedGM();
    if (gm?.id === game.user?.id && game.settings!.get(MODULE, "customStatuses") === null)
      await game.settings!.set(MODULE, "customStatuses", customStatuses());
    installStatusList();
    if (game.user?.isGM && game.modules.get("condition-lab-triggler")?.active)
      ui.notifications!.warn("Combat Tools now supplies Cyberpunk statuses. Disable Condition Lab & Triggler to avoid competing status-list changes. Custom entries are preserved.");
  });
  Hooks.on("renderTokenHUD", (_hud: TokenHUD, html: JQuery) => {
    if (!html[0]) return;
    const statuses = configuredStatuses().map(s=>({...s,id:nativeIds.get(s.id)??s.id}));
    groupStatusHUD(html[0], statuses, game.settings!.get(MODULE, "separateCustomStatuses"));
    paintStatusMenu(html[0]);
  });
  registerStatusSync();
}
