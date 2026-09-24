# Combat Tools — flow and chat-card map

Current source: Combat Tools 0.8.0, reviewed 2026-09-23. Code inspection and diagram-render validation are distinct from live multiplayer certification.

**M** below means **flags.pneuma-combattools**. For example, ChatMessage M.exchange means ChatMessage.flags.pneuma-combattools.exchange. **Transient** means dialog/client/GM memory, not durable document storage. Diagram IDs correspond to table rows. Native CPR dialogs may offer additional version-dependent controls. Every control remains subject to ownership, GM authority, settings and current state.

[Open all rendered diagrams](flow-diagrams.html) for a browser-readable version without a Mermaid plugin. The tables below remain the reference for controls and storage.

## Overview

~~~mermaid
flowchart TD
 HUD["Target HUD / Self-CTH"] --> A["Single-target attack"]
 HUD --> B["Area attack / suppression"]
 HUD --> G["Grappling"]
 HUD --> Q["Jack-In / Quickhack / Eject"]
 A --> D["Damage / statuses / critical injury"]
 B --> D
 A --> I["Instant effects / Microwaver"]
 B --> I
 I --> E["EMP cyberware selection"]
 Q --> E
 Q --> C["Conditions / native damage / manual instructions"]
 MOVE["Token movement"] --> R["Ribs / Foreign Object / ear reminders"]
 MENU["Chat Manual Rolls menu"] --> MAN["Damage / injury / group / standard / custom / STAT"]
 MAN --> D
 API["HUD API / native notices"] --> NOTICE["Private flash / queued / timed HUD messages"]
 Q --> STATE["Read-only intrusion state hook"]
 STATE --> VT["Optional Visual Tools renderer"]
 E --> EXP["Expiry / combat cleanup"]
 C --> EXP
~~~

Combat Tools attacks always use combat cards. QuickHack retains a separate enable switch. Arrows indicate possible branches, not effects that occur on every attack.

## 1. Single-target attacks

Sources: [attack-menu.ts](../src/scripts/attack-menu.ts), [combat-resolution.ts](../src/scripts/combat-resolution.ts).

~~~mermaid
flowchart LR
 A1["A1 Initiate"] --> A2["A2 Attack dialog"]
 A2 --> A3["A3 Hidden attack / response"]
 A3 -->|Evade| A4["A4 Defense / payment"]
 A3 -->|Don't Evade| A5["A5 Hit or miss"]
 A4 --> A5
 A3 -->|GM cancel| A6["A6 Cancelled"]
 A5 --> D["Damage flow"]
 A5 -->|Microwaver hit| I["Instant effect"]
~~~

| Step | Surface / buttons | Storage and result |
|---|---|---|
| A1 | Target HUD weapon: attack, aimed, autofire, thrown/improvised. Self-CTH thrown weapon requires a target. | Transient source/target/item/mode. Area weapons branch to flow 3. |
| A2 | Native attack roll/confirm/cancel; modifiers. | Native roll transient until publication; native ammo/inventory mutation. Aimed location: Actor.flags.cyberpunk-red-core.aimedLocation. |
| A3 | Chat Evade (configured cost label) / Free evasion, Don't Evade; GM Cancel exchange. RAW eligible NPCs can auto-respond. | ChatMessage M.exchange: saved attack/dice, UUIDs, DV, mode, encounter, state=waiting. Attack visually withheld. Responder claims transient in GM memory. |
| A4 | Native Evasion dialog; Finish payment if interrupted. | M.exchange defense/state=applying; Actor LUCK and M.evasionPayment; Combat evasion usage records. |
| A5 | Revealed rolls/result; Roll damage icon, Shift-click options. Manual damage override can remain on misses. | Same card state=resolved, hit and defense saved. Saved attack dice revealed. Microwaver hit creates effect card. |
| A6 | No ordinary response controls. | state=cancelled. Cancellation is not general undo. |

## 2. Shared damage, statuses and critical injury

