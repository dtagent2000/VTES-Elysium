# Elysium Bots — delivery 27 September 2026 (b): bot v0.6.185 → **v0.6.186** (the knowledge layer's feed) — DEPLOY CANDIDATE

**Cards shown per seat now come from three sources:**
1. the `plays X` lines
2. the client's play clones (`fx`), deduped against a line for the same card within 3 s, so a human's play without a line still counts
3. the equip / employ / recruit lines

Discards are kept per seat as well (`ev.cardsDiscarded`). A discard shows a card of the deck.

**Found in the review:** the bot already keeps a per-opponent observation model (`this.opp[seat]`). It counts plays from the fx clones and from the ash-heap diff that never misses a play, and it tracks effect categories and the public board: vampires, clans, disciplines, equipment. The knowledge layer builds on that model for the board and categories, and on the event log for sequence and timing.

**Gates:** suite 1737/0 ×3 (tests 127u +4) · canary 57/0 · hotseat 10/0.

**Deploy:** `elysium-bot.js` (v0.6.186). **Replace:** `elysium-bot.js`, `test-bot-logic.js`, `elysium-bot-CHANGELOG.md`, `CLAUDE.md`.
