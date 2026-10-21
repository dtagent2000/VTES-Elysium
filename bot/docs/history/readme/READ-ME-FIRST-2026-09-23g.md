# Elysium Bots — delivery 23 September 2026 (g): bot v0.6.166 → **v0.6.171 THE EFFECT LINES (+ stale fields, intercept, extra strikes, stale stealth)** — DEPLOY CANDIDATE

After Johan's first hotseat test; answers main's `HANDOFF-to-bot-2026-09-23-v2_6_134.md` (client v2.6.136 / srv-2.6.41).

- **New lines parsed:**
  - `strikes for N.`
  - `strikes for N aggravated damage.`
  - `strikes: steals N blood.` — one line
  - `strikes: combat ends.` — one line
  - every-round damage on / off
  - `and is burned` on a taken line
- **Combat ends fixed both ways:** bug A (mine never lands, no narration, no ph below 6) and bug B (the bot does not strike after yours).
- **Dodge:** your dodge stops my strike.
- **Aggravated damage** follows VEKN 4.
- **Wounded combatant:** a wounded side ends the combat.
- **My Carrion Crows** writes `ea`/`eb`.
- **Slow strike step fixed:** a human's strike line now answers "What is your strike?" at once. Before, the step always ran out its clock.
- **v0.6.168 (pre-test review):** a combat field counts only if it changed during this combat — a `ce`=1 left by an earlier combat can no longer skip the bot's strike.
- **v0.6.169 (Johan's pre-test round):** no intercept card against a 0-stealth declared bleed from a human (answered when you raise stealth); an announced additional strike no longer becomes the next round's strike.
- **v0.6.170–171:** no stealth or intercept that is not needed, bot-vs-bot too (base rules); a leftover stealth from an earlier action is no longer read as a human's — the bot seeds the rulebook default (0 / 1 undirected) on the counter.
- **Gates:** suite 1700/0 ×3 · canary **57/0** vs v2.6.136 · hotseat 10/0 · bot-only regression 186/186 names, handshake 192/192.
- **Deploy:** `elysium-bot.js` (v0.6.169) — online bot processes AND the hotseat bundle. Reply to main: `HANDOFF-to-main-2026-09-24-v0_6_171.md`.
