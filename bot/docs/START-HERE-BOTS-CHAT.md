# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (16 October 2026)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.200 (deploy candidate; R1 of the 14 Oct play-test review; R0 = v0.6.199, merged) · arena v1.4.7 · cardfx
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

## Open at hand-over (16 Oct 2026)
The 14 Oct play-test (main's rig, PR #13) is reviewed finding by finding in
`bot/docs/reviews/REVIEW-playtest-2026-10-14.md`: 16 bot bugs plus a side find, each with code lines, a fix and a
round. R0 shipped as v0.6.199 (merged); R1 as v0.6.200 (rules and deadlocks, debug for humans only). Next, in the
order Johan set on 16 Oct: R2 (the bot-vs-bot combat handshake, pacing bot-vs-bot combat when a human is seated, a
hold stops the bot's own combat moves, Roundhouse's damage), R3 (clocks start when the question is sent, stale hold
lines, one spokesbot for table remarks — the pool question stays per bot), R4 (the uncurated V5 masters,
Revelations against a bot). After R3 we run the same scenario ourselves in `client/playtest/` with `--dir`.
Main's open items are in `bot/docs/handoffs/HANDOFF-to-main-2026-10-16-v0_6_200.md` (the bridge's `edgeTake`, the
15 Oct debug items).
