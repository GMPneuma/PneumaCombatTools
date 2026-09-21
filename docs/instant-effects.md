# Instant effects and ammunition

Instant Effects are reusable effect resolutions. Their activation is immediate; injuries, sleep, fire and smoke can persist afterward. The damage card's **Add effects** picker separates Instant Effects from normal token statuses. Its three existing slots are retained. Applying the damage creates a separate resolution card for each selected instant effect on that recipient; ordinary statuses retain their existing application behavior. Existing normal-weapon ammunition handling is not intercepted or repeated automatically.

Area attacks place the same resolver directly below each affected target. Resolve the native resistance check, then apply a failed effect. A tie fails: the roll must beat the DV. The owner or GM can resolve the target; the GM can mark an immune/ineligible target unaffected. Biological eligibility (meat targets/meat eyes) remains a GM determination, not a guess from installed cyberware. No action-spending enforcement is added.

| Ammunition | Grenade | Rocket | Resolution | Color |
| --- | --- | --- | --- | --- |
| Armor-Piercing | Yes | Yes | Native damage; 2 armor ablation when armor is ablated | Red |
| Biotoxin | Yes | No | DV15 Resist Torture/Drugs; failure: 3d6 direct HP, no ablation | Orange |
| EMP | Yes | No | DV15 Cybertech; failure creates GM selection of two cyberware/electronic items | Cyan |
| Flashbang | Yes | No | DV15 Resist Torture/Drugs; failure: temporary Damaged Eye and Damaged Ear, no bonus damage | Yellow |
| Incendiary | Yes | No | Native damage; ignition becomes available only when the native result reports penetrating HP damage | Flame orange |
| Poison | Yes | No | DV13 Resist Torture/Drugs; failure: 2d6 direct HP, no ablation | Green |
| Sleep | Yes | No | DV13 Resist Torture/Drugs; failure: Prone and Unconscious | Purple |
| Smoke | Yes | No | No attack damage; 10 × 10 m/yd persistent smoke footprint | Gray |
| Teargas | Yes | No | DV13 Resist Torture/Drugs; failure: temporary Damaged Eye, no bonus damage | Yellow-green |
| Smart | No | Yes | Installed operational Targeting Scope; qualifying miss gets a native D10 + 10 + optional Luck retry before scatter | Blue |

These are the types in the supplied core ammunition tables. Basic, Expansive and Rubber are not core grenade/rocket options. Unknown or unsupported special ammunition retains guided manual resolution. Older attack cards retain their saved manual workflow. Armor-Piercing and Smart are attack/damage rules, not selectable actor conditions.

## Duration and removal

- Flashbang/Teargas: 60 seconds of game time. Native injury items provide the actual modifiers. Existing permanent injuries are preserved; repeated temporary exposure extends the module-owned injury. Expiry deletes only module-owned temporary injuries and updates their native status markers. HP is unchanged.
- Sleep: 60 seconds of game time, incoming HP damage, or **Wake (touching Action)**. Waking leaves Prone in place. A pre-existing unrelated Unconscious effect is preserved.
- Ignite: one nonstacking instance, 2 direct HP at the end of the affected combatant's turn. **Extinguish (Action)** or removal of its On Fire marker stops it. Turn updates are handled by one GM. There is no automatic out-of-combat fire tick.
- EMP: the existing two-item selection/suppression workflow, **until combat ends**, as requested. Start combat before applying it. Exact one-minute timing, very long combats and out-of-combat EMP remain on the backlog.

Only an active coordinating GM writes results. Cards reserve resistance rolls and persist application state before target mutations. Interrupted application requires GM review rather than replaying damage. Native damage undo does not undo a separately resolved instant effect, its direct HP damage, or a smoke area.

## Smoke

Smoke is created at the final impact location, including scatter, without per-target damage or resistance checks. Its geometry always uses the specified 10m/yd square, independent of the damaging-blast shape preference. It saves the same wall-clipped native highlighted cells used by area coverage; gridless scenes save the clipped polygon.

A separate scene MeasuredTemplate stores creation time, expiry and cell polygons. Semi-transparent procedural PIXI clouds animate over those cells in the primary canvas, above floor tiles and below tokens at matching elevation. The scene's vision/fog pipeline remains in use. No animation assets or additional module dependencies are required.

Smoke survives chat deletion, attack-area hiding and scene reload. It expires after 60 seconds of game time. The attack card's GM **Remove smoke** control or native template deletion removes it early. Ad-hoc Smoke centers a 10m/yd area on the recipient's token in the open scene. Smoke has no automated visibility or attack penalties yet; its stored footprint supports that later work.

## Integration and verification

The module API exposes instantEffects.catalog and instantEffects.create(actor, id, sourceMessage?) for additional workflows. Creating an effect card does not bypass target permissions or the coordinating GM.

Native integration references: cached CPR v0.92.4 roll creation, damage metadata and native application capture; Foundry v12 native measured-template cell selection and primary-canvas sorting. Automated tests exercise resistance boundaries, HP application, temporary/permanent injury separation, sleep/fire removal, permission/state checks, ammunition snapshots, Smart retry, smoke expiry/persistence and browser rendering with PIXI 7. Live Foundry multiplayer, actual scene vision/fog and native item execution remain to be checked in a running world.


## Native effect update

See [native-effects.md](native-effects.md). The native status/duration workflow supersedes custom instantLifetime identity and world-time-only expiry. One minute is 20 combat rounds; combat end clears timed non-injury effects regardless of how applied. Critical injuries are preserved.
