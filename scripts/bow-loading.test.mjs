import assert from 'node:assert/strict';
import {test} from 'node:test';
import {prepareBowAttack} from '../dist/scripts/bow-loading.js';
const get=(o,p)=>p.split('.').reduce((o,k)=>o?.[k],o);
globalThis.foundry={utils:{getProperty:get}};
function setup(){
 const arrows=[{id:'basic',name:'Basic <arrows>',type:'ammo',system:{variety:'arrow',amount:3}},{id:'fire',name:'Incendiary',type:'ammo',system:{variety:'arrow',amount:2}},{id:'empty',name:'Empty',type:'ammo',system:{variety:'arrow',amount:0}},{id:'bullet',name:'Bullets',type:'ammo',system:{variety:'heavyPistol',amount:5}}];
 const calls=[],warnings=[];let attached=arrows[0],choice='basic',before=()=>{};
 const bow={id:'bow',name:'Bow',system:{weaponType:'bow',ammoVariety:['arrow'],magazine:{value:0,max:1}},getInstalledItems:()=>attached?[attached]:[],uninstallItems:async()=>{calls.push('uninstall');attached=undefined},installItems:async items=>{calls.push('install');attached=items[0];return true},reload:async()=>{calls.push('reload');if(attached.system.amount>0){attached.system.amount--;bow.system.magazine.value=1;}}};
 const items=new Map([...arrows,bow].map(i=>[i.id,i]));items[Symbol.iterator]=items.values.bind(items);const actor={items};
 globalThis.ui={notifications:{warn:msg=>warnings.push(msg)}};
 let dialog;globalThis.Dialog=class{constructor(d){dialog=d}render(){before();if(choice===null)dialog.close();else dialog.buttons.load.callback({find:()=>({val:()=>choice})});}};
 return {actor,bow,arrows,calls,warnings,setChoice:v=>choice=v,before:fn=>before=fn,dialog:()=>dialog};
}
test('loaded bows and other weapons skip selection and inventory changes',async()=>{for(const kind of ['loaded','gun']){const f=setup();if(kind==='loaded')f.bow.system.magazine.value=1;else f.bow.system.weaponType='heavyPistol';assert.equal(await prepareBowAttack(f.actor,f.bow),true);assert.deepEqual(f.calls,[]);assert.equal(f.dialog(),undefined)}});
test('empty bow remembers available attached ammo and reloads it natively',async()=>{const f=setup();assert.equal(await prepareBowAttack(f.actor,f.bow),true);assert.deepEqual(f.calls,['reload']);assert.equal(f.arrows[0].system.amount,2);assert.match(f.dialog().content,/value="basic" selected/);assert.match(f.dialog().content,/Basic &lt;arrows&gt;/);assert.doesNotMatch(f.dialog().content,/value="empty"|value="bullet"/)});
test('switching arrow type uninstalls, installs and reloads in native order',async()=>{const f=setup();f.setChoice('fire');assert.equal(await prepareBowAttack(f.actor,f.bow),true);assert.deepEqual(f.calls,['uninstall','install','reload']);assert.equal(f.arrows[1].system.amount,1);assert.equal(f.arrows[0].system.amount,3)});
test('cancel and empty selection leave bow and inventory unchanged',async()=>{for(const choice of [null,'']){const f=setup();f.setChoice(choice);assert.equal(await prepareBowAttack(f.actor,f.bow),false);assert.deepEqual(f.calls,[]);assert.equal(f.arrows[0].system.amount,3)}});
test('depleted remembered ammo is not preselected; no available arrows stops before a dialog',async()=>{const f=setup();f.arrows[0].system.amount=0;f.setChoice(null);await prepareBowAttack(f.actor,f.bow);assert.match(f.dialog().content,/value="" selected/);f.arrows[1].system.amount=0;assert.equal(await prepareBowAttack(f.actor,f.bow),false);assert.equal(f.warnings.length,1)});
test('ammo depletion or bow removal during selection aborts without loading',async()=>{for(const change of ['deplete','remove']){const f=setup();f.before(()=>change==='deplete'?f.arrows[0].system.amount=0:f.actor.items.delete('bow'));await assert.rejects(prepareBowAttack(f.actor,f.bow),/no longer/);assert.deepEqual(f.calls,[])}});
test('a bow loaded while the selection is open keeps its loaded arrow',async()=>{const f=setup();f.setChoice('fire');f.before(()=>f.bow.system.magazine.value=1);assert.equal(await prepareBowAttack(f.actor,f.bow),true);assert.deepEqual(f.calls,[])});
test('failed native installation or reload stops the attack',async()=>{for(const failure of ['install','reload']){const f=setup();if(failure==='install'){f.setChoice('fire');f.bow.installItems=async()=>false;}else f.bow.reload=async()=>{};assert.equal(await prepareBowAttack(f.actor,f.bow),false);assert.equal(f.bow.system.magazine.value,0)}});
