# BOARD — the open asks (18 Nov 2026, v0.6.232). A line is deleted when done; found work is added as a line.

Format: **ask**: why. *Done when* condition. Docs: the pages a round touches. Johan orders the board; a round takes one line
(or a few that belong together — the combining rule). Questions for Johan are not here: they are `RULINGS.md` O-lines.

## Product line (Johan's order, 19–20 Oct 2026; spec-cleanup §7)
- **The knowledge layer's Kevlar**: Johan: armour is valuable against aggravated-damage decks, priced by what the table's decks
  deal (the TWD profile). Since v0.6.213 the bots deal aggravated damage (the gangrel, tzimisce, salubri and ministry precons) and the
  vest prevents it (R-39); the starters deal none, so the bench needs those decks. *Done when* the equipment scorer reads an
  expected-damage share for the table's decks and a pinned bench shows no loss. Docs: RULINGS D-52; `specs/spec-knowledge-layer.md`.
- **The prey's wakes as blockers** (65f): the probe lab lost on five tables of 91 where a prey with one body and a wake blocked
  the prober and woke for the punch. *Done when* `probeHold`'s out-number reads unlocked bodies + expected wakes (deck read +
  hypergeometric), measured in `lab-probe.js`. Docs: RULINGS O-7; `specs/spec-knowledge-layer.md`.
- **The abstract model spec**: the first of the four checks (fast rollouts over card-class distributions, probabilities not
  decisions, calibrated against the sim before any consumer). *Done when* the spec is in `specs/` and Johan has said "kör".
  Docs: `specs/spec-cleanup-2026-10-20.md` §6.1; RULINGS D-83, O-32.
- **The V5 waves**: the generator (`gen-precon.js`), the 14 other precons as `deck-<key>.json` (the sim plays them; the menu only
  Toreador) and the ledger (`docs/CARDS.md`); waves by effect class as the class map ranks them (D-98). Waves 1–5 done
  (D-99, D-103, D-104, D-106, D-120, D-122), 6a (D-123); next: 6b -- Shadow Cloak (a window after a successful action) and Absolute
  Tyranny (the polling's -1 vote by path), spec-v5-wave6 §3. Then the maneuver / press grants with the rush cards (Hunting the Quarry,
  Night Terrors' strike: combat ends), the free block bars, the cards without effect data, the unmodelled action cards. Crypt waves (D-108): A
  done (v0.6.219); B = the rest by class, the 13 partial copies first. A deck joins the menu (`ARCHETYPES` + a `DECK_STRATEGY`
  line) by D-108; before the deck count doubles, decks and `DECK_STRATEGY` become a data file (`gen-precon.js --check` compares
  them). *Done when* a wave's rows turn playable. Docs: RULINGS D-84, D-98, D-102, D-104, D-108; `CARDS.md`; HOWTO.
- **The V5 waves' riders** (each wave spec's §4; wave 5's §10 and §12.10; wave 6's §8): what v1 of each wave left out, the
  amber halves and the latent items. *Done when* each is built and section-tested, or ruled out. Docs: RULINGS R-39 – R-43, D-99 – D-123.
- **The weapon's maneuver** (wave 2's review): the compiler writes `maneuver: true` for a weapon, `_equipCombatOption` reads
  a number — the .44 Magnum has never maneuvered, so the strike-binding rules' gun halves never run. Neighbours: a weapon's strike
  sends a clone and a play row every time; the press step waits 1.5 s for a taken line after a clean dodge; Taste of Vitae's wait
  returns an earlier round's pending line; `_xLossSum` sums nothing. *Done when* each is fixed with a positive test and its footprint
  read. Docs: `specs/spec-v5-wave2-2026-10-29.md` §4.
- **The official deck guides as each deck's strategy baseline** (Johan, 29 Oct; refined by the archetypes): D-112 checks each
  strategy line against its guide; Toreador's is done (D-118). *Done when* each deck's proposals have Johan's "kör" or "no".
  Docs: RULINGS D-43, O-33, D-112, D-118.
