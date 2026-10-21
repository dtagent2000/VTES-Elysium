# Elysium Bots — delivery 25 September 2026 (a): bot **v0.6.173** — DEPLOY CANDIDATE

Answers main's `REPLY-to-bot-2026-09-24-v0_6_171.md` (client v2.6.138 / srv-2.6.42). Cumulative on top of 23g (v0.6.167–171: effect lines, stale fields, extra strikes, no stealth or intercept that is not needed, stale stealth).

**Changes**
- **Tally closes:** the bot closes its own tallies (`mode: null`) when its action resolves and when its combat is over.
- **Undirected lines:** it parses `takes an undirected action.` and `attempts to rescue their own vampire from torpor.` (undirected). The old rescue line now counts as directed. Its own rescue writes the new line.
- **The steal:** one line, `strikes: steals N blood.`, labelled `Steal N`. Your panel shows "Stolen: N blood — move it". A dodge, or a first-pair combat ends, undoes the steal.

- **v0.6.173:** stealth by chat — while a bot blocks your action, type your stealth (2, or +1); with v0.6.152 (intercept by chat) the whole block exchange works from chat.

**Gates:** suite 1709/0 ×3 · canary 57/0 vs v2.6.138 · hotseat 10/0 · bot-only regression (handshake 180/180, names 166/166, 0 block-rule violations).

**Deploy:** `elysium-bot.js` beside the client and on the online bot processes. Rollback knobs: `combatPhases: 0` (phases), `combatMind: 0` (combat decisions).

**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `ana-ledger.py` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`

**Add:** this file · `ACK-to-main-2026-09-25-v0_6_172.md`
