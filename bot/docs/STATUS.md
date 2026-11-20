# STATUS — Elysium Bots (rewritten at every release; 20 November 2026)

**Bot v0.6.235** (19 Nov 2026, the finished decks' round) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.9.12, curated
213 · hotseat tool v1.4.1 · coverage tool v1.1.52 · card ledger v1.2.1 · review sheet v1.0.0 · precon generator v1.1.1 ·
`krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.3 · built against client v2.6.177, gated on 20 Nov against client v2.6.179 / srv-2.6.51 (the root's release); the read-only
copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51 and main's canary v1.5.0.

**Deploy state:** `main` carries v0.6.235 (#89) and client v2.6.179 (#88). **Open PR:** #90 (no bot change): main's
v2.6.179 consumed, the guide, RULINGS D-128 and D-129.

## Last gates (v0.6.235's bytes: `elysium-bot.js` `9ac9d52b`)
19 Nov, the release: suite **2618/0 ×3** · section 180 12/0 (0/12 on v0.6.234) · `test-cardfx` 403/0 · the 240 against v0.6.234
DIVERGED 195, SAME-PLAY 45 · `ana-gates.py` PASS on all 17 · the arena smoke 3 of 5 PASS (two misses outside the round: BOARD).
20 Nov, on client v2.6.179: suite 2618/0 (one frozen run) · canary 235/0 ×2 · hotseat 12/0 · HB1 11/0 · main's client suite
383/1 (the guide's embed) · the 240 SAME-PLAY 240 against v2.6.177's table.

## Next
1. The V5 sweep: **B**, the pilot (Banu Haqim), the merge built first (spec §4.4, D-127); then **C**, the harvest.
2. BOARD read top to bottom: a proposal per line for Johan.
3. The fizzle misread; Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing. Handed to main, unanswered (`docs/handoffs/`): the queued bridge (19 Nov; its ask: the canary's five cardfx checks skip
loudly, token `SKIPPED`), v0.6.235's bundle (19 Nov), the guide for v2.6.179 and the licence (20 Nov, D-128).
