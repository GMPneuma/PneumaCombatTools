# Self token HUD

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

Right-clicking an owned token exposes self controls while retaining native Foundry controls. Players use self mode for owned tokens. A GM selecting one token and right-clicking a different token gets target actions; right-clicking the acting token gets self actions. Shift-right-click does not bypass self routing.

Self controls include Toggle Alert HUD, thrown weapons/grenades, contextual Close Combat and the eligible speedware reroll. Grenades begin area placement without another target; thrown weapons/improvised attacks need one other native target. Active grapple controls show the other participant's name, including defender Escape.

General initiative rolling belongs to combat-bar native controls. The optional **Speedware allows Rerolling Initiative** homebrew adds a D10 control for installed functional Sandevistan/Kerenzikov when the token already has initiative in a started encounter. Disabled/EMP-affected speedware does not qualify. It calls native initiative behavior, preserves the current acting participant and does not activate the implant. The player/GM tracks its Action cost.

The generic EMP HUD button is removed; EMP remains available through effect workflows/API. Self controls share native `.control-icon` presentation and configured HUD sizing/color.

Implementation: [self-cth.ts](../src/scripts/self-cth.ts), [main.ts](../src/scripts/main.ts), [attack-menu.ts](../src/scripts/attack-menu.ts), [thrown-weapons.ts](../src/scripts/thrown-weapons.ts).

Self Close Combat and thrown menus use compact 240px absolute flyouts beside the icon column, sharing target attack-menu button styling. Opening a menu does not move the HUD controls; action labels stay on one line and disabled actions retain muted readable text.

Self-CTH Close Combat and Thrown Weapons & Grenades flyouts now use the shared `.combat-heading` and list rows, with grapple icons, item artwork and the native improvised-weapon icon. Enabled CTH menu buttons share hover/focus background and inset outline tokens (`--pneuma-menu-hover-background`, `--pneuma-menu-hover-outline`) without changing layout; disabled actions remain dim. Existing action selectors are unchanged.
