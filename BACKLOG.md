# Combat Tools roadmap and backlog

Indicator setting label renamed to “Indicator Scale”; saved values and sizing behavior are unchanged.

Grenade placement cleanup (local): native Token HUD clears when area placement begins, including GM scatter placement. Hidden attack templates and grid highlights also disable rendering so GM visibility refreshes cannot restore them. Missed-blast instructions are shortened and the crosshair button reads “Place New Target Center.” Automated placement/visibility and scattered-card completion checks added; live Foundry validation remains pending.

Cover/terrain notice simplified as requested: “GM resolves all aspects of cover and terrain.” Mechanics unchanged.

## Authorized cleanup pass — implemented locally, 2026-09-26

- Shared HTML escaping, stable primary-GM selection, and UUID-deduplicated world/synthetic actor enumeration. Status authority retains its owner fallback.
- EMP indexes affected actors, batches refresh work, and ignores unrelated combat writes. Full startup reconciliation remains. EMP chat cards refresh only for changed/removed requests or changed combat availability.
- AoE uses the shared pending-card tracker, seeded once at ready and maintained by message events; item/effect changes no longer scan chat history.
- Removed the obsolete EMP configuration dialog, thrown-name suffix helper, unused Quickhack audience helper, two obsolete translations, and five unused imports/parameters. Moved test-only overlap geometry into a fixture; the EMP browser fixture now exercises the supported creation API.
- Removed only the unread `evasionFlatPenalty` registration/type. The active `evasionHomebrew.rule = "flat"` still applies -4. Other legacy evasion readers, saved HUD message compatibility, and intentional test reset helpers remain.

This supersedes the remaining cleanup candidates in the historical 2026-09-20 audit. Automated checks cover batching, expiration, pending-card indexing, and request/removal refreshes; live Foundry multiplayer validation remains pending. No release performed.

## Incoming Attack queue standardization — implemented locally

Removed the legacy card-derived attack alert map and startup scan. New incoming attacks enter the shared HUD queue once, retaining actor scope and card navigation. Clear removes that queue entry; updates/reselection/reload cannot rebuild old notices. Resolution/deletion removes any remaining notice. This completes the previously incomplete queue standardization; attack resolution data stays on cards, notification state does not.

## Cyberpunk Animated Turn Indicators — implemented locally

Approved Segmented HUD and Scanner, plus the later Radial Circuit request (center-to-edge circuit paths with outward lights). Original GM appearance controls and omitted distance are superseded: all players and GMs now have client-local Color, Thickness (up to 10), Distance, Opacity, Speed and style controls. Self-CTH gear → Animated Turn Indicator opens live settings with no Save requirement. The repeated radial circuit is superseded by four independently routed, overlapping quadrants with sixteen traces and small packets. Local Animated/Static/Off choice. Native token rendering and active-scene encounter selection; cached geometry with capped animation updates and teardown cleanup. Original Target Lock and perimeter Circuit Trace proposals are not implemented. Build, lifecycle tests and PIXI rendering checks pass; live-world performance and visual acceptance remain open. Existing Monk combat highlight must be disabled separately to avoid double markers.

## Suppression/choking markers and Manual Rolls — implemented locally

Failed Concentration now applies Suppressed; GM exclusion/reset removes only that response's marker. The later expiry request supersedes manual clearing: each new combat suppression expires at the end of the affected character's next turn, including next round if applied during their current turn. Combat reset/deletion and participant removal also clear its timed effects; outside combat there is no turn timer. Cover movement remains manual. Choke applies Choking 1/2 as the sequence advances; grapple release/break/end now clears all Choking 1/2 effects, including manual markers, superseding the earlier preserve-manual-marker behavior. Unconscious remains separate. The token status menu hides the three wounded states, Speed Heal and Quick Fix without deleting their definitions or changing automation.

