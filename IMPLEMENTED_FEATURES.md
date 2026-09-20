# Implemented features

## Area attacks and suppressive fire

Main flow implemented: native ammo detection/consumption, scene-scaled placement, wall clipping, individual responses, GM scatter, shared native damage and per-target manual application. Cover Up is a disabled placeholder with the Pneuma Homebrew badge. Special grenade effects, cover HP and automatic movement enforcement remain manual/deferred. See [Area attacks](docs/area-attacks.md).

- **CTH menu presentation and Jack In/Out:** grenade and QuickHack rows display item artwork and align left. Grenade rows require positive inventory quantity; depleted stacks are hidden. QuickHacks prefer actor item artwork, then world item artwork, then the bundled icon. Menu headers inherit the corresponding CTH control's current colors. The QuickHack header reads **Jacked-In**, **Not Jacked-In**, or **Ejected**. **Jack In/Out** voluntarily disconnects an active link without a roll, even after losing line of sight. The existing GM coordinator validates ownership and connection identity. Voluntary disconnection permits fresh Jack-In; forced ejection still blocks reconnection for that encounter. Old awareness cards cannot operate on a disconnected or replacement connection. Grenade placement/responses/shared basic damage now use the AoE flow; grenade-specific effects remain deferred.

- **Detected Netrunner ejection from CTH:** an owned token with detected active incoming connections shows the QuickHack icon, with one **Eject NetRunner** row per connection. Uses the existing native Concentration versus Interface Force Out workflow; ties retain the connection. Ejection resolves in one card containing the native Concentration roll, player Netrunner Interface roll, totals and outcome, with shared winner/loser styling. NPC resistance retains its automatic Interface total. The card uses the awareness message's audience. Both the CTH row (including a single connection) and ejection card show the Netrunner name when the current identity setting for a detected Jack-In or later QuickHack permits it; otherwise they show Unknown Netrunner. Existing chat cards are not rewritten. No Netrunner role or launcher is required for ejection. Awareness uses retained Jack-In/QuickHack result cards for the current encounter; deleting those cards removes the associated shortcut. Undetected, ejected, other-encounter and untracked connections are excluded.

Jack-In and QuickHack combine the native Interface dice and outcome into one chat card with scoped QuickHack header, roll, result, effect and action containers. Result visibility governs the combined card. Private NPC dice remain a separate GM-only message when the result is shared with players. No existing chat messages are migrated.

Jack-In and QuickHack require wall-based line of sight from the attacker center to at least one of nine inset target points. QuickHack requires an active tracked connection. Losing sight blocks actions but never ejects the connection; restored sight permits actions again. Outside combat, Jack-In remains roll/chat-only and QuickHack is blocked because no connection is tracked. No migrations are added.

QuickHack program items use `Quickhack: <name>` in world and actor inventories, when newly created. The Booster class is unchanged.

QuickHack content: eleven native program items live in `CombatTools/Quickhacks`; the QuickHack launcher weapon lives in `CombatTools`. Its native sheet attack and damage controls run Jack In and QuickHack Target. Legacy gear backups and folders remain in place; cleanup is deferred until at least v0.8.0.

Inventory of features present in the working source. This is not a release log or a claim that every feature has been verified in live Foundry. Keep this list current when adding, changing, or removing features, including small convenience options. Deferred designs belong in [BACKLOG.md](BACKLOG.md).

## HUD access and targeting

- Right-click a visible unowned token to open Combat Tools.
- Shift-right-click opens only Combat Tools on owned or unowned tokens.
- Optional per-user right-click access on owned, targeted tokens without changing the controlled attacker.
- Ordinary owned-token right-click retains native HUD controls, with Combat Tools always visible in a separate column to the right.
- Targeting uses the normal Foundry token HUD. The duplicate Combat Tools target toggle has been removed.
- Capture the acting token before right-click changes selection.
- Preserve native right-drag panning and ordinary owned-token double-right-click behavior.

## HUD appearance and convenience

- No Combat Tools launcher submenu or X button; both HUD forms use native dismissal.
- GM-controlled world setting for Combat Tools icon color, using the native color picker. Applies only to main CTH icons. Unset uses white; submenu and native HUD icons are unaffected.

- Reuse the configured Foundry Token HUD and native control styling.
- Keep HUD screen size consistent through canvas zoom.
- Center a 1x1 token's HUD on the token; center other token sizes' compact HUD on the right-click location.
- Per-user HUD size and status-picker icon size settings.
- Optional per-user Tight HUD spacing, without shrinking buttons.
- Shared translucent panel styling for attack menus and hover DV previews.
- Equal-size weapon-name buttons and aligned aimed/autofire columns, with matching button heights and centered icon artwork.
- Ellipsis for long weapon names; full names available on hover.
- Player attack heading: Attack. GM heading: Attack as <token name>.

## Attack controls

