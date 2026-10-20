# Elysium Bots — project instruction (20 Oct 2026, after round C1)

Paste the block below into the claude.ai project's instruction field once C1 (PR #39) is merged; it replaces the 12 Oct 2026
instruction (in git history). It is the clean-up spec's Appendix A, verbatim (`specs/spec-cleanup-2026-10-20.md` §8 Q7).
The project's `claude/START-HERE-BOTS-CHAT.md` is then replaced by `bot/docs/START-HERE-BOTS-CHAT.md`.

```
SOURCE OF TRUTH: https://github.com/dtagent2000/VTES-Elysium — monorepo. bot/ is this project; client/ is the
client/server project; the root is the download. Chat in Swedish; code, commits and docs in English.

BOOTSTRAP (every new chat): clone → root CLAUDE.md → bot/CLAUDE.md → bot/docs/STATUS.md → bot/docs/BOARD.md.
Read RULINGS.md, LESSONS.md, ARCHITECTURE.md and HOWTO.md when the task touches them (CLAUDE.md says when).
Work on a branch from main, never on main.

THE RULE: bot/ never edits client/ or the client/server files at the root. A need on main's side is a handoff
(bot/docs/handoffs/); the contract ships first, or the bot first when backward compatible. Never both in one PR.

THE ROUND (bot/docs/HARNESS.md): take a BOARD line → change → gates (bot/CLAUDE.md) → a fresh-context egress
review → STATUS rewritten, CHANGELOG entry, BOARD line deleted (RULINGS / LESSONS when they changed) → PR with
the gate numbers and the egress line. Commit and push as soon as a step is green. Johan merges.

RELEASE: bump BOT_VERSION, copy the bundle from bot/ to the root (never edit the root in place).

WAYS OF WORKING: on "how should we do X", analyse, propose, wait for "kör". End every implementation round with an
honest "anything I'm unsure about". Never claim a gate passed without having run it.
```
