# Combat Tools backlog

Updated: 2026-10-04

Edit each **Status** directly. Priorities are initial suggestions, not an agreed work order.

**Priority:** High = address next; Medium = useful, can wait; Low = optional improvement.\
**Status:** Idea = needs discussion; Ready = defined and available to pick up; In progress = work started; Blocked = cannot proceed; Done = completion criteria met; Dropped = no longer planned.

Keep IDs permanent. Add new items by copying an entry. Move finished or dropped items to the bottom and record a date and outcome. Listing work does not authorize implementation. Live verification means checking the actual Foundry world; automated checks alone do not satisfy it.

This remains the master feature roadmap. The [complete previous backlog](docs/history/backlog-before-standard-template-2026-09-29.md) preserves every original request, revision and completion note; the [earlier roadmap](docs/history/pre-0.8.0-refresh/BACKLOG.md) preserves older history. Source manifest: 0.9.8. Historical version/unreleased labels are not current release verification. Existing uncommitted gameplay work was not evaluated or changed by this documentation task.

## Open items

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

### BL-019 — Stabilization and Medical actions

**Status:** Done (implementation and automated checks; live Foundry verification remains under BL-001)

**Requested behavior:** Optional GM stabilization function; penalty-free Needs Stabilization after player damage, preserved after combat; top-level Medical for self-care and other patients, with Stabilize, Medtech inventory Speedheal and eligible critical-injury Quick Fix actions.

**Outcome (2026-10-02, unreleased):** Uses native skill rolls, injury DVs and inventory quantities. Quick Fix permanently removes injuries whose Treatment type is Quick Fix. Other injuries retain their documents, suppress penalties temporarily and restore them when combat ends; outside combat they expire after 24 world hours. Automatic status application defaults off; Medical is always available. Actions require an owned healer and an adjacent patient.

## Release record — 0.9.10 (2026-10-03)

Release includes manual effect confirmation, Medical/stabilization/QuickFix/SpeedHeal, combined Skill/STAT filtering and the Treatment roll reference. Medical visibility and patient selection follow the final requested behavior. Live checks remain under BL-001.

## Dropped at user direction - 2026-10-04

### BL-001 — Verify live combat workflows

**Priority:** High\
**Status:** Dropped

**Outcome (2026-10-04):** Dropped at user direction. No further investigation, fixes or validation work are planned for this item. The original request and acceptance criteria are retained for history.

**Problem:** Source and browser checks leave actual multi-client integration unverified.

**Desired result:** Record an integrated live-world pass with the supported module combination.

**Previous acceptance criteria (no longer planned):**

- [ ] Test multiple clients/GMs, linked/unlinked actors, scene changes and encounter end/reset/deletion.
- [ ] Verify native dialogs, attack/evasion/damage, status cleanup and theme combinations.
- [ ] Check sheet attack routing, AoE reset/placement, smoke, QuickHacks, EMP, bow loading and ammunition controls.
- [ ] Verify current turn indicators, HUDs, roll shortcuts and alerts as GM and player.
- [ ] Record versions, results and remaining failures; do not equate automated checks with live acceptance.

**Notes:** Previous backlog: Open work and dated feature verification notes.

### BL-002 — Investigate actor and token naming differences

**Priority:** Medium\
**Status:** Dropped

**Outcome (2026-10-04):** Dropped at user direction. No further investigation, fixes or validation work are planned for this item. The original request and acceptance criteria are retained for history.

**Problem:** The existing backlog retains questions about token names, actor names, older cards and scene changes.

**Desired result:** Determine whether differences are presentation-only or identify a reproducible targeting problem.

**Previous acceptance criteria (no longer planned):**

- [ ] Compare displayed names and referenced Actor/token identities on current and historical cards.
- [ ] Check native undo after scene changes and record actual affected documents.

**Notes:** Previous backlog: Actor/token identity. Differing labels alone do not establish wrong-target mutations.

### BL-003 — Reproduce missing residual smoke

