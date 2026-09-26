# Combat Tools chat-card styling contract

Targeted HUD menus: `.pneuma-target-menu.pneuma-combat-menu.pneuma-panel` replaces the former `.status-effects` root class. Combat Tools explicitly supplies absolute positioning, top alignment, content-box sizing, pointer events, and hidden visibility until `.active`. Width remains 230px. The Monk-specific `!important` override is removed. Native status pickers and self-action flyouts remain separate.

Hover EKG (outside chat scope): `.pneuma-hover-ekg` uses a 105×30 footprint (75% of the original size) and pointer-event passthrough, with a 65% black background and 3px corner radius. `.pneuma-hover-ekg .pneuma-eye-trace` adds a dark drop shadow; health-state colors and existing trace animation remain unchanged.

Ammunition notices use native ChatMessage rendering with `<p class="pneuma-ammo-notice" data-ammo-action="reload|change">`: `Character reloads Weapon` or `Character changes ammo in Weapon`. Character and weapon names are HTML-escaped. No custom card root, buttons, styling, or state selectors are added. Visibility is ordinary public chat, limited to successful gun actions for player-owned characters in combat (including actions performed by the GM) when the GM's world setting is enabled; bows are excluded.

Targeted weapon HUD ammunition controls (outside chat scope): `#token-hud .pneuma-combat-menu [data-weapon-ammo]` retains existing weapon names and mode buttons. `.combat-ammo-menu` occupies icon columns 2–4 on row 1, replacing the three attack-mode icons with two 24px native icon buttons `[data-ammo-action="reload"]` and `[data-ammo-action="change"]`. `[hidden]` swaps attack-mode and ammo buttons on right-click or Shift+F10; empty guns always show ammo buttons. Reload uses a circular arrow; Change Ammo uses opposing arrows. Both have titles and accessible labels. The row height and weapon-name width remain unchanged. Attack buttons use `aria-disabled="true"` and mode buttons additionally use native `disabled`; weapon names remain focusable for the context action. No existing selectors are removed.

Current implementation: 0.9.0 plus local changes, reviewed 2026-09-26. This contract covers emitted selectors and visible state, not permissions or mechanics. It replaces the accumulated design notes in [the archive](history/pre-0.8.0-refresh/chat-card-styling.md). No runtime selectors are changed by this documentation refresh.

## Scope and visibility

Visible exchange/grapple/QuickHack/AoE messages receive `.pneuma-combat-message` on the Foundry message plus `data-pneuma-card-kind` of `exchange`, `grapple`, `quickhack` or `aoe`. Manual and STAT cards include their own content root with the common class. Do not assume every card applies the class to the same outer element. Hidden/blind results remain subject to native visibility; CSS must not reveal them.

Ordinary native roll cards are not globally reskinned. The armor-control enhancement on native damage cards is a specific exception. Native roll details, application/undo and third-party dice artwork retain their nodes and handlers.

## Exchange sections and state

`resolutionSection` emits `.pneuma-resolution-section`, `.pneuma-resolution-KIND`, `data-pneuma-section="KIND"`, an accessible label, `.pneuma-resolution-label` and `.pneuma-resolution-body`. Kinds are `pending`, `attack`, `evade`, `result`, `damage-roll`, `damage-apply`, `recovery`.

| State attribute on exchange message | Values / meaning |
| --- | --- |
| `data-pneuma-exchange-state` | waiting, applying (Evasion payment), resolved, cancelled |
| `data-pneuma-damage-state` | none, rolling, rolled, applying, applied, review |
| `data-pneuma-outcome` | none, hit, miss |

Resolved means attack outcome, not that all damage/effects are complete. Applying/review does not prove actor HP is unchanged. Data attributes are presentation snapshots, not an API for updating workflow state.

## Card families

