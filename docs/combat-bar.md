# Combat bar

The floating vertical bar sits on the left edge, directly above Foundry's Players control. It is 60px wide with a native-color semi-transparent surface, 40px square portraits, hover names and compact icon controls. End Turn appears beside the current portrait. All portraits are square and use the actor's artwork, never the token texture. Long lists scroll while the turn and GM movement controls remain accessible. **Show combat bar** is a client setting; hiding the display does not disable the GM's movement rules.

- Outside a started encounter, the GM sees scene tokens owned by connected players. Players see their own visible, owned scene tokens.
- During the scene's active, started encounter, everyone sees combatants in native turn order. The list uses exactly native combatant visibility, including its ownership exceptions. A token leaving line of sight remains listed. There is no extra token-hidden or line-of-sight filter on combat rows. The GM retains hidden entries with a hidden indicator. Actor-only and off-scene combatants retain their rows but have no scene interaction.
- Click a portrait to select its token, subject to native ownership. Double-click opens its native actor sheet with OBSERVER or higher permission, including permitted actor-only and out-of-view entries. Holding for Foundry's native long-press duration pings the token, subject to the native ping permission. Shift-click pans to it. Players cannot ping or pan to a token they cannot currently see; this does not remove its combat entry. Neither panning nor pinging changes the selected token.
- The current turn has a highlighted border and background. **End Turn** appears to its right for the GM and the active actor's owner, using the same semi-transparent styling. Player clicks go to an active GM, who checks ownership and the exact current turn before calling native Next Turn; direct Combat-document update permission is not needed. Concurrent or stale requests cannot skip another turn. GM up/down buttons call native Previous Turn and Next Turn, preserving native round rollover, defeated skipping on advancement, hooks and time handling.

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

Foundry client settings provide Small (32 px), Medium (40 px, default), and Large (48 px) square actor portraits, plus Vertical (default) or Horizontal layout. Each client remembers its own preferences. The bar has layout and minimize/restore buttons available to players and GMs, including outside combat. Minimizing hides portraits and turn controls. GMs retain all four movement controls beside the restore button in horizontal mode or below it in vertical mode; players see only the restore button.

Vertical turn arrows are short, portrait-width buttons stacked above the list. Horizontal previous/next arrows point left/right and are small stacked buttons before the list. Long lists scroll in the layout direction. End Turn remains beside the active portrait vertically and above it horizontally; GM status and native control flyouts open above horizontal portraits.

Validation: automated browser fixture covers all sizes and layouts, player controls, minimize/restore, arrow geometry, horizontal overflow and flyout placement. Live Foundry multiplayer layout verification remains pending.

Ping and Shift-click pan now call the configured Foundry v12 CombatTracker handlers directly, including outside combat using the scene token document. Native handlers determine rendered visibility, warn for unseen tokens, and preserve native pan zoom. Right-click controls no longer apply a second custom visibility gate. Combat list membership still uses native combatant visibility, independent of sight.

The per-client **Show name only** setting under Combat Bar removes click instructions from portrait tooltips. It defaults off, preserving the detailed tooltip; changes apply immediately.

GM exception: hold-to-ping, Shift-click pan, and right-click ping/pan always work for tokens on the current canvas regardless of rendered visibility or the selected token's vision. Players continue through the native tracker visibility checks. No automatic scene switching is performed.

GM Shift-long-click sends Foundry's native pull ping to the portrait's token, panning connected viewers of that scene as on the canvas. Short Shift-click remains a local pan. Players cannot pull other users. The detailed GM tooltip includes this gesture.
