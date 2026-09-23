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

### 9. Combat tracker controls — combat bar implemented; other features open

- Hide enemies on the combat tracker: retain the native hidden control and mirror it in the new bar. Follow native tracker visibility, including ownership exceptions. The initial additional hidden-token and line-of-sight filters were removed at user request; unseen tokens stay listed but cannot be pinged or panned to.
- **Combat bar (2026-09-21):** compact 60px floating strip on the left above Players, with a semi-transparent native-color container, 40px square actor artwork, hover names and icon controls; click selects owned tokens, hold pings, Shift-click pans. Outside combat, show connected-player-owned scene tokens to GMs and own visible tokens to players. During active combat, show all permitted combatants in native order, highlight the current turn, provide owner/GM End Turn and GM previous/next controls.
- **Combat bar follow-up (2026-09-21):** owner End Turn appears to the right and is GM-coordinated without player Combat-update permission. GM hover shows native status icons; right-click reuses the native tracker's per-combatant buttons and handler. Double-click opens actor sheets with native OBSERVER permission; movement warnings have a five-second cooldown per reason without weakening movement restrictions.
- GM movement modes: Default, No Movement (also outside combat), Combat Move (only the active token can move), Free-Move. A GM setting selects the initial mode for newly started combats. Modes preserve native ownership and existing grapple restrictions. See [combat bar](docs/combat-bar.md) for persistence and scene scope.
- Automated state/browser verification is separate from live multi-client Foundry verification, which remains pending.
- Other selected Monk’s-style features were originally unspecified and remain open; no additional feature list is inferred.

### 10. Mechanical cyberware disabling — EMP implemented; source-specific integrations deferred

- Disable cyberware effects for Microwaver, EMP and Quickhacks.
- Provide various selection-formula options or manual selection.
- EMP now implements GM/player selection, four random modes, foundational/dependent-option policies, carried electronics and a GM immunity list. Combat-owned records last until combat ends (supersedes printed one-minute timing for this feature). Native item effects are suppressed, item rolls blocked, cyberweapon eligibility filtered, and Reflex Co-Processor evasion qualification respects EMP.
- **Grenade EMP timing decision (2026-09-20):** reuse the existing EMP behavior until combat ends. A round is 3 seconds, so one minute is 20 rounds; the user reports combats very rarely last that long. Separate one-minute expiry is not required for the initial grenade integration. **Backlog investigation:** revisit exact one-minute timing, including unusually long combats and use outside combat, without changing the current combat-end behavior in this step.
- Implant Integrity shows Disabled — EMP. Cyberlimbs use temporary broken-limb icons without injury damage or synthesized limb penalties. Existing disabled effects/injuries survive restoration. Source-specific Microwaver/QuickHack dispatch, custom weighting and random shortlists remain deferred. See [EMP](docs/emp.md).

## Later additions — current status

### Self CTH and Pneuma HomeBrew — implemented

Own-token HUDs show self controls instead of standard combat actions while retaining native token controls. GM target actions remain available when acting as a different selected token. Default-off **Speedware allows Rerolling Initiative** adds a D10 for installed functional Sandevistan/Kerenzikov. Started combat and existing initiative are required. Native CPR rerolls preserve the acting combatant; duplicate pending clicks are ignored. The Action cost is table-managed. Automated unit/browser checks pass; live Foundry verification remains outstanding. See [Self CTH](docs/self-cth.md).


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
- See [Status HUD](docs/cybereye-hud.md) and [HUD API](docs/hud-api.md). The HUD and chat cards are the chosen interface; the separate Current Action window is canceled.

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
- **Canceled:** the Current Action window and its associated proposal are permanently removed from scope; use the HUD and chat cards.
- **Live verification:** multi-client Foundry checks remain open for native roll/card integration, owner/GM handoffs, linked/unlinked token identity, status application and encounter lifecycles. The last implementation suite passed 126 automated tests; this roadmap review changed documentation only and did not rerun gameplay tests.

## Roadmap maintenance

Preserve the original requests and record superseding decisions rather than silently dropping scope. Update current status where the feature is listed, not only by appending a later note. Keep implemented, partial/manual, deferred, optional and verification-only work distinct. Use current source as implementation evidence; retain earlier designs as clearly identified history.

## Current Action window — canceled

Permanently canceled by user decision on 2026-09-21. The HUD and chat cards are the chosen interface for combat information and resolution. The separate window, its history view, and its proposed concurrency/turn checkpoints are removed from planned scope, not deferred. The detailed proposal has been removed; do not reintroduce it as a future feature.

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

- Implemented first cybereye status HUD: selected-actor condition display, pending attack notices, movable/collapsible panel, client visibility and safe interactive preview. This implements the focused condition/alert overlay. The earlier broader Current Action window was subsequently canceled. Full condition synchronization and automation remain planned.

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

