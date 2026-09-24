# Combat Tools feature inventory

Cover Up clarification (0.8.4): explicitly a no-roll alternative to Evasion, available without evasion eligibility. Settings separate its effects from Evasion roll rules; behavior is unchanged.

## Area targeting (0.8.4)

Initial AoE aim squares must have sight-wall line of sight from the attacker. Invalid squares hide the preview and cannot be placed; sight is rechecked before ammunition consumption. Explosives retain a labeled amber one-square original-target marker after GM scatter, sharing area visibility and chat-deletion cleanup. GM scatter remains manual.

## Damage on misses (0.8.4)

Missed attacks disable the damage drop. A GM-only Allow damage on miss button enables damage for that exchange without changing its miss outcome. The coordinator also rejects unapproved damage requests.

## Bow loading (0.8.4)

Targeted attacks with an empty native bow/crossbow prompt for compatible in-stock ammunition and quantity before the attack roll. The currently attached ammo is preselected while available. Native installation/reload handles inventory; loaded bows bypass selection, canceling selection does nothing, and canceling the subsequent attack retains the loaded arrow.

## Grapple fixes (0.8.4)

Grapple chat rendering ignores incomplete creation references until the full record is saved, preventing missing-token errors.

Failed escape and third-party break attempts identify the attempted action instead of reporting Grab failed. Break/escape confirmation no longer uses Grab instructions.

## Settings defaults (0.8.3)

Biomon defaults to top-left and Crew Tools integration defaults on, with standalone fallback when unavailable. Saved client preferences are preserved. The Homebrew settings button reserves its full label width beside the evasion dropdown.

## Encounter consistency (0.8.2)

Damage-applied conditions without timers now carry encounter cleanup ownership. End/reset removes only newly activated conditions from that encounter, including incendiary fire and sleep Prone. Existing conditions, critical injuries and Dead remain.

Active scene encounter selection is shared across attacks, grapples, QuickHack, movement, EMP and effect durations. Saved actions retain their original encounter across tracker/scene changes; ambiguous encounters and reset contexts fail clearly. Clean-environment implementation; no new card migration. See [encounter selection](docs/encounters.md).

Current source: release 0.8.3, reviewed 2026-09-24. “Implemented” means present in source and covered to varying degrees by automated checks; it does not imply live multiplayer certification. Historical drafts are in [the archive](docs/history/pre-0.8.0-refresh/IMPLEMENTED_FEATURES.md).

## Combat and damage

- Target-aware ranged, aimed, Autofire, melee, unarmed, martial-arts and thrown attacks reuse CPR rolls and equipment data.
- Native attack results are calculated once and visually withheld until defense decisions resolve; existing dice are revealed without rerolling.
- Evade / Don't Evade, unaware-defender handling, RAW eligibility, disabled ranged evasion, and configurable homebrew evasion.
- Optional automatic NPC evasion only under RAW; player-owned actors retain decisions.
- Shared damage roll/application UI, native damage options with Shift-click, named target and selected-target application, and persistent Applied to receipts.
- Three Add Effects slots; collapsible Instant Effects, Body Crits, Head Crits, Drugs, Pharma and Misc. Addictions and wounded-state entries are excluded from this picker.
- Interact With Armor and Half Armor SP (round up); optional on normal/native damage cards, always shown on ad-hoc damage cards. Armor bypass disables ablation for that application.
- Native critical-injury tables/items, damage-method configuration, duplicate-injury handling and captured native damage details/undo where available.
- Interrupted-roll/payment/application recovery controls; uncertain application is marked for GM review rather than blindly repeated.

## Areas and effects

