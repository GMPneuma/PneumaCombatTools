# Combat Tools roadmap and backlog

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
