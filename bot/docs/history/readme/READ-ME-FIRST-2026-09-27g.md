# Elysium Bots — delivery 27 September 2026 (g): bot v0.6.190 → **v0.6.191** (brick 2 fixed; `dynFloor` back to 0 until the re-bench) — DEPLOY CANDIDATE

**What the review found.** Brick 2 ("do not oust yourself") was inert in real play. `_knownLosses` counted only the bot's own pool lines, and the Creeping Sabotage tick is the predator's line naming the prey ("Creeping Sabotage ticks — Y burns 2."), so no tick was ever counted. Fixed: any creep / Smiling Jack / Fame loss about me counts (target = my seat, or my own line). A `dyn-floor` trace row now proves the knob fires.

**Consequence.** The v0.6.190 bench measured nothing, so `dynFloor` is back to 0. The re-bench (arm `dyn2`, 48 matches) is running; it flips again only if that arm shows no loss. `twdKnow` stays on (its bench was real: the sniper rule fires on lines we verified).

**The lesson, now in CLAUDE.md's bench gate:** a bench cannot tell a harmless change from an inert one — prove the knob fires before reading its arm.

**Gates:** suite 1744/0 · canary 57/0 · hotseat 10/0.

**Deploy:** `elysium-bot.js` (v0.6.191). **Replace:** `elysium-bot.js` · `test-bot-logic.js` · `REPORT-bench-controls.md` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`