Sources: [damage-flow.ts](../src/scripts/damage-flow.ts), [damage-application.ts](../src/scripts/damage-application.ts), [critical-injury.ts](../src/scripts/critical-injury.ts).

~~~mermaid
flowchart LR
 D1["D1 Roll damage"] --> D2["D2 Choose application / statuses"]
 D2 --> D3["D3 Apply"]
 D3 --> D4["D4 Result / native undo"]
 D2 --> D5["D5 Critical injury"]
 D3 -->|Interrupted| D6["D6 GM review"]
 D6 --> D4
~~~

| Step | Surface / buttons | Storage and result |
|---|---|---|
| D1 | Roll damage; native options; Finish damage roll; GM Release unfinished damage roll. | ChatMessage M.exchange.damage, M.manualRoll.damage for ad-hoc damage, or M.aoe.exchange.damage for shared AoE. status=rolling, user/nonce. |
| D2 | Apply to named defender / to selected target; Shift-click options; three effect slots; optional Interact With Armor / Half Armor SP. AoE uses row lightning buttons. | damage.status=rolled; result values/HTML/sixes/status IDs saved with parent card. |
| D3 | Application controls blocked while applying. | Native Actor HP, armor/shield and selected statuses updated; damage.status=applying then applied; application IDs and captured summaries saved. AoE individual state: M.aoe.rows[].damage. |
| D4 | Expand native application details; native Undo when supplied. | damage.applications retains result HTML; damage.selectedTargets retains selected-target application receipts. Native undo uses captured damage data; not universal secondary-effect rollback. |
| D5 | Critical-injury control when eligible; native table workflow. | Native critical-injury Item/ActiveEffects and native chat output. Configured head/body tables and critical-method settings apply. |
| D6 | GM Mark resolved after GM review. | review/applying retained to prevent blind replay. GM checks actor before acknowledging; button does not calculate missing mutations. |

## 3. AoE and suppression

Sources: [aoe/workflow.ts](../src/scripts/aoe/workflow.ts), [movement.ts](../src/scripts/aoe/movement.ts), [smoke.ts](../src/scripts/aoe/smoke.ts).

~~~mermaid
flowchart TD
 B1["B1 Place area"] --> B2["B2 Attack / impact"]
 B2 -->|Explosive miss| B3["B3 GM scatter"]
 B2 --> B4["B4 Recipient decisions"]
 B3 --> B4
 B4 -->|Avoided| B5["B5 Move outside"]
 B4 -->|Hit| B6["B6 Damage / effects"]
 B4 -->|Suppression| B7["B7 Resist / cover obligation"]
 B5 --> B8["B8 Complete / hide"]
 B6 --> B8
 B7 --> B8
~~~

| Step | Surface / buttons | Storage and result |
|---|---|---|
| B1 | Grenade/launcher/shell/Suppressive Fire HUD entry. Left-click placement; Escape/right-click cancel. | Local measured-template preview transient; early cancellation avoids ammo expenditure. |
| B2 | Native attack dialog. | ChatMessage M.aoe: geometry/settings/recipient snapshots, exchange; phase=scatter/responses. Native ammo expenditure. |
| B3 | GM Place actual blast. | Updated area/recipients in same M.aoe record. |
| B4 | Per-row Evade / Don't Evade, optional Cover Up, or Concentration. GM Add selected token, Exclude target, Override as affected, affected/unaffected review, Release unfinished response. | M.aoe.rows[]: UUID, eligibility, state=waiting/rolling/hit/miss/other, claim, total/HTML. Saved attackDiceRevealed guard prevents repeated animation. |
| B5 | Move outside AoE; pick destination. | Token coordinates; row moved/moveCost. Optional combatant MOVE spent/debt records; ordinary tracked movement also Token M.movement. |
| B6 | Roll shared damage; per-row Apply shared damage (Shift options); instant-effect controls; GM damage reset/review; manual-effects completion for unknown special ammo. | M.aoe.exchange.damage shared; rows[].damage / instant individual. Actor mutations from flows 2/4. |
| B7 | Concentration; GM coverage overrides. | Row outcome. Failure records Move to cover / Run if needed. General action enforcement remains manual. |
| B8 | GM Show/Hide attack area; Remove smoke when present. | M.aoe.areaHidden / resolutionComplete; MeasuredTemplate M.areaMessage / areaShape. Completion hides attack marker. Card deletion removes attack template. Separate template M.smoke expires independently. |