- **Reads the bench round left** (D-118): my referendums' block rate at the table (proposal 2); a stealth bleeder read from
  its deck (proposal 7's loss); `keyLast`'s hold with two political cards; `engineW` only while no stock engine of mine is
  ready; the Ball's wait by expected payoff against punishment and risk (Johan, 17 Nov). *Done when* built and benched, or
  ruled out. Docs: RULINGS D-118, O-43; `specs/spec-bench-round-2026-11-15.md`.
- **C5 — guards**: the leak test (static: the bot reads no global but its export; dynamic: after a sim match no bot state holds a
  card only another seat held, a planted leak the positive control; `_twdExpect` agrees across observers), flip counts on `decide`
  rows, the knob registry (`KNOBS`: every decision knob with a 0-path, persona thresholds as overlays), and the off-by-default knobs
  (`planFloor` computed not consumed, `askHumansTotal` blocked by the human harness, `crossRushWeight` 0 until the meta layer, O-31):
  wire each or delete its dead branch. *Done when* `test-bot-sim-boundary.js` is green on 24 matches and red on the planted leak;
  the manifest emits the registry. Docs: spec T5, T7, T9; RULINGS O-2, O-29, O-31.
- **C6 — the faster suite**: ~87 % of the suite's time is its own sleeps (151 s of literal `sleep`s in the 400 no-server sections);
  pilot a second runner that plays those sections under the sim's virtual clock, live sections on the real clock; sharding is the
  fallback. The suite also grows past a 2 GB heap by section 136 (29 Oct): find what it keeps. *Done when* one runner gives the same
  assertion count, green ×3, on node's default heap. Docs: spec §5.7, §7.
- **Graded rules readings as a ledger column** (T3): every wave's PR has listed its grades since wave 1 (HARNESS, the charter);
  `docs/CARDS.md` does not carry them. *Done when* the ledger shows each curated card's latest grade. Docs: spec T3; HARNESS;
  `specs/spec-cardfx-sweep-sources-2026-09-25.md`.
- **The helper lock's release** (main's answers of 3 Nov): the client locks all helpers on while a bot is seated until the bot
  proves a whole combat on lines alone. *Done when* asked, when ready. Docs: RULINGS D-62, D-94.
- **History comments in `elysium-bot.js`** (222 KB): trim to trap comments ("why" + a rule id) in the functions a round touches
  (spec §8 Q6, recommended (b)). *Done when* Johan has chosen; then per round.
