# Combat Tools roadmap and backlog

This is the master feature roadmap, including the original feature list and later decisions. Implemented items stay listed so the original scope is not lost. Detailed working behavior belongs in [IMPLEMENTED_FEATURES.md](IMPLEMENTED_FEATURES.md). “Implemented” below means present in working source, not fully verified in live Foundry or necessarily released. Planned items are not implementation authorization.

## Original feature list — restored

Recovered from the original task **Locate PneumaCombatTools**, user message beginning “Combat Tools features will be.” Source task: 01a0af8e-d51f-74f1-816f-7ca9c08e79dd; turn: 01a0b00e-b42b-7c60-81fd-63237be3fdc9. Restored 2026-09-18. That list had been acknowledged in conversation but was missing from this file.

### 1. Target DV on hover — implemented

- Show target DV on mouse hover for equipped weapons.
- Current implementation includes eligible installed cyberweapons/attachments, optional Autofire DVs and elevation. See feature inventory for settings and limitations.

### 2. Right-click menu for any token — implemented, Quickhacks placeholder

- Set as Target.
- Attack with equipped weapons, Martial Arts or Brawling; automatically target the token.
- Quickhacks access when the attacker is a Netrunner.
- Preserve the selected attacker and use the right-clicked token as defender. Preserve native owned-token/GM HUD access; support the agreed direct combat shortcut.
- Current Quickhacks visibility also checks for the equipped flagged Quickhack weapon. Its menu action remains a placeholder; visibility is not hack execution.

### 3. Prevent movement — planned, not implemented

- Movement-prevention functionality similar to what the user previously used in Monk’s TokenBar.
- Exact restrictions, scope and GM override behavior still need design; do not invent them as settled requirements.

### 4. Evasion and combined attack resolution — first implementation present

- Prompt the target for Evasion, for both NPCs and players.
- Keep the attack result hidden until the target chooses; publish a single attack/Evasion/resolution card.
- Homebrew Evasion modifications.
- Original sequence: do not trigger the attack roll until the Evasion choice. Later explicitly revised: let the native attack calculate, suppress its chat result and dice animation until defense is chosen, then reveal the existing rolls without rerolling. No client-data secrecy architecture.
- Current scope: Combat Tools-initiated attacks; native sheet/macro interception is not implemented.
- Current homebrew supports qualifiers, free grants/stacking, flat or cumulative penalties, required LUCK and hard limits. Usage belongs to the originating Combat per defender/round; native LUCK stays on the actor.
- Later additions: generic weapon-name option, GM unaware-defender checkbox, cost/penalty button labels, named pre-roll penalties, LUCK notice/payment, damage handoff and explicit manual application controls. Live verification remains necessary.

### 5. Poison, Biotoxin and similar effects — planned, not implemented

- Apply effects such as Poison and Biotoxin.
- Establish native effect representation and rule-specific application before implementation.

### 6. Quickhacks — planned mechanics; HUD placeholder only

- Homebrew modes (the original request referenced previously discussed modes; exact variants must be recovered/confirmed before implementation).
- Custom quickhacks.
- Automatic effect application.
- Coordinate with existing Quickhack functionality where appropriate; do not mark this roadmap item done because a separate module or the HUD visibility check exists.

### 7. Grenades, rockets and thrown weapons — thrown attacks implemented; AoE deferred

- Right-click attack button/submenu listing possessed grenades and rockets.
- Later clarification: a separate **Thrown Weapon** option uses inventory items because grenades are not equippable. Throwing a knife uses the same throwing rules as a grenade, but a knife has no AoE. Keep rockets in scope without assuming they use the throwing skill.
- AoE placement.
- When the attack misses its DV, randomly select the AoE target/location (scatter); exact rule implementation still requires review.
- Apply damage to all tokens in the AoE.
- AoE Evasion options.
- AoE Evasion homebrew.
- Smoke grenades leave a persistent visual smoke effect on the map.
- If feasible, automatically apply smoke visibility penalties and account for cyberware that negates them. This feasibility condition is part of the original request.

### 8. Other visual effects that cause penalties — planned, not implemented

- Support other penalty-producing visual effects.
- This is a combat-mechanics roadmap item; moving general chat cosmetics to another module does not remove it. Specific effects and rules remain to be defined.