| Family / root | Sections and state | Available controls and visibility | Example selector |
| --- | --- | --- | --- |
| Exchange `.pneuma-resolution-card` | Pending title/status; native attack and optional defense; result; damage and recovery | Defender/GM Evade or Don't Evade/payment; attacker/GM damage; GM cancel/review; subject to saved state | `.pneuma-combat-message[data-pneuma-exchange-state="waiting"] .pneuma-defense-controls` |
| Damage `.pneuma-damage-result` | Native dice, heading/ammunition, application box and receipts | Recorded/selected bolt, effect slots, armor toggles when shown, critical injury and recovery controls | `.pneuma-damage-controls .pneuma-apply-damage` |
| AoE `.pneuma-aoe-card` | Recipient rows, shared damage-roll only, receipts below shared roll | Per-row defense/relocation/application; GM target adjustments, scatter, Show/Hide and smoke removal/restoration | `.pneuma-aoe-card [data-aoe-action]` |
| Grapple `.pneuma-grapple-card` | `data-state`; note, opposed rolls, controls; established history | Roll Brawling, Hold/Take, recovery/GM End as applicable. Ongoing Choke/Throw/Release/Escape belong to self HUD | `.pneuma-grapple-card .pneuma-grapple-controls` |
| QuickHack `.pneuma-quickhack-card` | `data-state="success|failure"`; heading, combined visible native rolls, outcome/effect slot | Force Out and eligible damage; audience/identity follow saved routing | `.pneuma-quickhack-card .pneuma-quickhack-effect` |
| EMP `.pneuma-emp-card` | Request summary and chooser outcome | `data-emp-select` for authorized chooser/GM; limited shortlist does not expose every component in its UI | `.pneuma-emp-card [data-emp-select]` |
| Instant effects `.pneuma-instant-card` / `.pneuma-instant-effect` | Standalone/embedded resolver state and summary | `data-instant-action`; resist/apply/unaffected/review/wake/extinguish as appropriate | `.pneuma-instant-effect [data-instant-action]` |
| Injury `.pneuma-injury-card` | `data-injury="broken-ribs|foreign-object-body|foreign-object-head"`; pending/applied/withdrawn | Owner/GM `data-ribs-apply` when eligible | `.pneuma-injury-card[data-state="pending"]` |
| Manual `.pneuma-manual-card` | `data-manual-kind="damage|critical|group"`; shared/native content and manual controls/receipts | State-dependent application, row Roll and GM recovery | `.pneuma-manual-card .pneuma-manual-controls` |
| Group `.pneuma-group-rows` | Heading skill/DV on one line; rows, outcome, initially hidden details | `.pneuma-group-total` toggles details, keyboard supported; modifiers expanded inside details | `.pneuma-group-outcome[data-outcome="success"]` |
| STAT `.pneuma-stat-card` | Native roll plus `.pneuma-stat-result[data-stat-outcome]` | Native details; no ongoing request buttons | `.pneuma-stat-result[data-stat-outcome="fail"]` |
| Custom `.pneuma-custom-roll-card` | Label plus native Foundry roll HTML | Native dice-detail interaction | `.pneuma-custom-roll-card` |

## Shared damage structure

`.pneuma-damage-heading` contains `.pneuma-damage-label` and `.pneuma-damage-ammo`. `.pneuma-damage-application-box > .pneuma-damage-controls` holds recipient rows and three `.pneuma-damage-status-slot` controls. Bolts use `.pneuma-apply-damage[data-pneuma-damage-target="recorded|selected"]`. The selected recipient is captured on click; its label is **to selected target**.

`.pneuma-damage-applications` holds native application summaries; AoE adds `.pneuma-aoe-applications` beneath the shared roll. Recorded-target completion and repeated selected-target use are distinct. Application history persists in card data rather than temporary DOM alone.

`.pneuma-armor-controls` contains `.pneuma-interact-armor` then `.pneuma-half-armor`, side-by-side. `aria-pressed` communicates state; half armor is disabled when inappropriate. `.pneuma-damage-status-picker .pneuma-effect-category` scopes collapsible effect groups. No separate ad-hoc application renderer is maintained.

## Native markup and common presentation

Retain native `.rollcard`, `.rollcard-top`, `.rollcard-bottom`, `.cpr-block`, dice/breakdown and application/undo markup. `.pneuma-roll-winner` / `.pneuma-roll-loser` add outcome shading; do not overwrite native borders globally. `.pneuma-hit` / `.pneuma-miss` mark the outcome word.

Async controls may appear after the initial render and differ by viewer. Match classes/data actions, not English button text or child index. Shared chat growth handling reveals controls on updated visible cards without treating initial history as new action.

## Button skinning

Use [chat-buttons.md](chat-buttons.md) for the complete variable/state contract. `.pneuma-chat-button`, semantic `data-chat-kind`, `aria-pressed`, disabled/busy/complete classes and fixed metrics are shared across managed chat controls. Hover/focus use color/outline, never size/transform changes. Dialogs and HUD flyouts are outside this skin.

```css
.pneuma-combat-message .pneuma-resolution-label { letter-spacing: .04em; }
.pneuma-manual-card .pneuma-group-outcome[data-outcome="success"] { color: #167a36; }
.pneuma-combat-message { --pneuma-chat-button-radius: 4px; }
```

## Related dialog and menu selectors

