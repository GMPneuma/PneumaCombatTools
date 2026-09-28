import {ammoProfile} from "./instant-catalog.js";
import {escapeHTML} from "./shared.js";
interface TitleItem {name?:string|null;type?:string;system:unknown}
const typeNames:Record<string,string>={smg:"SMG",heavySmg:"Heavy SMG",unarmed:"Brawling",martialArts:"Martial Arts",lightMelee:"Light Melee Weapon",mediumMelee:"Medium Melee Weapon",heavyMelee:"Heavy Melee Weapon",veryHeavyMelee:"Very Heavy Melee Weapon"};
const readable=(value:string)=>typeNames[value]??value.replace(/([a-z])([A-Z])/g,"$1 $2").replace(/\b\w/g,c=>c.toUpperCase());
export function attackTitle(item:TitleItem,hidden:boolean,skill?:string,ammoType?:string):string {
  const system=item.system as {weaponType?:string;weaponSkill?:string;variety?:string;type?:string};
  const type=system.weaponType??"";
  const grenade=item.type==="ammo"&&system.variety==="grenade"||type==="grenadeLauncher";
  if(hidden){
    if(grenade)return "Grenade";
    if(type==="rocketLauncher")return "Rocket";
    return type?readable(type):"Attack";
  }
  if(type==="martialArts")return skill?.trim()||system.weaponSkill?.trim()||"Martial Arts";
  if(grenade){const profile=ammoProfile(ammoType??system.type,"grenade");return profile?profile.name+" Grenade":item.type==="ammo"?item.name?.trim()||"Grenade":"Grenade";}
  return item.name?.trim()||readable(type)||"Attack";
}
export function attackHeading(title:string,tag="h3"):string {
  return '<'+tag+' class="pneuma-attack-name" title="'+escapeHTML(title)+'">'+escapeHTML(title)+'</'+tag+'>';
}
