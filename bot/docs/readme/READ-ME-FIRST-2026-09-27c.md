# Elysium Bots — delivery 27 September 2026 (c): bot v0.6.186 → **v0.6.187 THE KNOWLEDGE LAYER, brick 1** + arena v1.4.4 — DEPLOY CANDIDATE (knob off by default)

**What it is.** From KRCG's TWDA export (4,538 decks) and cardfx, `twd-profile.py` writes `elysium-twd-profile.json`: for each library card, the mean shares of combat, stealth, intercept and bounce in the decks that hold it, and the same per clan. The bot turns a seat's crypt clan and the library cards it has shown into an expectation of what that seat's deck is (`_twdExpect`). Public evidence only.

**What it changes, with `twdKnow: 1`:**
- The combat danger of a seat starts from the TWDA expectation instead of the board alone; observations take over as they accumulate.
- A Tremere sniper facing a pacifist seat stays close for Theft + press + Theft instead of maneuvering (Johan's deferred question; the guide's rule).

**Default is off (`twdKnow: 0`).** The bench decides: arm `twd` (knob on the variant seat, 48 matches, every seat) against the negative control. It is running; the result goes into `REPORT-bench-controls.md` when complete.

**Gates:** suite 1742/0 ×3 (tests 127x) · canary 57/0 · hotseat 10/0. The profile is parsed once per process (a per-instance parse ran the suite out of heap during the build — fixed).

**Deploy:** `elysium-bot.js` (v0.6.187) and `elysium-twd-profile.json` beside it (also in the hotseat bundle, or passed as `twdProfile`). Without the file, `twdKnow` does nothing.

**Replace:** `elysium-bot.js` · `elysium-bot-arena.js` (v1.4.4) · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`
**Add:** `elysium-twd-profile.json` · `twd-profile.py` · this file
