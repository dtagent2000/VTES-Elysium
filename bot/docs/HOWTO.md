# HOWTO — running, debugging, analysing (20 Oct 2026; distilled from SKILLS.md, whose full text is `history/SKILLS-2026-10-20.md`)

Everything runs from inside `bot/`. Third-party data (`vtes.json`, the TWDA) is fetched or copied from the private data repo first
(root `CLAUDE.md`). The card data is KRCG's v5 dump, written as the v3-shaped `vtes.json` every tool reads by `krcg-v5.js`:
`curl -o vtes-v5.json https://static.krcg.org/data/v5/vtes.json && curl -o expansions.json https://static.krcg.org/data/v5/expansions.json
&& node krcg-v5.js` (`--compare OLD.json` prints the field diff against a v3 file by card id). When the network policy blocks it (a 403
on CONNECT), clone `dtagent2000/VTES-Elysium-data` beside the monorepo and copy the two dump files in. KRCG's v3 file
(static.krcg.org/data/v4/vtes.json since 8 Nov) stopped at Sabbat V5, without the last 63 cards and the errata: only a `--compare`
input now. The TWDA: `twda.json`, KRCG's
v5 TWDA (`curl -fL -o twda.json https://static.krcg.org/data/v5/twda.json`; `twda.py` refuses the old list). Check what a reader `open()`s before naming a data file.

## Running
- **The sim table** — `node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue --seeds 10 --trace /tmp/sim-x`: every
  seating (24 for four decks, 120 for five; `--seatings random --matches N` or `fixed`) × N deals of the headless hotseat table
  under a virtual clock, one worker per core, ~1 s a match. `--profile client` (default: paceMs 3100, askSecs 20, deckName) or
  `arena` (0 / 3). `--resume`, `--summarize DIR`, `--real` (the same table on the real clock, 4–6 min a match). The same spec gives
  the same trace byte for byte, so `python3 ana-sim-diff.py A B` compares two runs match by match (IDENTICAL / SAME-PLAY /
  DIVERGED with the first differing decision): before / after a change, or version against version (copy `bot/` to scratch with
  the other `elysium-bot.js`). Two versions' traces differ in the result row's `bot` at least: for a clean-up release, `sed` the
  new version to the old in a copy of its traces and expect IDENTICAL (C2). Traces are arena-shaped (`match-NNNN.jsonl`, a `result` row), ~0.5 MB each — keep series in scratch.
  SUMMARY.md lists post-game ousts and the `zeroPool` count (a bot deciding at pool ≤ 0 before its own oust = a rules fault; a payment
  of the last pool that ousts at once leaves no decision at 0 and is not counted — BOARD). When a footprint shows DIVERGED, check whether
  the two decision sequences realign once one missing row is dropped. A `--decks` key the bot does not embed plays `deck-<key>.json`
  beside the sim (a test input: the client's menu offers `ARCHETYPES` only). A deck's deal is fixed by its seat and the deal seed, so
  `--seatings all --seeds K` gives each deck K × seats deals, the same one in every seating of a seat: enough for version against
  version, too few to rank decks (L-45). A deck-strength read takes a fresh deal per match: `--bench none` (every seating once per seat,
  each match a seed of its own; `docs/reports/REPORT-toreador-sim-2026-11-06.md`).
- **The V5 precons** — `node gen-precon.js` (`vtes.json` beside it): writes the missing `deck-<key>.json` for every V5 precon and
  compares the existing ones, and the decks embedded in the bot, by KRCG id and quantity; `--check` writes nothing (exit 1 on a DIFF or
  a name the bot cannot resolve: the check after a `vtes.json` refresh), `--list` prints the keys (`banuhaqim` … `pathpower`). Each
  precon the bot does not embed carries its combat posture (`combat`: chase / snipe / wave, D-102) from the generator's `POSTURE`
  table, checked like the cards; `--posture` writes the table's posture into the existing files (v1.1.0).
- **The card ledger** — `node gen-card-ledger.js --sim DIR [--sim DIR …]` → `docs/CARDS.md`: per card the coverage verdict, tier,
  decks, rulings, the suite sections that name it and its uses per deck in the sims; the class map ranks what a wave would build.
  With `vtes.json` beside it the crypt too (v1.1.0, D-108): every vampire (its ability, a class per sentence, its curated keys and
  the crypt readers that read them: modelled only when they cover every sentence) and the crypt class map. Its self-test runs before
  every page (`--self-test` prints it); a classifier miss or a curated crypt key with no class in `FX_CLASS` fails the run, so a wave
  adds its new keys' classes there.
  Regenerate it from the release bytes' runs: the 240-match design and the V5 smoke (each of the 14 new keys:
  `node elysium-bot-sim.js --decks KEY,malkavian,tremere,nosferatu,ventrue --seatings random --matches 12 --seed 1 --trace /tmp/v5/KEY`). Every one of those
  12 matches deals from seed 1: a single copy deep in a library is never drawn ('unseen' is then the deal, not the bot) — add `--seeds 4`
  to see one played (v0.6.215).
