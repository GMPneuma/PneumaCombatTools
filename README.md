# Pneuma's Combat Tools

Combat workflows for **Foundry VTT v12** and **Cyberpunk RED Core**. Current release: **0.8.2**. Requires **libWrapper** and an active GM for coordinated workflows.

## Features

- Target-aware native attacks, defense choices, shared damage controls and critical injuries.
- Grenades, rockets, shotgun shells and suppressive fire with individual responses.
- Grapples, QuickHacks, configurable EMP disablement and supported instant effects.
- Combat bar, movement counters, injury reminders, Biomonitor and private HUD messages.
- Manual damage, critical injury, Cyberpunk/custom dice, STAT rolls and GM group checks.
- Optional homebrew rules and per-user presentation settings.

See the [complete inventory](IMPLEMENTED_FEATURES.md), [posting-ready feature list](docs/feature-list-for-posting.md), and [documentation index](docs/README.md).

## Install

Use this manifest in Foundry's Install Module dialog:

```text
https://github.com/GMPneuma/PneumaCombatTools/releases/latest/download/module.json
```

Enable libWrapper and Combat Tools in a Cyberpunk RED Core world. Restart the Foundry server after an update if its loaded module metadata does not include the socket registration, then reconnect clients. Configure campaign rules before starting an encounter. Visual Tools is optional and separately distributed; Combat Tools no longer renders screen glitches or fire overlays.

## Start here

- [Player guide](docs/player-guide.md) and [GM guide](docs/gm-guide.md).
- [Settings reference](docs/settings-reference.md).
- [Workflow diagrams and state storage](docs/flow-map.md).
- [Send HUD messages from macros or modules](docs/hud-api.md).
- [Remaining work and verification](BACKLOG.md).

## Development

Source is strict TypeScript under `src/`; do not edit generated `dist/` files.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

Package the contents of `dist/` at the ZIP root. The build does not create the ZIP. Browser fixtures require Playwright and, for some tests, local jQuery, Handlebars or PIXI paths; see [verification](docs/verification.md).

The 0.8.2 release passed 352 automated checks, with four native-Foundry checks skipped and no failures. Live multiplayer verification remains separate.

## Unofficial content

Pneuma's Combat Tools is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.
