# Item markers

Visual annotations on native Item documents. No mechanical disabling, renaming, combat expiry, automatic removal, or cleanup runs.

Markers persist in flags.pneuma-combattools.itemMarkers, keyed by a stable caller-owned identifier. Reads use the existing in-memory Item document; no combat scans, UUID resolution, or network requests. Foundry synchronizes writes and refreshes actor sheets. The open CTH refreshes on marker updates.

## API (available after init)

```js
const markers = game.modules.get("pneuma-combattools").api.itemMarkers;
const item = actor.items.get(itemId);
await markers.set(item, "used", markers.presets.used);
await markers.set(item, "emp-disabled", {
  label: "Disabled", description: "EMP hit"
});
markers.get(item);
await markers.clear(item, "emp-disabled");
```

Keys accept lowercase letters, digits, underscores and hyphens, start with a letter, and have at most 64 characters. Use distinct keys for independently clearable sources. Labels are plain text, at most 80 characters; descriptions at most 500. Item ownership or GM permission is required to write. Writes target one key so other markers survive. Repeating an identical set is a no-op.

For other module UIs, call markers.render(nameElement, item), or markers.decorate(containerElement, actor) for supported item-name markup. The renderer is idempotent and uses textContent. It does not modify the Item name.

## Included displays

Native CPR actor-sheet item-name/weapon-name fields, mook cyberware name links, and CTH weapon buttons. Other modules must opt in using the API; this does not globally rewrite every item list or historical chat card.

Badges use .pneuma-item-markers and .pneuma-item-marker[data-item-marker="used"]. Colors inherit the surrounding theme. No native action handlers are replaced.

Thrown attack creation sets the used marker instead of renaming the source item. Existing literal "(used)" names are left intact. Disabled is a reusable visual preset; no new cyberware attack mechanic or manual marker-management window is included.

Expiry and combat association are deferred. Markers remain until explicitly cleared.