**Priority:** Medium\
**Status:** Dropped

**Outcome (2026-10-04):** Dropped at user direction. No further investigation, fixes or validation work are planned for this item. The original request and acceptance criteria are retained for history.

**Problem:** An earlier report of missing residual smoke remains unverified despite passing fixtures.

**Desired result:** Confirm the behavior in a real vision/fog scene.

**Previous acceptance criteria (no longer planned):**

- [ ] Record scene vision/fog settings and smoke lifetime/visibility.
- [ ] Reproduce removal/restoration and expiry; distinguish hidden smoke from a missing template.
- [ ] Fix only a demonstrated defect, with regression coverage.

**Notes:** Previous backlog: Smoke.

### BL-009 — Verify limits of damage undo

**Priority:** Medium\
**Status:** Dropped

**Outcome (2026-10-04):** Dropped at user direction. No further investigation, fixes or validation work are planned for this item. The original request and acceptance criteria are retained for history.

**Problem:** The prior roadmap does not promise universal rollback of secondary effects, statuses or smoke; local damage-reversal work now exists.

**Desired result:** Document the actual supported reversal behavior and remaining manual steps.

**Previous acceptance criteria (no longer planned):**

- [ ] Review the in-progress damage-reversal work before proposing duplicate changes.
- [ ] Verify supported reversal and secondary-effect behavior in a live world.
- [ ] Record concrete failures and unsupported cases without blindly retrying damage.

**Notes:** Previous backlog: Native undo. Existing uncommitted damage-reversal changes are outside this documentation task.

## Damage/effect standardization (2026-10-04)

Implemented: semantic order attack/defense -> damage roll -> application/receipts -> effects; AoE attack responses remain in upper target rows, lower target sections hold application/effects. Known ammunition preselects canonical effect choices. Ignite/EMP/Microwaver picker duplicates are consolidated with legacy identifier support and source-specific mechanics preserved. Live Foundry/multiplayer appearance and transitions remain to verify.

Damage/effect layout refinement: effect selection is inside the damage box; AoE uses one combined lower recipient row with mini-portrait, damage, resistance, effect and GM controls. This supersedes separate lower damage/effect target lists.

- Treatment: On Fire / Extinguish (Action) allows a conscious controlled character to extinguish themselves or another visible burning patient, including NPCs, without a medical skill roll. Uses the active GM request path; clears all native and legacy fire severities. Live verification pending.
- Fixed compact AoE effect labels escaping the chat log and creating outer chat-tab overflow; native chat composer positioning covered by a browser regression. Live verification pending.

- Damage/effect refinement implemented: first-resolution selection lock, stable Apply-to-status glyphs, reserved far-right GM menu, and no Extinguish on resolution cards. Build, state tests and browser geometry checks pass, including both VisualTools skins at 260–400 px and native sidebar scrolling. Live verification pending.
- Grenade marker cleanup (2026-10-04): implemented encounter-end/reset/delete cleanup for grenade blast and original-target templates, including new markers whose chat was deleted. Older templates without encounter metadata require their source card. Smoke and unrelated encounters are preserved. Live verification pending.
- Target effect rows (2026-10-04): implemented damage line plus individual effect rows with colored left border, name, Resist when applicable, Apply/status and effect-specific GM override. Supersedes the combined one-line layout; existing selection locks and Extinguish placement retained. Live verification pending.
- Direct GM actions and effect icon contrast (2026-10-04): removes damage/effect and target-control submenus, preserving live controls and permissions. Dark icons on light cards; contrasting tinted icons on Hub. Supersedes the previous GM disclosures. Live verification pending.
- RTD resistance expansion (2026-10-04): implemented a full-width text-only breakdown beneath the effect row, preserving the native numeric disclosure and saved calculations. Native/sidebar and both-skin browser checks pass; live Foundry verification pending.
- Implemented locally (2026-10-04, unreleased): native applied-damage totals expand below their target line at full width; completed effect rows use shared columns, explicit resistance labels and effect-generated damage below its named effect. Undo remains direct beside the applied total. Supersedes the compact-effect generated-damage-first layout; standalone instant cards retain their ordering. Live Foundry verification pending.
- Superseded layout decision (2026-10-04, unreleased): remove reserved resistance/application/GM column widths. Content-sized actions align right, with visible GM buttons right-most and empty GM slots collapsed. Applied totals and completed effect icons reach the edge. Browser checks pass; live Foundry verification pending.
- Applied-effect appearance refinement (2026-10-04, unreleased): remove the small completion checkmark; keep the effect glyph alone, with applied state in its tooltip/accessible label. Resistance and unaffected indicators retain their existing meaning.
- Effect selection glyph fix (2026-10-04, unreleased): remove nested image backgrounds/borders before glyph tinting and use normal themed button surfaces. Prevents solid-square selected icons. Picker behavior and original status assets remain.

