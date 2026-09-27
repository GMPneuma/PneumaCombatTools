# Macros and API

Use these as Foundry **Script** macros after the world is ready. They call the in-world JavaScript API, not an HTTP service. No API key is needed. The public module ID is `pneuma-combattools`.

## Queue a personal reminder

```js
const entry = game.modules.get("pneuma-combattools");
const hud = entry?.active ? entry.api?.hud : undefined;
if (!hud || hud.version < 2) {
  ui.notifications.warn("Combat Tools HUD API v2 is unavailable.");
  return;
}
hud.send({
  source: "gm-pneuma-macros",
  id: "ammo-reminder",
  text: "Check your ammunition before the next encounter.",
  mode: "queued"
});
```

The message stays until dismissed/removed or the client reloads. Sending the same source and ID replaces it. Biomonitor/HUD must be visible to see its queued row.

## Flash a message to connected players — GM

```js
const entry = game.modules.get("pneuma-combattools");
const hud = entry?.active ? entry.api?.hud : undefined;
if (!game.user.isGM || !hud || hud.version < 2) {
  ui.notifications.warn("Run as GM with Combat Tools HUD API v2 available.");
  return;
}
const recipients = game.users
  .filter(user => user.active && !user.isGM)
  .map(user => user.id);
if (!recipients.length) {
  ui.notifications.info("No players are connected.");
  return;
}
hud.send({
  source: "gm-pneuma-macros",
  id: "security-alarm",
  text: "Security alarm triggered.",
  recipients,
  mode: "flash"
});
```

Flash is a fixed four-second center message, not a queued row. It is excluded from `list()`. Device reduced motion can change animation presentation.

## Send a timed message to a selected actor's owners — GM

```js
const entry = game.modules.get("pneuma-combattools");
const hud = entry?.active ? entry.api?.hud : undefined;
const selected = canvas.tokens.controlled;
const actor = selected.length === 1 ? selected[0].actor : undefined;
if (!game.user.isGM || !hud || !actor) {
  ui.notifications.warn("As GM, select exactly one character token.");
  return;
}
const recipients = game.users.filter(user =>
  user.active && !user.isGM && actor.testUserPermission(user, "OWNER")
).map(user => user.id);
if (!recipients.length) {
  ui.notifications.info("No connected player owns this character.");
  return;
}
hud.send({
  source: "gm-pneuma-macros",
  id: `transmission-${actor.id}`,
  text: "Your comms receive an encrypted transmission.",
  recipients,
  duration: 30
});
```

Recipients are **User IDs**, not Actor/Token UUIDs. Ownership is resolved when this macro runs; the notice does not follow later ownership changes.

## HUD API reference

| Member | Contract |
| --- | --- |
| `send(options)` | Synchronously returns message ID; may throw; no delivery acknowledgment. |
| `remove(source, id, recipients = "self")` | Removes notices using the same GM/audience permissions as send. |
| `dismiss(source, id)` | Removes this client's copy only. |
| `list()` | Copies of local API notices; excludes flash and native incoming-attack notices. |
| `version` | Current HUD contract is 2. |

`source` is required, 1–100 characters; optional `id` is 1–100. Plain-text `text` is 1–200 characters after trimming. Omit mode for timed messages (default 60 seconds), use `queued` for no timed expiry, or `flash` for the fixed display. Duration accepts 0–86400 seconds, but **0 means 60**, not forever. Optional `actor` is an Actor UUID for focused-actor filtering; `chatMessage` is a message ID that links to an existing card.

Players can send only to themselves with omitted recipients or `"self"`. GMs can use `"players"` or a nonempty array of connected User IDs. No offline delivery, saved history or chat creation occurs. Only three rows are visible; incoming attacks take priority. Queued overflow remains, while timed API notices have a three-notice retention limit.

## Create a poison resistance card — GM

```js
const entry = game.modules.get("pneuma-combattools");
const effects = entry?.active ? entry.api?.instantEffects : undefined;
const selected = canvas.tokens.controlled;
const actor = selected.length === 1 ? selected[0].actor : undefined;
if (!game.user.isGM || !effects?.create || !actor) {
  ui.notifications.warn("As GM, select one target with Combat Tools enabled.");
  return;
}
await effects.create(actor, "poison");
```

This creates a resolution card; it does not silently apply poison damage. The catalog IDs are `smoke`, `poison`, `biotoxin`, `emp`, `microwaver`, `flashbang`, `incendiary`, `sleep`, and `teargas`. Source-specific context still matters: EMP requires its supported encounter and incendiary eligibility must be adjudicated. Do not use a raw effect-card call as proof that an attack penetrated armor.

## Read Neural Intrusion in another module

```js
Hooks.once("ready", () => {
  const entry = game.modules.get("pneuma-combattools");
  if (!entry?.active) return;
  const onIntrusionChanged = actorUuid => {
    // Replace with your module's local renderer and cleanup.
    console.log("Focused actor with detected intrusion:", actorUuid);
  };
  onIntrusionChanged(entry.api?.getNeuralIntrusionActor?.());
  Hooks.on("pneumaCombatToolsNeuralIntrusionChanged", onIntrusionChanged);
});
```

The getter returns the focused owned Actor UUID with a detected incoming link, otherwise undefined. It is not a connection count/list. The consumer owns rendering, cleanup and preferences. Register a listener once during module initialization, rather than repeatedly running this hook-registration example as a macro.

## Item markers

`api.itemMarkers` provides `get`, `set`, `clear`, `render`, `decorate` and presets. Writes require Item ownership or GM permission. Marker keys start with a lowercase letter, contain lowercase letters/digits/underscores/hyphens, and have at most 64 characters. Labels are plain text up to 80 characters; descriptions up to 500.

Markers persist until explicitly cleared. They are visual annotations: a generic Disabled marker does not suppress cyberware, change the item name or acquire EMP cleanup. Use separate caller-owned keys for independently clearable markers.

These examples are source-checked and syntax-checked; executing their game effects still requires live Foundry verification.

Related: [Combat Tools - Module Integration](Combat%20Tools%20-%20Module%20Integration.md), [Combat Tools - Biomonitor and HUD](Combat%20Tools%20-%20Biomonitor%20and%20HUD.md), [Combat Tools - Troubleshooting](Combat%20Tools%20-%20Troubleshooting.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
