# Pneuma's Combat Tools

Combat workflows and a character status HUD for Cyberpunk RED in Foundry VTT. Combat Tools connects attacks, defender responses, damage and conditions while reusing the system's native rolls and character data.

## Features

- **Combat resolution:** target-based weapon attacks, Evasion, damage and critical injuries in coordinated chat cards.
- **Area attacks:** grenades, rockets, shotgun shells and suppressive fire, with placement and individual target responses.
- **Instant effects:** reusable ammunition and condition resolutions, including poison, EMP, fire and smoke.
- **Grappling:** opposed grabs, holds, escapes, choking and throws.
- **QuickHack:** Jack-In, encounter connections, hacking and detection/ejection workflows.
- **Character HUD:** vitals, medical conditions, drugs, cyberware and private notifications, with Biomonitor sharing.
- **Native conditions:** synchronized status markers, injury items and supported Active Effects.
- **Movement and injury support:** movement counters, optional evasion movement costs and selected injury mechanics.
- **Combat bar:** compact actor portraits, personal layouts, turn controls and GM movement modes.
- **GM configuration:** rules options, permissions and visibility controls, with player-specific display settings.

See the [feature overview](IMPLEMENTED_FEATURES.md) for scope and the [documentation index](docs/README.md) for detailed guides.

## Install

Requires **Foundry VTT v12**, **Cyberpunk RED Core** (`cyberpunk-red-core`) and **libWrapper**.

In Foundry's Add-on Modules screen, choose **Install Module** and use this manifest:

```text
https://github.com/GMPneuma/PneumaCombatTools/releases/latest/download/module.json
```

Enable Combat Tools and libWrapper in your world. Keep an active GM connected for shared combat resolution. After replacing installed code or styling, refresh each client. If module.json changes, fully restart Foundry to reliably reload its package metadata.

## Start here

- **Players:** [Player guide](docs/player-guide.md) — attack, defend, apply damage and read your HUD.
- **GMs:** [GM guide](docs/gm-guide.md) — setup, rules choices, encounter management and limitations.
- **All guides:** [Documentation index](docs/README.md).
- **Planned work:** [Backlog](BACKLOG.md). [Changelog](CHANGELOG.md) records releases.

The 0.7.0 release passed build, regression and browser-fixture checks. Live Foundry multiplayer verification remains separate. Some effects still require GM adjudication; the guides distinguish those from automated behavior.

## Development

Use Node.js 22+ and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

Source is in `src/`; `dist/` contains the installable module. For manual installation, copy the contents of `dist/` into `Data/modules/pneuma-combattools/`. See the [developer references](docs/README.md#developer-references) for card styling and integration APIs.

## Unofficial content

Pneuma's Combat Tools is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.
