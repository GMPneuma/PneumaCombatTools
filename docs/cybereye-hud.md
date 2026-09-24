# Biomonitor and status HUD

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

## Character selection

A selected owned token is the focused character. With no single selected owned token, players use their assigned Character's unique owned scene token when available, otherwise the assigned world actor. With no assignment, one owned scene token can be the fallback; multiple candidates are not guessed. GMs remain selection-based.

The own-character display is not implant-gated. Shared viewing of another character uses Biomonitor eligibility and native visibility; private messages remain the viewer's own. Hover EKG is a separate feature with its own eligibility rules.

## Display

Vitals combine current/max HP, EKG health state and prominent active condition icons. Medical guidance covers injuries; drug/pharma lights require recognized active effects, not merely inventory ownership. Implant integrity lists disabled cyberware. Situational states include Prone, grapple relationships and netrunning connections.

HP numbers can be hidden until EKG hover/focus. Minimized mode retains EKG/name and notifications. The alert shortcut is a broken-heart/bell composite with state colors. When integrated with Crew Tools, its shortcut replaces the duplicate local icon; it does not remove the EKG or private messages.

On Fire offers right-click Extinguish. Neural Intrusion offers right-click Eject Netrunner for each detected incoming link. Menus float outside the HUD without changing its layout. Jacked In uses a diagonal neural-jack icon. Screen glitches belong to Visual Tools; there is no Combat Tools fire-screen renderer.

## Placement and notifications

Personal left/right docking works with or without Crew Tools. Left placement is below navigation/visible Crew HUD and to the right of canvas widgets. Top-right combat-bar placement temporarily forces left without overwriting your saved preference. Notifications sit below the HUD/EKG and can extend beyond the minimized EKG width.

Incoming attacks take priority among three visible rows and open their chat card. Dismiss only clears the local notification, not the pending attack. Timed notices expire; explicit queued notices persist until removed/dismissed. Reload clears API message queues.

Queued/timed message arrival uses a six-second animation with a fast 0.42-second initial reveal and longer center hold. Flash-only API alerts use a separate four-second presentation. Effect-icon arrivals have their own animation. Per-client animation preferences and device reduced motion apply; GM enforcement can override the player setting but not device reduced motion.

The API is documented in [HUD messaging](hud-api.md). Disable the Status HUD to hide it; the self-HUD toggle can restore it. No status-preview/test setting remains.

Implementation: [eye-hud.ts](../src/scripts/eye-hud.ts), [hud-messages.ts](../src/scripts/hud-messages.ts), [hud-conditions.ts](../src/scripts/hud-conditions.ts), [biomonitor.ts](../src/scripts/biomonitor.ts), [neural-intrusion.ts](../src/scripts/neural-intrusion.ts).