- **The suite, frozen** (the ×3 gate; three snapshots in a row, one run at a time, ~300–420 s each), from the repo root:
  ```
  S=<a scratch dir>; L=r1; D=$S/snap-$L; rm -rf $D; mkdir -p $D/bot; cp elysium-vtes-bord.html $D/     # root client one level up: 154f
  (cd bot && tar --exclude='./serie-*' --exclude='./bench-*' -cf - .) | tar -xf - -C $D/bot
  cd $D/bot && sha256sum elysium-bot.js test-bot-logic.js elysium-cardfx.json > ../sha.txt
  timeout 600 node --max-old-space-size=4096 test-bot-logic.js > ../suite.log 2>&1; echo "EXIT $?" >> ../suite.log   # run_in_background, then poll
  ```
  The next edit in `bot/` cannot leak into a run, and the PR quotes the sha that ran. The heap flag is not optional: on a ~2 GB
  default heap the suite dies out of memory after section 136e (29 Oct; CLAUDE.md "Gates").
- **CI** (`.github/workflows/bot-gates.yml`, D-109): every PR that touches `bot/` or the bundle, every such push to `main` and a
  daily run on `main` (03:17 UTC) run the gates that need no person and no previous bytes (the step list is the file); on any
  other PR the job `bot-gates` skips its gate steps and succeeds, so the check can be required on `main`. A gate that skips fails
  its step, and the root's bundle must equal `bot/`'s (a bundle change ships as a release). A red daily run is the bot's to
  answer; a mail may reach nobody (GitHub mails the cron line's last editor), so look:
  `gh api 'repos/dtagent2000/vtes-elysium/actions/workflows/bot-gates.yml/runs?branch=main&per_page=1' --jq '.workflow_runs[0] | {event, conclusion}'`
  Still the round's: the suite ×3, the sim footprint, the arena smoke and
  the audits, a new section's destructive check, main's client suite when the wire changes (red by design until main re-embeds a
  new guide). A red the PR did not cause: the suite's 78c flake -- re-run the failed job once (`gh run rerun <id> --failed`) and
  say so in the PR; `test-cardfx` / `gen-precon --check` red with no card change -- KRCG's data moved, a round of its own; a
  doc-budget version line on a PR -- main released (a scheduled run or a push only warns), refresh STATUS in the PR. The correctness lint by
  hand, from `bot/`: `npx --yes eslint@10.13.0 -c tools/eslint.config.mjs --suppressions-location tools/eslint-suppressions.json .`
  -- every finding fails; the suppressions file is `{}` since C2 and only shrinks (never `--suppress-all` / `--suppress-rule`:
  CI fails a PR that adds one).
- **The canary against main's release** (the second canary run): a scratch dir with `bot/test-bot-canary.js`, `bot/elysium-bot.js`,
  the root's `elysium-vtes-bord.html` and `client/ELYSIUM-PROTOCOL.md`; `node test-bot-canary.js` there.
- **Main's client suite beside the release bytes** (when the wire or the timing changed): a scratch copy of `client/` (never the
  real one — THE RULE), the bot bundle from `bot/` copied into it (`elysium-bot.js`, `elysium-cardfx.json/.js`,
  `elysium-twd-profile.json/.js`, `elysium-twd-archetypes.json/.js`, `START-HERE-BOTS.html`), then `node test-client-logic.js`
  there (main's CI does the same with the root's bundle, `.github/workflows/client-gates.yml`). Its LIVE tests drive the real bot.
- **One section, any bot** — `bash tools/run-section.sh <bot.js> <section.js> [cardfx.json]`: the suite's own preamble (`ok`,
  `sleep`, `SI`, `mkClient` / `connectWithRetry`) + a fresh server on a random port + the section, in a temp dir. Cut a section from
  its `/* NNN)` line to its OWN closing brace (not to the next `console.log`). Run on the new bytes (green) and on
  `git show origin/main:bot/elysium-bot.js` (red). An old bot needs its OWN cardfx when the compiled data changed. Guard calls to
  new methods (`typeof u._x === 'function' && …`) so the old bytes fail clean instead of aborting; race a live wait the old bot
  never satisfies (`.catch(() => null)`).
