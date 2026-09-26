# Changelog

## 0.9.0 - 2026-09-26

- Add 16 lightweight Animated Turn Indicator styles, including role-specific designs, configurable color, thickness, distance, opacity and speed.
- Support GM world defaults, player-local defaults, shared My Indicator profiles and per-token GM overrides. Preview edits locally outside combat; follow token selection while editing.
- Consolidate Combat Bar, Biomonitor, Token HUD and QuickHack settings, combine hover DV choices and clarify labels. Preserve existing saved settings and rule placement.
- Apply Suppressed after suppression and remove it at the end of the target's next turn. Apply Choking and clear it when the grapple ends.
- Make incoming attack alerts use the shared HUD queue so dismissed alerts do not reappear from attack cards.
- Reorganize Manual Rolls and provide skill/role lists with current values and View/Roll controls. Remove automatic wound states and instant effects from the manual status picker.
- Improve hover EKG contrast and scale, scope Combat Tools menus to avoid other-module styling conflicts, and adjust the Biomonitor alert icon.

Validation: strict production build, automated regressions and targeted browser/PIXI fixtures. Live Foundry multiplayer verification remains pending.


## 0.8.6 - 2026-09-25

- Default the HUD icon color to amber (`#ffc36a`) and normalize cleared color values before native validation, preventing blank color input from interrupting GM settings saves.

## 0.8.5 - 2026-09-25

- Right-click a gun name in the targeted combat HUD to swap attack-mode icons for native Reload and Change Ammo controls. Empty guns show ammunition controls automatically; loaded guns can toggle back to attack icons.
- Disable Autofire and Suppressive Fire below 10 rounds and prevent empty-gun attacks. Preserve the existing bow loading workflow.
- Add the GM world setting **Report player weapon reloads**, enabled by default. During active combat, successful reloads and ammunition changes for player-owned characters post a plain chat message, including when the GM performs the action.
- Observe native CPR reload/load methods so character-sheet, CTH and native-method macro actions are covered. Exclude bows, characters without player owners, cancelled/no-op actions and manual ammo edits; nested ammo-change/reload calls report once.

Validation: production build, automated regressions and targeted browser fixture. Live Foundry multiplayer verification remains pending.

## 0.8.4 - 2026-09-24

- Fix grapple chat rendering before the full record is saved, preventing missing-token errors.
- Correct failed Escape and Break Grapple wording and confirmation instructions.
- Prompt for compatible inventory ammunition when attacking with an empty bow/crossbow; load through the native system before the attack roll and remember the attached ammunition type.
- Disable damage on missed attacks unless the GM enables Allow damage on miss.
- Require line of sight for initial AoE targeting, hide invalid previews, and retain an original-target marker for explosives after scatter.
- Clarify Cover Up as a no-roll alternative alongside Evasion; mechanics are unchanged.
- Streamline EMP settings with grouped selection controls, collapsible protection/frame options, and conditional numeric fields while preserving saved settings.

Validation: production build, automated regressions and targeted browser fixtures. Live Foundry multiplayer verification remains pending. Outside-combat QuickHack changes are not included.

## 0.8.3 - 2026-09-24

- Fix the compressed Homebrew settings button. Default Biomon to top-left and enable Crew Tools integration by default while retaining saved preferences and standalone fallback.

## 0.8.2 - 2026-09-24

- Keep area-placement instructions visible until placement/cancel and preserve the preview color.

- Clear newly applied damage statuses, incendiary fire, and sleep Prone when their originating encounter ends or resets; preserve preexisting conditions, critical injuries, Dead, and other encounters.

- Use active scene encounters consistently; preserve originating encounter context across responses and GM requests, reject ambiguity/reset contexts, and bind effect durations to the correct clock. Add shared and workflow regression coverage plus CI test execution.

- Fix active leg-injury overlap, display-only Disabled labels, derived penalty synchronization and redundant frame markers; retain native CPR metadata repairs.

