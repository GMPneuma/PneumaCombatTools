# Verification and maintenance

Release: Combat Tools 0.8.4, reviewed 2026-09-24. Includes consistent encounter ownership, damage-status cleanup, injury/EMP corrections and persistent area-placement instructions.

## Evidence levels

- Source inspection establishes implemented branches, controls, APIs and stored state.
- Typecheck/build and automated fixtures catch particular failures; browser fixtures are not a running multiplayer Foundry world.
- The release validation recorded 330 checks: 326 passed and four native-Foundry fixture tests skipped. Three initially misconfigured browser fixtures passed after their local library paths were provided.
- Live multiplayer, real scene vision/fog and arbitrary third-party theme/module combinations remain separate verification tasks.

## Local checks

```sh
pnpm check
pnpm test
```

Browser tests need `PNEUMA_PLAYWRIGHT_MODULE` pointing to the installed Playwright ESM entry and an available Edge browser for fixtures using `channel: "msedge"`. Some fixtures need `PNEUMA_JQUERY_SOURCE`, `PNEUMA_HANDLEBARS_SOURCE` and `PNEUMA_PIXI_SOURCE` paths. Native Foundry fixture tests have additional opt-in environment requirements in their source. Missing test dependencies are not evidence of a gameplay failure.

For documentation changes, validate local links, code/API examples against source, Mermaid syntax/rendering and build output. Release notes remain historical records; do not rewrite them to imply later work shipped earlier. Current guides and inventory should have one current answer, not append-only contradictory corrections.

## Live check queue

GM plus player clients; a second GM; linked and unlinked actors; multiple tokens of one actor; scene changes and old chat cards; canceled dialogs; repeated clicks; dice visibility; damage/undo and effects; NPC automation; new/reset/deleted encounters; smoke vision/fog; Crew Tools enabled/disabled; player default character; personal settings and reduced motion.

Use [BACKLOG](../BACKLOG.md) for unresolved findings and [flow map](flow-map.md) to identify the state owner before diagnosing a failure.


## Documentation refresh checks

All 12 current Mermaid diagrams parsed and rendered with Mermaid 11.12.0; representative overview/manual-flow screenshots were inspected and exported label contrast corrected. The standalone HTML requires no renderer download. All six JavaScript HUD API examples executed against the compiled API with mocked Foundry transport. Current-document local links and diff whitespace were checked. Historical snapshots retain their original content and old relative links deliberately.

## 0.8.1 release validation

Production build and full automated suite passed: 334 passed, 4 native-Foundry checks skipped, 0 failures. Includes smoke geometry and override browser tests, cyberware cleanup regressions and Self-CTH browser checks. Live multiplayer remains unverified.

## 0.8.2 encounter consistency validation (2026-09-24)

`pnpm check` and `pnpm test` passed: 351 tests, 347 passed, four optional native-Foundry fixture tests skipped, zero failures. Browser regressions passed for AoE, quickhacks, the combat bar, and damage flow. AoE and damage flow were rerun after the final production changes.

Encounter regressions cover ambiguous active encounters, exact token membership, inactive duplicate membership, tracker and GM scene changes, reset/deletion/end invalidation, preserved outside-combat actions, saved effect clocks, and selected damage targets removed before GM processing. The test command builds before running non-browser fixtures and runs in CI. Live Foundry multiplayer and performance benchmarking were not performed. No encounter migration was added; the change targets a clean environment.

## Damage status cleanup regression (2026-09-24)

Fixed newly damage-applied statuses without durations being skipped at encounter end. Encounter ownership covers ordinary statuses, native drug effects, incendiary fire and sleep Prone. Tests cover delete/reset hooks, different encounters, removed participants, repeated application, existing conditions, permanent injury/death preservation, and inventory retention. Final build and non-browser suite: 352 passed, four optional native-Foundry fixtures skipped, zero failures. Typecheck passed; live Foundry verification remains outstanding.

## 0.8.2 release validation

Final 0.8.2 typecheck/build and automated suite passed: 352 passed, four optional native-Foundry fixtures skipped, zero failures. AoE, QuickHack, combat-bar and damage-flow browser suites passed against the release build. The AoE placement instruction screenshot was inspected. These fixtures do not establish live multiplayer behavior.

## 0.8.3 release validation

Typecheck/build passed; 352 automated tests passed, four optional native-Foundry fixtures skipped. Settings browser regression passed at three widths, including button click, readable dropdown, Crew integration defaults with/without availability, and preservation of saved preferences. Live Foundry verification remains separate.

## Bow loading validation (0.8.4)

Build/typechecking and full suite passed: 362 passed, four optional native-Foundry checks skipped. Tests cover loaded/non-bow bypass, native reload/install order, quantity filtering, stale inventory, cancellation, concurrent loading and failed reloads. The attack integration verifies loading before roll creation and retaining the loaded arrow after attack cancellation. Browser fixture passed and its prompt screenshot was inspected. Native APIs were inspected in official CPR v0.92.4 [loadable source](https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/blob/v0.92.4/src/modules/item/mixins/cpr-loadable.js); the live server version and behavior remain unverified.

## Damage-on-miss regression (0.8.4)

Full suite: 363 passed, four optional native-Foundry checks skipped. Browser checks confirm the missed-attack blood drop does not send requests, the override is GM-only, and approval enables the normal damage control. Coordinator tests verify players cannot grant approval, unapproved damage is rejected even for GMs, and approval preserves the miss outcome. Build/typechecking passed.

## Area targeting regression (0.8.4)

Build/typecheck and full suite passed: 366 passed, four optional native-Foundry fixtures skipped. AoE browser checks verify out-of-sight preview hiding, invalid-click rejection, restored preview, cancel/placement cleanup and deletion of both blast and original-aim templates. Workflow regressions cover sight rejection before ammunition consumption, sight changes during the roll dialog, fixed original marker after scatter, and marker visibility. Live Foundry scene/vision testing remains pending.

## 0.8.4 release validation

Production build/typecheck passed. Automated suite: 366 passed, four optional native-Foundry checks skipped, zero failures. Bow loading, AoE, EMP settings save/reopen, and full EMP browser fixtures passed. The EMP fixture now supplies the active scene encounter and expands the optional settings sections before editing. Live Foundry multiplayer and installed-system bow behavior remain unverified.
