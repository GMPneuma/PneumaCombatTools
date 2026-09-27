# Turn Indicators

Turn indicators identify the current combatant visually. Appearance does not assign a role, change initiative or spend an Action.

## Open and edit

Use **Animated Turn Indicator → Configure** in Module Settings or the token HUD gear shortcut. Select a token to preview the chosen profile. The preview is local and can work without combat; appearance edits still save normally. The editor follows new token selection and removes its preview when closed.

| Control/profile | Effect |
| --- | --- |
| Use Turn Indicator | Personal master visibility switch. |
| Animated Turn Indicator Display | Personal Animated or Static presentation. |
| Use Default for Everyone | Displays your default instead of token/personal custom profiles. |
| Default Indicator — GM | Edits the world's fallback appearance. |
| Default Indicator — player | Saves that player's default preference; Use GM Default removes it. |
| My Indicator | Shared personal appearance associated with the character's owner. |
| Use My Default Indicator | Clears the separate personal override and inherits that owner's default. |
| This Token — GM only | Overrides the specific scene token; Use inherited settings removes it. |

Two tokens using the same actor can have different GM token overrides. Assigned-character ownership takes priority when choosing an owner profile; otherwise a stable eligible owner is used. Going offline does not switch the profile.

Normal rendering prioritizes token override, owner's explicit My Indicator, owner's saved default, then the viewer/world fallback. The viewer's master switch and Use Default for Everyone can override their own display without editing anyone else's settings. A player's default can therefore be seen by others when that player's My Indicator inherits it.

## Appearance options

Style, color, thickness, **Indicator Scale**, opacity and speed are configurable. Source ranges are thickness 1–10, scale 0–50, opacity 50–100%, and speed 0–2. The style chooser also has Off; the separate display-mode chooser has Animated and Static.

Current source styles:

| General | Role-themed |
| --- | --- |
| Segmented HUD | Rockerboy — Soundwave |
| Scanner | Solo — Fire Control |
| Vector Wake | Netrunner — Quadrant Circuit |
| Signal Echo | Tech — Diagnostics |
| Data Stream | Medtech — Trauma Support |
| Arc Discharge | Media — Live Feed |
| | Exec — Corporate Authority |
| | Lawman — Dispatch |
| | Fixer — Eurobuck Flow |
| | Nomad — Redline |

Role styles are manual choices. Some semantic elements keep fixed colors, such as Lawman blue/red, medical red, Media red and Nomad's RPM colors. Existing older style keys can resolve to revised artwork.

Related: [Combat Tools - Settings Reference](Combat%20Tools%20-%20Settings%20Reference.md), [Combat Tools - Biomonitor and HUD](Combat%20Tools%20-%20Biomonitor%20and%20HUD.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
