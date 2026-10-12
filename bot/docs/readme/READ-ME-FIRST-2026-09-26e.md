# Elysium Bots — delivery 26 September 2026 (e): bot v0.6.180 → **v0.6.181 PHASE B step 1** — DEPLOY CANDIDATE

**What changed:** the opponent's strike now lives in the event log. The loose `_oppStrike` copy is gone.

**How it works now:**
- When the combat accepts a strike line, that line's event in the log is marked "pending".
- The bot consumes it there. The latest unconsumed line wins, as a correction. A new combat drops the rest.
- `_oppStrike` remains as a view onto the log, so the suite and the canary keep working unchanged.

**Verified:**
- Suite 1731/0 ×3.
- Canary 57/0.
- Hotseat 10/0.
- Bot-only series pb1 (3 matches), checked with the ledger and invariant tools:
  - handshake 148/148
  - opponent names 134/134
  - steal 23 / 22
  - invariant flags 6, all around the known strike-vs-taken nuances (crows, one Ventrue's prevention)

**Next:** the combat opponent's name moves the same way (`_combatOppName`, `_learnedOpp`, `_rowOpp`).

**Deploy:** `elysium-bot.js` (v0.6.181).

**Replace:** `elysium-bot.js`, `elysium-bot-CHANGELOG.md`, `CLAUDE.md`.