- User-requested EKG below a hovered token: Medtech viewers, any viewer hovering a target with an installed Biomonitor, or GM world **Always show EKG** override. Reuses Biomonitor state animations without numeric HP; independent of hover DV/weapon requirements. Native token visibility remains authoritative. Browser fixtures cover role/setting gates, HP changes, positioning and cleanup; live Foundry verification remains open. See [Hover EKG](docs/hover-ekg.md).

### Refresh performance

- QuickHack batches its own card eligibility updates instead of rebuilding chat. Ordinary round changes and disabled QuickHack skip combat refresh work. Connection changes and encounter lifecycle update affected cards; settings changes refresh QuickHack cards once.
- QuickHack HUD refreshes are batched and limited to relevant attacker/target fields and walls in the viewed scene. Self CTH is excluded.
- Movement refreshes are batched per token per frame. Unrelated Combat flags are ignored; turn identity changes, including initiative reordering, select affected tokens. Scene lifecycle and visibility/settings changes retain broader refreshes. Unchanged counter and marker displays are retained.
- Hover DV retains unchanged panel/row nodes and caches compendium table promises. Table/result edits, compendium updates and DV compendium setting changes invalidate the cache. World tables retain precedence and stale hover requests remain guarded.
- Validation: typecheck/build, 66 focused unit/regression checks, and movement, QuickHack and self CTH browser fixtures pass. Live multiplayer FPS/CPU measurements remain outstanding.

Thrown-weapon HUD layout: item icon/name remain together on the first row, with Used and other markers underneath. Inventory grenades appear directly in the main thrown list without a collapsible category.

Movement Reset now hides that token's counter, controls and start marker after successfully restoring its position. The hidden state is synchronized on the token and clears on its next movement. Failed resets retain the display.

Thrown names now use the full list width: removed a later shared grid override that reserved three empty action columns on thrown rows.

AoE damage controls match ordinary damage: blood drop rolls shared damage; lightning bolt applies it to a recipient. Native attack-card rollDamage controls are removed inside AoE cards, including older rendered cards, to keep damage within the shared workflow.

Attack-area visibility controls are now GM-only, superseding earlier all-viewer access. Player controls are hidden and the GM request handler rejects player show/hide requests. Automatic completion hiding remains unchanged.

AoE cards use roll-only shared damage rendering: the bottom retains `data-pneuma-section="damage-roll"` and native dice/breakdown, but omits the shared `damage-apply` section and empty recovery slot. Per-target lightning controls remain inline; applied results appear below the shared damage roll. Ordinary single-target cards retain their application section. Older AoE cards lose the redundant bottom section when rendered.

Speedware initiative eligibility accepts installed cyberware with Sandevistan or Kerenzikov anywhere in its name, case-insensitively. Native source identity and existing EMP, world-setting and combat checks remain supported.

Self CTH uses the normal CTH button column beside the native token HUD, with no separate panel, heading or explanatory text. Installed speedware marked Disabled, or disabled by EMP, cannot qualify. The generic EMP token-HUD button has been removed; EMP state and its existing programmatic workflow remain.

Self CTH always includes a bell icon labelled Toggle Alert HUD, which toggles the current client Status HUD setting even when disabled in Settings. Re-roll Initiative uses a D10 icon; it remains a native initiative reroll. The speedware world setting carries the Pneuma Homebrew badge and retains its existing stored key/preferences.

Self controls are direct `.control-icon` children of `.pneuma-combat-column`, sharing native button styling, HUD sizing/spacing and the configured CTH icon color. The bell is always present; the D10 appears only when eligible. This supersedes the separate Self panel.

AoE applied-damage summaries now collect in `.pneuma-damage-applications.pneuma-aoe-applications` directly after `.pneuma-damage-result`. They retain the normal damage result markup, expandable breakdown and undo controls. No empty application box is added; lightning buttons remain beside each target. This supersedes placing summaries between target rows.


AoE attack dice animation: new area attacks retain their native attack dice and release them through CPR Dice So Nice handling after scatter placement and every waiting/rolling response resolves. The saved roll mode is retained. A persisted reveal flag prevents later damage, movement, visibility updates or chat rerenders from repeating the animation; legacy cards do not replay. Card attack visibility uses the same response condition. Automated fixture verification only.


AoE configuration layout: collapsible attack profiles show their current shape/dimensions in the heading; shotgun shells open initially. Shape-dependent fields use two columns. Evasion and Cover Up remain a separate collapsed section, with a fixed Save footer. All settings and stored values are retained. Supersedes the always-expanded profile layout.


### Core ammunition and reusable Instant Effects — implemented 2026-09-20; live verification pending

Supersedes earlier grenade-specific-effects and persistent-smoke deferrals; original entries above are retained as history. Grenades support Armor-Piercing, Biotoxin, EMP, Flashbang, Incendiary, Poison, Sleep, Smoke and Teargas. Rockets support Armor-Piercing and Smart. Shared instant resolutions are also available through Add effects. Target rows and placement areas use ammunition colors. Persistent smoke saves the actual affected cells and renders semi-transparent animated clouds.

