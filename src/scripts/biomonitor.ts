export type VitalState = "normal" | "wounded" | "serious" | "critical" | "flatline";
export function vitalState(current: number, maximum: number): VitalState {
  if (current <= 0) return "flatline";
  if (current < 10) return "critical";
  if (current < maximum / 2) return "serious";
  return current < maximum ? "wounded" : "normal";
}
export const lamps = [
  { id: "poison", name: "Poison", icon: "fa-skull-crossbones", match: /poison/i },
  { id: "radiation", name: "Radiation", icon: "fa-radiation", match: /radiation/i },
  { id: "biotoxin", name: "Biotoxin", icon: "fa-biohazard", match: /biotoxin/i },
  { id: "fire", name: "On fire", icon: "fa-fire", match: /on[ _-]?fire|burning|incendiary/i },
] as const;
export type LampId = typeof lamps[number]["id"];
const seen = new Map<string, Set<LampId>>();
const activationOrder = new Map<string, LampId[]>();
const flashes = new Map<string, Map<LampId, number>>();
export function signalExposure(uuid: string, kind: LampId, seconds: number) {
  if (!lamps.some(lamp => lamp.id === kind)) return;
  let events = flashes.get(uuid);
  if (!events) { events = new Map(); flashes.set(uuid, events); }
  const order = activationOrder.get(uuid) ?? [];
  if (!order.includes(kind)) order.push(kind);
  activationOrder.set(uuid, order);
  events.set(kind, Date.now() + Math.max(0, Math.min(seconds, 60)) * 1000);
}
export function indicatorState(uuid: string, names: string[], seconds: number) {
  const active = new Set<LampId>(names.flatMap(name => lamps.filter(lamp => lamp.match.test(name)).map(lamp => lamp.id)));
  const previous = seen.get(uuid);
  if (previous) for (const kind of active) if (!previous.has(kind)) signalExposure(uuid, kind, seconds);
  seen.set(uuid, active);
  const events = flashes.get(uuid);
  const now = Date.now();
  for (const [kind, expires] of events ?? []) if (expires <= now) events!.delete(kind);
  if (events && !events.size) flashes.delete(uuid);
  const order = (activationOrder.get(uuid) ?? []).filter(kind => active.has(kind) || events?.has(kind));
  for (const kind of [...active, ...(events?.keys() ?? [])]) if (!order.includes(kind)) order.push(kind);
  activationOrder.set(uuid, order);
  return [...lamps].sort((a, b) => (order.indexOf(a.id) < 0 ? 99 : order.indexOf(a.id)) - (order.indexOf(b.id) < 0 ? 99 : order.indexOf(b.id))).map(lamp => ({ ...lamp, on: active.has(lamp.id) || !!events?.has(lamp.id), flashing: !!events?.has(lamp.id), expires: events?.get(lamp.id) }));
}
export function resetMonitor() { seen.clear(); flashes.clear(); activationOrder.clear(); }
