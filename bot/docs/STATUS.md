# STATUS — Elysium Bots (rewritten at every release; 17 November 2026)

**Bot v0.6.230** (17 Nov 2026, V5 wave 5a) · arena v1.4.14 · sim table v1.1.0 · cardfx compiler v1.9.9, curated 205
· hotseat tool v1.4.1 · coverage tool v1.1.48 · card ledger v1.1.3 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py`
v1.1.3 · built against client v2.6.175 / srv-2.6.51 (the root's release);
the read-only copies in bot/ are client v2.6.175 / protocol v2.6.175 / srv-2.6.51 and main's canary v1.3.0.

**Deploy state:** `main` carries v0.6.229 (#74; main consumed v0.6.219–229 in #75). **Open PR:** #77, V5 wave 5a (this release).

## Last gates (v0.6.230 release bytes, 17 Nov 2026)
Suite **2541/0 ×3** (`elysium-bot.js` `edf354fe`, `test-bot-logic.js` `fcc9ef37`, `elysium-cardfx.json` `5fb8c69c`) · canary
**171/0** ×2 · cardfx 341/0 · hotseat 12/0 · main's client suite 371/1 (the guide's embed: main re-embeds) · section 175 24/0, red on
v0.6.229 · the sim: the 240 IDENTICAL to v0.6.229 at `cardWorth` 0 (version, copies, timing and the new knob normalized); the V5
smoke DIVERGED 34 of 168, all at the ten tables with a wave card; `ana-gates.py` PASS on all 15 tables and one real-clock match.

## What v0.6.230 did
V5 wave 5a (D-119, D-120; `specs/spec-v5-wave5-2026-11-17.md`): the card-worth engine — a card in play is worth its flows to each
seat until the game's end (O-41 answered) — and fifteen masters that stay in play, played by their text: Tension in the Ranks,
Anarch Revolt, Frontal Assault, Forward Momentum, Privileged Position, Mob Connections, Garibaldi-Meucci Museum, Powerbase: Los
Angeles, Carver's, The Rack, The Hungry Coyote, The Coven, Piper, Día de los Muertos, Cursed Abattoir. Smiling Jack reads the
engine only behind `cardWorth` (0). `bot/`'s copies refreshed to v2.6.175; main's 15 Nov reply answered in the handoff.

## Next
1. 5b: Sudden Reversal in D-107's shape A, Meditative Grove's cancel, Yawp Court, Week of Nightmares (BOARD). Johan: O-44 (flip `cardWorth`?).
2. The window opened after its line; the fizzle misread (BOARD); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Owed by main: the guide re-embed and the registry test (v0.6.219's); the Ball question's line in §12 (v0.6.225's); the new bot lines
(v0.6.228's, v0.6.230's §3); the canary's card-suffix control (v0.6.230's §4); the queued `hotBridge.toBot` (main's next round).

## Known, not built
A contested block's verdict between bots waits for the actor's clock · `askHumansTotal` off (the human harness) · the BOARD.