- Card-code cleanup (2026-10-04, unreleased): consolidated normal/manual/AoE selection and instant-effect markup; replaced repeated action listeners; removed overridden card CSS and off-screen state labels. Preserves the latest per-target layout, native receipts, locks and permissions. Current styling contract replaces accumulated refinement notes; live verification pending.

## Audit follow-ups 1–4 — 2026-10-04

**Status:** Done (local implementation; unreleased). **Priority:** High.

- Save Slow before optional dice playback; animation errors cannot cancel its effect.
- Serialize concurrent module LUCK spends per actor on the initiating client, validating the current balance inside the queue.
- Stop refreshing completed fire receipts and skip unmounted entries during indexed chat invalidation.
- Preserve open HUD/status and combat-control menus through unrelated refreshes; invalidate changed content or removed anchors.
- Regression coverage includes failed/pending DSN, concurrent/exhausted LUCK, stale fire subscriptions, unmounted/remounted cards, and browser menu continuity. Live multiplayer checks remain pending.

## Audit follow-ups 5–17 — 2026-10-04

**Status:** Done locally; unreleased. Supersedes the remaining refresh, control-decoration and accumulated-CSS findings.

- Suppression skips unrelated combat writes and merges pending expiry scans. QuickFix checks for its flag before entering actor queues and merges pending time-driven scans.
- Movement effect hooks redraw only the affected actor's tokens. Next-turn marker updates ignore unrelated tokens, actors and settings and merge relevant events per frame.
- Button observers attach only to eligible module cards and inspect changed controls/subtrees. Disabled result delay bypasses result scans; enabled rendering uses one result collection per deadline check.
- Token HUD computes Medical entries once per render; effect binding resolves each actor once per pass. Button roles, icons and completion use action/state metadata instead of English-label matching.
- Consolidated repeated CSS component rules and button variant sizing; decorated effect slots match their 24px tracks. Native receipt columns use subgrid, and compact roll calculations expand into explicit full-width text regions.
- Added integrated decorated-picker, effect-state, permission, width, disclosure and refresh-count regressions. See [audit follow-up evidence](docs/audits/2026-10-04-followups.md). Live Foundry/multiplayer verification remains pending.

- Compact poison/biotoxin result layout (2026-10-04, local/unreleased): resistance and effect damage share the named effect row, followed by application/status and any right-most GM action. Supersedes the separate Effect damage row for attached/AoE target effects. Each numeric result expands independently below the full row; simultaneous expansions stack. Standalone instant-card ordering remains unchanged. Build and narrow-width browser verification recorded with this change; live verification pending.

- Attached-effect wording (2026-10-04, local/unreleased): recipient headings contain the actor name only; the parent section retains Effects. Removes duplicated “— Effects” wording in normal/manual damage cards.

- Attached EMP wording (2026-10-04, local/unreleased): removes the redundant “EMP — actor” h4 from embedded EMP results; item outcomes and chooser controls remain. Standalone card headings are unchanged.

- Damage-application wording (2026-10-04, local/unreleased): “Selected Token” replaces “token” on the shared selected-recipient action; selection behavior remains unchanged.

