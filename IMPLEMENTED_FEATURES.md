# Combat Tools feature inventory

Forge dice-handler lookup (released in 0.9.6): resolve CPR's dice handler from the running system script URL, falling back to recorded resource URLs and then the standard local path. This targets the same handler instance on Forge's CDN so native-animation suppression applies before Combat Tools replays saved results. Automated checks cover separate CDN/local instances, critical dice, replay, unrelated rolls, and missing resource history; live Forge verification remains pending.

Long weapon-name layout (released in 0.9.6): constrain native roll-card grid tracks inside Combat Tools messages so long titles truncate within the card instead of pushing dice totals outside it. Existing full-name tooltips remain. Browser regression checks cover spaced and unbroken names at narrow and wide chat widths.

Roller-specific DSN styles (released in 0.9.5): saved attack rolls (including AoE) and evasion responses retain the initiating user's ID. GM replay passes that user to Dice So Nice for appearance while leaving CPR's audience, blind-roll and synchronization arguments intact. Simultaneous attack/evasion dice retain independent styles. GM-made rolls use the GM style; old cards and missing users fall back to native playback. Non-DSN integrations retain native behavior. Automated identity and visibility-argument checks pass; live DSN rendering remains unverified.

Concurrent exchange dice playback (released in 0.9.5): attack and evasion dice animations are submitted together, allowing Dice So Nice's simultaneous-roll setting to combine them. Already-revealed attacks are not replayed. Combat resolution remains independent of animation completion, with playback errors still reported. Automated coverage verifies concurrent submission, original faces/roll mode, and no duplicate playback; live DSN verification remains pending.

Chat result delay (released in 0.9.5): GM-controlled world dropdown under Attack & Damage Cards, from 0–5 seconds in 0.5-second steps, default disabled. Every client pauses new module-rendered roll results while retaining the previous card with controls remaining clickable. Repeated renders and non-roll changes do not restart the delay; saved history is immediate. Includes module attack/defense, damage, group, critical, custom, quickhack and attached effect roll HTML; directly delegated native sheet rolls remain native. This fixed pause does not depend on Dice So Nice or guarantee animation completion. Automated timing checks cover overlap, history, attached effects, privacy and failure cleanup; live multiplayer verification remains pending.

Damage reversal indicator (released in 0.9.5): a check icon and Damage reversed label remain visible on the compact damage application row after successful reversal, including after rerender/reload. Pending and interrupted reversals have separate status labels; the breakdown need not be expanded.

Once-only Reverse Damage (released in 0.9.5): each compact damage application can be reversed once. A persisted message flag is claimed by the serialized active-GM handler before calling CPR's native reversal, blocking repeated clicks, competing clients, and repeats after rerender/reload. Other damage applications retain their own reversal. Interrupted reversals remain disabled for manual GM review to avoid restoring HP or armor twice. Existing compact receipts use their saved breakdown ID; new receipts also store the exact actor UUID. Native standalone CPR cards are unchanged.

NPC weapon-name hiding (released in 0.9.5): Hide attack weapon names for NPCs applies only to attackers without a player owner. Player-owned attackers retain visible weapon names even when the setting is enabled, including when rolled by the GM. Applies to single-target and area attacks. Existing saved setting values are preserved.

Attached effect resolution (released in 0.9.5): effects added through damage rolls, including Poison and Biotoxin, keep per-target resistance controls, rolls, damage, and results on their originating chat card. Microwaver resistance and linked EMP/QuickHack item-selection controls also stay on the source card. Effect state is stored separately from the parent attack/damage state so rerenders preserve it. Original roll visibility, owner/GM permissions, and native EMP chooser dialogs remain. Standalone effect API calls without a source still create standalone cards; existing separate cards remain usable. Automated verification is separate from live Foundry multiplayer acceptance.

Compact AoE Reset (released in 0.9.5): the per-target reset button displays only the shared GM badge and reset icon. Its Reset Player Action tooltip, accessible label, permissions, and behavior remain unchanged.

Non-character actor exclusion (released in 0.9.4, 2026-09-28): native container, Black ICE, and Demon actors bypass Combat Tools CTH menus and HUD positioning, EKG/DV hover, Biomonitor focus, movement tracking, turn indicators/alerts, character roll shortcuts, and attack/quickhack entry points. AoE target collection already excludes these types. Native controls remain available. Automated checks cover all three excluded actor types for hover and GM/player right-click behavior; live Foundry verification remains pending.

Translation-safe native lookups (released in 0.9.4, 2026-09-28): native ranged DV tables, including thrown grenades, resolve by verified CPR v0.92.4 document IDs before English table names. World tables and configured custom compendiums retain precedence, and DV caching remains. Evasion, Concentration, Brawling, Cybertech, Resist Torture/Drugs, Netrunner, and Targeting Scope use compendium source identity with name fallbacks; supported skills also accept system-localized names. Native critical-injury tables and injury pack selection use stable identities. Custom tables retain their existing name-based behavior. Self-ICE and other unverified/custom item names remain unchanged. Automated lookup and HUD checks pass; live Babele/Foundry verification remains pending.

