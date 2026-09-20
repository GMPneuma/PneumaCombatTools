# Area attacks and suppressive fire

## Placement and shapes

Inventory grenades, equipped grenade/rocket launchers and shotguns loaded with shells use AoE placement. Slugs retain single-target attacks. Suppressive Fire is the white icon beside Autofire on supported weapons.

The local native measured-template preview follows the pointer. Left-click places it; Escape/right-click cancels without ammunition use. Native grid measurement, cone style and movement/sight walls determine the outline and highlighted cells. Tokens overlapping those cells become recipients; gridless scenes use footprint intersection. Large-token and wall edge cases remain subject to GM add/exclude/affected overrides. Terrain and cover destruction are manual.

Settings → Combat & Evasion → Area Attacks & Suppressive Fire provides:

- Shotgun shells: Square / Cone / Ray. Default 6m forward square. Shotgun attacks use fixed RAW DV13; there is no DV setting.
- Grenades and rockets: Square / Circle only. Default 10m square; circle radius defaults to 5m. Both center on impact. Previously configured explosive cones/rays revert to Square for new attacks.
- Suppressive fire: Square / Cone / Ray / RAW radius. Default three-square ray; RAW radius defaults to 25m. Cone angle and ray width/range remain configurable.

All distances use scene scale and m/yd, with feet conversion where necessary. Explosive range/DV uses native measurement. Thrown grenades reuse native Athletics and the Grenade Launcher DV table, with a 25m maximum range. Misses pause for GM placement within the configured intended square. Existing attack cards retain their placed geometry.

## Evasion and MOVE

All damaging AoE attacks, including shotgun shells, require successful evaders to move completely outside the affected area. RAW mode charges no MOVE for this relocation. Explosive Evasion must exceed the attack; shotgun defense ties succeed. The explosive homebrew tie option and its runtime handling were removed.

Optional homebrew settings:

- Evasion movement uses MOVE: subtract native measured escape distance from the combatant's remaining movement allowance.
- Deduct insufficient MOVE from next turn: available only with the first option; an escape can borrow the shortfall from the next turn, up to that turn's allowance. Without it, an escape exceeding remaining MOVE is rejected.

MOVE accounting requires a selected, started combat containing the token. It uses native walking distance, tracks ordinary token movement as spent distance, and keeps spent movement/debt on the combatant rather than altering the actor's MOVE stat. Remaining movement and next-turn debt appear under vitals. The debt reduces the allowance at the combatant's next turn; subsequent turns reset normally. Manual token dragging remains available for GM adjudication and Run; it is accounted for, not blocked by this tracker. Straight-line escape selection checks walls; choose a reachable outside position.

## Cover Up — Pneuma Homebrew

The optional Cover Up button is available on damaging AoE cards, including shotgun shells, when enabled. It is not offered for suppressive fire.

- The target stays where they are and becomes Prone.
- Armor SP counts double for this attack's damage application.
- Armor ablation doubles, even if no HP damage penetrates armor.

The original armor SP is never edited to grant protection. Native damage calculation handles shields, reductions, critical bonus damage and armor interactions. The shared damage roll is unchanged for other targets. Armor ablation and its undo value are included in the captured native application result. The Prone condition remains until removed normally. Special grenade effects now use the reusable Instant Effects resolver; see [Instant effects](instant-effects.md).

## Damage, suppression and visibility

One attack roll is followed by individual responses. Attack results stay visually hidden until responses are chosen. Damage is rolled once, then applied with each target's button; Shift-click offers native damage options. Each recorded target receives one application. Interrupted application requires GM review before completion.

Suppressive fire uses native REF + Autofire and ten bullets. Each affected target rolls WILL + Concentration; ties resist. Failures record the next Move-to-cover and Run-if-needed obligation. The GM excludes mounted targets or cover not represented by walls.

The GM can Show/Hide the shared attack area. It auto-hides after responses, required evasion relocation and damage applications finish. Supported special ammunition uses per-target effect resolution; unknown/legacy special ammunition retains the GM manual-effects completion button. Completed areas can be revealed again. Deleting a card removes its attack template; a separate smoke area remains until expiry or GM removal. Templates and recipient lists are snapshots.

An active GM coordinates responses, movement, templates and damage. Players need no template creation permission. Automated/native-method/browser fixtures provide validation; live multiplayer and map testing remain necessary.

Implemented: core grenade/rocket ammunition resolution and persistent animated smoke. Deferred: automatic smoke attack penalties, conditional visibility/cyberware interactions, automatic terrain/cover destruction, and general Run/action enforcement. See [Instant effects](instant-effects.md).

Attack-area visibility controls are now GM-only, superseding earlier all-viewer access. Player controls are hidden and the GM request handler rejects player show/hide requests. Automatic completion hiding remains unchanged.

AoE cards use roll-only shared damage rendering: the bottom retains `data-pneuma-section="damage-roll"` and native dice/breakdown, but omits the shared `damage-apply` section and empty recovery slot. Per-target lightning controls remain inline; applied results appear below the shared damage roll. Ordinary single-target cards retain their application section. Older AoE cards lose the redundant bottom section when rendered.

AoE applied-damage summaries now collect in `.pneuma-damage-applications.pneuma-aoe-applications` directly after `.pneuma-damage-result`. They retain the normal damage result markup, expandable breakdown and undo controls. No empty application box is added; lightning buttons remain beside each target. This supersedes placing summaries between target rows.


AoE attack dice animation: new area attacks retain their native attack dice and release them through CPR Dice So Nice handling after scatter placement and every waiting/rolling response resolves. The saved roll mode is retained. A persisted reveal flag prevents later damage, movement, visibility updates or chat rerenders from repeating the animation; legacy cards do not replay. Card attack visibility uses the same response condition. Automated fixture verification only.


AoE configuration layout: collapsible attack profiles show their current shape/dimensions in the heading; shotgun shells open initially. Shape-dependent fields use two columns. Evasion and Cover Up remain a separate collapsed section, with a fixed Save footer. All settings and stored values are retained. Supersedes the always-expanded profile layout.
