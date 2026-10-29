import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';

globalThis.FormApplication=class {};
globalThis.foundry={utils:{getProperty:(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object)}};
globalThis.Hooks={callAll(){}};
const {installNativeEffectIntegration}=await import('../dist/scripts/native-effect-integration.js');
let serial=0,enabled=false;
globalThis.game={settings:{get:(_module,key)=>key==='ablateBlockedHits'&&enabled},messages:new Map()};
const options={useShield:false,damageReductionRole:false,damageReductionAE:false};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

function fixture({on=true,receipt={},mode='blocked',delay,failAblation,failRender}={}) {
  enabled=on;installMockLibWrapper();
  const cards=[],calls=[],events=[];
  const chat={
    RenderRollCard(){},async damageApplication(event){
      const form=await dialog.showDialog({});
      await actor._applyDamage(8,0,"body",2,"",0,0,true,form);
    },
    RenderDamageApplicationCard(data){
      if(failRender)throw Error('receipt failure');
      cards.push({...data});events.push('receipt');
    }
  };
  class Actor {
    constructor(){this.uuid='Actor.blocked-fixture-'+(++serial);this.system={derivedStats:{hp:{value:40}}};this.ablation={body:0,head:0};}
    async _ablateArmor(location,amount){
      events.push('ablate-start');calls.push([location,amount]);
      if(delay)await delay();
      if(failAblation)throw Error('armor failure');
      this.ablation[location]=(this.ablation[location]??0)+amount;events.push('ablate-end');
    }
    async _applyDamage(damage,bonus,location,amount){
      events.push('apply-start');
      const data={actor:this,damage,bonusDamage:bonus,location,hpReduction:bonus,rawDamageDealt:0,
        ablation:0,shieldAblation:0,armorData:{equipped:true,value:11},...receipt};
      if(mode==='penetrated'){
        data.rawDamageDealt=4;data.hpReduction=4+bonus;
        await this._ablateArmor(location,amount);data.ablation=amount;
      }
      if(mode==='shield')delete data.rawDamageDealt;
      this.system.derivedStats.hp.value-=data.hpReduction;
      // CPR does not await its renderer; the integration must own pending work.
      chat.RenderDamageApplicationCard(data);
      events.push('apply-end');
    }
  }
  const dialog={showDialog:async data=>{await tick();return {...data}}};
  installNativeEffectIntegration(chat,dialog,Actor.prototype);
  const actor=new Actor();
  return {actor,cards,calls,events,chat,Actor,apply:(damage=8,amount=1,location='body',bonus=0)=>actor._applyDamage(damage,bonus,location,amount,'',0,0,true,options)};
}

test('blocked-hit ablation is disabled by default and preserves the native receipt',async()=>{
  const f=fixture({on:false});await f.apply();
  assert.deepEqual(f.calls,[]);assert.equal(f.cards[0].ablation,0);assert.equal(f.actor.system.derivedStats.hp.value,40);
});

test('blocked hits use their original normal or AP ablation at the damaged location',async()=>{
  for(const [location,amount] of [['body',1],['head',2]]){
    const f=fixture();await f.apply(8,amount,location);
    assert.deepEqual(f.calls,[[location,amount]]);assert.equal(f.cards[0].ablation,amount);
    assert.equal(f.cards[0].rawDamageDealt,0);assert.equal(f.actor.system.derivedStats.hp.value,40);
    assert.ok(f.events.indexOf('ablate-end')<f.events.indexOf('receipt'));
  }
});

test('penetrating damage retains exactly one native ablation',async()=>{
  const f=fixture({mode:'penetrated'});await f.apply(15,2);
  assert.deepEqual(f.calls,[['body',2]]);assert.equal(f.cards[0].ablation,2);assert.equal(f.actor.system.derivedStats.hp.value,36);
});

