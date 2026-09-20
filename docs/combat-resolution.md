# Combat resolution — first test version

Start an attack through Combat Tools with one owned attacker selected and a target. The GM/world **Combat resolution** switch is on by default. Disabling it restores the native attack routing. This does not intercept sheet or macro attacks.

1. Confirm the native attack dialog. Native weapon/ammo handling runs. The attack roll and its dice stay undisplayed while the card awaits a defense choice.
2. The defender's owner or a GM chooses **Evade** or **Do not Evade** on the attack card.
3. Evade opens the native Evasion pre-roll dialog. A read-only **Additional ranged evasion: −N** row appears above Total Mods when appropriate. It is a real named modifier, included in the total and expandable result breakdown.
4. Paid attempts show **This evasion will spend XX Luck** in the same section. This fee does not increase the roll. Optional native Spend LUCK adds its usual bonus and is charged separately.
5. Canceling the dialog spends nothing and consumes no allowance. Confirmation rechecks the price and LUCK, commits the exact roll, charges once and reveals the result. Ties favor the defender.
6. Do not Evade compares ranged attacks with their range DV. Declining melee/unarmed defense is treated as an undefended hit.
7. On a hit, the attacker or GM clicks the blood drop or **Roll damage**. The native damage dialog starts with the original aimed location and Autofire margin (capped by the native weapon/ammo maximum). The dialog remains editable. Canceling releases the roll without applying damage.
8. Native damage appears on the same exchange card. The defender owner or GM clicks **Apply damage to [defender]**, uses defaults or Shift-clicks for native shield/reduction options, and the GM runs native armor, critical bonus, ablation and HP handling for that original defender. Apply to the recorded target by default, or explicitly choose Apply to Selected Token to redirect damage. The card records rolled, applying and resolved states.
9. Duplicate submissions cannot reapply damage. If native application fails after a partial update, the GM checks HP, armor and shield, finishes any missing changes manually, then uses **Mark resolved after GM review**. No automatic retry of uncertain damage. A GM may release an unfinished damage-roll reservation after confirming its dialog is closed; that does not undo damage.

## Homebrew evasion: GM and player instructions

**GM setup:** Homebrew ranged evasion requires a started combat encounter, even for a flat penalty or LUCK cost with no free evasions. Add the attacker and defender to the intended encounter and start combat before making the attack. An encounter that has not started is insufficient. Save both the main Ranged Evasion setting and the separate homebrew rules.

**Players:** Outside a started encounter, homebrew Evade is disabled; its tooltip explains that combat must be started. Ask the GM to start the encounter and make a new attack. With no qualifying One Free Evasion grants, the first evasion costs LUCK or takes the configured penalty; the button shows that cost. Free allowances reset each round, not each turn.

## Settings and scope

- **Hide attack weapon names** replaces the weapon title on these attack cards with Ranged, Melee or Unarmed. This is presentation, not a client-data secrecy mechanism.
- RAW ranged evasion checks current actor REF or an installed Reflex Co-Processor and has no added cost/limit.
- Homebrew evaluates enabled REF, Co-Processor and Solo/Threat Detection qualifiers; uses free grants first; then applies the selected flat/cumulative penalty, LUCK cost or hard limit. Attempts count whether successful or not. Declines do not count.
- Homebrew ranged evasion requires an active combat. Allowances reset by round, not turn. Rewinding below a recorded round blocks tracked evasion until the round is restored; it does not refund resources.
- Melee/unarmed Evasion is unaffected by ranged settings.
- Current prepared REF, installed cyberware and Threat Detection's allocated rank are read from system data. Renamed/unrecognized items and temporarily disabled cyberware require GM review; no reliable native temporary-functionality field was found. Awareness and weapon-specific exceptions are not automatically detected. The GM attack dialog always opens and includes **Defender is unaware**, unchecked for every new attack. Selecting it immediately reveals the attack and skips Evasion without spending defensive resources; ranged attacks still compare against DV, and melee/unarmed are treated as undefended hits.
- The first active GM coordinates defense responses, preventing two cards from spending the same allowance simultaneously. An active GM is required. A GM can cancel a waiting exchange; spent attack ammo/LUCK is not rolled back.
- A pending payment is saved on its card. **Finish payment** resumes that exact result after a write failure; a temporary actor payment receipt prevents double charging until the Combat counter and chat record are saved; the receipt is then removed.
- Native roll privacy is preserved. A privately whispered attack may require the GM to respond if its defender cannot see it.
- The attack is rolled before defense and hidden until the choice is committed, following the agreed workflow. This differs from strict RAW declaration/roll order.
- Chat-card styling is provided independently by Pneuma's Visual Tools. Combat Tools retains combat resolution and works without that module.

