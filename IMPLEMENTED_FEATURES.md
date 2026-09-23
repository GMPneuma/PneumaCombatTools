# Feature overview

Current capabilities of Pneuma's Combat Tools, organized by what they help you do. This is a feature overview, not a list of every control or a release history. Start with the [player guide](docs/player-guide.md) or [GM guide](docs/gm-guide.md) for instructions.

| Feature | What it provides |
| --- | --- |
| **Target-based combat** | Weapon, melee, unarmed, martial-arts and thrown attacks using native CPR rolls. Paired cards coordinate defense, damage and critical-injury application; hover previews help assess ranged DVs. |
| **Area attacks** | Placed grenades, rockets, shotgun-shell attacks and suppressive fire. Individual responses, shared damage, scatter and GM target adjustments keep group attacks in one workflow. |
| **Instant effects and special ammunition** | Reusable resistance and effect resolution for supported ammunition, also available through Add effects. Includes poison/biotoxin, EMP, flashbang, teargas, sleep, ignition and persistent smoke. |
| **Grappling** | Opposed grabs, holds, escapes, third-party breaks, choking and throws. Tracks relationships, penalties and held-token movement. |
| **QuickHack** | Jack-In and hacking against characters, with encounter connections, detection, ejection and configurable program availability. |
| **Character status HUD** | A compact, docked display of vitals, injuries, active drugs/pharma, cyberware and situational states. Private notifications and optional scanline animations; installed Biomonitors allow others to view shared stats. |
| **Native status integration** | A grouped status picker linked to native injury items and supported drug effects. Recognizes native fire and ammunition outcomes; manages declared timed effects and combat-end cleanup. Injury and EMP roll guards coexist on shared native methods. |
| **Combat bar** | Compact floating strip on the left above Players, with client-selectable 32/40/48px square actor portraits, vertical/horizontal layouts, optional name-only tooltips, minimize/restore and a semi-transparent container; owned-token selection, permission-checked double-click sheets, native tracker visibility, automatic scrolling to the active turn, native player ping/pan visibility checks with unrestricted GM navigation on the current canvas and GM Shift-hold native pull pings, owner End Turn via the GM, GM round-indicator flyout for native Roll All, Roll NPC and Reset Initiative actions, GM status flyouts and native right-click combatant controls. GM movement modes use centered icon buttons anchored at the lower-left of the screen above Players in either layout, opposite the layout and turn controls, and remain available while minimized, with a configurable starting mode and a five-second warning cooldown. See [combat bar](docs/combat-bar.md). |
| **Movement and injury support** | Scene-active encounter movement counters, fixed scene-space start outlines and reset controls, optional MOVE costs for AoE evasion, leg-condition Evasion restrictions, and manual Broken Ribs damage reminders. |
| **Rules and presentation controls** | GM choices for evasion, area attacks, QuickHack, critical injuries and visibility. Players control their own HUD display and animation preferences. |

## Scope

The separate Current Action window proposal is permanently canceled. Combat presentation uses the HUD and chat cards.

Combat Tools supports Foundry v12 with Cyberpunk RED Core and libWrapper. It is a combat aid; the native character sheet remains the place to manage characters and equipment. Optional chat-card styling is provided separately by Pneuma's Visual Tools.

An active GM coordinates shared writes. The module does not enforce a universal Action budget, automate every status or injury rule, or replace GM decisions about biological eligibility, unusual movement and cover.

Timed effects with numeric durations use the encounter clock; one minute is 20 rounds. Combat-end cleanup removes applicable timed effects, including manually applied ones, while permanent critical injuries remain. Native drug effects with no numeric duration still need manual timing. Temporary Flashbang/Teargas injuries expire through their own effect workflow.

Smoke rendering is implemented, but a reported missing residual smoke effect still needs live confirmation. Smoke attack penalties and NET Architecture connections are not implemented.

