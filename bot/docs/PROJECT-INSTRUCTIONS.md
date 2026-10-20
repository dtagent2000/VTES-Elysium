# Elysium Bots — project instruction (20 Oct 2026, after round C1)

Paste the block below into the Claude project's instruction field. It replaces the 12 Oct 2026 instruction (in git history).

```
# Elysium Bots — project instruction (20 Oct 2026)

SOURCE OF TRUTH: https://github.com/dtagent2000/VTES-Elysium — a monorepo. bot/ is this project; client/ is the
client/server project; the root is the download players get. This chat project carries only this instruction and
START-HERE-BOTS-CHAT.md; everything else is read from git. Chat in Swedish; code, commits and docs in English.

BOOTSTRAP (every new chat): clone the repo → read root CLAUDE.md → bot/CLAUDE.md → bot/docs/STATUS.md → bot/docs/BOARD.md.
Read bot/docs/RULINGS.md, LESSONS.md, ARCHITECTURE.md, HOWTO.md and HARNESS.md when the task touches them (bot/CLAUDE.md says
when). Work on a branch from main, never on main. Run everything from inside bot/.

THE RULE: bot/ never edits client/ or the client/server files at the root. The copies of elysium-server.js,
ELYSIUM-PROTOCOL.md, elysium-vtes-bord.html and elysium-hotseat-bots-plan.md inside bot/ are READ-ONLY release copies —
replace them by copying a release in, never patch. A need on main's side is a handoff (bot/docs/handoffs/HANDOFF-to-main-
<date>-<version>.md); main ships the contract first, or the bot first when the change is backward compatible. Never both
halves in one PR.

THE ROUND (bot/docs/HARNESS.md): take a BOARD line → on a "how should we do X" question analyse, propose, wait for "kör" →
change → the gates in bot/CLAUDE.md (never claim a gate passed without having run it; a new test is verified destructively
against the pre-change file) → a fresh-context egress review → STATUS rewritten, a CHANGELOG entry, the BOARD line deleted
(RULINGS / LESSONS when they changed) → PR against main with the gate numbers, the sim footprint and the review's line.
Commit and push the branch as soon as a step is green (context can run out). Johan merges. Bot names rotate between
matches — read deck and seat from the trace manifests, never from the name.

RELEASE: bump BOT_VERSION (the line carries the version; the note goes to bot/docs/elysium-bot-CHANGELOG.md), copy the
bundle from bot/ to the root (elysium-bot.js, elysium-cardfx.json/.js, elysium-twd-profile.json/.js,
elysium-twd-archetypes.json/.js, START-HERE-BOTS.html). Never edit the root in place.

WAYS OF WORKING: end every implementation round with an honest "anything I'm unsure about" paragraph, unasked. A fix found
during a round may ride in it when it fits (say so in the PR); a design question still gets a proposal and a "kör".
```
