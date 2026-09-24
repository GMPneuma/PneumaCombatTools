# Grappling

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

Select the acting token, open the target's Close Combat menu within reach, choose Grab, confirm a free hand and complete native Brawling. The defender rolls Brawling from the card. Ties favor the responder. On a win, choose Hold Target or Take Held Object; held-item transfer remains manual.

## Active relationship

Both participants receive the managed grapple penalty without duplicating an existing native modifier. Combat Tools blocks inappropriate two-handed attack entries. The held token follows the grappler's previous position/elevation, at reduced texture scale; ending the grapple restores the saved scale. Held-defender player movement is blocked, while GM corrections remain possible. This is not general pathfinding or an Action ledger.

Ongoing controls are in self-HUD Close Combat: grappler Choke/Throw/Release, defender Escape with the grappler's name. A third party can target the grappler and Break Grapple. Escape/Break are new opposed contests; the original relationship persists until a successful result.

In combat, attacker follow-ups wait until after the establishing turn, and Choke cannot be applied twice in one round. A separate result records a follow-up without replacing the original grapple card. Outside combat, timing is table-managed.

## Choke and Throw

Both apply the attacker's current prepared BODY directly to HP without armor ablation. Throw also applies Prone and ends the hold. Choke tracks successive rounds and unconsciousness. Its implemented HP safeguard checks starting HP greater than 1 and resulting HP below 0, leaving 1 HP; exactly 0 does not enter that branch. Three successive choking rounds can cause unconsciousness independently of remaining HP.

The table manages the required Actions and getting up. Ending a grapple does not undo damage already inflicted.

## State and recovery

Started-encounter grapples live on Combat `grapples`; outside-combat grapples live on Scene `grapples`. A chat card references/mirrors the record and established history is retained. Actor receipts prevent duplicate damage on a retry. GM End and lifecycle cleanup remove managed penalties/following and restore scale. A scene-scoped grapple is not silently adopted into a later combat.

Implementation: [grapple/workflow.ts](../src/scripts/grapple/workflow.ts), [grapple/state.ts](../src/scripts/grapple/state.ts), [grapple/rules.ts](../src/scripts/grapple/rules.ts), [self-cth.ts](../src/scripts/self-cth.ts).