- On Fire combat cleanup (2026-10-04, local/unreleased): Mild/Strong/Deadly and legacy fire clear at participant combat end/reset/deletion, including manually applied untracked statuses. Remove actor effects or disable item effects, without another damage tick. Retain native timers and other started-encounter protection. Regression verification covers policy and actual cleanup hooks; live verification pending.

Settings and outside-encounter combat bar (2026-10-05, local/unreleased): Internal frame consequences uses the Pneuma Homebrew badge. Turn Indicator's master switch precedes Configure. Disabled Turn Indicator, QuickHack and Combat Bar sections grey out dependent rows and prevent interaction while retaining saved/draft values; Combat Bar configuration follows its master too. Outside encounters, players see their assigned character and GMs see online players' assigned characters. Duplicate assignments appear once and characters need no scene token; the existing minimize control remains. No new setting. Encounter rows retain native tracker behavior. Automated checks are separate from live Foundry verification.

Hover DV encounter option (released in 0.9.12, 2026-10-06): adds "Only show Hover DVs during active encounter" under Token HUD & Targeting. Client preference defaults on. When enabled, hover DVs require an active, started encounter on the current scene; encounter creation/start/end/reset/deletion refreshes the hovered panel. No participant requirement is added.

Molotov correction (released in 0.9.12, 2026-10-07): native Molotov Cocktail weapons (CPR v0.92.4 source identity, with name fallback) route through the incendiary grenade area workflow with a 5d6 damage snapshot. Existing blast placement, scatter, target evasion, armor penetration and per-target fire application are reused. Ordinary grenades retain 6d6. Molotovs retain native thrown-weapon inventory behavior rather than magazine discharge. Build/regression validation is separate from live Foundry verification.

Duplicate CTH weapon labels (released in 0.9.12, 2026-10-07): duplicate ranged weapon names show their native loaded ammunition type. Matching types also show current magazine rounds/capacity; missing loaded ammunition shows Unloaded. Unique names retain the compact name-only presentation. Native reload/load and inventory updates refresh the details without changing item identity or attack handlers.

QuickHack asset path correction (released in 0.9.12, 2026-10-07): known standalone QuickHack image URLs are mapped from modules/pneuma-quickhack/icons/ to modules/pneuma-combattools/styles/. HUD resolves legacy actor/world item paths directly. GM content initialization repairs only those image paths on world items, actor items and unlinked scene-token actor items, including launcher artwork. Names, rules, flags, folders and custom images remain intact. No failed-image fallback is added.

Combat-end public summary (released in 0.9.12, 2026-10-07): the combat-end review is public and includes the round reached, unique player/NPC character counts, new player critical injury items recorded during the encounter, defeated/dead participants, observed cleared effects and effects remaining. Critical records and initial injury identities live on the Combat document; existing injuries are excluded, duplicate creation notifications are deduplicated, and injuries no longer present are labeled. Mid-encounter adoption is marked partial. Round capture happens before reset/delete and cleanup effect comparison uses the pre-cleanup snapshot. The cleanup button is removed for non-GMs during rendering; cleanup mutations remain GM-only. No damage/medical totals are added. Live Foundry/multiplayer verification remains pending.

Package documentation exclusion (released in 0.9.12, 2026-10-07): build output excludes the repository docs directory, including handbooks, history, audits and screenshots. Documentation remains in the repository. Runtime assets and existing root package files remain included.

Medical skill menu labels (released in 0.9.12, 2026-10-07): Stabilize lists First Aid and Paramedic separately when the healer has their native skill items. QuickFix retains each injury-specific eligible skill choice. Labels show DV followed by the healer skill + native STAT base, using (1st Aid 12) / (Para 10). Zero skill ranks remain eligible. Clicking a row rolls its selected skill directly with native roll options. Medical labels wrap to keep the base visible.

