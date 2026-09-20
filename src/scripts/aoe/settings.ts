import { markHomebrew } from "../homebrew-badge.js";
export const MODULE = "pneuma-combattools";
export interface AreaSettings {
  shellShape:"square"|"cone"|"ray"; blastShape:"square"|"circle";
  shellRange:number; shellWidth:number; shellAngle:number; blastRadius:number; suppressionAngle:number; suppressionSize:number;
  shellSize: number; blastSize: number;  coverUp: boolean; corridorMax: number;
  evade: "raw" | "everyone" | "none"; evadePenalty: number; evadeMove:boolean; evadeBorrow:boolean;
  suppressionShape: "corridor" | "raw" | "ray" | "cone" | "square"; suppressionWidth: number; suppressionRange: number;
}
export const defaults: AreaSettings = { shellShape:"square",blastShape:"square",shellRange:6,shellWidth:3,shellAngle:45,blastRadius:5,suppressionAngle:45,suppressionSize:6, shellSize: 6, blastSize: 10,  coverUp:false, corridorMax:0, evade: "raw", evadePenalty: 0,
  evadeMove:false, evadeBorrow:false, suppressionShape: "ray", suppressionWidth: 3, suppressionRange: 25 };
declare global { interface SettingConfig { "pneuma-combattools.areaSettings": AreaSettings } }
export function normalizeArea(input: Partial<AreaSettings>): AreaSettings {
  const n = (key: keyof AreaSettings, min: number, max: number) => {
    const v = Number(input[key] ?? defaults[key]); return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : Number(defaults[key]);
  };
  const shape=(value:unknown)=>value==="cone"?"cone":value==="ray"?"ray":"square";
  return { shellShape:shape(input.shellShape),blastShape:input.blastShape==="circle"?"circle":"square",
    shellRange:n("shellRange",1,500),shellWidth:n("shellWidth",1,25),shellAngle:n("shellAngle",1,179),
    blastRadius:n("blastRadius",1,100),
    suppressionAngle:n("suppressionAngle",1,179),suppressionSize:n("suppressionSize",1,100), coverUp:input.coverUp===true, corridorMax:n("corridorMax",0,1000), shellSize:n("shellSize",1,100), blastSize:n("blastSize",1,100), 
    evade:["raw","everyone","none"].includes(input.evade ?? "") ? input.evade! : "raw",
    evadePenalty:n("evadePenalty",-20,20), evadeMove:input.evadeMove===true,evadeBorrow:input.evadeBorrow===true,
    suppressionShape:input.suppressionShape === "raw" ? "raw" : input.suppressionShape === "cone" ? "cone" : input.suppressionShape === "square" ? "square" : "ray",
    suppressionWidth:n("suppressionWidth",1,25), suppressionRange:n("suppressionRange",1,500) };
}
export const areaSettings = () => normalizeArea(game.settings!.get(MODULE,"areaSettings") ?? {});
class AreaSettingsForm extends FormApplication {
  constructor(){super({});}
  static override get defaultOptions() { return foundry.utils.mergeObject(super.defaultOptions, {
    title:"Area Attacks & Suppressive Fire", id:"pneuma-area-settings", width:600, height:700, resizable:true, scrollY:[".pneuma-area-editor-body"],
    template:`modules/${MODULE}/templates/area-settings.hbs`, closeOnSubmit:true }); }
  override getData() {
    const settings=areaSettings();
    const profiles=(["shell","blast","suppression"] as const).map(prefix=>({
      prefix,label:prefix==="shell"?"Shotgun shells":prefix==="blast"?"Grenades & rockets":"Suppressive fire",
      hint:prefix==="shell"?"RAW: 6m square in front of the attacker.":prefix==="blast"?"RAW: 10m square centered on impact.":"Default: 3-square ray. RAW option: targets in sight within 25m.",
      shapes:prefix==="blast"?{square:"Square",circle:"Circle"}:{square:"Square",cone:"Cone",ray:"Ray",...(prefix==="suppression"?{raw:"RAW radius"}:{})},
      shape:settings[prefix+"Shape" as keyof AreaSettings],size:settings[prefix+"Size" as keyof AreaSettings],
      range:settings[prefix+"Range" as keyof AreaSettings],width:settings[prefix+"Width" as keyof AreaSettings],angle:settings[prefix+"Angle" as keyof AreaSettings],
      blast:prefix==="blast",radius:settings.blastRadius,rangeLabel:prefix==="suppression"?"Cone range / RAW radius":"Range",suppression:prefix==="suppression",rayRange:settings.corridorMax,
    }));
    return {...settings,profiles,evadeChoices:{raw:"RAW: REF 8+",everyone:"Homebrew: everyone",none:"Homebrew: no evasion"}};
  }
  override activateListeners(html:JQuery) {
    super.activateListeners(html);const root=html[0];if(!root)return;
    const label=root.querySelector<HTMLElement>("[data-cover-up-label]");if(label)markHomebrew(label);
    const update=()=>{
      const borrowing=root.querySelector<HTMLInputElement>('[name="evadeBorrow"]');if(borrowing)borrowing.disabled=!root.querySelector<HTMLInputElement>('[name="evadeMove"]')?.checked;
      for(const prefix of ["shell","blast","suppression"]){
        const shape=root.querySelector<HTMLSelectElement>('[name="'+prefix+'Shape"]')?.value;
        const show=(name:string,visible:boolean)=>{const row=root.querySelector('[name="'+name+'"]')?.closest<HTMLElement>(".form-group");if(row){row.hidden=!visible;row.style.display=visible?"":"none";}};
        show(prefix+"Size",shape==="square");if(prefix==="blast")show("blastRadius",shape==="circle");show(prefix+"Width",shape==="ray");show(prefix+"Angle",shape==="cone");
        show(prefix+"Range",prefix==="suppression"?shape==="cone"||shape==="raw":shape!=="square"&&prefix!=="blast");
        if(prefix==="suppression")show("corridorMax",shape==="ray");
        const value=(key:string)=>root.querySelector<HTMLInputElement>('[name="'+key+'"]')?.value??"";
        const range=prefix==="suppression"&&shape==="ray"?value("corridorMax"):value(prefix+"Range");
        const rangeText=prefix==="suppression"&&shape==="ray"&&Number(range)===0?"to scene boundary":range+" m/yd range";
        const summary=root.querySelector<HTMLOutputElement>('[data-area-summary="'+prefix+'"]');
        if(summary)summary.value=shape==="square"?value(prefix+"Size")+" × "+value(prefix+"Size")+" m/yd square"
          :shape==="circle"?value("blastRadius")+" m/yd radius circle":shape==="cone"?value(prefix+"Angle")+"° cone · "+rangeText
          :shape==="ray"?value(prefix+"Width")+"-square ray · "+rangeText:value(prefix+"Range")+" m/yd radius · line of sight";
      }
    };
    root.addEventListener("input",update,true);root.addEventListener("change",update,true);
    root.querySelectorAll<HTMLButtonElement>("[data-area-field]").forEach(button=>button.addEventListener("click",()=>{
      const input=root.querySelector<HTMLInputElement>('[name="'+button.dataset.areaField+'"]');
      if(input){input.value=button.dataset.areaValue!;input.dispatchEvent(new Event("input",{bubbles:true}));}
    }));update();
  }
  protected override async _updateObject(_event: Event, data: Record<string,unknown>) {
    if (game.user?.isGM) await game.settings!.set(MODULE,"areaSettings",normalizeArea(data as Partial<AreaSettings>));
  }
}
export function registerAreaSettings() {
  game.settings!.register(MODULE,"areaSettings",{scope:"world",config:false,
    // @ts-expect-error Foundry v12 supports ObjectField settings; pinned typings omit this overload.
    type:new foundry.data.fields.ObjectField(),default:defaults,onChange:()=>ui.chat?.render(true)});
  game.settings!.registerMenu(MODULE,"areaSettingsMenu",{name:"Area Attacks & Suppressive Fire",label:"Configure",
    hint:"RAW sizes and evasion; configurable area sizes, evasion and suppressive-fire shapes.",
    icon:"fas fa-burst",type:AreaSettingsForm,restricted:true});
}
