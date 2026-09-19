# Changelog

## 0.2.0 - 2026-09-19

- Add native Token HUD combat controls, target-preserving right-click behavior, sizing settings and ranged hover DVs.
- Add paired attack/Evasion resolution for ranged, melee, unarmed, Martial Arts and thrown weapons, including configurable homebrew ranged evasion.
- Add in-card native damage rolls and application, Shift-click options, compact recipient results, three status slots and critical-injury controls.
- Check ammunition before starting attacks; support optional Martial Arts no-ablation and attacker-selected improvised damage (1d6–6d6).
- Add Used/Disabled item markers and a documented marker API.
- Add the persistent cybereye HUD and optional Biomonitor: Vitals with animated EKG, Biological Scan and Implant Integrity.
- Preserve the last dragged HUD position across resizing; minimize to an EKG on the left and notification icon on the right when a Biomonitor is available.
- Add EKG pause/resume, optional HP concealment, active-only effect lights and alerts that scroll three times before centering.
- Add GM messaging from the HUD, message navigation and individual clearing, duration presets and a documented public HUD messaging API.
- Batch and target pending-card refreshes; preserve unchanged Biomonitor content instead of rebuilding it for unrelated events.
- Document chat-card styling hooks, current features and deferred work. General chat cosmetics remain in Pneuma Visual Tools.

Known limitations: live multi-client compatibility remains unverified. Concurrent attack LUCK spending, native critical-injury completion, simultaneous status-picker edits and replay of older selected-target damage requests need further hardening; see [audit](docs/audit-2026-09-19.md). Native status synchronization, ongoing status mechanics, grenade/rocket resolution, Grapple and Quickhack execution remain deferred.

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
