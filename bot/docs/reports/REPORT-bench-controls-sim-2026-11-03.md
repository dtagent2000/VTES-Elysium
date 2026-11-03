# The mirror bench on the sim — controls (3 Nov 2026, round C3, bot v0.6.217, sim v1.1.0)

**Question:** can the bench on the sim table tell a real strength difference from noise? The arena bench of 26–27 Sep
(`REPORT-bench-controls.md`) said yes with both controls; this is the same check after the port (BOARD C3, spec-cleanup §5.6 / T6).

**Design.** `elysium-bot-sim.js --bench SPEC` puts the variant in one seat of every match and rotates it: each seating is played once
per seat position (the variant in seat 1, then 2, 3, 4). The four starter decks, `--seatings all` = 24 seatings × 4 = **96 matches**;
`--design design-balanced-serie-bal1.txt` = the arena bench's 12 balanced orders × 4 = **48**. Every match deals a seed of its own
(`--seed` + match − 1), the same in every arm, so two arms pair match by match. All seats expert, start pool 30, the client profile
(paceMs 3100, askSecs 20) under the virtual clock: a 96-match arm takes about 100 s of wall clock (the arena bench: 24 matches ≈ 40 min).

**Reads.** *Unpaired* (`ana-bench.py DIR`, also in SUMMARY.md): per match the variant seat's VP minus the table's mean, its mean and
95 % interval. *Paired* (`ana-sim-diff.py --vp CONTROL ARM`): per match the variant seat's VP in the arm minus in the control (same
seating, deal and seat), the mean with its paired SE; and the same per deck.

## Results

| arm | matches | edge (VP − table mean), 95 % | wins (expected) | paired vs its control: B − A (paired SE; 95 %) |
|---|---:|---|---:|---|
| `none` (negative control) | 96 | −0.10 ± 0.29 | 20 (24) | — |
| `knob=poolFloor=22` (crippled) | 96 | −0.75 ± 0.15 | 5 (24) | −0.65 (0.14; [−0.91, −0.38]), wins 20 → 5 |
| `persona=novice` | 96 | −0.01 ± 0.29 | 24 (24) | +0.09 (0.14; [−0.17, +0.36]) |
| `none`, the 48-match design | 48 | +0.00 ± 0.41 | 13 (12) | — |
| `knob=poolFloor=22`, the 48-match design | 48 | −0.83 ± 0.16 | 1 (12) | −0.83 (0.21; [−1.25, −0.42]), wins 13 → 1 |
| `none`, pinned to malkavian (`--bench-deck`) | 96 | +1.34 ± 0.33 | 59 (24) | — (the pinned control measures the deck) |
| `knob=poolFloor=22`, pinned to malkavian | 96 | −0.57 ± 0.21 | 10 (24) | −1.92 (0.18; [−2.27, −1.56]), wins 59 → 10 |
| `knob=twdKnow=1` over a global `--knob twdKnow=0`, 48 | 48 | +0.10 ± 0.43 | 15 (12) | (the mechanics check below) |

## Reading

- **A vs A is level.** The negative control's interval holds 0 at 96 (−0.10 ± 0.29) and at 48 (+0.00 ± 0.41). On the sim the same arm
  twice is IDENTICAL match for match (determinism), so the level check is the labelled seat's edge, not a second run.
- **A crippled seat loses.** `poolFloor=22` (the variant never spends pool below 22) loses 0.65 VP a match against its control, paired,
  the interval well below 0, and wins 5 of 96 instead of 20. The 48-match design agrees (−0.83). **The sim bench sees a real handicap.**
- **The novice persona** is not measurably weaker than expert (+0.09 ± 0.27) — the arena bench's finding again: the personas change
  behaviour more than strength.
- **Pairing narrows the comparison:** the paired 95 % interval of a difference is about ±0.27 VP at 96 matches, against ±0.33–0.41 for
  the difference of two unpaired edges; a knob that rarely fires gives many IDENTICAL matches and a smaller SE still. A strength
  claim reads the paired line.
- **The pinned bench** (`--bench-deck`, bench.sh's 6th argument) works: the pinned control is the deck's own strength (malkavian +1.34,
  the strongest starter), so a pinned arm is read only against the pinned control (−1.92 for the crippled malkavian).
- **The global knob** (bench.sh's 7th argument) is the baseline for every seat and the variant's own knob overrides it in its seat:
  the bots' manifests show twdKnow 0 in the 144 baseline seats and 1 in the 48 variant seats (0 wrong); the crippled and novice arms'
  manifests put the knob or the persona in the variant seat only (0 wrong of 768).
- **Normal mode is unchanged:** the 240-match client design on sim v1.1.0 is IDENTICAL 240 to v1.0.2 with the same bot.
- **Scale:** 96 matches ≈ 100 s. A ±0.15 VP paired interval needs about 300 matches (`--seeds 3`): five minutes, not days.

## How to run

```
node elysium-bot-sim.js --bench none --trace /tmp/b/neg                       # the negative control (96 matches)
node elysium-bot-sim.js --bench knob=KEY=VAL --trace /tmp/b/arm               # the variant under test, the same design
python3 ana-bench.py /tmp/b/neg /tmp/b/arm                                     # each arm's edge (the level check)
python3 ana-sim-diff.py --vp /tmp/b/neg /tmp/b/arm                             # the paired read: the claim
# --bench-deck DECK pins the variant (read against a pinned control); --knob k=v sets every seat's baseline;
# --design design-balanced-serie-bal1.txt is the old 48-match design; --seeds K multiplies the matches
```