AoE Reset Player Action (2026-09-28, released in 0.9.3): after a target responds, the row replaces its GM exclude/affected override with a labeled GM reset. Reset clears the response roll/reservation and Cover Up selection, recreates untouched instant choices, and restores the original response controls. It removes only Prone created by this row and uses existing suppression-source cleanup. Other targets and shared attack/damage rolls remain unchanged. Reset is blocked after movement, per-target damage, or effect application begins. Previously spent Luck is not refunded; reset is not a resource rollback.

Speed Heal status restored to the native token status picker under Pharmaceuticals (2026-09-27, released in 0.9.3). Uses the existing status ID and icon.

Optional character-sheet attack routing (released in 0.9.2): **Route character-sheet attacks through Combat Tools**, under Attack & Damage Cards, is a world setting and defaults OFF. Supported native weapon attack clicks preserve fire mode and use the existing dispatcher. Explicit token sheets retain their token; actor-directory sheets use one controlled matching token or one unambiguous scene token. Ordinary attacks require one visible target; area weapons can open placement without a target. Disabled routing, unsupported actions, absent GM, or ambiguous context retain native behavior. Once routed, cancellation/errors never replay a native attack. Hand grenades retain their HUD flow. Automated routing tests pass; live multiplayer verification remains pending.

The indicator size control is labeled “Indicator Scale” (previously “Indicator distance”); existing profiles retain their values.

Grenade placement (released in 0.9.3): area placement clears the native Token HUD. Hidden blast/aim templates and grid highlights remain non-rendering for GMs; manual Show restores them. Missed attacks use one brief instruction and a labeled “Place New Target Center” button. Browser fixtures cover HUD clearing, GM visibility, preview cleanup, and the labeled card; live Foundry verification remains pending.

Explosive area cards use the concise notice: “GM resolves all aspects of cover and terrain.”

Cleanup and refresh efficiency (unreleased, 2026-09-26): EMP refreshes track affected actors and combine queued changes; unrelated combat updates no longer scan world actors or refresh every EMP card. AoE refreshes use an event-maintained pending-card index rather than scanning chat history. HTML escaping, GM election, and actor enumeration are shared. Obsolete helpers/settings/translations are removed; the active flat -4 evasion rule and legacy readers remain. Targeted automated regression coverage is separate from live Foundry multiplayer verification.

Animated Turn Indicator (released in 0.9.3): 16 animated styles, including all ten roles. Self-CTH gear → Animated Turn Indicator provides Default Indicator and My Indicator buttons. Default appearance is stored in world settings and edited by the GM; NPCs and players without token or personal overrides inherit it. GM-only This Token overrides are stored on the scene TokenDocument, with priority over the player profile; Use inherited settings removes the token override. My Indicator stores a complete shared profile on the user document, so all viewers see the current character owner’s selected style, color, thickness, distance, opacity and speed. Assigned character user takes priority, then a stable non-GM owner; offline status does not change selection. Use Default Indicator removes the personal override. Animated/Static/Off display remains a client-only preference. Inputs auto-save; rapid slider changes are coalesced. Native active-scene, visibility, parenting and teardown behavior remain. Shared profile selection, permissions and browser form flows are tested; live multiplayer acceptance remains pending.

Biomonitor composite icon: shifted the heart and its crack 3 SVG units right; bell position and icon dimensions are unchanged.

Combat menu ownership (released in 0.9.3): targeted menus use their own pneuma-target-menu class instead of the native status-effects class, with explicit positioning, visibility and pointer behavior. They retain 230px width without module-specific exceptions. Native status pickers are unaffected.

## Hover EKG contrast (released in 0.9.3)

The 105×30 hover EKG has a 65% black backing and subtle dark waveform shadow for bright maps. Existing health colors, placement, animation and visibility rules are preserved.

## Blank icon color save fix (0.8.6)

The world icon-color setting defaults to amber (`#ffc36a`). Saving null, empty or whitespace-only values normalizes to `#ffc36a` before Foundry v12 validates the ColorField, preventing a cleared color textbox from interrupting the GM's settings save. Valid custom colors and unrelated settings retain native behavior. Regression tests cover normalization and subsequent Autofire/HP preference saves; live Foundry confirmation remains pending.

## Weapon ammunition controls (0.8.5)

The GM world setting **Report player weapon reloads** (on by default, under Attack & Damage Cards) reports successful player-owned character gun reloads and ammunition changes during the acting character's active scene encounter. Plain chat text uses the character's name and weapon name, including when the GM performs the action. Eligibility uses native actor.hasPlayerOwner. Native sheet, CTH and macro calls to CPR's reload/load methods are covered; bows, characters without player owners, cancelled/no-op actions and manual ammunition edits are excluded. Nested ammo-change/reload calls produce one message. Automated coverage is not live Foundry verification.

