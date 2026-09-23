import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,next){
 if(specifier==="./combat-resolution.js"&&context.parentURL?.endsWith("/attack-menu.js"))
  return {shortCircuit:true,url:"data:text/javascript,export const startCombatExchange=(...args)=>globalThis.exchangeHandler(...args);"};
 return next(specifier,context);
}});
import assert from "node:assert/strict";
import { test } from "node:test";
import { canShowQuickhack, attackEntries, attackFromHUD } from "../dist/scripts/attack-menu.js";
const weapon = (id, system = {}, extra = {}) => ({id, name:id, type:"weapon", system:{amount:1,equipped:"equipped",weaponType:"heavyPistol",isRanged:true,...system},...extra});
test("separates weapons and hand-to-hand, excludes quickhacks and carried weapons", () => {
  const rows=attackEntries([weapon("Pistol"),weapon("Blade",{weaponType:"lightMelee",isRanged:false}),
    weapon("Carried",{equipped:"carried"}),weapon("Unarmed",{weaponType:"unarmed",equipped:"equipped"}),
    weapon("Karate",{weaponType:"martialArts",equipped:"equipped"}),weapon("Unequipped Karate",{weaponType:"martialArts",equipped:"owned"}),weapon("Unequipped Unarmed",{weaponType:"unarmed",equipped:"carried"}),weapon("Renamed hack",{weaponType:"unarmed"},{flags:{"pneuma-quickhack":{action:"quickhack"}}}),
    weapon("Quickhack"),weapon("Grenade",{weaponType:"thrownWeapon"}),weapon("Gear",{}, {type:"gear"})]);
  assert.deepEqual(rows.filter(r=>!r.brawling).map(r=>r.name),["Blade","Pistol"]);
  assert.deepEqual(rows.filter(r=>r.brawling).map(r=>r.name),["Karate","Unarmed"]);
});
test("autofire matches CPR capability checks",()=>{
  const rows=attackEntries([weapon("Pistol"),weapon("SMG",{weaponType:"smg"}),weapon("Exotic",{fireModes:{suppressiveFire:true}})]);
  assert.deepEqual(rows.filter(r=>r.autofire).map(r=>r.name),["Exotic","SMG"]);
});
function setup(handler) {
 globalThis.exchangeHandler=(...args)=>sheet._onRoll(...args);
 const sheet={_getFireCheckbox:()=>"suppressive",_onRoll:handler};
 const actor={isOwner:true,uuid:"Actor.test",items:[weapon("SMG",{weaponType:"smg"})],sheet};sheet.actor=actor;
 const attacker={id:"attacker",actor,document:{id:"attacker"},can:()=>true,control:()=>true};
 const target={id:"target",isVisible:true,actor:{},setTarget(value,options){assert.equal(value,true);assert.equal(options.releaseOthers,true);}};
 globalThis.game={user:{id:"user"},settings:{get:()=>false}};
 globalThis.canvas={tokens:new Map([[attacker.id,attacker],[target.id,target]])};
 return {actor,sheet,attacker,target};
}
test("combat exchange receives exact tokens, item, mode and event despite legacy false setting",async()=>{
 const event={currentTarget:{dataset:{itemId:"SMG"}},ctrlKey:true};
 for(const mode of ["attack","aimed","autofire"]){
  let calls=0;const f=setup(async function(attacker,target,itemId,receivedMode,e){calls++;assert.equal(e,event);assert.equal(attacker,f.attacker);assert.equal(target,f.target);assert.equal(itemId,"SMG");assert.equal(receivedMode,mode);});
  await attackFromHUD(f.attacker,f.target,"SMG",mode,event);assert.equal(calls,1);assert.equal(f.sheet._getFireCheckbox(),"suppressive");assert.equal(f.sheet.token,undefined);
 }
});
test("rejects stale items and lost ownership, blocks duplicate pending calls and releases on failure",async()=>{
 let calls=0,release;const f=setup(async()=>{calls++;await new Promise(r=>release=r);});
 await attackFromHUD(f.attacker,f.target,"missing","attack",{});assert.equal(calls,0);
 f.actor.isOwner=false;await attackFromHUD(f.attacker,f.target,"SMG","attack",{});assert.equal(calls,0);f.actor.isOwner=true;
 const pending=attackFromHUD(f.attacker,f.target,"SMG","attack",{});
 await new Promise(resolve=>setImmediate(resolve));
 await attackFromHUD(f.attacker,f.target,"SMG","attack",{});assert.equal(calls,1);release();await pending;
 f.sheet._onRoll=async()=>{throw new Error("cancelled");};await assert.rejects(attackFromHUD(f.attacker,f.target,"SMG","attack",{}));
 f.sheet._onRoll=async()=>{calls++;};await attackFromHUD(f.attacker,f.target,"SMG","attack",{});assert.equal(calls,2);
});

