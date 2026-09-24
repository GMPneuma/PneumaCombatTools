import assert from "node:assert/strict";
import {test} from "node:test";
import {registerHooks} from "node:module";
globalThis.FormApplication=class {}; globalThis.Hooks={once(){},on(){}};
registerHooks({resolve(specifier,context,next){
 if(specifier==="/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js")return {shortCircuit:true,url:'data:text/javascript,export const CPRRoll=globalThis.SmartRoll'};
 if(specifier==="./placement.js"&&context.parentURL?.endsWith("/aoe/workflow.js"))return {shortCircuit:true,url:"data:text/javascript,"+encodeURIComponent('export const templateData=area=>({t:area.shape,x:area.origin.x,y:area.origin.y}); export const areaCoverage=area=>box=>globalThis.testCoverage(area,box) && !globalThis.CONFIG.Canvas.polygonBackends.move.testCollision(area.origin,{x:box.x+1,y:box.y+1},{type:"move",mode:"any"}); export const clippedPoints=()=>[]; export const placeArea=async(make,p)=>globalThis.previewCancel?null:make(p);')};
 if(specifier==="/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js")return {shortCircuit:true,url:"data:text/javascript,export default {handle3dDice:async(roll,mode)=>{globalThis.diceShown.push({roll,mode})}}"};
 if(specifier==="./damage-application.js"&&context.parentURL?.endsWith("/damage-flow.js"))return {shortCircuit:true,url:"data:text/javascript,"+encodeURIComponent('export async function captureDamageApplication(actor,n,l,id,apply){await apply(actor);arguments[6]?.({rawDamageDealt:globalThis.testPenetrated?5:0,hpReduction:globalThis.testPenetrated?5:0});return ["<div>applied</div>"]}')};
 return next(specifier,context);
}});
const {overlaps,evadeAllowed,winsAreaDefense}=await import("../dist/scripts/aoe/geometry.js");
globalThis.testCoverage=(area,box)=>area.shape==="circle"?Math.max(Math.abs(box.x+box.width/2-area.origin.x),Math.abs(box.y+box.height/2-area.origin.y))<=area.length:overlaps(area,box);
const {areaKind}=await import("../dist/scripts/aoe/weapon.js");
const {defaults,normalizeArea}=await import("../dist/scripts/aoe/settings.js");
const {startAreaAttack,handleAreaRequest,areaContent,pixelsPerUnit,makeArea}=await import("../dist/scripts/aoe/workflow.js");
const M="pneuma-combattools",get=(o,p)=>p.split(".").reduce((v,k)=>v?.[k],o);
const collection=rows=>Object.assign(rows,{get(id){return this.find(r=>r.id===id)},has(id){return !!this.get(id)}});
function fixture(kind="explosive",total=20){
 let serial=0;const messages=[],docs=new Map(),calls=[];
 globalThis.previewCancel=false;globalThis.diceShown=[];globalThis.Roll={fromJSON:JSON.parse};
 globalThis.foundry={utils:{getProperty:get,deepClone:structuredClone,randomID:()=>String(++serial)}};
 globalThis.ui={notifications:{info(){},warn(){},error(){}}};
 const users=collection([{id:"gm",isGM:true,active:true},{id:"att",isGM:false,active:true},{id:"def",isGM:false,active:true},{id:"stranger",isGM:false,active:true}]);
 globalThis.game={user:users[0],users,messages:collection(messages),modules:new Map(),settings:{get:(_m,k)=>k==="areaSettings"?defaults:k==="rollMode"?"roll":false},tables:{getName:()=>({getResultsForRoll:()=>[{text:"13"}]})}};
 const mkActor=(id,owner)=>({id,uuid:"Actor."+id,type:"character",items:collection([]),effects:[],async createEmbeddedDocuments(_type,rows){this.effects.push(...rows.map(r=>({...r,statuses:new Set(r.statuses)})));},system:{stats:{ref:{value:8},luck:{value:5}}},testUserPermission:u=>u.id===owner,update:async()=>{},_applyDamage:async()=>{calls.push("apply:"+id)}});
 const a=mkActor("a","att"),b=mkActor("b","def"),c=mkActor("c","def");for(const actor of [a,b,c])docs.set(actor.uuid,actor);
 const token=(id,actor,x)=>{const document={id,uuid:"Scene.s.Token."+id,actor,name:id,texture:{src:"icon.png"},parent:{id:"s"}};docs.set(document.uuid,document);const token={id,document,actor,name:id,x,y:0,w:100,h:100,center:{x:x+50,y:50},checkCollision:()=>false};document.object=token;document.update=async change=>{token.x=change.x;token.y=change.y;token.center={x:change.x+50,y:change.y+50};Object.assign(document,change);};return token;};
 const source=token("a",a,0),target=token("b",b,400),third=token("c",c,500),outside=token("o",c,1000);
 const templates=collection([]);
 const scene={id:"s",grid:{size:100,distance:2,units:"m"},templates,async createEmbeddedDocuments(_type,rows){const t={...rows[0],id:"template"+(++serial),update:async data=>Object.assign(t,data)};templates.push(t);return [t]}};
 game.scenes=collection([scene]);
 globalThis.canvas={scene,dimensions:{width:2000,height:1000},tokens:{placeables:[source,target,third,outside]},
 grid:{getCenterPoint:p=>({x:Math.floor(p.x/100)*100+50,y:Math.floor(p.y/100)*100+50}),measurePath:([a,b])=>({distance:Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y))/50})}};
 globalThis.CONFIG={Canvas:{polygonBackends:{move:{testCollision:()=>null},sight:{testCollision:()=>false}}}};
 globalThis.fromUuid=async uuid=>docs.get(uuid);
 globalThis.renderTemplate=async(_p,roll)=>'<div class="rollcard">native '+roll.resultTotal+'</div>';
 globalThis.ChatMessage={getSpeaker:()=>({}),applyRollMode:()=>{},create:async data=>{const message={...data,id:"message"+(++serial),author:game.user,async update(change){if(change.content)this.content=change.content;if(change["flags."+M+".aoe"])this.flags[M].aoe=structuredClone(change["flags."+M+".aoe"]);}};messages.push(message);return message;}};
 globalThis.DOMParser=class{parseFromString(html){return {querySelectorAll:()=>[],querySelector:()=>null,body:{innerHTML:html}}}};
 const weapon={id:"w",type:"weapon",name:"Weapon",system:{isRanged:true,weaponType:kind==="shell"?"shotgun":kind==="suppression"?"assaultRifle":"rocketLauncher",magazine:{value:20},dvTable:"DV Rocket Launcher",fireModes:{suppressiveFire:true}},
 _getLoadedAmmoProp:p=>p==="variety"?(kind==="shell"?"shotgunShell":"rocket"):p==="type"?"basic":undefined,
 createRoll(mode){calls.push(mode);return {formula:mode==="damage"?"8d6":"1d10",luck:0,resultTotal:total,rollCard:"native",wasCritical:()=>false,handleRollDialog:async()=>true,async roll(){calls.push("roll");this._roll={toJSON:()=>({total:7})};this._critRoll={toJSON:()=>({total:3})}}};},
 hasAmmo(roll){return this.system.magazine.value>=(kind==="suppression"?10:1)},
 async confirmRoll(roll){this.system.magazine.value-=kind==="suppression"?10:1;calls.push("consume");return roll}};
 a.items.push(weapon);
 return {a,b,c,source,target,third,outside,weapon,messages,calls,docs,scene,users,
 data:()=>messages[0].flags[M].aoe,request:(action,extra={})=>handleAreaRequest({aoeType:"request",id:"r"+(++serial),message:messages[0].id,user:"def",action,target:target.document.uuid,...extra})};
}
test("area classification uses loaded shell variety, never names or shotgun slugs",()=>{
 const f=fixture("shell");assert.equal(areaKind(f.weapon,"attack"),"shell");assert.equal(areaKind(f.weapon,"aimed"),undefined);
 f.weapon._getLoadedAmmoProp=()=>"shotgunSlug";assert.equal(areaKind(f.weapon,"attack"),undefined);
 assert.equal(areaKind({type:"ammo",system:{variety:"grenade"}},"attack"),"explosive");
 assert.equal(areaKind({type:"weapon",system:{isRanged:true,weaponType:"heavyPistol"}},"suppressive"),undefined);
});
test("square footprints, rotation and partial overlaps exclude touching edges",()=>{
 const area={shape:"square",origin:{x:0,y:0},direction:0,length:500,width:500};
 assert.equal(overlaps(area,{x:249,y:0,width:100,height:100}),true);
 assert.equal(overlaps(area,{x:250,y:0,width:100,height:100}),false);
 assert.equal(overlaps({...area,direction:Math.PI/4},{x:300,y:-20,width:20,height:40}),true);
 assert.equal(overlaps({...area,direction:Math.PI/4},{x:300,y:300,width:20,height:20}),false);
});
test("RAW defaults and homebrew validation keep Cover Up disabled",()=>{
 assert.equal(defaults.coverUp,false);assert.equal(defaults.shellSize,6);assert.equal(defaults.blastSize,10);
 assert.equal(evadeAllowed(7,"raw"),false);assert.equal(evadeAllowed(8,"raw"),true);
 assert.equal(evadeAllowed(1,"everyone"),true);assert.equal(evadeAllowed(12,"none"),false);
 assert.equal(winsAreaDefense(15,15),false);assert.equal(winsAreaDefense(15,15,true),true);
 assert.equal(normalizeArea({shellSize:NaN,suppressionWidth:0}).shellSize,6);
 assert.equal(normalizeArea({suppressionWidth:0}).suppressionWidth,1);
});
test("scene scale controls blast size and feet convert to m",()=>{
 fixture();assert.equal(pixelsPerUnit(),50);canvas.scene.grid.distance=1;assert.equal(pixelsPerUnit(),100);
 canvas.scene.grid.units="ft";canvas.scene.grid.distance=5;assert.ok(Math.abs(pixelsPerUnit()-100/1.524)<0.001);
});
test("blast collects footprints, excludes fully wall-blocked tokens, and rolls once",async()=>{
 const f=fixture();CONFIG.Canvas.polygonBackends.move.testCollision=(_a,b,options)=>options.mode==="any"&&b.x>500;
 await startAreaAttack(f.source,f.target,"w","attack");
 assert.equal(f.data().area.width,500);assert.equal(f.data().rows.length,1);assert.equal(f.data().rows[0].name,"b");
 assert.equal(f.calls.filter(x=>x==="roll").length,1);assert.equal(f.weapon.system.magazine.value,19);
 assert.doesNotMatch(f.messages[0].content,/native 20/);assert.doesNotMatch(f.messages[0].content,/data-aoe-action="other"/);
});
test("cancelled placement spends no ammo and produces no roll or card",async()=>{
 const f=fixture();globalThis.previewCancel=true;await startAreaAttack(f.source,f.target,"w","attack");
 assert.equal(f.messages.length,0);assert.equal(f.weapon.system.magazine.value,20);assert.deepEqual(f.calls,[]);
});
test("suppression uses native suppressive mode and requires ten bullets",async()=>{
 const f=fixture("suppression");f.weapon.system.magazine.value=9;
 await assert.rejects(startAreaAttack(f.source,f.target,"w","suppressive"),/10 bullets/);assert.equal(f.messages.length,0);
 f.weapon.system.magazine.value=10;await startAreaAttack(f.source,f.target,"w","suppressive");
 assert.equal(f.weapon.system.magazine.value,0);assert.equal(f.calls.filter(x=>x==="suppressive").length,2);
 assert.equal(f.data().area.width,300);assert.doesNotMatch(f.messages[0].content,/data-aoe-action="decline"/);
});
test("missed blast waits for GM placement and rejects scatter outside the intended square",async()=>{
 const f=fixture("explosive",13);await startAreaAttack(f.source,f.target,"w","attack");
 assert.equal(f.data().phase,"scatter");assert.equal(f.data().rows.length,0);
 assert.match(f.messages[0].content,/gray area.*inactive/);
 await assert.rejects(f.request("scatter",{area:f.data().area}),/Only the GM/);
 await assert.rejects(f.request("scatter",{user:"gm",area:{...f.data().area,origin:{x:1000,y:1000}}}),/inside/);
 await f.request("scatter",{user:"gm",area:{...f.data().area,origin:{x:550,y:50}}});
 assert.equal(f.data().phase,"responses");assert.equal(f.scene.templates.length,2);assert.notEqual(f.scene.templates[0].fillColor,"#737980");assert.ok(f.data().rows.length>0);
});
test("target response reservations reject competing users and explosive ties hit",async()=>{
 const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");
 await assert.rejects(f.request("claim",{user:"stranger",nonce:"x"}),/owner/);
 await f.request("claim",{nonce:"one"});await assert.rejects(f.request("claim",{nonce:"two"}),/unavailable/);
 await f.request("commit",{nonce:"one",total:20,html:"defense"});assert.equal(f.data().rows[0].state,"hit");
 await assert.rejects(f.request("commit",{nonce:"one",total:30,html:"again"}),/expired/);
});
test("Cover Up becomes Prone without moving and cannot be used while disabled",async()=>{
 const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");
 await assert.rejects(f.request("other"),/unavailable/);
 game.settings.get=(_m,k)=>k==="areaSettings"?{...defaults,coverUp:true}:false;f.data().settings.coverUp=true;assert.match(areaContent(f.data()),/Cover Up/);
 await f.request("other");assert.equal(f.data().rows[0].state,"hit");assert.equal(f.data().rows[0].coverUp,true);assert.equal(f.b.effects.length,1);assert.equal(f.target.x,400);
 await assert.rejects(f.request("other"),/unavailable/);assert.equal(f.b.effects.length,1);
});
test("GM can include a wall-excluded token and override a disputed miss",async()=>{
 const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");
 await f.request("add",{user:"gm",target:f.outside.document.uuid});assert.equal(f.data().rows.length,3);
 await f.request("exclude",{user:"gm"});assert.equal(f.data().rows[0].state,"miss");
 await f.request("forcehit",{user:"gm"});assert.equal(f.data().rows[0].state,"hit");
});
test("shells use one fixed DV and shared 3d6, while suppression ties resist",async()=>{
 const f=fixture("shell",13);f.target.x=200;f.target.center.x=250;
 await startAreaAttack(f.source,f.target,"w","attack");assert.equal(f.data().exchange.damageFormula,"3d6");assert.equal(f.data().rows[0].state,"miss");
 const s=fixture("suppression",20);await startAreaAttack(s.source,s.target,"w","suppressive");
 await s.request("claim",{nonce:"s"});await s.request("commit",{nonce:"s",total:20,html:"Concentration"});
 assert.equal(s.data().rows[0].state,"miss");
});
test("one shared damage roll is reused per target and each application is idempotent",async()=>{
 const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");await f.request("decline");
 await f.request("damage",{target:undefined,user:"att",damageRequest:{action:"damageClaim",nonce:"damage"}});
 await assert.rejects(f.request("damage",{target:undefined,user:"att",damageRequest:{action:"damageClaim",nonce:"duplicate"}}),/already/);
 const result={html:"<div>damage</div>",sixes:0,values:{total:24,bonus:0,location:"body",ablation:1,ammo:"basic",ignorePercent:0,ignoreBelow:0,lethal:true}};
 await f.request("damage",{target:undefined,user:"att",damageRequest:{action:"damageCommit",nonce:"damage",damage:result}});
 const request={action:"damageApply",targetUuid:f.target.document.uuid,application:"recorded",applicationId:"apply1",options:{useShield:true,damageReductionRole:true,damageReductionAE:true,brainDamageReduction:true}};
 await f.request("exclude",{user:"gm",target:f.third.document.uuid});
 await f.request("damage",{damageRequest:request});await f.request("damage",{damageRequest:request});
 assert.equal(f.data().areaHidden,true);assert.equal(f.scene.templates[0].hidden,true);
 assert.equal(f.calls.filter(x=>x==="apply:b").length,1);assert.equal(f.data().rows[0].damage.recordedApplied,true);
 assert.equal(f.data().exchange.damage.result.values.total,24);
});


