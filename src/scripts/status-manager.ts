import {statusAutomationPolicy} from "./status-automation.js";
import {masterStatuses,type StatusDefinition} from "./status-catalog.js";
import {customStatuses,validateCustomStatuses,registeredNativeStatuses,type CustomStatus} from "./status-settings.js";
import {createCustomEffectTemplate} from "./custom-effects.js";
import {nativeStatusItem,nativeEffectsForStatus,statusTemplates,saveStatusTemplate} from "./status-sources.js";
import {DEFAULT_STATUS_COLOR,sectionColors,STATUS_COLOR_TABS,validateStatusColor,statusColor,paintStatusIcon,type SectionColors} from "./status-colors.js";
const MODULE="pneuma-combattools";
const hidden=new Set(["Lightly Wounded","Seriously Wounded","Mortally Wounded","Quick Fix"]);
const normalize=(name:string)=>game.i18n!.localize(name).trim().toLowerCase();
export type StatusTab="native"|"native-empty"|"module"|"custom";
export interface StatusRow extends CustomStatus {tab:StatusTab;group?:string;source:string;effects:{id:string;name:string}[];readOnly:boolean;customized:boolean;unavailable:boolean;effectState:string;effectLabel:string;effectDetail:string}
export function classifyStatus(userAdded:boolean,hasNativeSource:boolean,hasNativeEffect:boolean):StatusTab {
  return userAdded?"custom":hasNativeSource?(hasNativeEffect?"native":"native-empty"):"module";
}
export async function statusManagerRows():Promise<StatusRow[]> {
  const overrides=statusTemplates(),native=registeredNativeStatuses();
  const definitions:(StatusDefinition & {effectUuid?:string;color?:string})[]=[...masterStatuses.filter(status=>!hidden.has(status.name)),...customStatuses().map(status=>({...status,group:"custom" as const}))];
  return Promise.all(definitions.map(async status=>{
    const userAdded=status.group==="custom";
    const registered=native.find(row=>row.id===status.id||normalize(row.name??row.label??"")===normalize(status.name));
    let item:Item|null=null,unavailable=false;
    try {if(!userAdded)item=await nativeStatusItem(status);}catch {unavailable=true;}
    const expectsItem=!!status.binding||["drugs","pharma","addiction"].includes(status.group);
    if(expectsItem&&!item)unavailable=true;
    const effects=item?nativeEffectsForStatus(item,status):[];
    const hasNative=!!item||!!registered||expectsItem;
    const hasEffect=effects.length>0||!!(registered as {changes?:unknown[]}|undefined)?.changes?.length;
    const template=hasEffect?undefined:overrides[status.id]??(status.effectUuid?{effectUuid:status.effectUuid}:undefined);
    let effective=effects,missing=false;
    if(template) {
      try {
        const uuid=template.itemUuid??template.effectUuid;
        const doc=uuid?await fromUuid(uuid as Parameters<typeof fromUuid>[0]):null;
        effective=template.itemUuid&&doc instanceof Item?nativeEffectsForStatus(doc,status):doc instanceof ActiveEffect?[doc]:[];
        missing=!effective.length;
      }catch {effective=[];missing=true;}
    }
    const available=template?!missing:hasEffect;
    const changes=effective.reduce((count,effect)=>count+(effect.changes?.length??0),0)
      +(!template&&!item?((registered as {changes?:unknown[]}|undefined)?.changes?.length??0):0);
    const effectState=missing?"missing":available?(template?"custom":"native"):unavailable?"unknown":"none";
    const effectLabel=available?"Has effect":"No effect";
    const effectDetail=missing?"Saved source was deleted or is unavailable.":available
      ?changes+" modifier"+(changes===1?"":"s")+" configured"+(effective.length>1?" across "+effective.length+" effects":"")
      :unavailable?"Cannot check the native source.":"No modifier effect configured.";
    const policy=statusAutomationPolicy(status.name,userAdded);
    return {...status,effectUuid:status.effectUuid??template?.effectUuid,tab:classifyStatus(userAdded,hasNative,hasEffect),...policy,
      showEffectState:!policy.automation||hasEffect||!!template,
      canEditEffect:!hasEffect&&(!policy.automationManaged||!!template),
      source:unavailable?"Native source unavailable":item?item.name??"System Item":registered?"Registered Foundry status":userAdded?"User added":"Combat Tools",
      effects:effective.length?effective.map(effect=>({id:effect.id!,name:effect.name??"Effect"})):(!template&&hasEffect?[{id:status.id,name:"Registered effect"}]:[]),
      readOnly:hasEffect,customized:!!template,unavailable,effectState,effectLabel,effectDetail};
  }));
}
/** A view contains only display data; never open a writable system sheet. */
export async function viewStatusEffect(status:StatusDefinition,effectIndex?:number):Promise<void> {
  const item=await nativeStatusItem(status);
  const effects=item?nativeEffectsForStatus(item,status):[];
  const selected=effectIndex===undefined?effects:effects.slice(effectIndex,effectIndex+1);
  const registered=registeredNativeStatuses().find(row=>row.id===status.id||normalize(row.name??row.label??"")===normalize(status.name));
  const entries=selected.length?selected.map(effect=>({name:effect.name,data:effect.toObject()})):registered?[{name:status.name,data:registered}]:[];
  if(!entries.length)throw Error("Native effect is unavailable.");
  const content=(await Promise.all(entries.map(({name,data})=>renderTemplate("modules/"+MODULE+"/templates/status-effect-view.hbs",{
    name:name??status.name,
    changes:((data as {changes?:{key:string;value:string;mode:number}[]}).changes??[]).map(change=>({
      key:change.key,value:change.value,mode:(["Custom","Multiply","Add","Downgrade","Upgrade","Override"] as string[])[change.mode]??String(change.mode)
    })),
    duration:Object.entries((data as {duration?:{seconds?:number|null;rounds?:number|null;turns?:number|null}}).duration??{})
      .filter(([unit,value])=>["seconds","rounds","turns"].includes(unit)&&typeof value==="number"&&value>0)
      .map(([unit,value])=>value+" "+unit).join(", ")
  })))).join("");
  new Dialog({title:status.name+" - System effect (view only)",content,buttons:{close:{label:"Close"}}},{width:600,height:"auto",classes:["dialog","pneuma-status-effect-dialog"]}).render(true);
}
export async function editStatusEffect(status:StatusDefinition & {effectUuid?:string}):Promise<ActiveEffect> {
  if(!game.user?.isGM)throw Error("Only the GM can configure status effects.");
  const native=await nativeStatusItem(status);
  const registered=registeredNativeStatuses().find(row=>row.id===status.id||normalize(row.name??row.label??"")===normalize(status.name));
  if((native&&nativeEffectsForStatus(native,status).length)||(registered as {changes?:unknown[]}|undefined)?.changes?.length)
    throw Error("Existing system effects are view-only.");
  if(status.binding&&!native)throw Error("Native source is unavailable for "+status.name+".");
  const saved=statusTemplates()[status.id]??(status.effectUuid?{effectUuid:status.effectUuid}:undefined);
  if(saved?.effectUuid) {
    const effect=await fromUuid(saved.effectUuid as Parameters<typeof fromUuid>[0]);
    if(!(effect instanceof ActiveEffect))throw Error("Configured effect is missing. Remove this effect before creating a replacement.");
    return effect;
  }
  if(statusAutomationPolicy(status.name,status.group==="custom").automationManaged)
    throw Error("This status is managed by Combat Tools; supplemental effects cannot be added.");
  const effect=await createCustomEffectTemplate(status);
  await saveStatusTemplate(status.id,{effectUuid:effect.uuid});return effect;
}
export class StatusManager extends FormApplication {
  constructor(){super({});}
  static override get defaultOptions(){return foundry.utils.mergeObject(super.defaultOptions,{
    id:"pneuma-custom-statuses",title:"Status effects",width:850,height:680,resizable:true,
    template:"modules/"+MODULE+"/templates/custom-statuses.hbs",closeOnSubmit:false,
    tabs:[{navSelector:".status-tabs",contentSelector:".status-panels",initial:"native"}]
  });}
  override async getData(){
    const rows=(await statusManagerRows()).sort((a,b)=>a.name.localeCompare(b.name));
    const colors=sectionColors();
    return {tabs:[
      {id:"native",label:"System effects",description:"Existing system effects are view-only. View their details. Combat Tools does not replace these effects."},
      {id:"native-empty",label:"System statuses",description:"System statuses or Items without a matching effect. Add modifiers using the system editor."},
      {id:"module",label:"Combat Tools Statuses",description:"Statuses supplied by Combat Tools. Add or edit a modifier effect; existing Combat Tools automation still applies."},
      {id:"custom",label:"Custom User Statuses",description:"Add your own statuses and configure their effects."}
    ].map(tab=>({...tab,color:colors[tab.id as StatusTab],rows:rows.filter(row=>row.tab===tab.id).map(row=>({...row,
      protectedColor:row.group==="addiction",iconColor:statusColor(row,colors),colorValue:row.color??colors.custom,inheritColor:!row.color
    })),isCustom:tab.id==="custom"}))};
  }
  override activateListeners(html:JQuery){
    super.activateListeners(html);
    const preview=()=>{
      for(const img of Array.from(html[0]!.querySelectorAll<HTMLImageElement>("img[data-status-preview]"))) {
        const row=img.closest<HTMLElement>("[data-status-id]")!,panel=row.closest<HTMLElement>(".tab")!;
        const section=panel.querySelector<HTMLInputElement>(".status-section-color")?.value??DEFAULT_STATUS_COLOR;
        const own=row.querySelector<HTMLInputElement>(".status-color")?.value;
        const inherit=row.querySelector<HTMLInputElement>(".status-inherit-color")?.checked??true;
        void paintStatusIcon(img,row.dataset.protectedColor==="true"?undefined:!inherit&&own?own:section);
      }
    };
    preview();
    html.on("click","[data-reset-section-color], [data-reset-user-color]",event=>{
      event.preventDefault();
      const button=event.currentTarget as HTMLElement;
      const panel=button.closest<HTMLElement>(".tab")!;
      const section=panel.querySelector<HTMLInputElement>(".status-section-color")!;
      if(button.hasAttribute("data-reset-section-color"))section.value=DEFAULT_STATUS_COLOR;
      else {
        const row=button.closest<HTMLElement>("[data-status-id]")!;
        row.querySelector<HTMLInputElement>(".status-color")!.value=section.value;
        row.querySelector<HTMLInputElement>(".status-inherit-color")!.checked=true;
      }
      preview();
    });
    html.on("input change",".status-section-color, .status-color, .status-inherit-color",event=>{
      const input=event.currentTarget as HTMLInputElement;
      if(input.classList.contains("status-color"))input.closest("[data-status-id]")!.querySelector<HTMLInputElement>(".status-inherit-color")!.checked=false;
      preview();
    });
    html.on("click","[data-add-status]",()=>{
      const row=document.createElement("div");row.className="pneuma-custom-status-row";row.dataset.statusId="pneuma-custom-"+foundry.utils.randomID();
      row.innerHTML="          <div class=\"status-user-icon\"><img src=\"icons/svg/aura.svg\" data-status-preview alt=\"Status icon\" width=\"48\" height=\"48\"><input type=\"hidden\" class=\"status-img\" value=\"icons/svg/aura.svg\"><button type=\"button\" class=\"status-edit-icon\" data-pick-icon aria-label=\"Edit icon\">Edit icon</button></div>\n          <div class=\"status-user-color\"><span class=\"status-field-title\">Icon color</span><span class=\"status-color-controls\"><input type=\"color\" class=\"status-color\" aria-label=\"Status icon color\" value=\"#888888\"><button type=\"button\" data-reset-user-color aria-label=\"Reset status icon color\" title=\"Use section default\">Reset</button></span><label><input type=\"checkbox\" class=\"status-inherit-color\" checked> Use section default</label></div>\n          <label>Name<input class=\"status-name\" aria-label=\"Status name\" value=\"\" required></label>\n          <div class=\"status-user-effect\"><span class=\"status-field-title\">Effect</span><span class=\"status-effect-badge\" data-effect-state=\"none\" title=\"No modifier effect configured.\">No effect</span></div>\n          <button type=\"button\" data-edit-custom aria-label=\"Edit effect\"><i class=\"fas fa-pen-to-square\"></i> Edit Effect</button>\n          <button type=\"button\" data-remove-status title=\"Delete status\" aria-label=\"Delete status\"><i class=\"fas fa-trash\"></i> Delete</button>\n";
      row.querySelector<HTMLInputElement>(".status-color")!.value=html[0]!.querySelector<HTMLInputElement>('[data-tab="custom"] .status-section-color')?.value??DEFAULT_STATUS_COLOR;
      html.find('[data-tab="custom"] .pneuma-custom-status-rows').append(row);
      preview();
    });
    html.on("click","[data-remove-status]",event=>event.currentTarget.closest(".pneuma-custom-status-row")?.remove());
    html.on("click","[data-pick-icon]",event=>{
      const input=(event.currentTarget as HTMLElement).closest(".pneuma-custom-status-row")!.querySelector<HTMLInputElement>(".status-img")!;
      new FilePicker({type:"image",current:input.value,callback:path=>{input.value=path;input.dispatchEvent(new Event("change",{bubbles:true}));}}).render(true);
    });
    html.on("change",".status-img",event=>{
      const input=event.currentTarget as HTMLInputElement,img=input.closest("[data-status-id]")!.querySelector<HTMLImageElement>("img[data-status-preview]")!;
      img.dataset.statusOriginalSrc=input.value;img.src=input.value;preview();
    });
    html.on("click","[data-view-status]",async event=>{
      const row=(event.currentTarget as HTMLElement).closest<HTMLElement>("[data-status-id]")!;
      const status=masterStatuses.find(status=>status.id===row.dataset.statusId);
      if(!status)return;
      try {await viewStatusEffect(status);}
      catch(error){ui.notifications!.error((error as Error).message);}
    });
    html.on("click","[data-edit-custom], [data-edit-status], [data-reset-status]",async event=>{
      if(!game.user?.isGM)return;
      const button=event.currentTarget as HTMLButtonElement;
      const row=button.closest<HTMLElement>("[data-status-id]")!;const id=row.dataset.statusId!;
      button.disabled=true;
      try {
        await this.saveCustomRows();
        if(button.hasAttribute("data-reset-status")){await saveStatusTemplate(id,null);this.render(false);return;}
        let effect:ActiveEffect;
        if(button.hasAttribute("data-edit-custom")) {
          const rows=customStatuses().map(status=>({...status}));const status=rows.find(status=>status.id===id)!;
          const source=status.effectUuid?await fromUuid(status.effectUuid as Parameters<typeof fromUuid>[0]):null;
          effect=source instanceof ActiveEffect?source:await createCustomEffectTemplate(status);
          status.effectUuid=effect.uuid;row.dataset.effectUuid=effect.uuid;
          await game.settings!.set(MODULE,"customStatuses",rows);
        }else {
          const status=masterStatuses.find(status=>status.id===id)??customStatuses().find(status=>status.id===id);
          if(!status)throw Error("Status no longer exists.");
          effect=await editStatusEffect({...status,group:(status as StatusDefinition).group??"custom"});
        }
        effect.sheet?.render(true);this.render(false);
      }catch(error){ui.notifications!.error((error as Error).message);}finally{button.disabled=false;}
    });
  }
  private async saveCustomRows():Promise<void>{
    if(!game.user?.isGM)return;
    const rows=Array.from(this.element[0]!.querySelectorAll<HTMLElement>(".pneuma-custom-status-row")).map(row=>({
      id:row.dataset.statusId!,name:row.querySelector<HTMLInputElement>(".status-name")!.value,
      img:row.querySelector<HTMLInputElement>(".status-img")!.value,effectUuid:row.dataset.effectUuid||undefined,
      color:row.querySelector<HTMLInputElement>(".status-inherit-color")?.checked?undefined:row.querySelector<HTMLInputElement>(".status-color")?.value
    }));
    const valid=validateCustomStatuses(rows);
    const colors=Object.fromEntries(STATUS_COLOR_TABS.map(tab=>[tab,validateStatusColor(this.element[0]!.querySelector<HTMLInputElement>('.status-section-color[data-section="'+tab+'"]')?.value)??DEFAULT_STATUS_COLOR])) as SectionColors;
    await game.settings!.set(MODULE,"statusSectionColors",colors);
    await game.settings!.set(MODULE,"customStatuses",valid);
  }
  protected override async _updateObject(){try{await this.saveCustomRows();this.render(false);}catch(error){ui.notifications!.error((error as Error).message);throw error;}}
}
