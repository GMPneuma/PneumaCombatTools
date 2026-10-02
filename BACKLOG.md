# Combat Tools backlog

Updated: 2026-10-01

Edit each **Status** directly. Priorities are initial suggestions, not an agreed work order.

**Priority:** High = address next; Medium = useful, can wait; Low = optional improvement.\
**Status:** Idea = needs discussion; Ready = defined and available to pick up; In progress = work started; Blocked = cannot proceed; Done = completion criteria met; Dropped = no longer planned.

Keep IDs permanent. Add new items by copying an entry. Move finished or dropped items to the bottom and record a date and outcome. Listing work does not authorize implementation. Live verification means checking the actual Foundry world; automated checks alone do not satisfy it.

This remains the master feature roadmap. The [complete previous backlog](docs/history/backlog-before-standard-template-2026-09-29.md) preserves every original request, revision and completion note; the [earlier roadmap](docs/history/pre-0.8.0-refresh/BACKLOG.md) preserves older history. Source manifest: 0.9.8. Historical version/unreleased labels are not current release verification. Existing uncommitted gameplay work was not evaluated or changed by this documentation task.

## Open items

### BL-001 — Verify live combat workflows

**Priority:** High\
**Status:** Ready

**Problem:** Source and browser checks leave actual multi-client integration unverified.

**Desired result:** Record an integrated live-world pass with the supported module combination.

**Done when:**

- [ ] Test multiple clients/GMs, linked/unlinked actors, scene changes and encounter end/reset/deletion.
- [ ] Verify native dialogs, attack/evasion/damage, status cleanup and theme combinations.
- [ ] Check sheet attack routing, AoE reset/placement, smoke, QuickHacks, EMP, bow loading and ammunition controls.
- [ ] Verify current turn indicators, HUDs, roll shortcuts and alerts as GM and player.
- [ ] Record versions, results and remaining failures; do not equate automated checks with live acceptance.

**Notes:** Previous backlog: Open work and dated feature verification notes.

### BL-002 — Investigate actor and token naming differences

**Priority:** Medium\
**Status:** Ready

**Problem:** The existing backlog retains questions about token names, actor names, older cards and scene changes.

**Desired result:** Determine whether differences are presentation-only or identify a reproducible targeting problem.

**Done when:**

- [ ] Compare displayed names and referenced Actor/token identities on current and historical cards.
- [ ] Check native undo after scene changes and record actual affected documents.

**Notes:** Previous backlog: Actor/token identity. Differing labels alone do not establish wrong-target mutations.

### BL-003 — Reproduce missing residual smoke

**Priority:** Medium\
**Status:** Ready

**Problem:** An earlier report of missing residual smoke remains unverified despite passing fixtures.

**Desired result:** Confirm the behavior in a real vision/fog scene.

**Done when:**

- [ ] Record scene vision/fog settings and smoke lifetime/visibility.
- [ ] Reproduce removal/restoration and expiry; distinguish hidden smoke from a missing template.
- [ ] Fix only a demonstrated defect, with regression coverage.

**Notes:** Previous backlog: Smoke.

### BL-004 — Define smoke and sensory exceptions

**Priority:** Medium\
**Status:** Idea

**Problem:** Cyberware-dependent visibility and conditional immunity remain manual; automatic smoke penalties were subsequently implemented.

**Desired result:** Specify only the additional equipment/sensory behavior that is wanted.

**Done when:**

- [ ] Choose supported senses/equipment and explicit exceptions.
- [ ] Preserve the existing attack-time penalty and Ignore smoke override.

**Notes:** The later Automatic smoke obscuration entry supersedes the old claim that all automatic penalties are deferred.

### BL-005 — Define remaining QuickHack mechanics

**Priority:** Medium\
**Status:** Idea

**Problem:** Puppet/Lure decisions, physical Shard Ejection, custom hacks, Net Action spending and Neuroport automation remain manual or deferred.

**Desired result:** Agree which workflows should be supported and their rules.

**Done when:**

- [ ] Record a separate decision for each listed mechanic.
- [ ] Implement and verify only specifically approved workflows.

**Notes:** Previous backlog: QuickHack. Self-ICE/Passwall breach is already implemented.

### BL-006 — Revisit interrupted QuickHack recovery

