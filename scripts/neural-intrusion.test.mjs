import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
const timers=new Map(); let id=0, owner=true, connection=true, cleared=0, ejected=0, eligible="actor", hidden=false;
const nodes=[]; const listeners={}; const motion={matches:false,addEventListener:(k,f)=>listeners.motion=f};
const context=vm.createContext({
 window:{matchMedia:()=>motion},document:{get hidden(){return hidden;},addEventListener:(k,f)=>listeners[k]=f,
 createElement:()=>({style:{},children:[],setAttribute(){},append(child){this.children.push(child);},remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1);}}),body:{append:n=>nodes.push(n)}},
 setTimeout:(f,delay)=>{timers.set(++id,{f,delay});return id;},clearTimeout:i=>timers.delete(i),Math,
 forceOutEntries:()=>connection?[{messageId:"hack",name:"Unknown Netrunner"}]:[],
 clearInstantCondition:async()=>cleared++,beginForceOut:async()=>ejected++,
 game:{messages:{get:()=>({id:"hack"})}},ui:{notifications:{error:e=>{throw e;}}},
 ContextMenu:class{constructor(container,selector,items){context.menu=items;}},$:x=>x
});
vm.runInContext((await readFile("dist/scripts/neural-intrusion.js","utf8")).replace(/^import .*;\s*/gm,"").replace(/export /g,"")+"\nglobalThis.api={extinguishStatus,ejectStatus,bindStatusActions};",context);
const actor={get isOwner(){return owner;}};
await context.api.extinguishStatus(actor);assert.equal(cleared,1);
await context.api.ejectStatus(actor,"hack");assert.equal(ejected,1);
connection=false;await context.api.ejectStatus(actor,"hack");assert.equal(ejected,1,"Stale connection cannot be ejected");
owner=false;await context.api.extinguishStatus(actor);assert.equal(cleared,1,"Ownership checked at action time");
owner=true;connection=true;
const monitor=await import("../dist/scripts/biomonitor.js");
monitor.indicatorState("actor",[],8);assert.equal(monitor.indicatorState("actor",["Neural Intrusion"],8).find(x=>x.id==="intrusion").on,true);
assert.equal(monitor.indicatorState("actor",[],8).find(x=>x.id==="intrusion").on,false,"Intrusion clears immediately, even during arrival flash");
console.log("Neural Intrusion status actions and lifetime passed");
