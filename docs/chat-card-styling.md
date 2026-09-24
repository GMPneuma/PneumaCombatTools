# Combat Tools chat-card styling contract

Current implementation: 0.8.0, reviewed 2026-09-23. This contract covers emitted selectors and visible state, not permissions or mechanics. It replaces the accumulated design notes in [the archive](history/pre-0.8.0-refresh/chat-card-styling.md). No runtime selectors are changed by this documentation refresh.

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
| AoE `.pneuma-aoe-card` | Recipient rows, shared damage-roll only, receipts below shared roll | Per-row defense/relocation/application; GM target adjustments, scatter, Show/Hide and smoke removal | `.pneuma-aoe-card [data-aoe-action]` |
| Grapple `.pneuma-grapple-card` | `data-state`; note, opposed rolls, controls; established history | Roll Brawling, Hold/Take, recovery/GM End as applicable. Ongoing Choke/Throw/Release/Escape belong to self HUD | `.pneuma-grapple-card .pneuma-grapple-controls` |
| QuickHack `.pneuma-quickhack-card` | `data-state="success|failure"`; heading, combined visible native rolls, outcome/effect slot | Force Out and eligible damage; audience/identity follow saved routing | `.pneuma-quickhack-card .pneuma-quickhack-effect` |
| EMP `.pneuma-emp-card` | Request summary and chooser outcome | `data-emp-select` for authorized chooser/GM; limited shortlist does not expose every component in its UI | `.pneuma-emp-card [data-emp-select]` |
| Instant effects | Standalone/embedded resolver state and summary | `data-instant-action`; resist/apply/unaffected/review/wake/extinguish as appropriate | `.pneuma-combat-message [data-instant-action]` |
| Injury `.pneuma-injury-card` | `data-injury="broken-ribs"`; pending/applied/withdrawn, including Foreign Object labels | Owner/GM `data-ribs-apply` when eligible | `.pneuma-injury-card[data-state="pending"]` |
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

Older CTH `li[data-brawling]` integrations should use `li[data-attack-category]`. This historical selector replacement predates this refresh; do not restore old selectors based on archived notes.

Implementation: [card-structure.ts](../src/scripts/card-structure.ts), [damage-flow.ts](../src/scripts/damage-flow.ts), [manual-roll-state.ts](../src/scripts/manual-roll-state.ts), [chat-buttons.ts](../src/scripts/chat-buttons.ts), [CSS](../src/styles/pneuma-combattools.css). Browser fixtures exercise rendering and stable geometry; real theme combinations remain a live check.

Self-HUD menus (outside chat scope): `.pneuma-self-menu.pneuma-combat-menu` shares attack-menu buttons; absolute 240px flyouts preserve the icon-column layout. `[data-self-grapple]` and `[data-self-throw]` handlers are unchanged.

Self-CTH Close Combat and Thrown Weapons & Grenades flyouts now use the shared `.combat-heading` and list rows, with grapple icons, item artwork and the native improvised-weapon icon. Enabled CTH menu buttons share hover/focus background and inset outline tokens (`--pneuma-menu-hover-background`, `--pneuma-menu-hover-outline`) without changing layout; disabled actions remain dim. Existing action selectors are unchanged.
