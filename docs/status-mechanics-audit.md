# Status mechanics coverage and remaining work

Status ownership reviewed 2026-11-12 across all 74 built-in entries.

| Catalog family | Native item bindings | Other entries |
| --- | --- | --- |
| Critical injuries | All 11 head and 11 body injuries | Only injuries without an embedded effect need a separate sync marker. |
| Drugs | Prime Time, Sixgun, Timewarp, Black Lace, Boost, Smash, Synthcoke | Berserker and Blue Glass |
| Addictions | Berserker, Prime Time, Sixgun, Timewarp, Black Lace, Boost, Smash, Synthcoke | Blue Glass Addiction |
| Pharmaceuticals | Veritas and Stim | Sedative, Antibiotics, Rapidetox, Speed Heal and Surge |
| General | No fixed compendium item binding for the 27 general statuses | The token picker uses matching registered status definitions and applicable item effects. Specific workflows can manage their own duration, source or mechanical changes. |

For a bound status, the actor sheet and token toggle operate on the same underlying item effect. Removing a fallback injury marker dismisses the marker for that injury instance. An explicit toggle can display it again. Inventory and injury items remain available for their usual treatment and removal actions.

This current coverage summary supersedes the [dated audit](history/pre-0.8.0-refresh/status-mechanics-audit.md). It separates native mechanics, module automation and manual context.

| Family | Supported behavior | Boundary |
| --- | --- | --- |
| 22 critical injuries | Native item/effect binding; specific module guards, damage cards and reminders | See the complete [injury matrix](body-head-injury-coverage.md). Treatment/action context manual. |
| Burning | Native severity, turn-end HP loss, Extinguish | No outside-combat automatic tick or fire-screen overlay. |
| Sleep/Unconscious | Managed Sleep expiry/wake-on-damage/touch, Prone retained | Other unconsciousness sources preserved; Action expenditure manual. |
| Poison/Biotoxin | Resistance, direct HP application, exposure report | Meat/immune target ruling and unsupported macros manual. |
| Sensory effects | Flashbang/Teargas temporary native injuries; Sonic Shock native ear injury/Deafened | Sight/hearing context remains adjudicated. |
| Grappled | Managed relationship, penalties, carried token and self-HUD actions | A loose Grappled marker is not a complete relationship; item transfer manual. |
| Disabled cyberware | Shared EMP/timed causes, supported suppression/guards, restoration | Generic visual Disabled badge alone has no mechanics. |
| Drugs/pharma | Bound native activation/deactivation and declared duration; active HUD lights | No universal dose consumption, addiction, overdose or treatment automation. |
| Wounded states | Native derived state/HUD display | Not selectable attachments in Add Effects. |
| Prone and other general markers | Native status display and source-specific rules when implemented | Icon alone does not enforce every action/cover/sense rule. |
| Custom statuses | Name/icon configuration and display | No inferred penalties, clocks or custom rules. |

Prepared artwork and catalog entries are not promises of behavior. Active-effect recognition is also separate from possessing an inventory item. Additional condition mechanics require a concrete workflow and explicit approval.

Open verification: real native item activation, linked/unlinked actors, treatment/removal from other modules, combat cleanup, simultaneous owners and vision/fog. See [backlog](../BACKLOG.md) for unresolved reports.

Implementation: [status-catalog.ts](../src/scripts/status-catalog.ts), [status-sync.ts](../src/scripts/status-sync.ts), [instant-lifetime.ts](../src/scripts/instant-lifetime.ts), [hud-conditions.ts](../src/scripts/hud-conditions.ts).
