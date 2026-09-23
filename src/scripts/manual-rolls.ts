import { MANUAL_MODULE as M, manualEscape as esc, manualNumber, groupContent, type ManualCard, type InjuryResult } from "./manual-roll-state.js";
import { damageContent, handleDamage, renderDamage, selectedDamageTarget, damageValues, type DamageRequest } from "./damage-flow.js";
import { validateDamageStatuses } from "./damage-status.js";
import { damageSixes } from "./critical-injury.js";
import { nativeCard, rollHidden, nativeAPI, diceJSON, spendBonusLuck, type NativeRoll, type RollItem } from "./native-combat.js";
import { canRenderCombatCard } from "./card-structure.js";
import { requireCombatSocket } from "./socket-health.js";
import type { Exchange } from "./combat-resolution.js";

type ManualNativeRoll = NativeRoll & { bonusDamage: number; rollCardExtraArgs: Record<string, unknown>; calculateCritical: boolean };
type Request = { action: "effects" | "damage" | "injury" | "review" | "claim" | "commit" | "release" | "reset"; target?: string; row?: string; nonce?: string; effects?: string[]; damage?: DamageRequest; total?: number; html?: string };
type Wire = { manualType: "request" | "reply"; id: string; user: string; message: string; request: Request; gm?: string; error?: string };
const channel = "module." + M;
const flag = "flags." + M + ".manualRoll";
const state = (message: ChatMessage) => foundry.utils.getProperty(message, flag) as ManualCard | undefined;
const authority = () => game.users?.filter(user => user.active && user.isGM).sort((a,b) => a.id.localeCompare(b.id))[0];
const report = (error: unknown) => ui.notifications!.error((error as Error).message ?? String(error));
let queue: Promise<unknown> = Promise.resolve();
const pending = new Map<string, {resolve(): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout>}>();
const retry = new Map<string, Request>();
async function nativeRolls() {
  const path = "/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js";
  return await import(path) as { CPRRoll: new(title: string, formula: string) => ManualNativeRoll; CPRDamageRoll: new(title: string, formula: string, weapon: string) => ManualNativeRoll; CPRTableRoll: new(title: string, roll: Roll, template: string) => ManualNativeRoll };
}
function rollMode(): string { return game.settings!.get("core", "rollMode") as string; }
async function showDice(roll: NativeRoll, mode: string) {
  const {Dice} = await nativeAPI();
  for (const json of diceJSON(roll)) await Dice.handle3dDice(Roll.fromJSON(json) as Roll, mode);
}
function exchange(data: ManualCard, target = ""): Exchange {
  return {attacker:target,defender:target,defenderActor:"",attackerName:data.title,defenderName:"Selected token",ranged:false,category:"Manual",title:data.title,total:0,html:"",dice:[],rollMode:data.rollMode,state:"resolved",damage:data.damage,attackMode:data.damage?.result?.values.location === "head" ? "aimed" : "attack",location:data.damage?.result?.values.location,criticalMethod:"Ranged"};
}
export function manualContent(data: ManualCard): string {
  const content = data.kind === "group" ? groupContent(data) : data.kind === "damage" ? '<h3>' + esc(data.title) + '</h3>' + damageContent(exchange(data)) : data.injury?.html ?? "";
  return '<section class="rollcard pneuma-combat-message pneuma-manual-card" data-manual-kind="' + data.kind + '">' + content
    + '<div class="pneuma-manual-controls"></div><div class="pneuma-manual-receipts">' + (data.injuryApplications ?? []).map(name => '<p>' + esc(name) + '</p>').join('') + '</div></section>';
}
async function save(message: ChatMessage, data: ManualCard) { await message.update({content:manualContent(data),[flag]:foundry.utils.deepClone(data)} as never); }
async function create(data: ManualCard) {
  const message = {content:manualContent(data),speaker:ChatMessage.getSpeaker(),flags:{[M]:{manualRoll:data}}};
  ChatMessage.applyRollMode(message as never, data.rollMode as never);
  return ChatMessage.create(message as never);
}
async function injuryTable(location: "body" | "head") {
  const path = "/systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js";
  const utils = (await import(path)).default as {GetCompendiumDoc(pack:string,name:string):Promise<RollTable | Item>;GetCompendiumIdByLabel(name:string):string | null};
  const name = location === "head" ? "Critical Injuries (Head)" : "Critical Injuries (Body)";
  const pack = game.settings!.get("cyberpunk-red-core", "criticalInjuryRollTableCompendium" as never) as string;
  const tablePack = game.packs!.get(pack);
  if (!tablePack) throw Error("The configured critical injury table compendium is unavailable.");
  await tablePack.getIndex();
  if (!tablePack.index.find(entry=>entry.name===name)) throw Error("The configured compendium has no " + name + " table.");
  const table = await utils.GetCompendiumDoc(pack,name) as RollTable;
  const items = utils.GetCompendiumIdByLabel(name);
  if (!table || !items) throw Error("The configured critical injury table or compendium is unavailable.");
  await game.packs!.get(items)?.getIndex();
  return {table,items,utils};
}
async function rollInjury(location: "body" | "head", mode: string): Promise<InjuryResult> {
  const {table,items,utils} = await injuryTable(location);
  const result = await table.roll();
  if (result.results.length !== 1) throw Error("The native injury table must return one injury.");
  const item = await utils.GetCompendiumDoc(items, result.results[0]!.text!) as Item;
  if (!item || String(item.type) !== "criticalInjury") throw Error("The rolled injury item is unavailable.");
  const {CPRTableRoll} = await nativeRolls();
  const roll = new CPRTableRoll(item.name!, result.roll, "systems/cyberpunk-red-core/templates/chat/cpr-critical-injury-rollcard.hbs");
  roll.resultTotal = result.roll.total!;
  roll.rollCardExtraArgs = {tableName:table.name,itemName:item.name,itemImg:item.img};
  roll.entityData = {actor:"",token:"",item:item.name!,tokens:[],comp:items} as NativeRoll["entityData"];
  await showDice(roll, mode);
  return {location,item:item.uuid,name:item.name!,html:await nativeCard(roll)};
}
async function applyInjuryResult(data: ManualCard, actor: Actor): Promise<string> {
  let injury = data.injury!;
  const duplicate = game.settings!.get("cyberpunk-red-core", "preventDuplicateCriticalInjuries" as never) as string;
  if (duplicate === "reroll") {
    const {table}=await injuryTable(injury.location);
    if (table.results.size && table.results.contents.every(result=>actor.items.some(item=>String(item.type)==="criticalInjury" && item.name===result.text)))
      throw Error("This character already has every injury on this table.");
  }
  let attempts = 0;
  while (actor.items.some(item => String(item.type) === "criticalInjury" && item.name === injury.name)) {
    if (duplicate !== "reroll") { if (duplicate === "warn") ui.notifications!.warn(actor.name + " already has " + injury.name + "."); break; }
    if (++attempts > 100) throw Error("No unused injury found. Check the actor's existing injuries.");
    injury = await rollInjury(injury.location, data.rollMode);
  }
  const source = await fromUuid(injury.item) as Item | null;
  if (!source || String(source.type) !== "criticalInjury") throw Error("The injury item no longer exists.");
  await actor.createEmbeddedDocuments("Item", [{name:source.name,type:source.type,img:source.img,system:foundry.utils.deepClone(source.system),effects:source.effects.map(effect=>effect.toObject())}] as never);
  return actor.name + " — " + injury.name;
}
/** Serialized by the elected GM, including local requests. */
export async function handleManualRequest(wire: Pick<Wire,"message" | "user" | "request">): Promise<void> {
  const message = game.messages!.get(wire.message) as ChatMessage | undefined;
  const user = game.users!.get(wire.user) as User | undefined;
  const original = message && state(message);
  if (!message || !user || !original) throw Error("This roll card is unavailable.");
  if (!user.isGM && (message.blind || message.whisper.length && !message.whisper.includes(user.id!) && message.author?.id !== user.id)) throw Error("This card is not visible to you.");
  const data = foundry.utils.deepClone(original);
  const req = wire.request;
  if (data.kind === "group") {
    const row = data.rows?.find(row=>row.user===req.row);
    if (!row || (!user.isGM && row.user !== user.id)) throw Error("This roll belongs to another player.");
    const actor = await fromUuid(row.actor) as Actor | null;
    if (!actor || !actor.testUserPermission(user,"OWNER")) throw Error("You do not own the requested character.");
    if (req.action === "claim") {
      if (row.state !== "waiting" || !req.nonce) throw Error("This roll is already in progress or complete.");
      row.state="rolling";row.nonce=req.nonce;row.roller=user.id!;
    } else if (req.action === "commit") {
      if (row.nonce !== req.nonce || row.roller !== user.id) throw Error("This roll reservation expired.");
      if (row.state === "done") return;
      if (row.state !== "rolling" || !Number.isFinite(req.total) || typeof req.html !== "string") throw Error("Invalid roll result.");
      row.state="done";row.total=req.total;row.html=req.html;
    } else if (req.action === "release" || req.action === "reset") {
      if (req.action === "reset" ? !user.isGM : row.nonce !== req.nonce || row.roller !== user.id) throw Error("Cannot release this roll.");
      if (row.state !== "rolling") return;
      row.state="waiting";delete row.nonce;delete row.roller;
    } else throw Error("Unknown group action.");
    await save(message,data);return;
  }
  if (req.action === "effects") {
    if (!user.isGM && user.id !== data.creator) throw Error("Only the roller or GM can edit effects.");
    if (!data.damage || !["rolled","applied"].includes(data.damage.status)) throw Error("Damage is busy or awaiting review.");
    data.damage.statusEffects=validateDamageStatuses(req.effects);await save(message,data);return;
  }
  if (req.action === "review") {
    if (!user.isGM) throw Error("GM only.");
    if (data.damage && ["review","applying"].includes(data.damage.status)) data.damage.status="applied";
    data.injuryBusy=false;await save(message,data);return;
  }
  const token = req.target ? await fromUuid(req.target) as TokenDocument | null : null;
  const actor = token?.actor;
  if (!actor || !actor.testUserPermission(user,"OWNER")) throw Error("Select a token you own, or ask the GM to apply this roll.");
  if (req.action === "damage" && data.kind === "damage" && req.damage?.action === "damageApply") {
    const ex=exchange(data,token!.uuid);
    await handleDamage({...req.damage,targetUuid:token!.uuid,application:"selected"},user,ex,()=>save(message,data));
  } else if (req.action === "injury") {
    if (data.kind === "damage" && (data.damage?.result?.sixes ?? 0) < 2) throw Error("This damage roll does not qualify for a critical injury.");
    if (data.injuryBusy) throw Error("Injury application is in progress or needs GM review.");
    data.injuryBusy=true;await save(message,data);
    try {
      const summary=await applyInjuryResult(data.kind === "critical" ? data : {...data,injury:await rollInjury(data.damage?.result?.values.location === "head" ? "head" : "body",data.rollMode)},actor);
      data.injuryApplications=[...(data.injuryApplications??[]),summary];data.injuryBusy=false;await save(message,data);
    } catch(error) { throw Error("Injury application interrupted; GM must check the actor before clearing review. " + (error as Error).message); }
  } else throw Error("Unknown manual roll action.");
}
function send(message: string, request: Request): Promise<void> {
  requireCombatSocket();const gm=authority();if(!gm)throw Error("An active GM is required to update this card.");
  const wire:Wire={manualType:"request",id:foundry.utils.randomID(),message,user:game.user!.id!,request};
  if (gm.id===game.user!.id) { const next=queue.catch(()=>{}).then(()=>handleManualRequest(wire));queue=next;return next; }
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(wire.id);reject(Error("The GM did not confirm this action. Check the card before retrying."));},30000);pending.set(wire.id,{resolve,reject,timer});game.socket!.emit(channel,wire);});
}
async function rollGroup(message: ChatMessage, data: ManualCard, rowId: string) {
  const key=message.id+":"+rowId,previous=retry.get(key);
  if(previous){await send(message.id!,previous);retry.delete(key);return;}
  const row=data.rows!.find(row=>row.user===rowId)!;
  const actor=await fromUuid(row.actor) as Actor | null;
  if(!actor?.isOwner)throw Error("You do not own this character.");
  const item=actor.items.find(item=>String(item.type)==="skill" && item.name?.toLowerCase()===data.skill?.toLowerCase()) as RollItem | undefined;
  if(!item?.createRoll)throw Error("This character does not have the requested skill.");
  const nonce=foundry.utils.randomID();await send(message.id!,{action:"claim",row:rowId,nonce});
  let rolled=false;
  try {
    let roll=item.createRoll("skill",actor);
    if(!await roll.handleRollDialog({type:"pneuma-group",ctrlKey:false,metaKey:false},actor,item))return;
    roll=await item.confirmRoll(roll);await spendBonusLuck(actor,roll.luck);await rollHidden(roll);rolled=true;
    const commit:Request={action:"commit",row:rowId,nonce,total:roll.resultTotal,html:await nativeCard(roll)};
    retry.set(key,commit);await send(message.id!,commit);retry.delete(key);await showDice(roll,data.rollMode);
  } finally {if(!rolled)await send(message.id!,{action:"release",row:rowId,nonce});ui.chat?.updateMessage(message);}
}
function addButton(parent: HTMLElement, label: string, run: (event: MouseEvent)=>Promise<unknown>, className="") {
  const button=document.createElement("button");button.type="button";button.textContent=label;button.className=className;
  button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();button.disabled=true;void run(event).catch(report).finally(()=>{button.disabled=false;});});parent.append(button);return button;
}
export function bindManualCard(message: ChatMessage, html: HTMLElement) {
  const data=state(message);if(!data || !canRenderCombatCard(message))return;
  const root=html.querySelector<HTMLElement>(".pneuma-manual-card");if(!root||root.dataset.bound)return;root.dataset.bound="true";
  if(data.kind==="group") {
    // Upgrade already-saved cards to the current row presentation as well.
    if(root.querySelector(".pneuma-group-rows details") || !root.querySelector(".pneuma-group-heading"))root.innerHTML=groupContent(data);
    for(const total of Array.from(root.querySelectorAll<HTMLElement>(".pneuma-group-total"))) {
      const details=total.closest("li")!.querySelector<HTMLElement>(".pneuma-group-details")!;
      // Set the initial state on the rendered DOM, not just serialized chat HTML.
      details.hidden=true;details.style.setProperty("display","none","important");total.setAttribute("aria-expanded","false");
      const toggle=()=>{
        details.hidden=!details.hidden;details.style.setProperty("display",details.hidden?"none":"block","important");total.setAttribute("aria-expanded",String(!details.hidden));
        if(!details.hidden)for(const mods of Array.from(details.querySelectorAll<HTMLElement>(".d10-data-details"))) {
          mods.classList.remove("hide");mods.hidden=false;mods.style.setProperty("display","block","important");
        }
      };
      total.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();toggle();});
      total.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();event.stopPropagation();toggle();}});
    }
    if(game.user!.isGM && data.hideDV && data.dv!==undefined)root.querySelector(".pneuma-group-dv")!.textContent="DV "+data.dv+" (hidden from players)";
    for(const row of data.rows??[]) {
      if(!game.user!.isGM && row.user!==game.user!.id)continue;
      const slot=root.querySelector<HTMLElement>('[data-group-user="'+CSS.escape(row.user)+'"] .pneuma-group-action')!;
      if(row.state==="waiting" || retry.has(message.id+":"+row.user))addButton(slot,retry.has(message.id+":"+row.user)?"Finish roll":"Roll",()=>rollGroup(message,data,row.user));
      else if(row.state==="rolling" && game.user!.isGM)addButton(slot,"Release",()=>send(message.id!,{action:"reset",row:row.user}));
    }return;
  }
  const controls=root.querySelector<HTMLElement>(".pneuma-manual-controls")!;
  if(data.kind==="damage" && data.damage) {
    const ready=["rolled","applied"].includes(data.damage.status);
    if(ready) void renderDamage(message,exchange(data),$(html),(action,extra)=>{
      if(action === "damageStatuses") return send(message.id!,{action:"effects",effects:extra?.statusEffects});
      return send(message.id!,{action:"damage",target:extra?.targetUuid,damage:{...extra,action}});
    },{canEditEffects:!!game.user!.isGM || game.user!.id===data.creator}).catch(report);
    if((data.damage.result?.sixes??0)>=2 && !data.injuryBusy)addButton(controls,"Roll critical injury for selected token",()=>send(message.id!,{action:"injury",target:selectedDamageTarget()}));
  } else if(!data.injuryBusy)addButton(controls,"Apply injury to selected token",()=>send(message.id!,{action:"injury",target:selectedDamageTarget()}));
  if(game.user!.isGM && (data.injuryBusy || data.damage && ["review","applying"].includes(data.damage.status)))addButton(controls,"Mark resolved after GM review",()=>send(message.id!,{action:"review"}));
}
function field(label:string, control:string) {const name=/name="([^"]+)"/.exec(control)?.[1]??'field';return '<div class="form-group"><label for="pneuma-roll-'+name+'">'+label+'</label><div class="form-fields">'+control.replace('name=', 'id="pneuma-roll-'+name+'" name=')+'</div></div>';}
const pair=(content:string)=>'<div class="pneuma-roll-pair">'+content+'</div>';
const check=(name:string,label:string,checked=false)=>'<label class="pneuma-roll-check"><input type="checkbox" name="'+name+'"'+(checked?' checked':'')+'>'+label+'</label>';
function numeric(name:string,value:number,min=-100,max=100) {return '<input name="'+name+'" type="number" value="'+value+'" min="'+min+'" max="'+max+'" step="1" required>';}
async function prompt(title:string,content:string,label:string,run:(form:HTMLFormElement)=>Promise<void>) {
  await Dialog.prompt({title,content:'<form class="pneuma-manual-form">'+content+'</form>',label,options:{width:380,classes:['dialog','pneuma-roll-dialog']},rejectClose:false,callback:async html=>{const form=html[0]!.querySelector<HTMLFormElement>("form")!;if(!form.reportValidity())throw Error("Complete the required fields.");await run(form);}});
}
const value=(form:HTMLFormElement,name:string)=>new FormData(form).get(name)?.toString()??"";
async function damagePrompt() {
  await prompt("Manual damage roll",field("Label",'<input name="title" value="Manual damage" maxlength="100">')+pair(field("Damage dice",'<select name="dice">'+Array.from({length:8},(_,i)=>'<option value="'+(i+1)+'"'+(i===2?' selected':'')+'>'+(i+1)+'d6</option>').join('')+'</select>')+field("Modifier",numeric("modifier",0)))+field("Location",'<select name="location"><option value="body">Body</option><option value="head">Head (aimed)</option></select>')+'<div class="pneuma-roll-checks">'+check("armor","Interact with armor",true)+check("critical","Critical bonus / injuries",true)+'</div>',"Roll",async form=>{
    const mode=rollMode(),dice=manualNumber(value(form,"dice"),"Dice",1,8),modifier=manualNumber(value(form,"modifier"),"Modifier",-100,100);
    const {CPRDamageRoll}=await nativeRolls();const title=value(form,"title").trim()||"Manual damage";
    const roll=new CPRDamageRoll(title,dice+"d6"+(modifier>=0?"+":"")+modifier,"ranged");
    roll.isAimed=value(form,"location")==="head";roll.location=roll.isAimed?"head":"body";
    roll.rollCardExtraArgs={ablationValue:1,ignoreArmorPercent:0,ignoreBelowSP:0,ammoVariety:""};
    await rollHidden(roll);if(!new FormData(form).has("critical"))roll.wasCritical=()=>false;
    const html=await nativeCard(roll);
    await create({kind:"damage",creator:game.user!.id!,title,rollMode:mode,damage:{status:"rolled",user:game.user!.id!,nonce:foundry.utils.randomID(),result:{html,values:{...damageValues(html),interactArmor:new FormData(form).has("armor")},sixes:new FormData(form).has("critical")?damageSixes(roll):0}}});
    await showDice(roll,mode);
  });
}
async function basePrompt() {
  const content='<form class="pneuma-manual-form">'+field("Label",'<input name="title" value="Cyberpunk roll" maxlength="100">')
    +field("Modifier",numeric("base",0))
    +'<div class="pneuma-roll-modes"><label class="pneuma-roll-check"><input type="radio" name="diceMode" value="standard" checked>Standard Cyberpunk 1D10</label>'
    +'<p class="pneuma-roll-hint">Natural 10: Critical Success. Natural 1: Critical Failure.</p>'
    +'<label class="pneuma-roll-check"><input type="radio" name="diceMode" value="custom">Custom</label></div>'
    +'<fieldset class="pneuma-custom-roll" disabled><div class="pneuma-custom-dice">'
    +'<label><span>Dice</span>'+numeric("customDice",1,1,20)+'</label><span aria-hidden="true">d</span>'
    +'<label><span>Sides</span>'+numeric("customSides",6,1,100)+'</label></div>'
    +'<p class="pneuma-roll-hint">1–20 dice, 1–100 sides.</p></fieldset></form>';
  new Dialog({title:"Cyberpunk roll",content,default:"roll",render:html=>{
    const fields=html[0]!.querySelector<HTMLFormElement>("form")!;
    const sync=()=>{fields.querySelector<HTMLFieldSetElement>(".pneuma-custom-roll")!.disabled=value(fields,"diceMode")!=="custom";};
    fields.addEventListener("change",sync);sync();
  },buttons:{roll:{label:"Roll",callback:html=>{return (async()=>{
    const fields=html[0]!.querySelector<HTMLFormElement>("form")!,modifier=manualNumber(value(fields,"base"),"Modifier",-100,100),mode=rollMode();
    const custom=value(fields,"diceMode")==="custom",title=value(fields,"title").trim()||(custom?"Custom Roll":"Cyberpunk roll");
    if(custom){
      const count=manualNumber(value(fields,"customDice"),"Dice",1,20),sides=manualNumber(value(fields,"customSides"),"Sides",1,100);
      const roll=await new Roll(count+"d"+sides+(modifier>=0?"+":"")+modifier).evaluate();
      const message={content:'<section class="pneuma-custom-roll-card"><strong>'+esc(title)+'</strong>'+await roll.render()+'</section>',speaker:ChatMessage.getSpeaker()};
      ChatMessage.applyRollMode(message as never,mode as never);await ChatMessage.create(message as never);
      const {Dice}=await nativeAPI();await Dice.handle3dDice(roll,mode);
    } else {
      const {CPRRoll}=await nativeRolls(),roll=new CPRRoll(title,"1d10");
      roll.addMod([{value:modifier,source:"Modifier"}]);await rollHidden(roll);
      const message={content:await nativeCard(roll),speaker:ChatMessage.getSpeaker()};ChatMessage.applyRollMode(message as never,mode as never);await ChatMessage.create(message as never);await showDice(roll,mode);
    }
  })().catch(report);}}}},{width:380,classes:["dialog","pneuma-roll-dialog"]}).render(true);
}
/** A roll-under check, deliberately separate from native STAT + d10 skill-style rolls. */
async function statPrompt() {
  const tokens=canvas.tokens?.controlled ?? [];
  if(tokens.length>1)throw Error("Select only one token for a STAT roll.");
  const actor=tokens.length ? tokens[0]!.actor : game.user?.character;
  if(!actor?.isOwner)throw Error("Select a token you own or assign your player character first.");
  const stats=["int","ref","dex","tech","cool","will","move","body","luck","emp"];
  const current=(source:Actor,stat:string):number=>{
    const native=source as Actor & {getStat(name:string):number};
    const result=native.getStat(stat);
    if(!Number.isFinite(result))throw Error("This character has no current " + stat.toUpperCase() + " value.");
    return result;
  };
  const options=stats.filter(stat=>foundry.utils.getProperty(actor,"system.stats."+stat+".value")!==undefined)
    .map(stat=>'<option value="'+stat+'">'+stat.toUpperCase()+' ('+current(actor,stat)+')</option>').join('');
  if(!options)throw Error("This character has no available stats.");
  await prompt("STAT roll",'<p class="pneuma-roll-character">'+esc(actor.name)+'</p>'+field("STAT",'<select name="stat">'+options+'</select>')+'<p class="pneuma-roll-hint">Roll below the current STAT. Ties fail. No Critical Success or Critical Failure.</p>',"Roll",async form=>{
    const source=await fromUuid(actor.uuid) as Actor | null;
    if(!source?.isOwner)throw Error("This character is unavailable or no longer owned by you.");
    const stat=value(form,"stat");if(!stats.includes(stat))throw Error("Choose a valid STAT.");
    const target=current(source,stat),mode=rollMode(),{CPRRoll}=await nativeRolls();
    const roll=new CPRRoll((source.name??"Character")+" — "+stat.toUpperCase()+" roll","1d10");
    roll.calculateCritical=false;roll.wasCritical=()=>false;
    await rollHidden(roll);
    const success=roll.resultTotal<target;
    const result='<p class="pneuma-stat-result" data-stat-outcome="'+(success?'success':'fail')+'">'+stat.toUpperCase()+' '+target+' · Rolled '+roll.resultTotal+' · <strong>'+(success?'Success':'Fail')+'</strong> (roll under)</p>';
    const message={content:'<section class="pneuma-combat-message pneuma-stat-card">'+await nativeCard(roll)+result+'</section>',speaker:ChatMessage.getSpeaker({actor:source})};
    ChatMessage.applyRollMode(message as never,mode as never);await ChatMessage.create(message as never);await showDice(roll,mode);
  });
}
async function criticalPrompt() {
  await prompt("Critical injury",field("Location",'<select name="location"><option value="body">Body</option><option value="head">Head</option></select>'),"Roll",async form=>{
    const mode=rollMode(),location=value(form,"location")==="head"?"head":"body";
    await create({kind:"critical",creator:game.user!.id!,title:"Critical injury",rollMode:mode,injury:await rollInjury(location,mode)});
  });
}
async function groupPrompt() {
  if(!game.user!.isGM)throw Error("Only the GM can request a group check.");
  const users=game.users!.filter(user=>!user.isGM && !!user.character);
  const skills=[...new Set(users.flatMap(user=>user.character!.items.filter(item=>String(item.type)==="skill").map(item=>item.name!)))].sort();
  if(!users.length||!skills.length)throw Error("Assign player characters with skills before requesting a group check.");
  await prompt("Request group check",field("Skill",'<select name="skill">'+skills.map(skill=>'<option>'+esc(skill)+'</option>').join('')+'</select>')+pair(field("Optional DV",'<input name="dv" type="number" min="0" max="100" step="1" placeholder="No DV">')+check("hideDV","Hide DV from players"))+'<fieldset><legend>Players</legend>'+users.map(user=>'<label class="pneuma-group-player"><input name="players" type="checkbox" value="'+esc(user.id)+'"'+(user.active?' checked':'')+'>'+esc(user.name)+' — '+esc(user.character!.name)+(user.active?'':' (offline)')+'</label>').join('')+'</fieldset>',"Request rolls",async form=>{
    if(!game.user!.isGM)throw Error("GM only.");
    const ids=new FormData(form).getAll("players").map(String),chosen=users.filter(user=>ids.includes(user.id!));
    if(!chosen.length)throw Error("Select at least one player.");
    const skill=value(form,"skill");
    for(const user of chosen)if(!user.character!.testUserPermission(user,"OWNER") || !user.character!.items.some(item=>String(item.type)==="skill" && item.name===skill))throw Error(user.name+" needs ownership of a character with "+skill+".");
    const dv=value(form,"dv");
    await create({kind:"group",creator:game.user!.id!,title:skill,rollMode:"roll",skill,...(dv!==""?{dv:manualNumber(dv,"DV",0,100)}:{}),hideDV:new FormData(form).has("hideDV"),rows:chosen.map(user=>({user:user.id!,actor:user.character!.uuid,name:user.name+" — "+user.character!.name,state:"waiting"}))});
  });
}
let closeRollFlyout: (()=>void) | undefined;
export function openManualRolls(anchor = document.querySelector<HTMLElement>("[data-pneuma-manual-rolls]")): void {
  if(closeRollFlyout){closeRollFlyout();return;}
  if(!anchor)return;
  const panel=document.createElement("div");panel.className="pneuma-roll-flyout";panel.setAttribute("role","menu");panel.setAttribute("aria-label","Manual rolls");
  const heading=document.createElement("div");heading.className="pneuma-roll-flyout-title";heading.textContent="Manual Rolls";heading.setAttribute("aria-hidden","true");panel.append(heading);
  panel.tabIndex=-1;
  const events=new AbortController();
  const close=(focus=false)=>{events.abort();panel.remove();anchor.setAttribute("aria-expanded","false");closeRollFlyout=undefined;if(focus&&anchor.isConnected)anchor.focus();};
  closeRollFlyout=()=>close();anchor.setAttribute("aria-expanded","true");
  const choices:[string,string,string,()=>Promise<void>][]=[
    ["damage","Damage","fa-burst",damagePrompt],["critical","Critical Injury","fa-heart-crack",criticalPrompt],
    ["base","Cyberpunk Roll","fa-dice-d10",basePrompt],["stat","STAT Roll","fa-chart-simple",statPrompt],
    ...(game.user?.isGM?[["group","Group Check","fa-users",groupPrompt] as [string,string,string,()=>Promise<void>]]:[])];
  for(const [id,label,icon,run] of choices){
    const button=document.createElement("button");button.type="button";button.dataset.rollChoice=id;button.setAttribute("role","menuitem");
    button.innerHTML='<i class="fas '+icon+'" aria-hidden="true"></i><span>'+label+'</span>'+(id==="group"?'<small>GM</small>':'');
    button.addEventListener("click",()=>{close();void run().catch(report);});panel.append(button);
  }
  document.body.append(panel);
  const rect=anchor.getBoundingClientRect(),bounds=panel.getBoundingClientRect();
  panel.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-bounds.width-8))+"px";
  panel.style.top=Math.max(8,Math.min(rect.top-bounds.height-6,window.innerHeight-bounds.height-8))+"px";
  panel.focus({preventScroll:true});
  document.addEventListener("pointerdown",event=>{if(!panel.contains(event.target as Node)&&!anchor.contains(event.target as Node))close();},{signal:events.signal});
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();close(true);}
    else if(event.key==="Tab")close();
    else if(["ArrowDown","ArrowUp","Home","End"].includes(event.key)){
      event.preventDefault();const buttons=Array.from(panel.querySelectorAll("button")),index=buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:index<0?(event.key==="ArrowDown"?0:buttons.length-1):(index+(event.key==="ArrowDown"?1:-1)+buttons.length)%buttons.length;buttons[next]?.focus();
    }
  },{signal:events.signal});
  window.addEventListener("resize",()=>close(),{signal:events.signal});
}
export function registerManualRolls(): void {
  Hooks.on("renderChatLog",(_app:unknown,html:JQuery)=>{
    const icon=html[0]?.querySelector<HTMLElement>("#chat-controls .fa-dice-d20, .chat-controls .fa-dice-d20");
    closeRollFlyout?.();
    if(!icon||icon.dataset.pneumaManualRolls)return;icon.dataset.pneumaManualRolls="true";icon.setAttribute("role","button");icon.setAttribute("aria-haspopup","menu");icon.setAttribute("aria-expanded","false");icon.tabIndex=0;icon.title="Manual rolls";icon.setAttribute("aria-label","Manual rolls");
    icon.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();openManualRolls(icon);});
    icon.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openManualRolls(icon);}});
  });
  Hooks.on("renderChatMessage",(message:ChatMessage,html:JQuery)=>{if(html[0])bindManualCard(message,html[0]);});
  Hooks.once("ready",()=>game.socket!.on(channel,(wire:Wire)=>{
    if(wire?.manualType==="request" && game.user!.id===authority()?.id){const next=queue.catch(()=>{}).then(()=>handleManualRequest(wire));queue=next;void next.then(()=>game.socket!.emit(channel,{...wire,manualType:"reply",gm:game.user!.id}),error=>game.socket!.emit(channel,{...wire,manualType:"reply",gm:game.user!.id,error:(error as Error).message}));}
    else if(wire?.manualType==="reply" && wire.user===game.user!.id && wire.gm===authority()?.id){const waiter=pending.get(wire.id);if(!waiter)return;clearTimeout(waiter.timer);pending.delete(wire.id);if(wire.error)waiter.reject(Error(wire.error));else waiter.resolve();}
  }));
}
