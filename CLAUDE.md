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
- Bot work: `bot/CLAUDE.md` (the rules: bootstrap order, gates, the round), then `bot/docs/STATUS.md` (now) and
  `bot/docs/BOARD.md` (the asks); `bot/docs/RULINGS.md`, `LESSONS.md`, `ARCHITECTURE.md`, `HOWTO.md` and `HARNESS.md` when the
  task touches them. The journal, the READ-ME-FIRSTs and the old bootstrap are in `bot/docs/history/` (20 Oct 2026).
- Client work: `client/CLAUDE.md` and `client/docs/` (main's own bootstrap, journal, learnings, backlog).

## Gates (summary — the full lists live in each half's CLAUDE.md)
- Bot (the complete list: `bot/CLAUDE.md` "Gates"): `node --check` on every changed file → `test-bot-logic.js` ×3 (≈300–420 s; run detached with `timeout 600` and
  poll) → `test-bot-canary.js` (needs the released client + protocol beside it — the copies in `bot/`) →
  `test-cardfx.js` when cardfx changed (needs `vtes.json` beside it — download it into `bot/` first, see below) → `diag-hb1-smoke.js` when the
  bot's browser surface changed → `test-bot-hotseat.js` when anything near the hotseat bridge changed.
  Run everything from inside `bot/` — the suites, the arena and the tools expect their files beside them.
- Client: see `client/CLAUDE.md`.

## Data that is not in git
Third-party data is never committed or hosted here; each session fetches it from its source:
- `bot/vtes.json` (KRCG's cards in the v3 shape every bot tool reads) is BUILT from KRCG's v5 dump since bot v0.6.216 — the
  v3 file (`data/vtes.json`) stopped getting new cards at Sabbat V5. Before `test-cardfx.js`, the compiler or the profile tools:
  `cd bot && curl -o vtes-v5.json https://static.krcg.org/data/v5/vtes.json && curl -o expansions.json
  https://static.krcg.org/data/v5/expansions.json && node krcg-v5.js` (all three ignored). The client reads the same dump at
  run time (since v2.6.168).
- The TWDA (VEKN's Tournament Winning Deck Archive) is an input to `bot/twd-profile.py` / `bot/twd-archetypes.py` only,
  when the profile is rebuilt: `twda.json` (KRCG's list-shaped export, the base) and optionally `twda-vdb.json` (the
  VDB-style dict, merged in). Both are ignored in `bot/`. Arena traces (`serie-*/`, `bench-*/`) are generated and ignored.
- **When a session cannot reach the source** (a sandbox whose network policy blocks static.krcg.org), copy the files
  from the private data repo `dtagent2000/VTES-Elysium-data` (attach it read-only): `vtes-v5.json` (the v5 dump: copy it into
  `bot/` with the dump's `expansions.json` and run `node krcg-v5.js`), the old `vtes.json` (KRCG's last v3 file, kept for
  `krcg-v5.js --compare`) and `twda-vdb.json`; its README lists source, date and hash. That repo is ours only: players still get the data from its original sources.
