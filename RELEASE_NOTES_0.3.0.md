# Pneuma's Combat Tools 0.3.0

Requires Foundry VTT v12, Cyberpunk RED Core, and **libWrapper**. Enable libWrapper, restart the Foundry server after updating, and reconnect all clients. Disable the standalone Pneuma Quickhack module when using the integrated QuickHack features.

## Added

- Grappling with native opposed Brawling, Choke, Throw, Escape, Release and encounter/HUD tracking.
- Grenade, rocket and shotgun-shell area attacks, individual defenses, shared damage, wall-aware templates, Cover Up and optional evasion movement costs.
- Integrated QuickHack rules/settings, content initialization, encounter connections, Jack Out and Force Out workflows.
- Movement counters, start markers, return/reset controls, Run colors, shared player counters and a GM world toggle.
- Combat-duration EMP disablement with selection/random options, immunity settings, Biomonitor reporting and temporary cyberlimb indicators.
- Medtech hover EKG with an Always show EKG world setting.
- Self CTH with an optional Pneuma HomeBrew speedware initiative reroll.
- Native status synchronization and organized settings.

## Improvements

- Shared combat-card presentation preserves native dice and result controls.
- Targeted, batched QuickHack/movement refreshes and cached hover DV tables reduce unnecessary rendering.
- libWrapper coordinates EMP guards and persistent damage-summary capture.
- Separate Foundry v13 migration verification checklist.

## Validation and limits

Typecheck/build and full automated suite: 205 passed, 4 native-Foundry-source checks skipped. Browser fixtures cover combat cards and HUD workflows. No live multiplayer performance or companion-module compatibility certification is claimed.

Known limitations remain: concurrent LUCK spending, native critical-injury completion timing, simultaneous status-selection edits and older selected-target damage retries need further hardening. Action costs remain table-managed where documented; some QuickHack/EMP source effects require GM adjudication.
