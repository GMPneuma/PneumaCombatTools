import {test} from 'node:test';import assert from 'node:assert/strict';
import {attackTitle,attackHeading} from '../dist/scripts/attack-title.js';
test('hidden attack names expose only type',()=>{
 for(const [type,title]of [['heavyPistol','Heavy Pistol'],['smg','SMG'],['veryHeavyMelee','Very Heavy Melee Weapon'],['martialArts','Martial Arts'],['grenadeLauncher','Grenade'],['rocketLauncher','Rocket']])assert.equal(attackTitle({name:'Secret',type:'weapon',system:{weaponType:type}},true,'Karate','incendiary'),title);
 assert.equal(attackTitle({name:'Secret',type:'ammo',system:{variety:'grenade',type:'poison'}},true),'Grenade');
});
test('visible names retain weapons, selected martial art and exact grenade ammunition',()=>{
 for(const type of ['heavyPistol','heavyMelee','rocketLauncher'])assert.equal(attackTitle({name:'Custom Weapon',type:'weapon',system:{weaponType:type}},false),'Custom Weapon');
 assert.equal(attackTitle({name:'Fists',system:{weaponType:'martialArts',weaponSkill:'Judo'}},false,'Karate'),'Karate');
 assert.equal(attackTitle({name:'Launcher',system:{weaponType:'grenadeLauncher'}},false,undefined,'incendiary'),'Incendiary Grenade');
 assert.equal(attackTitle({name:'Grenade (Teargas)',type:'ammo',system:{variety:'grenade',type:'teargas'}},false),'Teargas Grenade');
 assert.match(attackHeading('Long <weapon> "name"'),/title="Long &lt;weapon&gt; &quot;name&quot;"/);
});
