# spec-card-sweep — finishing the V5 sweep by sharing (18 Nov 2026, on bot v0.6.234)

**Status:** kör — Johan, 18 Nov ("Vi kör, med dina rekommendationer för besluten"), recorded as RULINGS D-125. The method (§2) is
Johan's, in his words of 18 Nov; the measurements, the flow and the order are Claude's proposal, taken with §7's recommendations.
§4.2 answers the question he asked with his "kör" and waits for his word. This round changes no code: step A (§4) is the next
round. Measured on main `6baf99b`.

## 0. In one paragraph
We finish the V5 sweep one starter at a time, one card at a time, and every effect we meet is first asked one question: **who else
in the library prints this?** Common and shared effects go into the general tier and land on every library card that prints them.
Only the unique remainder is hand-curated. zero-vtes's card definitions are the answer sheet each card is checked against at
development time. Every round reports its numbers on the whole library, not only on the 308 starter cards.

## 1. Why change
| measured 18 Nov, read-only (appendix B) | |
|---|---|
| library cards the bot can statically play, of 2,391 | 565 (29 Oct) → 658 (3 Nov) → 679 (v0.6.234) |
| of them from the general tier (the compiler) | 487 → 531 → 527 |
| effect keys the bot reads / keys the compiler can produce | 200 / 42 |
| keys that exist only in hand entries | 145, of which 124 sit on a single card |
| hand-curated cards with such a single-card key that zero-vtes builds from shared effects only | 46 of 78 |
| library cards built only from effects the bot already handles (candidates, not a promise) | about 140 |
| starter cards left (inert + partial) | 77: 43 shared-only by the same measure, 30 with a unique effect, 4 not read |

The waves by class (D-98) moved the whole library for one week. Since 3 November what a wave learns goes into per-card hand
entries: `cardfx-curated.json` overlays whole entries (`cardfx-compile.js`, "hand"), so a hand-curated card gives the rest of the
library nothing, even when most of it is shared. The bot has the consumers; the library does not have the data. On the cards we
have reviewed by hand the entry adds a key the compiler missed on 143 of 161, and drops or replaces a key the compiler set on 51.

## 2. The method (Johan, 18 Nov)
For every printed effect of a card:
- **T1, a common denominator.** A key the compiler already extracts. We check that it fires on this card.
- **T2, a shared effect.** Printed by at least two library cards. It gets one key, one consumer and a general source, applied to
  the whole library in the same round: a compiler pattern where the wording is regular, otherwise one reviewed card list per effect.
- **T3, the unique remainder.** Hand-curated, and the hand entry carries the remainder only.

The rule: **no hand key before "who else prints this?" has an answer on file.** The V5 cards are reviewed one starter at a time,
one card at a time; what they teach is applied to the whole library, so that curation beyond V5 can start at T3.

After the cards: the remaining cards of each starter are hand-curated together with the official guide's strategy lines, so the
deck is judged fairly in play. When all starters are done the strategies are evaluated, by archetype and then by deck (step E,
outside this spec). A starter is published when Johan is satisfied with its tests (D-104 stands).

## 3. One starter, one round
Two rounds when the starter needs a new mechanism.
1. **The review sheet**, generated and never committed. Per card: KRCG's text, our compiled entry with each key's origin (compiler
   or hand), zero-vtes's definition with "printed by N cards" for each effect, their windows, the rulings count, every disagreement.
