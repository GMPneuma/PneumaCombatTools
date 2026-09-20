import { requireCombatSocket } from "../socket-health.js";
import { MODULE } from "./availability.js";
import { primaryGM } from "./content.js";
import { resultFlag } from "./messages.js";
import { canOperate } from "./rolls.js";
import { enabled } from "./settings.js";
import { waitForResult } from "./effects.js";

export interface Connection {
  id: string; sourceActorUuid: string; targetActorUuid: string; sourceTokenUuid: string; targetTokenUuid: string;
  state: "active" | "ejected" | "disconnected"; connectedAt: number;
}
const keyFor = (sourceUuid: string, targetUuid: string) => encodeURIComponent(sourceUuid + "|" + targetUuid).replaceAll(".", "%2E");
export const trackingCombat = () => game.combat?.started ? game.combat : undefined;
export function connectionFor(source: Actor, targetUuid: string): Connection | undefined {
  const combat = trackingCombat();
  return combat ? foundry.utils.getProperty(combat, `flags.${MODULE}.quickhackConnections.${keyFor(source.uuid, targetUuid)}`) as Connection | undefined : undefined;
}
export function activeConnection(source: Actor, targetUuid: string, id?: string) {
  const connection = connectionFor(source, targetUuid);
  return enabled() && connection?.state === "active" && (!id || connection.id === id) ? connection : undefined;
}
export const isEjected = (source: Actor, targetUuid: string) => connectionFor(source, targetUuid)?.state === "ejected";
export function resultConnectionValid(source: Actor, result: { combatUuid?: string; targetActorUuid: string; connectionId?: string }) {
  if (!enabled() || trackingCombat()?.uuid !== result.combatUuid) return false;
  return !result.combatUuid || !!result.connectionId && !!activeConnection(source, result.targetActorUuid, result.connectionId);
}
interface ConnectRequest { quickhackType: "connect"; id: string; messageId: string; requesterId: string }
interface DisconnectRequest { quickhackType: "disconnect"; id: string; requesterId: string; combatUuid: string; sourceUuid: string; targetUuid: string; connectionId: string }
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
  if (!message || !result || result.type !== "jackIn" || message.author?.id !== request.requesterId) throw new Error("Invalid Jack-In result.");
  const combat = trackingCombat();
  if (!combat || combat.uuid !== result.combatUuid) throw new Error("Start combat to track QuickHack connections.");
  const actor = await fromUuid(result.sourceActorUuid) as Actor | null;
  const requester = game.users!.get(request.requesterId) as User | undefined;
  if (!actor || !requester || !canOperate(actor, requester)) throw new Error("Jack-In actor is unavailable.");
  await serialized(combat, async () => {
    if (!enabled() || trackingCombat()?.uuid !== combat.uuid) throw new Error("QuickHack is disabled or the encounter changed.");
    if (isEjected(actor, result.targetActorUuid)) throw new Error("Ejected: cannot Jack In to this target again during this encounter.");
    // Each result can establish a connection only once; old cards never reopen ejected links.
    if (foundry.utils.getProperty(message, `flags.${MODULE}.quickhack.connectionRecorded`)) return;
    const connection: Connection = { id: message.id!, sourceActorUuid: actor.uuid, targetActorUuid: result.targetActorUuid,
      sourceTokenUuid: result.sourceTokenUuid, targetTokenUuid: result.targetTokenUuid, state: "active", connectedAt: Number(message.timestamp) };
    const previous = connectionFor(actor, result.targetActorUuid);
    if (previous && previous.id !== connection.id && previous.connectedAt >= connection.connectedAt) return;
    // Encounter-owned state survives reloads without leaking restrictions into a new combat.
    if (previous?.id !== connection.id) await combat.update({ ["flags." + MODULE + ".quickhackConnections." + keyFor(actor.uuid, result.targetActorUuid)]: connection });
    await message.update({ ["flags." + MODULE + ".quickhack.connectionRecorded"]: true });
  });
}
export async function establishConnection(message: ChatMessage) {
  if (!enabled()) return;
  requireCombatSocket();
  const request: ConnectRequest = { quickhackType: "connect", id: foundry.utils.randomID(), messageId: message.id!, requesterId: game.user!.id };
  if (primaryGM()) return connect(request);
  if (!game.users!.some(user => user.active && user.isGM)) throw new Error("An active GM is required to track Jack-In connections.");
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { requests.delete(request.id); reject(new Error("Jack-In connection was not confirmed by the GM.")); }, 10000);
    requests.set(request.id, { resolve, reject, timer }); game.socket!.emit(channel, request);
  });
}
export async function ejectConnection(source: Actor, targetUuid: string, connectionId: string) {
  const combat = trackingCombat();
  if (!enabled() || !primaryGM() || !combat) return false;
  return serialized(combat, async () => {
    if (trackingCombat()?.uuid !== combat.uuid) return false;
    const connection = activeConnection(source, targetUuid, connectionId); if (!connection) return false;
    await combat.update({ ["flags." + MODULE + ".quickhackConnections." + keyFor(source.uuid, targetUuid)]: { ...connection, state: "ejected" } });
    return true;
  });
}
async function disconnect(request: DisconnectRequest) {
  if (!enabled() || !primaryGM()) throw new Error("QuickHack is disabled or no active GM is available.");
  const combat = trackingCombat();
  const source = await fromUuid(request.sourceUuid) as Actor | null;
  const user = game.users!.get(request.requesterId) as User | undefined;
  if (!combat || combat.uuid !== request.combatUuid || !source || !user || !canOperate(source, user)) throw new Error("Jack Out connection is unavailable.");
  await serialized(combat, async () => {
    if (!enabled() || trackingCombat()?.uuid !== combat.uuid) throw new Error("The encounter changed.");
    const connection = activeConnection(source, request.targetUuid, request.connectionId);
    if (!connection) return;
    await combat.update({ ["flags." + MODULE + ".quickhackConnections." + keyFor(source.uuid, request.targetUuid)]: { ...connection, state: "disconnected" } });
  });
}
/** Voluntary disconnection does not impose the forced-ejection restriction. */
export async function jackOut(source: Actor, targetUuid: string) {
  if (!enabled() || !canOperate(source)) return;
  requireCombatSocket();
  const combat = trackingCombat(), connection = activeConnection(source, targetUuid);
  if (!combat || !connection) return;
  const request: DisconnectRequest = { quickhackType: "disconnect", id: foundry.utils.randomID(), requesterId: game.user!.id,
    combatUuid: combat.uuid, sourceUuid: source.uuid, targetUuid, connectionId: connection.id };
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
    } else if (payload.quickhackType === "connect" && primaryGM()) {
      void connect(payload).then(() => sendReply(payload), error => sendReply(payload, String(error)));
    } else if (payload.quickhackType === "connected" && payload.requesterId === game.user!.id) {
      const gm = game.users!.filter(user => user.active && user.isGM).sort((a,b) => a.id.localeCompare(b.id))[0];
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
