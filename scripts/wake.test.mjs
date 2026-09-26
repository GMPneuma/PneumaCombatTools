import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canWake,resolveWake} from '../dist/scripts/wake.js';
import {masterStatuses} from '../dist/scripts/status-catalog.js';
const id=masterStatuses.find(s=>s.name==='Unconscious').id;
function fixture(){const source={actor:{uuid:'Actor.a',isOwner:true,effects:[],testUserPermission:u=>u.id==='owner'},parent:{id:'scene'}};
 const target={actor:{uuid:'Actor.b',effects:[{statuses:new Set([id])}],async toggleStatusEffect(status,options){assert.equal(status,id);assert.deepEqual(options,{active:false});this.effects=[];this.calls=(this.calls??0)+1;}},parent:{id:'scene'}};
 globalThis.fromUuid=async uuid=>({source,target}[uuid]);return {source,target};}
test('wake is available for another unconscious actor only with a conscious owned source',()=>{const {source,target}=fixture();assert(canWake(source,target));assert(!canWake(source,source));source.actor.isOwner=false;assert(!canWake(source,target));source.actor.isOwner=true;source.actor.effects=[{statuses:new Set([id])}];assert(!canWake(source,target));});
test('wake clears native unconscious once, rejects foreign source and keeps other statuses unchanged',async()=>{const {target}=fixture();target.actor.prone=true;await assert.rejects(resolveWake('source','target',{id:'other'}),/Select your character/);await resolveWake('source','target',{id:'owner'});await resolveWake('source','target',{id:'owner'});assert.equal(target.actor.calls,1);assert.equal(target.actor.prone,true);});
test('wake rejects another scene and unconscious helpers',async()=>{const {source,target}=fixture();target.parent.id='elsewhere';await assert.rejects(resolveWake('source','target',{id:'owner'}));target.parent.id='scene';source.actor.effects=[{statuses:new Set([id])}];await assert.rejects(resolveWake('source','target',{id:'owner'}),/unconscious character/);});
