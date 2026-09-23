# EMP disablement

EMP lasts **until combat ends**, replacing the ammunition's printed one-minute duration for this workflow. Start combat first. Use the EMP Instant Effect on the grenade card or through **Add effects**: resolve the native Cybertech resistance check, then apply the failed effect to create a GM selection for two cyberware/electronic items. There is no standalone EMP lightning-bolt control on the token HUD. See [Instant effects](instant-effects.md).

## Integration selection options

The normal EMP Instant Effect requests two items selected by the GM. The reusable EMP API also supports a configurable item count, chooser, eligibility and random method. These are integration options, not additional controls on the standard grenade card:

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

Affected items receive **Disabled — EMP** markers. Cyberware appears under the Biomonitor's **Implant Integrity** section with that label; clicking the entry opens its native sheet. Your own HUD needs no Biomonitor; sharing another actor's stats follows the installed-Biomonitor rule.

Native CPR Active Effects belonging to affected items are temporarily suppressed. Their original `disabled` settings, installation, Humanity, and inventory are not changed. Native item roll creation/confirmation is blocked while disabled; Combat Tools excludes disabled cyberweapons from attack/DV menus and a disabled Reflex Co-Processor no longer qualifies for Combat Tools evasion. Descriptive abilities and specific hand/held-item assignments still require GM adjudication.

A disabled foundational cyberarm/leg adds a temporary **EMP: [item] Disabled** actor status using the native broken-arm/leg icon. It does not create a physical injury or apply injury damage. Foundational legs now apply the appropriate temporary MOVE penalty, minimum MOVE 1. Existing injuries remain intact. An installed disabled Cyberleg also prevents Evasion in Combat Tools and native skill rolls. EMP/Microwaver use -6 MOVE; Cyberware Malfunction uses -4 MOVE without prohibiting Evasion. Repeated disabling uses the strongest penalty, accounting for an existing native Broken/Dismembered Leg item.

## Combat ownership and restoration

Selection requests and exact affected actor/item IDs are saved on `Combat.flags.pneuma-combattools.empRequests` and `empRecords`. Items carry references to the owning combats and an EMP-only marker key. This supports synthetic token actors, reloads, repeat clicks, and overlapping combat references without overwriting another disablement marker.

One active GM serializes application and cleanup. The chosen IDs are recorded before item writes so an interrupted operation retries the same selection. Ending/resetting or deleting combat removes that combat's references and temporary limb statuses. Other active combat references continue suppression. Restoration never enables a native effect that was previously disabled. A startup reconciliation removes stale references from ended/deleted combats and resumes interrupted applications.

For integrations, `game.modules.get("pneuma-combattools").api.emp.create(actor, options)` opens the same workflow; it requires a GM and started combat. Options are `{count, chooser, mode, policy}`. Chooser is `gm`, `player`, or `random`; mode is `equal`, `foundation-more`, `foundation-less`, or `system`; policy is `{foundational, cascade, electronics, immune: []}`. Optional integration fields are source, sourceActor, seconds and origin; see below.

Automated fixtures cover eligibility, random weights/groups, cycles, permissions, duplicate requests, interrupted writes, overlap, stale cleanup, native suppression/roll guards, and Biomonitor display/clearing. Source integration was checked against the local CPR v12 reference checkout. Live multi-client Foundry verification remains outstanding.

## Shared timed disablement

Short Circuit, Cyberware Malfunction and Microwaver reuse the picker and suppression workflow. Each timed cause has its own item flag under timedDisables; the marker combines active source labels. Original native effect disabled flags, installation, Humanity and unrelated injuries remain untouched.

- Successful Combat Tools Microwaver attacks create one Cybertech DV15 resistance card, preserving whispers/blind visibility. Failure offers a GM selection of two components for 60 seconds. Standard Microwavers are identified by native compendium source or exact name. Ordinary weapon damage is replaced by resistance. **Add effects > Microwaver** supports other attack workflows or interrupted creation.
- Quickhacks use their own chooser/exclusions, described in [Quickhacks](quickhack.md). EMP's configurable immunity list does not redefine Quickhack eligibility.
- Timed causes expire after 20 rounds in their recorded combat, falling back to world time after combat ends/deletes. Combat end clears ordinary EMP references; remaining timed causes persist.
- Reload reconciliation retains the saved selection and original timer after interrupted application. World-time/combat changes clean expired markers and limb effects. Item changes recompute leg penalties. Existing injuries and manually disabled native effects survive restoration.

