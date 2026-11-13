import assert from "node:assert/strict";
import { test } from "node:test";
const get=(o,p)=>p.split(".").reduce((v,k)=>v?.[k],o);
const set=(o,p,v)=>{const keys=p.split(".");let at=o;for(const key of keys.slice(0,-1))at=at[key]??={};at[keys.at(-1)]=v;};
globalThis.foundry={utils:{getProperty:get,setProperty:set,randomID:()=>"test-id"}};
globalThis.FormApplication=class {};
const {masterStatuses}=await import("../dist/scripts/status-catalog.js");
const {syncActorStatuses,statusAuthority,registerStatusSync}=await import("../dist/scripts/status-sync.js");
const {validateCustomStatuses,configuredStatuses}=await import("../dist/scripts/status-settings.js");
class Collection extends Map { [Symbol.iterator](){return this.values();} }
let serial=0;
class Effect {
 constructor(data,parent){Object.assign(this,data);this.id=data._id??"e"+(++serial);this.parent=parent;this.name=data.name;this.disabled=!!data.disabled;this.statuses=new Set(data.statuses??[]);this.system={isSuppressed:false};}
}
class Item {
 async update(changes){for(const [key,value] of Object.entries(changes))set(this,key,value);}
 constructor(data,parent){Object.assign(this,data);this.id=data._id??"i"+(++serial);this.parent=parent;this.effects=new Collection((data.effects??[]).map(e=>{const doc=new Effect(e,this);return [doc.id,doc];}));}
 async updateEmbeddedDocuments(_type,rows){for(const row of rows)Object.assign(this.effects.get(row._id),row,row.statuses?{statuses:new Set(row.statuses)}:{});}
}
class Actor {
 constructor(){this.uuid="Actor."+ (++serial);this.type="character";this.items=new Collection();this.effects=new Collection();this.failCreate=false;this.failDelete=false;}
 testUserPermission(user){return user.id==="owner";}
 async createEmbeddedDocuments(type,rows){
  if(type==="Item"&&this.failCreate)throw Error("import failed");
  return rows.map(data=>{const doc=type==="Item"?new Item(data,this):new Effect(data,this);(type==="Item"?this.items:this.effects).set(doc.id,doc);return doc;});
 }
 async deleteEmbeddedDocuments(type,ids){if(type==="Item"&&this.failDelete)throw Error("delete failed");for(const id of ids)(type==="Item"?this.items:this.effects).delete(id);}
 async updateEmbeddedDocuments(_type,rows){for(const row of rows)Object.assign(this.effects.get(row._id),row);}
}
globalThis.Actor=Actor;globalThis.Item=Item;
const leg=masterStatuses.find(s=>s.name==="Broken Leg");
const stim=masterStatuses.find(s=>s.name==="Stim");
test("status sync preserves effect origins so GM-only sheet controls do not change native player actions",async()=>{
 const actor=setup();
 const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Synthcoke",type:"drug",effects:[{name:"Synthcoke Primary"}]}]);
 const [active,inactive,manual,fromItem,unknown]=await actor.createEmbeddedDocuments("ActiveEffect",[
  {name:"Old marker"},{name:"Old inactive marker",disabled:true},{name:"Manual",origin:actor.uuid},
  {name:"Derived from gear",origin:actor.uuid+".Item."+item.id},{name:"Missing source",origin:"Item.missing"}
 ]);
 await syncActorStatuses(actor);
 assert.deepEqual([active.origin,inactive.origin,manual.origin],[undefined,undefined,actor.uuid]);
 assert.equal(fromItem.origin,actor.uuid+".Item."+item.id);
 assert.equal(unknown.origin,"Item.missing");
 assert.equal([...item.effects][0].origin,undefined);
 assert.equal(inactive.disabled,true);
});
const marker=(actor,status,disabled=false)=>actor.createEmbeddedDocuments("ActiveEffect",[{name:status.name,statuses:[status.id],disabled,changes:[]}]);
function setup(){
 globalThis.game={user:{id:"gm",isGM:true},users:{filter:fn=>[{id:"gm",isGM:true,active:true},{id:"owner",active:true}].filter(fn)},settings:{get:()=>null,storage:{get:()=>new Map()}},
 packs:{get:pack=>({getDocument:async id=>{
   const status=masterStatuses.find(s=>s.binding?.pack===pack&&s.binding.itemId===id);
   return {type:status.binding.kind==="injury"?"criticalInjury":"drug",toObject:()=>({_id:id,name:status.binding.itemName,type:status.binding.kind==="injury"?"criticalInjury":"drug",system:{},effects:status.binding.kind==="effect"?[...new Set(masterStatuses.filter(s=>s.binding?.pack===pack&&s.binding.itemId===id).flatMap(s=>s.binding.effectNames??[]))].map(name=>({name,disabled:true,changes:[{key:"native",value:1}]})):[{name:"Native MOVE penalty",changes:[{key:"system.stats.move.value",value:-4}]}]})};
 }})}};
 globalThis.ui={notifications:{error:message=>{throw Error(message);}}};
 return new Actor();
}
test("catalog includes six pharmacy additions and retains 22 native injury bindings",()=>{
 for(const name of ["Iron Grip","Asphyxiating"])assert.ok(!masterStatuses.some(status=>status.name===name));
 assert.equal(masterStatuses.length,74);assert.equal(masterStatuses.filter(s=>s.binding?.kind==="injury").length,22);
 assert.equal(new Set(masterStatuses.map(s=>s.id)).size,74);
 setup();assert.equal(configuredStatuses().filter(s=>s.name==="In Jail").length,1);
});
test("native injury carries its token status and toggles without deleting the item",async()=>{
 const actor=setup();const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Broken Leg",type:"criticalInjury",effects:[{name:"native",statuses:["other"],changes:[{value:-4}]}]}]);
 await syncActorStatuses(actor);await syncActorStatuses(actor);
 const [effect]=item.effects;
 assert.deepEqual([...effect.statuses],["other",leg.id]);assert.equal(actor.effects.size,0);
 await syncActorStatuses(actor,[leg.id],false,false);assert.ok(effect.disabled);assert.equal(actor.items.get(item.id),item);
 await syncActorStatuses(actor,[leg.id],false,true);assert.equal(effect.disabled,false);assert.deepEqual(effect.changes,[{value:-4}]);
});
test("effectless injury marker can be deleted without deleting or recreating the source",async()=>{
 const actor=setup(),hooks={};globalThis.Hooks={on:(k,f)=>hooks[k]=f,once(){}};
 registerStatusSync();
 const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Broken Leg",type:"criticalInjury"}]);
 await syncActorStatuses(actor);
 const [marker]=actor.effects;
 assert.equal(marker.description,"Created by Pneuma Combat Tools.");
 assert.equal(marker.origin,undefined);
 actor.effects.delete(marker.id);hooks.deleteActiveEffect(marker,{},"gm");
 await syncActorStatuses(actor,[],true);assert.equal(actor.effects.size,0);assert.equal(actor.items.get(item.id),item);
 await syncActorStatuses(actor,[leg.id],false,true);assert.equal(actor.effects.size,1);
});
test("failed native import leaves no new markers and a retry succeeds",async()=>{
 const actor=setup();actor.failCreate=true;await assert.rejects(syncActorStatuses(actor,[leg.id],false,true),/import failed/);
 assert.equal(actor.effects.size,0);actor.failCreate=false;await syncActorStatuses(actor,[leg.id],false,true);assert.equal(actor.items.size,1);
});
test("drug toggles use the native effect and preserve stock and unrelated statuses",async()=>{
 const actor=setup();const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Stim",type:"drug",effects:[{name:"Stim",disabled:true}]}]);
 const [effect]=item.effects;await syncActorStatuses(actor,[stim.id],false,true);assert.equal(effect.disabled,false);
 assert.ok(effect.statuses.has(stim.id));assert.equal(actor.effects.size,0);
 await syncActorStatuses(actor,[stim.id],false,false);assert.equal(effect.disabled,true);assert.equal(actor.items.size,1);
 await marker(actor,{id:"prone",name:"Prone"});await syncActorStatuses(actor);assert.equal(actor.effects.size,1);
});
test("native Blue Glass has no effects: primary and addiction remain independent status markers",async()=>{
 const actor=setup(),primary=masterStatuses.find(s=>s.name==='Blue Glass'),addiction=masterStatuses.find(s=>s.name==='Blue Glass Addiction');
 const [item]=await actor.createEmbeddedDocuments('Item',[{name:'Blue Glass',type:'drug',system:{amount:3,usage:'toggled',consumed:'None'},effects:[]}]);
 game.packs.get=()=>{throw Error('Marker must not import a native effect');};
 for(const status of [primary,addiction]){assert.equal(status.binding,undefined);await marker(actor,status);await syncActorStatuses(actor);}
 await syncActorStatuses(actor,[],true);assert.equal(actor.effects.size,2);assert.equal(actor.items.size,1);assert.equal(item.system.amount,3);
 actor.effects.delete([...actor.effects].find(e=>e.statuses.has(primary.id)).id);await syncActorStatuses(actor,[primary.id]);assert.deepEqual([...actor.effects].map(e=>e.name),['Blue Glass Addiction']);
});

