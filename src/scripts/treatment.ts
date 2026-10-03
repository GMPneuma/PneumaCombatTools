import {findNativeItem} from "./native-lookup.js";
import {escapeHTML as esc} from "./shared.js";
import {nativeCard,spendBonusLuck,type RollItem} from "./native-combat.js";
import {checkedLuck} from "./evasion-rules.js";
import {postTreatment} from "./treatment-card.js";

export interface TreatmentChoice {name:string;skill:string;dv:number;stage:"Stabilize"|"QuickFix"|"Treatment";location?:"body"|"head";permanent?:boolean}
export function injuryTreatmentChoices(injury:Item,location:"body"|"head"):TreatmentChoice[] {
  const get=(path:string)=>foundry.utils.getProperty(injury,"system."+path);
  const result:TreatmentChoice[]=[];
  for(const [stage,path,skills] of [["QuickFix","quickFix",["First Aid","Paramedic"]],["Treatment","treatment",["Paramedic","Surgery"]]] as const) {
    if(path==="treatment"&&get("treatment.type")==="quickFix")continue;
    for(const skill of skills) {
      const dv=Number(get(path+".dv"+skill.replace(" ","")));
      if(dv>0)result.push({name:injury.name!,skill,dv,stage,location,permanent:stage==="QuickFix"&&get("treatment.type")==="quickFix"});
    }
  }
  return result;
}
function nativeChoice(actor:Actor,choice:TreatmentChoice):{item:Item;title:string;type:string;subtype?:string}|undefined {
  if(choice.skill!=="Surgery") {
    const item=findNativeItem(actor.items,choice.skill);return item?{item,title:item.name!,type:"skill"}:undefined;
  }
  const item=findNativeItem(actor.items,"Medtech");
  const abilities=foundry.utils.getProperty(item??{},"system.abilities") as {name:string;hasRoll:boolean}[]|undefined;
  const ability=abilities?.find(row=>row.hasRoll&&row.name==="Surgery Skill");
  return item&&ability?{item,title:ability.name,type:"roleAbility",subtype:"subRoleAbility"}:undefined;
}
export async function openTreatment():Promise<void> {
  const tokens=canvas.tokens?.controlled??[],source=tokens[0],actor=source?.actor;
  if(tokens.length!==1||!actor?.isOwner||!["character","mook"].includes(String(actor.type)))throw Error("Select one character token you control.");
  const targets=Array.from(game.user?.targets??[]);
  const patients=(canvas.tokens?.placeables??[]).filter(token=>token.actor?.hasPlayerOwner&&(game.user?.isGM||token.isVisible)).sort((a,b)=>a.name.localeCompare(b.name));
  const selected=targets.length===1&&patients.includes(targets[0]!)?targets[0]!.document.uuid:"";
  const patientControl='<div class="pneuma-treatment-patient-picker"><label>Patient <select data-treatment-patient><option value="">Select patient…</option>'+patients.map(token=>'<option value="'+esc(token.document.uuid)+'"'+(selected===token.document.uuid?' selected':'')+'>'+esc(token.name)+'</option>').join('')+'<option value="custom">Type a patient name…</option></select></label><input type="text" data-treatment-patient-name placeholder="Patient name" aria-label="Patient name" hidden></div>';
  const injuries:Record<string,Item[]>={};
  for(const location of ["body","head"] as const) {
    const pack=game.packs?.get("cyberpunk-red-core.core_critical-injuries-"+location);
    if(!pack)throw Error("The native "+location+" critical injury compendium is unavailable.");
    injuries[location]=(await pack.getDocuments() as Item[]).filter(item=>String(item.type)==="criticalInjury").sort((a,b)=>a.name!.localeCompare(b.name!));
  }
  const slot=(stage:string,skill:string)=>'<button type="button" data-treatment-stage="'+stage+'" data-treatment-skill="'+skill+'">'+skill+'</button>';
  const section=(location:"body"|"head")=>'<section class="pneuma-treatment-section" data-treatment-location="'+location+'"><h3>'+(location==="body"?'Body Crits':'Head Crits')+'</h3><div class="pneuma-treatment-columns"><div><h4>Crit</h4><select data-treatment-select aria-label="'+location+' critical injury">'+injuries[location]!.map((item,index)=>'<option value="'+index+'">'+esc(item.name)+'</option>').join('')+'</select></div><div><h4>QuickFix</h4><div class="pneuma-treatment-options">'+slot("QuickFix","First Aid")+slot("QuickFix","Paramedic")+'</div></div><div><h4>Treatment</h4><div class="pneuma-treatment-options">'+slot("Treatment","Paramedic")+slot("Treatment","Surgery")+'</div></div></div></section>';
  const content=patientControl+'<div class="pneuma-treatment-list"><section class="pneuma-treatment-section" data-treatment-location="stabilize"><h3>Stabilize</h3><table class="pneuma-stabilize-table"><thead><tr><th>Wound State</th><th>First Aid</th><th>Paramedic</th></tr></thead><tbody>'+([['Lightly Wounded',10],['Seriously Wounded',13],['Mortally Wounded',15]] as const).map(([name,dv])=>'<tr><td>'+name+'</td>'+['First Aid','Paramedic'].map(skill=>'<td><button type="button" data-treatment-stage="Stabilize" data-treatment-skill="'+skill+'" data-wound-name="'+name+'" data-wound-dv="'+dv+'">'+skill+' DV'+dv+'</button></td>').join('')+'</tr>').join('')+'</tbody></table></section>'+section("body")+section("head")+'</div>';
  let busy=false;
  new Dialog({title:"Treatment — "+actor.name,content,buttons:{},render:html=>{
    const root=(html as JQuery)[0]!;
    const patientSelect=root.querySelector<HTMLSelectElement>("[data-treatment-patient]")!,patientName=root.querySelector<HTMLInputElement>("[data-treatment-patient-name]")!;
    patientSelect.addEventListener("change",()=>{patientName.hidden=patientSelect.value!=="custom";if(!patientName.hidden)patientName.focus();});
    const choiceFor=(section:HTMLElement,button:HTMLButtonElement):TreatmentChoice|undefined=>{
      const location=section.dataset.treatmentLocation!;
      const skill=button.dataset.treatmentSkill!,stage=button.dataset.treatmentStage!;
      if(location==="stabilize")return {name:button.dataset.woundName!,skill,dv:Number(button.dataset.woundDv),stage:"Stabilize"};
      const selection=section.querySelector<HTMLSelectElement>("select")!.value;
      const injury=injuries[location]?.[Number(selection)];if(!injury)return;
      return injuryTreatmentChoices(injury,location as "body"|"head").find(row=>row.skill===skill&&row.stage===stage);
    };
    root.querySelectorAll<HTMLElement>("[data-treatment-location]").forEach(section=>{
      const update=()=>section.querySelectorAll<HTMLButtonElement>("button").forEach(button=>{
        const choice=choiceFor(section,button);
        button.textContent=button.dataset.treatmentSkill+(choice?' DV'+choice.dv:' —');button.disabled=!choice||!nativeChoice(actor,choice)||busy;
        button.title=choice?(choice.permanent?'Permanent treatment via QuickFix':''):'Not available for this injury';
      });
      section.querySelector("select")?.addEventListener("change",update);update();
      section.querySelectorAll<HTMLButtonElement>("button").forEach(button=>button.addEventListener("click",event=>{
        if(busy||button.disabled)return;const choice=choiceFor(section,button),native=choice&&nativeChoice(actor,choice);if(!choice||!native||!actor.isOwner)return;
        const target=patientSelect.value==="custom"?{name:patientName.value.trim()}:patients.find(token=>token.document.uuid===patientSelect.value);
        if(!target?.name){ui.notifications!.error("Select a patient or enter a patient name.");return;}
        busy=true;update();
        void (async()=>{
          const item=native.item as RollItem;
          let roll=item.createRoll(native.type,actor,native.subtype?{rollSubType:native.subtype,subRoleName:native.title}:undefined);
          roll.rollTitle=choice.stage+" — "+choice.name+" — "+choice.skill+" DV"+choice.dv;
          if(!await roll.handleRollDialog({type:"pneuma-treatment",ctrlKey:event.shiftKey,metaKey:false},actor,item))return;
          checkedLuck(Number(foundry.utils.getProperty(actor,"system.stats.luck.value")),0,roll.luck);
          roll=await item.confirmRoll(roll);await spendBonusLuck(actor,roll.luck);await roll.roll();
          await postTreatment(source!,target,choice.stage+" — "+choice.name,await nativeCard(roll),roll.resultTotal,choice.dv);
        })().catch(error=>ui.notifications!.error(String(error))).finally(()=>{busy=false;update();});
      }));
    });
  }},{width:720,classes:["pneuma-roll-dialog"]}).render(true);
}
