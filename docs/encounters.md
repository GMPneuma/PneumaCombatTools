# Encounter selection

New actions use the active, started encounter for their scene. Viewing an encounter in the Combat Tracker does not select it for Combat Tools. Foundry v12's native active flag and combatant token documents supply the selection; no polling or extra socket exchange is introduced.

- Only one active, started encounter may qualify for the scene. Multiple matches stop the action with a GM-facing explanation, even if only one contains the requested participants.
- Scene-less encounters qualify through combatant tokens belonging to the action scene.
- Combat tracking requires the exact participating tokens, not merely another token of the same actor. A token may belong to multiple encounters; inactive memberships do not compete for new actions.
- Actions started without a qualifying encounter remain outside combat. Features requiring combat, including EMP and tracked QuickHack connections, remain unavailable there.
- Saved actions carry their encounter ID, reset generation, scene and relevant token UUIDs. Responses and GM-side requests use this saved context, including when the GM views a different scene. Changing which encounter is active does not move an existing action.
- Ending, resetting or deleting the originating encounter, moving it to another scene, or removing required combatants blocks unfinished actions. Start a new action after correcting the encounter. Outside-combat actions are never silently adopted by a later encounter.

## Workflows

The combat bar and ordinary movement counters display the active scene encounter. Attacks, grapples and QuickHack capture participating token membership. Area attacks capture the source encounter and check covered token membership before consuming ammunition; added targets must also belong to it. AoE escape accounting carries the saved encounter through the GM queue.

EMP requests retain their encounter; timed disablements use that encounter's round clock. Instant effects, QuickHack effects, smoke, and temporary injuries receive the originating clock explicitly. Outside-combat durations use world time. Actor-only sheet actions use the current scene and reject ambiguous duplicate actor tokens; synthetic actors retain their exact token identity. Native actor HP and effects remain shared for linked tokens.

Manual damage chooses encounter context when a recipient is selected and sends that context to the GM. Selected-recipient application from a tracked attack requires the recipient to belong to that same encounter. Turn-driven fire and injury processing uses the encounter delivered by the native event; fire's repeat-prevention key includes the reset generation.

## Validation

Assumes a clean environment; no new legacy-card migration or compatibility layer is provided. Run `pnpm test` to rebuild and run non-browser regression tests. CI runs the same suite. Browser fixtures remain separate because they require local browser dependencies. Automated checks do not establish live Foundry multiplayer operation.

Implementation: [shared selector](../src/scripts/encounter.ts), [regression tests](../scripts/encounter.test.mjs).

Damage-applied conditions newly activated during an encounter clear when that encounter ends or resets, even without a timer. Native drug effects are disabled while inventory remains. Preexisting statuses retain their ownership; critical injuries and Dead are not assigned encounter-end cleanup. Incendiary fire and sleep Prone use the saved encounter as well.
