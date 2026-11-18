# STATUS — Elysium Bots (rewritten at every release; 18 November 2026)

**Bot v0.6.232** (18 Nov 2026, V5 wave 5b) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.9.10, curated 208
· hotseat tool v1.4.1 · coverage tool v1.1.49 · card ledger v1.1.3 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py`
v1.1.3 · built against client v2.6.175 / srv-2.6.51 (the root's release);
the read-only copies in bot/ are client v2.6.175 / protocol v2.6.175 / srv-2.6.51 and main's canary v1.3.0.

**Deploy state:** `main` carries v0.6.231 (#78, O-44's split). **Open PR:** V5 wave 5b (this release).

## Last gates (v0.6.232 release bytes, 18 Nov 2026)
Suite **2570/0 ×3** (`elysium-bot.js` `316b4649`, `test-bot-logic.js` `85f48bcb`, `elysium-cardfx.json` `5c95a3d5`) · section
177 27/0 (0/27 on v0.6.231), 161 25/0, 163 13/0 · `test-cardfx` 349/0 · canary **171/0** ×2 · hotseat 12/0 · HB1 11/11 · main's
client suite 371/1 (the guide's embed: main re-embeds) · the sim: the 240 DIVERGED 28 against v0.6.231 (timing, the ablation: the
held master's beat 16, the clone before the beat 12), the V5 smoke DIVERGED 1–5 a table; `ana-gates.py` PASS on the 240, the 14
tables and the four firing series; the arena smoke (the real clock, `asPlayedMs` 500) PASS 7/7.

## What v0.6.232 did
V5 wave 5b (D-122; spec-v5-wave5 §12): every master a bot plays lands first and waits its beat ('as played', D-107 shape A);
Sudden Reversal cancels another Methuselah's master (bots and humans); Meditative Grove cancels a frenzy card on a Salubri; Yawp
Court fights between a political action and its referendum; Week of Nightmares (its readers, hunt, counters, end and worth).

## Next
1. The 11 cards with a discipline line and no mode (D-116 (3)); then the maneuver / press grants with the rush cards (BOARD).
2. The window opened after its line; the fizzle misread (BOARD); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Owed by main: the guide re-embed and the registry test (v0.6.219's; v0.6.232's guide again); the Ball question's line in §12
(v0.6.225's); the new bot lines (v0.6.228's, v0.6.230's §3, v0.6.232's §3); the canary's card-suffix control (v0.6.230's §4);
the queued `hotBridge.toBot` (main's next round).

## Known, not built
A contested block's verdict between bots waits for the actor's clock · `askHumansTotal` off (the human harness) · 5b's riders
(spec-v5-wave5 §12.10) · the BOARD.
