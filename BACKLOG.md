# Combat Tools roadmap and backlog

- **CTH menu presentation and Jack In/Out:** grenade and QuickHack rows display item artwork and align left. Grenade rows require positive inventory quantity; depleted stacks are hidden. QuickHacks prefer actor item artwork, then world item artwork, then the bundled icon. Menu headers inherit the corresponding CTH control's current colors. The QuickHack header reads **Jacked-In**, **Not Jacked-In**, or **Ejected**. **Jack In/Out** voluntarily disconnects an active link without a roll, even after losing line of sight. The existing GM coordinator validates ownership and connection identity. Voluntary disconnection permits fresh Jack-In; forced ejection still blocks reconnection for that encounter. Old awareness cards cannot operate on a disconnected or replacement connection. Grenade placement/responses/shared basic damage now use the AoE flow; grenade-specific effects remain deferred.

- **Detected Netrunner ejection from CTH:** an owned token with detected active incoming connections shows the QuickHack icon, with one **Eject NetRunner** row per connection. Uses the existing native Concentration versus Interface Force Out workflow; ties retain the connection. Ejection resolves in one card containing the native Concentration roll, player Netrunner Interface roll, totals and outcome, with shared winner/loser styling. NPC resistance retains its automatic Interface total. The card uses the awareness message's audience. Both the CTH row (including a single connection) and ejection card show the Netrunner name when the current identity setting for a detected Jack-In or later QuickHack permits it; otherwise they show Unknown Netrunner. Existing chat cards are not rewritten. No Netrunner role or launcher is required for ejection. Awareness uses retained Jack-In/QuickHack result cards for the current encounter; deleting those cards removes the associated shortcut. Undetected, ejected, other-encounter and untracked connections are excluded.

Reviewed against working source and feature documentation on **2026-09-20**. This is the master roadmap. Implemented means present in source, not necessarily released or verified in live multi-client Foundry. Planned/deferred entries are not implementation authorization. Current sections below take precedence over the explicitly historical appendix.

The original ten requested features remain listed. Later additions, remaining work and retained proposals follow. Detailed operating behavior belongs in [IMPLEMENTED_FEATURES.md](IMPLEMENTED_FEATURES.md) and the linked player/GM documentation.

## Original feature list — restored

Recovered from the original task **Locate PneumaCombatTools**, user message beginning “Combat Tools features will be.” Source task: 01a0af8e-d51f-74f1-816f-7ca9c08e79dd; turn: 01a0b00e-b42b-7c60-81fd-63237be3fdc9. Restored 2026-09-18. That list had been acknowledged in conversation but was missing from this file.

### 1. Target DV on hover — implemented

- Show target DV on mouse hover for equipped weapons.
- Current implementation includes eligible installed cyberweapons/attachments, optional Autofire DVs and elevation. See feature inventory for settings and limitations.

### 2. Right-click menu for any token — implemented

- Set as Target: superseded by the native token-HUD target button; duplicate Combat Tools control removed.
- Attack with equipped weapons, Martial Arts or Brawling; automatically target the token.
- Quickhacks access when the attacker is a Netrunner.
- Preserve the selected attacker and use the right-clicked token as defender. Preserve native owned-token/GM HUD access; support the agreed direct combat shortcut.
- The earlier equipped-launcher visibility requirement is superseded by the integrated QuickHack modes below.

### 3. Prevent movement — planned, not implemented

- Movement-prevention functionality similar to what the user previously used in Monk’s TokenBar.
- Exact restrictions, scope and GM override behavior still need design; do not invent them as settled requirements. Grapple-specific prevention of independent defender movement is implemented separately; it does not complete this general movement-control feature.

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

### 6. Quickhacks — integrated; specific automation gaps remain

