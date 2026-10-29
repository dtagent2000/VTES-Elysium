# BOARD — the open asks (29 Oct 2026). A line is deleted when done; found work is added as a line.

Format: **ask**: why. *Done when* condition. Docs: the pages a round touches. Johan orders the board; a round takes one line
(or a few that belong together — the combining rule). Questions for Johan are not here: they are `RULINGS.md` O-lines.

## Product line (Johan's order, 19–20 Oct 2026; spec-cleanup §7)
- **The knowledge layer's Kevlar**: Johan: armour is valuable against aggravated-damage decks (Gangrel) and the TWD profile can
  price it by what the table's decks deal. Waits for the wave that plays aggravated strikes (`CARDS.md` class `aggr`: Claws of the
  Dead, Sculpt the Flesh, Wall of Filth …): no deck at the reference table deals aggravated damage to others today, so there is
  nothing to price yet (29 Oct). *Done when* the equipment scorer reads an expected-damage share for the table's decks and a
  pinned bench shows no loss. Docs: RULINGS D-52; `specs/spec-knowledge-layer.md`.
- **The prey's wakes as blockers** (65f): the probe lab lost on five tables of 91 where a prey with one body and a wake blocked
  the prober and woke for the punch. *Done when* `probeHold`'s out-number reads unlocked bodies + expected wakes (deck read +
  hypergeometric), measured in `lab-probe.js`. Docs: RULINGS O-7; `specs/spec-knowledge-layer.md`.
- **The abstract model spec**: the first of the four checks (fast rollouts over card-class distributions, probabilities not
  decisions, calibrated against the sim before any consumer). *Done when* the spec is in `specs/` and Johan has said "kör".
  Docs: `specs/spec-cleanup-2026-10-20.md` §6.1; RULINGS D-83, O-32.
- **The V5 waves**: round 0 (v0.6.212) built the generator (`gen-precon.js`), the 14 other precons as `deck-<key>.json` (the sim
  plays them; the client's menu does not offer them), the coverage class map and the ledger (`docs/CARDS.md`). Next: the waves, by
  effect class as `CARDS.md`'s class map ranks them (masters with no effect modelled, Villein first: 22 copies in 6 decks; the
  bundled maneuver / press combat cards; aggravated strikes; free block bars; extra strikes; the 22 cards with no effect data;
  action cards whose effect is unmodelled) — Johan chooses the wave shape (RULINGS O-22). A deck joins the menu (`ARCHETYPES` + a
  `DECK_STRATEGY` line) when its rows are playable and it holds up in the sim; before the deck count doubles, decks and
  `DECK_STRATEGY` become a data file (seven decks embedded in `elysium-bot.js`, six duplicated in `deck-*.json`; `gen-precon.js
  --check` compares them). *Done when* a wave's rows turn playable. Docs: RULINGS D-84, O-22; `CARDS.md`; HOWTO.

## The clean-up (spec-cleanup-2026-10-20.md §7; C1 = PR #39)
- **C2 — dead code and tools**: delete the ten legacy tests, `_bumpTallyB`, the lint's eight unused assignments, one `handStrike`
  key; add `ana-gates.py` (one PASS/FAIL line per audit over a sim dir). *Done when* the sim's 240-match design is IDENTICAL and the
  gates are green. Docs: spec §5.6, T10.
- **C3 — the mirror bench on the sim**: port the arms, seats, both controls, `bench.sh`'s deck-pinned 6th and global-knob 7th
  argument, with paired reads (`ana-sim-diff.py --vp`); re-validate the controls; then retire `bench.sh`, `run-*.sh`, `poll-bal.sh`
  and rewrite every rule that names them (HOWTO). `design-balanced-serie-bal1.txt` stays: the sim must be able to read it.
  *Done when* A vs A is level, a crippled seat loses, and the old scripts are gone. Docs: spec §5.6, T6.
- **C4 — CI for `bot/`** (if Johan says yes, spec §8 Q5): `.github/workflows/bot-gates.yml` beside main's, triggered by `bot/**`
  and the bot bundle; `node --check`, the correctness lint, canary, cardfx, HB1, hotseat, the suite. *Done when* a red gate shows
  on a PR. Docs: spec T8; HARNESS.
