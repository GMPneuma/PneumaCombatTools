import assert from 'node:assert/strict';
import {test} from 'node:test';
import {viewerDefaultIndicator,viewedTokenIndicator,saveLocalDefaultIndicator,defaultIndicator,indicatorForToken,saveTokenIndicator,indicatorForActor,indicatorOwner,normalizeIndicator,personalIndicator} from '../dist/scripts/turn-marker-profile.js';
globalThis.FormApplication=class{};
const {saveTurnMarkerSetting,registerTurnMarkerSettings,TurnMarkerSettings}=await import('../dist/scripts/turn-marker-settings.js');
function fixture(){
 const values={turnMarkerStyle:'scanner',turnMarkerColor:'#ffc36a',turnMarkerThickness:2,turnMarkerDistance:8,turnMarkerOpacity:.85,turnMarkerSpeed:1,turnMarkerDisplay:'animated'};
 const users=['b','a','gm'].map(id=>({id,isGM:id==='gm',getFlag(_m,k){return k==='turnIndicatorDefault'?this.localDefault:this.profile},async setFlag(_m,k,p){if(k==='turnIndicatorDefault')this.localDefault=p;else this.profile=p},async unsetFlag(_m,k){if(k==='turnIndicatorDefault')delete this.localDefault;else delete this.profile}}));
 const settings=new Map(Object.keys(values).map(k=>['pneuma-combattools.'+k,{type:typeof values[k]==='number'?Number:String,range:{min:0,max:k==='turnMarkerThickness'?10:100},choices:k==='turnMarkerStyle'?{scanner:'Scanner',medtech:'Medtech',off:'Off'}:undefined}]));
 globalThis.game={users,user:users[0],settings:{settings,get:(_m,k)=>values[k],set:async(_m,k,v)=>{values[k]=v}}};
 const actor={id:'pc',type:'character',testUserPermission:user=>user.id!=='gm'};
 return {users,actor,values};
}
test('NPCs, unassigned PCs and users without choices inherit world default',()=>{const {users,actor}=fixture();assert.equal(indicatorForActor(actor).turnMarkerStyle,'scanner');users[1].profile={turnMarkerStyle:'medtech'};assert.equal(indicatorForActor({...actor,type:'mook'}).turnMarkerStyle,'scanner');assert.equal(indicatorForActor({...actor,testUserPermission:()=>false}).turnMarkerStyle,'scanner');});
test('assigned user wins shared ownership, offline state and viewing client never change profile',()=>{const {users,actor}=fixture();users[0].character={id:'pc'};users[0].active=false;users[0].profile={...defaultIndicator(),turnMarkerStyle:'medtech',turnMarkerSpeed:2};users[1].profile={turnMarkerStyle:'off'};for(const viewer of users){game.user=viewer;assert.equal(indicatorOwner(actor),users[0]);assert.equal(indicatorForActor(actor).turnMarkerStyle,'medtech');assert.equal(indicatorForActor(actor).turnMarkerSpeed,2);}users[0].character=null;assert.equal(indicatorOwner(actor),users[1]);});
test('personal choices and local defaults are separate; world default stays GM-only',async()=>{const {users,values}=fixture();await saveTurnMarkerSetting('pneuma-combattools.turnMarkerStyle','medtech','default');assert.equal(viewerDefaultIndicator().turnMarkerStyle,'medtech');assert.equal(personalIndicator(users[0]),undefined);assert.equal(values.turnMarkerStyle,'scanner');await saveTurnMarkerSetting('pneuma-combattools.turnMarkerStyle','medtech','personal');assert.equal(personalIndicator(users[0]).turnMarkerStyle,'medtech');assert.equal(values.turnMarkerStyle,'scanner');await saveTurnMarkerSetting('pneuma-combattools.turnMarkerThickness','10','personal');assert.equal(personalIndicator(users[0]).turnMarkerStyle,'medtech');assert.equal(personalIndicator(users[0]).turnMarkerThickness,10);await users[0].unsetFlag();assert.equal(personalIndicator(users[0]),undefined);game.user=users[2];await saveTurnMarkerSetting('pneuma-combattools.turnMarkerStyle','off','default');assert.equal(defaultIndicator().turnMarkerStyle,'off');});
test('blank colors and malformed saved values are normalized; personal Off is explicit',async()=>{fixture();await saveTurnMarkerSetting('pneuma-combattools.turnMarkerColor','','personal');assert.equal(personalIndicator(game.user).turnMarkerColor,'#ffc36a');const p=normalizeIndicator({turnMarkerStyle:'nope',turnMarkerSpeed:Infinity,turnMarkerThickness:99,turnMarkerDistance:100,turnMarkerColor:'<invalid>'});assert.equal(p.turnMarkerStyle,'segmented');assert.equal(p.turnMarkerSpeed,1);assert.equal(p.turnMarkerThickness,10);assert.equal(p.turnMarkerDistance,50);assert.equal(normalizeIndicator({turnMarkerStyle:'off'}).turnMarkerStyle,'off');});