For complete boundaries, see [GM guidance](docs/gm-guide.md#automation-boundaries), the [status mechanics audit](docs/status-mechanics-audit.md) and the [backlog](BACKLOG.md). Automated verification is not a claim of live multiplayer compatibility.

## Tester feedback implementation (unreleased)

- Removed the general initiative controls from CTH; encounter initiative actions are on the combat bar round flyout. Self-CTH retains its conditional speedware reroll.
- Added self-HUD thrown weapons/grenades. Grenades use ground placement without enemy targeting; single-target throws require one other target.
- Added 64/80/96 px combat-bar portrait choices. Top docking with an autohide tab is available; bottom preferences are preserved.
- Added opt-in automatic NPC evasion, gated by RAW eligibility. AoE additionally rejects penalties, movement cost/borrowing and Cover Up. GM still places successful AoE evaders.
- Connected Impair Movement/Slow to timed MOVE effects, Sonic Shock to temporary native Damaged Ear and Deafened, Overheat to Strong fire, and System Reset to timed sleep/wake-on-damage plus Prone. Existing Synapse Burnout damage control remains.
- Detected active incoming Jack-In appears in situational HUD statuses, with identity disclosure governed by existing routing. New player detection uses the existing dramatic HUD animation and respects animation/accessibility settings. Later silent/failed hacks retain detected awareness for that connection.
- Manual Quickhack handling remains: Lure, Puppet, Shard Ejection. Short Circuit and Cyberware Malfunction now use shared timed disablement. Identical movement hacks refresh duration and retain the strongest amount rather than stack; distinct hacks remain separate native effects.
- Incendiary behavior is unchanged. Interrupted damage, duplicate dice and AoE cleanup changes are outside this implementation batch.
- Verification: automated coverage and build are recorded in the task result; live Foundry/multiplayer verification is outstanding.

- Hover EKG is available when the viewing character is a Medtech OR the hovered target has an installed Biomonitor; the existing Always show EKG world override remains available.

## Shared disablement and top combat bar (unreleased)

- Connected Short Circuit (GM chooses up to three), Cyberware Malfunction (attacking player chooses one plus installed options), and Microwaver (DV15 Cybertech, GM chooses two). Timed sources last 60 seconds / 20 rounds; EMP grenades retain combat-end duration.
- Native item effects/rolls and Combat Tools eligibility respect independent causes. Temporary cyberleg penalties restore without physical injury items or enabling previously disabled effects. Hand assignments/descriptive abilities remain adjudicated.
- Added per-client **Combat bar placement: Top (autohide tab)**: horizontal, initially collapsed, hover/focus reveal, click-to-pin, Escape/minimize collapse, open-menu protection, downward controls. Bottom preferences are retained.
- Supersedes earlier source-dispatch and top-placement deferrals. Arbitrary third-party/native attack interception, combination-weapon modes and out-of-combat selection creation remain outside this integration.
- Automated build/workflow/browser validation is recorded in the task result. Live Foundry/multiplayer remains unverified; no deployment or release performed.

## Combat bar layout correction (unreleased)

Supersedes earlier top-placement and detached movement-control descriptions. Top placement, autohide tab and placement setting are removed. All four movement buttons stay at the bottom-left corner inside one shared translucent bar above Players. Portraits extend upward (vertical) or rightward (horizontal); round counter/arrows remain at the top or far right respectively. Movement anchoring survives all portrait sizes and minimization. Build and browser geometry/visual checks passed; live Foundry verification remains outstanding.

## Players control: minimized mode (unreleased)

Click the native Players heading to cycle **Online → All → Minimized → Online**. Minimized hides every player row and retains the heading as the restore button. The small mode label and tooltip describe the current/next state. Enter and Space also operate the heading.

The state is saved per client and survives rerenders, user connections and application recreation. Native online/all filtering, row permissions and context menus remain in use. Native AV hiding behavior remains authoritative. The combat bar follows the Players panel height through its existing resize observer. Browser checks cover the cycle, filtering, keyboard restore, persistence, joins and compact height; live Foundry verification remains outstanding.

Vertical combat-bar turn controls now place Previous and Next side by side above the round counter. This supersedes earlier stacked-arrow descriptions; horizontal controls remain stacked at the far right.

Previous/Next turn arrows point left/right in both orientations; vertical layout keeps the two buttons side by side above the round counter.

## Combat Bar settings shortcut (unreleased)

The former one-click orientation toggle is now a gear button opening a compact **Combat Bar** settings window. It is available while expanded or minimized. The window reuses Foundry v12 SettingsConfig's prepared rows and native settings-category template, in the same order as the Module Settings Combat Bar group: visibility, portrait size, layout, name-only tooltips, and initial movement mode.

Labels, hints, choices and current values come from the registered settings. Native SETTINGS_MODIFY permission filters world settings, and permissions/choices are rechecked when saving. Each change saves immediately through game.settings.set and invokes its existing callback; **Done** closes the window. Reopening reads current settings. If visibility is turned off, the window remains available to restore it; Module Settings is also always available.

Build and targeted automated/browser verification are recorded in the task result; live Foundry verification remains outstanding.

## EMP Effect behavior settings (unreleased)

Added a GM-only **EMP Effect behavior > Configure** submenu under Combat & Evasion. Separate GM/player profiles default to RAW/manual selection. Both offer Fashionware-excluding equal, foundational 2×, foundational ½× and no-foundational draws. Each random profile has an **Avoid overlapping host/option picks** checkbox.

Player selection also supports a saved random shortlist of up to 2×X candidates, from which the entitled player picks X (or all remaining eligible candidates if fewer). The shortlist draw can use any of the four random methods. Candidate IDs and behavior are saved before publishing the selection card; reopening or changing settings does not redraw. The player-facing picker omits unoffered parent names and its result lists chosen components without disclosing additional cascaded items. GM results retain the full affected list.

Existing source counts, chooser ownership, protected components, duration and restoration remain authoritative: EMP normally chooses two, Short Circuit three, Cyberware Malfunction one. Manual methods retain eligible Fashionware. The existing EMP immunity setting moved into this submenu without changing its saved key. Automated and browser validation is recorded in the task result; live multi-client Foundry verification remains outstanding.

- Implemented: EMP Effect behavior includes **Exclude BioWare (Pneuma Homebrew)**, off by default. Excludes Grafted Muscle and Bone Lace and Enhanced Antibodies from direct selection for all GM/player methods, including manual and shortlists. Recognizes native source identities after renaming. New requests snapshot this option; existing requests retain their policy.

- Implemented: optional Internal Frame disablement consequences: prevent player movement (GM repositioning allowed), and a configurable native all-actions penalty. Both default off; overlapping penalties use the strongest value and expire with disablement. EMP/Microwaver hardened-item policy defaults to exclusion, or can consume an unaffected selection without reroll. Uses native self/child/sibling shielding; Quickhacks bypass EMP hardening. New requests snapshot these settings.

- Revised EMP settings: GM chooses 2 / Random; player sees all and picks / saved 2xX shortlist / Random. Shared positive eligibility checkboxes for Fashionware, BioWare (Pneuma Homebrew), and Foundational, with Standard/2x/half foundational weight. Eligibility applies to manual and random selection; weighting also applies to shortlists. Existing source protections remain. Legacy per-side random methods migrate to shared options, preferring GM random settings when the two sides conflict. Existing pending requests retain their saved policy.

- Internal Frame disablement: optional MOVE reduced by checkbox and numeric amount (off by default). Uses a native MOVE modifier with zero floor; Cannot move takes precedence. Overlapping frame reductions use the strongest active value and restore when their disablements expire. New requests snapshot the option.

- Removed the Combat resolution toggle: combat chat-card flows are core module behavior and always active for Combat Tools attacks. Removed the ordinary HUD attack fallback to native-only cards. Previously saved false values no longer affect routing; other feature settings remain independent.

- Grapple follow-up controls now live in Self-CTH Close Combat: grappler Choke/Throw/Release, defender Escape with grappler name. Established grapple actions wait until the grappler's next turn (not the establishment round), checked by the GM as well as the HUD. Original opposed-roll card remains intact; subsequent actions post separate results. Chat retains initial response/hold choices and GM recovery controls. Result cards retain original whisper/blind recipients.

- Connected Foreign Object (Body/Head) to Broken Ribs movement damage: distinct injury-labeled cards and once-per-turn receipts, retaining brokenRibs storage and data-ribs-apply control. Private owner/GM delivery and manual Apply 5 damage remain. Full coverage/gaps: docs/body-head-injury-coverage.md.

- Implemented injury automation without action-economy enforcement: Cracked Skull x3 penetrating aimed-headshot damage in Combat Tools applications (native bonus/reduction/nonlethal/undo data preserved); MOVE floor 1 for Collapsed Lung/Broken Leg/Dismembered Leg, respecting active MOVE=0 overrides. New injury HUD warnings, persistent medical guidance, Perception/speech skill reminders, advisory next-turn ear/spinal notices, and optional turn-end unpaid movement-damage reminder. No actions spent or movement/action restrictions enforced by these notices. Existing native injury modifiers remain authoritative.

## Optional Crew Tools / Biomon HUD integration
Crew Tools exposes a client-only `api.hudShortcuts` v1 content-slot registration API with availability subscriptions. Combat Tools offers opt-in per-user integration when Crew Tools is active: its minimized alert button uses that slot, with original status colors and a standalone fallback when hidden/unavailable. Expanded Biomon can dock top right or top left below navigation and beside canvas controls. Defaults are unchanged. Automated checks do not replace live Foundry testing.

## HUD Alert Delivery API
API v2 adds opt-in `mode: "flash"` (four-second dramatic-only notice) and `mode: "queued"` (dramatic arrival plus player-dismissible queue, no expiry). Legacy calls keep timed behavior. Queued alerts are not evicted by later alerts; reload clears session state. Animation preferences and recipient permissions remain respected.

## GM-enforced player HUD animations
The GM-only world setting "Force animated HUD messages for players" hides the player animation preference and overrides it while enabled, including flash-only API alerts and effect arrivals. GMs retain their personal preference; saved player preferences return when enforcement is disabled. Device reduced-motion preferences remain respected.

### Crew HUD shortcut correction
Enabling integration now immediately adds a persistent Combat Tools Biomon button below the Crew icon, without widening the calendar. It opens/minimizes Biomon and retains health/alert colors while expanded, minimized, or disabled. Hidden/unavailable Crew HUD still uses the standalone fallback.

### Integrated EKG placement
Integrated minimized Biomon retains EKG and actor name at its selected dock without a bell. Top-left minimized and expanded views anchor 8px below and right of the Crew HUD bounds, supplied through its public shortcut API. Queued messages follow below, left-aligned with the clear X first. Standalone behavior is unchanged.

Integrated Biomon messages use up to 600px of available screen width independently of the minimized EKG; actor name remains aligned to the EKG.

Biomon position is available to every user without Crew Tools. Standalone top-left docks expanded and minimized HUDs at the window corner, retaining the bell; integrated top-left retains the Crew HUD-relative anchor.

Top-left placement correction: integration only changes the shortcut, not HUD positioning. Both modes use visible Crew HUD bounds, falling back to map navigation/canvas-control bounds when absent. Supersedes standalone window-corner placement.

Biomon toggle icon: approved solid 25px broken heart with a 15px foreground bell, thin transparent crack and separation. Used in standalone and Crew HUD buttons, inheriting existing status colors.

Biomon composite icon now uses a 26px footprint for button padding, with the bell reduced another 10% relative to the heart.

Biomonitor maintenance: removed disabled manual-drag implementation (legacy setting retained), shared validated HP reading and message alignment decisions, reused one condition snapshot per redraw, and removed empty flash containers on dismissal/expiry. No intended layout or rule changes.

Movement display sizing: smaller 24px count in a 32px field; larger Reset/Run labels at 14px in 26px controls. Tracking behavior unchanged.

Combat Bar settings: opening uses Foundry render focus handling, avoiding getComputedStyle errors from focusing a window before its DOM exists.

Horizontal combat bar clears the visible macro hotbar when their horizontal spans overlap, including collapsed Players and hotbar resizing. Vertical placement stays unchanged.

## Manual rolls and armor controls (unreleased)

- Chat dice icon opens Damage, Critical Injury (Body/Head), Base Cyberpunk Roll and GM-only Group Check. Native CPR dice/formulas are reused, including Critical Success on a natural 10 and Critical Failure on a natural 1.
- Ad-hoc damage accepts Xd6/modifier, location and critical toggle; Interact with armor defaults on. Off ignores SP and prevents armor ablation. Apply to selected token reuses existing damage application and three Add Effect slots.
- Group requests use assigned player characters, a skill, optional DV and hide-DV choice. Players roll their own row; GM may roll any row. Saved inline totals and Success/Fail update on the shared card; ties fail; no DV shows totals only. Active GM required for card actions.
- Half Armor SP toggle on native CPR damage cards and Combat Tools ordinary, area and manual damage cards uses native 50% armor ignore (odd SP rounds up). Existing half armor is not halved again; full bypass remains bypass. This is a per-client next-application choice, reset when the card rerenders.
- Critical injury application uses configured native tables/items/effects and duplicate policy. Native roll visibility modes are retained; group requests are public with optionally hidden DV text.
- Automated checks cover native roll calculation, card controls, ownership, group reservations, hidden DV and armor application. Live Foundry multiplayer verification remains pending.

- STAT roll: player/GM dice-menu action using native 1d10 with critical dice disabled. Strictly below current STAT succeeds; ties fail. Uses one controlled owned token or assigned character, rereads the current native stat on submission, honors chat roll mode, and requires neither combat nor an active GM.

- Group-check results: green Success/red Fail. Click the row total (or Enter/Space) to open/close native roll details with stat, skill and modifier totals expanded. Removed the separate Roll details label. STAT-check outcome text uses the same colors.

- Manual-roll chooser is a styled chat-dice flyout with icons, keyboard navigation, Escape/outside-click dismissal and GM-only Group Check. Native configuration dialogs use consistent labels and spacing, paired damage dice/modifier and DV/privacy controls. Damage dice are restricted to a dropdown of 1d6 through 8d6 (default 3d6). Result cards remain unchanged.

- Group-check disclosure correction: every rendered row starts with its full roll hidden. Clicking the row total reveals both the native roll and expanded `.d10-data-details` modifier breakdown; clicking again hides the entire detail block. Visibility is initialized on the rendered DOM so saved HTML or theme display rules cannot leave the roll open by default.

- Group checks now use native `.rollcard-top`, `.rollcard-bottom` and `.cpr-block` styling. `.pneuma-group-heading` places the skill and `.pneuma-group-dv` on one line; replaces the standalone h3/paragraph header. Existing cards receive the updated header on render. Hidden-DV visibility, result colors and collapsed roll details remain unchanged.

- Implemented shared chat-only button styling across attack/evasion, damage, AoE, grapple, Quickhack, EMP, instant effects, injuries and manual/group checks. Half Armor has a checked-box + solid selected fill; actions share sizing, icon treatments, focus, busy and disabled/completed states. Recovery/cancel controls have amber/red borders. Skin tokens and stable-geometry rules are documented in [chat-buttons.md](docs/chat-buttons.md). Existing action selectors and handlers are retained. Supersedes previous per-flow button sizing and faint Half Armor selection styling.

- Cyberpunk roll dialog includes Custom Roll below the standard roll, with aligned count × sides controls rendered as x d y (1–20 dice; 1–100 sides). Separate Roll Cyberpunk / Roll Custom actions. Custom rolls use Foundry dice/rendering and current roll visibility, without the Cyberpunk base/modifier or Critical Success/Failure rules. `.pneuma-custom-dice` styles inputs; `.pneuma-custom-roll-card` retains native generic dice markup.

- Selected chat toggles now use charcoal fill, white text/checkmark and a red border. `--pneuma-chat-button-selected-border` independently controls the selected border for reskinning; sizing and behavior are unchanged.

- Superseding Cyberpunk dialog layout: shared Label and Modifier, Standard Cyberpunk 1D10 / Custom radio choices, and one Roll button. Standard is selected initially; Custom unlocks the 1–20 dice / 1–100 sides inputs. Both modes use the label and modifier. Only Standard uses Critical Success/Failure. `.pneuma-roll-modes` and `.pneuma-custom-roll:disabled` style the choices and locked fields. Replaces the previous two-button layout.

- Damage cards now pair `.pneuma-interact-armor` (default on) to the left of `.pneuma-half-armor` in `.pneuma-armor-controls`. Turning interaction off bypasses SP and armor ablation and disables Half Armor; turning it on restores the original armor calculation. The world setting **Show armor controls on normal damage cards** defaults off; enabling it shows both controls on normal/native/AoE cards. Chat-menu manual damage always shows both. The pair uses a compact two-column grid so controls stay side by side. Manual damage preserves its initial dialog armor choice and allows changing it on the card. Controls use shared toggle skin tokens; shields and native damage options are unchanged.

- AoE decline-evasion tooltip and accessible label now read **Don't Evade**; action and selectors are unchanged.

- Native attack dialogs containing Combat Tools unaware/improvised fields now recalculate height within the viewport, scroll form content separately from the Confirm/Cancel footer, and give Additional Mods a visible input and comma-separated hint. Native inputs, modifier handling and listeners are preserved.

- Implemented: detected incoming Jack-In is a persistent Neural Intrusion biomonitor icon. Right-click On Fire to extinguish; right-click Neural Intrusion to select a detected netrunner and invoke the existing ejection flow. Optional per-user screen interference lasts 1.8 seconds, first after 1 second then following 6–10 second pauses, with six prominent cyan/purple distortion bands, only for the focused owned actor, respecting reduced motion and HUD animation preference. Initial detection notices are retained.

- Status icon right-click actions now use a compact body-mounted floating panel with shared CTH surface tokens; no HUD layout changes. Duplicate unnamed netrunner choices are numbered. Dismisses on outside click, Escape, scrolling, resize or removal of the source icon.

- Combat bar: bottom-left vertical height ends below the lowest main canvas-tool button, with a scrolling combatant list and canvas-tool stacking priority. A new per-user Top right dock anchors movement controls at top right; portraits extend left horizontally or down vertically, and round controls stay at the opposite end. Top right temporarily forces BiomonHUD left without changing its saved preference. Both settings screens explain the override.

- Top-right correction: End Turn uses viewport-clamped positioning outside HUD clipping and checks portrait visibility only along the scrolling axis. Horizontal flyouts sit 4px below the bar, reserving extra room only when sharing the active portrait with a visible End Turn button.

- Performance cleanup: native Quickhack rolls validate at start, after dialogs/confirmation and after roll rendering rather than at every intermediate await; ownership, range, wall sight, connection and hack-availability checks remain. Combat connections now persist detection, identity-reveal evidence and response audience. HUD/ejection reads no longer search chat, and deleting a card does not remove a detected link. No chat-history awareness migration or compatibility reconstruction is performed.
- Instant-effect expiration runs for the departing actor at turn end and all encounter participants at round rollover, with world-time expiration retained for actors outside started combats. Unrelated combat updates do not trigger expiration. Status synchronization ignores unrelated effects/cosmetic updates, combines passive refreshes, and preserves explicit operations and failure recovery. Status action menus close through HUD lifecycle cleanup instead of a page-wide observer. Item-marker and grapple hooks inspect changed flag paths directly, including nested/dotted/deletion forms.

- Ad-hoc damage uses the same `renderDamage` application-row renderer as normal combat damage: `.pneuma-damage-application-box > .pneuma-damage-controls` contains the bolt + “to selected target” recipient on the left and three `.pneuma-damage-status-slot` controls on the right. Ad-hoc cards omit the recorded-target row and retain creator/GM effect-edit permissions, shared Shift-click armor/application options, and their existing critical-injury/recovery actions. The separate manual application/effect-slot builder is removed.

- Both normal and ad-hoc damage cards persist selected-target applications in `damage.selectedTargets` and rebuild an “Applied to” list (`.pneuma-damage-target-history`) from that state on every render. Each successful selected-target application adds one named entry; repeated deliberate applications remain separate. Names are HTML-escaped. Native numeric receipts remain expandable below the list. Message writes use state snapshots to avoid sharing mutable in-flight damage state with document updates.

- Add Effects picker: collapsible Instant Effects, Body Crits, Head Crits, Drugs, Pharma and Misc sections, omitting empty categories, addiction entries, and Lightly/Seriously/Mortally Wounded statuses. Instant Effects opens initially; editing a slot opens its current category. Native details/summary controls support keyboard navigation; duplicate choices remain disabled and None clears a slot. Custom configured statuses fall back to Misc. Picker scope: `.pneuma-damage-status-picker .pneuma-effect-category`.

- Implemented settings cleanup: four combat bar placement radio choices shared by Module Settings and its compact editor, retaining saved dock/orientation values. Related attack cards, evasion/area, movement/initiative, injuries/effects, QuickHack, combat bar, token HUD and Biomonitor settings are grouped and ordered together.

- Settings polish implemented: flexible labels, compact inline Homebrew button, Allow Cover Up Homebrew label, labeled custom-status rows, and QuickHack message groups by source/target and action. Removed Test status HUD and all production demo rendering/controls; live HUD remains.
