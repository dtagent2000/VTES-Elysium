# BOARD — the open asks (20 Oct 2026). A line is deleted when done; found work is added as a line.

Format: **ask**: why. *Done when* condition. Docs: the pages a round touches. Johan orders the board; a round takes one line
(or a few that belong together — the combining rule). Questions for Johan are not here: they are `RULINGS.md` O-lines.

## Product line (Johan's order, 19–20 Oct 2026)
- **The knowledge layer's Kevlar**: Johan: armour is valuable against aggravated-damage decks (Gangrel) and the TWD profile can
  price it by what the table's decks deal. *Done when* the equipment scorer reads an expected-damage share for the table's decks
  and a pinned bench shows no loss. Docs: RULINGS D-52, O-11; `specs/spec-knowledge-layer.md`.
- **The prey's wakes as blockers** (65f): the probe lab lost on five tables of 91 where a prey with one body and a wake blocked
  the prober and woke for the punch. *Done when* `probeHold`'s out-number reads unlocked bodies + expected wakes (deck read +
  hypergeometric), measured in `lab-probe.js`. Docs: RULINGS O-7; `specs/spec-knowledge-layer.md`.
- **The abstract model spec**: the first of the four checks (fast rollouts over card-class distributions, probabilities not
  decisions, calibrated against the sim before any consumer). *Done when* the spec is in `specs/` and Johan has said "kör".
  Docs: `specs/spec-cleanup-2026-10-20.md` §7.1; RULINGS D-83, O-32.
- **The V5 plan**: precon generator from `vtes.json`'s 18 V5 precons, a coverage class map, Toreador, then waves on the card
  ledger. Before the deck count doubles, move the embedded decks and `DECK_STRATEGY` into a data file (seven decks are embedded
  in `elysium-bot.js`, six duplicated in `deck-*.json`, `WALL_DECK` has no file). *Done when* a wave is a list of ledger rows
  that turned "playable". Docs: RULINGS D-84, O-22; spec-cleanup §7.2; `coverage/`.

## The clean-up (spec-cleanup-2026-10-20.md §8; C1 is this branch)
- **C2 — dead code and tools**: delete the ten legacy tests, `_bumpTallyB`, the lint's eight unused assignments, one `handStrike`
  key; add `ana-gates.py` (one PASS/FAIL line per audit over a sim dir). *Done when* the sim's 240-match design is IDENTICAL and the
  gates are green. Docs: spec §6.6, T10.
- **C3 — the mirror bench on the sim**: port the arms, seats, both controls, `bench.sh`'s deck-pinned 6th and global-knob 7th
  argument, with paired reads (`ana-sim-diff.py --vp`); re-validate the controls; then retire `bench.sh`, `run-*.sh`, `poll-bal.sh`
  and rewrite every rule that names them (HOWTO). `design-balanced-serie-bal1.txt` stays: the sim must be able to read it.
  *Done when* A vs A is level, a crippled seat loses, and the old scripts are gone. Docs: spec §6.6, T6.
- **C4 — CI for `bot/`** (if Johan says yes): `.github/workflows/bot-gates.yml` beside main's, triggered by `bot/**` and the bot
  bundle; `node --check`, the correctness lint, canary, cardfx, HB1, hotseat, the suite. *Done when* a red gate shows on a PR.
  Docs: spec T8; HARNESS.
- **C5 — guards**: the leak test (static: the bot reads no global except its export; dynamic: after a sim match no bot state holds
  a card name only another seat's hand or library held, with a planted leak as the positive control; `_twdExpect` agrees across
  observers), flip counts on `decide` rows for a knob under test, the knob and weight registry (`KNOBS`, one table, every decision
  knob with a 0-path, persona thresholds as overlays), and the off-by-default knobs (`planFloor` computed not consumed,
  `askHumansTotal` blocked by the human harness, `crossRushWeight` 0): wire each or delete its dead branch. *Done when*
  `test-bot-sim-boundary.js` is green on 24 matches and red on the planted leak; the manifest emits the registry. Docs: spec T5,
  T7, T9; RULINGS O-2, O-29, O-31.
- **C6 — the faster suite**: ~87 % of the suite's time is its own sleeps (151 s of literal `sleep`s in the 400 no-server sections);
  pilot a second runner that plays those sections under the sim's virtual clock, live sections on the real clock; sharding is the
  fallback. *Done when* one runner gives the same assertion count, green ×3. Docs: spec §6.7, §8.
- **Graded rules readings and the card ledger** (T2, T3): one generated row per card (tier, modes, rulings, the suite section,
  plays in the latest sim, status); each curated reading graded green / amber / red by a fresh agent against KRCG text and
  vtes-rulings, only reds to Johan. *Done when* `gen-card-ledger.js` writes `docs/CARDS.md` from cardfx + the suite + a sim dir.
  Docs: spec T2, T3; HARNESS.
- **Egress review as a rule** (T4): every round's PR carries an `Egress:` line from a fresh-context agent. *Done when* HARNESS
  describes it and three rounds have one. Docs: HARNESS.
- **Ask main once**: (a) may the bot's gates read the root's released client / server / protocol instead of the copies in `bot/`
  (no drift, 1.8 MB fewer); (b) has the hotseat bridge, or could it expose, a pure `step(state, action)` — both asked in
  `handoffs/HANDOFF-to-main-2026-10-20-docs-diet.md`, awaiting the answer; (c) the bot-emitted frozen lines owed to §12 + the canary
  (STATUS lists them); (d) the client locks all helpers on while a bot is seated until the bot proves a whole combat on lines alone —
  ask for that step when ready. Docs: spec §9 Q4, §7.1; RULINGS D-62.
