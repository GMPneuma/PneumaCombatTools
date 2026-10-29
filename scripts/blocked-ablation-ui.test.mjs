import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';

const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
for(const key of ['PNEUMA_CPR_ACTOR_SOURCE','PNEUMA_CPR_CHAT_SOURCE','PNEUMA_CPR_DAMAGE_TEMPLATE','PNEUMA_HANDLEBARS_SOURCE'])
  assert.ok(process.env[key],`Set ${key} for the native blocked-ablation browser fixture`);
const method=(source,name)=>{
  const start=source.indexOf('  '+name+'(');assert.ok(start>=0,'Missing native '+name);
  return source.slice(start,source.indexOf('\n  }',start)+4);
};
const actorSource=await readFile(process.env.PNEUMA_CPR_ACTOR_SOURCE,'utf8');
const chatSource=await readFile(process.env.PNEUMA_CPR_CHAT_SOURCE,'utf8');
const template=await readFile(process.env.PNEUMA_CPR_DAMAGE_TEMPLATE,'utf8');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage();
  await page.evaluate(installMockLibWrapper);
  await page.addScriptTag({content:await readFile(process.env.PNEUMA_HANDLEBARS_SOURCE,'utf8')});
  await page.evaluate(template=>{
    window.FormApplication=class {};
    window.Hooks={callAll(){}};
    window.foundry={utils:{getProperty:(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object)}};
    window.game={system:{id:'cyberpunk-red-core'},settings:{get:()=>true},i18n:{localize:key=>key}};
    window.hasInjury=()=>false;
    Handlebars.registerHelper('localize',key=>key);
    Handlebars.registerHelper('cprFindConfigValue',(_type,key)=>key);
    Handlebars.registerHelper('cprMath',(op,a,b)=>{assertOperation(op==='subtract');return a-b;});
    function assertOperation(valid){if(!valid)throw Error('Unexpected native template operation');}
    Handlebars.registerHelper('cprCompare',(a,op,b)=>{
      switch(op){case '==':return a==b;case '===':return a===b;case '!==':return a!==b;case '&&':return a&&b;case '<=':return a<=b;case '>':return a>b;default:throw Error('Unhandled comparison '+op);}
    });
    const render=Handlebars.compile(template);
    window.renderTemplate=async(_path,data)=>render(data);
  },template);
  const sources=await Promise.all(['actor-mutation','native-wrappers','damage-application','native-effect-integration']
    .map(name=>readFile('dist/scripts/'+name+'.js','utf8')));
  await page.addScriptTag({type:'module',content:sources.map(source=>source.replace(/^import .*$/gm,'')).join('\n')
    +'\nObject.assign(window,{installNativeEffectIntegration,captureWithChat});'});
  await page.waitForFunction(()=>!!window.captureWithChat);
  const results=await page.evaluate(async([applySource,renderSource])=>{
    const messages=[];
    window.ChatMessage={create:async data=>{
      const message={...data,async update(changes){Object.assign(this,changes);}};
      messages.push(message);return message;
    }};
    const chat={RenderRollCard(){},damageApplication(){},
      ChatDataSetup:content=>({content,whisper:['gm'],blind:true,speaker:{alias:'Native target'}}),
      RenderDamageApplicationCard:Function('return class NativeChat {'+renderSource+'}')().RenderDamageApplicationCard};
    const apply=Function('CPRChat','CPRActorUtils','return ({'+applySource+'})._applyDamage')
      (chat,{calculateArmorSP:async armor=>armor.system.bodyLocation.sp-armor.system.bodyLocation.ablation});
    class Actor {
      constructor(id){
        this.id=id;this.uuid='Actor.'+id;this.name='Armored target';
        this.system={derivedStats:{hp:{value:40}}};this.itemTypes={role:[]};
        this.armor={system:{bodyLocation:{sp:11,ablation:0}}};
      }
      getEquippedArmors(location){return location==='body'?[this.armor]:[];}
      async update(data){this.system.derivedStats.hp.value=data['system.derivedStats.hp.value'];}
      async _ablateArmor(_location,amount){this.armor.system.bodyLocation.ablation+=amount;}
    }
    Actor.prototype._applyDamage=apply;
    installNativeEffectIntegration(chat,{showDialog:async data=>data},Actor.prototype);
    const rows=[];
    for(const enabled of [false,true])for(const managed of [false,true])for(const bonus of [0,5]){
      game.settings.get=()=>enabled;
      const actor=new Actor('target-'+rows.length),before=messages.length;
      const run=view=>actor._applyDamage.call(view,8,bonus,'body',2,'',0,0,true,{useShield:false,damageReductionRole:false,damageReductionAE:false});
      let html;
      if(managed){
        const receipts=await captureWithChat(chat,actor,actor.name,'body','blocked-'+rows.length,run);
        html=receipts[0];
      }else{
        await run(actor);await new Promise(resolve=>setTimeout(resolve,0));html=messages.at(-1).content;
      }
      const root=new DOMParser().parseFromString(html,'text/html');
      const undo=root.querySelector('[data-action="reverseDamage"]');
      const notes=[...root.querySelectorAll('.pneuma-blocked-armor-note')].map(node=>node.textContent);
      rows.push({enabled,managed,bonus,hp:actor.system.derivedStats.hp.value,ablation:actor.armor.system.bodyLocation.ablation,
        undo:{hp:Number(undo.dataset.hpReduction),ablation:Number(undo.dataset.ablation),location:undo.dataset.location},notes,
        misleading:root.body.textContent.includes('CPR.chat.damageApplication.damageNegatedByDamageReduction'),
        details:!!root.querySelector(managed?'.pneuma-applied-details.hide':'.d6-data-details.hide'),
        messages:messages.length-before,visibility:managed?null:{blind:messages.at(-1).blind,whisper:messages.at(-1).whisper,speaker:messages.at(-1).speaker}});
    }
    return rows;
  },[method(actorSource,'async _applyDamage'),method(chatSource,'static RenderDamageApplicationCard')]);
  for(const row of results){
    assert.equal(row.hp,40-row.bonus);assert.equal(row.ablation,row.enabled?2:0);
    assert.deepEqual(row.undo,{hp:row.bonus,ablation:row.enabled?2:0,location:'body'});
    assert.deepEqual(row.notes,row.enabled?['Armor stopped the hit; homebrew armor ablation applies.']:[]);
    assert.equal(row.misleading,false);assert.equal(row.details,true);
    assert.equal(row.messages,row.managed?0:1,'Managed capture must suppress duplicate native messages');
    if(!row.managed)assert.deepEqual(row.visibility,{blind:true,whisper:['gm'],speaker:{alias:'Native target'}});
  }
  console.log('Native blocked-ablation receipts passed: enabled/disabled, native/managed, critical bonus HP, Undo values, correct explanation, details and visibility.');
} finally {await browser.close();}
