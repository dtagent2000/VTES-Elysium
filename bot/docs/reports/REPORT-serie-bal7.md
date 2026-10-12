# serie-bal7 — the spare bounce (v0.6.145) — report (21 Sep 2026)

Balanced design, seeds 9951–9962, all shark. Baselines serie-bal6 (v0.6.144, 'never on a total of 1') and serie-bal5 (v0.6.143, bounce at the announce). 12 of 12 last-standing, 0 timeouts, 0 server-err,
median 8 rounds. Price referee: 78 cards, MISMATCH 0.

| deck | wins bal5 / bal6 / **bal7** | VP bal5 / bal6 / **bal7** | bleed pool dealt bal5 / bal6 / **bal7** |
|---|---|---|---|
| malkavian | 7 / 9 / **4** | 30 / 33 / **21** | 191 / 218 / **198** |
| ventrue | 3 / 2 / **5** | 9 / 12 / **17** | 83 / 57 / **70** |
| tremere | 1 / 0 / **3** | 7 / 1 / **10** | 92 / 68 / **113** |
| nosferatu | 1 / 1 / **0** | 2 / 2 / **0** | 32 / 52 / **41** |

| # | Prediction | Observed | Verdict |
|---|---|---|---|
| M1 | bounces played rise back above 35 | **37** (bal6 18, bal5 53): ventrue 15, malkavian 14, tremere 8 | HELD |
| M2 | `bounce-spare` >= 12; `bounce-kept` < 15 | spare 11 · kept 14 | spare one short; kept HELD |
| M3 | bounces on a total of 4+ still occur (>= 2) | **10** — eight 4s, a **5** and a **6** | HELD — Johan's 'a 6 bleed sent on' has now happened |
| M4 | malkavian's VP per match below 2.75, still first or second | **1.75**; first on VP (21), second on wins (4 to ventrue's 5) | HELD |
| M5 | tremere more than 1 VP | 10 VP, 3 wins | HELD |
| M6 | 0 timeouts, median rounds <= 9, MISMATCH 0 | 0 · 8 · 0 | HELD |

## Reading
1. **The timing of Johan's doctrine + a threshold scaled to the hand is the best defence yet.** The bounce lands on the total (26 `bounce-total`, ten of them on 4–6), a small bleed is sent on when a bounce can be spared (11), the last one
   is kept (14), a front-heavy bleed gets its block attempt first (`draw-stealth` 31), a stealth bleeder's bleed of 1 is clogged (80).
2. **The table is the most even it has been:** ventrue 5 wins, malkavian 4, tremere 3. malkavian is still the top scorer (21 VP, 198 pool dealt, a block answered with stealth 95 of 115) — a real stealth bleeder — but no longer runs away with it.
3. **Nosferatu: 0 VP.** Its offence remains the soft spot (41 pool dealt in 12 matches); nothing in this release was meant to change that.
4. One series; the moves that matter are large (bounces 18 → 37; malkavian VP 33 → 21; tremere 1 → 10) and all in the predicted direction.

## Verdict
Keep v0.6.145. **Johan has not ruled on the spare-bounce threshold itself** (my synthesis of his timing with the old 'save the last bounce'); this series is the material for that ruling.
