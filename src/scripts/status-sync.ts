import {updateTouchesPath} from "./update-path.js";
import { masterStatuses, type StatusDefinition } from "./status-catalog.js";
const MODULE = "pneuma-combattools";
const options = { pneumaStatusSync: true, render: true };
type Bound = StatusDefinition & { binding: NonNullable<StatusDefinition["binding"]> };
const bound = masterStatuses.filter((s): s is Bound => !!s.binding);
export const nativeStatusIds = new Map<string,string>();
const generalByName = new Map(masterStatuses.filter(s=>!s.binding).map(s=>[s.name,s.id]));
const queues = new Map<string, Promise<void>>();
const sources = new Map<string, Promise<Item>>();
const flag = (doc: object, key: string) => foundry.utils.getProperty(doc, "flags." + MODULE + "." + key);
function matchingItems(actor: Actor, status: Bound): Item[] {
  const b = status.binding;
  return Array.from(actor.items).filter(item => {
    if (String(item.type) !== (b.kind === "injury" ? "criticalInjury" : "drug")) return false;
    const source = String(foundry.utils.getProperty(item, "_stats.compendiumSource")
      ?? foundry.utils.getProperty(item, "flags.core.sourceId") ?? "");
    return flag(item, "statusId") === status.id || (!!b.itemId&&source.endsWith("." + b.itemId)) || item.name === b.itemName;
  });
}
function sourceEffects(item: Item, status: Bound): ActiveEffect[] {
  return Array.from(item.effects).filter(effect => status.binding.kind === "injury" || status.binding.effectNames?.includes(effect.name ?? ""));
}
function live(effect: ActiveEffect): boolean {
  return !effect.disabled && !effect.isSuppressed && !(effect as ActiveEffect & { system?: { isSuppressed?: boolean } }).system?.isSuppressed;
}
function markers(actor: Actor, id: string): ActiveEffect[] {
  return Array.from(actor.effects).filter(effect => effect.statuses.has(id));
}
async function sourceItem(status: Bound): Promise<Item> {
  const key = status.binding.pack + "." + (status.binding.itemId||status.binding.itemName);
  let promise = sources.get(key);
  if (!promise) {
    promise = (async () => {
      const pack = game.packs!.get(status.binding.pack);
      // Resolve name-bound drugs from the installed system instead of inventing IDs.
      const id=status.binding.itemId||(await pack?.getIndex())?.find(row=>row.name===status.binding.itemName)?._id;
      const item = id?await pack?.getDocument(id):undefined;
      if (!item || String((item as Item).type) !== (status.binding.kind === "injury" ? "criticalInjury" : "drug"))
        throw new Error("Native " + status.name + " item is unavailable.");
      return item as Item;
    })();
    sources.set(key, promise); promise.catch(() => sources.delete(key));
  }
  return promise;
}
async function changeSource(actor: Actor, status: Bound, active: boolean): Promise<void> {
  let items = matchingItems(actor, status);
  if (!active) {
    for (const item of items) {
      const effects = sourceEffects(item, status).filter(live);
      if (effects.length) await item.updateEmbeddedDocuments("ActiveEffect", effects.map(e => ({_id:e.id!, disabled:true})), options);
      if (status.binding.kind === "injury" && !item.effects.size) await item.update({["flags."+MODULE+".hideStatusMarker"]:true} as never,options);
    }
    return;
  }
  if (!items.length) {
    const { _id, ...source } = (await sourceItem(status)).toObject();
    foundry.utils.setProperty(source, "flags." + MODULE + ".statusId", status.id);
    if (status.binding.kind === "effect") foundry.utils.setProperty(source, "system.amount", 0);
    items = await actor.createEmbeddedDocuments("Item", [source] as Parameters<Actor["createEmbeddedDocuments"]>[1], options) as Item[];
    if (!items.length) throw new Error("Could not add native " + status.name + ".");
  }
  if (status.binding.kind === "injury") {
    const disabledMarkers = markers(actor,status.id).filter(effect=>effect.disabled && flag(effect,"syncMarker"));
    if (disabledMarkers.length) await actor.updateEmbeddedDocuments("ActiveEffect",disabledMarkers.map(effect=>({_id:effect.id!,disabled:false})),options);
    for (const item of items) {
      if (flag(item,"hideStatusMarker")) await item.update({["flags."+MODULE+".hideStatusMarker"]:false} as never,options);
      if (flag(item,"quickFix")) continue;
      const effects = sourceEffects(item,status);
      if (effects.length && !effects.some(live)) await item.updateEmbeddedDocuments("ActiveEffect",effects.map(e=>({_id:e.id!,disabled:false})),options);
    }
  } else {
    // Reuse an already active variant, especially Synthcoke's addiction-aware primary.
    if (items.some(item => sourceEffects(item, status).some(live))) return;
    const item = items.find(candidate=>sourceEffects(candidate,status).length) ?? items[0]!;
    const effects = sourceEffects(item,status);
    const consumed = foundry.utils.getProperty(item,"system.consumed");
    const effect = effects.find(candidate=>candidate.name===consumed) ?? effects[0];
    if (!effect) throw new Error("Native " + status.name + " effect is unavailable.");
    await item.updateEmbeddedDocuments("ActiveEffect", [{ _id: effect.id!, disabled: false }], options);
  }
}
async function refreshMarkers(actor: Actor): Promise<void> {
  for (const effect of actor.allApplicableEffects?.() ?? []) {
    const id=generalByName.get(effect.name ?? "");
    if (!id || !(effect.parent instanceof Item)) continue;
    const tokenId=nativeStatusIds.get(id) ?? id;
    if (!effect.statuses.has(tokenId)) await effect.update({statuses:[...new Set([...effect.statuses,id,tokenId])]},options);
  }
  for (const status of bound) {
    const items = matchingItems(actor, status);
    // The native effect carries the token status itself. Keep its changes, duration and identity.
    for (const item of items) {
      const tokenId=nativeStatusIds.get(status.id) ?? status.id;
      const missing = sourceEffects(item,status).filter(effect => !effect.statuses.has(status.id) || !effect.statuses.has(tokenId));
      if (missing.length) await item.updateEmbeddedDocuments("ActiveEffect", missing.map(effect => ({
        _id:effect.id!, statuses:[...new Set([...effect.statuses,status.id,tokenId])]
      })),options);
    }
    const needsMarker = status.binding.kind === "injury" && items.some(item =>
      !item.effects.size && !flag(item,"quickFix") && !flag(item,"hideStatusMarker"));
    const existing = markers(actor,status.id);
    const mirrors = existing.filter(effect => flag(effect,"syncMarker") === true);
    if (needsMarker && !existing.length) {
      await actor.createEmbeddedDocuments("ActiveEffect", [{
        name:status.name, img:status.img, statuses:[status.id], changes:[],
        description:"Created by Pneuma Combat Tools.", flags:{[String(MODULE)]:{syncMarker:true}}
      }],options);
    } else if (!needsMarker && mirrors.length) {
      await actor.deleteEmbeddedDocuments("ActiveEffect",mirrors.map(e=>e.id!),options);
    }
  }
}
export function statusAuthority(actor: Actor): boolean {
  const users = game.users?.filter(user => user.active && (user.isGM || actor.testUserPermission(user, "OWNER"))) ?? [];
  users.sort((a, b) => Number(b.isGM) - Number(a.isGM) || a.id!.localeCompare(b.id!));
  return users[0]?.id === game.user?.id;
}
const refreshRequests = new Map<string, {promise: Promise<void>; dirty: boolean}>();
export function syncActorStatuses(actor: Actor, changedIds: string[] = [], initialize = false, requestedActive?: boolean): Promise<void> {
  // Only passive refreshes are merged. Explicit status toggles retain their order.
  if (changedIds.length || requestedActive !== undefined) return syncStatuses(actor, changedIds, initialize, requestedActive);
  const key = actor.uuid + ":" + initialize;
  const existing = refreshRequests.get(key);
  if (existing) { existing.dirty = true; return existing.promise; }
  const entry = {promise: Promise.resolve(), dirty: true};
  entry.promise = Promise.resolve().then(async () => {
    try {
      do { entry.dirty = false; await syncStatuses(actor, [], initialize); } while (entry.dirty);
    } finally { refreshRequests.delete(key); }
  });
  refreshRequests.set(key, entry); return entry.promise;
}
function syncStatuses(actor: Actor, changedIds: string[], initialize: boolean, requestedActive?: boolean): Promise<void> {
  if (!["character", "mook"].includes(String(actor.type))) return Promise.resolve();
  const previous = queues.get(actor.uuid) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const requested = changedIds;
    for (const id of new Set(requested)) {
      const status = bound.find(status => status.id === id);
      if (!status) continue;
      const active = requestedActive ?? !boundStatusActive(actor,id);
      try { await changeSource(actor, status, active); }
      catch (error) {
        // Restore icons from the actual item state if importing/removing the source failed.
        await refreshMarkers(actor);
        throw error;
      }
    }
    await refreshMarkers(actor);
  });
  queues.set(actor.uuid, next);
  void next.finally(() => { if (queues.get(actor.uuid) === next) queues.delete(actor.uuid); }).catch(() => {});
  return next;
}
/** Damage-card application awaits native mechanics before reporting completion. */
export async function applyCombatStatus(actor: Actor, id: string,combat?:Combat|null, endWithCombat=false): Promise<void> {
  const effects=()=>Array.from(actor.allApplicableEffects?.()??actor.effects??[]);
  const existing=new Set(effects().filter(live));
  if (bound.some(status => status.id === id)) await syncActorStatuses(actor, [id], false, true);
  else await actor.toggleStatusEffect(id, { active: true });
  const definition=masterStatuses.find(s=>s.id===id);
  if(endWithCombat&&combat&&definition?.binding?.kind!=="injury"&&definition?.name!=="Dead"&&definition?.name!=="Needs Stabilization") {
    const binding=bound.find(s=>s.id===id);
    const native=new Set(binding?matchingItems(actor,binding).flatMap(item=>sourceEffects(item,binding)):[]);
    for(const effect of effects().filter(e=>live(e)&&!existing.has(e)&&(e.statuses.has(id)||native.has(e))))
      await effect.update({["flags."+MODULE+".endWithCombat"]:combat.id} as never);
  }
}
export function registerStatusSync(): void {
  const previousStatuses = new WeakMap<ActiveEffect, string[]>();
  Hooks.on("preUpdateActiveEffect", (effect: ActiveEffect) => { previousStatuses.set(effect, [...effect.statuses]); });
  const notify = (actor: Actor, ids: string[] = [], initialize = false) => {
    if (!statusAuthority(actor)) return;
    void syncActorStatuses(actor, ids, initialize).catch(error => ui.notifications!.error("Status sync: " + (error as Error).message));
  };
  for (const hook of ["createItem", "updateItem", "deleteItem"]) {
    Hooks.on(hook, (item: Item, changesOrOptions: object, optionsOrUser: object | string) => {
      const context = hook === "updateItem" ? optionsOrUser : changesOrOptions;
      if (typeof context === "object" && "pneumaStatusSync" in context) return;
      if (hook === "updateItem" && !["name","type","effects","system","flags."+MODULE+".statusId","flags.core.sourceId","_stats.compendiumSource"].some(path=>updateTouchesPath(changesOrOptions,path))) return;
      if (item.parent instanceof Actor && (["criticalInjury", "drug"].includes(String(item.type)) || Array.from(item.effects??[]).some(e=>generalByName.has(e.name??"")))) notify(item.parent);
    });
  }
  for (const hook of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
    Hooks.on(hook, (effect: ActiveEffect, changesOrOptions: object, optionsOrUser: object | string) => {
      const context = hook === "updateActiveEffect" ? optionsOrUser : changesOrOptions;
      if (typeof context === "object" && "pneumaStatusSync" in context) return;
      if (hook==="deleteActiveEffect" && effect.parent instanceof Actor && flag(effect,"empStatus") && statusAuthority(effect.parent))
        void effect.parent.update({["flags."+MODULE+".hideEmpStatus"]:true} as never).catch(error=>ui.notifications!.error(String(error)));
      const ids = [...effect.statuses, ...(previousStatuses.get(effect) ?? [])].filter(id=>bound.some(status=>status.id===id));
      if (hook === "updateActiveEffect" && !["statuses","disabled","name","system.isSuppressed"].some(path=>updateTouchesPath(changesOrOptions,path))) {previousStatuses.delete(effect);return;}
      if (effect.parent instanceof Actor && hook === "deleteActiveEffect" && flag(effect,"syncMarker") && ids.length && statusAuthority(effect.parent)) {
        void dismissInjuryMarker(effect.parent,ids).catch(error=>ui.notifications!.error(String(error)));
      }
      if (effect.parent instanceof Item && effect.parent.parent instanceof Actor && (["criticalInjury","drug"].includes(String(effect.parent.type)) || generalByName.has(effect.name??""))) notify(effect.parent.parent);
      previousStatuses.delete(effect);
    });
  }
  const canvasActors = () => {
    for (const token of canvas.tokens?.placeables ?? []) if (token.actor) notify(token.actor, [], true);
  };
  Hooks.on("canvasReady", canvasActors);
  Hooks.on("createToken", (token: TokenDocument) => { if (token.actor) notify(token.actor, [], true); });
  Hooks.once("ready", () => {
    for (const actor of game.actors ?? []) notify(actor, [], true);
    canvasActors();
  });
}

/** Remember dismissal on the injury instance so passive refreshes and reloads respect it. */
export async function dismissInjuryMarker(actor:Actor, ids:string[]):Promise<void> {
  for (const status of bound.filter(s=>s.binding.kind==="injury" && ids.includes(s.id))) {
    for (const item of matchingItems(actor,status)) {
      if (!item.effects.size && !flag(item,"hideStatusMarker")) await item.update({["flags."+MODULE+".hideStatusMarker"]:true} as never,options);
    }
  }
}
export function boundStatusActive(actor:Actor,id:string):boolean | undefined {
  const status=bound.find(s=>s.id===id);
  if (!status || !["character","mook"].includes(String(actor.type))) return undefined;
  return matchingItems(actor,status).some(item => !flag(item,"quickFix") && (
    sourceEffects(item,status).some(live) || status.binding.kind==="injury" && !item.effects.size &&
    !flag(item,"hideStatusMarker") && !markers(actor,id).some(effect=>effect.disabled)
  ));
}
