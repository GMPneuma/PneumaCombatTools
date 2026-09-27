import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){
 if(context.parentURL?.endsWith('/attack-menu.js') && specifier==='./combat-resolution.js') return {shortCircuit:true,url:'data:text/javascript,export const startCombatExchange=(...a)=>globalThis.exchange(...a)'};
 if(context.parentURL?.endsWith('/attack-menu.js') && specifier==='./aoe/workflow.js') return {shortCircuit:true,url:'data:text/javascript,export const startAreaAttack=(...a)=>globalThis.area(...a)'};
 return next(specifier,context);
}});
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
import {installSheetAttackRouting,registerSheetAttacks,sheetAttacker} from '../dist/scripts/sheet-attacks.js';
function setup(){
 installMockLibWrapper();
 const calls={native:0,exchange:[],area:[],errors:[]};
 const item={id:'gun',name:'Gun',type:'weapon',system:{equipped:'equipped',weaponType:'smg',isRanged:true,magazine:{value:30,max:30}},effects:[]};
 const items=[item];items.get=id=>items.find(i=>i.id===id);
 const actor={uuid:'Actor.a',isOwner:true,items};
 function token(id,who=actor){return {id,actor:who,isVisible:true,document:{id,uuid:'Scene.s.Token.'+id},can:()=>true,control:()=>true,setTarget(){}};}
 const source=token('a'),target=token('b',{uuid:'Actor.b'});
 const placeables=[source,target];
 globalThis.canvas={tokens:{placeables,controlled:[],get:id=>placeables.find(t=>t.id===id)}};
 globalThis.game={settings:{get:()=>true},user:{id:'u',targets:new Set([target])},users:[{id:'gm',active:true,isGM:true}]};
 globalThis.ui={notifications:{error:m=>calls.errors.push(m)}};
 globalThis.exchange=async(...a)=>calls.exchange.push(a);
 globalThis.area=async(...a)=>calls.area.push(a);
 class Sheet {constructor(){this.actor=actor;} _getFireCheckbox(){return this.mode??'attack';} async _onRoll(){calls.native++;return 'native';} static _getItemId(e){return e.itemId;} }
 installSheetAttackRouting(Sheet,{GetEventDatum:(e)=>e.rollType});
 return {calls,item,actor,source,target,token,sheet:new Sheet(),event:{rollType:'attack',itemId:'gun',ctrlKey:true}};
}
test('sheet routing is registered off by default',()=>{
 let config;globalThis.game={settings:{register:(m,k,c)=>{assert.equal(k,'routeSheetAttacks');config=c;}}};globalThis.Hooks={once(){}};
 registerSheetAttacks();assert.equal(config.default,false);assert.equal(config.scope,'world');
});
test('normal, aimed and autofire route once with exact event, item and mode',async()=>{
 for(const mode of ['attack','aimed','autofire']){const f=setup();f.sheet.mode=mode;await f.sheet._onRoll(f.event);
 assert.equal(f.calls.native,0);assert.equal(f.calls.exchange.length,1);assert.deepEqual(f.calls.exchange[0],[f.source,f.target,'gun',mode,f.event]);}
});
test('disabled, unrelated rolls and missing/ambiguous context keep native return value',async()=>{
 for(const change of [()=>game.settings.get=()=>false,f=>f.event.rollType='damage',f=>f.event.rollType='skill',()=>game.user.targets.clear(),f=>game.user.targets.add(f.source),f=>f.target.isVisible=false,()=>game.users=[],f=>f.actor.isOwner=false,f=>f.sheet.mode='unsupported',f=>f.item.system.equipped='owned',f=>f.event.itemId='missing']){
 const f=setup();change(f);assert.equal(await f.sheet._onRoll(f.event),'native');assert.equal(f.calls.native,1);assert.equal(f.calls.exchange.length+f.calls.area.length,0);
 }
});
test('multiple actor tokens require one controlled candidate or exact token sheet',()=>{
 const f=setup(),copy=f.token('copy');canvas.tokens.placeables.push(copy);
 assert.equal(sheetAttacker(f.sheet),undefined);
 canvas.tokens.controlled=[copy];assert.equal(sheetAttacker(f.sheet),copy);
 canvas.tokens.controlled=[copy,f.source];assert.equal(sheetAttacker(f.sheet),undefined);
 f.sheet.token=f.source.document;assert.equal(sheetAttacker(f.sheet),f.source);
 f.sheet.token={id:'a',uuid:'Scene.other.Token.a'};assert.equal(sheetAttacker(f.sheet),undefined);
 delete f.sheet.token;f.actor.isToken=true;f.actor.token=copy.document;assert.equal(sheetAttacker(f.sheet),copy);
});
test('area weapons and suppressive fire use placement with or without a targeted token',async()=>{
 for(const kind of ['grenadeLauncher','rocketLauncher','shotgun','suppression'])for(const targeted of [true,false]){
 const f=setup();if(!targeted)game.user.targets.clear();
 if(kind==='suppression')f.sheet.mode='suppressive';else f.item.system.weaponType=kind;
 if(kind==='shotgun')f.item._getLoadedAmmoProp=()=> 'shotgunShell';
 await f.sheet._onRoll(f.event);assert.equal(f.calls.native,0);assert.equal(f.calls.exchange.length,0);assert.equal(f.calls.area.length,1);
 assert.equal(f.calls.area[0][1],targeted?f.target:f.source);assert.equal(f.calls.area[0][3],f.sheet.mode??'attack');
 }
});
test('cancelled or failed routed attacks never fall back to another roll',async()=>{
 const f=setup();globalThis.exchange=async()=>{};await f.sheet._onRoll(f.event);assert.equal(f.calls.native,0);
 const old=console.error;console.error=()=>{};
 try {globalThis.exchange=async()=>{throw Error('after native ammo confirmation');};await f.sheet._onRoll(f.event);}finally{console.error=old;}
 assert.equal(f.calls.native,0);assert.deepEqual(f.calls.errors,['after native ammo confirmation']);
});
test('overlapping sheet clicks and HUD share the existing single-target guard',async()=>{
 const f=setup();let release,count=0;globalThis.exchange=async()=>{count++;await new Promise(r=>release=r);};
 const first=f.sheet._onRoll(f.event);await new Promise(r=>setImmediate(r));
 await f.sheet._onRoll(f.event);assert.equal(count,1);assert.equal(f.calls.native,0);release();await first;
});
test('empty magazines do not fall back and spend ammunition through native roll',async()=>{
 const f=setup();f.item.system.magazine.value=0;await f.sheet._onRoll(f.event);
 assert.equal(f.calls.native,0);assert.equal(f.calls.exchange.length,0);
});
