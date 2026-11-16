# Status picker and native synchronization

Status synchronization updated 2026-11-12.

The token HUD provides the module's grouped Cyberpunk status catalog, with native injuries and supported drugs/pharma bound to their native items/effects. The GM can edit custom status names/icons and configure an optional reusable effect with native modifier controls. Names/icons alone do not add mechanics. Avoid another module simultaneously replacing/managing the same palette without testing compatibility.

The token picker hides Lightly Wounded, Seriously Wounded, Mortally Wounded, Speed Heal and Quick Fix. Definitions remain registered so existing effects and wound automation continue normally. Other entries retain their native click/right-click handlers.

Failed suppression responses apply Suppressed; GM reset/exclusion removes the marker for that token response, preserving other sources. New combat markers automatically expire at the end of the affected character's next turn; a marker applied during their current turn survives until their turn ends next round. The timer follows the original encounter, clears on reset/deletion or participant removal, and catches up on reconnect. Moving to cover and clearing outside combat remain manual. Grapple Choke applies Choking 1/2 on consecutive rounds; Unconscious replaces the managed choking stage. A skipped sequence clears managed choking markers. Release, successful break/escape, throw and other grapple endings remove all Choking 1/2 markers, including manual ones, without removing Unconscious or unrelated effects.

Activating a bound injury reuses or imports its native injury item. Its native Active Effects carry the token status and respond to toggles. An injury with no native Active Effect gets a removable actor marker labeled “Created by Pneuma Combat Tools.” Removing that marker hides it across refreshes and preserves the injury item. Explicitly turning the status on restores the marker. Drug activation enables supported effects; deactivation disables those effects and preserves inventory. Existing native items/effect changes reconcile back to the palette. Queues are per actor, passive refreshes are batched, and unrelated cosmetic changes do not force reconciliation.

The Add Effects picker is related but narrower: Instant Effects, Body Crits, Head Crits, Drugs, Pharma, Misc; no addictions or wounded-state entries. This exclusion does not erase those states from actors or from other HUD indicators.

An icon is not proof of complete rule automation. See [injury coverage](body-head-injury-coverage.md) and [status mechanics audit](status-mechanics-audit.md) for native modifiers, reminders and manual contexts. Treatments, doses, addiction checks and generic action budgets are not supplied by palette synchronization.

Styling and custom artwork remain separate from mechanics. Preserve native IDs and bindings when integrating; use the status API/managed workflow rather than replacing names to simulate mechanics.

Implementation: [status-catalog.ts](../src/scripts/status-catalog.ts), [status-settings.ts](../src/scripts/status-settings.ts), [status-hud.ts](../src/scripts/status-hud.ts), [status-sync.ts](../src/scripts/status-sync.ts), [damage-status.ts](../src/scripts/damage-status.ts).

2026-10-09 local update: Drugs contains nine primary statuses; Addiction contains the nine corresponding addiction statuses. Both groups are collapsed and alphabetical, and retain native Foundry controls. This reorganization preserves all IDs and native bindings. Hornet's Pharmacy drugs/pharmaceuticals are already included in this catalog. Emerald City, Mortalis and Red Lace remain excluded by user request. Piranha Smash uses Smash's status; its different addiction-check DV is not handled by the status picker.

General status group (2026-10-09, local/unreleased): normal and custom token statuses appear in a General disclosure section above the specialized groups. General starts expanded on each new HUD render and can be collapsed by clicking its heading. Other sections retain their collapsed defaults. Native status controls and alphabetical order are preserved.

All-area noncombat targets (2026-10-09, local/unreleased): all area attacks accept affected scene tokens outside the encounter tracker. AoE target damage, attached effects, special-grenade resistance/application and GM recipient controls retain the originating encounter without requiring target membership. Optional evasion MOVE spending/borrowing applies only to tracked combatants; outside-tracker evaders can relocate without turn bookkeeping. Attacker membership, actor permissions, scene checks and ended/reset encounter validation remain. Timed effects follow the originating encounter clock; outside-tracker On Fire damage and suppression next-turn timing require manual handling.

Blue Glass native-source correction (2026-10-09, local/unreleased): CPR v0.92.4 core Blue Glass (UrKzMiFp4xFOLNIC) has effects: [], usage: toggled and consumed: None. Remove the invalid primary/addiction native-effect bindings that caused Native Blue Glass effect is unavailable. Both existing IDs remain manually managed markers, preserving inventory and independent addiction state. Supersedes the earlier claimed Blue Glass native-effect synchronization; no drug effects or mechanics are invented.

