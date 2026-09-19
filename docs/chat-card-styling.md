# Combat Tools chat-card styling

This is the styling contract for Combat Tools exchange cards, using native Foundry v12/Cyberpunk RED card markup. It does not require Visual Tools. Update this document whenever a card design is added or changed.

## Whole-message scope

The outer Foundry `.chat-message` element receives `.pneuma-combat-message` when it represents a visible Combat Tools exchange. This includes its sender, timestamp, content and appended controls. The message itself is not wrapped; newly generated content has an inner .pneuma-resolution-card wrapper.

```css
.chat-message.pneuma-combat-message { /* the entire exchange message */ }
.pneuma-combat-message .message-sender { /* attacker → defender */ }
```

Ordinary chat, native sheet rolls and separate native damage-application summaries do not receive this class. Hidden messages and blind messages viewed by non-GMs are not decorated; CSS must not reveal content hidden by Foundry.

## State attributes

All three attributes live on the same outer message. They are refreshed from the saved exchange whenever the message renders, including chat history after reload. They are presentation metadata, not authorization or editable workflow state.

| Attribute | Value | Meaning |
|---|---|---|
| `data-pneuma-exchange-state` | `waiting` | Awaiting defender choice |
| | `applying` | Committed Evasion payment is being completed |
| | `resolved` | Attack hit/miss is determined; damage may still be pending |
| | `cancelled` | Exchange canceled by GM |
| `data-pneuma-damage-state` | `none` | No damage reservation or roll yet |
| | `rolling` | Damage roll reserved/in progress |
| | `rolled` | Damage result saved; awaiting application |
| | `applying` | Native damage application started; duplicate application blocked |
| | `applied` | Most recent damage application complete, or GM reviewed it; selected-token application remains reusable |
| | `review` | Native application failed; GM review required |
| `data-pneuma-outcome` | `none` | Exchange not resolved |
| | `hit` | Resolved attack hit |
| | `miss` | Resolved attack missed; manual damage override remains possible |

Exchange `applying` concerns Evasion payment. Damage `applying` concerns HP/armor/shields. An interrupted final write can leave damage `applying` pending GM review, so it is not proof that HP has not changed. Damage does not change the original hit/miss outcome.

```css
.pneuma-combat-message[data-pneuma-exchange-state="waiting"] .pneuma-pending-status {
  font-style: italic;
}
.pneuma-combat-message[data-pneuma-damage-state="rolled"] .pneuma-damage-controls {
  margin-top: 8px;
}
.pneuma-combat-message[data-pneuma-damage-state="review"] .pneuma-damage-status {
  font-weight: bold;
}
```

## Section and control classes

| Class | Portion / availability |
|---|---|
| `.pneuma-pending-exchange` | Weapon/status frame before resolution; also reused for payment and cancellation |
| `.pneuma-pending-title` | Inset weapon title |
| `.pneuma-pending-status` | Waiting, payment or cancellation message |
| `.pneuma-defense-controls` | Defender choice/payment buttons; paid evasion reads `Evade for X Luck`, penalized evasion `Evade at -X`, otherwise `Evade`; available to defender owner or GM |
| `.pneuma-cancel-exchange` | Separate GM-only cancellation button while waiting |
| `.pneuma-attack-result` | Resolved native attack card |
| `.pneuma-attack-subtitle` | Attack mode on left, ammunition on right |
| `.pneuma-defense-result` | Native Evasion card, only when a defense was rolled; may include LUCK fee text |
| `.pneuma-roll-winner` | Winning attack or defense section |
| `.pneuma-roll-loser` | Losing attack or defense section |
| `.pneuma-combat-outcome` | Result row beneath attack/defense; damage drop first, then result text |
| `.pneuma-hit` / `.pneuma-miss` | Colored hits/misses word |
| `.pneuma-result-damage` | Result-row damage button on managed exchanges |
| `.pneuma-damage-result` | Native damage roll and status; exists once damage is reserved, even before dice exist |
| `.pneuma-damage-status` | Damage progress/application/review text |
| `.pneuma-damage-controls` | Application controls in their own box below damage dice; recovery controls use .pneuma-damage-recovery-controls |
| `.pneuma-damage-heading` | Damage label left, ammunition right; replaces the repeated weapon heading |
| `.pneuma-damage-label` / `.pneuma-damage-ammo` | Header text fields |
| `.pneuma-damage-application` | Application box below the native damage dice/result |
| `.pneuma-apply-damage` | Native-style clickable lightning-bolt anchor; text beside it is not clickable |

The result damage button uses `[data-action="pneumaRollDamage"]`. It remains visible on managed hit and miss results, but becomes disabled after damage starts or for users without attacker ownership/GM permission. Use `:disabled` to style that condition. Older cards lacking managed damage context may retain a native damage control instead.