## 4. Instant effects / ammunition

Sources: [instant-effects.ts](../src/scripts/instant-effects.ts), [instant-lifetime.ts](../src/scripts/instant-lifetime.ts).

~~~mermaid
flowchart LR
 I1["I1 Initiate"] --> I2["I2 Resist"]
 I2 -->|Resisted| I5["I5 Finished"]
 I2 -->|Failed| I3["I3 Apply"]
 I1 -->|No roll required| I3
 I3 --> I5
 I3 -->|EMP / Microwaver| E["Disablement flow"]
 I3 -->|Interrupted| I4["I4 GM review"]
 I4 --> I5
~~~

| Step | Surface / buttons | Storage and result |
|---|---|---|
| I1 | AoE row, Microwaver hit or module effect integration/API. | Standalone ChatMessage M.instant.effect or M.aoe.rows[].instant: effect ID, actor, state. Source attack can hold M.microwaverClaim. |
| I2 | Resist DV…; native skill dialog; GM unaffected; GM release roll. | pending → rolling → resisted/failed; total/HTML/user/nonce saved. |
| I3 | Apply [effect]; GM unaffected. | failed → applying → applied. Actor damage/status/injury changes and saved summary. EMP/Microwaver opens a separate selection request. |
| I4 | GM mark resolved after checking target. | review/applying until acknowledged. |
| I5 | Sleep: Wake (touching Action). Incendiary: Extinguish (Action). Otherwise no further normal decision. | Native duration/statuses/effects/temporary injury Items; M.instantLifetime where used. Actor M.lastBurnTurn prevents duplicate burn damage. |

## 5. EMP / Microwaver / cyberware disablement

Sources: [emp.ts](../src/scripts/emp.ts), [emp-state.ts](../src/scripts/emp-state.ts), [emp-behavior.ts](../src/scripts/emp-behavior.ts).

~~~mermaid
flowchart LR
 E1["E1 Create request"] --> E2["E2 Open chooser"]
 E2 -->|Manual / shortlist| E3["E3 Select X"]
 E2 -->|Random| E4["E4 Draw once"]
 E3 --> E5["E5 Disable / hardened no effect"]
 E4 --> E5
 E5 --> E6["E6 Restore on expiry"]
~~~

| Step | Surface / buttons | Storage and result |
|---|---|---|
| E1 | Triggered by EMP/Microwaver or successful Short Circuit/Cyberware Malfunction. | Combat M.empRequests[id]: actor/source/count/chooser/policy/method/duration. Shortlist offered IDs saved once. ChatMessage M.emp points to combat/request. |
| E2 | Choose affected items; chooser dialog Cancel. | Pending request retained; closing does not redraw shortlist. Players see only offered items in shortlist mode. |
| E3 | Item checkboxes; Disable selected. | Current eligible pool/saved offer validated. Counts normally EMP/Microwaver 2, Short Circuit 3, Malfunction 1. |
| E4 | Draw and disable. | GM samples; selected IDs saved before item writes. Hardened consume policy spends pick with no disablement/reroll. |
| E5 | Disabled names and hardened/unaffected outcome. Retry pending request after interruption. | Combat M.empRecords; Item M.empCombats or timedDisables, itemMarkers; actor effects with empItem/empCombat/disableRequest and limb/frame flags. |
| E6 | No ordinary restoration button. | EMP clears on combat end; timed causes expire independently. Native effects resume; limb/frame consequences track remaining active causes. |