Targeted weapon rows disable Autofire and Suppressive Fire below 10 rounds, and all gun attacks when empty. Empty guns automatically replace the three attack-mode icons with Reload (circular arrow) and Change Ammo (opposing arrows) in the same row. Right-click the weapon name (or Shift+F10) toggles these icon sets on loaded guns; finishing an ammo action restores attack icons if ammunition is loaded. Reload uses CPR's native reload, Change Ammo uses its native selector, and full magazines or depleted selected-ammo reserves disable Reload with an explanation. Item updates refresh ammunition availability. Reloading does not start an attack. Bows retain their existing loading workflow; exotic burst costs remain deferred to the core system.

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
- Shared damage roll/application UI, native damage roll options on normal click and direct rolls on Shift-click (damage application options remain Shift-click), named target and selected-target application, and persistent Applied to receipts.
- Three Add Effects slots; collapsible Instant Effects, Body Crits, Head Crits, Drugs, Pharma and Misc. Addictions and wounded-state entries are excluded from this picker.
- Interact With Armor and Half Armor SP (round up); optional on normal/native damage cards, always shown on ad-hoc damage cards. Armor bypass disables ablation for that application.
- Native critical-injury tables/items, damage-method configuration, duplicate-injury handling and captured native damage details/undo where available.
- Interrupted-roll/payment/application recovery controls; uncertain application is marked for GM review rather than blindly repeated.

## Areas and effects

- Grenade, rocket and shotgun-shell placement, wall-clipped recipient coverage, native ammo handling, GM scatter placement and target-list corrections.
- Individual evasion and relocation; optional MOVE costs, debt and Cover Up homebrew.
- One shared damage roll with per-target application; results below the shared roll; GM Show/Hide attack area and automatic completion hiding.
- Suppressive fire with native attack and individual Concentration checks; failed checks apply Suppressed. Each new combat suppression clears at the end of the affected character's next turn (next round if currently their turn), using its originating encounter and combatant identity. Reset/deletion or combatant removal also clears timed markers; expiry catches up on reconnect. GM exclusion/reset removes only that response's marker. Cover movement and outside-combat clearing remain manual.
- Armor-Piercing and Smart ammunition handling; reusable Poison, Biotoxin, EMP, Microwaver, Flashbang, Ignite, Sleep, Teargas and Smoke flows.
- Native fire recognition and once-per-ended-turn damage at strongest severity; Extinguish, Sleep wake-on-damage/touch, temporary sensory injuries and timed cleanup.
- Persistent scene smoke independent of its attack marker/card; footprint and expiry saved. Smoke penalties and sensory interaction remain manual.

## Grapples, QuickHack and EMP

- Opposed Grab, Hold Target / Take Held Object, Escape and third-party Break Grapple.
- Self-HUD Close Combat controls identify the other participant. Choke/Throw/Release unlock after the establishing turn in combat; Choke has a once-per-round guard.
- Choke applies Choking 1 then Choking 2 to the defender. Unconscious replaces the managed stage; skipped rounds clear managed choking markers. Release, successful escape/break, throw and other grapple-end cleanup remove all Choking 1/2 markers from participants, including manual ones. Unconscious and unrelated conditions remain.
- The token status menu omits Lightly/Seriously/Mortally Wounded, Speed Heal and Quick Fix; their catalog definitions and automated effects remain intact.
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
- Container actors never appear in the Combat Bar, either in encounter order or the outside-combat token list, for players or GMs.
- Fixed movement controls at the selected dock; turn controls at the opposite end, side-by-side left/right arrows, native initiative actions and owner End Turn.
- Native combatant visibility, right-click controls, sheet opening, pan/ping and GM pull-ping behavior.
- Default / No Movement / Combat Move / Free-Move modes and configurable mode for new combats.
- Players heading cycles Online / All / Minimized.
- Square-grid movement counters, scene-space start markers, collision-aware adjacent diagonal accounting, run indication and owner Reset. Reset is movement-only undo.
- Broken Ribs and both Foreign Object injuries have separate movement-damage cards and optional turn-end reminders.
- Native injury modifiers plus MOVE floor, Evasion restrictions and Combat Tools Cracked Skull headshot correction. Action/speech/limb restrictions are advisory; no general action economy.
- Biomonitor vitals/EKG, medical guidance, active drugs/pharma, cyberware and situational states; private incoming-attack and API messages. Incoming Attack uses the shared session queue, created only when a new waiting attack arrives for an owned actor. Entries retain actor scope and a chat-card navigation link. Dismissal removes the queue entry; card updates and reconnecting never recreate it. Resolved/deleted cards retire remaining entries. No pending-card scan or separate attack alert store remains.
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
- Manual Rolls has three sections: General Roll; STAT Roll, Skill Roll, Role Ability; Damage, Critical Injury. GM Group Check is retained separately. General Roll keeps the Cyberpunk/custom dice UI; STAT keeps its existing roll-under behavior. Skill/Role lists require one owned selected token. Skills show Level, Mod and Base using the native sheet's modifier helper/formula; roles show Rank and Mod. Values refresh on actor/item/effect changes. Each row has View (native item sheet) and Roll (native CPR sheet handler, including modifiers, LUCK, dice and chat); Roll is disabled for nonrolling abilities. No menu entry is initially selected. Verified with build and rendered browser fixtures, not live multiplayer.
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

