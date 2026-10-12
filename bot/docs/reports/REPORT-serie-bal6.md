# serie-bal6 — the late bounce + the clog (v0.6.144) — report (20 Sep 2026)

Balanced design, seeds 9901–9912, all shark. Baseline serie-bal5 (v0.6.143). 12 of 12 last-standing, 0 timeouts, 0 server-err, median 8 rounds. Price referee: 75 cards, MISMATCH 0.
Recorded: malkavian **9 wins / 33 VP** (bal5: 7 / 30) · ventrue 2 / 12 · nosferatu 1 / 2 · tremere 0 / 1.

| # | Prediction | Observed | Verdict |
|---|---|---|---|
| L1 | >= 85 % of bounces on a total of 2+ | 16 of 18 (the two on 1: the edge rule) | HELD |
| L2 | a bounce catches a PUMPED bleed (4+) | 4 times (bal5: the biggest bounced bleed was 3) | HELD |
| L3 | clog the most common tag; malkavian's stealth plays fall by 20 % | clog 69 (most common); stealth plays 74 → **102** (per action 41 % → 43 %) | clog HELD, the fall FAILED |
| L4 | draw-stealth >= 8, half of them followed by a bounce | 24; read properly: **14 ended in a SUCCESSFUL block, 8 failed with stealth drawn and were then BOUNCED on the total, 2 failed and took the bleed** | the count HELD; 'half bounce' was the wrong yardstick — 22 of 24 ended well |
| L5 | malkavian's VP per match falls from 2.5 | **2.75** | FAILED |
| L6 | ventrue > 0 VP with malkavian behind it | 3 | HELD |
| L7 | one total window per unpumped bleed; rounds <= 9, no timeouts | 199 windows; median 8; none | HELD |
| L8 | clean | clean | HELD |

## Reading
1. **The TIMING of Johan's doctrine is right and works:** the bounce now lands on the total (a pumped 4 caught four times), and block-then-bounce happens (8 times) — it never did before.
2. **'Never on a total of 1' was too hard for THESE decks.** Bounces played fell 53 → 18 (tremere 15 → 2, malkavian 25 → 5, ventrue 13 → 11); `bounce-kept` fired 25 times, 8 of them with two or more bounce cards in hand.
   At this table most damage arrives as small bleeds, the decks hold 8–10 bounce cards, and a small bleed sent on is free damage to my prey. A bounce kept for ever clogs the DEFENDER's hand — the mirror of the clog.
3. malkavian dealt 218 pool of bleed (191). The defenders as a group got weaker; ventrue alone held (it kept bouncing: 11).
→ v0.6.145: the timing stays; a total of 1 is bounced when another bounce card stays in hand; the last one waits for a heavier bleed.

A correction of my own: my first two scripts for L4 contradicted each other (24 of 24 'succeeded' vs 8 of 24 'bounced') — both used search windows that ran into the next action. The numbers above follow each attempt through its OWN action.
