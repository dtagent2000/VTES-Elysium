# CLAUDE.md — Elysium Bots (`bot/`): the session bootstrap (v3.1, 26 November 2026)

Automated V:TES opponents for the Elysium client — a free table that does not enforce the rules, so the bot carries its own
model of them (cardfx + the table model) and reads the table's lines. Claude writes and maintains the code; the owner rules and
merges. Chat in Swedish; code, commits and docs in English. This file carries the rules that bind every change; the rules of one
area of the code are in `docs/ARCHITECTURE.md` "Binding rules by area" and the measurement rules in `docs/HARNESS.md`
"Measurements" (D-142). Ids in brackets point to `docs/RULINGS.md` (R-, D-, O-) and `docs/LESSONS.md` (L-). History lives in git,
`docs/elysium-bot-CHANGELOG.md` and the private data repo's `bot-history/` (`docs/history/README.md`).

## Bootstrap (every session, in this order)
1. Root `CLAUDE.md` — the one rule for both halves, deploy = copy to the root, third-party data.
2. This file.
3. `docs/STATUS.md` — now: version, deploy state, open PRs, the last gate numbers, what is next (the one place for the state).
4. `docs/BOARD.md` — the open asks; take one.
5. When the task touches them: `docs/RULINGS.md` (any rules or design question — check it before asking the owner), `docs/LESSONS.md`
   (before building anything with timing, tests or measurements), `docs/ARCHITECTURE.md` (where a decision lives, and the binding
   rules of each area: read the area's before changing its code), `docs/HOWTO.md` (running, debugging, analysing), `docs/HARNESS.md`
   (the round, the reviews, the measurements, the release ritual).
6. `bash tools/setup.sh` (KRCG's data, zero-vtes at its pin); `git checkout -b <topic>` — never work on `main`.

Run every suite and tool from inside `bot/`: the folder is flat on purpose, everything expects its inputs beside it.
`bot/README.md` maps the files. `tools/doc-budget.sh` checks the standing pages (run it before any docs PR);
`tools/test-doc-budget.sh` proves it still catches each failure (run it after changing the check).

## The one rule (ownership)
`bot/` never edits `client/` or the client/server files at the root. The copies of `elysium-server.js`, `ELYSIUM-PROTOCOL.md`,
`elysium-vtes-bord.html` and `elysium-hotseat-bots-plan.md` inside `bot/` are READ-ONLY release copies: replace them by copying a
release in, never patch. A need on main's side is a handoff (`docs/handoffs/HANDOFF-to-main-<date>-<version>.md`); main ships the
contract first and the bot consumes it next round, or the bot ships first when the change is backward compatible. Never both
halves in one PR. A bot release = bump `BOT_VERSION` (the line carries the version only; the note goes to the CHANGELOG), copy the
bundle (`elysium-bot.js`, `elysium-cardfx.json/.js`, `elysium-twd-profile.json/.js`, `elysium-twd-archetypes.json/.js`,
`START-HERE-BOTS.html`) to the repository root. Never edit the root in place.

## Gates (the one complete list; HARNESS and the root CLAUDE.md point here; STATUS has the last known green numbers)
- `bash tools/gates.sh` runs the fixed local gates below (two more when the diff touches them; `--sim` the footprint) and writes
  the PR's table; the rest by hand. `node --check` on every changed file.
- `python3 tools/public-scan.py` — the public repository's name and quote scan on the lines a change adds (D-141, D-142);
  `tools/gates.sh` and CI run it, `--tree` reports the whole tree.
- `test-bot-logic.js` ×3: CI's three parallel runs on the PR are the release gate (D-139; `tools/ci-status.sh` reads them; CI runs
  on pull requests: a draft PR at the first push). Locally the touched sections (`tools/run-section.sh`); a full local run (`tools/gates.sh
  --suite N`: frozen snapshots, detached, polled) only when CI cannot run, said in the PR. Section 78c (pace scaling) was a timing
  flake (F-Q2, closed): if it fails, re-run it once and say so. The suite needs every owned file beside it (a missing
  `elysium-bot-arena.js` aborts) and a 6 GB heap: at 4 GB it dies in section 180 (C6).
- `node test-bot-canary.js` — the §12 grammar contract against `elysium-vtes-bord.html` + `ELYSIUM-PROTOCOL.md` beside it (the
  read-only copies); without them it skips loudly, never fakes a pass. Run it a second time against main's current release
  (HOWTO: "the canary against main's release").
- `node test-cardfx.js` when cardfx changed (needs `vtes.json` beside it, built by `krcg-v5.js` from KRCG's v5 dump — root `CLAUDE.md`, "Data that is not in git").
- `node diag-hb1-smoke.js` when the bot's browser surface changed (needs `elysium-bot-diag.html` beside it).
- `node test-bot-hotseat.js` when anything near the hotseat bridge changed.
- When the wire or the timing changed: main's client suite beside the release bytes (`client/`'s LIVE tests drive the real bot:
  hotBridge, Hold on, the seat-1 range, the verdict timing; HOWTO says how); report its count in the PR.
- A new test is verified DESTRUCTIVELY against the pre-change file (`tools/run-section.sh`, HOWTO). A section that throws on the
  old bytes proves only that a method is new — say so.
- Every behaviour change: a sim footprint against the previous bytes on the 240-match client design (`ana-sim-diff.py`); a
  clean-up round must be IDENTICAL (a release's version string normalized). When the wire or the real clock is touched: an arena
  smoke (one match, the audits below).
- A series or a bench runs on the sim table first (`elysium-bot-sim.js`, HOWTO); `python3 ana-sim-diff.py A B` before any win
  rate; after a series `python3 ana-gates.py DIR`: one PASS / FAIL line per audit (`ana-ledger.py`, `ana-block.py`, `ana-inv.py`,
  `ana-windows.py`, `ana-combat2.py`'s handshake, `zeroPool`, the matches). The sim is not a timing gate: the canary, the hotseat gate and the server arena
  stay; `--real` replays a spec on the real clock.
- An abort on the pre-change bot is NOT automatically the environment: find the last release the suite was green on and run THAT
  (LESSONS, "tests that lie"). Never claim a gate passed without having run it.
- CI (D-109; HOWTO "CI"): `.github/workflows/bot-gates.yml` runs the unattended gates and the correctness lint on every PR.

## The round
`docs/HARNESS.md` has it in full, with the roles (the lead, the agents and their models, CI) [D-139]: take a BOARD line → analyse,
propose, wait for "kör" on any "how should we do X" [D-87] → change → gates → a fresh-context egress review (later
passes, and a round without a bot change, on Fable [D-140]) → STATUS rewritten, CHANGELOG entry, the BOARD line deleted (RULINGS /
LESSONS when they changed) → PR against `main` with the gate numbers and the review's line → with a bot change, ask the owner about
a real match in the human seat [D-140]. Commit and push as soon as a step is green (context can run out).
The owner merges. End every implementation round with an honest "anything I'm unsure about" paragraph, unasked — it is a real
hunt, not a formality; each item is checked now, carried or dropped [D-141]. The owner's combining rule (16 Oct 2026) [D-92]: a fix
found during a round may ride in that round when it fits; say so in the PR.

## The goal and the layers (the owner)
- **The goal (20 Sep 2026):** [D-76] not a chess engine — a COMPETENT THREAT at the table that fills a seat when players are short; bots
  that play their cards correctly with good priorities, judged by a well-founded feel from observation. Prefer decision-level reads
  with large effects over VP differences. No deck is held back: Malkavian plays as well as it can [D-77].
- **Three layers (19 Sep 2026):** [D-19, L-2] (1) STATISTICS, serving every bot's thinking; (2) GENERAL handling, serving every deck of that
  kind; (3) the DECK PERSONA, informing one list. Put a change in the lowest layer it belongs to.
- **Four checks (19–20 Oct 2026):** [D-83] the abstract model (not built) → the sim table and the server arena → a bots-only browser
  table (HB1, main's playtest rig) → humans. One metric list across all four.

## Binding rules for every change (one paragraph each; the stories are in LESSONS and the CHANGELOG)
- **The plan rule (v0.6.119c).** Tactics READ `this.plan` (phase, posture, target, home, floor) and never recompute it; a new
  strategic read gets a field in the plan and a line in `docs/specs/elysium-bot-strategy.md`, never an ad-hoc test inside a
  tactic. No persona term inside `_strategize`; the persona filters after it.
- **The table-model rule (v0.6.118).** [D-9, D-86] Every read about an opponent goes through `this.opp[seat]` (`oppCombat`, `oppStealth`,
  `oppCombatCost`, `oppForecast`, `turnsToOust`, `oppAxes`) — public information only, prior-blended; never a card name, a deck
  name or hidden information (`handIntel` is filled only by reveal messages and stays separate). New opponent facts get a writer
  in `_scanOpp` / `_noteObserved` / the L12 handlers, never an ad-hoc field.
- **Knob hygiene (v0.6.162).** [L-62] A decision knob gates DECISIONS only. A rules correction (what a card or strike legally does, what a
  message means, a timing race) is never behind a knob; when a release mixes the two, split them before shipping. Every decision
  knob has a 0-path that is the previous behaviour, documented in its line.
- **The pool rule (v0.6.210).** [R-34; L-16, L-64] Every pool cost leaves ≥ 1 pool (the last pool paid is an oust); the turn engine ousts me at 0 pool
  on my own turn. Every own-turn pool loss has the oust check beside it.
- **Evaluation doctrine (the owner, 4 Aug 2026).** [D-93] Every shipped tactical change gets its OUTCOME evaluated in the next report against
  its registered prediction (change · prediction · observed · verdict: keep / tune / revert). Register falsifiable predictions
  BEFORE measuring; a failed half is a map, not a verdict.
- **The public repository (D-141, D-142).** No chat quotes and no names of private persons in a file, a commit message or a
  PR text: a decision is written in our own words and by role (the owner), its verbatim words go to the private data repo's
  RULINGS-WORDS.md; licence credits, official rulings by their references and the invented table names of the tests and examples
  stay. `tools/public-scan.py` checks the lines a change adds.

## The rules of each area (D-142)
Before changing code in an area, read its rules in `docs/ARCHITECTURE.md` "Binding rules by area": **lines and speech** (the tier
rule, the duplicate rule, a new bot line, the event log, the helper-gate rule, lines are the contract) · **combat** (the handshake
rule) · **cardfx** (the cost rule, `FX_NORM`) · **block** (the block gate, the ahead rule) · **timing** (the window, beat, tempo
and hold rules) · **decisions** (the look-ahead rule, the self-price rule, the knowledge-layer rule, the ledger gate, debug
density). The measurement rules (count in the arena, determinism and footprints, traces) are in `docs/HARNESS.md` "Measurements".

## Personas and decks (facts a session needs)
- Personas [D-73, D-79]: `novice` / `experienced` / `expert` (the owner, 21 Sep: the toggle is simulated experience; EXPERT is the default for
  client-spawned bots). `shark` = expert and `grinder` = experienced are aliases in old scripts and old traces. `new Bot({})` with
  no persona keeps the bare base knobs (hundreds of fixtures stand on it). Persona thresholds still live inside some tactics
  (BOARD); do not add more.
- Decks: the four V5 starters (`deck-malkavian/tremere/nosferatu/ventrue.json`) + `hacking` (the tournament benchmark: its prey
  fell first 16/16 in the 4 Aug tests, so a deck-strength claim controls for prey-of-hacking) + `sewer`;
  `wall` is an archetype fixture only. `DECK_STRATEGY` carries each manifest (the reviewer's yardstick) and `combat` posture. Eight
  decks are also embedded in `elysium-bot.js` (duplicated; BOARD). The 13 other V5 precons are
  `deck-<key>.json` (`gen-precon.js`): test inputs the sim plays, not in the client's menu until their rows in `docs/CARDS.md` are
  playable (BOARD, the V5 sweep).
- The hidden-hand design (K0 discipline priors → K1 deck templates → K2 odds; the TWD profile and archetype labels) is
  `docs/specs/spec-knowledge-layer.md`.

## Pointers
`docs/STATUS.md` · `docs/BOARD.md` · `docs/RULINGS.md` · `docs/LESSONS.md` · `docs/ARCHITECTURE.md` · `docs/HOWTO.md` ·
`docs/HARNESS.md` · `docs/elysium-bot-CHANGELOG.md` · `docs/specs/` (design canon) · `docs/handoffs/` (to main, and main's
replies in `client/docs/handoffs/REPLY-to-bot-*.md`) · `docs/reports/` · `docs/reviews/` · `docs/coverage/` ·
`docs/history/README.md` (the frozen records — the journal, every READ-ME-FIRST, the old CLAUDE.md's handshake and debts, the
dated learnings, the old context — are in the private data repo's `bot-history/`). Code comments that cite "CLAUDE.md debt N" (or
64a, 65f …), a READ-ME-FIRST, SKILLS.md or a delivered round spec (`spec-cards-…`, `spec-next-…`, `spec-r4-…`,
`spec-home-pricing-…`) mean the files now in `bot-history/`: the debts are in `bot-history/CLAUDE-v2-2026-10-20.md`, and its extraction
checklist says where each one went.
