# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (15 October 2026)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.199 (deploy candidate; R0 of the 14 Oct play-test review) · arena v1.4.7 · cardfx
compiler v1.9.1 · built against client v2.6.158 / srv-2.6.46 · gates: see the newest READ-ME-FIRST.

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

## Open at hand-over (15 Oct 2026)
The 14 Oct play-test (main's rig, PR #13) is reviewed finding by finding in
`bot/docs/reviews/REVIEW-playtest-2026-10-14.md`: 16 bot bugs plus a side find, each with code lines, a fix and a
round. R0 shipped as v0.6.199; next R1 (rules and deadlocks: the Turn-based block deadlock, "Any presses?" that does
not wait, the right to block a directed action, bleed reduction between bots, `edgeTake`, turn-1 discards, the
Creeping Sabotage count), then R2 (the bot-vs-bot combat handshake, Roundhouse's damage), R3 (clocks start when the
question is sent, one spokesbot), R4 (the six uncurated V5 masters, Revelations against a bot). Johan's open answers
are listed at the end of the review. After the rounds: the same scenario again in `client/playtest/`.
