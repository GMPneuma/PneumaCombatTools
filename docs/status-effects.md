# Status picker and native synchronization

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

The token HUD provides the module's grouped Cyberpunk status catalog, with native injuries and supported drugs/pharma bound to their native items/effects. The GM can edit custom status names/icons; custom markers do not automatically gain mechanics. Avoid another module simultaneously replacing/managing the same palette without testing compatibility.

The token picker hides Lightly Wounded, Seriously Wounded, Mortally Wounded, Speed Heal and Quick Fix. Definitions remain registered so existing effects and wound automation continue normally. Other entries retain their native click/right-click handlers.

Failed suppression responses apply Suppressed; GM reset/exclusion removes the marker for that token response, preserving other sources. New combat markers automatically expire at the end of the affected character's next turn; a marker applied during their current turn survives until their turn ends next round. The timer follows the original encounter, clears on reset/deletion or participant removal, and catches up on reconnect. Moving to cover and clearing outside combat remain manual. Grapple Choke applies Choking 1/2 on consecutive rounds; Unconscious replaces the managed choking stage. A skipped sequence clears managed choking markers. Release, successful break/escape, throw and other grapple endings remove all Choking 1/2 markers, including manual ones, without removing Unconscious or unrelated effects.

Activating a bound injury imports/reuses its native injury item and corresponding marker; removing the bound injury removes its associated injury source. Drug activation enables supported effects; deactivation disables those effects and preserves inventory. Existing native items/effect changes reconcile back to the palette. Queues are per actor, passive refreshes are batched, and unrelated cosmetic changes do not force reconciliation.

The Add Effects picker is related but narrower: Instant Effects, Body Crits, Head Crits, Drugs, Pharma, Misc; no addictions or wounded-state entries. This exclusion does not erase those states from actors or from other HUD indicators.

An icon is not proof of complete rule automation. See [injury coverage](body-head-injury-coverage.md) and [status mechanics audit](status-mechanics-audit.md) for native modifiers, reminders and manual contexts. Treatments, doses, addiction checks and generic action budgets are not supplied by palette synchronization.

Styling and custom artwork remain separate from mechanics. Preserve native IDs and bindings when integrating; use the status API/managed workflow rather than replacing names to simulate mechanics.

Implementation: [status-catalog.ts](../src/scripts/status-catalog.ts), [status-settings.ts](../src/scripts/status-settings.ts), [status-hud.ts](../src/scripts/status-hud.ts), [status-sync.ts](../src/scripts/status-sync.ts), [damage-status.ts](../src/scripts/damage-status.ts).

2026-10-09 local update: Drugs contains nine primary statuses; Addiction contains the nine corresponding addiction statuses. Both groups are collapsed and alphabetical, and retain native Foundry controls. This reorganization preserves all IDs and native bindings. Hornet's Pharmacy drugs/pharmaceuticals are already included in this catalog. Emerald City, Mortalis and Red Lace remain excluded by user request. Piranha Smash uses Smash's status; its different addiction-check DV is not handled by the status picker.

General status group (2026-10-09, local/unreleased): normal and custom token statuses appear in a General disclosure section above the specialized groups. General starts expanded on each new HUD render and can be collapsed by clicking its heading. Other sections retain their collapsed defaults. Native status controls and alphabetical order are preserved.

All-area noncombat targets (2026-10-09, local/unreleased): all area attacks accept affected scene tokens outside the encounter tracker. AoE target damage, attached effects, special-grenade resistance/application and GM recipient controls retain the originating encounter without requiring target membership. Optional evasion MOVE spending/borrowing applies only to tracked combatants; outside-tracker evaders can relocate without turn bookkeeping. Attacker membership, actor permissions, scene checks and ended/reset encounter validation remain. Timed effects follow the originating encounter clock; outside-tracker On Fire damage and suppression next-turn timing require manual handling.

Blue Glass native-source correction (2026-10-09, local/unreleased): CPR v0.92.4 core Blue Glass (UrKzMiFp4xFOLNIC) has effects: [], usage: toggled and consumed: None. Remove the invalid primary/addiction native-effect bindings that caused Native Blue Glass effect is unavailable. Both existing IDs remain manually managed markers, preserving inventory and independent addiction state. Supersedes the earlier claimed Blue Glass native-effect synchronization; no drug effects or mechanics are invented.

Status list correction (2026-10-09, local/unreleased): removes Asphyxiating and Iron Grip from the Combat Tools status catalog and removes the dedicated Asphyxiating HUD recognition. Existing actor effects are not automatically deleted. Historical audit documents remain as history.