Manual Rolls now has the requested General Roll / STAT, Skill, Role / Damage, Critical Injury sections. GM Group Check remains in a separate final section. Skill/Role dropdowns have been superseded by scrollable lists showing current sheet values and separate View and Roll buttons on every row. Nonrolling abilities disable Roll. View opens the native item sheet; Roll uses the selected token's native CPR sheet handler. Values refresh after actor/item/effect changes. Build and browser fixture verification complete; live Foundry verification remains open.

Combat menu width — fixed locally: dedicated pneuma-target-menu class replaces native status-effects reuse. This supersedes and removes the Monk-specific width override. Browser regression covers menu visibility and 230px width alongside native/Monk status-picker styles.

## Hover EKG contrast — local preview

Added a 65% black backing confined to the EKG footprint, reduced to 105×30 (75% size), and a subtle waveform shadow. Awaiting user visual review on bright maps.

## Blank icon color — included in 0.8.6

Address the GM settings-save validation failure: normalize blank icon color to amber (`#ffc36a`) before native validation and use an amber default for both the picker and HUD, including existing null values, without overwriting chosen colors. Preserve existing valid colors and other settings. Automated regression coverage passes; live verification pending.

## Authorized encounter consistency — included in 0.8.4, 2026-09-24

Use one active, started encounter per action scene; require participating tokens; retain the selected encounter through responses, movement and effects; reject ambiguous selection and invalidated actions. Clean environment assumed. Shared lookup and regression coverage implemented; live multiplayer verification remains open. See [encounter selection](docs/encounters.md).

Current source: 0.8.0, reviewed 2026-09-23. This is a status record, not authorization to implement new work. The [complete former roadmap](docs/history/pre-0.8.0-refresh/BACKLOG.md) preserves original wording, intermediate decisions and dated investigations. This document supersedes its conflicting status labels.

## Original requests: current disposition

| Request | Status in 0.8.0 | Remaining boundary |
| --- | --- | --- |
| Target DV on hover | Implemented, including elevation and optional Autofire | Native equipment/data and scene visibility still govern availability. |
| Target right-click actions | Implemented; native HUD retained | General character-sheet replacement remains outside scope. |
| Prevent movement | Implemented GM movement modes | No general action budget or automatic Run spending. |
| Evasion / combined attack resolution | Implemented | Native attack calculates first; result/dice remain visually withheld until response. This supersedes delaying the actual roll. |
| Poison/Biotoxin and related effects | Implemented reusable resolver and native outcome reporting | Biological eligibility and unsupported sources remain adjudicated. |
| QuickHacks | Implemented connection/detection/ejection and supported effects | Manual hacks/custom hacks and Net Action spending remain below. |
| Grenades/rockets/shells/throws | Implemented | Cover/terrain destruction and unknown special ammunition remain manual. GM scatter supersedes random scatter. |
| Penalty-producing visual effects | Smoke and conditions supported | General sensory/visibility interactions remain open. Screen overlays moved out of this module. |
| Combat tracker conveniences | Combat bar, visibility, initiative, movement modes, scrolling implemented | Unspecified additional carousel-style features are not implied commitments. |
| Cyberware disablement/restoration | EMP and source-specific timed disablement implemented | Additional source integrations require explicit scope; out-of-combat EMP is unsupported. |

## Completed additions

- Grappling with self-HUD follow-ups, preserved chat history, defender Escape and establishing-turn restrictions.
- Both Foreign Object injuries reuse Broken Ribs movement-damage flow; injury guidance, MOVE floor, Cracked Skull correction and advisory next-turn reminders.
- Configurable EMP selection, eligibility/weight, hardened draws, Internal Frame MOVE/action options, source-specific durations and overlapping restoration.
- Manual roll menu, group requests, STAT checks, custom dice, common damage/effect controls and selected-target application history.
- Combat bar four-way dock/layout choice, large portraits, scrolling, end-turn/native initiative controls and minimized Players list.
- Crew Tools shortcut integration, standalone left docking, player default-character focus, status menus, notifications and message API v2.
- Settings grouping, compact subforms, shared chat-button styling, stable hover geometry and standard Critical Success/Failure terminology.
- Duplicate QuickHack validation reduced without removing checks; connection awareness stored on Combat; focused status refreshes and turn/round lifetime work.

