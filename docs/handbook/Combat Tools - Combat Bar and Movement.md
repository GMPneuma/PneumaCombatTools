# Combat Bar and Movement

## Combat bar

The bar follows the active, started encounter for the canvas scene. Portrait controls retain native selection, permitted sheet/context actions and navigation. GM round controls provide native Roll All, Roll NPC and Reset Initiative. End Turn requires the active participant's owner or GM and GM coordination.

Use the gear or Module Settings → Combat Bar Configure for bottom-left/top-right placement, horizontal/vertical layout, portrait size and tooltip preferences. Display settings are personal. A top-right bar temporarily moves Biomonitor left without overwriting its saved side.

Outside combat, players see their assigned character; GMs see the assigned characters of online players. Characters appear even without tokens on the current scene. Shared assignments appear once. Double-click opens the character sheet; token selection, ping and pan require a matching scene token. The bar can be minimized. Encounter-only controls remain unavailable.

## Shared movement modes

| Mode | Player movement |
| --- | --- |
| Default | Native movement and normal tracking. |
| No Movement | Blocked; GM corrections remain available. |
| Combat Move | Only the current token in the active scene encounter may move; GM exempt. |
| Free-Move | Unrestricted; the independent movement counter may still track. |

The GM chooses a default for newly started combats. Hiding the combat bar does not disable movement rules.

## Counters and Reset

Movement tracking requires a started active scene encounter and a supported square grid; hex/gridless tracking is not implemented. Accepted movement records start position/elevation, distance and on-foot movement. The marker stays at the saved start.

Counter colors show green through normal allowance, yellow through run allowance and red beyond it. Exceeding the counter allowance does not itself block movement or spend an Action. Distinct movement modes, grapples or EMP immobilization can still restrict movement.

Owners/GMs can Reset to the saved position/elevation and clear tracked movement. A successful reset leaves an eligible counter visible at zero and hides the start marker until movement resumes. It does not undo attacks, damage or completed area-evasion costs/debt. The next turn establishes a fresh movement origin/allowance; reset/deletion clears encounter tracking.

Adjacent perpendicular one-square moves can combine as a diagonal only when wall checks permit the shortcut. Longer routes and backtracking are not retroactively optimized. Held grapple defenders do not accrue separate carried movement.

Only the current-turn token shows its counter to players, including visible NPC turns. The GM also sees counters for selected combatant tokens. Counters appear at zero before movement; off-turn player selection does not reveal them. Invisible tokens remain hidden. Viewing a counter grants no control.

Related: [Combat Tools - Injuries and Effects](Combat%20Tools%20-%20Injuries%20and%20Effects.md), [Combat Tools - Grappling](Combat%20Tools%20-%20Grappling.md), [Combat Tools - Encounters and Outside Combat](Combat%20Tools%20-%20Encounters%20and%20Outside%20Combat.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
