# Player guide

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

## Start with your token

Select one owned token, then right-click another token for target actions. Right-click your own token for self controls. Native Foundry token controls remain. Assign your Character in player configuration so your Biomonitor and incoming notices have a default character when nothing is selected; without an assignment, a single owned scene token can serve as fallback.

## Attacks and damage

1. Choose the weapon/action from the target HUD; complete the native CPR roll dialog.
2. The defender chooses Evade or Don't Evade when offered. The attack result stays hidden until the decision resolves.
3. Read the combined result. Roll damage through its control; Shift-click opens native options.
4. Choose attached effects if needed. Apply damage to the recorded target or deliberately use **to selected target**. Selected-target applications remain listed on the card.
5. Resolve any separate resistance/effect or injury controls. Rolling damage is not the same as applying it.

For area attacks, place the area, let each recipient respond, and use per-target damage controls. Successful evasion can require relocation outside the area. The GM chooses the actual landing point after a missed explosive attack.

## Close combat and netrunning

Use Close Combat to Grab or Break a grapple. After a successful Grab choose Hold Target or Take Held Object; item transfer is manual. Ongoing Choke/Throw/Release live in the grappler's self HUD. The defender's self HUD offers Escape with the attacker's name. Combat timing restrictions apply to attacker follow-ups; the original chat card remains available as a record.

QuickHack requires a tracked connection in a started encounter. Jack In, choose a hack, and resolve the native roll. Detected Neural Intrusion offers right-click ejection controls on the large status icon. The On Fire icon similarly offers Extinguish. Multiple incoming connections have separate choices.

## Your displays

The combat bar supports bottom-left/top-right and horizontal/vertical layouts. Its gear opens the same settings as Module Settings. Portraits support native selection/navigation and permitted sheet/context actions. End Turn requires ownership of the active participant and an active GM.

The Biomonitor can stay expanded or minimize to EKG/name. Notifications sit below it, with a left-hand dismiss control. Clearing an incoming-attack notification does not resolve the attack. Left/right placement and optional Crew Tools integration are personal preferences; a top-right combat bar temporarily moves the Biomonitor left.

Movement counters show used/normal allowance, run indication and a saved start marker. Reset returns position/elevation and clears tracked movement; it does not undo other actions. Injury-damage cards remain manual. Read the warning and apply damage at the proper time.

## Manual rolls

Click the die beside chat's roll-mode selector for Damage, Critical Injury, Cyberpunk Roll or STAT Roll. The GM can also request a Group Check. Click your Roll button on a request; click the resulting total to expand the native roll and modifiers. See [manual rolls](manual-rolls.md).

An unavailable control can indicate no active GM, invalid ownership/target/range, an inactive encounter, an unsupported item, a changed connection or a rule restriction. Correct that condition; do not repeatedly click uncertain damage applications. The GM can inspect recovery controls.

## Bow ammunition (unreleased)

Select your token and attack a target with a bow. If an arrow is already loaded, the attack proceeds with it. Otherwise, choose compatible ammunition from inventory and click **Load & Continue**. The last attached ammunition stack is preselected if it still has stock; an exhausted stack leaves the choice unselected. Canceling this prompt changes nothing. Canceling the attack roll after loading leaves the arrow loaded. Native CPR groups bows and crossbows under the same weapon type, so both use this flow.
