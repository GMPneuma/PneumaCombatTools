# Combat-end snapshot fields

The public report is captured after automatic cleanup, including QuickFix restoration. It is saved on the chat message, so later actor edits do not rewrite the snapshot or its copied Discord Markdown. Cleanup remains GM-only.

| Field | Meaning and source |
| --- | --- |
| Encounter | Combat document name, or Encounter when unavailable. |
| Scene | Combat's associated scene name; omitted when none is associated. |
| Round reached | Last observed round before reset/deletion. Not a claim that the final round was completed. |
| Recorded UTC | Time the final report was built, in ISO UTC. Not encounter duration. |
| Encounter participant counts | Unique tracked actors, including removed combatants whose actors still exist. Player ownership uses native hasPlayerOwner. |
| Participant name | Actor name at snapshot time. Multiple linked tokens share one actor condition row. |
| Player HP | Current and maximum native derived HP; unavailable values are labeled, never replaced with zero. NPC HP is excluded. |
| Player wound state | Current HP thresholds: mortal below 1; serious below half max rounded up; lightly wounded below max; otherwise Full HP. Dead requires the actual status marker. |
| Conditions | Enabled, unsuppressed effects carrying recognized general status IDs. Equipment effect names and unknown modifier effects are excluded. Derived wound-state status markers are not repeated. |
| Current injuries | Native criticalInjury item names, including preexisting injuries. Active QuickFix suppression is annotated. Known injury status markers without matching items are explicitly labeled. |
| Defeated/dead markers | Last recorded tracker defeat flags or current Dead status. These do not prove kills or identify who caused them. |
| Recorded player injury additions | The existing limited encounter injury-item record. Not a full action log; names no longer present are annotated. Partial tracking is disclosed. |
| Conditions cleared | Recognized conditions observed before cleanup whose effect is absent or no longer an active recognized condition afterward. Not all effects ever removed during the encounter. |

Copy Discord Markdown exports the saved report with names escaped and mentions neutralized. Empty event sections are omitted. Clipboard restrictions open a manual-copy text dialog.

No total damage, healing totals, attack/hit counts, ammunition spending, LUCK spending, encounter duration or medical action history is inferred from final state. Those fields would require additional event tracking.

Compact chat versus detailed Discord snapshot (2026-10-07, local/unreleased): chat shows encounter/round/counts, brief player HP/injury totals, urgent stabilization needs and outcome totals. Detailed condition/injury names, recorded additions, cleared-condition names, scene and UTC timestamp remain in the saved Discord Markdown export. No underlying report data or copy/cleanup permissions change.

Removed participants remain in the encounter participant counts, Discord snapshot, and cleanup actor scope while their actor still exists. Participant actor UUIDs and last recorded tracker defeat markers are retained in combat flags; actors deleted from the world/scene cannot be recovered. Tracking from earlier builds cannot reconstruct participants already removed before this update.
