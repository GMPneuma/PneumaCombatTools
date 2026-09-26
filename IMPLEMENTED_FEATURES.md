# Combat Tools feature inventory

The indicator size control is labeled “Indicator Scale” (previously “Indicator distance”); existing profiles retain their values.

Grenade placement (unreleased): area placement clears the native Token HUD. Hidden blast/aim templates and grid highlights remain non-rendering for GMs; manual Show restores them. Missed attacks use one brief instruction and a labeled “Place New Target Center” button. Browser fixtures cover HUD clearing, GM visibility, preview cleanup, and the labeled card; live Foundry verification remains pending.

Explosive area cards use the concise notice: “GM resolves all aspects of cover and terrain.”

Cleanup and refresh efficiency (unreleased, 2026-09-26): EMP refreshes track affected actors and combine queued changes; unrelated combat updates no longer scan world actors or refresh every EMP card. AoE refreshes use an event-maintained pending-card index rather than scanning chat history. HTML escaping, GM election, and actor enumeration are shared. Obsolete helpers/settings/translations are removed; the active flat -4 evasion rule and legacy readers remain. Targeted automated regression coverage is separate from live Foundry multiplayer verification.

Animated Turn Indicator (unreleased): 16 animated styles, including all ten roles. Self-CTH gear → Animated Turn Indicator provides Default Indicator and My Indicator buttons. Default appearance is stored in world settings and edited by the GM; NPCs and players without token or personal overrides inherit it. GM-only This Token overrides are stored on the scene TokenDocument, with priority over the player profile; Use inherited settings removes the token override. My Indicator stores a complete shared profile on the user document, so all viewers see the current character owner’s selected style, color, thickness, distance, opacity and speed. Assigned character user takes priority, then a stable non-GM owner; offline status does not change selection. Use Default Indicator removes the personal override. Animated/Static/Off display remains a client-only preference. Inputs auto-save; rapid slider changes are coalesced. Native active-scene, visibility, parenting and teardown behavior remain. Shared profile selection, permissions and browser form flows are tested; live multiplayer acceptance remains pending.

Biomonitor composite icon: shifted the heart and its crack 3 SVG units right; bell position and icon dimensions are unchanged.

Combat menu ownership (unreleased): targeted menus use their own pneuma-target-menu class instead of the native status-effects class, with explicit positioning, visibility and pointer behavior. They retain 230px width without module-specific exceptions. Native status pickers are unaffected.

## Hover EKG contrast (unreleased)

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
- Shared damage roll/application UI, native damage options with Shift-click, named target and selected-target application, and persistent Applied to receipts.
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

Animated Turn Indicator expansion (unreleased): 16 selectable styles: Segmented HUD, Scanner, Glitch Frame, Signal Echo, Data Stream, Arc Discharge, Rockerboy — Soundwave, Solo — Fire Control, Netrunner — Quadrant Circuit, Tech — Toolworks, Medtech — Trauma Scan, Media — Live Feed, Exec — Command Grid, Lawman — Dispatch, Fixer — Eurobuck Flow, and Nomad — Redline. Role styles are manual choices, not automatic actor-role assignment. The existing appearance controls and saved circuit key are retained in the Default/My settings. All effects honor the resolved owner/default color (Dispatch always uses blue/red; Nomad’s arc uses green/yellow/orange/red; Media’s recording dot is red), thickness, distance, opacity and speed; static/off and reduced-motion behavior remain. Cached paths use pulses, moving packets, transforms, gauge rotation or alternating prebuilt filaments, without per-frame geometry rebuilds, filters or particles. All 16 tested in PIXI on dark/light backgrounds and at thickness extremes; low-end hardware and live Foundry acceptance remain unverified.

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
