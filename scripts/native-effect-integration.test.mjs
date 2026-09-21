import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile} from "node:fs/promises";
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
globalThis.foundry={utils:{getProperty:get,randomID:()=>String(++serial)}};
globalThis.FormApplication=class{};
let serial=0;
globalThis.libWrapper={register(_m,path,fn){const keys=path.split('.');const method=keys.pop();let owner=globalThis;for(const key of keys)owner=owner[key];const original=owner[method];owner[method]=function(...args){return fn.call(this,original.bind(this),...args)};}};
globalThis.Element=class {constructor(id){this.dataset={messageId:id}}closest(){return this}};
const {installNativeEffectIntegration}=await import('../dist/scripts/native-effect-integration.js');
const {masterStatuses}=await import('../dist/scripts/status-catalog.js');
const events=[];globalThis.Hooks={callAll:(_name,actor,kind)=>events.push({actor,kind})};
globalThis.game={system:{id:"cyberpunk-red-core"},time:{worldTime:1},messages:new Map()};
class Actor {
 constructor(id,loss=2,raw=2){this.uuid=id;this.id=id;this.name=id;this.type='character';this.loss=loss;this.raw=raw;this.effects=[];this.system={derivedStats:{hp:{value:40}}};}
 async _applyDamage(...args){await Promise.resolve();this.system.derivedStats.hp.value-=this.loss;chat.RenderDamageApplicationCard({actor:this,hpReduction:this.loss,rawDamageDealt:this.raw});}
 async createEmbeddedDocuments(_type,rows){this.effects.push(...rows.map(r=>({...r,statuses:new Set(r.statuses)})));}
}
const pending=[];
const dialog={showDialog:async data=>new Promise(resolve=>pending.push((value={...data})=>resolve(value)))};
const chat={
 async RenderRollCard(roll){const m={id:String(++serial),flags:{},async update(update){this.flags['pneuma-combattools']={ammoType:update['flags.pneuma-combattools.ammoType']};}};game.messages.set(m.id,m);return m;},
 RenderDamageApplicationCard(){},
 async damageApplication(event){let data={};for(const actor of event.actors){if(!event.ctrlKey)data=await dialog.showDialog(data);if(!data)return;actor._applyDamage(2,0,'body',0,'arrow',100,0,true,data);}}
};
let selected=[];
if(process.env.PNEUMA_CPR_CHAT_SOURCE){
 const source=await readFile(process.env.PNEUMA_CPR_CHAT_SOURCE,'utf8');
 const start=source.indexOf('  static async damageApplication(event)');
 assert.ok(start>0);
 const method=source.slice(start,source.lastIndexOf('\n}'));
 const utils={isNumeric:n=>Number.isFinite(n),Localize:s=>s,Format:s=>s,DisplayMessage(){},getUserTargetedOrSelected:()=>selected.map(actor=>({actor})),GetEventDatum:(event,key)=>({
  'data-total-damage':'2','data-bonus-damage':'0','data-damage-lethal':'true','data-ammo-variety':'arrow','data-damage-location':'body','data-ablation':'0','data-ignore-armor-percent':'100','data-ignore-below-sp':'0','data-scope':'global'
 })[key]};
 chat.damageApplication=new Function('SystemUtils','CPRDialog','LOGGER','return class NativeChat {'+method+'}')(utils,dialog,{debug(){}}).damageApplication;
}
installNativeEffectIntegration(chat,dialog,Actor.prototype);
const settle=()=>new Promise(r=>setTimeout(r,0));
const click=async(ammo,actors,ctrlKey=false)=>{const m=await chat.RenderRollCard({rollCardExtraArgs:{ammoType:ammo}});selected=actors;return chat.damageApplication({currentTarget:new Element(m.id),actors,ctrlKey});};
test('overlapping dialogs retain each original ammo type, including multiple recipients',async()=>{
 events.length=0;const a=new Actor('a'),b=new Actor('b'),c=new Actor('c');
 const poison=click('poison',[a,c]);const bio=click('biotoxin',[b]);await settle();
 pending.splice(1,1)[0]();await bio;await settle();pending.shift()();await settle();pending.shift()();await poison;await settle();
 assert.deepEqual(events,[{actor:'b',kind:'biotoxin'},{actor:'a',kind:'poison'},{actor:'c',kind:'poison'}]);
});
test('Ctrl skip reports actual damage, while zero damage and cancelled dialogs report nothing',async()=>{
 events.length=0;await click('poison',[new Actor('hit'),new Actor('blocked',0,0)],true);await settle();assert.deepEqual(events,[{actor:'hit',kind:'poison'}]);
 const cancelled=click('poison',[new Actor('cancelled')]);await settle();pending.shift()(null);await cancelled;await settle();assert.equal(events.length,1);
});
test('incendiary needs native armor penetration and produces native fire status',async()=>{
 const hit=new Actor('fire'),blocked=new Actor('critical-only',5,0);
 await click('incendiary',[hit,blocked],true);await settle();
 assert.ok(hit.effects[0].statuses.has(masterStatuses.find(s=>s.name==='On Fire (Mild)').id));assert.equal(blocked.effects.length,0);
});
