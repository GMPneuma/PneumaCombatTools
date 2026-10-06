# Movement tracking

Current implementation: Combat Tools 0.9.10 plus unreleased counter visibility changes; source-reviewed 2026-10-04.

Enable movement counters is a GM/world option. Tracking operates in a started active scene encounter on supported square grids, with costs in scene distance units. Hex/gridless tracking is not implemented. Counters are advisory about allowance; exceeding it does not itself block movement.

Accepted token movement stores origin, elevation, spent distance and on-foot movement. A scene-space start marker remains fixed while the token moves. Adjacent perpendicular one-square moves combine into a diagonal only when a wall collision check permits the shortcut; backtracking and long routes are not retroactively optimized.

The counter is green through normal allowance, yellow through run allowance, and red beyond it. Run indicates the table's Action cost; it does not spend an Action. Owners/GMs can Reset to the saved position/elevation and clear spent movement. A successful Reset leaves an eligible counter visible at zero and hides its start marker until movement resumes; failed resets retain the previous value. Reset does not undo attacks, damage or resolved AoE relocation.

Counters show only for the current-turn token and, on a GM's client, selected combatant tokens. The current-turn counter appears before any movement, including visible NPC turns. Players selecting an off-turn token do not reveal its counter. Invisible tokens remain hidden, and counters stay absent outside the supported active encounter. Start markers follow the same eligibility. Viewing another counter grants no control. At the next turn a new origin/allowance is established; combat reset/deletion clears tracking. AoE MOVE costs/debt integrate with the ledger without refunding already resolved evasion by Reset. Held grapple defenders do not accumulate independent carried movement.

## Movement-related injuries

More than 4 m/yd on foot creates separate owner/GM cards for Broken Ribs, Foreign Object (Body) and Foreign Object (Head). Apply 5 damage manually at turn end. Removing an injury or resetting movement below the threshold withdraws pending eligibility; resetting is not damage undo. Optional turn-end HUD reminders point to unpaid cards.

Damaged/Lost Ear crossing the threshold schedules an advisory next-turn Move Action warning. It does not block that Action. See [injury coverage](body-head-injury-coverage.md).

State lives on Token `flags.pneuma-combattools.movement`, with AoE budget/debt on Combatant and injury cards/receipts on ChatMessage/Actor. GM movement modes, grapple movement restrictions and configured EMP frame immobilization are distinct from the advisory allowance counter.

Implementation: [movement.ts](../src/scripts/movement.ts), [movement-rules.ts](../src/scripts/movement-rules.ts), [aoe/movement.ts](../src/scripts/aoe/movement.ts), [injury-mechanics.ts](../src/scripts/injury-mechanics.ts), [injury-notices.ts](../src/scripts/injury-notices.ts).

Visibility validation: real Pixi/headless browser checks cover current-turn NPC/player counters, off-turn player selection, GM selection/deselection, turn changes, zero counters before movement and after Reset, invisible tokens, and combat end. The production build and 542 automated checks pass, with four native geometry checks skipped. Live Foundry/multiplayer verification remains separate.