**Priority:** Low\
**Status:** Idea

**Problem:** The chat-card audit's GM recovery recommendation was explicitly deferred.

**Desired result:** Keep the deferred request visible until a new decision is made.

**Done when:**

- [ ] Decide whether to reopen audit F2.
- [ ] If reopened, define safe handling of partially applied effects before retries.

**Notes:** docs/chat-card-audit-2026-09-26.md and previous backlog. No recovery implementation authorized by this entry.

### BL-007 — Define additional condition mechanics

**Priority:** Medium\
**Status:** Idea

**Problem:** Treatment/healing context, unsupported pharma/drugs and outside-source integration are not universally automated.

**Desired result:** Choose concrete condition workflows that add useful automation.

**Done when:**

- [ ] Identify each proposed source, condition and native workflow.
- [ ] Define treatment/removal and outside-module interactions.
- [ ] Verify only approved additions against native behavior.

**Notes:** docs/status-mechanics-audit.md. Custom markers do not imply mechanics.

### BL-008 — Decide ordinary EMP timing changes

**Priority:** Low\
**Status:** Idea

**Problem:** Ordinary EMP uses combat-end timing and has no outside-combat selection.

**Desired result:** Retain that boundary unless a different duration/workflow is explicitly chosen.

**Done when:**

- [ ] Record a decision on exact timing and outside-combat support.

**Notes:** Previous backlog: EMP timing; intentional boundary, not a confirmed defect.

### BL-009 — Verify limits of damage undo

**Priority:** Medium\
**Status:** Ready

**Problem:** The prior roadmap does not promise universal rollback of secondary effects, statuses or smoke; local damage-reversal work now exists.

**Desired result:** Document the actual supported reversal behavior and remaining manual steps.

**Done when:**

- [ ] Review the in-progress damage-reversal work before proposing duplicate changes.
- [ ] Verify supported reversal and secondary-effect behavior in a live world.
- [ ] Record concrete failures and unsupported cases without blindly retrying damage.

**Notes:** Previous backlog: Native undo. Existing uncommitted damage-reversal changes are outside this documentation task.

### BL-010 — Define general item-marker management

**Priority:** Low\
**Status:** Idea

**Problem:** General marker management and lifetimes beyond subsystem cleanup are deferred.

**Desired result:** Decide whether any additional user-facing marker workflow is needed.

**Done when:**

- [ ] Define management actions and lifetimes, or retain the visual-only API boundary.

**Notes:** Previous backlog: Item markers.

### BL-011 — Decide legacy QuickHack content cleanup

**Priority:** Low\
**Status:** Idea

**Problem:** Old folder/gear cleanup was held until at least 0.8.0 but was never automatically authorized.

**Desired result:** Decide exactly which obsolete content, if any, should be removed.

**Done when:**

- [ ] Identify obsolete content and distinguish it from user-created items.
- [ ] Record a specific cleanup decision before removing anything.

**Notes:** Previous backlog: Legacy QuickHack content. Reaching the old version threshold is not approval.

### BL-012 — Choose documentation translation scope

**Priority:** Low\
**Status:** Idea

**Problem:** Current guides describe English UI and native CPR structures.

**Desired result:** Decide target languages and maintenance ownership before translation.

**Done when:**

- [ ] Choose languages and guides, or mark this idea Dropped.
- [ ] If approved, verify translated instructions against the actual UI.

**Notes:** Previous backlog: Documentation translations.

### BL-013 — Review remaining chat-card recommendations

**Priority:** Low\
**Status:** Idea

**Problem:** Optional native header consistency and explicit QuickHack reroll wording remain audit recommendations.

**Desired result:** Decide whether either presentation change is useful.

**Done when:**

- [ ] Review the remaining recommendations against current cards.
- [ ] Record decisions and update the styling documentation for any approved changes.

**Notes:** Previous backlog: Chat-card audit. F1/F3/F4 are already recorded as implemented.

### BL-014 — Review indicator visuals and hover EKG

**Priority:** Medium\
**Status:** Ready

**Problem:** Indicator visual acceptance/performance and the hover EKG bright-map preview remain open in the previous roadmap.

**Desired result:** Record visual acceptance and performance in the actual world.

**Done when:**