2. **Split** each effect into T1, T2 or T3. Claude proposes; doubts and reds go to Johan as today.
3. **Build** T1 and T2 for the whole library, T3 for the card.
4. **Grade** as HARNESS says (green, amber, red against KRCG's text and vtes-rulings). zero-vtes is a third witness.
5. **The strategy baseline**: the official guide's lines (D-112) and the pricing of cards the bot holds but never plays (unseen).
6. **Measure**: the sims, the registered predictions (D-93), the ledger and the library table regenerated.

A starter is done when every library row is playable, its crypt is modelled (D-108) and its guide check is listed.

## 4. The order
| step | what | done when |
|---|---|---|
| **A. Set up** (one round, no behaviour change) | The tools of §4.1, room in the doc budgets (§9), the harvest's dry run and the seven finished decks' review sheets (§4.2). | The tools run on main; the dry run has produced its counts against §4.3. |
| **B. The pilot: Banu Haqim** (one round) | The new flow end to end. Its 4 remaining cards are shared-only by §1's measure, most of them the maneuver and press grants with the rush cards; Hunting the Quarry and Night Terrors' strike (wave 6's riders) ride with them. | 77 of 77 copies playable, the library table moved, the flow's friction written down. |
| **C. The harvest** (one or two rounds) | The 145 hand-only keys asked "who else prints this?", the seven finished decks first if Johan confirms §4.2. The compiler's known misses (`bloodAdd` and `bloodAddTo` on 59 card-keys). The cross-check of what is already playable against zero-vtes, with the six misreads of the 18 Nov review. | Every hand-only key has its answer on file; the number of library cards turned playable is reported against §4.3. |
| **D. The other twelve starters** | Nearest first, re-ranked from the ledger after every starter: each round's shared effects close cards in other starters too. Appendix A has where they stand. | Each starter done as §3. |
| **E. The strategy evaluation** | After the sweep, outside this spec. | — |

### 4.1 Step A's tools
- **The library table.** `gen-card-ledger.js` grades every library card in `elysium-cardfx.json` with `gen-deck-coverage.js`'s own
  verdict (every vampire offered as the crypt, so reach hides no card) and prints it in `docs/CARDS.md` beside the starters' table,
  with the vocabulary counts: keys read, keys the compiler produces, hand-only keys, single-card keys without a sharing answer.
- **The review sheet.** A generator for one starter (§3.1). It reads zero-vtes from a checkout beside the tools, by a flag, and
  names the commit it read; its output is scratch, like a series.
- **The sharing register and its lint.** Every key that exists only in hand entries carries an answer: unique, or shared with the
  cards that print it. `test-cardfx.js` fails on a hand-only key without one.
- **Merging hand entries.** `cardfx-compile.js` lets a curated entry add to the compiled entry instead of replacing it, opt-in per
  entry, so that a hand entry can carry the remainder only. An entry that does not opt in compiles byte for byte as today.
- **The dry run.** For each hand-only key, the candidate cards (zero-vtes's sharing index and a text search) compiled in scratch,
  and the static count of library cards that would turn playable. Nothing ships from it.

### 4.2 The finished decks (Johan, 18 Nov: should steps 1 and 2 be checked again for the cards already done?)
Claude's answer, for Johan to confirm: yes, and they come first in the harvest, because their consumers are the best proven (the
four starters sat in 408 of the ledger's sim matches each). The five finished starters with `hacking` and `sewer` hold 104
library cards:
- **63 hand entries.** 55 of the 124 single-card keys sit on them, and zero-vtes builds 20 of those cards from shared effects only
  (Chantry's `rescueTorpor`, The Barrens' `handCycle`, Magic of the Smith's `fetchEquip`, Misdirection's `lockMinion` …). Each gets
  the T2 question; a shared one goes library-wide.
- **41 compiled entries nobody has reviewed by hand.** 37 have a zero-vtes definition: the review sheet checks them at once, and a
  disagreement becomes a review item.

The guard: the seven decks' compiled entries stay byte for byte unless a reading is ruled wrong (a rules correction, with its own
test), and the 240 is IDENTICAL for a round that only gives other cards their data (CLAUDE.md, "Gates").

### 4.3 Predictions for step A's counts (registered before the tools exist; D-93, L-94)
- The dry run turns **at least 60** library cards statically playable with no new bot code. Falsifier: fewer than 25, and then the
  sharing estimate was the stand-in's artefact and step C shrinks to the cross-check.
- Of the 20 finished-deck cards zero-vtes builds from shared effects only, **at least 12** have their single-card key's effect
  printed by another library card in KRCG's text. Falsifier: fewer than 6, and then zero-vtes's sharing is no guide to ours.
- Of the 37 never-reviewed compiled entries, **between 2 and 10** carry a reading KRCG's text contradicts. Falsifiers: none (the
  compiler's reading of played cards is cleaner than §1 suggests), or more than 10.

The pilot's and each starter's predictions are registered in their own rounds, before the build.

## 5. zero-vtes: what we use and what we do not
Used at development time, read beside the tools like `vtes.json` and never committed:
- **the card definitions**: the review sheet's answer column and the "printed by N cards" index;
- **the window matrix**: when a card may be played, as a check on our entry;
- **the rules digest and the rulings ledger**: the first stop when a mechanism is built or a reading is disputed.

The rule of evidence: **KRCG's text and the rulings decide, zero-vtes proposes, our compiler is the second opinion.** A
disagreement becomes a review item and is never fixed automatically in either direction.

Not used: at runtime, as copied code, or as files in git. zero-vtes (MIT, Lionel Panhaleux) is credited in the README with the
licence, when that is settled. `specs/spec-cardfx-sweep-sources-2026-09-25.md` stays the source mapping for KRCG, vtes-rulings and
vtes-skill; this section adds the fourth source.

## 6. What every round reports
- **the starter**: playable copies of 77;
- **the library**: playable, partial, data nobody reads, no data, masters played blind (609 / 185 / 722 / 468 / 407 today, with the
  ledger's discipline-line check);
- **the vocabulary**: hand-only keys (145 today) and single-card keys without a sharing answer (124 today);
- **the hand entries written this round** and how many keys each carries. The target is the remainder only.

The library numbers are static readiness: every mode has a reader. Only a starter is proven in play, because only a deck seats its
cards in the sim.

## 7. The decisions (taken 18 Nov as recommended; RULINGS D-125)
1. **D-83 widened.** zero-vtes is a development-time reference for card readings and effect sharing, under §5's rule of evidence.
2. **D-98 amended.** The sweep goes one starter at a time. Classes follow from the starter's cards, and every T1 and T2 effect goes
   library-wide.
3. **"Shared" means printed by at least two library cards.**
4. **B before C.** The pilot is small and proves the tools before the harvest leans on them.

Open, not in D-125: the finished decks first in the harvest (§4.2), Claude's answer to Johan's question of 18 Nov.

## 8. What stays and what stops
Stays: the gates, the egress review, the graded readings, registered predictions, D-104, the crypt waves (D-108), handoffs to main
for new bot lines.

Stops: ranking waves by copies in the V5 decks, a whole-card hand entry as the default, counting only the 308.

## 9. The docs budget (this round)
The standing pages stood at 172,997 of 173,000 and RULINGS at 64,908 of 65,000. Cut as history: D-98's list of wave 1's cards and
the BOARD line's list of the waves done. D-125 and the new BOARD line still need room, so by D-101: RULINGS 65 → 66 KB and the
standing pages 173 → 174 KB, the reason in `tools/doc-budget.sh`. After the round: RULINGS 65,469, the standing pages 173,861, the
bootstrap 49,583 of 50,000. A real cut of history is step A's ("room in the doc budgets").

## 10. Unsure
- The sharing numbers use zero-vtes's vocabulary as a stand-in for ours. What they share is not always what one of our consumers
  can read unchanged. §4.3 registers what the dry run should show, and its count replaces the estimate.
- A consumer written for one card may need work before it serves the others. The harvest finds that out key by key.
- 73 of the 77 remaining cards and 78 of the 81 single-key cards could be read from their definitions; the rest are not counted.
- zero-vtes moves fast. The review sheet pins the commit it read.
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

A card in two starters is counted in both. Malkavian, Nosferatu, Tremere and Ventrue are at 77 of 77; Toreador is at 76, its one
unseen copy Creepshow Casino at its own table.

## Appendix B — how the numbers were made
Read-only scratch scripts on a clone of main; step A turns the first two into the ledger's library table and the sharing lint.
- **The library verdict.** `gen-deck-coverage.js`'s `judgeLib()` over every library card of `elysium-cardfx.json`, every vampire
  offered as the crypt. Run at `1f1804f` (29 Oct, 2,365 library entries then), `403f6cb` (3 Nov) and `6baf99b`. §1's series is
  without the discipline-line check, which did not exist before 14 Nov; §6 is with it.
- **The vocabulary.** `cardfx-compile.js` run twice into scratch, with `cardfx-curated.json` and with an empty curated file. The
  recompile reproduces the committed file (0 of 2,391 library entries differ, the note text not compared). The keys the bot reads
  are the coverage tool's own scan of `elysium-bot.js`.
- **The sharing measure.** The `Effect::` variants in zero-vtes's `crates/engine/src/cards/defs.rs` as checked out on 18 Nov (1,624
  definitions read, 980 effect types: 29 on 25 or more cards, 286 on 2 to 24, 665 on one), joined to our cards by name.
