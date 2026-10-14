# Scene attack API

`game.modules.get("pneuma-combattools").api.sceneAttack` exposes version 2.

`await sceneAttack.execute(attackerToken, targetToken, itemId, options?)` is GM-only and uses the existing native weapon dispatcher. Options are `mode` (`attack`, `aimed`, `autofire`, or `suppressive`, default `attack`) and `skipDialog` (default false). Area weapons and suppressive fire use CombatTools placement, shared attack, target responses and damage flow.

The result is `{status: "started", messageId}` when the chat card exists, or `{status: "cancelled"}` when dispatch does not start an attack or the user cancels before rolling. Started means the card was created, not that its defenders or damage have resolved. Existing three-argument callers remain supported.

Errors propagate. An error after ammunition consumption or rolling is not a cancellation; callers must require GM review rather than automatically retrying. Cancellation of chat creation after rolling also throws.

SceneTools hazard bodies receive one native weapon attack per active combat round. The allowance is saved on the real/synthetic hazard Actor immediately before native attack confirmation, after targeting/dialog cancellation points. Combat ID, reset epoch and round distinguish allowances. The active GM owns these rolls; concurrent confirmations serialize per Actor. Direct effects and condition instances do not spend an attack. Native item confirmation uses the same allowance even when sheet routing is disabled. Uncertain post-confirmation failures retain the spent allowance for GM review. Ordinary actors are unaffected.

SceneTools also shares one successful weapon dispatch across every target/effect card in the same activation. An area weapon opens one existing AoE workflow and uses its normal placement/coverage; a single-target weapon attacks only the chosen target. There is no invented multi-target fire mode. Outside combat the per-activation rule still applies; no world-time cooldown is imposed. Existing CombatTools encounter participation requirements remain in place.

A spent hazard round allowance throws an Error with code HAZARD_ATTACK_SPENT before native confirmation or ammunition expenditure. SceneTools treats only this code as a skipped weapon effect, shares that outcome across the activation, and continues remaining nonweapon effects. Other exceptions still require review.
