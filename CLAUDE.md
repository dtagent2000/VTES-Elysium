# CLAUDE.md — VTES-Elysium monorepo (12 October 2026)

Two sister projects, one repository. Conversation in Swedish; code and docs in English.

```
/                 THE DOWNLOAD — exactly what a player gets (client, server, start scripts, the bot bundle, guides)
/client/          the client/server project ("Elysium", main): sources, suites, harness, protocol, ops, its docs/
/bot/             the bot project ("Elysium Bots"): the bot, arena, cardfx pipeline, suites, decks, tools, its docs/
```

## The one rule
**Each half consumes the other's releases and never edits the other's files.**
- `bot/` never touches `client/` or the client/server files at the root. The copies of `elysium-server.js`,
  `ELYSIUM-PROTOCOL.md`, `elysium-vtes-bord.html` and `elysium-hotseat-bots-plan.md` inside `bot/` are READ-ONLY
  release copies kept beside the bot because the arena spawns the server, the canary pins the client's grammar and
  the hotseat gate drives the real `hotBridge`. Refresh them by copying a release in — never patch them.
- `client/` never touches `bot/`. It consumes the bot bundle (`elysium-bot.js`, `elysium-cardfx.json/.js`,
  `elysium-twd-profile.json/.js`, `elysium-twd-archetypes.json/.js`, `START-HERE-BOTS.html`) as a release.
- A change that needs both sides: the contract (protocol / server / client) ships first, the bot consumes it in the
  next round — or the bot ships first when the change is backward compatible. Never both sides in one round.
  Needs are written as handoffs: `bot/docs/handoffs/HANDOFF-to-main-*.md` ↔ `client/docs/` replies.

## Deploy = copy to the root
The root is the download. A bot release copies its bundle files from `bot/` to `/`; a client release copies the
client, server and start scripts from `client/` to `/`. Nothing at the root is edited in place. `check-versions.js`
(main's gate) is the place to assert the root matches the two halves.

## Where to start
- Bot work: `bot/CLAUDE.md` (the session bootstrap, the version handshake, every gate), then
  `bot/docs/readme/READ-ME-FIRST-<latest>.md`, `bot/docs/elysium-bot-session-journal.md` (newest first),
  `bot/docs/elysium-bot-project-context.md`, `bot/docs/elysium-bot-learnings.md`, `bot/SKILLS.md`.
- Client work: `client/CLAUDE.md` and `client/docs/` (main's own bootstrap, journal, learnings, backlog).

## Gates (summary — the full lists live in each half's CLAUDE.md)
- Bot: `node --check` on every changed file → `test-bot-logic.js` ×3 (≈300 s; run detached with `timeout 600` and
  poll) → `test-bot-canary.js` (needs the released client + protocol beside it — the copies in `bot/`) →
  `test-cardfx.js` when cardfx changed (needs `vtes.json` beside it — download it into `bot/` first, see below) → `diag-hb1-smoke.js` when the
  bot's browser surface changed → `test-bot-hotseat.js` when anything near the hotseat bridge changed.
  Run everything from inside `bot/` — the suites, the arena and the tools expect their files beside them.
- Client: see `client/CLAUDE.md`.

## Data that is not in git
Third-party data is never committed or hosted here; each session fetches it from its source:
- `vtes.json` (KRCG's card database, 7 MB): `curl -o bot/vtes.json https://static.krcg.org/data/vtes.json` before
  `test-cardfx.js` or the profile tools. The client fetches the same file itself at run time.
- `twd_decks.json` (10 MB, KRCG's TWDA) is an input to `bot/twd-profile.py` / `bot/twd-archetypes.py` only; put it in
  `bot/` when rebuilding the profile. Arena traces (`serie-*/`, `bench-*/`) are generated and ignored.
