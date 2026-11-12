export interface Quickhack { id: string; name: string; img?: string; tier: string; description?: string; dv: number; automaticDamageFormula?: string; damageFormula?: string; silentOnSuccess?: boolean }
export const QUICKHACKS: readonly Quickhack[] = Object.freeze([
  { id: "impair-movement", name: "Impair Movement", tier: "Simple", dv: 6 },
  { id: "sonic-shock", name: "Sonic Shock", tier: "Simple", dv: 6 },
  { id: "overheat", name: "Overheat", tier: "Standard", dv: 8, automaticDamageFormula: "4" },
  { id: "short-circuit", name: "Short Circuit", tier: "Standard", dv: 8 },
  { id: "cyberware-malfunction", name: "Cyberware Malfunction", tier: "Difficult", dv: 10 },
  { id: "lure", name: "Lure", tier: "Difficult", dv: 10, silentOnSuccess: true },
  { id: "slow", name: "Slow", tier: "Difficult", dv: 10 },
  { id: "synapse-burnout", name: "Synapse Burnout", tier: "Difficult", dv: 10, damageFormula: "3d6" },
  { id: "puppet", name: "Puppet", tier: "Advanced", dv: 12 },
  { id: "shard-ejection", name: "Shard Ejection", tier: "Advanced", dv: 12 },
  { id: "system-reset", name: "System Reset", tier: "Advanced", dv: 12 }
]);


export interface CustomQuickhack {img?:string; id:string; name:string; dv:number; description:string}
declare global {interface SettingConfig {"pneuma-combattools.customQuickhacks": CustomQuickhack[]}}
export function customQuickhacks():Quickhack[] {
  const saved=typeof game==="undefined"?undefined:game.settings?.get("pneuma-combattools","customQuickhacks");
  return Array.isArray(saved)?saved.map(hack=>({...hack,tier:"Custom"})):[];
}
export const getQuickhack = (id: string) => QUICKHACKS.find(hack => hack.id === id) ?? customQuickhacks().find(hack=>hack.id===id);