- Attack menu and hover preview share equipment eligibility, including installed cyberweapons and configured weapon attachments on equipped items. Nonweapon upgrades and cyberware are excluded.
- Ranged menu (renamed from Attack): equipped ranged weapons. Melee Attack uses a knife icon and equipped weapons whose type contains melee. Both include eligible installed cyberweapons and attachments.
- Fist menu: equipped Unarmed and Martial Arts attacks.
- Click a weapon name to invoke the native CPR attack workflow.
- Reticule button for aimed attacks; SMG button for supported Autofire.
- Reuse native roll dialogs, modifiers, ammo, Luck, dice presentation, and chat cards.
- Before each attack, restore the captured attacker as the sole controlled token and the HUD token as the sole target. Reject removed tokens or denied control before rolling.
- Reject unavailable items, lost attacker ownership, and unsupported Autofire; prevent duplicate calls while a roll workflow is pending.
- Show Quickhacks for the acting Netrunner when enabled. Execute Jack-In and available QuickHacks against the captured target; see [QuickHack](docs/quickhack.md).

## Armor convenience

- Shift-click the native head/body armor ablation arrow to restore 1 SP, capped at maximum armor SP. Uses CPR's native reverse-ablation method, including its equipped-armor and tracked-value updates. Ordinary click still ablates 1 SP.
- Armor-arrow tooltips explain the Shift-click shortcut.

## Hover DV preview

- With exactly one owned token selected, hover another visible token to preview equipped ranged-weapon DVs.
- Works inside and outside combat.
- Include installed ranged cyberweapons and installed weapon attachments on equipped items.
- Optional separate Autofire DV rows for supported weapons, controlled by "Include AutoFire DV's on Hover".
- Per-user hover display toggle (default on) and Autofire toggle (default off).
- Use configured DV tables, preferring matching world tables over the configured system compendium.
- Account for elevation and native grid distance; omit missing or invalid DVs.
- Color thresholds: below 17 green, 17–20 yellow, 21+ red.
- Refresh on relevant equipment, token, selection, and world-table changes; reposition on pan/zoom.

## Ranged evasion settings and enforcement

- GM/world Ranged Evasion dropdown: RAW Ranged Evasion, No Ranged Evasion, or Homebrew. The Homebrew button sits to the right of the dropdown, is visibly greyed out and disabled for both other choices, and enables immediately when Homebrew is selected. No Ranged Evasion is saved as a distinct mode; enforcement applies to Combat Tools defense choices.
- Native homebrew form: REF 8+, Co-Processor, and Solo/Threat Detection rows with Qualifies, One Free Evasion, and Stacks checkboxes. The form is headed "Homebrew rules for Ranged Evasion". The "Ranged Evasion Rule after free evasions" dropdown selects flat -4, cumulative -1, required LUCK, or "No additional evasions allowed" (free allowance only). Free evasions are used first each round before any selected rule applies. Clear all free grants to charge LUCK every time. LUCK amount is enabled only for the LUCK rule.
- Checkbox dependencies apply independently per qualifier row: unchecking Qualifies clears and disables One Free Evasion and Stacks; unchecking One Free Evasion clears and disables Stacks. Re-enabling a prerequisite leaves dependent boxes unchecked. Invalid dependent selections are also cleared when the form opens and normalized on save.
- Defaults: RAW eligibility, unlimited attempts, and no added penalties or mandatory LUCK spending.
- Settings feed the first Combat Tools defense workflow, including prompts, round tracking and configured LUCK deductions. Definitions and sources: [evasion rules](docs/evasion-rules.md).

## Settings organization

- Native module settings are grouped into Combat & Evasion, Critical Injuries, QuickHack, Token HUD & Targeting, Status HUD & Biomonitor, and Status Effects.
- Existing controls, values, permissions, homebrew badges and configuration buttons are retained. Groups with no controls available to the current user are omitted.

## QuickHack

- Functional target HUD with RAW, Must Buy QuickHack and Must Be Loaded in Equipped Cyberdeck modes.
- Master switch gates controls, rolls, sockets and effect/damage actions. All six prior GM routing options are retained.
- Native program content creation; existing items and settings are not migrated; the native Cyberdeck installation UI handles capacity and loading.
- Started Combat documents own attacker/target connections. Ejection blocks QuickHacks and re-Jack-In for that encounter. Outside combat, roll/chat workflows remain untracked.
- Prior guided/manual effect boundaries are preserved. See [QuickHack setup and compatibility](docs/quickhack.md). Automated and browser checks are not live Foundry validation.

## Visible placeholders — mechanics not implemented

- Grapple: implemented; see the Grappling section below.
- Grenades: expandable inventory-ammunition list routes to AoE placement. Grenade/rocket launchers and shell-loaded shotguns use the shared AoE flow; slugs remain single-target. See [Area attacks](docs/area-attacks.md).

## Deferred or unresolved

