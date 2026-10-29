# Combat bar

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

## Position and layout

The gear opens Combat Bar settings using the same settings/permissions as Module Settings. Five radio choices combine dock and orientation: Bottom left horizontal, Bottom left vertical, Top right horizontal, Top right vertical, and Bottom-Docked. Portrait sizes: 32, 40, 48, 64, 80 or 96 px. Display, name-only tooltips and size are personal settings.

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

## Bottom-Docked

A horizontal bottom taskbar orders the Players icon button, movement/settings controls, combat participants, turn controls, and native macro bar. Minimize is omitted in this mode. The Players button opens the existing native player list above the dock, retaining its online/offline toggle and context menus; Escape or clicking outside closes it. Native macro execution, drag/drop, paging, locking and collapse controls remain attached to the original hotbar. Portrait size also sets macro and Players button size. Long participant and macro lists scroll horizontally within the available width. Switching positions, disabling Combat Bar, or tearing down the canvas restores native widgets to their original slots.

Native reference: Foundry v12.343 PlayerList, templates/user/players.html, templates/hud/hotbar.html and core hotbar styles. Browser fixture validation is separate from live Foundry/theme/multiplayer verification.

Bottom-Docked Players popup: every opening resets the native list to show all users, including offline users, and expands the list.

## Health strips

Static segmented health strips sit along the portrait bottom edge. GMs see health for all listed actors; players see it only for actors they own. Hidden combatant filtering is unchanged. Fill is clamped to the HP percentage; unknown or invalid maximum HP omits the strip. HP changes update the existing strip without rebuilding portrait controls. These permissions are independent of the hover EKG matrix.

Bottom-Docked offers a client-only **Use full screen width** option (off by default), visible only for that position. It extends the dock beneath the native sidebar and reserves the measured dock height above it for all sidebar tabs, including chat. Resizing portraits updates that space; disabling the option, switching positions, or removing the bar restores native sidebar sizing. Live Foundry/theme verification remains pending.

Bottom-Docked spacing: turn controls immediately follow the final combatant; spare width falls after the turn controls, keeping the native macro bar right-aligned whether expanded or collapsed.

Correction: opening docked Players sets the module's persisted `playersMode` to `all` before rendering. Setting only native `_showOffline` was overridden by the three-state Players integration. Regression coverage now loads that integration and checks actual rows, All label, and removal of minimized state.

Bottom-Docked checkbox **Resize Macro Bar to match Combat Bar** is client-only and on by default. Turning it off retains native macro slot sizing while Players and combat portraits continue to use Combat Bar size.

Combat Bar position settings place radios below the position label, with Bottom-Docked options in a right-hand column. That column reserves its height when hidden, keeping the window height stable as positions change. Native input names and save behavior are preserved.