test("Quickhack visibility requires acting actor's Netrunner role without a launcher ownership rule", () => {
 const role={id:"role",name:" Netrunner ",type:"role",system:{}};
 const launcher=weapon("Renamed launcher",{}, {flags:{"pneuma-quickhack":{action:"quickhack"}}});
 assert.equal(canShowQuickhack([role,launcher]),true);
 assert.equal(canShowQuickhack([launcher]),false);
 assert.equal(canShowQuickhack([role]),true);
 assert.equal(canShowQuickhack([]),false);
 assert.equal(canShowQuickhack([role,{...launcher,system:{equipped:"owned"}}]),true);
 assert.equal(canShowQuickhack([role,weapon("Quickhack")]),true);
 assert.equal(canShowQuickhack([{...role,type:"gear"},launcher]),false);
});

test("restores captured attacker and defender before every attack mode", async () => {
 for (const mode of ["attack", "aimed", "autofire"]) {
  const steps=[];
  let selected=["other", "attacker"], targets=["unrelated"];
  const f=setup(async()=>{
   steps.push("roll");
   assert.deepEqual(selected,[f.attacker.id]);
   assert.deepEqual(targets,[f.target.id]);
  });
  f.attacker.control=options=>{assert.equal(options.releaseOthers,true);steps.push("control");selected=[f.attacker.id];return true;};
  f.target.setTarget=(value,options)=>{assert.equal(value,true);assert.equal(options.releaseOthers,true);steps.push("target");targets=[f.target.id];};
  await attackFromHUD(f.attacker,f.target,"SMG",mode,{});
  assert.deepEqual(steps,["control","target","roll"]);
 }
});
test("stale tokens and denied control do not target or roll; failed control releases lock", async () => {
 const steps=[];
 const f=setup(async()=>steps.push("roll"));
 f.attacker.control=()=>{steps.push("control");return false;};
 f.target.setTarget=()=>steps.push("target");
 for (const token of [f.attacker,f.target]) {
  canvas.tokens.delete(token.id);
  await attackFromHUD(f.attacker,f.target,"SMG","attack",{});
  assert.deepEqual(steps,[]);
  canvas.tokens.set(token.id,token);
 }
 f.attacker.can=()=>false;
 await attackFromHUD(f.attacker,f.target,"SMG","attack",{});
 assert.deepEqual(steps,[]);
 f.attacker.can=()=>true;
 await attackFromHUD(f.attacker,f.target,"SMG","attack",{});
 assert.deepEqual(steps,["control"]);
 f.attacker.control=()=>true;
 await attackFromHUD(f.attacker,f.target,"SMG","attack",{});
 assert.deepEqual(steps,["control","target","roll"]);
});

test("attack and hover share installed cyberweapon and attachment eligibility", async () => {
 const {equippedRanges}=await import('../dist/scripts/dv-data.js');
 const launcher=weapon("Launcher",{equipped:"owned",isInstalled:true,dvTable:"DV Rifle",modifiers:{secondaryWeapon:{configured:true}}},{type:"itemUpgrade"});
 const scope=weapon("Scope",{equipped:"owned",isInstalled:true,dvTable:"DV Rifle",modifiers:{secondaryWeapon:{configured:false}}},{type:"itemUpgrade"});
 const parent=weapon("Parent",{upgrades:[{_id:"Launcher"},{_id:"Scope"}]},{type:"gear"});
 const cyber=weapon("Cyber",{equipped:"owned",isInstalled:true,isInstalledInActor:true,isWeapon:true,dvTable:"DV Pistol"},{type:"cyberware"});
 const spare={...cyber,id:"spare",name:"spare",system:{...cyber.system,isInstalledInActor:false}};
 const utility={...cyber,id:"utility",system:{...cyber.system,isWeapon:false}};
 const blade=weapon("Cyber blade",{equipped:"owned",isInstalled:true,isWeapon:true,isRanged:false,weaponType:"lightMelee"},{type:"cyberware"});
 const items=[parent,launcher,scope,cyber,spare,utility,blade];
 assert.deepEqual(attackEntries(items).map(r=>r.name),["Cyber","Cyber blade","Launcher"]);
 assert.deepEqual(equippedRanges(items,false).map(r=>r.name).sort(),["Cyber","Launcher"]);
 parent.system.equipped="carried";
 assert.deepEqual(attackEntries(items).map(r=>r.name),["Cyber","Cyber blade"]);
});
test("installed weapons route through combat exchange and reject removal", async () => {
 let calls=0;
 const f=setup(async()=>{calls++;});
 f.actor.items=[weapon("Cyber",{equipped:"owned",isInstalled:true,isWeapon:true},{type:"cyberware"})];
 await attackFromHUD(f.attacker,f.target,"Cyber","attack",{});
 assert.equal(calls,1);
 f.actor.items[0].system.isInstalled=false;
 await attackFromHUD(f.attacker,f.target,"Cyber","attack",{});
 assert.equal(calls,1);
});