Defense and damage controls are appended asynchronously during rendering. Do not assume they exist for every viewer or immediately when the root class appears. Button order and visible wording are not a stable selector contract. Application bolt anchors use `.pneuma-apply-damage[data-pneuma-damage-target="recorded"]` and `.pneuma-apply-damage[data-pneuma-damage-target="selected"]`. Their labels are the recorded target name and “to selected target”; both have an aria-hidden `.fa-bolt` icon and descriptive accessible label. Selected still means one controlled token, captured on click.

## Native classes retained

Within attack, Evasion and damage sections:

- `.rollcard`, `.rollcard-top`, `.rollcard-bottom`, `.cpr-block`: native frame structure.
- `.rollcard-subtitle-center`, `.rollcard-subtitle-2-center`: attack mode/ammunition fields.
- `.d10-rollcard-data`, `.d10-dice-div`, `.d10-number-div`, `.d10-data-div`: attack/Evasion dice, totals and details.
- `.d6-rollcard-data`, `.d6-dice-div`, `.d6-number-div`, `.d6-data-div`: damage dice, totals and details.
- `.clickable`, `[data-action="toggleVisibility"]`, `[data-visible-element]`, `.hide`: native result-expansion behavior. Do not override `.hide` globally.

Evasion detail classes referenced by `data-visible-element` are prefixed with `pneuma-defense-` so expanding the attack does not also expand Evasion. For example, `.d10-data-details` becomes `.pneuma-defense-d10-data-details` within the Evasion result.

Native classes belong to Cyberpunk RED and may change with system versions. Always scope styling to Combat Tools:

```css
.pneuma-combat-message .pneuma-damage-result .d6-number-div {
  font-size: 48px;
}
```

Winner/loser shading is currently applied to `.cpr-block::before`, retaining native border colors. Native frame colors use `--cpr-background-chat-card-block` and `--cpr-background-chat-card-block-before`.

## Adjacent dialog hooks

These are in native pre-roll dialogs, outside the chat-message root:

- `.pneuma-evasion-note`: named penalty / mandatory LUCK notice.
- `.pneuma-unaware-choice`: GM-only Defender is unaware checkbox row.

## Design maintenance

For every new or changed card design:

1. Preserve whole-message scope and accurately expose its states.
2. Add or update section/control selectors in this document.
3. Describe state meanings, native markup, permission/visibility limits and one scoped styling example.
4. Update IMPLEMENTED_FEATURES.md; explicitly document selector renames/removals.
5. Verify relevant render/reload and state transitions. Automated fixtures do not replace live Foundry verification.

Implementation: `src/scripts/combat-resolution.ts`, `src/scripts/damage-flow.ts`, `src/scripts/native-combat.ts` and `src/styles/pneuma-combattools.css`. This document is included in the built module under `docs/`.

### Selector change: defense cost label

`.pneuma-defense-note` was removed. The current mandatory LUCK cost or roll penalty now appears directly in the Evade button label. Availability explanations are retained in its `title` tooltip and `aria-description`; no separate note is rendered above the buttons.

### Damage header design

The repeated weapon title is removed from the displayed damage section. The native ammo label is preserved; when absent its slot is empty. Dice, critical bonus, Autofire/location details and expandable modifiers remain native. Application controls remain after damage is rolled/applied for an exchange participant owner or GM; recipient ownership is validated before application. The result-row blood drop still rolls damage; lightning bolts apply it. Recovery controls appear in their own labeled recovery section.

```css
.pneuma-combat-message .pneuma-damage-heading { padding-inline: 12px; }
.pneuma-combat-message .pneuma-apply-damage[data-pneuma-damage-target="selected"] { font-style: italic; }
```

### Damage application links

`.pneuma-damage-recipient` is a plain text row with a leading `a.pneuma-apply-damage` lightning bolt. Only the bolt activates damage; the name/text is not a button. Existing recorded/selected data selectors are retained on the anchor. Anchors support Enter/Space and use `aria-disabled="true"` during a request. Recovery controls remain ordinary buttons.

### Application completion and repeat use

The application box is below the dice. Its inner native frame is .pneuma-damage-application-box.
The recorded-target bolt remains visible and gets aria-disabled="true" after its one application. The selected-target bolt stays available for repeated deliberate applications, including to the same token. Each click uses defaults (Shift-click for native options), verifies ownership and serializes updates. Only the recorded-target action is permanently one-time. Interrupted/uncertain application still requires GM review before further writes.

The previous .pneuma-damage-indicator, .pneuma-damage-unapplied and .pneuma-damage-applied icons are removed. The recorded bolt's disabled gray appearance supplies the completion cue; normal rolled/applied states have no status sentence. The root damage state describes the most recent application, not a permanently closed card.

