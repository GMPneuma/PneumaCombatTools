# Pneuma's Combat Tools

Combat utilities for Cyberpunk RED in Foundry Virtual Tabletop.

## Status

Combat Tools includes native CPR attack controls, equipped weapon and hand-to-hand menus, HUD sizing options, and hover DV previews. Ranged, Melee Attack, Unarmed / Martial Arts and inventory Thrown Weapon attacks use paired resolution. Grapple and Quickhack actions remain placeholders; grenade/rocket resolution is deferred.
Targets Foundry VTT v12 with the `cyberpunk-red-core` system. Live Foundry compatibility has not been verified.

Current features are listed in [IMPLEMENTED_FEATURES.md](IMPLEMENTED_FEATURES.md). The [master roadmap](BACKLOG.md) preserves the original feature list, current statuses and deferred designs.

## Development

Node.js 22 or newer and pnpm 11.19.0 are required. TypeScript and Foundry v12 type definitions are development dependencies; the installed module has no added runtime dependencies.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
node --test scripts/dv-hover.test.mjs
```

The build writes module files directly into `dist/`. For manual installation, copy the contents of `dist/` into your Foundry user data `Data/modules/pneuma-combattools/` directory, restart Foundry, and enable **Pneuma's Combat Tools** in a Cyberpunk RED world.

## Structure

- `module.json`: Foundry module metadata and entry points.
- `src/scripts/main.ts`: typed module lifecycle and Combat HUD code; compiles to `dist/scripts/main.js`.
- `src/styles/pneuma-combattools.css`: scoped module styles.
- `src/lang/en.json`: English translations.
- `tsconfig.json`: strict TypeScript configuration using Foundry v12 types.
- `scripts/check.mjs`: source and built asset validation.
- `scripts/build.mjs`: typecheck, compile, and copy runtime assets directly into `dist/`.

Install through Foundry using this manifest URL: https://github.com/GMPneuma/PneumaCombatTools/releases/latest/download/module.json

## Combat HUD

- Players: right-click a visible, unowned token to open Combat Tools.
- Shift + right-click: show only Combat Tools on any visible token with an actor, owned or unowned, preserving the selected attacker. It uses native HUD dismissal.
- Owned tokens you currently target: right-click opens Combat Tools when the per-user setting **Open Combat Tools when right-clicking an owned target** is enabled (default: on).
- Other owned-token right-clicks retain native selection and HUD behavior. The Combat Tools column is always visible to the right, without a launcher or X button. Both HUD forms use native dismissal.
- Target toggles the clicked token using Foundry targeting and preserves other targets.
- Ranged and Melee Attack list eligible equipped weapons, installed cyberweapons and configured attachments. The fist menu lists equipped Unarmed and Martial Arts plus a disabled Grapple placeholder. Click a name for a native attack, the reticule for an aimed attack, or the SMG icon for supported Autofire. Native roll dialogs, ammo, LUCK, dice and chat are reused. Melee and hand-to-hand attacks always offer free Evasion.
- Thrown Weapon is separate from equipped attacks: thrown weapons are selected from inventory and given a Used marker after attack creation. Grenade ammunition is listed for its deferred flow. Improvised uses a GM-agreed 1d6–6d6 damage value selected by the attacker in the attack dialog. Thrown attacks follow normal ranged/homebrew evasion.
- Combat Tools extends the configured native Token HUD and uses its placement and dismissal lifecycle. Ordinary owned-token right-click retains native controls; Shift + right-click and unowned-token access show combat controls only.
- Controls use native control-icon markup under the actual #token-hud. The combat panel and hover DV display share the translucent `.pneuma-panel` surface. Native button appearance remains inherited. Compatibility with individual HUD replacement modules still requires live testing.
- The Token HUD stays a consistent screen size while zooming. A 1x1 token keeps its HUD centered on the token; every other token size uses a compact 1x1 layout centered on the right-click location. The click anchor stays fixed through menu changes and rerenders; a new right-click chooses a new anchor. Programmatic opens without a matching click use the token center.
- Per-user **HUD size** and **Status picker icon size** settings apply immediately. Native controls and the Combat Tools column scale together. Status-picker sizing does not affect the combat menu or conditions drawn on tokens. Combat Tools sets the final HUD scale; avoid enabling a second HUD scaler for the same purpose.
- The acting token is captured before right-click changes native selection.
- Combat clicks use Foundry's native mouse interaction manager and open on release without selecting the clicked defender. Right-drag panning remains native. Combat double-clicks do not open token configuration; ordinary owned-token double-clicks retain native behavior.
- Change the targeted-token option under Configure Settings > Module Settings > Pneuma's Combat Tools. It applies immediately to your client and does not affect Shift + right-click or unowned-token access.

### Live validation checklist

In Foundry v12 with Cyberpunk RED, verify the player/unowned and GM/owned paths, preserved native HUD controls, target highlighting, placeholder panels, canvas pan/zoom alignment, and dismissal. Check 1x1, larger, smaller, and rectangular tokens; click near different parts of each non-1x1 token and verify the anchor remains stable when opening menus. Check right-drag panning and native double-right-click behavior with your active modules. Live Foundry validation remains pending.

## Hover DV preview and shared panels

Select exactly one owned token and hover over another visible token to show `DV13 Heavy Pistol` beside it. DV values below 17 are green, 17–20 yellow, and 21+ red; weapon names retain the standard panel text color. Works inside and outside combat. Installed ranged cyberweapons and weapon attachments on equipped items are included. Enable **Show Autofire DVs on hover** for additional `DV17 Assault Rifle (Autofire)` lines; this option defaults off. The general hover display defaults on.

DVs use each item's configured table: matching world RollTables first, then the system-configured DV compendium. Missing tables and distances without a positive DV produce no line. Distance uses Foundry v12 grid measurement between token centers, including elevation, rounded to the nearest scene unit; configure scenes in meters for RED DV tables. No attack or defense roll is made. Equipment, token, and world-table changes refresh the preview. Disable one hover display if also using Diwako's DV display.

Use the `.pneuma-panel` class for future translucent panels. Shared `--pneuma-panel-*` CSS variables control background, text color, border, radius, shadow, padding, and font size in `src/styles/pneuma-combattools.css`; panel placement stays specific to each workflow. Both the Attack panel and hover preview use this surface.

Live validation: hover different visible owned/unowned tokens, change attacker or equipment, toggle Autofire, test cyberweapons/launchers, range boundaries, elevation, gridless scenes, pan/zoom, and scene changes. Confirm readable panels with the active theme and no duplicate Diwako display.

The Quickhacks HUD button appears only when the acting token has a Netrunner role and an equipped Pneuma Quickhack weapon (identified by its module flag). The clicked defender does not determine availability.

## Armor shortcut

Shift-click the head/body armor ablation arrow on an editable character sheet to restore 1 SP, up to its maximum. Ordinary click still ablates 1 SP. This reuses CPR's native reverse-ablation behavior for the clicked location.

GMs can set **Combat Tools icon color** in module settings for all users. Clear the native color-picker value to restore theme colors. The setting changes only the main Combat Tools icons; submenu icons keep their normal theme colors.

## Ranged evasion settings

Choose RAW or Homebrew in the GM/world Eligibility setting. The Configure homebrew button below opens a qualifier checkbox table and one rule dropdown; LUCK cost is enabled only for the paid rules. Defaults use RAW. These settings drive Combat Tools ranged-Evasion eligibility, penalties and LUCK costs; free grants are used first each round. See [rule definitions and sources](docs/evasion-rules.md).

## Chat cards

Optional chat-card styling and its settings are now provided by **Pneuma’s Visual Tools**. Combat resolution works with or without it.

## Combat resolution — first test

With an active GM, start an attack through Combat Tools. The target owner or GM responds on the attack card using **Evade** / **Do not Evade**. The native Evasion dialog shows the configured penalty or "This evasion will spend XX Luck" before confirmation. GM settings: **Combat resolution**, **Hide attack weapon names**, and the existing **Ranged Evasion** options.

See [combat-resolution setup, limitations and verification](docs/combat-resolution.md). Homebrew free-use tracking requires an active combat. On a hit, roll native damage from the same card, then the defender owner or GM applies it to the original defender. Aimed location and Autofire margin carry into the damage dialog. The GM can mark a defender unaware in the attack dialog to skip evasion. Start a new attack to test the complete flow; older cards lack its damage context. Live Foundry testing is pending.
## Card styling reference

See [Combat Tools chat-card styling](docs/chat-card-styling.md) for message scope, sections, state selectors and CSS examples. This reference is maintained whenever a card design changes.

### Damage application on the exchange card

Optionally add up to three status effects, then click the recipient bolt to use native defaults. Shift-click opens native shield/reduction options. Qualifying damage rolls also show a separate critical-injury dice icon beside each recipient. Settings control critical eligibility by attack method; all initially default enabled. Damage application results append as compact Name / Damage / Location rows, with the larger damage number expanding its native calculation. Critical injury cards remain native. See docs/combat-resolution.md for behavior and limitations.

Improvised damage is now selected by the attacker (player or GM), after agreeing with the GM, in the initial attack dialog. A 1d6–6d6 selection is required before confirmation and is saved with the attack for the later damage roll. This supersedes the GM-only resolution dropdown, which has been removed. Older improvised cards without a saved choice must be restarted.

### Cybereye overlay

Select an owned token to display existing injuries/statuses and pending Combat Tools attack alerts. In Configure Settings → Pneuma's Combat Tools, enable **Test status HUD** and save to try a safe sample. Drag the header or use **End test**. See [HUD guide](docs/cybereye-hud.md).

The HUD now shows alerts independently of implants. Condition rows require an installed Biomonitor or the world override. GMs can use **Send HUD Message** on the GM HUD. See the [current HUD guide](docs/cybereye-hud.md).

Developer integration: [HUD messaging API](docs/hud-api.md).

## Unofficial content

Pneuma's Combat Tools is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.
