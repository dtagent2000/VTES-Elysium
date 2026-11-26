# bot/ — Elysium Bots (automated V:TES opponents for the Elysium client)

Versions, the deploy state and the last gate numbers: `docs/STATUS.md` (the only page that carries them).
Start with `CLAUDE.md` (the rules), then `docs/STATUS.md` (now) and `docs/BOARD.md` (the asks). Rulings, lessons, the architecture, the round and the how-to are `docs/RULINGS.md`, `docs/LESSONS.md`, `docs/ARCHITECTURE.md`, `docs/HARNESS.md`, `docs/HOWTO.md`.
The folder is deliberately FLAT: the suites, the arena and every tool expect their inputs beside them. Run everything from here.

## The bundle (what the client project consumes — copied to the repository root at a release)
`elysium-bot.js` · `elysium-cardfx.json` / `elysium-cardfx.js` · `elysium-twd-profile.json` / `.js` · `elysium-twd-archetypes.json` / `.js` · `START-HERE-BOTS.html`

## Code
| File | What |
| --- | --- |
| `elysium-bot.js` | the bot (Node and browser; one IIFE) |
| `elysium-bot-arena.js` | bot-vs-bot arena on a real spawned server (`node elysium-bot-arena.js --matches N --bots K --decks … --trace ./serie-x`) |
| `elysium-bot-table.js` | seat bots at a live table |
| `elysium-bot-hotseat.js` | the client's real `hotBridge` driven headless (needs `elysium-vtes-bord.html` beside it) |
| `elysium-bot-sim.js` | THE SIM TABLE: the hotseat table under a virtual clock — about a second per match, the same spec gives the same trace byte for byte, every seating by default (`node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue --seeds 10 --trace ./sim-x`; `--help`); it counts bots that played at 0 pool. Not a timing gate. |
| `cardfx-compile.js`, `cardfx-curated.json` → `elysium-cardfx.json` / `.js` | the card-effect library pipeline (`node cardfx-compile.js --report`; needs `vtes.json`) |
| `cardfx-sharing.js`, `cardfx-sharing.json` | the sharing register (RULINGS D-125): every fx key that only hand entries of the library carry has a row — unique, shared (the cards that print it) or backlog (not asked yet; frozen); `node cardfx-sharing.js` prints the counts and the problems of the compiled library, `test-cardfx.js` is its gate |
| `cardfx-fidelity.json` | the fidelity pass (RULINGS D-138): the cards whose entry was read clause by clause against KRCG's text, each with the open `docs/SWEEP-REGISTER.md` entries that are its own gaps; `gen-card-ledger.js` counts a deck's *text-checked* and *exact* from it, `test-cardfx.js` fails on a gap the register no longer lists |
| `twd-profile.py`, `twd-archetypes.py` → `elysium-twd-profile.json`, `elysium-twd-archetypes.json` | the TWDA prior. Inputs beside them, none in git (root `CLAUDE.md`, 'Data that is not in git'): `vtes.json`, `twda.json` (KRCG's v5 TWDA) and, for the archetypes, vtes-skill's classification (MIT, https://github.com/vtes-biased/vtes-skill; GitHub's zip of main unpacked as src/vtes-skill-main/, ignored; commit 65b5c3e reproduces the shipped archetypes byte for byte). Both write the shipped files in place: run them in a scratch copy of `bot/` until a release ships the rebuild |
| `twda.py` | the TWDA reader both import: one deck per id, card names from `vtes.json` by KRCG id; a missing, wrong or cut-off file stops with the fetch command; `--self-test` and `--check FILE` (both in CI) |
| `deck-*.json`, `rig-a1.json` | the decks the bot embeds (the four V5 starters + Toreador + hacking + sewer), the 13 other V5 precons (test inputs the sim plays; not in the client's menu) and a rig |
| `gen-review-sheet.js`, `gen-cross-check.js`, `cross-check-pairing.json` | the V5 sweep's development tools (zero-vtes read from a checkout outside the repository, scratch output only; HOWTO): one deck's review sheet, and the library's cross-check by effect family and level with the flags where our entry says less (C1), with its pairing of their effect types to our keys (D-140) |
| `gen-precon.js` | the V5 precons from `vtes.json`'s sets (`node gen-precon.js`; `--check` compares the starters and the embedded decks by KRCG id; `--list`) |
| `elysium-bot-diag.html` | the browser battery (HB1) |

## Gates
A session starts with `bash tools/setup.sh` (KRCG's data built into `vtes.json`, zero-vtes cloned outside the repository at its pin; RULINGS D-139). `bash tools/gates.sh` runs the fixed local gates (the hotseat gate and test-doc-budget when the diff touches them) and writes the PR's table (`--sim` the 240's footprint, `--smokes` the V5 smokes, `--suite N` frozen local runs); CI runs `test-bot-logic.js` ×3 in parallel jobs, the release gate (`bash tools/ci-status.sh` prints each run's count and sha256); `bash tools/release.sh X.Y.Z` does the release ritual's mechanics (HARNESS). The agents the round uses are `../.claude/agents/bot-*.md`. By hand: `node --check <file>` → `node --max-old-space-size=6144 test-bot-logic.js` (at 4 GB it dies out of memory in section 180 since v0.6.236: C6) → `node test-bot-canary.js` (pins the client's log grammar against `elysium-vtes-bord.html` + `ELYSIUM-PROTOCOL.md` beside it) → `node test-cardfx.js` (needs `vtes.json`) → `node diag-hb1-smoke.js` → `node test-bot-hotseat.js`. The full list and when each applies: `CLAUDE.md` "Gates"; the last numbers: `docs/STATUS.md`.
Mutant isolation for the hold gate: `python3 tools/mutants/mutate-v0_6_198.py /tmp/mut` (every mutant must fail or hang).
One suite section against any bot file (the destructive check of a new section, sub-minute): `bash tools/run-section.sh <bot.js> <section.js>`.
A human's Grand Ball at main's play-test rig: `tools/playtest-ball/` (the scenario, its steps in `about`, and a Ball-heavy Toreador test deck; round C).
The hotseat with bots in a real browser: `node tools/hotseat-in-browser.js [--bot FILE] [--sweeps N]` (Playwright; counts the answers dropped as stale; round E).
The chat at the client's pace (the chat round, D-137): `node tools/chat-record.js --out REC.jsonl [--bot FILE] [--seed 7] [--knob k=v]` records a bots-only
hotseat table's bubbles with their times (real clock, 10-15 min); `python3 tools/ana-chat.py REC.jsonl [AFTER.jsonl] [--lines] [--gate]` reads them as the
client draws them (the floor, the three-bubble limit, prefixes, human tails, the line inventory).

The ten legacy ad-hoc tests of the v0.6.10x era (not gates, four of them stale reds) were deleted by round C2 (11 Nov 2026; git keeps them): the suite covers their behaviours.

## Series tools
`gen-match-dossier.js` (one match → one reviewable file) · `gen-trace-harvest.js` (metrics + the price referee) · `gen-batch-review.js` (a series) · `gen-null-review.js` · `gen-plan-review.js` · `gen-forecast-calibration.js` · `gen-deck-coverage.js <deck.json>` (can the bot play this deck?) · `gen-review-sheet.js --deck KEY --zero DIR` (one deck's review sheet beside zero-vtes, to scratch; HOWTO) · `gen-card-ledger.js --sim DIR …` (the card ledger, `docs/CARDS.md`: the starters' rows with *playable*, *text-checked* and *exact*, the whole library's verdicts and the vocabulary) · `gen-sweep-audit.js` · `ana-sim-diff.py` (two runs of the same sim design, match by match: identical / same play / the first decision that differs).
Analysis after a series: `ana-gates.py DIR` (the gate: one PASS / FAIL line per audit below, the matches and `zeroPool`; `--self-test`), `ana-ledger.py` (the ledger gate), `ana-block.py` (the block gate, 0 violations), `ana-inv.py` (invariants), `ana-windows.py` (the actor's reactions-only windows; the `stale-answer` rows), `ana-rare.py` (the rare paths a section proves), `ana-jack.py` (Smiling Jack's life and burns), `ana-guide-check.py DIR [DECK]` (a deck's guide-check situations: the bench round's counts), `ana-wait.py` (tempo), `ana-probe.py` (the probe order), `ana-bench.py` (the mirror bench's edge per arm) + `ana-sim-diff.py --vp CONTROL ARM` (the paired read) on `elysium-bot-sim.js --bench` runs, `ana-cards.py`, `ana-home.py`, `ana-open.js`, `ana-combat*.py`, `ana-rush.py`, the `sweep-*.py` cardfx sweeps. The probe lab: `node lab-probe.js N SEED ARMS > lab.jsonl` then `python3 ana-lab.py lab*.jsonl`. The chat-era run scripts (`bench.sh`, `run-*.sh`, `poll-bal.sh`, `make-bench-report.sh`) were retired by round C3 (3 Nov 2026): series and the bench run on the sim; `design-balanced-serie-bal1.txt` stays (`--design`).
Probes: `diag-give-probe.js`, `diag-a1-stash-probe.js`. Docs: `bash tools/doc-budget.sh` checks the standing pages' budgets, paths and versions; `bash tools/test-doc-budget.sh` is its destructive test. The correctness lint: `tools/eslint.config.mjs` (every finding fails; `tools/eslint-suppressions.json` is empty since round C2 and only shrinks); CI (`../.github/workflows/bot-gates.yml`) runs the gates that need no person on a PR (HOWTO "CI").

## Read-only copies of the client project's releases (never edit here)
`elysium-server.js` (the arena and the suite spawn it), `ELYSIUM-PROTOCOL.md`, `elysium-vtes-bord.html`, `elysium-hotseat-bots-plan.md` — refreshed by copying `client/`'s release in, never patched; their versions are in `docs/STATUS.md` (and checked there by `tools/doc-budget.sh`).

## docs/
- standing pages (the bootstrap): `STATUS.md` (now), `BOARD.md` (the asks), `RULINGS.md` (the owner's rulings and the design decisions, numbered), `LESSONS.md`, `ARCHITECTURE.md`, `HARNESS.md` (the round, the reviews, the release ritual), `HOWTO.md`
- `elysium-bot-CHANGELOG.md` (one entry per release) · `CARDS.md` (the card ledger, generated) · `SWEEP-REGISTER.md` (the problems the sweep finds, by class: D-135; BOARD has a line per class) · `PROJECT-INSTRUCTIONS.md` (the claude.ai project instruction) · `START-HERE-BOTS-CHAT.md`
- `specs/` design canon · `handoffs/` open handoffs to main (main's replies: `client/docs/handoffs/REPLY-to-bot-*.md`) · `reports/` series, bench and playtest reports · `reviews/` the 11 Sep deep review and the 14 Oct play-test review · `coverage/` deck-coverage snapshots
- `history/`: consumed handoffs (`handoffs/`) and a README; the frozen records (the session journal, the project context, the dated learnings, `SKILLS-2026-10-20.md`, the old bootstrap `CLAUDE-v2-2026-10-20.md` with its version handshake and debts 1–71, every READ-ME-FIRST, the delivered round specs, the old archive) moved verbatim to the private data repo's `bot-history/` (RULINGS D-142)

## Credit
zero-vtes (MIT, Copyright (c) 2026 Lionel Panhaleux, https://github.com/lionel-panhaleux/zero-vtes): a development-time reference for card readings and for which effects cards share (RULINGS D-125; `docs/specs/spec-card-sweep-2026-11-18.md` §5). It is read from a checkout outside the repository and nothing of it runs with the bot; of it, only the names of its effect types are committed, in the cross-check's pairing (`cross-check-pairing.json`, RULINGS D-140). The sources the tools read as data are named in their rows above (KRCG, the TWDA, vtes-skill).