- Grenade, rocket and shotgun-shell placement, wall-clipped recipient coverage, native ammo handling, GM scatter placement and target-list corrections.
- Individual evasion and relocation; optional MOVE costs, debt and Cover Up homebrew.
- One shared damage roll with per-target application; results below the shared roll; GM Show/Hide attack area and automatic completion hiding.
- Suppressive fire with native attack and individual Concentration checks; recorded cover obligation, manually adjudicated actions.
- Armor-Piercing and Smart ammunition handling; reusable Poison, Biotoxin, EMP, Microwaver, Flashbang, Ignite, Sleep, Teargas and Smoke flows.
- Native fire recognition and once-per-ended-turn damage at strongest severity; Extinguish, Sleep wake-on-damage/touch, temporary sensory injuries and timed cleanup.
- Persistent scene smoke independent of its attack marker/card; footprint and expiry saved. Smoke penalties and sensory interaction remain manual.

## Grapples, QuickHack and EMP

- Opposed Grab, Hold Target / Take Held Object, Escape and third-party Break Grapple.
- Self-HUD Close Combat controls identify the other participant. Choke/Throw/Release unlock after the establishing turn in combat; Choke has a once-per-round guard.
- Separate follow-up results preserve the original grapple card. Managed penalties, held-token following/scale and cleanup; held-object transfer remains manual.
- Jack-In, detection, connection tracking, Jack Out, eleven QuickHacks, Force Out and encounter-long ejection.
- Configurable QuickHack availability and result audiences; native Interface/Concentration rolls, range/wall sight and installed-program checks.
- Neural Intrusion and Jacked In indicators; multiple detected incoming connections have separate ejection choices. Connection awareness survives chat deletion.
- Implemented QuickHack condition/damage/disablement handling; Puppet, Lure and Shard Ejection outcomes require table adjudication. See [coverage](docs/quickhack.md).
- Shared EMP/Short Circuit/Cyberware Malfunction/Microwaver disablement, source-specific durations, overlapping causes and restoration.
- Manual/random/limited-shortlist selection; Fashionware/BioWare/foundational eligibility, foundational weights, hardened behavior, overlap avoidance and optional Internal Frame consequences.
- Disabled cyberware excluded from supported native rolls, attacks, DV previews and speedware eligibility; limb/frame consequences and Biomonitor reporting.

## HUD, combat bar and movement

- Combat bar at bottom left or top right, horizontal or vertical; 32–96 px portraits, scrolling, active-turn following, minimize and name-only tooltips.
- Fixed movement controls at the selected dock; turn controls at the opposite end, side-by-side left/right arrows, native initiative actions and owner End Turn.
- Native combatant visibility, right-click controls, sheet opening, pan/ping and GM pull-ping behavior.
- Default / No Movement / Combat Move / Free-Move modes and configurable mode for new combats.
- Players heading cycles Online / All / Minimized.
- Square-grid movement counters, scene-space start markers, collision-aware adjacent diagonal accounting, run indication and owner Reset. Reset is movement-only undo.
- Broken Ribs and both Foreign Object injuries have separate movement-damage cards and optional turn-end reminders.
- Native injury modifiers plus MOVE floor, Evasion restrictions and Combat Tools Cracked Skull headshot correction. Action/speech/limb restrictions are advisory; no general action economy.
- Biomonitor vitals/EKG, medical guidance, active drugs/pharma, cyberware and situational states; private incoming-attack and API messages.
- Player focus follows an owned selected token, assigned character's unique scene token, or a single owned token when no character is assigned. GM focus remains selection-based.
- Left/right HUD docking; top-right combat bar temporarily forces HUD left without overwriting the preference.
- Optional Crew Tools integration uses its shortcut API and retains status colors. Standalone and integrated HUD placement agree.
- Minimized EKG/name and notifications, hidden HP reveal on hover/focus, per-client animations and optional GM animation enforcement; reduced motion respected.
- Six-second queued message arrival with fast reveal; separate four-second flash messages.
- Hover EKG gated by Medtech, target Biomonitor or GM Always show EKG option; no numeric HP.

## Small controls and integrations

- Shift-click native head/body armor-ablation arrows to restore one SP through CPR's reverse-ablation path.
- Optional Martial Arts no-ablation rule retains half SP; generic attack-name display can hide weapon names.
- Native attack dialogs include clearer modifier presentation and space for unaware/improvised-damage fields.
- GM combat-bar hover status flyouts and native combatant visibility/defeated controls.

