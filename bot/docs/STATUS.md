# STATUS — Elysium Bots (rewritten at every release; 13 November 2026)

**Bot v0.6.221** (13 Nov 2026, the Jack round) · arena v1.4.8 · sim table v1.1.0 · cardfx compiler v1.9.8, curated 187 ·
hotseat tool v1.4.1 · coverage tool v1.1.45 · card ledger v1.1.2 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 ·
`ana-gates.py` v1.1.0 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it);
the read-only copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.220 (#65, merged 13 Nov). **Open PR:** #66 (the Jack round, v0.6.221).

## Last gates (v0.6.221 release bytes `0c3bd7dc`, after the egress fixes, 13 Nov 2026)
Suite **2435/0 ×3** · lint 0 · canary **143/0** ×2 · hotseat **11/0** · HB1 **11/11** · test-cardfx **321/0** · main's
`check-versions.js` agrees · main's client suite 361/2 (by design: the handoffs) · arena smoke PASS 7/7 · sim vs v0.6.220: the
240 design DIVERGED 175 (Nosferatu +0.17), the V5 smoke 118 of 168, Toreador 0.78 VP on 600 deals · `ana-gates.py` PASS everywhere.

## What v0.6.221 did
The Jack round (D-113): a bot's Smiling Jack charges every other seat (its counters reach the wire); the bot shows Toreador Grand
Ball's pair as custom tokens; the survivor's turn ends at an empty table; a failed blocker no longer fights another's combat; the
card ledger counts a master only when played.

## Next (Johan's order of 13 Nov, D-113)
1. Table runs with Toreador's guide check (D-112); then a human's Grand Ball and the `memo` descriptor (D-113 (3)–(4)).
2. V5 wave 5 (D-107); Q4's switch to the root; C5 before crypt wave B; C6; the abstract model spec. Open: RULINGS O-39.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's to v0.6.221's handoffs).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · no bot burns a Smiling Jack (O-39) · the rest is on the BOARD.
