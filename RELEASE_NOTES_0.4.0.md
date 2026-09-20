# Pneuma's Combat Tools 0.4.0

Adds reusable Instant Effects for grenade resolution and the Add effects picker. Core grenade/rocket ammunition receives type-specific handling and colors. Native resistance rolls, damage application and injury items are reused; grenade EMP retains the approved until-combat-ends duration. Smart rockets use their second-chance attack before scatter.

Smoke persists as scene-owned, animated affected-cell coverage with game-time expiry. Automatic smoke attack penalties remain deferred.

## Known issue

Residual smoke has been reported missing in a live Foundry scene. The server-served smoke implementation matches this build, but the cause has not been reproduced or fixed. Treat live smoke visibility as unverified.

## Validation

Typecheck and production build pass. 85 focused state/native-method tests and three browser fixtures passed during implementation. Live multiplayer and native scene smoke visibility remain unverified.

Pneuma's Combat Tools is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.
