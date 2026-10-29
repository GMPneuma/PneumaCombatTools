import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
import {installSelfOperationCapture,selfOperationUser,selfUserFromContent,markSelfContent} from '../dist/scripts/self-chat-operation.js';

test('Confirm captures each operation before release; delayed dice and HTML remain Self without leaking to another roll',async()=>{
 installMockLibWrapper();globalThis.game={user:{id:'roller'}};let held=false,finish;
 const gate=new Promise(resolve=>finish=resolve),played=[];
 const dice={handle3dDice:async(roll,mode)=>played.push({roll,mode})};
 class NativeRoll{
  handleRollDialog(){return true;}
  async roll(){await gate;this._roll={};await dice.handle3dDice(this._roll);this._critRoll={};await dice.handle3dDice(this._critRoll);}
 }
 class Dialog {constructor(roll){this.rollData=roll;}confirmDialog(){return true;}}
 Object.defineProperty(globalThis,'renderTemplate',{configurable:false,writable:false,value:async()=>'<div class="rollcard">result</div>'});
 globalThis.ChatMessage={create:async data=>data};
 const renderer={ChatDataSetup:content=>({content}),RenderRollCard:async()=>({content:'<div>public</div>'})};
 installSelfOperationCapture(Dialog.prototype,NativeRoll.prototype,dice,()=>held,renderer);
 const privateRoll=new NativeRoll(),publicRoll=new NativeRoll();
 held=true;new Dialog(privateRoll).confirmDialog();held=false;
 assert.equal(selfOperationUser(privateRoll),'roller');assert.equal(selfOperationUser(publicRoll),undefined);
 let nativeSetterCalls=0,value;
 Object.defineProperty(privateRoll,'_roll',{configurable:true,get:()=>value,set:next=>{nativeSetterCalls++;value=next;}});
 const work=Promise.all([privateRoll.roll(),publicRoll.roll()]);finish();await work;
 assert.equal(nativeSetterCalls,1);
 assert.deepEqual(played.filter(row=>selfOperationUser(row.roll)).map(row=>row.mode),['selfroll','selfroll']);
 assert.deepEqual(played.filter(row=>!selfOperationUser(row.roll)).map(row=>row.mode),[undefined,undefined]);
 privateRoll.wasCritical=()=>false;privateRoll.rollCard='native';
 const card=await renderer.RenderRollCard(privateRoll);
 assert.deepEqual(card.whisper,['roller']);assert.equal(card.blind,false);
 assert.equal(selfUserFromContent(card.content),'roller');
 assert.equal(selfUserFromContent((await renderer.RenderRollCard(publicRoll)).content),undefined);
 assert.equal(Object.getOwnPropertyDescriptor(globalThis,'renderTemplate').configurable,false);
 held=true;const fast=new NativeRoll();fast.handleRollDialog();held=false;assert.equal(selfOperationUser(fast),'roller');
});

test('official CPR Confirm resolves the tagged roll before asynchronous dialog closing',{
 skip:!process.env.PNEUMA_CPR_DIALOG_SOURCE
},async()=>{
 installMockLibWrapper();globalThis.game={user:{id:'owner'}};let held=true,resolved,close;
 const source=await readFile(process.env.PNEUMA_CPR_DIALOG_SOURCE,'utf8');
 const start=source.indexOf('  async confirmDialog(');assert.ok(start>0);
 const method=source.slice(start,source.indexOf('\n  }',start)+4);
 const dialog=Function('return ({'+method+'})')();
 const roll={},prototype={handleRollDialog(){},roll(){}},dice={handle3dDice(){}},renderer={RenderRollCard(){}};
 installSelfOperationCapture(dialog,prototype,dice,()=>held,renderer);
 const pending=dialog.confirmDialog.call({rollData:roll,options:{confirmDialog:()=>resolved=selfOperationUser(roll)},close:()=>new Promise(resolve=>close=resolve)});
 held=false;assert.equal(resolved,'owner');assert.equal(selfUserFromContent(markSelfContent('<div>attack</div>',roll)),'owner');close();await pending;
});
