globalThis.Hooks ??= {once(){},on(){}};
import assert from "node:assert/strict";
import { test } from "node:test";
globalThis.FormApplication = class {};
const { availableQuickhacks, MODULE, LEGACY_MODULE } = await import("../dist/scripts/quickhack/availability.js");
const { QUICKHACKS } = await import("../dist/scripts/quickhack/catalog.js");
const { initializeQuickhackContent } = await import("../dist/scripts/quickhack/content.js");
const { connectionFor, activeConnection, establishConnection, ejectConnection, resultConnectionValid, jackOut, registerConnections } = await import("../dist/scripts/quickhack/connections.js");
const { postResult } = await import("../dist/scripts/quickhack/messages.js");
const { hasQuickhackSight } = await import("../dist/scripts/quickhack/sight.js");
const { executeQuickhack, actorQuickhacks } = await import("../dist/scripts/quickhack/workflow.js");
const { beginForceOut, forceOutEntries } = await import("../dist/scripts/quickhack/force-out.js");
const { normalizeRoutingConfig, resolveJackInRouting, resolveQuickhackRouting } = await import("../dist/scripts/quickhack/routing-config.js");
const { isQuickhackSuccessful, isNetrunnerEjected, isTargetAware } = await import("../dist/scripts/quickhack/rules.js");

const get = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj);
function put(obj,path,value) { const parts=path.split('.'); const last=parts.pop(); for(const key of parts) obj=obj[key]??={}; obj[last]=value; }
const collection = rows => Object.assign(rows,{get(id){return this.find(row=>row.id===id);}});
const hack = (id="h",extra={}) => ({id,uuid:`Item.${id}`,type:"gear",name:"Renamed",system:{},flags:{[LEGACY_MODULE]:{quickhackId:"overheat"}},...extra});
function contentDocuments() {
 let serial=0;
 globalThis.Folder={create:async data=>{
   const folder={...data,id:`folder${++serial}`,folder:game.folders.get(data.folder)};
   game.folders.push(folder);return folder;
 }};
 globalThis.Item={create:async data=>{
   const item={...structuredClone(data),id:`item${++serial}`,effects:[],folder:game.folders.get(data.folder),
     toObject(){return {...structuredClone({...this,folder:undefined,update:undefined,toObject:undefined}),folder:this.folder?.id};},
     async update(changes){for(const [key,value] of Object.entries(changes)) {
       if(key==="folder")this.folder=game.folders.get(value);else put(this,key,value);
     }} };
   item.uuid=`Item.${item.id}`;game.items.push(item);return item;
 }};
}
test("fresh initialization creates eleven programs and launcher in the requested folder tree, idempotently",async()=>{
 fixture();contentDocuments();await initializeQuickhackContent();
 const root=game.folders.find(f=>f.name==="CombatTools");
 const child=game.folders.find(f=>f.name==="Quickhacks");
 assert.equal(child.folder,root);
 const programs=game.items.filter(i=>i.type==="program");assert.equal(programs.length,11);
 for(const item of programs){assert.equal(item.folder,child);assert.equal(item.system.class,"booster");assert.equal(item.system.size,1);}
 assert.equal(game.items.find(i=>i.type==="weapon").folder,root);
 await initializeQuickhackContent();assert.equal(game.items.length,12);assert.equal(game.folders.length,2);
});

