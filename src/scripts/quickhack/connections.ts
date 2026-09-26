import { primaryGM as electedGM } from "../shared.js";
import {displayedEncounter,sceneEncounter,resolveEncounter,encounterRef,type EncounterRef} from "../encounter.js";
import { requireCombatSocket } from "../socket-health.js";
import { MODULE } from "./availability.js";
import { primaryGM } from "./content.js";
import { resultFlag, type QuickhackResult } from "./messages.js";
import { canOperate } from "./rolls.js";
import { enabled } from "./settings.js";
import { waitForResult } from "./effects.js";

export interface Connection extends Partial<EncounterRef> {
  id: string; sourceActorUuid: string; targetActorUuid: string; sourceTokenUuid: string; targetTokenUuid: string;
  state: "active" | "ejected" | "disconnected"; connectedAt: number;
  awareness?: {alerted:boolean; revealAttacker:boolean; jackInDetected:boolean; quickhackDetected:boolean; audience:string};
}
const keyFor = (sourceUuid: string, targetUuid: string) => encodeURIComponent(sourceUuid + "|" + targetUuid).replaceAll(".", "%2E");
export const trackingCombat = () => displayedEncounter();
export function connectionFor(source: Actor, targetUuid: string, combat=trackingCombat()): Connection | undefined {
  return combat ? foundry.utils.getProperty(combat, `flags.${MODULE}.quickhackConnections.${keyFor(source.uuid, targetUuid)}`) as Connection | undefined : undefined;
}
export function activeConnection(source: Actor, targetUuid: string, id?: string, combat=trackingCombat()) {
  const connection = connectionFor(source, targetUuid,combat);
  return enabled() && connection?.state === "active" && (!id || connection.id === id) ? connection : undefined;
}
export const isEjected = (source: Actor, targetUuid: string,combat=trackingCombat()) => connectionFor(source, targetUuid,combat)?.state === "ejected";
export function resultConnectionValid(source:Actor,result:Partial<EncounterRef>&{targetActorUuid:string;connectionId?:string}) {
  try {const combat=resolveEncounter(result);return enabled()&&(result.combatId===null||!!combat&&!!result.connectionId&&!!activeConnection(source,result.targetActorUuid,result.connectionId,combat));}catch{return false;}
}
export function combatConnections(combat = trackingCombat()): Connection[] {
  return Object.values(foundry.utils.getProperty(combat ?? {}, `flags.${MODULE}.quickhackConnections`) ?? {});
}
function mergeAwareness(connection: Connection, result: QuickhackResult) {
  const old = connection.awareness;
  return {alerted: !!old?.alerted || result.alerted, revealAttacker: !!old?.revealAttacker || result.alerted && result.revealAttacker,
    jackInDetected: !!old?.jackInDetected || result.alerted && result.type === "jackIn",
    quickhackDetected: !!old?.quickhackDetected || result.alerted && result.type === "quickhack",
    audience: result.alerted ? result.audience : old?.audience ?? result.audience};
}
interface ConnectRequest { quickhackType: "connect" | "awareness"; id: string; messageId: string; requesterId: string }
interface DisconnectRequest { quickhackType: "disconnect"; id: string; requesterId: string; combatUuid: string; sourceUuid: string; targetUuid: string; connectionId: string; encounter:EncounterRef }
interface Reply { quickhackType: "connected"; id: string; requesterId: string; gmId: string; error?: string }
const requests = new Map<string, { resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
const queues = new Map<string, Promise<unknown>>();
const channel = `module.${MODULE}`;
function serialized<T>(combat: Combat, operation: () => Promise<T>): Promise<T> {
  const next = (queues.get(combat.uuid) ?? Promise.resolve()).catch(() => {}).then(operation);
  queues.set(combat.uuid, next);
  void next.finally(() => { if (queues.get(combat.uuid) === next) queues.delete(combat.uuid); }).catch(() => {});
  return next;
}
async function connect(request: ConnectRequest) {
  if (!primaryGM() || !enabled()) throw new Error("QuickHack is disabled or no active GM is available.");
  const message = await waitForResult(request.messageId);
  const result = message && resultFlag(message);
  if (!message || !result || (request.quickhackType === "connect" ? result.type !== "jackIn" : result.type !== "quickhack") || message.author?.id !== request.requesterId) throw new Error("Invalid Jack-In result.");
  const combat = resolveEncounter(result);
  if (!combat || combat.uuid !== result.combatUuid) throw new Error("Start combat to track QuickHack connections.");
  const actor = await fromUuid(result.sourceActorUuid) as Actor | null;
  const requester = game.users!.get(request.requesterId) as User | undefined;
  if (!actor || !requester || !canOperate(actor, requester)) throw new Error("Jack-In actor is unavailable.");
  await serialized(combat, async () => {
    if (!enabled() || resolveEncounter(result)?.uuid !== combat.uuid) throw new Error("QuickHack is disabled or the encounter changed.");
    if (request.quickhackType === "awareness") {
      const connection = activeConnection(actor,result.targetActorUuid,result.connectionId,combat);
      if (!connection) return;
      const awareness = mergeAwareness(connection,result);
      if (!connection.awareness || Object.entries(awareness).some(([key,value])=>connection.awareness?.[key as keyof typeof awareness]!==value))
        await combat.update({[`flags.${MODULE}.quickhackConnections.${keyFor(actor.uuid,result.targetActorUuid)}.awareness`]:awareness});
      return;
    }
    if (isEjected(actor, result.targetActorUuid,combat)) throw new Error("Ejected: cannot Jack In to this target again during this encounter.");
    // Each result can establish a connection only once; old cards never reopen ejected links.
    if (foundry.utils.getProperty(message, `flags.${MODULE}.quickhack.connectionRecorded`)) return;
    const connection: Connection = { ...encounterRef(combat,result.combatScene,result.combatTokens), id: message.id!, sourceActorUuid: actor.uuid, targetActorUuid: result.targetActorUuid,
      sourceTokenUuid: result.sourceTokenUuid, targetTokenUuid: result.targetTokenUuid, state: "active", connectedAt: Number(message.timestamp) };
    connection.awareness = mergeAwareness(connection,result);
    const previous = connectionFor(actor, result.targetActorUuid,combat);
    if (previous && previous.id !== connection.id && previous.connectedAt >= connection.connectedAt) return;
    // Encounter-owned state survives reloads without leaking restrictions into a new combat.
    if (previous?.id !== connection.id) await combat.update({ ["flags." + MODULE + ".quickhackConnections." + keyFor(actor.uuid, result.targetActorUuid)]: connection });
    await message.update({ ["flags." + MODULE + ".quickhack.connectionRecorded"]: true });
  });
}
export async function establishConnection(message: ChatMessage) {
  if (!enabled()) return;
  requireCombatSocket();
  const request: ConnectRequest = { quickhackType: resultFlag(message)?.type === "quickhack" ? "awareness" : "connect", id: foundry.utils.randomID(), messageId: message.id!, requesterId: game.user!.id };
  if (primaryGM()) return connect(request);
  if (!game.users!.some(user => user.active && user.isGM)) throw new Error("An active GM is required to track Jack-In connections.");
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { requests.delete(request.id); reject(new Error("Jack-In connection was not confirmed by the GM.")); }, 10000);
    requests.set(request.id, { resolve, reject, timer }); game.socket!.emit(channel, request);
  });
}
export async function ejectConnection(source: Actor, targetUuid: string, connectionId: string, ref:Partial<EncounterRef>) {
  const combat = resolveEncounter(ref);
  if (!enabled() || !primaryGM() || !combat) return false;
  return serialized(combat, async () => {
    if (resolveEncounter(ref)?.uuid !== combat.uuid) return false;
    const connection = activeConnection(source, targetUuid, connectionId,combat); if (!connection) return false;
    await combat.update({ ["flags." + MODULE + ".quickhackConnections." + keyFor(source.uuid, targetUuid)]: { ...connection, state: "ejected" } });
    return true;
  });
}
async function disconnect(request: DisconnectRequest) {
  if (!enabled() || !primaryGM()) throw new Error("QuickHack is disabled or no active GM is available.");
  const combat = resolveEncounter(request.encounter);
  const source = await fromUuid(request.sourceUuid) as Actor | null;
  const user = game.users!.get(request.requesterId) as User | undefined;
  if (!combat || combat.uuid !== request.combatUuid || !source || !user || !canOperate(source, user)) throw new Error("Jack Out connection is unavailable.");
  await serialized(combat, async () => {
    if (!enabled() || resolveEncounter(request.encounter)?.uuid !== combat.uuid) throw new Error("The encounter changed.");
    const connection = activeConnection(source, request.targetUuid, request.connectionId,combat);
    if (!connection) return;
    await combat.update({ ["flags." + MODULE + ".quickhackConnections." + keyFor(source.uuid, request.targetUuid)]: { ...connection, state: "disconnected" } });
  });
}
/** Voluntary disconnection does not impose the forced-ejection restriction. */
export async function jackOut(source: Actor, targetUuid: string) {
  if (!enabled() || !canOperate(source)) return;
  requireCombatSocket();
  const combat = sceneEncounter(), connection = activeConnection(source, targetUuid,undefined,combat);
  if (!combat || !connection) return;
  const request: DisconnectRequest = { quickhackType: "disconnect", id: foundry.utils.randomID(), requesterId: game.user!.id,
    encounter:encounterRef(combat,connection.combatScene,connection.combatTokens), combatUuid: combat.uuid, sourceUuid: source.uuid, targetUuid, connectionId: connection.id };
  if (primaryGM()) return disconnect(request);
  if (!game.users!.some(user => user.active && user.isGM)) throw new Error("An active GM is required to track Jack Out.");
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { requests.delete(request.id); reject(new Error("Jack Out was not confirmed by the GM.")); }, 10000);
    requests.set(request.id, { resolve, reject, timer }); game.socket!.emit(channel, request);
  });
}
export function registerConnections() {

  game.socket!.on(channel, (payload: ConnectRequest | DisconnectRequest | Reply) => {
    if (!payload || !enabled()) return;
    if (payload.quickhackType === "disconnect" && primaryGM()) {
      void disconnect(payload).then(() => sendReply(payload), error => sendReply(payload, String(error)));
    } else if ((payload.quickhackType === "connect" || payload.quickhackType === "awareness") && primaryGM()) {
      void connect(payload).then(() => sendReply(payload), error => sendReply(payload, String(error)));
    } else if (payload.quickhackType === "connected" && payload.requesterId === game.user!.id) {
      const gm = electedGM();
      if (gm?.id !== payload.gmId) return;
      const request = requests.get(payload.id); if (!request) return;
      clearTimeout(request.timer); requests.delete(payload.id);
      if (payload.error) request.reject(new Error(payload.error)); else request.resolve();
    }
  });
}
function sendReply(request: ConnectRequest | DisconnectRequest, error?: string) {
  game.socket!.emit(channel, { quickhackType: "connected", id: request.id, requesterId: request.requesterId, gmId: game.user!.id, error });
}
