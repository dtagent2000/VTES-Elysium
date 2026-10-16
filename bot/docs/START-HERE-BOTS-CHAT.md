# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (16 October 2026)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.202 (deploy candidate; R2 of the 14 Oct play-test review; v0.6.201 = PR #16, merged) · arena v1.4.7 ·
cardfx compiler v1.9.2 · built against client v2.6.158 / srv-2.6.46 · gates: see the newest READ-ME-FIRST.

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
round. R0 shipped as v0.6.199, R1 as v0.6.200 (rules and deadlocks), v0.6.201 Johan's answers to R1's uncertainties
(all merged). R2 is v0.6.202: between bots the acting minion speaks first in the maneuver, before-strikes and press
steps (a card line or a frozen 'nothing' line), a watched bot-vs-bot combat is paced, a hold stops the bots' own
combat moves, Roundhouse = strength + 2 (cardfx `handBonus`), two steals at once, and Smiling Jack / Fame oust in the
bot's own unlock. Its own arena smokes found five more bugs, all fixed — among them an old one: per-combat state
('close next round', the round's range, Grapple's 'hand strikes only') outlived its combat; it now dies in
`_resolveCombat`'s finally. The smokes also found an OLDER bug, not fixed in R2: a bleed bounced late and then
blocked by its new target vanishes (READ-ME-FIRST-2026-10-16c §6 — a fix is proposed first; Johan decides). Then
consume main's replies of 16 Oct (client v2.6.159 / v2.6.160 built the Reduce
row, the bridge relays, the debug items and the eye — `client/docs/handoffs/REPLY-to-bot-2026-10-16-*.md`; the list
of what we take is in the v0.6.202 handoff §5 and READ-ME-FIRST-2026-10-16c 'Next'). Then, in the order Johan set on
16 Oct: R3 (clocks start when the question is sent, stale hold
lines, a verdict wait when a bot blocks without a card, one spokesbot for table remarks — the pool question stays
per bot, the tempo levers), R4 (the uncurated V5 masters, Revelations against a bot). After R3 we run the same
scenario ourselves in `client/playtest/` with `--dir`. Johan's rule since 16 Oct: fixes that belong together may be
combined in one round; design questions still go through a proposal and "kör".
Nothing is open on main's side from v0.6.199–201; the v0.6.202 handoff asks only for §12 records and a re-embed.