function fixture({combat=true,mode="raw"}={}) {
 let serial=0;
 const docs=new Map(); const cards=[]; const notices=[];
 globalThis.CONFIG={Canvas:{polygonBackends:{sight:{testCollision:()=>false}}}};
 const state={enabled:true,mode,rolls:0,total:1,onDialog:()=>{},writes:0,routing:{}};
 globalThis.foundry={utils:{getProperty:get,randomID:()=>String(++serial),mergeObject:(a,b)=>({...a,...b})}};
 globalThis.ui={notifications:{warn:t=>notices.push(t),error:t=>notices.push(t),info:t=>notices.push(t)}};
 const gm={id:"gm",isGM:true,active:true};
 globalThis.game={system:{id:"cyberpunk-red-core"},user:gm,users:collection([gm]),modules:new Map(),time:{worldTime:0},
 settings:{get:(_scope,key)=>key==="quickhackEnabled"?state.enabled:key==="quickhackMode"?state.mode:key==="quickhackRouting"?state.routing:false},
 i18n:{format:(key,data)=>key+JSON.stringify(data??{}),localize:key=>key},messages:collection(cards),items:collection([]),actors:collection([]),scenes:[],folders:collection([])};
 globalThis.fromUuid=async uuid=>docs.get(uuid)??null;
 globalThis.renderTemplate=async()=>'<div class="rollcard"><div class="rollcard-top">native</div></div>';
 globalThis.Roll=class {async evaluate(){this.total=5;return this;}};
 globalThis.ChatMessage={getSpeaker:()=>({}),getWhisperRecipients:()=>[gm],create:async data=>{
   const message={...data,id:`message${++serial}`,timestamp:serial,author:gm,async update(changes){for(const [key,value] of Object.entries(changes))put(this,key,value);}};
   cards.push(message);return message;
 }};
 const role={id:"role",type:"role",name:"Netrunner",system:{rank:4},createRoll(){return {rollTitle:"",rollCard:"native",resultTotal:state.total,async handleRollDialog(){await state.onDialog();return true;},async roll(){state.rolls++;},wasCritical:()=>false};},async confirmRoll(roll){return roll;}};
 const source={id:"source",uuid:"Actor.source",name:"Source",hasPlayerOwner:true,items:collection([role]),flags:{},testUserPermission:()=>true};
 const target={id:"target",uuid:"Actor.target",name:"Target",hasPlayerOwner:true,items:collection([]),system:{stats:{will:{value:5}}},flags:{},testUserPermission:()=>true};
 const token=(id,actor)=>({id,name:id,actor,isVisible:true,w:100,h:100,center:{x:0,y:0},document:{id,parent:{id:"scene"},uuid:`Scene.scene.Token.${id}`}});
 const a=token("a",source),b=token("b",target);
 docs.set(source.uuid,source);docs.set(target.uuid,target);docs.set(a.document.uuid,{...a.document,actor:source});docs.set(b.document.uuid,{...b.document,actor:target});
 const encounter={id:"combat",uuid:"Combat.combat",scene:{id:"scene"},active:true,combatants:[{token:a.document,actor:source},{token:b.document,actor:target}],started:true,flags:{},async update(changes){state.writes++;for(const [key,value] of Object.entries(changes))put(this,key,value);}};
 globalThis.canvas={tokens:Object.assign(new Map([[a.id,a],[b.id,b]]),{controlled:[a]}),scene:{id:"scene",grid:{distance:2}},grid:{measurePath:()=>({distance:20})}};
 game.combats=collection(combat?[encounter]:[]);game.combat=combat?encounter:undefined;game.actors.push(source,target);
 return {state,source,target,a,b,role,encounter,cards,notices,docs};
}

