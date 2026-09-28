import {test} from 'node:test';
import assert from 'node:assert/strict';
globalThis.Hooks={on(){},once(){}};
globalThis.FormApplication=class{};
const {manualEvasion}=await import('../dist/scripts/manual-rolls.js');
test('manual Evasion delegates selected owned native skill with ordinary and Shift dialog choices',async()=>{
 const events=[];
 const actor={isOwner:true,items:[{id:'evade',type:'skill',name:'Localized Evasion'}],sheet:{_onRoll:async event=>events.push(event)}};
 globalThis.canvas={tokens:{controlled:[{actor}]}};
 globalThis.game={i18n:{localize:()=> 'Localized Evasion'}};
 globalThis.document={createElement:()=>({dataset:{}})};
 await manualEvasion();await manualEvasion(true);
 assert.deepEqual(events[0].currentTarget.dataset,{itemId:'evade',rollType:'skill',rollTitle:'Localized Evasion'});
 assert.equal(events[0].ctrlKey,false);assert.equal(events[1].ctrlKey,true);assert.notEqual(events[1].type,'click');
 actor.isOwner=false;await assert.rejects(manualEvasion(),/do not control/);
 actor.isOwner=true;actor.items=[];await assert.rejects(manualEvasion(),/no native Evasion/);
 canvas.tokens.controlled=[];await assert.rejects(manualEvasion(),/Select one/);
 assert.equal(events.length,2);
});
