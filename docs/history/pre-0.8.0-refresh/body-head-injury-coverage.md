# Body and head injury coverage — 2026-09-22

Compared with both user-supplied charts, current module code, and local CPR v0.92.4 native compendium items/effects. Source verification, not live multiplayer verification.

## Matching flow connected

Broken Ribs, Foreign Object (Body), and Foreign Object (Head) share the movement-warning flow. Moving more than 4 m/yd on foot creates a private owner/GM card with Apply 5 damage. Apply manually at turn end; armor is bypassed. Each distinct injury has its own labeled card and receipt, so coexisting injuries are not collapsed into one penalty. Repeated movement updates reuse that injury's card.

ChatMessage.flags.pneuma-combattools.brokenRibs now includes an injury discriminator; old cards mean Broken Ribs. Actor.flags.pneuma-combattools.ribsApplications retains per-card receipts. Removed injuries cannot incur new damage from stale cards. The flow depends on recorded on-foot movement.

## Body chart

| Injury | Working mechanics | Remaining gap |
|---|---|---|
| Dismembered Arm | Native death-save +1; injury/status display | Affected arm, dropping held items, unusable-arm/action/weapon restrictions. |
| Dismembered Hand | Native death-save +1; injury/status display | Affected hand, dropping held items, hand-dependent restrictions. |
| Collapsed Lung | Native MOVE -2; death-save +1 | Explicit minimum MOVE 1; native additive effect alone has no floor. |
| Broken Ribs | Movement warning and manual direct 5-HP application | Automatic end-turn application is not implemented. |
| Broken Arm | Injury/status display | Affected arm, unusable-arm restrictions and held-item drops. |
| Foreign Object | Newly connected body movement-warning/direct-damage flow | Same manual end-turn limitation as Broken Ribs. |
| Broken Leg | Native MOVE -4 | Explicit minimum MOVE 1. |
| Torn Muscle | Native melee -2 | No additional combat penalty gap found in supplied chart. |
| Spinal Injury | Native death-save +1; HUD reminder | Next-turn Action loss while preserving Move Action. |
| Crushed Fingers | Native selectable hand-action -4 | Affected hand/action context not inferred; situational modifier defaults off. |
| Dismembered Leg | Native MOVE -6/death-save +1; module/native Evasion guards | Explicit minimum MOVE 1; limb identity descriptive. |

## Head chart

| Injury | Working mechanics | Remaining gap |
|---|---|---|
| Lost Eye | Native ranged -4, selectable sight Perception -4, death-save +1 | Sensory context remains a roll choice. |
| Brain Injury | Native all-actions -2; death-save +1 | No additional combat penalty gap found in supplied chart. |
| Damaged Eye | Native ranged -2; selectable sight Perception -2 | Sensory context remains a roll choice. |
| Concussion | Native all-actions -2 | No additional combat penalty gap found in supplied chart. |
| Broken Jaw | Native selectable speech-action -4 | Speech context not inferred; situational modifier defaults off. |
| Foreign Object | Newly connected head movement-warning/direct-damage flow | Same manual end-turn limitation as Broken Ribs. |
| Whiplash | Native death-save +1 | No additional combat penalty gap found in supplied chart. |
| Cracked Skull | Native death-save +1 | Aimed headshot penetrating-damage multiplier x3 instead of x2. |
| Damaged Ear | Native selectable hearing Perception -2 | Moving over 4 m/yd must block next turn's Move Action; no matching next-turn handler exists. |
| Crushed Windpipe | Native death-save +1; HUD reminder | Speech-dependent action restriction. |
| Lost Ear | Native selectable hearing Perception -4; death-save +1 | Same next-turn Move loss as Damaged Ear; hearing context remains manual. |

## Implementation boundaries

Native injury imports and modifiers are reused; no duplicate flat penalties added. Grapple two-handed restrictions do not substitute for affected-hand/held-item tracking. EMP frame movement lock does not implement an ear injury's next-turn Move Action restriction.

Native injury items contain Quick Fix/treatment metadata. New treatment rolls, surgery, limb replacement, and automatic healing/removal are outside this change.

Scope: all 11 body and 11 head entries supplied. Remaining gaps are listed rather than implemented speculatively.

## Implemented follow-up — 2026-09-23 (supersedes gaps above)

- Cracked Skull: Combat Tools aimed-head damage applications use x3 penetrating damage. Native critical bonus is not multiplied; reductions, nonlethal floor, armor/shield handling, and captured undo amounts remain supported. Native attacks outside the Combat Tools damage application are not intercepted.
- Collapsed Lung, Broken Leg, Dismembered Leg: prepared MOVE floors at 1 after native effects; active zero/negative MOVE overrides, including frame immobilization, take precedence.
- Arm/hand injuries, Crushed Fingers, Broken Jaw, Crushed Windpipe, eye/ear injuries and movement-damage injuries: on-infliction HUD message plus persistent medical guidance.
- Perception and common speech skills show contextual reminders using native selectable modifiers. No guessing of sensory/hand context or duplicate modifier application.
- New Spinal Injury schedules an advisory next-turn warning; crossing 4 m/yd with Damaged/Lost Ear schedules a next-turn Move Action warning. Movement reset cancels an undelivered ear reminder. Stored Actor.flags.pneuma-combattools.injuryReminders contains combat/round/turn/injury and delivery state, not action budgets.
- Optional Injury damage: turn-end HUD reminder points to unpaid movement-injury damage cards. Damage remains manually applied.
- Players/GM adjudicate action restrictions, affected limb/held objects, forced movement and treatment. There is no new action economy, action spending, or movement lock.
- These additions reuse the existing animated HUD messaging and respect its client settings. Offline recipients do not receive an infliction popup; persistent injury guidance remains.
