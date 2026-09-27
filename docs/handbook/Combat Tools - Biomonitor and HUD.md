# Biomonitor and HUD

## Select the displayed character

A single selected owned token provides the player focus. Without one, an assigned Character supplies its unique owned scene token when possible, otherwise its world actor. If no Character is assigned, one owned scene token can be a fallback; multiple candidates are not guessed. GMs use selection.

Your own-character display does not require an implanted Biomonitor. Shared viewing of another character and hover EKG have separate eligibility rules. Private notifications remain the viewer's own.

## Read and configure the display

Vitals combine HP, EKG state, conditions, injury guidance and disabled-cyberware information. Drug/pharma indicators depend on recognized active effects rather than inventory alone. You can minimize to EKG/name, hide numeric HP until hover/focus, and configure placement and animations.

Open **Biomonitor → Configure** in Module Settings for position, HP numbers, Crew Tools integration and animation choices. **Show Biomonitor** is the main visibility control. Left is the current source default. Existing personal settings are preserved.

Crew Tools integration uses its HUD shortcut and avoids the duplicate local shortcut. Standalone behavior remains available if Crew Tools is absent. Top-right Combat Bar placement temporarily moves Biomonitor left.

## Context actions

- Right-click **On Fire** for Extinguish.
- Right-click **Neural Intrusion** for individual detected-runner ejection choices.
- Use the local EKG pause/resume preference to stop/resume both personal and hover traces in the current source.

Action costs and netrunning contests still follow their own workflows.

## Notifications

Incoming attacks have priority among three visible rows and link to their chat card. Dismissal clears only the local notification; it does not resolve the attack. API timed messages expire, queued messages remain until dismissed/removed or reload, and flash messages are center-screen only.

GM animation enforcement can override a player's animation preference; device reduced motion still applies. API notifications are session-only, with no offline delivery or saved chat history.

## Hover EKG

A visible target can show an EKG under its nameplate if any of these applies:

- The viewer is acting as a selected owned Medtech, or an assigned Medtech with no selection.
- The target has an installed Biomonitor.
- The GM enabled Always show EKG.

GMs follow the same eligibility. A selected non-Medtech does not borrow the assigned Character's role. The hover trace exposes no numeric HP and remains separate from ranged-DV hover.

Related: [Combat Tools - Turn Indicators](Combat%20Tools%20-%20Turn%20Indicators.md), [Combat Tools - Macros and API](Combat%20Tools%20-%20Macros%20and%20API.md), [Combat Tools - Module Integration](Combat%20Tools%20-%20Module%20Integration.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
