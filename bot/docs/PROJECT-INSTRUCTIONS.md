# Elysium Bots — project instruction (27 Nov 2026, after the card chain, D-146; the older blocks are in git history)

Paste the block below into the claude.ai project's instruction field (RULINGS D-139, D-140, D-141). It names the rolling handoff
(`claude/HANDOFF.md`, which the lead rewrites at the end of every round), the setup script, the agents, CI's suite ×3, the
review's models, the question about a real match at the end of a round, the merge on the owner's yes (D-146), a verdict
for every unsure item, and the public repository's rule (no chat quotes, no names of private persons). The project keeps this instruction, `START-HERE-BOTS-CHAT.md`
(a copy of the repo's `bot/docs/` page), the handoff and the owner's reviews of other projects. Dated reports live in
`bot/docs/reports/`.

```
SOURCE OF TRUTH: https://github.com/dtagent2000/VTES-Elysium — monorepo. bot/ is this project; client/ is the
client/server project; the root is the download. Chat in Swedish; code, commits and docs in English. The repository
is public: no chat quotes and no names of private persons in it, the owner's words go to the private data repo.

BOOTSTRAP (every new chat): this project's claude/HANDOFF.md → clone → root CLAUDE.md → bot/CLAUDE.md →
bot/docs/STATUS.md → bot/docs/BOARD.md → bash bot/tools/setup.sh. Read RULINGS.md, LESSONS.md, ARCHITECTURE.md,
HOWTO.md and HARNESS.md when the task touches them (CLAUDE.md says when). Work on a branch from main, never on main.

THE RULE: bot/ never edits client/ or the client/server files at the root. A need on main's side is a handoff
(bot/docs/handoffs/); the contract ships first, or the bot first when backward compatible. Never both in one PR.

THE ROUND (bot/docs/HARNESS.md): the chat leads; agents (.claude/agents/) read cards and review; CI runs the suite
×3. Take a BOARD line → change → bot/tools/gates.sh and a draft PR → a fresh-context egress review (later passes,
and every pass of a round without a bot change, on Fable) → the docs (the CHANGELOG entry and the round's report,
STATUS's Next, BOARD line deleted; RULINGS / LESSONS when they changed) and bot/tools/round.py save → the PR with
its gate section and the egress line → claude/HANDOFF.md rewritten. In a round with a bot change, ask the owner before the merge whether to play a real match in the human
seat to evaluate it, and add what it teaches to the play notes (.claude/skills/bot-play-notes). Commit and push as
soon as a step is green. The round's last question card asks the owner to merge, naming what merges and in which order;
on his yes Claude merges (the data repo's PR, then the main PR's auto-merge on a green bot-gates). One round per chat.

RELEASE: bash bot/tools/release.sh X.Y.Z (BOT_VERSION, the bundle copied to the root; never edit the root in place).

WAYS OF WORKING: on "how should we do X", analyse, propose, wait for "kör"; a round's questions go to the owner
together, in one question card, before the build. Give every unsure item a verdict when it shows up: check it now,
carry it to the handoff, or drop it with a reason; end every round with that list. Never claim a gate passed
without having run it.
```
