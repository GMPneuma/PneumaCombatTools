import assert from "node:assert/strict";
let frames = [];
globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
globalThis.foundry = { utils: { getProperty: (object, path) => path.split(".").reduce((value, key) => value?.[key], object) } };
globalThis.game = { user: { id: "viewer", isGM: false } };
const { PendingCardRefresh } = await import("../dist/scripts/pending-card-refresh.js");
const changed = [];
const tracker = new PendingCardRefresh(message => changed.push(message.id));
const card = (id, actor, combat, state = "waiting") => ({ id, visible: true, flags: { "pneuma-combattools": { exchange: { defenderActor: actor, combatId: combat, state } } } });
const a = card("a", "Actor.a", "combat1"), b = card("b", "Actor.b", "combat1"), c = card("c", "Actor.a", "combat2");
[a,b,c,card("done","Actor.a","combat1","resolved")].forEach(message => tracker.remember(message));
const flush = () => { const callbacks=frames;frames=[];callbacks.forEach(callback=>callback()); };
tracker.refresh("Actor.other");assert.equal(frames.length,0);
tracker.refresh("Actor.a");tracker.refresh("Actor.a");assert.equal(frames.length,1);
flush();assert.deepEqual(changed.splice(0),["a","c"]);
tracker.refresh(undefined,"combat1");flush();assert.deepEqual(changed.splice(0),["a","b"]);
tracker.refresh();
a.flags["pneuma-combattools"].exchange.state="resolved";tracker.remember(a);tracker.forget("c");
flush();assert.deepEqual(changed.splice(0),["b"]);
b.blind=true;tracker.refresh();flush();assert.deepEqual(changed,[]);
console.log("Pending-card index: actor/combat filtering, batching, resolution/deletion and privacy passed.");

// Verify actual registration routes document events without rescanning chat history.
globalThis.FormApplication=class{};
const hooks={};
globalThis.Hooks={on:(name,fn)=>(hooks[name]??=[]).push(fn),once:(name,fn)=>(hooks[name]??=[]).push(fn)};
globalThis.document={querySelectorAll:()=>[]};
globalThis.CSS={escape:value=>value};
globalThis.cancelAnimationFrame=()=>{};
const cards=[card("one","Actor.one","first"),card("two","Actor.two","second")];
let scans=0;
game.users={filter:()=>[]};
game.settings={register:()=>{}};
game.messages={get:id=>cards.find(card=>card.id===id),[Symbol.iterator]:()=>{scans++;return cards[Symbol.iterator]();}};
game.socket={on:()=>{}};
globalThis.ui={chat:{updateMessage:message=>changed.push(message.id)}};
const {registerCombatResolution}=await import("../dist/scripts/combat-resolution.js");
registerCombatResolution();
hooks.ready.forEach(fn=>fn());assert.equal(scans,1);
hooks.updateActor.forEach(fn=>fn({uuid:"Actor.one"}));
hooks.updateItem.forEach(fn=>fn({parent:{uuid:"Actor.one"}}));
flush();assert.deepEqual(changed.splice(0),["one"]);assert.equal(scans,1);
hooks.updateActor.forEach(fn=>fn({uuid:"Actor.unrelated"}));flush();assert.deepEqual(changed,[]);
hooks.updateCombat.forEach(fn=>fn({id:"second"},{round:2}));flush();assert.deepEqual(changed.splice(0),["two"]);
cards[0].flags["pneuma-combattools"].exchange.state="resolved";
hooks.updateChatMessage.forEach(fn=>fn(cards[0]));flush();
hooks.updateActor.forEach(fn=>fn({uuid:"Actor.one"}));flush();assert.deepEqual(changed,[]);
console.log("Pending-card hooks: one startup scan only, relevant actor/item/combat refresh, resolved-card cleanup passed.");

// Multiple defenders share one AoE card; removing a completed row stops its refreshes.
const areaChanges=[];
const areas=new PendingCardRefresh(message=>areaChanges.push(message.id),message=>{
 const data=message.area;
 if(data?.phase!=='responses')return;
 const actors=data.rows.filter(row=>['waiting','rolling'].includes(row.state)).map(row=>row.actor);
 return actors.length?{actors}:undefined;
});
const area={id:'area',visible:true,area:{phase:'responses',rows:[{actor:'a',state:'waiting'},{actor:'b',state:'rolling'}]}};
areas.remember(area);areas.refresh('a');areas.refresh('b');flush();assert.deepEqual(areaChanges.splice(0),['area']);
area.area.rows[0].state='hit';areas.remember(area);areas.refresh('a');flush();assert.deepEqual(areaChanges,[]);
areas.refresh('b');area.area.phase='resolved';areas.remember(area);flush();assert.deepEqual(areaChanges,[]);
area.area.phase='responses';areas.remember(area);areas.refresh('b');areas.forget('area');flush();assert.deepEqual(areaChanges,[]);
console.log('Multi-defender pending cards: one refresh per frame, completed rows, resolution and deletion passed.');

// Condition-dependent controls follow effect/item and combat changes, without rescanning messages.
{
 const {registerConditionCardRefresh}=await import('../dist/scripts/pending-card-refresh.js');
 const hooks={};globalThis.Hooks={on:(name,fn)=>(hooks[name]??=[]).push(fn),once:(name,fn)=>(hooks[name]??=[]).push(fn)};
 globalThis.Actor=class{constructor(uuid){this.uuid=uuid;}};
 const actor=new Actor('Actor.condition'),message={id:'condition',visible:true,scope:{actors:[actor.uuid],combat:'c'}};
 const updated=[];globalThis.game={messages:[message],user:{isGM:true}};globalThis.ui={chat:{updateMessage:m=>updated.push(m.id)}};
 registerConditionCardRefresh(m=>m.scope);hooks.ready[0]();
 hooks.deleteActiveEffect[0]({parent:actor});hooks.updateItem[0]({parent:actor});flush();assert.deepEqual(updated.splice(0),['condition']);
 hooks.updateCombat[0]({id:'other'});flush();assert.deepEqual(updated,[]);
 hooks.updateCombat[0]({id:'c'});flush();assert.deepEqual(updated.splice(0),['condition']);
 hooks.deleteChatMessage[0](message);hooks.updateActor[0](actor);flush();assert.deepEqual(updated,[]);
}
