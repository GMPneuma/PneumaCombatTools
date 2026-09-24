# Area attacks and suppressive fire

Encounter selection now follows the [shared active-scene policy](encounters.md); saved actions and effect clocks remain tied to their originating encounter.

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

## Placement and recipients

Choose a grenade, launcher, shotgun shell or Suppressive Fire entry from the HUD. Left-click accepts placement; Escape/right-click cancels the preview. Native ammo/roll workflows remain authoritative. Explosives support Square or Circle; shell and suppression profiles have separate geometry settings. Native loaded ammo distinguishes shells from slugs.

Wall-clipped native coverage and token footprints determine the initial recipient list. The GM can add/exclude tokens or override affected outcomes when scene walls cannot represent the ruling. Cover/terrain HP and destruction remain manual. Geometry and recipients are saved snapshots.

Missed explosives pause for the GM to place the actual blast; they do not use random scatter. Smart ammunition can offer its qualifying native retry before scatter. Shotgun-shell DV is fixed at 13. Campaign settings configure area dimensions and evasion behavior.

## Responses and shared damage

Each target chooses Evade / Don't Evade, optional Cover Up, or a Concentration response for suppression. Attack dice/results are released after scatter and waiting responses finish; the saved reveal guard prevents replay on later updates. Successful avoidance can require a destination outside the area.

Optional evasion movement accounts for configured MOVE cost and permitted borrowing/debt. Relocation and damage are separate steps. Roll shared damage once, then apply from recipient rows; results collect below the roll. Supported special effects have recipient resolution controls; unknown special ammunition remains manual.

**Allow Cover Up Homebrew** adds a choice alongside Evasion; it does not disable Evasion. Choose one response: roll Evasion if eligible, or Cover Up with no roll and no evasion eligibility requirement. Stay in place, become Prone, and take the hit with doubled SP and doubled ablation, including blocked damage. It is an optional campaign rule, not general cover automation.

Suppressive fire uses the native ten-bullet Autofire attack and individual Concentration; a tied response resists. Failure records a cover obligation. The table adjudicates its Move/Run and cover choice.

## Area lifetime

GM Show/Hide attack area is independent of smoke. Completion hides the attack marker after required response/relocation/application steps; it can be shown again. Deleting the card removes its marker. Smoke uses a separate scene template and remains until expiry or GM removal.

An active GM coordinates templates and cross-owner updates; players need not receive template-creation permission. Scene vision/fog and multiplayer behavior still need live verification.

Implementation: [aoe/workflow.ts](../src/scripts/aoe/workflow.ts), [aoe/settings.ts](../src/scripts/aoe/settings.ts), [aoe/geometry.ts](../src/scripts/aoe/geometry.ts), [aoe/movement.ts](../src/scripts/aoe/movement.ts), [aoe/smoke.ts](../src/scripts/aoe/smoke.ts).

Automatic smoke obscuration: Combat Tools attacks check the attacker-center to target-center line against active saved smoke footprints; blast attacks use the chosen impact point. Crossing smoke adds the native −4 obscured-task modifier once. The attack dialog offers “Ignore smoke” for equipment or GM rulings, and native roll details retain the modifier. This runs at attack preparation, not continuously; it does not infer vision-equipment capabilities or vertical smoke volume.

AoE re-placement: missed aim templates are gray and inactive while waiting for the GM landing point. `.pneuma-aoe-reposition` explains the state and placement bounds; the existing scatter action now reads “Place landing point.” A pointer-transparent `.pneuma-area-placement` status panel keeps placement/cancel instructions visible. The moving preview retains its color; accepting replaces the original template at the actual landing point.

## Target-square visibility and original aim (unreleased)

Initial targeting checks the center of the cursor square against the attacking token’s native sight collision, including GM attacks. Out-of-sight squares hide the preview and reject placement; this is a wall line-of-sight check, not a lighting test. Directional attacks check the aimed-at cursor square. GM scatter placement remains manual within the existing allowed landing region.

Grenades and rockets retain an amber one-square **Original target** marker. The marker stays at the intended point when the blast relocates. Hide/show affects both templates, and deleting the attack message removes both. The marker has no target collection or damage behavior.
