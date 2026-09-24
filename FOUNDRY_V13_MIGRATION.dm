# Foundry v13 migration checklist

Current baseline: Combat Tools 0.8.0, reviewed 2026-09-23. Status: needs verification. This inventories current v12/CPR integration dependencies; none is labelled confirmed incompatible. Do the actual migration against the chosen v13-compatible CPR release. Do not expand the v12 manifest until that combination passes validation.

| Check | File / entry point | Dependency and verification |
| --- | --- | --- |
| [ ] Token HUD | src/scripts/main.ts: configured Token and TokenHUD subclasses, getData, activateListeners, right-click handlers | Verify configured classes, legacy Application lifecycle, native controls, selected-attacker preservation, self/target routing, pan/zoom and dismissal. Test alongside installed HUD/theme modules. |
| [ ] Token movement | src/scripts/movement.ts: movementTurn, committedPosition, MovementToken drag handlers | Verify token source versus animated coordinates, preview identity, destruction, collision API, HUD host and turn reorder hooks. Test drag, rapid arrows, Reset, grapple following and AoE costs together. |
| [ ] Hover overlays | src/scripts/dv-hover.ts and ekg-hover.ts | Verify visibility, nameplate/tooltip geometry, canvas coordinate conversion, table/result hooks and compendium invalidation. Check no hidden-token disclosure. |
| [ ] AoE geometry | src/scripts/aoe/placement.ts: clippedPoints, areaCoverage, placeArea; aoe/workflow.ts template refresh | Verify PIXI geometry, movement/sight polygon backends, native template static shape methods, private _getGridHighlightPositions, render flags and local preview layer. Compare displayed cells with affected recipients. |
| [ ] EMP wrappers | src/scripts/emp-state.ts: installEmpNativeGuards | Verify CPR ActiveEffect determineSuppression and imported CPRItem createRoll/confirmRoll, effect suppression field and libWrapper chaining. EMP blocks rolls and effects until encounter cleanup without modifying native enablement. |
| [ ] Damage capture wrapper | src/scripts/damage-application.ts: captureDamageApplication, captureWithChat | Verify CPRChat module path and RenderDamageApplicationCard actor identity/async behavior. Persistent MIXED wrapper intercepts only active proxy identities; unrelated and concurrent applications must remain independent. |
| [ ] libWrapper registration | src/scripts/native-wrappers.ts; module.json | Verify library compatibility with selected v13 version, global-path aliases referencing actual CPR owner objects, required dependency loading and conflict diagnostics. No direct-patch fallback. |
| [ ] Native damage | src/scripts/damage-flow.ts and damage-application.ts | Verify actor _applyDamage, _ablateArmor and armor access, argument order, native result data, undo behavior, Cover Up and partial-failure recovery. |
| [ ] Critical injuries | src/scripts/critical-injury.ts: applyCriticalInjury | Verify private sheet _drawCriticalInjuryTable, completion semantics, table/compendium configuration and native item creation. Existing asynchronous completion risk needs an explicit check. |
| [ ] Native rolls | src/scripts/native-combat.ts, attack-menu.ts, quickhack/rolls.ts, grapple/workflow.ts, aoe/workflow.ts | Verify roll construction, dialogs, confirmRoll, LUCK/ammunition handling, result fields, native chat output and Dice So Nice visibility/timing. |
| [ ] Initiative | src/scripts/self-cth.ts: rerollSelfInitiative | Verify native rollInitiative options and current-combatant preservation; test movement turn identity after reorder. |
| [ ] Status and item schemas | src/scripts/status-sync.ts, status-catalog.ts, weapon-data.ts, biomonitor.ts, emp-rules.ts | Verify CPR item/effect types, source IDs, installed/equipped fields, derived statistics and native injury/drug bindings. |
| [ ] Forms and selectors | src/templates, settings forms, status-hud.ts, settings-layout.ts | Verify Application/FormApplication and native settings/HUD markup. Test native status handlers, keyboard controls and themes. |
| [ ] Chat structure | src/scripts/card-structure.ts, resolution-scroll.ts, pending-card-refresh.ts, quickhack/integration.ts | Verify renderChatMessage payloads, visibility, updateMessage behavior, HTML selectors, native dice/undo nodes and observer cleanup. |
| [ ] Multiplayer lifecycle | combat-resolution.ts, grapple/workflow.ts, aoe/workflow.ts, quickhack/connections.ts, emp.ts | Verify hooks and update options across clients, Combat flags, permission checks, socket registration, active GM changes, retries and encounter cleanup. |

## Additional 0.8.0 integration surfaces

- Combat bar docking/scrolling, native initiative context controls and PlayerList wrappers.
- Manual CPR roll classes, native critical tables, group request cards and armor-control attributes.
- HUD API socket registration, default synthetic-actor focus and Crew Tools shortcut contract.
- Read-only Neural Intrusion getter/hook. Screen rendering belongs to Visual Tools and must be validated separately.
- Injury native roll wrappers, prepared MOVE floor, contextual reminders and shared native damage capture.

These are migration checkpoints, not claims of v13 incompatibility.

## Migration validation

1. Record exact Foundry, CPR, libWrapper and companion-module versions.
2. Build/typecheck with matching types; run existing rule, lifecycle and browser tests.
3. Test actual GM plus player clients: attack/defense, damage/injuries, grapple plus movement, AoE costs, initiative reorder, QuickHack, EMP and cleanup.
4. Test companion HUD/theme/dice modules, reconnects and GM handover. Measure representative scene refresh costs.
5. For each row record verified / confirmed break / fixed, the tested versions and evidence. Update this file when an integration changes; keep migration work out of the ordinary backlog.
