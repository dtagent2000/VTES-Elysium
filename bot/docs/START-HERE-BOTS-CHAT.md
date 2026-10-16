# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (16 October 2026)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.204 (deploy candidate; R3 of the play-test review; v0.6.203 = PR #21, merged) · arena v1.4.7 ·
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

## Open at hand-over (16 Oct 2026, night)
The 14 Oct play-test (main's rig, PR #13) is reviewed finding by finding in
`bot/docs/reviews/REVIEW-playtest-2026-10-14.md`; R0–R2 shipped as v0.6.199–202 and R3's first step as v0.6.203 (all merged).
v0.6.204 is R3 proper (Johan's "Kör på!" of 16 Oct): a wait's clock starts when its question is on the wire (F3, F11: no
deadline while queued, the announced number is the clock); the hold lines go first and a stale one is dropped (F4); the
verdict wait when a bot blocks a human (F10: a question, the tempo's clock, the rung `resolve-verdict`; It resolves over a
failed counter lands the action); one spokesbot, the archetype read on the log tier (F2); a bot target's Hold on after a bot
actor's question (F6); the tempo levers (a)–(d) (F12, F13). **Main must change one LIVE test** (v2.6.140, the tempo: it reads
the first steppable status, now often the queued moment with `until: null`) — the handoff gives the line. Next, in Johan's
order: **R4 + the dodge as v0.6.205** (Johan, 16 Oct: bake the dodge into R4 — the uncurated V5 masters, Revelations against a
bot, and the dodge rule "for now against 2 or more damage"; the proposal and its two open questions are in
READ-ME-FIRST-2026-10-16e, 'Next'), then the scenario in `client/playtest/` with `--dir`, and a larger re-measure once every
fix is in (Johan, 16 Oct). Known, not built: a human's bounce of a bot's bleed is not read by the acting
bot (READ-ME-FIRST-2026-10-16d §6); the tempo lever for a watched bot-vs-bot combat (Johan: wait and see). Johan's rule since
16 Oct: fixes that belong together may be combined in one round; design questions still go through a proposal and "kör".
