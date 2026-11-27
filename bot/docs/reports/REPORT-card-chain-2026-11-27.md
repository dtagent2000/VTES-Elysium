# The card chain — text → cardfx → code → test (27 Nov 2026, bot v0.6.243, no bot change; RULINGS D-146, D-147)

The round's details (HARNESS "One place for each fact"): what was built and measured, the predictions read and registered, the
zero-vtes section. The proposal it builds (the owner's yes after C1; the review of it in the documentation chat) is the claude.ai
project's `claude/PROPOSAL-card-chain-2026-11-27.md`; the decisions are D-147, each the recommended option on the round's card.
Measured on main's bundle bytes (`14d48ac8` / cardfx `c4b9545e`: this round touches no file of the bundle).

## What was built
- **The abstract table, layer 1** (`elysium-bot-abstract.js` v1.0.0). A table state built directly through the bot's own rigged
  deal (`o.rig`), real Bot instances on the client's hotseat bridge lifted verbatim from the read-only copy (v2.6.179), the sim's
  virtual clock: one window, the acting seat's whole turn, in about 0.1 s, the same spec the same wire. Its own rules
  (`--self-test`, six cases, each with its rulebook anchor and zero-vtes's engine named as the witness): a block succeeds at intercept
  equal to stealth, both 0 by default; a bleed burns 1; stealth and intercept are added only when needed (R-12); the same action
  modifier once per action; one limited bleed modifier, its cost paid. Destructive: R5 fails on a bot with the once-per-action rule
  removed (two Lost in Crowds, "Stealth 2 vs Intercept 1 — block fails"), R6 on one with the limited slot never taken. The later
  layers (random games for coverage, the probabilities over card classes) are BOARD's and O-32's.
- **The reader gate** (`gen-reader-gate.js` v1.0.0). Of `cardfx-exact.json`'s 871 rows, 360 are gated (a corrected row, or a kept
  row on a card the bot plays through the family's own paths); 257 are read, 11 carry no value at their level, **92 are unread** and
  listed by register entry in `gaps.reader`: 7.6 52 (C1's unread conditions, `interceptPaid` on a hand reaction or a location,
  Unlicensed Taxicab), 9.13 23 (a bleed card's stealth or bleed outside the mode it plays: Cat Burglary's and Fleetness's header
  "+1 stealth action" is announced at 0), 10.25 5 (a modifier's "or" option: the plain bleed never played), 10.23 5 (values no reader
  takes on a card in play, an ally or a reaction), 7.5 3, 10.17 2 (a stealth mode's bleed: Bonding [DOM], Confusion [DEM]), 7.7 2 (X). 461 kept rows sit on cards the bot does not play through these paths:
  counted, not gated. READERS (key → the functions, card types and mode shapes that read it) is checked against the bot's source;
  the first version took the coverage tool's "consumed" as "played" and flagged 146 rows, many on action cards its CLASS map calls
  playable without a type (an action card's `intercept`): the gate now asks the family's own paths.
- **The scenario bench** (`test-card-scenarios.js` v1.0.0). Of 821 kept rows, 230 fall in a window it knows, 297 scenarios (S
  stealth modifiers 101, I intercept reactions 85, B bleed modifiers 55, A bleed cards 56), each on a vampire with the mode's level
  and no higher, the other modes' disciplines kept out (Skullduggery's [pre] would outbid its [obf]); a card's cost is read on the
  first board push after its line (a bleed card's at the resolution: a blocked action's cost comes back). **296 are played right**
  on main's bytes (12 s); one row is wrong and listed: The Eternal Mask [ser] bleeds at a counter of 0, its header's +1 stealth unread
  (9.13, the gate's finding seen in play). No window yet: 22 bleed cards the action scorer keeps (a bleed of 1 at +1 stealth at
  most: −0.35 for the card in hand, +0.2 a stealth; a decision, not a reading), 16 with no number, 10 of X, 9 with no vampire in the
  crypt, 4 self-price modes, 4 not usable on a bleed, 1 unlock reaction.
  Destructive: a bot whose stealth counter books one more turns 128 rows red; one that leaves an intercept card's blood unpaid, 19.
- **The readers' data file**, format readers v1 (`readers-card-chain-2026-11-27.json`; test-cardfx checks the form and every
  disposition's register entry, and re-derives each sample from its seed). Its first batch: C1's readers' side notes (the handoff's
  Check first 3), read by bot-card-reader on Sonnet against KRCG's text and rulings, spot-checked by the lead on KRCG's MCP (Gifts
  From Hereafter, Khabar: Glory, Cat Burglary, Confusion, Unleash the Hounds, Enthrall, Madman's Quill, Inevitability of the Void):
  15 hold (registered: 10.24, and 9.12 for Atonement and Dive into Madness), 2 do not (Forced Confessional prints the Salubri
  requirement our entry carries; Foreshadowing Destruction's uncounted limit costs no play, as [DOM] needs the target at 9 or fewer).
  Eleven of the fixes need a reader the bot does not have.

## Predictions
**Registered now** (D-93):
1. The agreeing rows' sample (`c1-agree-1`: 60 of 641 agreeing rows, seeded, stratified 41 / 9 / 10, the 29 extra-cost cards left out;
   13 of the 60 on cards a sim deck holds): at most 2 are wrong on both sides. Three or more: a shared blind spot beyond costs, and
   C1b reads a second 60.
2. C1b's corrections leave the bench at 0 rows wrong, and add at most 10 rows to `gaps.reader`, each with its entry.
3. C1b's fixes of 7.6, 9.13, 10.17 and 10.25 close at least 30 of the 92 listed rows, and The Eternal Mask's bench row with them.

**The documentation diet's, read** (its report; the egress line's classes, `git diff --unified=0` over `bot/docs`):
1. At most 2 stale-doc findings, none on a record figure: **failed** on the count, 6 (C1: 6); held on the figures, none. The map:
   they fell on sentences typed into several pages (D-146's merge line in the pages the handoff named, what the bench covers) and
   on card facts the register types by hand (9.13's reach, 10.25's other bleed mode). The record took the figures off the pages,
   not the sentences: L-87's class (carried, below).
2. The overhead at most 5 KB: **held**, about 2.5 KB (the CHANGELOG entry 1.2, STATUS's Next 1.2, no spec edit, the zero-vtes
   section in this report; C1: 14.2). The whole writing, the register, CARDS.md, the readers' data file and the generated blocks
   left out, about 15 KB (this report 7.7 of it): three fifths of C1's 25.1 KB, not half. The standing pages grew about 3.2 KB.
3. At least half of the findings on the code or the card data: **failed** as C1's 4 of 10 was counted (by class, stale-doc off:
   4 of 10); by subject at least 5 of 10, two of the stale-doc findings being the register's card facts.
4. No budget rise without the owner's D-line: **held**, the total 184 → 187 KB with D-147, on his card.

## For zero-vtes (D-144 (3))
No reading of zero-vtes's that KRCG's text or a ruling contradicts in this round's reads: the 17 side notes were judged against our
entries (15 ours wrong, 1 agree, 1 modelled differently), and their definitions of those cards were witnesses only.

## Unsure, each with its verdict
- **The egress review's sightings outside the family**, checked against KRCG's text and registered: 7.8 (Choir [MEL], Precision
  [CEL]: conditional pool damage as a flat number) and 9.14 (Rise of the Fallen's trigger as an action's `poolDmg`; Power of One's
  entry-level `limited` over its [pot]).
- **The auto-merge route** HARNESS step 10 once named (the handoff's): GitHub sets auto-merge through GraphQL, which this session
  refuses; step 10 now merges by the REST route once `bot-gates` is green. Checked at this round's merge.
- **The bench's "kept" class** (22 bleed cards): the scorer's −0.35 / +0.2 is a decision weight, so a change there moves rows in and
  out of the bench silently. Carried: a later bench window that plays a kept card on a state where its stealth decides.
- **The gate's "played" is the family's own paths**: a card played only through another finder (the pool-damage actions, the rushes)
  is not gated, and 9.13 names six pool-damage actions whose header stealth `_bestPoolDmgActionFor` never books. Carried: the next
  family's READERS covers those finders.
- **9.13's other-mode rows** (Brutal Influence [POT], Dream World [PRE] …): an add-on to the bleed or an action of its own is a
  reading per card. Carried to C1b's readers.
- **The register's card facts typed by hand** (the diet's prediction 1, read): a line's reach ("reachable (card: deck)") and a
  card's modes restate the deck files and cardfx; two drifted here (9.13's reach, 10.25's modes). Carried to C1b, which edits those
  lines: test-cardfx checks a line's reach against the decks.
- **The table's rules are the bots' own**: the six cases test the bots and the bridge together, not a rules engine of the table's;
  a rule all bots break the same way and the bridge relays would pass. Dropped as a limit of layer 1, named in its header: the
  rulebook anchors and zero-vtes are the outside witnesses.
