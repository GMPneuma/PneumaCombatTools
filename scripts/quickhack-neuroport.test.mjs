import assert from "node:assert/strict";
import {test} from "node:test";
import {quickhackTargetVisible} from "../dist/scripts/quickhack/availability.js";

test("Neuroport menu filter requires installed base cyberware and can be disabled", () => {
  const port = {type:"cyberware",name:" Neuroport ",system:{isInstalledInActor:true}};
  assert.equal(quickhackTargetVisible([],false),true);
  assert.equal(quickhackTargetVisible([],true),false);
  assert.equal(quickhackTargetVisible([port],true),true);
  assert.equal(quickhackTargetVisible([{...port,system:{isInstalledInActor:false}}],true),false);
  assert.equal(quickhackTargetVisible([{...port,type:"gear"}],true),false);
  assert.equal(quickhackTargetVisible([{...port,name:"Neuroport Cyberdeck Port",system:{isInstalledInActor:true,type:"neuroport",isFoundational:false}}],true),false);
  assert.equal(quickhackTargetVisible([{...port,name:"Renamed port",system:{isInstalledInActor:true,type:"neuroport",isFoundational:true}}],true),true);
});

test("Neuroport option defaults off, persists both states and refreshes the HUD", async () => {
  globalThis.FormApplication = class {};
  globalThis.foundry = {data:{fields:{ObjectField:class {}}}};
  const definitions = new Map(), values = new Map();
  let Settings, refreshed = 0;
  globalThis.game = {user:{isGM:true},settings:{
    register(_scope,key,definition){definitions.set(key,definition);values.set(key,definition.default);},
    registerMenu(_scope,_key,definition){Settings=definition.type;},
    get(_scope,key){return values.get(key);},
    async set(_scope,key,value){values.set(key,value);definitions.get(key)?.onChange?.();}
  }};
  const {registerQuickhackSettings} = await import("../dist/scripts/quickhack/settings.js");
  registerQuickhackSettings(() => refreshed++);
  const form = new Settings();
  assert.equal(form.getData().requireNeuroport,false);
  assert.equal(definitions.get("quickhackRequireNeuroport").scope,"world");
  await form._updateObject({}, {requireNeuroport:true});
  assert.equal(form.getData().requireNeuroport,true);
  await form._updateObject({}, {requireNeuroport:false});
  assert.equal(form.getData().requireNeuroport,false);
  assert.equal(refreshed,2);
});
