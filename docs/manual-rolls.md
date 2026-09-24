# Manual rolls

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

Click the die beside chat's roll-mode selector to open **Manual Rolls**. The panel opens without selecting its first entry; arrows navigate, Escape closes and returns focus. Native roll visibility is respected, except Group Check requests are deliberately shared cards.

| Entry | Inputs and behavior |
| --- | --- |
| Damage | Label, dropdown 1d6–8d6, modifier, location/options, armor interaction and critical eligibility. Native CPR damage roll; common selected-target/effect controls. Modifier adds to the damage total, not the number of dice. |
| Critical Injury | Head/body native table; apply the rolled injury to a selected owned/GM-controlled target with native duplicate handling. |
| Cyberpunk Roll | Label and Modifier at top; Standard Cyberpunk 1D10 or Custom radio choice; one Roll button. Standard reuses native Critical Success on natural 10 / Critical Failure on natural 1. |
| Custom within Cyberpunk Roll | Unlocks X d Y fields: 1–20 dice and 1–100 sides. Uses Foundry's Roll with the same additive modifier, without native Cyberpunk critical behavior. |
| STAT Roll | Selected owned actor or assigned Character; 1d10 must be strictly below the current prepared STAT. Ties fail; no Critical Success/Failure extra die. |
| Group Check — GM only | Skill, optional DV, show/hide DV, and participating players with assigned characters. Each row requests the native skill roll. |

Ad-hoc damage always shows Interact With Armor and Half Armor SP, plus three Add Effects slots beside **to selected target**. Ordinary damage can hide armor controls through the GM setting. Applied targets remain visible as receipts.

Group rows show Waiting/Rolling/result. If DV exists, a total greater than DV succeeds; ties fail. Success/Fail is green/red. Clicking a total expands both the native roll and its modifier details, collapsed initially. Hidden DV is a presentation option, not a data-secrecy protocol. GM release/reset controls recover abandoned row claims.

Damage, injury and group cards persist in ChatMessage `flags.pneuma-combattools.manualRoll`; plain Cyberpunk/custom/STAT results are roll cards, not ongoing request records. Damage and injury application remain separate from rolling.

Implementation: [manual-rolls.ts](../src/scripts/manual-rolls.ts), [manual-roll-state.ts](../src/scripts/manual-roll-state.ts), [damage-flow.ts](../src/scripts/damage-flow.ts).
