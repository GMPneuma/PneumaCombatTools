# Combat Tools chat-card styling

This is the styling contract for Combat Tools exchange cards, using native Foundry v12/Cyberpunk RED card markup. It does not require Visual Tools. Update this document whenever a card design is added or changed.

## Whole-message scope

The outer Foundry `.chat-message` element receives `.pneuma-combat-message` when it represents a visible Combat Tools attack/Evasion, grapple, QuickHack, or AoE card. This includes its sender, timestamp, content and appended controls. The message itself is not wrapped. Attack/Evasion content retains .pneuma-resolution-card, grappling retains .pneuma-grapple-card, QuickHack retains its own scoped root, and AoE uses .pneuma-aoe-card.

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

### Shared Cyberpunk status list

Damage-card status slots and picker now read the native Cyberpunk master list and custom statuses. Their existing CSS classes and three-slot layout remain unchanged. Native injury mechanics are applied through the shared status subsystem. The token HUD adds .pneuma-status-tray, .pneuma-status-grid, and details.pneuma-status-group while retaining .effect-control nodes. See [Status effects](status-effects.md).


## QuickHack cards

Root: `.rollcard.pneuma-quickhack-card`. Jack-In, QuickHack and Force Out results reuse `resolutionSection("result", ...)`, emitting `.pneuma-resolution-section`, `[data-pneuma-section="result"]` and `.pneuma-resolution-body`. Native `rollcard-top` and `cpr-block` are retained. Native Interface dice are embedded in Jack-In/QuickHack results. Force Out embeds native Concentration and player Interface templates in its combined result; NPC resistance remains an automatic total. Damage remains a separate CPR template.

Jack-In, QuickHack and Force Out roots use `data-state="success"` or `"failure"`; for Jack-In that means undetected/detected, not denied access. `.pneuma-quickhack-effect` changes from resolving text to a manual/automated effect summary; `.failure` marks a failed automatic effect. Controls are `[data-quickhack-action="force-out"]` and `[data-quickhack-action="damage"]`. Force Out is shown to defender owners/GMs; damage is shown to attacker owners/GMs. Obsolete encounter connections remove both controls. Disabling QuickHack removes controls, including native damage application links, and captures clicks on already-rendered cards.

GM routing determines whole-message visibility and attacker-name disclosure; NPC rolls are GM-blind through the shared native hidden-roll helper. No CSS substitutes for message audience restrictions. Example: `.pneuma-quickhack-card[data-state="failure"] .pneuma-resolution-result-body`. No existing Combat Tools selectors were removed or renamed. The old external module’s `.pneuma-quickhack-result-rollcard` selectors are not copied.

### Combined QuickHack roll and result

Outer reskin scope remains `.rollcard.pneuma-quickhack-card`. Named containers are `.pneuma-quickhack-heading`, `.pneuma-quickhack-participants`, `.pneuma-quickhack-roll` (also `[data-quickhack-section="roll"]`), `.pneuma-quickhack-result`, `.pneuma-quickhack-outcome`, `.pneuma-quickhack-detail`, `.pneuma-quickhack-effect`, and `.pneuma-quickhack-actions`. Result section attributes, state attributes and button selectors above are unchanged.

The roll container retains CPR's native rollcard-bottom, cpr-block, dice images, total, breakdown and toggleVisibility attributes. Only its duplicate native rollcard-top title is hidden by scoped CSS. The outer heading supplies the action name, DV for QuickHacks, and participants. The result supplies the outcome, opposed totals where permitted, effect summary and owner-specific buttons. An empty action container is hidden. Styling inherits theme colors; no global CPR selectors change.

Combined cards inherit result-message visibility. Private NPC rolls are never embedded in player-visible results: their native dice remain in a separate blind GM message. GM-only NPC results and player rolls combine. No CSS or hidden markup carries private dice to other recipients. Force Out now publishes one result after the contest, embedding Concentration and player Interface rolls rather than publishing standalone roll messages. Damage publication is unchanged.

Example: `.pneuma-quickhack-card .pneuma-quickhack-heading { padding: 8px 10px; }`. No existing scope or action selectors are removed. Browser checks cover embedded roll visibility, suppressed duplicate headings, narrow layouts, native controls and master-off behavior; live Foundry appearance still needs verification.