Animated Turn Indicator expansion (released in 0.9.3): 16 selectable styles: Segmented HUD, Scanner, Glitch Frame, Signal Echo, Data Stream, Arc Discharge, Rockerboy — Soundwave, Solo — Fire Control, Netrunner — Quadrant Circuit, Tech — Toolworks, Medtech — Trauma Scan, Media — Live Feed, Exec — Command Grid, Lawman — Dispatch, Fixer — Eurobuck Flow, and Nomad — Redline. Role styles are manual choices, not automatic actor-role assignment. The existing appearance controls and saved circuit key are retained in the Default/My settings. All effects honor the resolved owner/default color (Dispatch always uses blue/red; Nomad’s arc uses green/yellow/orange/red; Media’s recording dot is red), thickness, distance, opacity and speed; static/off and reduced-motion behavior remain. Cached paths use pulses, moving packets, transforms, gauge rotation or alternating prebuilt filaments, without per-frame geometry rebuilds, filters or particles. All 16 tested in PIXI on dark/light backgrounds and at thickness extremes; low-end hardware and live Foundry acceptance remain unverified.

Indicator viewer switches: User Turn indicator is a client master switch (default on); disabling it destroys the active indicator and removes its ticker. Use default for everyone (default off) bypasses all personal profiles, including the viewer’s own, and renders the shared world default. Neither switch edits anyone’s profile or changes another viewer’s display. Both are available above Default/My in the live editor and in Module Settings.

Role indicator refinements: Media has a blinking red recording dot at upper right; Medtech uses a medical cross and two restrained scanning brackets instead of an EKG; Solo has expanding/contracting targeting brackets and a vertically scanning aim line. Lawman uses fixed blue and red for its frame and alternating bars, independent of selected color. Nomad’s speed arc and ticks progress clockwise from green at the upper end through yellow and orange to the redline at the lower end, following the needle’s increasing-RPM direction; its needle and road dashes retain chosen color. Colors and arc geometry are cached; local static/off and speed controls still apply.

Indicator Distance is limited to 0–50 in Default/My controls and runtime profile normalization; older saved values above 50 render at 50.

Arc Discharge redesigned: six small contacts close to the token perimeter, with brief jagged arcs and short forks jumping between neighboring contacts in an irregular sequence. Long radial spokes and continuously visible wires are removed. Three prebuilt routes per gap are reused; frames change only alpha, without particles or redraws. Distance, thickness, color, opacity, speed and local static/off still apply.

Indicator Speed is limited to 0–2; Opacity is limited to 50–100% and displayed as a percentage in the live editor. Default/personal values outside these ranges are clamped when read and rendered.

Fixer Eurobuck Flow replaces the contact-node network with a vector Eurobuck (€$) display below the token and six moving banknotes along side transaction rails. Currency and bill geometry are cached; per-frame changes are position/alpha only. Existing fixer profile selections and user controls remain compatible.

Role simplification: Medtech is reduced to three graphics: the cross and two slow scanning brackets, removing the surrounding badge, ticks, circuit corners and segmented arcs. Tech Toolworks replaces its network-like routes with two counter-rotating toothed gears and an open-ended wrench below the portrait. Cached geometry and saved style keys are retained.

Netrunner now uses the four-quadrant circuit design with traveling packets. The old Packet Route drawing and duplicate standalone Quadrant Circuit option are removed, leaving 16 styles. Legacy circuit profiles resolve to netrunner; a GM ready hook upgrades the world default key when needed.

Configure Settings now includes Animated Turn Indicator → Configure for both players and GMs. It opens the same complete Default/My editor and viewer switches as Self-CTH. World-default editing remains GM-only; existing inline settings and the HUD shortcut remain available.

Per-token indicator overrides: GMs can open This Token from an owned token’s Self-CTH settings menu or a targeted token’s gear shortcut. Configure Settings also captures a single selected token when opening. Token context stays fixed while editing; its name is displayed. Separate scene tokens sharing an actor can have different settings. Priority is viewer master/force-default, then token override, owner profile, world default. Only GMs can write/reset token overrides; deleted tokens reject writes. Native updateToken refreshes all viewers. Tests cover precedence, independent NPCs, inheritance reset, permissions and HUD/editor access; live multiplayer verification remains pending.

### Local indicator editor preview
- Opening Animated Turn Indicator previews the active Default/My/This Token profile on the opening token, selected owned token, or assigned character token. No combat or current turn is required.
- Preview is local rendering only; no preview flags or combat state are written. Appearance edits still save normally. Closing the editor restores the real turn indicator; scene teardown and token destruction clean up the preview.
- Master off, display Off/Static and token visibility remain respected. The editor previews the selected profile even with Use default for everyone enabled; normal viewing resumes on close.
- Verified by strict build, runtime lifecycle tests and editor browser fixture; not yet verified in a live multiplayer session.

### Indicator settings separation and selection tracking
- Main Configure Settings contains only Use Turn Indicator, Use Default for Everyone, Animated Turn Indicator Display, and the Configure button. Appearance settings remain registered with existing saved values but are hidden from the main list.
- Configure contains Default Indicator / My Indicator and GM-only This Token profiles; no duplicate client controls. The GM token tab is disabled until a token is available.
- The open editor follows newly controlled tokens, updates the override name/profile and local preview, and keeps queued writes bound to the original token. Its native controlToken listener is removed on close.
- Verified by strict build, 402 passing tests (4 skipped), and a browser fixture covering selection changes and correct-token saves; live Foundry verification remains pending.

