# Combat resolution

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

## Attack to outcome

Target HUD attacks use native CPR rolls and equipment. Combat Tools captures the result once, stores an exchange on the ChatMessage, and withholds its result/dice presentation until the defense choice. This is the implemented sequence; it is not a claim that the native attack is rolled after Evasion.

Eligible defenders choose **Evade** or **Don't Evade**. GM unaware-defender handling removes inappropriate defense choices. Native Evasion supplies its roll and modifiers. Homebrew costs/free allowances belong to the originating started Combat. RAW-only NPC automation is optional. After resolution, the same card reveals the rolls and result; damage remains a separate step.

## Damage controls

Roll damage normally or Shift-click for native options. The shared application section supplies a named target (when applicable), **to selected target**, and three effect slots. Ad-hoc damage uses this same renderer without a recorded defender. AoE keeps application lightning controls beside recipients and places receipts below its shared roll.

Selected-target applications are recorded in an Applied to list. Native result details/undo remain expandable where supplied. Captured target/application state guards repeated writes; this does not provide universal rollback across secondary effects.

**Interact With Armor** is normally on. Turning it off bypasses armor and ablation for the application. **Half Armor SP** uses half SP rounded up and does not stack another half onto a source that already ignores that amount. Controls are side-by-side; the GM Show armor controls on normal damage cards setting is off by default. Manual-menu damage always shows them.

Add Effects categories are Instant Effects, Body Crits, Head Crits, Drugs, Pharma and Misc; empty groups, addictions and wounded-state entries are omitted. Ordinary status attachments and instant-effect resolution cards have different downstream behavior.

## Critical injuries and native effects

Eligible damage uses native injury tables/items with the configured damage-method eligibility. Native duplicate-injury settings remain relevant. The manual Critical Injury menu can roll a table without an attack. Injury creation/treatment is not an automatic Action system.

Normal ammunition damage stays native. Supported confirmed native outcomes drive exposure and ignition reporting. Cracked Skull changes penetrating aimed-head damage in Combat Tools applications; it is not a global rewrite of every external damage macro.

## Recovery and scope

Finish damage roll/payment resumes captured work. Release unfinished roll clears an abandoned claim. Application review requires checking the actor before acknowledging completion; it must not blindly reapply damage. A canceled exchange does not undo native ammunition or other completed writes.

State: ChatMessage `flags.pneuma-combattools.exchange`, including `damage`; native actor HP/armor/LUCK; Combat evasion accounting; per-application receipts. See [flow map](flow-map.md) for every stage and owner.

Implementation: [combat-resolution.ts](../src/scripts/combat-resolution.ts), [damage-flow.ts](../src/scripts/damage-flow.ts), [damage-application.ts](../src/scripts/damage-application.ts), [half-armor.ts](../src/scripts/half-armor.ts), [critical-injury.ts](../src/scripts/critical-injury.ts).


## Small native-sheet conveniences

Shift-click the head/body armor-ablation arrow to restore one SP using CPR's existing reverse-ablation method. This requires an editable owned sheet. The optional Martial Arts no-ablation setting keeps half-SP handling while suppressing ablation on managed damage. Hide attack weapon names presents generic attack categories on Combat Tools cards. Implementation: [armor-shortcut.ts](../src/scripts/armor-shortcut.ts), [main.ts](../src/scripts/main.ts).