test("native asynchronous magazine writes finish before confirm returns",async()=>{
 const {confirmAreaRoll}=await import("../dist/scripts/aoe/weapon.js");
 const log=[];const roll={};
 const item={dischargeItem(){return new Promise(resolve=>setTimeout(()=>{log.push("write");resolve()},5))},confirmRoll(r){this.dischargeItem(r);log.push("confirm");return r}};
 assert.equal(await confirmAreaRoll(item,roll),roll);assert.deepEqual(log,["confirm","write"]);
 item.dischargeItem=()=>Promise.reject(Error("write failed"));
 await assert.rejects(confirmAreaRoll(item,roll),/write failed/);
});
test("thrown grenade uses a native Athletics weapon and consumes exactly one inventory unit",async()=>{
 const f=fixture();f.weapon.type="ammo";f.weapon.system.variety="grenade";f.weapon.system.type="basic";f.weapon.system.amount=2;
 f.weapon.update=async data=>{f.weapon.system.amount=data["system.amount"];};
 game.packs=new Map([["cyberpunk-red-core.core_weapons",{getIndex:async()=>[{_id:"29p2bEfPcAWHpsTY",name:"Thrown Weapon"}],getDocument:async()=>({toObject:()=>({name:"Thrown Weapon",type:"weapon",system:{}})})}]]);
 let transient;
 CONFIG.Item={documentClass:class{constructor(data,{parent}){Object.assign(this,data);this.actor=parent;this.createRoll=f.weapon.createRoll;transient=this;}}};
 await startAreaAttack(f.source,f.target,"w","attack");
 assert.equal(transient.system.weaponSkill,"Athletics");assert.equal(transient.system.dvTable,"DV Grenade Launcher");
 assert.equal(f.weapon.system.amount,1);assert.equal(f.calls.filter(x=>x==="consume").length,0);
 assert.equal(f.data().exchange.criticalMethod,"Grenade");assert.equal(f.data().exchange.thrownSource.system.damage,"6d6");
});
test("cancelling native attack confirmation spends nothing",async()=>{
 const f=fixture();const create=f.weapon.createRoll;
 f.weapon.createRoll=function(mode){return {...create.call(this,mode),handleRollDialog:async()=>false}};
 await startAreaAttack(f.source,f.target,"w","attack");assert.equal(f.weapon.system.magazine.value,20);assert.equal(f.messages.length,0);
});
test("RAW suppressive mode delegates a circle to area coverage",async()=>{
 const f=fixture("suppression");game.settings.get=(_m,k)=>k==="areaSettings"?{...defaults,suppressionShape:"raw"}:k==="rollMode"?"roll":false;
 f.third.x=1200;f.third.y=1200;f.third.center={x:1250,y:1250};
 await startAreaAttack(f.source,f.target,"w","suppressive");
 assert.ok(f.data().rows.some(r=>r.uuid===f.third.document.uuid));
});

