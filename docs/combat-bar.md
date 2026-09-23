# Combat bar

The floating vertical bar sits on the left edge, directly above Foundry's Players control. It is 60px wide with a native-color semi-transparent surface, 40px square portraits, hover names and compact icon controls. End Turn appears beside the current portrait. All portraits are square and use the actor's artwork, never the token texture. Long lists scroll while the turn and GM movement controls remain accessible. **Show combat bar** is a client setting; hiding the display does not disable the GM's movement rules.

- Outside a started encounter, the GM sees scene tokens owned by connected players. Players see their own visible, owned scene tokens.
- During the scene's active, started encounter, everyone sees combatants in native turn order. The list uses exactly native combatant visibility, including its ownership exceptions. A token leaving line of sight remains listed. There is no extra token-hidden or line-of-sight filter on combat rows. The GM retains hidden entries with a hidden indicator. Actor-only and off-scene combatants retain their rows but have no scene interaction.
- Click a portrait to select its token, subject to native ownership. Double-click opens its native actor sheet with OBSERVER or higher permission, including permitted actor-only and out-of-view entries. Holding for Foundry's native long-press duration pings the token, subject to the native ping permission. Shift-click pans to it. Players cannot ping or pan to a token they cannot currently see; this does not remove its combat entry. Neither panning nor pinging changes the selected token.
- The current turn has a highlighted border and background. **End Turn** appears to its right for the GM and the active actor's owner, using the same semi-transparent styling. Player clicks go to an active GM, who checks ownership and the exact current turn before calling native Next Turn; direct Combat-document update permission is not needed. Concurrent or stale requests cannot skip another turn. GM left/right arrow buttons call native Previous Turn and Next Turn, preserving native round rollover, defeated skipping on advancement, hooks and time handling.

- GM hover shows a flyout of the actor's native temporary-effect icons, including its overlay status. It uses the same active-effect source as token rendering.
- Right-click shows the combatant's native per-row tracker buttons, rendered from the configured tracker template and dispatched through its native handler. User permissions determine which controls appear. Unseen tokens cannot be pinged or panned from this flyout either. Click outside, right-click the same entry, or press Escape to close.

## GM movement controls

| Mode | Behavior |
| --- | --- |
| Default | No extra movement restriction. |
| No Movement | Blocks player changes to token position and elevation, including outside combat. GM movement remains available. |
| Combat Move | Available during combat. Players can move only the specific token whose turn it is; all other player movement is blocked, including tokens outside combat or on other scenes without an active turn. |
| Free-Move | No turn restriction from this bar. Ownership, walls, pause behavior, grapple restrictions and other native/module rules still apply. |

Movement mode is a GM-controlled world setting shared by all clients and scenes. No Movement persists outside combat, including after an encounter ends. Combat Move checks the active encounter for the moved token's scene, not an encounter merely previewed in the sidebar; it falls back to Default once no active started encounters remain. Changing **Combat bar: movement for new combats** affects future starts. After a successful combat-start update, one active GM applies that setting to the shared mode. Its initial value is Default. Reloading clients retains the current shared mode.

Movement blocking uses the native cancellable `preUpdateToken` hook and applies to dragging, keyboard movement, elevation edits and ordinary document updates. It does not alter MOVE, suppress counters, or grant ownership. GM-coordinated evasion and held-token placement remain available for adjudication. Repeated movement warnings are limited to once per five seconds per reason on each client, across all tokens; every disallowed move remains blocked. This is a table control, not an anti-cheat mechanism.

## Native reference and verification

Inspected the locally cached Foundry v12 `CombatTracker.getData`, combatant visibility, `Combat.startCombat/nextTurn/previousTurn`, canvas ping/pan, native Players layout and CPR's Combat subclass. Selection uses native token control. The bar does not implement a separate encounter order; initiative controls reuse the native tracker handler.

Automated state and browser checks cover visibility, actor portraits, interactions, turn permissions, movement modes and lifecycle. Live Foundry rendering and multi-client behavior remain to be verified.

Presentation rules are bundled in the existing module stylesheet so a running server with cached manifest metadata loads them on a client refresh. No separate combat-bar stylesheet registration is required.

## Personal display preferences

Foundry client settings provide Small (32 px), Medium (40 px, default), and Large (48 px) square actor portraits, plus Vertical (default) or Horizontal layout. Each client remembers its own preferences. The bar has layout and minimize/restore buttons available to players and GMs, including outside combat. Minimizing hides portraits and turn controls. GMs retain all four movement controls at the lower-left of the screen, above the Players panel; players see only the restore button.

The four movement controls anchor the bottom-left corner **inside the same translucent bar** in both orientations and while minimized. Portraits expand upward in vertical layout or rightward in horizontal layout. The round counter and previous/next arrows occupy the opposite end: top for vertical, right for horizontal. Layout/minimize controls sit beside the movement controls. The shared bar remains directly above the native Players panel; movement controls do not move when portrait size, list length or minimization changes. Long lists scroll; End Turn remains beside the active portrait vertically and above it horizontally.

Validation: automated browser fixture covers all sizes and layouts, player controls, minimize/restore, arrow geometry, horizontal overflow and flyout placement. Live Foundry multiplayer layout verification remains pending.

