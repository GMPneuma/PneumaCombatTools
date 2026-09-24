# Hover EKG

Hover over a visible token to show its EKG below the token/nameplate. It reuses the Biomonitor waveform, colors and animation speed for normal, wounded, seriously wounded, critical and flatline states. Unknown HP shows an unanimated line. Numeric HP is not displayed.

The EKG is visible only when:

- The viewer has one owned Medtech character selected; or, with no token selected, their assigned character is a Medtech.
- The hovered target has an installed Biomonitor; anyone may view its EKG.
- **Always show EKG** is enabled by the GM under **Configure Settings → Combat Tools → Token HUD & Targeting**. This world setting defaults off and allows all viewers to see hovered EKGs.

Medtech requires a native role item with positive rank, identified by its Medtech name, role name or native compendium source. Selecting a non-Medtech does not borrow the assigned character role. GMs follow the same Medtech, target Biomonitor or world override rule.

This feature is independent of the hover-DV toggle, weapon selection, combat state. It respects native token visibility and does not expose hidden tokens. The display disappears on hover exit, scene teardown, token deletion or browser blur. HP, role and hovered-target Biomonitor installation/removal changes refresh it. Pan/zoom repositions the panel while the animation remains stable when the health state is unchanged.

Styling: `.pneuma-hover-ekg` contains `.pneuma-eye-vitals[data-state]` and the shared `.pneuma-eye-ekg` SVG/trace classes. It is a noninteractive 140×40px overlay. Existing Biomonitor selectors, pause controls and HP display behavior are retained; shared trace/color selectors also scope to the hover panel. Example: `.pneuma-hover-ekg .pneuma-eye-trace-glow { opacity: 1; }`.

Browser fixtures cover role/setting gates, health states, placement, hidden tokens, selection changes, hover cleanup and stable animation. Existing Biomonitor browser checks also pass. Live Foundry multiplayer verification remains outstanding.
