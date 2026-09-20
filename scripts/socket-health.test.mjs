import assert from "node:assert/strict";
import { test } from "node:test";
import { requireCombatSocket, registerSocketHealth } from "../dist/scripts/socket-health.js";
test("stale loaded metadata rejects messaging even if files have been updated", () => {
 globalThis.game={modules:new Map([["pneuma-combattools",{socket:false,version:"0.1.1"}]]),socket:{connected:true}};
 assert.throws(requireCombatSocket,/Restart the Foundry server/);
});
test("current server registration permits transport and disconnects fail immediately", () => {
 globalThis.game={modules:new Map([["pneuma-combattools",{socket:true}]]),socket:{connected:true}};
 assert.doesNotThrow(requireCombatSocket);
 game.socket.connected=false;assert.throws(requireCombatSocket,/Reconnect/);
});
test("startup surfaces stale package metadata to the user", () => {
 globalThis.game={modules:new Map([["pneuma-combattools",{socket:false}]]),socket:{connected:true}};
 let ready;globalThis.Hooks={once:(name,fn)=>{assert.equal(name,"ready");ready=fn;}};
 const errors=[];globalThis.ui={notifications:{error:(...args)=>errors.push(args)}};
 registerSocketHealth();ready();assert.equal(errors.length,1);assert.equal(errors[0][1].permanent,true);
});
