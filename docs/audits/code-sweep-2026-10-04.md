# Combat Tools code sweep — October 4, 2026

Audited v0.9.10, HEAD `d8f12aed416b2b32f07a841fdb1033d773f5b26f`, plus the existing uncommitted change allowing non-Medtech characters to use eligible right-click QuickFix actions. That change and its documentation/test updates were preserved.

Seven defects were reproduced against compiled runtime code with controlled failure injection or concurrent document updates. These are isolated reproductions, not observations from a live Foundry world. No production source fixes, commit, or release were made during this audit.

## Findings

### 1. P1 — Generic status cards reject both GM choices

**Source:** `src/scripts/instant-effects.ts:146–152`; card creation at `134–140`; generic status creation in `src/scripts/damage-flow.ts:208`.

The damage workflow creates an attached card with `effect.id === "status"` for ordinary added statuses. Its UI offers Apply and Not Affected. The actual request dispatcher rejects any ID absent from `instantId()`, which excludes `"status"`. Both choices throw **Effect unavailable** before reaching the handler that supports generic statuses.

**Reproduction:** Create an attached generic status card, then call the real request dispatcher for `apply` and `skip`. Both reject; the card remains unresolved. Existing generic-status tests call the lower-level handler directly and miss this integration boundary.

**Correction:** Accept the generic status card type with a valid current `CONFIG.statusEffects` ID and retain the existing audience, actor, and permission checks. Test the UI request path through the dispatcher.

### 2. P1 — Failed QuickFix restoration permanently loses its recovery record

**Source:** `src/scripts/medical.ts:138–150`, particularly `144–146`.

Expiry deletes the saved QuickFix flag before reenabling the injury's ActiveEffects. If that second write fails, the injury still has disabled penalties but no restoration record. Calling expiry again skips it. One rejection also interrupts the remaining cleanup loop.

**Reproduction:** QuickFix an injury, expire it, and inject a failure into ActiveEffect restoration. Retry expiry. The penalty remains disabled, the saved flag is absent, and the death-save increase has already been restored.

**Correction:** Keep recovery data until restoration finishes, make each restoration step safe to retry, and isolate failures so other injuries can finish cleanup. Serialize restoration with medical mutations affecting the same injury.

### 3. P1 — Independent damage queues overwrite simultaneous HP changes

**Source:** `src/scripts/instant-effects.ts:43–44,84`; `src/scripts/instant-lifetime.ts:175–183`.

Instant-effect damage and turn fire damage use separate queues and absolute HP writes. Each can read the same starting HP before either document update completes. Both operations can report completion while one damage amount is lost.

**Reproduction:** Starting at 30 HP, run 8 poison damage and 2 fire damage concurrently with asynchronous document writes. The writes are 28 and 22; final HP is **22 instead of 20**. Both operations complete.

**Correction:** Use a shared actor mutation queue for module HP writers. Review medical healing, injury damage, grapple damage, native damage capture, and reversal against the same boundary. The probe establishes the poison/fire pair; it does not establish every other pair as defective.

### 4. P2 — SpeedHeal partial failure consumes stock and blocks recovery without healing

**Source:** `src/scripts/medical.ts:70–81`.

SpeedHeal creates its blocking status, consumes the dose, then updates patient HP. If the HP write fails, the status and consumed dose remain. The normal retry is blocked by that status, with no recorded completion/recovery state.

**Reproduction:** Fail the HP update after the earlier writes succeed. Patient HP stays at 30, stock decreases from two doses to one, and the Speed Heal status blocks retry.

**Correction:** Record the operation and completed steps so the GM can finish or reconcile it safely. Preserve duplicate-use protection; blindly repeating the operation or rolling back without checking state could cause a second dose or heal.

### 5. P2 — Medical checks for a GM after spending LUCK and evaluating the roll

**Source:** `src/scripts/medical.ts:108–116,117–136`, particularly `133–135`; patient validation at `69`.

`performMedical()` confirms the native roll, spends LUCK, and evaluates it before `send()` checks socket availability and the active GM. A missing GM leaves a paid roll with no posted result. The late patient-HP check can also reject an already evaluated action, without preserving a result for retry.