### Player-local default indicator
- Players can now edit Default Indicator in Configure. This saves a separate User flag `pneuma-combattools.turnIndicatorDefault`; it only changes that user's rendered fallback. It neither changes the GM world default nor becomes the player's shared My Indicator.
- Rendering chooses token override, character owner's My Indicator, then viewing user's default (falling back to GM world default). Use Default for Everyone bypasses both custom layers and uses the viewing user's default.
- Use GM Default removes the player's local default and resumes following world changes. GM Default Indicator editing continues to change the world default. Main settings remain the same three display preferences plus Configure.
- Validated with runtime viewer-switch tests, profile isolation/reset tests and browser editor tests; live multiplayer verification remains pending.

### My Indicator inherits the player's default
- Use My Default Indicator clears the separate personal override and follows that player's Default Indicator, falling back to the GM default only when the player has none. Preview, initial customization and other viewers' rendering resolve the same owner default.
- Player default changes propagate to their inherited My Indicator; explicit personal and token overrides remain independent. Other viewers can still use their own Use Default for Everyone preference.
- Supersedes the earlier direct GM-default fallback for My Indicator. Regression checks cover distinct viewer/owner defaults, reset, preview and customization seeded from the player's default.

- Animated Turn Indicator Display now offers Animated and Static only. Legacy client Off selections migrate on ready to master disabled plus a motion-appropriate display mode, preserving hidden indicators until the user enables the master switch. Build and automated migration checks cover the change.

### Settings cleanup: approved submenu layout
- Combat Bar keeps its visibility switch and existing movement setting in main settings; a Configure entry opens the existing editor for position, size, layout and tooltip preferences. Hidden appearance settings are still rendered with native v12 settings row metadata and retain their saved keys/scopes.
- Biomonitor keeps Show Biomonitor + Configure; position, Crew integration, HP numbers, GM animation forcing, local animations and flash duration live inside. Token HUD has Configure for right-click behavior, Compact Token HUD, sizing and the existing GM icon color.
- Hover Weapon DVs combines the existing two flags into Off / Single Shot / Single Shot + Autofire without migrating or dropping saved settings.
- QuickHack keeps Enable + Configure; its existing routing window now also edits rules mode.
- Unified visible Biomonitor naming; corrected tooltip, EKG access and amber-default wording. Position descriptions are concise; conflict notes appear only for top-right combat bar plus a saved top-right Biomonitor preference.
- Movement and combat rule placements remain unchanged. No separate display/world categories or house-rules group added.
- Strict build, automated permission/save checks and browser fixtures cover controls, Hover DV state, integrations and conflict visibility. Browser fixtures are not live Foundry multiplayer verification.

### Indicator visual revision
- Glitch Frame is completely replaced by Vector Wake: three orbital arrowheads and curved fading tails. Existing `glitch` selections resolve to the new effect without losing settings.
- Rockerboy side meters use fixed green-to-yellow-to-red colors from bottom to top; red peak segments now illuminate during high levels.
- TECH uses a workshop gantry, moving piston jaws, opposing gears and a ratcheting wrench. MedTech uses filling treatment cartridges, scanning brackets and a medical shield, without reusing the EKG.
- Media has a recording dot twice its former radius and fixed red vector LIVE lettering inside the lower-left frame. Exec has a corporate inbox, arriving envelope and mini organization chart with dispatch packets.
- Cached geometry only; animation modifies transforms/alpha. Verified all 16 styles on dark/light maps, object-count stability, moving elements, color ordering and thickness extremes with PIXI browser fixtures plus runtime tests. Live Foundry visual review remains pending.

### TECH diagnostics and corporate authority revision
- TECH now uses four mounting brackets, an asymmetric calibration rail with moving cursor, three sequential component checks and a stepped repair-progress strip. Removed the gears, piston jaws and wrench silhouette.
- MedTech medical cross is fixed red independently of the selected profile color.
- Exec is redesigned as Corporate Authority: stepped skyscraper crest, angular side framing, outward-moving command signals and three rank chevrons. Removed the inbox and org chart.
- All styles retain cached geometry. Strict build, 407 passing tests (4 skipped), and PIXI dark/light animation fixtures pass; live Foundry visual review remains pending.

- Implemented: compact resistance rows (e.g. Poison DV13) with a shield Resist icon; all GM-only chat actions and explicit overrides share a normal background, red outline and GM badge, and black action text; hover/focus switches to charcoal with light action text across combat, damage, area effects, instant effects, grapple, EMP, and manual/group checks. Existing permissions remain unchanged. Build/browser fixtures verify presentation; live Foundry validation remains pending.

- Implemented: GM Remove smoke / Restore smoke toggles the saved smoke template visibility and attack obscuration together. Hidden smoke imposes no automatic attack penalty; restored, unexpired smoke does. The original lifetime continues while removed; expired/deleted smoke cannot be restored.

- Implemented: other-token right-click HUD offers Wake using action when the selected owned character is conscious and the target is Unconscious. The GM applies native Unconscious removal; Prone remains. Touching range and action expenditure remain player/GM adjudicated.

- Implemented: personal EKG pause/resume also controls the viewer's hover EKG, including an already visible trace, newly hovered tokens, and health-state redraws. The existing session-local preference remains local to the viewer.