Ping and Shift-click pan now call the configured Foundry v12 CombatTracker handlers directly, including outside combat using the scene token document. Native handlers determine rendered visibility, warn for unseen tokens, and preserve native pan zoom. Right-click controls no longer apply a second custom visibility gate. Combat list membership still uses native combatant visibility, independent of sight.

The per-client **Show name only** setting under Combat Bar removes click instructions from portrait tooltips. It defaults off, preserving the detailed tooltip; changes apply immediately.

GM exception: hold-to-ping, Shift-click pan, and right-click ping/pan always work for tokens on the current canvas regardless of rendered visibility or the selected token's vision. Players continue through the native tracker visibility checks. No automatic scene switching is performed.

GM Shift-long-click sends Foundry's native pull ping to the portrait's token, panning connected viewers of that scene as on the canvas. Short Shift-click remains a local pan. Players cannot pull other users. The detailed GM tooltip includes this gesture.

Turn changes scroll the new active portrait into view in either orientation, keeping its End Turn button visible. Restoring or changing layout also reveals the current turn; other refreshes preserve manual scrolling.

Additional portrait sizes: 64, 80 and 96 px. Existing layout, saved size and docking preferences are preserved. The original top-placement mode and autohide tab were removed; the new explicit Top right dock below supersedes the placement restriction.

## Bottom-left anchoring correction

Historical change: the original top placement and its setting were removed at the user's request. Previously saved top-placement values are ignored; the bar uses its saved vertical/horizontal layout above Players.

The movement cluster is part of the bar's normal layout, with no detached fixed-position box or separate background. One continuous semi-transparent surface encloses movement, portraits and round controls. Browser geometry checks cover all six sizes, both layouts, minimized/restored states, fixed movement anchoring, round-control order and containment of all movement buttons. Both layouts were visually inspected in the browser fixture. Live Foundry verification remains outstanding.

## Players control: minimized mode (unreleased)

Click the native Players heading to cycle **Online → All → Minimized → Online**. Minimized hides every player row and retains the heading as the restore button. The small mode label and tooltip describe the current/next state. Enter and Space also operate the heading.

The state is saved per client and survives rerenders, user connections and application recreation. Native online/all filtering, row permissions and context menus remain in use. Native AV hiding behavior remains authoritative. The combat bar follows the Players panel height through its existing resize observer. Browser checks cover the cycle, filtering, keyboard restore, persistence, joins and compact height; live Foundry verification remains outstanding.

Vertical combat-bar turn controls now place Previous and Next side by side above the round counter. This supersedes earlier stacked-arrow descriptions; horizontal controls remain stacked at the far right.

Previous/Next turn arrows point left/right in both orientations; vertical layout keeps the two buttons side by side above the round counter.

## Combat Bar settings shortcut (unreleased)

The former one-click orientation toggle is now a gear button opening a compact **Combat Bar** settings window. It is available while expanded or minimized. The window reuses Foundry v12 SettingsConfig's prepared rows and native settings-category template, in the same order as the Module Settings Combat Bar group: visibility, portrait size, layout, name-only tooltips, and initial movement mode.

Labels, hints, choices and current values come from the registered settings. Native SETTINGS_MODIFY permission filters world settings, and permissions/choices are rechecked when saving. Each change saves immediately through game.settings.set and invokes its existing callback; **Done** closes the window. Reopening reads current settings. If visibility is turned off, the window remains available to restore it; Module Settings is also always available.

Build and targeted automated/browser verification are recorded in the task result; live Foundry verification remains outstanding.

Hovering or focusing the round indicator as GM opens Roll Initiative All, Roll Initiative NPC, and Reset Initiative. These use the configured native combat tracker handler for the bar's encounter without changing the sidebar's viewed encounter. Players do not receive these controls.

The round flyout uses the three native tracker controls' icon markup and retains accessible labels and hover tooltips. It does not add initiative controls to CTH.

## Top-right docking and canvas-tool clearance

**Combat bar position** is a per-user choice: Bottom left (default) or Top right. The setting appears in both Module Settings and the combat bar settings window. Top right places movement controls at the top-right corner of the canvas area, beside the sidebar. Portraits extend down in vertical layout or left in horizontal layout. Round controls stay at the opposite end. End Turn and flyouts open toward the available screen area.

Selecting Top right temporarily forces BiomonHUD to top left; its saved position is not changed and applies again when Bottom left is selected. Both position settings explain this override. No autohide tab is added.

At Bottom left, the vertical bar stops eight pixels below the lowest main canvas-tool button. Only the portrait list scrolls, leaving movement and round controls accessible. The bar stacks below canvas tools so long tool submenus take priority. Both list orientations show a scrollbar on overflow; horizontal lists also accept vertical mouse-wheel scrolling.

Validation: browser fixtures cover both docks, fixed control order and alignment, canvas-tool height clearance and stacking, scrolling, and the Biomon override. Live Foundry layout verification remains pending.

- Top-right correction: End Turn uses viewport-clamped positioning outside HUD clipping and checks portrait visibility only along the scrolling axis. Horizontal flyouts sit 4px below the bar, reserving extra room only when sharing the active portrait with a visible End Turn button.
