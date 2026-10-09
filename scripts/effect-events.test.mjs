import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=(await readFile('dist/scripts/effect-events.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'');
const get=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);
function set(object,path,value){const parts=path.split('.');let at=object;for(const key of parts.slice(0,-1))at=at[key]??={};at[parts.at(-1)]=value;}
const actor={uuid:'Actor.target',update(){throw Error('must not write actor');}};
let writes=0,id=0;
const combat={id:'encounter',started:true,round:2,turn:0,turns:[{actor:{uuid:'Actor.other'}},{actor}],flags:{},async update(changes){writes++;for(const [key,value] of Object.entries(changes))set(this,key,value);}};
function runtime(user='gm') {
 const hooks={},events=[],api={};
 const combats=[combat];combats.get=key=>key===combat.id?combat:undefined;
 const context=vm.createContext({actor,combat,actorEncounter:()=>combat,encounterEpoch:()=> 'epoch',game:{user:{id:user},users:{filter:f=>[{id:'gm',active:true,isGM:true},{id:'player',active:true,isGM:false}].filter(f)},combats,modules:{get:()=>api},socket:{emit:(name,event)=>events.push(event),on:(name,handler)=>hooks.socket=handler}},foundry:{utils:{getProperty:get,randomID:()=>`event${++id}`}},Hooks:{callAll(){},once:(name,handler)=>hooks[name]=handler},console});
 vm.runInContext(source+'\nregisterEffectEvents();',context);hooks.ready();return {context,hooks,events};
}
const first=runtime();await vm.runInContext("reportExposure(actor,'poison')",first.context);assert.equal(writes,1);assert.equal(vm.runInContext("hasReportedExposure(actor,'poison')",first.context),true);
const refreshed=runtime();assert.equal(vm.runInContext("hasReportedExposure(actor,'poison')",refreshed.context),true,'fresh runtime reads combat flag');
combat.turn=1;assert.equal(vm.runInContext("hasReportedExposure(actor,'poison')",refreshed.context),false,'next affected turn expires saved exposure');
await vm.runInContext("reportExposure(actor,'poison')",refreshed.context);assert.equal(vm.runInContext("hasReportedExposure(actor,'poison')",refreshed.context),true,'exposure during own turn lasts to next turn');
combat.round=3;combat.turn=0;assert.equal(vm.runInContext("hasReportedExposure(actor,'poison')",runtime().context),true,'crossing round boundary retains exposure');
combat.turn=1;assert.equal(vm.runInContext("hasReportedExposure(actor,'poison')",runtime().context),false);
const player=runtime('player');combat.turn=0;const before=writes;await vm.runInContext("reportExposure(actor,'poison')",player.context);assert.equal(writes,before,'player sends report without combat write');
const gm=runtime();gm.context.event=player.events[0];await vm.runInContext('receive(event)',gm.context);assert.equal(writes,before+1,'GM persists forwarded report');await vm.runInContext('receive(event)',gm.context);assert.equal(writes,before+1,'duplicate socket event is ignored');
combat.started=false;assert.equal(vm.runInContext("hasReportedExposure(actor,'poison')",runtime().context),false,'combat end expires');
assert.equal(vm.runInContext("hasReportedExposure(actor,'biotoxin')",runtime().context),undefined,'unreported kind has no saved state');
console.log('Combat-only exposure persistence, refresh recovery, next-turn expiry and GM forwarding passed');