## Open work and verification

| Area | Remaining work | Status |
| --- | --- | --- |
| Live integration | Multiple clients/GMs, linked/unlinked actors, scene changes, native dialogs/undo, status cleanup, theme combinations | Verification, not a claim of a confirmed bug. |
| Actor/token identity | Token-name vs actor-name presentation; old native cards and undo after scene changes | Retain investigation; do not infer wrong-target mutations from differing labels. |
| Smoke | Reproduce earlier missing residual smoke report in a real vision/fog scene | Open live report; automated smoke fixtures are passing. |
| Smoke/senses | Automatic smoke penalties, cyberware-dependent visibility and conditional immunity | Deferred mechanics. |
| QuickHack | Puppet/Lure decisions, physical Shard Ejection, custom hacks, Net Action spending, Neuroport and Self-ICE/Passwall automation | Manual/deferred; current catalog is not complete automation. |
| Status mechanics | Per-condition context, treatment/healing, unsupported drug/pharma behavior and outside-source integration | See current [coverage audit](docs/status-mechanics-audit.md). |
| EMP timing | Ordinary EMP remains combat-end based; no outside-combat EMP selection | Intentional current boundary; exact timed ordinary EMP requires a new decision. |
| Native undo | Secondary instant effects/statuses/smoke are not a universal transaction rollback | Manual review; investigate concrete failures before broad changes. |
| Item markers | General user management/lifetimes beyond subsystem-owned cleanup | Deferred; generic API remains visual-only. |
| Legacy QuickHack content | Old folders/gear cleanup was held until at least 0.8.0 | Still not authorized automatically by reaching that version. |
| Documentation translations | Current guides describe English UI and native CPR structures | No translation release claimed. |

## Revised, moved or canceled

- Current Action window: canceled permanently; use HUD and chat cards.
- General action-economy enforcement: excluded. Injury reminders do not spend/block Actions. Existing grapple/frame and explicit GM movement restrictions remain.
- Separate combat-resolution master switch: removed; combat cards are the module's central workflow.
- Early top-edge auto-hide combat-bar proposal: superseded by current bottom-left/top-right docking. No separate top-center auto-hide mode.
- Neural Intrusion screen glitches and personal visual-effect toggle: moved to PneumaVisualTools. Combat Tools retains detection/status/ejection and an API/hook.
- Fire-screen experiment: canceled and removed. Native On Fire mechanics and Extinguish remain.
- Test status HUD and one-time chat-history awareness migration: removed.
- Incendiary behavior: retain native damaging/penetration-triggered ignition; prior request to change it was explicitly withdrawn.
- Whole-sheet replacement, automatic item transfers, broad inventory repair/migrations and anti-cheat architecture: outside approved scope.

## Verification record

0.8.0: production build and 326 checks passed; four tests requiring native Foundry fixtures skipped. Three browser fixtures passed on rerun after supplying local library paths. Live Foundry multiplayer remains separate. The current refresh changes documentation only; it is not a new release or a gameplay change.

Self-HUD menu correction: Close Combat and thrown flyouts share attack-option styling and remain outside icon-column flow; disabled actions remain visibly muted.

Combat-bound cyberware disablements now clear on combat end/reset/deletion, including timed Microwaver and QuickHack causes. Startup cleanup removes stranded causes from ended/deleted encounters. Other ongoing combat causes and native disabled states are preserved. Automated regression coverage; live Foundry verification pending.