test("only the GM can hide and reveal the shared area, without owning a token",async()=>{
 const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");
 f.docs.delete(f.source.document.uuid);
 await assert.rejects(f.request("show",{user:"stranger",hidden:true}),/Only the GM/);
 await f.request("show",{user:"gm",hidden:true});
 assert.equal(f.scene.templates[0].hidden,true);assert.match(f.messages[0].content,/Show attack area/);
 await f.request("show",{user:"gm",hidden:false});
 assert.equal(f.scene.templates[0].hidden,false);assert.match(f.messages[0].content,/Hide attack area/);
});
test("auto-hide waits for damage and manual reveal persists after completion",async()=>{
 const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");
 await f.request("show",{user:"gm",hidden:false});await f.request("decline");
 await f.request("exclude",{user:"gm",target:f.third.document.uuid});
 assert.equal(f.scene.templates[0].hidden,false);
 f.data().rows[0].damage={status:"review",recordedApplied:false};
 await f.request("show",{user:"gm",hidden:false});assert.equal(f.data().resolutionComplete,false);
 await f.request("damage",{user:"gm",damageRequest:{action:"damageResolved"}});
 assert.equal(f.data().resolutionComplete,true);assert.equal(f.scene.templates[0].hidden,true);
 await f.request("show",{user:"gm",hidden:false});assert.equal(f.scene.templates[0].hidden,false);
 await f.request("show",{user:"gm",hidden:false});assert.equal(f.scene.templates[0].hidden,false);
 await f.request("add",{user:"gm",target:f.outside.document.uuid});assert.equal(f.data().resolutionComplete,false);
 await f.request("exclude",{user:"gm",target:f.outside.document.uuid});assert.equal(f.scene.templates[0].hidden,true);
});
test("special effects and blast escape remain pending until resolved",async()=>{
 const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");f.data().special=true;
 await f.request("decline");await f.request("claim",{target:f.third.document.uuid,nonce:"evade"});
 await f.request("commit",{target:f.third.document.uuid,nonce:"evade",total:30,html:"evaded"});
 await assert.rejects(f.request("effectsResolved"),/GM/);
 await f.request("effectsResolved",{user:"gm"});assert.equal(f.data().resolutionComplete,false);
 await f.request("move",{target:f.third.document.uuid,point:{x:1050,y:50}});assert.equal(f.data().areaHidden,true);
});
test("suppression auto-hides after every concentration result without damage",async()=>{
 const f=fixture("suppression");await startAreaAttack(f.source,f.target,"w","suppressive");
 for(const row of [...f.data().rows]){
  await f.request("claim",{target:row.uuid,nonce:row.uuid});
  await f.request("commit",{target:row.uuid,nonce:row.uuid,total:10,html:"check"});
 }
 assert.equal(f.data().resolutionComplete,true);assert.equal(f.scene.templates[0].hidden,true);
});

