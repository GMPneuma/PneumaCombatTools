import {registerNativeWrapper} from "./native-wrappers.js";
import {EMP_MODULE as MODULE, empReferences, empDisabled, type EmpItem, type EmpPolicy, type EmpRandom, eligibleEmpItems, expandEmp, randomEmp} from "./emp-rules.js";
export {empDisabled};
export interface EmpRequest { id: string; actor: string; count: number; chooser: "gm" | "player" | "random"; mode: EmpRandom; policy: EmpPolicy; state: "pending" | "applied"; selected?: string[]; affectedNames?: string[]; message?: string }
export interface EmpRecord {actor: string; items: string[]}
const path = `flags.${MODULE}`;
export const empGM = () => game.users?.filter(u => u.active && u.isGM).sort((a,b) => a.id!.localeCompare(b.id!))[0];
export const empRequests = (combat: Combat) => foundry.utils.getProperty(combat, `${path}.empRequests`) as Record<string,EmpRequest> | undefined ?? {};
export const empRecords = (combat: Combat) => foundry.utils.getProperty(combat, `${path}.empRecords`) as Record<string,EmpRecord> | undefined ?? {};
let queue: Promise<unknown> = Promise.resolve();
export function empWork<T>(operation: () => Promise<T>): Promise<T> {const next = queue.catch(() => {}).then(operation); queue = next; return next;}
const itemsFor = (actor: Actor) => Array.from(actor.items) as unknown as (Item & EmpItem)[];
export async function applyEmpSelection(combat: Combat, requestId: string, selected: string[], user: User): Promise<void> {
  if (empGM()?.id !== game.user?.id || !combat.started) throw Error("EMP requires a started combat and an active GM.");
  const request = empRequests(combat)[requestId];
  if (!request) throw Error("EMP selection is unavailable.");
  const actor = await fromUuid(request.actor) as Actor | null;
  if (!actor || (!user.isGM && (request.chooser !== "player" || !actor.testUserPermission(user,"OWNER")))) throw Error("You cannot resolve this EMP selection.");
  if (request.state === "applied") return;
  const all = itemsFor(actor), eligible = eligibleEmpItems(all, request.policy);
  let chosen = request.selected ? all.filter(i => request.selected!.includes(i.id!)) : request.chooser === "random" ? randomEmp(eligible, all, request.count, request.mode) : eligible.filter(i => selected.includes(i.id!));
  if (!request.selected && (new Set(selected).size !== selected.length || (request.chooser !== "random" && (chosen.length !== Math.min(request.count,eligible.length) || chosen.length !== selected.length)))) throw Error(`Choose ${Math.min(request.count,eligible.length)} currently eligible items.`);
  if (!chosen.length) throw Error("No eligible cyberware or carried electronics.");
  // Save the exact draw before writes: retries must not select a second set of items.
  if (!request.selected) {
    await combat.update({[`${path}.empRequests.${request.id}.selected`]:chosen.map(i => i.id!)});
  }
  const affected = expandEmp(chosen,all,request.policy.cascade);
  await combat.update({[`${path}.empRecords.${request.id}`]:{actor:actor.uuid,items:affected.map(i => i.id!)}});
  for (const item of affected) {
    const refs = [...new Set([...empReferences(item),combat.id!])];
    await item.update({[`${path}.empCombats`]:refs,[`${path}.itemMarkers.emp`]:{label:"Disabled — EMP",description:"Disabled until combat ends."}} as never);
    if (String(item.type) === "cyberware" && item.system.isFoundational && ["cyberArm","cyberLeg"].includes(item.system.type ?? "")) {
      if (!actor.effects.some(e => foundry.utils.getProperty(e,`${path}.empItem`) === item.id && foundry.utils.getProperty(e,`${path}.empCombat`) === combat.id)) {
        await actor.createEmbeddedDocuments("ActiveEffect",[{name:`EMP: ${item.name} Disabled`,img:`systems/cyberpunk-red-core/icons/compendium/status/broken_${item.system.type === "cyberArm" ? "arm" : "leg"}.svg`,statuses:["pneuma-emp-limb"],changes:[],flags:{[MODULE]:{empItem:item.id,empCombat:combat.id}}}] as never);
      }
    }
  }
  await combat.update({[`${path}.empRequests.${request.id}.state`]:"applied",[`${path}.empRequests.${request.id}.affectedNames`]:affected.map(item=>item.name??"Item")});
}
async function removeReferences(actor: Actor, combatId: string, ids?: string[]) {
  for (const item of actor.items) {
    if (ids && !ids.includes(item.id!)) continue;
    if (!empReferences(item).includes(combatId)) continue;
    const refs = empReferences(item).filter(id => id !== combatId);
    await item.update({[`${path}.empCombats`]:refs,...(!refs.length ? {[`${path}.itemMarkers.-=emp`]:null} : {})} as never);
  }
  const effects = actor.effects.filter(e => foundry.utils.getProperty(e,`${path}.empCombat`) === combatId);
  if (effects.length) await actor.deleteEmbeddedDocuments("ActiveEffect",effects.map(e => e.id!));
}
export async function finishEmp(combat: Combat, deleted = false) {
  for (const record of Object.values(empRecords(combat))) {
    const actor = await fromUuid(record.actor) as Actor | null;
    if (actor) await removeReferences(actor,combat.id!,record.items);
  }
  if (!deleted) await combat.update({[`${path}.empRecords`]:null,[`${path}.empRequests`]:null} as never);
}
export async function reconcileEmp() {
  // One startup pass also cleans stale markers if a combat was deleted while this module was unavailable.
  const actors = new Map<string,Actor>();
  for (const actor of game.actors ?? []) actors.set(actor.uuid,actor);
  for (const scene of game.scenes ?? []) for (const token of scene.tokens) if (token.actor) actors.set(token.actor.uuid,token.actor);
  for (const actor of actors.values()) {
    const refs = new Set(Array.from(actor.items).flatMap(empReferences));
    for (const effect of actor.effects) {const id=foundry.utils.getProperty(effect,`${path}.empCombat`);if (typeof id === "string") refs.add(id);}
    for (const id of refs) if (!game.combats?.get(id)?.started) await removeReferences(actor,id);
  }
  for (const combat of game.combats ?? []) {
    if (!combat.started) {if (Object.keys(empRecords(combat)).length) await finishEmp(combat);continue;}
    for (const request of Object.values(empRequests(combat))) if (request.selected && request.state === "pending") await applyEmpSelection(combat,request.id,request.selected,game.user!);
  }
}
/** Reuse CPR suppression, preserving every native effect's disabled state and item installation. */
export async function installEmpNativeGuards() {
  const effect = CONFIG.ActiveEffect.documentClass.prototype as ActiveEffect & {determineSuppression():void;system:{isSuppressed:boolean}};
  registerNativeWrapper(effect,"determineSuppression",function(wrapped,...args) {const result=wrapped(...args);if (this.parent instanceof Item && empDisabled(this.parent)) this.system.isSuppressed = true;return result;},"WRAPPER");
  const modulePath = "/systems/cyberpunk-red-core/modules/item/cpr-item.js";
  const native = (await import(modulePath)).default.prototype as Item & {createRoll(...args:unknown[]):unknown;confirmRoll(...args:unknown[]):unknown};
  for (const method of ["createRoll","confirmRoll"] as const) {
    registerNativeWrapper(native,method,function(wrapped,...args) {
      if (empDisabled(this)) {ui.notifications!.warn(`${this.name}: disabled by EMP until combat ends.`);throw Error("Item disabled by EMP.");}
      return wrapped(...args);
    },"MIXED");
  }
}
