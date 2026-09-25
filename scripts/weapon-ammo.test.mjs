import assert from 'node:assert/strict';
import {test} from 'node:test';
import {gunAmmo,ammoBlocks,weaponAmmoAction} from '../dist/scripts/weapon-ammo.js';
const gun=(rounds,type='smg')=>({system:{isRanged:true,weaponType:type,magazine:{value:rounds,max:30}}});
test('normal fire and ten-round modes have separate thresholds',()=>{
 for(const rounds of [0,1,6,9,10,30]) {
  assert.equal(ammoBlocks(gun(rounds),'attack'),rounds<1);
  assert.equal(ammoBlocks(gun(rounds),'aimed'),rounds<1);
  for(const mode of ['autofire','suppressive'])assert.equal(ammoBlocks(gun(rounds),mode),rounds<10);
 }
 assert.equal(gunAmmo(gun(0,'bow')),undefined);
 assert.equal(gunAmmo(gun(0,'unarmed')),undefined);
 assert.equal(gunAmmo({system:{isRanged:true}}),undefined);
});
test('native reload and ammo picker: ownership, full magazine, depleted reserves, concurrent clicks',async()=>{
 globalThis.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
 const warnings=[];globalThis.ui={notifications:{warn:m=>warnings.push(m)}};
 let count=0,chosen=0,release;let reserve=20,space=10;
 const item={...gun(20),uuid:'Actor.a.Item.g',getMagazineSpace:()=>space,getInstalledItems:()=>[{system:{amount:reserve}}],reload:async()=>{count++;await new Promise(r=>release=r);},load:async()=>{chosen++;}};
 const actor={isOwner:true,items:new Map([['g',item]])};
 const first=weaponAmmoAction(actor,'g','reload');await weaponAmmoAction(actor,'g','reload');assert.equal(count,1);release();await first;
 space=0;await weaponAmmoAction(actor,'g','reload');assert.equal(warnings.at(-1),'Magazine full');
 space=10;reserve=0;await weaponAmmoAction(actor,'g','reload');assert.equal(warnings.at(-1),'No reserve ammunition');
 await weaponAmmoAction(actor,'g','change');assert.equal(chosen,1);
 actor.isOwner=false;await weaponAmmoAction(actor,'g','change');assert.equal(chosen,1);
});
