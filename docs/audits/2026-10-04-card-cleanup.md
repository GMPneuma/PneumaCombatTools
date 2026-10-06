# Combat Tools card cleanup — 2026-10-04

Scope: Combat Tools card generation, render hooks, control binding, saved-card migration and shared card CSS. Visual Tools source was excluded at the user's request. Existing built skin assets were used by Combat Tools browser fixtures for compatibility checks.

## Findings corrected

| Finding | Correction |
| --- | --- |
| AoE picker appended new slots on repeated rendering; normal/manual had a separate picker loop | Shared renderDamageStatusPicker replaces children, preserves locks and disables the group during selection/save. Regression renders the same card three times and expects exactly three slots. |
| Rebinding instant/AoE/EMP/QuickHack/injury/cleanup controls retained previous closures | Shared bindCardAction removes only its previous module-owned listener. A browser regression binds stale/current callbacks then moves GM controls twice and verifies only the current request fires. QuickHack capture guard installs once per root. |
| Repeated resolved-exchange rendering recreated Allow evasion | Reuse one override button with a fresh handler; remove it when unavailable or viewed by a player. Browser regression confirms one button after three renders and removal for a player. |
| Pending incendiary used a separate hand-written effect row | Shared instant-content.ts emits the inert awaiting-damage row and ordinary/attached effects. It cannot roll resistance or apply/skip before damage establishes eligibility. |
| Card CSS repeated picker/image/recipient/effect rules and declared flex containers later replaced by contents | Consolidated the active declarations, removed overwritten rules and an unused selector, retained narrow overrides for native receipts and compact disclosures. |
| Hidden state text used off-screen absolute positioning | Compact state is represented by titled/accessibly labeled glyphs; legacy repeated text uses display:none. Sidebar fixture verifies outer chat scroll remains zero and composer stays at the bottom. |
| Styling notes contradicted current Undo placement, generated-damage order and dynamic columns | Replaced the accumulated damage/effect styling notes with one current contract. Roadmap history retains superseding decisions. |
| Manual-card fixture lacked the current selector/lock helpers, effect slot, asynchronous settling and Treatment On Fire row | Updated the fixture to exercise compiled helpers and current markup. Native roll source was retrieved from the exact CPR commit already named by that test. |

## Paths reviewed

Exchange/pending/evasion cards and shared card sections; normal and manual damage/application/reversal; AoE target/response/application/effect migration; standalone/attached instant effects; EMP chooser/result cards; QuickHack results and controls; grapple/opposed/direct-HP summaries; manual/group/STAT/injury/Treatment cards; ribs/suppression/cleanup cards; armor upgrades, shared chat-button decoration and resolution scrolling.

Gameplay calculation, actor mutation, source-specific effect rules and privacy policies were preserved. Left participant rails were not changed. Existing unrelated workspace edits remain uncommitted.

## Verification

Strict TypeScript build passed. Full unit/regression suite: 572 tests, 568 passed, 4 optional native-Foundry checks skipped, 0 failed.

Browser fixtures passed: aoe-ui, damage-flow, chat-sidebar-ui, card-presentation, chat-buttons-ui, manual-rolls-ui (including Treatment), quickhack-ui, emp-ui, chat-result-delay-ui. AoE coverage includes native and existing skins at 260/300/400 px, pending/completed/review states, independent text expansion/collapse, right-edge actions, player/GM visibility, preserved scopes/listeners and transparent status icons.

These are compiled-runtime fixtures, not live Foundry/Forge/multiplayer verification. No release, commit or installed-world update was performed.
