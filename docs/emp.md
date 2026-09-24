# EMP and cyberware disablement

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

A GM must start the intended combat before creating a disablement request. Ordinary EMP uses the combat-end lifetime; Microwaver, Short Circuit and Cyberware Malfunction use timed requests. Requests snapshot method, count, eligibility and policies so later settings changes do not redraw existing choices.

## EMP Effect behavior

| Setting | Choices |
| --- | --- |
| GM method | GM chooses 2; Random. The actual source count still controls the request. |
| Player method | See all eligible items and pick X; see up to 2X randomly offered items and pick X; Random. |
| Eligible cyberware | Fashionware, BioWare, Foundational checkboxes. |
| Foundational weighting | Standard, 2x or half weight when included. |
| BioWare homebrew | Grafted Muscle and Bone Lace and Enhanced Antibodies; labeled Pneuma Homebrew. |
| Overlap avoidance | Avoid spending picks on components already covered by the same host cascade. |
| Hardened items | Exclude from pool; or allow a draw to consume a pick without disabling the hardened item. |
| Disabled Internal Frame | Optional cannot move, action penalty with amount, and MOVE reduction with amount. |

Foundation identity follows native item data (`system.isFoundational`), not a universal name-based cyberlimb assumption. Installation, source policy, immunity and host relationships further restrict eligibility. Carried electronics are source-policy dependent. The limited shortlist is saved once; reopening does not reroll it or show the player every component. This is UI disclosure control, not a client-data secrecy system.

## Sources and effects

- Ordinary EMP: normally two choices, lasts until combat ends.
- Microwaver: normally two choices, one minute.
- Short Circuit: three choices, GM chooser policy, one minute.
- Cyberware Malfunction: one choice, netrunner/player chooser policy, one minute; host options can cascade.

Shared behavior settings govern manual/random/shortlist methods and eligibility. Native item effects/roll contributions are suppressed while disabled; item installation and inventory are retained. Supported weapon/DV/speedware paths exclude disabled items. Limb/frame consequences and item badges explain the state in the HUD.

Overlapping causes are recorded independently; ending one does not restore an item still disabled by another. Timed causes expire and ordinary EMP restores at combat end/reset/deletion. Pre-existing native disabled states are preserved. Hardened consumption records an unaffected result rather than rerolling.

## Stored state and recovery

Combat `empRequests` owns policy, offered/selected IDs and progress; `empRecords`, item `empCombats`/`timedDisables`, markers and actor effects track applied consequences. Selection is saved before item writes; retries reuse it. A generic Disabled item marker alone does not mechanically disable cyberware.

See [flow map](flow-map.md) and [backlog](../BACKLOG.md). General out-of-combat EMP and a new exact-time policy for ordinary EMP remain outside current behavior.

Implementation: [emp.ts](../src/scripts/emp.ts), [emp-state.ts](../src/scripts/emp-state.ts), [emp-rules.ts](../src/scripts/emp-rules.ts), [emp-behavior.ts](../src/scripts/emp-behavior.ts), [emp-settings.ts](../src/scripts/emp-settings.ts).

Combat-bound cyberware disablements now clear on combat end/reset/deletion, including timed Microwaver and QuickHack causes. Startup cleanup removes stranded causes from ended/deleted encounters. Other ongoing combat causes and native disabled states are preserved. Automated regression coverage; live Foundry verification pending.