- **C5 — guards**: the leak test (static: the bot reads no global except its export; dynamic: after a sim match no bot state holds
  a card name only another seat's hand or library held, with a planted leak as the positive control; `_twdExpect` agrees across
  observers), flip counts on `decide` rows for a knob under test, the knob and weight registry (`KNOBS`, one table, every decision
  knob with a 0-path, persona thresholds as overlays), and the off-by-default knobs (`planFloor` computed not consumed,
  `askHumansTotal` blocked by the human harness; `crossRushWeight` 0 is Johan's "cross soft-zero", wired only with the meta layer, O-31):
  wire each or delete its dead branch. *Done when*
  `test-bot-sim-boundary.js` is green on 24 matches and red on the planted leak; the manifest emits the registry. Docs: spec T5,
  T7, T9; RULINGS O-2, O-29, O-31.
- **C6 — the faster suite**: ~87 % of the suite's time is its own sleeps (151 s of literal `sleep`s in the 400 no-server sections);
  pilot a second runner that plays those sections under the sim's virtual clock, live sections on the real clock; sharding is the
  fallback. *Done when* one runner gives the same assertion count, green ×3. Docs: spec §5.7, §7.
- **Graded rules readings and the card ledger** (T2, T3): one generated row per card (tier, modes, rulings, the suite section,
  plays in the latest sim, status); each curated reading graded green / amber / red by a fresh agent against KRCG text and
  vtes-rulings, only reds to Johan. *Done when* `gen-card-ledger.js` writes `docs/CARDS.md` from cardfx + the suite + a sim dir.
  Docs: spec T2, T3; HARNESS; `specs/spec-cardfx-sweep-sources-2026-09-25.md`.
- **Egress review as a rule** (T4): every round's PR carries an `Egress:` line from a fresh-context agent. *Done when* HARNESS
  describes it and three rounds have one. Docs: HARNESS.
- **Ask main once**: (a) may the bot's gates read the root's released client / server / protocol instead of the copies in `bot/`
  (no drift, 1.8 MB fewer); (b) has the hotseat bridge, or could it expose, a pure `step(state, action)`; (c) the bot-emitted frozen
  lines owed to §12 + the canary (STATUS lists them) — all three in `handoffs/HANDOFF-to-main-2026-10-20-docs-diet.md`; (d) the
  client locks all helpers on while a bot is seated until the bot proves a whole combat on lines alone — ask for that step when
  ready. *Done when* main has answered (a)–(c). Docs: spec §8 Q4, §6.1; RULINGS D-62, D-94.
- **History comments in `elysium-bot.js`** (222 KB citing versions and dates): trim to trap comments ("why" + a rule id) in
  functions a round touches (spec §8 Q6, recommended (b)); a mechanical pass only if the bundle size matters to players, verified
  by identical minified output. *Done when* Johan has chosen; then per round. Docs: spec §8 Q6.

## Known, not built (bot side)
- **A human's bounce of a bot's bleed** is not read by the acting bot; a bot that is a bounce's new target cannot bounce onward.
  *Done when* the client's bounce play line (a pool target) is parsed and section-tested. Docs: RULINGS O-3.
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
  home); hunt / rescue / leave torpor are not limited; card-in-play actions (Warsaw, Chantry) are not in the ledger. *Done when*
  the marker cannot win and the card-in-play actions are booked.
- **Home pricing's six soft spots** (42c, told to Johan, unfixed): `_keepBlocker` holds the last actors, not the bodies `_priceHome`
  chose; `predHits` reads the announced bleed while `hitMax` the realised hit; a bounce is valued as pool saved only; the exchange
  rate leans on `myFc`; wakes counted whoever could play them; 0.9 / pStop / "a card + a blood = 1 pool" / fwd 0.5 unmeasured.
  *Done when* each is fixed or measured. Docs: `history/specs/spec-home-pricing-2026-09-19.md`.
