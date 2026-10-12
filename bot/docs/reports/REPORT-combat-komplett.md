# REPORT — the combat refinement, complete read (22 Sep 2026)

Six series on the SAME balanced design and seeds (9981–9992, 12 matches each, `--fixed-seats`, pool 30, expert). Raw table: `REPORT-combat-series-table.txt` (`ana-combat-sum.py`). Earlier reports: `REPORT-serie-cmb1.md`, `REPORT-serie-cmb2.md`.

| series | bytes | what changed |
|---|---|---|
| cmb1 | v0.6.155 | baseline as delivered — handshake BROKEN since v0.6.114 |
| cmb1b | v0.6.156, `combatMind=0` | handshake fixed only (the real baseline) |
| cmb2b | v0.6.156 | the combat mind (Grapple gating, bundled presses, press worth, press-to-end, range posture, long fists 0, Taste, stealth order) |
| cmb3 | v0.6.157 | + silent long = 0, the rush kit |
| cmb4 | v0.6.158 | + seize the moment (torpor-certain rush beats permanents-first) |
| cmb5 | v0.6.159 | + the continued-round race fixed |

## 1. The mechanics — all verified
| check | cmb1 | cmb1b | cmb2b | cmb3 | cmb4 | cmb5 |
|---|---|---|---|---|---|---|
| handshake (rounds matched on both sides) | n/a (broken) | 338/338 | 370/370 | 283/283 | 342/344 | **342/343** |
| Grapple with fists only (no strike card, no Crows) | 6 of 17 | 3 of 11 | 2 of 10* | 0 of 5 | 0 of 12 | **0 of 10** |
| Taste of Vitae after a card round | 4 of 12 | 3 of 11 | 12 of 14 | 7 of 7 | 9 of 11 | **9 of 9** |
| Tremere maneuvers (Apportation) | 0 | 0 | 6 | 11 | 7 | **8** |
| Malkavian waves (Swallowed as maneuver) | 0 | 0 | 11 | 6 | 9 | **6** |
| Nosferatu rushes (through / made) | 2/2 | 6/8 | 3/4 | 1/1 | 6/7 | 1/2 |

\* the two cmb2b "fists" were strength-boosted fists of 3 (checked per row) — correct by Johan's rule.

