# Elysium Bots — delivery 22 September 2026 (f): bot v0.6.158 → **v0.6.159** + the complete combat read — DEPLOY CANDIDATE

- **v0.6.159 THE CONTINUED-ROUND RACE:** round 2+ waits two strike windows (`_strikeWaitMs`), fixing the phantom "opp-silent" rounds found in serie-cmb4. Suite 1651/0, canary 37/0 vs client v2.6.125, hotseat gate 10/0. serie-cmb5: handshake 342/343.
- **`REPORT-combat-komplett.md`** — all six series (cmb1 → cmb5) on the same seeds: every ruling verified; open: Tremere weaker four series in a row (next experiment: `combatMind=0` on the Tremere seat only), Malkavian's race dominance, Nosferatu's missing maneuver.
- New tool `ana-combat-sum.py`; `ana-combat2.py` match window widened.

**Deploy:** `elysium-bot.js` (v0.6.159) to main. Rollback: `combatMind: 0`.
**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `ana-combat2.py` · `elysium-bot-CHANGELOG.md` · `elysium-bot-session-journal.md` · `CLAUDE.md`
**Add:** `REPORT-combat-komplett.md` · `REPORT-combat-series-table.txt` · `ana-combat-sum.py` · this file