Status list correction (2026-10-09, local/unreleased): removes Asphyxiating and Iron Grip from the Combat Tools status catalog and removes the dedicated Asphyxiating HUD recognition. Existing actor effects are not automatically deleted. Historical audit documents remain as history.
# Custom effects and dynamic reuse (local/unreleased)

Open **Module Settings → Status effects → Configure status effects**. The four tabs are:

| Tab | Contents | Action |
| --- | --- | --- |
| System effects | Statuses with matching effects on installed system Items or modifier data on registered statuses | View effect shows all matching native effects. Display-only details; no saves, copies, or editing. |
| System statuses | Registered statuses and native Items without a matching effect | Add effect through the native system editor. Missing native sources are labeled unavailable, not assumed to be effectless. |
| Combat Tools Statuses | Entries without a native source, including Intoxicated and Needs Stabilization | Add/Edit effect; existing module automation still applies. |
| Custom User Statuses | User-created and imported custom entries, including the prepopulated In Jail example | Add names/icons, Edit effect, or remove an entry. |

Classification reads installed sources whenever the window renders. Adding a custom modifier does not change the entry's original source category. Hidden wound-state/Quick Fix entries are excluded, matching the token menu. Manual category reassignment is not provided.

View effect displays the original system modifier values, operations, duration and flags in a read-only dialog. Viewing does not save pending user rows or open an editable system sheet. Existing system effects cannot be customized here.

Add/Edit effect for entries without native effects saves pending user rows, creates a standalone world gear Item template if needed, and opens Cyberpunk RED's standard effect editor. Reset disconnects that supplemental template; removing a user row or resetting a status does not delete its world Item. The former native Item replacement feature is removed. Saved Item overrides from earlier local builds are ignored; their world documents and existing Actor instances remain untouched.

When applying a status, Combat Tools checks current Actor and owned-item effects, including disabled effects. It matches status IDs first, then the localized name ignoring case and surrounding spaces. Matching effects retain their modifiers, duration, and native flags. Turning them off disables them. Native drug and injury items keep their specialized activation rules.

If no matching effect exists, an unbound status with a supplemental template copies its effect data onto the Actor, provided the system has no matching effect. Bound statuses always import the original native Item. Only an effectless native status can receive a supplemental effect on its owned Item. Existing matching modifier effects are never overwritten. Editing an added template affects future copies. A missing template produces an error; Reset disconnects it so a replacement can be created. User-entry Edit effect can recreate a missing template. Statuses without templates retain ordinary native/marker behavior.

**Intoxicated** is an icon-only status using Font Awesome Free's `face-dizzy` SVG (CC BY 4.0, Fonticons, Inc.; fill changed to white). No alcohol penalty is assumed. A matching Actor or item effect can provide modifiers.

Source-reviewed against the local Foundry-v12-compatible Cyberpunk RED source. Live Foundry verification remains pending.

Status icon colors (2026-11-15, local/unreleased): In Jail is a prepopulated, editable/removable example in Custom User Statuses. Each of the four tabs has a saved default icon color; user entries can override it or use the section default. Red addiction icons retain their original artwork. Configuration previews use contrasting wells for light/dark visibility; token-menu icons retain native backgrounds. Saved colors redraw token effects and overlays without modifying effect documents or modifiers. Automated verification is separate from live Foundry validation.

Use **Save settings** to apply section and user colors. **Use section default** clears the per-user override. Add/Edit effect also saves pending colors.

Status color resets (2026-11-15, local/unreleased): Reset beside each section color restores white. Reset beside a user color restores inheritance from its section. Previews update immediately; Save settings applies the changes.

Effect view and removal labels (2026-11-15, local/unreleased): the read-only view shows modifier tables and any nonzero duration directly, without expandable raw flags or empty duration fields. Dialog height fits content and long values wrap. Supplemental-effect Reset is now labeled Remove; color Reset buttons retain their names and behavior. Removing disconnects the template without deleting world Items or existing Actor effects.

CT automation labels (2026-11-15, local/unreleased): status settings show a Combat Tools automation badge and a short source-reviewed description separately from modifier-effect availability. Descriptions distinguish direct status behavior, reminders, and workflow-only behavior; custom user entries do not inherit automation claims by name. On Fire applies 2/4/6 HP directly at turn end, highest level only, with an active GM and combat progression. Injury damage cards still require Apply. This change documents existing behavior; it does not add automation.

Managed status controls (2026-11-15, local/unreleased): automation/reminder descriptions occupy the effect-summary column instead of No effect. Automatic and workflow-managed statuses cannot receive new supplemental effects from this editor. Reminder-only statuses retain Add effect. Native effects retain View effect. Existing supplemental templates remain visible, editable and removable; removal disconnects them without deleting documents. User-created statuses remain independently configurable.