Native attack additions use `.pneuma-evasion-note` and `.pneuma-unaware-choice`; improvised damage is a native-dialog addition, not a chat section. Manual forms use `.pneuma-roll-dialog`, `.pneuma-manual-form`, `.pneuma-roll-modes` and `.pneuma-custom-dice`. The chat launcher uses `.pneuma-roll-flyout` and `.pneuma-roll-flyout-title`; its heading is not a selected choice.

The flyout groups buttons inside `.pneuma-roll-section` (`role="group"`), separated by borders: `base` (General Roll); `stat`, `skill`, `role`; `damage`, `critical`. The GM-only `group` button occupies a final section. Existing `data-roll-choice` IDs remain; `skill` and `role` are new. Example: `.pneuma-roll-section [data-roll-choice="skill"]`.

Skill/Role dialogs use `.pneuma-roll-dialog .pneuma-character-roll-list`, a scrollable semantic table with headings and current values. The previous select is removed. Each row has buttons with `data-choice` and `data-action="view|roll"`, plus accessible labels. Nonrolling abilities have a disabled Roll button; View remains available. Example: `.pneuma-character-roll-list button[data-action="roll"]:disabled`. View opens the native item sheet; Roll produces a native CPR chat card. No custom chat-card markup is added.

Older CTH `li[data-brawling]` integrations should use `li[data-attack-category]`. This historical selector replacement predates this refresh; do not restore old selectors based on archived notes.

Implementation: [card-structure.ts](../src/scripts/card-structure.ts), [damage-flow.ts](../src/scripts/damage-flow.ts), [manual-roll-state.ts](../src/scripts/manual-roll-state.ts), [chat-buttons.ts](../src/scripts/chat-buttons.ts), [CSS](../src/styles/pneuma-combattools.css). Browser fixtures exercise rendering and stable geometry; real theme combinations remain a live check.

Self-HUD menus (outside chat scope): `.pneuma-self-menu.pneuma-combat-menu` shares attack-menu buttons; absolute 240px flyouts preserve the icon-column layout. `[data-self-grapple]` and `[data-self-throw]` handlers are unchanged.

Self-CTH Close Combat and Thrown Weapons & Grenades flyouts now use the shared `.combat-heading` and list rows, with grapple icons, item artwork and the native improvised-weapon icon. Enabled CTH menu buttons share hover/focus background and inset outline tokens (`--pneuma-menu-hover-background`, `--pneuma-menu-hover-outline`) without changing layout; disabled actions remain dim. Existing action selectors are unchanged.

AoE re-placement: missed aim templates are gray and inactive while waiting for the GM landing point. `.pneuma-aoe-reposition` explains the state and placement bounds; the existing scatter action now reads “Place landing point.” A pointer-transparent `.pneuma-area-placement` status panel keeps placement/cancel instructions visible. The moving preview retains its color; accepting replaces the original template at the actual landing point.

## Miss damage override (unreleased)

For resolved misses, `[data-action="pneumaRollDamage"]` carries `disabled` and `aria-disabled="true"` until GM approval. A native button labeled **Allow damage on miss** appears for GMs in `.pneuma-damage-recovery-controls`; granting it preserves the displayed miss and enables normal owner damage controls. Existing card scopes and native roll markup are retained.

## Original explosive aim guidance (unreleased)

The existing `.pneuma-aoe-reposition` text identifies the amber original-square marker separately from the inactive gray blast. No card selectors or controls changed. The marker is a native scene template with `flags.pneuma-combattools.originalAim`, independent of the relocated blast.

Cover Up tooltip clarification (unreleased): the existing `[data-aoe-action="other"]` control explicitly states it replaces Evasion and requires no roll. No selectors or layout changed.

Incoming Attack queue migration (unreleased): `.pneuma-eye-notification.is-attack` and its open-card/clear buttons retain their markup and styling. The row's `data-notice-key` now uses the shared HUD queue key for source `pneuma-combattools.attack`, replacing the former `attack:<messageId>` key. Entries are actor-scoped session notices, created only for new incoming attacks; there is no startup reconstruction from chat cards.

### Self-CTH Animated Turn Indicator settings
The Self-CTH native `control-icon` gear uses `[data-self-settings-toggle]` and toggles `aria-expanded`. Its `.pneuma-self-menu[data-self-settings-menu]` panel uses `[hidden]` and lists Animated Turn Indicator first (`[data-turn-animation]`, native button). Available for owned self tokens to players and GMs. The `#pneuma-turn-marker-settings` FormApplication uses native form controls with two mode buttons (`[data-indicator-mode="default"]`, `[data-indicator-mode="personal"]`) and `aria-pressed`. Default fields are disabled for players, while local display stays editable. My Indicator offers `[data-use-default]` to remove the personal override. Appearance edits save to GM world settings or the current User flag and update the canvas through native hooks. Close requires no Save. Example: `#token-hud [data-self-settings-menu] [data-turn-animation]`. No existing selectors are removed.

