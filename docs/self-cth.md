# Self CTH

Right-clicking your own token shows self CTH controls instead of standard Combat Tools attack, QuickHack and EMP buttons. Native Foundry token controls remain available. Shift-right-click and targeting your own token do not restore standard combat buttons.

Players get self CTH on every owned token. Because GMs own all tokens, clicking a different token while another token is selected as attacker still shows target actions. Clicking the acting token, or opening an owned token without an acting token, shows self CTH.

## Speedware initiative reroll

Enable **Speedware allows Rerolling Initiative** under **Combat & Evasion** in module settings. This GM world setting defaults off and leaves other homebrew settings independent.

When enabled, self CTH shows a D10 for installed, functional Sandevistan or Kerenzikov. Native compendium identity recognizes renamed copies; names containing "Sandevistan" or "Kerenzikov" anywhere (case-insensitive) also qualify, including manually created and homebrew variants. EMP-disabled speedware does not qualify. The button is disabled until the token has an initiative result in the started active combat.

Click the D10 to use an Action to reroll that token's initiative. Native CPR supplies REF, applicable modifiers, roll dialogs, dice and chat, preserving the current acting combatant when initiative order changes. This does not activate Sandevistan or change its native modifier behavior.

The tooltip states the Action cost. Players and the GM track expenditure; this feature does not add an Action ledger or block other Actions. Duplicate clicks are ignored while the native roll is pending.

With the setting off or no qualifying speedware, self CTH has no custom buttons. Native controls remain.

## Integration and validation

The self column retains native col/right and pneuma-combat-column classes and adds data-self-cth. The D10 retains native control-icon styling and uses data-self-initiative with aria-disabled. No chat-card markup changes are made.

Build, unit and browser fixtures cover self/target routing, the real HUD template, settings, speedware eligibility, native reroll dispatch and duplicate clicks. Live Foundry multiplayer validation remains outstanding.

Self CTH uses the normal CTH button column beside the native token HUD, with no separate panel, heading or explanatory text. Installed speedware marked Disabled, or disabled by EMP, cannot qualify. The generic EMP token-HUD button has been removed; EMP state and its existing programmatic workflow remain.

Self CTH always includes a bell icon labelled Toggle Alert HUD, which toggles the current client Status HUD setting even when disabled in Settings. Re-roll Initiative uses a D10 icon; it remains a native initiative reroll. The speedware world setting carries the Pneuma Homebrew badge and retains its existing stored key/preferences.

Self controls are direct `.control-icon` children of `.pneuma-combat-column`, sharing native button styling, HUD sizing/spacing and the configured CTH icon color. The bell is always present; the D10 appears only when eligible. This supersedes the separate Self panel.
