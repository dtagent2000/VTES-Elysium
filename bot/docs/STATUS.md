# STATUS — Elysium Bots (rewritten at every release; 19 November 2026)

**Bot v0.6.234** (18 Nov 2026, V5 wave 6b) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.9.11, curated 213
· hotseat tool v1.4.1 · coverage tool v1.1.51 · card ledger v1.2.0 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py`
v1.1.3 · built against client v2.6.175, gated on 19 Nov against client v2.6.176 / srv-2.6.51 (the root's release);
the read-only copies in bot/ are client v2.6.175 / protocol v2.6.175 / srv-2.6.51 and main's canary v1.3.0.

**Deploy state:** `main` carries v0.6.234 (#81) and the V5 sweep's method (#82). **Open PR:** the sweep's step A1 (no bot
change): the library table in `CARDS.md`, the sharing register.

## Last gates (v0.6.234 release bytes, 18 Nov 2026)
Suite **2606/0 ×3** (`elysium-bot.js` `4a1342b4`, `test-bot-logic.js` `7dcc71ff`, `elysium-cardfx.json` `721c74ee`) · section
179 11/0 (0/11 on v0.6.233) · `test-cardfx` 361/0 · canary **171/0** ×2 · hotseat 12/0 · HB1 11/11 · main's
client suite 371/1 (the guide's embed) · the sim against v0.6.233: the 240 DIVERGED 46, SAME-PLAY 25, IDENTICAL
169 (its 71 District matches; VP each within one SE); `ana-gates.py` PASS on every run; the arena smoke 7/7.
19 Nov, the same bytes beside main's v2.6.176: suite 2606/0 (one run) · canary 171/0 ×2 (main's v1.4.0 231/0) · hotseat 12/0
with either client · `test-cardfx` 392/0 (A1's register gate).

## What v0.6.234 did
V5 wave 6b (D-124; spec-v5-wave6 §9): Shadow Cloak [OBL] (and Sleep Unseen) after a successful action when a rush it stops is
coming — on the vampire, every bot's rush and rescue skipping a cloak the actor cannot pierce, burned at its controller's unlock;
Absolute Tyranny [POT][PRE]'s −1 vote for each voting vampire off the Path of Power and the Inner Voice, cut in the caller's count,
played by the caller and as a voter's reaction. A rider: a voter's card now goes before its title votes (District's +3 was lost at
a bot caller in all 83 of its plays in v0.6.233's 240).

## Next
1. The V5 sweep (D-125, `specs/spec-card-sweep-2026-11-18.md`): step A2 (the review sheet, the dry run, the merge
   design; O-45 first), then B, the pilot (Banu Haqim).
2. Main's reply of 19 Nov (below): a round of its own.
3. The window opened after its line; the fizzle misread (BOARD); Q4; C5; C6; the abstract model.

## Not yet consumed from main
`REPLY-to-bot-2026-11-19-v0.6.234.md` (client v2.6.176): nothing of v0.6.230–234 is owed by main. Ours: the read-only copies
(client and protocol v2.6.176, canary v1.4.0); its three calls (a cached page's target `kind`, no line when a human's Sudden
Reversal cancels our master, a card target on a bleed line); its deploy note; the five handoffs to history. Queued at main:
`hotBridge.toBot`.

## Known, not built
A contested block's verdict between bots waits for the actor's clock · `askHumansTotal` off (the human harness) · 5b's and 6's
riders (spec-v5-wave5 §12.10, spec-v5-wave6 §8–§9) · the BOARD.
