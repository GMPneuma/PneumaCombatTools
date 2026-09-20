# Movement tracking

Enabled by default under **Settings → Configure Settings → Combat Tools → Enable movement counters**. This GM-controlled world setting enables/disables the tracker, counters, start markers and Reset controls for everyone. Requires a started, selected combat, a combatant token, and a square-grid scene.

- Moving a token leaves a faint outline at its starting square and displays `spent / maximum` above it in a native Token HUD-style attribute box with 32px text. A compact row below places **Reset** in the left box and, when running, **run** in the right box. Actual elevation remains visible.
- The counter is in grid spaces. On a 2m grid, MOVE 6 gives six spaces (12m). The maximum uses native derived walking movement, so native movement penalties are reflected. Other scene scales are converted; feet are converted to metres.
- A straight diagonal costs one space per square. Consecutive perpendicular one-square moves also cost one space total if Foundry's movement-wall collision test allows the direct diagonal. A blocked shortcut costs two. The second step can therefore leave the counter unchanged.
- This only combines adjacent one-square pairs, never optimizes an entire route. Backtracking costs movement. Large left-then-up legs are not retrospectively optimized. Walls must represent obstacles; artwork does not block shortcuts.
- The owner/GM can click **Reset** to return to the saved position/elevation and reset movement spent. This is a movement undo, not a rollback of attacks or other actions.
- Normal movement is **green**, including exactly the normal allowance. Extra movement up to twice the normal allowance is **yellow**, with **run** in the small lower-right box. Beyond twice the allowance it is **red**. The denominator remains the normal movement allowance. Run uses your Action for the additional movement; the tooltip explains this cost. This display does not enforce Action spending or prevent movement. Reset returns the counter to green and hides run.
- Each combatant gets a fresh origin and allowance at the beginning of their turn. Ending/resetting/deleting combat clears its tracking. Outside combat, no marker or counter appears.

Accepted movement and its record are saved in one Token update. Costs, unchanged coordinate axes and reset origins use the committed Token source position, so an unfinished animation does not add fractional movement during rapid arrow-key steps. Reloads retain the record. Drag previews draw locally without repeated document writes. Only a candidate perpendicular pair triggers an additional wall query; there is no background pathfinding.

When the existing AoE evasion movement homebrew is enabled, its spent-movement ledger supplies the counter. Ordinary moves and resets send the same signed cost to that ledger; evasion borrowing remains separate. A resolved evasion or held-token placement starts a new reset origin, so the reset button cannot undo that other workflow's resolved placement or refund borrowed movement. Held defenders do not accumulate independent movement from being carried.

Automated coverage includes clear/blocked diagonals, backtracking, long legs, invalid coordinates, accepted/cancelled document changes, reset refunds and turn rollover. A real PixiJS/browser fixture reproduces the former token-child hit-area failure and verifies pointer clicks, position/counter reset, stacked boxes, pan/zoom transforms, ownership, failed-update retry and cleanup. Live Foundry drag/rendering and multi-client behavior still require verification. Hex/gridless scenes are not supported by this tracker.

The two boxes use native `.placeable-hud`, `.attribute`, and `.control-icon` markup inside the Foundry `#hud` overlay. Their click handling is outside the token PIXI hit area. Reset preserves the maximum allowance and clears the spent amount to zero.

Visibility: players see movement counters and start markers for all visible player-owned actors, including other players. NPC actors without a player owner show movement only to GMs. This uses native actor player ownership rather than token disposition or sheet type. Reset remains owner/GM-only; seeing another counter grants no token control. Ownership/user changes refresh the display, and invisible tokens remain hidden.

Movement display updates are batched once per token per animation frame. Unrelated combat flags do not redraw the scene; turn identity changes and initiative reordering update affected tokens. Reset still restores the saved position and updates the counter on the scheduled frame.