test("RAW needs no objects; buy mode recognizes stable flags but not names or injury items",()=>{
 assert.equal(availableQuickhacks([],"raw").length,11);
 assert.deepEqual(availableQuickhacks([hack()],"owned").map(h=>h.id),["overheat"]);
 assert.equal(availableQuickhacks([hack("x",{flags:{}}),hack("y",{type:"criticalInjury"})],"owned").length,0);
 assert.equal(availableQuickhacks([hack("x",{system:{amount:0}})],"owned").length,0);
});
test("loaded mode requires exact owned program ID inside an equipped deck; no REZ requirement",()=>{
 const program=hack("p",{type:"program",system:{isRezzed:false}});
 const deck={id:"d",type:"cyberdeck",system:{equipped:"equipped",installedItems:{list:["p"]}}};
 assert.equal(availableQuickhacks([program,deck],"loaded").length,1);
 for(const items of [[program],[hack("p"),deck],[program,{...deck,system:{...deck.system,equipped:"carried"}}],[program,{...deck,system:{...deck.system,installedItems:{list:["other"]}}}]]) assert.equal(availableQuickhacks(items,"loaded").length,0);
 for(const mode of ["raw","owned","loaded"]) assert.equal(availableQuickhacks([program,deck],mode,false).length,0);
});
test("ported RAW ties and all six GM routing fields retain prior behavior",()=>{
 assert.equal(isQuickhackSuccessful(8,8),false);assert.equal(isNetrunnerEjected(8,8),false);assert.equal(isTargetAware(8,8),true);
 const config=normalizeRoutingConfig({npcToPlayerJackInAudience:"public",npcToPlayerJackInShowTotals:true,npcToPlayerJackInRevealAttacker:true,npcToPlayerQuickhackAudience:"targetOwners",npcToPlayerQuickhackRevealAttacker:true,playerToNpcJackInAudience:"gm"});
 assert.equal(Object.keys(config).length,6);
 assert.deepEqual(resolveJackInRouting(config,{sourceIsPlayer:false,targetIsPlayer:true,targetAware:true}),{audience:"public",showTotals:true,revealAttacker:true,showAwareness:true});
 assert.equal(resolveJackInRouting(config,{sourceIsPlayer:false,targetIsPlayer:true,targetAware:false}).audience,"gm");
 assert.equal(resolveJackInRouting(config,{sourceIsPlayer:true,targetIsPlayer:false,targetAware:true}).audience,"gm");
 assert.equal(resolveQuickhackRouting(config,{sourceIsPlayer:false,targetIsPlayer:true}).audience,"targetOwners");
});
test("outside combat Jack-In creates native Interface and WILL-result cards without tracking",async()=>{
 const f=fixture({combat:false});await executeQuickhack(f.a,f.b,"jack-in");
 assert.equal(f.state.rolls,1);assert.equal(f.cards.length,1);assert.equal(f.state.writes,0);
 assert.equal(f.cards[0].flags[MODULE].quickhack.combatUuid,undefined);
 assert.match(f.cards[0].content,/will.*10/);assert.equal(connectionFor(f.source,f.target.uuid),undefined);
});
test("combat Jack-In persists on Combat; multiple targets and Netrunners remain independent",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");
 const c=connectionFor(f.source,f.target.uuid);assert.equal(c.state,"active");assert.equal(c.id,f.cards[0].id);
 assert.deepEqual(f.source.flags,{});assert.equal(f.state.writes,1);
 assert.equal(connectionFor(f.source,"Actor.other"),undefined);assert.equal(connectionFor({uuid:"Actor.other"},f.target.uuid),undefined);
 await executeQuickhack(f.a,f.b,"jack-in");assert.equal(f.state.rolls,1);
});
test("no connection rejects QuickHack, ejection persists across rounds/reloads and blocks re-Jack-In",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,0);
 await executeQuickhack(f.a,f.b,"jack-in");const c=connectionFor(f.source,f.target.uuid);
 assert.equal(await ejectConnection(f.source,f.target.uuid,c.id,c),true);
 game.combat.flags=JSON.parse(JSON.stringify(game.combat.flags));game.combat.round=50;game.time.worldTime=10000;
 await executeQuickhack(f.a,f.b,"jack-in");await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,1);
 assert.equal(connectionFor(f.source,f.target.uuid).state,"ejected");
 await assert.rejects(establishConnection(f.cards[0]),/Ejected/);
 f.encounter.started=false;game.combat={...f.encounter,id:"new",uuid:"Combat.new",started:true,flags:{}};game.combats.splice(0,game.combats.length,game.combat);assert.equal(connectionFor(f.source,f.target.uuid),undefined);
});
test("a stale result cannot eject a new encounter and old cards cannot regain a connection",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");const old=f.cards[0];
 f.encounter.started=false;game.combat={...f.encounter,id:"new",uuid:"Combat.new",started:true,flags:{}};game.combats.splice(0,game.combats.length,game.combat);
 await assert.rejects(establishConnection(old),/originating encounter/);
 await executeQuickhack(f.a,f.b,"jack-in");const current=connectionFor(f.source,f.target.uuid);
 await assert.rejects(ejectConnection(f.source,f.target.uuid,old.id,old.flags[MODULE].quickhack),/originating encounter/);
 assert.equal(activeConnection(f.source,f.target.uuid,current.id).id,current.id);
});
test("master off blocks HUD availability, direct execution, force-out and content initialization",async()=>{
 const f=fixture();f.state.enabled=false;
 await executeQuickhack(f.a,f.b,"jack-in");await executeQuickhack(f.a,f.b,"overheat");await beginForceOut({id:"missing"});await initializeQuickhackContent();
 assert.equal(f.state.rolls,0);assert.equal(f.cards.length,0);assert.equal(f.state.writes,0);
 assert.equal(availableQuickhacks([],"raw",f.state.enabled).length,0);
});
test("disabling while native roll dialog is open prevents roll, cards and connection writes",async()=>{
 const f=fixture();f.state.onDialog=()=>{f.state.enabled=false;};await executeQuickhack(f.a,f.b,"jack-in");
 assert.equal(f.state.rolls,0);assert.equal(f.cards.length,0);assert.equal(f.state.writes,0);
});
test("inventory removal/deck unloading during a dialog blocks each restricted mode",async()=>{
 for(const mode of ["owned","loaded"]){
  const f=fixture({mode});const program=hack("p",{type:"program"});
  f.source.items.push(program,{id:"deck",type:"cyberdeck",system:{equipped:"equipped",installedItems:{list:["p"]}}});
  await executeQuickhack(f.a,f.b,"jack-in");
  f.state.onDialog=()=>{f.source.items.splice(1);};await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,1);assert.equal(f.cards.length,1);
 }
});
test("RAW connected QuickHack works without items; forged IDs and invalid modes cannot roll",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,2);
 await executeQuickhack(f.a,f.b,"fake");assert.equal(f.state.rolls,2);
 f.state.mode="invalid";await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,2);
});
test("changing encounter or ejecting during a dialog blocks stale pending hacks",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");const c=connectionFor(f.source,f.target.uuid);
 f.state.onDialog=()=>ejectConnection(f.source,f.target.uuid,c.id,c);
 await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,1);
 assert.equal(resultConnectionValid(f.source,{combatUuid:f.encounter.uuid,targetActorUuid:f.target.uuid,connectionId:c.id}),false);
});


