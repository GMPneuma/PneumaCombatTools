---
aliases: [Combat Mermaids, Combat Tools Mermaid Diagrams]
tags: [foundry, combat-tools, mermaid]
---

# Combat Mermaids

Mermaid workflow diagrams for Obsidian Reading view. Each diagram shows decisions and handoffs; it does not imply every branch happens on every attack. See [Combat Tools Documentation](Combat%20Tools%20Documentation.md) for the full guide set.

## 1. Targeted attack and damage

```mermaid
flowchart TD
  A["Player selects acting token and target action"] --> B["Native CPR attack dialog and roll"]
  B --> C{"Defense decision required?"}
  C -->|Yes| D["Hold visible attack result"]
  D --> E["Defender chooses Evade or Don't Evade"]
  E --> F["Resolve native defense if chosen"]
  C -->|No| G["Resolve attack"]
  F --> G
  G --> H["Reveal combined result"]
  H --> I{"Damage allowed?"}
  I -->|Hit or explicit GM allowance| J["Roll damage"]
  I -->|No| K["No damage application"]
  J --> L["Confirm recipient and attached effects"]
  L --> M["Apply HP and armor changes"]
  M --> N["Resolve injuries and separate effects"]
  N --> O["Review receipts"]
```

Rolling and applying are separate. See [Combat Tools - Attacks and Damage](Combat%20Tools%20-%20Attacks%20and%20Damage.md).

## 2. Area attack and scatter

```mermaid
flowchart TD
  A["Choose grenade, rocket or shell"] --> B["Place valid visible aim area"]
  B --> C["Native attack and ammunition workflow"]
  C --> D{"Explosive miss?"}
  D -->|Yes| E["GM places actual landing point"]
  D -->|No| F["Review affected recipients"]
  E --> F
  F --> G["GM resolves cover, terrain and overrides"]
  G --> H["Each recipient resolves defense"]
  H --> I["Complete required escape relocation"]
  I --> J["Reveal result when waiting steps finish"]
  J --> K["Roll shared damage when applicable"]
  K --> L["Apply separately to intended recipients"]
  L --> M["Resolve each recipient's effects"]
  M --> N["Hide completed attack marker"]
```

Smoke has an independent template and lifetime. See [Combat Tools - Area Attacks and Suppressive Fire](Combat%20Tools%20-%20Area%20Attacks%20and%20Suppressive%20Fire.md).

## 3. Suppressive fire

```mermaid
flowchart LR
  A["Ten-round native Autofire attack"] --> B["Determine affected targets"]
  B --> C["Each target rolls Concentration"]
  C --> D{"Resists, including tie?"}
  D -->|Yes| E["No failed-suppression obligation"]
  D -->|No| F["Record seek-cover obligation"]
  F --> G["Table adjudicates Move, Run and cover"]
```

The module does not choose physical cover or spend the target's Actions.

## 4. Grapple lifecycle

```mermaid
flowchart TD
  A["Grab and confirm free hand"] --> B["Opposed native Brawling"]
  B --> C{"Attacker wins?"}
  C -->|No or tie| D["No hold established"]
  C -->|Yes| E{"Choose result"}
  E -->|Take Held Object| F["Transfer item manually"]
  E -->|Hold Target| G["Managed grapple active"]
  G --> H["Choke when timing permits"]
  H --> G
  G --> I["Throw: BODY damage and Prone"]
  G --> J["Release or GM End"]
  G --> K["Escape or third-party Break contest"]
  K -->|Fails| G
  K -->|Succeeds| L["End relationship"]
  I --> L
  J --> L
  L --> M["Remove managed penalties and restore scale"]
```

Ending a hold does not undo prior damage. See [Combat Tools - Grappling](Combat%20Tools%20-%20Grappling.md).

## 5. QuickHack connection

```mermaid
flowchart TD
  A["Runner and target in active started encounter"] --> B["Jack In and resolve detection"]
  B --> C["Tracked connection"]
  C --> D["Choose available hack in range and sight"]
  D --> E["Native Interface versus hack DV"]
  E -->|Success| F["Apply supported effect or follow guidance"]
  E -->|Failure| C
  F --> C
  C --> G["Voluntary Jack Out"]
  G --> H["Disconnected; fresh Jack In allowed"]
  C --> I["Detected target requests Force Out"]
  I --> J["Concentration versus Interface"]
  J -->|Target wins| K["Ejected; re-Jack-In blocked this encounter"]
  J -->|Runner wins or tie| C
```

