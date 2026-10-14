import {sceneEncounter, encounterEpoch} from "./encounter.js";
import {primaryGM} from "./shared.js";
import {withActorMutation} from "./actor-mutation.js";
import {registerNativeWrapper} from "./native-wrappers.js";

const path = "flags.pneuma-combattools.hazardAttack";
const paid = new WeakSet<object>();
export class HazardAttackSpentError extends Error {
  readonly code = "HAZARD_ATTACK_SPENT";
  constructor() {super("This hazard actor has already attacked this round.");}
}
function hazardToken(actor: Actor): TokenDocument | undefined {
  const tokens = Array.from(game.scenes?.values() ?? []).flatMap(scene => Array.from(scene.tokens?.values() ?? [])).filter(token =>
    !!foundry.utils.getProperty(token, "flags.pneuma-scenetools.hazardBody") &&
    (token.actor?.uuid === actor.uuid || !actor.isToken && token.actorId === actor.id));
  if (tokens.length > 1) throw Error("Use the specific hazard token's sheet to attack.");
  return tokens[0];
}
/** Consume only after dialogs, immediately before native attack confirmation/ammunition. */
export async function consumeHazardAttack(actor: Actor, roll: object): Promise<void> {
  if (paid.has(roll)) return;
  const token = hazardToken(actor);
  if (!token?.actor) return;
  if (game.user?.id !== primaryGM()?.id) throw Error("The active GM must roll hazard attacks.");
  await withActorMutation(token.actor, async () => {
    if (paid.has(roll)) return;
    const combat = sceneEncounter(token.parent?.id);
    if (combat) {
      const key = `${combat.id}:${encounterEpoch(combat)}:${combat.round}`;
      if (foundry.utils.getProperty(token.actor!, path) === key) throw new HazardAttackSpentError();
      if (!await token.actor!.update({[path]: key} as object)) throw Error("The hazard attack allowance could not be saved.");
    }
    paid.add(roll);
  });
}
/** Native sheet attacks obey the same rule, even when sheet routing is disabled. */
export async function installHazardAttackGuard(): Promise<void> {
  const itemPath = "/systems/cyberpunk-red-core/modules/item/cpr-item.js";
  const rollsPath = "/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js";
  const [items, rolls] = await Promise.all([import(itemPath), import(rollsPath)]);
  registerNativeWrapper(items.default.prototype, "confirmRoll", async function(wrapped, roll) {
    if (this.parent && roll instanceof rolls.CPRAttackRoll) await consumeHazardAttack(this.parent, roll);
    return wrapped(roll);
  }, "MIXED");
}