test("successful Force Out updates Combat and later clicks cannot repeat against the ejected connection",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");const result=f.cards[0];
 f.source.hasPlayerOwner=false;f.state.total=20;f.target.items.push({...f.role,type:"skill",name:"Concentration"});
 await beginForceOut(result);assert.equal(connectionFor(f.source,f.target.uuid).state,"ejected");
 const count=f.cards.length;await beginForceOut(result);assert.equal(f.cards.length,count);
});
test("outside-combat Force Out remains a chat contest and writes no tracking state",async()=>{
 const f=fixture({combat:false});await executeQuickhack(f.a,f.b,"jack-in");
 f.source.hasPlayerOwner=false;f.state.total=20;f.target.items.push({...f.role,type:"skill",name:"Concentration"});
 await beginForceOut(f.cards[0]);assert.equal(f.state.writes,0);assert.equal(f.cards.at(-1).flags[MODULE].quickhack.ejected,true);
});
test("ending/starting combat during untracked Jack-In cannot redirect it into another encounter",async()=>{
 const f=fixture({combat:false});f.state.onDialog=()=>{game.combat=f.encounter;game.combats.push(f.encounter);};await executeQuickhack(f.a,f.b,"jack-in");
 assert.equal(f.state.rolls,1);assert.equal(f.state.writes,0);assert.equal(f.cards[0].flags[MODULE].quickhack.combatId,null);
});


test("initialization leaves existing world, actor and legacy documents unchanged",async()=>{
 const f=fixture();contentDocuments();
 const old=await Folder.create({name:"Old folder",type:"Item"});
 const program=await Item.create({type:"program",name:"Custom name",folder:old.id,system:{class:"booster"},flags:{[MODULE]:{quickhackId:"overheat"}}});
 const gear=await Item.create({...hack(),folder:old.id});
 const launcher=await Item.create({type:"weapon",name:"Custom launcher",folder:old.id,flags:{[MODULE]:{action:"quickhack"}}});
 for(const item of [program,gear,launcher]) item.update=async()=>{throw Error("Existing item rewritten");};
 f.source.items.push({...hack(),update:async()=>{throw Error("Actor item rewritten");}});
 await initializeQuickhackContent();await initializeQuickhackContent();
 assert.equal(program.name,"Custom name");assert.equal(program.folder,old);assert.equal(gear.type,"gear");assert.equal(launcher.folder,old);
 const created=game.items.find(i=>i.flags?.[MODULE]?.quickhackId==="slow");assert.equal(created.name,"Quickhack: Slow");
});