## Grapple cards

- Root: .pneuma-grapple-card; independent of .pneuma-resolution-card and the attack/Evasion state attributes.
- Native classes retained: rollcard, rollcard-top, cpr-block and rollcard-bottom; opposed results retain native skill-roll markup.
- Sections: .pneuma-grapple-note (current outcome/restrictions), .pneuma-grapple-rolls (both native roll results after the response), .pneuma-grapple-controls (per-user controls).
- Root data-state: waiting, choice, active or ended. Incomplete cross-document operations replace ordinary controls with Retry plus the GM End control.
- Controls: Roll Brawling; Hold Target/Take Held Object; Choke/Throw/Release; Escape; End (GM). Target/actor ownership governs controls and is rechecked by the GM authority.
- Visibility: native roll mode is retained; hidden/blind content is never decorated for an unauthorized viewer. Waiting cards omit the attack result. Names and notes are escaped. Active state comes from the originating Combat document; out-of-combat records use the scene. Ended records use the stored chat snapshot.
- Example selector: .pneuma-grapple-card[data-state="active"] .pneuma-grapple-controls button
- No existing card selectors were removed or renamed.

Grapple render hooks preserve existing card and native roll DOM nodes. Only data-state, the note text and permission-specific controls are refreshed in place. Roll content changes through the normal ChatMessage update/render lifecycle, preserving Chat Dice artwork and other modules' decorations regardless of hook order. Repeated renders rebuild only the controls without duplicating buttons.

Each resolved opposed Brawling result wrapper uses the existing .pneuma-roll-winner / .pneuma-roll-loser classes, including Escape and third-party Break Grapple. The acting character must beat the responder; a tie styles the responder as winner. Pending rolls receive neither class. Saved older wrappers are decorated in place, preserving modified dice and native listeners. Example: .pneuma-grapple-rolls > .pneuma-roll-winner .cpr-block::before.

## Shared presentation and growth behavior

card-structure.ts supplies common message classification, visibility checks, non-destructive message decoration, outcome classes, and opposed-roll decoration. The shared outer .pneuma-combat-message scope now covers all three workflows, with data-pneuma-card-kind equal to exchange, grapple, or quickhack. Attack-specific state attributes remain exclusive to attack/Evasion cards. Existing selectors are retained; the shared scope is intentionally broadened. Example: .pneuma-combat-message[data-pneuma-card-kind="grapple"] .pneuma-roll-winner.

resolution-scroll.ts is registered once from main.ts, independently of individual workflow registration. Updated visible module cards are kept within the chat log using the same ResizeObserver behavior for attack/Evasion, grapple, and QuickHack. Cards taller than the viewport reveal their bottom controls. Late renders and later content growth reattach/scroll as needed; initial history rendering and ordinary or hidden chat do not trigger scrolling. Deleting the watched message disconnects its observer.

All workflows must preserve existing native roll nodes during render hooks. Shared helpers change classes, attributes, and owned control areas only; roll/content replacement occurs through ChatMessage updates before module render hooks. Workflow-specific authorization and rules remain separate.

Grapple active-state notes now state that the held token follows the grappler. Card markup, controls, state selectors and native dice scope are unchanged by token following.

Release, Choke and Throw on an established grapple require no new Brawling roll or opposed response. Their result displays use the action name and omit the original Grab dice; the original roll data remains saved in grapple metadata. Grab, Escape and Break Grapple still use opposed Brawling.

### Combined Force Out / Eject NetRunner card

Root and whole-message scope remain `.rollcard.pneuma-quickhack-card` and `.pneuma-combat-message[data-pneuma-card-kind="quickhack"]`. The heading uses `.pneuma-quickhack-heading` and `.pneuma-quickhack-participants`. Each embedded roll uses `.pneuma-quickhack-roll[data-quickhack-section="roll"]`, a descriptive `h4`, and `.pneuma-roll-winner` or `.pneuma-roll-loser`; nested native CPR dice markup and interactions remain intact, including Chat Dice decoration. Native duplicate roll headings stay hidden by the existing selector. The outcome retains `[data-pneuma-section="result"]` and `.pneuma-quickhack-result`. Root success means ejected; failure includes ties. The final card adds no controls and uses the shared chat presentation/scroll behavior.

