import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sectionColors,statusColor,validateStatusColor,iconWell,setStatusColorRows,colorForEffect} from '../dist/scripts/status-colors.js';
const colors={native:'#abcdef','native-empty':'#123456',module:'#112233',custom:'#445566'};
globalThis.game={settings:{get:()=>colors}};
test('section defaults, per-user priority and addiction protection',()=>{
 assert.deepEqual(sectionColors(),colors);
 assert.equal(statusColor({tab:'custom',color:'#AABBCC'}),'#aabbcc');
 assert.equal(statusColor({tab:'custom'}),'#445566');
 assert.equal(statusColor({tab:'native',color:'#ffffff'}),'#abcdef');
 assert.equal(statusColor({tab:'native',group:'addiction'}),undefined);
 assert.equal(validateStatusColor(''),undefined);assert.throws(()=>validateStatusColor('red'));
 assert.equal(iconWell('#ffffff'),'#242424');assert.equal(iconWell('#000000'),'#eeeeee');
});
test('effect matching respects aliases, names and addiction protection',()=>{
 setStatusColorRows([{id:'one',aliases:['native-one'],name:'One',img:'glyph.svg',tab:'module'},{id:'addiction',name:'Addiction',tab:'native',group:'addiction'}]);
 assert.equal(colorForEffect({statuses:new Set(['native-one'])}),'#112233');
 assert.equal(colorForEffect({statuses:new Set(),name:'One'}),'#112233');
 assert.equal(colorForEffect({statuses:new Set(['one','addiction'])}),undefined);
 assert.equal(colorForEffect({statuses:new Set(['unknown']),name:'Unknown'}),undefined);
});

test('unset sections share grey while explicit user colors retain priority',()=>{
 const original=game.settings.get;game.settings.get=()=>undefined;
 try {
  assert.deepEqual(Object.values(sectionColors()),['#888888','#888888','#888888','#888888']);
  assert.equal(statusColor({tab:'custom'}),'#888888');
  assert.equal(statusColor({tab:'custom',color:'#ffffff'}),'#ffffff');
  assert.equal(statusColor({tab:'module',group:'addiction'}),undefined);
 }finally{game.settings.get=original;}
});
