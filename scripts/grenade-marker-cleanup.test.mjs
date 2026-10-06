import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const moduleURL=process.env.PNEUMA_MARKER_TEST_OUTPUT
 ? pathToFileURL(resolve(process.env.PNEUMA_MARKER_TEST_OUTPUT,'scripts/aoe/marker-cleanup.js'))
 : new URL('../dist/scripts/aoe/marker-cleanup.js',import.meta.url);
const {clearGrenadeMarkers}=await import(moduleURL);
const M='pneuma-combattools';
function fixture(){
 globalThis.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
 const template=(id,flags)=>({id,flags:{[M]:flags}});
 const rows=[template('blast',{grenadeCombat:'combat'}),template('aim',{grenadeCombat:'combat',originalAim:true}),
   template('other',{grenadeCombat:'other'}),template('outside',{grenadeCombat:null}),template('smoke',{smoke:{duration:{combat:'combat'}}}),
   template('native',{}),template('legacy',{areaMessage:'old-card'}),template('shell',{areaMessage:'shell-card'})];
 const removed=[];
 const scene={templates:rows,async deleteEmbeddedDocuments(type,ids){assert.equal(type,'MeasuredTemplate');removed.push(...ids);}};
 const messages=new Map([
   ['old-card',{flags:{[M]:{aoe:{kind:'explosive',exchange:{combatId:'combat'}}}}}],
   ['shell-card',{flags:{[M]:{aoe:{kind:'shell',exchange:{combatId:'combat'}}}}}]
 ]);
 globalThis.game={user:{id:'gm',isGM:true},users:[{id:'gm',isGM:true,active:true},{id:'other-gm',isGM:true,active:true}],scenes:[scene],messages};
 return {rows,removed,messages};
}
test('combat cleanup deletes both grenade markers and legacy associated markers, preserving unrelated templates',async()=>{
 const f=fixture();await clearGrenadeMarkers({id:'combat'});
 assert.deepEqual(f.removed,['blast','aim','legacy']);
});
test('saved combat references survive source chat deletion',async()=>{
 const f=fixture();f.messages.clear();await clearGrenadeMarkers({id:'combat'});
 assert.deepEqual(f.removed,['blast','aim']);
});
test('only the elected active GM performs marker deletion',async()=>{
 const f=fixture();game.user={id:'player',isGM:false};await clearGrenadeMarkers({id:'combat'});
 game.user={id:'other-gm',isGM:true};await clearGrenadeMarkers({id:'combat'});
 assert.deepEqual(f.removed,[]);
});
test('cleanup finds encounter markers across scenes',async()=>{
 const f=fixture();game.scenes.push({templates:[{id:'remote',flags:{[M]:{grenadeCombat:'combat'}}}],async deleteEmbeddedDocuments(_type,ids){f.removed.push(...ids);}});
 await clearGrenadeMarkers({id:'combat'});assert.deepEqual(f.removed,['blast','aim','legacy','remote']);
});
test('encounter end/reset and deletion trigger cleanup; ordinary combat updates do not',async()=>{
 let f=fixture();const hooks={};
 globalThis.FormApplication=class{};
 globalThis.Hooks={on:(name,fn)=>{(hooks[name]??=[]).push(fn);},once(){},off(){}};
 foundry.data={fields:{ObjectField:class{}}};
 game.settings={register(){},registerMenu(){}};
 globalThis.ui={notifications:{error(){}}};
 const {registerAreaAttacks}=await import(new URL('./workflow.js',moduleURL));registerAreaAttacks();
 // The marker hooks register first, before Smoke and movement hooks.
 hooks.updateCombat[0]({id:'combat',started:true},{round:2});
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.removed,[]);
 hooks.updateCombat[0]({id:'combat',started:false},{round:0});
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.removed,['blast','aim','legacy']);
 f=fixture();hooks.deleteCombat[0]({id:'combat'});
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.removed,['blast','aim','legacy']);
});