Both rolls and outcome are published together to the originating awareness message's audience after resolution. NPC resistance has an automatic total rather than a native role card. If identity is hidden, no native Interface HTML is embedded that could disclose it. Current Jack-In/QuickHack identity settings govern the CTH and newly generated ejection card; either detected event identifying the same connection permits its name. Unaware connections remain unavailable. Prior messages are not rewritten.

Example: `.pneuma-combat-message[data-pneuma-card-kind="quickhack"] .pneuma-quickhack-roll.pneuma-roll-winner`. No selectors were removed or renamed.

## Area attack cards

Root: `.rollcard.pneuma-aoe-card`; whole-message scope: `.pneuma-combat-message[data-pneuma-card-kind="aoe"]`. The shared growth/re-render scroll observer applies. Root `data-state`: scatter, waiting, resolved.

Sections retain `resolutionSection` attack/result/damage-roll/damage-apply markup and native CPR `rollcard`, `rollcard-top`, `cpr-block`, dice markup and data-action hooks. Attack dice are omitted from rendered content until target choices finish; saved flags follow the existing ordinary-display privacy contract. Defense rolls use `.pneuma-aoe-defense.pneuma-roll-winner` / `.pneuma-roll-loser`. Only duplicate defense headers are hidden, preserving custom dice and native interactions.

Targets: `.pneuma-aoe-targets[role="list"]`, `.pneuma-aoe-target[role="listitem"][data-aoe-row]`, and `.pneuma-aoe-response`. Row states: waiting/rolling/hit/miss/other. Accessible icon controls use `data-aoe-action` and `data-aoe-target`: roll, decline, other (Cover Up), move, apply; GM scatter/add/exclude/forcehit/hit/miss/reset/damageReset/damageResolved; shared damage/show.

Only owners/GMs get operative response/application controls; GM requests independently validate ownership and state. Foundry message visibility and roll modes remain authoritative. Cover Up is absent by default and removed on render when disabled. Shared damage retains native dice/details while replacing the global application link with per-target buttons and native application summaries. No new selector replaces existing card selectors.

Example: `.pneuma-combat-message[data-pneuma-card-kind="aoe"] .pneuma-aoe-target[data-state="hit"]`.

AoE visibility: retained control [data-aoe-action="show"] now toggles the shared template. Its icon and accessible label switch between fa-eye / Show attack area and fa-eye-slash / Hide attack area. Every card viewer retains this control regardless of token ownership. The optional GM-only [data-aoe-action="effectsResolved"] marks special ammunition effects complete. Resolution completion is tracked independently of the existing response data-state; automatic hiding waits for responses, blast movement, and damage. Example: .pneuma-aoe-card [data-aoe-action="show"]. No selectors were removed.

Movement HUD: `.pneuma-movement-hud` retains native `.placeable-hud`, `.attribute` and `.control-icon` hooks. The counter comes first; `.pneuma-movement-controls` holds a compact two-column row with the Reset button on the left and `.pneuma-movement-run.control-icon` on the right. Run remains a noninteractive span, shown only for `.is-running` (including `.is-over-budget`). Reset remains owner/GM-only; run stays in column two when Reset is hidden. Example: `#hud .pneuma-movement-hud .pneuma-movement-controls`. No selectors were removed; run moved from above the counter into the lower row.

AoE shape configuration does not change card selectors, sections, response controls, or visibility permissions. The existing Show/Hide control now displays native measured shapes with wall-clipped grid highlights. The card remains .pneuma-aoe-card with its existing data-state values; no selectors were renamed or removed.

AoE Cover Up now resolves to row data-state="hit" with a Cover Up / Prone / SP ×2 / ablation ×2 label. Existing [data-aoe-action="other"] remains the enabled Cover Up control; no selector was renamed. Native applied-damage results append .pneuma-cover-up-damage with the rule explanation. Successful shell and explosive responses retain [data-aoe-action="move"] until relocation; charged distance appears in .pneuma-aoe-response. Legacy other-state rows remain GM-reviewable. Whole-message scope, native dice and shared scrolling are unchanged. Example: .pneuma-aoe-card .pneuma-cover-up-damage.

