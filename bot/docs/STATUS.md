# STATUS — Elysium Bots (rewritten at every release; 13 November 2026)

**Bot v0.6.220** (13 Nov 2026, crypt wave A's riders) · arena v1.4.8 · sim table v1.1.0 (round C3) · cardfx compiler v1.9.8, curated 187 · hotseat tool v1.4.1 ·
coverage tool v1.1.45 · precon generator v1.1.1 · KRCG converter `krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.0 ·
built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it);
the read-only copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.219 (#64, merged 13 Nov), client v2.6.173 and v2.6.174 (main's #60, #62) and main's doc-budget note (#63).
**Open PR:** #65 (crypt wave A's riders, v0.6.220).

## Last gates (v0.6.220 release bytes, 13 Nov 2026)
Suite **2417/0 ×3** (frozen snapshots) · lint 0 findings on 25 files, nothing suppressed ·
canary v1.2.0 **143/0** ×2 (bot/'s copies; the root's release) · hotseat **11/0** · HB1 **11/11** · test-cardfx **321/0** ·
`gen-precon.js --check` no problems · main's `check-versions.js` agrees · main's client suite 361/2 (by design: the handoff) ·
sim vs v0.6.219: the 240-match design DIVERGED 68 (Nosferatu's plan; paired −0.01); the V5 smoke 67 of 168; Toreador on 600
fresh deals 0.82 VP (paired −0.01) · `ana-gates.py` PASS on 14 of 16 series — two old bugs a diverged match met (CHANGELOG).

## What v0.6.220 did (the latest release; older ones in the CHANGELOG)
Crypt wave A's riders (D-111): Revelations' form reaches the block decision; the bleed forecast and the who-stays-home planners
read the crypt; age from the capacity in play; a seeded PRNG per bot for "at random"; the random-discard line typed; the release
copies refreshed and main's canary v1.2.0 in.

## Next (Johan's order of 13 Nov, D-113)
1. The table's memory, first round: Smiling Jack's counters on the wire (`buildPub` sends none: a bot's Jack drains its owner and
   nobody pays) and the bot's own tokens, Grand Ball first (D-113 (1)–(2)).
2. Table runs with Toreador's guide check (D-112); then the Toreador points: a human's Ball (D-113 (3)–(4)), the failed blocker.
3. V5 wave 5 (Johan picks its shape, D-107); Q4's switch to the root; C5 before crypt wave B; C6; the abstract model spec.

## Not yet consumed from main
Main's replies of 11 Nov are read: their bot-side items are BOARD lines; the copies and canary v1.2.0 are in (v0.6.220).
Owed by main: the guide re-embed and the registry test (v0.6.219's and v0.6.220's handoffs).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · a failed blocker fights the later blocker's combat and can spend a strike card (3 in 840 five-seat matches; the
Toreador report) · the rest is on the BOARD.