- **Access and enablement:** target-aware HUD actions for the selected Netrunner; captured source/target remain authoritative. No launcher ownership requirement for the HUD. The optional QuickHack launcher reuses native sheet attack for Jack In and damage for QuickHack Target. The master switch blocks controls, API actions, pending workflows, Force Out and effects; disabling does not undo effects or connections. An active standalone Pneuma Quickhack module disables this integration to prevent duplicate handling.
- **Rules modes:** RAW offers all eleven reference hacks; Must Buy QuickHack requires recognized inventory gear/program identity; Must Be Loaded in Equipped Cyberdeck requires the corresponding program in an equipped deck's native installation list. REZ is not loading. Native deck capacity/loading controls are reused. No separate Quick Hack program class: programs remain Booster.
- **Content:** create missing programs named Quickhack: <name> in CombatTools/Quickhacks and a launcher in CombatTools. Existing items are not renamed, moved, converted or repaired; actor/scene inventories are not scanned. Old settings are not imported. This supersedes the former safe-program-conversion/migration claim. Legacy folders and retained gear remain; cleanup is deferred until at least v0.8.0, not automatically authorized at that version.
- **Range and sight:** 25 grid squares, with wall-based sight from the attacker center to at least one of nine inset target points. Loss of sight blocks Jack-In/QuickHack without ejecting an existing connection; restoring sight permits actions again.
- **Native rolls and results:** Interface for Jack-In/QuickHack; a Netrunner target detects Jack-In automatically, other targets oppose with WILL. Detection ties favor detection. QuickHack must exceed DV. Force Out contests native Concentration against Interface; ties favor the Netrunner. Native dice and the result share one card when visibility permits; private NPC dice remain GM-only when the result is shared.
- **Routing:** all six prior audience/totals/identity choices are configurable directly in Combat Tools. No old-setting migration. See [QuickHack instructions](docs/quickhack.md) for the choices.
- **Encounter state:** the selected started Combat owns attacker/target connections and originating Jack-In IDs. Detection does not prevent connection. QuickHack requires an active connection; successful Force Out records ejection and prevents re-Jack-In for the rest of that Combat. No hour timer. Round changes, reload and feature toggles retain state; a new Combat starts empty. Pending actions cancel if the active combat changes during the roll. Old cards cannot operate on another connection/Combat.
- **Outside combat:** Jack-In and the untracked Force Out contest remain roll/chat-only. QuickHack itself is blocked because no connection is tracked. This replaces the earlier broad claim that all outside-combat roll/chat workflows were available.
- **Implemented effect handling:** Sonic Shock imports native Damaged Ear without injury damage; Overheat provides a reusable GM native damage card; Synapse Burnout exposes native damage; Slow rolls the movement-reduction amount for manual handling. Damage uses the native armor-bypassing brain path and suppresses critical damage.
- **System Reset integration gap:** effects.ts looks for status IDs unconscious and prone, but the module palette supplies r4kadyvk4trrgh8p and e73pyhdrc41isg7f. Under that palette it falls back to manual resolution. Full automatic Unconscious/Prone application must not be described as complete until this mapping is fixed and verified.
- **Still manual/deferred:** custom hacks; movement changes; cyberware choice and mechanical disabling; chipware ejection; Puppet/Lure decisions; duration expiry/restoration; Net Action spending; Neuroport requirements; Self-ICE/Passwall automation. RAW is a rules/catalog choice, not a claim of complete automation.
- Live Foundry multi-client verification remains open. Source: src/scripts/quickhack; details: [QuickHack](docs/quickhack.md).

### 7. Grenades, rockets, shells and thrown weapons — main AoE flow implemented; special effects deferred

- Original right-click grenade/rocket scope is implemented through inventory grenades and equipped launchers. Knife/improvised throwing remains single-target; rockets use their native weapon skill.
- Placed translucent area: 10m/yd square explosives, 6m/yd forward square shotgun shells. Native loaded-ammo variety distinguishes shells from slugs.
- **Supersedes random scatter proposal:** the supplied rules give the GM the missed explosive landing point, within the original intended blast square. The card pauses for that placement.
- Wall-clipped previews/templates, footprint-based recipients and sampled wall visibility. GM add/exclude/affected overrides accommodate partial cover or destroyed cover. Terrain/cover HP is manual.
- One attack, individual Evade/Not evade responses, one shared damage roll and per-recipient manual application. Native dice, damage and duplicate-application safeguards are reused.
- AoE settings expose shape/dimensions and evasion eligibility/modifier/MOVE costs. Explosives are Square/Circle only. Shotgun DV is fixed at 13; explosive tie-success homebrew was removed. Cover Up now applies Prone, double SP and double ablation including blocked damage.
- Suppressive Fire: white CTH icon beside Autofire; native ten-bullet Autofire attack and individual Concentration. Requested three-square-wide wall-ended corridor is the homebrew default; settings include RAW 25m visibility, width and range options. Failure records next Move/Run obligation; movement is manual.
- **Deferred:** grenade-specific effects, persistent smoke, conditional visibility/cyberware interactions, automatic cover/terrain destruction. These original requirements remain open.
- Build and automated checks do not establish live scene/multiplayer verification. Details: [Area attacks](docs/area-attacks.md).

