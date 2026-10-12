# serie-home2 — the forward gear (v0.6.138) against A (the original, homeWeight=0) — report (20 Sep 2026)

Paired: balanced design, seeds 7001–7012, all shark. `ana-A-vs-C.md` = `python3 ana-home.py serie-home-ctl serie-home2`. Price referee MISMATCH 0 · 0 server-err · 0 timeouts.

| deck | home >= 1 at unlock A → now (B was) | blocks made | pool damage dealt | median oust turn | VP A → now (B) |
|---|---|---|---|---|---|
| nosferatu | 9 % → 63 % (73 %) | 67 → 83 (109) | 58 → 64 (85) | 6.5 → 7.5 | 4 → 6 (2.5) |
| tremere | 49 % → 36 % (60 %) | 78 → 49 | 106 → 106 (70) | 7.5 → 8 | 9 → 14 (7) |
| ventrue | 45 % → 34 % (54 %) | 61 → 37 | 166 → 140 (224) | 6 → 6.5 | 18 → 14 (23) |
| malkavian | 6 % → 7 % (26 %) | 44 → 31 | 131 → 111 (111) | 10 → 8 | 17 → 14 (14.5) |
Rounds: median 8.5 → 8.0 (B 10.5). Timeouts 0 (B 1).

## Predictions
| # | Prediction | Observed | Verdict |
|---|---|---|---|
| G1 | 0 timeouts, median rounds <= 10 | 0 · 8.0 | HELD — the forward gear works |
| G2 | tremere back at the original: home ±8 points, dealt ±20 % | dealt 106 = 106; home **−13 points** | dealt HELD; home outside the band — **with IDENTICAL home logic to A** (see the yardstick below) |
| G3 | nosferatu home >= 50 %, blocks >= 90, deals at least A's | 63 % · 83 · 64 vs 58 | home and damage HELD; blocks 7 short |
| G4 | malkavian under 15 %; the bounce rule fires >= 3 times | 7 % · 3 times (Deflection 1, Telepathic Misdirection 2) | HELD, just |
| G5 | unlocked-body occurs; a third of the nothing-left cases play | 3 unlocked-body + 2 de-clog of 16 = 31 % | occurs; a hair under a third |
| G6 | ventrue not below A on damage dealt | 166 → 140 (−16 %), VP 18 → 14 | FAILED — also with home logic identical to A |
| G8 | clean, MISMATCH 0 | clean | HELD |
| REGRESSION RULE (rewritten) | dealt per match −20 % AND VP not up | worst: ventrue −16 % | not triggered |
| J1 | edge raises before an oust | 0 of 36 (A: 4, B: 5) | – |

## THE YARDSTICK THIS SERIES GAVE FOR FREE
Tremere and ventrue run the SAME home-quota code here as in A (grinding decks are unpriced again; only act-again differs, and it fired for ventrue 16 times in 12 matches).
Between those two runs their home share moved 11–13 points, their blocks 24–29 fewer, ventrue's damage −16 %, tremere's VP 9 → 14. **That is what two 12-match runs of the same
logic on the same seeds and seating differ by.** Every effect smaller than that in this whole day's series is unproven — including nosferatu's VP 4 → 6 here and most of what B 'showed'
for ventrue. What stands above the noise: nosferatu's home share (9 % → 63–73 %, twice), B's timeout and 23 rounds, malkavian's 26 % in B → 7 % now, the act-again plays 0 → 3.

## Verdict
Keep v0.6.138 over v0.6.137 (the timeout class is gone, nothing regresses by the rule, nosferatu defends). Whether it is BETTER than the original on results cannot be said
from 12 matches a side. Run C (critRisk=0) is dropped: its expected effect is far under this yardstick.