test('critical bonus damage does not suppress ablation of the blocked ordinary damage',async()=>{
  const f=fixture();await f.apply(8,1,'body',5);
  assert.equal(f.actor.system.derivedStats.hp.value,35);assert.equal(f.cards[0].hpReduction,5);
  assert.equal(f.cards[0].rawDamageDealt,0);assert.deepEqual(f.calls,[['body',1]]);
});

test('zero ablation remains authoritative for bypass, MA exemption and Cover Up',async()=>{
  const f=fixture();await f.apply(8,0);
  assert.deepEqual(f.calls,[]);assert.equal(f.cards[0].ablation,0);
});

test('shield-stopped, brain, unarmored, exhausted-armor and zero-damage receipts do not ablate',async()=>{
  const cases=[
    {mode:'shield',receipt:{shieldAblation:8}},
    {receipt:{location:'brain',rawDamageDealt:undefined}},
    {receipt:{armorData:{equipped:false,value:0}}},
    {receipt:{armorData:{equipped:true,value:0}}},
    {damage:0,bonus:5}
  ];
  for(const entry of cases){
    const f=fixture(entry);await f.apply(entry.damage??8,1,'body',entry.bonus??0);
    assert.deepEqual(f.calls,[]);assert.equal(f.cards[0].ablation,0);
  }
});

test('destroyed explosive shields can still leave a blocked hit against worn armor',async()=>{
  const f=fixture({receipt:{shieldAblation:8}});await f.apply();
  assert.deepEqual(f.calls,[['body',1]]);assert.equal(f.cards[0].shieldAblation,8);
});

test('same-actor applications wait for ablation and their corrected receipt before continuing',async()=>{
  let release;const gate=new Promise(resolve=>release=resolve);let waits=0;
  const f=fixture({delay:()=>++waits===1?gate:Promise.resolve()});
  const first=f.apply(8,1),second=f.apply(8,2);
  await tick();assert.equal(f.events.filter(value=>value==='apply-start').length,1);assert.equal(f.cards.length,0);
  release();await Promise.all([first,second]);
  assert.deepEqual(f.calls,[['body',1],['body',2]]);assert.deepEqual(f.cards.map(card=>card.ablation),[1,2]);
  assert.ok(f.events.indexOf('receipt')<f.events.lastIndexOf('apply-start'));
});

test('independent actors keep their ablation amounts when applications overlap',async()=>{
  let release;const gate=new Promise(resolve=>release=resolve);let waits=0;
  const f=fixture({delay:()=>++waits===1?gate:Promise.resolve()}),other=new f.Actor();
  const first=f.apply(8,1);await tick();
  await other._applyDamage(8,0,'head',2,'',0,0,true,options);
  assert.equal(other.ablation.head,2);assert.equal(f.actor.ablation.body,0);
  release();await first;
  assert.deepEqual(f.cards.map(card=>[card.actor.uuid,card.location,card.ablation]),[[other.uuid,'head',2],[f.actor.uuid,'body',1]]);
});

test('ablation and receipt failures reject the owning application without repeating mutations',async()=>{
  const armor=fixture({failAblation:true});await assert.rejects(armor.apply(),/armor failure/);
  assert.equal(armor.cards.length,0);assert.deepEqual(armor.calls,[['body',1]]);
  const receipt=fixture({failRender:true});await assert.rejects(receipt.apply(),/receipt failure/);
  assert.equal(receipt.actor.ablation.body,1);assert.deepEqual(receipt.calls,[['body',1]]);
});

