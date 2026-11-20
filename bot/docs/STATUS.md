# STATUS — Elysium Bots (rewritten at every release; 20 November 2026)

**Bot v0.6.235** (19 Nov 2026, the finished decks' round) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.10.0, curated
213 · hotseat tool v1.4.1 · coverage tool v1.1.52 · card ledger v1.2.2 · review sheet v1.0.1 · precon generator v1.1.1 ·
`krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.3 · built against client v2.6.177, gated on 20 Nov against client v2.6.179 / srv-2.6.51 (the root's release); the read-only
copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51 and main's canary v1.5.0.

**Deploy state:** `main` carries v0.6.235 and client v2.6.179; #91 (exactness first: D-130, D-131, O-48, spec §11) and #92 (the
merge of hand entries, compiler v1.10.0, nothing opted in) merged 20 Nov. **Open PR** (no bot change): the docs round of 20 Nov
(D-132, D-133, BOARD's fold, spec §11.8–§11.9).

## Last gates (v0.6.235's bytes: `elysium-bot.js` `9ac9d52b`)
19 Nov, the release: suite **2618/0 ×3** · section 180 12/0 (0/12 on v0.6.234) · `test-cardfx` 403/0 · the 240 against v0.6.234
DIVERGED 195, SAME-PLAY 45 · `ana-gates.py` PASS on all 17 · the arena smoke 3 of 5 PASS (two misses outside the round: BOARD).
20 Nov, on client v2.6.179: suite 2618/0 (one frozen run) · canary 235/0 ×2 · hotseat 12/0 · HB1 11/0 · main's client suite
383/1 (the guide's embed) · the 240 SAME-PLAY 240 against v2.6.177's table.
20 Nov, #92 (no bot or cardfx byte): `test-cardfx` 437/0 · a scratch compile = the committed library · suite 2618/0 (one
frozen run) · canary 235/0 ×2 · the tools' self-tests, the lint, doc-budget PASS.

## Next
1. The V5 sweep: **B**, the pilot (Banu Haqim), its predictions registered before the build (D-93); the merge's first opt-in.
2. **C**, concentrated (spec §11.8, D-132): C1 the cross-check tool with `stealth` / `actStealth`, `intercept`, `bleed`; then the
   first reader's round, its design to Johan first (§11.6).
3. BOARD's read-through: Johan's answers to the docs round's proposal for each line (its PR).
4. The fizzle misread; Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing. Handed to main, unanswered (`docs/handoffs/`): the queued bridge (19 Nov; its ask: the canary's five cardfx checks skip
loudly, token `SKIPPED`), v0.6.235's bundle (19 Nov), the guide for v2.6.179 and the licence (20 Nov, D-128).
