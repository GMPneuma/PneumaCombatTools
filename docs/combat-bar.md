# Combat bar

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

## Position and layout

The gear opens Combat Bar settings using the same settings/permissions as Module Settings. Four radio choices combine dock and orientation: Bottom left horizontal, Bottom left vertical, Top right horizontal, Top right vertical. Portrait sizes: 32, 40, 48, 64, 80 or 96 px. Display, name-only tooltips and size are personal settings.

Movement controls stay at the dock; the actor list grows from the same translucent bar. Round/turn controls occupy the opposite end. Previous/next arrows remain left/right and sit side-by-side even in vertical layout. Minimize retains essential dock controls.

The bottom-left vertical bar is bounded by canvas-tool clearance; the horizontal layout clears the macro bar. Portrait lists scroll when constrained in either orientation, and the active participant is brought into view. Canvas tools and their expanded submenu retain visual priority. Top-right anchors beside the sidebar, reverses the growth direction and keeps End Turn/flyouts adjacent. It temporarily forces Biomonitor left and restores its saved side when moved back.

## Portrait and turn actions

Portraits use actor artwork and native combatant visibility. Selection, permitted sheet opening, native context actions, pan/ping and GM pull-pings retain permission checks. The round control offers GM native Roll All, Roll NPC and Reset Initiative actions. End Turn is available to the GM or active participant's owner, coordinated through the GM. Native right-click combatant controls include Roll Initiative.

The bar follows the active started encounter for the canvas scene. Outside combat it shows eligible scene tokens: player-owned visible tokens for players and connected players' owned tokens for the GM.

## Shared movement modes

| Mode | Behavior |
| --- | --- |
| Default | Native movement and normal tracking. |
| No Movement | Blocks player token movement; GM can correct positions. |
| Combat Move | Only the current token in the scene's active encounter may move; GM exempt. |
| Free-Move | Unrestricted movement; the independent counter can still track movement. |

The starting mode is a GM/world setting applied when a new encounter starts. Hiding the bar does not disable movement rules. Warnings are throttled; action expenditure is not tracked.

The native Players heading cycles Online → All → Minimized → Online, supports keyboard activation and preserves native player context menus. The minimized heading remains available to reopen the list.

Implementation: [combat-bar.ts](../src/scripts/combat-bar.ts), [combat-bar-state.ts](../src/scripts/combat-bar-state.ts), [combat-bar-flyout.ts](../src/scripts/combat-bar-flyout.ts), [combat-bar-turn.ts](../src/scripts/combat-bar-turn.ts), [combat-bar-settings.ts](../src/scripts/combat-bar-settings.ts), [players-control.ts](../src/scripts/players-control.ts).
