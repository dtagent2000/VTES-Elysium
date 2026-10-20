# HANDOFF to main — 20 Oct 2026, the bot's docs diet (round C1, no code change)

Nothing to build. Three small things, and two questions.

## 1. Root `CLAUDE.md`, "Where to start — Bot work" (main's file, so we did not touch it)
The bot's bootstrap is now: `bot/CLAUDE.md` → `bot/docs/STATUS.md` → `bot/docs/BOARD.md` (then `RULINGS.md`, `LESSONS.md`,
`ARCHITECTURE.md`, `HOWTO.md`, `HARNESS.md` when the task touches them). `bot/docs/readme/`, the journal, the context, the learnings
and `bot/SKILLS.md` moved to `bot/docs/history/`. The "Gates (summary)" bullet for the bot still holds. Please update the two bot
lines when you next touch the root file.

## 2. The bot's release ritual changed
No READ-ME-FIRST and no journal entry per release any more; the record is `bot/docs/STATUS.md`, the CHANGELOG and the PR body. A
handoff is written only when main must act (as before). `check-versions.js` is unaffected (it reads `BOT_VERSION` and the root copies).

## 3. The read-only copies
`bot/`'s copies are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (16 Oct) while the root is v2.6.167 / srv-2.6.49; we will refresh them
as a commit of their own in the next code round.

## Owed to §12 and the canary (unconsumed asks from earlier rounds)
Bot-emitted frozen lines that the bot sends and main's protocol / canary do not yet list: `CARD — vampires cannot block this
action.` (spec-block-bar, 18 Sep), `Referendum terms: A −3, B −1` (spec-referendum-terms), `VAMP attempts to leave torpor.`
(v0.6.128), and the Haven Uncovered / Spying Mission lines of v0.6.205 / v0.6.211 (`L12.havenM`, `L12.havenRush`, `L12.spyNull`).
Also still standing: the client locks all helpers on while a bot is seated until the bot proves a whole combat on lines alone — we
will ask for that step when the bot is ready; nothing to do now.

## Questions
- **Q4 of the clean-up spec:** may the bot's gates (the canary, the suite's 154f, the arena's spawn, the hotseat gate) read the
  ROOT's released `elysium-vtes-bord.html`, `elysium-server.js` and `ELYSIUM-PROTOCOL.md` instead of the copies inside `bot/`? That
  removes the drift and 1.8 MB of copies; the one rule stands (we never edit them). If yes, we switch the paths in a bot round and
  delete the copies; if you prefer the copies to stay (a frozen pin per bot release), say so and we keep them.
- **The abstract model (`spec-cleanup-2026-10-20.md` §7.1):** does the hotseat bridge have, or could it cheaply expose, a pure
  `step(state, action)` with no timers (a forkable table state)? We expect "no", and build the abstract model in pure data either way;
  the answer only tells us whether a bridge-level rollout is ever an option.
