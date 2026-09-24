# Player guide

[Feature overview](../IMPLEMENTED_FEATURES.md) · [All documentation](README.md)

## Open Combat Tools

Select your acting token, then **Shift + right-click** a visible target. Right-clicking an unowned token also opens Combat Tools. The selected actor remains the attacker. Your own token opens self controls instead.

Targeting still uses Foundry's native controls. An active GM must be connected for shared combat resolution.

## Combat bar

The [combat bar](combat-bar.md) above Players shows square actor portraits. Click your portrait to select its token, hold to ping, or Shift-click to pan. Double-click opens the actor sheet if you have permission. During combat the list matches the native combat tracker; losing sight of a token does not remove its entry, but blocks ping and pan. Right-click an entry for its native combat controls. Your active turn has an **End Turn** button to the right; an active GM processes the request.

The GM can pause token movement or restrict it to the current turn. **Show combat bar** in module settings hides your display without changing those shared movement rules.

## Make and resolve an attack

1. Open the appropriate weapon or close-combat menu on the target. Eligible equipped weapons, installed cyberweapons and configured attachments appear; thrown weapons come from inventory.
2. Choose the attack. Use the aimed or Autofire control when available. Confirm the native CPR dialog, including modifiers and optional LUCK.
3. The defender's owner or GM responds on the chat card. The attack result is revealed after the defense choice.
4. On a hit, roll damage from the card. The recipient's owner or GM uses the damage-application control. **Shift-click** that control for native shield/reduction options.
5. If offered, resolve the critical injury separately with its injury control. Damage application alone does not mean the injury has been applied.

The GM decides whether a target is unaware and configures ranged Evasion. **Dismembered Leg** or a disabled installed **Cyberleg** blocks Evasion, including melee and area attacks. Other skills such as Concentration remain available.

Select exactly one owned token and hover a target to preview ranged-weapon DVs when the hover display is enabled. The preview makes no roll.

For improvised throws, agree on damage with the GM and select it in the attack dialog. A Used marker identifies a thrown item; handle recovery with the GM.

## Grenades and other area attacks

Grenades, rockets and shotgun shells open an area preview. **Left-click** places it; **Escape or right-click** cancels placement without using ammunition. Suppressive Fire uses its own control on supported weapons.

Each affected character responds on the shared card. Successful evaders of damaging area attacks must choose a position fully outside the area. Whether that relocation spends MOVE depends on the GM's settings. A missed explosive attack may wait for the GM to place its landing point.

Special ammunition can replace normal damage with resistance and effect controls. Resolve the prompted check, then use the effect's application control if it fails. Use **Add effects** for an ad-hoc effect when appropriate; do not add a second copy of an effect the attack already resolves.

## Grappling and QuickHack

Use the target's close-combat menu for **Grab**. Follow the opposed Brawling card, then choose a hold or held-object outcome. An active hold exposes Choke, Throw, Release, Escape and relevant third-party Break Grapple actions. The module tracks the hold; players and GM still account for Actions.

For QuickHack, select your Netrunner and use the target's QuickHack menu. **Jack In** establishes the encounter connection; available hacks depend on the GM's rules mode. Jack-In and hacking require line of sight. Losing sight blocks further actions but does not disconnect the link. **Jack In/Out** can end your connection voluntarily. A detected target may gain **Eject NetRunner** controls. NET Architecture connections are not supported yet.

See [Grappling](grappling.md) and [QuickHack](quickhack.md) for the full workflows.

## Read your HUD

Everyone can view their own Status HUD without a Biomonitor. Select your token, or use your assigned character when no token is selected. The display is pinned beside Foundry's right sidebar and follows its collapsed state.

| Display | What to look for |
| --- | --- |
| Vitals | HP/EKG, health label and exposure indicators. |
| Drug/pharma lights | Only active effects appear beneath the EKG: red for drugs, green for pharma. Hover an icon for its name. |
| Biological Scan | Injuries and medical conditions. |
| Implant Integrity | Disabled cyberware. |
| Yellow status boxes | Situational conditions inside the lower-right of the HUD. |
| Orange messages | Up to three private notifications below the HUD, each with a clear control. |

Hovering a visible character with an installed Biomonitor can show their stats. The colored edge and character name identify that view. **The messages remain yours.** Clearing an attack notice does not answer the attack; open its card to respond.

In module settings, **Status HUD** toggles the display, **Animate HUD messages and effect icons** controls the scanline arrivals for your client. Your self-token HUD also has a bell toggle. Use the minimize control beside Implant Integrity to collapse the display.

## Movement and conditions

During started combat on a square grid, movement counters show distance used and the normal allowance in grid spaces. **Reset** returns the token to its recorded starting position and clears that movement. The counter does not prevent every over-budget move; coordinate Run and unusual movement with the GM.

With **Broken Ribs**, moving more than **4m/yd on foot** creates a private owner/GM reminder that 5 damage is due at turn end. **Apply 5 damage** subtracts it directly from HP. Nothing is applied automatically. Reset can withdraw an unpaid warning; it does not refund damage already applied.

Use the native status picker to apply conditions. Injury icons are linked to actual native injury items: removing an injury status can remove that injury from the sheet, but does not undo its HP damage. An icon does not guarantee every associated rule is automated. Ask the GM about treatment, doses and conditions requiring manual handling.

## If a control is unavailable

Confirm that you own the acting character, have the intended token selected, and have an active GM connected. Check the card for an unfinished response, resistance roll or application. QuickHack connections, movement tracking and homebrew evasion may require a started encounter. A leg restriction can also disable Evasion. Avoid starting a second application to compensate for an unclear first result; have the GM review the card and character.
