# Status and critical injury mechanics audit — 2026-09-21

Version: official Cyberpunk RED Core v0.92.4 source and compendium YAML, compared with the current Combat Tools working tree. Covers all 65 built-in catalog statuses: 22 critical injuries, 28 general statuses and 15 drug/pharma entries. Also covers six additional lasting HUD drug/pharma entries. World-defined custom statuses and other modules are not available in this source audit.

**Important correction:** native drug descriptions declare durations, but every inspected drug Active Effect has null duration fields. The current duration adapter only converts an already-declared numeric duration. It therefore does not yet assign the described drug timer or guarantee combat-end cleanup of those untimed native effects. Prepared HUD icons are not proof of implemented mechanics.

**No gameplay implementation changed during this audit.** Source inspection proves configured modifiers and missing handlers; it is not live multi-client verification.

## Critical injuries — all 22

Native actor calculation adds +1 base death-save penalty for each injury item whose deathSaveIncrease field is true. Flat modifiers below are supplied by native item effects. Situational modifiers require the appropriate roll-dialog choice; default ON does not mean the system understands the sensory context. Combat Tools imports these items and avoids duplicates, but does not fill the gaps listed here.

| Injury | Native automation | Missing / conditional behavior |
|---|---|---|
| [Brain Injury](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.brain.injury.yaml) | All-action -2; death-save base +1 | No additional missing listed mechanic found. |
| [Broken Arm](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.broken.arm.yaml) | No Active Effect modifier | Unusable arm, dropping held objects, and hand/weapon restrictions are not enforced. |
| [Broken Jaw](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.broken.jaw.yaml) | Speech-action -4 selectable modifier | Speech context is not detected; modifier defaults OFF. |
| [Broken Leg](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.broken.leg.yaml) | MOVE -4 | Injury-specific minimum MOVE 1 is not explicitly enforced by its additive AE; low-MOVE case needs live verification. |
| [Broken Ribs](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.broken.ribs.yaml) | No Active Effect modifier | Implemented after audit: the move counter warns above 4 m/yd on foot with a manual Apply 5 damage card; no automatic damage. |
| [Collapsed Lung](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.collapsed.lung.yaml) | Death-save base +1; MOVE -2 | Same minimum MOVE 1 caveat. |
| [Concussion](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.concussion.yaml) | All-action -2 | No additional missing listed mechanic found. |
| [Cracked Skull](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.cracked.skull.yaml) | Death-save base +1 | Headshot HP multiplier remains normal x2; injury x3 is not implemented. |
| [Crushed Fingers](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.crushed.fingers.yaml) | Hand-action -4 selectable modifier | Hand context is not detected; modifier defaults OFF. |
| [Crushed Windpipe](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.crushed.windpipe.yaml) | Death-save base +1 | Cannot-speak restriction is descriptive; speech actions remain available. |
| [Damaged Ear](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.damaged.ear.yaml) | Hearing Perception -2 selectable modifier | Hearing defaults OFF; moving over 4 m/yd does not lock next-turn movement. |
| [Damaged Eye](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.damaged.eye.yaml) | Ranged -2; sight Perception -2 selectable modifier | Sight defaults ON, but hearing/sight context is not inferred; user must adjust. |
| [Dismembered Hand](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.dismembered.hand.yaml) | Death-save base +1 | Missing hand, dropping items and hand/weapon restrictions are not enforced. |
| [Dismembered Leg](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.dismembered.leg.yaml) | Death-save base +1; MOVE -6 | Implemented after audit: Combat Tools and native skill roll guards block evasion, also for installed disabled Cyberlegs. Minimum MOVE 1 caveat remains. |
| [Dismembered Arm](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.dismembered.arm.yaml) | Death-save base +1 | Missing limb, dropping items and hand/weapon restrictions are not enforced. |
| [Foreign Object (Body)](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.foreign.object.yaml) | No Active Effect modifier | Implemented after audit: the move counter warns above 4 m/yd on foot with a manual Apply 5 damage card; no automatic damage. |
| [Foreign Object (Head)](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.foreign.object.h.yaml) | No Active Effect modifier | Implemented after audit: the move counter warns above 4 m/yd on foot with a manual Apply 5 damage card; no automatic damage. |
| [Lost Ear](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.lost.ear.yaml) | Death-save base +1; hearing Perception -4 selectable modifier | Hearing defaults OFF; movement-triggered next-turn restriction not enforced. |
| [Lost Eye](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.lost.eye.yaml) | Death-save base +1; ranged -4; sight Perception -4 selectable modifier | Sight defaults ON; perception context remains a user choice. |
| [Spinal Injury](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.spinal.injury.yaml) | Death-save base +1 | Next-turn lost Action is not enforced. |
| [Torn Muscle](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-body/criticalinjury.torn.muscle.yaml) | Melee -2 | No additional missing listed mechanic found. |
| [Whiplash](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/packs/core/critical-injuries-head/criticalinjury.whiplash.yaml) | Death-save base +1 | No additional missing listed mechanic found. |

