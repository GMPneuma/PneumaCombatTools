# Send messages to the Combat Tools HUD

Combat Tools 0.8.1 exposes **HUD API version 2**. Use it from a Foundry Script macro or another module after `ready`. It is an in-world JavaScript API, not an HTTP endpoint. No external service or API key is needed.

## Quick start: message yourself

Paste into a Script macro:

```js
const entry = game.modules.get("pneuma-combattools");
const hud = entry?.active ? entry.api?.hud : undefined;
if (!hud || hud.version < 2) {
  ui.notifications.warn("Combat Tools HUD API v2 is unavailable.");
  return;
}
hud.send({
  source: "my-macros",
  id: "reminder",
  text: "Check your ammunition.",
  mode: "queued"
});
```

The queued message remains until dismissed/removed or the client reloads. Its animated arrival takes six seconds; that animation duration is not its lifetime. Status HUD must be enabled to see it. Implant ownership is not required for messages.

## Choose a delivery mode

| Mode | Presentation | Lifetime / inspection |
| --- | --- | --- |
| Omit `mode` | HUD row, with arrival animation when enabled | `duration` seconds, default 60; appears in `list()`. |
| `"queued"` | Six-second dramatic arrival and dismissible HUD row | No timed expiry; `expires: 0`, `duration` does not expire it; appears in `list()`. |
| `"flash"` | Center-screen message only | Four-second display; no queued row; excluded from `list()`. |

Flash-only duration is fixed by the renderer; `duration` does not lengthen it. Device reduced motion or disabled animations substitutes immediate/static presentation. The GM may force player HUD animations, but device reduced motion still applies. Minimized HUD stays minimized; a disabled HUD stays hidden.

## Send to players — run as GM

```js
const hud = game.modules.get("pneuma-combattools")?.api?.hud;
if (!hud || !game.user.isGM) {
  ui.notifications.warn("Run this macro as a GM with Combat Tools enabled.");
  return;
}
const recipients = game.users.filter(u => u.active && !u.isGM).map(u => u.id);
if (!recipients.length) {
  ui.notifications.info("No players are connected.");
  return;
}
hud.send({
  source: "my-macros",
  id: "alarm",
  text: "Security alarm triggered.",
  recipients,
  mode: "flash"
});
```

`recipients: "players"` is shorthand for currently connected non-GMs. An empty audience throws, so the example checks first. For one person use `recipients: [user.id]`, using a **User ID**, not an Actor or Token UUID. GM recipient arrays can include other connected GMs. Offline recipients are rejected; there is no queued offline delivery.

## Send to the owners of a selected character — run as GM

```js
const hud = game.modules.get("pneuma-combattools")?.api?.hud;
const actor = canvas.tokens.controlled[0]?.actor;
if (!hud || !game.user.isGM || !actor) {
  ui.notifications.warn("As GM, select a character token first.");
  return;
}
const recipients = game.users
  .filter(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"))
  .map(u => u.id);
if (!recipients.length) {
  ui.notifications.info("No connected player owns this character.");
  return;
}
hud.send({
  source: "my-macros",
  id: `owner-notice-${actor.id}`,
  text: "Your comms receive an encrypted transmission.",
  recipients,
  duration: 30
});
```

Messages address **users**, not actors. This macro resolves owners once; it does not make the message follow token ownership or character changes later. Non-GMs may send locally with omitted recipients or `"self"`; they cannot use a recipient array, even one containing only themselves.

## Method reference

```ts
send(options): string
remove(source: string, id: string, recipients = "self"): void
dismiss(source: string, id: string): void
list(): HUDNotice[]
version: 2
```

`send` returns the message ID synchronously. It can throw; it does not return a delivery acknowledgment or Promise. `remove` uses the same GM/audience rules as send. `dismiss` always clears locally. `list` returns copies of current local API notices, excluding flash-only, native incoming attacks and the legacy world-setting notice.

| `send` field | Accepted value |
| --- | --- |
| `source` | Required string, 1–100 characters; caller-owned namespace. |
| `id` | Optional string, 1–100 characters; generated if omitted. |
| `text` | Required plain text, 1–200 characters after trimming. HTML displays literally. |
| `mode` | Omitted, `"flash"` or `"queued"`. |
| `duration` | Finite number from 0 to 86400 seconds; omitted defaults to 60; **0 also means 60**, not forever. Validated even when mode controls lifetime. |
| `recipients` | Omitted/`"self"`; GM-only `"players"` or nonempty array of connected User IDs. |
| `actor` | Optional actor UUID (1–200 characters). Show the queued entry only while that actor is the user's HUD focus. |
| `chatMessage` | Optional chat message ID (1–100 characters). Makes the notice a link to that card; never recreates a notice from the card. |