**Reproduction:** Attempt stabilization with no active GM and one LUCK selected. One roll is evaluated, LUCK falls from two to one, and no chat card is posted.

**Correction:** Check authority/socket availability before committing resources. Keep the evaluated result available for recovery if authority disconnects or patient state changes later. Early checks alone cannot eliminate failures occurring after the check.

### 6. P2 — Rapid healing can erase a queued Needs Stabilization event

**Source:** `src/scripts/medical.ts:46–54`, particularly `49`.

The damage hook queues marker creation, but the queued callback rereads current HP to decide whether damage occurred. If healing restores HP before the callback runs, an already observed decrease is discarded.

**Reproduction:** Observe damage at 30 HP, queue its marker, then restore HP to 40 before the queued callback executes. Needs Stabilization is not applied.

**Correction:** Capture whether the accepted update reduced HP when processing the damage event. Queue the marker mutation rather than a later reconstruction of whether that event happened. Keep duplicate-marker prevention.

### 7. P2 — AoE defense loses its paid roll when DSN playback fails

**Source:** `src/scripts/aoe/workflow.ts:397–414`, particularly `410–414`.

AoE defense spends LUCK and evaluates the roll, then awaits DSN playback before persisting the result. A playback exception enters the `finally` release path. The row returns to Waiting with no saved total; retry evaluates another roll and can spend more LUCK.

**Reproduction:** Inject a native dice-handler playback error during defense. One roll is evaluated, LUCK decreases from two to one, and the row returns to Waiting with no total.

**Correction:** Persist the evaluated result before optional visualization and report playback failure separately. Preserve that exact result when commit/socket confirmation fails. Keep blind and restricted-audience rules intact.

## Feature coverage

“Checked” below means source inspection plus relevant automated/browser checks. It does not mean verified in a live multiplayer world.

| Feature family | Checks and result |
| --- | --- |
| Attack/evasion, ammo, bow loading, native sheet routing | Claim/release, stale cards, ammo ownership/depletion, optional-dialog shortcuts, native fallback, dialog layout and rerenders checked. |
| Damage, armor/shields, reversal | Native capture, partial-write review states, duplicate application protection, GM-only reversal and browser permissions checked. Concurrent direct HP writes remain affected by finding 3. |
| AoE, suppression, grenades | Recipient response ownership, templates, placement/cancel cleanup, ended cards, damage states and rendering checked. Finding 7 affects defense recovery. Native geometry checks remain skipped. |
| Grab/grapple and self actions | Exchange state, dice playback paths, saved dice, ownership, token identity and scene/encounter guards checked. Live DSN visibility still needs two-client testing. |
| Status effects and cleanup | Manual apply/unaffected flow inspected; finding 1 blocks ordinary added statuses. Addiction protection, participant prone removal and Speed Heal combat cleanup checked. |
| Medical | Menu hides when empty; Stabilize requires Needs Stabilization; Wake is under Medical; QuickFix uses native eligible skills/DVs; SpeedHeal remains Medtech-only. Findings 2, 4, 5 and 6 affect failure/concurrency behavior. |
| Treatment reference window | Available to all players; wound-state table, horizontal injury controls, unavailable options, patient token/manual-name choice and native DV result metadata checked. Reference rolls do not themselves mutate a patient's medical state. |
| QuickHack/Jack-In/Self ICE | Ownership, connection state, hidden defense, forced disconnect, native dialogs/cards and UI routing checked. Hidden Jack-In defense remains hidden in automated checks. |
| EMP, injuries and instant-effect lifetime | Selection/reconciliation, native configuration, critical-injury controls, duration/cleanup and direct-damage handling checked. Findings 1 and 3 apply at shared effect boundaries. |
| Movement, combat bar and turn presentation | Reset/debt counters, ownership, failed-update retry, pan/zoom, participant controls, markers, scrolling and teardown checked. |
| HUD, messages, EKG, player controls | Privacy, native controls, state indicators, client settings, floating menus, docking and pending-card behavior checked. See fixture limitations below. |
| Shared infrastructure | Socket authority, timeouts, pending requests, encounter epochs, token identity, chat refresh/delay, claim persistence, exact-result retry paths and HTML escaping inspected. |