## General statuses — all 28

| Status | Native / existing Combat Tools behavior | Missing / conditional behavior |
|---|---|---|
| Asphyxiating | Marker | Breath allowance, damage timing and incapacitation are not automated. |
| Blinded | Marker | Vision-based action restrictions/penalties are not automatically supplied by this marker. |
| Choking 1 | Marker; Combat Tools choke workflow records progress | Manual marker does not establish a grapple, advance choke damage, or trigger unconsciousness. |
| Choking 2 | Marker; Combat Tools choke workflow records progress | Same: automated resolution depends on the actual grapple workflow. |
| Cover | Marker; Combat Tools has explicit cover choices | Manual Cover marker alone does not establish obstruction, protect location, or resolve cover damage. |
| Deafened | Marker | Hearing restrictions and relevant check penalties are manual. |
| Drowning | Marker | Breath allowance and periodic damage not automated. |
| EMP | Marker; Combat Tools EMP workflow disables chosen equipment | Manual EMP marker alone does not choose/disable equipment; limb usability remains a separate gap. |
| Falling | Marker | Height, landing and falling damage not automated by status. |
| Grappled | Marker; Combat Tools grapple action creates -2 AE and relationship | Manual Grappled marker alone does not create -2 or relationship/movement rules. |
| Hidden | Marker | Does not itself set native token visibility or resolve stealth/awareness. |
| Human Shield | Marker; Combat Tools relationship/action workflow | Manual marker does not choose holder/target or establish interception. |
| Iron Grip | Marker; relevant Combat Tools grapple workflow | Manual marker does not establish the grip relationship. |
| Netrunning | Marker; native NET actions are available through their own workflow | Does not create a NetArch or Quickhack connection; Jacked In uses an actual connection. |
| On Fire (Mild) | No native status damage; Combat Tools now applies 2 HP at turn end | Covered by current Combat Tools native-ID handler, not by CPR itself. |
| On Fire (Strong) | No native status damage; Combat Tools now applies 4 HP at turn end | Covered; highest active fire severity wins. |
| On Fire (Deadly) | No native status damage; Combat Tools now applies 6 HP at turn end | Covered; removal/extinguish stops damage. |
| Prone | Marker; Combat Tools throw/sleep can apply it | Get Up Action cost and movement/action restrictions are not enforced by marker. |
| Radiation (Low) | Marker/HUD exposure | Dose, accumulated exposure and periodic damage not automated. |
| Radiation (High) | Marker/HUD exposure | Dose, accumulated exposure and periodic damage not automated. |
| Readied Action | Marker | No trigger/held-action execution or action expenditure bookkeeping. |
| Suppressed | Marker; Combat Tools suppressive-fire workflow resolves attack | Marker does not enforce taking cover or block disallowed actions. |
| Quick Fix | Marker/HUD indicator | No native treatment-effect binding or declared timer in catalog. |
| Unconscious | Marker; Combat Tools Sleep can wake on damage/action/expiry | Generic marker does not enforce action/vision restrictions; deliberately does not wake unrelated unconsciousness. |
| Lightly Wounded | Native wound state is HP-derived | Manual marker does not change HP or native wound state. |
| Seriously Wounded | Native HP-derived wound penalty and pain suppression | Manual marker does not force that state; normal native penalties follow HP. |
| Mortally Wounded | Native HP-derived penalties/death-save workflow | Manual marker does not change HP; death saves still need their workflow. |
| Dead | Marker; native death-save results handle their own presentation | Manual marker does not prevent actions or enforce all dead-state interactions. |

## Core drugs/pharma — all 15 catalog entries