### 8. Other visual effects that cause penalties — planned, not implemented

- Support other penalty-producing visual effects.
- This is a combat-mechanics roadmap item; moving general chat cosmetics to another module does not remove it. Specific effects and rules remain to be defined.

### 9. Combat tracker controls — planned, not implemented

- Hide enemies on the combat tracker.
- Other selected Monk’s-style features. The original list left those additional features unspecified; retain that open scope rather than inventing a feature list.

### 10. Mechanical cyberware disabling — EMP implemented; source-specific integrations deferred

- Disable cyberware effects for Microwaver, EMP and Quickhacks.
- Provide various selection-formula options or manual selection.
- EMP now implements GM/player selection, four random modes, foundational/dependent-option policies, carried electronics and a GM immunity list. Combat-owned records last until combat ends (supersedes printed one-minute timing for this feature). Native item effects are suppressed, item rolls blocked, cyberweapon eligibility filtered, and Reflex Co-Processor evasion qualification respects EMP.
- Implant Integrity shows Disabled — EMP. Cyberlimbs use temporary broken-limb icons without injury damage or synthesized limb penalties. Existing disabled effects/injuries survive restoration. Source-specific Microwaver/QuickHack dispatch, custom weighting and random shortlists remain deferred. See [EMP](docs/emp.md).

## Later additions — current status

### Self CTH and Pneuma HomeBrew — implemented

Own-token HUDs show self controls instead of standard combat actions while retaining native token controls. GM target actions remain available when acting as a different selected token. Default-off **Pneuma HomeBrew** adds a D10 for installed functional Sandevistan/Kerenzikov. Started combat and existing initiative are required. Native CPR rerolls preserve the acting combatant; duplicate pending clicks are ignored. The Action cost is table-managed. Automated unit/browser checks pass; live Foundry verification remains outstanding. See [Self CTH](docs/self-cth.md).


### Movement tracking — implemented

- Square-grid combat movement: starting outline, larger native HUD-style spent/maximum box, 2m per MOVE allowance on a 2m grid, and a separate Reset box below it. Clear adjacent perpendicular steps combine; blocked diagonals cost two. No full-route pathfinding or enforced movement cap.
- Persists with token updates, resets each turn, integrates AoE movement accounting, and avoids refunding resolved evasion/held-token placement. This does not complete the separate planned general movement-prevention feature. Live Foundry verification remains open. See [Movement](docs/movement.md).

### Native HUD and targeting — implemented

- Reuse the configured native Token HUD, preserving owned-token/GM controls, positioning, dismissal and theme compatibility. Combat shortcuts retain the selected attacker and clicked defender; selection/targets are restored before native attacks.
- Close Combat combines melee, equipped Unarmed/Martial Arts and context-sensitive grappling under the two-sparring-figures icon. This supersedes the separate fist/melee menus and sword/knife variants. Ranged, Thrown and conditional Quickhacks remain separate.
- Eligible weapons include equipped weapons, installed weapon cyberware and configured secondary-weapon attachments, using shared eligibility with hover DVs. Hover includes elevation and optional Autofire.
- HUD scale, status-icon scale, tight spacing and world icon-color controls are implemented. Main icons use the configured color with white fallback; native/submenu icons retain their own styling.
- Armor shortcut: Shift-click the native armor ablation arrow to restore 1 SP up to maximum.

### Damage, critical injuries and attached statuses — implemented with remaining review

- Native damage rolls and calculations remain authoritative. The damage drop stays in the same position on hits/misses; permitted owners/GMs may deliberately roll after a miss. Default click uses native defaults; Shift-click opens native roll options. Missed Autofire starts at an editable x1 for manual review.
- Recorded-target application is one-time; selected-token application is intentionally reusable. Shift-click application uses the native damage-options dialog. Compact applied rows show Name / Damage / Location; the number expands native details and undo. Native follow-up messages remain separate.
- **Three** status slots beside recipient options, with native-style icon wells and replace/remove controls. This supersedes the original combined button and later four-slot layout. Applying attached statuses uses the shared status subsystem and awaits its native item/effect work.
- Critical detection uses native two-or-more-sixes behavior, aimed-head/body routing and native injury tables/items/duplicate policy. Eight per-method settings default enabled and are configured in a GM-only Critical injuries submenu table; existing values are retained; reusable injury controls remain available. Explosion workflow integration is deferred. QuickHack retains no-critical-damage handling regardless of its injury toggle.
- Martial Arts retains native half SP. Optional MA does not ablate armor defaults off and affects managed damage application only.
- Still open: generic status eligibility, timing/duration, stacking, resist checks, immunity, damage-absorption conditions and interaction with undo. Native actor/token display and undo identity remain a separate investigation below. No mandatory action checkpoints or completion locks are implied.
- Source: damage-flow.ts, damage-application.ts, damage-status.ts, critical-injury.ts and status-sync.ts.

