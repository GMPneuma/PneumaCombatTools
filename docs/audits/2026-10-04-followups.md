# Remaining audit fixes: items 5–17

Scope: PneumaCombatTools, local and unreleased. Existing unrelated working-tree changes are preserved. Visual Tools source was not changed; existing built skins were exercised by compatibility fixtures.

| Item | Implemented correction |
| --- | --- |
| 5 — Expiry scans | Suppression ignores unrelated combat/combatant writes and merges pending meaningful refreshes. QuickFix merges pending time-driven expiry work and checks the QuickFix flag before entering an actor mutation queue; it rechecks inside the queue. Combat cleanup still executes with its encounter context. |
| 6 — Movement redraws | Actor- and item-owned ActiveEffect changes redraw only tokens belonging to the affected actor. Existing frame batching remains. |
| 7 — Next-turn marker | Cache the next token, ignore unrelated token/actor/setting events, and merge relevant updates in one animation frame. Combat membership/order, scene readiness, visibility and teardown still refresh or clean up the marker. |
| 8 — Chat observers | Ordinary chat acquires no button observer. Eligible module cards process changed controls and inserted subtrees rather than re-querying the whole card after every mutation. Asynchronously inserted controls are still decorated. |
| 9 — Disabled delay overhead | Zero delay bypasses content/flag result scans and indexing. Enabled rendering collects results once per deadline check. Enabling delay seeds existing history as immediately visible; hidden/private rolls retain their guards. |
| 10 — Repeated lookups | Compute Medical entries once per Token HUD getData call; reuse the list for availability and QuickFix groups. Resolve each actor once within an effect-binding pass, without a persistent actor cache. |
| 11 — Label-dependent styling | Explicit action/state metadata and known workflow selectors determine icons, GM/recovery/cancel roles and completion. English labels are no longer parsed to infer behavior. |
| 12 — Integrated coverage | Added a compiled-runtime browser matrix combining the actual normal/manual/AoE renderers, shared picker, button decorator, effect binder and disclosure preparation. Covers permissions, eight effect states and 260/300/400px widths. |
| 13 — Picker geometry | Decorated effect buttons and their grid tracks share a 24px size and zero margin; repeated rendering preserves exactly three editable slots, or locked glyphs. |
| 14 — Accumulated CSS | Consolidated repeated component blocks, including HUD widths, drug-light layout, combat-bar scrollbar policy and movement controls. Obsolete overridden declarations were removed while conditional rules remain separate. |
| 15 — Forced button overrides | Replaced the doubled class selector with the decorated role selector. Shared geometry consumes variant tokens; GM/icon/effect variants no longer compete through repeated forced dimensions. `!important` count falls from 84 to 41; necessary hover, visibility and contrast guards remain. |
| 16 — Full-width disclosures | Compact roll bodies become explicit full-width siblings linked to their native summaries. Native applied-damage receipt ancestry remains intact with shared subgrid columns; target portraits/names stay on the first line while details and notes grow below. |
| 17 — Broad native-detail resets | Compact calculation bodies contain saved text rather than nested native frames/dice art suppressed by broad CSS. Main attack/damage cards, stored raw HTML and standalone roll disclosures remain native. |

## Verification

- Strict TypeScript build passes with `node scripts/build.mjs`.
- Full unit/regression run: 581 tests; 577 passed, four optional native-environment checks skipped, zero failed.
- Browser fixtures passed: card-controls-ui, aoe-ui, chat-buttons-ui, chat-sidebar-ui, damage-flow, card-presentation, chat-result-delay-ui, instant-ui, movement-ui, settings-subforms-ui, eye-hud, combat-bar-ui, and manual-rolls-ui.
- Geometry checks include decorated picker slots; visible/right-most GM controls; independent expansion/collapse; stable target lines; receipt injury/Cover Up notes; generated effect damage; and native plus existing skin compatibility at narrow chat widths. Main tests use compiled runtime source; the new control matrix loads Combat Tools alone.
- Refresh probes demonstrate zero suppression scans for unrelated combat writes, one scan for a merged event burst, one QuickFix actor-queue entry among 201 inventory items, affected-token-only movement redraws and one marker refresh for 60 relevant events. Actor binding and observer tests check call counts, not just resulting markup.
- Existing fixtures were corrected to supply native ActiveEffect parent arguments, allow missing system icon assets through a fixture SVG, and expect Extinguish only in Treatment/self actions. Disclosure tests wait for native toggle delivery before measuring regions.

These are automated browser/runtime fixtures, not live Foundry/Forge or multiplayer verification. No commit, release or installed-world update was performed. Compact disclosure ancestry changes are documented in `docs/chat-card-styling.md`.
