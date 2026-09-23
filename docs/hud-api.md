# HUD messaging API (version 2)

Available after Foundry's `ready` hook:

```js
const hud = game.modules.get("pneuma-combattools")?.api?.hud;
if (!hud) return; // Module absent, inactive, or unsupported game system.
```

Up to three notifications appear as text outside the HUD. Each has its own Clear control. Incoming attacks take priority, link to their chat card and remain until resolved or dismissed. Clear only dismisses the local notification. Legacy timed messages expire; explicitly queued messages wait for dismissal; there is no navigation or saved history. Viewing another character never replaces the viewer's messages.

## Send on this client

```js
const id = hud.send({
  source: "my-module",
  id: "reactor-warning",
  text: "Reactor temperature rising",
  duration: 60
});
```

`send(options): string` synchronously returns the message ID. Options:

| Field | Meaning |
| --- | --- |
| source | Required module ID or namespace, 1–100 characters. |
| id | Optional stable ID, 1–100 characters. Omit to generate one. |
| text | Required plain text, 1–200 characters after trimming. HTML is displayed literally. |
| mode | Optional `"flash"` (dramatic display only, four seconds) or `"queued"` (dramatic arrival plus a row retained until dismissed/removed). Omit for existing timed behavior. |
| duration | Seconds; defaults to 60. Range 0–86400. Legacy zero now uses the 60-second default. |
| recipients | Defaults to `"self"`. GM clients may also use `"players"` (all connected non-GMs), or an array of connected user IDs. |

The pair `source` + `id` identifies a message. Sending that pair again updates its text and resets its expiry without adding a duplicate. If already cleared, sending it again creates a new notice. Other namespaces with the same ID do not collide. Updating recipients only sends to the newly specified audience; remove from an old audience explicitly if needed.

## Send to players from a GM client

```js
const id = hud.send({
  source: "my-module",
  text: "Incoming transmission",
  recipients: "players",
  duration: 120
});

// Or a particular connected user:
hud.send({
  source: "my-module",
  id: "incoming",
  text: "Incoming transmission",
  recipients: [playerUserId],
  duration: 0
});
```

Call once from the client responsible for the event. Do not send from every client's event hook. Non-GMs can send locally; cross-client API calls throw on non-GM clients. Delivery uses Foundry's existing module socket and is best-effort to currently connected clients, without acknowledgments or offline replay. Messages are shown only to addressed viewers and never shared through Biomonitor hover. Socket delivery does not provide a separate encrypted communication channel.

## Clear, remove and inspect

```js
// Dismiss on this client, like the HUD's Clear button:
hud.dismiss("my-module", "reactor-warning");

// Remove on this client:
hud.remove("my-module", "reactor-warning");

// GM: remove on the specified connected clients:
hud.remove("my-module", "incoming", [playerUserId]);

// Copies of this client's active API messages:
const messages = hud.list();
// [{ source, id, text, expires, mode? }]
```

`remove(source, id, recipients = "self"): void` uses the same audience rules as send.
`dismiss(source, id): void` always acts locally.
`list(): HUDNotice[]` returns copies; `expires` is a Unix timestamp in milliseconds, for each message. Native attack notices and legacy world-setting messages are not part of this list.
`version` is 2.

## Behavior and limits

- Messages are temporary client-session state; reloading clears them. There is no saved message history.
- At most three legacy timed API messages are retained per client; inserting another drops the oldest timed message. Explicit queued messages are retained until dismissed; only three rows are visible at a time, with later messages revealed as earlier ones clear. Incoming attacks take priority within the three visible rows.
- Expiry uses a one-shot timer, not polling.
- A disabled HUD stays disabled; a minimized HUD remains minimized and highlights its notification icon when messages exist.
- Implant ownership does not gate messages.
- Clear on one client leaves other recipients' copies intact.
- No arbitrary callbacks, macros, HTML, or actor changes execute through this API.
- The GM HUD Send HUD Message control adds messages rather than replacing the previous message. The old single-message setting is read only for compatibility with already-sent messages.

Browser fixtures verify message update, expiry, clearing, message capacity, recipient filtering and the non-GM cross-client restriction. Live multi-client Foundry verification remains outstanding.

## HUD Alert Delivery

```js
hud.send({ source: "my-module", text: "Netrunner detected", mode: "flash" });
hud.send({ source: "my-module", text: "Check your damaged cyberware", mode: "queued" });
```

Flash only: center-screen scan, hold, collapse, then disappear after four seconds. No queued row or Clear button; excluded from `list()`. Reduced-motion preferences and the animation setting produce a static four-second message instead. The same source/ID replaces an active flash; dismiss/remove also removes it.

Flash + queued: existing dramatic arrival and dismissible HUD row. `expires` is zero; `duration` does not expire this mode. Queued messages remain client-session state (reload clears them). Existing calls without `mode` retain their timed behavior. Disabling HUD hides both modes. No chat card is created. Recipient permissions are unchanged. Requires API version 2.

The GM may enforce HUD animations for players using "Force animated HUD messages for players". This hides and overrides the player animation setting for both delivery modes and effect arrivals. GMs retain their own preference. Device reduced-motion preferences still apply.

## Optional screen-effect integration

`game.modules.get("pneuma-combattools").api.getNeuralIntrusionActor()` returns the focused owned actor UUID when a detected incoming connection exists, or undefined. `pneumaCombatToolsNeuralIntrusionChanged` publishes that value when it changes. Consumers should read the API at ready and listen for changes; they own their rendering and settings. Visual Tools uses this contract. Combat Tools has no screen glitch or fire renderer.