test("shape settings migrate old corridors and preserve independent dimensions",()=>{
 const migrated=normalizeArea({suppressionShape:"corridor",suppressionWidth:1,corridorMax:40,shellSize:8});
 assert.equal(migrated.suppressionShape,"ray");assert.equal(migrated.suppressionWidth,1);assert.equal(migrated.corridorMax,40);assert.equal(migrated.shellSize,8);
 assert.equal(normalizeArea({shellAngle:NaN}).shellAngle,45);assert.equal(normalizeArea({blastShape:"cone"}).blastShape,"square");
 const f=fixture();const settings=normalizeArea({shellShape:"cone",shellAngle:90,shellRange:12,blastShape:"circle",blastRadius:5});
 const shell=makeArea("shell",f.source,f.target.center,settings);assert.equal(shell.shape,"cone");assert.equal(shell.angle,90);assert.equal(shell.length,600);
 const blast=makeArea("explosive",f.source,f.target.center,settings);assert.equal(blast.shape,"circle");assert.equal(blast.length,250);assert.deepEqual(blast.origin,f.target.center);
 const suppression=makeArea("suppression",f.source,f.target.center,{...settings,suppressionShape:"cone",suppressionAngle:45});assert.equal(suppression.angle,45);assert.equal(suppression.length,1250);
});

