# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (12 October 2026)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.198 (deploy candidate) · arena v1.4.7 · cardfx compiler v1.9.1 · built against
client v2.6.141 / srv-2.6.43 · gates on `main`: suite 1933/0, canary 57/0, HB1 11/0, hotseat 10/0, test-cardfx 261/0.

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
- NOT in git: `twd_decks.json` (10 MB TWDA input to `twd-profile.py` / `twd-archetypes.py` — Johan uploads it
  when the profile is rebuilt), arena traces (`serie-*/`, `bench-*/`).

## The loop
branch → change → gates (inside `bot/`) → living docs + READ-ME-FIRST (+ HANDOFF when main must act) →
commit + push often → PR against `main` with the gate numbers in the body → Johan merges.
A bot release additionally bumps `BOT_VERSION` and copies the bundle to the repository root.

## Open at hand-over (12 Oct 2026)
Johan's playtest with two bots → his picks from `bot/docs/REVIEW-vtes-player-2026-10-11.md` (suggested first:
paired bench read, flip counts, one bot asks the pool question) → the knowledge-layer remainder → the meta layer.
Open leads: the late steal line, the 200 ms maneuver window, the R6 audit, bleed-modifier grace outside the tempo,
hold during bot-vs-bot combat vs the 2 s handshake. Main is syncing its half into `client/`
(`bot/docs/handoffs/HANDOFF-to-main-2026-10-12-monorepo.md`); after that, refresh `bot/elysium-server.js` to
srv-2.6.43 from `client/` and re-run canary + hotseat gate.
