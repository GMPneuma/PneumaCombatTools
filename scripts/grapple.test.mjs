import assert from 'node:assert/strict';
import {test} from 'node:test';
import {chokeDamage,nextChoke,visibleChoke,winsGrab} from '../dist/scripts/grapple/rules.js';
import {grappleHUD,grappleMenu,grappleWeaponBlocked} from '../dist/scripts/grapple/state.js';
import {handleGrappleRequest,registerGrapple,grappleContent,useGrapple} from '../dist/scripts/grapple/workflow.js';
const M='pneuma-combattools';
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function merge(a,b){for(const [k,v] of Object.entries(b)){if(k.startsWith('-=')){delete a[k.slice(2)];continue;}if(v&&typeof v==='object'&&!Array.isArray(v)){a[k]??={};merge(a[k],v);}else a[k]=structuredClone(v);}return a;}
function update(o,changes){for(const [p,v] of Object.entries(changes)){const ks=p.split('.');let a=o;for(const k of ks.slice(0,-1))a=a[k]??={};const k=ks.at(-1);merge(a,{[k]:v});}}
const collection=(items=[])=>{const m=new Map(items.map(v=>[v.id,v]));m.find=f=>[...m.values()].find(f);m.filter=f=>[...m.values()].filter(f);m.some=f=>[...m.values()].some(f);m[Symbol.iterator]=m.values.bind(m);return m;};
function setup(){
 let uid=0;
 const actors=['a','b','c'].map(id=>({id,uuid:'Actor.'+id,name:id,isOwner:true,isToken:false,flags:{},system:{stats:{body:{value:6}},derivedStats:{hp:{value:30,max:30}}},effects:[],items:[],
  testUserPermission:u=>u.isGM||u.actor===id,allApplicableEffects(){return this.effects;},
  async update(c){update(this,c);},
  async createEmbeddedDocuments(_kind,rows){const es=rows.map(row=>({...structuredClone(row),id:String(++uid),statuses:new Set(row.statuses??[]),disabled:false,async update(c){update(this,c);}}));this.effects.push(...es);return es;},
  async deleteEmbeddedDocuments(_kind,ids){this.effects=this.effects.filter(e=>!ids.includes(e.id));}
 }));
 const scene={id:'scene',flags:{},grid:{size:100,distance:2},async update(c){update(this,c);}};
 const tokens=actors.map((actor,i)=>({id:actor.id,uuid:'Scene.scene.Token.'+actor.id,actor,name:actor.name,parent:scene,x:i===2?0:i*100,y:i===2?100:0,width:1,height:1,elevation:0,texture:{scaleX:1,scaleY:1},async update(c){update(this,c);}}));
 scene.tokens=collection(tokens);tokens.forEach(t=>t.object={document:t,actor:t.actor,isVisible:true,name:t.name});
 const gm={id:'gm',active:true,isGM:true};const users=collection([gm,...actors.map(a=>({id:a.id,actor:a.id,active:true,isGM:false}))]);
 const combat={id:'combat',active:true,scene,flags:{},async update(c){update(this,c);},started:true,round:1,combatants:collection(tokens.map(t=>({id:t.id,token:t})))};
 const messages=collection();const hooks={};const replies=[];
 globalThis.CONST={ACTIVE_EFFECT_MODES:{ADD:2}};
 globalThis.foundry={utils:{getProperty:get,randomID:()=>String(++uid)}};
 globalThis.game={scenes:collection([scene]),combats:collection([combat]),combat,user:gm,users,messages,i18n:{localize:x=>x},socket:{on:(_c,f)=>hooks.socket=f,emit:(_c,v)=>replies.push(v)}};
 globalThis.ChatMessage={applyRollMode:()=>{},getSpeaker:()=>({}),async create(data){const m={...structuredClone(data),id:String(++uid),visible:true,isContentVisible:true,async update(c){update(this,c);},async delete(){messages.delete(this.id);}};messages.set(m.id,m);return m;}};
 globalThis.Hooks={on:(k,f)=>(hooks[k]??=[]).push(f),once:(k,f)=>(hooks[k]??=[]).push(f)};
 globalThis.ui={notifications:{warn:()=>{},error:()=>{}},chat:{updateMessage:()=>{}}};
 globalThis.canvas={tokens:{hud:{render:()=>{}}}};
 const request=(action,id='g',extra={})=>handleGrappleRequest({grappleType:'request',request:String(++uid),user:'gm',scene:'scene',id,revision:get(combat,`flags.${M}.grapples.${id}.revision`)??get(scene,`flags.${M}.grapples.${id}.revision`)??0,action,...extra});
 const read=(id='g')=>get(combat,`flags.${M}.grapples.${id}`)??get(scene,`flags.${M}.grapples.${id}`)??get(messages.find(m=>get(m,`flags.${M}.grapple.id`)===id),`flags.${M}.grapple`);
 const result=n=>({total:n,html:'<div class="rollcard">'+n+'</div>'});
 async function start(id='g',source=tokens[0],target=tokens[1],action='start'){await request(action,id,{source:source.uuid,target:target.uuid,result:result(15)});}
 async function respond(id='g',total=10){const claim=await request('claim',id);await request('respond',id,{claim,result:result(total)});}
 async function hold(advance=true){await start();await respond();await request('hold');if(advance&&combat.started)combat.round++;}
 return {actors,tokens,scene,combat,messages,hooks,replies,users,request,read,start,respond,hold,result};
}
test('Choke preserves the printed strict thresholds, not <= shortcuts',()=>{
 assert.deepEqual(chokeDamage(5,6,1),{hp:1,unconscious:true});
 assert.deepEqual(chokeDamage(6,6,1),{hp:0,unconscious:false});
 assert.deepEqual(chokeDamage(1,6,1),{hp:-5,unconscious:false});
 assert.deepEqual(chokeDamage(30,6,3),{hp:24,unconscious:true});
 assert.throws(()=>chokeDamage(NaN,6,1));
 assert.equal(winsGrab(15,15),false);
});
test('Consecutive-round tracking rejects duplicate/backward rounds and resets gaps/encounters',()=>{
 const one=nextChoke(undefined,'combat',1),two=nextChoke(one,'combat',2);
 assert.equal(two.count,2);assert.equal(nextChoke(two,'combat',3).count,3);
 assert.throws(()=>nextChoke(two,'combat',2));assert.throws(()=>nextChoke(two,'combat',1));
 assert.equal(nextChoke(two,'combat',4).count,1);assert.equal(nextChoke(two,'new',2).count,1);
 assert.equal(visibleChoke(two,'combat',3),2);assert.equal(visibleChoke(two,'combat',4),0);assert.equal(visibleChoke(two,undefined,2),0);
});
test('Hold adds native -2 effects, roles, HUD names and two-handed restrictions; release clears only its effects',async()=>{
 const f=setup();await f.hold();const [a,b]=f.actors;
 assert.equal(f.read().state,'active');assert.equal(f.read().operation,undefined);assert.equal(f.read().combat,'combat');assert.equal(get(f.scene,`flags.${M}.grapples.g`),undefined);assert.equal(get(f.combat,`flags.${M}.grapples.g`).source.actor,'Actor.a');
 for(const actor of [a,b]){assert.equal(actor.effects.length,1);assert.equal(actor.effects[0].changes[0].key,'bonuses.allActions');assert.equal(actor.effects[0].changes[0].value,'-2');}
 assert.match(grappleHUD(a)[0].text,/Grappling: b/);assert.match(grappleHUD(b)[0].text,/Grappled by: a/);
 assert.deepEqual(grappleMenu(f.tokens[0].object,f.tokens[1].object).map(r=>r.action),['choke','throw','release']);
 assert.deepEqual(grappleMenu(f.tokens[1].object,f.tokens[0].object).map(r=>r.action),['escape']);
 assert.deepEqual(grappleMenu(f.tokens[2].object,f.tokens[0].object).map(r=>r.action),['break']);
 assert.equal(grappleWeaponBlocked(a,{system:{handsReq:2}}),true);assert.equal(grappleWeaponBlocked(a,{system:{handsReq:1}}),false);
 b.effects.push({id:'existing',statuses:new Set(),flags:{},changes:[]});
 await f.request('release');assert.equal(a.effects.length,0);assert.deepEqual(b.effects.map(e=>e.id),['existing']);assert.equal(grappleHUD(b).length,0);
});
test('Choke applies HP once, shows attacker and defender counters, and third round sets unconscious',async()=>{
 const f=setup();await f.hold();const [a,b]=f.actors;
 const rev=f.read().revision;await f.request('choke');assert.equal(b.system.derivedStats.hp.value,24);
 await assert.rejects(f.request('choke','g',{revision:rev}),/changed/);
 await assert.rejects(f.request('choke'),/already applied/);
 assert.match(grappleHUD(a)[1].text,/Choking: b — 1\/3/);assert.match(grappleHUD(b)[1].text,/Being choked by: a — 1\/3/);
 f.combat.round=3;await f.request('choke');f.combat.round=4;await f.request('choke');
 assert.equal(b.system.derivedStats.hp.value,12);assert.equal(b.effects.some(e=>e.name==='Unconscious'),true);
 f.combat.round=6;assert.equal(grappleHUD(b).length,1);
 await f.request('choke');assert.equal(f.read().choke.count,1);
});
test('Throw ignores armor, applies prone, and ends both participants penalties',async()=>{
 const f=setup();await f.hold();const b=f.actors[1];b.system.derivedStats.hp.value=2;b.system.armor={body:{sp:20}};
 await f.request('throw');assert.equal(b.system.derivedStats.hp.value,-4);assert.equal(b.system.armor.body.sp,20);
 assert.deepEqual(b.effects.map(e=>e.name),['Prone']);assert.equal(f.actors[0].effects.length,0);assert.equal(grappleHUD(b).length,0);
});
test('Escape and third-party breaks oppose the grappler, preserve penalties until success, and ties fail',async()=>{
 const f=setup();await f.hold();await f.start('escape',f.tokens[1],f.tokens[0],'startBreak');await f.respond('escape',15);
 assert.equal(f.read().state,'active');
 await f.start('rescue',f.tokens[2],f.tokens[0],'startBreak');await f.respond('rescue',14);
 assert.equal(f.actors[0].effects.length,0);assert.equal(f.actors[1].effects.length,0);
});
test('Take Held Object produces no persistent grapple or penalties',async()=>{
 const f=setup();await f.start();await f.respond();await f.request('take');
 assert.equal(f.actors[0].effects.length,0);assert.match(f.read().note,/Transfer the item manually/);
});
test('Permissions, reach, stale choices, and reserved responses are enforced on the GM',async()=>{
 const f=setup();await assert.rejects(f.request('start','bad',{user:'b',source:f.tokens[0].uuid,target:f.tokens[1].uuid,result:f.result(15)}),/control/);
 f.tokens[1].x=600;await assert.rejects(f.start(),/reach/);f.tokens[1].x=100;
 await f.start();const claim=await f.request('claim','g',{user:'b'});
 await assert.rejects(f.request('claim'),/Another user/);
 await assert.rejects(f.request('respond','g',{claim,user:'a',result:f.result(10)}),/owner/);
 await f.request('respond','g',{claim,user:'b',result:f.result(10)});
 await assert.rejects(f.request('hold','g',{user:'b'}),/grappler/);
 f.tokens[1].x=600;await assert.rejects(f.request('hold'),/reach/);
});
test('Failed Combat commit after HP write is safely retried without dealing damage again',async()=>{
 const f=setup();await f.hold();const update=f.combat.update.bind(f.combat);let fail=true;
 f.combat.update=async changes=>{if(fail&&Object.values(changes).some(v=>v?.choke)){fail=false;throw Error('injected Combat failure');}return update(changes);};
 await assert.rejects(f.request('choke'),/injected/);assert.equal(f.actors[1].system.derivedStats.hp.value,24);assert.equal(f.read().operation.action,'choke');
 await assert.rejects(f.request('throw'),/pending/);
 await f.request('choke');assert.equal(f.actors[1].system.derivedStats.hp.value,24);assert.equal(f.read().operation,undefined);assert.equal(f.read().choke.count,1);
});
test('Failed second effect creation is recoverable and never duplicates the first penalty',async()=>{
 const f=setup();await f.start();await f.respond();const b=f.actors[1];const create=b.createEmbeddedDocuments.bind(b);let fail=true;
 b.createEmbeddedDocuments=async(...args)=>{if(fail){fail=false;throw Error('effect failure');}return create(...args);};
 await assert.rejects(f.request('hold'),/effect failure/);assert.equal(f.actors[0].effects.length,1);
 await f.request('hold');assert.equal(f.actors[0].effects.length,1);assert.equal(b.effects.length,1);
});
test('A manually supplied native grapple penalty is reused and retained on release',async()=>{
 const f=setup();f.actors[0].effects.push({id:'manual',name:'Grappled',flags:{},statuses:new Set(),changes:[{key:'bonuses.allActions',value:'-2'}]});
 await f.hold();assert.equal(f.actors[0].effects.filter(e=>e.changes.length).length,1);
 await f.request('release');assert.deepEqual(f.actors[0].effects.map(e=>e.id),['manual']);
});
test('Socket authority serializes simultaneous Chokes and non-GM defender movement is blocked',async()=>{
 const f=setup();await f.hold();registerGrapple();f.hooks.ready.forEach(fn=>fn());
 const rev=f.read().revision;for(const id of ['one','two'])f.hooks.socket({grappleType:'request',request:id,user:'a',scene:'scene',id:'g',revision:rev,action:'choke'});
 for(let n=0;n<30&&f.replies.length<2;n++)await new Promise(r=>setTimeout(r,5));
 assert.equal(f.replies.length,2);assert.equal(f.replies.filter(r=>r.error).length,1);assert.equal(f.actors[1].system.derivedStats.hp.value,24);
 assert.equal(f.hooks.preUpdateToken[0](f.tokens[1],{x:200},{},'b'),false);
 assert.equal(f.hooks.preUpdateToken[0](f.tokens[1],{x:200},{},'gm'),undefined);
 assert.equal(f.hooks.preUpdateToken[0](f.tokens[0],{x:200},{},'a'),undefined);
});
test('Card names are escaped and pending cards do not expose roll HTML',async()=>{
 const f=setup();f.tokens[0].name='<img onerror="bad">';await f.start();const html=grappleContent(f.read());
 assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.doesNotMatch(html,/rollcard">15/);
});

test('Switching the selected combat cannot redirect grapple metadata or choke rounds',async()=>{
 const f=setup();await f.hold();const other={id:'other',round:50,started:true,flags:{},scene:f.scene,combatants:f.combat.combatants};game.combats.set(other.id,other);game.combat=other;
 await f.request('choke');assert.equal(f.read().combat,'combat');assert.equal(f.read().choke.round,2);assert.equal(get(other,'flags.'+M+'.grapples'),undefined);
 assert.equal(get(f.scene,'flags.'+M+'.grapples'),undefined);
});
test('Combat reset and deletion clean metadata and both actor penalties',async()=>{
 for(const deleting of [false,true]){
  const f=setup();await f.hold();await f.request('choke');registerGrapple();
  if(deleting){game.combats.delete('combat');f.hooks.deleteCombat.forEach(fn=>fn(f.combat));}
  else{f.combat.round=0;f.combat.started=false;f.hooks.updateCombat.forEach(fn=>fn(f.combat,{round:0}));}
  for(let n=0;n<40&&f.actors.some(a=>a.effects.length);n++)await new Promise(r=>setTimeout(r,5));
  assert.equal(f.actors[0].effects.length,0);assert.equal(f.actors[1].effects.length,0);assert.equal(grappleHUD(f.actors[1]).length,0);
  if(!deleting)assert.equal(get(f.combat,'flags.'+M+'.grapples.g'),undefined);
 }
});
test('Outside-combat grabs stay scene-scoped and show an untracked choke state',async()=>{
 const f=setup();f.combat.started=false;await f.hold();await f.request('choke');
 assert.equal(f.read().combat,undefined);assert.equal(get(f.combat,'flags.'+M+'.grapples'),undefined);
 assert.equal(get(f.scene,'flags.'+M+'.grapples.g').state,'active');assert.match(grappleHUD(f.actors[1])[1].text,/Being choked by: a — GM tracks rounds/);
});

test('Held token scales to 0.8 preserving mirroring, restores original scale on release and throw',async()=>{
 for(const action of ['release','throw']){
  const f=setup();f.tokens[1].texture={scaleX:-1.3,scaleY:1.6};
  await f.hold();assert.deepEqual(f.tokens[1].texture,{scaleX:-0.8,scaleY:0.8});
  assert.deepEqual(f.tokens[0].texture,{scaleX:1,scaleY:1});
  assert.equal(f.read().tokenPlacement.scaleX,-1.3);
  await f.request(action);assert.deepEqual(f.tokens[1].texture,{scaleX:-1.3,scaleY:1.6});
 }
});
test('GM places held token on previous square for player moves, turns and multi-square moves, and stops after release',async()=>{
 const f=setup();registerGrapple();await f.hold();
 const emit=async(token,changes,user='gm')=>{
  const options={};game.user=f.users.get(user);
  for(const cb of f.hooks.preUpdateToken)if(cb(token,changes,options,user)===false)return;
  update(token,changes);
  // The GM receives the originating player's options with the completed update.
  game.user=f.users.get('gm');
  for(const cb of f.hooks.updateToken)cb(token,changes,options,user);
  await new Promise(r=>setTimeout(r,0));
 };
 await emit(f.tokens[0],{x:200,y:300,elevation:8},'a');
 assert.deepEqual([f.tokens[1].x,f.tokens[1].y,f.tokens[1].elevation],[0,0,0]);
 await emit(f.tokens[0],{x:400},'a');
 assert.deepEqual([f.tokens[1].x,f.tokens[1].y,f.tokens[1].elevation],[200,300,8]);
 await emit(f.tokens[0],{y:500},'a');
 assert.deepEqual([f.tokens[1].x,f.tokens[1].y],[400,300]);
 await emit(f.tokens[0],{x:400,y:500},'a');
 assert.deepEqual([f.tokens[1].x,f.tokens[1].y],[400,300]);
 await emit(f.tokens[2],{x:900});assert.equal(f.tokens[1].x,400);
 await emit(f.tokens[1],{x:350},'b');assert.equal(f.tokens[1].x,400);
 game.user=f.users.get('gm');await f.request('release');await emit(f.tokens[0],{x:700});assert.equal(f.tokens[1].x,400);
});
test('Cleanup on combat reset or grappler deletion restores held token scale',async()=>{
 for(const mode of ['reset','delete']){
  const f=setup();registerGrapple();f.tokens[1].texture={scaleX:1.2,scaleY:1.4};await f.hold();
  if(mode==='reset'){f.combat.round=0;for(const cb of f.hooks.updateCombat)cb(f.combat,{round:0});}
  else {f.scene.tokens.delete(f.tokens[0].id);for(const cb of f.hooks.deleteToken)cb(f.tokens[0]);}
  await new Promise(r=>setTimeout(r,10));
  assert.deepEqual(f.tokens[1].texture,{scaleX:1.2,scaleY:1.4});
 }
});

test('HUD Release, Choke and Throw execute without any roll or opposed response',async()=>{
 for(const action of ['release','choke','throw']){
  const f=setup();await f.hold();
  globalThis.Dialog={confirm:()=>{throw Error('Unexpected roll confirmation');}};
  f.actors[0].items=[{type:'skill',name:'Brawling',createRoll(){throw Error('Unexpected Brawling roll');}}];
  await useGrapple(f.tokens[0].object,f.tokens[1].object,action);
  const g=f.read();assert.equal(g.lastAction,action);
  assert.equal(g.state,action==='choke'?'active':'ended');
  assert.equal(f.actors[1].system.derivedStats.hp.value,action==='release'?30:24);
  assert.doesNotMatch(grappleContent(g),/pneuma-grapple-rolls/);
  assert.equal(g.attack.total,15);assert.equal(g.defense.total,10);
 }
});

test('disabled server socket metadata blocks player grapple before dice or cards',async()=>{
 const f=setup();game.modules=new Map([[M,{socket:false}]]);game.user=f.users.get('a');
 const errors=[];ui.notifications.error=s=>errors.push(s);
 globalThis.Dialog={confirm:()=>{throw Error('Must not reach roll confirmation');}};
 await useGrapple(f.tokens[0].object,f.tokens[1].object,'grab');
 assert.equal(f.messages.size,0);assert.match(errors[0],/Restart the Foundry server/);
 delete game.modules;
});

test('establishment locks attacker actions until next source turn; self escape names attacker and history stays intact',async()=>{
 const f=setup();f.combat.turns=[{token:f.tokens[2]},{token:f.tokens[0]},{token:f.tokens[1]}];f.combat.turn=1;
 await f.hold(false);
 const original=f.messages.get(f.read().message),content=original.content;
 for(const action of ['choke','throw','release'])await assert.rejects(f.request(action),/next turn/);
 assert(grappleMenu(f.tokens[0].object,f.tokens[0].object).every(row=>row.disabled));
 assert.equal(grappleMenu(f.tokens[1].object,f.tokens[1].object)[0].label,'Escape — a');
 f.combat.round=2;f.combat.turn=0;await assert.rejects(f.request('choke'),/next turn/);
 f.combat.turn=1;await f.request('choke');
 assert.equal(original.content,content);assert(original.content.includes('pneuma-grapple-rolls'));
 assert.equal(f.messages.size,2);assert([...f.messages.values()].some(m=>m!==original&&m.content.includes('Choke:')));
 await assert.rejects(f.request('choke'));
});

test('client-captured grapple encounter survives GM scene and active encounter changes',async()=>{const f=setup(),encounter={combatId:f.combat.id,combatEpoch:'',combatScene:f.scene.id,combatTokens:f.tokens.slice(0,2).map(t=>t.uuid)};f.combat.active=false;const other={...f.combat,id:'other',active:true,flags:{}};game.combats.set('other',other);game.combat=other;canvas.scene={id:'elsewhere'};await f.request('start','g',{encounter,source:f.tokens[0].uuid,target:f.tokens[1].uuid,result:f.result(15)});assert.equal(f.read().combat,'combat');assert.equal(get(other,'flags.'+M+'.grapples'),undefined);});
test('client-captured grapple refuses a reset before card creation',async()=>{const f=setup();f.combat.flags={[M]:{evasionEpoch:'new'}};await assert.rejects(f.request('start','g',{encounter:{combatId:f.combat.id,combatEpoch:''},source:f.tokens[0].uuid,target:f.tokens[1].uuid,result:f.result(15)}),/reset/);assert.equal(f.messages.size,0);});
