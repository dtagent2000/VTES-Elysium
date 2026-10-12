# Elysium Bots — delivery 22 September 2026 (e): bot v0.6.157 → **v0.6.158 SEIZE THE MOMENT** — DEPLOY CANDIDATE

**Cumulative on top of 22d.** Johan's ruling: a torpor-certain rush trumps permanents-first when it is likely to go through.

- A rush is picked at **97** (above the permFirst gate, below the 99+ structural picks) when its damage exceeds the target's blood in one round, or over two with Immortal Grapple behind a damage source, AND the target's controller has no OTHER unlocked ready vampire or ally (`_rushLikelyThrough`). Never with a rusher at 0 blood. Behind `combatMind`.
- **Gates:** suite **1649/0 ×3** (section 127) · canary **37/0** vs client v2.6.125 · hotseat gate **10/0**. BOT_VERSION line trimmed to the 4 kB rule (82c); full notes in the CHANGELOG.
- **serie-cmb4** (seeds 9981–9992): Nosferatu rushed **7** times (cmb3 1, cmb2b 4), **6 through**; "seize the moment" decided 3, all through; permFirst decided 2 of 12 rush situations (cmb3: 7 of 13). Handshake 337/344 (98 %). Nosferatu 0 VP at n = 12.

## Deploy
`elysium-bot.js` (v0.6.158) to main. Rollback: `combatMind: 0` (the handshake fix stays).

## Replace
`elysium-bot.js` · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `elysium-bot-session-journal.md` · `elysium-bot-project-context.md` · `CLAUDE.md`
