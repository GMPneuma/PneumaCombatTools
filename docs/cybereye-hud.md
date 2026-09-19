# Status HUD and Biomonitor

The optical overlay displays one large scrolling alert, with optional condition rows underneath. It remains visible when enabled, showing STATUS: Standby without an alert. Minimize reduces it to a notification bell; new alerts highlight the bell. Minimized state is saved per client. Players have no name heading; GMs see the selected token's name. Drag the narrow top edge to reposition it.

## Alerts

Pending Combat Tools attacks against the focused actor show **ALERT: Incoming Attack**. Clicking opens that notice’s resolution card in chat without dismissing it; its Clear button acknowledges it locally. Attack results remain hidden. Current messages share previous/next controls. Clear dismisses only the displayed notice locally.

GMs use **Send HUD Message** on the expanded live HUD. Choose one connected user or all connected players, enter up to 200 characters, and choose **60 Seconds**, **5 Minutes**, **15 Minutes**, **1 Hour**, **6 Hours**, or **Until Cleared**. Send adds a message to the current list. Recipients browse messages with the arrows and use Clear to dismiss each one locally. Messages are plain text, not macros or HTML. This is a display feature, not a private messaging channel.

## Biomonitor

Vitals and condition rows require an installed native Biomonitor cyberware item. Identification supports the native compendium source ID or the item name Biomonitor, using the system's installed-in-actor state. Merely carrying it does not qualify.

The world setting **Show Biomonitor even if not installed** overrides that requirement; it defaults off. Alerts never require the implant. Rows show existing injuries and active token statuses with condition icons, plus fallbacks, single-line text, and full descriptions on hover. Clicking a row opens the actor sheet. This display does not add condition mechanics or synchronize injury items and statuses.

One selected owned actor is used. Players fall back to their assigned character when no token is selected. GMs select a token. Custom messages addressed to a user can appear even without an actor selected.

## Preview

Enable **Test status HUD** in module settings and save. It shows sample conditions regardless of implant ownership and an interactive test alert. Use Test HP state to cycle through all five states and Test lights to flash all four dashboard indicators. **End test** returns to live data. No actor changes or real messages are sent.

**Status HUD** controls client visibility. The test can display even if live visibility is off. Position is saved per client. Reduced-motion users receive static alert text.

Updates use document hooks and a one-shot custom-message expiry timer, not polling. Build and browser fixtures pass; live multi-client Foundry verification remains outstanding.

## Vitals and effect indicators

The left side shows current/maximum HP and an EKG with a moving luminous scan point and fading trail. The right side holds single-line conditions. State priority: HP at or below zero is Flatline; below 10 is Critical; below half maximum is Seriously wounded; any other missing HP is Wounded; full HP is Normal. These are display states only and do not change wound rules. Flatline retains the moving scan point and trail on a straight line. Reduced-motion mode shows a steady trace.

Dashboard lights: green Poison, yellow Radiation, purple Biotoxin and orange On fire. Existing matching statuses light steadily on first viewing. Newly added matching statuses flash for the client setting **Biomonitor indicator flash duration** (default 8 seconds, range 0–60); ongoing conditions then remain lit. Repeated renders do not restart the timer. Reduced motion makes EKG and lights static. Effect names are matched; this does not implement poison/fire damage mechanics.

Instant-effect integrations can call the local hook `Hooks.callAll("pneumaCombatToolsExposure", actor.uuid, kind)`, where kind is poison, radiation, biotoxin or fire. This is a local display signal; future mechanics must deliver it to the relevant clients. It is not yet connected to instantaneous ammo damage.

The per-client **Status HUD** switch completely disables the live overlay. Test mode is an explicit exception. Without a qualifying actor or implant, the alert area remains available. Scene transitions refresh the display without clearing the saved minimized preference.

Dashboard indicators are now hidden when inactive. Active indicators fill consecutive slots in activation order; clearing an indicator closes its gap, and reactivation appends it after remaining indicators. Existing conditions on initial display use their actor list order.

Three-column Biomonitor: Vitals, Biological Scan (empty: No Active Pathology), Implant Integrity (empty: All Systems Normal). Diagnostics lists cyberware carrying the existing Disabled item marker and opens its native sheet on click. Combat-scoped expiry/restoration remains deferred; this display does not create that lifecycle. Client Show Biomonitor HP numbers defaults on; when off, hovering or keyboard-focusing the EKG reveals HP without resizing the panel.

Minimize/expand now preserves the upper-right curved corner. Saved positions retain this right anchor, subject to viewport bounds.

Hidden HP now takes no layout space: the EKG moves up under Vitals. Hovering or focusing the EKG reveals HP directly over the animation without shifting the layout.

Module integration: see [HUD API](hud-api.md) for send/update/remove examples, audience rules and expiry behavior. Messages now use temporary client-session delivery instead of the legacy single world-setting message.

Until Cleared has no timed expiry; like other HUD API messages, it remains session-local and clears on client reload.

Click the EKG to pause/resume its animation; Enter/Space also toggles it. The local pause preference lasts for the current session and survives HUD refreshes. HP and conditions continue updating.

Performance fixes: pending-card refreshes use an unresolved-card index seeded once on ready, filter actor/item/effect updates by defender and combat updates by originating combat, and batch repeated requests once per animation frame. Ordinary chat events no longer refresh the HUD; stable header/message/medical sections retain unchanged DOM, EKG playback and focus. Hidden HUD exits before gathering medical data; minimized HUD skips medical work. Regression checks cover event routing, batching, card cleanup, unchanged DOM and live HP updates.

HUD alert layout: shortened scrolling banner with previous/count/next on one row to its right and Clear directly underneath. Clear dismisses only the displayed alert on this client.

HUD position now remembers the last completed mouse drag as its preferred upper-right anchor. Resize and content changes only clamp the displayed position to the viewport; enlarging restores the preferred position. Minimize/expand and stationary header clicks never save position.

Alert text scrolls three times then rests centered. Opening/expanding the HUD or receiving a new message starts the sequence again. Unrelated updates preserve the animation; reduced-motion stays static.

With an installed Biomonitor or its world override, the minimized HUD shows a compact live EKG and notification bell side by side. Without it, only the bell is shown. The miniature uses the same HP states and pause/resume interaction, and retains the upper-right anchor.
