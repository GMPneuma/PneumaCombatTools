import {viewedTokenIndicator,viewerDefaultIndicator,type IndicatorProfile} from "./turn-marker-profile.js";
import {displayedEncounter} from "./encounter.js";
import {createMarkerArt,MARKER_STYLES,type MarkerStyle} from "./turn-marker-art.js";
const M="pneuma-combattools",DEFAULT_COLOR="#ffc36a";
declare global {interface SettingConfig {
  "pneuma-combattools.turnMarkerEnabled":boolean;
  "pneuma-combattools.turnMarkerForceDefault":boolean;
  "pneuma-combattools.turnMarkerStyle":"off"|MarkerStyle;
  "pneuma-combattools.turnMarkerColor":string|null;
  "pneuma-combattools.turnMarkerThickness":number;
  "pneuma-combattools.turnMarkerDistance":number;
  "pneuma-combattools.turnMarkerOpacity":number;
  "pneuma-combattools.turnMarkerSpeed":number;
  "pneuma-combattools.turnMarkerDisplay":"animated"|"static"|"off";
}}
const bounded=(n:number,min:number,max:number,fallback:number)=>Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
let current:{token:Token;key:string;art:ReturnType<typeof createMarkerArt>;ticker:PIXI.Ticker;tick:(delta:number)=>void;running:boolean}|undefined;
let targetId:string|undefined;
const previews=new Map<object,{token:TokenDocument;profile:IndicatorProfile}>();
export function previewTurnMarker(owner:object,token:TokenDocument|undefined,profile:IndicatorProfile):void{
  if(token)previews.set(owner,{token,profile});else previews.delete(owner);
  refreshTurnMarker();
}
export function endTurnMarkerPreview(owner:object):void{previews.delete(owner);refreshTurnMarker();}
function clear(){
  if(!current)return;
  current.ticker.remove(current.tick);
  if(!current.art.root.destroyed)current.art.root.destroy({children:true});
  current=undefined;
}
export function refreshTurnMarker(){
  if(!canvas.ready||!canvas.app||!game.settings!.get(M,"turnMarkerEnabled")){clear();targetId=undefined;return;}
  const combat=displayedEncounter(),combatant=combat?.combatant;
  const preview=[...previews.values()].at(-1);
  targetId=preview?.token.id??combatant?.tokenId??undefined;
  const token=targetId?canvas.tokens?.get(targetId):undefined;
  const profile=preview?.profile??(game.settings!.get(M,"turnMarkerForceDefault")?viewerDefaultIndicator():viewedTokenIndicator(token?.document));
  const style=profile.turnMarkerStyle,display=game.settings!.get(M,"turnMarkerDisplay");
  if(!token||token.destroyed||token.isPreview||!token.visible
    ||(preview?(token.document!==preview.token||(!game.user?.isGM&&!token.isOwner)):(combatant?.sceneId!==canvas.scene?.id||!combatant?.visible))
    ||(!game.user?.isGM&&(token.document.hidden||token.document.isSecret))||style==="off"||display==="off") {clear();return;}
  const saved=profile.turnMarkerColor,color=Number.parseInt((/^#[0-9a-f]{6}$/i.test(saved??"")?saved!:DEFAULT_COLOR).slice(1),16);
  const grid=Number(canvas.scene!.grid.size)||100;
  const thickness=bounded(profile.turnMarkerThickness,1,10,2)*grid/100;
  const opacity=bounded(profile.turnMarkerOpacity,.5,1,.85);
  const speed=bounded(profile.turnMarkerSpeed,0,2,1);
  if(!opacity){clear();return;}
  const distance=bounded(profile.turnMarkerDistance,0,50,8);
  const radius=Math.max(token.w,token.h)/2+grid*distance/100+thickness/2;
  const key=JSON.stringify([style,color,thickness,opacity,speed,distance,token.w,token.h]);
  if(current?.token!==token||current.key!==key||current.art.root.destroyed){
    clear();
    const art=createMarkerArt(radius,{style,color,thickness,opacity,speed});
    art.root.position.set(token.w/2,token.h/2);token.addChildAt(art.root,0);
    let elapsed=0,phase=.08;
    const tick=(delta:number)=>{
      if(!token.visible||!token.renderable||document.hidden)return;
      elapsed+=delta/60;if(elapsed<1/30)return;
      phase+=Math.min(elapsed,.1)*speed/4;elapsed=0;art.frame(phase);
    };
    current={token,key,art,ticker:canvas.app.ticker,tick,running:false};
  }
  const animate=display==="animated"&&speed>0&&!document.hidden;
  if(animate!==current.running){
    current.running=animate;
    if(animate)current.ticker.add(current.tick);else current.ticker.remove(current.tick);
  }
}
export function registerTurnMarker(){
  game.settings!.register(M,"turnMarkerEnabled",{name:"Use Turn Indicator",hint:"Show turn indicators on this client. Turning this off hides every indicator.",scope:"client",config:true,type:Boolean,default:true,onChange:refreshTurnMarker});
  game.settings!.register(M,"turnMarkerForceDefault",{name:"Use Default for Everyone",hint:"Show the Default Indicator for every combatant on this client, including your own character.",scope:"client",config:true,type:Boolean,default:false,onChange:refreshTurnMarker});
  game.settings!.register(M,"turnMarkerStyle",{name:"Default Indicator style",hint:"Highlights the current combatant on the active scene. Disable Monk's combat highlight if using this indicator.",scope:"world",config:false,type:String,default:"segmented",choices:{off:"Off",...MARKER_STYLES},onChange:refreshTurnMarker});
  game.settings!.register(M,"turnMarkerColor",{name:"Indicator color",hint:"Blank uses amber (#ffc36a).",scope:"world",config:false,default:DEFAULT_COLOR,
    // @ts-expect-error Foundry v12 accepts DataField instances; allow blanks before native validation.
    type:new foundry.data.fields.ColorField({nullable:true,blank:true,initial:DEFAULT_COLOR}),onChange:refreshTurnMarker});
  game.settings!.register(M,"turnMarkerThickness",{name:"Indicator thickness",hint:"Scales with the scene grid and zoom.",scope:"world",config:false,type:Number,default:2,range:{min:1,max:10,step:.5},onChange:refreshTurnMarker});
  game.settings!.register(M,"turnMarkerDistance",{name:"Indicator Scale",hint:"Adjusts the indicator perimeter around the token. Higher values extend it farther beyond the token edge.",scope:"world",config:false,type:Number,default:8,range:{min:0,max:50,step:1},onChange:refreshTurnMarker});
  game.settings!.register(M,"turnMarkerOpacity",{name:"Indicator opacity",scope:"world",config:false,type:Number,default:.85,range:{min:.5,max:1,step:.05},onChange:refreshTurnMarker});
  game.settings!.register(M,"turnMarkerSpeed",{name:"Indicator speed",hint:"1 is one cycle every four seconds. 0 is static.",scope:"world",config:false,type:Number,default:1,range:{min:0,max:2,step:.25},onChange:refreshTurnMarker});
  game.settings!.register(M,"turnMarkerDisplay",{name:"Animated Turn Indicator Display",scope:"client",config:true,type:String,default:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"static":"animated",choices:{animated:"Animated",static:"Static"},onChange:refreshTurnMarker});
  for(const event of ["updateUser","createUser","deleteUser","updateActor","updateToken","canvasReady","createCombat","updateCombat","deleteCombat","createCombatant","updateCombatant","deleteCombatant"])Hooks.on(event,refreshTurnMarker);
  Hooks.on("ready",async()=>{
    if(game.settings!.get(M,"turnMarkerDisplay")==="off"){
      await game.settings!.set(M,"turnMarkerEnabled",false);
      await game.settings!.set(M,"turnMarkerDisplay",window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"static":"animated");
    }
    if(game.user?.isGM&&game.settings!.get(M,"turnMarkerStyle")==="circuit")await game.settings!.set(M,"turnMarkerStyle","netrunner");refreshTurnMarker();});
  Hooks.on("canvasTearDown",()=>{previews.clear();clear();targetId=undefined;});
  for(const event of ["drawToken","refreshToken"])Hooks.on(event,(token:Token)=>{if(token.id===targetId||token===current?.token)refreshTurnMarker();});
  Hooks.on("destroyToken",(token:Token)=>{for(const [owner,preview] of previews)if(preview.token===token.document)previews.delete(owner);if(token===current?.token)clear();});
  document.addEventListener("visibilitychange",refreshTurnMarker);
}