- **Mutant isolation** — `python3 tools/mutants/mutate-v0_6_198.py /tmp/mut`: every mutant of a new rule must FAIL at least one
  assertion, not hang (race any await a mutant could leave pending against a short sleep).
- **The arena** — `node elysium-bot-arena.js --matches N --bots K --personas expert,… --decks hacking,sewer,… --start-pool 30
  --match-timeout 600 --trace ./serie-x [--seed N] [--fixed-seats] [--knob k=v] [--knob SEAT:k=v]`. Seating is random per match by
  default (`--seed` repeats, `--fixed-seats` = deck order). Decks: hacking (the tournament benchmark), sewer, malkavian, tremere,
  nosferatu, ventrue. `--knob` is whitelisted (`WL`; any other name is ignored with a warning; `aggression` / `blockShy` are not in it). Timer-bound (~2.5 % of a core each), so many run in parallel; 4p30 ≈ 2–4 min, 5p30 ≈ 3–4 min on the real
  clock. Launch it detached (one process per match) and poll its trace directory. Pre-flight: one match before any series on a change that
  reads live protocol state, and read the new emit rows.
- **The mirror bench** (on the sim since round C3, 3 Nov 2026; `docs/reports/REPORT-bench-controls-sim-2026-11-03.md`) —
  `node elysium-bot-sim.js --bench SPEC --trace DIR`: SPEC `none` (the negative control), `persona=NAME`, `knob=k=v[+k=v]`; the
  variant sits in each seat of every seating once (24 × 4 = 96 for the starters; `--design design-balanced-serie-bal1.txt` = the old
  48; `--seeds K` multiplies), each match with a deal of its own, the same in every arm. `--bench-deck DECK` pins the variant to a
  deck; `--knob k=v` is every seat's baseline, the variant's knob overrides it in its seat. The CONTROL is run with the arm's design,
  `--seed` and `--knob` baseline (`--vp` refuses pairs whose seed or non-variant seats differ, and counts them); a `none` control is
  read at the arm's variant seat, so it doubles as a pinned control. Read: `python3 ana-bench.py DIR...` (each arm's edge: the
  variant seat's VP minus the table's mean) and `python3 ana-sim-diff.py --vp CONTROL ARM` (the claim: per-match differences, a
  paired SE, VP and win share; about ±0.27 VP at 96, ±0.15 at ~300). Prove the knob FIRES first (a trace row, a counter, a test —
  a manifest shows only that it is set): an arm with no DIVERGED match is inert, its +0.00 no no-loss result (`--vp` says so). The
  arena's inert-arm check is moot here: an inert arm is IDENTICAL to its control. The controls on v0.6.217: none −0.10 ± 0.29;
  `poolFloor=22` −0.65 paired (wins 20 → 5); novice +0.09 (not weaker). A 12-match series supports mechanism counts only.
- **The probe lab** — `node lab-probe.js N SEED ARMS > lab-SEED.jsonl` then `python3 ana-lab.py lab-*.jsonl`: N random tables, one
  minion phase per arm, the same table in every arm (~2 s per table and arm); measures decisions, never the wire's timing.
  Pattern for any once-a-match decision.
- **The hotseat tool** — `node elysium-bot-hotseat.js --seed 11 --start-pool 12 --ask-secs 2 --out ev.jsonl` (the client html
  beside it; `--arm tally|full|nohold`); v1.3.0's `runTable` takes `personas`, `seatKnobs`, `onEvent` (the sim uses them).
  `test-bot-hotseat.js` is the gate; `BOT=./old-bot.js node test-bot-hotseat.js` is its destructive check. The sweep is the ONE part
  of the client the tool imitates instead of runs (it follows `hotBridge._out`): if main changes the sweep, the tool must follow.
- **The tokens in a browser** — `bash bot/tools/tokens-in-browser.sh <vtes.json> <expansions.json>` from the root: main's play-test
  rig as it is; an in-page bot's Grand Ball pair and Jack, each chip and hover text, a screenshot. A diagnostic.
- **The hotseat in a browser** — `node tools/hotseat-in-browser.js [--bot F] [--sweeps N]`: the client's hotseat with three bots
  in Chromium (NODE_PATH: playwright); counts stale-dropped answers.
