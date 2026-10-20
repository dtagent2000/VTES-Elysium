# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (20 October 2026)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.211 (merged, deployed to the root) · arena v1.4.8 · sim table v1.0.1 · cardfx compiler v1.9.3, curated 105 ·
built against client v2.6.167 / srv-2.6.49. The current state is always `bot/docs/STATUS.md`.

## First five minutes
```
git clone https://github.com/dtagent2000/VTES-Elysium && cd VTES-Elysium
cat CLAUDE.md                 # the one rule, the layout, deploy = copy to the root, third-party data
cat bot/CLAUDE.md             # the rules that bind a change: gates, the round, the binding rules
cat bot/docs/STATUS.md        # now: version, deploy state, the last gate numbers, what is next
cat bot/docs/BOARD.md         # the open asks — take one
git checkout -b <topic>       # never work on main
```
Then, when the task touches them: `bot/docs/RULINGS.md` (Johan's rulings, numbered), `LESSONS.md`, `ARCHITECTURE.md`, `HOWTO.md`,
`HARNESS.md` (the round, the egress review, the release ritual). `bot/README.md` maps the folder.

## What is where
- `bot/` is flat on purpose: suites, arena, sim and tools expect `vtes.json`, the decks, the cardfx files and the read-only
  client/server copies beside them. Run everything from inside `bot/`.
- `bot/docs/`: the standing pages at the top; `specs/` (design canon), `handoffs/` (open handoffs to main; main's replies in
  `client/docs/handoffs/`), `reports/`, `reviews/`, `coverage/`, `archive/`, and `history/` (the journal, every READ-ME-FIRST, the
  old CLAUDE.md with its handshake and debts, the dated learnings, consumed handoffs, delivered round specs).
- `bot/tools/`: `run-section.sh` (one suite section against any bot), `mutants/`, `doc-budget.sh` (the standing pages' budgets).
- NOT in git: `vtes.json` (KRCG, v3 shape) and the TWDA (`twda.json` + optional `twda-vdb.json`). Fetch from the source; when the
  sandbox cannot reach it, attach the private repo `dtagent2000/VTES-Elysium-data` and copy from there (root `CLAUDE.md`).
  Series traces (`serie-*/`, `bench-*/`, sim dirs) are generated and live in scratch.

## The loop
BOARD line → analyse / propose / "kör" when it is a design question → branch → change → gates (inside `bot/`) → egress review →
STATUS + CHANGELOG + BOARD (RULINGS / LESSONS when they changed; a HANDOFF when main must act) → commit + push often → PR against
`main` with the gate numbers and the sim footprint → Johan merges. A release additionally bumps `BOT_VERSION` and copies the bundle
to the repository root. No READ-ME-FIRST and no journal entry any more (20 Oct 2026): the PR body and STATUS are the record.