Status table layout (2026-11-15, local/unreleased): built-in status sections now have separate Status, Modifier effect, Combat Tools automation, and Actions columns, with headers, column dividers, alternating row shading, and an outer border. Managed statuses without a modifier show a dash in that column; their automation remains in its own column. Existing control behavior is unchanged.

Custom user status layout (2026-11-15, local/unreleased): larger 48px icon at the far right with Edit icon beneath it. Moving left: icon color, name, effect state, Edit Effect, Delete. Icon paths are managed through the native FilePicker; existing save/color behavior remains.

Status column order (2026-11-15, local/unreleased): Status → CT Automation → Effect → Effect buttons, placing effect actions directly beside effect availability.

Status tab styling (2026-11-15, local/unreleased): bordered tabs connect to a shared framed content panel; the selected tab has a strong top edge and opens into the panel. Foundry tab selectors, data attributes, and controller remain unchanged.

Custom user row order corrected (2026-11-15, local/unreleased): left to right is Icon, Icon color, Name, Effect, Edit Effect, Delete. Supersedes the earlier reversed layout.

Status table header (2026-11-15, local/unreleased): expanded CT Automation to Combat Tools Automation.

Effect action layout (2026-11-15, local/unreleased): existing supplemental effects use an icon + Edit button beside an accessible trash button. Removed redundant View only text beneath native View effect buttons.

Status tab refinement (2026-11-15, local/unreleased): supersedes framed/dark tab styling. Restored the native content background; tabs now have spacing, subtle hover/selection shading, smaller counts, and a bottom selection indicator. Existing table styling and Foundry tab behavior remain.

Status review fixes (2026-11-15, local/unreleased): per-Actor status toggle serialization prevents overlapping local activations from duplicating custom effects. Bound-status deactivation disables both reused Actor effects and native Item effects, while activation preserves an already-active native variant. New Actor and supplemental Item copies reset template start times; round/turn durations use the actor encounter and current round/turn. Outside combat, round durations use three seconds per round and turn-based templates require an active encounter. New copies receive the Combat Tools attribution flag without changing source templates or existing native flags. Regression tests cover concurrency, failure recovery, native/custom coexistence, and duration boundaries; live Foundry validation pending.

Existing custom status attribution (2026-11-15, local/unreleased): Actor-sheet rendering recognizes configured custom status effects, including old In Jail copies without creation flags, and displays (Combat Tools). Uses the same dynamic ID/name matching as status reuse. No effect data, modifiers, or deletion permissions are changed.

Uniform grey status defaults (2026-11-15, local/unreleased): all section defaults and Reset now use #888888. Existing white section defaults migrate to grey once; other section colors and per-user overrides remain. Addiction artwork stays red. Users can select white explicitly after migration.

Containing tabs and button sizing (2026-11-15, local/unreleased): restored adjoining tabs connected to a bordered content panel with the native content background. Effect actions have explicit 32px height; Edit and trash remain side by side. Supersedes the separated-tab design.


### Token menu active state
The token status menu highlights a status only while an applicable effect is enabled and unsuppressed. Retaining a disabled effect on the Actor sheet does not select its icon. Enabled transferred Item effects and multiple status IDs are included; overlays follow the same active-state check. Configured icon colors are unchanged.

### Removing Combat Tools effects
Turning off an effect labeled (Combat Tools) removes that instance instead of storing it disabled. This applies to Actor effects and Combat Tools supplemental effects on owned Items. Native system/Foundry effects retain their normal disable behavior, and underlying Items and world templates remain intact. Labels and removal share one ownership check; native Item effects are not classified by name. Reapplying a custom effect copies its saved template, not edits made only to the removed instance. Existing disabled instances are not automatically purged on reload.

Status-menu release completion (v0.9.40, 2026-11-16): the status-manager, custom-effect, icon-color, attribution/removal and HUD-state changes described above are included in this release. They were not included in v0.9.38 or v0.9.39. Earlier local/unreleased labels record their implementation history. Live Foundry validation remains pending.

Status icon rendering correction (v0.9.42, 2026-11-16): matching token effects use the catalog's transparent status glyph before applying the configured color, preventing opaque native critical-injury artwork from becoming solid squares. Unknown, unavailable or opaque-corner glyphs retain original artwork; Addiction remains unchanged. Effect documents, overlays, sizing and other sprite filters are preserved. Pixel-level browser regression and automated checks cover these cases; live Foundry validation remains pending.
