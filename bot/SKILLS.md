# SKILLS-arena.md — hard-won techniques for Arena sessions (v1.0, 27 July 2026)

> **9 Sep 2026 — this is the Elysium Bots project's SKILLS.md (formerly SKILLS-arena.md).** Recipes for the client/server/harness live in the main project's SKILLS.md. Raw-character rules, patch discipline and gate order apply unchanged.
*Companion to CLAUDE-arena.md. Each entry earned its place by failing first.*

## Running
- **Third-party data in a sandbox (15 Oct 2026):** static.krcg.org can be blocked by the session's network policy (curl: `CONNECT tunnel failed, response 403` — a policy denial, never retry or route around it). Attach the private repo `dtagent2000/VTES-Elysium-data` (read access), clone it beside the monorepo and `cp vtes.json ../VTES-Elysium/bot/`; then `node test-cardfx.js` must read 261/0 including "no drift". **Shapes:** the compiler reads KRCG's v3 file (`name`, `card_text`, `blood_cost`); the v5 file (`printed_name`, `text`, `kind`) is a different format — on it test-cardfx fails its first cost check, so keep v3 until the compiler gets a v5 adapter. The TWDA comes in two shapes and the profile script reads each under its own name: `twda.json` = KRCG's list export (the base), `twda-vdb.json` = the VDB-style dict keyed by id. Check what a reader `open()`s before naming a data file.
- **`gen-deck-coverage.js` writes its report beside itself** (`deck-coverage-<slug>.md` in `bot/`) unless given `--out <path>`; send it to scratch (`bot/.gitignore` keeps a stray one out of git). Its FULL verdict credits a master when any reader of its fx key exists anywhere — Guardian Angel, Haven Uncovered, The Labyrinth and Wasserschloss Anif read FULL while the bot does nothing with them (REVIEW-playtest-2026-10-14, F23).
- **The suite is at the call limit (12 Oct 2026):** `test-bot-logic.js` now takes ~290–300 s (1933 assertions), so a foreground `timeout 290` can cut a green run. Launch it detached with its own timeout and poll inside the same turn: `(setsid nohup bash -c "cd W; timeout 600 node test-bot-logic.js > LOG 2>&1; echo EXIT $? >> LOG" &)`, then `timeout 280 bash -c "until grep -q ^EXIT LOG; do sleep 5; done"`. A hang shows as the last ✓ line before the cut — read which test it sat in (96e did, when its poll stayed frozen).
- **A section with a LIVE part, against the released bot (16 Oct 2026):** a temp dir holding the bot under test as `elysium-bot.js`, the three JSONs and a copy of `elysium-server.js`, plus a runner made of the suite's own `mkClient` / `connectWithRetry` (`sed -n 24,72p test-bot-logic.js`), a server spawn and the section body. The released bot is `git show HEAD:bot/elysium-bot.js` (or `origin/main`). Section 139 ran this way in ~15 s against both versions (41/0 new, 30 red + 11 guards old). A destructive run must END in a tally, never an abort: guard a call to a new method (`typeof u._takeEdge === 'function' && …`), send a new verb through `_dispatch` (an unknown verb is ignored, a missing handler is no crash), and catch a live wait that the old bot never satisfies (`h.waitAny(…).catch(() => null)`).
- **A debug bot from the command line (v0.6.200):** `node elysium-bot.js --server ws://HOST:8123 --room R --pass P --debug [--no-debug-weights]`. The bot reads the room's helper policy and refuses debug at a Tournament table by itself; with another bot at the table its hand goes seat by seat to the humans only.
- **Isolate a new section while building (12 Oct 2026):** cut the section out of the suite into a scratch runner (`ok`, `sleep`, `Bot` from `BOTDIR`), run it in seconds, then run each MUTANT of the new code through it (`mut/mutate.py`: one search-and-replace per mutant, each copied beside symlinked data files). Every mutant must fail at least one assertion — and FAIL, not hang: race any await a mutant could leave pending against a short sleep (137j). v0.6.198: eighteen of eighteen did, after the hanging ones were raced.
- **Three arms at once (11 Oct 2026):** an arena is timer-bound — about 2.5 % of a core and ~150 MB RSS per process (arena + its server), so 16 parallel arenas (6 + 6 + 4 workers, three arms) ran on 2 cores / 8 GB with load < 1 and the suite green beside them. Launch every arm from ONE `launch.sh` (setsid nohup, a worker per line) so a restart is kill-by-PID + `rm -rf bench-ARM` + relaunch. A no-knob control arm can serve a deck-PINNED arm too: read the pinned deck's seat in the control's matches (the games are identical whichever seat you call the variant).
- **Read recorded state, not inferred state (11 Oct 2026):** the blocker's blood inferred as `round-1 blood + taken` hid that a torpored vampire's row reports blood 0 — 'torpor at 1 blood' was mostly 0-blood blockers (vs Ventrue 38 % inferred, 11 % from the react `snapshot`'s `ready[].b`). Take a minion's state from the last snapshot before the event.
- **Rush read (22 Sep 2026):** `python3 ana-rush.py <serie>` — per deck: rush chosen / offered-not-chosen, Deep Song as bleed, the kit when rushing, rush outcomes. For the WHY of each offered rush (structural picks like `permFirst` at 98), print `decide action` rows whose scores carry `rush`.
- **Combat read (22 Sep 2026):** `python3 ana-combat.py <serie>` (play windows, Grapple / Taste pairing, press → next round) and `python3 ana-combat2.py <serie>` (the v0.6.156 `combat-round` rows: range %, dealt / taken per round, press tags, round-end reasons, and the HANDSHAKE INTEGRITY line — rounds with a matching opponent row; 100 % on a bot-only table or a phrase is broken). `run-ser.sh SERIE N [knob=val]` runs one balanced match (`SERIE/design.txt` line N, seed 9980+N); a `chain.sh` of 3 in parallel × 4 groups is ~20 min for 12 matches.
- **Three-series design for a decision change that also fixes a channel (22 Sep 2026):** old bytes → new bytes with the decision knob at 0 → new bytes with the knob on, same seeds; the middle series is the real baseline (cmb1 / cmb1b / cmb2).
- **Pre-flight smoke (20 Sep 2026):** before a 12-match series on a change that reads live protocol state, run ONE match (`run-smoke2.sh` pattern: detached, poll `progress.txt`) and read the new emit rows — smoke1 showed `need` = 1 in 20 of 20 decisions (a stale tally) in five minutes.
- **Per-card read (20 Sep 2026):** `python3 ana-cards.py <serie>` — per deck: uses per match of every library card, the never-played list, play windows, stealth answers, untitled plays of title-gated cards. Needs traces from bot v0.6.139+ (complete play rows).
- **Paired read (20 Sep 2026):** `python3 ana-home.py <serieA> <serieB>` — per deck home / hold share, no-unlocked-body windows, blocks, pool damage dealt (total and per own turn), median oust turn, VP; act-again branches; rounds and timeouts; J1 edge raises.
- **Paired knob series (19 Sep 2026):** `./poll-home.sh SERIE N` (SERIE = serie-home-ctl | serie-home1 | serie-home-r0) — the runner maps the series name to its `--knob`; same seeds 7001–7012 and seating for all three.
- **Opening read (19 Sep 2026):** `node ana-open.js <serie-dir>` — per deck: fit / cap / turn of the 1st and 2nd vampire, ready bodies at own turn 5.
- **Seed series, detached + polled (19 Sep 2026):** `./poll-seed.sh SERIE SEED` — ALONE on the command line (`pgrep -f` matches the calling shell if the arena's name is in the command text; two calls started nothing that way).
- **Balanced deck-level series (19 Sep 2026):** `serie-bal1/design.txt` = 6 cyclic orders × 2 with rotated start; `./poll-bal.sh N` starts run N detached (`--fixed-seats --seed 5000+N`) and polls `progress.txt` for ~280 s; call it again if the match is still alive. After the series: `gen-null-review.js`, the price referee, and the deck × predator VP table.
- **Series runner (19 Sep 2026):** `SERIE=serie-x timeout 292 ./run-null4.sh SEED` — one seed per tool call, `progress.txt` is the truth after a cut call. Always add `avg ready at unlock` per deck to a series read.
- **The null recipe (19 Sep 2026):** predictions into `<serie>/PREDICTIONS.md` BEFORE the first match; then ONE match per tool call:
  `timeout 292 node elysium-bot-arena.js --matches 1 --bots 4 --decks malkavian,tremere,nosferatu,ventrue --start-pool 30 --seed N --trace ./serie-x`
  (a detached chain dies at the call boundary; a call is cut at 300 s; 4p30 = 112–250 s). Then `node gen-null-review.js ./serie-x --out ...`
  (referendum funnel, what beat a referendum, act-again outcomes, torpor → recover, live sightings; `--deck` names the political deck).
- **Audit curated-vs-auto before touching a curated field (16 Sep 2026):** compile
  once with `compile(cards, null).out` and once with the overlay, then diff the field
  per curated name (`/tmp/costaudit.js` pattern: 15 lines, prints `name | auto | curated`).
  It found 27 free cards in one run; the guess list from memory had three wrong names.
- **Chat-tier e2e fixtures: capture the actual text in the ok() message** (`(got: ' +
  m.msg + ')'`) on the first run — two of nine retargets failed on wording I had not
  predicted (two rises in one sentence; the playbook's lowercase name) and the second
  run diagnosed both without a probe.
- **Before shipping a timing change, list every writer of the fields it reads**
  (16 Sep 2026): `grep -n "deadline = \|\.timer = " elysium-bot.js`. A nullable
  field usually has more than one meaning across its writers; the new reader must
  handle each. And count arm-sites vs restart-sites for any "after N s of silence"
  behaviour — they must match.
- **Retargeting a chat-tier assertion to log tier (16 Sep 2026):** `m.t === 'chat' &&
  … .test(m.msg)` → `m.t === 'log' && … .test(m.html)`; any later `x.msg.match(…)`
  on the same variable → `.html`. In bot-vs-bot feeds remember the server does
  NOT echo a sender's own log lines: prove the attacker's note in the DEFENDER's
  inbound (`dlog`). And re-check ordering — a card-play log line often precedes
  the re-announce a previous `waitFor` consumed past; `waitAny` there.
- **A section that calls a brand-new method throws on the pre-change bot at
  its first assertion** (diag-89 on v0.6.113: `0/1 — THROW`). That IS the
  destructive proof — but it proves only that the method is new, not that the
  other assertions would have failed. Name it as such in the release note.
- **Before trusting a `caps.*` / capability flag, grep for how it is SET and for
  every harness that primes it (16 Sep 2026):** `grep -n "caps\.tally" elysium-bot.js
  test-bot-logic.js elysium-bot-arena.js`. Three suite fixtures and the arena all
  seeded the flag by hand — that is the signature of a gate the real table does
  not reliably open. Read the client's side too (`avrFreeAvailable`, `hx()`) before
  asserting what the flag correlates with.
- **e2e waits: `waitFor` walks and consumes; `waitAny` is cursorless.** A `waitFor`
  that scans past a message another wait needs later swallows it for good. Any two
  messages with no causal order between them (a board push vs the chat about it)
  must be waited for with `waitAny`. Symptom: "timeout waiting for X" while the
  inbox dump plainly contains X BEFORE the cursor.
- **To see a section-1 e2e stall, instrument the SUITE COPY, never the bot:** copy
  `test-bot-logic.js` to a probe, wrap `bot.send` and set `bot.onEvent` right after
  construction, stash the host client on `globalThis` and dump `host.inbox` with
  indices in the abort catch. 35 s, one call; found the reordering above.
- **Baseline FIRST when the suite fails — and check the baseline IS one (14 Sep
  2026):** copy the pre-change bot + suite into a separate dir and run it.
  Then grep the journal for the last release the suite was actually green on.
  The 14 Sep abort reproduced on an untouched v0.6.108 and was called
  environmental — but v0.6.108 had shipped unrun, and the abort was its own
  regression (`chat()` mangling the combat prefix at the default name). "Fails
  on the old one too" is exoneration only when the old one was known good.
  Also: the suite needs EVERY owned file beside it (arena, table, decks,
  rig-a1.json, elysium-bot-diag.html) — a missing `elysium-bot-arena.js`
  aborts at 46/x and looks like a test failure.
- **When the gate cannot run, extract the round's new section (14 Sep 2026):**
  the suite aborts on first failure, so a bad e2e section in front of your
  new work hides it completely. Copy the new section's assertions into a
  standalone `diag-NN.js` that `require`s the bot directly (`const { Bot } =
  require('./elysium-bot.js')`, a local `ok()`, same fixtures), run it, then
  run it AGAINST THE PRE-CHANGE BOT in a third dir for the destructive half.
  Fixtures that call a brand-new method throw instead of failing — that is a
  valid destructive proof, but it stops the file, so put the assertions that
  must fail *gracefully* in their own harness. Then say in the release note
  that the full gate did not run. An extracted battery is evidence; it is not
  a green suite, and conflating the two is how a project starts lying to
  itself — on 14 Sep the harness was 25/0 while the suite, once runnable,
  found a bot regression and eight stale fixtures.
- **setsid-detached long runs:** `setsid nohup node elysium-bot-arena.js ... \
  > /tmp/run.log 2>&1 < /dev/null &` then poll (`sleep 150; ps aux | grep -c
  '[e]lysium-bot-arena'; tail log`). Plain `nohup ... &` has DIED silently in
  this sandbox; setsid is the safe form. Combat era: 5p30 = 150–230s —
  ALWAYS detached; foreground only for 2–3-bot quickies.
- **One suite run per tool call** (`timeout 210 node test-bot-logic.js`),
  never chained ×3 in one call. Canary+versions may share the third call.
- **The tool call itself dies at 300 s** (11 Sep): the suite is ~190 s here.
  The reliable ×3 form is ONE run per call, backgrounded and polled INSIDE
  the same call: `(timeout 240 node test-bot-logic.js > /tmp/sN.log 2>&1;
  echo EXIT $? >> /tmp/sN.log) & sleep 210; tail -2 /tmp/sN.log`. A
  three-run chain left in the background died after its first run once the
  spawning call had returned (orphan reaped) — do not rely on orphans.
- **`cd DIR && ( … ) & sleep …; tail …` backgrounds the `cd` too** — the
  foreground tail/grep then run in the ORIGINAL cwd (a "No such file"
  scare). Write `cd DIR; ( … ) & …` or use absolute paths after the `&`.
- **Output with raw bytes kills the tool result** ("invalid UTF-8"): pipe
  report greps through `iconv -c -f utf-8 -t ascii//TRANSLIT` or `cut`.
- **Save gate runs to a file when hunting flakes** (`> /tmp/rN.txt`), then
  grep ✗ with context — F-Q2 practice; the ✗ often hides above the tail.

## Hotseat table, headless (21 Sep 2026, bot v0.6.147)
- Personas since v0.6.149: `novice | experienced | expert` (`--personas expert` is the arena default; `shark` / `grinder` still work as aliases — old run scripts need no edit).
- `node elysium-bot-hotseat.js --seed 11 --start-pool 12 --ask-secs 2 --out ev.jsonl` — four starters through the client's REAL `hotBridge` (the client file must sit beside it). `--arm tally|full` answers 'what if main ships the relay'. Progress goes to stderr, the result JSON to stdout. Events carry `round`, `who`, `deck`, `type`, `d` (same emits as an arena trace, without the arena's envelope).
- Spawn bots the way the CLIENT does when testing parity: a COPIED deck object, no `deckName`, no `seat`. `--deckname 1` is the arena's way.
- **Background jobs die when the chat turn ends.** `setsid nohup node … > log 2> err < /dev/null &` then `sleep N; tail` in the same turn; one CPU — three tables in parallel take ~1.4× one table, the SUITE must still run alone.
- Tool v1.1.0: `--arm nohold` removes the bridge's bot-Hold-on filter from the LIFTED source (refuses to run once main has removed the line); the sweep follows `hotBridge._out` when the bridge has one. To measure an OLD client, swap the file beside the tool (`cp client-old.html elysium-vtes-bord.html`) and swap it back.
- Gates now: suite ×3 → canary → HB1 → **`test-bot-hotseat.js`** (skips loudly without the client; `BOT=./old-bot.js node test-bot-hotseat.js` is the destructive check — v0.6.146 fails H1).

## Debugging
- **Prototype instrumentation beats log-reading for handshake bugs:** in a
  scratch script, `require` the bot and the arena, wrap `Bot.prototype`
  methods (`_onLog`/`_onChat` to TAG each stash with `{who, inCombat}`, the
  `_awaitOpp*` to LOG every consumption with `_combatOppName`/
  `_lastBlockerName`), then `runArena({bots:3, ...})`. Every stale
  consumption prints itself; the same script is the post-fix proof (0/5).
  Used to convict the bystander stash contamination (A1, 11 Sep).
- **Destructive proof of a new suite section without the 190 s suite:** write
  the section to `/tmp/secNN.js`, and a 20-line runner that defines `ok`,
  `sleep`, requires `elysium-bot.js` from a DIRECTORY argument (with
  `elysium-cardfx.json` beside it) and `eval`s the section with `__dirname`
  rewritten to that directory. Run it against `/tmp/aNold` (previous bot) and
  `/tmp/aNnew`: red then green, sub-second. Then paste the same section into
  the suite.
- **The guilt experiment:** disarm a suspect condition with `&& false`, rerun
  the suite. Green = guilty beyond doubt, and everything ELSE is simultaneously
  exonerated. Cheapest possible proof; used to convict the bounce ratio-gate.
- **Raw tail over grep filters:** grep -E pipelines HIDE stack traces and
  SUITE ABORT lines. When a run fails unexpectedly, rerun with `| tail -N`
  raw or save-to-file first.
- **Guessed emit fields lie; the trace is the judge.** After wiring any emit,
  read its LIVE payload from a real trace before trusting it (`vamp:null ×6`
  was invisible in green suites). The object is often the parameter:
  `_commitBounce(p, bounce)` → `bounce.vamp`.
- **Isolate combined failures pairwise:** 5-bots hung with pool-30 — testing
  (5 bots, pool 10) and (4 bots, pool 30) separately exonerated both legs in
  two cheap runs and reframed the hunt (it was the sandbox, not the game).

## Patching (python heredocs)
- **count==1 anchors + write-after-loop:** a failed assert leaves the file
  untouched. Never write before all reps pass.
- **Multi-site emits take replace-all, never find-first:** the streak sensor's
  find-first caught only the hunt pair of 25 sites. Count first, then
  `s.replace(old, new)` on ALL; same-line prefix form avoids brace risk —
  and afterwards grep for `if(` on the injected lines to prove no bare-if
  one-liner was split.
- **Never tail-append to a line ending in a comment** — the appended code is
  swallowed (six scores keys died invisibly). Append BEFORE the comment or on
  a fresh line.
- **Region-find injection** when the exact string is uncertain: locate the
  function span (`s.find('name')` → next `'\n  _'`), find the Nth landmark
  inside (e.g. the SECOND `_toAsh`), read the real variable name from the
  source, then inject. Print what you found before deciding.
- **`pkill -f PATTERN` kills your own shell when PATTERN is in your command line** (10 Oct: `pkill -f bench.sh` in a line that also ran other commands → exit 144, the workers' loops died but their arenas ran on as orphans writing into folders I had just cleared). Stop a bench by PID (`ps -eo pid,ppid,cmd | grep "[e]lysium-bot-arena"`), or write the kill into a script file, then clear the unfinished `mI` folders (a partial trace in a folder is read by `ana-bench.py` as the match). A bench's arenas are TIMER-bound (load ~0.03 per arena), so 6 workers per arm run fine on the one CPU.
- **Raw characters bite:** old-strings carry RAW bytes (em-dash, ∪, curly
  quotes) — copy from the file, not from memory; use str_replace-tool for
  lines python heredocs mangle; heredocs must not contain triple quotes.
- **`grep -c` exits 1 at zero matches** and kills `&&` chains — `cp` BEFORE
  grep in delivery lines (the recurring returncode-1 with everything fine).
- **rep() helpers: pass every positional arg** — a missing `tag` killed a
  batch mid-script once; write-after-loop saved the file.

## Reviewing (dossier reading strategy)
- Read in this order: **Manifests → Endgame/VP → pool trajectories → then
  hunt.** Targeted greps beat linear reads: `grep '^EV .*ousted' -B1` (death
  chains), `grep 'FACIT'` + line pick (hands at a moment), `grep 'q=action'`
  (the scores podium), `grep 'react-bounce\|block-made'` (the invisible war).
- **Cite T-refs for every claim; grade vs the manifest, not vs perfection.**
  Persona-consistent deviations are NOT misplays (novice's low aggression IS
  the wall synergy — recipe B proved it; resist "fixing" personality).
- **Restraint is a finding too:** report what correctly did NOT happen
  (no forced rushes at 30 pool) — visible-by-absence validates weightings.
- **Seat/deck attribution comes from MANIFESTS — never from names or
  emission order** (bit TWICE on 4 Aug): bot names rotate between matches,
  name-sort breaks on mixed personas (Grinder-2 < Novice ≠ seats 4 < 3), and
  manifest EMISSION order races async connects (16/16 audited). v0.6.88+
  manifests carry `seat`; older traces map seat via the --decks order.
- **Evaluate shipped changes in subsequent reports (Johan's doctrine, 4 Aug):**
  each battle report carries a change-evaluation element for recent tactical
  changes — prediction vs observed vs verdict (keep/tune/revert). A change
  without a follow-up evaluation is unfinished work.
- **Register falsifiable predictions BEFORE measuring** (the B-55a pattern):
  write the expected numbers down, run, then treat a FAILED half as a MAP,
  not a verdict — replay the exact traces it names before doubting the fix
  (the emit hole and the attrition finding both came from failed halves).
- **Winners from pre-v1.2.5 traces: re-derive** via the exported
  computeVp/deriveWinner — old summary/report 'winner' fields are
  last-standing, not VEKN.
- **Series before verdicts:** one match is an anecdote; recB's 3 matches
  closed the wall question, and seat conclusions wait for rotation.

## Source discipline
- vekn.net before encoding any rule; the VP/GW/TP numbers in CLAUDE-arena are
  source-verified — reuse, don't re-derive. Fresh tournament reports
  (vekn.net forum "Event Reports and TWD", VEKN newsletters) give comparative
  vocabulary: deals, clock awareness, cross-table plays — the bots' known
  strategic gaps; grade against what humans actually do, honestly.

## Referendum terms (cardfx v1.7.0, 18 Sep 2026)
- Political cards: read `e.ref.pool` (terms), `e.ref.tags` (`poolDmg` / `poolGain` — the sweep handles) and `e.ref.fx` (legacy auto keys). NEVER look for a referendum outcome in `modes[].fx` — only `actStealth` lives there.
- Adding a political family: extend `refTerms()` / `REF_PER` in `cardfx-compile.js`, add the card to the NEG list in test-cardfx if it must NOT match, recompile, read `node gen-deck-coverage.js <deck>` (`REF-TERMS` = terms compiled, caller missing).
- `req.titles` lists which titles a card requires (crypt entries carry `title`); `req.unmodelled` = a requirement the data cannot verify — callers fail closed.
- Quick audit: `node -e "const L=require('./elysium-cardfx.json').lib;for(const k in L)if(L[k].ref&&L[k].ref.pool)console.log(k,JSON.stringify(L[k].ref.pool))"`
- Referendum metrics from a trace (v0.6.122): events `referendum-called` {card, deltas, value, pass, mine, agst}, `referendum` {passed, for, against, closed}, `ref-vote` {dir, n, my, prey}, `blocked` with kind 'political', `took-pooldmg` / `pool-gain` with via 'referendum'. Four-starter table: `node elysium-bot-arena.js --bots 4 --decks malkavian,tremere,nosferatu,ventrue --start-pool 30`.
- Act-again / combat-ends metrics (v0.6.123): events `act-again` {vamp, card|null, outcome, via?}, `play` with window `act-again` / `combat-end` / `mod-votes` / `inplay-votes`. Referendum block reads: `block-eval` with sub 'political' (role, T, block, why). Adding an act-again card family member: extend `actWhen()` in cardfx-compile.js and the NEG list in test-cardfx.
- v0.6.125 events: `income-direction` {card, host, dir}, `margin-blood` {vamp, card, margin, toBlood, toPool}, `hand-size-up` {card, by}, `replace-counter` {card, left}. A reverse-direction income card needs only `fx.poolToBlood` on a phase-tagged mode; a counters-as-hand-size card needs `enterCounters` + `handSizePerCounter` + `replaceBurnsCounter`.
- **v0.6.127 trace events:** `block-bar` {vamp, card, n, preyPool, blockers}, `block-barred` {by, card}, `self-price` {vamp, card, zone, blood}, `vote-tax` {by, paid, tax}, `recover` with via 'ownRescue', `through` / `blocked` with kind 'ownRescue', `act-again` with via 'crypt text' (Sybren), `play` kinds 'vote-discard' and 'block-bar'.
- **Arena in this sandbox (18 Sep late):** `--out` is not a flag — traces need `--trace DIR`. ONE match per detached process, and the spawning call must return before 300 s: `sleep 270` after two parallel matches overran and lost the output (the match itself survived and wrote its trace). Use `sleep 200` + a second poll call.
- **After adding an fx key, run test-cardfx BEFORE the bot suite:** the inheritance-superset tests catch a tag that turns an empty segment into an inheritance source (Cheat the Fates, v1.9.0).
- **Live wire probe (18 Sep night):** `node diag-give-probe.js` — wraps `Bot.prototype.send` / `_mkHandlers`, injects a card at a bot's 2nd unlock, runs `runArena({matches:1, bots:3, …, matchTimeoutMs:100000})`, prints every give / given / gave / err. ~70 s. Copy it for any feature whose two halves meet only through the server.
