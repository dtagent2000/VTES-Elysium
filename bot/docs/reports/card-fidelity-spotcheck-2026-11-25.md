# What "77 of 77" measures, and a spot check of the base starters' auto entries — 25 Nov 2026

The owner asked (20:38) whether 77/77 really means every card works, now that the playtests keep finding cards played wrong.

## What 77/77 measures
`docs/CARDS.md` counts a copy as **playable** when three things hold: the bot plays every mode it can reach; every effect key in the
card's cardfx entry is read by some play path (`gen-deck-coverage.js` `judgeLib`, verdict FULL); and some deck played the card in
the sim. That is **reach**. It does not measure **fidelity**, that is, whether the entry says everything the card text says and
the bot uses it right.

A clause the entry leaves out is invisible to the tool. Mirror Walk is the case: its entry is "+1 stealth" at both levels, both keys
are read, so the verdict is FULL; but [THA]'s "if this action is blocked, lock the blocking minion and end the action" is missing.
The October review already flagged the coverage tool as generous (`REVIEW-playtest-2026-10-14`).

## The base starters by entry source
Malkavian, Nosferatu, Tremere, Ventrue and Toreador hold 92 unique library cards (385 copies):
- 54 have curated entries, written by hand with notes;
- 1 has a handler (Life in the City);
- **37 have auto entries: 242 copies, 63 % of everything the five decks play.** These are compiled from the card text and were never
  reviewed clause by clause.

## A spot check: 30 of the 37 auto entries beside KRCG's text
| Card (starter, copies) | Text vs entry | Effect at the table |
|---|---|---|
| Mirror Walk (Tremere 6) | [THA]: lock the blocker and end the action if blocked. **Missing.** | Rosalina and Trevon went into combat they should have avoided (game 2) |
| Aire of Elation (Toreador 2) | +1 bleed more if the vampire is Toreador, at both levels. **Missing.** | Every play bleeds 1 short; Kathy Glens's lethal [PRE] bleed in game 1 was 3, not 4 |
| The Warrens (Nosferatu 4) | +1 intercept more if the Nosferatu is titled. **Missing** (`onlyDirected` is modeled). | The Nosferatu bot under-counts by 1 on 3 of its 4 starting vampires |
| Faceless Night (Malkavian 4) | [OBF]: blockers who fail become locked before resolution. **Missing.** | A failed blocker stays free to block again |
| Cloak the Gathering (Malkavian 4) | [OBF] is played by a ready vampire *other than* the acting minion. **Who plays it is not modeled.** | A possible illegal play, or a lost one |
| Raven Spy (Nosferatu 2) | [ANI]: 2 life. **Missing.** | Minor |

The other 24 matched the text: Bonding, Conditioning, Deflection, Enchant Kindred, Govern the Unaligned, Eyes of Argus, Freak Drive,
Intimidation, Lost in Crowds, Majesty, On the Qui Vive, Precognition, Roundhouse, Spirit's Touch, Swallowed by the Night,
Telepathic Misdirection, Theft of Vitae, Wake with Evening's Freshness, Bewitching Oration, Apportation, Carrion Crows, Daring the
Dawn, Instinctive Reaction (its predator-only condition is modeled) and Immortal Grapple (read from a truncated line). The four
political cards with no modes (Kine Resources Contested, Parity Shift, Consanguineous Boon, Ancilla Empowerment) run on code handlers
and played correctly in both games. The three equipment cards were not checked.

**Six of 30 auto entries are incomplete, about one in five. Four of the six change numbers or outcomes at the table.**

## The two games' card findings, sorted
Only one of them was a wrong entry (Mirror Walk). The others are of different kinds:
- a missing play check: Life in the City with no ready vampire;
- judgment: a second wake (On the Qui Vive), and spending down to pool 1;
- the bot's reading of a human's cards: Carrion Crows' environmental damage, The Dowager's +1;
- the table's flow: timers, the stall, ordering.

## Proposal (waits for "kör")
1. Report two numbers per deck: **playable 77/77** and **text-checked N/77**, with a fidelity column in `docs/CARDS.md`
   (complete / approximated / clause missing / wrong).
2. A fidelity pass over the five base starters. All 37 auto entries come first, then a lighter pass over the 54 curated ones. Each
   card is read clause by clause against KRCG's text and zero-vtes's reading (the sweep's review sheet, `gen-review-sheet.js`).
   Whatever is found goes into SWEEP-REGISTER.
3. Fix what the check found, with suite sections: Mirror Walk, Aire of Elation, The Warrens and Faceless Night first, then Cloak the
   Gathering and Raven Spy. The playtests' items join them: Life in the City's target check, the redundant wake, and the pool floor in
   the master phase.

## Unsure
- "Matched the text" is a reading of the entry. That the bot also applies each effect right in play was not checked; that is what
  the fidelity pass's suite sections are for.
- The curated 54 were not checked at all here. They are hand-written, so fewer gaps are likely, but none of them is proven.

## Outcome: bot v0.6.241, PR #109 (26 Nov; the owner's go-ahead 25 Nov 20:43, RULINGS D-138)
- **Fixed:** the playtests' table bugs A1–A4; Mirror Walk [THA] (the blocker locked, the action ended; a new bot line
  `BLOCKED_LOCK`, and the stealth line names the level); Aire of Elation's and The Warrens' +1; Life in the City held without a
  ready vampire; no second wake in one action; Creeping Sabotage's X blood (found by the pass).
- **The measure:** `cardfx-fidelity.json` (all 92 cards read against KRCG's text) and CARDS.md's two numbers. Every starter is
  text-checked 77/77. Exact: malkavian 51, nosferatu 51, toreador 68, tremere 52, ventrue 59 of 77. A card is exact when no open
  register gap changes its play. A choice of when to play a card (class 13) is not counted as a gap; if it were, malkavian would
  be 47 and ventrue 56.
- **Found and registered for releases of their own (active):** Bonding [DOM] spent for its stealth adds no bleed (10.17), and
  Protection Racket's +1 against a titled actor (7.5).
- **Left, with reasons:** Faceless Night [OBF] (10.1: its own design), Cloak the Gathering (8.7), Raven Spy (1.3).
- **Proposals and questions for the owner:** the pool floor in the master phase (O-52) and the playtests' four table questions (O-53).
- **Egress:** 29 findings in 3 passes, all fixed. The suite gave 2841/0 three times.
- **zero-vtes as a witness (checked afterwards, `f9f227f`):** every card is a hand-written definition there. That is 2,120
  definitions in `crates/engine/src/cards/defs.rs`, with the text quoted and the rulings cited, plus a ledger of 6,080 rulings
  rows. Its definitions of this round's cards agree with the fixes. This pass did not diff against them; a mechanical cross-check
  (C1) would make the next decks' pass faster.