test("nine target samples allow partial sight but reject a completely blocked target",()=>{
 const f=fixture();const points=[];
 CONFIG.Canvas.polygonBackends.sight.testCollision=(origin,point,options)=>{assert.deepEqual(origin,f.a.center);assert.deepEqual(options,{type:"sight",mode:"any"});points.push(point);return true;};
 assert.equal(hasQuickhackSight(f.a,f.b),false);assert.equal(points.length,9);assert.equal(new Set(points.map(p=>JSON.stringify(p))).size,9);
 CONFIG.Canvas.polygonBackends.sight.testCollision=(_origin,p)=>!(p.x===40&&p.y===40);
 assert.equal(hasQuickhackSight(f.a,f.b),true);
});
test("blocked sight prevents Jack-In and QuickHack without ejecting an existing connection",async()=>{
 const f=fixture();let blocked=true;CONFIG.Canvas.polygonBackends.sight.testCollision=()=>blocked;
 await executeQuickhack(f.a,f.b,"jack-in");assert.equal(f.state.rolls,0);
 blocked=false;await executeQuickhack(f.a,f.b,"jack-in");const connection=connectionFor(f.source,f.target.uuid);assert.ok(connection);
 blocked=true;await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,1);assert.deepEqual(connectionFor(f.source,f.target.uuid),connection);
 blocked=false;await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,2);
});
test("losing sight during either roll dialog cancels execution and preserves existing links",async()=>{
 for(const action of ["jack-in","overheat"]){const f=fixture();if(action!=="jack-in")await executeQuickhack(f.a,f.b,"jack-in");
 const before=f.state.rolls;f.state.onDialog=()=>{CONFIG.Canvas.polygonBackends.sight.testCollision=()=>true;};
 await executeQuickhack(f.a,f.b,action);assert.equal(f.state.rolls,before);if(action!=="jack-in")assert.equal(connectionFor(f.source,f.target.uuid).state,"active");}
});
test("outside combat Jack-In stays untracked and cannot authorize QuickHack",async()=>{
 const f=fixture({combat:false});await executeQuickhack(f.a,f.b,"jack-in");await executeQuickhack(f.a,f.b,"overheat");assert.equal(f.state.rolls,1);assert.equal(f.state.writes,0);
});

test("Jack-In publishes a single combined native roll and result with the connection on that card",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");assert.equal(f.cards.length,1);
 assert.match(f.cards[0].content,/pneuma-quickhack-roll/);assert.match(f.cards[0].content,/native/);assert.match(f.cards[0].content,/pneuma-quickhack-outcome/);
 assert.equal(connectionFor(f.source,f.target.uuid).id,f.cards[0].id);
});
test("QuickHack publishes one combined card after Jack-In",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");f.state.total=1;
 await executeQuickhack(f.a,f.b,"short-circuit");assert.equal(f.cards.length,2);
 const card=f.cards.at(-1);assert.match(card.content,/pneuma-quickhack-roll/);assert.match(card.content,/Short Circuit · DV8/);assert.equal(card.flags[MODULE].quickhack.type,"quickhack");
});
test("hidden NPC dice remain GM-only when result is shared; GM-only results combine",async()=>{
 const f=fixture();f.source.hasPlayerOwner=false;
 const result={type:"jackIn",sourceActorUuid:f.source.uuid,targetActorUuid:f.target.uuid,success:false,alerted:true,audience:"targetOwners",revealAttacker:false};
 await postResult(f.a,f.b,result,"Jack-In","Detected","",'<div>PRIVATE DICE</div>');
 assert.equal(f.cards.length,2);assert.equal(f.cards[0].blind,true);assert.deepEqual(f.cards[0].whisper,['gm']);
 assert.doesNotMatch(f.cards[1].content,/PRIVATE DICE/);
 f.cards.length=0;await postResult(f.a,f.b,{...result,audience:"gm",revealAttacker:true},"Jack-In","Detected","",'<div>PRIVATE DICE</div>');
 assert.equal(f.cards.length,1);assert.equal(f.cards[0].blind,true);assert.match(f.cards[0].content,/PRIVATE DICE/);
});

test("CTH eject menu needs awareness, current active connection and target ownership", async () => {
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");
 assert.equal(forceOutEntries(f.target).length,1);
 assert.equal(forceOutEntries(f.target)[0].label,"Eject NetRunner — Source");
 assert.equal(forceOutEntries(f.source).length,0);
 f.target.testUserPermission=()=>false;game.user.isGM=false;
 assert.equal(forceOutEntries(f.target).length,0);
 game.user.isGM=true;f.target.testUserPermission=()=>true;
 const result=connectionFor(f.source,f.target.uuid).awareness;result.alerted=false;
 assert.equal(forceOutEntries(f.target).length,0);
 result.alerted=true;f.state.enabled=false;assert.equal(forceOutEntries(f.target).length,0);
 f.state.enabled=true;await ejectConnection(f.source,f.target.uuid,f.cards[0].id,f.cards[0].flags[MODULE].quickhack);
 assert.equal(forceOutEntries(f.target).length,0);
});
test("CTH lists each detected runner once, masks identity and excludes other encounters", async () => {
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");
 const first=f.cards[0];const firstResult=first.flags[MODULE].quickhack;
 firstResult.revealAttacker=false;connectionFor(f.source,f.target.uuid).awareness.revealAttacker=false;
 f.cards.push({...first,id:"duplicate",flags:{[MODULE]:{quickhack:{...firstResult,type:"quickhack",connectionId:first.id}}}});
 const second={...first,id:"second",timestamp:99,flags:{[MODULE]:{quickhack:{...firstResult,sourceActorUuid:"Actor.other",connectionRecorded:false}}}};
 const other={...f.source,uuid:"Actor.other",name:"Secret"};
 f.docs.set(other.uuid,other);game.actors.push(other);f.cards.push(second);
 await establishConnection(second);
 const rows=forceOutEntries(f.target);assert.equal(rows.length,2);
 assert.equal(rows[0].messageId,first.id);
 assert.ok(rows.every(row=>!row.label.includes("Source")&&!row.label.includes("Secret")));
 game.combat={...f.encounter,uuid:"Combat.other",flags:{}};
 assert.equal(forceOutEntries(f.target).length,2);canvas.scene={id:"other",grid:{distance:2}};assert.equal(forceOutEntries(f.target).length,0);
});
test("CTH detects later noisy QuickHacks after undetected Jack-In and deduplicates them", async () => {
 const f=fixture();f.state.total=30;await executeQuickhack(f.a,f.b,"jack-in");
 assert.equal(forceOutEntries(f.target).length,0);
 f.state.total=1;await executeQuickhack(f.a,f.b,"overheat");
 assert.equal(forceOutEntries(f.target).length,1);
 await executeQuickhack(f.a,f.b,"overheat");
 assert.equal(forceOutEntries(f.target).length,1);
});