### Evasion icon

The waiting-state Evade button includes an aria-hidden `.pneuma-evade-icon` using Font Awesome `fas fa-person-running`, before its existing cost/penalty label. Do not Evade and Finish payment do not receive the icon. Example: `.pneuma-combat-message .pneuma-evade-icon { margin-right: 4px; }`.

## Resolution section structure

Newly created or updated exchange content has a .pneuma-resolution-card wrapper inside
.message-content. The existing outer .pneuma-combat-message and its state attributes
are unchanged. Stored historical cards receive the new structure when the exchange
next updates; this change does not rewrite chat history.

Every section has the following direct children:

- .pneuma-resolution-label: a real h4 label, horizontal by default.
- .pneuma-resolution-body: the section's content, including its native roll markup.
- Both also have section-specific classes: for example,
  .pneuma-resolution-attack-label and .pneuma-resolution-attack-body.

| Container | data-pneuma-section | Content / availability |
|---|---|---|
| .pneuma-resolution-pending | pending | Pending weapon/status and .pneuma-pending-controls; waiting, evasion payment, or cancellation only |
| .pneuma-resolution-attack | attack | Full native resolved attack, including weapon, dice, total and expandable details |
| .pneuma-resolution-evade | evade | Full native Evasion and optional .pneuma-evasion-cost; only when Evasion was rolled |
| .pneuma-resolution-result | result | Existing outcome row, .pneuma-result-summary, hit/miss text and damage-roll control |
| .pneuma-resolution-damage-roll | damage-roll | Native damage roll and progress/review status, once damage is reserved |
| .pneuma-resolution-damage-apply | damage-apply | Existing native application frame; exists once a damage result is saved; controls remain permission-dependent |
| .pneuma-resolution-recovery | recovery | Retry/release/GM-review controls, only when needed and permitted |

All containers also have .pneuma-resolution-section. Labels and content are separate
objects so a skin can position a label vertically without changing native roll markup
or moving event handlers. The attack section remains one container around all its content.

.pneuma-damage-result groups damage roll, application and the empty
.pneuma-resolution-recovery-slot. Recovery is populated asynchronously.
.pneuma-damage-recovery-controls now holds recovery buttons; .pneuma-damage-controls
holds application links. This is a selector change for skins previously styling
recovery through .pneuma-damage-controls. No other existing selector is removed.
Existing .pneuma-attack-result, .pneuma-defense-result and winner/loser classes remain
on their respective section containers. .pneuma-damage-result is now a div grouping
the labeled sections; skins should use class selectors rather than element names.

Pending defense controls now mount inside .pneuma-pending-controls, within the
pending section. Legacy cards lacking that slot retain the message-content fallback.
No rolled attack, defense or damage markup is emitted in pending/cancelled content.

Default section CSS only adds spacing, minimum-width handling and inherited label
typography. Existing native frames remain intact; no new palette, frame design or
vertical text is imposed. Existing result colors and winner/loser accents are unchanged.

Example optional skin (not enabled by Combat Tools):

```css
.pneuma-combat-message .pneuma-resolution-attack {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
}
.pneuma-combat-message .pneuma-resolution-attack-label {
  writing-mode: vertical-rl;
  justify-self: center;
}
.pneuma-combat-message .pneuma-resolution-attack-body {
  grid-column: 2;
}
```

Native classes, hidden details, data-action attributes, ownership checks and message
visibility rules remain unchanged. Structural sections never grant permission to
roll or apply damage. Do not reveal hidden native details or insert controls via CSS.


## Damage application controls and compact results

Normal click on either recipient bolt applies damage with native defaults (shield,
role reduction, Active Effect reduction, and brain reduction enabled).
Shift-click opens the native CPR damage-options dialog for that recipient; canceling
does not apply damage. Shift+Enter/Space on the focused bolt also requests options.
The always-visible option fieldset has been removed.

The native application renderer supplies the actual applied damage and breakdown.
Managed applications append a compact horizontal Name / Damage / Location row to the
resolution card instead of publishing a separate application message. The number is
larger than the surrounding text and retains native toggleVisibility behavior.
Each application has a unique detail class, so clicking one number does not expand
the damage-roll breakdown or another recipient's details. The native undo glyph is
retained inside the expandable details. No damage formula is recalculated by the module.

Rows append for additional recipients and deliberate repeated selected-token
applications. The recorded-target one-time guard and reusable selected-token action
remain unchanged. Old separate application messages are not migrated.