`HUDNotice` is `{ source, id, text, expires, mode?, actor?, chatMessage? }`. Timed `expires` is Unix milliseconds; queued `expires` is zero.

Incoming Attack uses this same queue under `pneuma-combattools.attack`, with the new attack card ID as notice ID. Only live creation of a waiting attack for an owned actor enqueues it. Clearing removes it locally. Updates may retire resolved notices but never re-enqueue them; loading saved cards does not generate alerts. Queue state is session-only.

## Update, clear and inspect

```js
const hud = game.modules.get("pneuma-combattools").api.hud;
const id = hud.send({source: "my-macros", id: "door", text: "Door locked.", mode: "queued"});
// Same namespace and ID replaces the message rather than adding a second copy.
hud.send({source: "my-macros", id, text: "Door unlocked.", mode: "queued"});
console.log(hud.list());
hud.dismiss("my-macros", id); // This client only.
// Equivalent local removal:
hud.remove("my-macros", id);
// GM-only remote removal, with the same audience used for sending:
// hud.remove("my-macros", id, [playerUserId]);
```

The identity is the pair `source` + `id`. Re-sending resets timed expiry, replaces active flashes, and can restore a dismissed notice. Other sources using the same ID do not collide. Changing recipients does not remove earlier recipients' copies; explicitly remove from the old audience if required. A local Clear button leaves everyone else's copy intact.

## Delivery and capacity

- API state is in client memory; reload clears it. No saved history, offline replay or acknowledgments.
- Up to three **timed API** notices are retained; the oldest timed notice is evicted by a further timed notice. Explicit queued notices are not evicted that way.
- Three rows are visible; incoming attacks take priority. Later queued rows appear as earlier ones clear.
- The API creates no chat card, executes no HTML/macros/callbacks and changes no actor mechanics.
- Remote delivery uses Foundry's `module.pneuma-combattools` socket. Use the public API, not fabricated socket packets.
- Invoke once from the client responsible for the event. Sending from every client's hook causes duplicate deliveries. Use your module's existing authority/routing convention.
- Messages are presentation for addressed viewers, not a separate encryption or anti-inspection protocol.

## Module initialization example

```js
Hooks.once("ready", () => {
  const entry = game.modules.get("pneuma-combattools");
  const hud = entry?.active ? entry.api?.hud : undefined;
  if (hud?.version >= 2) {
    // Local readiness notice; no cross-client broadcast from every client.
    hud.send({source: "my-module", id: "ready", text: "Connection ready.", duration: 10});
  }
});
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API missing | Module active, supported system, run after ready. |
| No visible message | Status HUD enabled; queued row may be behind higher-priority notices; correct recipient User IDs. |
| Remote send throws | Run as GM, choose connected recipients, ensure current module socket metadata is loaded. |
| Socket registration warning after update | Restart Foundry server, then reconnect clients; browser refresh alone may leave old server metadata. |
| Message disappears on refresh | Expected session-only storage. Use a separate persistent record if your integration needs history. |
| `duration: 0` still expires | Use `mode: "queued"` for dismissal-only messages. |
| Animation preference ignored | GM player-animation enforcement may be on; device reduced motion still wins. |

## Neural Intrusion integration — separate from messaging

```js
Hooks.once("ready", () => {
  const entry = game.modules.get("pneuma-combattools");
  if (!entry?.active) return;
  const render = actorUuid => {
    // Your module owns its renderer, cleanup and personal preference.
    console.log("Detected incoming link on focused actor:", actorUuid);
  };
  render(entry.api?.getNeuralIntrusionActor?.());
  Hooks.on("pneumaCombatToolsNeuralIntrusionChanged", render);
});
```

The read-only getter returns the focused owned Actor UUID with a detected incoming connection, otherwise `undefined`. The hook supplies that value when it changes; consumers read initial state at ready. It is not a list/count of netrunners and does not itself send a HUD message. Visual Tools uses this contract; Combat Tools retains no glitch/fire-screen renderer.

Implementation: [hud-messages.ts](../src/scripts/hud-messages.ts), [eye-hud.ts](../src/scripts/eye-hud.ts), [socket-health.ts](../src/scripts/socket-health.ts). Browser and unit fixtures cover routing, capacity, updates, modes and cleanup. Live multiplayer verification remains separate.
