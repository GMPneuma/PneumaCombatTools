const MODULE="pneuma-combattools";
export const EKG_ROWS=["gm","player","medtech"] as const;
export const EKG_COLUMNS=["owned","playerOwned","friendly","other"] as const;
export type EKGLevel="none"|"ekg"|"hp";
export type EKGPolicy={matrix:Record<string,EKGLevel>;biomonitor:"none"|"anyone"|"medtech"};
export const EKG_DEFAULTS:EKGPolicy={matrix:Object.fromEntries(EKG_ROWS.flatMap(row=>EKG_COLUMNS.map(col=>[row+"_"+col,row==="gm"||col==="owned"?"hp":"none"]))) as Record<string,EKGLevel>,biomonitor:"none"};
declare global {interface SettingConfig {"pneuma-combattools.ekgVisibility":EKGPolicy}}
export function ekgPolicy():EKGPolicy {const saved=game.settings!.get(MODULE,"ekgVisibility");return {matrix:{...EKG_DEFAULTS.matrix,...saved?.matrix},biomonitor:saved?.biomonitor??"none"};}
class EKGSettings extends FormApplication {
 constructor(){super({});}
 static override get defaultOptions(){return foundry.utils.mergeObject(super.defaultOptions,{id:"pneuma-ekg-settings",title:"Hover EKG visibility",width:720,height:"auto",template:"modules/pneuma-combattools/templates/ekg-settings.hbs",closeOnSubmit:true}) as typeof FormApplication.defaultOptions;}
 override getData(){const policy=ekgPolicy();return {rows:EKG_ROWS.map((row,i)=>({label:["GM","Player","MedTech Player"][i],cells:EKG_COLUMNS.map(col=>({name:row+"_"+col,options:[{value:"none",label:"None"},{value:"ekg",label:"Show EKG"},{value:"hp",label:"Show EKG + HP"}].map(o=>({...o,selected:policy.matrix[row+"_"+col]===o.value}))}))})),biomonitor:[{value:"none",label:"No One"},{value:"anyone",label:"Anyone"},{value:"medtech",label:"MedTechs only"}].map(o=>({...o,selected:policy.biomonitor===o.value}))};}
 protected override async _updateObject(_event:Event,data:Record<string,unknown>){if(!game.user?.isGM)return;const matrix:Record<string,EKGLevel>={};for(const row of EKG_ROWS)for(const col of EKG_COLUMNS){const key=row+"_"+col,value=data[key];matrix[key]=value==="hp"||value==="ekg"?value:"none";}const biomonitor=data.biomonitor==="anyone"||data.biomonitor==="medtech"?data.biomonitor:"none";await game.settings!.set(MODULE,"ekgVisibility",{matrix,biomonitor});}
}
export function registerEKGSettings(refresh:()=>void){game.settings!.register(MODULE,"ekgVisibility",{scope:"world",config:false,type:Object,default:EKG_DEFAULTS,onChange:refresh});game.settings!.registerMenu(MODULE,"ekgVisibilitySettings",{name:"Hover EKG visibility",label:"Configure",hint:"GM-controlled viewer matrix, HP overlay and Biomonitor access.",icon:"fas fa-heart-pulse",type:EKGSettings,restricted:true});}