## Verification

TypeScript/build and targeted automated tests cover policy combinations, modifier insertion, canceled dialogs, combined mandatory/bonus LUCK, permissions, competing responses, duplicate commits, partial-write retry, target qualification, round reset and rewind handling. Browser fixtures cover pre-roll notice placement and existing chat controls. These checks do not establish live multi-client Foundry compatibility; first live testing is still required.
## Combat-owned tracking

- Counters are stored on the originating Combat under flags.pneuma-combattools.evasionUsage, keyed by encoded defender actor UUID. Linked tokens share a counter within that Combat; unlinked token actors remain independent.
- Each attack captures its combat ID and reset generation before opening the attack dialog. Later responses and card displays use that Combat even if another combat is selected. If both tokens participate in several combats, the selected matching combat is used; otherwise select the intended combat before attacking.
- The same actor has independent allowances in different Combats, but native actor LUCK remains shared.
- Resetting the Combat to round 0 clears its counters and invalidates old pending cards. Deselecting a Combat does not clear anything. Deleting the Combat removes its flags naturally.
- Payment updates still require a short-lived actor receipt because native LUCK and Combat flags are separate documents. The receipt is saved together with LUCK, survives an interrupted write, and is removed after completion. Permanent evasion-use counters are no longer written to actors.
- On GM startup, counters from the initial actor-based implementation move to the Combat recorded in their round reference, then the old actor counter flag is removed. Interrupted payment receipts are preserved.
- Older pending cards without an originating combat reference must be canceled and replaced. They are never guessed into the selected combat.
## Damage boundaries

- Managed damage applies to new Combat Tools exchanges with saved weapon/mode/location context. Existing older cards retain their native damage control.
- Damage uses the original weapon item with its current native damage/ammo configuration when the damage dialog opens. Finish an exchange before changing its ammunition or weapon setup.
- Damage stays on the originating chat message and inherits its visibility. Critical bonus damage is passed separately to the native application; automatic critical injury selection/application is not added.
- Native damage application can publish its own system summary using native privacy behavior. This module does not override that publication.
- A failed damage-result submission can be retried from **Finish damage roll** while that client remains open. Reloading loses an unsubmitted local roll; a GM can release the unfinished reservation and reroll.
- Automated coordinator tests cover damage ownership, captured target, duplicate application, canceled reservations, Autofire margins, native failure and a failed completion write. Browser fixtures cover awareness reset, damage metadata, scoped application controls and retained result expansion. Live Foundry verification remains pending.
- Combat exchange headers show attacker → defender. Attack mode and ammunition share a left/right row; Evasion omits the repeated defender label and Skill subtitle. Winning/losing box interiors use light green/red shading, preserving native borders. Attack/ammo labels have horizontal insets. The result line starts with a fixed-position damage drop on hits and misses; only attacker owners or GMs can initiate damage. It remains visible but disabled after damage starts, preserving duplicate-application protection. Missed Autofire opens with an editable ×1 multiplier for manual review.

- Attack initiation uses the defender captured by the Combat Tools HUD. Token names identify the participants on the card, even when their underlying actor names differ.
- Rolled damage offers **Apply to <target name>** and **Apply to Selected Token**. The latter captures exactly one controlled, owned token when clicked and shows it in the native confirmation dialog. The GM rechecks recipient ownership and records the chosen token UUID; the recorded action is one-time; selected-token applications can be repeated.

