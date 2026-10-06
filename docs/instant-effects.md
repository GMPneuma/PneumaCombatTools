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
| On Fire (Mild), from Incendiary | Native damaging incendiary behavior retained; ignition requires qualifying penetration. Treatment or self-action Extinguish clears burning; resolution cards have no Extinguish button. |
| Smoke | Saved 10-by-10 m/yd scene footprint with independent display/lifetime; no damage/resistance roll. |

Biological eligibility and conditional immunity are GM rulings. Native ordinary ammunition damage is not replayed by exposure reporting. Armor-Piercing and Smart belong to attack/damage logic, not selectable actor statuses.

## Lifetimes

Temporary sensory injuries and Sleep use one-minute native durations: 20 rounds in combat, game time outside combat. Existing permanent injuries/unrelated unconsciousness are preserved. Wake leaves Prone. Fire recognizes native severity and applies strongest-severity damage once at the affected turn end; no out-of-combat automatic ticking. On Fire (Mild/Strong/Deadly), including manually applied and legacy fire, clears when the participant's combat ends, resets or is deleted. Actor-owned fire is removed; item-owned fire is disabled without removing inventory. Another started encounter remains protected, and explicit native fire timers retain normal expiry.

Smoke has a separate MeasuredTemplate, saved wall-clipped cells/polygon and animated primary-canvas display. It survives attack-area hiding, chat deletion and reload. It expires on its clock or combat end. Current source applies a native −4 obscured-task modifier once when the supported attack line crosses active smoke; the dialog offers Ignore smoke for equipment or GM rulings. GM Remove smoke / Restore smoke toggles visibility and automatic obscuration while preserving the original lifetime; expired/deleted smoke cannot be restored. Equipment capabilities and vertical smoke volume are not inferred. See the [current area guide](handbook/Combat%20Tools%20-%20Area%20Attacks%20and%20Suppressive%20Fire.md). Live scene/fog behavior remains a verification item.

## Integration

After ready, `game.modules.get("pneuma-combattools").api.instantEffects` exposes `catalog` and `create(actor, id, sourceMessage?)`. It creates a resolution card; it does not bypass permission or resistance/application steps. See [native effects](native-effects.md) for clocks and [flow map](flow-map.md) for stored state.

Implementation: [instant-effects.ts](../src/scripts/instant-effects.ts), [instant-catalog.ts](../src/scripts/instant-catalog.ts), [instant-lifetime.ts](../src/scripts/instant-lifetime.ts), [native-effect-integration.ts](../src/scripts/native-effect-integration.ts), [aoe/smoke.ts](../src/scripts/aoe/smoke.ts).

Damage/effect cards use attack resolution, damage roll, application/receipts, then Effects. Area defense choices remain in the attack section; target damage and effect controls appear below the shared roll. Effect-only attacks use a lower Effects section without an artificial damage roll. Attack Effects offers canonical On Fire severities and EMP; Microwaver is an EMP source with its own duration. Known damage ammunition preselects its effect, while qualifying triggers and resistance still govern application.