### 9. Combat tracker controls — planned, not implemented

- Hide enemies on the combat tracker.
- Other selected Monk’s-style features. The original list left those additional features unspecified; retain that open scope rather than inventing a feature list.

### 10. Cyberware disabling — planned, not implemented

- Disable cyberware effects for Microwaver, EMP and Quickhacks.
- Provide various selection-formula options or manual selection.
- Define duration/restoration and how disabled functionality affects native rolls and Evasion eligibility before implementation. Do not confuse “installed” with “currently functional.”

## Later additions and decisions

- **Grapple:** visible disabled placeholder in the fist menu; mechanics/design pending.
- **Current Action HUD:** maybe, retained below. Chat cards are the current resolution interface. Concurrent exchanges, history and turn checkpoints remain proposals, not completed features.
- **Armor restoration shortcut:** implemented Shift-click native armor ablation arrow to restore 1 SP up to maximum.
- **HUD usability:** implemented native anchoring/dismissal, preserved attacker, size/spacing settings, icon color and shared hover/menu styling. Details remain in the feature inventory.
- **Chat-card cosmetics:** moved to PneumaVisualTools. Combat Tools itself remains responsible for its attack/defense/damage card structure and controls, with stock chat as the development baseline.
- **Card styling contract:** implemented whole-message scope and state attributes; [chat-card-styling.md](docs/chat-card-styling.md) must be maintained for every new/changed card design.
- **Damage application:** native roll values retained; recorded-target bolt is one-time, selected-token bolt intentionally reusable. Native application/undo identity concerns remain a separate investigation below.
- **Actor/Token identity consistency:** planned investigation below. Yam/Smitty was confirmed to be a token-name versus actor-name mismatch, not proof of a targeting bug; the unnecessary target-priority change was reverted.

## Roadmap maintenance

Preserve every user-requested feature here, even after implementation, deferral or relocation. Record status and later superseding decisions rather than dropping earlier scope. New feature discussions must update this file when documentation is authorized. Do not rely on conversation history as the only feature record.

## Current Action window and combat exchange coordination

Status: maybe — retained for possible future consideration, not approved for implementation. Recorded 2026-09-17; updated 2026-09-18.

Current direction: use chat cards for combat resolution; the first implementation is present. General chat cosmetics now belong to PneumaVisualTools. The Current Action window plan below is retained as an optional, historical design; its window/history/checkpoint features are not implemented. Later accepted chat-flow decisions above take precedence over conflicting details in this proposal.

### Purpose and scope

Coordinate combat exchanges involving attackers, defenders, and scene context. Do not recreate a character sheet or Token Action HUD. Reuse native Foundry v12 and Cyberpunk RED rolls, controls, and workflows wherever possible; inspect the actual implementations before designing integrations.

### Window

- A draggable Current Action window with position remembered separately for each user.
- Consider CrewTools panel styling after inspecting its implementation. The intended narrative-cloud feel comes from an exchange unfolding in place, not comic-book visual styling.
- Top: a short scrollable history of the previous two or three completed exchanges, with compact outcomes and optional expanded details.
- Center: current attack/defense/damage progression, updated in place.
- Bottom: fixed choices for the current user; otherwise show who must respond.
- Proposed phases: incoming threat, defense choice, hit/miss resolution, damage and any required application, complete.
- Closing the window must not cancel an unresolved exchange. Pending exchanges must not be silently replaced or treated as completed history.

### Native damage presentation and chat

- Preserve the system's native damage roll, chat message, and dice presentation. Seeing the dice reveal a possible critical is part of the experience.
- A Roll Damage control may invoke that native workflow; the window reflects its result afterward.
- Distinguish damage calculated from damage actually applied. Verify the system's critical detection and application sequence before integrating.
- Chat remains the permanent record. Prefer a compact attack/defense result alongside native damage messages; avoid redundant summaries and a message for every phase. Exact message structure remains undecided.

### Concurrent exchanges and turn checkpoint