test("disabled loaded socket metadata blocks player Jack-In before roll and tracking",async()=>{
 const f=fixture();game.modules.set(MODULE,{socket:false});game.user={id:"player",isGM:false};
 await executeQuickhack(f.a,f.b,"jack-in");assert.equal(f.state.rolls,0);assert.equal(f.cards.length,0);
 assert.equal(f.state.writes,0);assert.match(f.notices[0],/Restart the Foundry server/);
});

test("Force Out combines both native rolls and outcome in one card with opposed styling",async()=>{
 for(const [concentration,resistance] of [[20,5],[5,20],[5,5]]){
  const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");
  f.target.items.push({...f.role,type:"skill",name:"Concentration"});
  f.state.total=concentration;f.state.onDialog=()=>{f.state.total=resistance;};
  const before=f.cards.length;await beginForceOut(f.cards[0]);
  assert.equal(f.cards.length,before+1);
  const card=f.cards.at(-1);const won=concentration>resistance;
  assert.equal(card.flags[MODULE].quickhack.ejected,won);
  assert.equal((card.content.match(/>native</g)??[]).length,2);
  assert.match(card.content,/pneuma-roll-winner/);assert.match(card.content,/pneuma-roll-loser/);
  assert.match(card.content,new RegExp('data-state="'+(won?"success":"failure")+'"'));
  assert.match(card.content,/Target → Source/);
  assert.equal(connectionFor(f.source,f.target.uuid).state,won?"ejected":"active");
 }
});
test("CTH and ejection card apply current NPC identity settings, including later QuickHack awareness",async()=>{
 for(const [jackName,hackName,hasHack] of [[true,false,false],[false,false,false],[false,true,true],[true,false,true],[false,true,false]]){
  const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");const origin=f.cards[0];
  f.source.hasPlayerOwner=false;f.source.name="Runner <One>";
  origin.flags[MODULE].quickhack.revealAttacker=false;
  f.state.routing={npcToPlayerJackInRevealAttacker:jackName,npcToPlayerQuickhackRevealAttacker:hackName};
  if(hasHack)f.cards.push({...origin,id:"awareness",flags:{[MODULE]:{quickhack:{...origin.flags[MODULE].quickhack,type:"quickhack",connectionId:origin.id}}}});
  if(hasHack)await establishConnection(f.cards.at(-1));
  const show=jackName||(hackName&&hasHack);
  const rows=forceOutEntries(f.target);assert.equal(rows.length,1);
  assert.equal(rows[0].name,show?"Runner <One>":"PNEUMA_COMBAT_TOOLS.Quickhack.Result.UnknownNetrunner{}");
  assert.ok(rows[0].label.includes(rows[0].name));
  f.target.items.push({...f.role,type:"skill",name:"Concentration"});f.state.total=20;
  const before=f.cards.length;await beginForceOut(game.messages.get(rows[0].messageId));
  assert.equal(f.cards.length,before+1);
  const card=f.cards.at(-1);
  if(show)assert.match(card.content,/Runner &lt;One&gt;/);
  else {assert.doesNotMatch(card.content,/Runner/);assert.match(card.content,/UnknownNetrunner/);}
  assert.equal((card.content.match(/>native</g)??[]).length,1);
 }
});
test("cancelled native resistance publishes no partial ejection card or tracking change",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");
 f.target.items.push({...f.role,type:"skill",name:"Concentration"});
 const create=f.role.createRoll;f.role.createRoll=()=>({...create(),handleRollDialog:async()=>false});
 await beginForceOut(f.cards[0]);
 assert.equal(f.cards.length,1);assert.equal(connectionFor(f.source,f.target.uuid).state,"active");
});