Self-CTH Close Combat and Thrown Weapons & Grenades flyouts now use the shared `.combat-heading` and list rows, with grapple icons, item artwork and the native improvised-weapon icon. Enabled CTH menu buttons share hover/focus background and inset outline tokens (`--pneuma-menu-hover-background`, `--pneuma-menu-hover-outline`) without changing layout; disabled actions remain dim. Existing action selectors are unchanged.

Automatic smoke obscuration: Combat Tools attacks check the attacker-center to target-center line against active saved smoke footprints; blast attacks use the chosen impact point. Crossing smoke adds the native −4 obscured-task modifier once. The attack dialog offers “Ignore smoke” for equipment or GM rulings, and native roll details retain the modifier. This runs at attack preparation, not continuously; it does not infer vision-equipment capabilities or vertical smoke volume.

Unreleased fix: cyberleg/internal-frame and QuickHack movement penalties now include native CPR per-change metadata; existing module penalty effects repair during reconciliation. This prevents the native modifier reader from failing on missing `changes` flags. Live affected-character verification pending.

Disabled cyberlimbs derive their state from combat/item disablement records. Only the mechanical MOVE penalty appears as an actor effect; redundant no-modifier limb effects from older versions are removed during reconciliation without clearing item causes or unrelated effects.

AoE re-placement: missed aim templates are gray and inactive while waiting for the GM landing point. `.pneuma-aoe-reposition` explains the state and placement bounds; the existing scatter action now reads “Place landing point.” A pointer-transparent `.pneuma-area-placement` status panel keeps placement/cancel instructions visible. The moving preview retains its color; accepting replaces the original template at the actual landing point.

Disablement audit fixes: active native leg-injury modifiers (including renamed native items) offset the cyberleg penalty; disabled/suppressed effects do not. Generic Disabled labels are display-only, including for evasion. Module-owned aggregate limb/frame penalties restore automatically while their item/combat causes remain active, including after manual effect deletion or disabling. Internal-frame policies derive from combat requests and item causes; legacy empty frame markers are removed. CPR modifier metadata repairs also cover Slow and Impair Movement.

### Bow loading flow — implemented locally, 2026-09-24

Approved target-aware bow ammunition prompt, native loading and remembered attached ammo selection implemented with regression coverage. No separate Fire last type button. Covers native bow/crossbow weapon type. Live verification pending.

- EMP settings streamlined: grouped selection controls, collapsible protection and frame options (open when configured), and conditional numeric fields. Existing behavior and saved values retained.

## Weapon ammunition controls — included in 0.8.5

Combat-only player reload/ammo-change chat reporting implemented through native CPR methods, including sheet and CTH actions. GM world toggle enabled by default; bows and characters without player owners excluded; GM actions for player-owned characters included. Cancelled/no-op actions remain silent and nested reloads do not duplicate messages. Live verification pending.

Approved targeted-weapon reload UI: disable Autofire/Suppressive below 10 rounds; empty guns replace attack icons with native Reload/Change Ammo icons and disable attacks; right-click weapon names toggles these icon sets in the same row on loaded guns. This supersedes the extra row of text buttons. Preserve bow loading. Exotic burst costs defer to core support. Automated and rendered fixture verification do not establish live multiplayer verification.

## Animated Turn Indicator concept expansion — implemented locally
Approved all static concepts: revised four-quadrant circuit, four general effects (Glitch Frame, Signal Echo, Data Stream, Arc Discharge), and one for every role (Rockerboy, Solo, Netrunner, Tech, Medtech, Media, Exec, Lawman, Fixer, Nomad). All now animate using cached PIXI geometry and existing client settings. Segmented HUD and Scanner remain, for 17 styles total. Role assignment is manual. Rendered dark/light previews and lifecycle checks pass; in-world visual approval and low-end performance remain open.

## Shared default and personal indicators — implemented locally
The former viewer-local appearance model is superseded by Default Indicator (GM world settings) and My Indicator (shared User flag). NPCs and characters without an owner override inherit Default Indicator. Character assignment wins over shared ownership; owner fallback is stable and includes offline players. All viewers resolve the same profile. Personal reset returns to inheritance; local Animated/Static/Off remains independent. Two-button live editor and profile/permission tests pass; live multiplayer verification remains open.

