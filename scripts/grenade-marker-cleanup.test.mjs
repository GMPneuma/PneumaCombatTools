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

test('GM toolbar hides paired markers once per card, includes orphans, and follows scene visibility', async () => {
  const {rows, messages} = fixture();
  const scene = game.scenes[0];
  scene.id = 'viewed';
  const card = messages.get('old-card').flags[M].aoe;
  card.scene = scene.id;
  for (const row of rows.slice(0, 2)) row.flags[M].areaMessage = 'old-card';
  const hidden = [];
  scene.updateEmbeddedDocuments = async (_type, updates) => {
    for (const update of updates) {
      assert.equal(update.hidden, true);
      rows.find(row => row.id === update._id).hidden = true;
      hidden.push(update._id);
    }
  };
  globalThis.canvas = {scene};
  const hooks = {};
  globalThis.FormApplication = class {};
  globalThis.Hooks = {once(){}, on: (name, fn) => { hooks[name] = fn; }};
  const controls = [{name:'token', tools:[]}];
  globalThis.ui = {controls:{controls, render(){}}};
  const {registerFootprintControl} = await import(new URL('./footprint-control.js', moduleURL));
  const cards = [];
  registerFootprintControl(async id => {
    cards.push(id);
    for (const row of rows.filter(row => row.flags[M].areaMessage === id)) {row.hidden = true;hooks.updateMeasuredTemplate({...row,parent:scene});}
  }, assert.fail);
  game.user.isGM = false;
  hooks.getSceneControlButtons(controls);
  assert.equal(controls[0].tools.length, 0);
  game.user.isGM = true;
  hooks.getSceneControlButtons(controls);
  const [tool] = controls[0].tools;
  assert.equal(tool.visible, true);
  tool.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(cards, ['old-card']);
  assert.deepEqual(hidden, ['other','outside']);
  for(const row of rows)hooks.updateMeasuredTemplate({...row,parent:scene});
  assert.equal(tool.visible, false);
  rows[0].hidden = false;
  hooks.updateMeasuredTemplate({...rows[0],parent:scene});
  assert.equal(tool.visible, true);
  canvas.scene = {templates:[]};
  hooks.canvasReady();
  assert.equal(tool.visible, false);
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
