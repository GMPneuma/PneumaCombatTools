const MODULE = "pneuma-combattools";
/** File copies do not refresh the package metadata held by a running Foundry server. */
export function requireCombatSocket(): void {
  const module = game.modules?.get(MODULE) as { socket?: boolean } | undefined;
  if (module?.socket === false) throw new Error(
    "Combat Tools messaging is disabled in Foundry's loaded module metadata. Restart the Foundry server, then reconnect all clients. Refreshing browser tabs alone is not enough."
  );
  if (game.socket?.connected === false) throw new Error("Combat Tools is disconnected from Foundry. Reconnect before trying this action.");
}
export function registerSocketHealth(): void {
  Hooks.once("ready", () => {
    try { requireCombatSocket(); }
    catch (error) { ui.notifications!.error((error as Error).message, {permanent:true}); }
  });
}
