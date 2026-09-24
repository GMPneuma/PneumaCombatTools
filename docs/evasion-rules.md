# Ranged evasion

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

## Modes

RAW eligibility uses current REF 8+ or an installed functional Reflex Co-Processor. Evasion rolls DEX + Evasion; eligibility is separate from the roll stat. RAW adds no per-round allowance, repeated-evasion penalty or mandatory LUCK charge. Awareness, injury restrictions and attack-specific rules still apply.

No Ranged Evasion removes ranged evasion choices from Combat Tools attacks. Homebrew uses the adjacent configuration form and requires a started encounter with the participants. Main settings and the Homebrew subform save their respective values separately.

## Homebrew controls

Qualifiers are REF, Reflex Co-Processor and Solo Threat Detection. Each can qualify, grant one free evasion, and allow that grant to stack. Non-stacking free grants share one allowance; stacking grants add individually. Dependencies are normalized when saved.

Free attempts are consumed before the selected extra-evasion rule. Choose a flat penalty, cumulative penalty, LUCK cost after free attempts, or no further evasions. With no free grants, the chosen rule begins with the first attempt. The native dialog labels the penalty and mandatory LUCK separately; LUCK payment and encounter usage are recorded to avoid double spending on recovery.

## Automation and scope

Automatic NPC evasion is opt-in, RAW-only and excludes player-owned actors. Homebrew always retains the decision flow. Current leg injuries/EMP consequences can prohibit Evasion. AoE eligibility, modifiers and movement costs have separate campaign settings.

Combat Tools calculates the native attack first and visually holds its result until defense resolves. These rules apply to its defense cards, not a universal interception of native sheet/macro attacks. General Action spending remains manual.

Implementation: [evasion-rules.ts](../src/scripts/evasion-rules.ts), [evasion-settings.ts](../src/scripts/evasion-settings.ts), [combat-resolution.ts](../src/scripts/combat-resolution.ts), [injury-rules.ts](../src/scripts/injury-rules.ts).
