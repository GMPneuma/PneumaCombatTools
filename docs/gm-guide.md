# GM guide

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

## Installation and campaign setup

Enable libWrapper and Combat Tools in a Foundry v12 Cyberpunk RED Core world. Keep a GM connected for cross-owner writes and card coordination. Ordinary native sheet/macro attacks are not universally intercepted into defense cards. The combat-resolution master switch was removed; optional subsystems retain their own controls.

Use [settings reference](settings-reference.md) to review related options together. In particular choose ranged evasion rules, area geometry/MOVE/Cover Up policies, critical-injury methods, EMP behavior, QuickHack availability and movement defaults. Normal damage armor controls default off; ad-hoc damage always exposes them. Automatic NPC evasion only operates with RAW evasion and excludes player-owned actors.

## Run an encounter

Add participants and start combat before using tracked QuickHack, EMP or homebrew evasion. The combat bar and movement tracker follow the active encounter for the scene; do not assume merely viewing a different tracker changes it. Native encounter selection is used by some workflows, including EMP creation: verify the intended encounter before initiating those effects.

Combat bar movement modes are shared campaign controls. Default leaves native movement; No Movement blocks player moves; Combat Move restricts movement to the active scene participant; Free-Move permits unrestricted player movement; the separate movement counter can still track it. GM corrections remain available. No general Action ledger is introduced.

For AoE, review affected tokens and scatter. Use target overrides for cover or biological immunity that the module cannot infer. Resolve resistance/effects individually. Show/Hide attack area is GM-only; smoke has a separate lifetime and removal control.

## Effects, injury and recovery

Native injury items provide their own modifiers. Combat Tools adds specific reminders, Evasion guards, MOVE floor and Cracked Skull handling without duplicating ordinary modifiers. Broken Ribs/Foreign Object damage is explicitly applied, not automatically charged. Spinal/ear action restrictions are advisory.

Configure EMP chooser methods and eligible pools before creating requests; each request snapshots its rules. Ordinary EMP lasts until combat end. Microwaver and cyberware QuickHacks have timed disablement. Overlapping causes restore only when the applicable causes end.

Treat an interrupted application as an audit of the actor first. Finish/Retry/Release/Mark resolved controls have different meanings; Mark resolved acknowledges review and does not recreate missing mutations. Native damage undo is not a universal rollback of secondary effects.

## HUD and messages

Assign each player a Character. Optional Crew Tools integration is per user. Use the HUD's Send HUD Message control or [API macros](hud-api.md) for local/recipient messages. They are session notifications, not chat history or offline delivery. GM animation enforcement still respects device reduced motion.

## Verification and boundaries

[Backlog](../BACKLOG.md) lists open reports and manual rules. Test linked/unlinked actors, multiple owners/GMs, scene changes, native damage undo, area vision/fog and themes in a real world. Passing browser fixtures does not certify these combinations. Glitch rendering lives in separately distributed Visual Tools; fire-screen effects were canceled.
