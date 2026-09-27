# GM Guide

## Before the session

- Enable Cyberpunk RED Core, libWrapper and Combat Tools in a Foundry v12 world.
- Assign player Characters and verify ownership on the actual scene tokens.
- Keep a GM connected for cross-owner writes, coordinated responses and turn advancement.
- Review ranged evasion, area profiles, critical eligibility, EMP selection, QuickHack availability and movement defaults. Existing saved world settings can differ from current defaults.
- If using integrated QuickHack, disable standalone Pneuma Quickhack.

## Start an encounter

1. Add the exact participating scene tokens.
2. Make the intended encounter active and start it. Merely viewing its tracker is insufficient.
3. Resolve multiple active, started encounters for the same scene before initiating new actions.
4. Roll initiative through native tracker/combat-bar controls.
5. Select the shared movement mode appropriate to the scene.

Tracked QuickHack, EMP disablement and homebrew evasion require the proper started encounter. See [Combat Tools - Encounters and Outside Combat](Combat%20Tools%20-%20Encounters%20and%20Outside%20Combat.md) for workflows that can still operate outside combat.

## Run attacks and area effects

Let owners answer defense and resistance requests. Resolve NPC choices or enable eligible RAW NPC evasion automation. The attack's visible result waits for the required response; damage and effects still need their own application steps.

For area attacks, check recipients and geometry before proceeding. A missed explosive attack waits for the GM to place the actual landing point. Cover, terrain damage, destruction and immunity remain GM rulings; use the provided target overrides when needed. Damage on a miss requires the explicit GM allowance on supported cards.

Apply shared area damage once per intended recipient. Review individual effect outcomes rather than assuming a shared damage roll resolved every resistance check.

## Manage conditions and turn costs

Native injury items supply their normal modifiers. Combat Tools adds specific guards, reminders and supported effects. Broken Ribs/Foreign Object damage remains an explicit application. Many movement, cover, grappling and Net Action obligations remain table-managed.

EMP requests preserve the policy and selection used when they were created. Changing settings afterward does not reroll an existing shortlist. Overlapping disablement causes must all end before the relevant item can restore.

## Recover interrupted work

First inspect the recipient's HP, armor, injury items, effects and card receipts. Then choose the relevant recovery control. **Finish**, **Retry**, **Release** and **Mark resolved** have different meanings. Mark resolved acknowledges review; it does not replay missing actor updates. Native damage undo is not a universal rollback of secondary effects.

Do not reset an encounter as a generic card-repair step: reset invalidates old pending actions and clears encounter-owned temporary state.

## End the encounter

Finish or deliberately abandon pending actions, then end/reset/delete combat as intended. Supported encounter-owned temporary conditions, temporary sensory injuries, smoke and disablements clean up. Permanent critical injuries, preexisting conditions and other encounters' effects are preserved according to their ownership. Confirm important character state after cleanup.

## Table verification

Before relying on a workflow in a session, try it with a GM and player client: one attack/defense/damage exchange, one area response, a turn advance, and any optional integration you intend to use. Local source review and automated repository tests do not prove your installed world, themes or multiplayer configuration.

Related: [Combat Tools - Settings Reference](Combat%20Tools%20-%20Settings%20Reference.md), [Combat Tools - Module Integration](Combat%20Tools%20-%20Module%20Integration.md), [Combat Tools - Troubleshooting](Combat%20Tools%20-%20Troubleshooting.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
