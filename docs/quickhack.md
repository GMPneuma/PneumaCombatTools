# QuickHack

- **CTH menu presentation and Jack In/Out:** grenade and QuickHack rows display item artwork and align left. QuickHacks prefer actor item artwork, then world item artwork, then the bundled icon. Menu headers inherit the corresponding CTH control's current colors. The QuickHack header reads **Jacked-In**, **Not Jacked-In**, or **Ejected**. **Jack In/Out** voluntarily disconnects an active link without a roll, even after losing line of sight. The existing GM coordinator validates ownership and connection identity. Voluntary disconnection permits fresh Jack-In; forced ejection still blocks reconnection for that encounter. Old awareness cards cannot operate on a disconnected or replacement connection. Grenade resolution remains a placeholder.

- **Detected Netrunner ejection from CTH:** an owned token with detected active incoming connections shows the QuickHack icon, with one **Eject NetRunner** row per connection. Uses the existing native Concentration versus Interface Force Out workflow; ties retain the connection. Ejection resolves in one card containing the native Concentration roll, player Netrunner Interface roll, totals and outcome, with shared winner/loser styling. NPC resistance retains its automatic Interface total. The card uses the awareness message's audience. Both the CTH row (including a single connection) and ejection card show the Netrunner name when the current identity setting for a detected Jack-In or later QuickHack permits it; otherwise they show Unknown Netrunner. Existing chat cards are not rewritten. No Netrunner role or launcher is required for ejection. Awareness uses retained Jack-In/QuickHack result cards for the current encounter; deleting those cards removes the associated shortcut. Undetected, ejected, other-encounter and untracked connections are excluded.

Jack-In and QuickHack combine the native Interface dice and outcome into one chat card with scoped QuickHack header, roll, result, effect and action containers. Result visibility governs the combined card. Private NPC dice remain a separate GM-only message when the result is shared with players. No existing chat messages are migrated.

Jack-In and QuickHack require wall-based line of sight from the attacker center to at least one of nine inset target points. QuickHack requires an active tracked connection. Losing sight blocks actions but never ejects the connection; restored sight permits actions again. Outside combat, Jack-In remains roll/chat-only and QuickHack is blocked because no connection is tracked. No migrations are added.

Content is organized under the Item directory: `CombatTools/Quickhacks` contains all eleven native program items; the QuickHack launcher weapon is directly in `CombatTools`. Drag the launcher onto an actor to use Jack In through its attack control and QuickHack Target through its damage control. Both are blocked when the master switch is off. Reload as GM with the standalone QuickHack module disabled to initialize missing this content. Legacy folders and retained gear stay in place; cleanup is deferred until at least v0.8.0.

Disable the standalone **Pneuma Quickhack** module before using Combat Tools QuickHack. If both are active, Combat Tools leaves its own QuickHack functions off and warns the GM to prevent duplicate handling. Its master switch cannot disable another module’s scripts.

## GM setup

**Enable QuickHack** is the master switch for this integration. Switching it off hides the target HUD control, blocks API actions, pending rolls, Force Out and effect requests, and removes QuickHack/native damage controls from its cards. Existing effects and recorded connections are retained; disabling is not an undo operation.

**QuickHack rules mode** has exactly three choices:

| Mode | Availability |
| --- | --- |
| RAW | All eleven reference QuickHacks; no launcher, owned item or loaded program requirement. |
| Must Buy QuickHack | A recognized corresponding gear/program item must exist in the acting character’s inventory. Names may be changed; identity uses flags. |
| Must Be Loaded in Equipped Cyberdeck | A corresponding program owned by that character must occur in an equipped Cyberdeck’s native `system.installedItems.list`. Merely owning/equipping the program is insufficient. REZ is not required. If multiple decks are equipped, a program in any equipped deck qualifies. |