const nativeSource=process.env.PNEUMA_CPR_ACTOR_SOURCE?await readFile(process.env.PNEUMA_CPR_ACTOR_SOURCE,'utf8'):null;
function nativeMethod(name){
  const start=nativeSource.indexOf('  '+name+'(');assert.ok(start>=0,'Missing native '+name);
  const end=nativeSource.indexOf('\n  }',start);assert.ok(end>start);
  return nativeSource.slice(start,end+4);
}
function nativeFixture({on=true,body=[11],head=[],shield=0,reduction=0}={}){
  enabled=on;installMockLibWrapper();const cards=[],calls=[];
  const chat={RenderRollCard(){},damageApplication(){},RenderDamageApplicationCard:data=>cards.push({...data})};
  const utils={calculateArmorSP:async(armor,location,current=false)=>armor.system[location+'Location'].sp-(current?armor.system[location+'Location'].ablation:0)};
  const methods=['async _applyDamage','async _ablateArmor','getEquippedArmors','async _reverseDamage'].map(nativeMethod);
  const native=Function('CPRChat','CPRActorUtils','return ({'+methods.join(',')+'})')(chat,utils);
  const armor=(location,sp,equipped='equipped')=>({id:'armor-'+(++serial),system:{equipped,isBodyLocation:location==='body',isHeadLocation:location==='head',
    isShield:location==='shield',[location+'Location']:{sp,ablation:0},shieldHitPoints:{value:sp,max:sp}}});
  const armors=[...body.map(sp=>armor('body',sp)),...head.map(sp=>armor('head',sp))];
  if(shield)armors.push(armor('shield',shield));
  const spare=armor('body',11,'owned');armors.push(spare);
  const set=(object,path,value)=>{const keys=path.split('.');const last=keys.pop();for(const key of keys)object=object[key];object[last]=value;};
  const actor={...native,uuid:'Actor.native-blocked-'+(++serial),itemTypes:{armor:armors,role:[]},bonuses:{universalDamageReduction:reduction},
    system:{derivedStats:{hp:{value:50,max:50}},externalData:{currentArmorBody:{value:Math.max(0,...body),max:Math.max(0,...body)},
      currentArmorHead:{value:Math.max(0,...head),max:Math.max(0,...head)},currentArmorShield:{value:shield,max:shield}}},
    async update(changes){for(const [key,value] of Object.entries(changes))set(this,key,value);},
    async updateEmbeddedDocuments(_type,rows){for(const row of rows)armors.find(item=>item.id===row._id).system=structuredClone(row.system);},
    async _ablateArmor(location,amount){calls.push([location,amount]);return native._ablateArmor.call(this,location,amount);}
  };
  installNativeEffectIntegration(chat,{showDialog:async data=>data},actor);
  const apply=({damage=8,bonus=0,location='body',ablation=1,ammo='',ignore=0,below=0,lethal=true,useShield=false}={})=>
    actor._applyDamage(damage,bonus,location,ablation,ammo,ignore,below,lethal,{...options,useShield,damageReductionAE:reduction>0});
  return {actor,cards,calls,armors,spare,apply};
}
const nativeOptions={skip:!nativeSource&&'Set PNEUMA_CPR_ACTOR_SOURCE to official CPR v0.92.4 cpr-actor.js'};

test('native CPR blocked normal/AP hits ablate equipped layers and native Undo restores them',nativeOptions,async()=>{
  for(const amount of [1,2]){
    const f=nativeFixture({body:[7,11],head:[11]});await f.apply({ablation:amount});
    assert.equal(f.actor.system.derivedStats.hp.value,50);assert.deepEqual(f.calls,[['body',amount]]);
    assert.deepEqual(f.armors.map(item=>(item.system.bodyLocation??item.system.headLocation).ablation),[amount,amount,0,0]);
    const card=f.cards[0];assert.equal(card.ablation,amount);assert.equal(card.rawDamageDealt,0);
    await f.actor._reverseDamage(card.hpReduction,card.location,card.ablation,card.shieldAblation);
    assert.equal(f.actor.system.derivedStats.hp.value,50);
    assert.deepEqual(f.armors.map(item=>(item.system.bodyLocation??item.system.headLocation).ablation),[0,0,0,0]);
  }
});

