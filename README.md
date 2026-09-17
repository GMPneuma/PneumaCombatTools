# Pneuma's Combat Tools

Combat utilities for Cyberpunk RED in Foundry Virtual Tabletop.

## Status

Initial v0.1.0 HUD skeleton. Target toggling works; attack, thrown weapon, and quickhack panels are placeholders. No combat mechanics are implemented yet.
Targets Foundry VTT v12 with the `cyberpunk-red-core` system. Live Foundry compatibility has not been verified.

## Development

Node.js 22 or newer is required. No npm dependencies are needed.

```sh
npm run check
npm run build
```

The build creates `dist/pneuma-combattools/`. Copy that folder into your Foundry user data `Data/modules/` directory, restart Foundry, and enable **Pneuma's Combat Tools** in a Cyberpunk RED world.

## Structure

- `module.json`: Foundry module metadata and entry points.
- `scripts/main.js`: module lifecycle entry point.
- `styles/pneuma-combattools.css`: scoped module styles.
- `lang/en.json`: English translations.
- `scripts/check.mjs`: metadata, file, and JavaScript syntax validation.
- `scripts/build.mjs`: validated distribution build.

Install through Foundry using this manifest URL: https://github.com/GMPneuma/PneumaCombatTools/releases/latest/download/module.json

## Combat HUD

- Players: right-click a visible, unowned token to open Combat Tools.
- Owned tokens and GMs: use the crosshair Combat Tools button in the normal token HUD.
- Target toggles the clicked token using Foundry targeting and preserves other targets.
- Attack, Thrown Weapon, and Quickhacks open placeholder panels. They do not roll, consume items, or change actors. Quickhack eligibility filtering is deferred.
- Thrown Weapon is separate from equipped attacks: knives and grenades will be selected from inventory, with area effects only where applicable.
- Escape, clicking outside, selection changes, or scene changes dismiss the combat HUD.
- The optional Shift + right-click shortcut is not included in this initial skeleton.

### Live validation checklist

In Foundry v12 with Cyberpunk RED, verify the player/unowned and GM/owned paths, preserved native HUD controls, target highlighting, placeholder panels, canvas pan/zoom alignment, and dismissal. Check right-drag panning and native double-right-click behavior with your active modules. Live Foundry validation remains pending.
