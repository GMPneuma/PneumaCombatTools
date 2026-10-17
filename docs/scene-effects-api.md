# Scene effect API

`game.modules.get("pneuma-combattools").api.sceneEffects` exposes version 4.

`await sceneEffects.create({provider, group, source, index, target, title, label, formula?, damage?, result?, avoidance?})` returns a chat-message ID. The active GM calls it only after approving the effect.

- `provider`: active module ID exposing `api.sceneEffects.apply(source, index, cardId, amount?, avoided?)`.
- `group`: stable identifier for one activation/effect, shared across affected targets.
- `source`, `index`: provider-owned source message ID and effect index. Repeating the pair in a group returns the existing card.
- `target`: TokenDocument UUID, used for the target name and native Actor ownership.
- `title`, `label`: plain text, escaped in markup.
- `formula`: optional dice arithmetic. One persisted result is shared across confirmed targets, including targets appended later.
- `result`: optional plain-text completion summary. Creates an already-applied row with no application button; intended for GM-confirmed condition spawning.

Avoidance cards are public so target owners can respond; cards without avoidance follow the current core roll mode. Target owners and GMs see avoidance controls. Shared rolls and application controls remain active-GM-only. Damage/MOVE amounts roll separately from application. The card serializes application, persists an applying state first, and requires review after an uncertain failure; it never automatically retries effects. Source providers must validate their current source revision/state, target and effect configuration, retain effect provenance/cleanup, and reject skipped or already-resolved sources. The provider returns a plain-text result summary.

Combat Tools owns native CPR damage rolls, damage application and embedded receipts for requests with damage settings. SceneTools supplies ActiveEffect application and provenance through this contract. Its original GM cards remain the approval gate and link to the effect card. Skipping or ending the source activation invalidates outstanding application. Condition spawning stays on the original confirmation workflow and publishes a completed result here. Doors, relocation and linked-hazard requests retain their SceneTools workflow.

- `avoidance`: optional `{skill: string, dv: number}`. Skill is a native skill Item ID or name; DV must be finite and nonnegative. Each target rolls through CPR createRoll/dialog/confirmRoll, native modifiers, Luck spending and critical-roll handling. The result must exceed DV to succeed; a tie fails. Condition result rows do not roll avoidance.
- On success, CombatTools calls the provider with `amount=undefined, avoided=true`; the provider must advance/skip its source without applying the effect. On failure, normal GM application passes the shared amount. Providers should validate the matching persisted card row's avoidance result as well as source state.
- Claims are per target, owned by the responding user and serialized by the active GM. Cancellation releases the claim. A failed response acknowledgment can resend the same cached total without rerolling. Interrupted application enters review instead of repeating effects.

## Avoidance result query (v3)

`sceneEffects.getAvoidanceResult({cardId, provider, source, index, target})` synchronously returns a fresh `{skill, dv, total, passed}` object for a completed check. All identity fields must match. Missing cards/rows, mismatches, checks without avoidance, and pending rolls return `null`. Success means `total > dv`. This read-only query does not apply, skip, or validate the provider's current source state. It remains available during the provider callback and after completion. Use this API instead of internal chat flags. The creation API is unchanged.

## Native damage (v4)

`damage: {armor: "full" | "half" | "ignore", ablation: number}` opts a formula into the native CPR damage roll and shared Combat Tools damage renderer/application workflow. Each confirmed target receives its recorded-target bolt and Shift-click native options after avoidance fails; arbitrary selected-target application is unavailable. Armor follows the hazard configuration, with normal Combat Tools armor controls when enabled. No weapon critical bonus or injury is added to hazard damage.

The provider callback receives a sixth argument, `applyDamage?: () => Promise<void>`. After validating and persisting its applying state, the provider must await this callback exactly once instead of applying damage itself, then finish any additional provider effects and advance. Failures put the row into review. The callback uses Combat Tools damage serialization, native captured receipts and Undo. Older generic cards retain their original provider flow. Newly created SceneTools damage cards require API v4.


Hazard damage uses the normal CT Add effects slots, stored per target. The active GM selects effects before damage application; selection locks when resolution starts. The existing damage pipeline applies damage first, then attaches standard CT resistance/application controls. Effects with no resistance follow their normal direct Apply flow. Configured scene-effect avoidance is independent and still protects against its own effect before damage. No provider signature change.