- Support two simultaneous exchanges for ROF 2, with capacity for a rare third. Capacity does not grant extra attacks or enforce the full action economy.
- Attacks and evasions may arrive in either order. Each exchange needs its own stable attack/defense pairing, target, and progress; label response controls clearly.
- Proposed rule: commit each defense choice before revealing its corresponding attack result. Precise roll visibility and pairing behavior still need design review.
- The user's preferred direction is the combat turn tracker as the lock/checkpoint, replacing the earlier suggestion to block an attacker after starting one exchange.
- Proposed checkpoint: prevent ordinary turn advancement while exchanges remain unresolved, identify the outstanding steps, and allow an explicit GM override. Preserve pending exchanges on override.
- Misses can complete immediately; hits remain pending through required damage resolution. Define completion criteria before implementation.
- Proposed GM controls: resolve or cancel stalled exchanges, record cancellation, and do not silently undo rolls or resource changes.
- Phase handlers must reject duplicate or invalid transitions, including repeated rolls or damage application.

### Open design questions

- How to integrate the turn checkpoint with native combat controls, and what happens outside an active combat or on backward/forced turn changes.
- How users select among concurrent exchanges, and how multiple owners or a GM respond without duplicate resolution.
- Whether all incoming attacks notify, or only attacks needing a response; appropriate GM/NPC presentation and information about unidentified attackers.
- Whether to show only exchanges involving characters the user handles; exact history and pending-list presentation.
- Reliable native hooks for attack, defense, damage dice, criticals, and application; compatibility with existing modules.
- Do not intercept unrelated character-sheet, macro, or other-module actions without a separate scope decision.

## Actor / Token identity consistency

Status: planned investigation — recorded 2026-09-18. No implementation authorized by this roadmap entry.

Scope: Combat Tools combat workflows and their native Cyberpunk RED handoffs. Preserve distinct token and actor identities; do not rename documents to make labels agree.

### Confirmed inconsistencies

Source review used Cyberpunk RED v0.92.4 and the current Combat Tools implementation; live verification remains pending.

- Combat Tools exchange names and native damage-roll target lists use token names, while native damage confirmation and Damage Dealt To cards use actor names. Example: token Yam represents actor Smitty, so one exchange displays both names without necessarily affecting the wrong actor.
- Native roll-message speakers explicitly use actor.name. Character sheets also use actor names; this is expected for actor editing but differs from scene-facing combat labels.
- Combat Tools inherits the actor-name confirmation behavior by supplying the resolved token actor to the native damage dialog.
- Native roll-message speaker construction does not explicitly preserve scene/token identifiers. Investigate loss of scene-token identity for downstream consumers.

### Risks requiring reproduction

- Native damage, reverse-damage and item buttons resolve token actors through game.actors.tokens, a mapping for the currently viewed scene, then fall back to a world actor. Reproduce behavior for old chat cards after a scene change, especially unlinked tokens, before claiming a wrong-actor mutation bug.
- Verify linked versus unlinked tokens, multiple tokens representing one actor, renamed tokens, removed tokens and scene changes. Check displayed names separately from the actual actor receiving HP, armor, shield and resource updates.

### Proposed direction and completion criteria

- Prefer the participating token's name for scene-based combat displays; use actor identity when no token is involved. Keep actor-sheet identity intentional.
- Retain the exact scene/token UUID through attack, defense, damage confirmation, application and undo where the workflow supports it. Resolve mechanics through that token's actor rather than guessing from current selection or a matching name.
- Preserve the explicit distinction between Apply to <target name> and Apply to Selected Token. Combat Tools already stores full token UUIDs for managed application; verify native follow-up messages and undo separately.
- Add targeted regressions for demonstrated failures and identify the smallest native integration needed. Do not globally patch unrelated system workflows without a separate scope decision.
- Document remaining native limitations and distinguish display inconsistencies from confirmed targeting or mutation errors.

Source pointers: Combat Tools src/scripts/combat-resolution.ts and src/scripts/damage-flow.ts; Cyberpunk RED src/modules/chat/cpr-chat.js, src/templates/chat/cpr-damage-rollcard.hbs, src/templates/chat/cpr-damage-application-card.hbs and src/templates/dialog/cpr-damage-application-prompt.hbs.

## Resolution card skinning structure — implemented

- User-requested structural containers for pending attack, attack, Evasion, result, damage roll and application, plus recovery.
- Separate label and content elements support optional vertical labels and theme styling.
- Native markup and behavior retained. Selector contract: docs/chat-card-styling.md. Live Foundry verification pending.

## Damage status attachments and critical injuries — 2026-09-19

