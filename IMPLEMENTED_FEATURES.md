# Feature overview

Current capabilities of Pneuma's Combat Tools, organized by what they help you do. This is a feature overview, not a list of every control or a release history. Start with the [player guide](docs/player-guide.md) or [GM guide](docs/gm-guide.md) for instructions.

| Feature | What it provides |
| --- | --- |
| **Target-based combat** | Weapon, melee, unarmed, martial-arts and thrown attacks using native CPR rolls. Paired cards coordinate defense, damage and critical-injury application; hover previews help assess ranged DVs. |
| **Area attacks** | Placed grenades, rockets, shotgun-shell attacks and suppressive fire. Individual responses, shared damage, scatter and GM target adjustments keep group attacks in one workflow. |
| **Instant effects and special ammunition** | Reusable resistance and effect resolution for supported ammunition, also available through Add effects. Includes poison/biotoxin, EMP, flashbang, teargas, sleep, ignition and persistent smoke. |
| **Grappling** | Opposed grabs, holds, escapes, third-party breaks, choking and throws. Tracks relationships, penalties and held-token movement. |
| **QuickHack** | Jack-In and hacking against characters, with encounter connections, detection, ejection and configurable program availability. |
| **Character status HUD** | A compact, docked display of vitals, injuries, active drugs/pharma, cyberware and situational states. Private notifications and optional scanline animations; installed Biomonitors allow others to view shared stats. |
| **Native status integration** | A grouped status picker linked to native injury items and supported drug effects. Recognizes native fire and ammunition outcomes; manages declared timed effects and combat-end cleanup. Injury and EMP roll guards coexist on shared native methods. |
| **Combat bar** | Compact floating strip on the left above Players, with client-selectable 32/40/48px square actor portraits, vertical/horizontal layouts, optional name-only tooltips, minimize/restore and a semi-transparent container; owned-token selection, permission-checked double-click sheets, native tracker visibility, native player ping/pan visibility checks with unrestricted GM navigation on the current canvas and GM Shift-hold native pull pings, owner End Turn via the GM, GM status flyouts and native right-click combatant controls. GM movement modes use centered icon buttons and remain available while minimized, with a configurable starting mode and a five-second warning cooldown. See [combat bar](docs/combat-bar.md). |
| **Movement and injury support** | Square-grid movement counters, fixed scene-space start outlines and reset controls, optional MOVE costs for AoE evasion, leg-condition Evasion restrictions, and manual Broken Ribs damage reminders. |
| **Rules and presentation controls** | GM choices for evasion, area attacks, QuickHack, critical injuries and visibility. Players control their own HUD display and animation preferences. |

## Scope

Combat Tools supports Foundry v12 with Cyberpunk RED Core and libWrapper. It is a combat aid; the native character sheet remains the place to manage characters and equipment. Optional chat-card styling is provided separately by Pneuma's Visual Tools.

An active GM coordinates shared writes. The module does not enforce a universal Action budget, automate every status or injury rule, or replace GM decisions about biological eligibility, unusual movement and cover.

Timed effects with numeric durations use the encounter clock; one minute is 20 rounds. Combat-end cleanup removes applicable timed effects, including manually applied ones, while permanent critical injuries remain. Native drug effects with no numeric duration still need manual timing. Temporary Flashbang/Teargas injuries expire through their own effect workflow.

Smoke rendering is implemented, but a reported missing residual smoke effect still needs live confirmation. Smoke attack penalties and NET Architecture connections are not implemented.

For complete boundaries, see [GM guidance](docs/gm-guide.md#automation-boundaries), the [status mechanics audit](docs/status-mechanics-audit.md) and the [backlog](BACKLOG.md). Automated verification is not a claim of live multiplayer compatibility.