## Validation

- `node scripts/build.mjs`: passed strict compilation and manifest/build validation.
- `node scripts/test.mjs`: **533 total; 529 passed; 4 skipped; 0 failed**.
- Seven audit fault probes: **all reproduced their described defects**.
- 36 browser fixtures executed. With the required local Handlebars and PIXI dependencies supplied, **32 stock fixtures passed**. The remaining **four passed after temporary harness corrections**. Their checked-in versions still need maintenance; they are not counted as stock passes.

Browser harness problems were isolated without modifying checked-in tests:

| Fixture | Issue |
| --- | --- |
| `bow-loading-ui.test.mjs` | Strips the shared HTML-escape import and inadvertently calls the browser's URL-escape global. Passed with the actual shared escape helper supplied. |
| `settings-subforms-ui.test.mjs` | Assumes six settings selects; current Self ICE controls make seven. Passed with the count corrected in a temporary copy. |
| `status-actions-ui.test.mjs` | Strips imports but omits current fire-condition and chat-report dependencies. Passed with those mocks supplied. |
| `eye-hud.test.mjs` | Omits `playNotificationSound`, expects the older Crew Tools calendar width of 138px rather than the current 124px, and looks for old Biomon labels instead of Biomonitor. Passed after correcting those temporary fixture expectations; the fixed width assertion does not independently establish width invariance across Crew Tools versions. |

The four skipped standard tests require licensed Foundry v12 source through `PNEUMA_FOUNDRY_SOURCE`: diagonal footprint/recipients, cone/gridless coverage, wall clipping, and grid/cone measurement behavior.

Reproduce the seven fault probes after building:

```powershell
node docs/audits/probes-2026-10-03.mjs
```

The probes import compiled runtime code, reuse the existing medical test fixture, and write their generated harness into the OS temp directory. They do not connect to or modify a live world. They assert the observed faulty behavior; their passing result is evidence of defects, not a regression-suite pass.

## Live verification still required

1. GM and player clients with DSN: grab attack/defense, critical dice, blind/private rolls, Jack-In hidden defense and AoE playback interruption.
2. Simultaneous damage/healing, patient HP changes during medical dialogs, GM disconnect/reconnect, and lost socket acknowledgements.
3. Combat cleanup in multiple scenes/encounters: addiction retained, prone cleared for participants, temporary injury restoration, Speed Heal marker removal and Needs Stabilization persistence.
4. Installed CPR/Foundry template geometry and native damage capture, including linked and unlinked tokens.
5. Visual Tools rendering of native Treatment cards and patient metadata; Forge/CDN asset paths and actual loaded versions.

Fix the three P1 issues first. Then repair partial medical operations and roll-result retention, and update the browser fixtures so these checks can run without temporary harness edits.

## Correction follow-up — October 4, 2026

The findings above describe the audit baseline. The user subsequently authorized all seven fixes. The working tree now contains corrections for every finding, plus checked-in repairs for the four browser fixtures. `scripts/audit-regressions.test.mjs` exercises the corrected behavior, including concurrent damage, duplicate burn notifications, partial SpeedHeal writes and lost acknowledgements, missing/disconnected GMs, stale patient HP, QuickFix restoration failure isolation, and DSN/commit failure recovery.

The historical fault probes assert the old bugs and must be run against the baseline build. Use the regression tests for the corrected code:

```powershell
node scripts/build.mjs
node --test scripts/audit-regressions.test.mjs
```

Production version remains 0.9.10 until a release is requested. Live Foundry/multiplayer verification remains outstanding.

Correction validation: strict build passed; **546 tests total, 542 passed, four native-geometry tests skipped, zero failures**. Thirteen new fault/concurrency regression tests cover the seven findings. All **36 checked-in browser fixtures passed** with local native sources and browser dependencies configured, including repaired fixture assertions and a managed/native damage queue test using the real capture/wrapper code. These results do not establish live Foundry, Forge or multiplayer behavior.
