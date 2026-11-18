# STATUS — Elysium Bots (rewritten at every release; 17 November 2026)

**Bot v0.6.231** (17 Nov 2026, O-44: `cardWorth` split and on) · arena v1.4.14 · sim table v1.1.0 · cardfx compiler v1.9.9, curated 205
· hotseat tool v1.4.1 · coverage tool v1.1.48 · card ledger v1.1.3 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py`
v1.1.3 · built against client v2.6.175 / srv-2.6.51 (the root's release);
the read-only copies in bot/ are client v2.6.175 / protocol v2.6.175 / srv-2.6.51 and main's canary v1.3.0.

**Deploy state:** `main` carries v0.6.230 (#77, V5 wave 5a; main consumed v0.6.219–229 in #75). **Open PR:** #78, O-44's split (this release).

## Last gates (v0.6.231 release bytes, 17 Nov 2026)
Suite **2543/0 ×3** (`elysium-bot.js` `6c4add87`, `test-bot-logic.js` `09d23a0e`, `elysium-cardfx.json` `5fb8c69c`) · canary
**171/0** ×2 · sections 169 6/0, 171 4/0, 176 2/0 (169d and 176a red before) · the sim: the 240 at the new default DIVERGED 13 against
v0.6.230, every one with a Jack in play (V5 smoke: gangrel 1, pathcaine 1); `ana-gates.py` PASS on the 240 and the 14 smoke tables.

## What v0.6.231 did
O-44 answered (D-121): `cardWorth` prices only Smiling Jack's defence and the burns of Jack; its play and discard stay with the
14 July rule. The benches showed no loss (+0.00 VP; Jack played in 89 of 288 at both), so the default is 1 — O-41's answer is live.
v0.6.230 (#77): V5 wave 5a and the card-worth engine (D-119, D-120; `specs/spec-v5-wave5-2026-11-17.md`).

## Next
1. 5b: Sudden Reversal in D-107's shape A, Meditative Grove's cancel, Yawp Court, Week of Nightmares (BOARD).
2. The window opened after its line; the fizzle misread (BOARD); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Owed by main: the guide re-embed and the registry test (v0.6.219's); the Ball question's line in §12 (v0.6.225's); the new bot lines
(v0.6.228's, v0.6.230's §3); the canary's card-suffix control (v0.6.230's §4); the queued `hotBridge.toBot` (main's next round).

## Known, not built
A contested block's verdict between bots waits for the actor's clock · `askHumansTotal` off (the human harness) · the BOARD.
