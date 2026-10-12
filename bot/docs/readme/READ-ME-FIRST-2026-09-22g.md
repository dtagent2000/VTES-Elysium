# Elysium Bots — delivery 22 September 2026 (g): bot v0.6.159 → **v0.6.160 THE VICTIM OF A STEAL** — DEPLOY CANDIDATE

- **The bug (found by Johan's question how steals are counted):** since v0.6.19 a bot victim of Theft of Vitae lost NO blood — the stealer gained it, the victim read the frozen "for 0" (correct: not damage) and nothing else. Fixed: the victim reads the stealer's note and loses min(N, blood); not damage, no torpor from it alone. Round row: `stole` / `stolenFromMe` — steal is its own column, never in dealt.
- **Gates:** suite 1654/0 ×3 (test 127g), canary 37/0 vs client v2.6.125, hotseat gate 10/0.
- **serie-cmb6:** Tremere 0/1 → 3/12, Malkavian 7/28 → 5/18; the victims hunt far more (Malkavian 25 → 37, Nosferatu 9 → 23, Ventrue 21 → 38). Most balanced table in any series.
- **serie-cmb6m** (Malkavian seat `combatMind=0`, 9 matches): Malkavian's wave is NOT why it dominated — without the combat mind it did at least as well (5/21 vs 3/13 on the same 9 lines).
- Full read: `REPORT-combat-komplett.md` §5–§6. New columns in `ana-combat-sum.py`; `run-m.sh` / `run-t.sh` = one-seat knob series.

**Deploy:** `elysium-bot.js` (v0.6.160) to main. Rollback: `combatMind: 0`.
**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `ana-combat-sum.py` · `REPORT-combat-komplett.md` · `elysium-bot-CHANGELOG.md` · `elysium-bot-learnings.md` · `CLAUDE.md`
**Add:** `run-m.sh` · `run-t.sh` · this file