- Implemented: per-target resistance, Evasion/Concentration, and instant damage rolls show compact clickable totals beside their outcome/pending action. Native roll HTML is retained inside a collapsed disclosure. Manual group checks already retain clickable totals.

- Fixed: combat end/reset/deletion clears temporary injury items and their status markers (Teargas Damaged Eye, Flashbang Eye/Ear, Sonic Shock Ear), while permanent injuries and other encounters remain. Existing native round/time expiry remains. Reapplication also repairs a missing marker for a pre-existing permanent injury. Biomonitor condition checks verify affected-actor display and cleanup; live verification pending.

- Implemented audit F1/F3/F4: condition-aware Wake/Extinguish controls and stale-request rejection; current-injury/combat-epoch availability for movement warnings with batched card refresh; scoped reload notice, injury-kind and QuickHack error identifiers. Historical results and native card styling remain. QuickHack recovery (F2) explicitly deferred by user; its behavior is unchanged.

AoE reset presentation: icon plus **Reset**, inline in the original player-response controls; tooltip/accessible label remains **Reset Player Action**.

AoE long response descriptions (Cover Up and suppression) use a full-width `.pneuma-aoe-response-description` below the player line so they cannot push Reset onto a separate line.

Cover Up homebrew: double ablation applies to all equipped head and body armor, including blocked hits. Settings and the damage receipt state this explicitly; shields retain native damage handling.

AoE headings use the weapon/item name alone, retaining only the Suppressive Fire suffix. Automatic Blast, Shells and ammunition-effect heading labels are removed; effect mechanics and per-target details are unchanged.

Attack titles: hidden names use weapon/melee type, Martial Arts, Grenade or Rocket. Visible names use the weapon name, actual martial-arts roll skill, or grenade ammunition type. Suppressive Fire retains its suffix. `.pneuma-attack-name` truncates visually with a full-title hover tooltip.

Critical Injury application buttons use the cracked-heart icon (`fa-heart-crack`) instead of dice; tooltip and action remain unchanged.

Damage-recipient rows place damage and critical-injury buttons together before `.pneuma-damage-recipient-label`. The alternate recipient label is **token** (formerly “to selected target”); action tooltips retain precise selected-token wording.

Ranged evasion bypass (released in 0.9.3): ineligible PCs and NPCs resolve immediately against range DV, with a small "Target cannot evade" note and the eligibility reason in its tooltip. Existing REF, installed/enabled Reflex Co-Processor, injury and homebrew checks are reused. GMs can select "Allow evasion" before damage or follow-up effects begin to reopen that attack's defense choice, using native Evasion. A disallowed offer becomes a no-fee/no-penalty GM exception for this attack; currently valid homebrew costs remain. The attack result has already been revealed. Eligible targets and melee retain their existing choices. Automated checks are not live Foundry verification.

Shift-click direct rolls (released in 0.9.3): roll buttons pass Shift through targeted attacks, area attacks and Smart ammunition retries, Evasion/suppression responses, damage, Brawling/escape, instant-effect resistance, group skill rolls, manual skill/role rows, Jack-In/QuickHack, and Force Out (including Biomonitor Eject). Uses CPR v0.92.4's native handleRollDialog skip path with a non-click event, independent of the invert-Ctrl preference. Native modifiers, costs, permissions and confirmation processing remain. Normal damage clicks now show roll options; Shift rolls immediately. Required setup (area placement, skill/hack selection, manual formulas and improvised damage) remains. Damage application is not a roll and retains Shift-click options. A remote Force Out opponent retains their own dialog.

GM evasion override styling correction (released in 0.9.3): the single-target Allow evasion control now participates in the shared chat-button decorator, including its GM badge, GM color tokens, hover/focus and busy states, plus an Evasion icon. AoE's per-target evasion bypass/override is not implemented; its Shift-click direct-roll support is implemented.

Manual Evasion fallback (released in 0.9.3): Manual Rolls includes Evasion in the Damage/Critical Injury section for players and GMs. Select exactly one owned character token. Normal click opens its native Evasion skill dialog; Shift-click rolls directly. The native sheet handles modifiers, LUCK, dice and chat. This standalone roll does not update pending attack/AoE cards or bypass native injury restrictions; the GM adjudicates the result manually.

Personal roll favorites (released in 0.9.3): Skill Roll and Role Ability forms have a leftmost Favorite star column. Each user can save at most three combined skill/role favorites. These are user flags, not actor/token settings. Favorites appear after all other Manual Rolls entries and roll using the currently selected owned token, resolved when the shortcut is clicked. Normal click opens native options; Shift-click rolls directly. Nonrolling role abilities cannot be favorited. Native ownership, modifiers and LUCK handling remain in effect.

