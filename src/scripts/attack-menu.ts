import { areaKind } from "./aoe/weapon.js";
import { grappleWeaponBlocked } from "./grapple/state.js";
import { improvisedSource, thrownRollItem } from "./thrown-weapons.js";
import { isQuickhackLauncher } from "./quickhack/availability.js";
import { availableWeapons, type EquipmentItem } from "./weapon-data.js";

/** HUD eligibility and routing; combat exchanges reuse native CPR rolls. */
export type AttackMode = "attack" | "aimed" | "autofire" | "suppressive";
export interface MenuWeapon extends EquipmentItem {
  id: string | null; name: string | null; img?: string | null; type: string;
  flags?: { [key: string]: unknown };
}
/** Launcher ownership is not a RAW requirement. */
export function canShowQuickhack(items: MenuWeapon[]) {
  return items.some(item => item.type === "role" && item.name?.trim().toLowerCase() === "netrunner");
}
export function attackEntries(items: MenuWeapon[]) {
  return availableWeapons(items).filter(item => !isQuickhackLauncher(item)
    && item.name?.trim().toLowerCase() !== "quickhack")
    .filter(item => item.system.weaponType !== "thrownWeapon")
    .map(item => ({ id: item.id, name: item.name, img: item.img,
      category: ["unarmed", "martialArts"].includes(item.system.weaponType ?? "") ? "brawling"
        : (item.system.weaponType ?? "").toLowerCase().includes("melee") ? "melee" : "attack",
      deferred: false, area: !!areaKind(item,"attack"),
      brawling: ["unarmed", "martialArts"].includes(item.system.weaponType ?? ""),
      autofire: !!item.system.isRanged && (!!item.system.fireModes?.suppressiveFire
        || ["smg", "heavySmg", "assaultRifle"].includes(item.system.weaponType ?? "")),
    })).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}

export function thrownEntries(items: MenuWeapon[]) {
  return items.filter(item => item.type === "weapon" && item.system.weaponType === "thrownWeapon")
    .map(item => ({ id: item.id, name: item.name, img: item.img, category: "thrown", thrown: true }));
}
export function grenadeEntries(items: MenuWeapon[]) {
  return items.filter(item => item.type === "ammo" && item.system.variety === "grenade" && Number(item.system.amount) > 0)
    .map(item => ({ id: item.id, name: item.name, img: item.img }));
}

const rolling = new Set<string>();
export async function attackFromHUD(attacker: Token, target: Token, itemId: string, mode: AttackMode,
  event: JQuery.ClickEvent) {
  const actor = attacker.actor;
  if (!actor?.isOwner || !target.isVisible || !target.actor
    || canvas.tokens?.get(attacker.id) !== attacker || canvas.tokens.get(target.id) !== target
    || !attacker.can(game.user!, "control")) return;
  const items = Array.from(actor.items) as unknown as MenuWeapon[];
  const item = [...attackEntries(items), ...thrownEntries(items).map(row => ({...row, autofire:false, deferred:false})),
    {id:"__improvised",category:"thrown",autofire:false,deferred:false}].find(row => row.id === itemId);
  if ((!item && !grenadeEntries(items).some(row=>row.id===itemId)) || (["autofire","suppressive"].includes(mode) && !item?.autofire)) return;
  const originalItem = items.find(entry => entry.id === itemId);
  if (originalItem && item?.category !== "thrown" && grappleWeaponBlocked(actor, originalItem))
    throw new Error("Grappled characters cannot use weapons requiring two hands.");
  const nativeItem = originalItem;
  if (nativeItem) {
    const kind=areaKind(nativeItem, mode);
    if (kind) {
      const { startAreaAttack } = await import("./aoe/workflow.js");
      await startAreaAttack(attacker,target,itemId,mode);return;
    }
    if(mode==="aimed"&&areaKind(nativeItem,"attack"))throw Error("Area attacks cannot make aimed shots.");
  }
  if(!item)return;
  if (rolling.has(actor.uuid)) return;
  rolling.add(actor.uuid);
  try {
    // Restore the captured attacker/defender before entering the native workflow.
    if (!attacker.control({ releaseOthers: true })) return;
    target.setTarget(true, { releaseOthers: true });
    const { startCombatExchange } = await import("./combat-resolution.js");
    if (item.category === "thrown") {
      const source = itemId === "__improvised" ? await improvisedSource() : actor.items.get(itemId)!.toObject();
      await startCombatExchange(attacker, target, itemId, "attack", event,
        { item: thrownRollItem(source, actor), source, improvised: itemId === "__improvised" });
    } else await startCombatExchange(attacker, target, itemId, mode, event);
  } finally { rolling.delete(actor.uuid); }
}