- Native token HUD retained; self/target routing, compact flyouts, targeted right-click, HUD sizing and icon color controls.
- Self-HUD alert toggle, thrown weapons/grenades and optional speedware initiative reroll.
- Ranged DV hover with elevation and optional Autofire; installed functional weapon/attachment filtering.
- Manual Rolls flyout with no initially selected entry; native Cyberpunk Critical Success/Failure, bounded custom dice, roll-under STAT, manual damage/critical injury and GM group requests.
- Group DV optional/hidden, per-player Roll buttons, green/red outcomes and click-total details with modifiers expanded.
- Positive-label Show armor controls setting, off by default; compact settings editor and four combat-bar position radios.
- Native status/injury/drug synchronization, custom status names/icons, and declarative native timed effects.
- Persistent item Used/Disabled badges without renaming items; marker API for other integrations.
- Shared chat button skin variables; stable hover/focus/selected/busy geometry and native card framing.
- HUD messaging API v2, instant-effect and item-marker APIs, plus read-only Neural Intrusion API/hook for Visual Tools.

## Boundaries

Requires an active GM for coordinated writes. Ordinary sheet/macro attacks are not converted wholesale into Combat Tools defense exchanges. Combat/action spending, held-object transfers, treatment, terrain destruction and conditional sensory rulings remain table responsibilities. Screen glitch rendering was moved to Visual Tools; the fire-screen experiment was canceled. See [backlog](BACKLOG.md) for remaining work and superseded requests.

Self-HUD Close Combat and thrown actions use compact readable flyouts without expanding the icon column.

Combat-bound cyberware disablements now clear on combat end/reset/deletion, including timed Microwaver and QuickHack causes. Startup cleanup removes stranded causes from ended/deleted encounters. Other ongoing combat causes and native disabled states are preserved. Automated regression coverage; live Foundry verification pending.

Self-CTH Close Combat and Thrown Weapons & Grenades flyouts now use the shared `.combat-heading` and list rows, with grapple icons, item artwork and the native improvised-weapon icon. Enabled CTH menu buttons share hover/focus background and inset outline tokens (`--pneuma-menu-hover-background`, `--pneuma-menu-hover-outline`) without changing layout; disabled actions remain dim. Existing action selectors are unchanged.

Automatic smoke obscuration: Combat Tools attacks check the attacker-center to target-center line against active saved smoke footprints; blast attacks use the chosen impact point. Crossing smoke adds the native −4 obscured-task modifier once. The attack dialog offers “Ignore smoke” for equipment or GM rulings, and native roll details retain the modifier. This runs at attack preparation, not continuously; it does not infer vision-equipment capabilities or vertical smoke volume.

Unreleased fix: cyberleg/internal-frame and QuickHack movement penalties now include native CPR per-change metadata; existing module penalty effects repair during reconciliation. This prevents the native modifier reader from failing on missing `changes` flags. Live affected-character verification pending.

Disabled cyberlimbs derive their state from combat/item disablement records. Only the mechanical MOVE penalty appears as an actor effect; redundant no-modifier limb effects from older versions are removed during reconciliation without clearing item causes or unrelated effects.

AoE re-placement: missed aim templates are gray and inactive while waiting for the GM landing point. `.pneuma-aoe-reposition` explains the state and placement bounds; the existing scatter action now reads “Place landing point.” A pointer-transparent `.pneuma-area-placement` status panel keeps placement/cancel instructions visible. The moving preview retains its color; accepting replaces the original template at the actual landing point.

Disablement audit fixes: active native leg-injury modifiers (including renamed native items) offset the cyberleg penalty; disabled/suppressed effects do not. Generic Disabled labels are display-only, including for evasion. Module-owned aggregate limb/frame penalties restore automatically while their item/combat causes remain active, including after manual effect deletion or disabling. Internal-frame policies derive from combat requests and item causes; legacy empty frame markers are removed. CPR modifier metadata repairs also cover Slow and Impair Movement.

- EMP settings streamlined: grouped selection controls, collapsible protection and frame options (open when configured), and conditional numeric fields. Existing behavior and saved values retained.
