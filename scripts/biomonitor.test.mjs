import assert from "node:assert/strict";
import {vitalState,indicatorState,signalExposure,resetMonitor} from "../dist/scripts/biomonitor.js";
for(const [hp,max,state] of [[40,40,"normal"],[39,40,"wounded"],[20,40,"wounded"],[19,40,"serious"],[10,40,"serious"],[9,40,"critical"],[0,40,"flatline"],[-2,40,"flatline"]]) assert.equal(vitalState(hp,max),state);
const realNow=Date.now;
let now=1000;Date.now=()=>now;
try {
 resetMonitor();
 const poison=names=>indicatorState("actor",names,2).find(l=>l.id==="poison");
 assert.equal(poison(["Poison"]).flashing,false); // Existing status on initial view.
 poison([]);
 assert.equal(poison(["Poison"]).flashing,true);
 now+=1000; assert.equal(poison(["Poison"]).flashing,true);
 now+=1100; assert.equal(poison(["Poison"]).flashing,false);
 assert.equal(poison(["Poison"]).on,true);
 assert.equal(poison([]).on,false);
 signalExposure("actor","poison",2);
 assert.equal(poison([]).flashing,true);
 assert.equal(indicatorState("other",[],2).some(l=>l.on),false);
 now+=2100; assert.equal(poison([]).on,false);
 resetMonitor();
 const visible=names=>indicatorState("slots",names,0).filter(l=>l.on).map(l=>l.id);
 assert.deepEqual(visible([]),[]);
 assert.deepEqual(visible(["On fire"]),["fire"]);
 assert.deepEqual(visible(["Poison","On fire"]),["fire","poison"]);
 assert.deepEqual(visible(["Poison"]),["poison"]);
 assert.deepEqual(visible(["On fire","Poison"]),["poison","fire"]);
 console.log("Biomonitor thresholds, transitions, expiration and actor isolation passed.");
} finally {Date.now=realNow;resetMonitor();}