- Implemented: in-card shield/reduction controls and a native-status popup allowing up to three attached effects. Apply damage also activates those effects on the chosen recipient.
- **Review during the main status-effects work:** this is an initial generic picker. Revisit effect eligibility, durations, stacking, resist checks, conditional application when damage is absorbed, and interaction with native damage undo. No rules for those topics are implied by this first version.
- Implemented: two-or-more-sixes critical injury detection, aimed-head vs body routing, reusable injury dice next to both recipient options, and per-method settings (all initially enabled). Reuses native injury tables/items/effects and duplicate policy.
- Explosion/Quickhack integration awaits those attack workflows. Grenade/rocket AoE/scatter remains planned.
- TTRPG aid direction: do not add mandatory next-action prompts, redundant roll-comparison summaries or completion locks. Deliberate repeat selected-token damage and injury actions remain available.
- Supersedes the earlier native damage-confirmation popup for managed cards: options now appear in-card. Native damage summaries/undo remain separate, so the actor/token identity investigation is still relevant.

## Compact application follow-up — implemented

- Supersedes the always-visible damage-options fieldset: normal click uses native defaults; Shift-click opens the native damage-options dialog.
- Native applied-damage results append inside the resolution card as compact horizontal Name / Damage / Location rows. The larger damage number expands its native breakdown and undo control. Additional recipients/repeated selected-token applications append rows.
- No new damage formula; native calculations/template remain authoritative. Original separate native application messages remain for history and unmanaged attacks.

## Status slots and updated-card scrolling — implemented

- Supersedes the three-effect button: four square +/icon slots aligned to the right of recipient damage options. Each slot opens the native-status picker for replacement/removal.
- Updated resolution cards scroll into view, including asynchronous growth; oversized cards show the bottom.
- Main status-effects review remains pending as recorded above.

- Implemented native-ammo gate for managed attacks: prevent flow initiation when the system's hasAmmo check fails; preserve the Click Click warning and native per-mode consumption.

## Damage defaults and three status slots — implemented

- Supersedes four status slots: maximum three, with dark Token-HUD-like icon wells in the card and picker.
- Blood-drop click rolls native default damage; Shift-click opens native roll options. Application bolt Shift-click behavior remains separate and unchanged.

- Card refinement implemented: hide redundant structural labels by default while retaining skin hooks; move paid Evasion cost to its native header; strengthen status-icon contrast against native chat styles.

## Attack-method follow-up (2026-09-19)

- Implemented: Ranged rename, separate Melee Attack sword menu, and free evasion for melee/unarmed/Martial Arts.
- Implemented: optional MA does not ablate armor setting; native half SP retained.
- Supersedes Thrown placeholder: inventory thrown weapons now attack and receive a reusable (used) name marker. Thrown evasion follows ranged/homebrew settings.
- Implemented: Improvised uses native compendium Thrown Weapon, with GM-required 1d6–6d6 choice before damage.
- Grenade inventory ammunition listing implemented; grenade/rocket flow, scatter and AoE remain deferred as described above. Quickhacking remains deferred.

## Item marker subsystem

- Implemented: generic persisted visual markers, native actor-sheet/CTH badges, and public read/set/clear/render API. Used and Disabled are visual presets.
- Supersedes thrown name mutation: new thrown attacks use the Used marker. Existing names remain unchanged.
- Deferred by request: combat lifetime, automatic removal/restoration and mechanical cyberware disabling.

### Superseding improvised damage decision

Improvised damage is now selected by the attacker (player or GM), after agreeing with the GM, in the initial attack dialog. A 1d6–6d6 selection is required before confirmation and is saved with the attack for the later damage roll. This supersedes the GM-only resolution dropdown, which has been removed. Older improvised cards without a saved choice must be restarted.

- Implemented follow-up: native Thrown Weapon compendium icon beside Improvised.

- Visual follow-up implemented: regular-weight CTH icons and a knife replacing the Melee Attack sword. Supersedes the earlier sword-icon request.

- Superseding visual decision: restore the original solid CTH icons; use a combat-knife silhouette for Melee Attack. The regular-weight variation was rejected.

- Implemented first cybereye status HUD: selected-actor condition display, pending attack notices, movable/collapsible panel, client visibility and safe interactive preview. This authorizes a focused condition/alert overlay, not the earlier broader Current Action window. Full condition synchronization and automation remain planned.