Grenade EMP retains its approved combat-end duration. Creating selections still requires a started combat and active GM. Arbitrary native-sheet/third-party attack interception, combination-weapon firing modes and descriptive abilities are outside this integration; use the effect card for those cases.

Automated checks cover exclusions, attacker selection permission, independent timers/EMP references, combat deletion, native suppression/guards, weapon eligibility, leg penalties and source-card deduplication/privacy. Live multiplayer verification remains outstanding.

## EMP Effect behavior settings

Open **Module Settings → Combat & Evasion → EMP Effect behavior → Configure**. Settings are world-scoped and GM-only. They apply to new shared disablement requests, including the connected Quickhacks and Microwaver; pending requests keep their saved behavior.

| Method | GM picks | Player picks |
|---|---|---|
| RAW/manual | GM selects two for EMP; other sources retain their count | Entitled player sees all eligible components and selects X |
| Random, equal | Equal weight per eligible item | Same draw, initiated by the entitled player |
| Random, foundational favored | Each foundation has weight 2; other items 1 | Same |
| Random, foundational reduced | Each foundation has weight 0.5; other items 1 | Same |
| Random, exclude foundational | Only eligible non-foundational components | Same |
| Random shortlist | Not offered | GM draws up to 2×X candidates once; player selects X |

All four random methods, including shortlist generation, exclude items whose native cyberware category is Fashionware. They respect existing source exclusions; weighting cannot make a protected component eligible. Foundation weighting is relative per item on each draw, not a fixed overall percentage.

**Avoid overlapping host/option picks** is available under each profile's random method and defaults on. When the source cascades host shutdown to its installed options, subsequent draws exclude components whose resulting shutdown overlaps an earlier pick, in either parent/child order. Turn it off to permit those overlapping draws. It has no effect on a source that disables selected items only. A smaller independent pool may produce fewer selections/candidates rather than relaxing exclusions.

The player shortlist has its own choice of the four draw methods. It is saved before the chat card is created, survives reload/reopening, and is not changed by later settings edits. If offered components become ineligible, they disappear without replacement; choose up to X from what remains. Choices outside the saved list are rejected by the GM coordinator. The normal player picker does not display unoffered parent names or additional affected descendants; the GM retains full results. This limits information in this workflow's UI, not access provided by Foundry or other modules.

The RAW/manual choices remain the defaults and retain eligible Fashionware. The word RAW here names the selection method only; grenade EMP still uses the previously approved combat-end duration. Other sources retain their own count, chooser, duration and mandatory eligibility rules. Existing GM immunity values remain under the same setting key, edited inside this submenu.

Verification covers methods, weights, Fashionware/source exclusions, overlap on/off, limited pools, immutable shortlist reopening, submitted-choice validation, retry preservation, settings template/saving and player-facing disclosure. Live Foundry multiplayer verification remains outstanding.

- Implemented: EMP Effect behavior includes **Exclude BioWare (Pneuma Homebrew)**, off by default. Excludes Grafted Muscle and Bone Lace and Enhanced Antibodies from direct selection for all GM/player methods, including manual and shortlists. Recognizes native source identities after renaming. New requests snapshot this option; existing requests retain their policy.

- Implemented: optional Internal Frame disablement consequences: prevent player movement (GM repositioning allowed), and a configurable native all-actions penalty. Both default off; overlapping penalties use the strongest value and expire with disablement. EMP/Microwaver hardened-item policy defaults to exclusion, or can consume an unaffected selection without reroll. Uses native self/child/sibling shielding; Quickhacks bypass EMP hardening. New requests snapshot these settings.

- Revised EMP settings: GM chooses 2 / Random; player sees all and picks / saved 2xX shortlist / Random. Shared positive eligibility checkboxes for Fashionware, BioWare (Pneuma Homebrew), and Foundational, with Standard/2x/half foundational weight. Eligibility applies to manual and random selection; weighting also applies to shortlists. Existing source protections remain. Legacy per-side random methods migrate to shared options, preferring GM random settings when the two sides conflict. Existing pending requests retain their saved policy.

- Internal Frame disablement: optional MOVE reduced by checkbox and numeric amount (off by default). Uses a native MOVE modifier with zero floor; Cannot move takes precedence. Overlapping frame reductions use the strongest active value and restore when their disablements expire. New requests snapshot the option.