EMP retains the approved until-combat-ends behavior. The exact-one-minute/long-combat/out-of-combat timing investigation above remains open. Also pending: smoke-based attack penalties and conditional visibility/cyberware interactions, automated biological immunity inference, terrain/cover durability, action-cost enforcement and live multiplayer/vision verification. Normal weapon ammunition automation is not intercepted. See [Instant effects](docs/instant-effects.md).


### Residual smoke visibility — reported live issue, open

User reports no residual smoke after a smoke grenade. The server-served smoke.js matches the current build. Automated PIXI rendering passes but does not reproduce the live Foundry failure. Investigate effect creation, saved footprint, native scene render lifecycle, and visibility before marking this fixed. Included as a known issue in 0.4.0.


## HUD layout revision — implemented, pending live verification

Supersedes the earlier implant-gated own HUD, mixed pathology list, top alert ticker, message navigation and temporary auto-expansion. The current compact three-column appearance is retained.

- Everyone can view their own HUD. Hovering a visible token with an installed Biomonitor switches the stats to that actor, marked BIOMONITOR LINK; leaving restores the viewer. No additional actor-sheet permissions are granted.
- Biological Scan contains injuries and medical conditions. Persistent native drugs/pharma illuminate icon-only indicators beneath EKG (red/green) with tooltips. Instant treatments are excluded. Large exposure indicators retain text below and add Addict, Unconscious and an actual active QuickHack Jack-In connection.
- Headerless yellow situational rectangles sit INSIDE the HUD at the lower-right, extending left. Grapple/choke and movement information use those same rectangles. Implant Integrity retains disabled cyberware.
- Up to three private notifications appear outside the HUD, always identified with the viewer. Each clears independently; ordinary messages expire (legacy duration zero becomes 60 seconds). Incoming attack notices remain until resolved or dismissed. New text pulses briefly, without scrolling or expanding a minimized HUD.
- TypeScript/build and focused browser/state verification are required. User replicates built dist files; no server deployment or release is implied.


### HUD active-drug indicator correction — implemented

- Health-state label restored immediately beneath EKG, before drug indicators.
- Supersedes the always-visible drug dashboard: only active unsuppressed drug/pharma effects appear; icons pack from the left and an empty row disappears. Names remain tooltips, with no letters.
- Added Berserker, Prime Time, Sixgun, Timewarp, Sedative and Veritas icons and native primary/addicted-primary aliases; Antibiotic singular maps to the existing Antibiotics entry. All nine core/Hornet street drugs and five lasting pharmaceuticals are covered, plus the existing temporary Quick Fix treatment. Instant treatments stay excluded.
- Native no-status-ID effects are recognized; addiction-only effects activate Addict without falsely showing an active dose. CPR v0.92.4 data and Hornet's Pharmacy are the reference. No additional drug mechanics or automatic expiry system is introduced.
- Browser tests passed for all 15 prepared indicators, primary-effect aliases, addiction isolation, suppression, empty-row hiding, label order and leftmost packing. User replication/live verification remains separate.


### Floating statuses and notification text — implemented

- Yellow statuses now use absolute positioning inside the lower-right HUD corner and do not add width/height. This supersedes the earlier in-flow status dock.
- Removed the visible notification-owner heading; recipient identity remains accessible and notifications remain private. All message text is now 24px orange, including ordinary GM messages, with individual clear controls.
- Browser regression verifies identical HUD dimensions with zero versus multiple statuses and the message heading/font/color. Live replication is user-managed.


### HUD top-row removal — implemented

- Expanded HUD no longer has a title/header row. Minimize sits inline with Implant Integrity; GM Send HUD Message remains available as the adjacent envelope button.
- GM character identity appears outside below the HUD, aligned left. Shared-view identity also appears there for players; own player views omit it. Background/label dragging and minimized controls remain available. Preview controls move outside the HUD.
- Supersedes earlier top identity/header descriptions; no deployment or release performed.

- HUD identity alignment correction: the below-HUD name follows the actual monitor width and left edge through minimize/expand and dragging; notification width remains independent. Browser regression covers collapsed and expanded identity alignment.


### Incoming HUD message animation — implemented

New private notification text appears large in orange at screen center, holds briefly, then shrinks into its existing slot below the HUD over 1.6 seconds. Concurrent arrivals are stacked. Existing messages do not replay when HUD contents refresh. The client setting **Animate incoming HUD messages** defaults on; disabling it shows messages immediately and stops active arrivals. Reduced-motion preferences also skip the animation. This supersedes the previous arrival blink; privacy, expiry and clear controls are retained.


### HUD pinned to Foundry sidebar — implemented

The HUD sits 8px below the viewport top and 8px left of the native right sidebar, including its collapsed state. Sidebar resize observation follows native width animation; sidebar render/collapse hooks and viewport resize keep the anchor current. HUD and private notification widths fit the available space. Manual drag routines and saved positions remain in source/storage, but are inactive while docking is enabled. This supersedes draggable positioning for now.


