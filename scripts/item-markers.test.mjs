import assert from "node:assert/strict";
import { test } from "node:test";
import { getItemMarkers, setItemMarker, clearItemMarker } from "../dist/scripts/item-markers.js";
globalThis.foundry={utils:{getProperty:(obj,path)=>path.split(".").reduce((v,k)=>v?.[k],obj)}};
function item(){
 return {isOwner:true,name:"Knife",flags:{},writes:0,async update(changes){
 this.writes++;for(const [path,value] of Object.entries(changes)){
 const keys=path.split(".");let node=this;for(const k of keys.slice(0,-1)) node=node[k]??={};
 const key=keys.at(-1);if(key.startsWith("-="))delete node[key.slice(2)];else node[key]=structuredClone(value);
 }}};
}
test("markers persist without changing name or mechanics; separate keys survive",async()=>{
 const doc=item();
 await setItemMarker(doc,"used",{label:"Used"});
 await setItemMarker(doc,"disabled",{label:"Disabled",description:"EMP"});
 await setItemMarker(doc,"used",{label:"Used"});
 assert.equal(doc.writes,2);assert.equal(doc.name,"Knife");assert.equal(doc.system,undefined);
 assert.deepEqual(Object.keys(getItemMarkers(doc)),["used","disabled"]);
 await clearItemMarker(doc,"used");assert.deepEqual(Object.keys(getItemMarkers(doc)),["disabled"]);
});
test("validate keys, labels, ownership, and clear description when replaced",async()=>{
 const doc=item();
 for(const key of ["a.b","__proto__","constructor"])await assert.rejects(setItemMarker(doc,key,{label:"Used"}));
 await assert.rejects(setItemMarker(doc,"used",{label:" "}));
 await setItemMarker(doc,"used",{label:"Used",description:"Old"});
 await setItemMarker(doc,"used",{label:"Used"});assert.equal(getItemMarkers(doc).used.description,"");
 doc.isOwner=false;await assert.rejects(setItemMarker(doc,"used",{label:"Used"}),/owner/);
 await assert.rejects(clearItemMarker(doc,"used"),/owner/);
});
