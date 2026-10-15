import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {installChatRenderGuard} from '../dist/scripts/chat-render-guard.js';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
import {registerChatResultDelay} from '../dist/scripts/chat-result-delay.js';

const path=process.env.PNEUMA_FOUNDRY_SOURCE||join(process.env.LOCALAPPDATA||'', 'Temp','pneuma-foundry-v12-keybinding-source.js');
const native=await readFile(path,'utf8').catch(()=>undefined);
const flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
function fixture(guard) {
  // Execute the actual installed/cached v12 methods, not rewritten equivalents.
  const method=name=>{const start=native.indexOf(`  async ${name}(`,native.indexOf('class ChatLog '));return native.slice(start,native.indexOf('\n  /* -------------------------------------------- */',start));};
  const game={user:{id:'player',_id:'player'},messages:{contents:[]}};
  const Log=Function('game',`return class {
    cards=[]; tail=Promise.resolve(); isAtBottom=false; popOut=false;
    #renderingQueue={add:work=>{const next=this.tail.then(work);this.tail=next.catch(()=>{});return next;}};
    element={find:selector=>this.find(selector)};
    find(selector){
      if(selector==='#chat-log')return {append:html=>this.cards.push({...html})};
      const id=selector.match(/data-message-id="([^"]+)"/)?.[1];
      const matches=this.cards.filter(card=>card.id===id);
      return {length:matches.length,
        before:html=>{for(const card of matches)this.cards.splice(this.cards.indexOf(card),0,{...html});},
        replaceWith:html=>{for(const card of matches){const index=this.cards.indexOf(card);if(index>=0)this.cards.splice(index,1,{...html});}}};
    }
    notify(){} scrollBottom(){} setPosition(){}
    ${method('postOne')}
    ${method('updateMessage')}
  }`)(game);
  if(guard){installMockLibWrapper();installChatRenderGuard(Log.prototype);}
  const log=new Log();log._popout=new Log();
  let release;const pause=new Promise(resolve=>release=resolve);
  class Message {
    constructor(id){Object.assign(this,{id,visible:true,isContentVisible:true,content:'waiting',author:{_id:'gm'}});}
    async getHTML(){await pause;return {id:this.id,html:this.content};}
  }
  const message=id=>{
    const entry=new Message(id);
    game.messages.contents.push(entry);return entry;
  };
  return {log,message,release,Message,game};
}
for(const guard of [false,true])test(`native v12: x2 then later attacks while render queue is blocked, guard=${guard}`,{skip:!native},async()=>{
  const {log,message,release}=fixture(guard),pending=[];
  for(const id of ['x2-first','x2-second','single-1','single-2','single-3']){
    const card=message(id);pending.push(log.postOne(card));await flush();
    card.content='resolved';pending.push(log.updateMessage(card));await flush();
  }
  release();await Promise.all(pending);
  for(const target of [log,log._popout]){
    for(const id of ['x2-first','x2-second','single-1','single-2','single-3'])
      assert.equal(target.cards.filter(card=>card.id===id).length,guard?1:2,id);
  }
  // After the backlog drains, a fresh single attack does not inherit a duplicate state.
  const later=message('after-drain');await log.postOne(later);later.content='resolved';await log.updateMessage(later);
  for(const target of [log,log._popout])assert.equal(target.cards.filter(card=>card.id===later.id).length,1);
});
for(const seconds of ['0.0','0.5','5.0'])test(`native v12 plus actual result-delay wrapper: x2 and later single, delay=${seconds}`,{skip:!native},async t=>{
  t.mock.timers.enable({apis:['Date','setTimeout'],now:10000});
  const f=fixture(true);f.release();
  const hooks=new Map();
  globalThis.Hooks={on:(name,fn)=>hooks.set(name,fn),once:(name,fn)=>hooks.set(name,fn)};
  globalThis.foundry={utils:{getProperty:(object,path)=>path.split('.').reduce((v,k)=>v?.[k],object)}};
  f.game.settings={register(){},get:()=>seconds};f.game.messages[Symbol.iterator]=function*(){yield* this.contents;};
  globalThis.game=f.game;globalThis.CONFIG={ChatMessage:{documentClass:f.Message}};
  registerChatResultDelay();await hooks.get('ready')();
  const pending=[];
  for(const id of ['x2-first','x2-second','later-single']){
    const card=f.message(id);card.content=`<span data-pneuma-roll-result="${id}">attack</span>`;
    pending.push(f.log.postOne(card));await flush();
    card.content+=' resolved';hooks.get('updateChatMessage')(card);
    pending.push(f.log.updateMessage(card));await flush();
  }
  for(let i=0;i<8;i++){t.mock.timers.tick(5000);await flush();}
  await Promise.all(pending);
  for(const log of [f.log,f.log._popout]){
    assert.equal(log.cards.length,3);assert.equal(new Set(log.cards.map(c=>c.id)).size,3);
    assert.ok(log.cards.every(c=>c.html.endsWith(' resolved')));
  }
});
test('native v12: updates before initial posting and multiple resolution/damage refreshes', {skip:!native},async()=>{
  const {log,message,release}=fixture(true),card=message('attack');
  const first=log.updateMessage(card);await flush();const post=log.postOne(card);
  const updates=Array.from({length:5},()=>log.updateMessage(card));card.content='damage applied';
  release();await Promise.all([first,post,...updates]);
  for(const target of [log,log._popout])assert.deepEqual(target.cards,[{id:'attack',html:'damage applied'}]);
});
