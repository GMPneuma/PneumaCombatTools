# Chat-card audit — 2026-09-26

Scope: current Combat Tools 0.9.0 source plus the local, unreleased changes. Reviewed every explicit ChatMessage creation/update path, shared render hooks, action handlers, native delegated output, and chat-specific CSS. This is a source and browser-fixture audit, not a live multiplayer certification. The initial audit changed no runtime behavior. Follow-up implementation now fixes F1, F3 and F4; F2 QuickHack recovery is explicitly deferred at the user’s request. The observations below preserve the original audit evidence.

## Findings and current disposition

| Finding | Current status |
| --- | --- |
| F1 | Fixed: current-condition checks, authoritative stale-action rejection, affected-card refresh |
| F2 | Deferred by user; no recovery behavior changed |
| F3 | Fixed: current injury/epoch checks, withdrawn presentation and affected-card refresh |
| F4 | Fixed: ammo notice classes, injury-specific identifiers, scoped QuickHack error state; legacy failure class retained |

### F1 — Stale instant-effect follow-up actions (P2)

After Sleep is awakened or Incendiary is extinguished, the card remains `state=applied`. `instantContent` therefore emits Wake/Extinguish again. External expiration and the new target-HUD Wake also do not update that saved card state. `bindInstantControls` checks ownership and saved state but does not check whether the condition is still active. The handler can report a successful clear when nothing remains; after an encounter ends it can instead reject the stale action through encounter validation.

Evidence: [instant-effects.ts](../src/scripts/instant-effects.ts), `instantContent`, `resolveInstant`, `bindInstantControls`; [instant-lifetime.ts](../src/scripts/instant-lifetime.ts), cleanup hooks; [wake.ts](../src/scripts/wake.ts).

Recommended fix: keep the historical application result, derive follow-up availability from the current relevant condition, and refresh the affected visible cards when that condition changes. Do not reset or reapply the original effect. Verify wake/expiry/damage/extinguish, combat end, and repeated exposure.

### F2 — QuickHack interruption can leave an unresolved-looking card with no recovery (P2)

`resolveEffect` sets `effectResolved=true` before mutating the target, then writes the final summary afterward. Caught failures correctly show manual-resolution guidance. If the GM client disappears between those writes, the saved card can retain the Resolving message while later requests return early because `effectResolved` is already true. No GM review/acknowledgment control exists on this family.

Evidence: [quickhack/effects.ts](../src/scripts/quickhack/effects.ts), `resolveEffect` and `effectSummary`; [quickhack/messages.ts](../src/scripts/quickhack/messages.ts), effect slot; [quickhack/integration.ts](../src/scripts/quickhack/integration.ts), available actions.

Recommended fix: distinguish in-progress/needs-review from completed presentation and provide the standard GM-styled acknowledgment after checking the actor. Do not automatically replay partially completed target writes. This is an interruption-path finding, not evidence that ordinary QuickHack application fails.

### F3 — Movement-injury cards can display a stale Apply button (P2, presentation)

The request handler rejects a removed injury or stale combat epoch. The render hook only checks ownership, applied state, saved distance and whether combat is started. A cured injury or reset-and-restarted encounter can therefore leave a button that still appears usable but fails when clicked. Pending text can also continue to describe damage as due. HP mutation is guarded correctly.

Evidence: [injury-mechanics.ts](../src/scripts/injury-mechanics.ts), `ribsContent`, `applyRibsDamage`, and `renderChatMessage` hook.

Recommended fix: mirror the handler's current-injury and epoch checks in card availability, with a withdrawn/no-longer-applicable presentation; refresh affected warnings on injury removal/reset. Keep old applied receipts intact.

### F4 — Incomplete styling identifiers (P3)

- Reload/ammo-change notices emit only a plain paragraph, with no Combat Tools root or flag for a theme to target reliably. Their default Foundry appearance is fine; add a scoped class if custom styling is needed.
- Broken Ribs and both Foreign Object cards all emit `data-injury="broken-ribs"`. Text is correct, but a theme cannot select the actual injury from that attribute.
- QuickHack effect errors add the generic `failure` class. Scope it beneath `.pneuma-quickhack-effect`; a module-prefixed class or data state would be a clearer contract.

Evidence: [ammo-chat.ts](../src/scripts/ammo-chat.ts), report publication; [injury-mechanics.ts](../src/scripts/injury-mechanics.ts), `ribsContent`; [quickhack/effects.ts](../src/scripts/quickhack/effects.ts), `effectSummary`.

