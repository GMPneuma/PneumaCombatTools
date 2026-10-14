import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseDamageStatuses,registerDamageStatusPicker} from '../dist/scripts/damage-status.js';

test('public status picker preserves other APIs and limits choices to the caller-supported statuses',async()=>{
 const module={api:{sceneAttack:{}}};
 globalThis.game={modules:new Map([['pneuma-combattools',module]]),i18n:{localize:x=>x}};
 globalThis.CONFIG={statusEffects:[{id:'prone',name:'Prone',img:'prone.svg'},{id:'stunned',name:'Stunned'}]};
 globalThis.Dialog={prompt:async options=>{
   assert.match(options.content,/Prone/);assert.match(options.content,/prone.svg/);
   assert.doesNotMatch(options.content,/value="stunned"|value="instant:/);
   return options.callback([{querySelector:()=>({value:'prone'})}]);
 }};
 registerDamageStatusPicker();assert.ok(module.api.sceneAttack);assert.equal(module.api.statusPicker.version,1);
 assert.deepEqual(await module.api.statusPicker.choose([],0,{allowedIds:['prone']}),['prone']);
 Dialog.prompt=async options=>options.callback([{querySelector:()=>({value:'stunned'})}]);
 await assert.rejects(()=>chooseDamageStatuses([],0,{allowedIds:['prone']}),/unavailable/);
 Dialog.prompt=async()=>null;assert.equal(await chooseDamageStatuses(['prone'],0,{allowedIds:['prone']}),null);
});
