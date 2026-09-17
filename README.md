# Pneuma's Combat Tools

Combat utilities for Cyberpunk RED in Foundry Virtual Tabletop.

## Status

Initial v0.1.0 HUD skeleton. Target toggling works; Attack lists equipped weapons for evaluation; Thrown Weapon and Quickhacks remain placeholders. No combat mechanics are implemented yet.
Targets Foundry VTT v12 with the `cyberpunk-red-core` system. Live Foundry compatibility has not been verified.

## Development

Node.js 22 or newer and pnpm 11.19.0 are required. TypeScript and Foundry v12 type definitions are development dependencies; the installed module has no added runtime dependencies.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

The build writes module files directly into `dist/`. For manual installation, copy the contents of `dist/` into your Foundry user data `Data/modules/pneuma-combattools/` directory, restart Foundry, and enable **Pneuma's Combat Tools** in a Cyberpunk RED world.

## Structure

- `module.json`: Foundry module metadata and entry points.
- `src/scripts/main.ts`: typed module lifecycle and Combat HUD code; compiles to `dist/scripts/main.js`.
- `src/styles/pneuma-combattools.css`: scoped module styles.
- `src/lang/en.json`: English translations.
- `tsconfig.json`: strict TypeScript configuration using Foundry v12 types.
- `scripts/check.mjs`: source and built asset validation.
- `scripts/build.mjs`: typecheck, compile, and copy runtime assets directly into `dist/`.

Install through Foundry using this manifest URL: https://github.com/GMPneuma/PneumaCombatTools/releases/latest/download/module.json

## Combat HUD

- Players: right-click a visible, unowned token to open Combat Tools.
- Owned tokens and GMs: use the crosshair Combat Tools button in the normal token HUD.
- Target toggles the clicked token using Foundry targeting and preserves other targets.
- Attack displays weapon items marked Equipped on the currently selected owned actor, with names and icons. It shows the acting token name so selection can be evaluated. Weapon entries do not roll attacks. Thrown Weapon and Quickhacks remain placeholders; quickhack eligibility filtering is deferred.
- Thrown Weapon is separate from equipped attacks: knives and grenades will be selected from inventory, with area effects only where applicable.
- Escape, clicking outside, selection changes, or scene changes dismiss the combat HUD.
- The optional Shift + right-click shortcut is not included in this initial skeleton.

### Live validation checklist

In Foundry v12 with Cyberpunk RED, verify the player/unowned and GM/owned paths, preserved native HUD controls, target highlighting, placeholder panels, canvas pan/zoom alignment, and dismissal. Check right-drag panning and native double-right-click behavior with your active modules. Live Foundry validation remains pending.
