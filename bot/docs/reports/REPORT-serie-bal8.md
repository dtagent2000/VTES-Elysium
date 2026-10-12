# serie-bal8 — the dynamic bounce reserve (v0.6.146) — report (21 Sep 2026)

Balanced design, seeds 9981–9992, all shark. Baseline serie-bal7 (v0.6.145, fixed reserve of one). 12 of 12 last-standing, 0 timeouts, 0 server-err, median 8.5 rounds (one match of 17). Price referee: 77 cards, MISMATCH 0.
Recorded: malkavian **8 wins / 29 VP** · tremere 2 / 7 · nosferatu 2 / 6 · ventrue 0 / 6.

| # | Prediction | Observed | Verdict |
|---|---|---|---|
| D1 | the reserve varies: >= 20 % of spare / kept decisions carry a value other than 1 | **4 of 28 = 14 %** (reserve 2 ×3, reserve 0 ×1) | **FAILED** |
| D2 | bounces played within 30–50 | 33 (ventrue 15, tremere 13, malkavian 5) | HELD |
| D3 | bounces on a total of 4+ still occur (>= 4) | 5 (four 4s, one 6) | HELD |
| D4 | reserve 2+ mainly with malkavian as the predator | 1 of 3 | FAILED (n = 3) |
| D5 | no claim on results | see below | – |
| D6 | 0 timeouts, median rounds <= 9, MISMATCH 0 | 0 · 8.5 · 0 | HELD |

## Reading
1. **The dynamic reserve is almost inert.** Of its four rules only two ever fired: 'my pool is near the critical level' ×3 and 'my prey is about to fall' ×1. **The pump rule never fired**: `_pPump` needs a predator to land 3+ on 40 % of its
   bleeds AT ME, and with a prior of 25 % worth four observations that takes about three heavy hits in six — real pump rates at this table are 10–25 %. The 'rich library' rule never fired either (it also requires a calm predator AND a non-defensive position).
   The release is harmless and explainable; it is not where the leverage is. My 40 % line was a guess and a poor one.
2. **THE YARDSTICK AGAIN.** bal7 and bal8 differ by four decisions about a total of 1 — and malkavian went from 4 wins / 21 VP to 8 wins / 29 VP, ventrue from 5 wins / 17 VP to 0 wins / 6 VP. **bal7's 'most even table so far' was partly luck.**
   Pooled over the two series (24 balanced matches on near-identical logic): malkavian 12 wins / 50 VP (2.08 per match) · ventrue 5 / 23 · tremere 5 / 17 · nosferatu 2 / 6. malkavian is the top deck by a clear margin; the order below it is not established.
3. What holds across bal7 and bal8 (decision level, both series): bounces 33–37 per series (bal6: 18), bounces on a total of 4+ (10 and 5), clog ~80, draw-stealth 31–35, malkavian's blocked share 13–14 %.

## Verdict
Keep v0.6.146 (no harm, better traces). Lower the pump line only with evidence — or drop the rule. **The honest summary of the bounce track: the TIMING (v0.6.144) and the spare bounce (v0.6.145) changed behaviour by large, repeatable amounts;
the dynamic reserve (v0.6.146) did not.**
