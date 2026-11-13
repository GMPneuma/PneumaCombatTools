import { primaryGM as electedGM } from "./shared.js";
import { masterStatuses, type StatusDefinition } from "./status-catalog.js";
import { groupStatusHUD } from "./status-hud.js";
import { nativeStatusIds as nativeIds, boundStatusActive, registerStatusSync, syncActorStatuses } from "./status-sync.js";
import { registerNativeWrapper } from "./native-wrappers.js";
const MODULE = "pneuma-combattools";
const creationNote = "Created by Pneuma Combat Tools.";
const creationFlags = ["createdByCombatTools","syncMarker","suppressionSource","coverSource","grappleId","speedhealOperation","quickhackEffect","empStatus","frameConsequences","disabledLegPenalty"];
export function labelCombatEffects(actor:Actor,root:HTMLElement,manageEffect?:(event:MouseEvent)=>unknown):void {
  const actorEffects=new Map<string,ActiveEffect>(Array.from(actor.effects,effect=>[effect.uuid,effect]));
  const owned = new Set<string>(Array.from(actor.effects).filter(effect=>
    effect.description?.includes(creationNote) || creationFlags.some(key=>foundry.utils.getProperty(effect,"flags."+MODULE+"."+key))
  ).map(effect=>effect.uuid));
  for (const row of Array.from(root.querySelectorAll<HTMLElement>(".effect[data-effect-id]"))) {
    const effect=actorEffects.get(row.dataset.effectId ?? "");
    const actions=row.querySelector(".effect-actions");
    if (manageEffect && actor.isOwner && effect?.parent===actor && (!effect.origin || effect.origin===actor.uuid)
      && actions && !actions.querySelector('[data-action="delete"]')) {
      const link=document.createElement("a");
      link.className="effect-control";
      link.dataset.action="delete";
      link.dataset.tooltip=game.i18n!.localize("CPR.characterSheet.rightPane.effects.delete");
      link.setAttribute("aria-label",link.dataset.tooltip);
      link.innerHTML='<i class="fas fa-trash-can"></i>';
      link.addEventListener("click",event=>{
        if (actor.isOwner && effect.parent===actor && (!effect.origin || effect.origin===actor.uuid)) manageEffect(event);
      });
      actions.append(link);
    }
    if (!owned.has(row.dataset.effectId ?? "")) continue;
    const name=row.querySelector(".effect-item > .text-semi");
    if (!name || name.querySelector(".pneuma-effect-author")) continue;
    const label=document.createElement("small");
    label.className="pneuma-effect-author";
    label.textContent=" (Combat Tools)";
    name.append(label);
  }
}
export interface CustomStatus { id: string; name: string; img: string }
declare global { interface SettingConfig { "pneuma-combattools.customStatuses": CustomStatus[] | null } }
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
    return { id, name, img };
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
}
class CustomStatusForm extends FormApplication {
  constructor() { super({}); }
  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "pneuma-custom-statuses", title: "Custom Cyberpunk statuses", width: 620,
      template: "modules/" + MODULE + "/templates/custom-statuses.hbs", closeOnSubmit: true,
    });
  }
  override getData() { return { rows: customStatuses() }; }
  override activateListeners(html: JQuery) {
    super.activateListeners(html);
    html.find("[data-add-status]").on("click", () => {
      const row = document.createElement("div"); row.className = "pneuma-custom-status-row";
      row.dataset.statusId = "pneuma-custom-" + foundry.utils.randomID();
      row.innerHTML = '<label>Status name<input class="status-name" aria-label="Status name" placeholder="Name" required></label><label>Icon path<input class="status-img" aria-label="Icon path" placeholder="Icon path" required></label><button type="button" data-pick-icon title="Choose icon"><i class="fas fa-image"></i></button><button type="button" data-remove-status title="Remove"><i class="fas fa-trash"></i></button>';
      html.find(".pneuma-custom-status-rows").append(row);
    });
    html.on("click", "[data-remove-status]", event => { event.currentTarget.closest(".pneuma-custom-status-row")?.remove(); });
    html.on("click", "[data-pick-icon]", event => {
      const input = (event.currentTarget as HTMLElement).closest(".pneuma-custom-status-row")!.querySelector<HTMLInputElement>(".status-img")!;
      new FilePicker({ type: "image", current: input.value, callback: path => { input.value = path; } }).render(true);
    });
  }
  protected override async _updateObject() {
    if (!game.user?.isGM) return;
    const rows = Array.from(this.element[0]!.querySelectorAll<HTMLElement>(".pneuma-custom-status-row")).map(row => ({
      id: row.dataset.statusId!, name: row.querySelector<HTMLInputElement>(".status-name")!.value,
      img: row.querySelector<HTMLInputElement>(".status-img")!.value,
    }));
    try { await game.settings!.set(MODULE, "customStatuses", validateCustomStatuses(rows)); }
    catch (error) { ui.notifications!.error((error as Error).message); throw error; }
  }
}
export function registerCyberpunkStatuses(): void {
  Hooks.on("renderActorSheet",(sheet:ActorSheet & {manageEffect?:(event:MouseEvent)=>unknown},html:JQuery)=>{
    if (html[0]) labelCombatEffects(sheet.actor,html[0],sheet.manageEffect?.bind(sheet));
  });
  registerNativeWrapper(CONFIG.Actor.documentClass.prototype,"toggleStatusEffect",async function(wrapped,id,options = {}) {
    const catalogId = Array.from(nativeIds).find(([,native])=>native===id)?.[0] ?? id;
    const nativeId = nativeIds.get(id) ?? id;
    if (options.overlay) return wrapped(nativeId,options);
    if (boundStatusActive(this,catalogId) === undefined) {
      const definition = masterStatuses.find(s=>s.id===catalogId);
      if (!definition) return wrapped(nativeId,options);
      const sources = Array.from((this as Actor).allApplicableEffects()).filter(e=>e.parent instanceof Item &&
        (e.statuses.has(nativeId) || e.statuses.has(catalogId) || definition && e.name===definition.name));
      if (!sources.length) return wrapped(nativeId,options);
      const active = options.active ?? !sources.some(e=>!e.disabled&&!e.isSuppressed);
      for (const effect of sources) if (effect.disabled===active) await effect.update({disabled:!active});
      return active;
    }
    await syncActorStatuses(this,[catalogId],false,options.active);
    return !!boundStatusActive(this,catalogId);
  },"MIXED");
  Hooks.on("preCreateActiveEffect",(effect:ActiveEffect)=>{
    if (effect.parent instanceof Actor && effect.description?.includes(creationNote))
      effect.updateSource({["flags."+MODULE+".createdByCombatTools"]:true});
    if (effect.parent instanceof Actor && !effect.origin)
      effect.updateSource({origin:effect.parent.uuid});
    const statuses = new Set(effect.statuses);
    for (const [legacy,native] of nativeIds) if (statuses.has(native)) statuses.add(legacy);
    if (statuses.size!==effect.statuses.size) effect.updateSource({statuses:[...statuses]});
  });
  game.settings!.register(MODULE, "customStatuses", { scope: "world", config: false, type: Array, default: null, onChange: installStatusList });
  game.settings!.registerMenu(MODULE, "customStatusesMenu", {
    name: "Custom Cyberpunk statuses", label: "Edit custom statuses", hint: "Add names and icons to the Cyberpunk status list. Includes In Jail.",
    icon: "fas fa-list", type: CustomStatusForm, restricted: true,
  });
  Hooks.once("ready", async () => {
    const gm = electedGM();
    if (gm?.id === game.user?.id && game.settings!.get(MODULE, "customStatuses") === null)
      await game.settings!.set(MODULE, "customStatuses", customStatuses());
    installStatusList();
    if (game.user?.isGM && game.modules.get("condition-lab-triggler")?.active)
      ui.notifications!.warn("Combat Tools now supplies Cyberpunk statuses. Disable Condition Lab & Triggler to avoid competing status-list changes. Custom entries are preserved.");
  });
  Hooks.on("renderTokenHUD", (_hud: TokenHUD, html: JQuery) => { if (html[0]) groupStatusHUD(html[0], configuredStatuses().map(s=>({...s,id:nativeIds.get(s.id)??s.id}))); });
  registerStatusSync();
}
