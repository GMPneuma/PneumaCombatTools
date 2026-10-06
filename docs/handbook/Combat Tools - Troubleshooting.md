# Troubleshooting

## Common symptoms

| Symptom | Check or next step |
| --- | --- |
| No target actions | Select one owned acting token, right-click the intended target, check Token HUD routing, module enablement and supported CPR world. |
| A button is disabled | Check ownership, active GM, target/range/sight, ammunition, injuries/disabled equipment and the workflow's encounter requirements. |
| Attack result appears to wait | Resolve the defender or remaining area recipients; closing a notice is not a response. |
| Damage is blocked after a miss | Intended default. GM can explicitly allow damage on that exchange where supported. |
| Old card rejects a response | Its original encounter may have ended/reset, moved scene or lost participants. Correct the context and start a new action. |
| Wrong encounter expected | Combat Tools uses the active started scene encounter, not merely the viewed tracker. Resolve multiple qualifying encounters. |
| QuickHack controls absent | Enable integration, disable standalone Quickhack, confirm availability/deck loading and tracked connection. |
| Jacked In but cannot hack | Check originating encounter, exact tokens, line of sight, range and connection/ejection state. Losing sight does not disconnect. |
| EMP request unavailable | Ensure the intended combat is started and participants/context are valid. General out-of-combat disablement is unsupported. |
| No movement counter | Check world setting, active started encounter and square grid. Only the current-turn token and tokens selected by the GM show counters. Hex/gridless is unsupported. |
| Token still cannot move in Free-Move | Check distinct grapple/EMP restrictions and native permissions. |
| Biomonitor missing/wrong actor | Enable it; select one owned token or assign Character. Multiple fallback tokens are not guessed. |
| Biomonitor moved left | Top-right combat bar temporarily forces left. Saved side is retained. |
| No hover EKG | Check visibility plus Medtech role, target implanted Biomonitor or Always show EKG. |
| Indicator appearance differs between users | Compare local master/default override, owner profile/default and token override. |
| Smoke differs from attack marker | They are separate templates/lifetimes; Show/Hide attack area does not remove smoke. |
| Remote HUD message throws | Run as GM, use connected User IDs, and verify API/socket readiness. |
| Socket registration warning after update | Restart Foundry server, then reconnect clients. |
| HUD messages vanish after refresh | Expected session-only storage. |
| A generic Disabled badge has no mechanical effect | Item markers are visual; use the EMP workflow for managed disablement. |

## Interrupted damage or item changes

1. Stop repeated application attempts.
2. Record the card, attacker, recipient, encounter and visible error.
3. Inspect actual HP, armor, injuries, effects, item state and application receipts.
4. Use the context-specific Finish/Retry control for unfinished work, or Release for an abandoned claim where offered.
5. Use Mark resolved only after auditing the result; it does not recreate missing mutations.
6. Recheck the actor and card after recovery.

Ending/resetting combat is not a harmless retry: it changes cleanup ownership and invalidates pending actions. Native undo is not a blanket reversal of secondary effects.

## Report a reproducible problem

Include Foundry, CPR and Combat Tools versions; relevant modules and client settings; GM/player role; scene and encounter; linked/unlinked token status; exact action and response; expected versus observed result; and relevant console errors. For dice visibility, identify which client saw the early/duplicate dice and whether native sheet rolls reproduce it.

Source review and browser fixtures do not establish a live-world fix. Current-source functionality may also be newer than the installed 0.9.0 build; check the source baseline before calling a missing newer control a defect.

Related: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md), [Combat Tools - Module Integration](Combat%20Tools%20-%20Module%20Integration.md), [Combat Tools - Encounters and Outside Combat](Combat%20Tools%20-%20Encounters%20and%20Outside%20Combat.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
