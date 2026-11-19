# STATUS — Elysium Bots (rewritten at every release; 19 November 2026)

**Bot v0.6.234** (18 Nov 2026, V5 wave 6b) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.9.11, curated 213
· hotseat tool v1.4.1 · coverage tool v1.1.51 · card ledger v1.2.1 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py`
v1.1.3 · built against client v2.6.175, gated on 19 Nov against client v2.6.177 / srv-2.6.51 (the root's release);
the read-only copies in bot/ are client v2.6.177 / protocol v2.6.177 / srv-2.6.51 and main's canary v1.5.0.

**Deploy state:** `main` carries v0.6.234 (#81), the V5 sweep's method (#82) and its step A1 (#84). **Open PR:** main's two
replies of 19 Nov consumed (the copies, the queued bridge measured on the sim; no bot change).

## Last gates (v0.6.234 release bytes, 18 Nov 2026)
Suite **2606/0 ×3** (`elysium-bot.js` `4a1342b4`, `test-bot-logic.js` `7dcc71ff`, `elysium-cardfx.json` `721c74ee`) · section
179 11/0 (0/11 on v0.6.233) · `test-cardfx` 361/0 · canary **171/0** ×2 · hotseat 12/0 · HB1 11/11 · main's
client suite 371/1 (the guide's embed) · the sim against v0.6.233: the 240 DIVERGED 46, SAME-PLAY 25, IDENTICAL
169 (its 71 District matches; VP each within one SE); `ana-gates.py` PASS on every run; the arena smoke 7/7.
19 Nov, the same bytes on v2.6.177's table: suite 2606/0 (one run) · canary 235/0 ×2 · hotseat 12/0 (and on v2.6.175 / 176) ·
HB1 11/0 · `test-cardfx` 396/0 (A1's register) · the 240 against v2.6.175's table DIVERGED 4 (read: the order a bot hears the
table in), SAME-PLAY 206, SAME-PLAY* 30; `ana-gates.py` PASS.

## What v0.6.234 did
V5 wave 6b (D-124; spec-v5-wave6 §9): Shadow Cloak [OBL] and Sleep Unseen cloak a vampire after a successful action when a rush
is coming; Absolute Tyranny [POT][PRE] cuts a vote for each voting vampire off the Path of Power and the Inner Voice. A rider: a
voter's card goes before its title votes (the CHANGELOG has the rest).

## Next
1. The V5 sweep (D-125, `specs/spec-card-sweep-2026-11-18.md`): step A2 (the review sheet, the dry run, the merge
   design; the finished decks' 41 entries first, D-126), then B, the pilot (Banu Haqim).
2. BOARD read top to bottom after A2's dry run, when what the sweep absorbs is known: a proposal per line for Johan.
3. The fizzle misread (BOARD); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing: client v2.6.176 and v2.6.177 consumed with their replies (`docs/handoffs/HANDOFF-to-main-2026-11-19-queued-bridge.md`).
Asked of main: the canary's five cardfx checks skip loudly, with the token `SKIPPED` (our CI greps it).

## Known, not built
A contested block's verdict between bots waits for the actor's clock · `askHumansTotal` off (the human harness) · 5b's and 6's
riders (spec-v5-wave5 §12.10, spec-v5-wave6 §8–§9) · the BOARD.
