import assert from 'node:assert/strict';
import {test} from 'node:test';
import {masterStatuses} from '../dist/scripts/status-catalog.js';
import {buildCombatReport,combatReportMarkdown} from '../dist/scripts/combat-report.js';
import {registerCombatSummary,waitCombatSummary,captureCombatSummary,combatSummaryHTML} from '../dist/scripts/combat-summary.js';
const get=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);
function fixture(){
 const hooks={},gm={id:'gm',isGM:true,active:true};
 globalThis.Hooks={on:(name,fn)=>(hooks[name]??=[]).push(fn),once:(name,fn)=>(hooks[name]??=[]).push(fn)};
 globalThis.foundry={utils:{getProperty:get}};
 const player={uuid:'Actor.player',name:'Player <one>',hasPlayerOwner:true,items:[],effects:[]};
 const npc={uuid:'Actor.npc',name:'Guard',hasPlayerOwner:false,items:[],effects:[]};
 const old={uuid:'Actor.player.Item.old',name:'Old injury',type:'criticalInjury',parent:player};player.items.push(old);
 const combat={id:'combat',name:'Encounter',started:false,round:0,flags:{},combatants:[{actor:player,name:player.name,isDefeated:false},{actor:npc,name:npc.name,isDefeated:true}],async update(changes){for(const [path,value]of Object.entries(changes)){const parts=path.split('.');let object=this;for(const key of parts.slice(0,-1))object=object[key]??={};object[parts.at(-1)]=value;}}};
 globalThis.game={user:gm,users:[gm],combats:Object.assign([combat],{get:id=>id===combat.id?combat:undefined}),actors:[player,npc],scenes:[]};
 globalThis.ui={notifications:{error:error=>{throw Error(error)}}};
 const fire=(name,...args)=>{for(const fn of hooks[name]??[])fn(...args);};registerCombatSummary();
 const start=async()=>{const changes={round:1};fire('preUpdateCombat',combat,changes);await combat.update(changes);combat.started=true;fire('updateCombat',combat);await waitCombatSummary();};
 return {combat,player,npc,fire,start};
}
test('GM summary retains reset round, counts new player crits once, excludes preexisting injuries and reports actual cleanup',async()=>{
 const f=fixture();await f.start();
 const injury={uuid:'Actor.player.Item.new',name:'Broken <arm>',type:'criticalInjury',parent:f.player};f.player.items.push(injury);
 f.fire('createItem',injury);f.fire('createItem',injury);await waitCombatSummary();
 f.player.effects.push({uuid:'Effect.fire',name:'On Fire',disabled:false,statuses:new Set([masterStatuses.find(s=>s.name==='On Fire (Mild)').id])},{uuid:'Effect.addiction',name:'Addiction',disabled:false,statuses:new Set()});
 f.combat.round=0;f.combat.started=false;const summary=captureCombatSummary(f.combat,4);
 f.player.effects.shift();f.player.items.pop();
 const html=combatSummaryHTML(summary);
 assert.equal(summary.round,4);assert.equal(summary.players,1);assert.equal(summary.npcs,1);assert.equal(summary.criticals.length,1);
 assert.match(html,/Round reached 4/);assert.doesNotMatch(html,/Broken &lt;arm&gt;|Old injury/);assert.match(html,/Current injuries: 1/);
 const markdown=combatReportMarkdown(buildCombatReport(summary));assert.ok(markdown.includes("Broken <arm\\> (no longer present)"));assert.ok(markdown.includes("Old injury"));
 assert.match(html,/Defeated.*markers: 1/);assert.match(html,/Conditions cleared: 1/);assert.doesNotMatch(html,/Addiction/);
 assert.doesNotMatch(html,/partial record/);
});
test('mid-encounter adoption is partial and persistent crit records survive recapture',async()=>{
 const f=fixture();f.combat.started=true;f.combat.round=3;f.fire('ready');await waitCombatSummary();
 const injury={uuid:'Actor.player.Item.new',name:'Broken Arm',type:'criticalInjury',parent:f.player};f.player.items.push(injury);f.fire('createItem',injury);await waitCombatSummary();
 const summary=captureCombatSummary(f.combat);assert.equal(summary.partial,true);assert.equal(summary.criticals.length,1);assert.match(combatSummaryHTML(summary),/partial record/);
 f.player.items.pop();assert.equal(captureCombatSummary(f.combat).criticals.length,1,'Removed injury remains in recorded applications');
});
test('cleanup summary stays in the public existing review and does not duplicate notices',async()=>{
 const f=fixture();await f.start();f.combat.started=false;f.combat.round=0;
 globalThis.FormApplication=class{};const {postCleanupNotice,resetCleanupNotice}=await import('../dist/scripts/status-cleanup.js');
 const messages=[];globalThis.ChatMessage={create:async data=>messages.push(data)};
 resetCleanupNotice(f.combat);const snapshot=captureCombatSummary(f.combat,2);
 await postCleanupNotice(f.combat,undefined,snapshot);await postCleanupNotice(f.combat,undefined,snapshot);
 assert.equal(messages.length,1);assert.deepEqual(messages[0].whisper,[]);assert.equal(messages[0].blind,false);assert.match(messages[0].content,/pneuma-combat-summary/);assert.match(messages[0].content,/data-status-cleanup/);assert.match(messages[0].content,/data-copy-combat-summary/);assert.equal(messages[0].flags['pneuma-combattools'].combatReport.version,1);assert.equal(typeof messages[0].flags['pneuma-combattools'].combatReport.participants[0].name,'string');
});