- Recorded-target damage is tracked independently from reusable selected-token application. Repeated selected clicks intentionally apply the rolled damage again after native confirmation. Ownership and uncertain-application safeguards remain. Evasion button costs/penalties, mandatory LUCK deduction and named roll modifiers are covered by regression checks; no charge applies to a free allowance or RAW evasion.

## In-card application and attached statuses

The damage card has recipient bolts and three status slots. Normal click
uses native defaults; Shift-click opens the native shield/reduction dialog. The popup lists CONFIG.statusEffects, matching the
world's native token HUD. Select up to three unique effects; reopening lets you remove
or replace them. Canceling makes no changes. Effects are saved with the damage roll
and are shared across its recipient options.

Clicking a recipient's lightning bolt applies damage immediately using defaults or the Shift-click dialog choices, then activates the selected statuses on that same token actor. Statuses are
applied even if armor/shields absorb the damage; conditional effects are deferred.
Already-active statuses remain active. Repeated selected-token applications remain
available. If the selection changed on another client, the application stops before
changing HP and asks for a review of the current card.

A native failure after HP or some effects change enters the existing GM-review state;
do not reapply HP to recover a missing status. Manually finish any missing changes
before marking reviewed. Each click starts with native defaults; the attached status selection is persisted.
Native application summaries are embedded as compact horizontal Name / Damage / Location rows;
clicking the larger damage number opens that application's native calculation/undo details;
undoing native damage does not automatically remove these separately attached statuses.

## Critical injuries

Two or more active, non-discarded sixes in the primary damage d6 roll expose a dice
link beside each recipient. An original aimed head attack uses Head Critical Injuries;
all other attacks use Body Critical Injuries. The link independently rolls/applies an
injury to the recorded token or the single controlled, owned token at click time.
It does not apply HP damage again and remains available for deliberate repeat use.

World settings allow injury controls for Ranged, Melee, Unarmed, Autofire, Explosion,
Grenade, Rocket and Quickhack methods; all default enabled. These switches govern the
injury action, not the system's native +5 critical bonus calculation. Grenade/rocket
launchers and inventory grenade AoE cards record their respective methods. See [Area attacks](area-attacks.md) for shared damage and target responses. These injury settings do not independently create attack workflows.

The adapter uses the system's configured critical injury table compendium and its
native Critical Injuries (Head)/(Body) table and matching injury compendium names.
The native sheet handler owns table drawing, duplicate handling, creation of the
injury Item and its Active Effects, and the injury chat card. Custom/translated
compendia must preserve these native lookup names for this initial adapter.
The native handler's draw/create callbacks finish asynchronously after dispatch.

Older saved damage results without a recorded six count do not get an inferred injury
button. Native sheet injury rolling remains available for those records.
Source inspected: local Foundry-v12-targeted Cyberpunk RED cpr-actor-sheet.js,
cpr-rolls.js, cpr-actor.js and cpr-damage-application-prompt.hbs, plus Foundry v12
toggleStatusEffect types. Browser mocks verify routing but do not establish live
native injury Item creation; live Foundry verification remains required.

### Appended application results

Each managed application appends its native result to the resolution card. Additional recipients and repeat selected-token applications add rows. The native damage-application template supplies the HP/REZ reduction and breakdown; no new formula is calculated. Each row expands independently. Unrelated native damage keeps its separate cards. Historical separate cards are not migrated.

### Native ammunition gate

The system warns during attack-roll creation but does not abort. Combat Tools checks the same native hasAmmo result before opening the attack dialog and again after it closes, before confirmRoll can discharge the weapon. Insufficient ammunition stops the exchange without rolling, spending LUCK or creating chat. Autofire/aimed/ordinary consumption is determined by the native weapon method, not a copied formula. The second check reuses the native out-of-bullets localization when ammunition changes while the dialog is open. Melee and items without a native ammo checker retain their existing behavior.

### Damage-roll shortcut

Click the blood-drop to roll damage immediately using native defaults, including the captured aimed location and Autofire multiplier. Shift-click opens the native damage-roll dialog. This is independent of the application bolts, whose Shift-click opens shield/reduction options. Canceling the damage-roll dialog releases the reservation without rolling or applying damage. Older four-effect records use their first three attachments for future applications; existing actor statuses are not removed.
