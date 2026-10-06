import assert from 'node:assert/strict';
import {test} from 'node:test';
globalThis.foundry={utils:{getProperty:(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object)}};
const {injuryTreatmentChoices}=await import('../dist/scripts/treatment.js');
const {nativeTreatmentSkill}=await import('../dist/scripts/medical-rules.js');
const {treatmentContent,postTreatment}=await import('../dist/scripts/treatment-card.js');
test('Treatment outcomes use strict DV comparison, native roll styling and escaped patient identity',()=>{
 assert.match(treatmentContent('<div class="rollcard">dice</div>','Stabilize',14,13,'Medic','Patient'),/pneuma-roll-winner/);
 const tie=treatmentContent('<div class="rollcard"><div class="rollcard-top">Native skill</div>dice</div>','QuickFix',13,13,'<Medic>','<Patient>');assert.match(tie,/pneuma-roll-loser/);assert.match(tie,/Fail/);assert.match(tie,/&lt;Medic&gt; → Treatment → &lt;Patient&gt;/);
 assert.match(tie,/^<div class="rollcard [^"]*"><div class="rollcard-top">/);
});
test('Treatment saves both token and actor identities for downstream presentation',async()=>{
 globalThis.game={settings:{get:()=> 'gmroll'}};let saved;
 globalThis.ChatMessage={getSpeaker:()=>({}),applyRollMode:()=>{},create:async data=>{saved=data;}};
 await postTreatment({name:'Medic',actor:{uuid:'Actor.medic'},document:{uuid:'Scene.s.Token.medic'}},{name:'Patient',actor:{uuid:'Actor.patient'},document:{uuid:'Scene.s.Token.patient'}},'QuickFix','dice',14,13);
 const data=saved.flags['pneuma-combattools'].medicalParticipants;assert.equal(data.defender,'Scene.s.Token.patient');assert.equal(data.defenderActor,'Actor.patient');assert.equal(data.attackerActor,'Actor.medic');assert.equal(data.action,'Treatment');
});
test('native injury choices preserve each skill DV and treatment stage',()=>{
 const rows=injuryTreatmentChoices({name:'Broken Leg',system:{quickFix:{dvFirstAid:0,dvParamedic:13},treatment:{type:'paramedicSurgery',dvParamedic:15,dvSurgery:13}}},'body');
 assert.deepEqual(rows.map(row=>[row.stage,row.skill,row.dv]),[['QuickFix','Paramedic',13],['Treatment','Paramedic',15],['Treatment','Surgery',13]]);assert(rows.every(row=>row.location==='body'));
});
test('permanent Quick Fix exposes both skills as treatment and omits redundant treatment rolls',()=>{
 const rows=injuryTreatmentChoices({name:'Foreign Object',system:{quickFix:{dvFirstAid:13,dvParamedic:13},treatment:{type:'quickFix',dvParamedic:0,dvSurgery:0}}},'head');
 assert.deepEqual(rows.map(row=>row.skill),['First Aid','Paramedic']);assert(rows.every(row=>row.permanent&&row.stage==='QuickFix'&&row.location==='head'));
});
test('surgery-only injuries do not invent Quick Fix options',()=>{
 const rows=injuryTreatmentChoices({name:'Lost Eye',system:{quickFix:{dvFirstAid:0,dvParamedic:0},treatment:{type:'surgery',dvParamedic:0,dvSurgery:17}}},'head');assert.deepEqual(rows.map(row=>[row.stage,row.skill,row.dv]),[['Treatment','Surgery',17]]);
});
test('both medical views use actual native skill Items at zero ranks and Surgery sub-role ability',()=>{
 const firstAid={name:'First Aid',type:'skill',system:{level:0}},wrongType={name:'Paramedic',type:'gear'},medtech={name:'Medtech',type:'role',system:{abilities:[{name:'Surgery Skill',hasRoll:true}]}};
 const actor={items:[firstAid,wrongType,medtech]};
 assert.equal(nativeTreatmentSkill(actor,'First Aid').item,firstAid);assert.equal(nativeTreatmentSkill(actor,'Paramedic'),undefined);
 assert.deepEqual(nativeTreatmentSkill(actor,'Surgery'),{item:medtech,title:'Surgery Skill',type:'roleAbility',subtype:'subRoleAbility'});
 medtech.system.abilities[0].hasRoll=false;assert.equal(nativeTreatmentSkill(actor,'Surgery'),undefined);
});