test("startup leaves legacy standalone markers intact without importing an injury",async()=>{
 const actor=setup();await marker(actor,leg);await syncActorStatuses(actor,[],true);await syncActorStatuses(actor,[],true);
 assert.equal(actor.items.size,0);assert.equal(actor.effects.size,1);
});
test("custom names and IDs remain unique, and custom In Jail is retained",()=>{
 setup();assert.throws(()=>validateCustomStatuses([{id:"a",name:"Broken Leg",img:"icon.svg"}]),/unique status/);
 assert.throws(()=>validateCustomStatuses([{id:"a",name:"x",img:"javascript:alert(1)"}]),/icon/);
 const rows=[{id:"jail",name:"In Jail",img:"my-jail.svg"}];
 game.settings.storage.get=()=>new Map([["condition-lab-triggler.activeConditionMap",{value:JSON.stringify(rows)}]]);
 assert.equal(configuredStatuses().find(s=>s.name==="In Jail").img,"my-jail.svg");
});
test("only elected GM writes sync, with actor-owner fallback",()=>{
 const actor=setup();assert.equal(statusAuthority(actor),true);
 game.user={id:"owner"};assert.equal(statusAuthority(actor),false);
 game.users.filter=fn=>[{id:"owner",active:true}].filter(fn);assert.equal(statusAuthority(actor),true);
});
test("item hook ignores own writes and routes ordinary source edits",async()=>{
 const actor=setup();const hooks={};globalThis.Hooks={on:(name,fn)=>hooks[name]=fn,once:()=>{}};
 registerStatusSync();const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Broken Leg",type:"criticalInjury"}]);
 hooks.createItem(item,{pneumaStatusSync:true},"gm");await new Promise(resolve=>setTimeout(resolve,0));assert.equal(actor.effects.size,0);
 hooks.createItem(item,{},"gm");await syncActorStatuses(actor);assert.equal(actor.effects.size,1);
});

