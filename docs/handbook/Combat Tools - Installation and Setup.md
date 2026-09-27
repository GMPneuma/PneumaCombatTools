# Installation and Setup

## Requirements

| Component | Source-declared requirement |
| --- | --- |
| Foundry VTT | v12; manifest verified version 12.343; maximum 12. |
| Game system | Cyberpunk RED Core (`cyberpunk-red-core`). |
| Required module | libWrapper (`lib-wrapper`). |
| Combat Tools ID | `pneuma-combattools`. |
| Coordinated play | An active connected GM. |

The manifest inspected locally reports 0.9.0. These notes also cover current working-tree changes; check [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md) before comparing a control to a released build.

## Install

1. In Foundry's Install Module dialog, use this manifest:

```text
https://github.com/GMPneuma/PneumaCombatTools/releases/latest/download/module.json
```

2. Install and enable libWrapper and Combat Tools in the CPR world.
3. Reconnect clients after activation. If an update produces a module-socket registration warning, restart the Foundry server and reconnect; a browser refresh alone can leave old server metadata loaded.
4. Assign player Characters, verify token ownership and review Module Settings.
5. Start a small encounter with the intended participants and verify an attack, defense and explicit damage application.

## Initial choices

- **Ranged Evasion:** RAW, disabled, or configured homebrew.
- **Area Attacks & Suppressive Fire:** geometry, recipients' evasion, optional MOVE costs and Cover Up.
- **EMP Effect behavior:** selection method, eligible items and limb/frame consequences.
- **QuickHack:** enable it and choose availability/routing; disable standalone Quickhack if using the integration.
- **Movement:** choose counter behavior and starting combat movement mode.
- **Personal display:** configure Combat Bar, Biomonitor, Token HUD, hover DVs and turn indicators.

Do not assume changing a source default changes an existing world's saved setting. There is no general combat-resolution master switch in this source; individual optional systems have their own controls.

Related: [Combat Tools - GM Guide](Combat%20Tools%20-%20GM%20Guide.md), [Combat Tools - Settings Reference](Combat%20Tools%20-%20Settings%20Reference.md), [Combat Tools - Module Integration](Combat%20Tools%20-%20Module%20Integration.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
