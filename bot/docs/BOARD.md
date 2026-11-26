# BOARD — the open asks (26 Nov 2026, v0.6.241). A line is deleted when done; found work is added as a line (a card
problem the sweep finds: an entry in `SWEEP-REGISTER.md`, D-135).

Format: **ask**: why. *Done when* condition. Docs: the pages a round touches. The owner orders the board; a round takes one line
(or a few that belong together — the combining rule). Questions for the owner are not here: they are `RULINGS.md` O-lines.

## Product line (the owner's order, 19–20 Oct 2026; spec-cleanup §7)
- **The bundle's cleanup release** (D-141, D-142): the bundle still names the owner and quotes the owner's words in
  `elysium-bot.js`'s comments (about 300 lines), the cardfx notes (`cardfx-curated.json`, compiled into `elysium-cardfx.json/.js`),
  the guide's example line and the sewer deck's name (embedded too); by role or an invented name, in a small release of its own
  before C1's (`tools/public-scan.py --tree` lists them as WAITING). *Done when* the scan waits on nothing, the 240 is IDENTICAL
  with the version normalized, and main has the guide to re-embed. Docs: D-141, D-142; the CHANGELOG.
- **The chat round's rulings** (D-137, O-51): v0.6.240 built the floor, dropped the `(bot):` prefix and the human's tail to a
  bot, and brought the recorder (`tools/chat-record.js`, `tools/ana-chat.py`); the owner rules every line and the questions R1–R9
  in the ruling doc (O-51), the silent bot-vs-bot verdict wait among them (O-36). *Done when* each line has his ruling and
  what he asks for is built, with a recording before and after. Docs: D-64, D-137, O-36, O-51.
- **The knowledge layer's Kevlar**: the owner: armour is valuable against aggravated-damage decks, priced by what the table's decks
  deal (the TWD profile). The bots deal aggravated damage (the gangrel, tzimisce, salubri and ministry precons) and the vest
  prevents it (R-39); the starters deal none, so the bench needs those decks. *Done when* the equipment scorer reads an
  expected-damage share for the table's decks and a pinned bench shows no loss. Docs: RULINGS D-52; `specs/spec-knowledge-layer.md`.
- **The prey's wakes as blockers** (65f): the probe lab lost on five tables of 91 where a prey with one body and a wake blocked
  the prober and woke for the punch. *Done when* `probeHold`'s out-number reads unlocked bodies + expected wakes (deck read +
  hypergeometric), measured in `lab-probe.js`. Docs: RULINGS O-7; `specs/spec-knowledge-layer.md`.
- **The abstract model spec**: the first of the four checks (fast rollouts over card-class distributions, probabilities not
  decisions, calibrated against the sim before any consumer). *Done when* the spec is in `specs/` and the owner has given the go-ahead.
  Docs: `specs/spec-cleanup-2026-10-20.md` §6.1; RULINGS D-83, O-32.
