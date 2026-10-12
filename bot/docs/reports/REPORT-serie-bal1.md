# serie-bal1 — the BALANCED 4-starter baseline: report against the registered predictions (19 Sep 2026)

Bot v0.6.133 · arena v1.3.5 · 12 matches, `--fixed-seats`, the 6 cyclic orders × 2, every predator → prey pairing 4 times, every deck starts 3
times (`design.txt`), seeds 5001–5012 · all shark · permFirst ON (Johan: keep) · polOverBuild ON. Price referee MISMATCH 0 · 0 server-err · 0 timeouts.
**This replaces serie-null4 as the deck-level baseline.**

## Result
| deck | wins | VP | VP/match | first out | ready bodies at unlock |
|---|---|---|---|---|---|
| ventrue | 4 | 17 | 1.42 | 4 | 2.03 |
| tremere | 4 | 16 | 1.33 | 1 | 2.10 |
| malkavian | 2 | 9 | 0.75 | 3 | 1.78 |
| nosferatu | 2 | 6 | 0.50 | 4 | 1.68 |

VP by deck, split by WHO PREYS ON IT (4 matches each):
| deck | pred. ventrue | pred. tremere | pred. malkavian | pred. nosferatu |
|---|---|---|---|---|
| ventrue | – | 3 | 4 | **10** |
| tremere | 4 | – | 5 | 7 |
| malkavian | 3 | 1 | – | 5 |
| nosferatu | 0 | 6 | 0 | – |

## Predictions (prediction · observed · verdict)
| # | Prediction | Observed | Verdict |
|---|---|---|---|
| B1 | ventrue wins most, 4–7 | 4 — shared with tremere | HELD (at the low edge) |
| B2 | ventrue < 2.5 VP / match | 1.42 | HELD |
| B3 | ventrue worst with malkavian as predator, best with nosferatu | best with nosferatu (10 of its 17 VP); worst with TREMERE (3), malkavian 4 | half |
| B4 | nosferatu >= 2 VP, mainly where ventrue is NOT its prey | 6 VP — but 4 of them WITH ventrue as prey | VP held, the 'where' FAILED |
| B5 | no deck at 0 VP | lowest 6 | HELD |
| B6 | the starting seat wins <= 5 | seat 1: 2 · seat 2: 3 · seat 3: 3 · seat 4: 4 | HELD — no first-player effect visible |
| B7 | clean, MISMATCH 0 | clean | HELD |

## Readings
1. **The biased seeds were most of ventrue's dominance.** Balanced: 4 wins and 1.42 VP/match, level with tremere — against 8 / 7 / 10 wins when
   nosferatu sat behind it in 8 of 12. 10 of ventrue's 17 VP here still come from the 4 matches with nosferatu as its predator.
2. **Whoever nosferatu preys on, profits.** Every deck scores best with nosferatu behind it (ventrue 10, tremere 7, malkavian 5). Nosferatu's
   offence is the table's soft spot; its defence is not the first problem (it made 70 blocks, level with tremere).
3. **Nosferatu scores 0 with ventrue OR malkavian behind it, 6 with tremere behind it.** Stealth bleed and vote damage go past its intercept;
   tremere's Govern bleeds it can block.
4. **Tremere is the quiet second:** first out once in 12, 71 pool of bleed taken (the least), 2.1 bodies. Its debt-17 paired test now has a fair baseline.
5. **Referendums on a fair table:** 35 called, 34 % blocked (12), 22 of 23 voted passed. KRC 29 (11 blocked); Parity Shift only 4.
6. **One ventrue match to look at (run 2):** no vampire until turn 3, then Chelsea Blake hunts three turns running at 'blood 1/5' and ventrue is ousted
   on turn 7 with 2 action decisions made. Opening (13c) and a possible hunt loop — not investigated.

## Not claimed
12 matches: ventrue ≈ tremere > malkavian ≈ nosferatu is the most this supports; 4 vs 4 and 2 vs 2 wins are ties. Each pairing cell is 4 matches.