Favorite presentation correction (released in 0.9.3): role abilities without a native roll show an empty Favorite cell instead of a disabled star button. Main-menu favorite shortcuts use the standard yellow (#ffdc70) star instead of the default blue icon color.

GM Group Check shortcuts (released in 0.9.3): three compact vertically stacked slots below the Skill dropdown. Select a skill and click an empty + to save it; click its name later to select that skill immediately. The adjacent × clears a slot. Saved per GM user, separate from personal roll favorites. Skill shortcuts preserve the current DV, hidden-DV choice and player selection; Request rolls still sends the check.

Group Check shortcut polish: yellow stars, highlighted selected skill, labeled empty slots, and compact remove controls. Browser fixture verified select/save/clear and selected-state updates; live Foundry theme remains unverified.

Combat Speedheal cleanup (released in 0.9.3): Speed Heal statuses created or enabled on a participant during a uniquely matching active combat are recorded by effect UUID on that Combat document. Ending/resetting or deleting the combat removes those exact statuses. Speedheal applied outside combat is not enrolled. Cleanup uses the existing elected-GM lifecycle queue and does not depend on the GM's viewed scene.

Next-turn alerts (released in 0.9.3): a subtle amber ring marks the next visible combatant with a slow five-second opacity pulse; respects native turn ordering, skip-defeated, round wraparound, client indicator master and static-display settings. Client settings: Next-turn indicator (on), Turn popups (on), Play a sound on your turn (off). Player owners receive "It's your turn!" or "Your turn is next" via the existing animated flash-only text, never the HUD list, including with the Biomonitor hidden. The optional sound is local only. Unrelated updates and reload initialization do not repeat alerts; hidden/secret combatants and GM clients do not produce player alerts. Live Foundry verification pending.

Two notification sounds (released in 0.9.3): original generated WAV defaults are shipped under sounds/: message-alert.wav (short vibration pulses and a quiet beep) and your-turn.wav (short low thunk). GM world settings provide each file path and volume; blank path or zero volume mutes. Flash popup recipients hear the message cue, including next-turn notices. Current-turn recipients hear only the distinct thunk, locally; GM clients and other players do not receive the turn sound. The earlier client turn-sound checkbox is superseded by these GM settings. No extra sound categories were added. Source generator: scripts/generate-notification-sounds.mjs.

Turn Indicator settings organization (released in 0.9.3): renamed Animated Turn Indicator to Turn Indicator, grouped next-turn marker and popup preferences in that section, and moved the two sound paths/volumes into its GM-only Configure Sounds submenu. Each sound has a native audio file picker and a Play preview using the current unsaved path/volume, locally only. Save persists the GM world settings; existing saved choices are retained.

Popup sound scope/settings correction (released in 0.9.3): the message cue now covers both flash-only popups and new Biomonitor queued/timed message arrivals, once per incoming batch rather than rerendering existing entries. Message sound path, volume, file picker and Play preview are inside Biomonitor > Configure (GM-only controls). Turn Indicator's sound submenu contains only the current-turn thunk. Existing stored sound settings are preserved.

HUD API adds optional suppressDefaultSound for every notice mode and remote recipients. Current-turn popups set it and play their separate local thunk. All other incoming popup/message types default to the Biomonitor message cue, including queued and legacy messages; suppressDefaultSound does not change visibility or queue behavior.

Next-turn marker refinement (released in 0.9.3): three concentric amber rings expand outward and fade in staggered five-second cycles, with low opacity. Static display keeps three spaced rings. Geometry is cached; animation changes only scale/opacity. Visibility and combat cleanup rules are unchanged.

Self CTH Self Actions (released in 0.9.3): the former initiative-die icon is replaced by a person icon opening Self Actions. Re-roll Initiative retains existing speedware/homebrew/combat requirements. Extinguish appears only while burning; Eject Netrunner appears per incoming active intrusion and supports Shift-click. MA Recovery appears with any native Martial Art skill level 1+, is enabled while prone, and removes Prone without a roll. Existing native/status/QuickHack actions are reused and eligibility is checked again on click.

MA Recovery rule correction (released in 0.9.3): uses the highest trained native Martial Art skill for the Special Move Resolution against DV13. Total >13 gets up without spending an Action; total <=13 still gets up but costs the Get Up Action. Posts the native roll and explicit action-cost result, then removes Prone. Canceling leaves Prone intact; Shift-click skips the roll dialog. Action expenditure is reported, not automatically tracked.

GM right-click routing correction (released in 0.9.3): GM self CTH requires the right-clicked token to already be controlled. Right-clicking an unselected token preserves the selected attacker and opens standalone target actions, preventing native target-self controls from mixing into the menu. Players retain self CTH whenever right-clicking an owned token, even unselected.

Self/target HUD correction (released in 0.9.3): target menus no longer expose Turn Indicator settings or the target's Eject Netrunner action. Offensive QuickHacks require the selected attacker to be a Netrunner. Self flyouts share the target header treatment, reflect active/expanded state, and close the previous flyout when another opens.

Self-ICE (released in 0.9.3): installed, functional cyberware named Self-ICE supplies up to three Passwalls at DV6/8/10. Breach uses native Interface checks (Shift-click skips options), one Net Action per attempt, manually spent. QuickHacks are blocked until all walls clear; failed rolls retain progress and do not add awareness/ejection. Progress is per combat connection and resets on reconnect. The target menu shows progress, Breach, and a GM cleared-wall override. Renamed Self-ICE is not automatically detected.

Self CTH cleanup (released in 0.9.3): removed the Toggle Alert HUD bell button and its click handler. Biomonitor visibility remains controlled through its existing settings.

Review corrections (released in 0.9.3): QuickHack/Jack-In/Breach rolls validate and deduct selected LUCK through the shared native-roll helper; cancelled or stale dialogs do not spend it. Breach validation captures original connection ID and cleared-wall count before rolling. Every ROLL-menu favorite has a compact remove control independent of the selected actor, including deleted, renamed or non-rollable abilities.

Self Actions placement (released in 0.9.4): Escape from a grab now appears in Self Actions. Other grapple actions remain in Close Combat; its self-HUD icon is omitted when empty. Escape retains its existing roll, Shift-click and permission behavior.

Self Actions visibility (released in 0.9.4): MA Recovery is shown only while prone with a trained Martial Art. Re-roll Initiative is shown only with the homebrew enabled, owned token, functional installed speedware, and an existing initiative in a started scene encounter.

Prone Self Actions fallback: prone characters with a native Martial Art skill level 1+ see MA Recovery; other prone characters see Get Up. Get Up removes Prone without a roll and posts a native chat report stating that the character uses their Action. Action expenditure remains manual. Neither option appears while standing.

Prone removal compatibility: Get Up and MA Recovery only call native status removal for Prone IDs registered in `CONFIG.statusEffects`, avoiding an invalid `prone` ID error when the module's catalog ID is installed.

GM status cleanup: after combat end/reset/delete cleanup, a GM-only chat button opens Clean Status Effects for that encounter's actors. Module Settings → Combat Tools → Injuries & Effects → Clean Status Effects opens a world/scene-actor scan manually. The review lists proposed operations, preselects ended/expired effects and orphaned grapple markers, and leaves untracked effects unchecked. Permanent critical injuries require explicit inclusion; temporary injuries can be removed. Injury cleanup removes source items and linked markers; timed item effects are disabled without deleting inventory. Dead, addictions, active grapples, and actors in any started encounter are protected. Equipment cleanup reconciles expired/ended disablement sources and derived penalties. Each apply rescans current state and reports partial failures. Automatic end cleanup now continues across actor failures, skips actors in another started encounter, and reconciles explicit stale combat links on ready/canvas ready. Build and automated fixtures do not establish live Foundry verification.

Saved grapples belonging to ended encounters are offered as a single workflow cleanup for both participants, using the existing release routine to restore penalties and token scale. A started encounter for either participant blocks that cleanup. End notices wait for queued timed-effect, EMP and grapple cleanup; an encounter restarted before queued cleanup runs is skipped.

Prone movement: player token position/elevation updates are blocked while Prone, including Reset, regardless of the movement-counter setting or grid type. Active encounter counters show `0/0` and hide Reset/Run while Prone, preserving prior spent movement for standing up. AoE escape movement rejects Prone before charging movement. GM repositioning remains available for corrections and moving held tokens.

Self-action reporting (released in 0.9.4): successful Extinguish posts a concise actor-attributed chat message from Self Actions or Biomonitor controls, respecting the current chat roll mode. Repeated/no-op clicks and failed clears do not post a success report. Existing roll cards and grapple action reports remain the reports for those actions.
- Grapple release/choke/throw follow-up cards retain participant UUIDs in presentation-only `grappleParticipants` metadata, allowing Visual Tools to resolve defender portraits without reactivating grapple controls.

### Anyone Can Dodge Bullets qualifier
- Homebrew ranged evasion includes an unrestricted Anyone Can Dodge Bullets row using the existing Qualifies / One Free Evasion / Stacks controls.
- Qualifies plus One Free Evasion grants anyone one free attempt per combat round regardless of REF, Co-Processor or Solo ability; non-stacking grants share an allowance. The configured additional-evasion rule applies afterward.
- Off by default, including existing saved configurations. RAW/disabled modes and other workflow restrictions remain unchanged.

Jack-In chat-render correction (released in 0.9.7): connection tracking uses the encounter's saved result ID instead of a redundant connectionRecorded message update. Connection/control refreshes do not insert cards whose native initial rendering is still pending. Existing legacy receipt flags remain respected. Delayed-insertion regression and QuickHack workflow/browser checks pass; live Foundry verification pending.

Combat Tools owns the active-grapple explanation as a separate bulleted section and updates it during native card rendering. Visual Tools only positions the existing section; its note observer and content adapter have been removed.

### Dice playback corrections (released in 0.9.7)
- Grab, Escape and Break Grapple save native Brawling main/critical dice and replay both opposed results together after the response is accepted. Waiting attacks stay withheld; card refreshes, Hold, Take Object, Choke, Throw and Release do not replay those rolls. Older cards without saved dice do not invent rolls.
- Dice playback follows the originating card's exact whisper/blind audience. GM replay preserves player self-roll recipients and each roller's Dice So Nice style. AoE Evasion/Concentration, QuickHack/Breach/ejection, attached resistance/damage and Slow use card visibility rather than the responding client's current core roll mode.
- Damage and Group Check commit retries retain the evaluated dice and original audience, then animate once after a successful commit without rolling or spending LUCK again.
- Jack-In WILL defense, hidden NPC QuickHack/Interface rolls and automatic/NPC QuickHack damage remain animation-free. Cancelled dialogs do not animate.
- Build, automated regressions and browser fixtures verify these paths; live Foundry multiplayer and DSN rendering remain pending.
