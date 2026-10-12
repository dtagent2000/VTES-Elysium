# Cardfx sweep — pilot report (25 Sep 2026)

**Scope:** the 90 library cards in the bots' six deck lists (Nosferatu, Tremere, Malkavian, Ventrue, Hacking, Sewer), checked three ways: our cardfx against KRCG's card text (`vtes.json`, 4,149 cards) and against the official rulings (vtes-rulings, MIT, 1,294 rulings entries). Tool: `sweep-pilot.py`.

## Verdict

The deck cards' cardfx is in good shape: after reading every flagged card by hand, **2 real findings** remain in the 90 cards, plus **one rule correction** and **one field gap** that matter beyond these decks.

| # | Finding | Real? | Action |
| --- | --- | --- | --- |
| 1 | **Action stealth: the undirected +1 does NOT apply to action cards.** The rulebook (Action cards): "Unless otherwise noted on the card, these actions are at 0 stealth." The printed "+N stealth action" IS the total; the undirected +1 belongs to the BASIC actions (hunt, equip, employ, recruit, political, rescue own vampire, leave torpor). cardfx already follows this (17 of 17 action modes agree); our docs gave the wrong reason. | Rule correction | Docs corrected (CLAUDE.md block gate, the design and mapping docs). Johan's Govern ruling (superior = 1) stands, for this reason. |
| 2 | **No `ranged` flag on strikes.** 63 non-hand strike cards are ranged by their text (an R, or "Strike, ranged"); **9 are melee** (e.g. Talbot's Chainsaw, Burning Touch, Putrefaction) and the bot treats every non-hand strike as usable at long range. None of the 9 is in our decks. | Real gap (not in our decks) | Add `ranged` per strike mode in the full sweep; `_bestStrikeFor` excludes non-ranged strikes at long. |
| 3 | **Bowl of Convergence [AUS]:** the bearer can burn 1 blood during an action for an ADDITIONAL +1 intercept; cardfx gives [AUS] +1 only. | Real (Tremere deck) | Curated fix: `intercept` 1 + a paid `interceptPaid` 1 (1 blood), read by the intercept second look. |
| 4 | **Immortal Grapple ruling [TOM 19951217]:** a minion already committed to a non-hand strike (e.g. it used a gun's maneuver) gets NO strike that round, not a hand strike. | Edge case | Check the bot's `_handStrikeOnly` path when it holds .44 Magnum and used its maneuver. |

**False positives (the checker's limits, cardfx correct):** "As above" levels not expanded (Instinctive Reaction, Precognition, Raven Spy, Spirit's Touch), "Prevent X+1" (Hidden Strength, `preventX`), fields the checker does not know (`stealthLater` Marked Path, `bleedBank` Spying Mission, `allyPressLife` Underbridge Stray), the header-mode rule (Revelations' `actStealth` on its null mode), Immortal Grapple's close-range requirement (header, all levels), and The Parthenon (found via `alias`). The full sweep's checker expands "As above" and learns these fields first.

**Two rulings worth a bot check beyond these decks:** Theft of Vitae played by both combatants resolves simultaneously (blood adjusted by the net) — relevant to Tremere mirrors; Instinctive Reaction / Spirit's Touch / Precognition [superior] effects apply only in the block-induced combat and not a follow-up combat.

---

## Raw checker output

Cards checked: 90 (library cards in the six decks; not in KRCG: 0, no cardfx entry: 1).

## Findings by type

| Finding | Count |
| --- | --- |
| actStealth ok | 17 |
| extra intercept | 4 |
| extra prevent | 2 |
| missing actStealth | 2 |
| missing bleed | 1 |
| missing intercept | 1 |
| missing press | 1 |
| missing stealth | 2 |
| no cardfx | 1 |
| req on entry, text per level | 1 |

## Ranged strikes by the text (cardfx has no `ranged` flag yet)

| Card | Level | Kind |
| --- | --- | --- |
| .44 Magnum | - | strike |
| Murder of Crows | ani | ? |
| Theft of Vitae | tha | steal |
| Theft of Vitae | THA | steal |

## Rows

| Card | Level | Field | Finding | cardfx now | Text says |
| --- | --- | --- | --- | --- | --- |
| Bowl of Convergence | - | intercept | text has it, cardfx missing | None | 1 |
| Hidden Strength | FOR | prevent | cardfx has it, text does not | 1 |  |
| Hidden Strength | for | prevent | cardfx has it, text does not | 1 |  |
| Immortal Grapple | POT | req.rangeClose | entry-level requirement, text limits it to these levels | entry | POT |
| Instinctive Reaction | ANI | intercept | cardfx has it, text does not | 1 |  |
| Marked Path | OBF | stealth | text has it, cardfx missing | None | 2 |
| Marked Path | obf | stealth | text has it, cardfx missing | None | 1 |
| Parthenon, The | - | cardfx | no cardfx entry |  |  |
| Precognition | AUS | intercept | cardfx has it, text does not | 1 |  |
| Raven Spy | ANI | intercept | cardfx has it, text does not | 1 |  |
| Revelations | AUS | actStealth | missing | None | 1 (printed) |
| Revelations | aus | actStealth | missing | None | 1 (printed) |
| Spirit's Touch | AUS | intercept | cardfx has it, text does not | 1 |  |
| Spying Mission | OBF | bleed | text has it, cardfx missing | None | 2 |
| Underbridge Stray | ani | press | text mentions a press, cardfx none |  |  |

## Rulings on the flagged cards (vtes-rulings, MIT)

**Hidden Strength**
- The 'X' in card text refers to the cost of the card. [LSJ 19970224]
- Prevents up to X+1 damage, it can prevent less (X can be higher than strictly needed). [RTR 20041202] [PIB 20121202]
- Cannot be used if there is no damage to prevent (X cannot be negative). [LSJ 20001114] [LSJ 20030121]

**Immortal Grapple**
- If a minion is committed to a strike other than a hand strike (e.g. used a maneuver from a gun), then he gets no strike. [TOM 19951217]
- Is still considered played if it is canceled as it is played (eg. {100333|Charismatic Aura}). A second one cannot be played in the same round as its card text forbids it. [ANK 20200525-2]

**Instinctive Reaction**
- [ANI] The maneuver can only be used if the block is successful, and only in the resulting (block-induced) combat. It does not carry over to a follow-up combat (eg. [CEL] {101507|Psyche!}). [LSJ 20010813] [LSJ 20010819-2]
- [ANI] The maneuver is provided again if a second block happens on the same action (eg. after [PRO] {100771|Form of Mist}). [LSJ 20010814-2]

**Marked Path**
- If the set of Methuselahs includes the controller of the vampire this card is on, the controller of the vampire is not considered as part of that set of Methuselahs. [LSJ 20100527]

**Precognition**
- [AUS] The damage prevention can only be used if the block is successful, and only in the resulting (block-induced) combat. [LSJ 20010813]
- [AUS] The prevention does not carry over to a follow-up combat (eg. [CEL] {101507|Psyche!}). [LSJ 20010819-2]
- [AUS] The prevention is provided again if a second block happens on the same action (eg. after [PRO] {100771|Form of Mist}). [LSJ 20010814-2]

**Revelations**
- [aus] You do not get to see the card drawn as replacement. [LSJ 20100119] [PIB 20121031]

**Spirit's Touch**
- [AUS] The maneuver can only be used if the block is successful, and only in the resulting (block-induced) combat. It does not carry over to a follow-up combat (eg. [CEL] {101507|Psyche!}). [LSJ 20010813] [LSJ 20010819-2]
- [AUS] The maneuver is provided again if a second block happens on the same action (eg. after [PRO] {100771|Form of Mist}). [LSJ 20010814-2]

**Spying Mission**
- [OBF] Cards and effects (e.g. {100085|Archon Investigation}) cannot be played or used after one or more Spying Missions are burned to increase a bleed, until after action resolution. [LSJ 19980105]
- [OBF] Is played when a bleed is about to be successful, just before its resolution. Other modifiers and reactions cannot be played until after action resolution. [LSJ 19980105] [LSJ 20110502]
- [OBF] If it is cancelled (eg. {100545|Direct Intervention}), it is too late for the target to play reactions. If the cost of the cancellation ousts a player, handle the oust before resolving the bleed. [LSJ 20050607] [LS
- [OBF] A minion can have multiple spying missions against the same Methuselah. They all burn at once as soon as a bleed against that methuselah is about to be successful, increasing the bleed by 2 each. [ANK 20200609]

**Underbridge Stray**
- He can burn 1 life to give a minion you control a press the turn he is recruited. [ANK 20180517]

