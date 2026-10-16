# bot/ — Elysium Bots (automated V:TES opponents for the Elysium client)

Bot **v0.6.205** (16 Oct 2026) · arena v1.4.7 · cardfx compiler v1.9.2, curated 105 · built against client v2.6.162 / srv-2.6.46.
Start with `CLAUDE.md` (session bootstrap, version handshake, every gate), then the newest `docs/readme/READ-ME-FIRST-*.md` (at v0.6.205: `READ-ME-FIRST-2026-10-16f.md`).
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
| `cardfx-compile.js`, `cardfx-curated.json` → `elysium-cardfx.json` / `.js` | the card-effect library pipeline (`node cardfx-compile.js --report`; needs `vtes.json`) |
| `twd-profile.py`, `twd-archetypes.py` → `elysium-twd-profile.json`, `elysium-twd-archetypes.json` | the TWDA prior (need `vtes.json`, `twda.json` and optionally `twda-vdb.json` beside them — none in git; root `CLAUDE.md`, 'Data that is not in git') |
| `deck-*.json`, `rig-a1.json` | the arena decks (the four V5 starters + hacking + sewer) and a rig |
| `elysium-bot-diag.html` | the browser battery (HB1) |

## Gates
`node --check <file>` → `node test-bot-logic.js` (2182 assertions, ≈300 s — run detached: `timeout 600 node test-bot-logic.js > suite.log &` and poll) → `node test-bot-canary.js` (69/0; pins the client's log grammar against `elysium-vtes-bord.html` + `ELYSIUM-PROTOCOL.md` beside it) → `node test-cardfx.js` (271/0, when cardfx changed; needs `vtes.json` — fetched, see root `CLAUDE.md`) → `node diag-hb1-smoke.js` (11/0, when the browser surface changed) → `node test-bot-hotseat.js` (11/0, when anything near the hotseat bridge changed).
Mutant isolation for the hold gate: `python3 tools/mutants/mutate-v0_6_198.py /tmp/mut` (every mutant must fail or hang).
One suite section against any bot file (the destructive check of a new section, sub-minute): `bash tools/run-section.sh <bot.js> <section.js>`.

Legacy ad-hoc tests from the v0.6.10x era (`test-soft.js`, `test-planner*.js`, `test-persona.js`, `test-handoff.js`, `test-eligible.js`, `test-fixes.js`, `test-grammar.js`, `test-bot-suffix.js`) are kept for history; they are not gates. Known stale reds: `test-fixes.js` Fix C, `test-eligible.js` (3), `test-grammar.js` Test 4, `test-soft.js` Test 3 — all pre-existing, the suite covers those behaviours.

## Series tools
`gen-match-dossier.js` (one match → one reviewable file) · `gen-trace-harvest.js` (metrics + the price referee) · `gen-batch-review.js` (a series) · `gen-null-review.js` · `gen-plan-review.js` · `gen-forecast-calibration.js` · `gen-deck-coverage.js <deck.json>` (can the bot play this deck?) · `gen-sweep-audit.js`.
Analysis after a series: `ana-ledger.py` (the ledger gate), `ana-block.py` (the block gate, 0 violations), `ana-inv.py` (invariants), `ana-wait.py` (tempo), `ana-bench.py` + `bench.sh` (the mirror bench, 48 matches), `ana-cards.py`, `ana-home.py`, `ana-open.js`, `ana-combat*.py`, `ana-rush.py`, the `sweep-*.py` cardfx sweeps. Run scripts: `run-bal.sh` / `poll-bal.sh` (+ `design-balanced-serie-bal1.txt`), `run-m.sh`, `run-t.sh`, `run-cmb.sh`, `run-ser.sh`, `make-bench-report.sh` — they carry sandbox paths from the chat era; set the paths for your machine.
Probes: `diag-give-probe.js`, `diag-a1-stash-probe.js`.

## Read-only copies of the client project's releases (never edit here)
`elysium-server.js` (srv-2.6.46 — the arena and the suite spawn it), `ELYSIUM-PROTOCOL.md` (v2.6.158), `elysium-vtes-bord.html` (v2.6.158), `elysium-hotseat-bots-plan.md` — refreshed 15 Oct 2026 by copying `client/`'s release in.

## docs/
- living docs: `elysium-bot-session-journal.md` (newest first), `elysium-bot-project-context.md`, `elysium-bot-learnings.md`, `elysium-bot-CHANGELOG.md`, `PROJECT-INSTRUCTIONS.md`, `REVIEW-vtes-player-2026-10-11.md`
- `readme/` every delivery's READ-ME-FIRST (22 Sep → 12 Oct) · `handoffs/` handoffs to main and main's replies · `reports/` series and bench reports · `specs/` design canon and specs to main · `reviews/` the 11 Sep deep review and the 14 Oct play-test review (`REVIEW-playtest-2026-10-14.md`) · `coverage/` deck-coverage snapshots (regenerate with `gen-deck-coverage.js`) · `archive/` superseded manifests and TODOs (the 21 Sep TODO is still the best map of the older debts)
