# Status mechanics coverage and remaining work

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

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
