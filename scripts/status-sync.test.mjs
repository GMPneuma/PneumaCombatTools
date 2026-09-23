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
 constructor(data,parent){Object.assign(this,data);this.id=data._id??"i"+(++serial);this.parent=parent;this.effects=new Collection((data.effects??[]).map(e=>{const doc=new Effect(e,this);return [doc.id,doc];}));}
 async updateEmbeddedDocuments(_type,rows){for(const row of rows)Object.assign(this.effects.get(row._id),row);}
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
const marker=(actor,status,disabled=false)=>actor.createEmbeddedDocuments("ActiveEffect",[{name:status.name,statuses:[status.id],disabled,changes:[]}]);
function setup(){
 globalThis.game={user:{id:"gm",isGM:true},users:{filter:fn=>[{id:"gm",isGM:true,active:true},{id:"owner",active:true}].filter(fn)},settings:{get:()=>null,storage:{get:()=>new Map()}},
 packs:{get:pack=>({getDocument:async id=>{
   const status=masterStatuses.find(s=>s.binding?.pack===pack&&s.binding.itemId===id);
   return {type:status.binding.kind==="injury"?"criticalInjury":"drug",toObject:()=>({_id:id,name:status.binding.itemName,type:status.binding.kind==="injury"?"criticalInjury":"drug",system:{},effects:status.binding.kind==="effect"?status.binding.effectNames.map(name=>({name,disabled:true,changes:[{key:"native",value:1}]})):[{name:"Native MOVE penalty",changes:[{key:"system.stats.move.value",value:-4}]}]})};
 }})}};
 globalThis.ui={notifications:{error:message=>{throw Error(message);}}};
 return new Actor();
}
test("catalog has 64 legacy statuses plus Dead, with 22 native injury bindings",()=>{
 assert.equal(masterStatuses.length,65);assert.equal(masterStatuses.filter(s=>s.binding?.kind==="injury").length,22);
 assert.equal(new Set(masterStatuses.map(s=>s.id)).size,65);
 setup();assert.equal(configuredStatuses().filter(s=>s.name==="In Jail").length,1);
});
test("existing native injury produces a marker with no duplicate modifier",async()=>{
 const actor=setup();await actor.createEmbeddedDocuments("Item",[{name:"Broken Leg",type:"criticalInjury",effects:[{name:"native",changes:[{value:-4}]}]}]);
 await syncActorStatuses(actor);await syncActorStatuses(actor);
 assert.equal(actor.items.size,1);assert.equal(actor.effects.size,1);
 assert.deepEqual([...actor.effects][0].changes,[]);
});
test("status adds native injury once, even with concurrent sync requests",async()=>{
 const actor=setup();await marker(actor,leg);
 await Promise.all([syncActorStatuses(actor,[leg.id]),syncActorStatuses(actor,[leg.id])]);
 assert.equal(actor.items.size,1);assert.equal([...actor.items][0].name,"Broken Leg");
 assert.equal([...actor.items][0].effects.size,1);
});
test("removing or disabling injury status removes its native injury",async()=>{
 for(const disable of [false,true]){
  const actor=setup();await marker(actor,leg);await syncActorStatuses(actor,[leg.id]);
  if(disable)[...actor.effects][0].disabled=true;else actor.effects.clear();
  await syncActorStatuses(actor,[leg.id]);assert.equal(actor.items.size,0);assert.equal(actor.effects.size,0);
 }
});
test("deleting native injury removes only its corresponding status",async()=>{
 const actor=setup();await marker(actor,leg);await syncActorStatuses(actor,[leg.id]);await marker(actor,{id:"custom",name:"Custom"});
 actor.items.clear();await syncActorStatuses(actor);
 assert.deepEqual([...actor.effects][0].statuses,new Set(["custom"]));assert.equal(actor.effects.size,1);
});
test("failed native import rolls back orphan injury icon and retry succeeds",async()=>{
 const actor=setup();actor.failCreate=true;await marker(actor,leg);
 await assert.rejects(syncActorStatuses(actor,[leg.id]),/import failed/);assert.equal(actor.effects.size,0);
 actor.failCreate=false;await marker(actor,leg);await syncActorStatuses(actor,[leg.id]);assert.equal(actor.items.size,1);
});
test("failed injury removal restores the icon instead of hiding active mechanics",async()=>{
 const actor=setup();await marker(actor,leg);await syncActorStatuses(actor,[leg.id]);actor.effects.clear();actor.failDelete=true;
 await assert.rejects(syncActorStatuses(actor,[leg.id]),/delete failed/);assert.equal(actor.effects.size,1);assert.equal(actor.items.size,1);
});
test("drug status reuses disabled native effect and removal disables instead of deleting stock",async()=>{
 const actor=setup();await actor.createEmbeddedDocuments("Item",[{name:"Stim",type:"drug",effects:[{name:"Stim",disabled:true}]}]);
 await marker(actor,stim);await syncActorStatuses(actor,[stim.id]);
 assert.equal(actor.items.size,1);assert.equal([...([...actor.items][0].effects)][0].disabled,false);
 actor.effects.clear();await syncActorStatuses(actor,[stim.id]);
 assert.equal(actor.items.size,1);assert.equal([...([...actor.items][0].effects)][0].disabled,true);
});
test("sheet drug toggles reflect on token; source-less general statuses remain untouched",async()=>{
 const actor=setup();const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Stim",type:"drug",effects:[{name:"Stim",disabled:false}]}]);
 await syncActorStatuses(actor);assert.equal(actor.effects.size,1);
 [...item.effects][0].disabled=true;await syncActorStatuses(actor);assert.equal(actor.effects.size,0);
 await marker(actor,{id:"prone",name:"Prone"});await syncActorStatuses(actor);assert.equal(actor.effects.size,1);
});
test("startup adopts legacy injury statuses without duplicating existing injury",async()=>{
 const actor=setup();await marker(actor,leg);await syncActorStatuses(actor,[],true);await syncActorStatuses(actor,[],true);
 assert.equal(actor.items.size,1);assert.equal(actor.effects.size,1);
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

test("damage-card injury application awaits native source and preserves failure",async()=>{
 const {applyCombatStatus}=await import("../dist/scripts/status-sync.js");
 const actor=setup();actor.failCreate=true;
 await assert.rejects(applyCombatStatus(actor,leg.id),/import failed/);
 assert.equal(actor.effects.size,0);
 actor.failCreate=false;await applyCombatStatus(actor,leg.id);
 assert.equal(actor.items.size,1);assert.equal(actor.effects.size,1);
});
test("startup respects an existing disabled drug effect rather than a stale marker",async()=>{
 const actor=setup();await actor.createEmbeddedDocuments("Item",[{name:"Stim",type:"drug",effects:[{name:"Stim",disabled:true}]}]);
 await marker(actor,stim);await syncActorStatuses(actor,[],true);assert.equal(actor.effects.size,0);
});
test("editing a status ID removes the old injury binding",async()=>{
 const actor=setup();const hooks={};globalThis.Hooks={on:(name,fn)=>hooks[name]=fn,once:()=>{}};
 registerStatusSync();await marker(actor,leg);await syncActorStatuses(actor,[leg.id]);
 const effect=[...actor.effects][0];hooks.preUpdateActiveEffect(effect);
 effect.statuses=new Set(["custom"]);hooks.updateActiveEffect(effect,{statuses:["custom"]},{},"gm");
 await syncActorStatuses(actor);assert.equal(actor.items.size,0);assert.equal(actor.effects.size,1);
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