- Combat Tools attacks now pair one attacker and defender through a chat-card Evasion choice with hidden attack results; see the first-test combat resolution section below.
- Current Action window and its associated exchange/history/checkpoint plan are marked "maybe" in the backlog. The preferred direction is existing native chat cards with a consistent, compact reskin; chat-card styling is provided by PneumaVisualTools; the first combat-resolution implementation is described below.
- Combat Tools now updates its own attack cards with hit/miss resolution. The Yam/Smitty mismatch was traced to different token and actor names; it was not evidence of wrong targeting. Broader native Actor/Token consistency remains on the roadmap.
- Automated checks cover attack eligibility/routing and hover calculations; local browser checks cover layout and menu separation. Full live Foundry/module compatibility remains to be verified.

## Chat-card customization

Moved to PneumaVisualTools. Combat Tools no longer registers portrait, compact-card or recipient-display settings, hooks or styling. Combat resolution remains here.

## Combat resolution — first test version

- Combat Tools attacks use native weapon rolls and a target-linked pending card with Evade / Do not Evade. Results and native dice display stay hidden until defense commits.
- GM/world switches enable the flow and hide weapon titles as Ranged, Melee or Unarmed.
- Native Evasion dialogs show a named, applied homebrew penalty above Total Mods and, for paid attempts, "This evasion will spend XX Luck". Required costs never add a roll bonus; optional bonus LUCK remains separate.
- Free uses and extra attempts are stored on the originating Combat per defender and round, with independent allowances across simultaneous combats, GM-serialized claims and idempotent payment. Canceled dialogs/declined defenses spend nothing. GM cancellation and interrupted-payment completion are available.
- GM attack dialog includes a per-attack **Defender is unaware** checkbox, default off. It bypasses defense choices and costs; ranged attacks still use DV.
- Hits offer native damage rolling on the same card, carrying over aimed location and capped Autofire margin. The defender owner or GM uses defaults or Shift-clicks for native damage options and offers Apply to the recorded target or Apply to Selected Token.
- Cards track damage rolled/applying/resolved. Serialized application prevents double damage; an interrupted native application requires GM review rather than automatic retry. Native critical bonus, armor, shields and ablation remain authoritative; critical injuries use independent recipient dice links and the native injury workflow.
- Detailed behavior, boundaries and verification: [combat resolution](docs/combat-resolution.md). Live multi-client Foundry testing remains pending.
- Attack cards retain their combat ID/reset generation. Combat reset clears counters and expires old pending cards; deletion removes counters with the Combat. Actor LUCK stays shared, with a temporary payment receipt removed after completion. Startup migration moves old actor counters to their recorded Combat.
- Regression checks cover separate combats for one actor, selected-combat changes, shared LUCK, reset/deletion, old-counter migration and interrupted Combat writes. Live multi-client verification remains pending.
- Combat exchange headers show attacker → defender. Attack mode and ammunition share a left/right row; Evasion omits the repeated defender label and Skill subtitle. Winning/losing box interiors use green/red shading (18% green and 16% red opacity), preserving native borders. Attack/ammo labels have horizontal insets. The result line starts with a fixed-position damage drop on hits and misses; only attacker owners or GMs can initiate damage. It remains visible but disabled after damage starts, preserving duplicate-application protection. Missed Autofire opens with an editable ×1 multiplier for manual review.

- Combat result text is 20% larger for easier reading.

- Pending defense uses a single inset weapon/status frame, no duplicated participant names, full-width defense buttons and a separate compact GM cancellation control.

- Attack initiation uses the defender captured by the Combat Tools HUD. Token names identify the participants on the card, even when their underlying actor names differ.
- Rolled damage offers **Apply to <target name>** and **Apply to Selected Token**. The latter captures exactly one controlled, owned token when clicked and applies using defaults or Shift-click options. The GM rechecks recipient ownership and records the chosen token UUID; the recorded action is one-time; selected-token applications can be repeated.

- Visible Combat Tools exchange messages expose .pneuma-combat-message and data-pneuma-exchange-state, data-pneuma-damage-state and data-pneuma-outcome attributes on the outer message. Includes canceled cards and restores current state on render/reload. Styling contract: docs/chat-card-styling.md.

- Evasion buttons show Evade for X Luck or Evade at -X using the current mandatory cost/penalty; unmodified choices retain Evade. The separate note above the buttons is removed; availability reasons remain in the button tooltip and accessible description. Optional bonus LUCK remains separate in the native dialog.

- Damage header shows Damage left and native ammo type right, without repeating the weapon. Two lightning-bolt controls beneath it apply to the recorded target or to selected target, below native dice/results. New header/control styling hooks are documented in docs/chat-card-styling.md.

- Damage application choices are plain recipient text with clickable lightning-bolt anchors, not buttons; only the bolt activates the action, with keyboard access and request guards preserved.