test("voluntary Jack Out needs no roll, invalidates old cards, and permits fresh Jack-In",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");const old=f.cards[0];
 await jackOut(f.source,f.target.uuid);
 assert.equal(connectionFor(f.source,f.target.uuid).state,"disconnected");
 assert.equal(f.state.rolls,1);assert.equal(forceOutEntries(f.target).length,0);
 assert.equal(resultConnectionValid(f.source,{...old.flags[MODULE].quickhack,connectionId:old.id}),false);
 await establishConnection(old);assert.equal(connectionFor(f.source,f.target.uuid).state,"disconnected");
 await executeQuickhack(f.a,f.b,"jack-in");assert.equal(f.state.rolls,2);
 const current=connectionFor(f.source,f.target.uuid);assert.equal(current.state,"active");assert.notEqual(current.id,old.id);
 await ejectConnection(f.source,f.target.uuid,current.id,current);await jackOut(f.source,f.target.uuid);
 assert.equal(connectionFor(f.source,f.target.uuid).state,"ejected");
});
test("Jack Out respects ownership and feature enablement",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");
 f.state.enabled=false;await jackOut(f.source,f.target.uuid);assert.equal(connectionFor(f.source,f.target.uuid).state,"active");
 f.state.enabled=true;game.user={id:"stranger",isGM:false};f.source.testUserPermission=()=>false;
 await jackOut(f.source,f.target.uuid);assert.equal(connectionFor(f.source,f.target.uuid).state,"active");
});
test("player Jack Out is coordinated and acknowledged by the connected GM",async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,"jack-in");
 const gm=game.user,player={id:"player",isGM:false,active:true};game.users.push(player);
 let listener;const payloads=[];
 game.socket={connected:true,on:(_channel,callback)=>{listener=callback;},emit:(_channel,payload)=>{
  payloads.push(payload);queueMicrotask(()=>{game.user=payload.quickhackType==="disconnect"?gm:player;listener(payload);});
 }};
 registerConnections();game.user=player;await jackOut(f.source,f.target.uuid);
 assert.deepEqual(payloads.map(p=>p.quickhackType),["disconnect","connected"]);
 assert.equal(connectionFor(f.source,f.target.uuid).state,"disconnected");assert.equal(f.state.rolls,1);
});
test("QuickHack menu icons prefer actor item, then world item, then catalog artwork",()=>{
 const f=fixture();
 assert.match(actorQuickhacks(f.source).find(h=>h.id==="overheat").img,/overheat-gray.png$/);
 game.items.push(hack("world",{img:"world.png"}));
 assert.equal(actorQuickhacks(f.source).find(h=>h.id==="overheat").img,"world.png");
 f.source.items.push(hack("owned",{img:"actor.png"}));
 assert.equal(actorQuickhacks(f.source).find(h=>h.id==="overheat").img,"actor.png");
});

test('successful noisy hack alerts NPC; later failed or silent hacks never erase detection',async()=>{
 const f=fixture();f.target.hasPlayerOwner=false;f.state.total=30;await executeQuickhack(f.a,f.b,'jack-in');
 let result=f.cards.at(-1).flags[MODULE].quickhack;assert.equal(result.alerted,false);
 await executeQuickhack(f.a,f.b,'lure');assert.equal(f.cards.at(-1).flags[MODULE].quickhack.alerted,false);
 await executeQuickhack(f.a,f.b,'puppet');assert.equal(f.cards.at(-1).flags[MODULE].quickhack.alerted,true);
 f.state.total=1;await executeQuickhack(f.a,f.b,'lure');result=f.cards.at(-1).flags[MODULE].quickhack;assert.equal(result.success,false);assert.equal(result.alerted,true);
});