test('public review removes only the cleanup control on player clients',async()=>{
 const f=fixture();await f.start();f.combat.started=false;
 globalThis.FormApplication=class{};const {registerStatusCleanup}=await import('../dist/scripts/status-cleanup.js');
 game.settings={registerMenu(){}};registerStatusCleanup();
 const message={flags:{'pneuma-combattools':{statusCleanup:{combat:f.combat.id,actors:[f.player.uuid]}}}};
 let removed=false;const html={0:{querySelectorAll:()=>[]},find:()=>({remove:()=>{removed=true;}})};
 game.user={id:'player',isGM:false};f.fire('renderChatMessage',message,html);assert.equal(removed,true);
 game.user={id:'gm',isGM:true};removed=false;f.fire('renderChatMessage',message,html);assert.equal(removed,false,'GM keeps the cleanup control');
});

test('snapshot excludes cyberware, includes current injuries and stabilization, saves player HP only, and Markdown stays frozen',async()=>{
 const f=fixture();await f.start();
 f.player.system={derivedStats:{hp:{value:18,max:40}}};f.npc.system={derivedStats:{hp:{value:7,max:20}}};
 const cyber={uuid:'Actor.player.Item.scope.Effect.scope',name:'Targeting Scope',parent:{type:'cyberware'},disabled:false,statuses:new Set()};
 const stabilize={uuid:'Effect.stabilize',name:'Needs Stabilization',disabled:false,statuses:new Set(['pneuma-needs-stabilization'])};
 f.player.allApplicableEffects=function*(){yield cyber;};f.npc.effects.push(stabilize);
 f.npc.items.push({uuid:'Item.foreign',name:'Foreign Object (Body)',type:'criticalInjury'});
 const report=buildCombatReport(captureCombatSummary(f.combat,2)),html=combatSummaryHTML(captureCombatSummary(f.combat,2));
 assert.doesNotMatch(html,/Targeting Scope/);assert.ok(html.includes('HP 18/40'));assert.match(combatReportMarkdown(report),/Seriously Wounded/);assert.match(html,/Needs Stabilization/);assert.match(combatReportMarkdown(report),/Foreign Object/);assert.doesNotMatch(html,/Foreign Object/);
 assert.equal(report.participants.find(row=>!row.player).hp,undefined);
 const before=combatReportMarkdown(report);f.player.system.derivedStats.hp.value=40;f.npc.effects=[];f.npc.items=[];
 assert.equal(combatReportMarkdown(report),before,'Saved snapshot does not re-read actors');
 report.name='@everyone **ambush**';const markdown=combatReportMarkdown(report);assert.ok(!markdown.includes('@everyone'),'Copy avoids Discord pings');assert.ok(markdown.includes('\\*\\*ambush\\*\\*'),'Names escape Discord markup');
});