## Indicator viewer preferences — implemented locally
Added User Turn indicator master switch and Use default for everyone. Both are client-scoped and save immediately. Off hides NPC and personal indicators and stops animation; force-default ignores every personal override only for that viewer, without deleting it. Existing local Static/Off display choices remain compatible.

## Role indicator refinements — implemented locally
Medtech upper-right red blinking dot, visible Solo bracket/scan motion, fixed blue/red Lawman, and fixed green → yellow → orange → red Nomad speed arc are implemented. These explicit accents supersede the earlier uniform configurable-color behavior. Cached rendering and role-specific regression checks cover colors and motion; live-world visual acceptance remains open.

Correction to role refinements: the blinking red dot belongs to Media, superseding the earlier Medtech request. Media now has that fixed-red recording light. Medtech Vital Trace is replaced by Trauma Scan: a medical cross badge below the portrait, segmented diagnostic arcs and scanning probes; no EKG waveform. Saved medtech style selection is retained.

Nomad direction correction: reversed both arc and tick colors so the RPM scale advances clockwise from green through yellow/orange to red, matching the needle’s increasing-angle sweep.

Indicator Distance range revised from 0–100 to 0–50, including normalization of older default and personal values when displayed.

Arc Discharge redesign — implemented locally: supersedes the three long wire-like spokes with six close perimeter contacts, short forked discharge paths, staggered flashes and occasional simultaneous arcs. All routes are cached; visual/runtime fixtures verify dark/light rendering, inactive paths, changing active positions and no frame geometry rebuilding. Live visual acceptance remains open.

Indicator range revision: Speed maximum reduced to 2; Opacity minimum raised to 50% (maximum 100%). Applies to controls and existing saved profiles at render time.

Fixer redesign — implemented locally: the Exchange contact graph is superseded by Eurobuck Flow, with a currency display and circulating banknotes. Existing fixer style key is retained.

Role visual revision: Medtech’s busy Trauma Scan design is simplified to the medical cross and two slow brackets; removed diagnostic arcs, ticks and enclosing badge. Tech Diagnostic Bus is superseded by Toolworks: rotating cogs and a wrench, with no network traces. Both remain compatible with saved style selections.

Netrunner redesign — implemented locally: Quadrant Circuit becomes Netrunner — Quadrant Circuit, superseding Packet Route. Removed the duplicate general-style entry; 16 choices remain. Old circuit settings remain compatible through normalized profile reads and GM world-default migration.

Indicator settings access correction — implemented locally: registered the full Animated Turn Indicator editor as an unrestricted native Configure Settings submenu, grouped with the indicator settings. Players can access My Indicator without selecting a token.

## Per-token Animated Turn Indicator — implemented locally
Approved GM-only This Token mode with Use inherited settings. Store appearance on the individual scene token, ahead of player and default profiles. Existing viewer master and force-default preferences still win. GM shortcuts cover self and targeted tokens; Configure Settings captures one selected token. Tests verify independent shared-actor NPCs, reset/permissions and stable editing context. Live-world verification remains open.

- Implemented: temporary local Animated Turn Indicator preview while editing, including outside combat and out of turn. Restore normal combat rendering on close; preserve viewer master/display preferences. Supersedes requiring the edited token to be the active combatant for visual feedback.

- Implemented revision: display preferences only in main Configure Settings; appearance profiles only behind Configure. GM This Token follows newly selected tokens and updates the override label. Supersedes earlier duplicated display/appearance controls in both surfaces.

- Implemented: each player may customize Default Indicator for their own view, with Use GM Default restoring world inheritance. Use Default for Everyone uses that viewer default; My Indicator remains a separate shared character profile. Supersedes the player read-only Default Indicator tab.

