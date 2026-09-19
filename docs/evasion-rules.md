# Ranged evasion configuration

RAW means rules as written. These GM/world settings are consumed by the first [Combat Tools combat-resolution flow](combat-resolution.md). Sheet and macro attacks remain native; Combat Tools attacks now prompt, roll Evasion, and apply configured costs/penalties.

## RAW baseline

- Eligibility: current REF 8 or higher, including applicable stat modifications, OR an installed, functional Reflex Co-Processor. A skill-check bonus is not a REF stat increase.
- Eligible defenders have no per-round ranged evasion limit or mandatory LUCK cost. No added flat or repeated-evasion penalty applies by default.
- Evasion uses DEX + Evasion + 1d10, not REF; eligibility and the roll's stat are separate.
- The defender must be aware of the attack. Qualifying is not a guarantee that every attack can be dodged; weapon-specific exceptions remain relevant.
- The official FAQ requires declaring and rolling Evasion before the attack check. The earlier hidden-attack-roll proposal differs in sequencing; resolve this explicitly when implementing prompts. These settings do not implement sequencing.

Sources: Core Rulebook, resolving ranged combat p. 172; [official Core FAQ v1.3, p. 4](https://rtalsoriangames.com/wp-content/uploads/2021/07/RTG-CPR-CoreBookFAQv1.3.pdf) confirms unlimited attempts and declaration/roll timing; [official Black Chrome preview](https://rtalsoriangames.com/2023/01/27/rtg-and-open-gaming-black-chrome-sneak-peek-mark-2/) confirms that the Co-Processor bypasses the REF threshold (Black Chrome p. 21). This is a focused settings baseline, not a complete combat rules implementation.

## Homebrew configuration

Homebrew ranged evasion requires a **started combat encounter**, including flat-penalty and LUCK rules with no free grants. Add both participants and start combat before attacking. Otherwise Evade is disabled. See the [GM and player setup instructions](combat-resolution.md#homebrew-evasion-gm-and-player-instructions).

Eligibility has RAW Ranged Evasion, No Ranged Evasion, and Homebrew choices. No Ranged Evasion records that ranged evasion is disabled; enforcement applies to Combat Tools defense choices. The Homebrew button sits to the right of the dropdown and is enabled only when Homebrew is selected, including an unsaved selection in the native settings form. Save the main settings form to commit Eligibility; Save in the homebrew window saves its rules separately. RAW ignores homebrew configuration.

The table has rows for current REF 8+, installed functional Reflex Co-Processor, and a Solo with at least 2 points allocated to Threat Detection. Each row has Qualifies, One Free Evasion, and Stacks checkboxes. Unchecking Qualifies clears and disables both dependent boxes; unchecking One Free Evasion clears and disables Stacks. Rechecking a prerequisite enables the next box without restoring its old selection. Invalid dependent selections are cleared on opening the form and normalized when saved. Only satisfied rows with Qualifies checked count. Free grants count once per qualifier, not per implant. Non-stacking grants share an allowance of one; each stacking grant adds one. Stacks without One Free Evasion has no effect. Two non-stacking free grants give one; one non-stacking plus one stacking gives two; two stacking grants give two.

Free evasions are used first each round, without the selected homebrew penalty or LUCK cost. Once exhausted, apply the selected rule. With no free grants, it applies from the first attempt. Choose exactly one rule:

- Ranged evasions are at -4: each attempt beyond the free allowance takes -4.
- Ranged evasions are at cumulative -1: free attempts have no added penalty; the first excess attempt is -1, the next -2, then -3. With zero free grants, the first attempt is -1.
- Ranged evasions require LUCK: free attempts have no cost; each additional attempt costs the specified amount.

- No additional evasions allowed: only the free allowance may be used; no free grants means no ranged evasions.

To charge LUCK for every evasion, choose the LUCK rule and clear One Free Evasion for all qualifiers. The LUCK input is enabled only for this rule. It accepts positive whole numbers; its last saved value is retained when a non-LUCK rule is saved. Payment never bypasses eligibility, and insufficient LUCK prevents a paid attempt. The no-additional-evasions option caps attempts at the free allowance. Combined penalty modes are not exposed.

Count attempts, successful or not; declined prompts do not count. Each defended attack counts separately, including ROF 2 attacks. Allowances reset each combat round, not each turn. Melee Evasion is unaffected.

Earlier draft settings are hidden and retained. Until this form is first saved, qualifier grants and LUCK cost are read from them. Old pay-every-time selections map to LUCK after free with all free and stacking grants cleared, preserving eligibility and LUCK cost; otherwise the old cumulative option maps to cumulative-after-free, and other configurations start on -4. Old combined penalties and hard-cap settings are not automatically migrated; review the selected rule before saving. RAW remains the default.

## Deferred implementation

The initial implementation is documented in [combat resolution](combat-resolution.md), including qualification limits, GM coordination, outside-combat behavior and rewind handling. Live Foundry verification remains pending.
