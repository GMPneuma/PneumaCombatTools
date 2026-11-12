const MODULE = "pneuma-combattools";
export const closeTypes = {melee:"Melee",brawling:"Brawling",martialArts:"Martial Arts"} as const;
type Kind=keyof typeof closeTypes;
export type CloseArmor=Record<Kind,{half:boolean;ablate:boolean}>;
declare global {interface SettingConfig {"pneuma-combattools.closeArmor":CloseArmor|null}}
export function closeArmorRules():CloseArmor {
  return game.settings!.get(MODULE,"closeArmor") ?? {
    melee:{half:true,ablate:true},brawling:{half:false,ablate:true},
    martialArts:{half:true,ablate:!game.settings!.get(MODULE,"maNoAblation")}
  };
}
export function weaponArmor(type?:string) {
  const key=type==="unarmed"?"brawling":type==="martialArts"?"martialArts":type?.toLowerCase().includes("melee")?"melee":undefined;
  return key?closeArmorRules()[key]:undefined;
}
