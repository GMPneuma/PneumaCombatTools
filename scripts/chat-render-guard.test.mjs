import test from 'node:test';
import assert from 'node:assert/strict';
import {installChatRenderGuard} from '../dist/scripts/chat-render-guard.js';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';

const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function fixture(guard=true) {
  // Foundry v12 ChatLog: postOne queues insertion; updateMessage checks for a
  // mounted card before awaiting getHTML and calls postOne when none exists.
  class Log {
    cards=[]; queue=Promise.resolve();
    postOne(message) {
      const work=this.queue.then(async()=>{
        const html=await message.getHTML();this.cards.push({id:message.id,html});
        if(this.popout)await this.popout.postOne(message);
      });
      this.queue=work.catch(()=>{});return work;
    }
    async updateMessage(message) {
      const old=this.cards.find(card=>card.id===message.id);
      if(old){const html=await message.getHTML();const index=this.cards.indexOf(old);if(index>=0)this.cards.splice(index,1,{id:message.id,html});}
      else await this.postOne(message);
      if(this.popout)await this.popout.updateMessage(message);
    }
  }
  if(guard){installMockLibWrapper();installChatRenderGuard(Log.prototype);}
  let release;const gate=new Promise(resolve=>release=resolve);
  const message={id:'attack',content:'waiting',async getHTML(){await gate;return this.content;}};
  return {Log,message,release};
}
test('reproduces native duplicate when update arrives before initial insertion',async()=>{
  const {Log,message,release}=fixture(false),log=new Log();
  const post=log.postOne(message);await flush();const update=log.updateMessage(message);
  release();await Promise.all([post,update]);assert.equal(log.cards.length,2);
});
test('initial post and overlapping updates keep one latest card in sidebar and popout',async()=>{
  const {Log,message,release}=fixture(),log=new Log();log.popout=new Log();
  const post=log.postOne(message);await flush();
  message.content='resolved';const first=log.updateMessage(message),second=log.updateMessage(message);
  release();await Promise.all([post,first,second]);
  for(const target of [log,log.popout])assert.deepEqual(target.cards,[{id:'attack',html:'resolved'}]);
});
test('overlapping posts coalesce; a missing updated card still inserts',async()=>{
  const {Log,message,release}=fixture(),log=new Log();
  const first=log.postOne(message),second=log.postOne(message);release();await Promise.all([first,second]);
  assert.equal(log.cards.length,1);
  await log.updateMessage({...message,id:'new'});assert.equal(log.cards.length,2);
});
test('overlapping replacements use the mounted latest node',async()=>{
  const {Log,message,release}=fixture(),log=new Log();release();await log.postOne(message);
  let finish;const pause=new Promise(resolve=>finish=resolve);let renders=0;
  message.getHTML=async()=>{const content=message.content;if(++renders===1)await pause;return content;};
  message.content='first';const first=log.updateMessage(message);await flush();
  message.content='latest';const second=log.updateMessage(message);finish();await Promise.all([first,second]);
  assert.deepEqual(log.cards,[{id:'attack',html:'latest'}]);
});
test('failed render releases pending state so a later update can recover',async()=>{
  const {Log,message,release}=fixture(),log=new Log();release();
  const normal=message.getHTML;message.getHTML=async()=>{throw Error('render failed');};
  await assert.rejects(log.postOne(message),/render failed/);
  message.getHTML=normal;await log.updateMessage(message);assert.equal(log.cards.length,1);
});
