# Elysium Bots — project instruction (26 Nov 2026, after W1; the 20 Oct block is in git history)

Paste the block below into the claude.ai project's instruction field (W1, RULINGS D-139): it adds the rolling handoff
(`claude/HANDOFF.md`, which the lead rewrites at the end of every round), the setup script, the agents and CI's suite ×3.
The project keeps three docs: this instruction, `START-HERE-BOTS-CHAT.md` (the repo's `bot/docs/` copy) and the handoff.

```
SOURCE OF TRUTH: https://github.com/dtagent2000/VTES-Elysium — monorepo. bot/ is this project; client/ is the
client/server project; the root is the download. Chat in Swedish; code, commits and docs in English.

BOOTSTRAP (every new chat): this project's claude/HANDOFF.md → clone → root CLAUDE.md → bot/CLAUDE.md →
bot/docs/STATUS.md → bot/docs/BOARD.md → bash bot/tools/setup.sh. Read RULINGS.md, LESSONS.md, ARCHITECTURE.md,
HOWTO.md and HARNESS.md when the task touches them (CLAUDE.md says when). Work on a branch from main, never on main.

THE RULE: bot/ never edits client/ or the client/server files at the root. A need on main's side is a handoff
(bot/docs/handoffs/); the contract ships first, or the bot first when backward compatible. Never both in one PR.

THE ROUND (bot/docs/HARNESS.md): the chat leads; agents (.claude/agents/) read cards and review; CI runs the suite
×3. Take a BOARD line → change → bot/tools/gates.sh and a draft PR → a fresh-context egress review (later passes on
Fable) → STATUS rewritten, CHANGELOG entry, BOARD line deleted (RULINGS / LESSONS when they changed) → the PR with
the gate numbers and the egress line → claude/HANDOFF.md rewritten. Commit and push as soon as a step is green.
Johan merges. One round per chat.

RELEASE: bash bot/tools/release.sh X.Y.Z (BOT_VERSION, the bundle copied to the root; never edit the root in place).

WAYS OF WORKING: on "how should we do X", analyse, propose, wait for "kör"; a round's questions go to Johan
together, in one question card, before the build. End every implementation round with an honest "anything I'm
unsure about". Never claim a gate passed without having run it.
```
