# Shared workflow policies

These helpers consolidate existing rules without changing chat-card markup, roll visibility, socket wire formats or native CPR calculations.

## Medical rules

`src/scripts/medical-rules.ts` is the common source for stabilization states, First Aid/Paramedic options, native medical skill and Surgery ability lookup, injury DVs and permanent QuickFix classification. Native injury data remains authoritative. Missing/nonpositive/nonfinite DVs produce unavailable choices; zero skill ranks do not prevent an attempt.

Medical executes patient changes. Treatment remains a roll reference and does not apply injuries, healing or stabilization.

## Effect lifetimes

`src/scripts/effect-lifetime.ts` interprets existing native durations and saved module flags. No effect migration or new saved format is required. Automatic expiry, combat cleanup and the GM cleanup window share this policy; native duration calculation and combat-link lookup live in `effect-duration.ts`.

| Effect | Lifetime / cleanup |
| --- | --- |
| Addiction, Dead, Needs Stabilization | Persistent; protected from automated expiry/combat cleanup and the cleanup window, even with stale timing metadata. Stabilize explicitly clears Needs Stabilization. Native status editing remains available. |
| Prone | Clear every combat end for participants, including preexisting Prone. Preserve actors participating in another started encounter. |
| On Fire (Mild/Strong/Deadly), including legacy fire | Clear at participant combat end/reset/deletion, even without cleanup metadata or with stale ended-combat links. Explicit native timers still expire normally. Remove actor-owned effects; disable item-owned effects while retaining inventory. Preserve another started encounter or a fire effect explicitly linked to it. |
| Speed Heal | Combat cleanup; world time does not unlock another dose. Preserve explicit links to other encounters. |
| Temporary native status/drug effect | Existing native duration; also clear at its linked combat end or participant combat end if unlinked. Disable item effects while retaining inventory. |
| Suppression | After the target's next turn, combat end or combatant removal. |
| Temporary critical injury | Timed marker owns removal of the temporary injury. Permanent injuries remain protected. |
| Temporary QuickFix | Restore saved penalties at its combat end; outside combat, at the next patient combat end or the existing 24-world-hour deadline. Retain recovery data until restoration finishes. |
| Equipment disablement | Existing EMP/QuickHack source records own restoration; generic cleanup does not delete their derived markers. |
| Untracked effect | No automatic removal; GM review. |

Protection takes precedence over other policies. The cleanup window displays the shared policy explanation when an effect has no ended/expired/orphan reason. Workflow-specific mutation queues and inventory/status synchronization remain with their owning feature.

## GM confirmation

`src/scripts/gm-request.ts` owns pending confirmations for Medical, grapple, AoE and manual cards. Each workflow retains its original payload and active-GM handler, local serialization, permission checks, claims, mutation receipts and saved-roll retry logic.

The helper stores the elected GM and request ID before socket emission, matches replies to that GM and the current client, and releases timers on success, rejection or synchronous emission failure. Repeated replies and unknown IDs are ignored. A second waiter cannot overwrite the same pending ID. Grapple replies retain their claim value.

Grapple retains its 15-second timeout; the other three retain 30 seconds. A timeout means **confirmation is missing**, not that the action failed or was cancelled. The helper never automatically retries or rolls again. Late replies after timeout are ignored; saved-action retry remains the workflow's responsibility. A GM change cannot silently confirm a request sent to the previous GM.

Unit tests cover rule parity, policy precedence, turn/combat/time boundaries, native skill eligibility, confirmation errors/timeouts/GM changes and existing recovery cases. Browser fixtures verify Treatment, Medical menus, AoE, grapple and cleanup rendering separately from live Foundry multiplayer acceptance.
