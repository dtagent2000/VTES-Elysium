# Elysium Bots — delivery 26 September 2026 (c): bot v0.6.178 → **v0.6.179 REAL-TIME INVARIANTS (observe only)** — DEPLOY CANDIDATE

Design doc Part 3. The checks read the event log while the game runs. A mismatch writes an `inv-flag` row to the trace. Nothing changes at the table. Read the flags with the new tool `ana-inv.py <serie>`.

## The two checks

1. **My pool ledger.** Every change to the bot's pool must be explained by one of its own events: a bleed taken, a cost paid, the Edge, a bounty, a referendum, Creeping Sabotage, Blood Doll, transfers, Smiling Jack or Fame. The check runs at each turn and at every printed pool value.
2. **Strike vs taken.** When my opponent writes its taken line, the damage must equal my strike that round, plus my Crows, minus what they prevented.

## What the first runs found

Most of what the first runs found was the checker's own gaps, and those are fixed. In two cases the bot was right and the ledger was wrong:

- **Superior Govern.** It adds blood from the bank; it does not cost pool.
- **A crypt draw.** It costs 4 transfers + 1 pool.

With the gaps fixed, the flags fell from about 28 to about 5 per match.

## Open (the next investigation)

- **Pool drift after bleeds.** Pool drifts of +1…+5 appear on turns where the bot took bleeds. The ledger ends up lower than the bot's pool by about the sum of those bleeds.
- **Strike vs taken.** A mismatch appears about once per match: the opponent took 0 against a strike of 1 at close range.

Either could be a typing gap or a real bookkeeping difference. Finding out which is exactly what the checker is for.

## Gates

- Suite 1730/0 ×3 (tests 127v)
- Canary 57/0
- Hotseat 10/0
- Series inv6 (3 matches): handshake 80/80, names 76/76

**Deploy:** `elysium-bot.js` (v0.6.179).

**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`

**Add:** `ana-inv.py` · this file