### Native status foundation — implemented; condition-specific rules incomplete

- Native token status controls retain their click/right-click handlers. The catalog contains 64 legacy Cyberpunk statuses plus Dead and custom entries, preserving legacy IDs while correcting labels.
- Collapsed Crit Head / Crit Body, Pharmaceuticals and Drugs sections; other statuses/custom entries remain available. Native injury items and supported drug effects synchronize with icons without duplicate penalties. Removing injury status removes the linked injury item, not its prior HP damage.
- The custom editor uses the native icon picker, starts with In Jail and preserves prior custom Condition Lab definitions. This status-specific import is implemented; the no-migration decision for QuickHack does not remove it.
- Startup/scene reconciliation and per-actor queued updates are implemented. Damage cards use the same status IDs. The status picker temporarily hides Combat Tools menus, then restores them.
- Condition Lab must not simultaneously manage the palette. Broad fire/poison/treatment/immunity/duration/derived-wound automation remains open; most general status icons are markers only. Supported drug effect activation does not itself grant/consume doses.
- See [Status effects](docs/status-effects.md). Resolve the QuickHack System Reset ID mismatch noted in original feature 6 before claiming those two statuses are automatic.

### Item markers — implemented, visual only

- Persistent Used/Disabled markers, native actor-sheet/HUD badges and public read/set/clear/render API. Thrown items receive Used without renaming the item. Existing names remain unchanged.
- Generic marker lifetime and a marker-management window remain deferred. The EMP workflow now owns combat lifetime, suppression and cleanup for its separate EMP marker. Implant Integrity displays both kinds.
- See [Item markers](docs/item-markers.md).

### Status HUD, Biomonitor and messages — implemented

- Client-visible, draggable HUD with a saved upper-right anchor, viewport clamping, minimize/expand and safe Test status HUD preview. Resizing/content changes preserve the preferred position; stationary clicks and automatic expansions do not save a new position. The old hide-when-empty/no-collapse behavior is superseded.
- Three medical columns: Vitals, Biological Scan and Implant Integrity. Medical data requires an installed Biomonitor or the default-off world override. Combat grapple/choke rows and addressed alerts do not require the implant. Players have no name header; GMs see the selected token name. The assigned character is the player fallback when no token is selected.
- Vitals: animated EKG, current/max HP and five display states. Critical is below 10 HP; HP at/below zero is Flatline. Hidden HP can be revealed over the EKG by hover/focus. Click/Enter/Space pauses the animation without stopping data updates. Reduced motion uses static presentation.
- Poison/Radiation/Biotoxin/On-fire indicators show active conditions only, pack together in activation order and flash on new/repeated exposure for the configured duration. The exposure hook exists; automatic linkage to instantaneous ammo effects remains future work.
- Biological Scan shows native conditions/injuries; Implant Integrity shows disabled cyberware markers. Empty labels are No Active Pathology and All Systems Normal. The display itself adds no mechanics; EMP supplies combat-scoped suppression and restoration separately.
- The minimized HUD shows an EKG and bell with a Biomonitor, otherwise a bell. New notices temporarily expand, play one ticker pass, then minimize; reduced motion uses eight seconds. Manual changes cancel the temporary behavior without overwriting the saved preference. Ordinary expanded messages scroll three times then rest centered.
- Multiple notices use previous/count/next and per-message local Clear. Incoming attacks link to their card. The GM Send HUD Message control is in the live expanded HUD, not settings. Durations: 60 seconds, 5 minutes, 15 minutes, 1 hour, 6 hours or Until Cleared. New API notices are session-local, including Until Cleared; reload clears them.
- HUD API v1 supports send/remove/dismiss/list, stable source/ID replacement, optional expiry, local delivery and GM delivery to connected recipients. Hook-driven updates and stable DOM preserve EKG playback/focus; there is no polling loop.
- See [Status HUD](docs/cybereye-hud.md) and [HUD API](docs/hud-api.md). This focused overlay does not implement the optional Current Action window.