- Damage application controls sit below the dice. The recorded-target bolt applies once and remains grayed out; the selected-token bolt remains reusable. No extra completion/status icon is shown.

- Recorded-target damage is tracked independently from reusable selected-token application. Repeated selected clicks intentionally apply the rolled damage again using defaults or Shift-click options. Ownership and uncertain-application safeguards remain. Evasion button costs/penalties, mandatory LUCK deduction and named roll modifiers are covered by regression checks; no charge applies to a free allowance or RAW evasion.

- The Evade button shows a running-person icon before its current cost/penalty label.

## Resolution card structure

- Stable labeled containers and content areas for pending attack, resolved attack, Evasion, result, damage roll, damage application and permitted recovery controls.
- Native roll markup and existing section selectors retained; pending defense controls grouped inside their section.
- Horizontal labels inherit theme styling; Visual Tools can position them as vertical side strips without rebuilding content.
- New structure applies to new/updated exchange content; historical messages are not rewritten.
- Typecheck, build, browser structure/skinning checks and 31 combat-resolution tests pass; live Foundry verification remains pending.

## Damage application and critical injuries

- Recipient bolts use defaults on click and open native shield/reduction options on Shift-click. Native application results append as small horizontal Name / Damage / Location rows with expandable native details.
- Add/edit up to three native statuses before applying damage; saved statuses activate on the exact damage recipient after HP handling. Reapplication never toggles an existing effect off.
- Injury dice links appear for two or more active damage d6 sixes. Aimed head attacks use Head; others use Body. The native workflow supplies injury Items/effects and duplicate handling.
- Eight per-method injury toggles default enabled and now live in a GM-only Critical injuries submenu with a damage-type/checkbox table. Existing values and reload behavior are retained. Explosion workflows remain planned. QuickHack retains the reference module’s no-critical-damage behavior; its injury toggle does not change that behavior.
- Browser checks and 36 combat-resolution tests pass; actual native injury creation and multi-client operation still need live verification.

- Compact applied-damage rows preserve the native calculation and undo control; number is larger than name/location. Additional recipients append rows without publishing a separate managed damage-application card.

- Three right-aligned +/status-icon slots replace the text status button. Maximum three effects; choose None to remove a slot.
- Updated visible resolution cards scroll within chat as their content grows; oversized cards align to their bottom.

- Managed attacks stop on the native weapon hasAmmo check before the dialog/DV lookup and recheck after confirmation. Native out-of-bullets wording is retained; no exchange, ammo discharge or LUCK spending occurs on rejection. Native mode-specific ammo costs remain authoritative.

- The damage-roll blood drop uses defaults on click and shows native roll options on Shift-click. Status slots/picker icon wells have dark backgrounds and thin black outlines; maximum three effects.

- Redundant Attack/Evasion/Result/Damage roll structural headings are hidden by default but remain available to skins. Paid Evasion shows N LUCK at the right of the native Evasion title. Filled status icons receive their own dark background in addition to the slot button.

## Additional attack methods

- Melee, Unarmed and Martial Arts always offer Free evasion, regardless of REF or ranged homebrew.
- Martial Arts retains native half-SP damage and normal ablation. World setting **MA does not ablate armor** defaults off and suppresses ablation only when applying Martial Arts damage from resolution cards.
- Thrown lists all inventory weapons with type thrownWeapon. Native Athletics/DV rolls use normal ranged evasion, including homebrew. A successful attack-card creation appends (used) once to the inventory name; the item remains usable.
- Improvised loads the native compendium Thrown Weapon without creating an inventory item. The attacker chooses the GM-agreed 1d6–6d6 in the initial attack dialog.
- Thrown attacks use resolution cards even when the general combat-resolution toggle is off, because their inventory marker and GM damage choice belong to that flow.
- Main grenade/rocket/shell AoE and suppressive-fire resolution are implemented; grenade-specific effects remain deferred. QuickHack is integrated; some effects retain guided manual handling. Automated checks do not establish live Foundry verification.

## Visual item markers

- Shared itemMarkers API supports caller-defined plain-text badges and Used/Disabled presets, persisted on native Item flags.
- Badges appear on native actor-sheet item names and CTH weapon buttons; other integrations opt in through the renderer API.
- Supersedes the actual thrown-item rename: successful thrown attack creation now adds a Used badge. Existing renamed items are not migrated.
- Display only: item mechanics remain unchanged. Combat association, automatic expiry/removal and a manual management window are not implemented. See docs/item-markers.md.

Improvised damage is now selected by the attacker (player or GM), after agreeing with the GM, in the initial attack dialog. A 1d6–6d6 selection is required before confirmation and is saved with the attack for the later damage roll. This supersedes the GM-only resolution dropdown, which has been removed. Older improvised cards without a saved choice must be restarted.

- The Improvised menu entry uses the native Thrown Weapon compendium icon, sized like the other weapon rows.

