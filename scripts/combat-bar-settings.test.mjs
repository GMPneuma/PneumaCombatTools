
import assert from 'node:assert/strict';
import {test} from 'node:test';
let lastWindow;
globalThis.FormApplication=class {
 constructor(){lastWindow=this;this.element=[];this.focuses=0;}
 render(force,options={}){
  this.pending=Promise.resolve().then(()=>{this.element=[{}];if(options.focus)this.bringToTop();});
  return this;
 }
 bringToTop(){assert.ok(this.element[0],'Cannot focus before the window element exists');this.focuses++;}
};
const {combatBarSettingsHTML,saveCombatBarSetting,openCombatBarSettings}=await import('../dist/scripts/combat-bar-settings.js');
const {COMBAT_BAR_SETTING_KEYS:keys}=await import('../dist/scripts/settings-layout.js');
const prefix='pneuma-combattools.';
function fixture(can=true){
 const rows=keys.map(key=>({id:prefix+key,key,name:'Native '+key,hint:'Native hint',value:'stored',choices:{native:'Native choice'}}));
 const writes=[],values=new Map([[keys[0],true],['combatBarOrientation','vertical']]);
 const definitions=new Map(keys.map(key=>[prefix+key,{config:true,scope:key==='combatBarDefaultMovement'?'world':'client',type:key==='combatBar'||key==='combatBarNameOnly'?Boolean:String,choices:key==='combatBarOrientation'?{vertical:'Vertical',horizontal:'Horizontal'}:undefined}]));
 globalThis.game={user:{can:()=>can},settings:{settings:definitions,get:(_m,k)=>values.get(k),set:async(_m,k,v)=>{writes.push([k,v]);values.set(k,v)}}};
 globalThis.SettingsConfig=class{getData(){return {categories:[{id:'pneuma-combattools',settings:rows.filter(row=>can||row.key!=='combatBarDefaultMovement').reverse().concat({id:prefix+'other',key:'other'}),menus:[]}]}}};
 globalThis.renderTemplate=async(path,data)=>{globalThis.rendered={path,data};return 'native rows'};
 return {rows,writes,values,definitions};
}
test('compact window renders native rows in exactly the Module Settings group order',async()=>{
 const f=fixture();
 assert.equal(await combatBarSettingsHTML(),'native rows');
 assert.equal(rendered.path,'templates/sidebar/apps/settings-config-category.html');
 assert.deepEqual(rendered.data.settings,f.rows);
 assert.equal(rendered.data.menus.length,0);
});
test('native permissions omit world settings for players and save-time checks reject them',async()=>{
 fixture(false);await combatBarSettingsHTML();
 assert.equal(rendered.data.settings.length,keys.length-1);
 await assert.rejects(saveCombatBarSetting(prefix+'combatBarDefaultMovement','free'),/cannot change/);
});
test('edits update only the selected setting and validate checkboxes and choices',async()=>{
 const f=fixture();await saveCombatBarSetting(prefix+'combatBarOrientation','horizontal');
 await saveCombatBarSetting(prefix+'combatBar',false);
 assert.deepEqual(f.writes,[['combatBarOrientation','horizontal'],['combatBar',false]]);
 await saveCombatBarSetting(prefix+'combatBar',false);assert.equal(f.writes.length,2);
 await assert.rejects(saveCombatBarSetting(prefix+'combatBar','false'),/checkbox/);
 await assert.rejects(saveCombatBarSetting(prefix+'combatBarOrientation','diagonal'),/choice/);
 await assert.rejects(saveCombatBarSetting(prefix+'npcAutoEvasion',true),/Unknown/);
 await assert.rejects(saveCombatBarSetting('other.combatBar',true),/Unknown/);
});

test('opening and reopening waits for native rendering before focusing the window',async()=>{
 openCombatBarSettings();
 assert.equal(lastWindow.focuses,0);
 await lastWindow.pending;
 assert.equal(lastWindow.focuses,1);
 const window=lastWindow;window.element=[];
 openCombatBarSettings();
 assert.equal(lastWindow,window);
 await window.pending;
 assert.equal(window.focuses,2);
});
