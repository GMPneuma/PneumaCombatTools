# Effects and character-metadata audit

Audit date: 2026-09-23. Scope: current working tree, including unreleased fixes. This is an audit, not a completed storage refactor. No runtime source was changed during this pass.

## Required ownership rule

- Encounter-specific Combat Tools state belongs on the encounter: disabled item IDs, causes, expiry, references to temporary penalty effects, grapple state, injury reminders and per-turn/application receipts.
- Actual native character data stays on the character: HP, LUCK, standard critical-injury items, native conditions, drug effects and required CPR modifier metadata. Standard critical injuries persist after combat.
- Automatic Combat Tools cleanup must only operate on effects that it owns. A native duration or a familiar name is not proof of ownership.
- Historical roll/application output belongs on its chat message.
- Persistent Quickhack item identity and user-assigned inventory labels are not encounter state. The current implementation stores these on owned items. A literal ban on all module flags on all owned documents requires a separate durable identity/label design; moving them to an encounter would break behavior between encounters.
- Outside-combat temporary effects already exist (sleep, grenade conditions and grapples). Their tracking needs an owner that survives until they expire; an encounter-only registry cannot represent them. The user's clarification preserves ordinary native behavior and persistent critical injuries, but does not explicitly settle storage for these module-created outside-combat effects.

## Findings requiring correction

### 1. High: automatic expiration and combat-end cleanup affect unrelated effects

`src/scripts/instant-lifetime.ts`, `expireInstantActor` and `finishTimedEffects`.

Expiration iterates every applicable effect, deleting actor effects and disabling item effects based on duration without checking ownership. Combat-end cleanup also removes a participant's unlinked timed effects even if their duration has not elapsed. A manually applied hour-long buff can end with combat. Injury exclusions in combat-end cleanup do not make general timed-effect cleanup owner-safe.

The tests named `combat end clears manual timed effects but preserves critical injuries and other combats` and `timed item effects expire without deleting drug inventory` explicitly expect this behavior. Replace their expectations with preservation of foreign effects and add positive tests for tracked module effects.

### 2. High: disablement still has duplicate authorities

`src/scripts/emp-state.ts`, `src/scripts/emp-rules.ts`, `src/scripts/item-markers.ts`, `src/scripts/emp.ts`.

Encounter `empRequests` and `empRecords` coexist with owned-item `empCombats`, `timedDisables` and generated `itemMarkers`. Readers still rely on item flags. Frame consequences combine encounter requests with item flags. The earlier removal of empty tracking effects did not complete the encounter-only design.

Make encounter records authoritative, derive badges from those records, and keep only actual mechanical penalty AEs on the actor. Store generated AE references on the encounter. Transfer existing live causes before removing old flags. Refresh native preparation, sheets and HUDs when encounter records change; current item-update hooks alone will no longer suffice.

### 3. High: effect duration can be linked to the wrong encounter

`src/scripts/effect-duration.ts`, `effectDuration`; caller `applyEmpSelection` in `emp-state.ts`.

The helper selects `game.combat` instead of accepting the encounter already supplied to the workflow. If a different encounter is viewed, the request can be recorded in one encounter and timed against another. The no-started-viewed-combat branch instead records world-time duration, which also misses the intended encounter-end association.

Pass the authoritative encounter into encounter-bound duration creation. Keep explicit native world-time durations for supported outside-combat effects.

### 4. Medium: name/status heuristics can claim unrelated temporary effects

`src/scripts/instant-lifetime.ts`, `sleepEffect`, `timedMarker`, `clearInstantCondition`, `temporaryInjury`.

An externally created Unconscious effect named Sleep is treated as module sleep, can have its timer refreshed, and is removed on damage. A timed actor effect whose origin references a critical-injury item can qualify that item for temporary-injury deletion without module ownership evidence.

Use tracked document references for automatic refresh, waking and expiration. Explicit user actions such as extinguishing are a separate intentional operation. Preserve permanent native injuries and independent unconsciousness.

### 5. Medium: expired Quickhack penalty can be revived at its old strength

`src/scripts/quickhack/conditions.ts`, `applyQuickhackCondition`.

Slow/Impair Movement keep the stronger value when the prior AE is not disabled, but do not check whether it has already expired. Applying a new weaker Slow before the expiration sweep can renew the expired stronger penalty. Reuse only an active, unexpired owned effect when comparing strengths.

### 6. Medium: a cosmetic Disabled marker still blocks speedware

`src/scripts/self-cth.ts`, `hasSpeedware`.

This reader rejects `itemMarkers.disabled` independently of real disablement state. Evasion was already changed to treat this generic marker as display-only, so behavior remains inconsistent. Use authoritative disablement for mechanical eligibility.

### 7. Medium: standard injury import loses native identity

`src/scripts/manual-rolls.ts`, `applyInjuryResult`.

Manual critical-injury application copies native system/effect data but omits native source identity. It currently relies on the item name for later identification; renaming can make a standard injury unrecognizable to module reminders/rules. Preserve native compendium identity when importing the item. Do not add encounter lifetime to standard injuries.

### 8. Medium: unrelated actor bookkeeping remains after the encounter