- **`_wakeCard()` is vampire-blind** at the bounce, vote and reduce routes and in `interceptPotential` (`_wakeCardFor(v)` exists).
  *Done when* every site reads the vampire.
- **Free block bars** (Beast Meld-class) and `chosen` (Seduction-class) have tags, no consumer; crypt text auto-extraction for
  passive shapes not built. *Done when* a V5 wave needs them and the ledger lists them playable. Docs: RULINGS O-21.
- **Bot diablerie** (the fixed-vote-majority rule). *Done when* Johan schedules it. Docs: RULINGS O-15.
- **Vote-count residue**: three channels at once (menu line, counter, both) under-count; Protected District's votes come from the
  counter only. *Done when* main ships the additive counter verb or the client writes both. Docs:
  `specs/spec-referendum-terms-2026-09-18.md`.
- **Wasserschloss Anif's burn action, Haven Uncovered's host burning it, Ventrue HQ in others' referendums.** *Done when* each is
  played in a sim series. Docs: RULINGS O-23.
- **Two Pentex spellings** are two cards to `_uniqueInPlay`. *Done when* `_uniqueInPlay` compares the normalised name. Docs:
  RULINGS O-24.
- **The act-again context reads `mo.fx.referendum`** (`_actAgainCtx`'s "clogged" test), which no cardfx entry carries — political
  cards carry `e.ref` — so a political action in hand never counts as another use for the vampire (found by the coverage scan, 29
  Oct). *Done when* the test reads the political type and a section covers it.
- **The influence floor at `poolFloor` 0**: the influence phase leaves `poolFloor` (6 for every persona; 1 with no ready minion);
  a knob of 0, which only test fixtures set, lets it spend the last pool (D-97's inventory, 29 Oct). *Done when* the floor is at
  least 1 and the fixtures that relied on 0 are read (L-16).

## From the 11 Oct review of VTES-Player (DuelRevolvers; ideas only, no code — the repo has no licence)
- **Blood-hunt voting** (their item 8): `_refVoteDir` reads only pool terms, so a blood hunt reads "nothing in it for me" and the
  bot abstains; our bots never diablerise, so the hunt is always on someone else's diablerist — vote for it, harder when that is my
  predator or the table's leader. *Done when* a section shows the FOR vote.
- **The §8 law for the meta layer** (their item 3): a term equal for every option cannot change the choice; `_tableThreat()` is only
  traced today and must enter where options name different seats (the bounce target, the rush target, the voter and the terms,
  keep-a-blocker / block-or-pass), from ONE shared seat valuation. *Done when* the meta layer's first consumer reads it there.
- **Meta metrics at decision level, on padded decks** (their item 4): flip rate, a fork audit (does the option list hold opposite
  choices?), the vote-direction split, wrong-target audits, did-it-run counters, on a table padded with the cards a rule needs;
  an audit needs a known case before an alarming number is believed. *Done when* the meta layer's first bench reports them.
- **Personas as tested overlays** (their item 9): every overridden knob exists, every persona differs from the default, the
  self-oust guard is untouched, and persona pairs disagree at fixed positions; judge personas by behaviour and feel, not VP.
  *Done when* the persona pass (RULINGS O-29) ships with those tests.

## Measurement debts
- **The 14 Oct playtest scenario** (`client/playtest/`, `--dir` on a scratch copy of the root with the bot branch) not re-run since
  v0.6.207; **the larger re-measure** against a v0.6.207 baseline (every arena number before v0.6.206 carries ~3 s of dead clock
  per bleed total). *Done when* both reports exist with the sim as the first read.
- **Forecast calibration** (`gen-forecast-calibration.js`) not re-run since 18 Sep; the seed of the abstract model's calibration
  gate. *Done when* it runs on a sim series and the ratio is reported.
- **Main's replies of 17–18 Oct** (robustness, v0.6.206, v0.6.207, open hand) not consumed in a bot round; v0.6.207's reply carries
  Johan's negative stealth / intercept (R-38): check every reader of `tally.a` / `tally.b` that assumed ≥ 0. *Done when* each
  reply's bot-side items are built or declined in a handoff.
