import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sectionColors,statusColor,validateStatusColor,iconWell,setStatusColorRows,colorForEffect,colorTokenEffects} from '../dist/scripts/status-colors.js';
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
test('token sprites follow effect indexes and aliases without changing effect documents or red addictions',()=>{
 setStatusColorRows([{id:'one',aliases:['native-one'],name:'One',tab:'module'},{id:'user',name:'User',tab:'custom',color:'#ff0000'},{id:'addiction',name:'Addiction',tab:'native',group:'addiction'}]);
 const effects=[{statuses:new Set(['native-one']),img:'same.svg'},{statuses:new Set(['user']),img:'same.svg'},{statuses:new Set(['addiction']),tint:'#ff0000'}];
 const before=structuredClone(effects);
 const sprites=[{zIndex:-1},{zIndex:2,tint:123},{zIndex:0,tint:0},{zIndex:1,tint:0,alpha:.8}];
 globalThis.PIXI={filters:{ColorMatrixFilter:class{}}};
 colorTokenEffects({actor:{temporaryEffects:effects},effects:{children:sprites}});
 assert.equal(sprites[0].filters,undefined);assert.equal(sprites[1].filters,undefined);assert.equal(sprites[1].tint,123);
 assert.equal(sprites[2].filters[0].matrix[4],17/255);assert.equal(sprites[3].filters[0].matrix[4],1);
 assert.equal(sprites[3].alpha,.8);assert.deepEqual(effects,before);
 assert.equal(colorForEffect({statuses:new Set(),name:'One'}),'#112233');
 assert.equal(colorForEffect({statuses:new Set(['one','addiction'])}),undefined);
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