Medical choice submenus (released in 0.9.12, 2026-10-07): supersedes the expanded Stabilize/QuickFix list. When both skills are eligible, native click-to-expand details group Stabilize by DV and QuickFix by injury. Child rows show First Aid or Paramedic, applicable DV and skill + STAT base. Single-skill actions remain direct buttons with their base. Existing action/item/skill attributes and native rolling behavior remain.

Chat roll-menu attention cue (released in 0.9.12, 2026-10-07): the native manual-roll dice icon has a small, theme-colored sparkle above it roughly every 18 seconds. It has no pointer interaction, stops while the menu is open and is disabled for reduced-motion preferences. No timers or extra controls are added.

Roll-button sparkle visibility correction (released in 0.9.13, 2026-10-07): the native chat manual-roll icon now owns a decorative gold span rather than a gray pseudo-element. The first pulse begins within two seconds and repeats every 12 seconds. Reduced-motion and open-menu suppression remain. This supersedes the released 18-second cue with its delayed first pulse.

Roll-button sparkle burst (released in 0.9.13, 2026-10-07): supersedes the single sparkle with five small gold sparkles distributed around the chat Roll icon. Each burst lasts three seconds, with cycles starting every 15 seconds (12 seconds quiet). Open-menu and reduced-motion suppression remain; decorative particles do not intercept clicks.

Manual damage half-armor option (2026-10-07, local/unreleased): Damage in the chat Roll menu includes Halves Armor SP (round up), off by default. It uses native 50-percent armor ignore and saves that selection on the damage card; existing application/undo and armor toggles remain. The option is disabled when Interact with armor is off.

Focused combat-end snapshot and Discord export (2026-10-07, local/unreleased): replaces the broad remaining-effects list with player HP/wound state, recognized condition IDs and current native critical injury items for all participants. Routine cyberware/equipment bonuses are excluded. Orphan injury markers are explicitly labeled; QuickFix suppression is identified. Report includes encounter/scene, round reached, final unique-actor counts, defeated markers, existing limited player injury additions and observed relevant cleanup. Saved serializable report data powers Copy Discord Markdown for all viewers, with a manual-copy fallback and escaped names/neutralized mentions. NPC HP is omitted. QuickFix restoration is awaited before capture. No damage totals, attack counts, kills or medical history are inferred.

Discord copy button theming (2026-10-07, local/unreleased): [data-copy-combat-summary] joins the shared chat-control selector and uses the copy glyph. It receives the existing pneuma-chat-button theme classes and public/player role metadata; cleanup remains GM-only.

Compact chat versus detailed Discord snapshot (2026-10-07, local/unreleased): chat shows encounter/round/counts, brief player HP/injury totals, urgent stabilization needs and outcome totals. Detailed condition/injury names, recorded additions, cleared-condition names, scene and UTC timestamp remain in the saved Discord Markdown export. No underlying report data or copy/cleanup permissions change.

- Combat error report fixes (local/unreleased): suppressive-fire area targets may respond without tracker membership; outside-tracker suppression has no next-turn automatic expiry and requires manual clearance. Encounter summary retains removed participants and defeat markers in persistent combat flags; existing equipment-effect filtering and compact chat remain in place.

Drug palette review (2026-10-09): confirmed the existing Hornet's Pharmacy entries; split addictions into a separate collapsed Addiction section (local/unreleased). User explicitly excludes Emerald City, Mortalis and Red Lace; Piranha Smash shares Smash status behavior. No new drug mechanics or addiction-check automation requested.

General status group (2026-10-09, local/unreleased): normal and custom token statuses appear in a General disclosure section above the specialized groups. General starts expanded on each new HUD render and can be collapsed by clicking its heading. Other sections retain their collapsed defaults. Native status controls and alphabetical order are preserved.

Release status (2026-10-09): the changes recorded above since v0.9.13 are included in v0.9.14. Validation: 597 automated tests passed; four optional native geometry checks skipped; status HUD, combat-summary and manual-roll/Treatment browser fixtures passed. Live Foundry/multiplayer verification remains pending.