## EMP selection cards

`.pneuma-emp-card` contains the target heading, selection summary and `[data-emp-select]` native HTML button. `flags.pneuma-combattools.emp` links the message to its Combat request. The button becomes disabled when applied or the combat has ended; it is labeled EMP applied or Combat ended respectively. These whispered cards are visible to GMs, plus affected actor owners for player-choice requests. The selection dialog independently rechecks ownership; the GM rechecks actor ownership, request state and eligible IDs before application.

Native `Dialog`, `.form-group`, checkbox/select controls and Token HUD `.control-icon` markup remain in use. `.pneuma-emp-selection` scopes the selection form and `.pneuma-emp-choice` scopes each item row; random rows show first-draw odds. No existing card selectors are removed. Example: `.pneuma-emp-card [data-emp-select]:disabled { opacity: 0.6; }`.

The applied EMP card adds `.pneuma-emp-result` with the affected item names while its Combat record exists. Names use text content, not HTML. Example: `.pneuma-emp-card .pneuma-emp-result { font-weight: bold; }`.

### AoE shared damage controls

Within `.pneuma-aoe-card`, `[data-aoe-action="damage"]` uses `fas fa-droplet` and `[data-aoe-action="apply"]` uses `fas fa-bolt`. Existing titles, aria-labels, owner/state checks and Shift-click options remain. `.pneuma-aoe-attack [data-action="rollDamage"]` is removed so native attack controls cannot bypass shared damage. Other native roll nodes and expansion controls are retained. Example selector: `.pneuma-aoe-card [data-aoe-action="apply"] .fa-bolt`. Rendering also updates older saved AoE cards without rebuilding their dice nodes.

AoE `[data-aoe-action="show"]` is visible only to GMs. Both show and hide requests require GM authority.

AoE cards use roll-only shared damage rendering: the bottom retains `data-pneuma-section="damage-roll"` and native dice/breakdown, but omits the shared `damage-apply` section and empty recovery slot. Per-target lightning controls remain inline; applied results appear below the shared damage roll. Ordinary single-target cards retain their application section. Older AoE cards lose the redundant bottom section when rendered.

AoE applied-damage summaries now collect in `.pneuma-damage-applications.pneuma-aoe-applications` directly after `.pneuma-damage-result`. They retain the normal damage result markup, expandable breakdown and undo controls. No empty application box is added; lightning buttons remain beside each target. This supersedes placing summaries between target rows.


AoE attack dice animation: new area attacks retain their native attack dice and release them through CPR Dice So Nice handling after scatter placement and every waiting/rolling response resolves. The saved roll mode is retained. A persisted reveal flag prevents later damage, movement, visibility updates or chat rerenders from repeating the animation; legacy cards do not replay. Card attack visibility uses the same response condition. Automated fixture verification only.


## Instant effects and ammunition colors

Area targets retain .pneuma-aoe-target[data-aoe-row] and their original response controls. Their inline --pneuma-ammo-color supplies the left border; ammunition names remain in the card title. Matching colors also apply to native placement previews and persisted attack templates. Supported effect rows add .pneuma-instant-effect[data-effect][data-state] below the affected target. States: pending, rolling, failed, resisted, applying, applied, skipped, review. Standalone ad-hoc cards use .rollcard.pneuma-instant-card.

Controls use [data-instant-action] and [data-instant-scope]: roll, apply, skip (GM), reset (GM), review (GM), wake and extinguish. Native resistance HTML remains in .pneuma-instant-roll, and direct-HP dice in .pneuma-instant-damage; native rollcard/dice/detail hooks are retained. Owners/GMs receive controls, and the GM independently validates actions. Message visibility and roll mode are inherited. Add effects retains .pneuma-damage-status-picker and its radio controls, with Instant Effects and Status Effects headings.

[data-aoe-action="removeSmoke"] is GM-only. Existing [data-aoe-action="effectsResolved"] remains for legacy/unknown special ammunition. .pneuma-smart-first wraps the initial Smart miss; the second native roll follows it. No existing selectors are renamed or removed.

