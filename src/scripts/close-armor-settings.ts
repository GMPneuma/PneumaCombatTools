import {closeArmorRules,closeTypes} from "./close-armor.js";
const MODULE="pneuma-combattools";
class CloseArmorForm extends FormApplication {
  constructor(){super({});}
  static override get defaultOptions(){
    return foundry.utils.mergeObject(super.defaultOptions,{title:"Close Combat Armor Rules (Pneuma Homebrew)",width:420,template:"modules/pneuma-combattools/templates/close-armor.hbs"});
  }
  override getData(){
    const rules=closeArmorRules();
    return {rows:Object.entries(closeTypes).map(([key,label])=>({key,label,...rules[key as keyof typeof rules]}))};
  }
  protected override async _updateObject(_event:Event,data:Record<string,unknown>){
    if(!game.user?.isGM)return;
    const rules=closeArmorRules();
    const next={...rules};
    for(const key of Object.keys(closeTypes) as (keyof typeof rules)[])next[key]={half:!!data[key+"Half"],ablate:!!data[key+"Ablate"]};
    await game.settings!.set(MODULE,"closeArmor",next);
  }
}
export function registerCloseArmor(){
  game.settings!.register(MODULE,"closeArmor",{scope:"world",config:false,default:null,
    // Foundry v12 accepts DataField settings.
    // @ts-expect-error Pinned settings types omit the ObjectField overload.
    type:new foundry.data.fields.ObjectField({nullable:true,initial:null})});
  game.settings!.registerMenu(MODULE,"closeArmorMenu",{name:"Close Combat Armor Rules",label:"Configure",hint:"Set half armor and armor ablation by attack type.",icon:"fas fa-shield-halved",type:CloseArmorForm,restricted:true});
}
