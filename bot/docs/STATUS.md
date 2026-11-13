# STATUS — Elysium Bots (rewritten at every release; 12 November 2026)

**Bot v0.6.219** (12 Nov 2026, crypt wave A) · arena v1.4.8 · sim table v1.1.0 (round C3) · cardfx compiler v1.9.8, curated 187 · hotseat tool v1.4.0 ·
coverage tool v1.1.45 · precon generator v1.1.1 · KRCG converter `krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.0 ·
built against the root's release, client v2.6.174 / srv-2.6.50 (our canary 69/0 against it; main's v1.2.0 143/0 beside this bot);
the read-only copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS).

**Deploy state:** `main` carries v0.6.218 (#61), client v2.6.173 and v2.6.174 (main's #60, #62) and main's doc-budget note (#63).
**Open PR:** #64 (crypt wave A, v0.6.219).

## Last gates (v0.6.219 release bytes, 12 Nov 2026)
Suite **2411/0 ×3** (alone, frozen snapshots, `--max-old-space-size=4096`) · lint 0 findings on 25 files, nothing suppressed ·
canary **69/0** ×2 (bot/'s copies; the root's release) · hotseat **11/0** · HB1 **11/11** · test-cardfx **321/0** ·
`gen-precon.js --check` no problems · main's `check-versions.js` agrees · main's client suite 361/2 (by design: the handoff) ·
sim vs v0.6.218: the 240-match client design IDENTICAL 237, SAME-PLAY 3 (the checker's Wider View flags gone; version
normalized); the V5 smoke diverged in 50 of 168 matches; Toreador on 600 fresh deals 0.83 VP, +0.18 paired · `ana-gates.py`
PASS on every series (CHANGELOG).

## What v0.6.219 did (the latest release; older ones in the CHANGELOG)
Crypt wave A (D-108): 31 vampires' printed abilities — the bleed, strength, intercept, stealth, vote and dodge forms (25 copies
modelled, 13 partial) — and the graded readings' three fixes; Toreador in the menu; doc-budget warns, not fails, outside pull
requests when main has released (main's note of 12 Nov); the pool checker's Wider View count and `ana-gates.py` v1.1.0 (D-111).

## Next (proposed; Johan orders the board)
1. V5 wave 5 — Johan picks its shape: the eighteen masters in play, Meditative Grove's cancel, Sudden Reversal's window (D-107).
2. The copies round (main's canary v1.2.0, Q4) with crypt wave A's riders; then crypt wave B, the 13 partial copies first.
3. C5 (the leak test) before crypt wave B; C6; the knowledge layer's Kevlar and the prey's wakes (65f); the abstract model spec.

## Not yet consumed from main
Main's replies of 11 Nov (security, v0.6.218 with canary v1.2.0) are read: their bot-side items are BOARD lines (the copies, a
human's Change of Target, the security plan's item 6); item 5 is answered in the handoff (our client masks every frame). Owed by
main: v0.6.219's guide re-embed and the registry test (`HANDOFF-to-main-2026-11-12-v0_6_219.md`).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · a failed blocker fights the later blocker's combat and can spend a strike card (3 in 840 five-seat matches; the
Toreador report) · the rest is on the BOARD (a human's bounce and Haven Uncovered, the sim table's run-out windows, the waves'
riders, a rushed actor's maneuver wait).
