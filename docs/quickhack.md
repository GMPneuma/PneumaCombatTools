# QuickHack

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

QuickHack integrates target-aware native netrunning rolls and encounter connections. Enable it in Module Settings; an active standalone Pneuma Quickhack module suppresses this integration to avoid duplicate handling. Its enable switch blocks new/pending actions without undoing existing effects or connections.

## Setup and workflow

Choose availability: RAW catalog, Must Buy QuickHack, or loaded in an equipped cyberdeck. Native installed-program lists govern loading; REZ is not loading. Missing module programs/launcher can be created without rewriting existing inventory. No broad conversion or repair migration is performed.

Start the intended combat and select the netrunner. Jack-In/QuickHack checks use 25 grid squares and wall sight to sampled target points. Losing sight blocks actions but does not disconnect; restoring sight permits them again. Interface resolves Jack-In/QuickHack; Netrunners detect automatically, other targets oppose detection with WILL. Detection ties favor detection; QuickHack must beat its DV.

A detected link becomes Neural Intrusion. Successful noisy hacks reveal awareness; Lure retains its silent-success exception. Detection/audience/identity live on the Combat connection, not reconstructed from chat history. Deleted chat cards do not erase a connection. Multiple detected runners produce separate Eject choices.

Force Out uses target Concentration against runner Interface; ties favor the runner. Successful ejection blocks re-Jack-In for that encounter. Jack Out disconnects voluntarily and permits a later fresh connection. Outside combat, Jack-In/Force Out can be roll/chat-only; QuickHack requires a tracked encounter connection.

## Effect coverage

| Hack | Implemented result | Table responsibility |
| --- | --- | --- |
| Impair Movement | Timed MOVE reduction | Tactical/action choices. |
| Sonic Shock | Temporary native Damaged Ear and Deafened | Sensory context and communication rulings. |
| Overheat | Strong fire; 4 direct HP at turn end, no stacking | Manage extinguishing Action. |
| Short Circuit | Three-item timed shared disablement | Configured chooser decision. |
| Cyberware Malfunction | One-item timed disablement, permitted host cascade | Netrunner/player choice or configured random method. |
| Lure | Roll/result and silent-success behavior | Movement/behavior decision. |
| Slow | Native 1d6 reduction amount and timed MOVE effect | Tactical choices; no general Action budget. |
| Synapse Burnout | Native damage control | Explicit damage application. |
| Puppet | Roll/result guidance | Command and target action adjudication. |
| Shard Ejection | Roll/result guidance | Physical chipware/inventory change. |
| System Reset | Sleep/Unconscious plus Prone; wake-on-damage/touch | Wake/Get Up Action expenditure. |

Repeated matching movement effects refresh their duration and preserve the stronger penalty rather than stacking duplicates. Screen glitches are supplied separately by Visual Tools. Neural Intrusion status and Eject remain in Combat Tools without it.

## Audience and state

Configure Quickhack Messages groups source/target/result audience, totals and identity options. Respect public/owner/GM and private native dice handling; ejection reuses recorded awareness audience. Connection state is `Combat.flags.pneuma-combattools.quickhackConnections`; result cards use `ChatMessage.flags.pneuma-combattools.quickhack`.

Custom hacks, Net Action spending, Neuroport requirements and Self-ICE/Passwall automation remain manual/deferred. See [EMP](emp.md) for disablement options and [flow map](flow-map.md) for recovery.

Implementation: [quickhack/workflow.ts](../src/scripts/quickhack/workflow.ts), [quickhack/connections.ts](../src/scripts/quickhack/connections.ts), [quickhack/force-out.ts](../src/scripts/quickhack/force-out.ts), [quickhack/effects.ts](../src/scripts/quickhack/effects.ts), [quickhack/conditions.ts](../src/scripts/quickhack/conditions.ts), [quickhack/catalog.ts](../src/scripts/quickhack/catalog.ts).