- Remove redundant disabled-limb tracking effects, retain item/combat tracking and the single MOVE penalty, and clean up legacy markers.

- Include and repair native CPR metadata on disabled cyberleg, internal-frame and QuickHack movement penalty effects to prevent sheet/skill modifier errors.

## 0.8.1 - 2026-09-23

- Apply a native −4 smoke modifier to attacks crossing active module smoke, with a per-roll override.

- Clear timed cyberware disablements when their combat ends, resets or is deleted; repair stranded causes on startup.

- Regenerate the current guides, complete feature inventory and consolidated backlog against 0.8.0 source; retain earlier records in a labeled archive.
- Add a posting-ready major/minor feature list, settings inventory and expanded HUD messaging API examples.
- Refresh all twelve current Mermaid workflow diagrams and provide a standalone rendered version.
- Fix self-HUD Close Combat and thrown menus: compact flyouts, readable inherited text, one-line labels, matching headers and icons, shared hover highlighting and stable icon-column layout.

## 0.8.0 - 2026-09-23

- Keep player HUD vitals, incoming attacks and Neural Intrusion active without token selection: use the assigned character's unique scene token, or the single owned scene token when no Character is assigned.
- Extend queued HUD message animations to six seconds, with a fast initial reveal and a longer center-screen hold.
- Replace the Jacked In wall-plug icon with a diagonal audio-style neural connector and curved cable.
- Move optional Neural Intrusion screen glitches into PneumaVisualTools, using a read-only Combat Tools state API and change hook.
- Keep Neural Intrusion status and ejection controls in Combat Tools; screen-effect preferences now belong to Visual Tools.
- Add a Manual Rolls menu header and remove automatic first-item highlighting while retaining keyboard navigation.
- Fix combat bar initiative icon contrast and keep settings buttons compact, single-line and aligned with their labels.

Validation: production build, automated regressions and browser fixtures. Live multiplayer verification remains separate. Jack-In tracking requires a started combat. Screen glitches require the separate Visual Tools module.

## 0.7.0 - 2026-09-23

- Expand combat bar docking, portrait sizes, scrolling, native initiative controls, and shared settings; add minimized Players-list mode.
- Refine Biomonitor placement, Crew Tools HUD integration, notifications, and status actions. Add detected Neural Intrusion, netrunner ejection, and prominent optional screen glitches for visual tuning.
- Add configurable EMP selection, cyberware disablement, hardened/BioWare eligibility, and internal-frame behavior.
- Connect additional QuickHack effects and injury workflows; add self-HUD grapple actions and injury reminders.
- Add manual damage, critical injury, group skill, STAT, standard Cyberpunk, and custom dice rolls through the chat-roll menu.
- Unify damage application controls and persistent selected-target receipts; add armor interaction and half-SP controls.
- Organize Add Effects into collapsible categories, excluding addictions and wounded statuses; standardize chat buttons.
- Reorganize module settings and improve native attack dialogs, custom statuses, and QuickHack message configuration. Remove the HUD test mode.
- Reduce duplicate validation and status refreshes; keep connection awareness on encounter state and scope timed-effect expiration to turn/round boundaries.

Validation: production build, automated regressions, and browser fixtures. Live Foundry multiplayer verification remains separate. Jack-In tracking requires a started combat. Screen glitches remain deliberately amplified pending visual tuning.

## 0.5.5 - 2026-09-21

- Add a compact floating combat bar above Players with square actor artwork, native combatant visibility and active-turn highlighting.
- Add per-user 32/40/48px portraits, vertical/horizontal layouts, minimize/restore and optional name-only tooltips. Minimized GM bars retain movement controls.
- Support token selection, permission-checked double-click sheets, hold-to-ping, Shift-click pan and GM Shift-long-click native pull pings. Player navigation uses native visibility checks; GM navigation ignores token visibility on the current scene.
- Add owner End Turn through the active GM, GM previous/next turns, status-effect hover flyouts and native per-combatant context controls.
- Add Default, No Movement, Combat Move and Free-Move modes, a configurable combat-start default and throttled movement warnings.
- Anchor movement-origin outlines to the scene so token animation cannot carry them away from the starting position.
- Fix duplicate libWrapper registrations when injury, EMP and other integrations share native methods.
- Set manifest verified compatibility to Foundry VTT 12.343, retaining the v12-only support range.
- Reorganize feature documentation and add player/GM guides.

