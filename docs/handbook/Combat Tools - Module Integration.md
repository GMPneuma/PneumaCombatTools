# Module Integration

## Requirements and optional companions

| Component | Integration and responsibility |
| --- | --- |
| Foundry VTT v12 | Native documents, permissions, encounters, sockets, templates and chat. Manifest verified 12.343, maximum 12. |
| Cyberpunk RED Core | Native sheets, attack/Evasion/skill/Interface rolls, ammo, armor, injury items and effects. |
| libWrapper | Required native method wrapping; absence prevents supported initialization. |
| Pneuma Crew Tools | Optional Biomonitor/HUD shortcut integration. Personal setting, default on; standalone fallback when absent. |
| Standalone Pneuma Quickhack | Disable it to use Combat Tools QuickHack. An active standalone module suppresses the integrated QuickHack path to avoid duplicate handling. |
| Visual Tools | Separately distributed optional Neural Intrusion glitch renderer. Combat Tools retains connection/status/Eject mechanics. |
| Dice So Nice | Uses the native CPR dice handler for supported hidden/revealed rolls. Actual client visibility/duplicates require live verification. |
| Other themes/HUDs/macros | No blanket compatibility claim. Native classes and behavior are reused where supported; verify overlapping controls in the installed world. |

## Native workflow boundaries

Target HUD attacks use native CPR calculations with Combat Tools coordinating the defender and damage state. Arbitrary sheet/macro attacks are not universally intercepted into defense cards. Native reload/load actions and supported native ammunition results have their own integration paths.

Keep general character-sheet work native. Combat Tools is not a replacement sheet or general-purpose Token Action HUD. External damage macros that only change HP cannot automatically identify ammunition or reproduce all managed effects.

Hidden attack results are a tabletop presentation rule. The native roll can already exist before the defender decides. Client-local preferences and private roll audiences must be checked on the affected clients; an isolated dice test is not proof of live multiplayer behavior.

## Public integration surfaces

Read `game.modules.get("pneuma-combattools").api` after Foundry ready and check module/API availability first.

| API | Purpose |
| --- | --- |
| `hud` (version 2) | Local or GM-addressed session messages; send, remove, dismiss and list. |
| `getNeuralIntrusionActor()` | Read the focused owned actor with a detected incoming connection. |
| `pneumaCombatToolsNeuralIntrusionChanged` hook | Notify consumers when that focused intrusion actor changes. |
| `instantEffects.catalog` / `create(actor, id, sourceMessage?)` | Supported effect catalog and resolution-card creation; does not skip resistance or application. |
| `itemMarkers` | Persistent visual item annotations; generic markers do not mechanically disable items. |

The QuickHack integration also exposes execution/connection helpers, but these notes do not invent a stable external signature for them. Inspect the current integration source before a custom caller uses them.

Use public APIs rather than fabricated socket messages or editing encounter flags. A hook that runs on every client should not broadcast the same message from every client.

Related: [Combat Tools - Macros and API](Combat%20Tools%20-%20Macros%20and%20API.md), [Combat Tools - Settings Reference](Combat%20Tools%20-%20Settings%20Reference.md), [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
