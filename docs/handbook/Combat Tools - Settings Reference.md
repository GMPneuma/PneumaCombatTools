# Settings Reference

Release 0.9.2 addition: **Route character-sheet attacks through Combat Tools** is under **Attack & Damage Cards** and defaults OFF. With it enabled, supported native sheet attacks use the existing flows when the scene token and target are unambiguous. Area weapons can open placement without a target. Unsupported or ambiguous actions remain native; macros are not universally intercepted. Hand grenades retain their HUD entry.

Open **Configure Settings → Module Settings → Pneuma's Combat Tools**. Labels below reflect current source, not a claim about a previously installed release. Existing saved values take precedence over new defaults.

## Campaign rules — GM

| Setting or form | What it controls |
| --- | --- |
| Ranged Evasion + Homebrew | RAW/none/custom eligibility and configured extra-attempt rules. Default RAW. |
| Automatic NPC evasion | Opt-in RAW-only automation; excludes player-owned actors and incompatible area policies. |
| Area Attacks & Suppressive Fire → Configure | Shapes/dimensions, area eligibility/penalties, MOVE costs/borrowing and Cover Up. Cover Up defaults off. |
| Critical injuries → Configure damage types | Damage methods eligible for automatic injury handling. |
| EMP Effect behavior → Configure | Chooser policy, pool eligibility, hardened/host behavior and frame consequences. |
| Enable QuickHack + Configure | Integrated availability rules, audiences, totals and identity; current default enabled/RAW mode. |
| Enable movement counters | Advisory encounter movement tracking, default on. |
| Combat bar: movement for new combats | Starting shared movement mode. |
| Show armor controls on normal damage cards | Default off; manual damage still exposes controls. |
| Report player weapon reloads | Default on; qualifying native reload/ammo changes for player-owned combat participants. |
| MA does not ablate armor | Optional homebrew; default off. |
| Speedware allows Rerolling Initiative | Optional functional-speedware control in started combat; Action cost remains manual. |
| Injury damage: turn-end HUD reminder | Reminder for unpaid movement-injury damage cards. |
| Always show EKG | Removes the normal hover-EKG role/implant eligibility requirement. |
| Custom Cyberpunk statuses | Configure custom status entries. |

## Personal display and mixed-scope forms

| Entry | Location and scope |
| --- | --- |
| Show combat bar + Combat Bar Configure | Personal visibility, dock/layout, size and tooltip preferences. |
| Show Biomonitor + Biomonitor Configure | Personal position, HP numbers, Crew integration, animations and flash duration. The form also contains GM world animation enforcement. |
| Token HUD Configure | Personal right-click routing, Compact Token HUD and sizing; icon color is GM/world. Current color default amber `#ffc36a`. |
| Hover Weapon DVs | Personal Off / Single Shot / Single Shot + Autofire. |
| Use Turn Indicator | Personal master switch. |
| Use Default for Everyone | Personal display override. |
| Animated Turn Indicator Display | Personal Animated / Static. |
| Animated Turn Indicator Configure | Default/My profiles and GM-only per-token appearance. Saves automatically. |

Combat Bar, Biomonitor and Token HUD appearance controls are in their Configure forms rather than all appearing inline in the main settings list. Crew integration appears only when Crew Tools is active. Top-right bar plus right Biomonitor explains the temporary left-side placement.

## Homebrew and manual responsibilities

The module exposes both native/RAW-oriented options and campaign changes. Cover Up, custom evasion, speedware initiative reroll, BioWare EMP extensions and optional Martial Arts ablation changes should be chosen deliberately by the GM. Enabling a feature does not add a general Action or Net Action ledger.

Related: [Combat Tools - Evasion and Homebrew](Combat%20Tools%20-%20Evasion%20and%20Homebrew.md), [Combat Tools - Turn Indicators](Combat%20Tools%20-%20Turn%20Indicators.md), [Combat Tools - GM Guide](Combat%20Tools%20-%20GM%20Guide.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