The Animated Turn Indicator style select now contains Off plus 16 effects, including ten role-labeled choices. Role styles are manual choices and use the resolved owner/default color; Dispatch always uses blue/red, Nomad’s speed arc uses green/yellow/orange/red, and Media’s recording dot is red. All existing form controls, selector scopes and visibility rules remain unchanged. Legacy circuit selections now resolve to Netrunner — Quadrant Circuit; the duplicate standalone choice is removed.

The indicator editor begins with native checkbox controls named `pneuma-combattools.turnMarkerEnabled` (User Turn indicator) and `pneuma-combattools.turnMarkerForceDefault` (Use default for everyone). They remain editable in both Default/My views, outside the GM-only fieldset, and never create or reset a personal profile. Their checked states reflect client settings; changes apply immediately.

Configure Settings exposes the same editor through the native submenu `button[data-key="pneuma-combattools.turnMarkerSettings"]`, retained within `[data-combat-settings-group="turn-marker"]`. Registration is unrestricted so players see it; the editor itself enforces GM-only default edits. Existing native submenu listeners are preserved during grouping.

### Per-token indicator editor
GM editors with a captured scene token show `[data-indicator-mode="token"]` (This Token), its token name and `[data-use-inherited]`. The token target remains fixed during editing. Players never receive that tab; save/reset also enforce GM permission. Targeted-token HUDs add a GM-only native `.control-icon[data-token-indicator]` gear with click/keyboard activation; Self-CTH’s existing indicator menu passes its token instead. Configure Settings remains accessible without token selection. Token flags override owner/default settings, while viewer switches remain independent.

### Animated Turn Indicator preview note
The existing `#pneuma-turn-marker-settings` form includes a native `p.notes` explanation before its controls. Preview uses the active profile and a visible owned token (any visible token for GM); it is local to the editor client and ends on close. Existing profile tabs, fields, native form classes and control selectors are unchanged. Master/display Off still hide the preview; Use default for everyone does not override the editor profile. Example selector: `#pneuma-turn-marker-settings form > p.notes`.

### Indicator editor control separation
The indicator form now contains only profile tabs, inheritance controls, appearance fields, preview notes and Close. Removed editor selectors `#pct-indicator-enabled`, `#pct-indicator-force-default`, and the `turnMarkerDisplay` select; these client preferences remain exclusively in main settings. Native `.notes`, `.form-group`, `.form-fields`, fieldset and button markup remain. GM `[data-indicator-mode="token"]` is disabled without a token; native controlToken selection refreshes the name, profile and preview without changing the active tab. Example: `#pneuma-turn-marker-settings [data-indicator-mode="token"]:disabled`.

### Player default profile editing
Default Indicator is editable by players. Its player-only native checkbox `[data-use-gm-default]` resets the local fallback; appearance edits uncheck it. Its `.notes` describe viewer-only scope and Use Default for Everyone. GM sees the world-default explanation instead. My Indicator, token overrides and main settings selectors retain their prior meanings. No extra tab or duplicated display controls were added. Example: `#pneuma-turn-marker-settings [data-use-gm-default]`.

### My Indicator inheritance label
`[data-use-default]` is now labeled Use My Default Indicator. Clearing a personal override displays the player's own default in the form and local preview; disabling inheritance seeds the independent profile from that same default. The selector and native checkbox remain unchanged.

### Settings cleanup submenus
Main `.pneuma-combat-settings` retains contextual fieldsets and native switches/menu buttons. Combat Bar details are hidden registrations and reached via `combatBarSettings`; `biomonitorSettings` and `tokenHUDSettings` open `#pneuma-biomonitor-settings` and `#pneuma-token-hud-settings`. Both reuse the native settings category rows inside `.pneuma-bar-settings-body`, retaining `.form-group`, `.form-fields`, native DataField inputs and `[data-close]`. World-only rows are permission-filtered; Crew integration is omitted without Crew Tools and forced animations omit the player animation preference. Changes save on change.

Hover DV uses `[data-hover-dv-mode]` as a presentation-only select while the original `hoverDV`/`hoverAutofire` fields remain hidden native submitted controls. Position conflicts use `p.notes[data-position-conflict]`, hidden unless both saved positions conflict. QuickHack adds a native `select[name="mode"]` above existing message sections; Save persists both mode and routing. No existing saved-setting keys were renamed. The settings section formerly titled Status HUD & Biomonitor is now Biomonitor; IDs remain compatible.
# Cover and terrain wording

