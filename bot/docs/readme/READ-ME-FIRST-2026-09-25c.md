# Elysium Bots — delivery 25 September 2026 (c): bot v0.6.174 → **v0.6.175** + cardfx (compiler v1.9.0) — DEPLOY CANDIDATE

**The full cardfx sweep** checked all 1,670 library entries (2,396 modes) against the KRCG card text, with "As above" resolved. The findings are in `REPORT-cardfx-sweep-full.md`.

- **`ranged` is new in cardfx.** The compiler tags it from VTES's R suffix or from "Strike, ranged" (109 modes). At long range the bot now uses only ranged strikes, steals and weapon strikes. Before this, 14 melee cards were offered at long range: Talbot's Chainsaw, Burning Touch, Putrefaction, Song in the Dark and others.
- **Two wrong values in the whole library**, both fixed in the curated tier. Neither card is in our decks.
  - **Legion:** stealth 2 → 1.
  - **Madman's Quill:** a spurious bleed mode was dropped.
- **Everything else the checker flagged was a limit of the checker**, not an error in cardfx.

**Gates:**

- Suite: 1717/0 ×3 (tests 127t).
- test-cardfx: 259/0.
- Canary: 57/0.
- Hotseat: 10/0.

**Deploy** `elysium-bot.js` (v0.6.175) **and** `elysium-cardfx.json`.

**Replace:**

- `elysium-bot.js`
- `elysium-cardfx.json`
- `cardfx-curated.json`
- `cardfx-compile.js` (v1.9.0)
- `test-bot-logic.js`
- `test-cardfx.js`
- `elysium-bot-CHANGELOG.md`
- `CLAUDE.md`

**Add:**

- `REPORT-cardfx-sweep-full.md`
- `sweep-full.py`
- `sweep-full-rows.csv`
- this file

**Next passes of the sweep:** crypt abilities, `req` per level beyond range, costs.
