# Status HUD

[Player guide](player-guide.md) · [All documentation](README.md)

The compact HUD shows your character's vitals and conditions beside Foundry's right sidebar. You do not need a Biomonitor to view your own HUD.

## Own and shared views

Select one owned token, or use your assigned player character when no token is selected. GMs select a token to choose the displayed character.

Hover a visible token with an **installed Biomonitor** to view that character's stats. Carrying an uninstalled Biomonitor is insufficient. A blue edge and the character name below the HUD identify the shared view. Leaving the token returns to your own display. Sharing stats does not grant permission to open or edit the other character's sheet.

**Orange notifications always belong to you**, even while another character's stats are displayed.

## Read the display

| Area | Contents |
| --- | --- |
| Vitals | HP and EKG, with the health label directly below the trace. |
| Drug/pharma row | Active lasting effects only, filling from the left beneath the EKG. Red icons are drugs; green icons are pharmaceuticals. Hover for names. |
| Exposure lights | Poison, Radiation, Biotoxin, On fire, Addict, Jacked In and Unconscious. |
| Biological Scan | Critical injuries and medical conditions. |
| Implant Integrity | Disabled cyberware and EMP information. Owners can open the corresponding native item sheet. |
| Yellow rectangles | Situational states, grapple/choke details and tracked movement, floating inside the lower-right without enlarging the HUD. |

The health label is a visual summary, not an additional rules effect. Any addiction can light Addict. Jacked In reflects an active outgoing Combat Tools character connection in combat; NET Architecture connections are not represented yet.

Supported drug indicators are **Black Lace, Blue Glass, Boost, Smash, Synthcoke, Berserker, Prime Time, Sixgun and Timewarp**. Pharma indicators are **Antibiotics, Stim, Surge, Quick Fix, Sedative and Veritas**. Instant treatments such as Speed Heal, Rapiddetox and Radaway do not need lasting-effect lights.

An icon reflects a recognized active, unsuppressed effect or status. Owning or consuming an item without activating its effect does not light it. Addiction-only effects light Addict rather than the primary drug light. Recognition by the HUD does not imply complete duration, addiction or mechanical automation.

Confirmed supported native poison/biotoxin damage can trigger an exposure warning. During combat, those Vitals reports clear when the round changes; clearing the report does not delete a native condition. Native incendiary damage can ignite a target after armor penetration. Arbitrary HP-only macros need explicit integration to identify the exposure source. See [Native effects](native-effects.md).

## Notifications and animations

Up to three orange notifications appear below the HUD, each with a clear control. Incoming attack notices take priority and open their chat cards. Dismissing a notice does not resolve the attack. Ordinary messages expire instead of accumulating in a navigable history.

New messages use an orange scanline reveal at screen center before appearing below the HUD. Newly activated drug/pharma and exposure symbols scan in large, blink three times, then light their dashboard indicator. Existing conditions do not replay merely because the HUD refreshes or changes viewed character.

Turn off **Animate HUD messages and effect icons** in module settings to disable arrival animations for your client. Reduced-motion preferences also skip them. Conditions and messages still appear immediately.

The GM can use **Send HUD Message** to choose recipients and duration. Notifications remain available when the HUD is minimized, but disappear when it is disabled.

## Position and controls

The HUD is pinned 8px from the top and 8px left of Foundry's right sidebar, including when that sidebar is collapsed. It follows window and sidebar resizing. Dragging is currently inactive.

The minimize button sits beside **Implant Integrity**. The displayed character name stays below the relevant expanded or minimized view. Use **Status HUD** in settings, or the bell on your own token's HUD, to toggle the display.

HUD size, HP display and other presentation preferences are available in module settings.

## Verification

Browser fixtures cover classification, active effects, sharing, private notifications, docking and animations. Live Foundry and multi-client verification remain separate. Developer message integrations are documented in the [HUD API](hud-api.md).
