# GM guide

[Feature overview](../IMPLEMENTED_FEATURES.md) · [All documentation](README.md)

## Set up the world

1. Install Combat Tools using the [manifest in the README](../README.md#install). Use Foundry **v12**, Cyberpunk RED Core and **libWrapper**.
2. Enable the module. Keep at least one active GM connected while players use shared attack, effect and movement workflows.
3. Disable **Condition Lab & Triggler** if using Combat Tools to manage the status list. Disable standalone **Pneuma Quickhack** before enabling the integrated QuickHack workflow.
4. Configure scenes in meters for RED range/DV tables. Movement counters require a square grid. Review walls and area placement with your actual scene.
5. Open **Configure Settings → Module Settings → Pneuma's Combat Tools** and choose the campaign options below.

After manually replacing installed module files, restart the Foundry server and reconnect all clients. A browser refresh alone may leave old messaging metadata loaded. Pneuma's Visual Tools is optional and provides separate chat-card styling.

## Choose campaign rules

| Area | Decisions |
| --- | --- |
| Combat and Evasion | Enable paired combat resolution; choose RAW, disabled ranged evasion or homebrew qualification/resource rules. Configure attack-name visibility. |
| Area attacks | Choose attack shapes, area Evasion eligibility, optional MOVE costs/borrowing and optional Cover Up. |
| Critical injuries | Choose which attack methods can offer critical injuries. Injury application remains a separate card action. |
| QuickHack | Enable the integration, choose program availability rules and configure detection/result audiences. |
| Status effects | Review the grouped picker and custom statuses. Native injury bindings affect actual injury items. |
| HUD and presentation | Set shared appearance options and explain each player's HUD, sizing and animation preferences. |

QuickHack modes are **RAW**, **Must Buy QuickHack**, and **Must Be Loaded in Equipped Cyberdeck**. The mode determines which hacks can be used; it does not remove connection or line-of-sight requirements. See [QuickHack](quickhack.md) for setup and native inventory details.

## Combat bar and movement permissions

The [combat bar](combat-bar.md) sits above Players and uses square actor portraits. Outside combat it lists scene tokens owned by connected players. During combat it follows native initiative order. Entries follow native tracker visibility, including ownership exceptions; token line of sight does not filter the list. GM hover shows all native token status icons, and right-click opens the native combatant buttons. Players have End Turn beside their current character, with requests handled by an active GM.

Use the up/down controls for previous/next turn, or End Turn beside the current participant. The bottom buttons set a shared movement mode: **Default**, **No Movement**, **Combat Move**, or **Free-Move**. No Movement also blocks players outside combat and remains selected after combat ends. Combat Move allows only the token whose turn it is; GM movement remains unrestricted. Configure **Combat bar: movement for new combats** to select the mode applied when an encounter starts.

## Run an encounter

Add participants to the intended combat and start it before relying on round-based mechanics. Homebrew evasion tracking, movement counters, tracked QuickHack connections and EMP require an active encounter. If multiple encounters exist, select the intended one.

Players resolve attacks from target HUDs and respond on chat cards. GMs can handle NPC responses. On a hit, roll damage, apply it to the intended recipient, and resolve any offered critical injury or instant effect. These are separate steps; a visible roll is not proof that damage or an injury was applied.

For area attacks, review the recipient list and landing point. Use GM add/exclude/affected controls for cover, large tokens, mounted characters or wall edge cases. Scatter is GM-placed when requested. Cover destruction remains manual. Suppressive Fire uses Concentration rather than Evasion.

An unaware defender can be marked in the attack dialog to skip the defense choice. Dismembered Leg and disabled installed Cyberlegs prevent Evasion; they do not prevent resistance checks, Concentration or Cover Up.

## Resolve effects and injuries

**Instant Effects** provide reusable resolution for supported grenade ammunition and ad-hoc additions. Use the prompted native resistance check, then apply or mark the target unaffected as appropriate. Biological eligibility and immunity remain GM decisions. Avoid manually adding a duplicate of an effect already produced by ammunition.

EMP's grenade effect prompts Cybertech resistance and, on failure, creates a two-item selection. Disabled gear is shown in Implant Integrity and restores when combat ends. The current EMP workflow deliberately uses combat-end duration; see [EMP](emp.md).

Native critical-injury items supply their own modifiers. Status markers synchronize with those items without adding duplicate modifiers. Removing an injury marker can remove the injury item. Treatment and recovery decisions remain with the GM.

Broken Ribs creates one reminder per affected combatant turn when tracked on-foot movement exceeds 4m/yd. Owners and GMs receive **Apply 5 damage** for the end-turn damage. Application is manual and bypasses armor. Normal drags are treated as on-foot movement; decide whether the reminder applies to vehicles, teleportation or other unusual movement. Carried movement and next-turn MOVE debt do not count as walking.

## Timing and combat end

Numeric one-minute effect durations become **20 rounds**, at three seconds per round. Expiry uses the application turn within the final round. Outside combat, supported numeric durations use game time.

Ending combat clears applicable time-limited effects, including manually applied ones. Permanent critical injuries remain. Temporary Flashbang/Teargas injuries are managed separately and can expire without removing pre-existing permanent injuries. Sleep may end through damage or the touching Action; waking does not remove Prone.

Native fire statuses deal their applicable nonstacking damage at turn end. Extinguishing or clearing the effect stops further ticks. There is no general out-of-combat fire-damage clock.

**Native drug effects with empty duration fields do not receive a timer inferred from descriptive text.** Track those doses manually. See [Native effects and lifetimes](native-effects.md) and the [status mechanics audit](status-mechanics-audit.md).

## HUD sharing and private messages

Players do not need a Biomonitor to see their own HUD. An installed Biomonitor enables other viewers to inspect that visible character's stats by hovering the token. The viewed character's name and HUD edge distinguish the shared view.

Notifications remain private to the viewer even while another character's stats are displayed. Use **Send HUD Message** to select recipients and duration. Each player can disable scanline animations. [HUD guide](cybereye-hud.md)

## Automation boundaries

- A status icon does not imply complete rules automation. Some native effects supply modifiers; others are markers or reminders. Consult the audit before relying on a specific injury or drug.
- No universal Action budget or complete Run enforcement is provided. Treatment, addiction transitions, conditional senses/limb rules and several injury consequences remain manual.
- Smoke has a persistent visual implementation, but a reported missing residual effect still needs live confirmation. Smoke attack penalties are deferred.
- QuickHack currently concerns character connections, not NET Architecture connections.
- Custom macros that only subtract HP cannot identify their ammunition source automatically. Native ammunition integration needs supported source metadata; old cards may lack it.
- Undoing native weapon damage does not necessarily undo a separately applied instant effect, direct-HP effect or smoke area.

## Troubleshooting and verification

For missing shared responses, check active GM presence, ownership and socket/restart messages. For missing HUD lights, check active effects: simply owning a drug does not activate it. For missing attack entries, check equipped/installed state and supported firing mode. For an interrupted application, review current HP/effects before using the card's recovery controls.

The 0.5.0 release passed 255 automated tests, including browser fixtures. Verify your world's player/GM clients, scene walls, vision, active modules and private-card visibility in Foundry; those live conditions are not established by the automated suite.
