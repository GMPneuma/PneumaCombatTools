import assert from 'node:assert/strict';
import {test} from 'node:test';
import {installMockLibWrapper} from './lib-wrapper-fixture.mjs';
import {DEFAULT_ICON_COLOR,installIconColorNormalization} from '../dist/scripts/icon-color.js';

test('blank color normalizes before validation and remaining settings still save',async()=>{
 installMockLibWrapper();const saved=[];
 const settings={get(){},async set(namespace,key,value,options){
  // Foundry v12 ClientSettings.set validates the raw value before saving it.
  if(key==='iconColor'&&!/^#[0-9a-f]{6}$/i.test(value))throw Error('may not be a blank string');
  saved.push({namespace,key,value,options});return value;
 }};
 installIconColorNormalization(settings);installIconColorNormalization(settings);
 for(const blank of [null,undefined,'','   ']){
  assert.equal(await settings.set('pneuma-combattools','iconColor',blank),DEFAULT_ICON_COLOR);
  await settings.set('pneuma-combattools','hoverAutofire',true);
  await settings.set('pneuma-combattools','biomonitorShowHP',false);
 }
 assert.equal(saved.length,12);
});
test('valid colors, unrelated blanks, options, return values and invalid-color errors are preserved',async()=>{
 installMockLibWrapper();const calls=[];const options={render:false};
 const settings={get(){},async set(...args){calls.push(args);if(args[2]==='invalid')throw Error('Invalid color');return args[2];}};
 installIconColorNormalization(settings);
 assert.equal(await settings.set('pneuma-combattools','iconColor','#12ABef',options),'#12ABef');
 await settings.set('another-module','iconColor','');await settings.set('pneuma-combattools','otherSetting','');
 assert.deepEqual(calls,[['pneuma-combattools','iconColor','#12ABef',options],['another-module','iconColor',''],['pneuma-combattools','otherSetting','']]);
 await assert.rejects(settings.set('pneuma-combattools','iconColor','invalid'),/Invalid color/);
});
test('legacy blank reads use the picker/HUD default without writing or resetting chosen colors',()=>{
 installMockLibWrapper();let stored;let writes=0;
 const settings={get:()=>stored,set:()=>writes++};installIconColorNormalization(settings);
 assert.equal(DEFAULT_ICON_COLOR,'#ffc36a');
 for(const value of [undefined,null,'','  ','#ffffff','#123456',0]){
  stored=value;
  assert.equal(settings.get('pneuma-combattools','iconColor'),value==null||typeof value==='string'&&!value.trim()?'#ffc36a':value);
  assert.equal(settings.get('another-module','iconColor'),value);
 }
 assert.equal(writes,0);
});
