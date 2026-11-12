import assert from 'node:assert/strict';
import {test} from 'node:test';
globalThis.FormApplication=class{};globalThis.foundry={data:{fields:{ObjectField:class{}}}};
const {registerQuickhackSettings}=await import('../dist/scripts/quickhack/settings.js');
test('QuickHack Configure includes and saves rules mode alongside routing, while main settings keep only enable',async()=>{
 const settings=new Map(),values=new Map(),menus=new Map(),writes=[];
 globalThis.game={user:{isGM:true},settings:{register:(_m,k,c)=>{settings.set(k,c);values.set(k,c.default)},registerMenu:(_m,k,c)=>menus.set(k,c),get:(_m,k)=>values.get(k),set:async(_m,k,v)=>{values.set(k,v);writes.push(k)}}};
 registerQuickhackSettings(()=>{});assert.equal(settings.get('quickhackMode').config,false);assert.equal(settings.get('quickhackEnabled').config,true);
 const form=new (menus.get('quickhackMessages').type)();assert.equal(form.getData().mode,'raw');
 const data=Object.fromEntries(form.getData().groups.flatMap(g=>g.rows.map(r=>[r.key,r.value])));await form._updateObject({}, {...data,mode:'loaded'});
 assert.equal(values.get('quickhackMode'),'loaded');assert.deepEqual(writes,['quickhackRequireNeuroport','quickhackMode','quickhackRouting']);
 game.user.isGM=false;await form._updateObject({}, {...data,mode:'raw'});assert.equal(values.get('quickhackMode'),'loaded');
});


test("custom quickhack editor accepts a named Program and respects loaded-deck mode",async()=>{
  const {availableQuickhacks}=await import('../dist/scripts/quickhack/availability.js');
  const values=new Map(),menus=new Map();
  globalThis.game={user:{isGM:true},settings:{register:(_m,k,c)=>values.set(k,c.default),registerMenu:(_m,k,c)=>menus.set(k,c),get:(_m,k)=>values.get(k),set:async(_m,k,v)=>values.set(k,v)}};
  foundry.utils={randomID:()=>"1234"};registerQuickhackSettings(()=>{});
  const form=new (menus.get("customQuickhackMenu").type)();
  assert.equal(menus.get("customQuickhackMenu").restricted,true);
  await form._updateObject({},{"hackName-custom-1234":"Cold Boot","hackDV-custom-1234":"9","hackIcon-custom-1234":"icons/cold-boot.webp","hackDescription-custom-1234":"Restart the display."});
  const program={id:"p",type:"program",name:" cold boot ",system:{}};
  assert.equal(availableQuickhacks([program],"owned")[0].description,"Restart the display.");
  assert.equal(availableQuickhacks([program],"loaded").length,0);
  const deck={id:"d",type:"cyberdeck",system:{equipped:"equipped",installedItems:{list:["p"]}}};
  assert.equal(availableQuickhacks([program,deck],"loaded")[0].dv,9);
  assert.equal(availableQuickhacks([{...program,type:"gear"}],"owned").length,0);
  assert.equal(availableQuickhacks([],"raw").find(h=>h.name==="Cold Boot")?.dv,9);
  const duplicate={...program,flags:{"pneuma-combattools":{quickhackId:"sonic-shock"}}};
  assert.equal(availableQuickhacks([duplicate],"owned")[0].id,"custom-1234");
  assert.equal(availableQuickhacks([],"raw").find(h=>h.id==="custom-1234").img,"icons/cold-boot.webp");
  assert.equal(form.getData().hacks[0].id,"custom-1234");
  await form._updateObject({},{});
  assert.deepEqual(form.getData().hacks,[]);
  assert.equal(availableQuickhacks([],"raw").some(h=>h.id==="custom-1234"),false);
  assert.deepEqual(availableQuickhacks([program],"owned"),[]);
});