- [ ] Check current styles on bright and dark maps and at practical token sizes.
- [ ] Verify default, personal and per-token profiles across viewers.
- [ ] Check lower-end animation performance and the hover EKG contrast.

**Notes:** Previous backlog: indicator revisions and Hover EKG contrast. Later designs supersede earlier concepts.

## Done or dropped

Existing implemented work, verification records and exact superseding decisions are preserved in the [previous backlog](docs/history/backlog-before-standard-template-2026-09-29.md) and [feature inventory](IMPLEMENTED_FEATURES.md). They have not been relabeled as live-verified.

### BL-015 — Keep screen effects in Visual Tools

**Priority:** Low\
**Status:** Done

**Problem:** Screen presentation needed separate ownership from combat mechanics.

**Desired result:** Visual Tools owns Neural Intrusion screen effects; Combat Tools retains detection, status, ejection and integration hooks.

**Done when:**

- [x] Ownership is recorded as moved in the existing roadmap.

**Closed:** Recorded before 2026-09-29; exact completion date not established here.\
**Outcome:** Recorded as moved in the previous backlog. Live integration verification remains BL-001.

### BL-016 — Canceled and excluded designs

**Priority:** Low\
**Status:** Dropped

**Problem:** Superseded requests must remain visible so they are not accidentally reintroduced.

**Desired result:** Preserve the previous scope decisions.

**Done when:**

- [x] Current Action window, general action-economy enforcement, separate resolution master switch, old top-center auto-hide bar, fire-screen experiment, test status HUD, one-time awareness migration and withdrawn incendiary changes remain canceled/superseded.
- [x] Whole-sheet replacement, automatic item transfers, broad inventory repair/migrations and anti-cheat architecture remain outside approved scope.

**Closed:** Recorded before 2026-09-29; individual decisions remain in the previous backlog.\
**Outcome:** Existing HUD/cards and native incendiary behavior remain the recorded direction; no gameplay changes made here.

### BL-017 — GM post-combat status cleanup

**Priority:** Medium
**Status:** Implemented; live verification pending

**Problem:** Missed cleanup can leave combat statuses on actors after an encounter ends.

**Desired result:** GM-only end-of-combat chat button and manually accessible Clean Status Effects window, preserving permanent critical injuries by default and allowing explicit removal.

**Done when:**

- [x] GM chat button and module-settings entry open a current-state review.
- [x] Ended/expired effects are distinguished from untracked statuses; active-combat actors are blocked.
- [x] Temporary injuries can clear; permanent injuries require inclusion and source-item removal.
- [x] Partial failures are reported; equipment disablements use source-aware cleanup.
- [x] Automatic cleanup continues across actor failures and reconciles explicit stale combat links.
- [ ] Verify reset/delete, GM whisper, linked/unlinked tokens and native window operation in live Foundry.

### BL-018 — Configurable chat result delay

**Priority:** Low\
**Status:** Done (implementation and automated checks; live multiplayer check remains under BL-001)

**Requested behavior:** Optional delay before chat-card roll results appear, configured by the GM for all clients.

**Outcome (2026-09-29, unreleased):** Added Chat result delay under Attack & Damage Cards: 0–5 seconds in half-second steps, default disabled. New module-rendered results wait locally; previous card content remains visible with controls remaining clickable. Existing history does not wait again. Direct native sheet rolls retain CPR behavior. The agreed fixed pause supersedes DSN animation-completion synchronization; no animation-completion guarantee is made.

## Release record — 0.9.7 (2026-10-01)

Released the dice playback audit fixes, saved-dice retry playback, Jack-In rendering correction, Anyone Can Dodge Bullets qualifier and grapple explanation presentation. Automated validation passed; live multiplayer and DSN rendering remain open under BL-001. Existing roadmap IDs and requested behavior are retained.

## Release record — 0.9.8 (2026-10-01)

Reverse Damage is GM-only. Combat cleanup clears participant Prone regardless of application time. This supersedes preserving preexisting Prone; live checks remain under BL-001.

## Release record — 0.9.9 (2026-10-02)

Added six Hornet’s Pharmacy statuses, preserved addiction effects during cleanup and updated dice-reveal compatibility. Live checks remain under BL-001.

0.9.9 replacement (2026-10-02): added the four native drug addiction entries, alphabetical status subsection ordering and white Berserker primary icon.