- Top-level Combat Tools HUD icons retain their original solid weight. Melee Attack uses a solid combat-knife silhouette with a short blade, guard and handle. Native HUD sizing and the configured icon color remain inherited.

## Cybereye status HUD

A client-side optical/medical overlay shows existing critical-injury items and active token-status effects for one selected owned actor. Players fall back to their assigned character when nothing is selected; GMs select a token. Multiple selections show no live panel. The display is read-only: it does not implement the proposed condition synchronization, treatment, or damage automation.

- Cyan medical rows and amber incoming-attack notices use a scoped translucent overlay.
- Drag its header to move it; position persists per user. Collapse/expand preserves the current panel state for the session.
- Multiple conditions and alerts scroll within a bounded panel. Matching injury/status names appear once.
- Pending Combat Tools attacks against the focused actor show an alert, subject to chat visibility. Open chat card scrolls to the rendered resolution card; if the card is not loaded in chat, a notification directs the user there. Dismiss affects only this user's overlay notice.
- Known narrative consequences include inability to speak and an unusable arm. Other conditions direct users to their actor sheet. These are informational descriptions, not enforcement.
- No polling or per-frame monitoring. Actor/item/effect hooks refresh the focused actor; chat hooks maintain pending attack notices. An initial message pass restores pending notices on load.

### Test it

Open Configure Settings → Pneuma's Combat Tools. Enable **Test cybereye HUD**, then save. A clearly marked simulation appears even without a selected actor. Test alert, Dismiss, Collapse/Expand, and dragging are usable. **End test** returns to live display. The test does not create effects, chat messages, injuries, or damage.

**Cybereye status HUD** controls live visibility per user. Test mode can still display while live visibility is disabled.

Built and verified in browser fixtures; live Foundry integration remains to be checked.

Biomonitor revision: header displays the actor name followed by Biomonitor. Compact single-line condition rows retain native icons, with a plus fallback and full text on hover. No counts, collapse control, empty-state panel, or telemetry footer. One scrolling ALERT: Incoming Attack banner links to the latest pending card and acknowledges the currently displayed alerts locally. The overlay hides when empty. Reduced-motion users receive static alert text. Preview is now named Test Biomonitor; End test remains available in its header.

Status HUD update: large alerts above optional Biomonitor conditions. Conditions require installed Biomonitor cyberware or the default-off world override Show Biomonitor even if not installed. GM-only Send HUD message targets connected users with expiry/clear/dismiss behavior. Players see no name header; GMs see the selected token name. Test status HUD previews both sections safely. Incoming attack notices take priority over custom messages.

Biomonitor vitals update: left current/max HP with animated EKG and five severity states; right single-line conditions. Poison/radiation/biotoxin/fire dashboard lights use client-configurable timed flashes. Safe preview includes HP state and light tests. HUD now stays visible when enabled, with a persistent minimize-to-notification control and alert highlight; this supersedes earlier hide-when-empty/no-collapse decisions. Per-client disable and implant/world-override gating remain. Instant-effect damage integration remains future work.

EKG visual enhancement: a luminous moving scan point with a layered fading trail follows the waveform, including the straight flatline. Supersedes the stationary flatline. Reduced-motion users receive a static trace.

Dashboard indicators are now hidden when inactive. Active indicators fill consecutive slots in activation order; clearing an indicator closes its gap, and reactivation appends it after remaining indicators. Existing conditions on initial display use their actor list order.

EKG animation fix: explicit numeric stroke offsets replace the stalled calculated offsets. Browser regression checks verify scan-point movement across all five HP states.

Three-column Biomonitor: Vitals, Biological Scan (empty: No Active Pathology), Implant Integrity (empty: All Systems Normal). Diagnostics lists cyberware carrying the existing Disabled item marker and opens its native sheet on click. EMP now supplies combat-scoped suppression/cleanup; generic markers still have no automatic lifecycle. Client Show Biomonitor HP numbers defaults on; when off, hovering or keyboard-focusing the EKG reveals HP without resizing the panel.

EKG Critical threshold revised to below 10 HP (supersedes below 15); zero or below remains Flatline.

Minimize/expand now preserves the upper-right curved corner. Saved positions retain this right anchor, subject to viewport bounds.

Three-column HUD compacted to 600px maximum width, with equal remaining space for Biological Scan and Implant Integrity. Long condition text retains hover details.

Hidden HP now takes no layout space: the EKG moves up under Vitals. Hovering or focusing the EKG reveals HP directly over the animation without shifting the layout.

Biological Scan and Implant Integrity empty-state messages use the same typography as populated condition rows.

HUD API v1 implemented at game.modules.get("pneuma-combattools").api.hud: send, remove, dismiss and list. Multiple messages use compact previous/next controls with individual local Clear, including native incoming-attack notices. Stable source/ID pairs update messages; optional expiry, local sends and GM socket delivery to connected recipients are supported. This supersedes the single replaceable alert. See docs/hud-api.md. Browser fixtures cover the API; live multi-client verification remains outstanding.

