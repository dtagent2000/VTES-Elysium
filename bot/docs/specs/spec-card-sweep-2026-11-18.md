# spec-card-sweep — finishing the V5 sweep by sharing (18 Nov 2026, on bot v0.6.234)

**Status:** kör — Johan, 18 Nov ("Vi kör, med dina rekommendationer för besluten"), on the proposal this page records: the method of
§2, the flow, the order and §7's four decisions (RULINGS D-125). §4.2 answers a question he asked with his "kör"; he took
its answer on 19 Nov (RULINGS D-126). On 19 Nov he answered the question about zero-vtes's maintainer (§5). The page's own round changed no
code. Measured on main `6baf99b`.

**Step A1** (19 Nov, no bot change) built §4.1's first two items: the library table (`gen-card-ledger.js` v1.2.0, "The whole
library" in `CARDS.md`) and the sharing register with its gate (`cardfx-sharing.json`, `cardfx-sharing.js`, `test-cardfx.js`).
Where it differs from §4.1:
- The room: 1.8 KB under the total, short of the 2 KB planned (main's reply of 19 Nov took 0.3 KB of STATUS), and 1.5 KB under
  RULINGS; and not by the cut planned: the read found 0.5 KB of history, the rest is a raise by D-101 (`tools/doc-budget.sh`). `tools/test-doc-budget.sh`'s total case reads the budgets from
  the check and pads the bootstrap's three pages, so it no longer leans on how full they are.
- The seed pins each key's entries as well as the keys: a backlog key cannot reach another card before it is answered. The
  egress review found the hole (B's rush and grant keys are backlog keys). A unique row is one card, a shared row at least two
  different cards with every hand entry that carries the key among them. §4.1's "the backlog only shrinks" is, as built: no
  key and no entry outside the frozen seed.
- "The lint reads the repository only" holds for the check; its gate is `test-cardfx.js`, which needs `vtes.json` as before.
- §6's two labels follow the coverage tool: INERT is "modes, none with a key a play path reads" (609 of the 722 carry only keys
  the scan has), NAME-ONLY is "no modes". "Keys the bot reads" is the coverage tool's scan of the spelling `fx.<key>`; a key read
  as `f.<key>` is not in it (`combatEnds` is read so).

**What the gate does not guard** (the tool's header has the same list):
- whether an answer is true. Any of the 124 single-entry keys can be filed `unique` and pass; a shared row's list can be short.
  The answers are read against KRCG's text on the review sheet and graded as HARNESS says (§3.4): the gate checks their form;
- a shared row's debt. A row is owed while its key is still hand-only (no general source yet) or a card it names lacks the key:
  counted in the ledger and reported by the round, and §2 wants a shared effect applied in the same round;
- a row moved back into the backlog (an edit a review sees);
- what sits outside a library entry's fx keys (on hand entries only today: 21 entry-level fields, two of them notes, 6
  mode-level, 3 under `req`; and crypt keys).

**Left for A2**, with the rest of §4.1 (the review sheet, the dry run, the merge design, the docs' other lines), to be decided on
the dry run's data: whether the debt is gated and whether the register widens beyond fx keys; and the bootstrap's room (38 bytes
of its 50 KB are free: the root `CLAUDE.md`'s zero-vtes line needs a cut there first).

## 0. In one paragraph
We finish the V5 sweep one starter at a time, one card at a time, and every effect we meet is first asked one question: **who else
in the library prints this?** Common and shared effects go into the general tier and land on every library card that prints them.
Only the unique remainder is hand-curated. zero-vtes's card definitions are the answer sheet each card is checked against at
development time. Every round reports its numbers on the whole library, not only on the 308 starter cards.

## 1. Why change
| measured 18 Nov, read-only (appendix B) | |
|---|---|
| library entries the bot can statically play, of 2,391 | 565 (29 Oct) → 658 (3 Nov) → 679 (v0.6.234) |
| of them from the general tier (the compiler) | 487 → 531 → 527 |
| effect keys the bot reads / keys the compiler can produce | 200 / 42 |
| keys that exist only in hand entries | 145, of which 124 sit on a single entry |
| hand-curated cards with such a single-card key that zero-vtes builds from shared effects only | 46 of 78 |
| library cards built only from effects the bot already handles (an estimate of reach; appendix B) | 137 |
| starter cards left (inert + partial) | 77: 43 shared-only by the same measure, 30 with a unique effect, 4 not read |

The waves by class (D-98) moved the whole library in their first five days. Since 3 November what a wave learns goes into per-card
hand entries: `cardfx-curated.json` overlays whole entries (`cardfx-compile.js`, "hand"), so a hand-curated card gives the rest of
the library nothing, even when most of it is shared. The bot has the consumers; the library does not have the data. Of the 161
library cards curated by hand, the entry adds a key the compiler missed on 138 and drops a key the compiler set on 51.

## 2. The method (Johan, 18 Nov)
His three steps, for each card: "1) vilka enkla minsta gemensamma finns som samtidigt återfinns på fler kort i biblioteket. 2)
vilka mer avancerade korteffekter finns men som ändå delas mellan fler kort i biblioteket. 3) kvarvarande effekter blir då
handkurerade." And their reach: "Vi GRANSKAR alla kort i V5-bibliotelet för punkt 1-2 (en starterlek i taget, ett kort i taget)
utifrån detta men vi sveper igenom HELA biblioteket för steg 1 och 2 så att om vi vill fortsätta handkurera bortom V5 så kan vi
börja med steg 3 direkt".

This page calls his three steps T1, T2 and T3, because §3 has steps of its own and §4 has steps A to E. For every printed effect:
- **T1, a common denominator.** A key the compiler already extracts. We check that it fires on this card.
- **T2, a shared effect.** Printed by at least two library cards. It gets one key, one consumer and a general source, applied to
  the whole library in the same round: a compiler pattern where the wording is regular, otherwise one reviewed card list per effect.
- **T3, the unique remainder.** Hand-curated, and the hand entry carries the remainder only.

The rule: **no hand key before "who else prints this?" has an answer on file.**

After the cards (his words, in short): the remaining cards of each starter are hand-curated together with the official guide's
strategy lines, so the deck is judged fairly in play. When all starters are done the strategies are evaluated, by archetype and
then by deck (step E, outside this page). A starter is published when Johan is satisfied with its tests.

## 3. One starter, one round
Two rounds when the starter needs a new mechanism.
1. **The review sheet**, generated and never committed. Per card: KRCG's text, our compiled entry with each key's origin (compiler
   or hand), zero-vtes's definition with "printed by N cards" for each effect, their windows, the rulings count, every disagreement.
2. **Split** each effect into T1, T2 or T3. Claude proposes; doubts and reds go to Johan as today.
3. **Build** T1 and T2 for the whole library, T3 for the card.
4. **Grade** as HARNESS says (green, amber, red against KRCG's text and vtes-rulings, by a fresh read-only agent). A T2 card list
   is graded per effect the same way: each listed card against KRCG's text. zero-vtes is a third witness.
5. **The strategy baseline**: the official guide's lines (D-112) and the pricing of cards the bot holds but never plays (unseen).
6. **Measure**: the sims, the registered predictions (D-93), the ledger and the library table regenerated.

A starter is done when every library row is playable, no disagreement on its review sheet is open, its crypt rows are modelled
and its guide check is listed. The crypt keeps D-108's waves by class; the starter's done-condition only reads their rows.

## 4. The order
| step | what | done when |
|---|---|---|
| **A. Set up** (one round, no behaviour change) | §4.1: the tools, the dry run, the docs, the merge's design. The seven finished decks' review sheets too, if Johan confirms §4.2. | The tools run in the round's gates; the dry run's counts stand in the PR and in §4.3; Johan has the merge's design. |
| **B. The pilot: Banu Haqim** (one round) | The new flow end to end, the merge of hand entries built first (§4.1, on Johan's "kör" on its design). Its 4 remaining cards are shared-only by §1's measure, most of them the maneuver and press grants with the rush cards; Hunting the Quarry and Night Terrors' strike (wave 6's riders) ride with them. Priority Contract (4 copies) is one of the six misreads below and is read again here. | 77 of 77 copies playable, no disagreement open on its sheet, the library table moved, the flow's friction written down. |
| **C. The harvest** (one or two rounds) | The 145 hand-only keys asked "who else prints this?"; the seven finished decks first, if Johan confirms §4.2. The compiler's known misses (`bloodAdd` and `bloodAddTo` on 59 card-keys). The cross-check of what is already playable against zero-vtes, with the five other misreads. | No row of the sharing register is `backlog`; the number of library cards turned playable is reported. |
| **D. The other twelve starters** | Nearest first, re-ranked from the ledger after every starter: each round's shared effects close cards in other starters too. Appendix A has where they stand. | Each starter done as §3. |
| **E. The strategy evaluation** | After the sweep, outside this page. | — |

**The six misreads** (compiled entries the ledger counts as playable, found by the zero-vtes comparison of 18 Nov and upheld by
KRCG's text; none is in a menu deck): Priority Contract (banuhaqim 4: read as a directed +1 stealth mode gaining 3 pool; the
card goes on a prey's minion, grants a rush on it and is burned for the pool when that minion leaves the ready region), Target
Vitals (pathdeath 4: read as a press; it adds 2 damage and denies the opponent's press), Form of Mist [PRO] (ministry 4, tzimisce
3: the action continued for 1 blood is read as a bare +1 stealth), Black Forest Base (pathpower 1: the Sabbat requirement and the
referendum are missing), Powerbase: Madrid (pathpower 1: its counters are missing), Saulot's Healing Touch (salubri 1: the
rescue's discount is missing).

### 4.1 Step A in detail
Built in A:
- **The library table.** A summary in `docs/CARDS.md` beside the starters' table, not a row per card: the verdict counts of every
  library entry of `elysium-cardfx.json` by tier and by card type, from `gen-deck-coverage.js`'s own verdict with every vampire
  offered as the crypt (so reach hides no card) and the discipline-line check on; and the vocabulary counts (keys read, keys the
  compiler produces, hand-only keys, the register's states). The vocabulary needs `vtes.json` beside the tool for a compile without
  the curated file, as the crypt page does today; without it the page says so. The ledger is regenerated from the release bytes'
  runs (HOWTO); A changes no behaviour, so those are v0.6.234's.
- **The sharing register and its lint.** A file beside `cardfx-curated.json` (its name is A's) with one row for each hand-only
  key: `unique`, `shared` with the cards that print it, or `backlog` (not asked yet). A seeds the 145 keys as `backlog`; C empties
  it. `test-cardfx.js` fails on a hand-only key with no row, and on a `backlog` row A did not seed: a new hand key comes with its
  answer, and the backlog only shrinks. The lint reads the repository only.
- **The review sheet.** A generator for one starter (§3.1). It reads zero-vtes from a checkout OUTSIDE the repository, by a flag,
  and names the commit it read: `crates/engine/src/cards/defs.rs` (the definitions), `data/window-matrix-reviewed.csv` (the
  windows) and `data/rulings-v5.csv` (the rulings ledger). Its output is scratch, like a series. No gate and no CI step needs the
  checkout.
- **The dry run.** A sample of the harvest done in scratch, so that C's size is known before B: 20 of §1's 46 cards, the 20 in
  the finished decks if Johan confirms §4.2, otherwise the first 20 in the ledger's order of the 26 that are in no finished deck.
  For each card Claude first names which effect type(s) of its zero-vtes definition its single-card keys model, and reports that
  choice; a key that only qualifies another (Revelations' `dir`, `persistent`) is noted and not counted. The candidates are the
  library cards whose definitions share a named effect type; Claude reads KRCG's text of each and keeps those that print the
  effect, with the mode, the level and the value the text gives; the keys are added to them in a scratch copy of the compiled
  library; the ledger's verdict (the discipline-line check on) counts the cards turned playable. Reported per card: the effect
  types named, candidates, confirmed by the text, turned playable. Nothing ships from it.
- **The docs.** HOWTO's fetch line for zero-vtes and its line in the root `CLAUDE.md`'s "Data that is not in git"; HARNESS's
  charter says who grades a T2 list (§3.4); the ledger generator's "what the waves would build" wording; and room in the budgets:
  at least 2 KB under the standing pages' total and 1 KB under RULINGS when the round ends, by cutting history the specs keep.
  With that cut A lowers the total's ceiling again or makes `tools/test-doc-budget.sh`'s total case pad to the ceiling: the case
  trips only while `bot/CLAUDE.md`, STATUS and BOARD together stay above 42,750 bytes (44,733 today).

Designed in A, built at the start of B on Johan's "kör" on the design (the pilot writes the first remainder with it):
- **Merging hand entries.** `cardfx-compile.js` lets a curated entry add to the compiled entry instead of replacing it, opt-in per
  entry, so that a hand entry can carry the remainder only. An entry that does not opt in compiles byte for byte as today, and A
  opts none in: the committed `elysium-cardfx.json` does not change. The design answers how a hand mode meets a compiled mode; how
  a merged entry drops a key the compiler set wrongly (51 of the 161 hand entries do so today) or overrides a value or a level it
  set; which `src` it carries, since the ledger's tier and the hand-only count read it; and whether the cost rule's inheritance
  applies (CLAUDE.md).

### 4.2 The finished decks (Johan, 18 Nov: should T1 and T2 be checked again for the cards already done?)
The five finished starters with `hacking` and `sewer` hold 104 library cards:
- **63 hand entries.** They are in the harvest whatever the answer: D-125 asks every hand-only key. 55 of the 124 single-card
  keys sit on them, and zero-vtes builds 20 of those cards from shared effects only (Chantry's `rescueTorpor`, The Barrens'
  `handCycle`, Magic of the Smith's `fetchEquip`, Misdirection's `lockMinion` …). A shared one goes library-wide.
- **41 compiled entries never hand-curated** (the 25 Sep sweep checked those with modes by script). 37 have a zero-vtes
  definition: a review sheet checks them at once, and a disagreement becomes a review item.

Johan's answer (19 Nov, D-126: Claude's yes to both): the 41 are read again, their seven sheets in step A2; and the
finished decks come first in the harvest, because their consumers are the best proven (the four starters sat in 408 of the
ledger's sim matches each).

The guard: the seven decks' compiled entries stay byte for byte unless a reading is ruled wrong (a rules correction, with its own
test), and the 240 is IDENTICAL for a round that only gives other cards their data (CLAUDE.md, "Gates").

### 4.3 Predictions for step A's counts (registered before the tools exist; D-93, L-44)
1. **The dry run's 20 cards turn at least 15 other library cards playable** in all (§1's estimate is 137 cards for 78 effect
   types, before the text is read). Between 6 and 14: the harvest is worth its rounds and smaller than estimated. Fewer than 6:
   the estimate was the stand-in's artefact, and C shrinks to the cross-check.
2. **zero-vtes's sharing is a usable guide**: for at least 12 of the 20 cards, KRCG's text shows another library card that prints
   an effect one of the card's counted keys models. Between 6 and 11: a guide that needs the text search beside it. Fewer than 6:
   no guide to ours.
3. If §4.2 is confirmed: **of the 37 never hand-curated entries with a definition, between 2 and 10 carry a reading KRCG's text
   contradicts**, graded as HARNESS's charter says. Fewer than 2: the compiler reads played cards better than §1 suggests. More
   than 10: the finished decks need a round of their own before the harvest.

The observed counts and their verdicts are written here when A is built. The pilot's and each starter's predictions are
registered in their own rounds, before the build.

## 5. zero-vtes: what we use and what we do not
Used at development time, read from a checkout outside the repository and never committed:
- **the card definitions**: the review sheet's answer column and the "printed by N cards" index;
- **the window matrix**: when a card may be played, as a check on our entry;
- **the rules digest and the rulings ledger**: the first stop when a mechanism is built or a reading is disputed.

The rule of evidence: **KRCG's text and the rulings decide, zero-vtes proposes, our compiler is the second opinion.** A
disagreement becomes a review item and is never fixed automatically in either direction. What we commit is our own reading: a
pattern or a card list holds only cards each checked against KRCG's text, and no zero-vtes identifier or text.

Not used: at runtime, as copied code, or as files in git.

The maintainer and the credit. The clean-up spec allowed zero-vtes as a third check "only after asking its maintainer"
(`specs/spec-cleanup-2026-10-20.md`, T3), and the repository does not show that this was done. Johan, 19 Nov: "Vi kan släppa nog
villkoret för Lionel kanske eftersom han har MIT-licens (dock ska vi ju ge honom credit såklart), men jag ska nog ändå skriva till
honom på Discord o ta upp att jag ska lägga till licens också ifall det är så att han mot förmodan skulle hitta något matnyttigt
hos oss för sin lösning också". These pages read his "nog … kanske" as the condition dropped (D-125): step A does not wait on it.
The credit is owed, and `bot/README.md` gives it from this round on. Claude's proposal, not ruled: when the repository has a
licence, the root README's credits name zero-vtes too; that README is main's file, so it goes as a handoff (BOARD, the V5 sweep).
`specs/spec-cardfx-sweep-sources-2026-09-25.md` stays the source mapping for KRCG, vtes-rulings and vtes-skill; this section adds
the fourth source.

## 6. What every round reports
- **the starter**: playable copies of 77;
- **the library**: playable, partial, INERT (modes, none with a key a play path reads), NAME-ONLY (no modes), masters played blind (609 / 185 / 722 / 468 / 407 today, with the
  ledger's discipline-line check);
- **the vocabulary**: hand-only keys (145 today) and the register's `backlog` rows (145 when A has seeded it; 124 of the keys sit
  on a single entry);
- **the hand entries written this round** and how many keys each carries. The target is the remainder only.

The library numbers are static readiness: every mode has a reader. Only a starter is proven in play, because only a deck seats its
cards in the sim.

## 7. The decisions (taken 18 Nov as recommended; RULINGS D-125)
1. **D-83 widened.** zero-vtes is a development-time reference for card readings and effect sharing, under §5's rule of evidence.
2. **D-98 amended**, and D-104's "the waves go on by class" with it. The sweep goes one starter at a time. Classes follow from the
   starter's cards, and every T1 and T2 effect goes library-wide.
3. **"Shared" means printed by at least two library cards.**
4. **B before C.** The pilot is small and proves the tools before the harvest leans on them.

Not in D-125, answered on 19 Nov (RULINGS D-126): the finished decks' 41 entries read again in step A and their decks first in the harvest
(§4.2).

## 8. What stays and what stops
Stays: the gates, the egress review, the graded readings, registered predictions, D-104's release rule (a deck is released only
when 100 % playable), the crypt waves by class (D-108), handoffs to main for new bot lines.

Stops: the library's waves by class, ranked by copies in the V5 decks; a whole-card hand entry as the default; counting only the
308.

## 9. The docs budget (this round)
The standing pages stood at 172,997 of 173,000 and RULINGS at 64,908 of 65,000. Cut as history: D-98's list of wave 1's cards,
D-102's list of wave 2's (their specs keep both) and the BOARD line's list of the waves done. D-125, O-45 and the new BOARD line
still need room, so by D-101: RULINGS 65 → 66 KB and the standing pages 173 → 174 KB, the reason in `tools/doc-budget.sh`. After
the round: RULINGS 65,733, the standing pages 173,985, the bootstrap 49,442 of 50,000. A real cut of history is step A's
(§4.1, "the docs").

## 10. Unsure
- The sharing numbers use zero-vtes's vocabulary as a stand-in for ours. What they share is not always what one of our consumers
  can read unchanged. §4.3 registers what the dry run should show, and its count replaces the estimate.
- A consumer written for one card may need work before it serves the others. The harvest finds that out key by key.
- 73 of the 77 remaining cards and 78 of the 81 single-key cards could be read from their definitions; the rest are not counted.
- The ledger counts the six misreads as playable (appendix A). The pilot's deck holds one of them.
- zero-vtes moves fast: the review sheet pins the commit it read.
- Two chats work in `bot/`. Rounds stay one at a time.

## Appendix A — what each starter still lacks (cards, v0.6.234)
| starter | playable copies of 77 | cards left | shared-only | unique remainder | not read |
|---|---:|---:|---:|---:|---:|
| Banu Haqim | 68 | 4 | 4 | 0 | 0 |
| Ministry | 65 | 5 | 2 | 3 | 0 |
| Gangrel | 64 | 5 | 2 | 2 | 1 |
| Brujah | 62 | 5 | 4 | 1 | 0 |
| Salubri | 59 | 6 | 4 | 2 | 0 |
| Tzimisce | 58 | 9 | 8 | 1 | 0 |
| Path of Cathari | 57 | 4 | 1 | 3 | 0 |
| Lasombra | 56 | 6 | 2 | 3 | 1 |
| Ravnos | 51 | 8 | 6 | 2 | 0 |
| Path of Caine | 51 | 6 | 2 | 4 | 0 |
| Path of Power | 51 | 8 | 3 | 3 | 2 |
| Hecata | 50 | 7 | 4 | 3 | 0 |
| Path of Death | 45 | 10 | 6 | 4 | 0 |

A card in two starters is counted in both (83 rows for 77 cards). The playable copies include the six misreads of §4: 18 copies
(Banu Haqim 4, Path of Death 4, Ministry 4, Tzimisce 3, Path of Power 2, Salubri 1). Malkavian, Nosferatu, Tremere and Ventrue are
at 77 of 77; Toreador is at 76, its one unseen copy Creepshow Casino at its own table.

## Appendix B — how the numbers were made
Read-only scratch scripts on a clone of main; step A turns the first two into the ledger's library table and the sharing lint. A
fresh-context reviewer recounted them with its own code before this page was merged.
- **The library verdict.** `gen-deck-coverage.js`'s `judgeLib()` over every library entry of `elysium-cardfx.json`, every vampire
  offered as the crypt; playable = FULL + HANDLER. Run at `1f1804f` (29 Oct, 2,365 library entries then), `403f6cb` (3 Nov) and
  `6baf99b`. §1's series is without the discipline-line check, which did not exist before 14 Nov; §6 is with it. Of the compiler
  tier's +44 in the first five days, 8 entries came in with KRCG's v5 dump.
- **The vocabulary.** `cardfx-compile.js` run twice into scratch, with `cardfx-curated.json` and with an empty curated file; the
  first reproduces the committed file (0 of 2,391 library entries differ). A key is a key of `modes[].fx` or of `ref.fx`. The keys
  the bot reads are the coverage tool's own scan of `elysium-bot.js`. The 161 are the curated library entries with a compiled
  entry underneath.
- **The sharing measure.** The `Effect::` variants in zero-vtes's `crates/engine/src/cards/defs.rs` at its commit `d48b16f` (18 Nov;
  1,624 definitions read, 980 effect types by their direct tokens: 29 on 25 or more definitions, 286 on 2 to 24, 665 on one),
  joined to our cards by name. A card is shared-only when every effect type of its definition is on at least two definitions.
- **The estimate of reach (137).** Library cards outside the curated file that are not playable (the text check on) and whose
  definition shares at least one effect type found on 2 to 24 definitions with a hand-curated card, and uses no effect type
  beyond those and the 29 common ones (128 when only the playable hand-curated cards lend their types). It says how far the hand
  entries' effects reach, not how many cards will turn.