Recommended fix: add precise, stable selectors without replacing the native card skin. Treat attribute changes as documented compatibility changes.

## Card-by-card walkthrough

“Pass” means no additional defect identified in the inspected ordinary flow; it does not certify all live integrations. The shared damage component is listed separately because several families reuse it.

| Card or variant | Flow review | Styling and controls | Disposition |
| --- | --- | --- | --- |
| Single-target pending attack | Native roll is saved/withheld; eligible defender chooses Evade/decline; GM can cancel; payment interruption has Finish payment. | `.pneuma-resolution-card`, `.pneuma-pending-exchange`; native rollcard/top/cpr-block retained; state-specific controls. | Pass. Cancelled is terminal, not undo. |
| Single-target resolved attack | Reveals saved attack/defense; records hit/miss; damage and Microwaver branches remain separate. Defense modifier targets are namespaced. | Native roll HTML inside attack/defense/result sections; module outcome and cost classes. | Pass. Full opposed rolls are a single contest, not a group-result list. |
| Shared damage/application | One saved roll; recorded and selected recipients; armor/status choices; receipts and native summaries; applying/review prevent blind replay. | `.pneuma-damage-result`, recipient/action/status/recovery classes; native dice and undo preserved. | Pass. Native undo is not universal rollback of secondary effects. |
| AoE explosive scatter | Placement cancel spends no ammunition; miss waits for GM center placement; recipients derive from final area. | `.pneuma-aoe-card`, `.pneuma-aoe-reposition`; labeled GM button; native attack details retained. | Pass in fixture. Check live GM-template hiding and themed width. |
| AoE ordinary damage | Per-target responses, GM overrides, avoided-target movement, shared damage, per-target application receipts; completion hides attack area. | Inline clickable defense totals, scoped result rows and shared-damage sections. | Pass. A resolved attack is not necessarily completed damage. |
| Suppression | Concentration outcome, suppression marker and next-turn expiry; cover/Run obligation remains table-managed. | Same AoE row controls and inline totals. | Pass; no implied action-budget automation. |
| AoE special ammunition | Each hit target has its own resistance/apply/GM-unaffected state; unknown specials use explicit manual completion. | `.pneuma-instant-effect` with DV, inline total/outcome/action, expandable native roll. | Ordinary flow passes; F1 affects persistent follow-ups. |
| Smoke variant | Creates independent smoke; GM Remove/Restore changes hidden state and attack obscuration; lifetime is not restarted; deletion disables restore. | Same AoE shell plus shared GM smoke control. | Pass in mechanics/render fixtures; live fog/vision remains unverified. |
| Standalone instant effect / Microwaver | Owner resistance/apply; GM skip/release/review; Microwaver hit dispatches once and delegates selection to EMP. | `.pneuma-instant-card` native rollcard root, but heading lacks the usual native top/cpr-block hierarchy; shared inline rows. | F1. Native heading framing is an optional consistency improvement. |
| EMP / Microwaver selection | Authorized chooser opens saved request; fixed shortlist/random/manual modes; current selection validation; outcomes and timed/combat restoration. | `.pneuma-emp-card` uses default Foundry content and scoped chooser/result elements; no custom outer skin. | Pass. Optional native CPR header framing for visual consistency; plain Foundry appearance is not itself a CSS violation. |
| Grapple contest | Claim Brawling response; ties favor defender; winner Hold/Take; GM End; interrupted operations expose retry. | `.pneuma-grapple-card`, native rollcard sections, scoped opposed rolls/controls. | Pass. Long opposed rolls could optionally collapse; not a group list. |
| Grapple follow-up/history | Active-grapple actions live in HUD; saved established card stays historical; choke/throw/release produce separate results and receipts. | Same family, read-only follow-up/history content. | Pass. Optional state class to distinguish historical copies more explicitly. |
| QuickHack Jack-In/hack result | Connection and routing checks; audience/identity controls; success applies effects; failure does not; valid target can Force Out. | Native CPR heading/roll blocks, `.pneuma-quickhack-*` sections; ordinary owner actions are not GM-only. | F2 in interrupted successful effect application. |
| QuickHack private/native roll | Native roll publication respects routed audience; private NPC rolls are not copied to public result cards. | Native roll HTML, shared message kind where flagged. | Pass in source/fixture coverage. |
| QuickHack Synapse Burnout damage | Produces native brain-damage card with no armor ablation/bonus critical; CPR owns application/undo. | Native system damage card; module master-off handling removes its application control. | Pass. Repeat Roll Damage currently remains available; optionally label deliberate rerolls to reduce accidental duplicate cards. |
| Force Out result | Opposed Concentration/Interface; target must win; tie keeps runner connected; successful ejection updates connection. | `.pneuma-quickhack-card` and separate native opposed roll sections. | Pass. Not a group resolution. |
| Broken Ribs / Foreign Object warning | Movement threshold creates owner/GM warning; manual 5 HP application uses a receipt to prevent repeat writes. | Native rollcard/top/bottom, `.pneuma-injury-card`; correct labels but shared hardcoded injury attribute. | F3 and F4. |
| Manual damage | Native damage dialog/result; shared application/status/armor/recovery controls. | `.pneuma-manual-card[data-manual-kind="damage"]`, shared native damage markup. | Pass. |
| Manual critical injury | Native table result; selected actor application and saved receipts; separate GM review for interruption. | Same scoped manual family plus native injury/table HTML. | Pass. This standalone workflow does not imply extra automatic injury bonus damage. |
| GM group skill check | Per-user claim, cancel/retry/GM release; hidden/visible DV; saved inline total and outcome; clickable/keyboard-expanded details. | Native group header blocks, `.pneuma-group-rows`, `.pneuma-group-total`, `.pneuma-group-details`; GM overrides marked. | Pass in browser fixture. |
| Standard / custom / STAT rolls | Standard retains CPR critical behavior; custom uses Foundry XdY; STAT compares strictly below selected stat. | Native rolls; custom and STAT have dedicated module wrappers/result classes. | Pass. No ongoing combat request expected. |
| Native Skill / Role / initiative / injury output | Delegated to native sheet, combat or table workflow. | Native system cards/handlers remain authoritative. | Source routing reviewed; exact live system/theme combinations still need checking. |
| Reload / ammo-change notice | Reports completed player-character combat reload/change once; silent on cancel/no-op and excluded bow flow. | Default Foundry paragraph; lacks a module class. | Flow passes; F4 selector improvement. |

