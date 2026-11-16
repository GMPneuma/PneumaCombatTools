import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import Handlebars from 'handlebars';
globalThis.FormApplication=class {};
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
const set=(o,p,v)=>{const keys=p.split('.');let at=o;for(const key of keys.slice(0,-1))at=at[key]??={};at[keys.at(-1)]=v;};
globalThis.foundry={utils:{getProperty:get}};
let serial=0,settings,documents,items;
class Effect {
 constructor(data,parent){Object.assign(this,structuredClone(data));this.id=data._id??'e'+(++serial);this.parent=parent;this.statuses=new Set(data.statuses??[]);this.uuid=parent.uuid+'.ActiveEffect.'+this.id;documents.set(this.uuid,this);}
 async update(data){for(const [key,value] of Object.entries(data))set(this,key,value);if(data.statuses)this.statuses=new Set(data.statuses);}
 toObject(){const {parent,uuid,id,...data}=this;return structuredClone({...data,_id:id,statuses:[...this.statuses]});}
}
class Item {
 constructor(data){Object.assign(this,structuredClone(data));this.id='i'+(++serial);this.uuid='Item.'+this.id;this.effects=(data.effects??[]).map(e=>new Effect(e,this));documents.set(this.uuid,this);}
 static async create(data){const item=new Item(data);items.push(item);return item;}
 async createEffect(){this.effects.push(new Effect({name:'New Effect',changes:[],flags:{}},this));}
 toObject(){const {effects,uuid,id,...data}=this;return structuredClone({...data,_id:id,effects:effects.map(e=>e.toObject())});}
}
globalThis.ActiveEffect=Effect;globalThis.Item=Item;
const {masterStatuses}=await import('../dist/scripts/status-catalog.js');
const {statusManagerRows,editStatusEffect,viewStatusEffect,classifyStatus}=await import('../dist/scripts/status-manager.js');
const {nativeStatusItem,statusTemplates,saveStatusTemplate}=await import('../dist/scripts/status-sources.js');
function setup(){
 serial=0;documents=new Map();items=[];
 settings={customStatuses:[{id:'pneuma-in-jail',name:'In Jail',img:'jail.svg'},{id:'user',name:'User effect',img:'user.svg'}],statusTemplates:{}};
 const packs=new Map();
 globalThis.game={i18n:{localize:s=>s},user:{isGM:true},settings:{get:(_m,k)=>settings[k],set:async(_m,k,v)=>settings[k]=v},packs};
 globalThis.CONFIG={statusEffects:[{id:'prone',name:'Prone',img:'prone.svg'}]};
 globalThis.fromUuid=async uuid=>documents.get(uuid)??null;
 return packs;
}
function pack(packs,id,entries){packs.set(id,{getIndex:async()=>entries.map(([id,item])=>({_id:id,name:item.name})),getDocument:async id=>entries.find(([key])=>key===id)?.[1]??null});}
test('four source categories stay distinct, including user effects and effectless native items',async()=>{
 const packs=setup();const leg=masterStatuses.find(s=>s.name==='Broken Leg'),arm=masterStatuses.find(s=>s.name==='Broken Arm');
 const legItem=new Item({name:'Broken Leg',type:'criticalInjury',effects:[{name:'MOVE',changes:[{value:'-4'}]}]});
 const armItem=new Item({name:'Broken Arm',type:'criticalInjury',effects:[]});
 pack(packs,leg.binding.pack,[[leg.binding.itemId,legItem],[arm.binding.itemId,armItem]]);
 let rows=await statusManagerRows();const row=name=>rows.find(r=>r.name===name);
 assert.equal(row('Broken Leg').tab,'native');assert.equal(row('Broken Arm').tab,'native-empty');assert.equal(row('Prone').tab,'native-empty');
 assert.equal(row('Intoxicated').tab,'module');assert.equal(row('In Jail').tab,'custom');assert.equal(row('User effect').tab,'custom');
 assert.equal(row('Brain Injury').unavailable,true);assert.ok(!row('Quick Fix'));assert.ok(row('Speed Heal'));
 // Changing the installed source changes classification on the next open.
 armItem.effects.push(new Effect({name:'New native modifier'},armItem));rows=await statusManagerRows();assert.equal(row('Broken Arm').tab,'native');
 assert.equal(classifyStatus(true,true,true),'custom');
});
test('native drug variants are view-only and legacy replacement templates cannot affect their source',async()=>{
 const packs=setup();const status=masterStatuses.find(s=>s.name==='Synthcoke');
 const native=new Item({name:'Synthcoke',type:'drug',system:{amount:1},effects:[
  {name:'Synthcoke Primary',changes:[{value:'1'}],flags:{native:true}},
  {name:'Synthcoke Addicted Primary',changes:[{value:'3'}],flags:{native:true}},
  {name:'Synthcoke Addiction',changes:[{value:'-2'}]}
 ]});pack(packs,status.binding.pack,[[status.binding.itemId,native]]);
 settings.statusTemplates[status.id]={itemUuid:'Item.old-replacement',effectUuid:'Item.old-replacement.ActiveEffect.old'};
 assert.equal(statusTemplates()[status.id],undefined);assert.equal(await nativeStatusItem(status),native);
 await assert.rejects(editStatusEffect(status),/view-only/);assert.equal(items.length,0);
 const before=JSON.stringify(native.toObject()),saved=JSON.stringify(settings);
 const template=Handlebars.compile(await readFile('src/templates/status-effect-view.hbs','utf8'));
 let dialog;
 globalThis.renderTemplate=async(_path,data)=>template(data);
 globalThis.Dialog=class{constructor(data){dialog=data;}render(){}};
 await viewStatusEffect(status,1);
 assert.doesNotMatch(dialog.content,/<(?:details|pre)\b/);
 assert.doesNotMatch(dialog.content,/Duration:/);
 assert.match(dialog.content,/Synthcoke Addicted Primary/);assert.match(dialog.content,/>3</);
 assert.deepEqual(Object.keys(dialog.buttons),['close']);assert.doesNotMatch(dialog.content,/<(?:input|select|textarea|form)\b/);
 assert.equal(JSON.stringify(native.toObject()),before);assert.equal(JSON.stringify(settings),saved);assert.equal(items.length,0);
 const row=(await statusManagerRows()).find(row=>row.id===status.id);assert.equal(row.readOnly,true);assert.equal(row.customized,false);
});
test('effectless native injury gets a standalone supplemental template without replacing its native item',async()=>{
 const packs=setup(),status=masterStatuses.find(s=>s.name==='Broken Arm');
 const native=new Item({name:'Broken Arm',type:'criticalInjury',effects:[]});pack(packs,status.binding.pack,[[status.binding.itemId,native]]);
 const effect=await editStatusEffect(status);assert.equal(effect.parent.type,'gear');assert.equal(effect.transfer,false);assert.ok(effect.statuses.has(status.id));
 assert.equal(native.effects.length,0);assert.equal(await nativeStatusItem(status),native);
 assert.deepEqual(settings.statusTemplates[status.id],{effectUuid:effect.uuid});
});
test('Combat Tools modifier templates persist, reset without deleting copies, and reject non-GM writes',async()=>{
 setup();const status=masterStatuses.find(s=>s.name==='Intoxicated');const effect=await editStatusEffect(status);
 assert.equal(settings.statusTemplates[status.id].effectUuid,effect.uuid);assert.equal(await editStatusEffect(status),effect);
 documents.delete(effect.uuid);await assert.rejects(editStatusEffect(status),/missing/);
 await saveStatusTemplate(status.id,null);assert.equal(settings.statusTemplates[status.id],undefined);
 game.user.isGM=false;await assert.rejects(editStatusEffect(status),/Only the GM/);await assert.rejects(saveStatusTemplate(status.id,{}),/Only the GM/);
});
test('effect labels distinguish absent, empty, configured and deleted templates without changing source tabs',async()=>{
 const packs=setup(),status=masterStatuses.find(s=>s.name==='Intoxicated');
 const row=async name=>(await statusManagerRows()).find(row=>row.name===name);
 assert.equal((await row('Intoxicated')).effectLabel,'No effect');
 const effect=await editStatusEffect(status);
 assert.equal((await row('Intoxicated')).effectLabel,'Has effect');
 assert.equal((await row('Intoxicated')).effectDetail,'0 modifiers configured');
 await effect.update({changes:[{key:'test',value:'-2'}]});
 assert.equal((await row('Intoxicated')).effectDetail,'1 modifier configured');
 assert.equal((await row('Intoxicated')).tab,'module');
 documents.delete(effect.uuid);assert.equal((await row('Intoxicated')).effectLabel,'No effect');
 const leg=masterStatuses.find(s=>s.name==='Broken Leg');
 pack(packs,leg.binding.pack,[[leg.binding.itemId,new Item({name:'Broken Leg',effects:[{name:'MOVE',changes:[{value:'-4'}]}]})]]);
 assert.equal((await row('Broken Leg')).effectLabel,'Has effect');
 assert.equal((await row('Broken Leg')).effectDetail,'1 modifier configured');
 const custom=new Effect({name:'User effect',changes:[]},new Item({name:'User source'}));settings.customStatuses.find(s=>s.id==='user').effectUuid=custom.uuid;
 assert.equal((await row('User effect')).effectLabel,'Has effect');
});

 test('automation descriptions are independent of modifier effects and custom names',async()=>{
  setup();settings.customStatuses.push({id:'custom-fire',name:'On Fire (Mild)',img:'fire.svg'});
  const rows=await statusManagerRows();
  const fire=rows.find(row=>row.name==='On Fire (Mild)'&&row.tab!=='custom');
  assert.equal(fire.effectLabel,'No effect');assert.match(fire.automation,/2 HP damage at turn end/);
  assert.match(rows.find(row=>row.name==='On Fire (Strong)').automation,/4 HP/);
  assert.match(rows.find(row=>row.name==='On Fire (Deadly)').automation,/6 HP/);
  assert.equal(rows.find(row=>row.id==='custom-fire').automation,undefined);
  assert.equal(rows.find(row=>row.name==='Intoxicated').automation,undefined);
  assert.match(rows.find(row=>row.name==='Grappled').automation,/alone does not start/);
  assert.match(rows.find(row=>row.name==='Broken Ribs').automation,/damage is not automatic/);
 });

