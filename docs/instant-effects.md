# Instant effects and ammunition

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

An Instant Effect creates a resistance/application workflow. Add Effects can attach these to normal/manual damage; AoE embeds them per recipient. A resistance total must beat its DV; ties fail. Owner/GM response controls and GM unaffected/recovery controls remain permission-dependent.

| Effect | Implemented resolution |
| --- | --- |
| Poison / Biotoxin | Resist Torture/Drugs, DV13 / DV15; failure offers 2d6 / 3d6 direct HP damage without armor ablation. |
| EMP / Microwaver | Cybertech DV15; failure creates two-item disablement request. Ordinary EMP ends with combat; Microwaver is timed. |
| Flashbang | DV15 resistance; temporary Damaged Eye and Damaged Ear, without injury bonus damage. |
| Teargas | DV13 resistance; temporary Damaged Eye. |
| Sleep | DV13 resistance; Sleep/Unconscious and Prone, with wake controls and wake-on-damage. |
| Ignite | Native damaging incendiary behavior retained; ignition requires qualifying penetration. Extinguish clears burning. |
| Smoke | Saved 10-by-10 m/yd scene footprint with independent display/lifetime; no damage/resistance roll. |

Biological eligibility and conditional immunity are GM rulings. Native ordinary ammunition damage is not replayed by exposure reporting. Armor-Piercing and Smart belong to attack/damage logic, not selectable actor statuses.

## Lifetimes

Temporary sensory injuries and Sleep use one-minute native durations: 20 rounds in combat, game time outside combat. Existing permanent injuries/unrelated unconsciousness are preserved. Wake leaves Prone. Fire recognizes native severity and applies strongest-severity damage once at the affected turn end; no out-of-combat automatic ticking.

Smoke has a separate MeasuredTemplate, saved wall-clipped cells/polygon and animated primary-canvas display. It survives attack-area hiding, chat deletion and reload. It expires on its clock or combat end, or GM Remove smoke/template deletion. Automatic smoke penalties and sensory interactions are not implemented; an earlier missing-display report remains a live verification item.

## Integration

After ready, `game.modules.get("pneuma-combattools").api.instantEffects` exposes `catalog` and `create(actor, id, sourceMessage?)`. It creates a resolution card; it does not bypass permission or resistance/application steps. See [native effects](native-effects.md) for clocks and [flow map](flow-map.md) for stored state.

Implementation: [instant-effects.ts](../src/scripts/instant-effects.ts), [instant-catalog.ts](../src/scripts/instant-catalog.ts), [instant-lifetime.ts](../src/scripts/instant-lifetime.ts), [native-effect-integration.ts](../src/scripts/native-effect-integration.ts), [aoe/smoke.ts](../src/scripts/aoe/smoke.ts).