test("removed AoE options are discarded",()=>{const s=normalizeArea({evadeTies:true,shellDV:99,blastAngle:90});assert.equal("evadeTies" in s,false);assert.equal("shellDV" in s,false);assert.equal("blastAngle" in s,false);});

test("Cover Up damage hands the per-target modifier to native application",async()=>{
 const f=fixture();game.settings.get=(_m,k)=>k==="areaSettings"?{...defaults,coverUp:true}:k==="rollMode"?"roll":false;
 await startAreaAttack(f.source,f.target,"w","attack");await f.request("other");
 let args;f.b._applyDamage=async(...values)=>args=values;
 f.data().exchange.damage={status:"rolled",result:{html:"damage",values:{total:20,bonus:0,location:"body",ablation:1,ammo:"grenade",ignorePercent:0,ignoreBelow:0,lethal:true}}};
 await f.request("damage",{damageRequest:{action:"damageApply",targetUuid:f.target.document.uuid,application:"recorded",applicationId:"cover",options:{useShield:false,damageReductionRole:false,damageReductionAE:false,brainDamageReduction:false}}});
 assert.equal(args[3],0);assert.equal(args[5],-100);assert.equal(f.data().rows[0].damage.recordedApplied,true);
 assert.equal(f.data().exchange.damage.result.values.ignorePercent,0);
});
test("shell evasion also waits for relocation",async()=>{
 const f=fixture("shell");f.target.x=200;f.target.center.x=250;
 await startAreaAttack(f.source,f.target,"w","attack");await f.request("claim",{nonce:"shell"});await f.request("commit",{nonce:"shell",total:30,html:"evasion"});
 assert.equal(f.data().resolutionComplete,false);assert.match(f.messages[0].content,/Move outside AoE/);
 await f.request("move",{point:{x:1050,y:50}});assert.equal(f.data().resolutionComplete,true);
});

 test("area attack dice reveal only after the last response and never repeat",async()=>{
  const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");
  assert.deepEqual(f.data().exchange.dice,[JSON.stringify({total:7}),JSON.stringify({total:3})]);
  f.data().exchange.rollMode="gmroll";
  await f.request("decline");assert.equal(diceShown.length,0);
  await f.request("claim",{target:f.third.document.uuid,nonce:"last"});assert.equal(diceShown.length,0);
  await f.request("commit",{target:f.third.document.uuid,nonce:"last",total:25,html:"defense"});
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(diceShown,[{roll:{total:7},mode:"gmroll"},{roll:{total:3},mode:"gmroll"}]);
  assert.equal(f.data().attackDiceRevealed,true);
  await f.request("show",{user:"gm",hidden:false});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(diceShown.length,2);
 });
 test("legacy area cards do not replay dice on later saves",async()=>{
  const f=fixture();await startAreaAttack(f.source,f.target,"w","attack");
  delete f.data().attackDiceRevealed;f.data().exchange.dice=[JSON.stringify({total:7})];
  for(const row of f.data().rows)row.state="hit";
  await f.request("show",{user:"gm",hidden:false});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(diceShown.length,0);
 });

