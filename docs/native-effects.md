# Native effects and lifetimes

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

Combat Tools reuses native status IDs, injury items and ActiveEffects, including disabled/suppressed state. It does not invent a lasting Poison status merely to report an exposure.

- Fire: highest active native severity ticks once at the affected turn end; Extinguish removes actor-owned fire effects or disables item-owned ones. No automatic out-of-combat tick.
- Sleep: module-owned Sleep/Unconscious expires or wakes on damage/touch, preserving unrelated unconsciousness and leaving Prone.
- Temporary sensory injury: native injury item provides modifiers; linked status/duration tracks module-owned expiry. Permanent injuries remain permanent.
- Drugs: supported activation resets declared source duration; expiry disables item effects without consuming/deleting inventory. No undeclared duration is invented.

One minute in a started combat is 20 rounds at the same turn index; outside combat it uses game seconds. Timed cleanup checks the departing actor at turn end and participants at round rollover; unrelated combat updates do not trigger a broad expiry pass. World-time cleanup remains relevant outside combat.

Ending/resetting/deleting combat clears applicable timed effects and combat-created smoke, including applicable native timed effects, but preserves critical injuries, persistent conditions and effects linked to another encounter. Ordinary EMP has separate combat-end restoration; timed disablement tracks its own causes.

Confirmed supported native poison/biotoxin outcomes report exposure; native incendiary requires penetration. Per-dialog ammunition context survives concurrent native dialogs and selected-target application. Canceled dialogs and mere rolls do not report exposure. Arbitrary HP-only macros cannot identify their ammunition source without integration.

Legacy instantLifetime data has compatibility handling; this is distinct from the removed one-time QuickHack chat-history awareness migration. Native damage undo is not an all-effects rollback.

Implementation: [effect-duration.ts](../src/scripts/effect-duration.ts), [instant-lifetime.ts](../src/scripts/instant-lifetime.ts), [native-effect-integration.ts](../src/scripts/native-effect-integration.ts), [effect-events.ts](../src/scripts/effect-events.ts).
