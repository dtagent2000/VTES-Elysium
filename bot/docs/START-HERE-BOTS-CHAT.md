# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (16 October 2026)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.203 (deploy candidate; the first step of R3; v0.6.202 = PR #19, merged) · arena v1.4.7 ·
cardfx compiler v1.9.2 · built against client v2.6.161 / srv-2.6.46 · gates: see the newest READ-ME-FIRST.

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

## Open at hand-over (16 Oct 2026, late)
The 14 Oct play-test (main's rig, PR #13) is reviewed finding by finding in
`bot/docs/reviews/REVIEW-playtest-2026-10-14.md`; R0–R2 shipped as v0.6.199–202 (all merged). v0.6.203 is R3's first step
(Johan's "Kör på!" of 16 Oct): main's replies of 16 Oct consumed (read-only copies = client v2.6.161, their canary §5, the
hotseat lift's combat merge, the guide); the vanished bleed fixed (a bounce opens its new target's block step; the bleed's
`through` at the resolution; `VANISHED` 0 in the smoke); the strike step between bots in the rulebook's order (Johan: the bots
answer known strikes); Deep Song against a human; hygiene for the invariants; and an old crows bug its own smoke found.
Next, in the order Johan set: **R3 proper as v0.6.204** — a clock starts when its question reaches the wire (F3, F11), stale
hold lines are dropped (F4), a verdict wait when a bot blocks a human without a card (F10), one spokesbot for table remarks
(F2; the pool question stays per bot), the tempo levers (a)–(d) of F12 / F13 (Adaptive's skip stays in Adaptive). Then R4
(the uncurated V5 masters, Revelations against a bot), the scenario in `client/playtest/` with `--dir`, and a larger
re-measure once every fix is in (Johan, 16 Oct). Known, not built: a human's bounce of a bot's bleed is not read by the acting
bot (READ-ME-FIRST-2026-10-16d §6). Johan's rule since 16 Oct: fixes that belong together may be combined in one round;
design questions still go through a proposal and "kör". The v0.6.203 handoff asks main for a re-embed of the guide only.