### Scan-line notification arrival — implemented

Supersedes the smooth zoom/flight: a glowing orange horizontal scan reveals the large centered message, holds it, collapses it to a bright horizontal line, then reveals normal-size text beneath the HUD. The 1.8-second sequence relocates only while invisible. Existing per-client animation toggle, reduced-motion bypass, private recipient filtering and pinned docking remain unchanged.


### Effect activation scan — implemented

Newly activated drug/pharma and exposure symbols scan in large at screen center, blink three times, then illuminate their dashboard slot after 2.4 seconds. Colors match the corresponding indicator. Concurrent symbols share the central overlay. Refreshes and switching actors do not replay existing conditions; removal cancels an unfinished announcement. Minimized HUDs still announce newly detected effects. The existing client toggle is now named **Animate HUD messages and effect icons** and retains its saved value. Disabled/reduced-motion mode lights indicators immediately.


### Drug labels and round exposure clearing — implemented

Drug/pharma tooltips and accessible labels show only the name, without the Active suffix. During combat, Poison and Biotoxin Vitals reports remain lit after their arrival animation until the round changes, then clear. Existing actor status effects are not deleted; a fresh exposure or reactivation can light the report again. Other indicators and noncombat flash behavior are unchanged.


### Native effects, warnings and combat durations — implemented

- Native fire statuses now drive end-turn damage regardless of application source; strongest active level wins, without stacking.
- Temporary injuries and Sleep use native durations: one minute means 20 rounds at 3 seconds each, with start round/turn and combat recorded. Smoke uses the same clock. Old instantLifetime records are adopted on load where their native source is available.
- Combat end clears timed effects, including manual effects, on participants or explicitly linked to the combat; critical injuries are preserved. EMP remains until-combat-end.
- Confirmed instant/native poison and biotoxin applications now emit exposure warnings. Original ammunition context survives native dialogs and Combat Tools damage cards. Native incendiary damage applies the shared fire status only after penetration.
- See docs/native-effects.md for source metadata, permanent-condition protections, expiry rules and coverage limitations.


### Complete status mechanics audit — 2026-09-21

Audited all 65 catalog statuses and six additional prepared drug/pharma icons against official CPR v0.92.4 YAML/runtime source. See docs/status-mechanics-audit.md. Confirmed outstanding work: prose-only drug durations (native duration fields are null), injury movement triggers, Cracked Skull multiplier, Dismembered Leg dodge prohibition, Spinal Injury action loss, limb usability, contextual sense/hand/speech modifiers and drug-specific automation. Previous native-duration integration does not cover drugs whose source declares no numeric duration. No mechanics changed in this audit; these remain open.


### Status audit follow-up: leg evasion and Broken Ribs - implemented

Supersedes the Dismembered Leg dodge and Broken Ribs movement-trigger gaps in the 2026-09-21 audit above. Native injury/marker and disabled installed Cyberleg checks now prohibit Evasion across Combat Tools and native skill rolls. Broken Ribs now uses committed movement over 4m/yd to offer a private owner/GM warning with manual 5 direct-HP damage. User explicitly requested no automatic damage. Other audit findings remain open, including Foreign Object triggers and the minimum MOVE 1 caveat.

- **Combat bar personal layout (2026-09-21, implemented):** client-local 32/40/48 px actor portraits, minimize/restore, vertical/horizontal switch for all users, orientation-aware turn buttons and scrolling. Automated browser coverage; live Foundry validation pending.

- **Combat bar native navigation (2026-09-21):** hold-to-ping and Shift-click pan delegate to native tracker handlers; removed redundant right-click visibility gates. Native combatant list visibility remains independent of token sight.

- **Movement origin outline (2026-09-21, fixed):** anchor to saved scene coordinates on the native token layer rather than the moving token, eliminating animation-frame drift. Preserve visibility, reset and cleanup; automated animation/preview and pan/zoom checks.

- **Minimized GM combat bar (2026-09-21):** retain movement-mode controls in both orientations; hide portraits and turn controls, and preserve the outside-combat Combat Move restriction.

- **Combat bar tooltip preference (2026-09-21):** per-client Show name only setting, default off, hides portrait click instructions.

- **GM navigation exception (2026-09-21):** GM bar gestures and context-menu ping/pan ignore token visibility; players retain native visibility checks.

- **Combat bar GM pull ping (2026-09-21):** Shift-long-click uses native pull ping; ordinary Shift-click remains local, and players cannot pull others.

- **Review fixes (2026-09-21):** movement records follow the scene-active encounter, not sidebar previews. Combat bar turn changes reveal the active portrait and End Turn in both orientations.

## Tester feedback implementation (unreleased)

