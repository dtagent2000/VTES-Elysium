# Handoff to main — the public repository: no chat quotes, no names of private persons (26 Nov 2026)

The repository is public. The owner ruled on 26 Nov that it carries no chat quotes and no names of private persons, in a file,
a commit message or a PR text (bot RULINGS D-141; the cleanup round's scope, D-142). A decision is written in our own words and
by role (the owner); the verbatim words, where they matter, go to the private data repo `dtagent2000/VTES-Elysium-data` (the
bot keeps its own in `RULINGS-WORDS.md` there, keyed by RULINGS line). Licence credits and official rulings by their references
stay, and so do the invented table names of the tests and examples (Hanna, Lisa, Viktor, Mara …: the owner confirmed they are
invented). Git history stays as it is, and so do the old PR bodies on GitHub (the owner's choice).

The bot side is done in bot PR #113 (no bot change): `bot/`, `.claude/` and the bot's workflow name the owner by role. The
bot's frozen records (its old `docs/history/` and `docs/archive/`) moved verbatim to the data repo's `bot-history/`. What
remains in the bot's bundle (`elysium-bot.js`'s comments, the cardfx notes, an example line in `START-HERE-BOTS.html`, the
sewer deck's name) goes in a small bot release of its own next, so its bytes change once; you will get the usual handoff with
it (the guide to re-embed).

## 1. The ask
1. **Your files** — `client/` and what you ship to the root (the client, the server, `START-HERE.html`, the root `README.md`):
   the same rule, in a round of yours. A count by `bot/tools/public-scan.py`'s rules over them (main at `2f18daf`): about 2,000
   occurrences of the owner's names on about 1,800 lines in 61 files (five of them the copies in `bot/`), and about 90 lines of
   Swedish outside your session journal (about 60 of them quotes, most of the rest in `client/docs/elysium-learnings.md`); the
   journal is itself Swedish prose (about 2,100 lines). The
   largest: `client/docs/elysium-session-journal.md`, the client html (in its comments and its changelog, at the root and in
   `client/`), `client/CLAUDE.md`, `client/docs/elysium-project-context.md`, `client/test-client-logic.js` (its fixtures among
   them), your canary, `client/docs/elysium-learnings.md`, `elysium-CHANGELOG.md`, `START-HERE-CLIENT-CHAT.md`, the hosting and
   security plans, the server and the protocol (a few each) and 30 of your 34 replies in `client/docs/handoffs/`. The Host
   Guide (`.docx`) names nobody. How you do it is yours; the bot's way, for comparison: the frozen records moved to the private
   repo, the living pages rewritten by role, the fixture human renamed to an invented name.
2. **The root `CLAUDE.md`** (shared, each side its own lines): #113 changed the bot's "Where to start" line only (the bot's
   frozen records are in the private data repo now); the rest of the page is yours and names nobody today.
3. **The read-only copies in `bot/`** (`elysium-vtes-bord.html`, `elysium-server.js`, `ELYSIUM-PROTOCOL.md`,
   `elysium-hotseat-bots-plan.md` and your canary `test-bot-canary.js`) are refreshed from your release after your round, as
   usual; the bot does not patch them, and its scan skips them until then.

## 2. Nothing on the wire
No line, verb or field changes; nothing at run time depends on a person's name. The bot's tests and its examples use invented
names only.

## 3. A tool you may use
`bot/tools/public-scan.py` checks the lines a change adds (`--diff A..B`) or the whole tree (`--tree`) for the owner's names
(kept as hashes, so the tool names nobody), for Swedish chat quotes (a quote that wraps over a line break too) and for lines of
Swedish prose. It scans the bot's files only (`owned()`); point it at
yours by copying it into `client/` or by widening that function in your copy. The bot's CI step runs it on a pull request's own
lines.
