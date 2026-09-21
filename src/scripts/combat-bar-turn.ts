import {requireCombatSocket} from "./socket-health.js";
const channel = "module.pneuma-combattools";
interface TurnRequest {barTurn: "request"; id: string; user: string; combat: string; round: number | null; turn: number | null; combatant: string}
interface TurnResult {barTurn: "result"; id: string; user: string; gm: string; error?: string}
const gm = () => game.users?.filter(user => user.active && user.isGM).sort((a,b) => a.id!.localeCompare(b.id!))[0];
const pending = new Map<string,{gm: string; resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>}>();
let queue: Promise<unknown> = Promise.resolve();

/** Recheck the exact turn inside the GM queue so two requests cannot skip a participant. */
export async function advanceBarTurn(request: TurnRequest): Promise<void> {
  const combat = game.combats?.get(request.combat), user = game.users?.get(request.user) as User | undefined;
  if (!game.user?.isGM || !combat?.active || !combat.started || !user?.active) throw Error("Combat or requesting player is no longer active.");
  if (combat.round !== request.round || combat.turn !== request.turn || combat.combatant?.id !== request.combatant) throw Error("The turn has already changed.");
  if (!user.isGM && !combat.combatant.actor?.testUserPermission(user,"OWNER")) throw Error("Only the current character's owner can end this turn.");
  await combat.nextTurn();
}

export async function requestEndTurn(combat: Combat): Promise<void> {
  const request: TurnRequest = {barTurn:"request",id:foundry.utils.randomID(),user:game.user!.id!,combat:combat.id!,round:combat.round,turn:combat.turn,combatant:combat.combatant!.id!};
  if (game.user?.isGM) return advanceBarTurn(request);
  requireCombatSocket();
  const authority = gm();
  if (!authority) throw Error("An active GM is required to end your turn.");
  return new Promise<void>((resolve,reject) => {
    const timer = setTimeout(() => {pending.delete(request.id);reject(Error("GM response timed out. Check the current turn before retrying."));},15000);
    pending.set(request.id,{gm:authority.id!,resolve,reject,timer});
    game.socket!.emit(channel,request);
  });
}

export function registerBarTurns(): void {
  Hooks.once("ready", () => {
    game.socket!.on(channel,(packet: TurnRequest | TurnResult) => {
      if (!packet || !["request","result"].includes(packet.barTurn)) return;
      if (packet.barTurn === "result") {
        const wait = pending.get(packet.id);
        if (!wait || packet.user !== game.user?.id || packet.gm !== wait.gm) return;
        clearTimeout(wait.timer);pending.delete(packet.id);
        if (packet.error) wait.reject(Error(packet.error));else wait.resolve();
        return;
      }
      if (gm()?.id !== game.user?.id) return;
      const request = packet;
      const run = queue.catch(() => {}).then(() => advanceBarTurn(request));
      queue = run;
      const reply = (error?: string) => game.socket!.emit(channel,{barTurn:"result",id:request.id,user:request.user,gm:game.user!.id!,error} satisfies TurnResult);
      void run.then(() => reply(),error => reply(String(error)));
    });
  });
}