- Removed the general initiative controls from CTH; encounter initiative actions are on the combat bar round flyout. Self-CTH retains its conditional speedware reroll.
- Added self-HUD thrown weapons/grenades. Grenades use ground placement without enemy targeting; single-target throws require one other target.
- Added 64/80/96 px combat-bar portrait choices. Top docking with an autohide tab is available; bottom preferences are preserved.
- Added opt-in automatic NPC evasion, gated by RAW eligibility. AoE additionally rejects penalties, movement cost/borrowing and Cover Up. GM still places successful AoE evaders.
- Connected Impair Movement/Slow to timed MOVE effects, Sonic Shock to temporary native Damaged Ear and Deafened, Overheat to Strong fire, and System Reset to timed sleep/wake-on-damage plus Prone. Existing Synapse Burnout damage control remains.
- Detected active incoming Jack-In appears in situational HUD statuses, with identity disclosure governed by existing routing. New player detection uses the existing dramatic HUD animation and respects animation/accessibility settings. Later silent/failed hacks retain detected awareness for that connection.
- Manual Quickhack handling remains: Lure, Puppet, Shard Ejection. Short Circuit and Cyberware Malfunction now use shared timed disablement. Identical movement hacks refresh duration and retain the strongest amount rather than stack; distinct hacks remain separate native effects.
- Incendiary behavior is unchanged. Interrupted damage, duplicate dice and AoE cleanup changes are outside this implementation batch.
- Verification: automated coverage and build are recorded in the task result; live Foundry/multiplayer verification is outstanding.

## Shared disablement and top combat bar (unreleased)

- Connected Short Circuit (GM chooses up to three), Cyberware Malfunction (attacking player chooses one plus installed options), and Microwaver (DV15 Cybertech, GM chooses two). Timed sources last 60 seconds / 20 rounds; EMP grenades retain combat-end duration.
- Native item effects/rolls and Combat Tools eligibility respect independent causes. Temporary cyberleg penalties restore without physical injury items or enabling previously disabled effects. Hand assignments/descriptive abilities remain adjudicated.
- Added per-client **Combat bar placement: Top (autohide tab)**: horizontal, initially collapsed, hover/focus reveal, click-to-pin, Escape/minimize collapse, open-menu protection, downward controls. Bottom preferences are retained.
- Supersedes earlier source-dispatch and top-placement deferrals. Arbitrary third-party/native attack interception, combination-weapon modes and out-of-combat selection creation remain outside this integration.
- Automated build/workflow/browser validation is recorded in the task result. Live Foundry/multiplayer remains unverified; no deployment or release performed.

- Movement controls now anchor to the lower-left of the screen above Players, independently of combat-bar placement, size and minimization. This supersedes the earlier lower-right-of-bar placement.

## Combat bar layout correction (unreleased)

Supersedes earlier top-placement and detached movement-control descriptions. Top placement, autohide tab and placement setting are removed. All four movement buttons stay at the bottom-left corner inside one shared translucent bar above Players. Portraits extend upward (vertical) or rightward (horizontal); round counter/arrows remain at the top or far right respectively. Movement anchoring survives all portrait sizes and minimization. Build and browser geometry/visual checks passed; live Foundry verification remains outstanding.

## Players control: minimized mode (unreleased)

Click the native Players heading to cycle **Online → All → Minimized → Online**. Minimized hides every player row and retains the heading as the restore button. The small mode label and tooltip describe the current/next state. Enter and Space also operate the heading.

The state is saved per client and survives rerenders, user connections and application recreation. Native online/all filtering, row permissions and context menus remain in use. Native AV hiding behavior remains authoritative. The combat bar follows the Players panel height through its existing resize observer. Browser checks cover the cycle, filtering, keyboard restore, persistence, joins and compact height; live Foundry verification remains outstanding.

Vertical combat-bar turn controls now place Previous and Next side by side above the round counter. This supersedes earlier stacked-arrow descriptions; horizontal controls remain stacked at the far right.

Previous/Next turn arrows point left/right in both orientations; vertical layout keeps the two buttons side by side above the round counter.

## Combat Bar settings shortcut (unreleased)

The former one-click orientation toggle is now a gear button opening a compact **Combat Bar** settings window. It is available while expanded or minimized. The window reuses Foundry v12 SettingsConfig's prepared rows and native settings-category template, in the same order as the Module Settings Combat Bar group: visibility, portrait size, layout, name-only tooltips, and initial movement mode.

Labels, hints, choices and current values come from the registered settings. Native SETTINGS_MODIFY permission filters world settings, and permissions/choices are rechecked when saving. Each change saves immediately through game.settings.set and invokes its existing callback; **Done** closes the window. Reopening reads current settings. If visibility is turned off, the window remains available to restore it; Module Settings is also always available.

Build and targeted automated/browser verification are recorded in the task result; live Foundry verification remains outstanding.

## EMP Effect behavior settings (unreleased)

Added a GM-only **EMP Effect behavior > Configure** submenu under Combat & Evasion. Separate GM/player profiles default to RAW/manual selection. Both offer Fashionware-excluding equal, foundational 2×, foundational ½× and no-foundational draws. Each random profile has an **Avoid overlapping host/option picks** checkbox.

