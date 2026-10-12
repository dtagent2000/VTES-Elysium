# REPORT — serie-cmb2: THE COMBAT MIND measured (22 Sep 2026)

**Three series, same balanced design (6 cyclic orders × 2, `--fixed-seats`, pool 30, expert), seeds 9981–9992, 12/12 last-standing each:**

| | bytes | knob | what it isolates |
|---|---|---|---|
| **cmb1** | bot v0.6.155 | — | the state Johan's rulings were read on — handshake BROKEN (see below) |
| **cmb1b** | bot v0.6.156 | `combatMind=0` | handshake fixed, v0.6.155 decisions — the real baseline |
| **cmb2** | bot v0.6.156 (final bytes, `serie-cmb2b/`) | `combatMind=1` | handshake fixed + the combat mind |

Tools: `ana-combat.py` (play windows, pairings) and the new `ana-combat2.py` (the v0.6.156 `combat-round` rows). Gates on the final bytes: suite 1632/0 ×3, canary 37/0 vs client v2.6.125, hotseat gate 10/0, arena v1.4.3.

## 0. The regression cmb1 exposed (v0.6.114 → v0.6.155)
Since 16 Sep the bot's combat EVENT lines (press / maneuver / Immortal Grapple / Carrion Crows) went to the log tier or were deleted as "duplicates", while the opposing bot's parsers ran only on chat. No press, maneuver, Grapple or Crows reached a bot opponent for six days: a pressing bot fought round 2 alone (`opponentSilent`), Theft of Vitae stole blood from nobody, Grapple restricted nobody, ranges never moved together. **Every series since v0.6.114 (bal1–bal8, home2, null4) has a one-sided combat layer; their non-combat readings stand, their torpor / VP effects of combat do not.** The DECISION findings of cmb1 (the bot's own code) were unaffected and drove the release.

**Handshake integrity** (rounds with a matching `combat-round` row on the opponent's side): cmb1 — not measurable (no rows), inferred one-sided from the traces (a Tremere press → no round 2 on the Malkavian side); cmb1b **338/338 (100 %)**; cmb2 **368/370 (99 %)** — the two unmatched rows are a combat ended by the opponent's Majesty after my row was written.

## 1. Table numbers (12 matches each — inside the noise yardstick, read direction only)

| deck | cmb1 wins / VP | cmb1b wins / VP | cmb2 wins / VP | own torpors cmb1 → 1b → 2 |
|---|---|---|---|---|
| malkavian | 6 / 22 | 4 / 18 | **8 / 27.5** | 4 → 10 → 8 |
| tremere | 2 / 12 | 4 / 14 | 2 / 10 | 2 → 1 → 3 |
| ventrue | 2 / 9 | 3 / 12 | 1 / 5 | 7 → 7 → 8 |
| nosferatu | 2 / 5 | 1 / 4 | 1 / 4.5 | 1 → 2 → 0 |

## 2. Combat per deck — cmb1b → cmb2

| deck | combats → rounds | rounds/combat | long % | dealt / taken per round | cards |
|---|---|---|---|---|---|
| malkavian | 77→83 ⇒ 109→114 | 1.08 ⇒ 1.05 | 0 ⇒ **10** | 1.00 / 0.93 ⇒ 0.89 / 0.93 | Swallowed by the Night as MANEUVER 0 ⇒ **11**, as stealth 11 ⇒ 0 |
| nosferatu | 83→85 ⇒ 76→84 | 1.02 ⇒ **1.11** | 0 ⇒ 7 | 1.61 / 0.82 ⇒ 1.39 / 0.85 | Grapple 11 ⇒ 10, Roundhouse 26 ⇒ 23, Taste 5 ⇒ 14, Crows 6 ⇒ 8 |
| tremere | 68→77 ⇒ 79→82 | 1.13 ⇒ 1.04 | 0 ⇒ **9** | 0.60 / 1.09 ⇒ 0.70 / 1.06 | Theft 31 ⇒ 23, Apportation press 8 ⇒ 1 (+1 press-to-END), Apportation MANEUVER 0 ⇒ **6** |
| ventrue | 90→93 ⇒ 88→90 | 1.03 ⇒ 1.02 | 0 ⇒ 8 | 0.74 / 0.80 ⇒ 0.74 / 0.76 | Majesty 24 ⇒ 18, Hidden Strength prevent 13 ⇒ 12, as standalone press 2 ⇒ **0**, bundled press 0 ⇒ 1 |

## 3. Predictions registered before cmb2, and the verdict

| change | prediction | observed (cmb2) | verdict |
|---|---|---|---|
| Grapple gating | bare-fist Grapples < 15 % (cmb1: 8 of 17 = 47 %) | **0 of 10**: 6 with Roundhouse, 2 with active Carrion Crows, 2 with a strength-boosted fist of 3 (checked per row: `strike`/`dealt`, Crows play in the same combat) | **keep** |
| Taste of Vitae after a card round | after bare hands → 0 (cmb1: 8 of 12) | 12 of 14 after Roundhouse / Crows / Grapple rounds; 2 after a fist — both rounds where the opponent lost 2 (a strength fist) | **keep** |
| Tremere maneuvers | > 0 (cmb1: 0 in 133 rounds) | 6 Apportation maneuvers, 9 % of rounds at long; Theft the strike in 23 of 82 rounds | **keep** — note the trade-off: the single Apportation goes to the maneuver first, so presses fell to 1 (+1 press-to-end); Johan's "Theft + press + Theft" needs a second copy in hand |
| Press worth | presses followed by a fist → < 20 % (cmb1: 6 of 14) | Nosferatu 8 presses: 6 torpor shots (their own `now M` line), 2 Crows; Tremere 1 card round; Ventrue 1 torpor shot; **0 followed by a fist**, **0 into an empty round** (cmb2-pre had 6 before the taken-line fix) | **keep** |
| Hidden Strength as press | 0 (cmb1: 1, cmb1b: 2) | **0**; 1 bundled press used, Tremere pressed to END once with Apportation | **keep** |
| Malkavian waves | Swallowed kept for combat | 11 maneuvers, 0 as stealth-glut; 10 % of rounds at long | **keep** |
| Nosferatu 2+-round combats | up (cmb1b: 2 of 83) | **8 of 76**, all real (0 opp-silent) | **keep** |
| Long fists deal 0 | Roundhouse never at long | Roundhouse only at close (23/23); fists announce `for 0` at long | **keep** |

## 4. What the numbers say beyond the predictions
- **Nosferatu's dealt/round fell 1.61 → 1.39 and its Roundhouse count 26 → 23 with more combats.** Not the gating (all Grapples justified) — the opponents now wave or snipe to long, and the V5 Nosferatu starter has NO maneuver card (Guard Dogs / Instinctive Reaction superior grant one on a block; neither fired). At long its fists deal 0 and Roundhouse is off the table. This is the deck's weakness Johan named, now visible for the first time because the handshake works. **Follow-up (not built):** the rush priority in `decide('action')` — with Crows + Grapple / Roundhouse in hand, rush (Deep Song) and choose the fight; with the combat cards spent, bleed with Deep Song. cmb2: 2 Deep Song rushes in 12 matches, the rest as bleeds.
- **Malkavian's two strong series in a row** (cmb1 6 wins, cmb2 8) are consistent with what the wave buys a bleeder: 10 % of rounds at long, 0 combat cards spent, torpors 10 → 8. Still n = 12.
- **Tremere presses less than Johan's picture** (1 + 1 end): the single Apportation in hand goes to the maneuver. Right by his main rule; the press variant needs the 2nd copy or the .44 Magnum (equipped once in 36 matches).
- **Ventrue** is unchanged in shape (Majesty ends every fight it can); the bundled Hidden Strength press fired once. Its torpors (8) are hunger / Fame / bare-hand fights without Majesty, not a combat-mind matter.
- **52 → ~40 rounds at blood ≤ 1** across the table (a block-decision matter, still not in scope).

## 5. Not in this release (unchanged from cmb1's list)
Dodge-vs-strike weighting (no dodge cards in the four lists) · cancelling a press when I have none · the before-range window for the other 82 cards · First Strike · strength weapons · Nosferatu's rush priority (§4) · the bot-driven combat phases vs humans (`combatPhases`) — the next step, after main's client controls.
