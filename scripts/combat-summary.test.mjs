import assert from 'node:assert/strict';
import {test} from 'node:test';
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
 f.player.effects.push({uuid:'Effect.fire',name:'On Fire',disabled:false,statuses:new Set()},{uuid:'Effect.addiction',name:'Addiction',disabled:false,statuses:new Set()});
 f.combat.round=0;f.combat.started=false;const summary=captureCombatSummary(f.combat,4);
 f.player.effects.shift();f.player.items.pop();
 const html=combatSummaryHTML(summary);
 assert.equal(summary.round,4);assert.equal(summary.players,1);assert.equal(summary.npcs,1);assert.equal(summary.criticals.length,1);
 assert.match(html,/Reached round 4/);assert.match(html,/Broken &lt;arm&gt;.*no longer present/);assert.doesNotMatch(html,/Old injury/);
 assert.match(html,/Defeated.*Guard/);assert.match(html,/Effects cleared during automatic cleanup:.*On Fire/);assert.match(html,/Effects remaining for review:.*Addiction/);
 assert.doesNotMatch(html,/Partial injury record/);
});
test('mid-encounter adoption is partial and persistent crit records survive recapture',async()=>{
 const f=fixture();f.combat.started=true;f.combat.round=3;f.fire('ready');await waitCombatSummary();
 const injury={uuid:'Actor.player.Item.new',name:'Broken Arm',type:'criticalInjury',parent:f.player};f.player.items.push(injury);f.fire('createItem',injury);await waitCombatSummary();
 const summary=captureCombatSummary(f.combat);assert.equal(summary.partial,true);assert.equal(summary.criticals.length,1);assert.match(combatSummaryHTML(summary),/Partial injury record/);
 f.player.items.pop();assert.equal(captureCombatSummary(f.combat).criticals.length,1,'Removed injury remains in recorded applications');
});
test('cleanup summary stays in the public existing review and does not duplicate notices',async()=>{
 const f=fixture();await f.start();f.combat.started=false;f.combat.round=0;
 globalThis.FormApplication=class{};const {postCleanupNotice,resetCleanupNotice}=await import('../dist/scripts/status-cleanup.js');
 const messages=[];globalThis.ChatMessage={create:async data=>messages.push(data)};
 resetCleanupNotice(f.combat);const snapshot=captureCombatSummary(f.combat,2);
 await postCleanupNotice(f.combat,undefined,snapshot);await postCleanupNotice(f.combat,undefined,snapshot);
 assert.equal(messages.length,1);assert.deepEqual(messages[0].whisper,[]);assert.equal(messages[0].blind,false);assert.match(messages[0].content,/pneuma-combat-summary/);assert.match(messages[0].content,/data-status-cleanup/);
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
