# Chat button skin contract

Current implementation: Combat Tools 0.9.0 plus local changes; source-reviewed 2026-09-26.

Scope: Combat Tools buttons inside chat messages, plus its Interact With Armor and Half Armor SP buttons on native damage cards. HUDs, dialogs, flyouts, native roll expansion/undo links and other modules are not restyled.

## Shared selectors

- `.pneuma-chat-button`: shared appearance and stable geometry; workflow action selectors remain intact.
- `[data-chat-kind="action|toggle|recovery|cancel"]`: semantic variant.
- `[data-chat-role="gm"]`: GM-only/override presentation; red badge/outline, normal background and black text; charcoal/light text on enabled hover or keyboard focus. This is independent of action/recovery/cancel kind.
- `.pneuma-chat-icon`: square compact action or effect slot.
- `[aria-pressed="true"]`: selected toggle, solid fill and checked box; false has an empty box.
- `:disabled`, `[aria-disabled="true"]`: unavailable. Existing workflow logic owns permissions and disabling.
- `.pneuma-chat-busy[aria-busy="true"]`: spinner over the original control footprint while its request disables it.
- `.pneuma-chat-complete`: completed existing one-time applications; checkmark, no new action.
- `:focus-visible`: external focus outline; hover uses an inset outline. Neither affects layout.

The shared decorator handles async controls and rerenders without replacing buttons or their event handlers. It never changes enabled state, ownership, rolls or damage. Classification uses existing action attributes and English module recovery labels. An unfamiliar/localized action still receives the standard neutral style.

## Skin variables

Defaults are centralized in the `Shared chat-button skin tokens` section of `src/styles/pneuma-combattools.css`. Set variables on `:root`, a chat container, or a specific `.pneuma-chat-button` variant. Variables, rather than geometry selector overrides, are the supported reskin interface.

All button variables use the prefix `--pneuma-chat-button-`:

| Suffix | Purpose |
| --- | --- |
| background, color, border | Neutral appearance (inherits Foundry theme values where available) |
| hover-background, hover-color, hover-shadow | Hover appearance, with no selected-state imitation |
| selected, selected-color, selected-border | Active toggle fill, text and border (charcoal, white and red by default) |
| recovery-border, cancel-border | GM recovery and cancellation emphasis |
| gm-background, gm-color, gm-border | GM neutral appearance; border token also colors the badge |
| gm-hover-background, gm-hover-color | GM hover/focus appearance |
| icon-background, icon-color, icon-border | Dark effect-icon wells |
| height, font-size, font-weight, font-family, line-height | Shared sizing and typography |
| padding, margin, gap, border-width, radius | Shared spacing and shape |
| focus, focus-width, focus-offset | Keyboard focus outline |
| disabled-opacity, complete-opacity | Inactive states |
| state-icon-size | Checkbox and action icon width |
| spinner-size, spinner-width, spinner-track, spinner-color | Busy indicator |
| transition-time | Color/outline transition duration |

`--pneuma-chat-success` and `--pneuma-chat-failure` control group/STAT outcome colors. Existing `--pneuma-status-background` and `--pneuma-status-border` overrides remain supported for effect artwork.

```css
:root {
  --pneuma-chat-button-background: #202a30;
  --pneuma-chat-button-color: #eef7fa;
  --pneuma-chat-button-border: #6d858e;
  --pneuma-chat-button-hover-background: #30434d;
  --pneuma-chat-button-hover-color: #ffffff;
  --pneuma-chat-button-selected: #197786;
  --pneuma-chat-button-selected-color: #ffffff;
  --pneuma-chat-button-height: 30px;
  --pneuma-chat-button-radius: 4px;
}
```

Keep sizing variables constant between hover/focus/selected states. Shared metric rules use `!important` to counter ordinary theme hover rules that change padding, font weight, border width or transform. Colors, inset shadows and external focus outlines carry state changes without moving neighboring controls. Deliberately overriding these rules with stronger `!important` declarations or changing metric variables on hover can defeat that guarantee.

Validation: browser fixtures cover every managed chat-control family, delayed insertion, off/on/busy/completed states, unchanged native controls, skin token overrides, and exact bounding-box equality during hover/focus/toggle/busy transitions. Live Foundry theme combinations remain to be verified.

Implementation: [chat-buttons.ts](../src/scripts/chat-buttons.ts) and [module CSS](../src/styles/pneuma-combattools.css).