test('native CPR keeps off, penetrating, half-SP, threshold bypass and zero-ablation outcomes',nativeOptions,async()=>{
  const cases=[
    {on:false,damage:8,expectedHp:50,expectedAblation:0},
    {damage:15,ablation:2,expectedHp:46,expectedAblation:2},
    {damage:6,ignore:50,expectedHp:50,expectedAblation:1},
    {damage:7,ignore:50,expectedHp:49,expectedAblation:1},
    {damage:8,ignore:100,ablation:0,expectedHp:42,expectedAblation:0},
    {damage:8,below:12,expectedHp:42,expectedAblation:1},
    {damage:8,ablation:0,expectedHp:50,expectedAblation:0},
    {damage:8,ignore:-100,ablation:0,expectedHp:50,expectedAblation:0}
  ];
  for(const entry of cases){
    const f=nativeFixture({on:entry.on??true});await f.apply(entry);
    assert.equal(f.actor.system.derivedStats.hp.value,entry.expectedHp,JSON.stringify(entry));
    assert.equal(f.armors[0].system.bodyLocation.ablation,entry.expectedAblation,JSON.stringify(entry));
    assert.equal(f.cards[0].ablation,entry.expectedAblation);
    assert.ok(f.calls.filter(([location])=>location==='body').length<=1,'No double armor ablation');
  }
});

test('native CPR critical-only HP loss, head armor and damage reduction retain native damage',nativeOptions,async()=>{
  const blocked=nativeFixture({head:[11]});await blocked.apply({location:'head',damage:8,bonus:5,ablation:2});
  assert.equal(blocked.actor.system.derivedStats.hp.value,45);assert.deepEqual(blocked.calls,[['head',2]]);
  const reduced=nativeFixture({reduction:5});await reduced.apply({damage:15});
  assert.equal(reduced.actor.system.derivedStats.hp.value,50);assert.equal(reduced.cards[0].rawDamageDealt,4);
  assert.deepEqual(reduced.calls,[['body',1]],'Penetration stopped by damage reduction already ablates natively');
  const zero=nativeFixture();await zero.apply({damage:0,bonus:5});
  assert.equal(zero.actor.system.derivedStats.hp.value,45);assert.deepEqual(zero.calls,[]);
});

test('native CPR shields stop normal hits; destroyed explosive shields still expose armor',nativeOptions,async()=>{
  for(const entry of [
    {shield:5,ammo:'',expectedArmor:0},
    {shield:20,ammo:'grenade',expectedArmor:0},
    {shield:5,ammo:'grenade',expectedArmor:1},
    {shield:5,ammo:'rocket',expectedArmor:1}
  ]){
    const f=nativeFixture({shield:entry.shield});await f.apply({ammo:entry.ammo,useShield:true});
    assert.equal(f.actor.system.derivedStats.hp.value,50);assert.equal(f.armors[0].system.bodyLocation.ablation,entry.expectedArmor);
    assert.equal(f.cards[0].ablation,entry.expectedArmor);assert.equal(f.cards[0].shieldAblation,Math.min(8,entry.shield));
  }
});

test('Always Ablate unchecked restores normal blocked and penetrating behavior',async()=>{
 for(const mode of ['blocked','penetrated'])for(const always of [false,true]){
 const f=fixture({mode});await f.actor._applyDamage(8,0,'body',2,'',0,0,true,{...options,pneumaAlwaysAblate:always});
 assert.deepEqual(f.calls,mode==='penetrated'||always?[['body',2]]:[]);
 }
});

test('native damage dialog retains the clicked Always Ablate choice across awaits',async()=>{
 globalThis.Element=class {constructor(always){this.always=always;this.dataset={}}closest(){return this}querySelector(){return {getAttribute:()=>String(this.always)}}};
 for(const always of [false,true]){const f=fixture();const target=new Element(always);const pending=f.chat.damageApplication({currentTarget:target});target.always=!always;await pending;assert.deepEqual(f.calls,always?[['body',2]]:[]);}
});
