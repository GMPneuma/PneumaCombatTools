import { registerNativeWrapper } from "./native-wrappers.js";
const MODULE = "pneuma-combattools";
declare global { interface SettingConfig { "pneuma-combattools.chatResultDelay": string } }

function collectResults(value: unknown, ids: Set<string>): void {
  if (typeof value === "string") {
    for (const match of value.matchAll(/data-pneuma-roll-result="([^"]+)"/g)) ids.add(match[1]!);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectResults(item, ids);
  }
}
function visibleResults(message: ChatMessage): Set<string> {
  const ids = new Set<string>();
  collectResults(message.content, ids);
  collectResults(foundry.utils.getProperty(message, `flags.${MODULE}.attachedEffects`), ids);
  return ids;
}

export function registerChatResultDelay(): void {
  game.settings!.register(MODULE, "chatResultDelay", {
    name: "Chat result delay", hint: "This delays the reveal of dice rolls for people who prefer that the DiceSoNice visual rolls process before being revealed in chat",
    scope: "world", config: true, type: String, default: "0.0",
    // Decimal keys retain insertion order; integer object keys sort ahead of fractions.
    choices: Object.fromEntries(Array.from({length: 11}, (_, index) => [(index / 2).toFixed(1), index ? `${index / 2} seconds` : "0 — Disabled"])),
  });
  const cards = new Map<string, Map<string, number>>();
  const resultsFor = (message: ChatMessage) => {
    let results = cards.get(message.id!);
    if (!results) { results = new Map(); cards.set(message.id!, results); }
    return results;
  };
  let ready = false;
  const delay = () => Math.max(0, Math.min(5, Number(game.settings!.get(MODULE, "chatResultDelay")) || 0));
  const record = (message: ChatMessage) => {
    const results = resultsFor(message);
    for (const id of visibleResults(message)) if (!results.has(id)) results.set(id, ready ? Date.now() + delay() * 1000 : 0);
    return results;
  };
  for (const hook of ["createChatMessage", "updateChatMessage"]) Hooks.on(hook, (message: ChatMessage) => { if (message.id) record(message); });
  Hooks.once("ready", async () => {
    for (const message of game.messages!) {
      const results = resultsFor(message);
      for (const id of visibleResults(message)) results.set(id, 0);
    }
    ready = true;

    // Foundry v12 awaits getHTML before inserting/replacing a chat card. Delay that
    // boundary so native and asynchronous module render hooks still run normally.
    const prototype = CONFIG.ChatMessage.documentClass.prototype;
    registerNativeWrapper(prototype, "getHTML", async function (this: ChatMessage, wrapped, ...args) {
      if (!this.id || !this.visible || this.isContentVisible === false || (this.blind && !game.user?.isGM)) return wrapped(...args);
      while (true) {
        const seconds = delay();
        const results = record(this);
        let until = 0;
        for (const id of visibleResults(this)) {
          until = Math.max(until, results.get(id)!);
        }
        if (!seconds || until <= Date.now()) break;
        await new Promise(resolve => setTimeout(resolve, until - Date.now()));
      }
      return wrapped(...args);
    }, "WRAPPER");
    // Preserve existing choices in the new dropdown; old 5.5/6-second values become 5.
    const normalized = delay().toFixed(1);
    if (game.user?.isGM && game.settings!.get(MODULE, "chatResultDelay") !== normalized)
      await game.settings!.set(MODULE, "chatResultDelay", normalized);
  });
  Hooks.on("deleteChatMessage", (message: ChatMessage) => { if (message.id) cards.delete(message.id); });
}