Player selection also supports a saved random shortlist of up to 2×X candidates, from which the entitled player picks X (or all remaining eligible candidates if fewer). The shortlist draw can use any of the four random methods. Candidate IDs and behavior are saved before publishing the selection card; reopening or changing settings does not redraw. The player-facing picker omits unoffered parent names and its result lists chosen components without disclosing additional cascaded items. GM results retain the full affected list.

Existing source counts, chooser ownership, protected components, duration and restoration remain authoritative: EMP normally chooses two, Short Circuit three, Cyberware Malfunction one. Manual methods retain eligible Fashionware. The existing EMP immunity setting moved into this submenu without changing its saved key. Automated and browser validation is recorded in the task result; live multi-client Foundry verification remains outstanding.

- Implemented: EMP Effect behavior includes **Exclude BioWare (Pneuma Homebrew)**, off by default. Excludes Grafted Muscle and Bone Lace and Enhanced Antibodies from direct selection for all GM/player methods, including manual and shortlists. Recognizes native source identities after renaming. New requests snapshot this option; existing requests retain their policy.

- Implemented: optional Internal Frame disablement consequences: prevent player movement (GM repositioning allowed), and a configurable native all-actions penalty. Both default off; overlapping penalties use the strongest value and expire with disablement. EMP/Microwaver hardened-item policy defaults to exclusion, or can consume an unaffected selection without reroll. Uses native self/child/sibling shielding; Quickhacks bypass EMP hardening. New requests snapshot these settings.

- Revised EMP settings: GM chooses 2 / Random; player sees all and picks / saved 2xX shortlist / Random. Shared positive eligibility checkboxes for Fashionware, BioWare (Pneuma Homebrew), and Foundational, with Standard/2x/half foundational weight. Eligibility applies to manual and random selection; weighting also applies to shortlists. Existing source protections remain. Legacy per-side random methods migrate to shared options, preferring GM random settings when the two sides conflict. Existing pending requests retain their saved policy.

- Internal Frame disablement: optional MOVE reduced by checkbox and numeric amount (off by default). Uses a native MOVE modifier with zero floor; Cannot move takes precedence. Overlapping frame reductions use the strongest active value and restore when their disablements expire. New requests snapshot the option.

- Removed the Combat resolution toggle: combat chat-card flows are core module behavior and always active for Combat Tools attacks. Removed the ordinary HUD attack fallback to native-only cards. Previously saved false values no longer affect routing; other feature settings remain independent.

- Grapple follow-up controls now live in Self-CTH Close Combat: grappler Choke/Throw/Release, defender Escape with grappler name. Established grapple actions wait until the grappler's next turn (not the establishment round), checked by the GM as well as the HUD. Original opposed-roll card remains intact; subsequent actions post separate results. Chat retains initial response/hold choices and GM recovery controls. Result cards retain original whisper/blind recipients.

- Connected Foreign Object (Body/Head) to Broken Ribs movement damage: distinct injury-labeled cards and once-per-turn receipts, retaining brokenRibs storage and data-ribs-apply control. Private owner/GM delivery and manual Apply 5 damage remain. Full coverage/gaps: docs/body-head-injury-coverage.md.

- Implemented injury automation without action-economy enforcement: Cracked Skull x3 penetrating aimed-headshot damage in Combat Tools applications (native bonus/reduction/nonlethal/undo data preserved); MOVE floor 1 for Collapsed Lung/Broken Leg/Dismembered Leg, respecting active MOVE=0 overrides. New injury HUD warnings, persistent medical guidance, Perception/speech skill reminders, advisory next-turn ear/spinal notices, and optional turn-end unpaid movement-damage reminder. No actions spent or movement/action restrictions enforced by these notices. Existing native injury modifiers remain authoritative.

## Optional Crew Tools / Biomon HUD integration
Crew Tools exposes a client-only `api.hudShortcuts` v1 content-slot registration API with availability subscriptions. Combat Tools offers opt-in per-user integration when Crew Tools is active: its minimized alert button uses that slot, with original status colors and a standalone fallback when hidden/unavailable. Expanded Biomon can dock top right or top left below navigation and beside canvas controls. Defaults are unchanged. Automated checks do not replace live Foundry testing.

## HUD Alert Delivery API
API v2 adds opt-in `mode: "flash"` (four-second dramatic-only notice) and `mode: "queued"` (dramatic arrival plus player-dismissible queue, no expiry). Legacy calls keep timed behavior. Queued alerts are not evicted by later alerts; reload clears session state. Animation preferences and recipient permissions remain respected.

## GM-enforced player HUD animations
The GM-only world setting "Force animated HUD messages for players" hides the player animation preference and overrides it while enabled, including flash-only API alerts and effect arrivals. GMs retain their personal preference; saved player preferences return when enforcement is disabled. Device reduced-motion preferences remain respected.