## CSS contract review

- No unscoped replacement of `.chat-message`, `.rollcard` or `.cpr-block` base skin was identified in module chat CSS. Native Foundry/CPR backgrounds, borders and typography remain the base.
- Shared controls intentionally have a module skin, scoped to `.pneuma-chat-button`. Current approved GM appearance is normal background/black text, red badge/outline, charcoal/light text on enabled hover or keyboard focus.
- Module layout uses `.pneuma-*` classes and workflow data attributes. Inline AoE/instant styles contain only the `--pneuma-ammo-color` value, not a complete inline card design.
- Native winner/loser blocks get module-scoped outcome shading. If an installed theme supplies different pseudo-element geometry, verify the shading there; fixtures are not a live theme certification.
- EMP and standalone instant headers are inconsistent with richer CPR cards but already inherit default styling. Adding native structural wrappers would be an enhancement, not a reason to introduce a custom frame/background.
- Group totals and new instant/AoE disclosure summaries remain interactive after resolution. Verify nested native modifier links with multiple real CPR roll snippets: unlike the single-target defense renderer, the new disclosures do not namespace those inner native selector targets. This is a compatibility verification item, not a reproduced failure.
- Older saved cards retain their saved HTML until their workflow updates them. Do not assume a source template change retroactively compacts every historical message.

## Verification performed

- Existing full automated suite: **418 passed, 4 skipped** (422 total). The skipped checks require native Foundry geometry integration.
- Eight browser fixtures passed: shared card presentation, shared chat buttons, AoE, instant effects/smoke, QuickHack, manual rolls, EMP and movement-injury cards.
- Manual-roll fixture initially failed because its old temporary CPR source path was absent and its standalone module injection had not followed the shared-helper refactor. Used the cached CPR source override and repaired the fixture import setup; it now passes. No gameplay code changed for this audit.
- **15 Mermaid diagrams** parsed and rendered; regenerated standalone HTML records the source SHA-256. Historical archived diagrams are intentionally retained as history.
- Fixtures cover declared states, permissions and interactions; they do not certify actual multiplayer sockets, native world undo, theme combinations, Automated Animations or Dice So Nice. Installed Foundry data access was unavailable in this workspace session, so no live-world visual claim is made.

## Recommended order

1. Live GM/player walkthrough of the F1/F3/F4 fixes.
2. QuickHack recovery remains deferred by explicit request.
3. Optional native header consistency and explicit reroll wording remain separate decisions.

The diagrams describe current behavior. F1/F3/F4 are implemented locally; F2 remains deferred. Native header consistency and reroll wording remain optional, unimplemented enhancements.