GM Send HUD Message moved from Settings to the expanded live HUD. Recipient choices retained. Durations: 60 Seconds, 5 Minutes, 15 Minutes, 1 Hour, 6 Hours, Until Cleared (no expiry; session-only). Supersedes the old settings-menu location and duration list.

Click the EKG to pause/resume its animation; Enter/Space also toggles it. The local pause preference lasts for the current session and survives HUD refreshes. HP and conditions continue updating.

Performance fixes: pending-card refreshes use an unresolved-card index seeded once on ready, filter actor/item/effect updates by defender and combat updates by originating combat, and batch repeated requests once per animation frame. Ordinary chat events no longer refresh the HUD; stable header/message/medical sections retain unchanged DOM, EKG playback and focus. Hidden HUD exits before gathering medical data; minimized HUD skips medical work. Regression checks cover event routing, batching, card cleanup, unchanged DOM and live HP updates.

HUD alert layout: shortened scrolling banner with previous/count/next on one row to its right and Clear directly underneath. Clear dismisses only the displayed alert on this client.

HUD position now remembers the last completed mouse drag as its preferred upper-right anchor. Resize and content changes only clamp the displayed position to the viewport; enlarging restores the preferred position. Minimize/expand and stationary header clicks never save position.

Alert text scrolls three times then rests centered. Opening/expanding the HUD or receiving a new message starts the sequence again. Unrelated updates preserve the animation; reduced-motion stays static.

With an installed Biomonitor or its world override, the minimized HUD shows a compact live EKG and notification bell side by side. Without it, only the bell is shown. The miniature uses the same HP states and pause/resume interaction, and retains the upper-right anchor.

- New HUD notices received while minimized temporarily expand the HUD, select the new notice, scroll once, then minimize again. Reduced-motion users see a static notice for eight seconds. Manual minimization cancels the temporary display; the saved position and minimized preference stay unchanged.

## Native Cyberpunk status foundation

- Cyberpunk master status list replaces the stock picker. Head/body injury sections start collapsed and retain native controls.
- Custom-status settings editor with native icon picker, seeded with In Jail; existing Condition Lab custom entries are preserved.
- Native injuries and supported drug effects synchronize with actor/token status markers without duplicating modifiers. Damage-card status application awaits the native source changes.
- Condition Lab must not also manage the palette. Timed damage and other condition-specific rules remain deferred.
- Details and verification limits: [Status effects](docs/status-effects.md).

- Implemented: existing Pharmaceuticals and Drugs (including addiction statuses) have separate collapsed token-HUD sections. Section headings now use light HUD text for dark-background readability; missing drug/pharma statuses are not created.

- Implemented: opening the native status picker temporarily hides the Combat Tools controls and their menu. Closing the picker restores them; native HUD controls remain available.

- Close Combat now combines melee weapons, Unarmed, Martial Arts and grappling actions (superseding the disabled placeholder) under the combat-knife button. Supersedes separate melee and fist buttons; Ranged, Thrown and conditional Quickhack remain separate. Attack mechanics and equipment eligibility are unchanged.

- Close Combat now uses the approved two-sparring-figures icon, replacing the combat knife. It inherits the configured CTH icon color and existing button sizing.

## Grappling

- Close Combat offers Grab, Choke, Throw, Release, Escape and third-party Break Grapple according to the acting token's role.
- Native DEX/Brawling dialogs and rolls; ties favor the responder. Winning Grab chooses Hold Target or Take Held Object. Inventory transfer remains manual.
- Native ActiveEffects supply Grappled and the -2 all-Actions modifier to both actors, without duplicating an already active native Grappled penalty. Existing effects are preserved on release.
- Combat Tools blocks two-handed weapon attacks while grappling. Free hands and universal Action expenditure remain player/GM checks.
- Choke and Throw apply prepared BODY directly to HP with no armor change. Choke follows the supplied strict greater-than-1/below-0 safeguard and three-successive-round unconsciousness rule. Throw applies Prone and ends the grapple.
- Encounter Grab/Grapple records are stored under Combat flags: participant actor/token references, roles, state, roll results, pending operation, revision, card reference and choke sequence. Outside-combat records use scene flags with manual round tracking. Completed history remains in chat.
- Vitals column shows Grappling/Grappled by and Choking/Being choked by, with consecutive-round counters. These combat rows do not require a Biomonitor. The ordinary HUD visibility/minimize settings still apply.
- One tracked grapple per character. Hold Target sets the defender's token texture scale to 0.8, preserves mirroring and places it on the square the grappler just left (including the previous elevation) through native GM-authorized updates. Multi-square moves use the starting square, without path calculation. Ending the grapple restores the prior scale. Independent defender movement is blocked for players; footprint, movement allowance and pathfinding are unchanged. Native sheet attacks outside Combat Tools are not intercepted.
- Automated rule, lifecycle, concurrency, failure-injection and browser HUD checks cover this implementation. Live multi-client Foundry verification remains outstanding.