- **The two design documents outside git** (Claude Docs, 25 Sep: "event log, shadow model, knowledge sources, bench" and
  "cardfx sweep — source mapping"): copy their standing parts into `specs/`. *Done when* ARCHITECTURE links files in git.
- **History comments in `elysium-bot.js`** (222 KB citing versions and dates): trim to trap comments ("why" + a rule id) in
  functions a round touches (Johan's choice (b)); a mechanical pass only if the bundle size matters to players, verified by
  identical minified output. Docs: spec §9 Q6.

## Known, not built (bot side)
- **A human's bounce of a bot's bleed** is not read by the acting bot; a bot that is a bounce's new target cannot bounce onward.
  *Done when* the client's bounce play line (a pool target) is parsed and section-tested. Docs: RULINGS O-3.
- **A human's Haven Uncovered** is not read by the bots. *Done when* the frozen line arms `_havenHost*` for a human's card.
- **Between bots a contested block's verdict waits for the actor's clock** (~3 s at the arena's askSecs; by design, R4). Keep or
  shorten — Johan. Docs: HOWTO (`ana-windows.py`).
- **Steal pair under a combat ends**: the stealer's side does not apply v0.6.196's rule when the victim's Majesty ends the combat.
  *Done when* `ana-ledger.py` prints equal pairs on a smoke with that case. Docs: RULINGS O-12.
- **Nosferatu's Fame chain** (Fame → rush → torpor → rescue) has never run; the rush is not priced in pool. *Done when* a sim series
  shows famed rushes, famed torpors and rescues. Docs: RULINGS O-10.
- **Taste of Vitae**: the 2+ gate is built (v0.6.156); not built: play at 1 when the vampire sits at 0–1 blood or two copies clog,
  and "with a Taste in hand, prefer the damage card this round". Docs: RULINGS D-23.
- **Intercept banking** (B-55f-b: deck-axis, measure first) and **2 of 187 blocked rows still `by: null`** (B-55e-b). Docs:
  `history/CLAUDE-v2-2026-10-20.md` 155–165, debt 68.
- **The hotseat net's known asymmetry** (70g): the no-server net is keyed on `joined.srv` = hotseat-bridge; with *Pool to predator*
  OFF a bot predator marks the human out and takes the 6 pool by itself offline, online it does neither; left deliberately, revisit
  if main or a tester objects.
- **The turn ledger's gaps** (26d): a barred bleed becomes an illegal marker that can still win the score contest (the vampire stays
  home); hunt / rescue / leave torpor are not limited; card-in-play actions (Warsaw, Chantry) are not in the ledger.
- **Home pricing's six soft spots** (42c, told to Johan, unfixed): `_keepBlocker` holds the last actors, not the bodies `_priceHome`
  chose; `predHits` reads the announced bleed while `hitMax` the realised hit; a bounce is valued as pool saved only; the exchange
  rate leans on `myFc`; wakes counted whoever could play them; 0.9 / pStop / "a card + a blood = 1 pool" / fwd 0.5 unmeasured.
  Docs: `history/specs/spec-home-pricing-2026-09-19.md`.
- **Per-deck playbooks / the opening book** (B2 steps 2–3, Johan 17 Sep; debt 13c): never built; is it superseded by the abstract
  model and the V5 plan? Johan — see RULINGS O-33.
- **`_wakeCard()` is vampire-blind** at the bounce, vote and reduce routes and in `interceptPotential` (`_wakeCardFor(v)` exists).
  *Done when* every site reads the vampire.
- **Second Tradition** as a wake for a titled body is counted; Hidden Strength's aggravated-first needs an aggravated flag in the
  strike reading. Docs: RULINGS O-6.
- **Free block bars** (Beast Meld-class) and `chosen` (Seduction-class) have tags, no consumer; crypt text auto-extraction for
  passive shapes not built. Docs: RULINGS O-21.
- **Bot diablerie** (the fixed-vote-majority rule). Docs: RULINGS O-15.
- **Vote-count residue**: three channels at once (menu line, counter, both) under-count; real fix = the additive counter verb or the
  client writing both. Docs: `specs/spec-referendum-terms-2026-09-18.md`.
- **Wasserschloss Anif's burn action, Haven Uncovered's host burning it, Ventrue HQ in others' referendums.** Docs: RULINGS O-23.
- **Two Pentex spellings** are two cards to `_uniqueInPlay`. Docs: RULINGS O-24.

## Measurement debts
- **The 14 Oct playtest scenario** (`client/playtest/`, `--dir` on a scratch copy of the root with the bot branch) not re-run since
  v0.6.207; **the larger re-measure** against a v0.6.207 baseline (every arena number before v0.6.206 carries ~3 s of dead clock
  per bleed total). *Done when* both reports exist with the sim as the first read.
- **Forecast calibration** (`gen-forecast-calibration.js`) not re-run since 18 Sep; the seed of the abstract model's calibration
  gate. *Done when* it runs on a sim series and the ratio is reported.
- **Still open from the 11 Oct VTES-Player review**: blood-hunt voting (item 8), the §8 law for the meta layer (3), decision-level
  meta metrics on padded decks (4), personas as tested overlays (9). Docs: `REVIEW-vtes-player-2026-10-11.md`.
- **Main's replies of 17–18 Oct** (robustness, v0.6.206, v0.6.207, open hand) not consumed in a bot round. *Done when* each reply's
  bot-side items are built or declined in a handoff.
