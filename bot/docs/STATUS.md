# STATUS — Elysium Bots (rewritten at every release; 14 November 2026)

**Bot v0.6.223** (14 Nov 2026, round A: the table runs) · arena v1.4.10 · sim table v1.1.0 · cardfx compiler v1.9.8, curated
187 · hotseat tool v1.4.1 · coverage tool v1.1.45 · card ledger v1.1.2 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 ·
`ana-gates.py` v1.1.1 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it);
the read-only copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.222 (#67). **Open PRs:** round A (this release); B (the Jack burn) and C (a human's Grand
Ball) stacked on it — merge in that order.

## Last gates (v0.6.223 release bytes `206bf3b9`, 14 Nov 2026)
Suite **2450/0 ×3** (frozen snapshots) · canary **143/0** ×2 · hotseat **11/0** · main's client suite 361/2 (the handoffs' two) ·
`check-versions.js` agrees · arena smoke PASS 7/7 · sim against v0.6.222 (version set back): the 240, the V5 smoke and the 600
IDENTICAL · `ana-gates.py` PASS · the table runs: online 9 × PASS 7/7, offline PASS 6/6.

## What v0.6.223 did
The table runs (D-112, v0.6.222's unsure list): nine online matches at the client pace and ten offline on the real clock, counted
with `ana-rare.py` — no superseded combat, held turn, actor's-word rush, fizzle or resolution at an ousted seat occurred; the
offline table drops a bot's Pass in 50 of 53 bleed-modifier windows (BOARD), online none. Toreador's guide check: 17 points,
3 findings, 8 proposals for "kör". The riders: a human's chat stealth in a locked blocker's route beat, the directed actions and a
referendum's parts at a seat ousted in their window. Tools: `ana-windows.py` v1.1 (the pace), arena v1.4.9–10 (paced seat
picks, a shared port).

## Next (Johan's order of 13 Nov 21:45)
1. B: the Jack burn (D-114, its spec). C: a human's Grand Ball and the `memo` descriptor (D-113 (3)–(4)); a human table after it.
2. Toreador's eight proposals (Johan's "kör" each); the hotseat's dropped Pass; V5 wave 5 (D-107); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's to v0.6.223's handoffs).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · the hotseat drops a bot's Pass in the modifier window · the rest is on the BOARD.