test("damage card imports a native source once and uses its own effect",async()=>{
 const actor=setup();const {applyCombatStatus}=await import("../dist/scripts/status-sync.js");
 await Promise.all([applyCombatStatus(actor,leg.id),applyCombatStatus(actor,leg.id)]);
 assert.equal(actor.items.size,1);assert.equal(actor.effects.size,0);
});
test("passive sync preserves a disabled drug and a legacy standalone marker without changing either",async()=>{
 const actor=setup();const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Stim",type:"drug",effects:[{name:"Stim",disabled:true}]}]);
 await marker(actor,stim);await syncActorStatuses(actor,[],true);assert.equal(actor.effects.size,1);assert.ok([...item.effects][0].disabled);
});

test('passive sync coalesces but explicit remove/add operations retain order',async()=>{
 const actor=setup();await actor.createEmbeddedDocuments('Item',[{name:'Broken Leg',type:'criticalInjury',effects:[]}]);
 const a=syncActorStatuses(actor),b=syncActorStatuses(actor);assert.equal(a,b);await a;
 await Promise.all([syncActorStatuses(actor,[leg.id],false,false),syncActorStatuses(actor,[leg.id],false,true)]);
 assert.equal(actor.items.size,1);assert.equal(actor.effects.size,1);
});
test('unrelated effects and cosmetic item updates skip reconciliation',async()=>{
 const actor=setup();let scans=0;const iterator=actor.items[Symbol.iterator].bind(actor.items);actor.items[Symbol.iterator]=()=>{scans++;return iterator();};
 const hooks={};globalThis.Hooks={on:(h,f)=>(hooks[h]??=[]).push(f),once:()=>{}};registerStatusSync();
 const item=new Item({type:'drug',name:'Stim'},actor),effect=new Effect({name:'Unrelated',statuses:['prone']},actor);
 hooks.updateItem[0](item,{img:'new.png'},{});hooks.updateActiveEffect[0](effect,{disabled:true},{});
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(scans,0);
});