test('public Copy Discord Markdown uses persisted report data and survives repeated render',async()=>{
 const f=fixture();await f.start();globalThis.FormApplication=class{};
 const {registerStatusCleanup}=await import('../dist/scripts/status-cleanup.js');game.settings={registerMenu(){}};registerStatusCleanup();
 const report=buildCombatReport(captureCombatSummary(f.combat,2));
 const message={flags:{'pneuma-combattools':{statusCleanup:{combat:f.combat.id},combatReport:report}}};
 let handler,copied;const copy={addEventListener:(_name,fn)=>{handler=fn;},removeEventListener:()=>{}};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async value=>{copied=value;}}}});
 ui.notifications.info=()=>{};game.user={id:'player',isGM:false};
 const html={0:{querySelectorAll:selector=>selector==='[data-copy-combat-summary]'?[copy]:[]},find:()=>({remove(){}})};
 f.fire('renderChatMessage',message,html);f.fire('renderChatMessage',message,html);await handler({});
 assert.equal(copied,combatReportMarkdown(report));
});

test('removed defeated combatants remain in the saved roster after tracker removal',async()=>{
 const f=fixture();await f.start();const row=f.combat.combatants[1];row.parent=f.combat;
 f.fire('deleteCombatant',row);f.combat.combatants.pop();await waitCombatSummary();
 const summary=captureCombatSummary(f.combat);assert.equal(summary.npcs,1);assert.ok(summary.actors.includes(f.npc));assert.deepEqual(summary.defeated,['Guard']);
 const report=buildCombatReport(summary);assert.ok(report.participants.some(row=>row.name==='Guard'));
 assert.match(combatReportMarkdown(report),/Encounter participants/);
});
test('late participant remains after removal and recapture',async()=>{
 const f=fixture();await f.start();const actor={uuid:'Actor.late',name:'Late mook',hasPlayerOwner:false,items:[],effects:[]};game.actors.push(actor);
 const row={actor,parent:f.combat,name:actor.name,isDefeated:false};f.combat.combatants.push(row);f.fire('createCombatant',row);await waitCombatSummary();
 f.fire('deleteCombatant',row);f.combat.combatants.pop();await waitCombatSummary();assert.equal(captureCombatSummary(f.combat).npcs,2);
});

test('two dead NPCs with different actor and token names count twice, not three times',async()=>{
 const f=fixture();f.npc.name='Default Mook';f.combat.combatants[1].name='Mook 1';
 const second={uuid:'Actor.npc2',name:'Default Mook',hasPlayerOwner:false,items:[],effects:[]};game.actors.push(second);
 f.combat.combatants.push({actor:second,name:'Mook 2',isDefeated:true});
 for(const actor of [f.npc,second])actor.effects.push({uuid:actor.uuid+'.Effect.dead',disabled:false,statuses:new Set(['dead'])});
 await f.start();const summary=captureCombatSummary(f.combat);
 assert.equal(summary.players,1);assert.equal(summary.npcs,2);assert.deepEqual(summary.defeated,['Mook 1','Mook 2']);
 assert.equal(buildCombatReport(summary).defeated.length,2);
});
test('identically named defeated actors stay separate and cleared tracker flags override saved flags',async()=>{
 const f=fixture();const second={uuid:'Actor.npc2',name:'Guard',hasPlayerOwner:false,items:[],effects:[]};game.actors.push(second);
 f.combat.combatants.push({actor:second,name:'Guard',isDefeated:true});await f.start();
 assert.deepEqual(captureCombatSummary(f.combat).defeated,['Guard','Guard']);
 f.combat.combatants[1].isDefeated=false;f.combat.combatants[2].isDefeated=false;
 assert.deepEqual(captureCombatSummary(f.combat).defeated,[],'Current flags override previously remembered defeat');
});
