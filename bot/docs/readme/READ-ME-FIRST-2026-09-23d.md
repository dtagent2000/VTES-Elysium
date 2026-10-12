# Elysium Bots — delivery 23 September 2026 (d): bot v0.6.162 → **v0.6.163 THE BUG SWEEP** — DEPLOY CANDIDATE

**Johan asked for a bug sweep while main builds the combat controls.** Method: a two-sided LEDGER audit of the traces — everything one bot moves to another must show on both sides. New tool `ana-ledger.py` (bleed pairing, combat opponent names, dealt vs taken, steal balance, creep); CLAUDE.md gains "the ledger gate".

## Found and fixed
1. **Second Tradition's attempt line** (`X attempts to block with +N intercept (CARD).`) was never parsed — the actor fought "the previous blocker" by name (9 misnamed combats in cmb5–7). Now `L12.attemptIcp`. Wrong names: 3–9 per series → **0**.
2. **The refused strike** (the serious one): in a combat with no confirmed opponent a STALE block-attempt name could still be the expected opponent, and the true opponent's strike line was REFUSED — the round fell back to the rulebook default (1, or 0 at long) in ~4–5 % of combats since v0.6.103. Now any other vampire's combat line in my combat is accepted and names the opponent; the received strike names them too. Unnamed opponents: 11–15 → **7** per series.
3. Blockers take the actor's name from the short-term action memory (`_obs`) when the pending carried none.
4. After the opponent's combat ends (Majesty), my row records dealt 0 (it said 1).
5. Creeping Sabotage's victim leaves a `took-pooldmg` row (the burn always happened; the ledger could not see it).

## Gates (final bytes)
Suite **1668/0 ×3** (tests 127j; 46e adjusted; one run flaked 1667/1 on the in-suite arena match while a series loaded the CPU — green on re-run), canary **37/0** vs client v2.6.125, hotseat gate **10/0**.

## Verification — serie-cmb12 (seeds 9981–9992) with `ana-ledger.py`
Bleed 162 equal + 51 explained by the actor's modifiers (2 less); names right 284, **wrong 0**, null 7 (6 Nosferatu blockers vs a fist — watch item); handshake 312/313; steal 55 stolen / 46 lost (empty victims); creep 10 placed, 42 burns visible. **Watch items:** the 7 remaining unnamed rounds; `taken > dealt` 24 rows — Carrion / Murder of Crows are not yet excluded by the ledger tool, to be checked before calling it a bug.

**Deploy:** `elysium-bot.js` (v0.6.163) to main. Rollback: `combatMind: 0` (decisions only).
**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `elysium-bot-learnings.md` · `CLAUDE.md`
**Add:** `ana-ledger.py` · this file (the client spec `spec-client-combat-controls-2026-09-23.md` and the handover 23c from the previous delivery still apply).
