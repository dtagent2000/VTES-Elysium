# Elysium Bots — delivery 23 September 2026 (a): bot v0.6.160 → **v0.6.161 THE CHASE PRESS** — DEPLOY CANDIDATE

**Cumulative on top of 22g.** From Johan's review of the bots against Black Chantry's V5 strategy guides (Nosferatu, Tremere, Malkavian help sheets).

- **Built:** a chase-posture deck (Nosferatu) presses to continue when the opponent maneuvered to long (the guide: burn an Underbridge Stray life in the press step) — `_wantPress` tag `chase-wave`, only when it survives the opponent's shown return. Test 127h. Suite **1658/0 ×3**, canary **37/0** vs client v2.6.125, hotseat gate **10/0**.
- **serie-cmb7:** the chase press fired once in 12 matches (next round close, 2 damage) — rare by nature (needs the Stray in play AND a wave). Handshake 374/377.
- **Noise warning** (`REPORT-combat-komplett.md` §7): two near-identical series swung Malkavian 18 → 30 and Ventrue 17 → 6 VP. Deck-level W/VP at n = 12 is ±12 VP; the one-seat experiments are direction-only. Mechanism counts (per round) are the stable readings.
- **Deferred by Johan to the knowledge / meta layer:** the block doctrine's "do not block Nosferatu / Tremere unless you must", and a dynamic Tremere Apportation choice (maneuver when combat is expected, press against pacifist decks). Nosferatu's Grapple vs combat-ends: covered by the damage rule where it matters. **Open:** narrowing Malkavian's wave to the guide's two cases (0 blood, or a Nosferatu that cannot press).

**Deploy:** `elysium-bot.js` (v0.6.161) to main. Rollback: `combatMind: 0`.
**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `REPORT-combat-komplett.md` · `elysium-bot-CHANGELOG.md` · `elysium-bot-session-journal.md` · `elysium-bot-learnings.md` · `CLAUDE.md`
