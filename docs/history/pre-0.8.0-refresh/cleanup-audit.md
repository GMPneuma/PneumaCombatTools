# Cleanup audit — 2026-09-20

## Completed

- Removed `biomonitorWithoutImplant` from setting types, registration and settings grouping. It had no runtime reads; all actors already receive the HUD without this option. Stored world values remain intact.
- Removed styles for markup no longer emitted: old title, scrolling alert, message navigation, idle message and grapple rows. Preserved the medical-empty rule and minimized controls.

## Additional candidates

| Candidate | Evidence and proposed action |
| --- | --- |
| `evasionFlatPenalty` | Setting registration/type only, no runtime reads. Remove declaration/registration; preserve other legacy evasion settings used by fallback. |
| `configureEmp` in `emp.ts` | No production callers; old dialog test is its only consumer. Remove obsolete dialog/test after checking current instant-effect coverage. |
| `usedThrownName` in `thrown-weapons.ts` | No production callers; two old test assertions. Spent-item handling now uses a marker. Remove helper and obsolete assertions. |
| `overlaps` in `aoe/geometry.ts` | Used only by test fixtures; production uses native measured templates. Move geometry into a test fixture, preserving coverage. |
| `resolveAttackRollAudience` in `quickhack/routing-config.ts` | No source callers or test/documentation references found. Remove after checking native visibility routing. |
| `GrapplePending` and `QuickhacksPlaceholder` | No source/template references found. Remove these obsolete translation keys. |

## Retained deliberately

- `eyeHUDMessage`: no current writer, but legacy reader/timer/render code remains. Removal would drop previously stored message compatibility.
- Other legacy evasion settings: actively consumed by homebrew fallback until newer configuration is saved.
- `resetMonitor`: purposeful test reset helper.
- Public module APIs, active notifications, minimized EKG and native integration.

## Scope and limits

All 67 runtime TypeScript modules are reachable from the entrypoint. TypeScript unused-local/unused-parameter checks passed. Reachability does not prove every branch or external integration is used. Dynamically generated localization keys were excluded from blanket removal. This is a source audit, not live Foundry verification.

Automatic approval review rejected the broader cross-subsystem deletion patch before execution. Only the verified HUD cleanup was pursued; additional candidates remain unchanged pending approval.

## Shared native wrapper registration (2026-09-21)

EMP and injury guards both use CPR createRoll; native-effect observation and managed damage capture both use RenderDamageApplicationCard. These now share one libWrapper MIXED registration per owner/method. Internal WRAPPER handlers run before MIXED handlers so observations survive capture/cancellation. Call receivers, arguments, synchronous results and asynchronous failures are preserved. Failed registration remains retryable. The test double now rejects duplicate package/target registrations; the earlier permissive double missed the reported startup error. Automated regression coverage is separate from live Foundry verification.
