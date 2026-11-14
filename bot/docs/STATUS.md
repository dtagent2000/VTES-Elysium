# STATUS — Elysium Bots (rewritten at every release; 14 November 2026)

**Bot v0.6.225** (14 Nov 2026, round C: a human's Grand Ball) · arena v1.4.11 · sim table v1.1.0 · cardfx compiler v1.9.8, curated
187 · hotseat tool v1.4.1 · coverage tool v1.1.46 · card ledger v1.1.2 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 ·
`ana-gates.py` v1.1.1 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it);
the read-only copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.222 (#67). **Open PRs:** #68 (round A); #69 (round B) on it; round C (this release) on
#69 — merge in that order.

## Last gates (v0.6.225 release bytes `091e8cd8`, 14 Nov 2026)
Suite **2475/0 ×3** (frozen snapshots) · canary **143/0** ×2 · test-cardfx 321/0 · hotseat **11/0** · HB1 11/0 · main's client
suite 361/2 (the handoffs' two) · `check-versions.js` agrees · arena smoke PASS 7/7 · sim against v0.6.224 (version set back): the
240, the V5 smoke and the 600 IDENTICAL, `ana-gates.py` PASS · three human tables in main's rig (CHANGELOG).

## What v0.6.225 did
D-113 (3)–(4): every bot reads a human's Toreador Grand Ball — the locked one, then the free one from the play line's pair, a token
or the only candidate — and, still open, the speaker asks once in chat; the answer is every bot's memory, and only the free one's
non-bleed actions go unblocked. The cardfx `memo` descriptor carries the card's roles and question. Three human tables in main's
play-test rig: the pair read, the question with its answer, and the reading on the board after the Phase line held.

## Next (Johan's order of 13 Nov 21:45)
1. O-40 (Jack's price) when Johan has answered; Toreador's eight proposals (Johan's "kör" each).
2. The hotseat's dropped Pass; V5 wave 5 (D-107); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's to v0.6.225's handoffs); the Grand Ball
question's line in §12 (v0.6.225's handoff).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · the hotseat drops a bot's Pass in the modifier window · the rest is on the BOARD.