- Grapple cards preserve Chat Dice artwork and other native-roll decorations during chat rendering; repeated renders update status/controls without replacing roll nodes. Browser regression checks cover both hook orders and state transitions.

- Contested Brawling cards reuse the existing winner/loser styling for Grab, Escape and Break Grapple; ties favor the responder. Decoration preserves modified dice and works on older saved cards.

- Shared chat-card presentation now covers attack/Evasion, grappling and QuickHack: common scope/kind metadata, visibility checks, outcome helpers and growth scrolling. Initial history and hidden/ordinary chat do not trigger scrolling. Render hooks preserve native dice nodes.

Status picker critical injury categories are labelled **Crit Head** and **Crit Body**; grouping and native controls are unchanged.

Release, Choke and Throw on an established grapple require no new Brawling roll or opposed response. Their result displays use the action name and omit the original Grab dice; the original roll data remains saved in grapple metadata. Grab, Escape and Break Grapple still use opposed Brawling.

### Cross-client setup

Foundry must load the module with socket support enabled. Copying newer module files over an installation does not refresh the package metadata held by the running server. After such an update, restart the Foundry server and reconnect every client; a browser refresh alone may still use stale server metadata. Combat Tools now checks the loaded socket flag at startup and before combat, grapple, QuickHack/Force Out and remote HUD requests, reporting the restart requirement before starting an affected action. An active GM must remain connected for shared actor/Combat writes; no GM clicks are required for ordinary player-versus-player resolution.

- Grenade inventory listing corrected against CPR v0.92.4: ammo items are selected by system.variety = grenade, including smoke, EMP and other ammunition types. Superseded by the main AoE implementation; grenade-specific effects remain deferred.

AoE visibility: all card viewers can show/hide the shared area, including hiding it from GMs. Automatic hiding waits for responses, blast escape movement and applied damage (or GM-confirmed manual special effects). Completed areas can be revealed again. Uses the existing active-GM coordinator. Verified with automated fixtures; live multi-client verification remains outstanding.

AoE shapes: independently configurable square, cone (including 45/90 degrees) and ray (including 1/3 scene squares) per attack type, with RAW suppressive radius retained. Placement uses local native measured templates without creation permission. Native ray/cone geometry respects world measurement settings; wall-clipped native highlighted cells also determine recipients. Legacy corridor settings retain their dimensions. Automated native-method and browser fixtures verified; live map/multiplayer validation remains pending.

AoE settings UI: compact sections for shotgun shells, grenades/rockets and suppressive fire; shape-specific size/range/angle/width controls, 45°/90° and 1-/3-square quick buttons, live dimension summaries, collapsible attack/evasion rules and a fixed Save footer. Settings remain world-scoped and GM-editable through Combat & Evasion → Area Attacks & Suppressive Fire.

Fixed AoE settings opening: evasion choices now come from form data rather than an unavailable Handlebars hash helper. The real settings template is included in browser rendering regression checks.

AoE evasion revision: grenades/rockets offer Square/Circle; shotgun DV13 is fixed and explosive tie-success settings are removed. All damaging AoE requires successful evaders to relocate. Optional MOVE charging/next-turn borrowing tracks combatant allowance and displays it under vitals. Cover Up is implemented for damaging AoE: remain in place, become Prone, double effective armor SP and double armor ablation even when damage is blocked. Supersedes prior placeholder and shape-option inventory entries.

Critical injury damage types: Quickhacks now default to disabled. Explicitly saved world preferences remain respected; other damage-type defaults are unchanged.

## Movement and EMP

Movement accounting uses committed Token source coordinates for costs, unchanged axes and reset origins. Rapid arrow-key regression fixtures simulate unfinished animations; live Foundry verification remains outstanding.

- Combat movement tracking adds a start outline, native-elevation-style MOVE counter, and return/reset control on square grids. Adjacent clear perpendicular steps count as one diagonal; blocked shortcuts count as two. Native walking allowance and existing AoE movement accounting are retained. See [Movement](docs/movement.md).
- GM-triggered EMP supports GM/player choice, equal/foundational-weighted/system-first random selection, a GM immunity list, optional foundations, carried electronics, and dependent options. Combat-owned records last until combat ends. Native effects are suppressed without changing their saved enablement; native item rolls, cyberweapon eligibility and Combat Tools Reflex Co-Processor qualification respect disablement.
- Biomonitor Implant Integrity displays Disabled — EMP. Cyberlimbs receive temporary broken-limb icons, without physical injury damage or automated limb penalties. Existing injuries and unrelated disablements survive cleanup. See [EMP](docs/emp.md).
- Validation: focused unit/lifecycle fixtures and Biomonitor browser checks. Live Foundry multi-client movement/EMP validation remains outstanding. Native source-specific EMP saves, Microwaver and QuickHack dispatch are not automated by this addition.

