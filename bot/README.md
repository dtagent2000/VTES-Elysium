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
| `twd-profile.py`, `twd-archetypes.py` → `elysium-twd-profile.json`, `elysium-twd-archetypes.json` | the TWDA prior. Inputs beside them, none in git (root `CLAUDE.md`, 'Data that is not in git'): `vtes.json`, `twda.json` (KRCG's v5 TWDA) and, for the archetypes, vtes-skill's classification (MIT, https://github.com/vtes-biased/vtes-skill; GitHub's zip of main unpacked as src/vtes-skill-main/, ignored; commit 65b5c3e reproduces the shipped archetypes byte for byte). Both write the shipped files in place: run them in a scratch copy of `bot/` until a release ships the rebuild |
| `twda.py` | the TWDA reader both import: one deck per id, card names from `vtes.json` by KRCG id; a missing, wrong or cut-off file stops with the fetch command; `--self-test` and `--check FILE` (both in CI) |
| `deck-*.json`, `rig-a1.json` | the decks the bot embeds (the four V5 starters + Toreador + hacking + sewer), the 13 other V5 precons (test inputs the sim plays; not in the client's menu) and a rig |
| `gen-precon.js` | the V5 precons from `vtes.json`'s sets (`node gen-precon.js`; `--check` compares the starters and the embedded decks by KRCG id; `--list`) |
| `elysium-bot-diag.html` | the browser battery (HB1) |

## Gates
`node --check <file>` → `node --max-old-space-size=4096 test-bot-logic.js` ×3 (a ~2 GB default heap ends it after section 136), each in a frozen snapshot, detached (`timeout 600`; ~300–420 s a run) → `node test-bot-canary.js` (pins the client's log grammar against `elysium-vtes-bord.html` + `ELYSIUM-PROTOCOL.md` beside it) → `node test-cardfx.js` (when cardfx changed; needs `vtes.json` — fetched, see root `CLAUDE.md`) → `node diag-hb1-smoke.js` (when the browser surface changed) → `node test-bot-hotseat.js` (when anything near the hotseat bridge changed). The full list and when each applies: `CLAUDE.md` "Gates"; the last numbers: `docs/STATUS.md`.
Mutant isolation for the hold gate: `python3 tools/mutants/mutate-v0_6_198.py /tmp/mut` (every mutant must fail or hang).
One suite section against any bot file (the destructive check of a new section, sub-minute): `bash tools/run-section.sh <bot.js> <section.js>`.

The ten legacy ad-hoc tests of the v0.6.10x era (not gates, four of them stale reds) were deleted by round C2 (11 Nov 2026; git keeps them): the suite covers their behaviours.

## Series tools
`gen-match-dossier.js` (one match → one reviewable file) · `gen-trace-harvest.js` (metrics + the price referee) · `gen-batch-review.js` (a series) · `gen-null-review.js` · `gen-plan-review.js` · `gen-forecast-calibration.js` · `gen-deck-coverage.js <deck.json>` (can the bot play this deck?) · `gen-card-ledger.js --sim DIR …` (the card ledger, `docs/CARDS.md`) · `gen-sweep-audit.js` · `ana-sim-diff.py` (two runs of the same sim design, match by match: identical / same play / the first decision that differs).
Analysis after a series: `ana-gates.py DIR` (the gate: one PASS / FAIL line per audit below, the matches and `zeroPool`; `--self-test`), `ana-ledger.py` (the ledger gate), `ana-block.py` (the block gate, 0 violations), `ana-inv.py` (invariants), `ana-windows.py` (the actor's reactions-only windows; the `stale-answer` rows), `ana-rare.py` (the rare paths a section proves), `ana-wait.py` (tempo), `ana-probe.py` (the probe order), `ana-bench.py` (the mirror bench's edge per arm) + `ana-sim-diff.py --vp CONTROL ARM` (the paired read) on `elysium-bot-sim.js --bench` runs, `ana-cards.py`, `ana-home.py`, `ana-open.js`, `ana-combat*.py`, `ana-rush.py`, the `sweep-*.py` cardfx sweeps. The probe lab: `node lab-probe.js N SEED ARMS > lab.jsonl` then `python3 ana-lab.py lab*.jsonl`. The chat-era run scripts (`bench.sh`, `run-*.sh`, `poll-bal.sh`, `make-bench-report.sh`) were retired by round C3 (3 Nov 2026): series and the bench run on the sim; `design-balanced-serie-bal1.txt` stays (`--design`).
Probes: `diag-give-probe.js`, `diag-a1-stash-probe.js`. Docs: `bash tools/doc-budget.sh` checks the standing pages' budgets, paths and versions; `bash tools/test-doc-budget.sh` is its destructive test. The correctness lint: `tools/eslint.config.mjs` (every finding fails; `tools/eslint-suppressions.json` is empty since round C2 and only shrinks); CI (`../.github/workflows/bot-gates.yml`) runs the gates that need no person on a PR (HOWTO "CI").

## Read-only copies of the client project's releases (never edit here)
`elysium-server.js` (the arena and the suite spawn it), `ELYSIUM-PROTOCOL.md`, `elysium-vtes-bord.html`, `elysium-hotseat-bots-plan.md` — refreshed by copying `client/`'s release in, never patched; their versions are in `docs/STATUS.md` (and checked there by `tools/doc-budget.sh`).

## docs/
- standing pages (the bootstrap): `STATUS.md` (now), `BOARD.md` (the asks), `RULINGS.md` (Johan's rulings and the design decisions, numbered), `LESSONS.md`, `ARCHITECTURE.md`, `HARNESS.md` (the round, the reviews, the release ritual), `HOWTO.md`
- `elysium-bot-CHANGELOG.md` (one entry per release) · `CARDS.md` (the card ledger, generated) · `PROJECT-INSTRUCTIONS.md` (the claude.ai project instruction) · `START-HERE-BOTS-CHAT.md`
- `specs/` design canon · `handoffs/` open handoffs to main (main's replies: `client/docs/handoffs/REPLY-to-bot-*.md`) · `reports/` series and bench reports · `reviews/` the 11 Sep deep review and the 14 Oct play-test review · `coverage/` deck-coverage snapshots · `archive/` superseded manifests and TODOs
- `history/` verbatim: the session journal, the project context, the dated learnings, `SKILLS-2026-10-20.md`, `CLAUDE-v2-2026-10-20.md` (the old bootstrap with its version handshake and debts 1–71), every READ-ME-FIRST (`readme/`), consumed handoffs (`handoffs/`), delivered round specs (`specs/`)
