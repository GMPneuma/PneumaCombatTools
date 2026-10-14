# Scene effect API

`game.modules.get("pneuma-combattools").api.sceneEffects` exposes version 3.

`await sceneEffects.create({provider, group, source, index, target, title, label, formula?, result?, avoidance?})` returns a chat-message ID. The active GM calls it only after approving the effect.

- `provider`: active module ID exposing `api.sceneEffects.apply(source, index, cardId, amount?, avoided?)`.
- `group`: stable identifier for one activation/effect, shared across affected targets.
- `source`, `index`: provider-owned source message ID and effect index. Repeating the pair in a group returns the existing card.
- `target`: TokenDocument UUID, used for the target name and native Actor ownership.
- `title`, `label`: plain text, escaped in markup.
- `formula`: optional dice arithmetic. One persisted result is shared across confirmed targets, including targets appended later.
- `result`: optional plain-text completion summary. Creates an already-applied row with no application button; intended for GM-confirmed condition spawning.

Avoidance cards are public so target owners can respond; cards without avoidance follow the current core roll mode. Target owners and GMs see avoidance controls. Shared rolls and application controls remain active-GM-only. Damage/MOVE amounts roll separately from application. The card serializes application, persists an applying state first, and requires review after an uncertain failure; it never automatically retries effects. Source providers must validate their current source revision/state, target and effect configuration, retain effect provenance/cleanup, and reject skipped or already-resolved sources. The provider returns a plain-text result summary.

SceneTools supplies native CPR damage and native ActiveEffect application through this contract. Its original GM cards remain the approval gate and link to the effect card. Skipping or ending the source activation invalidates outstanding application. Condition spawning stays on the original confirmation workflow and publishes a completed result here. Doors, relocation and linked-hazard requests retain their SceneTools workflow.

- `avoidance`: optional `{skill: string, dv: number}`. Skill is a native skill Item ID or name; DV must be finite and nonnegative. Each target rolls through CPR createRoll/dialog/confirmRoll, native modifiers, Luck spending and critical-roll handling. The result must exceed DV to succeed; a tie fails. Condition result rows do not roll avoidance.
- On success, CombatTools calls the provider with `amount=undefined, avoided=true`; the provider must advance/skip its source without applying the effect. On failure, normal GM application passes the shared amount. Providers should validate the matching persisted card row's avoidance result as well as source state.
- Claims are per target, owned by the responding user and serialized by the active GM. Cancellation releases the claim. A failed response acknowledgment can resend the same cached total without rerolling. Interrupted application enters review instead of repeating effects.

## Avoidance result query (v3)

`sceneEffects.getAvoidanceResult({cardId, provider, source, index, target})` synchronously returns a fresh `{skill, dv, total, passed}` object for a completed check. All identity fields must match. Missing cards/rows, mismatches, checks without avoidance, and pending rolls return `null`. Success means `total > dv`. This read-only query does not apply, skip, or validate the provider's current source state. It remains available during the provider callback and after completion. Use this API instead of internal chat flags. The creation API is unchanged.