test("scatter placement stays silent until all responses resolve",async()=>{
 const f=fixture("explosive",10);await startAreaAttack(f.source,f.target,"w","attack");
 await f.request("show",{user:"gm",hidden:false});assert.equal(diceShown.length,0);
 await f.request("scatter",{user:"gm",area:f.data().area});assert.equal(diceShown.length,0);
 for(const row of [...f.data().rows])await f.request("decline",{target:row.uuid});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(diceShown.length,2);
});

test("poison grenades use per-target resistance instead of normal damage",async()=>{
 const f=fixture();f.weapon.system.weaponType="grenadeLauncher";f.weapon._getLoadedAmmoProp=p=>p==="type"?"poison":"grenade";
 await startAreaAttack(f.source,f.target,"w","attack");assert.equal(f.data().ammoType,"poison");assert.ok(f.data().special);assert.equal(f.data().rows[0].instant.id,"poison");
 await f.request("decline");await f.request("instant",{instantRequest:{action:"claim",nonce:"resist"}});await f.request("instant",{instantRequest:{action:"commit",nonce:"resist",total:14,html:"native resistance"}});
 assert.equal(f.data().rows[0].instant.state,"resisted");assert.match(f.messages[0].content,/native resistance/);assert.doesNotMatch(f.messages[0].content,/resolve its effects manually/);await assert.rejects(f.request("damage",{damageRequest:{action:"damageClaim",nonce:"x"}}),/unavailable/);
});
test("armor-piercing rocket records its ammunition and damage formula before reload",async()=>{
 const f=fixture();f.weapon._getLoadedAmmoProp=p=>p==="type"?"armorPiercing":"rocket";
 await startAreaAttack(f.source,f.target,"w","attack");f.weapon._getLoadedAmmoProp=()=>"poison";
 assert.deepEqual(f.data().exchange.areaAmmo,{type:"armorPiercing",variety:"rocket"});assert.equal(f.data().exchange.damageFormula,"8d6");assert.equal(f.data().special,false);
});
test("incendiary ignition is offered only after penetrating damage",async()=>{
 for(const penetrates of [true,false]){
  const f=fixture();globalThis.testPenetrated=penetrates;f.weapon.system.weaponType="grenadeLauncher";f.weapon._getLoadedAmmoProp=p=>p==="type"?"incendiary":"grenade";
  await startAreaAttack(f.source,f.target,"w","attack");await f.request("decline");
  f.data().exchange.damage={status:"rolled",user:"att",nonce:"damage",result:{html:"native",values:{total:20,bonus:0,location:"body",ablation:1,ammo:"grenade",ignorePercent:0,ignoreBelow:0,lethal:true}}};
  await f.request("damage",{damageRequest:{action:"damageApply",options:{useShield:false,damageReductionRole:false,damageReductionAE:false,brainDamageReduction:false}}});
  assert.equal(f.data().rows[0].instant.state,penetrates?"failed":"skipped");
 }
});
test("smart rockets cannot fire without installed Targeting Scope",async()=>{const f=fixture();f.weapon._getLoadedAmmoProp=p=>p==="type"?"smart":"rocket";await assert.rejects(startAreaAttack(f.source,f.target,"w","attack"),/Targeting Scope/);assert.equal(f.weapon.system.magazine.value,20)});

