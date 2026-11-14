# STATUS — Elysium Bots (rewritten at every release; 14 November 2026)

**Bot v0.6.224** (14 Nov 2026, round B: the Jack burn) · arena v1.4.11 · sim table v1.1.0 · cardfx compiler v1.9.8, curated
187 · hotseat tool v1.4.1 · coverage tool v1.1.46 · card ledger v1.1.2 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 ·
`ana-gates.py` v1.1.1 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it);
the read-only copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.222 (#67). **Open PRs:** #68 (round A); #69 (round B, this release) on it; C on #69 —
merge in that order.

## Last gates (v0.6.224 release bytes `8502f8fb`, 14 Nov 2026)
Suite **2459/0 ×3** (frozen snapshots) · canary **143/0** ×2 · test-cardfx 321/0 · hotseat **11/0** · main's client suite
361/2 (the handoffs' two) · `check-versions.js` agrees · the rigged Jack smoke PASS 7/7 · sim against v0.6.223 (version set back):
the 240 DIVERGED 51, the V5 smoke 21, the 600 165, `ana-gates.py` PASS (the fresh-deal bench: three ledger faults, BOARD).

## What v0.6.224 did
D-114: a bot burns another seat's Smiling Jack when what Jack takes from it, against what Jack takes from its prey, beats its best
other action, the most exposed bot first, and weighs a burn at its own Jack by its worth (`jackBurn`, default 1 after a no-loss
mirror bench). On in every seat, Nosferatu's paired VP on the 240 fell 0.13 and Jack's median life from 3 rounds to 1 — its
price horizon is RULINGS O-40, for Johan. First a rules correction: a bare body may block a rush or a card burn at 0 stealth.

## Next (Johan's order of 13 Nov 21:45)
1. C: a human's Grand Ball and the `memo` descriptor (D-113 (3)–(4)); a human table after it. O-40 when Johan has answered.
2. Toreador's eight proposals (Johan's "kör" each); the hotseat's dropped Pass; V5 wave 5 (D-107); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's to v0.6.224's handoffs).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · the hotseat drops a bot's Pass in the modifier window · the rest is on the BOARD.
