# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (20 October 2026; the workflow 26–27 Nov, D-139, D-140, D-145, D-146)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**Now:** the versions, the deploy state and the last gates are in `bot/docs/STATUS.md` (generated from the code, git and the round
record `bot/docs/round-record.json`), and only there.

## First five minutes
```
git clone https://github.com/dtagent2000/VTES-Elysium && cd VTES-Elysium
cat CLAUDE.md                 # the one rule, the layout, deploy = copy to the root, third-party data
cat bot/CLAUDE.md             # the rules that bind a change: gates, the round, the binding rules
cat bot/docs/STATUS.md        # now: version, deploy state, the last gate numbers, what is next
cat bot/docs/BOARD.md         # the open asks — take one
bash bot/tools/setup.sh       # KRCG's data built into vtes.json, zero-vtes cloned outside the repository at its pin
git checkout -b <topic>       # never work on main
```
Then, when the task touches them: `bot/docs/RULINGS.md` (the owner's rulings, numbered), `LESSONS.md`, `ARCHITECTURE.md`, `HOWTO.md`,
`HARNESS.md` (the round, the egress review, the release ritual). `bot/README.md` maps the folder.

## What is where
- `bot/` is flat on purpose: suites, arena, sim and tools expect `vtes.json`, the decks, the cardfx files and the read-only
  client/server copies beside them. Run everything from inside `bot/`.
- `bot/docs/`: the standing pages at the top; `specs/` (design canon), `handoffs/` (open handoffs to main; main's replies in
  `client/docs/handoffs/`), `reports/` (a round's report), `reviews/`, `coverage/`, and `history/` (frozen: the CHANGELOG to
  v0.6.243, the register as it stood on 27 Nov, the delivered round specs, consumed handoffs; the records from before D-141 — the
  journal, every READ-ME-FIRST, the old CLAUDE.md with its handshake and debts, the dated learnings — are in the private data
  repo's `bot-history/`, D-142).
- `bot/tools/`: `setup.sh`, `gates.sh` (the local gates, the PR's table, the round record), `round.py` (the record's copies and
  their check), `release.sh` (the release ritual's mechanics), `ci-status.sh` (CI's suite ×3, the release gate), `run-section.sh`
  (one suite section against any bot), `mutants/`, `doc-budget.sh` with `doc-budgets.txt` (the standing pages: a ceiling). The agents the round uses: `.claude/agents/bot-*.md` (HARNESS "Roles and tools").
  Claude's notes as a player (strategy, tactics, the bots as opponents): `.claude/skills/bot-play-notes/SKILL.md` (D-140).
- NOT in git: `vtes.json` and the TWDA (`twda.json`); the root `CLAUDE.md` names their sources and fetch commands. Fetch from the
  source; when the sandbox cannot reach it, attach the private repo `dtagent2000/VTES-Elysium-data` and copy from there.
  Series traces (`serie-*/`, `bench-*/`, sim dirs) are generated and live in scratch.

## The loop
BOARD line → analyse / propose / the go-ahead ("kör") when it is a design question → branch → change → `tools/gates.sh` + a draft
PR for CI's suite ×3 → egress review → the docs (the CHANGELOG entry on its template, the round's report, STATUS's Next, BOARD;
RULINGS / LESSONS when they changed; a HANDOFF when main must act) and `tools/round.py save` → commit + push often → PR against
`main` with its gate section → in a round with a bot change, ask the owner before the merge about a real match in the human seat
→ the round's last card asks the owner to merge, and Claude merges on his yes (D-146). A release additionally runs `tools/release.sh`. The round record, the CHANGELOG entry, the report and the PR
body are the record; STATUS holds the state; the project's handoff points to them (one place for each fact, HARNESS; D-142, D-145).