test("smart second chance uses only base 10 and Luck, before scatter, with one rocket consumed",async()=>{
 const f=fixture("explosive",10);f.weapon._getLoadedAmmoProp=p=>p==="type"?"smart":"rocket";f.a.items.push({id:"scope",type:"cyberware",name:"Targeting Scope",system:{isInstalledInActor:true}});
 globalThis.SmartRoll=class {constructor(){this.luck=0;this.mods=[];this.additionalMods=[];this.resultTotal=18;this.rollCard="native"}addMod(m){this.mods.push(...m)}async handleRollDialog(){this.mods.push({value:100,source:"unrelated"});this.additionalMods.push({value:100});return true}wasCritical(){return false}async roll(){assert.deepEqual(this.mods,[{value:10,source:"Smart ammunition"}]);assert.deepEqual(this.additionalMods,[]);this._roll={toJSON:()=>({total:8})}}};
 await startAreaAttack(f.source,f.target,"w","attack");assert.equal(f.data().phase,"responses");assert.equal(f.data().exchange.total,18);assert.equal(f.weapon.system.magazine.value,19);assert.equal(f.data().exchange.dice.length,3);assert.match(f.data().exchange.html,/pneuma-smart-first/);
});

test("leg injury blocks shell/blast evasion and late commits, but leaves Concentration available",async()=>{
 for(const kind of ["shell","explosive","suppression"]){
  const f=fixture(kind);f.b.items.push({type:"criticalInjury",name:"Dismembered Leg"});await startAreaAttack(f.source,f.target,"w",kind==="suppression"?"suppressive":"attack");
  if(!f.data().rows.some(r=>r.uuid===f.target.document.uuid))await f.request("add",{user:"gm"});
  if(kind==="suppression"){await f.request("claim",{nonce:"n"});await f.request("release",{nonce:"n"});continue;}
  await assert.rejects(f.request("claim",{nonce:"n"}),/Cannot evade/);
  f.b.items=[];await f.request("claim",{nonce:"n"});f.b.items.push({type:"criticalInjury",name:"Dismembered Leg"});
  await assert.rejects(f.request("commit",{nonce:"n",total:30,html:"defense"}),/Cannot evade/);await f.request("release",{nonce:"n"});
 }
});

test('automatic area defense skips all dialogs, rolls NPCs once and retains manual escape placement',async()=>{
 const {automateArea}=await import('../dist/scripts/aoe/workflow.js');const f=fixture();
 game.settings.get=(_m,k)=>k==='areaSettings'?defaults:k==='npcAutoEvasion'?true:k==='evasionEligibility'?'raw':k==='rollMode'?'roll':false;
 await startAreaAttack(f.source,f.target,'w','attack');const message=game.messages[0];let rolls=0;
 for(const token of canvas.tokens.placeables){token.actor.hasPlayerOwner=false;token.actor.items.push({id:'evade',type:'skill',name:'Evasion',createRoll(){return {luck:0,rollCard:'native',resultTotal:30,handleRollDialog(){throw Error('Unexpected GM dialog')},async roll(){rolls++},wasCritical(){return false}}},async confirmRoll(r){return r}});}
 await Promise.all([automateArea(message),automateArea(message)]);const data=message.flags[M].aoe;assert(rolls>0);assert(data.rows.every(r=>r.state==='miss'));assert(data.rows.every(r=>!r.moved));const n=rolls;await automateArea(message);assert.equal(rolls,n);
});
test('homebrew area defense settings and player ownership prevent NPC automation',async()=>{
 const {automateArea}=await import('../dist/scripts/aoe/workflow.js');
 for(const changed of [{evade:'everyone'},{evadePenalty:-1},{evadeMove:true},{evadeBorrow:true},{coverUp:true},{player:true}]){
  const f=fixture();game.settings.get=(_m,k)=>k==='areaSettings'?{...defaults,...changed}:k==='npcAutoEvasion'?true:k==='evasionEligibility'?'raw':k==='rollMode'?'roll':false;
  await startAreaAttack(f.source,f.target,'w','attack');for(const token of canvas.tokens.placeables)token.actor.hasPlayerOwner=!!changed.player;
  const message=game.messages[0];await automateArea(message);assert(message.flags[M].aoe.rows.every(r=>r.state==='waiting'));
 }
});

