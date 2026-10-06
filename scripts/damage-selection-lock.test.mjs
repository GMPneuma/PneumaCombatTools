import {test} from 'node:test';
import assert from 'node:assert/strict';
globalThis.Hooks={once(){},on(){}};
globalThis.FormApplication=class{};
const {damageEffectsLocked,handleDamage}=await import('../dist/scripts/damage-flow.js');
test('effect selection locks when application begins and stays locked after completion or review',async()=>{
 globalThis.fromUuid=async()=>({actor:{testUserPermission:()=>true}});
 for(const status of ['rolled','applying','applied','review']){
  const data={state:'resolved',hit:true,attacker:'attacker',defender:'defender',damage:{status,result:{},statusEffects:['original']}};
  let saved=0;
  const request=handleDamage({action:'damageStatuses',statusEffects:[]},{isGM:true},data,async()=>{saved++;});
  if(status==='rolled'){await request;assert.equal(saved,1);assert.deepEqual(data.damage.statusEffects,[]);}
  else {await assert.rejects(request,/locked|cannot change/);assert.equal(saved,0);assert.deepEqual(data.damage.statusEffects,['original']);}
 }
 assert.equal(damageEffectsLocked({status:'rolled',effectsLocked:true}),true);
 assert.equal(damageEffectsLocked({status:'rolled',applications:['receipt']}),true);
 assert.equal(damageEffectsLocked({status:'rolled'}),false);
});