Validation: TypeScript/build, automated regressions and browser fixtures. Live Foundry multiplayer verification remains pending; existing limitations remain documented in the feature guides.


## 0.5.0 - 2026-09-21

- Make the compact Eye HUD available to all players; installed Biomonitor sharing exposes hovered vitals while keeping messages private.
- Pin the HUD beside the Foundry sidebar, retain the compact minimized view and name placement, and move orange notifications outside the HUD.
- Add active-only drug/pharma indicators, larger exposure lights, floating situational statuses, and optional per-player scanline message/effect animations.
- Integrate native poison, biotoxin and incendiary damage with HUD warnings; restore native fire status end-turn damage.
- Use native Active Effect durations where numeric durations are available. One minute becomes 20 combat rounds; timed effects end with combat, including manually applied effects, while critical injuries persist.
- Block Evasion for Dismembered Leg and disabled installed Cyberlegs across single-target, area and native skill-roll workflows.
- Warn when Broken Ribs movement exceeds 4m/yd on foot, with a manual Apply 5 damage button, reset handling and duplicate-application protection.
- Document status/critical-injury automation gaps and remaining cleanup candidates.

Known limitations: live Foundry multiplayer verification is pending. The previously reported missing residual smoke still needs live confirmation. Drug effects whose native data has no numeric duration are not automatically assigned a timer from their description; remaining mechanics are listed in docs/status-mechanics-audit.md.

## 0.4.0 - 2026-09-20

- Known issue: residual smoke was reported missing in a live Foundry scene despite the server serving the current smoke implementation. Cause and live fix remain under investigation.

- Add reusable Instant Effects, core grenade/rocket ammunition resolution, ammunition colors and persistent animated smoke.
- Reuse native resistance rolls, injury items and damage application; retain combat-end EMP duration. Add exact timing investigation to the backlog.
- Include instant effects in Add effects; smoke attack penalties remain deferred.


## 0.3.5 - 2026-09-20

- Streamline AoE configuration into collapsible profiles with current shape summaries and separate evasion controls.
- Reveal the stored AoE attack Dice So Nice roll after all evasion responses finish, without rerolling or replaying on later updates.
- Restrict attack-area show/hide controls to GMs.
- Exclude installed speedware marked Disabled or disabled by EMP from initiative rerolls; remove the generic EMP HUD button.

- Collect AoE applied-damage results below the shared damage roll, keeping apply buttons beside targets.

- Place self controls in the standard CTH button column with shared icon color/sizing; remove the separate Self panel.

- Add an always-available Toggle Alert HUD bell to self CTH. Rename the speedware world setting to Speedware allows Rerolling Initiative and apply the Pneuma Homebrew badge; the initiative action retains its D10 icon.

- Recognize Sandevistan/Kerenzikov anywhere in installed cyberware names for initiative rerolls.

- Remove the redundant bottom Apply Damage section from AoE cards; keep shared dice below and per-target application inline.

- Match AoE roll/apply damage icons to normal damage and remove the native damage shortcut that bypasses shared resolution.

- Remove empty action-column spacing from thrown-weapon rows so names use the full list width.

- Hide a token's movement UI and start marker after Reset until it moves again.

- Keep HUD item icons/names on one row with markers below; flatten grenades into the thrown-weapon list.

Jack-In and QuickHack combine the native Interface dice and outcome into one chat card with scoped QuickHack header, roll, result, effect and action containers. Result visibility governs the combined card. Private NPC dice remain a separate GM-only message when the result is shared with players. No existing chat messages are migrated.