Actor writes remain for `evasionPayment`, `grappleDamage`, `ribsApplications`, `injuryReminders`, and `lastBurnTurn`. These are not required native data.

Move encounter-specific records to encounter workflow state. Existing atomic HP/LUCK-plus-receipt writes deliberately prevent repeat charges after a subsequent write fails. Moving receipts to another document changes that guarantee: preserve serialization and define partial-write recovery rather than simply relocating the flag path. Outside-combat grapple receipts require a durable non-actor owner as well.

## Metadata inventory

| Current document | Module metadata | Purpose / appropriate destination |
| --- | --- | --- |
| Actor | `evasionPayment` | Temporary LUCK payment receipt; workflow/encounter |
| Actor | `grappleDamage` | Choke/throw receipt; grapple owner (encounter or scene outside combat) |
| Actor | `ribsApplications` | Injury movement-damage receipts; encounter |
| Actor | `injuryReminders` | Encounter reminders; encounter |
| Actor | `lastBurnTurn` | Burn duplicate prevention; encounter |
| Owned Item | `empCombats`, `timedDisables` | Disabled-item causes; encounter |
| Owned Item | `itemMarkers.emp`, `itemMarkers.cyberware` | Derived badges; compute from encounter |
| Owned Item | Other `itemMarkers` keys | Public inventory-marker API, potentially persistent; needs explicit persistent storage policy |
| Owned Item | `statusId` | Imported native injury/drug identity; prefer native compendium identity |
| Owned Item | `quickhackId`, `action: quickhack` | Persistent program/launcher identity copied from generated world items; cannot live only in encounter |
| Actor ActiveEffect | `disabledLegPenalty`, `frameConsequences` | Identify derived penalty effects; store effect references on encounter |
| Actor ActiveEffect | `quickhackEffect`, `quickhackAmount` | Hack ownership/strength; encounter reference plus native change value |
| Actor ActiveEffect | `grappleId` | Grapple ownership; grapple record effect reference |
| Legacy Item/AE | `instantLifetime`, `empItem`, `empCombat`, `disableRequest`, `frameRequest`, limb marker | Old tracking; migrate only module-owned records without removing native effects |

Native `flags.cyberpunk-red-core` modifier categories/situational metadata must remain on actual numerical effects. CPR's local `CPRMod` constructor directly dereferences this data. Native `flags.core.sourceId`, native source statistics and native aimed-location flags are also not Combat Tools bookkeeping.

Token movement/AoE receipts and scene template flags are not character-document writes. Smoke geometry and grapple placement legitimately refer to scene documents. Chat flags carry roll history. Quickhack connection tracking is already encounter-based.

## Effect-family coverage

| Family | Current path | Audit result |
| --- | --- | --- |
| EMP, Microwaver, Short Circuit, Cyberware Malfunction | emp-state/rules, native suppression wrapper | Native suppression preserves disabled/install state; duplicated storage and encounter-duration issue remain |
| Cyberleg/frame penalties | emp-state, injury-rules, penalty-flags | Working tree includes native CPR metadata and improved injury overlap; ownership metadata still on AEs |
| Slow / Impair Movement | quickhack/conditions | Native CPR metadata present in working tree; expired-strength refresh issue |
| Sonic Shock | temporary Damaged Ear plus Deafened | Preserves a pre-existing permanent ear injury; timer ownership needs explicit tracking |
| System Reset / sleep | instant-lifetime | Preserves independent unconsciousness except name-based Sleep collision; waking/expiration ownership needs correction |
| Fire / Overheat / incendiary | instant-lifetime, native-effect-integration | Native status with once-per-turn damage; receipt currently actor-owned; persistent native fire should not be blanket-cleared |
| Flashbang / teargas temporary injuries | instant-lifetime | Uses native compendium injury; temporary ownership currently inferred from marker duration/origin |
| Standard critical injuries | manual-rolls, status-sync, injury mechanics/notices | Native items/effects persist; preserve source identity and move reminders/receipts off actors |
| Drugs / pharma / addictions | status-sync, native catalogue bindings | Native effect data reused; global expiration/combat-end cleanup can interfere with foreign effects |
| Grapple / prone / unconscious | grapple/workflow | Grapple penalty has CPR metadata; ownership and damage receipts remain on character documents; outside-combat scene state already exists |
| Custom/native status icons | status-sync/status catalogue | Display-only effects do not need numerical CPR metadata; explicit toggles intentionally change corresponding native conditions |
| Smoke | aoe/smoke | Scene templates with module-owned flags; cleanup is scoped to smoke templates |
| Poison / biotoxin / direct instant damage | instant-effects, native-effect-integration | Uses native rolls/HP and message workflow state; no standalone persistent poison penalty AE created here |

## Validation

- Inspected all source occurrences of effect/item creation/deletion and actor/item/effect updates, plus module flag readers/writers.
- Checked local native CPR modifier constructor requirements.
- Ran targeted EMP, instant-effects, injury-mechanics, grapple, status-sync and Self-CTH suites: **114 passed, 0 failed**.
- Passing tests include expectations now contrary to the user's ownership rule; this is not a clean bill of health.
- No live Foundry/multiplayer verification was performed in this audit. No migration, runtime fix, commit or release was performed during this pass.