function encounterFixture(){const f=fixture();const combat={id:'c',scene:f.scene,active:true,started:true,flags:{},combatants:[f.source,f.target,f.third,f.outside].map(t=>({token:t.document,actor:t.actor}))};game.combats=collection([combat]);game.combat={id:'preview',started:true,round:99};return {...f,combat};}
test('AoE captures active scene encounter and follows it across tracker changes',async()=>{const f=encounterFixture();await startAreaAttack(f.source,f.target,'w','attack');assert.equal(f.data().exchange.combatId,'c');f.combat.active=false;game.combat={id:'elsewhere'};await f.request('decline');assert.equal(f.data().rows.find(r=>r.uuid===f.target.document.uuid).state,'hit');});
test('ambiguous area encounters stop before ammunition or attack rolls',async()=>{const f=encounterFixture();game.combats.push({...f.combat,id:'second'});await assert.rejects(startAreaAttack(f.source,f.target,'w','attack'),/Multiple active/);assert.equal(f.weapon.system.magazine.value,20);assert.equal(f.messages.length,0);});
test('area attack checks all covered token memberships before ammunition',async()=>{const f=encounterFixture();f.combat.combatants=f.combat.combatants.filter(c=>c.token.uuid!==f.target.document.uuid);await assert.rejects(startAreaAttack(f.source,f.target,'w','attack'),/participating tokens/);assert.equal(f.weapon.system.magazine.value,20);});
test('reset area encounter rejects responses without adopting replacement',async()=>{const f=encounterFixture();await startAreaAttack(f.source,f.target,'w','attack');f.combat.flags={'pneuma-combattools':{evasionEpoch:'reset'}};await assert.rejects(f.request('decline'),/reset/);assert.equal(f.data().rows.find(r=>r.uuid===f.target.document.uuid).state,'waiting');});


test('area attacks reject unseen aim squares before ammunition is consumed',async()=>{
 const f=fixture();f.source.checkCollision=(_point,options)=>{assert.equal(options.type,'sight');return true};
 await assert.rejects(startAreaAttack(f.source,f.target,'w','attack'),/line of sight/);assert.equal(f.weapon.system.magazine.value,20);assert.equal(f.messages.length,0);
});

test('original explosive target marker stays put after GM scatter and follows area visibility',async()=>{
 const f=fixture('explosive',5);await startAreaAttack(f.source,f.target,'w','attack');
 const original={...f.data().intended};await f.request('scatter',{user:'gm',area:{...f.data().area,origin:{x:original.x+100,y:original.y}}});
 const marker=f.scene.templates.find(t=>t.flags[M].originalAim);assert.ok(marker);assert.deepEqual(marker.flags[M].areaShape.origin,original);
 const blast=f.scene.templates.find(t=>!t.flags[M].originalAim);assert.equal(blast.flags[M].areaShape.origin.x,original.x+100);
 assert.equal(marker.flags[M].areaShape.length,100);
 await f.request("show",{user:"gm",hidden:true});assert.equal(marker.hidden,true);assert.equal(blast.hidden,true);
 await f.request("show",{user:"gm",hidden:false});assert.equal(marker.hidden,false);assert.equal(f.scene.templates.length,2);
});


test('line of sight is rechecked after the native attack dialog before consuming ammo',async()=>{
 const f=fixture();const create=f.weapon.createRoll.bind(f.weapon);let blocked=false;
 f.source.checkCollision=()=>blocked;
 f.weapon.createRoll=mode=>{const roll=create(mode);roll.handleRollDialog=async()=>{blocked=true;return true};return roll};
 await assert.rejects(startAreaAttack(f.source,f.target,'w','attack'),/line of sight/);assert.equal(f.weapon.system.magazine.value,20);assert.equal(f.messages.length,0);
});