test('detection HUD notice reaches only the target owner and announces a connection once',async()=>{
 const {announceDetection}=await import('../dist/scripts/quickhack/integration.js');const {listHUDMessages}=await import('../dist/scripts/hud-messages.js');
 const f=fixture();game.ready=true;f.target.hasPlayerOwner=false;f.state.total=30;await executeQuickhack(f.a,f.b,'jack-in');await executeQuickhack(f.a,f.b,'puppet');const message=f.cards.at(-1);
 const before=listHUDMessages().length;announceDetection(message);assert.equal(listHUDMessages().length,before,'GM gets no personal detection notice');
 game.user={id:'player',isGM:false};f.target.isOwner=false;announceDetection(message);assert.equal(listHUDMessages().length,before);
 f.target.isOwner=true;announceDetection(message);const notice=listHUDMessages().at(-1);assert.equal(notice.text,'NETRUNNER DETECTED — NEURAL LINK COMPROMISED');assert(!notice.text.includes(f.source.name));
 announceDetection(message);assert.equal(listHUDMessages().length,before+1);
 const {dismissHUDMessage}=await import('../dist/scripts/hud-messages.js');dismissHUDMessage(notice.source,notice.id);
});
test('incoming detector reflects active detected connections and clears on Jack Out',async()=>{
 const {collectHUDConditions}=await import('../dist/scripts/hud-conditions.js');const f=fixture();f.target.allApplicableEffects=()=>[];f.target.hasPlayerOwner=false;f.state.total=30;
 await executeQuickhack(f.a,f.b,'jack-in');assert(!collectHUDConditions(f.target).exposures.includes('Neural Intrusion'));
 await executeQuickhack(f.a,f.b,'puppet');assert(collectHUDConditions(f.target).exposures.includes('Neural Intrusion'));
 await jackOut(f.source,f.target.uuid);assert(!collectHUDConditions(f.target).exposures.includes('Neural Intrusion'));
});

test('encounter awareness survives deleted chat; ejection does not require the card',async()=>{
 const f=fixture();await executeQuickhack(f.a,f.b,'jack-in');const id=f.cards[0].id;
 f.cards.length=0;
 game.messages[Symbol.iterator]=()=>{throw Error('HUD must not scan messages');};
 assert.equal(forceOutEntries(f.target)[0].messageId,id);
 f.source.hasPlayerOwner=false;f.state.total=20;f.target.items.push({...f.role,type:'skill',name:'Concentration'});
 await beginForceOut({id});assert.equal(connectionFor(f.source,f.target.uuid).state,'ejected');
});
test('native quickhack roll retains checks at input and outcome boundaries without redundant middle checks',async()=>{
 const f=fixture();const {nativeQuickhackRoll}=await import('../dist/scripts/quickhack/rolls.js');let checks=0;
 await nativeQuickhackRoll(f.source,f.role,'Test',{blind:false,whisper:[]},()=>{checks++;return true;},undefined,false);
 assert.equal(checks,3);assert.equal(f.state.rolls,1);
});

test('QuickHack follows active scene encounter when player and GM view unrelated trackers',async()=>{
 const f=fixture();game.combat={id:'preview',uuid:'Combat.preview',started:true};await executeQuickhack(f.a,f.b,'jack-in');const saved=f.cards[0].flags[MODULE].quickhack;
 assert.equal(saved.combatId,'combat');assert.equal(connectionFor(f.source,f.target.uuid).state,'active');
 canvas.scene={id:'gm-other',grid:{distance:2}};assert.equal(resultConnectionValid(f.source,{...saved,connectionId:f.cards[0].id}),true);
 assert.equal(await ejectConnection(f.source,f.target.uuid,f.cards[0].id,saved),true);
});
test('ambiguous QuickHack encounters stop before rolling',async()=>{const f=fixture();game.combats.push({...f.encounter,id:'second'});await executeQuickhack(f.a,f.b,'jack-in');assert.equal(f.state.rolls,0);assert.match(f.notices.at(-1),/Multiple active/);});
test('QuickHack cannot use another token of the same actor as membership',async()=>{const f=fixture();f.encounter.combatants[1].token={...f.b.document,uuid:'Scene.scene.Token.copy'};await executeQuickhack(f.a,f.b,'jack-in');assert.equal(f.state.rolls,0);assert.match(f.notices.at(-1),/participating tokens/);});
test('QuickHack result rejects reset epoch even if connection flags remain',async()=>{const f=fixture();await executeQuickhack(f.a,f.b,'jack-in');const saved=f.cards[0].flags[MODULE].quickhack;f.encounter.flags[MODULE].evasionEpoch='reset';assert.equal(resultConnectionValid(f.source,{...saved,connectionId:f.cards[0].id}),false);await assert.rejects(establishConnection(f.cards[0]),/reset/);});
