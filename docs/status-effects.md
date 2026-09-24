# Status picker and native synchronization

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

The token HUD provides the module's grouped Cyberpunk status catalog, with native injuries and supported drugs/pharma bound to their native items/effects. The GM can edit custom status names/icons; custom markers do not automatically gain mechanics. Avoid another module simultaneously replacing/managing the same palette without testing compatibility.

Activating a bound injury imports/reuses its native injury item and corresponding marker; removing the bound injury removes its associated injury source. Drug activation enables supported effects; deactivation disables those effects and preserves inventory. Existing native items/effect changes reconcile back to the palette. Queues are per actor, passive refreshes are batched, and unrelated cosmetic changes do not force reconciliation.

The Add Effects picker is related but narrower: Instant Effects, Body Crits, Head Crits, Drugs, Pharma, Misc; no addictions or wounded-state entries. This exclusion does not erase those states from actors or from other HUD indicators.

An icon is not proof of complete rule automation. See [injury coverage](body-head-injury-coverage.md) and [status mechanics audit](status-mechanics-audit.md) for native modifiers, reminders and manual contexts. Treatments, doses, addiction checks and generic action budgets are not supplied by palette synchronization.

Styling and custom artwork remain separate from mechanics. Preserve native IDs and bindings when integrating; use the status API/managed workflow rather than replacing names to simulate mechanics.

Implementation: [status-catalog.ts](../src/scripts/status-catalog.ts), [status-settings.ts](../src/scripts/status-settings.ts), [status-hud.ts](../src/scripts/status-hud.ts), [status-sync.ts](../src/scripts/status-sync.ts), [damage-status.ts](../src/scripts/damage-status.ts).
