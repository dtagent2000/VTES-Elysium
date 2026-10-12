# Elysium Bots — delivery 26 September 2026 (a): bot v0.6.175 → **v0.6.176 THE EVENT LOG (phase A)** — DEPLOY CANDIDATE

This delivery builds step 3 of the agreed order (the design doc, Part 1), in observe-only mode.

**What the event log records.** Every log and chat line becomes one typed event, the bot's own lines included. Every tally change and every turn is recorded as well. All of it goes through **one** classifier, and the events land in `this.ev`.

The event kinds:
- **Actions and blocks:** announce, attempt, stealth, intercept, verdict.
- **Combat:** strike, maneuver, range-set, press, extra-strike, env, taken, prevent.
- **Other:** card-played, resolves, tally, turn.

**Cards shown per seat** (`ev.cardsShown(seat)`) are kept for the whole match. This is the first input for the knowledge layer.

**Observe only.** No decision reads the log yet. Phase B moves the readers over, combat first, and deletes the loose fields they replace.

**Measured.**
- **Regression, 3 matches:** handshake 106/106, names 102/102, and the bleed and steal ledgers balance. The log changed nothing.
- **Untyped lines:** about 40 % of the lines are still 'other' (pool and blood moves, draws, unlocks, notes). Typing them is the next piece of work, and the conservation invariants need it.

**Gates:** suite 1723/0 ×3 (tests 127u), canary 57/0, hotseat 10/0.

**Deploy:** `elysium-bot.js` (v0.6.176).

**Replace:** `elysium-bot.js`, `test-bot-logic.js`, `elysium-bot-CHANGELOG.md`, `CLAUDE.md`.

**Next:**
1. Type the remaining 'other' lines.
2. Phase B for combat: the combat decisions read from the log.
3. The conservation invariants in real time (Part 3).
