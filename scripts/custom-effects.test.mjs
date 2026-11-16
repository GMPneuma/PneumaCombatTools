import assert from 'node:assert/strict';
import {test} from 'node:test';
globalThis.FormApplication=class {};
globalThis.foundry={utils:{getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}};
const {matchingStatusEffects,toggleExistingEffects,applyCustomEffect,createCustomEffectTemplate,freshStatusDuration}=await import('../dist/scripts/custom-effects.js');
const {registerCyberpunkStatuses,validateCustomStatuses,labelCombatEffects}=await import('../dist/scripts/status-settings.js');
class Effect {
 async delete(){this.parent.effects.splice(this.parent.effects.indexOf(this),1);this.deleted=true;}
 constructor(data,parent){Object.assign(this,structuredClone(data));this.parent=parent;this.statuses=new Set(data.statuses??[]);this.disabled=!!data.disabled;this.uuid='Item.template.ActiveEffect.effect';}
 async update(data){Object.assign(this,data);if(data.statuses)this.statuses=new Set(data.statuses);}
 toObject(){const {parent,sheet,...data}=this;return structuredClone({...data,statuses:[...this.statuses]});}
}
class Item {constructor(effects=[]){this.effects=effects;}}
class Actor {
 constructor(){this.type='character';this.items=[];this.effects=[];this.calls=0;}
 async toggleStatusEffect(id,options){this.calls++;return options.active!==false;}
 async createEmbeddedDocuments(type,rows){assert.equal(type,'ActiveEffect');const effects=rows.map(data=>new Effect(data,this));this.effects.push(...effects);return effects;}
}
globalThis.ActiveEffect=Effect;globalThis.Item=Item;globalThis.Actor=Actor;
let customs=[];
globalThis.game={i18n:{localize:s=>s},time:{worldTime:123},settings:{get:()=>customs,register(){},registerMenu(){}},user:{isGM:true}};
const hooks={};
globalThis.Hooks={on(name,fn){(hooks[name]??=[]).push(fn);},once(){}};
globalThis.CONFIG={Token:{objectClass:class {async _drawEffects(){}}},Actor:{documentClass:Actor},statusEffects:[]};
globalThis.libWrapper={register(_module,path,fn){const keys=path.split('.');const method=keys.pop();let owner=globalThis;for(const key of keys)owner=owner[key];const original=owner[method];owner[method]=function(...args){return fn.call(this,original.bind(this),...args);};}};
registerCyberpunkStatuses();

test('sheet disable removes labeled module instances, but preserves native effects and templates',async()=>{
 const actor=new Actor(),item=new Item();item.parent=actor;actor.items.push(item);
 customs=[{id:'legacy-jail',name:'In Jail'}];game.user.id='gm';
 const marked=new Effect({name:'Penalty',flags:{'pneuma-combattools':{createdByCombatTools:true}}},actor);
 const legacy=new Effect({name:'In Jail',statuses:['legacy-jail']},actor);
 const native=new Effect({name:'Native'},actor);
 const nativeItem=new Effect({name:'In Jail'},item);
 const supplemental=new Effect({name:'Custom penalty',flags:{'pneuma-combattools':{createdByCombatTools:true}}},item);
 actor.effects.push(marked,legacy,native);item.effects.push(nativeItem,supplemental);
 const worldItem=new Item(),template=new Effect({name:'Template',flags:{'pneuma-combattools':{createdByCombatTools:true}}},worldItem);worldItem.effects.push(template);
 for(const effect of [marked,legacy,native,nativeItem,supplemental,template]){
  effect.disabled=true;hooks.updateActiveEffect[0](effect,{disabled:true},{},'gm');
 }
 await Promise.resolve();
 assert.deepEqual(actor.effects,[native]);assert.deepEqual(item.effects,[nativeItem]);assert.deepEqual(worldItem.effects,[template]);
 const old=new Effect({name:'In Jail',disabled:true},actor);actor.effects.push(old);
 hooks.updateActiveEffect[0](old,{name:'In Jail'},{},'gm');assert.ok(actor.effects.includes(old));
 hooks.updateActiveEffect[0](old,{disabled:true},{},'remote');assert.ok(actor.effects.includes(old));
 customs=[];
});