### Crew HUD shortcut correction
Enabling integration now immediately adds a persistent Combat Tools Biomon button below the Crew icon, without widening the calendar. It opens/minimizes Biomon and retains health/alert colors while expanded, minimized, or disabled. Hidden/unavailable Crew HUD still uses the standalone fallback.

### Integrated EKG placement
Integrated minimized Biomon retains EKG and actor name at its selected dock without a bell. Top-left minimized and expanded views anchor 8px below and right of the Crew HUD bounds, supplied through its public shortcut API. Queued messages follow below, left-aligned with the clear X first. Standalone behavior is unchanged.

Integrated Biomon messages use up to 600px of available screen width independently of the minimized EKG; actor name remains aligned to the EKG.

Biomon position is available to every user without Crew Tools. Standalone top-left docks expanded and minimized HUDs at the window corner, retaining the bell; integrated top-left retains the Crew HUD-relative anchor.

Top-left placement correction: integration only changes the shortcut, not HUD positioning. Both modes use visible Crew HUD bounds, falling back to map navigation/canvas-control bounds when absent. Supersedes standalone window-corner placement.

Biomon toggle icon: approved solid 25px broken heart with a 15px foreground bell, thin transparent crack and separation. Used in standalone and Crew HUD buttons, inheriting existing status colors.

Biomon icon spacing refinement complete: smaller 26px footprint and slightly smaller foreground bell; click targets unchanged.

Biomonitor maintenance: removed disabled manual-drag implementation (legacy setting retained), shared validated HP reading and message alignment decisions, reused one condition snapshot per redraw, and removed empty flash containers on dismissal/expiry. No intended layout or rule changes.

Movement display size refinement complete: smaller counter, larger Reset/Run controls.

Combat Bar settings: opening uses Foundry render focus handling, avoiding getComputedStyle errors from focusing a window before its DOM exists.

Horizontal combat bar clears the visible macro hotbar when their horizontal spans overlap, including collapsed Players and hotbar resizing. Vertical placement stays unchanged.

## Chat dice menu (approved, implemented locally; live verification pending)

Damage with existing Add Effect slots; Body/Head critical injury; native base d10 with Critical Success/Critical Failure; GM-created group skill checks with player selection, optional/hidden DV and inline results. Added Interact with armor (on by default) for ad-hoc damage and Half Armor SP across native/module damage cards. Opposed checks deferred; explosive roll type excluded. Native skill dialog retained for each requested check.

- Implemented: player-accessible STAT roll at any time (1d10 strictly under current STAT; no Critical Success/Critical Failure). Selected owned token or assigned character; no combat/GM dependency.

- Implemented group-check presentation revision: colored outcomes and clickable totals with expanded modifiers; separate Roll details summary removed.

- Implemented approved roll-menu UI revision: anchored flyout and clean native form layouts; damage dropdown 1d6–8d6. No result-card redesign.

- Group-check disclosure correction: every rendered row starts with its full roll hidden. Clicking the row total reveals both the native roll and expanded `.d10-data-details` modifier breakdown; clicking again hides the entire detail block. Visibility is initialized on the rendered DOM so saved HTML or theme display rules cannot leave the roll open by default.

- Group checks now use native `.rollcard-top`, `.rollcard-bottom` and `.cpr-block` styling. `.pneuma-group-heading` places the skill and `.pneuma-group-dv` on one line; replaces the standalone h3/paragraph header. Existing cards receive the updated header on render. Hidden-DV visibility, result colors and collapsed roll details remain unchanged.

- Implemented shared chat-only button styling across attack/evasion, damage, AoE, grapple, Quickhack, EMP, instant effects, injuries and manual/group checks. Half Armor has a checked-box + solid selected fill; actions share sizing, icon treatments, focus, busy and disabled/completed states. Recovery/cancel controls have amber/red borders. Skin tokens and stable-geometry rules are documented in [chat-buttons.md](docs/chat-buttons.md). Existing action selectors and handlers are retained. Supersedes previous per-flow button sizing and faint Half Armor selection styling.

- Cyberpunk roll dialog includes Custom Roll below the standard roll, with aligned count × sides controls rendered as x d y (1–20 dice; 1–100 sides). Separate Roll Cyberpunk / Roll Custom actions. Custom rolls use Foundry dice/rendering and current roll visibility, without the Cyberpunk base/modifier or Critical Success/Failure rules. `.pneuma-custom-dice` styles inputs; `.pneuma-custom-roll-card` retains native generic dice markup.

- Superseding Cyberpunk dialog layout: shared Label and Modifier, Standard Cyberpunk 1D10 / Custom radio choices, and one Roll button. Standard is selected initially; Custom unlocks the 1–20 dice / 1–100 sides inputs. Both modes use the label and modifier. Only Standard uses Critical Success/Failure. `.pneuma-roll-modes` and `.pneuma-custom-roll:disabled` style the choices and locked fields. Replaces the previous two-button layout.

