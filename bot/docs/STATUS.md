# STATUS — Elysium Bots (rewritten at every release; 19 November 2026)

**Bot v0.6.234** (18 Nov 2026, V5 wave 6b) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.9.11, curated 213
· hotseat tool v1.4.1 · coverage tool v1.1.51 · card ledger v1.2.1 · review sheet v1.0.0 · precon generator v1.1.1 ·
`krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.3 · built against client v2.6.175, gated on 19 Nov against
client v2.6.177 / srv-2.6.51 (the root's release); the read-only
copies in bot/ are client v2.6.177 / protocol v2.6.177 / srv-2.6.51 and main's canary v1.5.0.

**Deploy state:** `main` carries v0.6.234 (#81), the sweep's method (#82) and step A1 (#84). **Open PRs:** main's replies of
19 Nov consumed (#86); the sweep's step A2 (on #86; no bot change).

## Last gates (v0.6.234's bytes)
18 Nov: suite **2606/0 ×3** (`elysium-bot.js` `4a1342b4`, `test-bot-logic.js` `7dcc71ff`, `elysium-cardfx.json` `721c74ee`) ·
`test-cardfx` 361/0 · canary 171/0 ×2 · hotseat 12/0 · HB1 11/11 · main's client suite 371/1 (the guide's embed) · the 240
against v0.6.233 DIVERGED 46, SAME-PLAY 25, IDENTICAL 169; `ana-gates.py` PASS; the arena smoke 7/7.
19 Nov, v2.6.177's table: suite 2606/0 · canary 235/0 ×2 · hotseat 12/0 · HB1 11/0 · `test-cardfx` 396/0 · the 240 against
v2.6.175's table DIVERGED 4, SAME-PLAY 206, SAME-PLAY* 30; `ana-gates.py` PASS. A2: the review sheet's self-test 19/0 · the
suite 2606/0 (one run, frozen) · `test-cardfx` 396/0 · canary 235/0 ×2 · hotseat 12/0 · the lint 0.

## Next
1. **The finished decks' round** (BOARD; spec-card-sweep §4.3): nine rules faults live in the seven decks, a release before B.
2. The V5 sweep: **B**, the pilot (Banu Haqim), the merge built first on Johan's "kör" on §4.4; then **C**, the harvest.
3. BOARD read top to bottom: a proposal per line for Johan.
4. The fizzle misread; Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing (`docs/handoffs/HANDOFF-to-main-2026-11-19-queued-bridge.md`). Asked of main: the canary's five cardfx checks skip
loudly, with the token `SKIPPED`.