Movement reset follow-up: the counter omits MOVE, uses 32px text in a native HUD-style box, and places a smaller Reset box below. Native HUD HTML replaces the unclickable token-child arrow. Pointer-driven browser tests verify return to the saved position and zero spent movement, including pan/zoom and update failures. Live Foundry multiplayer validation remains open.

Movement visibility: all players can see counters for visible player-owned actors. NPC movement counters and start markers are GM-only. Reset remains restricted to token owners/GMs. Native player ownership determines the distinction; ownership changes refresh the display. Browser fixtures cover these visibility rules.

The GM world toggle is named **Enable movement counters** (existing `movementTracking` setting key retained). It defaults on and enables/disables tracking, counters, origin markers and Reset controls for all clients. Visibility remains player-owned counters shared with players and NPC counters GM-only.

Movement Run display: green through the normal allowance, yellow with `run` when exceeding normal movement through double the allowance, and red beyond double. Reset and run use compact 20px boxes below the unchanged counter: Reset on the left and run on the right. The tooltip states that Run uses the Action; this remains a movement aid without automatic Action enforcement. Reset clears the running state. Boundary colors, run placement and reset have browser regression coverage.

### Hover EKG

Hovering a visible token shows the existing Biomonitor EKG below it for Medtech viewers, or for everyone when the GM world setting **Always show EKG** is enabled (default off). Uses the selected owned character, falling back to the assigned character with no selection. Native role rank/source/name determine Medtech status. No numeric HP is shown. Animation/health-state rendering is shared with Biomonitor; existing pause and HP interactions remain intact. See [Hover EKG](docs/hover-ekg.md). Browser fixtures pass; live multiplayer verification remains open.

## Self CTH and speedware initiative

Own-token HUDs show self controls instead of standard combat actions while retaining native token controls. GM target actions remain available when acting as a different selected token. Default-off **Speedware allows Rerolling Initiative** adds a D10 for installed functional Sandevistan/Kerenzikov. Started combat and existing initiative are required. Native CPR rerolls preserve the acting combatant; duplicate pending clicks are ignored. The Action cost is table-managed. Automated unit/browser checks pass; live Foundry verification remains outstanding. See [Self CTH](docs/self-cth.md).

### Refresh performance

- QuickHack indexes its own loaded cards and batches eligibility refreshes. Ordinary round changes and disabled QuickHack skip combat refresh work. Connection changes, encounter start/reset/end and settings changes update affected cards without rebuilding the whole chat panel. Disabling refreshes QuickHack cards once to remove controls.
- QuickHack HUD refreshes are batched and limited to relevant attacker/target fields and walls in the viewed scene. Self CTH is excluded.
- Movement token refreshes are batched per frame. Unrelated Combat flags are ignored; turn identity changes (including initiative reordering) select affected tokens. Scene lifecycle and visibility/settings changes retain broader refreshes. Unchanged counter/marker displays are retained.
- Hover DV retains panel/row nodes when output is unchanged and shares cached compendium table promises across refreshes. Table/result edits, compendium updates and DV compendium setting changes invalidate the cache; world tables retain precedence and stale hover requests remain guarded.
- Verified with typecheck/build, refresh-count regressions, DV cache/lifecycle checks and browser HUD fixtures. Live multiplayer FPS/CPU measurements remain outstanding.

### Refresh performance

- QuickHack batches its own card eligibility updates instead of rebuilding chat. Ordinary round changes and disabled QuickHack skip combat refresh work. Connection changes and encounter lifecycle update affected cards; settings changes refresh QuickHack cards once.
- QuickHack HUD refreshes are batched and limited to relevant attacker/target fields and walls in the viewed scene. Self CTH is excluded.
- Movement refreshes are batched per token per frame. Unrelated Combat flags are ignored; turn identity changes, including initiative reordering, select affected tokens. Scene lifecycle and visibility/settings changes retain broader refreshes. Unchanged counter and marker displays are retained.
- Hover DV retains unchanged panel/row nodes and caches compendium table promises. Table/result edits, compendium updates and DV compendium setting changes invalidate the cache. World tables retain precedence and stale hover requests remain guarded.
- Validation: typecheck/build, 66 focused unit/regression checks, and movement, QuickHack and self CTH browser fixtures pass. Live multiplayer FPS/CPU measurements remain outstanding.

Combat Tools requires **libWrapper**. EMP uses WRAPPER/MIXED registrations; damage capture uses a persistent, operation-filtered MIXED registration. Missing registration support blocks the affected operation before mutation. See [v13 migration checklist](FOUNDRY_V13_MIGRATION.dm). Live companion-module compatibility remains unverified.

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
