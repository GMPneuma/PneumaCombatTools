# Native effects and lifetimes

Combat Tools uses native status IDs and effective Active Effects for ongoing conditions. Actor and item effects respect disabled/suppressed state. Native injury items remain the source of injury modifiers.

- Fire: native Mild, Strong and Deadly statuses are recognized regardless of which tool applied them. Highest active severity applies once per ended turn; Ignite does not add another fire instance. Extinguish removes actor fire effects or disables item-owned ones. The persisted last-burn turn is duplicate bookkeeping, not a condition identity.
- Sleep: native Unconscious status with the source name Sleep distinguishes sleeping from unconsciousness due to another cause. Damage or the touching Action clears Sleep and leaves Prone. Existing permanent unconsciousness is preserved.
- Temporary eye/ear injuries: native injury item plus its status marker. Marker origin links the item; marker duration controls expiry. A pre-existing permanent injury is not converted into a temporary one.
- Native drugs: activation through Combat Tools resets an existing declared duration using the common clock. No duration is invented when the source supplies none. Expiry disables item effects rather than deleting medication inventory.

## Clock and combat end

A minute applied during combat is 20 rounds at 3 seconds per round, ending at the same turn index twenty rounds later. Native duration stores rounds, combat ID, start round/turn and start time; seconds is null so Foundry v12 cannot silently prefer its seconds clock. Outside combat, seconds/startTime are used. Combat updates enforce expiry even when the system world-time advance differs.

At combat end/reset or deletion, timed effects on participants and effects explicitly linked to that combat clear, including manually applied effects. Item-owned effects are disabled. Critical injury items and their linked effects are excluded from combat-end cleanup. Effects linked to another combat and non-timed persistent conditions remain untouched. EMP retains its separately approved combat-end restoration. Combat-created smoke also clears at combat end.

Previously saved instantLifetime effects are adopted into native duration/status data on ready/canvas load. Legacy reads remain as compatibility fallback if a source marker cannot be resolved.

## Exposure/application integration

Successful Combat Tools poison/biotoxin applications broadcast an exposure report to clients; each HUD retains its normal actor visibility rules. This is a report, not a fabricated lasting Poison effect. Repeat hits can replay the warning; the Vitals report clears at round end.

Native roll cards preserve original ammunition type as source metadata. Wrappers reuse CPR damage selection/dialog/application: context is held per dialog across awaits, including multi-target and Ctrl-skip application. Confirmed native damage results drive poison/biotoxin reports; incendiary requires native armor penetration. Cancelled dialogs, blocked damage and mere rolls do not announce an exposure. Combat Tools damage cards preserve the same original ammunition context.

Source metadata and per-turn duplicate protection remain necessary; native status IDs do not encode which ammunition produced an HP loss. Arbitrary macros that only subtract HP still need explicit integration. Old native cards created before ammo metadata was recorded cannot reconstruct their source safely.

The native dialog regression also runs against the cached CPR damageApplication implementation, and damage-flow checks exercise the cached native actor damage method. Automated verification covers native-status fire, duplicate turns, suppression, temporary/permanent injuries, Sleep, twenty-round boundaries, manual timed-effect combat cleanup, smoke, native dialog concurrency, multiple recipients, cancellation and armor penetration. Live multiplayer Foundry verification is separate.
