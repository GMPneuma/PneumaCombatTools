import {primaryGM} from "./shared.js";
import {registerNativeWrapper} from "./native-wrappers.js";
export const DEFAULT_STATUS_COLOR="#888888";
export const STATUS_COLOR_TABS=["native","native-empty","module","custom"] as const;
export type StatusColorTab=typeof STATUS_COLOR_TABS[number];
export type SectionColors=Record<StatusColorTab,string>;
export interface ColorStatus {id:string;name:string;img:string;tab:StatusColorTab;group?:string;color?:string;aliases?:string[]}
const MODULE="pneuma-combattools";
declare global {interface SettingConfig {"pneuma-combattools.statusSectionColors":SectionColors;"pneuma-combattools.greyStatusDefaults":boolean}}
export function validateStatusColor(value:unknown):string|undefined {
  if(value===undefined||value===null||value==="")return undefined;
  if(typeof value!=="string"||!/^#[0-9a-f]{6}$/i.test(value))throw Error("Choose a six-digit hex icon color.");
  return value.toLowerCase();
}
export function sectionColors():SectionColors {
  const saved=game.settings!.get(MODULE,"statusSectionColors");
  return Object.fromEntries(STATUS_COLOR_TABS.map(tab=>[tab,validateStatusColor(saved?.[tab])??DEFAULT_STATUS_COLOR])) as SectionColors;
}
export function statusColor(status:ColorStatus,colors=sectionColors()):string|undefined {
  if(status.group==="addiction")return undefined;
  return (status.tab==="custom"?validateStatusColor(status.color):undefined)??colors[status.tab];
}
export function iconWell(color?:string):string {
  if(!color)return "#242424";
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  return .2126*rgb[0]!+.7152*rgb[1]!+.0722*rgb[2]!>128?"#242424":"#eeeeee";
}
const icons=new Map<string,Promise<string>>();
/** Recolor glyph pixels only. Keep native HUD nodes, IDs, borders and handlers intact. */
export async function paintStatusIcon(img:HTMLImageElement,color?:string):Promise<void> {
  const source=img.dataset.statusOriginalSrc??img.getAttribute("src")??"";
  img.dataset.statusOriginalSrc=source;
  const key=source+":"+(color??"");img.dataset.statusPaint=key;
  img.style.setProperty("--pneuma-icon-well",iconWell(color));
  img.classList.add("pneuma-status-colored-icon");
  if(!color){img.src=source;return;}
  let promise=icons.get(key);
  if(!promise){
    promise=new Promise<string>((resolve,reject)=>{
      const original=new Image();original.crossOrigin="anonymous";
      original.onload=()=>{try{
        const canvas=document.createElement("canvas");canvas.width=128;canvas.height=128;
        const ctx=canvas.getContext("2d")!;ctx.drawImage(original,0,0,128,128);ctx.globalCompositeOperation="source-in";ctx.fillStyle=color;ctx.fillRect(0,0,128,128);
        resolve(canvas.toDataURL("image/png"));
      }catch(error){reject(error);}};
      original.onerror=()=>reject(Error("Icon unavailable"));original.src=source;
    });
    if(icons.size>=256)icons.clear();icons.set(key,promise);
    void promise.catch(()=>icons.delete(key));
  }
  try{const painted=await promise;if(img.dataset.statusPaint===key)img.src=painted;}catch{/* Preserve the original icon when an external source disallows canvas access. */}
}
let rows:ColorStatus[]=[];
const byId=new Map<string,ColorStatus>();
export function setStatusColorRows(next:ColorStatus[]):void {
  rows=next;byId.clear();for(const row of rows)for(const id of [row.id,...row.aliases??[]])byId.set(id,row);
}
export function colorForEffect(effect:{statuses:Set<string>;name?:string|null}):string|undefined {
  const matches=Array.from(effect.statuses).map(id=>byId.get(id)).filter((row):row is ColorStatus=>!!row);
  if(matches.some(row=>row.group==="addiction"))return undefined;
  const row=matches[0]??rows.find(row=>row.name===effect.name);
  return row?statusColor(row):undefined;
}
/** Foundry v12 assigns each rendered icon the source temporaryEffect's index as zIndex. */
export function colorTokenEffects(token:Token):void {
  const effects=token.actor?.temporaryEffects??[];
  for(const child of (token as Token & {effects?:PIXI.Container}).effects?.children??[]) {
    if(child.zIndex<0)continue;
    const effect=effects[child.zIndex];if(!effect)continue;
    const color=colorForEffect(effect);if(!color)continue;
    const sprite=child as PIXI.Sprite;
    const filter=new PIXI.filters.ColorMatrixFilter();
    const [r,g,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
    filter.matrix=[0,0,0,0,r!,0,0,0,0,g!,0,0,0,0,b!,0,0,0,1,0];
    sprite.tint=0xffffff;sprite.filters=[...(sprite.filters??[]),filter];
  }
}
export function paintStatusMenu(root:HTMLElement):void {
  for(const img of Array.from(root.querySelectorAll<HTMLImageElement>(".status-effects img.effect-control[data-status-id]"))) {
    const row=byId.get(img.dataset.statusId!);if(row)void paintStatusIcon(img,statusColor(row));
  }
}
let provideRows:(()=>Promise<ColorStatus[]>)|undefined;
let refresh:Promise<void>|undefined;
let dirty=false;
export function refreshStatusColors():Promise<void> {
  dirty=true;if(refresh)return refresh;
  refresh=(async()=>{do{dirty=false;if(!provideRows)return;setStatusColorRows(await provideRows());}while(dirty);
    if(canvas.ready)for(const token of canvas.tokens?.placeables??[])token.renderFlags.set({redrawEffects:true});
    if(canvas.tokens?.hud?.element?.[0])paintStatusMenu(canvas.tokens.hud.element[0]);
  })().finally(()=>{refresh=undefined;});return refresh;
}
export function registerStatusColors(provider:()=>Promise<ColorStatus[]>):void {
  provideRows=provider;
  const update=()=>{void refreshStatusColors().catch(error=>ui.notifications!.error("Status colors: "+(error as Error).message));};
  game.settings!.register(MODULE,"statusSectionColors",{scope:"world",config:false,type:Object,
    default:Object.fromEntries(STATUS_COLOR_TABS.map(tab=>[tab,DEFAULT_STATUS_COLOR])) as SectionColors,onChange:update});
  registerNativeWrapper(CONFIG.Token.objectClass.prototype,"_drawEffects",async function(wrapped,...args){
    const result=await wrapped(...args);colorTokenEffects(this);return result;
  },"WRAPPER");
  game.settings!.register(MODULE,"greyStatusDefaults",{scope:"world",config:false,type:Boolean,default:false});
  Hooks.once("ready",async()=>{
    if(game.user?.id===primaryGM()?.id&&!game.settings!.get(MODULE,"greyStatusDefaults")) {
      const colors=sectionColors();
      for(const tab of STATUS_COLOR_TABS)if(colors[tab]==="#ffffff")colors[tab]=DEFAULT_STATUS_COLOR;
      await game.settings!.set(MODULE,"statusSectionColors",colors);
      await game.settings!.set(MODULE,"greyStatusDefaults",true);
    }
    update();
  });
}