### Settings and visual responsibilities — implemented

- Native settings grouped into Combat & Evasion, Critical Injuries, QuickHack, Token HUD & Targeting, Status HUD & Biomonitor, and Status Effects. Existing keys/scopes, native controls, permissions and homebrew badges are retained; filtered empty groups hide.
- General portrait/compact-chat cosmetics belong to PneumaVisualTools. Combat Tools owns combat card structure, controls, state/outcome styling and shared behavior. Native chat is a supported baseline; installed dice/theme customizations must be preserved.
- The existing card styling contract is mandatory for every new/changed card: reuse applicable shared helpers, update [chat-card-styling.md](docs/chat-card-styling.md) and the feature inventory, and verify actual rendering/state changes. Documentation alone does not satisfy reuse/compatibility requirements.

## Grappling — implemented, 2026-09-20

Supersedes the disabled Grapple placeholder and its pending design status. The approved implementation uses native DEX + Brawling rolls and the supplied Grab, Choke and Throw rules.

- Grab resolves an opposed Brawling check, then offers Hold Target or Take Held Object. Escape and third-party Break Grapple oppose the current grappler. Ties favor the responder.
- Choke and Throw apply current BODY directly to HP without armor ablation. Choke includes the supplied strict HP safeguard and three-successive-round unconsciousness; Throw applies Prone and ends the grapple. Release costs no Action.
- Started-encounter Grab/Grapple metadata belongs to the originating **Combat document**: participants and roles, pending/choice/active state, roll results, card reference, revision, incomplete operation and choke sequence. Changing the selected encounter does not redirect that state. Reset/deletion cleans managed grapple state and effects. Outside-combat grabs remain scene-scoped with GM-managed consecutive rounds.
- Both participants receive the grapple penalty; Combat Tools blocks two-handed weapon attacks. Existing native grapple penalties are not duplicated. The defender cannot move independently through player token movement.
- Under Vitals, show Grappling / Grappled by and Choking / Being choked by, with the tracked count. Choking rows clear after a missed round or ended grapple; grapple rows remain while applicable. Combat rows do not require a Biomonitor.
- Implemented safeguards: owner/GM checks, stale-card rejection, serialized cross-owner updates and duplicate-damage protection on retries.
- Implemented paired token movement: Hold Target scales the defender texture to 0.8 (preserving mirroring), saves its original scale in grapple metadata, and places it at the grappler’s previous position/elevation after each movement using native GM token updates. Multi-square moves use the starting square. This supersedes fixed-offset following. Release, throw, escape/break and cleanup restore scale and stop following. This supersedes GM-assisted paired placement; separate held-token pathfinding is not provided.
- Release, Choke and Throw remain direct actions without opposed rolls. Follow-up cards use the action title and omit the original Grab dice, retaining those rolls in metadata.
- Remaining manual boundaries: held-item inventory transfer, free-hand confirmation, general Action expenditure, turn ownership and Get Up. One tracked grapple per character; unrelated native sheet attacks are not intercepted. These limitations are not automatic authorization for additional work.
- Operating details: [Grappling](docs/grappling.md). Live multi-client Foundry validation remains open.

## Shared card styling and behavior — implemented, 2026-09-20

This fulfills the existing card styling contract; maintaining documentation alone does not replace reusing the established behavior. Supersedes the separate grapple rendering and attack-only growth-scroll path.

- Attack/Evasion, grapple and QuickHack cards share message classification, visibility checks, whole-message scope and growth scrolling. Common helpers live in card-structure.ts and resolution-scroll.ts; registration is centralized in main.ts. Workflow-specific rules and permissions remain separate.
- Opposed Brawling uses the same winner/loser classes as attack/Evasion, including Escape and Break Grapple. Ties style the responding roll as winner; unresolved contests are not marked. Older saved grapple cards receive these classes in place.
- Render hooks preserve native roll nodes, modified Chat Dice artwork and existing listeners. Update owned controls/status in place; publish changed roll content through the normal ChatMessage update/render lifecycle. Do not replace an already decorated card with stock markup.
- Updated cards scroll to reveal their contents, including delayed growth and replacement renders; oversized cards reveal the bottom controls. Initial history, ordinary chat and hidden content do not trigger scrolling.
- For every future card addition/change: reuse the applicable shared helpers, maintain [chat-card-styling.md](docs/chat-card-styling.md) and [IMPLEMENTED_FEATURES.md](IMPLEMENTED_FEATURES.md), and verify relevant state transitions, winner/loser presentation, dice compatibility, visibility and growth scrolling. Preserve workflow-specific selectors or document any change explicitly.
- Validation completed for this implementation: build and **126 automated tests passed**, including both Chat Dice hook orders, preserved dice nodes/listeners, Brawling wins/losses/ties, and growth scrolling across all three workflows. This is automated/browser-fixture evidence; live multi-client Foundry verification remains outstanding.