World empBehavior controls eligibility/weight/chooser behavior. New requests snapshot policy; changing settings does not reinterpret existing requests.

## 6. Grappling

Sources: [workflow.ts](../src/scripts/grapple/workflow.ts), [state.ts](../src/scripts/grapple/state.ts), [combat-hud.hbs](../src/templates/combat-hud.hbs).

~~~mermaid
flowchart TD
 G1["G1 Grab / Escape / Break"] --> G2["G2 Opposed Brawling"]
 G2 -->|Grab wins| G3["G3 Hold / take object"]
 G2 -->|Failure| G7["G7 Contest finished"]
 G3 -->|Take| G7
 G3 -->|Hold| G4["G4 Active grapple"]
 G4 -->|Next grappler turn| G5["G5 Choke / Throw / Release"]
 G4 -->|Defender Escape| G1
 G5 -->|Choke| G4
 G5 -->|Throw / Release| G7
 G2 -->|Escape or Break wins| G7
~~~

| Step | Surface / buttons | Storage and result |
|---|---|---|
| G1 | Target Close Combat → Grab/Break. Defender Self-CTH → Close Combat → Escape — attacker name. Confirmation/native Brawling. | Transient roll, then Combat M.grapples[id], or Scene M.grapples outside combat. ChatMessage M.grapple mirrors/reference record. |
| G2 | Chat Roll Brawling; GM End. | waiting; response claim transient; saved attack/defense HTML/totals. Ties favor responder. |
| G3 | Chat Hold Target / Take Held Object; GM End. | choice. Take ends with manual-transfer instruction. Hold applies effects and saves tokenPlacement. |
| G4 | Grappler Self-CTH Close Combat: Choke/Throw/Release — defender name. Defender Escape — attacker name. | active record, establishedRound, participant UUIDs. Native -2 effects; held-token movement/scale. Chat M.grappleHistory freezes original established card. |
| G5 | Attacker controls unlock next grappler turn; Choke cannot repeat same round. | Actor M.grappleDamage duplicate-write receipt; record revision/choke/lastAction. Separate action result card. Choke can apply Unconscious; Throw deals direct HP damage plus Prone and ends grapple. |
| G6 Recovery | Chat Retry [operation]; GM End. | Record operation/revision protects interrupted writes. Reset/deletion cleanup restores scale and removes own effects. |
| G7 | Original card remains intact; separate result for follow-up. No normal active-grapple buttons in chat. | ended state mirrored to original M.grapple; active map entry removed on successful save; own grapple effects removed, scale restored. |

Escape creates a new opposed contest; original grapple remains until successful escape. Attacker next-turn gating is validated by GM, not merely disabled buttons. Outside combat timing is table-managed.

## 7. Jack-In / Quickhack / Force Out

Sources: [workflow.ts](../src/scripts/quickhack/workflow.ts), [connections.ts](../src/scripts/quickhack/connections.ts), [effects.ts](../src/scripts/quickhack/effects.ts), [force-out.ts](../src/scripts/quickhack/force-out.ts).

~~~mermaid
flowchart TD
 Q1["Q1 Jack-In"] --> Q2["Q2 Detection / connection"]
 Q2 --> Q3["Q3 Hack / DV roll"]
 Q3 -->|Failure| Q4["Q4 Failure card"]
 Q3 -->|Success| Q5["Q5 Effect / awareness"]
 Q5 -->|Disable cyberware| E["EMP flow"]
 Q2 -->|Detected| Q6["Q6 Force Out"]
 Q5 -->|Detected| Q6
 Q6 -->|Target wins| Q7["Q7 Ejected"]
 Q6 -->|Runner wins or tie| Q2
 Q2 -->|Jack Out| Q8["Q8 Disconnected"]
~~~