Example: .pneuma-aoe-card .pneuma-instant-effect[data-effect="poison"] { border-color: var(--pneuma-ammo-color); }

Browser fixtures verify compact card width, effect controls and animation. Live multi-client card visibility remains to be checked.


## Broken Ribs movement warning

Root: `.pneuma-injury-card.rollcard[data-injury="broken-ribs"]`. Retains native `.rollcard-top`, `.cpr-block` and `.rollcard-bottom` for the character/injury heading and movement warning. `[data-state]` is `pending`, `withdrawn` (movement reset to 4m/yd or less), or `applied`. Native ChatMessage speaker, whisper visibility and surrounding chat controls remain. This card contains no roll or armor application; its fixed damage goes directly to HP.

`[data-ribs-apply]` is a standard button labeled **Apply 5 damage**, visible to the affected actor's owners and GMs. The card is whispered to those owners and GMs; NPC reminders are GM-only unless an NPC has an owner. Applied or withdrawn cards omit the button; ended-combat cards disable it. Server-side validation also rejects reset-combat cards. No timeout or automatic damage application. Area Evasion buttons retain their existing selectors and now show the leg restriction as a disabled-button tooltip, refreshing when injury/item state changes.

Example selector: `.pneuma-injury-card[data-state="pending"] [data-ribs-apply] { font-weight: bold; }`.

## Quickhack effect summaries (unreleased)

Existing .pneuma-quickhack-card .pneuma-quickhack-effect summaries now report timed MOVE, native fire and temporary injury/sleep application. Root, sections, state selectors, native roll classes, visibility, and controls remain unchanged. Example: .pneuma-quickhack-card .pneuma-quickhack-effect { font-weight: 600; }. Detection uses existing HUD message animation and owner-filtered situational tiles; no chat selector was removed.

## Shared cyberware disablement (unreleased)

Quickhack summaries retain .pneuma-quickhack-effect and report pending selection or no eligible components. Selection cards retain .pneuma-emp-card, [data-emp-select] and .pneuma-emp-result; source names/durations distinguish EMP, Short Circuit, Cyberware Malfunction and Microwaver. Malfunction selections are whispered to GMs and owners of the attacking Netrunner.