- **A human's Grand Ball** — `bot/tools/playtest-ball/scenario.json` (its `about` has the steps) and a Toreador test deck, at main's rig.
- **A debug bot at a live table** — `node elysium-bot.js --server ws://HOST:8123 --room R --pass P --debug [--no-debug-weights]`;
  refused at a Tournament table; its hand goes to the whole table and the other bots look away.
- **Coverage** — `node gen-deck-coverage.js deck-<clan>.json --out docs/coverage/deck-coverage-v5-starter-<clan>-black-chantry-2020.md`
  ("can the bot play this deck?"; a master counts only through `MASTER_KEYS`; the tool has two version sites, bump both). Every `fx.`
  key the bot reads is in its `CLASS` map (v1.1.39); a new one prints the ⚠ line — classify it in the same round. `coverDeck()` is
  exported: the ledger reads the same verdicts.
- **cardfx** — `node cardfx-compile.js --report` (needs `vtes.json`); read the inherited / mismatch / X lists; run `test-cardfx.js`
  BEFORE the suite after adding an fx key. Audit curated vs auto before touching a curated field: compile once without the
  overlay and once with, diff the field per curated name. Political cards: `e.ref.pool` (terms), `e.ref.tags`, `e.ref.fx`;
  never a referendum outcome in `modes[].fx`. Adding a family: `refTerms()` / `REF_PER` / `actWhen()` in the compiler + the NEG
  list in `test-cardfx.js`. `req.titles`, `req.unmodelled` (callers fail closed).
- **The TWD profile** — `python3 twd-profile.py` / `twd-archetypes.py` (need `vtes.json`, `twda.json`; the archetypes also vtes-skill:
  README). Both overwrite the shipped files: run them in a scratch copy until a release; a rebuilt profile is first reproduced
  byte for byte by the old script (O-37); a new share is APPENDED.

## Analysing a series (sim or arena)
- `ana-gates.py DIR` (the gate after a series: one PASS / FAIL line per audit below and for the matches and `zeroPool`, exit 1 on a
  FAIL; its header is the policy -- the leads and, on the sim table, the windows are information; `--self-test` plants a fault per gate) ·
  `ana-sim-diff.py A B` (footprint) · `ana-ledger.py` (bleed pairing both ways — `VANISHED` = 0; steal pairs equal, a `STOLE >
  VICTIM LOST` row is a lead; dealt vs taken; `LESS, UNEXPLAINED`) · `ana-block.py` (0 violations) · `ana-inv.py` (invariants;
  ~1 flag in 3 matches is the baseline; a new flag kind or a jump = a line the log cannot type (add its kind) or a real bookkeeping
  difference; `ELY_POOL_TRACE=1` names the code line behind a pool change) · `ana-windows.py` (the actor's reactions-only windows: ran out
  and went through = 0 — since v1.1 past 2.5 s plus the bots' pace, with the table quiet that long inside the window; a slower window
  of paced answers is 'answered at the pace'; contests at the clock split blocked / failed; every `stale-answer` row read) · `ana-rare.py` (the rare paths a section proves:
  superseded combats, held / released turns, rush complies by path, fizzles, resolutions at an ousted seat) · `ana-jack.py` (Smiling Jack's
  plays, how each left play, its rounds in play; the burns the knob `jackBurn` picked, by deck, and how many were blocked) · `ana-wait.py` (tempo) ·
  `ana-probe.py` (`probe-order` / `probe-hold` rows) · `ana-cards.py` (uses per card, never-played, untitled plays) ·
  `ana-combat.py` + `ana-combat2.py` (handshake integrity 100 % on a bot-only table, agreement, `hsMiss`) · `ana-rush.py` ·
  (`ana-windows.py`'s gate of 0 is the arena's; on the sim it informs: 4 of 5143 windows ran out on the 240) ·
  `ana-home.py A B` (paired home / blocks / damage / VP) · `ana-open.js` (the opening) · `gen-match-dossier.js <trace>` (one
  reviewable file per match; read Manifests → Endgame / VP → pool trajectories → then hunt) · `gen-trace-harvest.js <dir>`
  (metrics + the price referee: printed vs paid cost; a MISMATCH voids the series) · `gen-batch-review.js` · `gen-null-review.js`.