Jack-In and QuickHack require wall-based line of sight from the attacker center to at least one of nine inset target points. QuickHack requires an active tracked connection. Losing sight blocks actions but never ejects the connection; restored sight permits actions again. Outside combat, Jack-In remains roll/chat-only and QuickHack is blocked because no connection is tracked. No migrations are added.

QuickHack program items use `Quickhack: <name>` in world and actor inventories, when newly created. The Booster class is unchanged.

Create the CombatTools QuickHack folder layout, initialize all eleven program items, and connect the launcher weapon to the existing Jack In / QuickHack workflow. Preserve legacy folders and backups; defer cleanup until at least v0.8.0.

## 0.3.0 - 2026-09-20

- Require libWrapper for EMP suppression/roll guards and persistent damage-summary capture. Add a separate v13 integration verification checklist.

- Reduce QuickHack chat/HUD refreshes and movement redraws with event filtering and frame batching. Retain hover DV panels and cache tables with edit/configuration invalidation.

- Replace own-token combat actions with self CTH while retaining native controls. Add default-off **Pneuma HomeBrew** and a native speedware initiative reroll D10 labelled as costing an Action. See [Self CTH](docs/self-cth.md).

- Implement grappling with native opposed Brawling, Hold/Take, Choke, Throw, Release, Escape and third-party Break Grapple.
- Track encounter Grab/Grapple metadata on Combat documents and show both grapple and choke roles/counters directly beneath Vitals.
- Add native grapple penalties, two-handed weapon restrictions, direct HP handling, combat cleanup and duplicate-application protection.

- Organize module settings into six functional groups within Foundry's native settings window.

- Integrate QuickHack with master enable, RAW / owned / equipped-Cyberdeck modes and all prior GM message-routing options.
- Add native program content. One-time item and settings migrations were removed; initialization only creates missing content.
- Track Jack-In connections and ejections on Combat documents; ejection prevents re-Jack-In for that encounter. Outside combat, retain untracked roll/chat workflows.
- Reuse Combat Tools native roll helpers, target HUD and resolution sections; preserve prior guided/manual effects.

## 0.2.0 - 2026-09-19

- Add native Token HUD combat controls, target-preserving right-click behavior, sizing settings and ranged hover DVs.
- Add paired attack/Evasion resolution for ranged, melee, unarmed, Martial Arts and thrown weapons, including configurable homebrew ranged evasion.
- Add in-card native damage rolls and application, Shift-click options, compact recipient results, three status slots and critical-injury controls.
- Check ammunition before starting attacks; support optional Martial Arts no-ablation and attacker-selected improvised damage (1d6–6d6).
- Add Used/Disabled item markers and a documented marker API.
- Add the persistent cybereye HUD and optional Biomonitor: Vitals with animated EKG, Biological Scan and Implant Integrity.
- Preserve the last dragged HUD position across resizing; minimize to an EKG on the left and notification icon on the right when a Biomonitor is available.
- Add EKG pause/resume, optional HP concealment, active-only effect lights and alerts that scroll three times before centering.
- Add GM messaging from the HUD, message navigation and individual clearing, duration presets and a documented public HUD messaging API.
- Batch and target pending-card refreshes; preserve unchanged Biomonitor content instead of rebuilding it for unrelated events.
- Document chat-card styling hooks, current features and deferred work. General chat cosmetics remain in Pneuma Visual Tools.

Known limitations: live multi-client compatibility remains unverified. Concurrent attack LUCK spending, native critical-injury completion, simultaneous status-picker edits and replay of older selected-target damage requests need further hardening; see [audit](docs/audit-2026-09-19.md). Native status synchronization, ongoing status mechanics, grenade/rocket resolution, Grapple and Quickhack execution remain deferred.

## 0.1.2 - 2026-09-17

- Migrate runtime source to strict TypeScript with Foundry v12 types, a pnpm lockfile, and dependency-aware CI. Keep output directly in dist.

