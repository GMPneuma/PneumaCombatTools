import test from 'node:test';
import assert from 'node:assert/strict';
import {registerChatResultDelay} from '../dist/scripts/chat-result-delay.js';
import {markRollResult} from '../dist/scripts/native-combat.js';

function client(t,seconds='1',history=[],isGM=false) {
  t.mock.timers.enable({apis:['Date','setTimeout'],now:10000});
  const hooks=new Map(),nodes=[{inert:false},{inert:true}];let setting,serial=0;
  globalThis.Hooks={once:(name,fn)=>hooks.set(name,fn),on:(name,fn)=>hooks.set(name,fn)};
  globalThis.foundry={utils:{randomID:()=>`roll${++serial}`,getProperty:(obj,path)=>path.split('.').reduce((value,key)=>value?.[key],obj)}};
  globalThis.game={settings:{register:(_m,_k,s)=>setting=s,get:()=>seconds,set:async(_m,_k,value)=>seconds=value},messages:history,user:{isGM}};
  globalThis.document={querySelectorAll:()=>nodes};globalThis.CSS={escape:value=>value};
  class Message {
    constructor(content,id='card'){Object.assign(this,{content,id,visible:true,isContentVisible:true,calls:0});}
    async getHTML(){this.calls++;if(this.fail)throw Error('render failed');return this.content;}
  }
  globalThis.CONFIG={ChatMessage:{documentClass:Message}};
  globalThis.libWrapper={register:(_m,path,fn)=>{
    const keys=path.split('.'),method=keys.pop(),owner=keys.reduce((o,k)=>o[k],globalThis),original=owner[method];
    owner[method]=function(...args){return fn.call(this,original.bind(this),...args);};
  }};
  registerChatResultDelay();const ready=hooks.get('ready')();
  const result=(id)=>`<div data-pneuma-roll-result="${id}">${id}</div>`;
  return {Message,result,hooks,nodes,ready,get saved(){return seconds;},get setting(){return setting;},setDelay:value=>seconds=value};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};

for(const [saved,expected] of [['2','2.0'],['5.5','5.0'],['6','5.0']])test(`existing ${saved}-second choice normalizes to ${expected}`,async t=>{
  const c=client(t,saved,[],true);await c.ready;assert.equal(c.saved,expected);
});
test('legacy six-second value is capped at five even before GM migration',async t=>{
  const c=client(t,'6'),m=new c.Message(c.result('cap'));const pending=m.getHTML();
  t.mock.timers.tick(4999);await flush();assert.equal(m.calls,0);
  t.mock.timers.tick(1);await pending;assert.equal(m.calls,1);
});

test('world dropdown has all eleven half-second choices in display order and defaults off',t=>{
  const c=client(t);assert.equal(c.setting.scope,'world');assert.equal(c.setting.default,'0.0');
  assert.deepEqual(Object.keys(c.setting.choices).map(Number),Array.from({length:11},(_,i)=>i/2));
  const roll={};assert.equal(markRollResult('<div>12</div>',roll),markRollResult('<div>12</div>',roll));
  assert.notEqual(markRollResult('<div>12</div>',roll),markRollResult('<div>12</div>',{}));
});
test('new results wait, preserve prior cards, and leave sidebar/popout controls unchanged',async t=>{
  const c=client(t),m=new c.Message(c.result('attack'));let output;
  const pending=m.getHTML().then(v=>output=v);assert.equal(m.calls,0);assert.deepEqual(c.nodes.map(n=>n.inert),[false,true]);
  t.mock.timers.tick(999);await flush();assert.equal(output,undefined);
  t.mock.timers.tick(1);await pending;assert.equal(output,m.content);assert.deepEqual(c.nodes.map(n=>n.inert),[false,true]);
  await m.getHTML();assert.equal(m.calls,2,'rerender does not repeat pause');
  m.content+='<button>Applied</button>';await m.getHTML();assert.equal(m.calls,3,'non-roll update is immediate');
});
test('overlapping renders and a second result share deadlines without locking controls',async t=>{
  const c=client(t),m=new c.Message(c.result('attack'));
  const first=m.getHTML();t.mock.timers.tick(500);
  m.content+=c.result('damage');c.hooks.get('updateChatMessage')(m);const second=m.getHTML();
  t.mock.timers.tick(500);await flush();assert.equal(m.calls,0);assert.deepEqual(c.nodes.map(n=>n.inert),[false,true]);
  t.mock.timers.tick(500);await Promise.all([first,second]);assert.equal(m.calls,2);assert.equal(c.nodes[0].inert,false);
});
test('saved history and concealed pending attack do not start a timer until revealed',async t=>{
  const html='<div data-pneuma-roll-result="old">Old</div>';
  const c=client(t,'1',[{id:'card',content:html,flags:{'pneuma-combattools':{exchange:{html:'<div data-pneuma-roll-result="secret">secret</div>'}}}}]);
  const m=new c.Message(html);await m.getHTML();assert.equal(m.calls,1);
  m.content+=c.result('secret');const pending=m.getHTML();assert.equal(m.calls,1);
  t.mock.timers.tick(1000);await pending;assert.equal(m.calls,2);
});
test('attached effects wait even when message content does not change',async t=>{
  const c=client(t),m=new c.Message('Attack');await m.getHTML();
  m.flags={'pneuma-combattools':{attachedEffects:{target:{effect:{html:c.result('resist')}}}}};
  const pending=m.getHTML();assert.equal(m.calls,1);t.mock.timers.tick(1000);await pending;assert.equal(m.calls,2);
});
test('disabled setting, ordinary messages, and private content bypass delay',async t=>{
  const c=client(t,'0'),m=new c.Message(c.result('off'));await m.getHTML();assert.equal(m.calls,1);
  c.setDelay('6');const ordinary=new c.Message('No roll');await ordinary.getHTML();assert.equal(ordinary.calls,1);
  const hidden=new c.Message(c.result('hidden'));hidden.isContentVisible=false;await hidden.getHTML();assert.equal(hidden.calls,1);
  const blind=new c.Message(c.result('blind'));blind.blind=true;await blind.getHTML();assert.equal(blind.calls,1);
});
test('render failure leaves existing controls unchanged',async t=>{
  const c=client(t,'0.5'),m=new c.Message(c.result('failure'));m.fail=true;
  const pending=assert.rejects(m.getHTML(),/render failed/);t.mock.timers.tick(500);await pending;assert.equal(c.nodes[0].inert,false);
});
