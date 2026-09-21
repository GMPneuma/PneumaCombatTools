# Grappling

Select your acting token and open Close Combat on a target within 2 m/yd reach. Choose **Grab**, confirm a free hand, and use the native Brawling dialog. The target's owner or a GM clicks **Roll Brawling** on the card. Both use DEX + Brawling + 1d10 with native modifiers; ties favor the responding character.

After winning, choose **Hold Target** or **Take Held Object**. Taking an object means one item actually held in the target's hands; move it between inventories manually. It does not establish a grapple.

## Active grapple

Both actors receive Grappled and -2 to all Actions. The attacker reserves the grabbing hand. Neither participant can use a two-handed weapon, regardless of extra arms. Combat Tools disables these attacks; native sheet actions remain under player/GM control. There is one tracked grapple per character. Existing manually applied Grappled effects are preserved and an existing -2 native Grappled modifier is not duplicated.

The attacker uses the active card or Close Combat for **Choke**, **Throw** or **Release**. The defender uses **Escape**. Another character targets the grappler and chooses **Break Grapple**. Escape and Break oppose the grappler's Brawling; success ends the original grapple for both participants. The -2 modifiers remain during that opposed roll.

Grab, Escape, Break Grapple, Choke and Throw cost an Action. Release costs no Action. The module does not maintain a general Action budget or enforce turn ownership. A free hand is confirmed manually. Choke is limited to one tracked application per combat round.

The defender cannot use Move Action. On Hold Target, its token texture scale becomes 0.8 (mirroring is preserved), and each movement places it at the grappler’s previous position and elevation. A multi-square move uses the starting square, without calculating an intermediate path. An active GM coordinates the native token updates. Player movement of the defender is blocked; GM corrections remain available. Ending the grapple restores the original texture scale and stops following. Token footprint, movement allowance and pathfinding are unchanged; separate collision routing for the held token is not performed.

## Choke and Throw

Both deal the attacker's current prepared BODY directly to HP, bypassing armor and leaving SP unchanged. Neither requires a new attack roll.

Choke follows the supplied text exactly: starting HP must be greater than 1 and resulting HP strictly below 0 for the target to be left at 1 HP and Unconscious. Exactly 0 HP does not trigger this clause. Choking the same target in three successive rounds applies Unconscious regardless of remaining HP. Missing a full round resets the sequence. Moving the counter backward does not permit another Choke in an already used round.

Throw applies Prone and ends the grapple. Its damage has no Choke HP safeguard. The target must use Get Up before using Move Action; the module does not automate Get Up.

## HUD and encounter state

In the HUD's yellow situational indicators: **Grappling: name** / **Grappled by: name**, plus **Choking: name — 1/3** / **Being choked by: name — 1/3**. These combat rows do not require a Biomonitor and respect the Status HUD visibility/minimize settings. The sequence remains visible in the next round while a consecutive Choke is still possible, then clears after a missed round. Grapple status remains until release, escape, throw or GM termination.

For a Grab begun with both tokens participating in a started encounter, the canonical record lives on that **Combat document**, in flags.pneuma-combattools.grapples. It includes token/actor references, attacker/defender roles, pending/choice/active state, native roll results, card reference, revision, incomplete operation, choke rounds, original held-token scale. Changing the selected combat cannot redirect the record. Resetting or deleting its Combat ends the grapple and removes its managed penalties.

Outside combat, state lives on the scene; Choke still deals damage but consecutive rounds/unconsciousness from the sequence are GM-managed. Such a grapple stays scene-scoped; end it and start a new Grab in the encounter to use combat tracking. Completed results stay in chat and are removed from the active-state map.

An active GM coordinates cross-owner updates. Buttons reject stale revisions and simultaneous requests. HP and a damage receipt are saved together so retrying an interrupted action does not deal damage again. Use the card's Retry control after an error. **End (GM)** clears the relationship and managed grapple effects; it does not undo HP damage already applied. Token/actor/scene removal cleans surviving managed effects.

## Native integration and verification

Integration was checked against CPR v0.92.4 skill creation, roll dialogs, modifiers and equipment fields: native Brawling skill rolls; bonuses.allActions ActiveEffect changes; system.handsReq and secondary-weapon handsReq; existing status catalog icons. The separately installed local desktop system is older (v0.88.2), so it was not treated as evidence of the target runtime version.

Automated rules, GM authority, combat lifecycle, duplicate requests, interrupted writes and browser HUD behavior are covered. Live multi-client Foundry validation remains outstanding.

Release, Choke and Throw on an established grapple require no new Brawling roll or opposed response. Their result displays use the action name and omit the original Grab dice; the original roll data remains saved in grapple metadata. Grab, Escape and Break Grapple still use opposed Brawling.
