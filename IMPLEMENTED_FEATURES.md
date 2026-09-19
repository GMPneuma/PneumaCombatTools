# Implemented features

Inventory of features present in the working source. This is not a release log or a claim that every feature has been verified in live Foundry. Keep this list current when adding, changing, or removing features, including small convenience options. Deferred designs belong in [BACKLOG.md](BACKLOG.md).

## HUD access and targeting

- Right-click a visible unowned token to open Combat Tools.
- Shift-right-click opens only Combat Tools on owned or unowned tokens.
- Optional per-user right-click access on owned, targeted tokens without changing the controlled attacker.
- Ordinary owned-token right-click retains native HUD controls, with Combat Tools always visible in a separate column to the right.
- Native target toggle; toggling a target preserves other targets.
- Capture the acting token before right-click changes selection.
- Preserve native right-drag panning and ordinary owned-token double-right-click behavior.

## HUD appearance and convenience

- No Combat Tools launcher submenu or X button; both HUD forms use native dismissal.
- GM-controlled world setting for Combat Tools icon color, using the native color picker. Applies only to main CTH icons. Unset preserves theme colors; submenu and native HUD icons are unaffected.

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
- Show Quickhacks only when the acting token has a Netrunner role and an equipped flagged Pneuma Quickhack weapon. Visibility is implemented; the menu action is still a placeholder.

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

## Visible placeholders — mechanics not implemented

- Grapple: disabled button in the fist menu, pending behavior design.
- Grenades: expandable inventory-ammunition list; attack flow deferred. Grenade/rocket launcher attacks are disabled pending their separate flow.
- Quickhacks: conditionally visible placeholder panel.

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
- Eight per-method injury toggles default enabled. Explosion/Quickhack workflows remain planned; their settings are integration points.
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
- Quickhacking, grenade/rocket resolution and AoE remain deferred. Automated checks do not establish live Foundry verification.

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

Three-column Biomonitor: Vitals, Biological Scan (empty: No Active Pathology), Implant Integrity (empty: All Systems Normal). Diagnostics lists cyberware carrying the existing Disabled item marker and opens its native sheet on click. Combat-scoped expiry/restoration remains deferred; this display does not create that lifecycle. Client Show Biomonitor HP numbers defaults on; when off, hovering or keyboard-focusing the EKG reveals HP without resizing the panel.

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
