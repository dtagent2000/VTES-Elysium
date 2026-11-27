# zero-vtes's readings checked in C1 (27 Nov 2026) — a report for zero-vtes's maintainer (RULINGS D-144 (3))

**What was compared.** Our card-effect library (`bot/elysium-cardfx.json`, bot v0.6.242's) against zero-vtes's card definitions at
commit `f9f227f` (2026-11-25): the stealth, intercept and bleed values of every library card, level by level, with
`bot/gen-cross-check.js` (MIT, in this repository; it reads a zero-vtes checkout outside the repository and commits nothing of it but
the names of the effect types it pairs with ours, `bot/cross-check-pairing.json`). KRCG's card text and the rulings decide; zero-vtes
was the witness, our compiler the second opinion.

**Result.** Before our corrections the tool's v1.1.0 compared 1,290 rows on 873 cards and 976 agreed outright (its v1.2.0, which
sets an action a card grants apart on both sides, counts 1,282 rows and 898 agreements on the same bytes: 78 rows where both readings
had booked a granted action's stealth as the card's own). The 263 rows of 215 cards that v1.1.0 left (not agreeing, or not comparable)
were read by hand against KRCG's text and its rulings (KRCG's MCP for the rulebook). **None showed a reading of zero-vtes's that the
text or a ruling contradicts.** 128 of the rows were ours: 107 are corrected in bot v0.6.243 (a granted action's stealth booked as the
card's own, a conditional value read as flat, a count read as 1) and 21 are recorded as gaps our entries leave (a blocking minion's
malus and the like). Eight more of ours sold a value for blood or pool as if it were free; both readings agreed on the number, so the
comparison could not see it.

**Where the two models differ** (both true; nothing to fix on either side):
- a political action's +1 stealth comes from the rulebook in zero-vtes, from the card's own "+1 stealth political action" in ours;
- an action a card grants ("burn this card as a +1 stealth action") is an ability with its own stealth in zero-vtes; ours keeps no
  number for it yet;
- a condition can sit in a stat layer's `during` in zero-vtes, where our tool reads the value as unconditional (a limit of our tool);
- a few readers' notes that only concern our side: Anarch Railroad and Fortune Teller Shop give their stealth to any Methuselah's
  Anarch or Ravnos in zero-vtes; ours serves the bot's own minions only, a narrower reading we note as ours to widen.

**Nothing to pass on as an error this round.** The next family (combat, C2) gets the same check; this report's successor will list any
reading of zero-vtes's that KRCG's text contradicts, with the card, their reading, the text and the ruling's reference.
