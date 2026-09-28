import assert from 'node:assert/strict';
import {test} from 'node:test';
import {findNativeItem, nativeItemMatches, nativeCriticalTable} from '../dist/scripts/native-lookup.js';
import {getTable} from '../dist/scripts/dv-hover.js';

test('source identity wins over names and supports both Foundry source fields', () => {
  globalThis.game = {i18n:{localize:()=> 'Esquive'}};
  const named = {type:'skill',name:'Evasion'};
  for (const source of [{_stats:{compendiumSource:'Compendium.cyberpunk-red-core.skills.Item.CzaAkwAjPDplz4nn'}},
    {flags:{core:{sourceId:'Compendium.cyberpunk-red-core.skills.CzaAkwAjPDplz4nn'}}}]) {
    const translated = {type:'skill',name:'Renamed skill',...source};
    assert.equal(findNativeItem([named,translated],'Evasion'),translated);
    assert.equal(nativeItemMatches({...translated,type:'weapon'},'Evasion'),false);
  }
  assert.equal(nativeItemMatches({type:'skill',name:'Esquive'},'Evasion'),true);
  assert.equal(nativeItemMatches(named,'Evasion'),true);
  assert.equal(nativeItemMatches({type:'skill',name:'Other'},'Evasion'),false);
  for(const [name,type,id] of [['Netrunner','role','g5S5E8UG1QJ4yFsp'],['Targeting Scope','cyberware','wFp72x2FXhipZXPj']])
    assert.equal(nativeItemMatches({type,name:'Translated',flags:{core:{sourceId:`Compendium.cyberpunk-red-core.items.${id}`}}},name),true);
});

test('translated grenade tables resolve by ID, remain cached, and preserve overrides', async () => {
  let reads=0, configured='cyberpunk-red-core.internal_dv-tables', world;
  const native={collection:configured,documentName:'RollTable',getIndex:async()=>[{_id:'3L5kZ8iP1Xxb6yfQ',name:'Arme lancée'}],
    getDocument:async id=>{reads++;return {id};}};
  const custom={collection:'custom.tables',documentName:'RollTable',getIndex:async()=>[{_id:'custom',name:'DV Thrown Weapon'}],getDocument:async id=>({id})};
  globalThis.game={settings:{get:()=>configured},tables:{getName:()=>world},packs:new Map([[native.collection,native],[custom.collection,custom]])};
  assert.equal((await getTable('DV Thrown Weapon')).id,'3L5kZ8iP1Xxb6yfQ');
  await getTable('DV Thrown Weapon');assert.equal(reads,1);
  world={id:'world'};assert.equal(await getTable('DV Thrown Weapon'),world);
  world=undefined;configured=custom.collection;
  assert.equal((await getTable('DV Thrown Weapon')).id,'custom');
  assert.equal(await getTable('DV Grenade Launcher'),undefined,'custom packs do not silently use native tables');
});

test('critical table identity is used only for the native pack', async () => {
  const ids=[];
  globalThis.game={packs:new Map([['cyberpunk-red-core.internal_critical-injury-tables',{getDocument:async id=>{ids.push(id);return {id};}}]])};
  assert.equal((await nativeCriticalTable('cyberpunk-red-core.internal_critical-injury-tables','head')).id,'QiwaqQtocypL0FXG');
  assert.equal((await nativeCriticalTable('cyberpunk-red-core.internal_critical-injury-tables','body')).id,'n7IlIvMfg7yW1OoE');
  assert.equal(await nativeCriticalTable('custom.tables','head'),undefined);
  assert.equal(ids.length,2);
});
