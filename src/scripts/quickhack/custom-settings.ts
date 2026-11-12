import {MODULE} from "./availability.js";
import {customQuickhacks, QUICKHACKS, type CustomQuickhack} from "./catalog.js";

export class CustomQuickhackSettings extends FormApplication {
  constructor(){super({});}
  static override get defaultOptions(){
    return foundry.utils.mergeObject(super.defaultOptions,{
      id:"pneuma-custom-quickhacks", title:"Custom Quickhacks", width:640, height:440, resizable:true,
      template:"modules/"+MODULE+"/templates/custom-quickhacks.hbs", closeOnSubmit:true,
    });
  }
  override getData(){return {hacks:customQuickhacks()};}
  override activateListeners(html:JQuery){
    super.activateListeners(html);
    const root=html[0]!;
    const list=root.querySelector<HTMLElement>("[data-hack-list]")!;
    const details=root.querySelector<HTMLElement>("[data-details]")!;
    const search=root.querySelector<HTMLInputElement>("[data-search]")!;
    const remove=root.querySelector<HTMLButtonElement>("[data-delete-hack]")!;
    const empty=details.querySelector<HTMLElement>("[data-empty-list]")!;
    const entries=()=>Array.from(details.querySelectorAll<HTMLFieldSetElement>("[data-entry]"));
    const nameOf=(row:HTMLElement)=>row.querySelector<HTMLInputElement>("[data-name]")!;
    let selected:HTMLFieldSetElement|undefined;
    function refresh(){
      const rows=entries();
      const query=search.value.trim().toLowerCase();
      const matches=rows.filter(row=>nameOf(row).value.toLowerCase().includes(query));
      if(!selected || !matches.includes(selected))selected=matches[0];
      rows.forEach(row=>{row.hidden=row!==selected;});
      empty.hidden=!!selected;
      empty.textContent=rows.length?"No matching quickhacks.":"Add a quickhack to get started.";
      remove.disabled=!selected;
      list.replaceChildren(...matches.map(row=>{
        const button=document.createElement("button");
        button.type="button";button.textContent=nameOf(row).value.trim()||"New quickhack";
        button.setAttribute("aria-pressed",String(row===selected));
        button.addEventListener("click",()=>{selected=row;refresh();list.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();});
        return button;
      }));
    }
    details.addEventListener("click",event=>{
      const browse=(event.target as Element).closest("[data-browse-icon]");
      const path=browse?.closest("fieldset")?.querySelector<HTMLInputElement>("[data-icon-path]");
      if(path)new FilePicker({type:"image",current:path.value,callback:value=>{path.value=value;}}).render(true);
    });
    search.addEventListener("input",refresh);
    details.addEventListener("input",event=>{
      if((event.target as Element).matches("[data-name]")){search.value="";refresh();}
    });
    root.querySelector("[data-add-hack]")!.addEventListener("click",()=>{
      const template=root.querySelector<HTMLTemplateElement>("template")!;
      selected=template.content.firstElementChild!.cloneNode(true) as HTMLFieldSetElement;
      selected.dataset.entry="custom-"+foundry.utils.randomID();
      selected.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>("[name]").forEach(field=>{field.name+=selected!.dataset.entry;});
      details.append(selected);search.value="";refresh();nameOf(selected).focus();
    });
    remove.addEventListener("click",()=>{selected?.remove();refresh();});
    root.addEventListener("submit",event=>{
      const invalid=details.querySelector<HTMLInputElement>("input:invalid");
      if(!invalid)return;
      event.preventDefault();event.stopImmediatePropagation();
      selected=invalid.closest("fieldset")!;search.value="";refresh();invalid.reportValidity();
    },true);
    refresh();
  }
  protected override async _updateObject(_event:Event,data:Record<string,unknown>){
    if(!game.user?.isGM)return;
    const next:CustomQuickhack[]=[];
    const names=new Set(QUICKHACKS.map(h=>h.name.toLowerCase()));
    const customFields=Object.keys(data).filter(k=>k.startsWith("hackName-"));
    for(const key of customFields) {
      const id=key.slice("hackName-".length);
      const name=String(data[key]??"").trim(), description=String(data["hackDescription-"+id]??"").trim();
      const rawDV=data["hackDV-"+id];
      const dv=Number(rawDV);
      if(!name || !Number.isSafeInteger(dv) || dv<=0 || names.has(name.toLowerCase()))throw Error("Each custom quickhack needs a unique name and a positive whole-number DV.");
      names.add(name.toLowerCase());
      const img=String(data["hackIcon-"+id]??"").trim();
      next.push({id,name,dv,description,...(img?{img}:{})});
    }
    await game.settings!.set(MODULE,"customQuickhacks",next);
  }
}
