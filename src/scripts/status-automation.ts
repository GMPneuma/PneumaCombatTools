/** Describes existing Combat Tools behavior; this does not create effects or determine native availability.
 * Sources: instant-lifetime, movement/self-actions, medical, injury-mechanics/notices/rules,
 * damage-application, grapple/workflow, emp-state, suppression and wake.
 */
const automation:Record<string,string>={
  "On Fire (Mild)":"2 HP damage at turn end, bypassing armor. Highest fire level only; active GM and combat turn progression required. Extinguish clears fire.",
  "On Fire (Strong)":"4 HP damage at turn end, bypassing armor. Highest fire level only; active GM and combat turn progression required. Extinguish clears fire.",
  "On Fire (Deadly)":"6 HP damage at turn end, bypassing armor. Highest fire level only; active GM and combat turn progression required. Extinguish clears fire.",
  "Prone":"Restricts movement and enables Get Up / Martial Arts Recovery. Clears at combat end.",
  "Unconscious":"Enables Wake Up by another conscious character. Combat Tools Sleep also clears on damage or expiry; ordinary Unconscious does not.",
  "Needs Stabilization":"Added after combat HP loss when Enable Stabilization Function is on; cleared by successful stabilization.",
  "Speed Heal":"Clears the tracked status when the patient's combat ends; this marker does not itself heal HP.",
  "Grappled":"Combat Tools grapples apply the -2 all-actions penalty and manage escape/cleanup. Adding this marker alone does not start a grapple.",
  "Human Shield":"Managed by the Combat Tools grapple/human-shield workflow. Adding this marker alone does not create a human shield.",
  "Choking 1":"Combat Tools Choke actions track consecutive rounds, apply BODY damage and resolve unconsciousness. This marker alone does not trigger damage.",
  "Choking 2":"Combat Tools Choke actions track consecutive rounds, apply BODY damage and resolve unconsciousness. This marker alone does not trigger damage.",
  "EMP":"Combat Tools EMP/Microwaver workflows disable selected equipment and manage recovery. Adding this marker alone does not disable equipment.",
  "Suppressed":"Combat Tools suppression attacks apply a marker that expires after the target's next turn. Manually added markers have no automatic next-turn expiry.",
  "Cracked Skull":"Combat Tools aimed headshot damage uses ×3 penetrating damage; bonus damage is unchanged.",
  "Broken Ribs":"Moving over 4 m/yd on foot creates a card to apply 5 HP damage at turn end. Requires clicking Apply; damage is not automatic.",
  "Foreign Object (Body)":"Moving over 4 m/yd on foot creates a card to apply 5 HP damage at turn end. Requires clicking Apply; damage is not automatic.",
  "Foreign Object (Head)":"Moving over 4 m/yd on foot creates a card to apply 5 HP damage at turn end. Requires clicking Apply; damage is not automatic.",
  "Dismembered Leg":"Blocks evasion and keeps injury-reduced MOVE at least 1, unless another effect explicitly immobilizes the actor.",
  "Broken Leg":"Keeps injury-reduced MOVE at least 1, unless another effect explicitly immobilizes the actor.",
  "Collapsed Lung":"Keeps injury-reduced MOVE at least 1, unless another effect explicitly immobilizes the actor.",
  "Spinal Injury":"Shows injury guidance and a next-turn reminder: no Action, Move Action remains available. Reminder only.",
  "Damaged Ear":"Tracks movement over 4 m/yd on foot and reminds the actor of no Move Action next turn. Reminder only.",
  "Lost Ear":"Tracks movement over 4 m/yd on foot and reminds the actor of no Move Action next turn. Reminder only."
};
for(const name of ["Dismembered Arm","Dismembered Hand","Broken Arm","Crushed Fingers","Broken Jaw","Crushed Windpipe","Damaged Eye","Lost Eye"])
  automation[name]="Shows injury guidance when applied. Reminder only; Combat Tools does not enforce the described restriction.";
export function statusAutomation(name:string,userAdded=false):string|undefined {
  return userAdded?undefined:automation[name];
}

const reminders=new Set(["Spinal Injury","Damaged Ear","Lost Ear","Dismembered Arm","Dismembered Hand","Broken Arm","Crushed Fingers","Broken Jaw","Crushed Windpipe","Damaged Eye","Lost Eye"]);
const workflows=new Set(["Grappled","Human Shield","Choking 1","Choking 2","EMP","Suppressed","Broken Ribs","Foreign Object (Body)","Foreign Object (Head)"]);
export function statusAutomationPolicy(name:string,userAdded=false) {
  const description=statusAutomation(name,userAdded);
  const managed=!!description&&!reminders.has(name);
  return {automation:description,automationManaged:managed,
    automationLabel:description?(workflows.has(name)?"Managed by Combat Tools":reminders.has(name)?"Combat Tools reminder":"Combat Tools automation"):undefined};
}