test('menu removal deletes module effects while disabling native effects',async()=>{
 const actor=new Actor();customs=[];
 const moduleEffect=new Effect({name:'Falling',description:'Created by Pneuma Combat Tools.'},actor);
 const nativeEffect=new Effect({name:'Native'},actor);actor.effects.push(moduleEffect,nativeEffect);
 await toggleExistingEffects([moduleEffect,nativeEffect],['shared'],false);
 assert.deepEqual(actor.effects,[nativeEffect]);assert.equal(nativeEffect.disabled,true);
});
test('toggle finds a newly added actor effect outside the catalog, preserving modifiers and identity',async()=>{
 const actor=new Actor();CONFIG.statusEffects=[{id:'custom',name:'Custom'}];customs=[];
 await actor.toggleStatusEffect('custom',{active:true});assert.equal(actor.calls,1);
 const effect=new Effect({name:' custom ',disabled:true,changes:[{key:'system.stats.ref.value',value:'-2'}],duration:{seconds:60},flags:{native:true}},actor);
 actor.effects.push(effect);
 await actor.toggleStatusEffect('custom',{active:true});assert.equal(actor.calls,1);assert.equal(effect.disabled,false);assert.ok(effect.statuses.has('custom'));
 await actor.toggleStatusEffect('custom',{active:false});assert.equal(effect.disabled,true);assert.equal(actor.effects[0],effect);
 assert.deepEqual(effect.changes,[{key:'system.stats.ref.value',value:'-2'}]);assert.deepEqual(effect.duration,{seconds:60});assert.deepEqual(effect.flags,{native:true});
});
test('disabled item effects are found and preserved; IDs win over ambiguous names',async()=>{
 const actor=new Actor(),item=new Item();actor.items.push(item);
 const effect=new Effect({name:'Renamed',statuses:['custom'],disabled:true,changes:[{value:'-1'}]},item);item.effects.push(effect);
 actor.effects.push(new Effect({name:'Custom'},actor));
 assert.deepEqual(matchingStatusEffects(actor,['custom'],'Custom'),[effect]);
 await toggleExistingEffects([effect],['custom'],true);assert.equal(effect.disabled,false);assert.equal(item.effects[0],effect);
});
test('custom templates copy native modifiers and flags with a fresh identity and time',async()=>{
 const actor=new Actor();const source=new Effect({_id:'template',name:'Template',origin:'Item.template',statuses:['custom'],disabled:true,transfer:true,
 changes:[{key:'bonuses.test',value:'-2'}],flags:{'cyberpunk-red-core':{changes:{cats:{0:'skill'}}}},duration:{seconds:60,startTime:1,combat:'old',startRound:2,startTurn:3}},new Item());
 globalThis.fromUuid=async()=>source;
 const status={id:'custom',name:'Custom',img:'custom.svg',effectUuid:source.uuid};customs=[status];CONFIG.statusEffects=[status];
 await actor.toggleStatusEffect('custom',{active:true});await actor.toggleStatusEffect('custom',{active:true});
 assert.equal(actor.effects.length,1);const copy=actor.effects[0];assert.equal(copy._id,undefined);assert.equal(copy.origin,undefined);assert.equal(copy.disabled,false);assert.equal(copy.transfer,false);
 assert.deepEqual(copy.changes,source.changes);assert.deepEqual(copy.flags['cyberpunk-red-core'],source.flags['cyberpunk-red-core']);assert.equal(copy.flags['pneuma-combattools'].createdByCombatTools,true);assert.equal(source.flags['pneuma-combattools'],undefined);assert.equal(copy.duration.startTime,123);assert.equal(copy.duration.combat,null);assert.equal(source.duration.startTime,1);
 assert.equal(validateCustomStatuses([status])[0].effectUuid,source.uuid);
 globalThis.fromUuid=async()=>null;await assert.rejects(applyCustomEffect(new Actor(),status),/template is missing/);
});
test('template creation delegates to the system createEffect method on a world Item',async()=>{
 let called=false;Item.create=async data=>{const item=new Item();item.createEffect=async render=>{called=true;assert.equal(render,false);item.effects.push(new Effect({name:'New',changes:[],flags:{native:true}},item));};assert.equal(data.type,'gear');return item;};
 const effect=await createCustomEffectTemplate({id:'custom',name:'Custom',img:'custom.svg'});
 assert.ok(called);assert.equal(effect.name,'Custom');assert.ok(effect.statuses.has('custom'));assert.deepEqual(effect.flags,{native:true});
});