| Step | Surface / buttons | Storage and result |
|---|---|---|
| Q1 | HUD Jack-In / native launcher entry; native Interface roll/cancel. | Transient roll; checks target, range/sight, settings and combat context. Private native roll messages may be separate. |
| Q2 | Combined result; Force Out if alerted; detected incoming HUD/ejection shortcuts. | ChatMessage M.quickhack type=jackIn, UUIDs, alerted/audience/identity. Combat M.quickhackConnections[pair] active, connection/card ID. Outside combat no tracked connection. |
| Q3 | Select hack; native Interface dialog; requires active connection. | New M.quickhack type=quickhack with hack ID, connection, success, alerted, effect flags. |
| Q4 | Result; awareness controls if applicable. | Failure stored; no successful effect. |
| Q5 | Automatic summary; Synapse Burnout Roll Damage; native downstream damage controls; guided/manual instructions as applicable. | effectResolved/effectFailed; native statuses/items/duration. Movement effect flags quickhackEffect/quickhackAmount. Short Circuit/Malfunction → flow 5. Successful awareness retains silent-Lure exception. |
| Q6 | Force Out on awareness card or Eject NetRunner — name/Unknown Netrunner on HUD; target Concentration, player runner Interface prompt (NPC resistance automatic). | Pending request in GM memory/socket; new result card M.quickhack={type:forceOutResult,ejected}. |
| Q7 | Ejected outcome. | Connection state=ejected; hacks/re-Jack-In blocked for encounter. Prior effects are not universally undone. |
| Q8 | HUD Jack In/Out, no roll. | state=disconnected; fresh Jack-In allowed. |

Audience may be public, source owners, target owners or GM. Force Out reuses awareness audience. Deleting awareness cards does not erase connections or detected ejection choices; Combat stores awareness and audience. Disabling QuickHack blocks new/pending integration actions but retains existing effects/connections.

## 8. Broken Ribs and Foreign Object / automatic lifecycle

Sources: [injury-mechanics.ts](../src/scripts/injury-mechanics.ts), [movement.ts](../src/scripts/movement.ts), [instant-lifetime.ts](../src/scripts/instant-lifetime.ts).

~~~mermaid
flowchart LR
 R1["R1 Track movement"] --> R2["R2 Over threshold?"]
 R2 -->|Over 4 m/yd| R3["R3 Warning"]
 R3 -->|Apply 5 damage| R4["R4 HP / receipt"]
 R3 -->|Movement reset| R5["R5 Withdrawn"]
~~~

| Step | Surface / buttons | Storage and result |
|---|---|---|
| R1 | Token movement / tracking controls. | Token M.movement: combat/turn/start/spent. Separate AoE budget/debt on Combatant. |
| R2 | Automatic Broken Ribs / Foreign Object (Body/Head) check. | Injury inventory and Combat M.evasionEpoch checked. |
| R3 | Owner/GM Apply 5 damage. | ChatMessage M.brokenRibs: injury/actor/token/combat/turn/epoch/distance/applied; separate card per injury. |
| R4 | Applied result; no duplicate application. | Actor HP -5 and M.ribsApplications receipt; card applied=true. |
| R5 | No Apply control when threshold/encounter invalid. | Eligibility recalculated; withdrawal is not damage undo. |

Burning and duration expiry normally mutate actors/items/effects without another decision card. Initiative uses native combat rolls/cards. Combat-bar layout, alert HUD, incoming detection banners, status picker and item markers are supporting interfaces rather than separate chat decision trees.

## Storage and recovery reference

