# STATUS — Elysium Bots (rewritten at every release; 13 November 2026)

**Bot v0.6.222** (13 Nov 2026, the Jack round's follow-ups) · arena v1.4.10 · sim table v1.1.0 · cardfx compiler v1.9.8, curated
187 · hotseat tool v1.4.1 · coverage tool v1.1.45 · card ledger v1.1.2 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 ·
`ana-gates.py` v1.1.0 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it);
the read-only copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.222 (#67, merged 13 Nov). **Open PR:** none yet (round A).

## Last gates (v0.6.222 release bytes `e595f4a5`, 13 Nov 2026)
Suite **2445/0 ×3** · lint 0 · canary **143/0** ×2 · hotseat **11/0** · HB1 **11/11** · test-cardfx **321/0** · main's
`check-versions.js` agrees · main's client suite 361/2 (by design: the handoffs) · arena smoke PASS 7/7 ×2 · sim against step O:
the 240, the V5 smoke and the 600 IDENTICAL but 2 matches (a late Block!'s wake card no longer spent) · `ana-gates.py` PASS.

## What v0.6.222 did
The two bugs v0.6.221's runs found — a rushed bot that never fought a rush resolved on the actor's word, a bleed that landed at a
seat ousted in its window — and the second review's four findings: a superseded combat now stops at every await (166e: 238 waits
in 18 scenes), a turn held at game over is released when the game comes back, the blocker is named at Block! for the verdict;
then the egress review's nine (a new combat ends the old one's waits, the block route ends when its action resolved under a
beat, a vacant seat is not ousted). RULINGS D-114 (Johan's principle for burning a Smiling Jack; kör 13 Nov).

## Next (Johan's order of 13 Nov 21:45)
1. A: table runs with Toreador's guide check (D-112) and v0.6.222's two riders. B: the Jack burn (D-114, its spec).
2. C: a human's Grand Ball and the `memo` descriptor (D-113 (3)–(4)); V5 wave 5 (D-107); Q4; C5 before crypt wave B; C6; the
   abstract model spec.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's to v0.6.222's handoffs); the answer to v0.6.221's
`pass` ask (no longer blocking: the bot releases a held turn either way).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · no bot burns a Smiling Jack (D-114) · only a bleed and a pool damage fizzle at an ousted seat · the rest is on
the BOARD.
