import { test } from "node:test";
import assert from "node:assert/strict";
import {registerHUDMessages, postHUDMessage, listHUDMessages, dismissHUDMessage} from "../dist/scripts/hud-messages.js";
test("HUD delivery preserves legacy expiry, retains queued notices and routes flashes without a queued row", () => {
  const entry = {}; const flashes=[];
  globalThis.game={user:{id:"self",isGM:false},modules:{get:()=>entry}};
  globalThis.Hooks={once(){}};
  registerHUDMessages(()=>{},(notice,remove)=>flashes.push({notice,remove}));
  try {
    for(let n=0;n<5;n++) postHUDMessage({source:"test",id:"queued"+n,text:"Queue "+n,mode:"queued",duration:1});
    assert.equal(listHUDMessages().length,5);
    assert.ok(listHUDMessages().every(n=>n.expires===0));
    for(let n=0;n<4;n++) postHUDMessage({source:"test",id:"timed"+n,text:"Timed"});
    assert.equal(listHUDMessages().filter(n=>n.mode==="queued").length,5);
    assert.equal(listHUDMessages().filter(n=>!n.mode).length,3);
    assert.ok(listHUDMessages().filter(n=>!n.mode).every(n=>n.expires>Date.now()));
    postHUDMessage({source:"test",id:"flash",text:"Flash",mode:"flash"});
    assert.equal(listHUDMessages().some(n=>n.id==="flash"),false);
    assert.equal(flashes.at(-1).notice.text,"Flash");
    assert.equal(flashes.at(-1).remove,undefined);
    dismissHUDMessage("test","flash");assert.equal(flashes.at(-1).remove,true);
    assert.equal(entry.api.hud.version,2);
    assert.throws(()=>postHUDMessage({source:"test",id:"bad",text:"x",mode:"bad"}),/mode/);
  } finally { for(const n of listHUDMessages()) dismissHUDMessage(n.source,n.id); }
});
