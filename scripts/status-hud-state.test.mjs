import assert from 'node:assert/strict';
import {test} from 'node:test';
import {correctStatusChoices} from '../dist/scripts/status-hud.js';
globalThis.foundry={utils:{getProperty:(value,path)=>path.split('.').reduce((v,k)=>v?.[k],value)}};
const effect=(ids,extra={})=>({statuses:new Set(ids),...extra});
const choices=()=>Object.fromEntries(['falling','hidden','jail','drug','alias'].map(id=>[id,{isActive:true,isOverlay:true,cssClass:'custom active overlay',src:id+'.svg'}]));
test('disabled and suppressed effects do not select HUD statuses or overlays',()=>{
 const rows=correctStatusChoices(choices(),{allApplicableEffects:()=>[
  effect(['falling'],{disabled:true,flags:{core:{overlay:true}}}),
  effect(['hidden'],{isSuppressed:true}),effect(['jail'],{system:{isSuppressed:true}})
 ]});
 for(const row of Object.values(rows)){assert.equal(row.isActive,false);assert.equal(row.isOverlay,false);assert.equal(row.cssClass,'custom');}
});
test('enabled effects and transferred Item effects select all status aliases; disabled duplicate does not override active',()=>{
 const effects=[effect(['falling'],{disabled:true}),effect(['falling','alias'],{flags:{core:{overlay:true}}}),effect(['drug'],{transfer:true})];
 const actor={allApplicableEffects:()=>effects};
 let rows=correctStatusChoices(choices(),actor);
 assert.equal(rows.falling.cssClass,'custom active overlay');assert.equal(rows.alias.isActive,true);
 assert.equal(rows.drug.isActive,true);assert.equal(rows.drug.isOverlay,false);assert.equal(rows.hidden.isActive,false);
 assert.equal(rows.falling.src,'falling.svg');
 effects[1].disabled=true;effects[2].disabled=true;
 rows=correctStatusChoices(rows,actor);
 assert.ok(Object.values(rows).every(row=>!row.isActive&&!row.isOverlay));
 effects[1].disabled=false;
 assert.equal(correctStatusChoices(rows,actor).falling.isActive,true);
});
