# Project guidance

## Scope and approval

This project is currently in roadmap and design discussion. Do not implement features until the user explicitly authorizes implementation. Documentation edits requested by the user are allowed.

## Feature scope

- Combat Tools is not a character-sheet replacement and must not mimic Token Action HUD. Its purpose is combat workflows that cannot be completed within one character sheet alone.
- Before proposing or implementing a feature, identify what it adds through a target, another actor's response, or scene context. If it only exposes an existing sheet action in another menu, flag it as outside scope and recommend the native sheet or an existing module.
- Examples within scope include coordinating attacker and defender choices, target-aware resolution, and scene-based area effects. These examples are not authorization to implement them.
- Expose sheet actions only when necessary inputs to an approved broader workflow, reusing native behavior. A weapon choice for attacking a specific target can qualify; a general weapon, skill, inventory, reload, or character-management toolbar does not.
- Keep HUD usability work proportionate to supporting these workflows. Push back on scope growth and redundant controls before adding code.

## Design principles

- This is a game aid, not a security system. Hiding attack results from ordinary chat and dice displays until the defender chooses is sufficient. Do not add client-data secrecy, anti-cheat architecture, or a security protocol merely because a player could inspect data sent to their client.
- Preserve as much native Foundry and Cyberpunk RED system functionality as possible. Prefer native roll calculation and workflows, with small integrations for the requested behavior.
- For evasion, prefer allowing the native attack roll to happen, hiding its displayed result until the defender chooses, using native Evasion rolls, then displaying the combined resolution. Do not introduce a delayed-roll queue merely to keep the attack result out of client data. Inspect the system's actual hooks and publication path before choosing an implementation.
- Keep features small, direct, and readable. Avoid speculative abstractions, custom frameworks, and unnecessary dependencies.
- Favor current-state actions: inspect the current tokens, equipment, targets, and conditions. Do not add historical bookkeeping, recovery systems, rollback workflows, or persistent state unless a concrete feature requires them.
- Keep necessary operational checks, such as actor permissions, valid targets, and preventing duplicate application. The preference for simplicity does not mean removing these checks.
- Before every new element, control, or feature, inspect the relevant Foundry v12 and Cyberpunk RED APIs, templates, styles, and workflow. Present native reuse options to the user before proposing custom implementation. Verify against the actual version; do not assume a generic API replaces system behavior.
- Use native controls, compact menus, and minimal custom styling. Prefer the actual Token HUD and its control markup so system and module themes targeting #token-hud apply. Preserve the configured HUD class and native owned-token controls; do not copy theme colors or dimensions into module CSS.
- Add complexity only for a concrete requirement or demonstrated problem. Review scope and code growth before expanding a feature.

## Language and tooling

Use strict TypeScript for module source under `src/`, matching the other Pneuma modules. Use the Foundry v12 type definitions, pnpm, and the compiler-based build. Do not revert runtime source to JavaScript or edit generated files in `dist/`. JavaScript build scripts may remain in `scripts/`.

## Build layout

Write runtime module files directly into `dist/`; do not nest them under a module-named subfolder. Package the contents of `dist/` at the ZIP root. The installed module folder remains `pneuma-combattools`.

## Communication

Be factual and concise. Never imply personal firsthand experience or anthropomorphize yourself. Do not add color commentary.

## Feature inventory

Keep IMPLEMENTED_FEATURES.md updated whenever a feature or small convenience option is added, changed, or removed. Distinguish working behavior from visible placeholders and deferred designs; do not imply live verification from build or automated checks alone.

## Card styling contract

Whenever adding or changing a Combat Tools card design, update docs/chat-card-styling.md in the same change. Document its root scope, sections, state selectors, native classes retained, controls, visibility constraints and an example selector. Keep examples aligned with emitted markup; flag selector removals or renames explicitly. Keep IMPLEMENTED_FEATURES.md aligned and verify relevant rendering/state transitions. This documentation describes Combat Tools itself.

## Master roadmap

Keep BACKLOG.md as the master feature roadmap. Preserve original user-requested features when they are implemented, deferred, revised or moved; record status and superseding decisions instead of silently removing them. Keep unspecified requirements explicitly open. A conversation acknowledgment is not a substitute for updating the roadmap when documentation is authorized.
