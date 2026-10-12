# The mirror bench — controls (26–27 Sep 2026, bot v0.6.185)

**Question:** can the bench tell a real strength difference from noise? A bench only counts with both controls (design Part 5, VTES-Player's rule).

**Design:** each match uses one of the 12 balanced seat orders (`serie-cmb1/design.txt`, the four starter decks). The variant seat is `((I-1)/12)%4+1`, so it rotates through all four seats every 48 matches. Seed `9100+I` is the same in every arm, start pool 30, all experts except the variant. The metric per match is the variant seat's VP minus a quarter of the table's VP, reported with a 95 % interval over matches.

```
neg: 48 matches  variant VP − table/4 = +0.14  (95 % ±0.45, [-0.31, +0.59])  variant wins 12/48 (expected 12.0)
crip: 12 matches  variant VP − table/4 = -0.81  (95 % ±0.33, [-1.14, -0.49])  variant wins 0/12 (expected 3.0)
pos: 16 matches  variant VP − table/4 = +0.25  (95 % ±0.85, [-0.60, +1.10])  variant wins 5/16 (expected 4.0)
twd: 48 matches  variant VP − table/4 = +0.21  (95 % ±0.46, [-0.25, +0.67])  variant wins 15/48 (expected 12.0)
negT: 24 matches  variant VP − table/4 = -0.62  (95 % ±0.30, [-0.93, -0.32])  variant wins 1/24 (expected 6.0)
twdT: 24 matches  variant VP − table/4 = -0.46  (95 % ±0.43, [-0.88, -0.03])  variant wins 3/24 (expected 6.0)
dyn: 48 matches  variant VP − table/4 = +0.17  (95 % ±0.44, [-0.27, +0.61])  variant wins 13/48 (expected 12.0)
dyn2: 48 matches  variant VP − table/4 = -0.12  (95 % ±0.39, [-0.52, +0.27])  variant wins 11/48 (expected 12.0)
```

## Reading

- **Negative control, A vs A:** the interval must contain 0. It does. The mean leans positive while the variant has sat only in seats 1–2; the 48-match run covers all four seats.
- **Positive control, crippled** (`poolFloor=22`, the variant never spends pool below 22): it must lose clearly. It does — no wins, and the interval lies wholly below 0. **The bench can see a real handicap.**
- **Novice persona:** not measurably weaker than expert at this sample. Personas change behaviour more than strength, the same finding VTES-Player made. Keep this in mind for the knowledge layer's personas.
- **Scale:** the interval is about ±0.7 VP at 24 matches and about ±0.5 at 48. A claim must beat that. Small tuning needs long benches: one CPU, three matches in parallel, 24 matches ≈ 40 minutes.

## Combat ends by the opposing strike (10 Oct 2026, bot v0.6.196 candidate, Ventrue pinned)

Only the Ventrue starter holds a combat-ends card (Majesty ×6), so the arm is PINNED to Ventrue's seat and read against a pinned control on the same seeds (the Tremere-pinned `negT` / `twdT` precedent). The design file was restored from the project's `design-balanced-serie-bal1.txt` (three lines checked against the old run logs: 3, 5, 10).

```
negV: 24 matches  variant VP − table/4 = -0.12  (95 % ±0.50, [-0.63, +0.38])  variant wins 5/24 (expected 6.0)
ceV: 24 matches  variant VP − table/4 = -0.11  (95 % ±0.49, [-0.60, +0.37])  variant wins 6/24 (expected 6.0)
```

**Proof the knob fired** (the `decide` rows, `q: combat-end`): `ceV` 98 decisions in 20 of 24 matches — held 68, known 9, expected 14, torpor 7; `negV` played Majesty every time it held one (49). **Reading:** no loss; the rule spends about 19 fewer Majesty cards per 24 matches for the same result. Default flipped to 1. The pre-fix traces also showed the steal bug v0.6.196 fixes: 2 `ceV` rounds where Ventrue played Majesty and still lost 2 blood to a steal.

**The mechanism series** (no variant, all four decks, seeds 9101–9112 — the same 12 seeds as the first half of the arms above; read with `ana-ledger.py`, which now pairs each steal row with its victim's row):

- `fix` (v0.6.196 before the stealer cap): **0** rounds where a vampire ended the combat or dodged and still lost blood to a steal — the victim-side fix holds. The first combat-end decision of match 1 shows the parked steal: Alice Chen at 2 blood, their strike a steal of 2 — Majesty played, nothing stolen. But the pairs: 34 equal, **8 where the stealer gained more than the victim lost**, every one a victim at 0 or 1 blood — the same share in `ceV` (11 of 57) and in the control `negV` (11 of 64): a steal from an empty vampire had created blood since v0.6.19. Fixed in v0.6.196 (`_stealAvail`).
- `fix2` (v0.6.196 final): steal pairs **34 of 34 equal**, stole 59 = stolenFromMe 59; 0 steal-symptom rounds; 69 combat-end decisions (held 52, expected 7, known 6, torpor 4); handshake 490 of 491 rounds; invariant flags at the control's level on the same seeds (32 against `negV`'s 31; strike-taken 24 against 22 — the open item since v0.6.179); 11 last-standing and 1 timeout (match 12: a 38-turn Ventrue–Malkavian endgame, the longest gap between trace rows 3.8 s — slow, not stuck).

## Calibration: the narrowed wave and the block price (11 Oct 2026, bot v0.6.197)

Johan's ruling of 28 Sep: the block doctrine and Malkavian's wave are not separate knowledge-layer bricks — both read the TWDA-fed `oppCombat`, so they are **calibration** (verify in traces; add a `press` share to the profile for the guide's narrowed wave).

**What the traces said** (72 matches on v0.6.195–196: `negV`, `ceV`, `fix`, `fix2`; 1,842 blocks, 653 Malkavian combats):
- **The wave.** Malkavian played Swallowed by the Night as a maneuver 50 times and as stealth 45 times. Two thirds of its waves were at 4+ blood against a hand strike for 1 — a stealth card for one blood. The guide's narrow use: 0 blood, or a Nosferatu that cannot press.
- **The block.** A block with an intercept card weighed odds × urgency only; the combat it buys was priced only for a BARE block. Torpor by the blocker's blood at the reaction window (the react snapshot — an inferred blood read 0-blood blockers as 1-blood ones, see learnings 11 Oct):

| actor deck (`oppCombat`) | 0 blood | 1 blood | 2 blood | 3 blood | 4+ blood |
| --- | --- | --- | --- | --- | --- |
| Nosferatu (~0.73) | 90 % (10) | 50 % (14) | 35 % (17) | 14 % (22) | 1 % (134) |
| Tremere (~0.35) | 80 % (10) | 14 % (43) | 0 % (40) | 0 % (38) | 0 % (166) |
| Ventrue (~0.33) | 95 % (21) | 11 % (37) | 2 % (65) | 0 % (68) | 0 % (304) |
| Malkavian (~0.29) | 75 % (8) | 10 % (60) | 0 % (47) | 0 % (52) | 0 % (197) |

The damage a blocker takes per combat: the hand-strike decks deal 1 (Ventrue / Malkavian: 0 in 20 %, 1 in 77 %, 2+ in 3 %), the Nosferatu starter has the tail (mean 1.65, 3+ in 22 %). Model used by `blockCost`: the combat lands 85 % of the time as 1 + Poisson(λ), λ = 2.1 × (oppCombat − 0.29); it reproduces the table (0 blood: 85 %; 1 blood vs Nosferatu: 51 %; 4+: ≤ 1.3 %).

**The wave arm** (`wvM`: `waveNarrow=1` on Malkavian's seat, 24 matches; control = the same seeds' no-knob matches of `negN` read at Malkavian's seat, `negM`):

```
wvM: 24 matches  variant VP − table/4 = +1.36  (95 % ±0.63, [+0.73, +2.00])  variant wins 14/24 (expected 6.0)
negM: 24 matches  variant VP − table/4 = +1.53  (95 % ±0.59, [+0.94, +2.13])  variant wins 15/24 (expected 6.0)
```

The rule fired 23 times — kept 11, ranged 5, torpor 5, no-press 2; Swallowed as a maneuver 15 → 7, as stealth 21 → 22; Malkavian torpors 31 → 31. **No loss → `waveNarrow` defaults to 1.** (Malkavian wins 14–15 of 24 at this table: it is the strongest starter, as before.)

**The first block arm was INERT** (`bcN` vs `negN`, 48 + 48: −0.09 ± 0.38 vs +0.20 ± 0.43): `blockCost` priced 96 blocks and vetoed none. Two reasons, both found in the arm's own rows: (1) the price never saw a LOCKED blocker — 14 of the arm's 0–1-blood blocks came through a wake, and `_pickBlocker` only looks at unlocked bodies; (2) an undirected block read "desperate" whenever my pool was low, even for a hunt (blocking a hunt saves no pool). Fixed (`_wakeRouteBlocker`; desperation only for pool damage); the 'combat-desperate' tag now means desperation overrode the price. Re-bench below.

**The block re-bench** (`bcN2` vs `negN2`, 48 + 48 on the release defaults — `waveNarrow` 1 everywhere):

```
bcN2: 48 matches  variant VP − table/4 = -0.11  (95 % ±0.43, [-0.54, +0.32])  variant wins 11/48 (expected 12.0)
negN2: 48 matches  variant VP − table/4 = +0.28  (95 % ±0.46, [-0.19, +0.74])  variant wins 15/48 (expected 12.0)
```

The price fired: 19 blocks let through (`combat-cost`), 12 where desperation overrode it, 215 priced and allowed; the variant seat's torpors 41 → 36. **Reading the gap:** −0.39 looks large, but the same seeds with the price INERT (`bcN` vs `negN`, identical decisions) gave −0.29 — the control's variant seats came out lucky twice. Paired by match: active vs inert (`bcN2` − `bcN`) = **−0.03 ± 0.43** (same sign in 40 of 48 — the arms are nearly the same games), `bcN2` − `negN2` = −0.39 ± 0.51, and the two controls `negN2` − `negN` = +0.07 ± 0.57 (the wave flip, all seats). No loss → **`blockCost` defaults to 1.** Series gates: handshake 1,870 / 1,875; steal pairs 147 + 161 equal with 6 + 4 off (the late-line race, below); `ana-block` R6 12 per 48 in every recent series, the old `negV` included (pre-existing — very likely the audit's window: an action with no through / blocked row merges two windows); invariant flags ~2 per match, the control's level.

**Open leads found on the way (not fixed):** (1) a steal line that arrives after the victim's round has moved on is parked into the next round, or dropped after the combat — 1–4 % of steals (`STOLE > VICTIM LOST` rows, round 2 or a late round 1); (2) range disagreements, 2–6 per 48 matches, every one a maneuver line missed by `_awaitOppManeuver`'s 200 ms window (5 of 6 Tremere's Apportation); (3) the R6 audit window above.

## How to run

```
for w in 0 1 2; do setsid nohup ./bench.sh ARM $w 3 48 SPEC & done   # resumable: rerun the same line after an interruption
python3 ana-bench.py ARM neg                                          # compare with the negative control
```

SPEC is `none` (A vs A), `persona=novice`, or `knob=key=val` (any whitelisted arena knob on the variant seat).
