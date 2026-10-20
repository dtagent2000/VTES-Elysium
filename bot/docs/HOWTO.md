# HOWTO — running, debugging, analysing (20 Oct 2026; distilled from SKILLS.md, whose full text is `history/SKILLS-2026-10-20.md`)

Everything runs from inside `bot/`. Third-party data (`vtes.json`, the TWDA) is fetched or copied from the private data repo first
(root `CLAUDE.md`): `curl -o vtes.json https://static.krcg.org/data/vtes.json`; when the network policy blocks it (a 403 on
CONNECT), clone `dtagent2000/VTES-Elysium-data` beside the monorepo and `cp vtes.json ../VTES-Elysium/bot/`. The compiler reads
KRCG's v3 shape (`name`, `card_text`, `blood_cost`); the v5 file is a different format. The TWDA: `twda.json` (the list export,
the base) + optional `twda-vdb.json` (the dict). Check what a reader `open()`s before naming a data file.

## Running
- **The sim table** — `node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue --seeds 10 --trace /tmp/sim-x`: every
  seating (24 for four decks, 120 for five; `--seatings random --matches N` or `fixed`) × N deals of the headless hotseat table
  under a virtual clock, one worker per core, ~1 s a match. `--profile client` (default: paceMs 3100, askSecs 20, deckName) or
  `arena` (0 / 3). `--resume`, `--summarize DIR`, `--real` (the same table on the real clock, 4–6 min a match). The same spec gives
  the same trace byte for byte, so `python3 ana-sim-diff.py A B` compares two runs match by match (IDENTICAL / SAME-PLAY /
  DIVERGED with the first differing decision): before / after a change, or version against version (copy `bot/` to scratch with
  the other `elysium-bot.js`). Traces are arena-shaped (`match-NNNN.jsonl`, a `result` row), ~0.5 MB each — keep series in scratch.
  SUMMARY.md lists post-game ousts and the `zeroPool` count (a bot deciding at pool ≤ 0 before its own oust = a rules fault). When a
  footprint shows DIVERGED, check whether the two decision sequences realign once one missing row is dropped.
- **The suite, frozen** — `snap-suite.sh <label>` (scratch): `tar --exclude='./serie-*' --exclude='./bench-*'` `bot/` to
  `snap-<label>/`, write the sha256 of the bot, the suite and the cardfx beside the log, run `timeout 600 node test-bot-logic.js`
  THERE, detached, and poll; three in a row = the ×3 gate, and the PR quotes the sha that ran. ~300–420 s a run; one at a time.
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
  nosferatu, ventrue. Timer-bound (~2.5 % of a core each), so many run in parallel; 4p30 ≈ 2–4 min, 5p30 ≈ 3–4 min on the real
  clock. Launch detached and poll `progress.txt`; one process per match. Pre-flight: one match before any series on a change that
  reads live protocol state, and read the new emit rows.
- **The mirror bench** (until C3 ports it to the sim) — `bench.sh ARM W NW N SPEC [DECK] [KNOB]` + `ana-bench.py`: 48 matches, the
  variant in every seat, read against the negative control (A vs A, ±0.5 VP at 48); `design-balanced-serie-bal1.txt` is the
  balanced design (6 cyclic orders × 2). The scripts carry chat-era paths (`/home/claude/w`) and read a gitignored
  `serie-cmb1/design.txt`: fix both before running. A 12-match series supports mechanism counts only.
- **The probe lab** — `node lab-probe.js N SEED ARMS > lab-SEED.jsonl` then `python3 ana-lab.py lab-*.jsonl`: N random tables, one
  minion phase per arm, the same table in every arm (~2 s per table and arm); measures decisions, never the wire's timing.
  Pattern for any once-a-match decision.
- **The hotseat tool** — `node elysium-bot-hotseat.js --seed 11 --start-pool 12 --ask-secs 2 --out ev.jsonl` (the client html
  beside it; `--arm tally|full|nohold`); v1.3.0's `runTable` takes `personas`, `seatKnobs`, `onEvent` (the sim uses them).
  `test-bot-hotseat.js` is the gate; `BOT=./old-bot.js node test-bot-hotseat.js` is its destructive check.
- **A debug bot at a live table** — `node elysium-bot.js --server ws://HOST:8123 --room R --pass P --debug [--no-debug-weights]`;
  refused at a Tournament table; its hand goes to the whole table and the other bots look away.
- **Coverage** — `node gen-deck-coverage.js deck-<clan>.json --out docs/coverage/deck-coverage-v5-starter-<clan>-black-chantry-2020.md`
  ("can the bot play this deck?"; a master counts only through `MASTER_KEYS`; the tool has two version sites, bump both).
- **cardfx** — `node cardfx-compile.js --report` (needs `vtes.json`); read the inherited / mismatch / X lists; run `test-cardfx.js`
  BEFORE the suite after adding an fx key. Audit curated vs auto before touching a curated field: compile once without the
  overlay and once with, diff the field per curated name. Political cards: `e.ref.pool` (terms), `e.ref.tags`, `e.ref.fx`;
  never a referendum outcome in `modes[].fx`. Adding a family: `refTerms()` / `REF_PER` / `actWhen()` in the compiler + the NEG
  list in `test-cardfx.js`. `req.titles`, `req.unmodelled` (callers fail closed).
- **The TWD profile** — `python3 twd-profile.py` / `twd-archetypes.py` (need `vtes.json`, `twda.json`, optional `twda-vdb.json`);
  a rebuilt profile is first reproduced byte for byte by the old script; a new share is APPENDED.

## Analysing a series (sim or arena)
- `ana-sim-diff.py A B` (footprint) · `ana-ledger.py` (bleed pairing both ways — `VANISHED` = 0; steal pairs; dealt vs taken;
  `LESS, UNEXPLAINED`) · `ana-block.py` (0 violations) · `ana-inv.py` (invariants; ~1 flag in 3 matches is the baseline;
  `ELY_POOL_TRACE=1` names the code line behind a pool change) · `ana-windows.py` (the actor's reactions-only windows: ran out
  and went through = 0; contests at the clock split blocked / failed; every `stale-answer` row read) · `ana-wait.py` (tempo) ·
  `ana-probe.py` (`probe-order` / `probe-hold` rows) · `ana-cards.py` (uses per card, never-played, untitled plays) ·
  `ana-combat.py` + `ana-combat2.py` (handshake integrity 100 % on a bot-only table, agreement, `hsMiss`) · `ana-rush.py` ·
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
- **Reading rules**: cite trace refs for every claim; grade against the manifest, not perfection; restraint is a finding too;
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
`ana-combat-sum.py` (`REPORT-combat-series-table.txt`) · `make-bench-report.sh` (`REPORT-bench-controls.md`; chat-era path) ·
`sweep-pilot.py`, `sweep-pass2.py`, `sweep-full.py` (the cardfx sweeps, `REPORT-cardfx-sweep-*.md`) · `diag-give-probe.js`
(a live give / given probe through the server, ~70 s; copy it for any feature whose two halves meet only through the server) ·
`diag-a1-stash-probe.js` · `gen-plan-review.js` · `gen-sweep-audit.js` · `gen-forecast-calibration.js` (to revive, BOARD).
Chat-era run scripts (`run-bal.sh`, `poll-bal.sh`, `run-m.sh`, `run-t.sh`, `run-cmb.sh`, `run-ser.sh`, `bench.sh`) carry sandbox
paths; they are retired by round C3.