test('managed automation blocks new templates, preserves existing ones, and leaves reminders editable',async()=>{
 setup();const fire=masterStatuses.find(s=>s.name==='On Fire (Mild)');
 let rows=await statusManagerRows();let row=rows.find(r=>r.id===fire.id);
 assert.equal(row.canEditEffect,false);assert.equal(row.showEffectState,false);
 await assert.rejects(editStatusEffect(fire),/managed by Combat Tools/);assert.equal(items.length,0);
 const source=new Effect({name:'Existing custom fire',changes:[{value:'-1'}]},new Item({name:'Template'}));
 settings.statusTemplates[fire.id]={effectUuid:source.uuid};
 rows=await statusManagerRows();row=rows.find(r=>r.id===fire.id);
 assert.equal(row.canEditEffect,true);assert.equal(row.showEffectState,true);assert.equal(row.customized,true);
 assert.equal(await editStatusEffect(fire),source);
 await saveStatusTemplate(fire.id,null);assert.equal(documents.get(source.uuid),source);
 await assert.rejects(editStatusEffect(fire),/managed by Combat Tools/);
 const reminder=rows.find(r=>r.name==='Broken Arm');assert.equal(reminder.canEditEffect,true);
 const template=Handlebars.compile(await readFile('src/templates/custom-statuses.hbs','utf8'));
 const html=template({tabs:[{id:'module',rows:[{...row,customized:false,canEditEffect:false,showEffectState:false}]}]});
 assert.doesNotMatch(html,/data-edit-status|data-reset-status|No effect/);assert.match(html,/Combat Tools automation/);
});
