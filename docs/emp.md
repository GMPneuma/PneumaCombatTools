# EMP disablement

EMP lasts **until combat ends**, replacing the ammunition's printed one-minute duration for this workflow. Start combat first. After resolving the source's resistance check, the GM opens the affected token's HUD and clicks the lightning-bolt **EMP: disable cyberware** control. This does not automatically roll Cybertech or resolve a grenade hit.

Choose the number of items, who selects them, eligibility and random method:

| Selection | Behavior |
|---|---|
| GM chooses | GM selects the required number from the eligible list. |
| Player chooses | A whispered chat card lets an owner of the affected actor choose. GMs can also resolve it. |
| True random | Equal probability per eligible item, without replacement. |
| Foundational more likely | Each foundational item has weight 2; other items weight 1. |
| Foundational less likely | Each foundational item has weight 0.5; other items weight 1. |
| System first | Equal chance per installation-root group, then equal chance among its eligible items. |

The selection dialog shows installed parent names and foundational labels. Random selection shows first-draw odds; probabilities change after each draw. If fewer items qualify than requested, all remaining eligible items can be selected. Already EMP-disabled items do not consume another direct selection.

**Eligibility:** foundational cyberware can be included/excluded. Carried/equipped electronics can also be included. The world setting **EMP: immune items** accepts exact item names or compendium source UUIDs separated by semicolons. Matching ignores case. The native installed-in-actor state determines installed cyberware; stored items are excluded.

**Dependent options:** enabled by default. Disabling a host also disables its installed options, including nested options. These do not consume additional selections. The dialog states this consequence before applying. Immunity prevents direct selection; an immune option still loses power with a disabled host. Turn this cascade off to affect selected items only.

System-first selection prevents extra options inside one group from diluting other groups' probabilities. Adding independent groups can still change group odds. Foundational weighting is a bias, not a complete answer to inventory padding. GM-defined custom weights and random shortlists remain possible future refinements, not implemented settings.

## Effects and Biomonitor

Affected items receive **Disabled — EMP** markers. Cyberware appears under the Biomonitor's **Implant Integrity** section with that label; clicking the entry opens its native sheet. The usual Biomonitor visibility settings still apply.

Native CPR Active Effects belonging to affected items are temporarily suppressed. Their original `disabled` settings, installation, Humanity, and inventory are not changed. Native item roll creation/confirmation is blocked while disabled; Combat Tools excludes disabled cyberweapons from attack/DV menus and a disabled Reflex Co-Processor no longer qualifies for Combat Tools evasion. Rules that exist only in item descriptions still require GM adjudication; no general limb movement/hand-use penalty is synthesized.

A disabled foundational cyberarm/leg adds a temporary **EMP: [item] Disabled** actor status using the native broken-arm/leg icon. It does not create a physical injury, apply injury damage, or add broken/dismembered stat penalties. Existing injuries remain intact. This is the requested broken-limb visual indication, not the printed dismembered-limb mechanics.

## Combat ownership and restoration

Selection requests and exact affected actor/item IDs are saved on `Combat.flags.pneuma-combattools.empRequests` and `empRecords`. Items carry references to the owning combats and an EMP-only marker key. This supports synthetic token actors, reloads, repeat clicks, and overlapping combat references without overwriting another disablement marker.

One active GM serializes application and cleanup. The chosen IDs are recorded before item writes so an interrupted operation retries the same selection. Ending/resetting or deleting combat removes that combat's references and temporary limb statuses. Other active combat references continue suppression. Restoration never enables a native effect that was previously disabled. A startup reconciliation removes stale references from ended/deleted combats and resumes interrupted applications.

For integrations, `game.modules.get("pneuma-combattools").api.emp.create(actor, options)` opens the same workflow; it requires a GM and started combat. Options are `{count, chooser, mode, policy}`. Chooser is `gm`, `player`, or `random`; mode is `equal`, `foundation-more`, `foundation-less`, or `system`; policy is `{foundational, cascade, electronics, immune: []}`. Microwaver/QuickHack source-specific automatic dispatch remains deferred.

Automated fixtures cover eligibility, random weights/groups, cycles, permissions, duplicate requests, interrupted writes, overlap, stale cleanup, native suppression/roll guards, and Biomonitor display/clearing. Source integration was checked against the local CPR v12 reference checkout. Live multi-client Foundry verification remains outstanding.