- Show the currently selected actor's equipped weapon names and icons in the Attack panel for evaluation; no attack rolls yet.

- Open the player Combat HUD through canvas pointer input on visible, unowned tokens; ignore drags and retain native owned-token controls.

- Anchor the Combat Tools controls to the clicked token in Foundry's canvas HUD container instead of the screen edge.

## 0.1.1 - 2026-09-17

- Write module files directly into dist and remove the extra module subfolder.
- Update manual installation instructions. Combat HUD behavior is unchanged.

## 0.1.0 - 2026-09-17

- Initialize the Foundry VTT v12 / Cyberpunk RED module scaffold.
- Add lifecycle entry point, style and translation files, validation, and a distribution build.
- Add a native-style combat HUD with working target toggling and placeholder Attack, Thrown Weapon, and Quickhacks panels.
- Add player access on unowned tokens and a Combat Tools button in the native HUD for owned tokens and GMs.

- Add the native Cyberpunk status list, collapsed head/body injury groups, custom-status editor with In Jail, and synchronization with native injury/drug effects. Preserve existing custom Condition Lab entries and IDs.

- Implemented: existing Pharmaceuticals and Drugs (including addiction statuses) have separate collapsed token-HUD sections. Section headings now use light HUD text for dark-background readability; missing drug/pharma statuses are not created.

- Removed the duplicate Combat Tools target toggle; use the normal token HUD for targeting.

- Implemented: opening the native status picker temporarily hides the Combat Tools controls and their menu. Closing the picker restores them; native HUD controls remain available.

- Close Combat now combines melee weapons, Unarmed, Martial Arts and the existing disabled Grapple placeholder under the combat-knife button. Supersedes separate melee and fist buttons; Ranged, Thrown and conditional Quickhack remain separate. Attack mechanics and equipment eligibility are unchanged.

- Close Combat now uses the approved two-sparring-figures icon, replacing the combat knife. It inherits the configured CTH icon color and existing button sizing.

- Main CTH icons default to white; the existing icon-color setting supplies all coloration, including the sparring SVG via currentColor. Supersedes the unset theme-color fallback.

- Fix grappling cards overwriting modified chat dice after other modules decorated the native rolls. Preserve roll nodes and update only status/controls.

- Apply the existing winner/loser styling to opposed Brawling results, including ties and grapple-breaking attempts, without replacing rendered dice.

- Standardize Combat Tools card scope, outcome helpers, visibility and growth scrolling across attack/Evasion, grapple and QuickHack. Fix grapple cards failing to reveal their expanded results/controls. Preserve modified dice and existing selectors.

### Movement and EMP (unreleased)

- Added square-grid combat movement origin, native-style MOVE counter, reset, wall-aware adjacent-diagonal accounting and AoE movement-ledger integration.
- Added combat-scoped EMP selection, eligibility/weighting policies, native effect suppression and item-roll restrictions, temporary cyberlimb markers and Biomonitor entries, with end-of-combat cleanup.

### Movement control follow-up (unreleased)

- Replaced the token-child reset arrow with a native HUD-style Reset box below the larger spent/maximum counter; removed the MOVE prefix.
- Reset clicks now bypass token hit-area clipping, return to the saved starting position, and clear movement spent. Browser pointer tests cover the reported missed-click failure and corrected behavior.

### Movement visibility follow-up (unreleased)

- Players can see all visible player-owned token counters. NPC counters/start markers are GM-only; Reset remains owner/GM-only.

### Run movement colors (unreleased)

- Normal movement is green, Move + Run is yellow with `run` above the counter, and movement beyond double the normal allowance is red. Run reminds the player that the additional movement uses their Action.

### Hover EKG (unreleased)

- Added hovered-token EKG below the token for Medtech viewers, with a default-off GM world Always show EKG override. Shared Biomonitor animations reflect target health without displaying numeric HP.
