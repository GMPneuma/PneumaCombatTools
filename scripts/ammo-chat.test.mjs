import assert from 'node:assert/strict';
import {test} from 'node:test';
import {observeWeaponAmmo,registerAmmoChat} from '../dist/scripts/ammo-chat.js';
function fixture(){
 const messages=[];const actor={uuid:'Actor.a',name:'Character & One',hasPlayerOwner:true};let ammo={id:'basic'};
 const item={name:'SMG <test>',actor,system:{isRanged:true,weaponType:'smg',magazine:{value:5,max:30}},getInstalledItems:()=>ammo?[ammo]:[],
 async reload(){this.system.magazine.value=30;return 'done';},async load(){ammo={id:'ap'};await this.reload();}};
 globalThis.game={user:{name:'Player & One',isGM:false},settings:{get:()=>true},combats:new Map([['c',{active:true,started:true,scene:{id:'s'},combatants:[{actor}]}]])};
 globalThis.canvas={scene:{id:'s'}};
 globalThis.ChatMessage={getSpeaker:()=>({actor:'a'}),create:async data=>messages.push(data)};
 globalThis.ui={notifications:{warn:()=>{}}};
 observeWeaponAmmo(item);
 return {item,messages,actor,setAmmo:a=>ammo=a};
}
test('native reload posts character and escaped weapon names; nested ammo reload posts only once',async()=>{
 const f=fixture();assert.equal(await f.item.reload(),'done');assert.equal(f.messages[0].content,'<p class="pneuma-ammo-notice" data-ammo-action="reload">Character &amp; One reloads SMG &lt;test&gt;</p>');
 await f.item.load();assert.equal(f.messages.length,2);assert.match(f.messages[1].content,/changes ammo in/);
 await f.item.reload();assert.equal(f.messages.length,2);
});
test('silent outside combat, setting off, nonparticipant, foreign scene and unstarted combat',async()=>{
 for(const mutate of [()=>game.combats.clear(),()=>game.settings.get=()=>false,
 ()=>game.combats.get('c').combatants=[],()=>canvas.scene.id='other',()=>game.combats.get('c').started=false,()=>game.combats.get('c').active=false]){
  const f=fixture();mutate();await f.item.reload();await f.item.load();assert.equal(f.messages.length,0);
 }
});
test('player ownership controls reporting regardless of who performs the action',async()=>{
 for(const isGM of [false,true])for(const hasPlayerOwner of [false,true]){
  const f=fixture();game.user.isGM=isGM;game.user.name=isGM?'GM':'Player';f.actor.hasPlayerOwner=hasPlayerOwner;
  await f.item.reload();await f.item.load();assert.equal(f.messages.length,hasPlayerOwner?2:0);
  if(hasPlayerOwner)assert.ok(f.messages.every(m=>/class="pneuma-ammo-notice" data-ammo-action="(reload|change)">Character &amp; One /.test(m.content)));
 }
});
test('cancel, failure, bows, and method recreation do not produce extra reports',async()=>{
 const f=fixture();f.item.load=async()=>{};observeWeaponAmmo(f.item);await f.item.load();assert.equal(f.messages.length,0);
 f.item.reload=async()=>{throw Error('failed');};observeWeaponAmmo(f.item);await assert.rejects(f.item.reload());assert.equal(f.messages.length,0);
 f.item.reload=async function(){this.system.magazine.value=30;};observeWeaponAmmo(f.item);observeWeaponAmmo(f.item);await f.item.reload();assert.equal(f.messages.length,1);
 const bow={...f.item,system:{isRanged:true,weaponType:'bow',magazine:{value:0,max:1}},reload:async()=>{}};const native=bow.reload;observeWeaponAmmo(bow);assert.equal(bow.reload,native);
});
test('reload opens ammo selection: one message despite mixin recreation during nested calls',async()=>{
 const f=fixture();f.setAmmo(undefined);f.item.reload=async function(){
  if(!this.getInstalledItems()[0])return this.load();this.system.magazine.value=30;
 };
 f.item.load=async function(){f.setAmmo({id:'ap'});this.reload=async function(){this.system.magazine.value=30;};observeWeaponAmmo(this);await this.reload();};
 observeWeaponAmmo(f.item);await f.item.reload();assert.equal(f.messages.length,1);assert.match(f.messages[0].content,/changes ammo in/);
});
test('setting is GM-controlled world scope and enabled by default',()=>{
 let setting;globalThis.game={settings:{register:(module,key,data)=>{assert.equal(key,'reportWeaponReloads');setting=data;}}};globalThis.Hooks={once:()=>{}};
 registerAmmoChat();assert.equal(setting.scope,'world');assert.equal(setting.default,true);assert.equal(setting.config,true);
});