- **Section 69b's decay check**: `o4.pick === ctxC.card ? true : o4.pick ===
  ctxC.plain` passes for either pick and reads no score, so the streak's −0.30 on the card line is untested. *Done when* 69b
  compares the card score with and without the streak.

## Known, not built (bot side)
- **The TWD profile's rebuild** (D-110, O-37, O-38): the shipped profile's 14 article-last keys (`Barrens, The` …) hold only
  the merged decks' share; a few decks count twice. A v5 rebuild (scratch: 4,709 decks, Magnum under 10) drops a name the bot
  records for two cards (`Pentex(TM) Subversion`, hacking's `Parthenon, The`). *Done when* the bot reads both files by KRCG id
  (or they carry every cardfx name), every deck's library names hit a key, and the rebuild ships with a sim footprint.
  Also: the v5 nicknames are aliases (types dropped in `krcg-v5.js`).
- **A human's bounce of a bot's bleed** is not read by the acting bot; a bot that is a bounce's new target cannot bounce onward.
  *Done when* the client's bounce play line (a pool target) is parsed and section-tested. Docs: RULINGS O-3.
- **A human's Change of Target after a right-click action** (main, 11 Nov §1) names no vampire or another: `_onCot` misses it.
  Main: such a line from the blocked seat within `_myBlockOf`'s 30 s is that vampire's. *Done when* a section shows it read.
- **Hand names out of the console outside debug** (main, 11 Nov: the security plan's item 6): an online host can read a bot's
  console, which names hand cards. *Done when* only debug names them, section-tested.
- **The gates on the root's release** (Q4, main's yes of 3 Nov): the canary, the suite's
  server and 154f, the arena, the sim and the hotseat gate read the root's client and server and `client/`'s protocol, the copies
  go, STATUS pins the main commit. *Done when* every gate reads the root and CI is green on it.
- **A human's Haven Uncovered** is not read by the bots. *Done when* the frozen line arms `_havenHost*` for a human's card.
- **Steal pair under a combat ends**: the stealer's side does not apply v0.6.196's rule when the victim's Majesty ends the combat.
  *Done when* `ana-ledger.py` prints equal pairs on a smoke with that case. Docs: RULINGS O-12.
- **Nosferatu's Fame chain** (Fame → rush → torpor → rescue) has never run; the rush is not priced in pool. *Done when* a sim series
  shows famed rushes, famed torpors and rescues. Docs: RULINGS O-10.
- **Taste of Vitae**: the 2+ gate is built (v0.6.156); not built: play at 1 when the vampire sits at 0–1 blood or two copies clog,
  and "with a Taste in hand, prefer the damage card this round". *Done when* both are section-tested. Docs: RULINGS D-23.
- **Intercept banking** (B-55f-b: deck-axis, measure first) and **2 of 187 blocked rows still `by: null`** (B-55e-b). *Done when*
  banking is measured on a sim series and no blocked row lacks `by`. Docs: `history/CLAUDE-v2-2026-10-20.md` 155–165, debt 68.
- **The turn ledger's gaps** (26d): a barred bleed becomes an illegal marker that can still win the score contest (the vampire stays
  home); of the card-in-play actions only the rushes and the card burns are booked (v0.6.217; not Warsaw, Chantry). *Done when* the
  marker cannot win and every card-in-play action is booked.
- **Home pricing's six soft spots** (42c, unfixed): `_keepBlocker` holds the last actors, not `_priceHome`'s bodies; `predHits`
  reads the announced bleed, `hitMax` the realised one; a bounce valued as pool saved only; the rate leans on `myFc`; wakes counted
  whoever could play them; 0.9 / pStop / 'a card + a blood = 1 pool' / fwd 0.5 unmeasured. *Done when* each is fixed or measured.
  Docs: `history/specs/spec-home-pricing-2026-09-19.md`.
- **The minion head reads last turn's `_turnActs`** (Change of Target's ledger): it is reset after `_strategize`, `_probeOrder` and
  `_minionKeyOrder` ask. *Done when* the reset comes first, footprint read.
- **`_wakeCard()` is vampire-blind** at the bounce, vote and reduce routes and in `interceptPotential` (`_wakeCardFor(v)` exists).
  *Done when* every site reads the vampire.
- **The locked routes' last rungs** (round F, D-116 (5)): the block decision counts the unlock reactions, not the Underbridge Stray
  (the route's last rung, an ally burned); `_wakeBlockersAfter` (the keep-blocker read) counts wakes only; Eyes of the Wild by a
  vampire already attempting to block [ANK 20181122-2] is not built. *Done when* each reads the route, or is ruled out.
- **Free block bars** (Beast Meld-class) and `chosen` (Seduction-class) have tags, no consumer. *Done when* a V5 wave needs them
  and the ledger lists them playable. Docs: RULINGS O-21.
- **The chump gate is not the commit** (round B): `bareBlock` 'chump' passes on any chump body, then `_commitBlock` picks
  its own (`_pickBlocker`); both paths. *Done when* the commit takes the gate's body, section-tested.
- **Bot diablerie** (the fixed-vote-majority rule). *Done when* Johan schedules it. Docs: RULINGS O-15.
- **Vote-count residue**: three channels at once (menu line, counter, both) under-count; Protected District's votes come from the
  counter only. *Done when* main ships the additive counter verb or the client writes both. Docs:
  `specs/spec-referendum-terms-2026-09-18.md`.
- **Wasserschloss Anif's burn action, Haven Uncovered's host burning it, Ventrue HQ in others' referendums.** *Done when* each is
  played in a sim series. Docs: RULINGS O-23.
- **Two Pentex spellings** are two cards to `_uniqueInPlay`. *Done when* `_uniqueInPlay` compares the normalised name. Docs:
  RULINGS O-24.
- **The act-again context reads `mo.fx.referendum`** (`_actAgainCtx`'s "clogged" test), which no cardfx entry carries — political
  cards carry `e.ref` — so a political action in hand never counts as another use for the vampire (the coverage scan).
  *Done when* the test reads the political type and a section covers it.
- **The influence floor at `poolFloor` 0**: the influence phase leaves `poolFloor` (6 for every persona; 1 with no ready minion);
  a knob of 0, which only test fixtures set, lets it spend the last pool (D-97's inventory). *Done when* the floor is at
  least 1 and the fixtures that relied on 0 are read (L-16).

## From the 11 Oct review of VTES-Player (DuelRevolvers; ideas only, no code — the repo has no licence)
- **Blood-hunt voting** (their item 8): `_refVoteDir` reads only pool terms, so a blood hunt reads "nothing in it for me" and the
  bot abstains; our bots never diablerise, so the hunt is always on someone else's diablerist — vote for it, harder when that is my
  predator or the table's leader. *Done when* a section shows the FOR vote.
- **The §8 law for the meta layer** (their item 3): a term equal for every option cannot change the choice; `_tableThreat()` is only
  traced today and must enter where options name different seats (the bounce target, the rush target, the voter and the terms,
  keep-a-blocker / block-or-pass), from ONE shared seat valuation. *Done when* the meta layer's first consumer reads it there.
- **Yewon's and Alexa's torpor use** (D-111): no vote from torpor, but a card cycled. *Done when* the meta layer prices a card
  against a random draw.
- **The cancel cards** (Johan, 18 Nov: "a classic example" for the meta layer; D-122): Sudden Reversal decides on simple priors
  (spec-v5-wave5 §12.2: a master's worth to me against my next master phase action); the meta layer should price a cancel from the
  table: the owner's threat, what the cancel denies, what my next action would buy. Eagle's Sight [AUS] (a block from a seat that
  may not block, D-123) waits for the same layer. *Done when* it does and a lasombra-pinned bench shows no loss.
- **Meta metrics at decision level, on padded decks** (their item 4): flip rate, a fork audit (does the option list hold opposite
  choices?), the vote-direction split, wrong-target audits, did-it-run counters, on a table padded with the cards a rule needs;
  an audit needs a known case before an alarming number is believed. *Done when* the meta layer's first bench reports them.
- **Personas as tested overlays** (their item 9): every overridden knob exists, every persona differs from the default, the
  self-oust guard is untouched, and persona pairs disagree at fixed positions; judge personas by behaviour and feel, not VP.
  *Done when* the persona pass (RULINGS O-29) ships with those tests.

## Measurement debts
- **Three ledger faults on fresh deals** (v0.6.223 too; `--bench none --seeds 3`): a VANISHED bleed, a bleed with no actor row,
  a steal's victim lost > stole. A lead (v0.6.227, the 600's match 167): a bleed that fizzles at a seat just ousted is read by
  the next prey as its own and books the pool (likelier since v0.6.227: the 600's fizzles 3 → 6). *Done when* `ana-gates.py` passes
  there. Docs: CHANGELOG v0.6.224, v0.6.227.
- **A window can open after its line was delivered** (v0.6.227's review): a synchronous bridge delivers a line that leaves inside
  its own `send()` before `_askBlock` runs, and the target's instant Pass finds no window (pace 0 with a free token; the client
  pace is safe by its 200 ms gaps). Defer a window-opening line's drain a macrotask, or let `_askBlock` send it? *Done when* a
  section with a full token bucket passes. Docs: CHANGELOG v0.6.227, L-92.
- **A rushed acting vampire's maneuver wait** (Deep Song: the rushed vampire acts) ran into its safety net once in 240 (v0.6.215,
  match 74). *Done when* the race is found or a series shows it gone.
- **The sim writes a match's rows at its end, by reference** (`elysium-bot-sim.js` `onEvent`): a decide row's ctx objects (a
  vampire, a target) show their END state (`ana-sim-diff.py` reads outcomes). *Done when* rows are cloned at push.
- **The sim's `zeroPool` misses a self-oust by payment**: it counts decisions at pool ≤ 0; a payment of the last pool that ousts at
  once leaves none (3 of the 4 Chantry cases in v0.6.212's smoke). *Done when* the sim also flags an oust on my own turn whose last
  pool change was my own payment.
- **The 14 Oct playtest scenario** (`client/playtest/`, `--dir` on a scratch copy of the root) not re-run since v0.6.207; **the
  larger re-measure** against a v0.6.207 baseline; at that table also The Dowager's +1 in a human's directed action (D-111). *Done
  when* both reports exist with the sim as the first read.
- **Forecast calibration** (`gen-forecast-calibration.js`) not re-run since 18 Sep; the seed of the abstract model's calibration
  gate. *Done when* it runs on a sim series and the ratio is reported.
- **Main's replies of 17–18 Oct** (robustness, v0.6.206, v0.6.207, open hand) unconsumed; v0.6.207's R-38 (negative stealth /
  intercept): check every reader of `tally.a` / `tally.b` that assumed ≥ 0. *Done when* each reply's bot-side items are built or
  declined in a handoff.