- **Emit vocabulary**: `manifest` (seat / deck / persona / strategy / axes / knobs, once at dealt — deck and seat come from HERE,
  never from a name) · `snapshot` (unlock | react: pool, edge, handN, ready, torpor, pubs) · `decide` (q / ctx / out: pick, why,
  scores, tag) · `play` (card / window / vamp) · `plan` · `influence-pick` (intent) · `raise` (reality) · `block-eval` /
  `block-made` / `blocked` / `through` (`final`, `bounced`, `via`) / `took-bleed` / `torpor` / `ousted` · `combat-round` /
  `combat-phase` · `referendum-called` / `referendum` / `ref-vote` · `wait` / `tempo` · `probe-order` / `probe-hold` ·
  `stealth-stack` / `stealth-ahead` / `intercept-chat` · `bleed-total` / `stale-answer` · `haven` / `bank` / `spy-cancel` ·
  `inv-flag` · `server-err` · `result` (winner, vp map, oustOrder). The FACIT (the union of hands per turn) is assembled by the
  dossier; no single bot ever sees it.
- **Reading rules**: cite trace refs for every claim; grade against the manifest, not perfection (persona-consistent deviations
  are not misplays); a recommendation carries an explicit NOT recommended section; the Goudie bar is ~2 VP/match; the FIRST unlock
  snapshot may be pre-init (read `dealt.startPool`); restraint is a finding too;
  one match is an anecdote, a series before a verdict; read recorded state (the last snapshot before the event), not inferred
  state; explain a handshake miss by printing both rows and every row of all bots ~9 s before it.

## Debugging
- **Two bots on an in-memory relay** (section 141's `duel141`): each `send` delivers to the other's `_dispatch` after `delay` ms;
  a 300 ms delay reproduces client-pace races the arena never shows; a whole two-bot combat in 30 ms – 3 s. A whole turn between
  two bots: `Promise.race([A._playTurn(), sleep(12000)])` (section 149).
- **A recorded wire, no server**: a `transport` that records each frame with its time, `await u.connect()`, seat / started /
  players by hand, a real `paceMs`; `deadline − sentAt` is the clock as the human sees it. A wait created asynchronously is sampled
  after it exists (`until(() => u._phaseWait)`).
- **Prototype instrumentation**: wrap `Bot.prototype` methods in a scratch script to tag stashes and log every consumption; the
  same script is the post-fix proof.
- **The guilt experiment**: disarm a suspect condition with `&& false`, rerun — green = guilty, everything else exonerated.
- **Feed a classifier the SENT text** (`NAME (bot)`), never the template; specific shapes before generic ones.
- **A peek is not a take**: `_awaitOppStrikePeek` leaves the line pending; `_awaitOppStrike` consumes it.
- **e2e waits**: `waitFor` walks and consumes, `waitAny` is cursorless — two messages with no causal order need `waitAny`; the
  server never echoes a sender's own log lines (prove the attacker's note in the DEFENDER's inbound).
- **Baseline first when the suite fails, and check the baseline IS one**: run the last release the suite was green on.
- **Raw tail over grep filters** when a run fails unexpectedly; save gate runs to a file when hunting flakes.
- **Timing changes**: list every writer of the fields the change reads (`grep -n "deadline = \|\.timer = "`); count arm sites vs
  restart sites.
- **Sandbox**: never `pkill -f <pattern>` (it matches your own shell; kill by PID); `cd DIR && ( … ) &` backgrounds the `cd` too;
  pipe report output with raw bytes through `iconv -c`; `grep -c` exits 1 at zero matches.
- **Patching with python**: count==1 anchors, write after every replacement passed; replace-all for multi-site emits; never
  tail-append to a line ending in a comment; copy raw characters (em-dash, curly quotes) from the file.

## One-off tools (each reproduces a committed report; not gates)
`ana-combat-sum.py` (`REPORT-combat-series-table.txt`) · `REPORT-bench-controls.md` (the arena bench, 27 Sep) ·
`sweep-pilot.py`, `sweep-pass2.py`, `sweep-full.py` (the cardfx sweeps, `REPORT-cardfx-sweep-*.md`) · `diag-give-probe.js`
(a live give / given probe through the server, ~70 s; copy it for any feature whose two halves meet only through the server) ·
`diag-a1-stash-probe.js` · `gen-plan-review.js` · `gen-sweep-audit.js` · `gen-forecast-calibration.js` (to revive, BOARD).
Series and benches run on the sim (above; C3 retired the chat-era run scripts); an arena series is `elysium-bot-arena.js` itself,
one process per match.
