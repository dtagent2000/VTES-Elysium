# STATUS — Elysium Bots (rewritten at every release; 19 November 2026)

**Bot v0.6.235** (19 Nov 2026, the finished decks' round) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.9.12, curated
213 · hotseat tool v1.4.1 · coverage tool v1.1.52 · card ledger v1.2.1 · review sheet v1.0.0 · precon generator v1.1.1 ·
`krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.3 · built and gated against client v2.6.177 / srv-2.6.51 (the root's release); the read-only
copies in bot/ are client v2.6.177 / protocol v2.6.177 / srv-2.6.51 and main's canary v1.5.0.

**Deploy state:** `main` carries v0.6.234 (#81), the sweep's method (#82) and step A1 (#84). **Open PRs:** main's replies of
19 Nov consumed (#86); the sweep's step A2 (#87, on #86; no bot change); this release (on #87); main's v2.6.178 (#88).

## Last gates (v0.6.235's bytes)
19 Nov: suite **2618/0 ×3** (frozen; `elysium-bot.js` `9ac9d52b`, `test-bot-logic.js` `f8c54f19`, `elysium-cardfx.json`
`49c143d3`) · section 180 12/0 (0/12 on v0.6.234) · `test-cardfx` 403/0 · canary 235/0 ×2 · hotseat 12/0 · HB1 11/0 · main's
client suite 380/1 (the guide's embed) · the 240 against v0.6.234 DIVERGED 195, SAME-PLAY 45 (each a mechanism of the round; VP
paired within one SE), the 16 smokes DIVERGED 6–10 of 12, the final bytes IDENTICAL to the first build's; `ana-gates.py` PASS on
all 17; the arena smoke 3 of 5 PASS (two misses outside the round: BOARD).

## Next
1. The V5 sweep: **B**, the pilot (Banu Haqim), the merge built first (spec §4.4, D-127); then **C**, the harvest (§4.3's latent
   reds and ambers and the condition sentences' untagged variants are in it).
2. Main's v2.6.178 once #88 is merged: the guide's sentence on the starting tempo (Turn-based from the start).
3. BOARD read top to bottom: a proposal per line for Johan; RULINGS O-47 (the licence's name) for Johan.
4. The fizzle misread; Q4; C5; C6; the abstract model.

## Not yet consumed from main
Main's reply of 19 Nov in #88 (`client/docs/handoffs/REPLY-to-bot-2026-11-19-turn-based-default.md`, open): the guide's tempo
sentence, after the merge. Handed to main: `docs/handoffs/HANDOFF-to-main-2026-11-19-queued-bridge.md` (#86; its ask: the
canary's five cardfx checks skip loudly, with the token `SKIPPED`) and `HANDOFF-to-main-2026-11-19-v0_6_235.md` (the bundle;
re-embed the guide).
