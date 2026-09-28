# Attacks and Damage

Release 0.9.2 addition: **Route character-sheet attacks through Combat Tools** is under **Attack & Damage Cards** and defaults OFF. With it enabled, supported native sheet attacks use the existing flows when the scene token and target are unambiguous. Area weapons can open placement without a target. Unsupported or ambiguous actions remain native; macros are not universally intercepted. Hand grenades retain their HUD entry.

## Targeted attack workflow

1. Select the acting token and open another token's target HUD.
2. Choose an equipped, usable weapon and attack mode.
3. Complete the native CPR attack dialog. Native weapon data, ammunition and modifiers remain authoritative.
4. The module captures the attack and holds its visible roll/dice presentation until defense resolves.
5. The defender chooses Evade or Don't Evade when eligible; the GM handles unaware targets where applicable.
6. Read the revealed attack, defense and hit/miss result.
7. Roll damage and explicitly apply it to the intended recipient.

Normal sheet and arbitrary macro attacks are not universally converted into Combat Tools defense cards. Start from the supported target workflow when you need coordinated defense.

## Ammunition

| State | Behavior |
| --- | --- |
| Empty gun | Attack modes are replaced by Reload / Change Ammo. |
| Loaded gun | Right-click its name, or Shift+F10, toggles ammunition controls. |
| Fewer than 10 rounds | Autofire and Suppressive Fire entries are unavailable. |
| Full magazine or exhausted selected reserve | Reload is disabled with an explanation. |
| Empty bow/crossbow | Choose compatible stocked ammo and quantity, then Load & Continue. |
| Cancel bow loading | No loading occurs. Canceling a later attack dialog leaves the loaded arrow in place. |

Reload and Change Ammo use native CPR behavior and do not themselves start an attack. Exotic burst costs remain with the system. Optional reload notices report qualifying player-owned participants' native reload/ammo changes in an active scene encounter; bows and unchanged/canceled operations are excluded.

## Damage card controls

- **Roll damage:** ordinary click opens native roll options; Shift-click rolls immediately.
- **Recorded target:** applies to the exchange's intended recipient.
- **To selected target:** explicit alternate recipient; tracked exchanges require that recipient in the original encounter. Applied recipients appear on the card.
- **Add Effects:** three attachment slots with supported Instant Effects, critical injuries, drugs, pharma and miscellaneous entries.
- **Interact With Armor:** normally on; off bypasses armor and ablation.
- **Half Armor SP:** half SP rounded up; avoids applying the same half-armor reduction twice.

The GM can hide armor options on normal damage cards. Manual damage always exposes them. A missed attack blocks damage unless the GM explicitly allows it for that exchange; the recorded miss remains a miss.

## Critical injuries and undo

Eligible damage uses native injury tables/items and the GM's configured damage-method eligibility. Native duplicate-injury rules remain relevant. Standalone injury rolls and damage rolls are separate workflows.

Applications record receipts to protect against repeated writes. Expand native details/undo where available. Undoing native damage does not promise to undo every attached effect, item change or encounter record. Inspect actor state before using recovery controls.

## Example

A Solo fires at a guard. The guard chooses Evasion before the visible attack total appears. The combined card resolves a hit. The Solo rolls damage; the authorized user applies it to the guard. A poison attachment, if present, still needs its separate resistance/application resolution.

Related: [Combat Tools - Evasion and Homebrew](Combat%20Tools%20-%20Evasion%20and%20Homebrew.md), [Combat Tools - Injuries and Effects](Combat%20Tools%20-%20Injuries%20and%20Effects.md), [Combat Tools - Troubleshooting](Combat%20Tools%20-%20Troubleshooting.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
