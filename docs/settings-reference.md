# Settings reference

Source-generated registration inventory for Combat Tools 0.8.0, reviewed 2026-09-23. Literal registrations are listed below; dynamic homebrew subfields are configured through their parent forms. Defaults are source defaults, not a claim about an existing world's saved values. Expressions identify conditional visibility/defaults.

## Organization and use

Module Settings groups: Attack & Damage Cards; Evasion & Area Attacks; Movement & Initiative; Injuries & Effects; QuickHack; Combat Bar; Token HUD & Targeting; Status HUD & Biomonitor. World settings are GM campaign rules; client settings are personal preferences.

- Combat-bar dock/layout become four radio choices; the original stored keys are retained.
- Top-right combat bar temporarily forces Biomonitor left without changing its saved preference.
- Crew HUD integration appears only when Crew Tools is active.
- Show armor controls on normal damage cards defaults off; ad-hoc damage always shows them.
- Automatic NPC evasion requires RAW and excludes player-owned characters.
- Homebrew Evasion, area profiles, EMP behavior, custom statuses and QuickHack audiences have dedicated subforms.
- The combat-resolution master switch and Test status HUD are removed.
- Neural Intrusion screen-effect preferences belong to Visual Tools, not this module.

## Visible registrations and menus

| Setting key | Label | Scope | Default / menu button | Registration |
| --- | --- | --- | --- | --- |
| `combatBarDefaultMovement` | Combat bar: movement for new combats | world | default | [combat-bar-state.ts:89](../src/scripts/combat-bar-state.ts) |
| `combatBar` | Show combat bar | client | true | [combat-bar.ts:363](../src/scripts/combat-bar.ts) |
| `combatBarDock` | Combat bar position | client | bottom-left | [combat-bar.ts:367](../src/scripts/combat-bar.ts) |
| `combatBarSize` | Combat bar portrait size | client | 40 | [combat-bar.ts:372](../src/scripts/combat-bar.ts) |
| `combatBarOrientation` | Combat bar layout | client | vertical | [combat-bar.ts:377](../src/scripts/combat-bar.ts) |
| `combatBarNameOnly` | Show name only | client | false | [combat-bar.ts:385](../src/scripts/combat-bar.ts) |
| `criticalInjuries` | Critical injuries | GM menu | Configure damage types | [critical-settings.ts:39](../src/scripts/critical-settings.ts) |
| `alwaysShowEKG` | Always show EKG | world | false | [ekg-hover.ts:46](../src/scripts/ekg-hover.ts) |
| `empBehaviorMenu` | EMP Effect behavior | GM menu | Configure | [emp-settings.ts:44](../src/scripts/emp-settings.ts) |
| `npcAutoEvasion` | Automatic NPC evasion (RAW only) | world | false | [evasion-settings.ts:115](../src/scripts/evasion-settings.ts) |
| `evasionEligibility` | Ranged Evasion | world | raw | [evasion-settings.ts:116](../src/scripts/evasion-settings.ts) |
| `configureEvasion` | Configure homebrew | GM menu | Homebrew | [evasion-settings.ts:126](../src/scripts/evasion-settings.ts) |
| `crewHUDIntegration` | Integrate with Pneuma’s Crew Tools HUD | client | false | [eye-hud.ts:663](../src/scripts/eye-hud.ts) |
| `eyeHUDDock` | Biomon position | client | right | [eye-hud.ts:664](../src/scripts/eye-hud.ts) |
| `biomonitorShowHP` | Show Biomonitor HP numbers | client | true | [eye-hud.ts:674](../src/scripts/eye-hud.ts) |
| `forcePlayerHUDAnimations` | Force animated HUD messages for players | world | false | [eye-hud.ts:675](../src/scripts/eye-hud.ts) |
| `eyeHUDAnimateMessages` | Animate HUD messages and effect icons | client | true | [eye-hud.ts:677](../src/scripts/eye-hud.ts) |
| `biomonitorFlashSeconds` | Biomonitor indicator flash duration | client | 8 | [eye-hud.ts:683](../src/scripts/eye-hud.ts) |
| `eyeHUD` | Status HUD | client | true | [eye-hud.ts:690](../src/scripts/eye-hud.ts) |
| `showArmorControls` | Show armor controls on normal damage cards | world | false | [half-armor.ts:47](../src/scripts/half-armor.ts) |
| `injuryTurnEndReminder` | Injury damage: turn-end HUD reminder | world | true | [injury-notices.ts:54](../src/scripts/injury-notices.ts) |
| `maNoAblation` | MA does not ablate armor | world | false | [main.ts:86](../src/scripts/main.ts) |
| `targetedRightClick` | Open Combat Tools when right-clicking an owned target | client | true | [main.ts:90](../src/scripts/main.ts) |
| `tightHUD` | Tight HUD | client | false | [main.ts:95](../src/scripts/main.ts) |
| `iconColor` | Combat Tools icon color | world | null | [main.ts:99](../src/scripts/main.ts) |
| `movementTracking` | Enable movement counters | world | true | [movement.ts:105](../src/scripts/movement.ts) |
| `pneumaHomebrew` | Speedware allows Rerolling Initiative | world | false | [self-cth.ts:41](../src/scripts/self-cth.ts) |
| `customStatusesMenu` | Custom Cyberpunk statuses | GM menu | Edit custom statuses | [status-settings.ts:81](../src/scripts/status-settings.ts) |
| `areaSettingsMenu` | Area Attacks & Suppressive Fire | GM menu | Configure | [aoe/settings.ts:79](../src/scripts/aoe/settings.ts) |
| `quickhackEnabled` | Enable QuickHack | world | true | [quickhack/settings.ts:55](../src/scripts/quickhack/settings.ts) |
| `quickhackMode` | QuickHack rules mode | world | raw | [quickhack/settings.ts:57](../src/scripts/quickhack/settings.ts) |
| `quickhackMessages` | QuickHack message settings | GM menu | Configure messages | [quickhack/settings.ts:62](../src/scripts/quickhack/settings.ts) |

