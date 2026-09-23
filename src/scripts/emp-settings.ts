import {markHomebrew} from "./homebrew-badge.js";
import {EMP_METHODS,empBehavior,normalizeEmpBehavior} from "./emp-behavior.js";
const MODULE="pneuma-combattools";
export class EmpSettingsForm extends FormApplication {
  constructor(){super({});}
  static override get defaultOptions(){return foundry.utils.mergeObject(super.defaultOptions,{
    title:"EMP Effect behavior",id:"pneuma-emp-settings",width:530,height:"auto",resizable:false,
    template:"modules/pneuma-combattools/templates/emp-settings.hbs",closeOnSubmit:true,
  }) as typeof FormApplication.defaultOptions;}
  override getData(){
    const values=empBehavior();
    return {...values,foundationWeights:{equal:"Standard Weight","foundation-more":"2× Weight","foundation-less":"½ Weight"},hardenedMethods:{exclude:"Exclude hardened items from selection",consume:"Include hardened items; consume the pick with no effect"},profiles:(["gm","player"] as const).map(side=>({
      side,title:side==="gm"?"When GM picks":"When player picks",...values[side],
      methods:side==="gm"?EMP_METHODS:{manual:"Player sees all and picks",shortlist:"Player sees 2×X random and picks X",random:"Random"},
    })),immunity:game.settings!.get(MODULE,"empImmunity")};
  }
  override activateListeners(html:JQuery){
    super.activateListeners(html);
    const root=html[0];if(!root)return;
    const biowareLabel=root.querySelector<HTMLElement>("[data-bioware-label]");
    if(biowareLabel)markHomebrew(biowareLabel);
    const update=()=>{
      const weights=root.querySelector<HTMLElement>("[data-foundation-weight]");
      if(weights)weights.hidden=!root.querySelector<HTMLInputElement>('[name="includeFoundational"]')?.checked;
      root.querySelectorAll<HTMLElement>("[data-emp-profile]").forEach(section=>{
      const method=section.querySelector<HTMLSelectElement>("[data-method]")?.value;
      section.querySelectorAll<HTMLElement>("[data-random-options]").forEach(el=>el.hidden=method==="manual");
      section.querySelectorAll<HTMLElement>("[data-shortlist-options]").forEach(el=>el.hidden=method!=="shortlist");
    });
    };
    root.addEventListener("change",update);update();
  }
  protected override async _updateObject(_event:Event,data:Record<string,unknown>){
    if(!game.user?.isGM)throw Error("Only the GM can configure EMP behavior.");
    const expanded=foundry.utils.expandObject(data);
    await game.settings!.set(MODULE,"empBehavior",normalizeEmpBehavior(expanded));
    await game.settings!.set(MODULE,"empImmunity",String(data.immunity??""));
  }
}
export function registerEmpSettings(){
  game.settings!.register(MODULE,"empBehavior",{scope:"world",config:false,
    // @ts-expect-error Foundry v12 supports ObjectField settings; pinned typings omit it.
    type:new foundry.data.fields.ObjectField(),default:normalizeEmpBehavior({})});
  game.settings!.registerMenu(MODULE,"empBehaviorMenu",{name:"EMP Effect behavior",label:"Configure",
    hint:"GM and player selection methods, random weighting, and limited player shortlists.",
    icon:"fas fa-bolt",type:EmpSettingsForm,restricted:true});
}
