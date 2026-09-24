# Verification and maintenance

Release: Combat Tools 0.8.1, reviewed 2026-09-23. Includes the documentation refresh, Self-CTH menus, combat-end cyberware cleanup and automatic smoke attack modifiers.

## Evidence levels

- Source inspection establishes implemented branches, controls, APIs and stored state.
- Typecheck/build and automated fixtures catch particular failures; browser fixtures are not a running multiplayer Foundry world.
- The release validation recorded 330 checks: 326 passed and four native-Foundry fixture tests skipped. Three initially misconfigured browser fixtures passed after their local library paths were provided.
- Live multiplayer, real scene vision/fog and arbitrary third-party theme/module combinations remain separate verification tasks.

## Local checks

```sh
pnpm check
pnpm build
node --test --test-concurrency=1 scripts/*.test.mjs
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