Missed explosive attacks use `.pneuma-aoe-reposition` with “Missed” and one instruction: “GM: choose a new center inside the gray area.” The `[data-aoe-action="scatter"]` button retains its crosshair icon and now displays “Place New Target Center”; shared chat-button styling treats it as a text button, not an icon-only control. GM-only visibility and existing card selectors are preserved.

Explosive area cards show one paragraph: “GM resolves all aspects of cover and terrain.” This copy change preserves existing card markup and selectors.

### Uniform GM chat controls and compact resistance rows
All existing shared chat-button scopes retain their native button/link elements and workflow selectors. Explicit GM controls use data-gm-only="true"; area and instant actions derive the role from their action identifiers, including saved cards. The shared decorator emits data-chat-role="gm" with the normal button background, black action text, a red outline and red GM pseudo-element badge. Enabled hover and keyboard focus switch to charcoal with light action text, retaining the red badge and outline. GM background/color/border and hover background/color tokens are theme-overridable. Icon-only GM controls expand to fit the badge. Normal owner actions retain player presentation for GM viewers; group rolls performed for another player are marked as overrides. Permission filtering and handlers remain unchanged.
Example selector: .pneuma-chat-button[data-chat-role="gm"]. Existing recovery/cancel kinds remain orthogonal to the role. Busy, disabled, focus, and hover states retain stable geometry.
The .pneuma-instant-effect root retains data-effect/data-state, roll/damage sections, and action selectors. Its heading now contains the resistance DV (Poison DV13); the pending eligibility text is omitted, Resist uses fa-shield-halved, and Unaffected uses the shared GM badge. Other resolution summaries remain visible. No selectors were removed.

### Reversible smoke removal
The existing .pneuma-aoe-card [data-aoe-action="removeSmoke"] native button remains GM-only with the shared GM badge. Its text and accessible label now switch between Remove smoke and Restore smoke using the scene template hidden state. It is disabled and labeled Smoke expired after template deletion. Template update/delete hooks refresh the source chat card on each client. Card sections, native roll classes, and action selectors remain unchanged; hiding smoke also removes automatic attack obscuration until restored, without resetting expiration.

### Wake action in target HUD
The existing #token-hud .pneuma-combat-column includes a native button.control-icon[data-wake-action] labeled Wake using action for an unconscious other actor when a conscious owned source is selected. It uses fa-hand and existing HUD styling; no chat card or selectors change. Self HUD omits it. The existing GM socket applies native Unconscious removal and leaves Prone unchanged.

### Shared EKG playback
Personal #pneuma-eye-hud and .pneuma-hover-ekg traces now share the existing viewer-local pause state. The .pneuma-eye-ekg.is-paused selector applies to both roots, including newly created traces. Hover permissions, health-state selectors, and native HUD controls remain unchanged; this adds no chat controls.

### Inline per-target results
Instant-effect and AoE defense rows use details.pneuma-inline-roll with a numeric summary and .pneuma-inline-roll-details containing the original native roll markup. Details start collapsed, expand via mouse or keyboard, and stay available after resolution. Existing manual group checks retain their clickable totals. Instant resistance DV, outcome and pending controls stay inline; the redundant Effect ready text is omitted. AoE .pneuma-aoe-defense remains inside the disclosure; .pneuma-instant-roll and .pneuma-instant-damage wrappers are replaced by the shared disclosure. Visibility and permissions are unchanged.

## 2026-09-26 audit status
See [the complete card audit](chat-card-audit-2026-09-26.md). Native main-card CSS remains authoritative; selector fixes are implemented; optional native-header improvements remain deferred. Reload notices now use .pneuma-ammo-notice and data-ammo-action; Foreign Object cards use their own data-injury values, including previously saved cards when rendered. The current standalone instant selector is .pneuma-instant-card, not an assumed shared outer .pneuma-combat-message wrapper.

### Condition-aware controls and audit selector fixes
Wake/Extinguish controls are omitted when their current actor condition is absent, disabled or suppressed. Saved historical effect summaries remain unchanged. Actor/item/effect and combat events batch refresh only indexed relevant cards, including embedded AoE instant rows. Injury cards use .pneuma-injury-summary and data-state="withdrawn" when injury/epoch/encounter checks fail; applied receipts remain intact. Their data-injury value is now injury-specific (Foreign Object themes must update old broken-ribs selectors). Reload paragraphs add .pneuma-ammo-notice and data-ammo-action="reload|change", retaining default native CSS. QuickHack summaries add .pneuma-quickhack-effect-failed and data-effect-state="failed|resolved"; the legacy failure class is retained for compatibility. No QuickHack recovery control or behavior was added.