## Internal state and compatibility registrations

These are stored state, subform payloads or older compatibility settings, not an additional list of normal user controls. Do not edit them to imitate workflow actions.

| Setting key | Label | Scope | Default / menu button | Registration |
| --- | --- | --- | --- | --- |
| `combatBarMovement` | — | world | default | [combat-bar-state.ts:86](../src/scripts/combat-bar-state.ts) |
| `combatBarMinimized` | Combat bar minimized | client | false | [combat-bar.ts:382](../src/scripts/combat-bar.ts) |
| `empBehavior` | — | world | normalizeEmpBehavior({}) | [emp-settings.ts:41](../src/scripts/emp-settings.ts) |
| `empImmunity` | EMP: immune items | world |  | [emp.ts:89](../src/scripts/emp.ts) |
| `evasionHomebrew` | — | world | null | [evasion-settings.ts:121](../src/scripts/evasion-settings.ts) |
| `evasionLuckCost` | — | world | 1 | [evasion-settings.ts:135](../src/scripts/evasion-settings.ts) |
| `eyeHUDMinimized` | — | client | false | [eye-hud.ts:682](../src/scripts/eye-hud.ts) |
| `eyeHUDMessage` | — | world | null | [eye-hud.ts:689](../src/scripts/eye-hud.ts) |
| `eyeHUDPosition` | — | client | null | [eye-hud.ts:692](../src/scripts/eye-hud.ts) |
| `playersMode` | — | client | online | [players-control.ts:41](../src/scripts/players-control.ts) |
| `customStatuses` | — | world | null | [status-settings.ts:80](../src/scripts/status-settings.ts) |
| `areaSettings` | — | world | defaults | [aoe/settings.ts:76](../src/scripts/aoe/settings.ts) |
| `quickhackRouting` | — | world | DEFAULT_ROUTING_CONFIG | [quickhack/settings.ts:59](../src/scripts/quickhack/settings.ts) |

The exact grouping code is [settings-layout.ts](../src/scripts/settings-layout.ts). Related instructions: [evasion](evasion-rules.md), [area attacks](area-attacks.md), [EMP](emp.md), [QuickHack](quickhack.md), [combat bar](combat-bar.md), [HUD](cybereye-hud.md).

## Registrations made through loops

| Key(s) | Scope and default | Purpose / source |
| --- | --- | --- |
| hudScale, statusIconScale | Client; 1, range 0.5–2 | HUD and status icon size; [main.ts](../src/scripts/main.ts). |
| hoverDV, hoverAutofire | Client; true / false | DV hover and Autofire rows; [dv-hover.ts](../src/scripts/dv-hover.ts). |
| critical-method keys | World; true except Quickhack | Per-method injury eligibility; [critical-settings.ts](../src/scripts/critical-settings.ts), method names in [critical-injury.ts](../src/scripts/critical-injury.ts). |
| evasionReflex, evasionCoprocessor | World/internal; free | Older qualifier compatibility defaults. |
| evasionSolo, evasionAllowance | World/internal; disabled / unlimited | Older homebrew compatibility fields. |
| evasionFlatPenalty, evasionCumulativePenalty | World/internal; false | Older penalty compatibility fields. |

The authoritative homebrew payload is saved by its subform; these compatibility defaults do not add extra visible controls.