Microwaver uses .pneuma-instant-card and .pneuma-instant-effect[data-effect="microwaver"], native roll markup and existing resistance controls. A successful Combat Tools hit creates it once, preserving whispers/blind visibility. No ordinary weapon damage button is shown. Example: .pneuma-instant-effect[data-effect="microwaver"] { border-color: #47c9dd; }.

## EMP method and shortlist presentation (unreleased)

The existing .pneuma-emp-card, [data-emp-select], .pneuma-emp-selection, .pneuma-emp-choice and .pneuma-emp-result selectors remain. Cards now distinguish manual selection, random selection and a saved player shortlist. Counts/durations remain source-specific. Random dialogs use **Draw and disable**; player random dialogs omit the inventory preview. Shortlist dialogs use the saved candidate set and require only the entitled count, with no unoffered parent labels on player clients. Player shortlist results list selected names; GMs see all affected names, including cascade results. Whispers continue to follow the entitled chooser's actor ownership.

Example: .pneuma-emp-selection .pneuma-emp-choice { padding-block: 2px; }. No native roll classes or resistance-card controls are changed. The settings window uses .pneuma-emp-settings, profile fieldsets and existing Foundry form-group controls.

- EMP results: .pneuma-emp-card .pneuma-emp-result includes Hardened — unaffected names for consumed protected selections, and No items disabled for a fully resisted draw. Same whisper recipients and saved shortlist visibility; native selection button and card scope unchanged.

- Grapple follow-up controls now live in Self-CTH Close Combat: grappler Choke/Throw/Release, defender Escape with grappler name. Established grapple actions wait until the grappler's next turn (not the establishment round), checked by the GM as well as the HUD. Original opposed-roll card remains intact; subsequent actions post separate results. Chat retains initial response/hold choices and GM recovery controls. Result cards retain original whisper/blind recipients.

- Connected Foreign Object (Body/Head) to Broken Ribs movement damage: distinct injury-labeled cards and once-per-turn receipts, retaining brokenRibs storage and data-ribs-apply control. Private owner/GM delivery and manual Apply 5 damage remain. Full coverage/gaps: docs/body-head-injury-coverage.md.

- Cracked Skull: captured native damage result retains totals/breakdown/undo and adds .pneuma-injury-damage explanatory text for x3 penetrating headshot damage. Actor HP and captured hpReduction/rawDamageDealt/totalDamageDealt reflect the correction; bonus damage is unchanged. Injury reminders use the existing HUD message presentation and do not add chat-action controls.

## Manual rolls and half armor (unreleased)

Manual cards use `.rollcard.pneuma-combat-message.pneuma-manual-card[data-manual-kind="damage|critical|group"]`. Damage retains native roll markup and existing `data-pneuma-section="damage-roll"` / `damage-apply` sections. `.pneuma-manual-controls` holds selected-token application, three `.pneuma-damage-status-slot` Add Effect controls, qualifying injury roll and GM recovery. `.pneuma-manual-receipts` records injury recipients. Native injury cards retain their rollcard/d6 detail classes. No existing selectors removed.

Group requests use `.pneuma-group-dv`, `.pneuma-group-rows > li[data-group-user]` and `.pneuma-group-action`. Rows display Waiting/Rolling/total and optional Success/Fail; native skill detail HTML lives in `details`. Only the owning player or GM sees Roll; GM can release an unfinished row. Hidden DV text is replaced only on GM render. Flags store `manualRoll` state, selected actor/user rows and results. Damage/critical cards retain native whisper/blind modes; group requests are public.

`.pneuma-half-armor[aria-pressed="true"]` marks a local Half Armor SP choice. Native cards retain their `data-action="applyDamage"` control, with its armor-ignore value adjusted before native application. Module cards pass the choice to their existing coordinator; AoE applies it to the chosen row. Armor-bypassing rolls disable the toggle. The choice is for the next application and resets on rerender; it never edits stored armor. Example: `.pneuma-manual-card .pneuma-group-action button { font-size: 12px; }`.

### STAT roll

`.pneuma-combat-message.pneuma-stat-card` wraps the unchanged native base rollcard and `.pneuma-stat-result[data-stat-outcome="success|fail"]`. The result shows STAT name, current value captured at roll time, die result and Success/Fail. No application or response controls. Uses native whisper/blind roll-mode visibility; no GM coordinator or combat state. Example: `.pneuma-stat-card [data-stat-outcome="success"] strong { font-weight: bold; }`. Existing selectors remain unchanged.

### Group-check result presentation revision

The `details`/`summary` Roll details control is removed. `.pneuma-group-total[aria-expanded]` is now the keyboard-accessible toggle; `.pneuma-group-details[hidden]` spans the row below. Opening it removes the native `.d10-data-details.hide` state so stat, skill and modifier totals are already visible; native rollcard classes and modifier tooltips remain. `.pneuma-group-outcome[data-outcome="success|fail"]` colors Success green and Fail red. STAT outcome `strong` text uses the same colors. Existing saved group cards are upgraded when rendered. No visibility or roll permissions change. Example: `.pneuma-group-outcome[data-outcome="success"] { color: green; }`.

### Manual roll configuration UI

The chat icon opens `.pneuma-roll-flyout` with `[data-roll-choice]` menu buttons; Group Check is GM-only. Native dialogs use `.pneuma-roll-dialog .pneuma-manual-form`, `.pneuma-roll-pair`, `.pneuma-roll-checks`, and `.pneuma-roll-hint`. Damage uses a 1d6–8d6 select beside its modifier. Configuration-only change; existing result-card selectors, native roll calculations and visibility modes are unchanged.

- Group-check disclosure correction: every rendered row starts with its full roll hidden. Clicking the row total reveals both the native roll and expanded `.d10-data-details` modifier breakdown; clicking again hides the entire detail block. Visibility is initialized on the rendered DOM so saved HTML or theme display rules cannot leave the roll open by default.

- Group checks now use native `.rollcard-top`, `.rollcard-bottom` and `.cpr-block` styling. `.pneuma-group-heading` places the skill and `.pneuma-group-dv` on one line; replaces the standalone h3/paragraph header. Existing cards receive the updated header on render. Hidden-DV visibility, result colors and collapsed roll details remain unchanged.

- Implemented shared chat-only button styling across attack/evasion, damage, AoE, grapple, Quickhack, EMP, instant effects, injuries and manual/group checks. Half Armor has a checked-box + solid selected fill; actions share sizing, icon treatments, focus, busy and disabled/completed states. Recovery/cancel controls have amber/red borders. Skin tokens and stable-geometry rules are documented in [chat-buttons.md](chat-buttons.md). Existing action selectors and handlers are retained. Supersedes previous per-flow button sizing and faint Half Armor selection styling.

- Cyberpunk roll dialog includes Custom Roll below the standard roll, with aligned count × sides controls rendered as x d y (1–20 dice; 1–100 sides). Separate Roll Cyberpunk / Roll Custom actions. Custom rolls use Foundry dice/rendering and current roll visibility, without the Cyberpunk base/modifier or Critical Success/Failure rules. `.pneuma-custom-dice` styles inputs; `.pneuma-custom-roll-card` retains native generic dice markup.

- Selected chat toggles now use charcoal fill, white text/checkmark and a red border. `--pneuma-chat-button-selected-border` independently controls the selected border for reskinning; sizing and behavior are unchanged.

- Superseding Cyberpunk dialog layout: shared Label and Modifier, Standard Cyberpunk 1D10 / Custom radio choices, and one Roll button. Standard is selected initially; Custom unlocks the 1–20 dice / 1–100 sides inputs. Both modes use the label and modifier. Only Standard uses Critical Success/Failure. `.pneuma-roll-modes` and `.pneuma-custom-roll:disabled` style the choices and locked fields. Replaces the previous two-button layout.

- Damage cards now pair `.pneuma-interact-armor` (default on) to the left of `.pneuma-half-armor` in `.pneuma-armor-controls`. Turning interaction off bypasses SP and armor ablation and disables Half Armor; turning it on restores the original armor calculation. The world setting **Show armor controls on normal damage cards** defaults off; enabling it shows both controls on normal/native/AoE cards. Chat-menu manual damage always shows both. The pair uses a compact two-column grid so controls stay side by side. Manual damage preserves its initial dialog armor choice and allows changing it on the card. Controls use shared toggle skin tokens; shields and native damage options are unchanged.

- AoE decline-evasion tooltip and accessible label now read **Don't Evade**; action and selectors are unchanged.

- Ad-hoc damage uses the same `renderDamage` application-row renderer as normal combat damage: `.pneuma-damage-application-box > .pneuma-damage-controls` contains the bolt + “to selected target” recipient on the left and three `.pneuma-damage-status-slot` controls on the right. Ad-hoc cards omit the recorded-target row and retain creator/GM effect-edit permissions, shared Shift-click armor/application options, and their existing critical-injury/recovery actions. The separate manual application/effect-slot builder is removed.

- Both normal and ad-hoc damage cards persist selected-target applications in `damage.selectedTargets` and rebuild an “Applied to” list (`.pneuma-damage-target-history`) from that state on every render. Each successful selected-target application adds one named entry; repeated deliberate applications remain separate. Names are HTML-escaped. Native numeric receipts remain expandable below the list. Message writes use state snapshots to avoid sharing mutable in-flight damage state with document updates.

- Add Effects picker: collapsible Instant Effects, Body Crits, Head Crits, Drugs, Pharma and Misc sections, omitting empty categories, addiction entries, and Lightly/Seriously/Mortally Wounded statuses. Instant Effects opens initially; editing a slot opens its current category. Native details/summary controls support keyboard navigation; duplicate choices remain disabled and None clears a slot. Custom configured statuses fall back to Misc. Picker scope: `.pneuma-damage-status-picker .pneuma-effect-category`.

- Manual roll flyout now has a Manual Rolls header (`.pneuma-roll-flyout-title`). Opening focuses the menu itself, leaving all choices unselected; arrow keys focus the first/last choice. Hover and keyboard focus still highlight individual actions without shifting layout.
