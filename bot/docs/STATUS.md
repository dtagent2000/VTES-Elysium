# STATUS — Elysium Bots (rewritten at every release; 18 November 2026)

**Bot v0.6.233** (18 Nov 2026, V5 wave 6a) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.9.11, curated 210
· hotseat tool v1.4.1 · coverage tool v1.1.50 · card ledger v1.1.3 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py`
v1.1.3 · built against client v2.6.175 / srv-2.6.51 (the root's release);
the read-only copies in bot/ are client v2.6.175 / protocol v2.6.175 / srv-2.6.51 and main's canary v1.3.0.

**Deploy state:** `main` carries v0.6.232 (#79, V5 wave 5b). **Open PR:** V5 wave 6a (this release).

## Last gates (v0.6.233 release bytes, 18 Nov 2026)
Suite **2595/0 ×3** (`elysium-bot.js` `4ca79599`, `test-bot-logic.js` `76107ccd`, `elysium-cardfx.json` `c6b88d0f`) · section
178 24/0 (2/22 on v0.6.232; the egress review's six 18/6 on the build before them), 177 27/0, 161 25/0, 163 13/0 · `test-cardfx`
357/0 · canary **171/0** ×2 · hotseat 12/0 · HB1 11/11 · main's client suite 371/1 (the guide's embed: main re-embeds) · the sim:
the 240 DIVERGED 233 against v0.6.232 (VP each within one SE) and 154 against §1's bytes (RED 1's estimates; the Eyes of Argus
double plays 44 → 0; malkavian +0.11, nosferatu −0.09, ~2.2 SE each), the V5 smoke DIVERGED 10–12 of 12 a table; `ana-gates.py`
PASS on the 240 and the 14 tables; the arena smoke PASS 7/7.

## What v0.6.233 did
V5 wave 6a (D-123; spec-v5-wave6 §8): "during an action directed at you" is read, so Eyes of Argus and The Warrens no longer
block undirected actions (568 illegal plays in v0.6.232's 240); the locked route takes Sense the Savage Way, Sentry Signal, One
With the Land (no strikes in the first round) and Deep Ecology; a card's own capacity requirement; Forced Confessional [dom]; True
Love's Face and its 1-pool counter in an 'as played' window; Night Terrors (the stealth to 0, both sides).

## Next
1. 6b: Shadow Cloak and Absolute Tyranny (spec-v5-wave6 §3); then the maneuver / press grants with the rush cards (BOARD).
2. The window opened after its line; the fizzle misread (BOARD); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Owed by main: the guide re-embed and the registry test (v0.6.219's; v0.6.232's guide again); the Ball question's line in §12
(v0.6.225's); the new bot lines (v0.6.228's, v0.6.230's §3, v0.6.232's §3, v0.6.233's §3); the canary's card-suffix control
(v0.6.230's §4); the queued `hotBridge.toBot` (main's next round).

## Known, not built
A contested block's verdict between bots waits for the actor's clock · `askHumansTotal` off (the human harness) · 5b's and 6a's
riders (spec-v5-wave5 §12.10, spec-v5-wave6 §8) · the BOARD.