| Status | Native / existing Combat Tools behavior | Missing / conditional behavior |
|---|---|---|
| Antibiotics | No native AE | Daily healing bonus, treatment schedule and one-week duration missing. |
| Rapidetox | No native AE | Does not automatically clear drug/poison/intoxication effects from a status toggle. |
| Speed Heal | No native AE; separate supplied Speedheal macro heals BODY+WILL | Status does not heal. Macro lacks once/day and mortally-wounded checks. |
| Stim | Native pain suppression | One-hour timer and once/day restriction missing. |
| Surge | No native AE | Sleep-deprivation immunity, 24-hour timer and once/week restriction not enforced. |
| Black Lace | Native pain suppression | Humanity loss/restoration, resistance/addiction transition, and 24-hour dose timer are not automated. |
| Black Lace Addiction | Native REF -2 | Primary-dose interaction/selection and addiction recovery need the native/user workflow. |
| Blue Glass | No native AE | Lost-action hallucination events, addiction resolution and 4-hour dose timer remain manual. |
| Blue Glass Addiction | No native AE | GM-triggered hallucination/lost action and addiction recovery remain manual. |
| Boost | Native INT +2 | 24-hour timer and secondary save/addiction transition missing. |
| Boost Addiction | Native INT -2 | Secondary save/recovery and correct enabled effect selection remain manual. |
| Smash | Native +2 to six listed skills | 4-hour timer and secondary save/addiction transition missing. |
| Smash Addiction | Native -2 to six listed skills | Cravings/recovery and effect activation are manual. |
| Synthcoke | Native REF +1; addicted-primary variant compensates addiction modifier | 4-hour timer, secondary save and paranoia events missing. |
| Synthcoke Addiction | Native REF -2 | Native variant selection is required; no automatic addiction save/recovery. |

## Additional prepared drug/pharma icons

| Effect | Native automation | Gap |
|---|---|---|
| Berserker | Addiction death-save +1 only | Primary critical-bonus immunity and halved wound/facedown penalties not implemented; native description explicitly calls out manual penalty adjustment. Ten-minute timer, Humanity and secondary save missing. |
| Prime Time | COOL/WILL +2; addiction COOL -2 | Temporary/permanent Humanity handling and four-hour timer missing. Description says maximum HP must not increase, but the AE has no compensating HP adjustment; verify live derived HP. |
| Sixgun | Primary MOVE/REF -2, NET Speed +2; addiction NET Speed -2 | Unsafe Jack Out exception and Humanity-for-extra-NET-Action not implemented. Four-hour timer missing. Addicted-primary YAML gives MOVE/REF +2 rather than -2: source-data discrepancy requiring live validation. |
| Timewarp | Initiative-roll +3; addiction -2; addicted-primary compensation | Existing combatant initiative is not automatically increased. One-minute/20-round timer and secondary save missing. |
| Sedative | No native AE | Willing/unwilling resistance, unconsciousness, wake rules, surgery modifier and durations not supplied by native item consumption. Current Sleep helper is not wired to Sedative. |
| Veritas | Native -5 to six listed skills | Resistance check and ten-minute timer not automated by consumption. |

## Priority gaps

1. Assign timers from explicit known drug/condition durations at application, including manual/native activation; do not assume pack AEs supply them. Keep addiction distinct from a temporary dose.
2. Movement-dependent injury events: both Foreign Objects (Broken Ribs warning implemented); Damaged/Lost Ear next-turn movement restriction.
3. Cracked Skull damage multiplier and Spinal Injury next-turn Action loss. Dismembered Leg dodge eligibility is now enforced.
4. Limb usability and held-item/weapon restrictions; current native hand count does not read these injuries.
5. Sense/speech/hand contextual modifiers: prefer native selectable modifiers and expose the relevant choice, rather than applying them indiscriminately.
6. Drug-specific missing mechanics and the two Hornet data discrepancies above.

## Other boundaries

- Adding a critical injury marker/item is not itself a new damage application. Ordinary attack critical bonus damage is handled by the damage workflow; temporary flashbang/teargas injuries must not add that bonus.
- End-of-combat cleanup currently preserves critical injuries and only recognizes effects with native numeric durations. A timed-in-prose effect with null duration is still a gap.
- Fire and native-ammo exposure warnings are covered by the recent Combat Tools integration, rather than by native generic status mechanics.
- Applying generic Grappled/EMP/Human Shield markers does not construct the corresponding combat relationship or equipment selection.
- Minimum-MOVE handling and the noted Hornet data discrepancies are source-level concerns, not claimed live reproductions.

## Runtime source evidence

- [Native actor calculations, damage and hands](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/modules/actor/cpr-actor.js): death-save item flags, HP-derived wounds, fixed headshot multiplier, raw modified stats and hand count.
- [Native drug consumption](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/modules/item/types/cpr-drug.js): enables selected effects and consumes quantity; does not assign declared prose durations or resolve secondary saves.
- [Core drug data](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/tree/v0.92.4/src/packs/core/drugs) and [Hornet pharmacy data](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/tree/v0.92.4/src/packs/dlc/hornets-pharmacy): native effect keys, conditional modifiers and empty duration fields.
- Combat Tools: src/scripts/status-sync.ts, status-catalog.ts, instant-lifetime.ts, effect-duration.ts, hud-conditions.ts, grapple/workflow.ts, movement.ts, evasion-rules.ts, damage-flow.ts and emp-state.ts.