| Selector | Purpose |
|---|---|
| .pneuma-damage-applications | Appended application rows inside the damage-apply section |
| .pneuma-damage-applied | One native-derived result container |
| .pneuma-damage-applied-row | Compact horizontal name/number/location row |
| .pneuma-applied-name | Recipient token name captured during application |
| .pneuma-applied-number | Larger native clickable HP/REZ reduction |
| .pneuma-applied-location | Localized location, including body |
| .pneuma-applied-details | Hidden native calculation and undo control |
| .pneuma-damage-status-effects | Status picker button and saved effect names |
| .pneuma-damage-status-slot | Square status slot: + when empty, native icon when filled |
| .pneuma-damage-status-slot[data-status-id] | Filled slot; title identifies the selected effect |
| .pneuma-apply-critical | Independent recipient injury dice link |
| .pneuma-damage-status-picker | Status popup content, outside the chat root |
| .pneuma-damage-status-choice | Status checkbox/icon/label |

Selector removals: .pneuma-damage-options, .pneuma-damage-option and
data-pneuma-damage-option are removed with the always-visible checkboxes.
.pneuma-apply-damage and data-pneuma-damage-target are unchanged.
Native .clickable, data-action="toggleVisibility", .hide and reverseDamage attributes
are retained; the native generic detail class is replaced with a per-application class.

Native damage calculations still run on the actual actor. A call-specific actor view
identifies only this invocation's summary when temporarily intercepting the native
renderer; unrelated native applications, including to the same underlying actor,
retain their original publication path. The renderer is restored after success/failure.
Capturing/rendering failure after a mutation uses the existing review state, without
automatically reapplying damage. Embedded results inherit the resolution message's
visibility. Native undo does not remove separately attached statuses or rewrite the
saved row; native actor/token identity limitations still warrant live verification.

Critical links remain reusable independently of damage application and follow the
native duplicate-injury policy. Status selection still applies to the selected damage
recipient. Native injury cards remain separate.

Example:
```css
.pneuma-combat-message .pneuma-damage-applied-row { gap: 4px; }
.pneuma-combat-message .pneuma-applied-number { font-size: 20px; }
```

## Three right-aligned status slots

.pneuma-damage-controls uses two columns: recipient links on the left and .pneuma-damage-status-effects on the far right, spanning both recipient rows. Three 24px square .pneuma-damage-status-slot buttons appear in one row. Each has data-pneuma-status-slot (0–2), + when empty, or the native effect icon when filled. A filled slot also has data-status-id; its title/aria-label identifies the effect. Click to select/replace an effect; None removes it and compacts the remaining effects. Other selected effects are disabled in the picker to avoid duplicates. Maximum is three.

Removed selectors: .pneuma-add-damage-status and .pneuma-damage-status-summary. The popup now selects one effect per slot rather than editing a multi-checkbox list.

Updated visible resolution messages scroll within #chat-log to show the full card when it fits. Oversized cards align their bottom so new content is visible. ResizeObserver follows asynchronous card growth; loading unrelated chat history does not trigger scrolling.

### Damage roll shortcut and icon contrast

The result blood-drop rolls with native defaults on normal click; Shift-click forces the native damage-roll dialog. This is independent of Shift-click on an application bolt, which opens native application options. Canceling a damage dialog releases its reservation.

Three status slots remain right-aligned. Slots and popup effect icons use dark gray (#333) backgrounds, thin near-black (#111) borders and a subtle radius/shadow to resemble Token HUD icon wells and keep white art visible. Slot hover/focus uses #444. Existing classes remain unchanged. Older four-effect records display/use their first three effects on future applications; already applied effects are not removed from actors.

### Restrained default headings and icon contrast

Attack, Evasion, Result and Damage roll structural label nodes remain present but are hidden by a zero-specificity default display rule. Skins can restore them with .pneuma-resolution-label { display: block; }. Pending, Apply damage and Recovery labels remain visible.

Paid Evasion uses .pneuma-evasion-heading on its native title row with .pneuma-evasion-cost aligned right as N LUCK; the old standalone paragraph is removed. The cost class is retained on a span.

Status slots also paint the icon background itself and use a #chat-log scoped override for native chat-button styles. --pneuma-status-background, --pneuma-status-border and --pneuma-status-hover-background allow skins to override the dark defaults. Picker icon styling is unchanged.

### Improvised damage choice

The resolution-card .pneuma-improvised-damage label/select has been removed. The choice now appears only in the native attack dialog as li.dialog-item.flexrow.pneuma-improvised-damage-choice, before .total-mods, containing a label and native select. Players and GMs can select the GM-agreed 1d6–6d6; confirmation is disabled until selected. The value persists across dialog rerenders and is saved on the exchange. Other attacks omit this row. Native roll/card classes and sections remain unchanged. Example: .pneuma-improvised-damage-choice select { max-width: 8em; }.

CTH menu migration: li[data-brawling] was replaced by li[data-attack-category], with values attack, melee, brawling and thrown. Update any external selectors using the old attribute. Thrown rows have a single column; other attack rows retain native button and mode columns.