Biomonitor revision: header displays the actor name followed by Biomonitor. Compact single-line condition rows retain native icons, with a plus fallback and full text on hover. No counts, collapse control, empty-state panel, or telemetry footer. One scrolling ALERT: Incoming Attack banner links to the latest pending card and acknowledges the currently displayed alerts locally. The overlay hides when empty. Reduced-motion users receive static alert text. Preview is now named Test Biomonitor; End test remains available in its header.

Status HUD update: large alerts above optional Biomonitor conditions. Conditions require installed Biomonitor cyberware or the default-off world override Show Biomonitor even if not installed. GM-only Send HUD message targets connected users with expiry/clear/dismiss behavior. Players see no name header; GMs see the selected token name. Test status HUD previews both sections safely. Incoming attack notices take priority over custom messages.

Biomonitor vitals update: left current/max HP with animated EKG and five severity states; right single-line conditions. Poison/radiation/biotoxin/fire dashboard lights use client-configurable timed flashes. Safe preview includes HP state and light tests. HUD now stays visible when enabled, with a persistent minimize-to-notification control and alert highlight; this supersedes earlier hide-when-empty/no-collapse decisions. Per-client disable and implant/world-override gating remain. Instant-effect damage integration remains future work.

EKG visual enhancement: a luminous moving scan point with a layered fading trail follows the waveform, including the straight flatline. Supersedes the stationary flatline. Reduced-motion users receive a static trace.

Dashboard indicators are now hidden when inactive. Active indicators fill consecutive slots in activation order; clearing an indicator closes its gap, and reactivation appends it after remaining indicators. Existing conditions on initial display use their actor list order.

Three-column Biomonitor: Vitals, Biological Scan (empty: No Active Pathology), Implant Integrity (empty: All Systems Normal). Diagnostics lists cyberware carrying the existing Disabled item marker and opens its native sheet on click. Combat-scoped expiry/restoration remains deferred; this display does not create that lifecycle. Client Show Biomonitor HP numbers defaults on; when off, hovering or keyboard-focusing the EKG reveals HP without resizing the panel.

EKG Critical threshold revised to below 10 HP (supersedes below 15); zero or below remains Flatline.

Minimize/expand now preserves the upper-right curved corner. Saved positions retain this right anchor, subject to viewport bounds.

HUD API v1 implemented at game.modules.get("pneuma-combattools").api.hud: send, remove, dismiss and list. Multiple messages use compact previous/next controls with individual local Clear, including native incoming-attack notices. Stable source/ID pairs update messages; optional expiry, local sends and GM socket delivery to connected recipients are supported. This supersedes the single replaceable alert. See docs/hud-api.md. Browser fixtures cover the API; live multi-client verification remains outstanding.

GM Send HUD Message moved from Settings to the expanded live HUD. Recipient choices retained. Durations: 60 Seconds, 5 Minutes, 15 Minutes, 1 Hour, 6 Hours, Until Cleared (no expiry; session-only). Supersedes the old settings-menu location and duration list.

Performance fixes: pending-card refreshes use an unresolved-card index seeded once on ready, filter actor/item/effect updates by defender and combat updates by originating combat, and batch repeated requests once per animation frame. Ordinary chat events no longer refresh the HUD; stable header/message/medical sections retain unchanged DOM, EKG playback and focus. Hidden HUD exits before gathering medical data; minimized HUD skips medical work. Regression checks cover event routing, batching, card cleanup, unchanged DOM and live HP updates.

HUD alert layout: shortened scrolling banner with previous/count/next on one row to its right and Clear directly underneath. Clear dismisses only the displayed alert on this client.

HUD position now remembers the last completed mouse drag as its preferred upper-right anchor. Resize and content changes only clamp the displayed position to the viewport; enlarging restores the preferred position. Minimize/expand and stationary header clicks never save position.

Alert text scrolls three times then rests centered. Opening/expanding the HUD or receiving a new message starts the sequence again. Unrelated updates preserve the animation; reduced-motion stays static.

With an installed Biomonitor or its world override, the minimized HUD shows a compact live EKG and notification bell side by side. Without it, only the bell is shown. The miniature uses the same HP states and pause/resume interaction, and retains the upper-right anchor.