test('legacy speed and opacity values clamp to current limits',()=>{assert.equal(normalizeIndicator({turnMarkerSpeed:3}).turnMarkerSpeed,2);assert.equal(normalizeIndicator({turnMarkerOpacity:0}).turnMarkerOpacity,.5);assert.equal(normalizeIndicator({turnMarkerOpacity:2}).turnMarkerOpacity,1);});

test('saved Quadrant Circuit selections resolve to Netrunner',()=>{assert.equal(normalizeIndicator({turnMarkerStyle:'circuit'}).turnMarkerStyle,'netrunner');});

test("Configure Settings exposes the complete indicator editor to players and GMs",()=>{fixture();let menu;game.settings.registerMenu=(module,key,config)=>{menu={module,key,...config}};registerTurnMarkerSettings();assert.equal(menu.key,"turnMarkerSettings");assert.equal(menu.restricted,false);assert.equal(menu.type,TurnMarkerSettings);assert.equal(menu.label,"Configure");});

test('GM token profiles are independent for shared actors, override players and reset to inheritance',async()=>{
 const {users,actor,values}=fixture();users[1].profile={turnMarkerStyle:'medtech'};const scene={tokens:new Map()};const make=id=>{const token={id,actor,parent:scene,getFlag(){return this.profile},async setFlag(_m,_k,p){this.profile=p},async unsetFlag(){delete this.profile}};scene.tokens.set(id,token);return token;};const a=make('a'),b=make('b');
 await assert.rejects(saveTurnMarkerSetting('pneuma-combattools.turnMarkerStyle','solo','token',a),/Only a GM/);game.user=users[2];await saveTokenIndicator(a,{...defaultIndicator(),turnMarkerStyle:'solo'});assert.equal(indicatorForToken(a).turnMarkerStyle,'solo');assert.equal(indicatorForToken(b).turnMarkerStyle,'medtech');assert.equal(values.turnMarkerStyle,'scanner');
 await saveTokenIndicator(a,null);assert.equal(indicatorForToken(a).turnMarkerStyle,'medtech');a.actor=b.actor={...actor,type:'mook'};await saveTokenIndicator(a,{...defaultIndicator(),turnMarkerStyle:'off'});assert.equal(indicatorForToken(a).turnMarkerStyle,'off');assert.equal(indicatorForToken(b).turnMarkerStyle,'scanner');scene.tokens.delete('a');await assert.rejects(saveTokenIndicator(a,null),/no longer/);
});


test('local defaults are viewer-specific, never exported as character or token overrides, and reset follows GM changes',async()=>{
 const {users,actor,values}=fixture();const token={actor:{...actor,type:'mook'}};
 await saveLocalDefaultIndicator({...defaultIndicator(),turnMarkerStyle:'fixer'});
 assert.equal(viewedTokenIndicator(token).turnMarkerStyle,'fixer');assert.equal(indicatorForToken(token).turnMarkerStyle,'scanner');
 game.user=users[1];assert.equal(viewedTokenIndicator(token).turnMarkerStyle,'scanner');game.user=users[0];
 users[1].profile={turnMarkerStyle:'medtech'};assert.equal(viewedTokenIndicator({actor}).turnMarkerStyle,'medtech');
 assert.equal(viewedTokenIndicator({actor,getFlag:()=>({turnMarkerStyle:'solo'})}).turnMarkerStyle,'solo');
 await saveLocalDefaultIndicator(null);values.turnMarkerStyle='echo';assert.equal(viewerDefaultIndicator().turnMarkerStyle,'echo');assert.equal(users[1].profile.turnMarkerStyle,'medtech');
});

test('My Indicator inherits owner default across viewers, follows changes, and preserves independent overrides',async()=>{
 const {users,actor}=fixture();users[0].character={id:actor.id};
 await saveLocalDefaultIndicator({...defaultIndicator(),turnMarkerStyle:'fixer',turnMarkerColor:'#123456'});
 for(const viewer of users){game.user=viewer;assert.equal(viewedTokenIndicator({actor}).turnMarkerStyle,'fixer');assert.equal(indicatorForActor(actor).turnMarkerColor,'#123456');}
 game.user=users[0];await saveTurnMarkerSetting('pneuma-combattools.turnMarkerThickness','7','personal');assert.equal(personalIndicator(users[0]).turnMarkerStyle,'fixer');assert.equal(personalIndicator(users[0]).turnMarkerColor,'#123456');
 await saveLocalDefaultIndicator({...defaultIndicator(),turnMarkerStyle:'echo'});assert.equal(viewedTokenIndicator({actor}).turnMarkerStyle,'fixer');
 await users[0].unsetFlag('pneuma-combattools','turnIndicator');assert.equal(viewedTokenIndicator({actor}).turnMarkerStyle,'echo');game.user=users[2];assert.equal(viewedTokenIndicator({actor}).turnMarkerStyle,'echo');
});