test("HUD defender remains authoritative when other tokens are targeted",async()=>{
 const f=setup(async()=>{});let targetCalls=0;
 game.user.targets=new Set([{id:"smitty"},{id:"other"}]);
 f.target.setTarget=()=>{targetCalls++;};
 await attackFromHUD(f.attacker,f.target,"SMG","attack",{});
 assert.equal(targetCalls,1);
});

test("menu categories separate ranged/melee and inventory throws and grenades",async()=>{
 const {thrownEntries,grenadeEntries}=await import("../dist/scripts/attack-menu.js");
 const rows=attackEntries([weapon("Gun"),weapon("Sword",{weaponType:"veryHeavyMelee",isRanged:false}),weapon("MA",{weaponType:"martialArts",isRanged:false}),weapon("Rocket",{weaponType:"rocketLauncher"})]);
 assert.equal(rows.find(r=>r.name==="Gun").category,"attack");
 assert.equal(rows.find(r=>r.name==="Sword").category,"melee");
 assert.equal(rows.find(r=>r.name==="MA").category,"brawling");
 assert.equal(rows.find(r=>r.name==="Rocket").deferred,false);
 assert.equal(thrownEntries([weapon("Knife",{weaponType:"thrownWeapon",equipped:"owned"})]).length,1);
 assert.deepEqual(grenadeEntries([weapon("Grenade",{variety:"grenade",type:"armorPiercing"},{type:"ammo"}),weapon("Smoke",{variety:"grenade",type:"smoke"},{type:"ammo"}),weapon("EMP",{variety:"grenade",type:"emp"},{type:"ammo"}),weapon("Bullet",{variety:"heavyPistol",type:"armorPiercing"},{type:"ammo"}),weapon("Rocket",{variety:"rocket",type:"armorPiercing"},{type:"ammo"}),weapon("Misnamed grenade",{type:"grenade",variety:"rifle"},{type:"ammo"})]).map(r=>r.name),["Grenade","Smoke","EMP"]);
});
test("thrown roll item preserves source, uses Athletics and chosen dice, and does not discharge inventory",async()=>{
 const {thrownRollItem,usedThrownName}=await import("../dist/scripts/thrown-weapons.js");
 globalThis.foundry={utils:{deepClone:structuredClone}};
 globalThis.CONFIG={Item:{documentClass:class {constructor(data,context){Object.assign(this,data);this.parent=context.parent;} async confirmRoll(){throw Error("must not mutate inventory");}}}};
 const source={name:"Rock",system:{weaponType:"thrownWeapon",damage:"6d6",ignoreArmorPercent:50,magazine:{value:0,max:1}}};
 const actor={};const item=thrownRollItem(source,actor,3);
 assert.equal(item.system.isRanged,true);assert.equal(item.system.weaponSkill,"Athletics");
 assert.equal(item.system.damage,"3d6");assert.equal(item.system.ignoreArmorPercent,0);assert.equal(item.parent,actor);
 assert.equal(source.system.magazine.value,0);assert.equal(source.system.damage,"6d6");
 const roll={};assert.equal(await item.confirmRoll(roll),roll);
 assert.equal(usedThrownName("Rock"),"Rock (used)");assert.equal(usedThrownName("Rock (used)"),"Rock (used)");
});

test("grenade menu excludes depleted inventory",async()=>{
 const {grenadeEntries}=await import("../dist/scripts/attack-menu.js");
 const items=[0,1,3,-1].map(amount=>weapon(String(amount),{variety:"grenade",amount},{type:"ammo"}));
 assert.deepEqual(grenadeEntries(items).map(row=>row.id),["1","3"]);
});
