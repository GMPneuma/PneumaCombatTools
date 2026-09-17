# Changelog

## 0.1.2 - 2026-09-17

- Migrate runtime source to strict TypeScript with Foundry v12 types, a pnpm lockfile, and dependency-aware CI. Keep output directly in dist.

- Show the currently selected actor's equipped weapon names and icons in the Attack panel for evaluation; no attack rolls yet.

- Open the player Combat HUD through canvas pointer input on visible, unowned tokens; ignore drags and retain native owned-token controls.

- Anchor the Combat Tools controls to the clicked token in Foundry's canvas HUD container instead of the screen edge.

## 0.1.1 - 2026-09-17

- Write module files directly into dist and remove the extra module subfolder.
- Update manual installation instructions. Combat HUD behavior is unchanged.

## 0.1.0 - 2026-09-17

- Initialize the Foundry VTT v12 / Cyberpunk RED module scaffold.
- Add lifecycle entry point, style and translation files, validation, and a distribution build.
- Add a native-style combat HUD with working target toggling and placeholder Attack, Thrown Weapon, and Quickhacks panels.
- Add player access on unowned tokens and a Combat Tools button in the native HUD for owned tokens and GMs.
