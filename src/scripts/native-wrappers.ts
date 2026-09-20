/** Stable aliases expose CPR ES-module objects to libWrapper's global-path API. */
type Wrapped = (...args: any[]) => any;
type Wrapper = (this: any, wrapped: Wrapped, ...args: any[]) => any;
declare global {
  var pneumaCombatToolsNative: {targets: Record<string, object>} | undefined;
}
interface WrapperAPI {register(module: string, target: string, fn: Wrapper, type: "WRAPPER" | "MIXED"): number}
const owners = new WeakMap<object,string>();
let nextOwner = 0;
export function registerNativeWrapper(owner: object, method: string, fn: Wrapper, type: "WRAPPER" | "MIXED"): void {
  const api = (globalThis as typeof globalThis & {libWrapper?: WrapperAPI}).libWrapper;
  if (!api?.register) throw Error("Combat Tools requires libWrapper. Install and enable it, then reload Foundry.");
  if (typeof (owner as Record<string,unknown>)[method] !== "function") throw Error(`Native method ${method} is unavailable.`);
  const namespace = globalThis.pneumaCombatToolsNative ??= {targets:{}};
  let key = owners.get(owner);
  if (!key) {key = "target" + nextOwner++; owners.set(owner,key);namespace.targets[key] = owner;}
  api.register("pneuma-combattools",`pneumaCombatToolsNative.targets.${key}.${method}`,fn,type);
}