Outside combat, Jack-In/Force Out can be manual roll/chat-only. See [Combat Tools - QuickHack and Netrunning](Combat%20Tools%20-%20QuickHack%20and%20Netrunning.md).

## 6. EMP and overlapping disablement

```mermaid
flowchart TD
  A["Supported EMP or QuickHack source"] --> B["Resolve resistance if required"]
  B --> C{"Disablement applies?"}
  C -->|No| D["Resisted or unaffected"]
  C -->|Yes| E["Save request policy and eligible selection"]
  E --> F["Chooser or random result"]
  F --> G["Apply saved item causes and consequences"]
  G --> H["Timer or originating encounter ends"]
  H --> I["Remove that cause"]
  I --> J{"Another disablement cause remains?"}
  J -->|Yes| K["Item stays disabled"]
  J -->|No| L["Restore subject to original native state"]
```

Generic item badges do not create disablement. See [Combat Tools - EMP and Cyberware](Combat%20Tools%20-%20EMP%20and%20Cyberware.md).

## 7. Movement injury reminder

```mermaid
flowchart TD
  A["Accepted movement in supported encounter"] --> B["Update distance and start marker"]
  B --> C{"Relevant injury and over 4 m/yd on foot?"}
  C -->|No| D["Continue tracking"]
  C -->|Yes| E["Create injury damage reminder"]
  E --> F{"Still eligible at application?"}
  F -->|Yes| G["Owner or GM applies 5 damage at proper time"]
  F -->|No| H["Withdraw pending eligibility"]
  G --> I["Save receipt"]
```

Reset is not damage undo. See [Combat Tools - Combat Bar and Movement](Combat%20Tools%20-%20Combat%20Bar%20and%20Movement.md).

## 8. Group check

```mermaid
flowchart TD
  A["GM chooses skill, players and optional DV"] --> B["Shared request rows"]
  B --> C["Player clicks Roll"]
  C --> D["Native skill dialog"]
  D --> E["Save inline total"]
  E --> F{"DV configured?"}
  F -->|Yes| G["Success only when total exceeds DV"]
  F -->|No| H["Display total without automatic outcome"]
  G --> I["Table applies consequences"]
  H --> I
  E --> J["Click total for native details"]
```

See [Combat Tools - Manual Rolls and Group Checks](Combat%20Tools%20-%20Manual%20Rolls%20and%20Group%20Checks.md).

## 9. Saved encounter context

```mermaid
flowchart TD
  A["Start action in scene"] --> B{"Unique active started encounter?"}
  B -->|Yes| C["Validate exact required tokens"]
  B -->|Several| D["Stop for GM correction"]
  B -->|None| E{"Workflow allows outside combat?"}
  E -->|No| F["Start appropriate encounter first"]
  E -->|Yes| G["Save outside-combat context"]
  C --> H["Save encounter, scene, generation and participants"]
  H --> I["Later response validates original context"]
  I -->|Valid| J["Continue original action"]
  I -->|Ended, reset or invalid| K["Reject stale response; start new action"]
```

Viewing another tracker does not retarget a saved action. See [Combat Tools - Encounters and Outside Combat](Combat%20Tools%20-%20Encounters%20and%20Outside%20Combat.md).

## 10. HUD message delivery

```mermaid
flowchart TD
  A["Caller uses HUD API"] --> B{"Audience"}
  B -->|Self| C["Local client"]
  B -->|Connected recipients, GM only| D["Module socket delivery"]
  D --> C
  C --> E{"Mode"}
  E -->|Flash| F["Four-second center message"]
  E -->|Timed| G["HUD row until expiry or removal"]
  E -->|Queued| H["HUD row until dismissal or removal"]
  F --> I["Removed"]
  G --> I
  H --> I
  C --> J["Client reload clears session queue"]
```

No saved history or offline replay. See [Combat Tools - Macros and API](Combat%20Tools%20-%20Macros%20and%20API.md).

---
Documentation baseline: [Combat Tools - Source Register](Combat%20Tools%20-%20Source%20Register.md). Return to [Combat Tools Documentation](Combat%20Tools%20Documentation.md).
