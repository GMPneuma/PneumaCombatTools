# Source Register

## Review baseline

- Review date: **2026-09-26**.
- Repository: **PneumaCombatTools**, local working tree.
- Manifest version: **0.9.0**; Foundry minimum/maximum **12**, verified **12.343**.
- Base commit at inspection: `eb452e2964dc42a871bcf2f8f4b7307672f48947`.
- The working tree already contained uncommitted source and documentation changes. This commit identifies the base, not a reproducible commit containing every behavior described here.
- These guides document the current source and its stated contracts, including post-release changes. They do not establish the installed world's version or claim live multiplayer verification.

## Source map

Paths below are relative to the Combat Tools repository. They are provenance references, not Obsidian note links.

| Notes/topics | Principal source |
| --- | --- |
| Install and requirements | `module.json`, `README.md`, `src/scripts/native-wrappers.ts`. |
| Players and GM | `docs/player-guide.md`, `docs/gm-guide.md`, `IMPLEMENTED_FEATURES.md`, plus specialized sources below. |
| Attacks, ammo and damage | `docs/combat-resolution.md`; `src/scripts/combat-resolution.ts`, `damage-flow.ts`, `native-combat.ts`, `ammo-chat.ts`, `bow-loading.ts`. |
| Evasion | `docs/evasion-rules.md`; `src/scripts/evasion-settings.ts`, `evasion-rules.ts`. |
| Area attacks and smoke | `docs/area-attacks.md`; `src/scripts/aoe/settings.ts`, `workflow.ts`, `smoke.ts`, `smoke-obscuration.ts`. |
| Grappling | `docs/grappling.md`; `src/scripts/grapple/workflow.ts`, `state.ts`, `rules.ts`. |
| QuickHack | `docs/quickhack.md`; `src/scripts/quickhack/settings.ts`, `integration.ts`, `workflow.ts`, `connections.ts`. |
| EMP | `docs/emp.md`; `src/scripts/emp.ts`, `emp-state.ts`, `emp-settings.ts`. |
| Injuries and lifetimes | `docs/instant-effects.md`, `docs/native-effects.md`, `docs/movement.md`; `src/scripts/instant-catalog.ts`, `instant-effects.ts`, `instant-lifetime.ts`, `wake.ts`. |
| Encounters | `docs/encounters.md`; `src/scripts/encounter.ts`. |
| Movement and combat bar | `docs/combat-bar.md`, `docs/movement.md`; `src/scripts/combat-bar-state.ts`, `movement.ts`. |
| Biomonitor and EKG | `docs/cybereye-hud.md`, `docs/hover-ekg.md`; `src/scripts/eye-hud.ts`, `biomonitor.ts`, `ekg-hover.ts`. |
| Turn indicators | `src/scripts/turn-marker.ts`, `turn-marker-profile.ts`, `turn-marker-settings.ts`, `turn-marker-art.ts`. |
| Settings layout | `src/scripts/display-settings.ts`, `settings-layout.ts`, specialized registration files. |
| Manual rolls | `docs/manual-rolls.md`; `src/scripts/manual-rolls.ts`, `manual-roll-state.ts`. |
| Public APIs and integration | `docs/hud-api.md`, `docs/item-markers.md`; `src/scripts/hud-messages.ts`, `eye-hud.ts`, `instant-effects.ts`, `item-markers.ts`, `quickhack/integration.ts`. |
| Diagrams and recovery | `docs/flow-map.md`, `docs/chat-card-audit-2026-09-26.md`, specialized guides. |

## Corrections made when consolidating older guides

- The manifest says 0.9.0 while some older guides still say 0.8.0/0.8.1 and the root README originally said 0.8.6. These handbook notes use the explicit working-tree baseline instead.
- Current encounter selection uses the active started scene encounter, not whichever tracker the GM is viewing.
- Smoke obscuration is implemented in the current source; older instant-effect prose saying it is unimplemented is outdated.
- Current display settings use Configure forms for Combat Bar, Biomonitor and Token HUD.
- Current turn indicators include player defaults, shared personal inheritance, token overrides and revised artwork. Older appended inventory entries describe superseded designs.
- Cover Up is a no-roll alternative and does not require Evasion eligibility.
- Outside-combat Jack-In/Force Out can be manual roll/chat-only; tracked QuickHack and EMP disablement have encounter requirements.

## Verification scope

Guide links, Markdown fences, Mermaid parsing/rendering and macro JavaScript syntax are checked as documentation artifacts. Macro game effects, private roll visibility, sockets, multiplayer ownership, live scene geometry and installed-world compatibility still require Foundry testing. No gameplay source changes are part of this documentation task.

The project handbook uses standard relative Markdown links. The Obsidian copy uses wiki links to the same uniquely named notes. Both source registers retain repository-relative source paths for provenance.

Related: [Combat Tools Documentation](Combat%20Tools%20Documentation.md), [Combat Tools - Troubleshooting](Combat%20Tools%20-%20Troubleshooting.md).