## Remaining work and verification

No priority order or new implementation authorization is implied.

- **Source-confirmed integration gap:** align System Reset status lookup with the configured shared status catalog; verify actual Unconscious/Prone application.
- **Original pending scope:** general movement controls; poison/biotoxin rules; grenade-specific effects (main scatter, AoE, multiple recipients and AoE settings are now implemented); persistent smoke and conditional visibility/cyberware interaction; other penalty-producing visuals; enemy tracker hiding and unspecified selected Monk's-style features; source-specific cyberware disabling/restoration beyond the implemented EMP workflow.
- **Partial-feature follow-ups:** custom QuickHacks and the manual QuickHack boundaries in feature 6; per-condition behavior inventory and damage-status/undo rules; marker lifetime/management; instantaneous-effect HUD integration. Grapple dragging and temporary token scaling are implemented; held-item transfers and general Action/turn enforcement remain manual as documented.
- **Identity investigation:** scene/token names versus actor names and native damage/undo handoffs, including old cards after scene changes. Keep the confirmed display mismatch distinct from an unproven wrong-target mutation.
- **Deferred cleanup:** retain legacy QuickHack folders/gear until at least v0.8.0. No QuickHack content/settings conversion, automatic rename, repair or inventory scan is present or implied.
- **Optional proposal:** Current Action window/history/concurrency checkpoints remain maybe, not approved or implemented. Preserve the detailed proposal below.
- **Live verification:** multi-client Foundry checks remain open for native roll/card integration, owner/GM handoffs, linked/unlinked token identity, status application and encounter lifecycles. The last implementation suite passed 126 automated tests; this roadmap review changed documentation only and did not rerun gameplay tests.

## Roadmap maintenance

Preserve the original requests and record superseding decisions rather than silently dropping scope. Update current status where the feature is listed, not only by appending a later note. Keep implemented, partial/manual, deferred, optional and verification-only work distinct. Use current source as implementation evidence; retain earlier designs as clearly identified history.

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

## Historical implementation decisions — reference only

The notes below preserve earlier decisions and iterations. They are **not the current feature checklist**. The current sections above supersede conflicting details, including QuickHack conversion/outside-combat behavior, three versus four status slots, the Close Combat icon/menu, HUD naming/layout/visibility, message lifetime and where the GM message control lives. They do not authorize removed implementations or deferred work.

### Earlier QuickHack integration decisions

Jack-In and QuickHack combine the native Interface dice and outcome into one chat card with scoped QuickHack header, roll, result, effect and action containers. Result visibility governs the combined card. Private NPC dice remain a separate GM-only message when the result is shared with players. No existing chat messages are migrated.

Jack-In and QuickHack require wall-based line of sight from the attacker center to at least one of nine inset target points. QuickHack requires an active tracked connection. Losing sight blocks actions but never ejects the connection; restored sight permits actions again. Outside combat, Jack-In remains roll/chat-only and QuickHack is blocked because no connection is tracked. No migrations are added.

QuickHack program class stays Booster; the proposed separate Quick Hack class is not being implemented. Program item names use `Quickhack: <name>` for visibility.

Superseding decision: no one-time QuickHack migration or repair code during early development; previous conversion and automatic rename work was removed. New QuickHack content organization is implemented: programs in `CombatTools/Quickhacks`, launcher in `CombatTools`. Legacy cleanup is explicitly deferred until at least v0.8.0; do not remove retained gear backups or old folders before then.

### Resolution card skinning structure — implemented

- User-requested structural containers for pending attack, attack, Evasion, result, damage roll and application, plus recovery.
- Separate label and content elements support optional vertical labels and theme styling.
- Native markup and behavior retained. Selector contract: docs/chat-card-styling.md. Live Foundry verification pending.

### Damage status attachments and critical injuries — 2026-09-19

