# Self CTH

Right-clicking your own token shows self CTH controls instead of standard Combat Tools attack, QuickHack and EMP buttons. Native Foundry token controls remain available. Shift-right-click and targeting your own token do not restore standard combat buttons.

Players get self CTH on every owned token. Because GMs own all tokens, clicking a different token while another token is selected as attacker still shows target actions. Clicking the acting token, or opening an owned token without an acting token, shows self CTH.

## Speedware initiative reroll

Enable **Pneuma HomeBrew** under **Combat & Evasion** in module settings. This GM world setting defaults off and leaves other homebrew settings independent.

When enabled, self CTH shows a D10 for installed, functional Sandevistan or Kerenzikov. Native compendium identity recognizes renamed copies; matching names support manually created copies. EMP-disabled speedware does not qualify. The button is disabled until the token has an initiative result in the started active combat.

Click the D10 to use an Action to reroll that token's initiative. Native CPR supplies REF, applicable modifiers, roll dialogs, dice and chat, preserving the current acting combatant when initiative order changes. This does not activate Sandevistan or change its native modifier behavior.

The tooltip states the Action cost. Players and the GM track expenditure; this feature does not add an Action ledger or block other Actions. Duplicate clicks are ignored while the native roll is pending.

With the setting off or no qualifying speedware, self CTH has no custom buttons. Native controls remain.

## Integration and validation

The self column retains native col/right and pneuma-combat-column classes and adds data-self-cth. The D10 retains native control-icon styling and uses data-self-initiative with aria-disabled. No chat-card markup changes are made.

Build, unit and browser fixtures cover self/target routing, the real HUD template, settings, speedware eligibility, native reroll dispatch and duplicate clicks. Live Foundry multiplayer validation remains outstanding.
