# Cyberpunk statuses

Combat Tools supplies the native token HUD with the 64 Cyberpunk conditions, Dead, and custom statuses. Labels correct the old map's spelling errors while retaining its IDs. Native system icon assets are reused.

## Token HUD

The existing status controls remain native Foundry elements. General statuses and custom entries appear first. **Crit Head** and **Crit Body** each contain 11 injury icons and start collapsed. Pharmaceuticals and Drugs also start collapsed. Pharmaceuticals contains the existing Antibiotics, Rapiddetox, Speedheal, Stim and Surge statuses. Drugs contains Black Lace, Blue Glass, Boost, Smash and Synthcoke, including their addiction statuses. Quick Fix remains in the general list; unavailable statuses are not added. Expand a section to toggle a status. Native clicks and right-click overlay behavior remain attached to the original controls.

## Custom statuses

Open Configure Settings > Pneuma's Combat Tools > Edit custom statuses. Add or remove rows, enter a name, choose an icon with the native file picker, and save. IDs remain stable when names/icons change. Duplicate names/IDs are rejected. Removing a definition from the picker does not delete existing actor effects.

In Jail is included by default. On first load, existing custom Condition Lab entries are copied into Combat Tools' world setting, including an existing In Jail name/icon/ID. The old module's saved configuration is not modified.

Disable Condition Lab & Triggler after switching: both modules can write the global status list. Combat Tools warns when both are active; it does not disable another module or its macros automatically.

## What synchronizes

- Ordinary statuses already are native actor Active Effects. The token and actor share those effects.
- Native critical-injury items produce matching actor status markers. Markers contain no stat changes, so injury penalties are not duplicated.
- Adding an injury status creates the corresponding native injury item only if absent. Removing/disabling its status removes the linked injury item(s), including their native death-save consequences. It does not undo HP damage.
- Injury presence controls its icon. Disabling an injury's embedded modifier alone does not delete the injury or hide its icon.
- Supported native drug effects (Black Lace, Boost, Smash, Synthcoke and their addiction effects, plus Stim) produce markers when active. Status toggles activate/deactivate existing native embedded effects. If the native drug item is missing, it is imported with zero doses; marking a condition does not consume or grant doses.
- Other status labels are markers, not newly implemented rules. Blue Glass, fire, poison, treatments, wounds and the remaining conditions do not gain new automation in this step.
- Damage-card selections use the same status IDs and await native injury/effect application before completion.
- Existing actors and the current scene's synthetic token actors are reconciled once at startup/scene load. Later changes process only the affected actor.
- One elected active GM handles hook-driven writes, falling back to an active owner when no GM is online. Per-actor queues and internal mutation flags prevent loops and duplicate imports.
- Failed imports/removals restore markers to match actual source items and report the failure.

The module matches native item source IDs first (or its own saved binding), with original item names as a fallback. It does not guess mechanics from arbitrary renamed effects.

## Styling

The native .status-effects and .effect-control elements remain. Added classes:
- .pneuma-status-tray: scrollable container.
- .pneuma-status-grid: native icons in a grid.
- details.pneuma-status-group: collapsed status section.
- #pneuma-custom-statuses and .pneuma-custom-status-row: custom-status editor.

Section headings use the native light-text color token, with a light fallback. Themes can override --pneuma-status-heading-color.

Example: #token-hud .pneuma-status-group > summary { font-weight: bold; }

## Verification and scope

Automated state tests cover injury addition/removal, concurrency, import/removal failure, native drug toggling, custom names/IDs, legacy custom settings, and authority selection. Browser checks cover complete grouping, default collapsed sections, and preserved native control nodes/listeners. Live multiplayer Foundry validation remains outstanding.

This is the list/synchronization foundation. Timed fire damage, resistance checks, treatment actions, dose durations, addiction transitions, immunities, and HP-derived wound icons remain separate work.

- Implemented: opening the native status picker temporarily hides the Combat Tools controls and their menu. Closing the picker restores them; native HUD controls remain available.