- Implemented: in-card shield/reduction controls and a native-status popup allowing up to three attached effects. Apply damage also activates those effects on the chosen recipient.
- **Review during the main status-effects work:** this is an initial generic picker. Revisit effect eligibility, durations, stacking, resist checks, conditional application when damage is absorbed, and interaction with native damage undo. No rules for those topics are implied by this first version.
- Implemented: two-or-more-sixes critical injury detection, aimed-head vs body routing, reusable injury dice next to both recipient options, and per-method settings (all initially enabled). Reuses native injury tables/items/effects and duplicate policy.
- Explosion integration awaits that attack workflow. QuickHack retains its reference effects and damage path. Main grenade/rocket AoE/scatter is now implemented; individual ammunition effects remain planned.
- TTRPG aid direction: do not add mandatory next-action prompts, redundant roll-comparison summaries or completion locks. Deliberate repeat selected-token damage and injury actions remain available.
- Supersedes the earlier native damage-confirmation popup for managed cards: options now appear in-card. Native damage summaries/undo remain separate, so the actor/token identity investigation is still relevant.

### Compact application follow-up — implemented

- Supersedes the always-visible damage-options fieldset: normal click uses native defaults; Shift-click opens the native damage-options dialog.
- Native applied-damage results append inside the resolution card as compact horizontal Name / Damage / Location rows. The larger damage number expands its native breakdown and undo control. Additional recipients/repeated selected-token applications append rows.
- No new damage formula; native calculations/template remain authoritative. Original separate native application messages remain for history and unmanaged attacks.

### Status slots and updated-card scrolling — implemented

- Supersedes the three-effect button: four square +/icon slots aligned to the right of recipient damage options. Each slot opens the native-status picker for replacement/removal.
- Updated resolution cards scroll into view, including asynchronous growth; oversized cards show the bottom.
- Main status-effects review remains pending as recorded above.

- Implemented native-ammo gate for managed attacks: prevent flow initiation when the system's hasAmmo check fails; preserve the Click Click warning and native per-mode consumption.

### Damage defaults and three status slots — implemented

- Supersedes four status slots: maximum three, with dark Token-HUD-like icon wells in the card and picker.
- Blood-drop click rolls native default damage; Shift-click opens native roll options. Application bolt Shift-click behavior remains separate and unchanged.

- Card refinement implemented: hide redundant structural labels by default while retaining skin hooks; move paid Evasion cost to its native header; strengthen status-icon contrast against native chat styles.

### Attack-method follow-up (2026-09-19)

- Implemented: Ranged rename, separate Melee Attack sword menu, and free evasion for melee/unarmed/Martial Arts.
- Implemented: optional MA does not ablate armor setting; native half SP retained.
- Supersedes Thrown placeholder: inventory thrown weapons now attack and receive a reusable (used) name marker. Thrown evasion follows ranged/homebrew settings.
- Implemented: Improvised uses native compendium Thrown Weapon, with GM-required 1d6–6d6 choice before damage.
- Grenade inventory ammunition listing implemented; grenade/rocket flow, scatter and AoE are now implemented as described in section 7. Quickhacking is now integrated as described in section 6.

### Item marker subsystem

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

- New HUD notices received while minimized temporarily expand the HUD, select the new notice, scroll once, then minimize again. Reduced-motion users see a static notice for eight seconds. Manual minimization cancels the temporary display; the saved position and minimized preference stay unchanged.

### Native status foundation — implemented

- Supersedes runtime filtering/settings-only hiding: use collapsed Critical Injury Head and Critical Injury Body sections in the native token HUD.
- Master condition list plus custom editor seeded with In Jail; preserve legacy custom definitions and condition IDs.
- Synchronize native injury items and supported existing drug effects with actor/token statuses. Use the same statuses from damage cards.
- Future work: the per-condition behavior inventory (timing, fire, poison, treatments, immunity, derived wound icons and other specialized rules). The foundation does not imply those mechanics are implemented.
- See [status subsystem](docs/status-effects.md) for deletion semantics, native reuse and live-testing limits.

- Implemented: existing Pharmaceuticals and Drugs (including addiction statuses) have separate collapsed token-HUD sections. Section headings now use light HUD text for dark-background readability; missing drug/pharma statuses are not created.

- Implemented: opening the native status picker temporarily hides the Combat Tools controls and their menu. Closing the picker restores them; native HUD controls remain available.

