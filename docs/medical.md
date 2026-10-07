# Medical and Treatment

The GM's **Enable Stabilization Function** setting defaults off and only controls automatic Needs Stabilization after character/token HP loss. Needs Stabilization has no penalties and persists after combat.

Medical and the Treatment reference share `src/scripts/medical-rules.ts` for stabilization DVs, native medical skill eligibility, injury QuickFix/Treatment DVs and permanent QuickFix classification. Patient mutations and reference-only checks remain separate.

## Token Medical menu

Right-click your character, or select your character and right-click an adjacent patient. Medical appears only when it contains an action.

- **Stabilize:** appears only with Needs Stabilization. Native TECH + First Aid or Paramedic; DV10 Lightly Wounded, DV13 Seriously Wounded, DV15 Mortally Wounded. Success requires exceeding DV and clears the status. Mortal stabilization restores 1 HP and adds one minute of unconsciousness. Takes an Action.
- **SpeedHeal:** Medtech with a carried dose and a damaged patient. Consumes one dose, heals BODY + WILL up to maximum HP, and applies Speed Heal to block reuse. Combat cleanup clears Speed Heal. No world-time cooldown; cannot heal mortally wounded patients. Does not stabilize.
- **QuickFix:** All characters see each injury's eligible First Aid/Paramedic choices and DVs, even at zero skill ranks or full patient HP. Success permanently removes injuries whose native Treatment type is Quick Fix. Other injuries are temporarily suppressed and restored at combat end; outside combat, they expire after 24 world hours or the next patient combat ends.
- **Wake Using Action:** appears when the selected conscious character can wake another unconscious character. Retains the existing wake workflow.

An active GM applies cross-actor changes. The module does not advance time or automatically spend Actions. Shift skips optional roll dialogs.

GM confirmation uses the same request helper as grapple, AoE and manual cards. A timeout means confirmation is missing; check the patient/card before retrying. It does not cancel an action already running on the GM. Existing saved-roll and dose recovery safeguards remain in Medical.

Medical checks GM/socket availability before rolling or spending LUCK. Evaluated rolls are posted before applying patient changes; reopening the same Medical action after an interruption retries the saved roll without another roll, LUCK payment, or chat card. If the patient's stabilization DV changed, the previous roll remains in chat for GM review before a new attempt.

An interrupted SpeedHeal offers **Resume SpeedHeal** to the original healer. Saved patient progress and dose receipts let it finish without consuming a second dose. Healing and completion are saved together. Speed Heal still blocks new doses until combat cleanup. Temporary QuickFix restoration retains its recovery flag until penalties are restored and its marker is removed; a failed injury does not prevent other injuries from being restored.

## Treatment roll reference

Manual Rolls → **Treatment** lists every native critical injury. Stabilize displays all three wound states in a table. Body Crits and Head Crits each have a horizontal Crit dropdown, QuickFix group and Treatment group. All four injury action buttons remain present; unavailable actions are disabled and greyed out. DVs come from native CPR injury data, including Surgery Skill.

Choose a player-owned token from the current scene, or choose **Type a patient name…**. An eligible targeted token is preselected; otherwise choose a patient. Typed names are recorded without token/actor IDs.

Reference rolls produce native skill/role cards with styled DV Success/Fail outcomes. They do not change patient effects. Medical cards use the same native presentation and preserve exact participant metadata for Visual Tools. Treatment successes do not automatically apply full critical-injury treatment.

Medical skill menu labels (2026-10-07, local/unreleased): Stabilize lists First Aid and Paramedic separately when the healer has their native skill items. QuickFix retains each injury-specific eligible skill choice. Labels show DV followed by the healer skill + native STAT base, using (1st Aid 12) / (Para 10). Zero skill ranks remain eligible. Clicking a row rolls its selected skill directly with native roll options. Medical labels wrap to keep the base visible.

Medical choice submenus (2026-10-07, local/unreleased): supersedes the expanded Stabilize/QuickFix list. When both skills are eligible, native click-to-expand details group Stabilize by DV and QuickFix by injury. Child rows show First Aid or Paramedic, applicable DV and skill + STAT base. Single-skill actions remain direct buttons with their base. Existing action/item/skill attributes and native rolling behavior remain.
