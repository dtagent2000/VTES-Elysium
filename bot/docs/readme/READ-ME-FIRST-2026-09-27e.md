# Elysium Bots — delivery 27 September 2026 (e): bot v0.6.188 → **v0.6.189** (brick 2, "do not oust yourself") + arena v1.4.5 — DEPLOY CANDIDATE (knob off by default)

**What it does.** With `dynFloor: 1` the bot's critical pool — the level at which it is one predator turn from falling — also counts the recurring losses it paid over its last full turn cycle: Creeping Sabotage ticks, Smiling Jack, Fame. Those come again next cycle whatever the predator does, so the influence floor rises before the next tick. The losses are read from the event log; no new bookkeeping.

**Why.** The other bot project's players saw a bot influence itself down to 1 pool with a Creeping Sabotage on it. Ours already counted the predator's bleed burst (v0.6.136) but not the ticks.

**Default is off** until the bench (48 matches, every seat) shows no loss. The Tremere-pinned arm for the sniper rule is still running too; both results go into `REPORT-bench-controls.md`.

**Gates:** suite 1744/0 (tests 127y) · canary 57/0. Hotseat: unchanged paths.

**Deploy:** `elysium-bot.js` (v0.6.189). **Replace:** `elysium-bot.js` · `elysium-bot-arena.js` (v1.4.5) · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`