- Close Combat now combines melee weapons, Unarmed, Martial Arts and grappling actions (superseding the disabled placeholder) under the combat-knife button. Supersedes separate melee and fist buttons; Ranged, Thrown and conditional Quickhack remain separate. Attack mechanics and equipment eligibility are unchanged.

- Close Combat now uses the approved two-sparring-figures icon, replacing the combat knife. It inherits the configured CTH icon color and existing button sizing.

- Main CTH icons default to white; the existing icon-color setting supplies all coloration, including the sparring SVG via currentColor. Supersedes the unset theme-color fallback.

### Settings organization — implemented

- Group all visible module settings into Combat & Evasion, Critical Injuries, QuickHack, Token HUD & Targeting, Status HUD & Biomonitor, and Status Effects within Foundry's native settings window.
- Preserve native controls, existing keys/scopes, configuration buttons, permissions and homebrew badges. Empty groups are omitted or hidden by filtering.

- Shared chat-card behavior: implemented; consolidated under the dedicated shared-card section above. This extends the earlier attack-only scrolling implementation.

- Cross-client failure diagnosed live: running Foundry retained v0.1.1 metadata with socket:false while serving v0.2.0 files. Shared socket readiness checks now cover combat responses/damage, grapple, QuickHack connections/effects/Force Out and remote HUD messages. Server restart and client reconnect are required; live end-to-end retesting follows that restart.

- Grenade inventory listing corrected against CPR v0.92.4: ammo items are selected by system.variety = grenade, including smoke, EMP and other ammunition types. Superseded by the main AoE implementation; grenade-specific effects remain deferred.

Implemented: AoE chat-card Show/Hide control for all viewers, shared across clients; auto-hide after responses and damage resolution, with manual confirmation for special ammunition effects. Players can reveal completed areas again. Live multi-client verification remains pending.

Implemented: per-attack square/cone/ray homebrew settings, cone angles and ray widths/ranges; native measured-template placement and highlighted-cell targeting replace the previous polygon-only preview and partial-footprint targeting. RAW suppressive mode and manual overrides remain. Live diagonal-map/multiplayer verification is still pending.

AoE settings UI: compact sections for shotgun shells, grenades/rockets and suppressive fire; shape-specific size/range/angle/width controls, 45°/90° and 1-/3-square quick buttons, live dimension summaries, collapsible attack/evasion rules and a fixed Save footer. Settings remain world-scoped and GM-editable through Combat & Evasion → Area Attacks & Suppressive Fire.

Fixed AoE settings opening: evasion choices now come from form data rather than an unavailable Handlebars hash helper. The real settings template is included in browser rendering regression checks.

Implemented AoE evasion revision: all damaging AoE requires relocation; optional MOVE charging and next-turn shortfall deduction use combatant tracking and a vitals HUD balance. Supersedes the Cover Up placeholder and earlier explosive Cone/Ray and tie/DV settings. Special grenade effects remain deferred.

Critical injury damage types: Quickhacks now default to disabled. Explicitly saved world preferences remain respected; other damage-type defaults are unchanged.

### Hover EKG — implemented

- User-requested EKG below a hovered token: Medtech viewers or GM world **Always show EKG** override only. Reuses Biomonitor state animations without numeric HP; independent of hover DV/weapon requirements. Native token visibility remains authoritative. Browser fixtures cover role/setting gates, HP changes, positioning and cleanup; live Foundry verification remains open. See [Hover EKG](docs/hover-ekg.md).

### Refresh performance

- QuickHack batches its own card eligibility updates instead of rebuilding chat. Ordinary round changes and disabled QuickHack skip combat refresh work. Connection changes and encounter lifecycle update affected cards; settings changes refresh QuickHack cards once.
- QuickHack HUD refreshes are batched and limited to relevant attacker/target fields and walls in the viewed scene. Self CTH is excluded.
- Movement refreshes are batched per token per frame. Unrelated Combat flags are ignored; turn identity changes, including initiative reordering, select affected tokens. Scene lifecycle and visibility/settings changes retain broader refreshes. Unchanged counter and marker displays are retained.
- Hover DV retains unchanged panel/row nodes and caches compendium table promises. Table/result edits, compendium updates and DV compendium setting changes invalidate the cache. World tables retain precedence and stale hover requests remain guarded.
- Validation: typecheck/build, 66 focused unit/regression checks, and movement, QuickHack and self CTH browser fixtures pass. Live multiplayer FPS/CPU measurements remain outstanding.
