# spec-card-sweep — finishing the V5 sweep by sharing (18 Nov 2026, on bot v0.6.234)

**Status:** kör — Johan, 18 Nov ("Vi kör, med dina rekommendationer för besluten"), on the proposal this page records: the method of
§2, the flow, the order and §7's four decisions (RULINGS D-125). §4.2 answers a question he asked with his "kör"; he took
its answer on 19 Nov (RULINGS D-126). On 19 Nov he answered the question about zero-vtes's maintainer (§5). The page's own round changed no
code. Measured on main `6baf99b`. On 20 Nov Johan ruled the focus, exactness first, and a new order after B: the library by
effect, then the starters' remainder (§11, RULINGS D-130).

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

**Step A2** (19 Nov, no bot change) built the rest: the review sheet (`gen-review-sheet.js`, scratch output, a self-test in CI), the
dry run and the seven decks' readings (§4.3, observed), the merge's design (§4.4) and the docs. Where it differs from §4.1:
- the sample is 16 cards (§4.3 says when it was set), and all 41 of §4.2 have a definition;
- §4.1's "the keys are added in a scratch copy" counted only the keys that carry a whole mode (C); the cards a consumer must be
  made general for (G) or that need a rider key (R) are counted beside it, since they are most of the harvest;
- the debt stays reported and the register stays on fx keys (§4.3, "What it changes");
- the ledger's "what a crypt wave would build" stays as worded: D-108 keeps the crypt's waves by class (§3);
- the room: the bootstrap's from STATUS (it drops "What v0.6.234 did" and its BOARD summary) and from the root `CLAUDE.md`'s own
  section (the dump's history), which pay for the zero-vtes line and the finished decks' BOARD line; the standing pages' by D-101
  (HARNESS 8.5 KB, HOWTO 23 KB, the total 179 KB; `tools/doc-budget.sh`): 1.4 KB under the total and 0.95 KB under RULINGS.

**The finished decks' round** (19 Nov, bot v0.6.235; RULINGS D-127, Johan's "kör" on the four recommendations of A2) built
§4.3's seven live reds and the 19 Nov egress review's two faults: cardfx v1.9.12 tags the condition sentences (onlyBleed 43
cards, notBleed 3, onlyPredatorActs 1, oncePerUnlock 2, pressDir 31, noReplace 42), the bot reads each where it plays the card,
my own rescue and leaving torpor are undirected, and a typed 'no' answers by the quick phrase's rule. In v0.6.235's 240 each red
reads 0 (Bonding's stealth 194 plays, all in a bleed; Instinctive Reaction 164, all against my predator's minion; On the Qui Vive
1,014, none a second by one minion; Mirror Walk's 294 replacements held to the discard phase; Apportation no press to end); the
sewer smoke shows Forgotten Labyrinth's (4 in a bleed on v0.6.234, 0 now). Where it differs from §4.3:
- the tags are library-wide (the compiler reads the sentence), not the seven decks' cards only, with the narrower bleed forms ('against
  you', 'directed at you', 'by a ready vampire other than the acting minion'), 'As [x] above' and a type segment's line (Donate) after
  the egress review; Protected District ('... or during the polling step') stays untagged, and so do the variants the patterns miss
  (the review's list): Smoke and Mirrors and Beast Meld [ANI][PRO] (not in a bleed or a political action; as a non-bleed action is
  announced), Hag's Wrinkles and The Guruhi Are the Land (an equip; a bleed, hunt or equip action), Dirty Little Secrets and Deal with
  the Devil, five press directions (Fear of the Void Below, Qetu the Evil Doer, Meat Hook, Talbot's Chainsaw, Highway Haven: RV),
  Sonar ('until after the current turn'), Save Face (a press for another minion): C's;
- every wake spend now asks the vampire's own wake: the bounce's and the vote's took the vampire-blind one, and the bounce's finder
  could pick a body it then could not wake (with the once-per-unlock rule it would have re-asked the window for the same pick);
- a held replacement is drawn at the first draw after its moment (the unlock phase's with the master phase's, as every owed draw;
  the discard phase draws its own at once); masters and action cards hold theirs too, events are not played by the bot;
- the five latent reds and seven ambers did not ride (no consumer the round touched reaches them): C's.

## 0. In one paragraph
We finish the V5 sweep one starter at a time, one card at a time, and every effect we meet is first asked one question: **who else
in the library prints this?** Common and shared effects go into the general tier and land on every library card that prints them.
Only the unique remainder is hand-curated. zero-vtes's card definitions are the answer sheet each card is checked against at
development time. Every round reports its numbers on the whole library, not only on the 308 starter cards. Since 20 Nov the
order after B is the library by effect, then the starters' remainder (§11).

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
*Since 20 Nov (§11, D-130) this flow is step D's, the starters' remainder; step C goes by family.*
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
| **A. Set up** (one round, no behaviour change) | §4.1: the tools, the dry run, the docs, the merge's design. The seven finished decks' review sheets too (§4.2, D-126). | The tools run in the round's gates; the dry run's counts stand in the PR and in §4.3; Johan has the merge's design. |
| **B. The pilot: Banu Haqim** (one round) | The new flow end to end, the merge of hand entries built first (§4.1, §4.4; Johan's "kör" 19 Nov, D-127). Its 4 remaining cards are shared-only by §1's measure, most of them the maneuver and press grants with the rush cards; Hunting the Quarry and Night Terrors' strike (wave 6's riders) ride with them. Priority Contract (4 copies) is one of the six misreads below and is read again here. | 77 of 77 copies playable, no disagreement open on its sheet, the library table moved, the flow's friction written down. |
| **C. The harvest** (one or two rounds) | The 145 hand-only keys asked "who else prints this?"; the seven finished decks first (§4.2, D-126). The compiler's known misses (`bloodAdd` and `bloodAddTo` on 59 card-keys). The cross-check of what is already playable against zero-vtes, with the five other misreads. | No row of the sharing register is `backlog`; the number of library cards turned playable is reported. |
| **D. The other twelve starters** | Nearest first, re-ranked from the ledger after every starter: each round's shared effects close cards in other starters too. Appendix A has where they stand. | Each starter done as §3. |
| **E. The strategy evaluation** | After the sweep, outside this page. | — |

Rows C and D are amended by §11.3 (20 Nov, D-130): C is the library by effect, D the starters' remainder.

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
  it (since 20 Nov a family's round answers its keys, and D the keys beyond the horizon: §11.3). `test-cardfx.js` fails on a hand-only key with no row, and on a `backlog` row A did not seed: a new hand key comes with its
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

Designed in A; Johan's "kör" on 19 Nov (RULINGS D-127); built at the start of B (the pilot writes the first remainder with it):
- **Merging hand entries.** `cardfx-compile.js` lets a curated entry add to the compiled entry instead of replacing it, opt-in per
  entry, so that a hand entry can carry the remainder only. An entry that does not opt in compiles byte for byte as today, and A
  opts none in: the committed `elysium-cardfx.json` does not change. The design answers how a hand mode meets a compiled mode; how
  a merged entry drops a key the compiler set wrongly (51 of the 161 hand entries do so today) or overrides a value or a level it
  set; which `src` it carries, since the ledger's tier and the hand-only count read it; and whether the cost rule's inheritance
  applies (CLAUDE.md). The design is §4.4.

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

**Registered by A2 before it measured (19 Nov).** The dry run's sample, by §4.1's rule (the finished decks' hand entries that
carry a single-card key and that zero-vtes builds from shared effects only), is **16 cards**, not 20: the review sheet's index reads
an effect with its variant (one layer of 409 was one effect; each variant is its own now), reads what an ability asks (The Barrens'
discard is a term, not an effect), counts the in-play abilities and the cards a macro builds. The 18 Nov count read the modes only.
The 16: Change of Target, Chantry, Creepshow Casino, Elysium: The Palace of Versailles, Fame, Haven Uncovered, Magic of the Smith,
Misdirection, Perfectionist, Protected District, Rebel, Scalpel Tongue, Spying Mission, The Barrens, Toreador Justicar, Underbridge
Stray. The thresholds stay as registered: prediction 1 needs at least 15 cards turned playable, counted only where the keys added
carry the candidate's whole printed mode (a key on a card it half reads is a misread, not a gain); prediction 2 at least 12 of the
sample's cards (12 of 16). Prediction 3 reads the 41 entries of §4.2. When it was set (the egress review read the times): a sample
of 17 was registered first (commit 9cc495b); the scratch dossier of every candidate with KRCG's text and our verdicts was written 31
seconds later; the 16, with the whole-mode rule for prediction 1, came two minutes after that (951e6d3). Both changes are stricter or
neutral (a card out; a gain counted only when whole), and no verdict below moves with them.

**Observed (19 Nov, A2's dry run and the seven decks' readings; scratch, nothing shipped).** Each candidate a sample card's chosen
effect found was read against KRCG's text and graded (ours, for this run): **C**, carried: the same effect on the same play path,
and the key at the text's level and value carries the whole printed mode as its consumer reads it today; **G**, generalize: the
same effect on the same play path, but the consumer needs a parameter or a check it skips today; **R**, rider: the same effect on
the same play path, but the mode prints more that no key carries; **O**, another path: the effect is printed but played another way
(an action card where ours is a master, an ally's own ability, a trigger of another kind); **N**: the shared definition is only a
building block of the candidate (a lock paid as a cost, an ally's life gain). Prediction 2 counts C, G and R; prediction 1 counts
the C whose verdict turns playable.

| card | its single-card key(s) | the effect they model (Claude's choice) | cand. | C | G | R | O | N | turned |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Change of Target | `endAction` | the blocked minion ends its own action | 3 | 0 | 0 | 1 | 2 | 0 | 0 |
| Chantry | `rescueTorpor` | a card in play moves a clan vampire from torpor to ready | 9 | 0 | 1 | 0 | 7 | 1 | 0 |
| Creepshow Casino | `lockStealthAt` | none: it times the shared `lockStealth` (noted, not counted) | — | | | | | | |
| Elysium: The Palace of Versailles | `votesEach` | a lock in polling gives each matching vampire of mine +1 vote | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fame | `fameOnTarget` | a vampire's controller burns pool when it goes to torpor | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| Haven Uncovered | `rushGrant` | a master on a minion lets vampires enter combat with it as a +1 stealth action | 42 | 0 | 3 | 2 | 36 | 1 | 0 |
| Magic of the Smith | `fetchEquip` | search the library for an equipment and equip it | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| Misdirection | `lockMinion` | a master locks a minion | 23 | 0 | 0 | 1 | 14 | 8 | 0 |
| Perfectionist | `bloodAfterCleanAction` | the host gains 1 blood after a successful action no reaction answered | 30 | 0 | 0 | 0 | 17 | 13 | 0 |
| Protected District | `votesBonus` | a reaction in polling gives +N votes against | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Rebel | `rebelBlood` | the host gains 1 blood when it blocks a titled vampire or a political action | 30 | 0 | 0 | 0 | 17 | 13 | 0 |
| Scalpel Tongue | `abstainVoter`, `voterBloodBurn` | the acting vampire makes a voter abstain in polling | 6 | 0 | 3 | 1 | 2 | 0 | 0 |
| Spying Mission | `bleedNullify`, `bleedBank` | the acting vampire cancels its own bleed and banks +2 bleed against that Methuselah | 19 | 0 | 0 | 0 | 2 | 17 | 0 |
| The Barrens | `handCycle` | lock a card in play to discard a card and draw | 9 | 0 | 0 | 2 | 0 | 7 | 0 |
| Toreador Justicar | `titleCard`, `votesPerReady` | a title referendum: the title on a chosen vampire, +1 vote for each ready vampire of the clan | 37 | 7 | 14 | 10 | 6 | 0 | 7 |
| Underbridge Stray | its four ally keys | a recruit whose life follows the level; an ally pays life for a press; an ally burns itself to unlock a minion | 7 | 0 | 0 | 3 | 4 | 0 | 0 |
| **all** | | | **220** | **8** | **22** | **20** | **110** | **60** | **7** |

Perfectionist and Rebel are offered the same 30 cards; each counts them with its own sample card. The cards behind the letters:
- **C**: the seven other justicars zero-vtes defines (Malkavian, Banu Haqim, Lasombra, Nosferatu, Brujah, Tremere and Ventrue
  Justicar: NAME-ONLY to FULL with Toreador Justicar's two keys and its title fields), and Power Structure (each Lasombra gets +1
  vote; the auto entry reads a flat +1, a misread the ledger counts FULL before and after).
- **G**: Warsaw Station (a burn, not a lock and a payment; it carries a hand key of its own, `warsawRescue`, for Chantry's effect);
  Shakar: the Hunt, Hand Contract and Dirty Contract (only a chosen vampire, or a Black Hand one, may enter combat); Wrong and
  Crosswise [DEM] (the consumer skips the mode's discipline and the blood cost); Telepathic Vote Counting [AUS], Knotted Cord and
  Quicksilver Contemplation (an abstain without the lock, two on a younger vampire only); six Praxis Seizures and eight Crusades
  (the title goes to the acting vampire).
- **R**: Mirror's Visage [chi] (it locks the blocker too, and the vampire takes no more actions this turn); Priority Contract and
  Haqim's Law: Judgment; Fear of Mekhet; Deadly Secrets [OBF]; Double Spiral Corporation and The Admonitions; the eight Crusades
  that unlock their archbishop, Cardinal Benediction and Overseer; three allies whose life follows the level and who have abilities
  of their own.

Turned playable, by the ledger's verdict on a scratch copy of the library with the C keys added (every vampire as the crypt, the
discipline-line check on; no other verdict moved): **7**, and **8** with Gangrel Justicar, which KRCG's text shows and zero-vtes
does not define. The library's playable entries: 609 → 616 (617).

**The verdicts.**
1. **Prediction 1: 7, registered at least 15. Its middle band: the harvest is worth its rounds and smaller than estimated.** Its
   size sits in G, and one family carries most of it: with one generalization (a title referendum whose title goes to the acting
   vampire), 14 cards turn playable by zero-vtes's list and 26 by KRCG's text (14 Praxis Seizures and 12 Crusades that print
   nothing more); 24 more need a rider key (11 Praxis Seizures raise a clan's capacity, 10 Crusades unlock their archbishop,
   Crusade: Aragon names Lucita, and Praxis Seizure: Istanbul and Venice give a clan +1 vote and lock that clan when the prince is
   not of it).
2. **Prediction 2: 10 of 16, registered at least 12. Its middle band: a guide that needs the text search beside it.** The 10 are
   the cards with a C, G or R; Creepshow Casino, Fame, Magic of the Smith, Perfectionist, Rebel and Spying Mission have none.
   Counting the effect on any play path (O too) gives 15. The text search is needed beside it: zero-vtes, built set by set,
   defines 7 of the 8 other justicars, 6 of the 14 plain Praxis Seizures and 8 of the 12 plain Crusades.
3. **Prediction 3: 12 of the 41, registered between 2 and 10. Its third band: the finished decks need a round of their own before
   the harvest.** All 41 have a zero-vtes definition (the sheet reads more than the 18 Nov count did). Red here is a reading that
   lets the bot do what the text forbids (a gate the text prints and the entry lacks: HARNESS's five layers) or that states a value
   the text contradicts; a missing benefit is amber, with no note since the auto tier writes none:
   - **seven red that the bot can break today**, five of them seen in the 240 (v0.6.234 on client v2.6.177; the action read
     from the blockers' own rows): Bonding ("Only usable during a bleed action": its [DOM] stealth is offered on any action, and 58
     of its 247 stealth plays were on actions that are not bleeds), On the Qui Vive (one per minion between its unlock phases: a
     second wake 108 times in 1,073), Mirror Walk (do not replace until the next discard phase: the bot draws at the action's end,
     on all 310 plays), Apportation ([tha] presses only to continue: 12 presses to end), Instinctive Reaction (only when a minion
     of my predator acts: 98 of its 199 blocks were against another seat's minion), Forgotten Labyrinth (not usable during a
     bleed: its finder has no such check; the sewer deck is not in the 240) and Wake with Evening's Freshness (do not replace until
     the next unlock phase: the bot's draws wait for its own turn, except after a vote-discard boost on another seat's referendum,
     which the Ventrue deck can spend: Alexa Draper; in the 240, 14 such boosts and none with a Wake unreplaced);
   - **five red, latent** (no play path reaches the contradiction with the decks as built): Cloak the Gathering ([OBF] is played by
     a vampire other than the acting one; the finder's tie keeps [obf]), Lost in Crowds (not with Into Thin Air, which no deck
     holds), Kevlar Vest (2 only against guns; the consumer prevents 1 against everything), Night Moves (the bleed is capped at 1
     pool; nothing in the sewer deck bleeds for more), Sport Bike (one vehicle per minion; the equip guard is one per name, and
     the Tremere deck holds no other vehicle);
   - **seven amber with no note**: Faceless Night ([OBF] locks the failed blockers), Precognition and Spirit's Touch (the prevent
     and the maneuver in the combat after the block), .44 Magnum (its maneuver: BOARD, the weapon's maneuver), Raven Spy ([ANI]'s
     2 life), The Warrens (+1 intercept when titled), Aire of Elation (+1 for a Toreador: every play in the Toreador starter
     bleeds 1 short);
   - **22 green**, Dodge among them (its "do not replace until after combat" is met by the bot's deferred draws, as Skidmark's
     crypt entry says) and Immortal Grapple ([POT]'s close range next round is built).

**Found on the way** (outside the 41): Wrong and Crosswise and Monastery of Shadows are FULL by key name only, as Priority Contract
(one of §4's six misreads) is: no play path that would play them reads their keys (a reaction's votes, a location's stealth with no
lock, a master's pool gain with no lock). The library table's playable count is blind to the card's type, as §6 warns.

**What it changes** (Claude's proposals; BOARD): the finished decks' round comes before B, with the seven live reds and the two rules
faults the 19 Nov egress review found; in C the unit of sharing is a consumer, not a key's name (a T2 effect is a consumer made
general, with a card list confirmed by KRCG's text, found by the text search with zero-vtes beside it); the register stays on fx
keys (the title family shares through its `ref.fx` keys) and its debt stays reported, not gated, until C writes rows to gate.

The pilot's and each starter's predictions are registered in their own rounds, before the build.

### 4.4 The merge of hand entries (designed in A2, "kör" 19 Nov: D-127; built at the start of B)
**Built** (20 Nov 2026: cardfx compiler v1.10.0, PR #92; no bot or cardfx byte changed, nothing opts in). Where the design below
was silent the build chose (the header of the compiler's `mergeHand` lists every case that fails the compile):
- a level is `at` and `when`, compared exactly; `nth` counts from 1 in the compiled order of its level; a mode at an `at` the
  compiled entry lacks altogether is added and keeps its `at` (null: the base level);
- an `nth` or a `drop` that names no compiled mode, `add` with `nth` or `drop`, a dropped mode with more than its level, `modes`
  that are not a list, a merge with no compiled entry under its name, `merge` on a crypt entry and a layer that writes `src`,
  `merged` or `handKeys` each fail the compile, and the command line then writes nothing;
- a `null` that finds nothing to delete is not written, and the report says so; on a mode the layer adds every `null` is such a
  one; a merged mode whose every key is deleted keeps `fx: {}` (drop the mode instead); an emptied `req`, `ref` or `ref.fx` goes;
- `ref` merges key by key as `req` does: `ref.fx` as a mode's `fx`, `ref.tags` and `ref.pool` take the curated value whole;
- the kept numeric cost stands in the report's inherited list; an X in the X list and on the entry's merge line;
- the ledger's census keeps its three tiers (a merged entry counts as curated); a row's tier reads `curated, merged`.

After the egress review (20 Nov), the build's reading of "only where the target is plain", each a compile failure:
- **the near miss**: a curated mode without `"add": true` that meets no compiled mode by `at` and `when` while the compiled
  entry has a mode at its `at` (a forgotten `when`, `when: null`, another `when`); the message names the compiled `when` values
  there: name the `when`, or say `add`. A `when` is changed or deleted by dropping the mode and adding it again;
- **no half opt-in**: a `merge` that is present and not `true`, and a mode's `nth`, `add` or `drop` on an entry that does not
  opt in (none of the 213 curated entries carries one; as first built these were warnings);
- **an added mode carries `fx`**: a mode the layer adds without an `fx` object (`"fx": {}` is allowed), as every library
  mode has one.

The friction the pilot meets: a key the layer restates with the compiler's own value is in `handKeys`, so the register counts it
as the hand's (write the remainder only); and opting an existing hand entry in moves its compiler-given keys out of the hand-only
count, so a backlog key that sat only there is no longer hand-only and the register's gate asks for its row to move.

Today `cardfx-curated.json` replaces the compiled entry whole (`cardfx-compile.js`, the overlay), and the hand entry inherits only
the numeric cost, the discipline, clan and capacity requirements and the entry-level markers (`oot`, `anarchReq`, `zombie`,
`onlyDirected`, `frenzy`; since v1.9.12 the six condition tags, the egress review of v0.6.235). The merge lets a hand entry carry the remainder only.
- **Opt-in.** A curated library entry with `"merge": true` is laid over a copy of the compiled entry of the same card (for a key
  that is a printed variant, the printed name's entry); without it the overlay is today's, byte for byte. The crypt keeps
  whole-entry replacement (D-108's waves). A opts none in, so the committed `elysium-cardfx.json` does not change.
- **Modes meet by level, and only where the target is plain.** A curated mode merges into a compiled mode it names without doubt:
  the only compiled mode with its `at` (and its `when`, when either names one), or the one `"nth": n` names among them; a curated
  mode with `"add": true` is added after the compiled modes, in the curated order (mode order matters: a finder's tie keeps the
  first). Anything else fails the compile: a level with two compiled modes and no `nth` (Donate, The Eldest Are Kholo, Touch of
  Valeren, Vigilance), and two curated modes aimed at one compiled mode (18 hand entries hold two or more modes at one `at` and
  `when` today, among them Vessel, Blood Doll, Dreams of the Sphinx, Protected District, Wider View, Wasserschloss Anif and
  Toreador Grand Ball: each such mode says `nth` or `add`). A curated mode at a level the compiled entry lacks is added.
- **Values.** In a merged mode `fx` is the union and a key on both takes the curated value; a mode's own fields (`lock`, `phase`,
  `when`, `dir`, `onlyDirected` …) the same. `null` deletes: `"key": null` removes a key the compiler set wrongly (51 of the
  161 hand entries dropped one on 18 Nov, §1; the drop becomes visible in the entry). `"drop": true` on a curated mode deletes
  the compiled mode it names (a mode at a wrong level is dropped and re-added at the right one). Entry fields (`t`, `cost`,
  `persistent`, `unique`, `limited`, `title`, `votes` …) follow the same rule. `req`, at the entry and on a mode, merges key by
  key as `fx` does, so the compiled `disc`, `clan` and `capMin` stay unless the layer names them (today's overlay re-inherits
  them, `cardfx-compile.js`); `ref.fx` merges as a mode's `fx` does; the note is the curated one.
- **The cost rule holds unchanged.** A merged entry keeps the compiled numeric cost unless it names `cost` (an explicit curated cost
  wins, `"cost": {}` insists a card is free); an `X` cost leaves the merge and is reported, as today. The compile report lists
  each merged entry with what the layer changed.
- **`src` stays `'hand'`; the merge is marked beside it.** A merged entry is curated, and five readers say so by `src === 'hand'`:
  the bot (`elysium-bot.js`: a master's `curated` flag, which drives the decision's why text and the table's "uncurated — adjust
  if needed" note), `test-cardfx.js` (every master in the four starters is `src: 'hand'`), `gen-deck-coverage.js` (the badge),
  `gen-review-sheet.js` (the tier column and the dropped keys) and `cardfx-sharing.js` (the hand-only count). So the compiled entry
  carries `src: 'hand'`, `merged: true` and `handKeys` (the sorted fx keys, a mode's `fx` and `ref.fx`, the curated layer set).
  The register's hand-only count reads `handKeys` on a merged entry and every key on another hand entry; the ledger's tier
  (`gen-card-ledger.js`) shows `curated, merged`; the review sheet's origins read the layer. The bot reads `src` as today and
  neither new field: no bot byte changes.
- **The gate** (`test-cardfx.js`): a merged entry is the compiled one with the layer applied; `null`, `drop` and `add` do what they
  say; an unplain target fails the compile; `req` keeps the compiled subkeys; an entry that does not opt in compiles byte for
  byte; and the committed library is byte for byte the same while no entry opts in.

Opting an entry in is a reading change: it is graded as HARNESS says and, for a card of the seven finished decks, held to §4.2's
guard.

## 5. zero-vtes: what we use and what we do not
Used at development time, read from a checkout outside the repository and never committed:
- **the card definitions**: the review sheet's answer column and the "printed by N cards" index;
- **the window matrix**: when a card may be played, as a check on our entry;
- **the rules digest and the rulings ledger**: the first stop when a mechanism is built or a reading is disputed.

The rule of evidence: **KRCG's text and the rulings decide, zero-vtes proposes, our compiler is the second opinion.** A
disagreement becomes a review item and is never fixed automatically in either direction. What we commit is our own reading: a
pattern or a card list holds only cards each checked against KRCG's text, and no zero-vtes identifier or text.

Not used: at runtime, as copied code, or as files in git.

Since 20 Nov zero-vtes is also the map of the sweep's order: its definitions say which cards print an effect (§11.2). The pairing
of its effect types with our keys is not committed (§11.2 (4), §11.6).

The maintainer and the credit. The clean-up spec allowed zero-vtes as a third check "only after asking its maintainer"
(`specs/spec-cleanup-2026-10-20.md`, T3), and the repository does not show that this was done. Johan, 19 Nov: "Vi kan släppa nog
villkoret för Lionel kanske eftersom han har MIT-licens (dock ska vi ju ge honom credit såklart), men jag ska nog ändå skriva till
honom på Discord o ta upp att jag ska lägga till licens också ifall det är så att han mot förmodan skulle hitta något matnyttigt
hos oss för sin lösning också". These pages read his "nog … kanske" as the condition dropped (D-125): step A does not wait on it.
The credit is owed, and `bot/README.md` gives it from this round on. Claude's proposal, not ruled: when the repository has a
licence, the root README's credits name zero-vtes too; that README is main's file, so it goes as a handoff (BOARD, the V5 sweep).
`specs/spec-cardfx-sweep-sources-2026-09-25.md` stays the source mapping for KRCG, vtes-rulings and vtes-skill; this section adds
the fourth source.

**The maintainer's answer** (19 Nov, relayed by Johan): Lionel Panhaleux lets us mention and use zero-vtes as we wish and is glad
of the credit. He points to `https://mcp.krcg.org/`, an MCP server meant as a reference for LLMs (alpha) that will later test
rulings and decks with the engine and the bots, and offers the engine as a Rust component and the bots' open weights to anyone
who wants an offline version. Everything is alpha: the cards come in set by set, and the interfaces will change after a later
compaction, with no stability promised. What we take: the permission and the credit (D-125, `bot/README.md`). What we leave for now:
the engine and the weights (this section's "not used": nothing of zero-vtes runs with the bot; an offline engine would be Johan's
design question) and the MCP server (a tool a session may try; its answers are proposals under the rule of evidence above).

## 6. What every round reports
- **the starter**: playable copies of 77;
- **the library**: playable, partial, INERT (modes, none with a key a play path reads), NAME-ONLY (no modes), masters played blind (609 / 185 / 722 / 468 / 407 today, with the
  ledger's discipline-line check);
- **the vocabulary**: hand-only keys (145 today) and the register's `backlog` rows (145 when A has seeded it; 124 of the keys sit
  on a single entry);
- **the hand entries written this round** and how many keys each carries. The target is the remainder only.

The library numbers are static readiness: every mode has a reader. Only a starter is proven in play, because only a deck seats its
cards in the sim. A family's round of the library by effect reports more: §11.5.

## 7. The decisions (taken 18 Nov as recommended; RULINGS D-125)
1. **D-83 widened.** zero-vtes is a development-time reference for card readings and effect sharing, under §5's rule of evidence.
2. **D-98 amended**, and D-104's "the waves go on by class" with it. The sweep goes one starter at a time (amended 20 Nov: after B the library by effect, §11, D-130). Classes follow from the
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
- The counts of §11.4 use zero-vtes's vocabulary as a stand-in for ours: a family of ours need not be one of their types.
- The first reader changes how a human's stealth is counted at the table: a design question that goes to Johan first (§11.6).

## 11. Exactness first: the library by effect (Johan, 20 Nov 2026; RULINGS D-130)

**Status:** kör — Johan, 20 Nov ("Yes det låter superbra! Då kan vi gå vidare"), on the method as Claude had put it to him in
that morning's chat (§11.1): his own proposal with two refinements of Claude's, and Claude's answer to his question about the
format. §11.2 writes that method out; what it adds beyond the chat is Claude's design, marked (C), and goes to Johan with the
first reader's design (§11.6). It amends §3's flow and §4's
order after B. Everything this section does not name stands: §2's three tiers, §5's rule of evidence, the gates, the graded
readings, D-104's release rule, §4.2's guard on the finished decks. This round changes no code. Measured on main `77da0b7`
(bot v0.6.235) and a zero-vtes checkout at `05e812e` (19 Nov).

### 11.1 What was said: Johan's words and Claude's answers
- **The focus and the goal.** "då kör vi fokus på kortregelexaktheten att börja med helt enkelt med målsättning att bottarna ska
  kunna bedöma vad som händer när någon spelar kort".
- **The method**, as his question: should we just as well sweep the library from the card data zero-vtes already has first
  "och sedan handkurera det som är kvar och behövs per startlek?" Claude answered yes, with two refinements: by effect and not by
  card; their data as the map and the answer sheet, not as content.
- **The format**, as his next question: do we use their tagging and classifications "rakt av", or translate them into the format
  we have used ourselves? Claude answered that we translate.
- **His answer to both:** "Yes det låter superbra! Då kan vi gå vidare". This page reads it as his kör on the method and on the
  format as Claude had put them in the chat.
- Claude's reading, as he put it to Johan: §2's method of 18 Nov is not replaced; it is the same three tiers in a new order, the
  whole library first and the starters last.

### 11.2 The method
1. **The library first, effect by effect.** An effect family is one or a few of OUR keys. The first is `stealth` with
   `actStealth` (an action card's own stealth), `intercept` and `bleed`: the numbers of the block and of the bleed. Families are
   taken by reach: how many of zero-vtes's definitions print the effect; among equals, the one more starter cards print (C). A family is done on the WHOLE library in its round, the entries with
   no play path included: a card the bots cannot play is still a card somebody plays against them.
2. **zero-vtes is the map and the answer sheet.** Its definitions say which cards print an effect, at which level and with which
   value: that is where we look and what we compare with. What enters `elysium-cardfx.json` is our own reading of KRCG's text: a
   compiler pattern where the wording is regular, a reviewed card list otherwise, the curated remainder for what is unique (§2,
   §5). Nothing of theirs is copied. Three reasons, with the day's numbers: exactness (their own table of when a card may be
   played carries a hand-review mark on 893 of its 1,890 rows, and 161 of those were corrected); coverage (500 of our 2,391
   library entries have no definition there, and a pattern over KRCG's text reads those too); independence (their format moves
   daily, and D-125 keeps it out of git and out of the bundle).
3. **Our format stays; theirs is translated, never adopted.** Their classification is built for an engine that executes every
   rule; ours for a bot that judges and talks, and it is what the bot, the suites and the client's canary read. Their effect
   types are a development-time lookup. The translation is not always one to one: several of their types may be one key of ours
   and a condition tag; a concept they model that we lack and the bot needs gets a key of ours, named by us and read from KRCG's
   text; what the bot does not need is not translated.
4. **Where their names may stand.** In no card data, not in the bot, not in the bundle, not in a pattern or a card list (§5). They
   stand in two places today, both development material: the tool that reads their file (`gen-review-sheet.js`: its parser, and
   a few of their identifiers in its comments; its self-test invents its cards and effect names and keeps their structural
   words), and appendix B of this page, which names the enum their effects belong to. A family's pairing, which of their effect
   types answer our key, will be given to the family's tool when it runs and printed on its scratch sheet (no tool takes one
   yet: the first family's round builds it); the round's report says it in our words. Whether a pairing table may be committed inside a development tool is open (§11.6).
5. **Exact.** An effect on a card at a level is *exact* when two independent readings agree on it: ours, read from KRCG's text by
   a pattern or by hand, and zero-vtes's definition. Or, (C), when a graded read says green (HARNESS's charter: KRCG's text and
   the rulings, a fresh read-only agent). A disagreement is settled by neither side's data: the card is read against KRCG's text and
   the rulings, and the outcome is our entry corrected, their reading noted as the wrong one, or a difference of modelling
   explained on the sheet. A card zero-vtes does not define has one witness, so its effect is exact only by a graded read (C).
6. **The reader, in the same round.** With a family's data exact, the bot learns to read that effect when someone plays the
   card. The play line carries the card and, when the chooser asked, the level (PROTOCOL §12: `[obf]` inferior, `[OBF]`
   superior) and the aim; the bot looks the mode up and knows the effect at once. A human's own number still wins. The reader
   acts only on exact effects, and any other card is read as today, from their lines and their numbers (C: part of a proposal
   of that morning that he did not take up as such). Revelations, read with its level from the play line, is the precedent, and
   the CHANGELOG's entry for #90 lists what else the bots read by name today.
7. **Then the starters' remainder.** What is left is the effects that exist on one card. They are hand-curated only where a
   starter needs them, with the starter's strategy baseline (§3.5, D-112). §3's sheet, grading and done-condition stand for
   that part.

### 11.3 The order (amends §4's rows C and D; A, B and E stand)
| step | what | done when |
|---|---|---|
| **B. The pilot: Banu Haqim** | Unchanged (D-127): the merge of hand entries first (§4.4), then the pilot. The merge is what lets a hand entry keep its remainder only, so a family's keys reach the hand-curated cards. | As §4. |
| **C. The library by effect** (was: the harvest) | One family a round, two when it needs a new mechanism (as §3): the cross-check of the whole library for the family, every disagreement read against KRCG's text, our entries corrected, the reader. The harvest's items ride in it: a hand-only key is asked "who else prints this?" when its family comes up, the seven finished decks' keys first within a family (Claude's reading of D-126 under this order, §11.6); the compiler's known misses; the five other misreads; §4.3's latent reds and ambers; the condition sentences' untagged variants. A `backlog` key whose family lies beyond the horizon is answered in D, with the starter that holds its card, or when Johan sends C on. | §11.4's horizon is reached. Every disagreement on a finished family's sheet is corrected, noted or explained. The sharing register has no `backlog` row for a key of a finished family. |
| **D. The starters' remainder** (was: the other twelve starters) | Nearest first, re-ranked from the ledger after every starter: the unique effects a starter needs, and its strategy baseline. | Each starter done as §3. |

### 11.4 What the numbers say, and the horizon (measured 20 Nov, read-only; appendix C)
| | |
|---|---|
| zero-vtes's library definitions | 1,890 (1,717 rows in its windows table on 18 Nov) |
| our library entries with a definition there, of 2,391 | 1,891 (79 %); 500 have none |
| cards of the 18 starters with a definition, of 308 | 308 |
| effect types in the definitions, as `gen-review-sheet.js` counts a type | 1,543: 44 on 25 or more definitions, 431 on 2 to 24, 1,068 on one |
| of those 1,891: entries the 50 most used effect types touch · describe in full | 1,620 (86 %) · 375 (20 %) |
| of those 1,891: entries the 105 types on 8 or more definitions describe in full | 542 (29 %) |
| of those 1,891: entries all 475 shared effect types touch · describe in full | 1,803 (95 %) · 1,054 (56 %) |
| the starters' 77 inert or partial cards described in full by shared effect types | 43 (§1's measure of 18 Nov: 43) |

So, for the cards zero-vtes defines, a sweep by effect gives nearly every card a part of its reading (95 %) and a little over
half of them all of it (56 %). Of our whole library that is 75 % and 44 %: the 500 entries with no definition are read by our
patterns alone. The rest carries an effect that exists on one card: hand work, done where a starter needs it. That is Johan's
split.

Appendix B counted 980 effect types on 18 Nov (the count behind §1's measures) by another count: an effect's name only, over
the 1,624 definitions it read. The tool's count splits an effect by its first argument when that is a variant and counts what
an ability asks as its terms; on 18 Nov's data it gives 1,411 types over 1,717 definitions. So the count explains most of the
distance from 980 to 1,543, and two days of new definitions the rest.

**The horizon.** C runs through the effect types on 25 or more definitions (44 today: they touch 1,602 of the 1,891 entries,
85 %, and describe 332 in full, 18 %), grouped into our families as each round names them. Then the numbers are measured again and Johan says whether the sweep goes on by effect or turns to D.

### 11.5 What a family's round reports (adds to §6)
- **the family**: our keys, and the pairing in our words;
- **the library**: entries where either reading carries the effect; of them exact by agreement, exact by a graded read, corrected
  (ours was wrong), noted (theirs was wrong), explained (modelled differently), and single-witness (no definition, not graded);
- **the starters**: the same counts for the cards of the 18 starters;
- **the reader**: what the bots now read of a human's play, and its section tests;
- §6's own lines, unchanged.

### 11.6 Open
- **The pairing table** (RULINGS O-48): may a development tool commit a table that pairs their effect
  types with our keys? Without one a fresh session rebuilds the pairing every round and two runs need not agree. Claude's
  answer: yes, in a development tool only, never in the bundle or in the card data. Until Johan says so the pairing will be a
  run-time argument of the family's tool.
- **D-126 under the new order.** It put the finished decks first in the harvest; §11.3 reads that as first within a family.
  Claude's reading, for Johan to confirm.
- **How the bundle tells the bot that an effect is exact** (a field of the entry, or a list beside the library): the first
  family's round designs it. The canary's cardfx checks are main's: a shape they read differently is a handoff first.
- **The first reader's design** goes to Johan before it is built: who moves the counter when a human plays a stealth card
  (the human, as today, or the bot from the card), and how a number entered both ways is not counted twice.
- **Their wrong readings.** Claude's proposal, not ruled: the noted ones are kept as a list in each round's PR, for Johan to pass
  to zero-vtes's maintainer if he wishes.

### 11.7 Predictions for the first family (registered before its tool exists; D-93, L-44)
A scratch scan on 20 Nov (appendix C; action modifiers and reactions only, the levels joined crudely): 443 entries, 376 with a
definition; 175 carry a value for stealth, intercept or bleed in either reading (five of them only our `X`, no number). The family's action
cards (`actStealth`) are not in the scan: the predictions below are for the modifiers and the reactions. Of the 175: 98 agree level by level as the
two readings list their modes; 35 more carry the same numbers and list their modes differently; 34 differ; 8 go by a formula
or a condition.
1. **With the levels joined properly, at least 125 of the 175 agree level by level.** Between 110 and 124: the join is harder than
   the scan suggests. Fewer than 110: the scan overstated the agreement.
2. **Of the entries that differ, between 5 and 15 carry a reading of ours that KRCG's text contradicts.** Fewer than 5: the
   compiler's numbers are better than the differences suggest. More than 15: the family takes a second round.

The counts and their verdicts are written here when the first family is built. The 175 is the scan's own number: the tool's
count may differ, and then the bands are read as shares of its count.

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

## Appendix C — how the numbers of 20 Nov were made (§11)
Read-only scratch scripts outside the repository, on main `77da0b7` (bot v0.6.235) and a zero-vtes checkout at `05e812e` (19 Nov).
The round's fresh-context reviewer recounted every number with its own code; what its recount changed is in this text.
- **Definitions and effect types.** `gen-review-sheet.js` v1.0.0's `parseDefs` over `crates/engine/src/cards/defs.rs`, with
  `crates/engine/src/cards/mod.rs` for its helpers; the definitions joined to `elysium-cardfx.json`'s `lib` by the tool's
  `normName` (1,890 definitions, 1,891 entries: one card stands under two spellings). An effect type is a token as the tool
  counts it: an effect's name, split by its first argument when that is a variant, numbers left out; what an ability asks as
  its terms is counted as a type too (64 of the 1,543).
- **Touch and in full.** A set of effect types touches an entry when the entry's definition uses at least one of them, and
  describes it in full when the definition has an effect type and every one of them is in the set (one definition has none and
  is not counted). The sets are cut by use, so that no tie decides a number: the types on 25 or more definitions (44), on 20
  or more (50, "the 50 most used"), on 8 or more (105), on 2 or more (475, the shared ones).
- **The starters.** `docs/CARDS.md`'s ledger rows: 308 cards (205 playable, 63 inert, 14 partial, 26 unseen).
- **The windows table's review marks.** `data/window-matrix-reviewed.csv`, its column of review marks: 732 marked as checked,
  161 as corrected, 997 unmarked.
- **The scratch scan (§11.7).** Entries whose `t` holds `mod` or `react`. Ours: a mode's `fx.stealth`, `fx.intercept` and
  `fx.bleed` (a number, or `X`). Theirs: the numbers of the stealth-adding effect, the intercept-adding effect and the bleed
  modifier in each mode of the definition, by a text scan of the mode with its comments dropped; a mode that is a named shared
  item is read through one level. An entry carries a value when either reading has one. It is set aside (8 entries) when our
  value is `X`, or when their mode has a stealth, intercept or bleed effect whose amount goes by a pick, by X, by a circle, by
  the target, by a clan, by a title or by the younger vampire. "Level by level" compares the modes in the order each reading
  lists them, and only where both list the same number of modes (113 entries: 98 agree, 15 differ); the other 54 are compared
  as sets of numbers (35 the same, 19 not).
