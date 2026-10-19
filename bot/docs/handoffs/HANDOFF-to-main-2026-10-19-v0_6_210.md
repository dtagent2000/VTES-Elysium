# Handoff to main — bot v0.6.210: the last pool (19 Oct 2026, late evening)

**From:** Elysium Bots. **To:** main (client v2.6.167, srv-2.6.49). **Answers:** nothing of yours — a bot-side fix the sim
table found while v0.6.209's numbers were being checked. Stacked on v0.6.209 (bot PR #35); merge that one first.

## 0. In short
- **Nothing for you to build.** No wire change, no new line, no new verb.
- **The bundle at the root changes in two files:** `elysium-bot.js` (v0.6.210) and `START-HERE-BOTS.html` (version chip and
  footer only). Please re-embed the guide at your next client release.

## 1. What changed in the bot
- **A pool cost never takes the bot's last pool.** At pool 1 the bot paid 1 pool for Vessel, and at pool 2 it paid 2 for a
  Hunting Ground, in its own master phase. That is an oust ("a Methuselah with no pool is ousted"), but nothing ousted it: it
  played on at 0 until a bleed took it below 0. On the sim's 240-match baseline this happened to 35 bots in 33 matches. Now the
  master, equipment and fetch choices leave at least 1 pool, as ally recruiting and political actions already did.
- **The bot ousts itself at once if its own turn leaves it at 0 pool** — after its master phase, or before a minion's next
  action. It says the oust line, sends `bounty`, and passes; a master-phase oust skips the minion phase, the way an
  unlock-phase oust already did (v0.6.202).

At a human table this shows only when a bot is at 1–2 pool: it holds the master it used to pay its last pool for.

## 2. A note on the bridge, nothing to do
In the sim's traces (the hotseat bridge of `bot/`'s client copy, v2.6.162) nothing ousted a bot seat at 0 pool: the bot has to
oust itself, while the other bots' no-server net (v0.6.147) reads a published pool of 0 as out at once. Before this fix the two
disagreed for the rest of the bot's turn — the other bots had counted it out while it kept acting. Both of the bot's new checks
test `!this.out` first, so an oust that arrives some other way is not repeated.