- **The V5 sweep** (D-125, D-130, D-132: exactness first; `specs/spec-card-sweep-2026-11-18.md` §11): every printed effect first
  asked who else in the library prints it; shared effects land library-wide, only the unique remainder is hand-curated. **B**, the
  pilot, is built (v0.6.236, D-134). Next **C**, concentrated (§11.8): several families a round over the whole library, the first building
  the cross-check tool and taking `stealth` / `actStealth`, `intercept`, `bleed`, then combat, then the rest of §11.4's horizon;
  parallel readers of the differing cards against KRCG's text, a separate reviewer; the bots' readers of a human's play in
  rounds of their own, the first right after C's first. C's riders: the title family; the ledger's grade column (spec §11.10);
  Hunting the Quarry (`specs/spec-sweep-pilot-2026-11-20.md` §3.3). The problems the sweep finds, and its earlier riders, are in
  `SWEEP-REGISTER.md` (D-135; below). **D**, the starters' remainder where a starter needs it, with its strategy baseline.
  Crypt waves (D-108): B = the rest by class, the 13 partial copies first. A deck joins the menu by D-108; before the deck
  count doubles, decks and `DECK_STRATEGY` become a data file (`gen-precon.js --check` compares them). The root README credits
  zero-vtes (D-128; main's, handoff). *Done when* C's horizon is reached, the 18 starters' rows are playable, every
  hand-only key has its sharing answer and C's riders are done or ruled out. Docs: RULINGS D-84, D-102, D-104, D-108,
  D-125 – D-127, D-130, D-132, D-134, D-135; `CARDS.md`; HOWTO.
- **The official deck guides as each deck's strategy baseline** (the owner, 29 Oct; refined by the archetypes): D-112 checks each
  strategy line against its guide; Toreador's is done (D-118). *Done when* each deck's proposals have the owner's go-ahead or no.
  Docs: RULINGS D-43, O-33, D-112, D-118.
- **Reads the bench round left** (D-118): my referendums' block rate at the table (proposal 2); a stealth bleeder read from
  its deck (proposal 7's loss); `keyLast`'s hold with two political cards; `engineW` only while no stock engine of mine is
  ready; the Ball's wait by expected payoff against punishment and risk (the owner, 17 Nov). *Done when* built and benched, or
  ruled out. Docs: RULINGS D-118, O-43; `specs/spec-bench-round-2026-11-15.md`.
- **C5 — guards**: the leak test (static: the bot reads no global but its export; dynamic: after a sim match no bot state holds a
  card only another seat held, a planted leak the positive control; `_twdExpect` agrees across observers), flip counts on `decide`
  rows, the knob registry (`KNOBS`: every decision knob with a 0-path, persona thresholds as overlays), and the off-by-default knobs
  (`planFloor` computed not consumed, `askHumansTotal` blocked by the human harness, `crossRushWeight` 0 until the meta layer, O-31):
  wire each or delete its dead branch. *Done when* `test-bot-sim-boundary.js` is green on 24 matches and red on the planted leak;
  the manifest emits the registry. Docs: spec T5, T7, T9; RULINGS O-2, O-29, O-31.
- **C6 — the faster suite**: ~87 % of the suite's time is its own sleeps (151 s of literal `sleep`s in the 400 no-server sections);
  pilot a second runner that plays those sections under the sim's virtual clock, live sections on the real clock; sharding is the
  fallback. The suite needs a 6 GB heap since v0.6.236 (4 GB dies in section 180): each `new Bot` parses its own cardfx (~2.9 MB of heap; a likely share, not profiled); share one parse, and find what the suite keeps. *Done when* one runner gives the same
  assertion count, green ×3, on node's default heap. Docs: spec §5.7, §7.
- **The helper lock's release** (main's answers of 3 Nov): the client locks all helpers on while a bot is seated until the bot
  proves a whole combat on lines alone. *Done when* asked, when ready. Docs: RULINGS D-62, D-94.
- **History comments in `elysium-bot.js`**: trap comments only where a round touches (O-28 Q6); first those saying the bridge
  delivers inside the send (L-92). *Done when* the owner has chosen; then per round.
- **Section 69b's decay check**: `o4.pick === ctxC.card ? true : o4.pick ===
  ctxC.plain` passes for either pick and reads no score, so the streak's −0.30 on the card line is untested. *Done when* 69b
  compares the card score with and without the streak.

## The sweep register (D-135): `SWEEP-REGISTER.md` by class; a round takes one; *done when* its class is empty
- **The active entries** (7.5 Protection Racket's +1 against a titled actor; 8.3 Bait and Switch by a non-baron; 10.17 Bonding
  [DOM]'s bleed and limit; 11.1 Revelations' predator never asked): rules broken in the 240 or a smoke, each a release of its
  own (D-135; Claude orders them, D-137). The missed
  options (4.6 the onward bounce, 5.2 the .44 Magnum's maneuver, 8.6 Freak Drive after a failed referendum, 9.8 Form of Mist's
  continue, 10.1 Faceless Night [OBF], 10.2 burning another's card, 10.16 Vessel's and Anarch Troublemaker's burns, 12.2
  Precognition and Spirit's Touch [AUS], 13.10 a host's income picked with no host) wait in their classes until their class's
  round.
- **The fidelity pass** (D-138): `cardfx-fidelity.json` and CARDS.md's `text-checked` / `exact` per deck; the five base starters
  were read in v0.6.241. Next the other 13 V5 decks' cards, a deck a round or riding with C's families (D-132). *Done when* every
  deck's text-checked is N/N and each gap it finds is in the register.
- **1. Retainers: version and holder** (R-47): next; its design question first (where another seat's retainer's version comes from).
- **2. `aggr` misreads.**
- **3. Another minion's sentence read as the player's** (L-98's rest).
- **4. Another seat's play the bots do not read** (mostly a human's: the readers' rounds, D-132, the first right after C1; 4.6's
  onward bounce, 4.12's ballots and 4.17–4.19 are between bots).
- **5. Maneuvers: direction and source.**
- **6. Records by name.**
- **7. Conditional and capped values** ("with an additional +N … if", a family for C).
- **8. Requirements, conditions and gates.**
- **9. Key and compiler shapes.**
- **10. Unbuilt modes, targets and riders.**
- **11. Windows: who is asked, and when.**
- **12. Combat's steps** (C2's neighbours).
- **13. Choices around a card**: Claude's priors, each a design to the owner first (D-87).
- **14. Hand size and replacement** (14.4–14.7, all latent).

## Known, not built (bot side)
- **The TWD profile's rebuild** (D-110, O-37, O-38): the shipped profile's 14 article-last keys (`Barrens, The` …) hold only
  the merged decks' share; a few decks count twice. A v5 rebuild (scratch: 4,709 decks, Magnum under 10) drops a name the bot
  records for two cards (`Pentex(TM) Subversion`, hacking's `Parthenon, The`). *Done when* the bot reads both files by KRCG id
  (or they carry every cardfx name), every deck's library names hit a key, and the rebuild ships with a sim footprint.
  Also: the v5 nicknames are aliases (types dropped in `krcg-v5.js`).
- **Hand names out of the console outside debug** (main, 11 Nov: the security plan's item 6): an online host can read a bot's
  console, which names hand cards. *Done when* only debug names them, section-tested.
- **The gates on the root's release** (Q4, main's yes of 3 Nov): the canary, the suite's
  server and 154f, the arena, the sim and the hotseat gate read the root's client and server and `client/`'s protocol, the copies
  go, STATUS pins the main commit. *Done when* every gate reads the root and CI is green on it.
- **Steal pair under a combat ends**: the stealer's side does not apply v0.6.196's rule when the victim's Majesty ends the combat.
  *Done when* `ana-ledger.py` prints equal pairs on a smoke with that case. Docs: RULINGS O-12.
- **Nosferatu's Fame chain** (Fame → rush → torpor → rescue) has never run; the rush is not priced in pool. *Done when* a sim series
  shows famed rushes, famed torpors and rescues. Docs: RULINGS O-10.
- **Taste of Vitae**: the 2+ gate is built (v0.6.156); not built: play at 1 when the vampire sits at 0–1 blood or two copies clog,
  and "with a Taste in hand, prefer the damage card this round". *Done when* both are section-tested. Docs: RULINGS D-23.
- **Intercept banking** (B-55f-b: deck-axis, measure first) and **2 of 187 blocked rows still `by: null`** (B-55e-b). *Done when*
  banking is measured on a sim series and no blocked row lacks `by`. Docs: the data repo's `bot-history/CLAUDE-v2-2026-10-20.md` 155–165, debt 68.
- **The turn ledger's gaps** (26d): a barred bleed becomes an illegal marker that can still win the score contest (the vampire stays
  home); of the card-in-play actions only the rushes and the card burns are booked (v0.6.217; not Warsaw, Chantry). *Done when* the
  marker cannot win and every card-in-play action is booked.
- **Home pricing's six soft spots** (42c, unfixed): `_keepBlocker` holds the last actors, not `_priceHome`'s bodies; `predHits`
  reads the announced bleed, `hitMax` the realised one; a bounce valued as pool saved only; the rate leans on `myFc`; wakes counted
  whoever could play them; 0.9 / pStop / 'a card + a blood = 1 pool' / fwd 0.5 unmeasured. *Done when* each is fixed or measured.
  Docs: the data repo's `bot-history/specs/spec-home-pricing-2026-09-19.md`.
- **The minion head reads last turn's `_turnActs`** (Change of Target's ledger): it is reset after `_strategize`, `_probeOrder` and
  `_minionKeyOrder` ask. *Done when* the reset comes first, footprint read.
- **The locked routes' last rungs** (round F, D-116 (5)): the block decision counts the unlock reactions, not the Underbridge Stray
  (the route's last rung, an ally burned); `_wakeBlockersAfter` (the keep-blocker read) counts wakes only (Eyes of the Wild by a
  vampire already attempting to block: `SWEEP-REGISTER.md` 10.12). *Done when* each reads the route, or is ruled out.
- **The chump gate is not the commit** (round B): `bareBlock` 'chump' passes on any chump body, then `_commitBlock` picks
  its own (`_pickBlocker`); both paths. *Done when* the commit takes the gate's body, section-tested.
- **Bot diablerie** (the fixed-vote-majority rule). *Done when* the owner schedules it. Docs: RULINGS O-15.
- **Vote-count residue**: three channels at once (menu line, counter, both) under-count; Protected District's votes come from the
  counter only. *Done when* main ships the additive counter verb or the client writes both. Docs:
  `specs/spec-referendum-terms-2026-09-18.md`.
- **The influence floor at `poolFloor` 0**: the influence phase leaves `poolFloor` (6 for every persona; 1 with no ready minion);
  a knob of 0, which only test fixtures set, lets it spend the last pool (D-97's inventory). *Done when* the floor is at
  least 1 and the fixtures that relied on 0 are read (L-16).

## From the 11 Oct review of VTES-Player (ideas only, no code: D-56)
- **Blood-hunt voting** (their item 8): `_refVoteDir` reads only pool terms, so a blood hunt reads "nothing in it for me" and the
  bot abstains; our bots never diablerise, so the hunt is always on someone else's diablerist — vote for it, harder when that is my
  predator or the table's leader. *Done when* a section shows the FOR vote.
- **The §8 law for the meta layer** (their item 3): a term equal for every option cannot change the choice; `_tableThreat()` is only
  traced today and must enter where options name different seats (the bounce target, the rush target, the voter and the terms,
  keep-a-blocker / block-or-pass), from ONE shared seat valuation. *Done when* the meta layer's first consumer reads it there.
- **Yewon's and Alexa's torpor use** (D-111): no vote from torpor, but a card cycled. *Done when* the meta layer prices a card
  against a random draw.
- **The cancel cards** (the owner, 18 Nov: a classic case for the meta layer; D-122): Sudden Reversal decides on simple priors
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
- **Two arena handshake misses** (v0.6.235's smokes; none in the sim): a match's end cut its last round (a Fame oust), and a rush
  chosen 1 ms after the rusher's combat sent its target to torpor met no opponent (a lagging view). *Done when* both are read.
- **`ana-windows.py` does not know the floor** (v0.6.240): at the client's pace a bot answers a window after its question has left
  the screen; the 240's audit calls 3,578 of 3,906 bleed totals "ran out" (v0.6.239: 4), none lost. *Done when* it adds the floor.
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
