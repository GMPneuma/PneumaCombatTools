# Project guidance

## Scope and approval

This project is currently in roadmap and design discussion. Do not implement features until the user explicitly authorizes implementation. Documentation edits requested by the user are allowed.

## Design principles

- This is a game aid, not a security system. Hiding attack results from ordinary chat and dice displays until the defender chooses is sufficient. Do not add client-data secrecy, anti-cheat architecture, or a security protocol merely because a player could inspect data sent to their client.
- Preserve as much native Foundry and Cyberpunk RED system functionality as possible. Prefer native roll calculation and workflows, with small integrations for the requested behavior.
- For evasion, prefer allowing the native attack roll to happen, hiding its displayed result until the defender chooses, using native Evasion rolls, then displaying the combined resolution. Do not introduce a delayed-roll queue merely to keep the attack result out of client data. Inspect the system's actual hooks and publication path before choosing an implementation.
- Keep features small, direct, and readable. Avoid speculative abstractions, custom frameworks, and unnecessary dependencies.
- Favor current-state actions: inspect the current tokens, equipment, targets, and conditions. Do not add historical bookkeeping, recovery systems, rollback workflows, or persistent state unless a concrete feature requires them.
- Keep necessary operational checks, such as actor permissions, valid targets, and preventing duplicate application. The preference for simplicity does not mean removing these checks.
- Use native controls, compact menus, and minimal custom styling. Visual polish should not require a large custom UI layer.
- Add complexity only for a concrete requirement or demonstrated problem. Review scope and code growth before expanding a feature.

## Language and tooling

Use strict TypeScript for module source under `src/`, matching the other Pneuma modules. Use the Foundry v12 type definitions, pnpm, and the compiler-based build. Do not revert runtime source to JavaScript or edit generated files in `dist/`. JavaScript build scripts may remain in `scripts/`.

## Build layout

Write runtime module files directly into `dist/`; do not nest them under a module-named subfolder. Package the contents of `dist/` at the ZIP root. The installed module folder remains `pneuma-combattools`.

## Communication

Be factual and concise. Never imply personal firsthand experience or anthropomorphize yourself. Do not add color commentary.
