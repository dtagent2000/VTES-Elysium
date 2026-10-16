# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (16 October 2026, night)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.205 (deploy candidate; R4 of the play-test review, with the dodge; v0.6.204 = PR #22, merged) · arena v1.4.7 ·
cardfx compiler v1.9.2, curated 105 · built against client v2.6.162 / srv-2.6.46 · gates: see the newest READ-ME-FIRST.

## First five minutes
```
git clone https://github.com/dtagent2000/VTES-Elysium && cd VTES-Elysium
cat CLAUDE.md                                  # the one rule, the layout, deploy = copy to the root
cat bot/CLAUDE.md                              # the bootstrap: version handshake, every gate, every doctrine
ls bot/docs/readme/ | tail -1                  # the latest READ-ME-FIRST — read it
head -200 bot/docs/elysium-bot-session-journal.md   # newest entry first
git checkout -b <topic>                        # never work on main
```
Then `bot/docs/elysium-bot-project-context.md`, `bot/docs/elysium-bot-learnings.md`, `bot/SKILLS.md`.
`bot/README.md` maps the folder (code · gates · series tools · docs/ layout).

## What is where
- `bot/` is flat on purpose: suites, arena and tools expect `vtes.json`, the decks, the cardfx files and the
  read-only client/server copies beside them. Run everything from inside `bot/`.
- `bot/docs/` — living docs at the top; `readme/` (every delivery), `handoffs/` (to main + main's replies),
  `reports/`, `specs/`, `reviews/`, `coverage/`, `archive/` (old manifests/TODOs; the 21 Sep TODO still maps the
  older debts).
- `bot/tools/mutants/` — the hold-gate mutant isolation (`python3 tools/mutants/mutate-v0_6_198.py /tmp/mut`).
- NOT in git: third-party data — `vtes.json` (KRCG, v3 shape; `test-cardfx.js`, the cardfx compiler, the coverage
  and profile tools) and the TWDA (`twda.json` + optional `twda-vdb.json`, only to rebuild the profile). Fetch from
  the source; when the sandbox cannot reach it, attach the private repo `dtagent2000/VTES-Elysium-data` and copy
  from there (root `CLAUDE.md`, 'Data that is not in git'). Arena traces (`serie-*/`, `bench-*/`) are generated.

## The loop
branch → change → gates (inside `bot/`) → living docs + READ-ME-FIRST (+ HANDOFF when main must act) →
commit + push often → PR against `main` with the gate numbers in the body → Johan merges.
A bot release additionally bumps `BOT_VERSION` and copies the bundle to the repository root.

## Open at hand-over (16 Oct 2026, night)
The 14 Oct play-test (main's rig, PR #13) is reviewed finding by finding in
`bot/docs/reviews/REVIEW-playtest-2026-10-14.md`; R0–R3 shipped as v0.6.199–204 (all merged). v0.6.205 is R4, the review's
last round, with the dodge (Johan, 16 Oct: one PR): the dodge rule (a known strike of 2+ that does more than the bot's own
strike, an equal one with two dodges, an unknown one on the expected strike; the floor of 2 holds at a tie — open question A,
my default); Revelations against a bot (F21: armed by the prey, the human's pick read); the six V5 masters curated (F23: The
Labyrinth, Guardian Angel, Wasserschloss Anif's bank, Haven Uncovered with the rush through it — two frozen lines for main);
found on the way: Arcane Library's influence lock never fired, and a vampire at capacity in the uncontrolled region stalled
the influence phase for good (the free rise). Main's client v2.6.162 (PR #23) is consumed. **Open for Johan:** question A (the
dodge's tie); the probe-then-punch reservation that never takes effect (since v0.6.143 — READ-ME-FIRST-2026-10-16f §6); main's
finding that the chat beat after a question delays the verdict line ~5 s (their REPLY to v0.6.204, §4.1) — a design question.
Next, in Johan's order: the 14 Oct scenario in `client/playtest/` with `--dir` on a scratch copy of the root with the bot
branch, compared with the report's numbers (the proof R0–R4 fixed what the play-test found); then a larger re-measure once
every fix is in; the parked items in READ-ME-FIRST-2026-10-16f, 'Next'. Known, not built: a human's bounce of a bot's bleed is
not read by the acting bot; a human's Haven Uncovered is not read by the bots. Johan's rule since 16 Oct: fixes that belong
together may be combined in one round; design questions still go through a proposal and "kör".