- Damage cards now pair `.pneuma-interact-armor` (default on) to the left of `.pneuma-half-armor` in `.pneuma-armor-controls`. Turning interaction off bypasses SP and armor ablation and disables Half Armor; turning it on restores the original armor calculation. The world setting **Show armor controls on normal damage cards** defaults off; enabling it shows both controls on normal/native/AoE cards. Chat-menu manual damage always shows both. The pair uses a compact two-column grid so controls stay side by side. Manual damage preserves its initial dialog armor choice and allows changing it on the card. Controls use shared toggle skin tokens; shields and native damage options are unchanged.

- Native attack dialogs containing Combat Tools unaware/improvised fields now recalculate height within the viewport, scroll form content separately from the Confirm/Cancel footer, and give Additional Mods a visible input and comma-separated hint. Native inputs, modifier handling and listeners are preserved.

- Implemented: detected incoming Jack-In is a persistent Neural Intrusion biomonitor icon. Right-click On Fire to extinguish; right-click Neural Intrusion to select a detected netrunner and invoke the existing ejection flow. Optional per-user screen interference lasts 240ms every 20–40 seconds, only for the focused owned actor, respecting reduced motion and HUD animation preference. Initial detection notices are retained.

- Status icon right-click actions now use a compact body-mounted floating panel with shared CTH surface tokens; no HUD layout changes. Duplicate unnamed netrunner choices are numbered. Dismisses on outside click, Escape, scrolling, resize or removal of the source icon.

- Combat bar: bottom-left vertical height ends below the lowest main canvas-tool button, with a scrolling combatant list and canvas-tool stacking priority. A new per-user Top right dock anchors movement controls at top right; portraits extend left horizontally or down vertically, and round controls stay at the opposite end. Top right temporarily forces BiomonHUD left without changing its saved preference. Both settings screens explain the override.

- Top-right correction: End Turn uses viewport-clamped positioning outside HUD clipping and checks portrait visibility only along the scrolling axis. Horizontal flyouts sit 4px below the bar, reserving extra room only when sharing the active portrait with a visible End Turn button.

- Performance cleanup: native Quickhack rolls validate at start, after dialogs/confirmation and after roll rendering rather than at every intermediate await; ownership, range, wall sight, connection and hack-availability checks remain. Combat connections now persist detection, identity-reveal evidence and response audience. HUD/ejection reads no longer search chat, and deleting a card does not remove a detected link. No chat-history awareness migration or compatibility reconstruction is performed.
- Instant-effect expiration runs for the departing actor at turn end and all encounter participants at round rollover, with world-time expiration retained for actors outside started combats. Unrelated combat updates do not trigger expiration. Status synchronization ignores unrelated effects/cosmetic updates, combines passive refreshes, and preserves explicit operations and failure recovery. Status action menus close through HUD lifecycle cleanup instead of a page-wide observer. Item-marker and grapple hooks inspect changed flag paths directly, including nested/dotted/deletion forms.

- Ad-hoc damage uses the same `renderDamage` application-row renderer as normal combat damage: `.pneuma-damage-application-box > .pneuma-damage-controls` contains the bolt + “to selected target” recipient on the left and three `.pneuma-damage-status-slot` controls on the right. Ad-hoc cards omit the recorded-target row and retain creator/GM effect-edit permissions, shared Shift-click armor/application options, and their existing critical-injury/recovery actions. The separate manual application/effect-slot builder is removed.

- Both normal and ad-hoc damage cards persist selected-target applications in `damage.selectedTargets` and rebuild an “Applied to” list (`.pneuma-damage-target-history`) from that state on every render. Each successful selected-target application adds one named entry; repeated deliberate applications remain separate. Names are HTML-escaped. Native numeric receipts remain expandable below the list. Message writes use state snapshots to avoid sharing mutable in-flight damage state with document updates.

- Add Effects picker: collapsible Instant Effects, Body Crits, Head Crits, Drugs, Pharma and Misc sections, omitting empty categories, addiction entries, and Lightly/Seriously/Mortally Wounded statuses. Instant Effects opens initially; editing a slot opens its current category. Native details/summary controls support keyboard navigation; duplicate choices remain disabled and None clears a slot. Custom configured statuses fall back to Misc. Picker scope: `.pneuma-damage-status-picker .pneuma-effect-category`.

- Implemented settings cleanup: four combat bar placement radio choices shared by Module Settings and its compact editor, retaining saved dock/orientation values. Related attack cards, evasion/area, movement/initiative, injuries/effects, QuickHack, combat bar, token HUD and Biomonitor settings are grouped and ordered together.

- Settings polish implemented: flexible labels, compact inline Homebrew button, Allow Cover Up Homebrew label, labeled custom-status rows, and QuickHack message groups by source/target and action. Removed Test status HUD and all production demo rendering/controls; live HUD remains.

- Neural Intrusion visual tuning: amplified to six prominent bands for 1.8 seconds, first after 1 second then after 6–10 second pauses, for user evaluation before toning down.