test('pharmacy menu statuses enable native primary effects and retain stock on removal',async()=>{
 for(const name of ['Prime Time','Sixgun','Timewarp','Veritas']) {
  const actor=setup(),status=masterStatuses.find(s=>s.name===name);
  await syncActorStatuses(actor,[status.id],false,true);
  assert.equal(actor.items.size,1);const item=[...actor.items][0];
  assert.equal([...item.effects].filter(e=>!e.disabled).length,1);
  await syncActorStatuses(actor,[status.id],false,false);
  assert.equal(actor.items.size,1);assert.ok([...item.effects].every(e=>e.disabled));
 }
 for(const name of ['Berserker','Sedative']) {
  const actor=setup(),status=masterStatuses.find(s=>s.name===name);
  await marker(actor,status);await syncActorStatuses(actor);
  assert.equal(actor.items.size,0);assert.equal(actor.effects.size,1);
 }
});

test('each new street-drug addiction toggles its native effect and retains drug stock',async()=>{
 for(const name of ['Berserker','Prime Time','Sixgun','Timewarp']) {
  const actor=setup(),status=masterStatuses.find(s=>s.name===name+' Addiction');
  const [item]=await actor.createEmbeddedDocuments('Item',[{name,type:'drug',effects:[{name:name+' Addiction',disabled:true}]}]);
  await syncActorStatuses(actor,[status.id],false,true);
  assert.equal(actor.items.size,1);assert.equal([...item.effects][0].disabled,false);
  await syncActorStatuses(actor,[status.id],false,false);
  assert.equal(actor.items.size,1);assert.equal([...item.effects][0].disabled,true);
 }
});

test('street-drug primaries and addictions are separate without adding excluded drugs',()=>{
 const names=['Black Lace','Blue Glass','Boost','Smash','Synthcoke','Berserker','Prime Time','Sixgun','Timewarp'];
 assert.deepEqual(masterStatuses.filter(s=>s.group==='drugs').map(s=>s.name).sort(),[...names].sort());
 assert.deepEqual(masterStatuses.filter(s=>s.group==='addiction').map(s=>s.name).sort(),names.map(name=>name+' Addiction').sort());
 for(const name of ['Emerald City','Mortalis','Red Lace','Piranha Smash'])assert.ok(!masterStatuses.some(s=>s.name===name));
 for(const status of masterStatuses.filter(s=>s.group==='addiction'&&s.name!=='Blue Glass Addiction'))assert.equal(status.binding?.kind,'effect');
});

test("Synthcoke sheet and token toggles use the same native primary and preserve its duration and stock",async()=>{
 const actor=setup(),id=masterStatuses.find(s=>s.name==="Synthcoke").id;
 const duration={seconds:14400,startTime:123},changes=[{key:"system.stats.ref.value",value:"1"}];
 const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Synthcoke",type:"drug",system:{amount:3,consumed:"Synthcoke Addicted Primary"},effects:[
  {name:"Synthcoke Primary",disabled:true},{name:"Synthcoke Addicted Primary",disabled:false,duration,changes},{name:"Synthcoke Addiction",disabled:true}
 ]}]);
 const [regular,primary,addiction]=item.effects;
 const {boundStatusActive}=await import("../dist/scripts/status-sync.js");
 await syncActorStatuses(actor);assert.ok(primary.statuses.has(id));assert.equal(boundStatusActive(actor,id),true);
 await item.updateEmbeddedDocuments("ActiveEffect",[{_id:primary.id,disabled:true}]);await syncActorStatuses(actor);
 assert.equal(boundStatusActive(actor,id),false);
 await syncActorStatuses(actor,[id],false,true);assert.equal(primary.disabled,false);
 await syncActorStatuses(actor,[id],false,false);assert.equal(primary.disabled,true);
 assert.deepEqual(primary.duration,duration);assert.deepEqual(primary.changes,changes);assert.equal(item.system.amount,3);
 assert.ok(regular.disabled && addiction.disabled);assert.equal(actor.effects.size,0);
});
