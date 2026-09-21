# Status HUD

The existing compact three-column HUD remains: Vitals, Biological Scan and Implant Integrity. The top alert ticker has been removed.

## Own and shared views

Everyone can see their own HUD without a Biomonitor. Select one owned token, or use the assigned player character when nothing is selected. GMs select an owned token. The old implant override setting is retained internally for compatibility and is no longer needed.

Hover a visible token with an installed Biomonitor to view that actor's stats. A blue HUD edge and the character name below the HUD identify the BIOMONITOR LINK; leaving returns to YOUR STATUS. Carrying an uninstalled Biomonitor does not qualify. Shared viewing does not grant actor-sheet permissions. Notifications always remain the viewer's; the owner is identified accessibly, with no visible message heading.

## Indicators and conditions

Vitals keeps current/maximum HP and the animated EKG. The HP-number setting and click/keyboard pause behavior are retained. HP display states remain Normal, Wounded, Seriously wounded, Critical, Flatline or unavailable; these are visual states, not additional rules.

The health label (Normal, Wounded, etc.) sits immediately below the EKG. Beneath that, icon-only dashboard lights show ONLY active lasting drugs in red and pharmaceuticals in green. Icons fill consecutive positions from the left; when none are active the row disappears. Hover shows the drug name.

Prepared indicators cover nine street drugs: Black Lace, Blue Glass, Boost, Smash, Synthcoke, Berserker, Prime Time, Sixgun and Timewarp. Pharmaceutical/treatment indicators cover Antibiotic (also recognizes Antibiotics), Stim, Surge, Sedative, Veritas and Quick Fix. Native core and Hornet's Pharmacy records were checked against CPR v0.92.4, including primary-effect and addicted-primary aliases. See [Hornet's Pharmacy](https://rtalsoriangames.com/wp-content/uploads/2023/01/RTG-CPR-DLC-HornetsPhramacyv1.11.pdf).

The row reads active unsuppressed effects and status markers, including native effects without status IDs. Native duration fields can be empty even for a timed drug, so the HUD uses the active effect and its verified name instead of requiring a nonzero duration field. Inventory or consumption without an active effect never lights an icon. Addiction-only effects light Addict, not the primary drug indicator; an active addicted-primary effect can light both. Disabling, suppressing, removing or clearing an effect removes the corresponding icon. Instant treatments such as Speed Heal, Rapiddetox and Radaway are excluded.

Larger exposure icons retain small labels below: Poison, Radiation, Biotoxin, On fire, Addict, Jacked In and Unconscious. Any addiction lights Addict. Jacked In requires an active outgoing Combat Tools QuickHack connection in started combat, not the Netrunning marker. NET Architecture connections remain future work. Exposure-only instantaneous damage still requires the existing local exposure hook; this visual update does not add damage mechanics.

Biological Scan shows native critical injuries and medical conditions, excluding drug/exposure and tactical markers. Implant Integrity shows disabled cyberware and EMP information. Clicking medical/implant rows opens the native sheet only for an owner.

Situational states, grapple/choke details and tracked movement appear as small yellow rectangles INSIDE the HUD, floating at its lower-right without changing its dimensions. The first entry is rightmost; additional entries extend left, wrapping when needed. There is no Situational heading.

## Private notifications

Up to three large orange text notifications appear below and outside the HUD, without a heading. Each has its own clear control. Incoming attack notices take priority and open the corresponding chat card; clearing a notice does not resolve the attack. Ordinary notifications expire and are not saved in a history or navigable queue. Newly visible text briefly pulses; it never scrolls or automatically expands the HUD.

GM Send HUD Message retains recipient selection and timed durations. Legacy API duration zero now becomes 60 seconds. API messages retain only the latest three, with oldest entries dropped; pending attacks can occupy visible slots. See [HUD API](hud-api.md). Notifications remain available when the monitor is minimized, and disappear when the HUD is disabled.

## Position and preview

The expanded top row is removed. Minimize and the GM message envelope sit beside Implant Integrity. The GM sees the current character name below the HUD at its left edge, including when minimized; a shared view also identifies its subject there. Drag the HUD background or section labels to move it with a saved right anchor. Existing positions are preserved; new positions default to the top-right. Enable Test status HUD to inspect sample conditions, drug indicators, statuses and messages without changing actors. Test HP state and Test lights exercise the display. End test returns to live data. Reduced motion disables EKG/indicator and notification animations.

Build and browser fixtures verify classification, drug suppression, Jack-In state, hover sharing, private messages, expiry, docking and saved dragging. Live Foundry and multi-client verification remain pending. The user replicates the built module files.


### Incoming HUD message animation — implemented

New private notification text appears large in orange at screen center, holds briefly, then shrinks into its existing slot below the HUD over 1.6 seconds. Concurrent arrivals are stacked. Existing messages do not replay when HUD contents refresh. The client setting **Animate incoming HUD messages** defaults on; disabling it shows messages immediately and stops active arrivals. Reduced-motion preferences also skip the animation. This supersedes the previous arrival blink; privacy, expiry and clear controls are retained.


### HUD pinned to Foundry sidebar — implemented

The HUD sits 8px below the viewport top and 8px left of the native right sidebar, including its collapsed state. Sidebar resize observation follows native width animation; sidebar render/collapse hooks and viewport resize keep the anchor current. HUD and private notification widths fit the available space. Manual drag routines and saved positions remain in source/storage, but are inactive while docking is enabled. This supersedes draggable positioning for now.


### Scan-line notification arrival — implemented

Supersedes the smooth zoom/flight: a glowing orange horizontal scan reveals the large centered message, holds it, collapses it to a bright horizontal line, then reveals normal-size text beneath the HUD. The 1.8-second sequence relocates only while invisible. Existing per-client animation toggle, reduced-motion bypass, private recipient filtering and pinned docking remain unchanged.


### Effect activation scan — implemented

Newly activated drug/pharma and exposure symbols scan in large at screen center, blink three times, then illuminate their dashboard slot after 2.4 seconds. Colors match the corresponding indicator. Concurrent symbols share the central overlay. Refreshes and switching actors do not replay existing conditions; removal cancels an unfinished announcement. Minimized HUDs still announce newly detected effects. The existing client toggle is now named **Animate HUD messages and effect icons** and retains its saved value. Disabled/reduced-motion mode lights indicators immediately.


### Drug labels and round exposure clearing — implemented

Drug/pharma tooltips and accessible labels show only the name, without the Active suffix. During combat, Poison and Biotoxin Vitals reports remain lit after their arrival animation until the round changes, then clear. Existing actor status effects are not deleted; a fresh exposure or reactivation can light the report again. Other indicators and noncombat flash behavior are unchanged.