| Owner | Principal data | Persistence |
|---|---|---|
| ChatMessage | exchange, aoe, instant, emp, grapple, grappleHistory, quickhack, brokenRibs, manualRoll under M | Saved card state/history. |
| Combat | grapples, quickhackConnections, empRequests, empRecords, evasion usage/epoch | Encounter coordination; subsystem-specific cleanup. |
| Scene | M.grapples | Outside-combat grapples. |
| Token | M.movement; native coordinates/texture | Turn movement and grapple positioning. |
| Combatant | AoE movement spent/debt flags | Turn budgets/future debt. |
| Actor | Native HP/LUCK/armor; M.grappleDamage, ribsApplications, injuryReminders, lastBurnTurn, evasionPayment | Mechanics and receipts. |
| Item | Native injury/inventory; M.empCombats, timedDisables, itemMarkers | Item state and disablement causes. |
| ActiveEffect | Native changes/statuses/duration plus module origin flags | Conditions, frame/limb/grapple/Quickhack effects. |
| MeasuredTemplate | M.areaMessage, areaShape, smoke | Display area / independent smoke expiry. |
| World settings | EMP, area, evasion, Quickhack policies | New-work defaults, often copied into requests. |
| Client/GM memory | Dialogs, busy sets, socket replies, claims, queues | Transient, not saved encounter state. |

A resolved attack does not imply damage or effects are finished. Most mutations require an active GM coordinator. Retry/Finish/review controls distinguish unfinished document writes from actions that are safe to repeat. Native CPR cards are delegated surfaces whose exact controls depend on the installed system. This map follows current handlers where older feature documents have superseded descriptions.

## Injury reminder lifecycle

Native injury creation/status change → owner/GM animated HUD warning; Spinal Injury → saved Actor M.injuryReminders → advisory next-turn warning. Ear injury + over 4 m/yd on foot → same saved reminder queue → advisory next-turn Move Action warning. End of turn → optional HUD reminder of unpaid movement-injury cards. Perception/speech roll dialog → contextual reminder. No action/movement enforcement. Cracked Skull correction occurs within captured aimed-head damage application; the native undo summary includes corrected HP damage.


## 9. Manual rolls and group checks

Sources: [manual-rolls.ts](../src/scripts/manual-rolls.ts), [manual-roll-state.ts](../src/scripts/manual-roll-state.ts).

~~~mermaid
flowchart TD
 M1["M1 Open Manual Rolls"] --> M2["M2 Choose type / inputs"]
 M2 -->|Damage| M3["M3 Native damage result"]
 M3 --> D["Shared damage / effects flow"]
 M2 -->|Critical injury| M4["M4 Native table result"]
 M4 --> M5["M5 Apply injury to selected actor"]
 M2 -->|Standard / custom / STAT| M6["M6 Result card"]
 M2 -->|GM group request| M7["M7 Shared waiting rows"]
 M7 --> M8["M8 Player native skill roll"]
 M8 --> M9["M9 Inline total / outcome"]
 M9 --> M10["M10 Click total: details and modifiers"]
 M8 -->|Abandoned claim| MR["MR GM release / reset"]
 MR --> M7
~~~

| Step | Surface / buttons | Storage and result |
| --- | --- | --- |
| M1 | Chat die; menu entries, keyboard arrows/Escape. | Local flyout only. |
| M2 | Type-specific form; Roll or Request rolls; native close. | Transient label/modifier/dice/stat/skill/DV/players. |
| M3 | Selected-target bolt, three effect slots, armor toggles, injury/recovery controls when eligible. | ChatMessage M.manualRoll kind=damage; damage snapshot. Uses flow 2. |
| M4 | Head/body native table result; Apply injury control. | M.manualRoll kind=critical, injury source/HTML. |
| M5 | Apply to selected actor; receipts. | Native injury Item/ActiveEffects; injuryApplications and busy/review state on manual card. No automatic injury bonus damage promised by this standalone table flow. |
| M6 | Native/Foundry roll details; STAT success/fail. | Chat content/native roll presentation; no ongoing manualRoll request state. Standard uses native critical behavior; Custom uses XdY+modifier; STAT compares d10 strictly below current stat. |
| M7 | Requested skill and optional visible/hidden DV; per-player Roll button. | M.manualRoll kind=group; rows with User ID, Actor UUID, waiting state. |
| M8 | Native skill dialog; submit/cancel. | Row rolling claim/nonce, then saved total/HTML. GM serializes commit. |
| M9 | Green Success / red Fail only if DV set; ties fail. | Row done; no automatic actor consequence. |
| M10 | Click total again to collapse. | Client DOM expansion only; modifiers expanded inside the revealed roll. |
| MR | Permission-specific GM release/reset controls. | Row claim reset; already published results require deliberate recovery. |

