# Body and head injury coverage

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

Native injury items/effects provide ordinary modifiers. This table describes Combat Tools support and table responsibilities, not a replacement for the injury rules. General Action spending is intentionally manual.

## Body

| Injury | Current support | Manual responsibility |
| --- | --- | --- |
| Dismembered Arm | Native death-save modifier; HUD guidance | Limb identity, drops and unavailable-arm actions. |
| Dismembered Hand | Native death-save modifier; HUD guidance | Hand identity, drops and hand-dependent actions. |
| Collapsed Lung | Native MOVE/death-save modifiers; prepared MOVE floor 1 | Treatment. |
| Broken Ribs | Over-4 m/yd card, manual 5 HP application, optional turn-end alert | Click at proper time; on-foot/forced movement ruling. |
| Broken Arm | HUD guidance and native injury item | Drops and unusable-arm actions. |
| Foreign Object (Body) | Separate movement-damage card/receipt | Manual turn-end application. |
| Broken Leg | Native MOVE modifier; floor 1 | Treatment. |
| Torn Muscle | Native melee modifier | Treatment. |
| Spinal Injury | Native death-save modifier; stored next-turn advisory | No-Action restriction, while allowing Move Action. |
| Crushed Fingers | Native selectable modifier; guidance | Choose injured-hand actions. |
| Dismembered Leg | Native MOVE/death-save modifiers; floor 1; Evasion guard | Limb identity/treatment. |

## Head

| Injury | Current support | Manual responsibility |
| --- | --- | --- |
| Lost Eye | Native ranged/selectable sight/death-save modifiers; guidance | Vision-based Perception context. |
| Brain Injury | Native all-action/death-save modifiers | Treatment. |
| Damaged Eye | Native ranged/selectable sight modifiers; guidance | Vision-based Perception context. |
| Concussion | Native all-action modifier | Treatment. |
| Broken Jaw | Native selectable speech modifier; guidance | Speech-dependent action context. |
| Foreign Object (Head) | Separate movement-damage card/receipt | Manual turn-end application. |
| Whiplash | Native death-save modifier | Treatment. |
| Cracked Skull | Combat Tools aimed-head penetration multiplier correction; native death-save modifier | External/native-only damage paths are not universally intercepted. |
| Damaged Ear | Native selectable hearing modifier; threshold-triggered next-turn advisory | Hearing context and next-turn Move restriction. |
| Crushed Windpipe | Native death-save modifier; cannot-speak guidance | Speech-dependent actions. |
| Lost Ear | Native selectable hearing/death-save modifiers; next-turn advisory | Hearing context and next-turn Move restriction. |

Broken Ribs and both Foreign Object entries each retain a separate card. Actor receipts prevent repeat HP loss on retry. Removing the injury invalidates its pending card. Spinal/ear reminders are stored in Actor `injuryReminders`; movement reset can cancel an undelivered ear reminder.

The MOVE floor preserves explicit immobilizing overrides, including configured disabled frames. Cracked Skull correction preserves native handling of bonus damage, reductions and captured undo amounts; it does not multiply unrelated critical bonus damage. Eye/ear/speech reminders use native selectable modifiers instead of adding duplicates.

No limb inventory model, automatic held-item drop, treatment/surgery workflow or new action-economy lock was added. Offline players miss transient infliction messages but retain medical guidance on the character HUD.

Implementation: [injury-rules.ts](../src/scripts/injury-rules.ts), [injury-mechanics.ts](../src/scripts/injury-mechanics.ts), [injury-notices.ts](../src/scripts/injury-notices.ts), [damage-application.ts](../src/scripts/damage-application.ts).
