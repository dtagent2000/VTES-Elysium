# Elysium Bots — delivery 26 September 2026 (d): bot v0.6.179 → **v0.6.180** (the invariant flags traced) — DEPLOY CANDIDATE

**Result.** Flags fell from about 28 per match to **1 in 3 matches**. In serie-inv16 the handshake matched 106/106 and the opponent names 98/98. **Every cause we traced was a gap in the checker or the typing. The bot's own bookkeeping was right in every case.**

**Strike vs taken — what the checker missed:**
- the opponent's dodge and combat ends
- the bot's own prevent line (`X plays CARD: prevents N damage.`)
- an equipment prevent coming from the opponent's seat
- it compared against the same vampire's next combat; the check now runs only during the current combat

**Pool ledger — what was misread or missing:**
- A crypt draw was read as 4 pool. It costs 4 transfers + 1 pool.
- A note's speaker prefix is now stripped for any seat.
- Ten more pool lines are typed.
- Four **silent** pool changes had no table line: a political action's pool cost at announce, an ally recruit's cost, a blocked action's returned cost, and the bot's own referendum swing. They now enter the ledger straight from the code.

**Dev tool:** `ELY_POOL_TRACE=1` records every change to the bot's pool together with the code line that made it.

**Question for Johan:** those four silent changes are invisible to a human at the table as well. Should the bot print a short line for each, e.g. `pays 1 pool for X`?

**Gates:** suite 1731/0 ×3 (tests 127v) · canary 57/0 · hotseat 10/0 · no change in play.

**Deploy:** `elysium-bot.js` (v0.6.180).

**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md` · `ana-inv.py`
