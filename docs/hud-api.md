# HUD messaging API (version 1)

Available after Foundry's `ready` hook:

```js
const hud = game.modules.get("pneuma-combattools")?.api?.hud;
if (!hud) return; // Module absent, inactive, or unsupported game system.
```

The HUD shows one message at a time. Previous/next arrows and a position indicator browse current messages. Clear dismisses only the displayed message on this client. Incoming attacks share the selector; clicking an attack opens its chat card, while Clear acknowledges only that notice. Neither action resolves the attack.

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
| duration | Seconds; defaults to 60. Range 0–86400. Zero remains until cleared, removed, or the client reloads. |
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

Call once from the client responsible for the event. Do not send from every client's event hook. Non-GMs can send locally; cross-client API calls throw on non-GM clients. Delivery uses Foundry's existing module socket and is best-effort to currently connected clients, without acknowledgments or offline replay. Messages are not a private communication channel.

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
// [{ source, id, text, expires }]
```

`remove(source, id, recipients = "self"): void` uses the same audience rules as send.
`dismiss(source, id): void` always acts locally.
`list(): HUDNotice[]` returns copies; `expires` is a Unix timestamp in milliseconds, or zero. Native attack notices and legacy world-setting messages are not part of this list.
`version` is 1.

## Behavior and limits

- Messages are temporary client-session state; reloading clears them. There is no saved message history.
- At most 100 API messages are retained per client; inserting another drops the oldest.
- Expiry uses a one-shot timer, not polling.
- A disabled HUD stays disabled; a minimized HUD remains minimized and highlights its notification icon when messages exist.
- Implant ownership does not gate messages.
- Clear on one client leaves other recipients' copies intact.
- No arbitrary callbacks, macros, HTML, or actor changes execute through this API.
- The GM HUD Send HUD Message control adds messages rather than replacing the previous message. The old single-message setting is read only for compatibility with already-sent messages.

Browser fixtures verify message update, expiry, clearing, navigation, recipient filtering and the non-GM cross-client restriction. Live multi-client Foundry verification remains outstanding.
