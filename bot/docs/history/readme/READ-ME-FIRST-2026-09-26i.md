# Elysium Bots — delivery 26 September 2026 (i): bot v0.6.184 → **v0.6.185** (the phase-B review) — DEPLOY CANDIDATE

**The fix.** A pending mark now takes only the event of the player who spoke. This covers strike, press, maneuver and taken.

**Why.** The old code had a second lookup that took any unmarked event of the same kind, from any speaker. It could have picked up a bystander's line. The name filter had rejected that line, but it stays unmarked in the log. The result would have been another combat's strike handed to my own. If the speaker's event is missing, the parser's own values are now recorded instead.

**Reviewed, no change needed:**
- the resets at a new combat
- the time windows for the taken line and the Crows
- the lifetime of the combat episode
- the speed of the scans

**Gates.**
- Suite 1733/0 ×3 (test 127w)
- Canary 57/0
- Hotseat 10/0
- Series pb6: handshake 80/80, names 80/80

**Deploy:** `elysium-bot.js` (v0.6.185).

**Replace:**
- `elysium-bot.js`
- `test-bot-logic.js`
- `elysium-bot-CHANGELOG.md`
- `CLAUDE.md`