## 10. HUD messaging and optional visual integration

Sources: [hud-messages.ts](../src/scripts/hud-messages.ts), [eye-hud.ts](../src/scripts/eye-hud.ts). Copyable examples: [API guide](hud-api.md).

~~~mermaid
flowchart TD
 H1["H1 Macro / module send"] --> H2["H2 Validate audience and payload"]
 H2 -->|Self| H3["H3 Local receive"]
 H2 -->|GM remote| H4["H4 Foundry module socket"]
 H4 --> H3
 H3 -->|Flash| H5["H5 Four-second center message"]
 H3 -->|Queued / timed| H6["H6 Six-second arrival / HUD row"]
 H5 --> H8["H8 Removed"]
 H6 -->|Dismiss / remove / timed expiry| H8
 H6 -->|Same source and ID| H6
 Q["Combat connection / focus changes"] --> H7["H7 Read-only intrusion getter and hook"]
 H7 --> V["Visual Tools owns optional glitch renderer"]
~~~

| Step | Surface / buttons | Storage and result |
| --- | --- | --- |
| H1 | Script macro/module API or GM message form. | Caller options transient; send returns ID. |
| H2 | No additional confirmation UI. Invalid input throws. | source/id/text/mode/duration and connected User IDs resolved. |
| H3 | Addressed viewer receives. | Local Map keyed by source+id; no ChatMessage or saved history. |
| H4 | No player button. | Socket event to connected recipients; no offline replay or acknowledgment. |
| H5 | Flash-only, no queued Clear row. | Local DOM/timer; four seconds, excluded from list(). |
| H6 | Dismiss button at left; incoming attacks additionally open their card. | Queued expires=0; timed expiry timestamp. Three visible rows; queued overflow retained. Animation duration is not message lifetime. |
| H7 | Neural Intrusion status and right-click Eject remain Combat Tools controls. | Combat connection is authoritative; getter/hook exposes focused actor UUID or undefined. Consumer owns its rendering/settings. |
| H8 | No follow-up. | Local message/flash removed. Other clients' copies unchanged unless remotely removed. Reload clears API state. |

## 11. Combat bar and movement permissions

~~~mermaid
flowchart LR
 C1["C1 GM mode / client layout"] --> C2["C2 Select / navigate / initiative"]
 C2 --> C3["C3 Owner End Turn"]
 C3 --> C4["C4 GM verifies current turn"]
 C4 --> C5["C5 Native next turn"]
 C5 --> C6["C6 Movement origin / effects / reminders"]
 C2 --> MV["Accepted token movement"]
 MV --> R["Movement and injury flow 8"]
~~~

| Step | Surface / buttons | Storage and result |
| --- | --- | --- |
| C1 | Gear, four positions, sizes/minimize; GM movement mode icons. | Client display settings; world movement/default mode settings. |
| C2 | Portrait, native context controls, round initiative flyout. | Native selection/Combatant initiative/visibility; layout is client DOM. |
| C3 | End Turn for owner or GM. | Request identifies exact Combat/current participant; transient pending reply. |
| C4 | No extra dialog normally. | GM rejects stale/duplicate/unauthorized turn advance. |
| C5 | Native turn controls/result. | Combat round/turn updates; native initiative ordering preserved. |
| C6 | Counters, start marker, advisory HUD and condition state. | Token movement reset; scoped expiry/Actor reminders; no general action budget. |

All graphs show optional branches, not mandatory extra actions. HTML/CSS is presentation; document flags and native documents own mechanics. Hidden DV/results are tabletop presentation, not client-data secrecy.