**The one real defect found in this last round (fixed, v0.6.159):** the unmatched rounds in cmb4 were a RACE, not a lost line. After a press, the side that only received it starts the next round at once, while the presser still sits out its own press window (waiting to see if it gets cancelled). With equal windows the receiver's strike wait expired exactly as the presser's strike arrived — one side ended "opp-silent", the other fought a lone extra round (twice: Ventrue's bundled Hidden Strength press vs Malkavian). `_strikeWaitMs(continued)` gives round 2+ two windows. cmb5: 342/343, `opp-silent` 1 (the Malkavian that was already down). The remaining single unmatched row and cmb4's one name mismatch (a Nosferatu logging the rush TARGET as its opponent when another vampire blocked — Ryan vs Sybren / Brock Sterling) are left as a watch item; the analyser's match window was widened 4 s → 9 s because a presser's row is legitimately written up to one press window late.

## 2. What the decks do now (per 12 matches)
| deck | W / VP cmb1b | W / VP mean of cmb2b–cmb5 (48 matches ÷ 4) | reading |
|---|---|---|---|
| malkavian | 4 / 18 | **8 / 28.6** | the wave works: 10–18 % of rounds at long, no combat cards spent, torpors do not rise |
| ventrue | 3 / 12 | 2.5 / 11.3 | unchanged shape — Majesty ends every fight it can (24 in cmb5) |
| nosferatu | 1 / 4 | 0.75 / 2.9 | plays its cards right (0 wasted Grapples, Taste only after a card round, 6 of 7 rushes through in cmb4) — and still loses the race |
| tremere | 4 / 14 | **0.75 / 5.0** | the open finding — see §3 |

n = 12 per series is inside the noise yardstick for any single series; four series in a row pointing the same way is not.

## 3. Open findings (not built — for Johan)
1. **Tremere got weaker, consistently (14 → 10, 2, 7, 1 VP).** Taken/round rose (1.09 cmb1b → 1.10 cmb5) and dealt fell (0.60 → 0.58) even with 10–17 % of rounds at long. Candidates: (a) the single Apportation now goes to the maneuver, so the Theft + press + Theft line (8 presses in cmb1b) almost never happens (1–2 per series); (b) at long its OWN fists deal 0 — before v0.6.156 it hit for 1 there against the rulebook; (c) the tables around it changed (Malkavian stronger). **Proposed next experiment:** the same seeds with `combatMind=0` on the Tremere seat only (`--seat-knob` by design line) — isolates whether the combat mind costs Tremere, and which half.
2. **Malkavian's dominance (8 wins per 12) is a race matter, not combat** — it bleeds, avoids fights and wins; the other three decks' combat gains do not slow it. A balance / block-doctrine question for later, not the combat layer.
3. **Nosferatu is structurally weak here** — the V5 starter has no maneuver, so any wave or snipe takes its Roundhouse away; its combat decisions are now correct by every measure we have.
4. **52 → ~40 rounds fought at blood ≤ 1** — a block-decision matter (blocking with empty vampires), unchanged in scope.

## 4. Where the combat layer stands
Done and measured: the handshake, Johan's Grapple / press / Taste / range / stealth / rush rulings, the silent-long default, the continued-round race. Not done: the phase routine vs humans (needs the client controls), dodge weighting (no dodge cards in the four lists), cancelling a press without a press card, before-range cards beyond the four decks, and the Tremere question above.

## 5. Addendum — the Tremere experiment (serie-cmb5t, v0.6.159, `combatMind=0` on the Tremere seat ONLY)
Same seeds and design; `run-t.sh` finds the Tremere seat per design line and passes `--knob <seat>:combatMind=0`. Everyone else keeps the combat mind.

| | Tremere W / VP | Tremere presses / maneuvers | dealt / taken per round | Malkavian W / VP |
|---|---|---|---|---|
| cmb1b (nobody has the mind) | 4 / 14 | 8 / 0 | 0.60 / 1.09 | 4 / 18 |
| **cmb5t (everyone but Tremere)** | **1 / 7** | 12 / 0 | 0.61 / 1.05 | 8 / 32 |
| cmb5 (everyone) | 0 / 1 | 2 / 8 | 0.58 / 1.10 | 7 / 28 |
| mean cmb2b–cmb5 (everyone) | 0.75 / 5.0 | 1–2 / 6–11 | ≈0.62 / 1.03 | 8 / 28.6 |

**Reading.** Most of Tremere's drop is the TABLE, not its own combat: with its own v0.6.155 combat untouched it still fell 14 → 7 VP while Malkavian rose 18 → 32. Tremere's own combat mind accounts for the remaining 7 → ~5 (the four-series mean; cmb5's 1 VP is the low tail) — inside the noise, but with a visible mechanism: its presses fall from 8–12 to 1–2 because the single Apportation now goes to the maneuver. Per-round dealt/taken barely move either way (≈0.6 / ≈1.05–1.10).

**What that means for Johan's rulings:** the Tremere rule ("mostly maneuver, press with more Thefts or the .44") is not what is costing the deck — the round-by-round numbers are flat. The open question moves to the table: why Malkavian got stronger (18 → 28–32 VP) once the combat handshake and the combat mind reached everyone. Candidates: Malkavian's own wave (fights it avoids), the Nosferatu/Ventrue/Tremere fights it no longer takes blood from, or simply that its prey (often Tremere) now bleeds less because it hunts more (Tremere hunts 10 → 21–24 per 12 matches, plain bleeds through 52 → 33). Next experiment if wanted: the same seeds with `combatMind=0` on the MALKAVIAN seat only.

## 6. Addendum 2 — THE STEAL BUG and the Malkavian experiment (v0.6.160)
**Found by Johan's question "how is Theft counted?":** the victim side of Steal Blood was never built. Since v0.6.19 (July) a Tremere bot gained the stolen blood, its frozen strike line correctly said "for 0" (not damage) — and the opposing bot read that 0 and lost NOTHING. Every Theft of Vitae against a bot created blood from nowhere, in every series. v0.6.160 has the victim read the stealer's note and lose min(N, blood) (not damage — no torpor from it alone); the round row carries `stole` / `stolenFromMe`, printed as their own columns (a steal is a blood swing, never counted in dealt).

**serie-cmb6 (v0.6.160, everyone on) vs cmb5 (v0.6.159), 12 matches:**
| | cmb5 | cmb6 |
|---|---|---|
| tremere W / VP | 0 / 1 | **3 / 12** |
| malkavian W / VP | 7 / 28 | 5 / 18 |
| ventrue W / VP | 4 / 15 | 4 / 17 |
| nosferatu W / VP | 1 / 4 | 0 / 1 |
| blood stolen by Tremere / lost by the victims | — | 54 / 50 (the rest overflowed a victim's empty vampire) |
| hunts malkavian / nosferatu / ventrue | 25 / 9 / 21 | 37 / 23 / 38 |
The victims now pay for Theft with hunts — actions taken from their bleed. The table is the most balanced it has been in any series (three decks at 12–18 VP).

**serie-cmb6m (v0.6.160, `combatMind=0` on the MALKAVIAN seat only) — 9 of 12 matches** (the detached chain died at the turn boundary; compared on the same 9 design lines):
| same 9 lines | malkavian W / VP | tremere W / VP | ventrue W / VP | nosferatu W / VP |
|---|---|---|---|---|
| cmb6 (Malkavian with the combat mind) | 3 / 13 | 3 / 12 | 3 / 10 | 0 / 1 |
| cmb6m (Malkavian without) | **5 / 21** | 0 / 1 | 3 / 11 | 1 / 3 |
**Reading:** the hypothesis from §5 — that Malkavian's own wave made it dominant — is REFUTED: without its combat mind it is at least as strong (n = 9, direction only). Without it Swallowed by the Night is spent as stealth (12 times) instead of kept for the maneuver (9 maneuvers in cmb6), and Malkavian fights fewer rounds as a bleeder. Weak signal that for THIS list the stealth is worth more than the wave; Johan's ruling (spend other +1 stealth first, keep Swallowed for the wave) stands until a larger sample says otherwise. Tremere's collapse in cmb6m (12 → 1) says Tremere's result depends heavily on who it meets — more Malkavian bleed through means more Tremere hunting.

**Where §5 now stands:** Tremere's drop in cmb2b–cmb5 was mostly the steal bug (its fights cost it blood while its victims never paid back) plus the table; the combat mind itself is not what cost it.

## 7. Addendum 3 — the chase press (v0.6.161) and a noise warning
**serie-cmb7 (v0.6.161) vs cmb6 (v0.6.160), same seeds:** the chase press (`stray:chase-wave`) fired **once** in 12 matches — the next round was at close and the Nosferatu dealt 2. It is rare because two things must coincide: the Stray in play AND the opponent waving (Nosferatu fought only 3 % of its rounds at long). Nosferatu's other Stray presses: torpor-shot 5, card round 2, Crows 2. Handshake 374/377.

**The noise warning:** between cmb6 and cmb7 the code differs by one rule that fired once — yet Malkavian went 18 → 30 VP and Ventrue 17 → 6. That is the butterfly effect of 12 matches: one different decision early changes every later draw and seat. The per-deck W/VP swing between two near-identical series is therefore about ±12 VP. **Consequence for §5–§6:** the one-seat experiments (cmb5t Tremere, cmb6m Malkavian) moved VP by amounts inside that band, so their table-level readings are direction-only at best; what stands firmly are the mechanism readings (presses, maneuvers, steals, hunts, handshake), which are counted per round and are stable across series. For table-level balance questions, a sample of 48+ matches per arm is the minimum before a ruling.