test('overlapping activations create one copy; toggles retain ordering and recover after failures',async()=>{
 const actor=new Actor();actor.uuid='Actor.race';
 const source=new Effect({name:'Race',statuses:['race'],changes:[{key:'bonus',value:'-2'}]},new Item());
 customs=[{id:'race',name:'Race',img:'race.svg',effectUuid:source.uuid}];CONFIG.statusEffects=customs;
 globalThis.fromUuid=async()=>{await new Promise(resolve=>setTimeout(resolve,5));return source;};
 await Promise.all([actor.toggleStatusEffect('race',{active:true}),actor.toggleStatusEffect('race',{active:true})]);
 assert.equal(actor.effects.length,1);assert.equal(actor.effects[0].disabled,false);
 await Promise.all([actor.toggleStatusEffect('race',{active:false}),actor.toggleStatusEffect('race',{active:true}),actor.toggleStatusEffect('race',{active:false})]);
 assert.equal(actor.effects.length,0);
 const other=new Actor();globalThis.fromUuid=async()=>null;
 await assert.rejects(other.toggleStatusEffect('race',{active:true}),/missing/);
 globalThis.fromUuid=async()=>source;await other.toggleStatusEffect('race',{active:true});assert.equal(other.effects.length,1);
});
test('fresh combat duration starts in the actor encounter and ignores template combat and tracker selection',async()=>{
 const actor=new Actor();actor.uuid='Actor.timing';
 const combat={id:'current',started:true,active:true,scene:{id:'scene'},round:8,turn:2,turns:[{}, {}, {}, {}],combatants:[{actor}]};
 globalThis.canvas={scene:{id:'scene'}};game.combats=new Map([['current',combat]]);game.combat={id:'wrong'};
 const {durationExpired}=await import('../dist/scripts/effect-duration.js');
 const source={seconds:null,rounds:0,turns:1,startTime:0,startRound:1,startTurn:0,combat:'old'};
 const fresh=freshStatusDuration(actor,source);
 assert.equal(fresh.combat,'current');assert.equal(fresh.startRound,8);assert.equal(fresh.startTurn,2);assert.equal(durationExpired(fresh),false);
 combat.turn=3;assert.equal(durationExpired(fresh),true);assert.equal(source.combat,'old');
 const seconds=freshStatusDuration(actor,{seconds:60,startTime:1,combat:'old'});assert.equal(seconds.startTime,123);assert.equal(seconds.combat,null);
 game.combats=new Map();assert.throws(()=>freshStatusDuration(actor,{turns:1}),/active combat/);
 assert.equal(freshStatusDuration(actor,{rounds:2}).seconds,6);
 delete globalThis.canvas;delete game.combat;
});

test('token wrapper turns off native and Actor copies together',async()=>{
 const {masterStatuses}=await import('../dist/scripts/status-catalog.js');
 const status=masterStatuses.find(s=>s.name==='Broken Leg');CONFIG.statusEffects=[status];customs=[];
 const actor=new Actor();actor.uuid='Actor.native-and-manual';
 const item=new Item();Object.defineProperty(item.effects,'size',{get(){return this.length;}});item.type='criticalInjury';item.name='Broken Leg';actor.items.push(item);
 const native=new Effect({name:'Native MOVE',statuses:[status.id],changes:[{key:'MOVE',value:'-4'}]},item);native.id='native';item.effects.push(native);
 item.updateEmbeddedDocuments=async(_type,rows)=>{for(const row of rows)await native.update(row);};
 const manual=new Effect({name:'Broken Leg',statuses:[status.id]},actor);actor.effects.push(manual);
 assert.equal(await actor.toggleStatusEffect(status.id,{active:false}),false);
 assert.equal(manual.disabled,true);assert.equal(native.disabled,true);assert.equal(actor.items.length,1);
 assert.equal(await actor.toggleStatusEffect(status.id),true);assert.equal(manual.disabled,false);assert.equal(native.disabled,true);
 assert.equal(await actor.toggleStatusEffect(status.id),false);assert.equal(manual.disabled,true);assert.equal(native.disabled,true);
});

test('existing user status effects receive attribution on sheet render without rewriting documents',()=>{
 const actor=new Actor();customs=[{id:'pneuma-in-jail',name:'In Jail',img:'jail.svg'},{id:'user-drunk',name:'Drunk',img:'drunk.svg'}];
 const jail=new Effect({name:'In Jail',statuses:['pneuma-in-jail'],changes:[{key:'Accounting',value:'4'}]},actor);jail.uuid='Actor.a.ActiveEffect.jail';
 const drunk=new Effect({name:'Drunk',statuses:['user-drunk'],disabled:true},actor);drunk.uuid='Actor.a.ActiveEffect.drunk';
 const unrelated=new Effect({name:'Other',statuses:[]},actor);unrelated.uuid='Actor.a.ActiveEffect.other';
 actor.effects.push(jail,drunk,unrelated);const before=actor.effects.map(effect=>effect.toObject());
 const rows=actor.effects.map(effect=>{const labels=[];const name={querySelector:()=>labels[0],append:label=>labels.push(label)};return {dataset:{effectId:effect.uuid},labels,querySelector:selector=>selector==='.effect-item > .text-semi'?name:null};});
 const oldDocument=globalThis.document;globalThis.document={createElement:()=>({})};
 try{const root={querySelectorAll:()=>rows};labelCombatEffects(actor,root);labelCombatEffects(actor,root);}finally{globalThis.document=oldDocument;}
 assert.deepEqual(rows.map(row=>row.labels.length),[1,1,0]);assert.equal(rows[0].labels[0].textContent,' (Combat Tools)');
 assert.deepEqual(actor.effects.map(effect=>effect.toObject()),before);
});