- Corrected My Indicator inheritance: Use My Default Indicator follows that player's default, including the shared appearance of their character; it no longer skips directly to the GM default. This supersedes the prior owner-default isolation for inherited My Indicator only.

- Implemented: remove redundant Off from Animated Turn Indicator Display; master Use Turn Indicator controls visibility. Existing Off values migrate to master disabled. Supersedes the earlier three-choice display dropdown.

- Implemented approved settings cleanup: Combat Bar, Biomonitor and Token HUD configuration submenus; QuickHack rules plus messages in one editor; combined Hover DV selector; requested naming/hint corrections and contextual position-conflict notice. Movement placement, contextual house rules and existing setting scopes preserved. Supersedes suggestions to relocate movement, group house rules or split display/world categories, which the user rejected.

- Implemented final indicator revision: replace Glitch Frame with Vector Wake; green-bottom/red-top Rockerboy levels; redesign TECH and MedTech; enlarge Media recording dot and add red LIVE text; Exec inbox plus org chart. Supersedes previous Glitch Frame, minimal MedTech and simple Exec art. Saved style keys remain compatible.

- Implemented superseding indicator revision: approved TECH diagnostic overlay replaces tool silhouettes; MedTech cross is always red; Exec corporate authority crest/rank/command design replaces inbox and org chart. Saved style keys remain unchanged.

- Implemented: compact resistance rows (e.g. Poison DV13) with a shield Resist icon; all GM-only chat actions and explicit overrides share a normal background, red outline and GM badge, and black action text; hover/focus switches to charcoal with light action text across combat, damage, area effects, instant effects, grapple, EMP, and manual/group checks. Existing permissions remain unchanged. Build/browser fixtures verify presentation; live Foundry validation remains pending.

- Implemented: GM Remove smoke / Restore smoke toggles the saved smoke template visibility and attack obscuration together. Hidden smoke imposes no automatic attack penalty; restored, unexpired smoke does. The original lifetime continues while removed; expired/deleted smoke cannot be restored.

- Implemented: other-token right-click HUD offers Wake using action when the selected owned character is conscious and the target is Unconscious. The GM applies native Unconscious removal; Prone remains. Touching range and action expenditure remain player/GM adjudicated.

- Implemented: personal EKG pause/resume also controls the viewer's hover EKG, including an already visible trace, newly hovered tokens, and health-state redraws. The existing session-local preference remains local to the viewer.

- Implemented: per-target resistance, Evasion/Concentration, and instant damage rolls show compact clickable totals beside their outcome/pending action. Native roll HTML is retained inside a collapsed disclosure. Manual group checks already retain clickable totals.

- Fixed: combat end/reset/deletion clears temporary injury items and their status markers (Teargas Damaged Eye, Flashbang Eye/Ear, Sonic Shock Ear), while permanent injuries and other encounters remain. Existing native round/time expiry remains. Reapplication also repairs a missing marker for a pre-existing permanent injury. Biomonitor condition checks verify affected-actor display and cleanup; live verification pending.

## Chat-card audit — 2026-09-26
Completed the source/browser review of every chat publication family; see [audit](docs/chat-card-audit-2026-09-26.md). Open recommendations: current-condition Wake/Extinguish availability, interrupted QuickHack GM review, stale injury-warning controls, reload and injury-specific CSS identifiers. Optional native header consistency and explicit QuickHack reroll wording remain recommendations, not implemented features. Updated all current Mermaid flows and regenerated the browser diagrams. No gameplay changes made in this audit.

- Implemented audit F1/F3/F4: condition-aware Wake/Extinguish controls and stale-request rejection; current-injury/combat-epoch availability for movement warnings with batched card refresh; scoped reload notice, injury-kind and QuickHack error identifiers. Historical results and native card styling remain. QuickHack recovery (F2) explicitly deferred by user; its behavior is unchanged.