The message settings form preserves all six prior options: detected NPC Jack-In audience, totals and attacker identity; NPC QuickHack audience and attacker identity; player-to-NPC Jack-In awareness audience. Configure these options directly in Combat Tools; old settings are not imported.

## Player workflow

Control one Netrunner token and right-click the intended target. Use **Quickhacks → Jack-In To Target**, then select a QuickHack. The captured source and target remain authoritative even if token selection changes during the native dialog. The range is the prior module’s 25 grid squares. A Netrunner target notices automatically; other targets oppose Interface with WILL. Ties favor detection. QuickHack checks must exceed the printed DV. Force Out uses native Concentration opposed by Interface; ties favor the Netrunner.

During a started active Combat, Jack-In records an attacker/target pair in `Combat.flags.pneuma-combattools.quickhackConnections`. Detection does not prevent establishing a connection. Each pair has its own state and originating Jack-In card. QuickHacks require that pair’s active connection. Successful Force Out marks it **ejected**, blocking QuickHacks and re-Jack-In to that target for the rest of that Combat, with no hour timer. Round changes, reloads and toggling the module feature do not clear it. A new Combat starts with no connections. Old cards cannot affect a different connection or Combat.

Outside started combat, Jack-In still creates the combined native Interface roll and opposed-WILL result card; it writes no connection state. QuickHack requires a tracked combat connection and is blocked outside combat. Force Out retains the untracked chat contest. Rules-mode ownership/loading checks still apply. Starting, ending or switching combat during an open roll cancels that pending action.

An active GM is required to record combat connections, resolve Force Out resistance, and apply automatic target effects. The HUD displays the current attacker/target connection state. The data are readable on the Combat document rather than hidden client storage.

## Content creation

The primary active GM creates missing world programs named `Quickhack: <name>` in `CombatTools/Quickhacks` and the launcher in `CombatTools`. Programs retain the native Booster class and one-slot size. Use CPR's native Cyberdeck installation controls.

Existing items are not renamed, moved, converted, marked or otherwise repaired. Actor and scene inventories are not scanned. Old settings are not migrated. Existing development content must be edited manually when needed. No legacy cleanup or migration code is included.

## Automation boundaries and compatibility

The rules, catalog, detection, message routing and effect behavior were inspected in `PneumaQuickHack/scripts/src`. Damaged Ear is imported without injury damage; System Reset adds native Unconscious/Prone statuses. Overheat produces a reusable GM damage card, and Synapse Burnout provides a native damage-card action. Armor is bypassed through CPR’s brain damage workflow and critical damage is suppressed, matching the reference implementation. Movement changes, cyberware choices, chipware ejection, Puppet/Lure decisions, duration expiry and restoration remain guided/manual, as in that module. Net Action spending, Neuroport inventory requirements and Self-ICE/Passwall automation remain outside the prior implementation. RAW selects the reference rules without inventory restrictions; it does not claim complete automation of those manual requirements.

Connection loss from movement, line of sight or death is not automatically tracked. Each execution rechecks current range and token validity. Sight is checked with Foundry’s native sight-wall collision backend; this does not simulate lighting, special senses or 3D elevation.

The manifest remains Foundry **v12** only. Native installation lists, program schemas and roll/card paths were checked against the local CPR Foundry-v12 source at `v0.88.1-1112-g4caab3a75`; its manifest contains a placeholder version, so this is source compatibility evidence, not a verified installed release. Foundry v13 and the separate v13 CPR checkout are not supported by this change. Native program models, roll methods, templates and compendium IDs remain version-sensitive.

Automated tests cover modes, connection/ejection enforcement, non-combat behavior, creation without rewriting existing content, and master-disable paths. They do not establish live Foundry multi-client operation.

QuickHack refreshes only its own cards when connection eligibility changes. Token HUD updates are batched and limited to its attacker/target and scene walls; self CTH is excluded. Ordinary rounds do not rebuild chat, and disabled QuickHack skips combat refresh work.
