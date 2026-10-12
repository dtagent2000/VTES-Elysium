# client/ — the Elysium client & server project (main)

This folder belongs to the client/server chat ("Elysium", main). The bot project never writes here.

**What goes here (main syncs it):** `elysium-vtes-bord.html`, `elysium-server.js`, the start scripts, the
test harness and suites, `ELYSIUM-PROTOCOL.md`, ops, and `docs/` with main's own living docs (the
`Documentation/` folder that used to sit at the repo root moves to `client/docs/`).

**Deploy = copy to the root.** The repository root is the download players get; a client release copies
the client, server and start scripts from here to `/`.

**Consumed from `bot/` as a release (never edited here):** `elysium-bot.js`, `elysium-cardfx.json` / `.js`,
`elysium-twd-profile.json` / `.js`, `elysium-twd-archetypes.json` / `.js`, `START-HERE-BOTS.html`.
Handoffs from the bot project land in `bot/docs/handoffs/`; replies go in `client/docs/`.

See the root `CLAUDE.md` for the one rule that keeps the two halves safe.
