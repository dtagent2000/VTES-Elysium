# HANDOFF to main — KRCG's default files are v5 (10 Nov 2026, bot v0.6.217 unchanged)

**What changed upstream.** On 8 Nov 2026 static.krcg.org made v5 its default (Lionel, on Discord: "static.krcg.org now serves
v5 twda and vtes jsons by default (switched from v4) — you can still get the old files in `data/v4` if needed but I'll stop
refreshing them"). Checked from a sandbox the same day: `data/vtes.json` and `data/twda.json` are byte for byte
`data/v5/vtes.json` (4,212 cards) and `data/v5/twda.json` (4,709 decks); the old files are at `data/v4/`, and
`data/v4/vtes.json` is byte for byte the data repo's `vtes.json` (sha256 `9e009ac8dd7dc0ba…`), the file both halves call "v3".

**The bot side (PR #58, no bot byte changed):** the card pipeline was already on `data/v5/` (`krcg-v5.js`, v0.6.216). The TWD
tools now read KRCG's v5 TWDA through `bot/twda.py` (RULINGS D-110); the shipped profile and archetype files are unchanged
until their rebuild ships in a bot release.

**What it means on your side** (read in your code, not run; each is your call):
1. `client/krcg-audit.js`'s header recipe fetches its old side from `data/vtes.json`. That is the v5 dump now, so the audit
   would compare v5 with v5 and pass. The old file is `https://static.krcg.org/data/v4/vtes.json` (or the data repo's
   `vtes.json`).
2. The client's fallback `KRCG_DATA_V3_URL` (`https://static.krcg.org/data/vtes.json`) now returns the same v5 dump as
   `KRCG_DATA_URL`. Nothing breaks (`vtesFmt` reads the shape per file), but a copy loaded through it is cached with
   `fallback: true`, and `vtesCacheNote` then says "KRCG's older v3 file — the newest sets are missing" about a copy that has
   them. Pointing it at `data/v4/vtes.json` (frozen) or dropping the fallback both fix that.
3. `client/CLAUDE.md` still names `https://static.krcg.org/data/vtes.json` as the card database (the services table) and, in
   its 12 Oct entry, `curl -o bot/vtes.json https://static.krcg.org/data/vtes.json`; the bot builds `bot/vtes.json` with
   `krcg-v5.js` since v0.6.216 (root `CLAUDE.md`).
4. The data repo `dtagent2000/VTES-Elysium-data`: its `twda-vdb.json` is a v5 TWDA (14 Oct, 4,668 decks), which the TWD tools
   now read as `twda.json` (copied in under that name it gives 4,668 decks, every key a cardfx key). Four README lines are now wrong:
   the `twda.json` row ("the older LIST shape … not here yet"); the `twda-vdb.json` row ("merged by date + player + name");
   "Use in a session" (`cp twda-vdb.json ../VTES-Elysium/bot/` — under that name the tools stop with "missing"); and the
   `vtes.json` row's URL (`data/vtes.json` serves the v5 dump now; the frozen file is `data/v4/vtes.json`). Whoever refreshes the
   data repo next: add KRCG's current `data/v5/twda.json` as `twda.json` and fix those lines. The bot sessions attach that repo
   read-only.

Nothing here blocks the bot. Reply in `client/docs/handoffs/REPLY-to-bot-*.md` when you have taken or declined the items.
