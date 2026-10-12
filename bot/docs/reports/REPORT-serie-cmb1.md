# REPORT — serie-cmb1: combat read per deck (22 Sep 2026)

**Design:** balanced (serie-bal1 design.txt, 6 cyclic orders × 2), `--fixed-seats`, start pool 30, all expert, seeds 9981–9992, bot **v0.6.155**, arena v1.4.2, server srv-2.6.38 (uploaded 22 Sep). 12/12 matches last-standing, 0 timeouts. Descriptive — no version delta, no predictions; the question is "do the yardstick decks (Nosferatu, Tremere) fight the way Johan pictures them?" Tool: `ana-combat.py serie-cmb1` (new).

Results (for context only, 12 matches is inside the noise yardstick): malkavian 6 wins / 22 VP, ventrue 2 / 9, tremere 2 / 12, nosferatu 2 / 5.

## What the trace can and cannot show
The trace records MY side of every round: `decide combat-strike` per round (vamp, blood, dodge option), `play` rows per combat window (grapple / strike / steal / press / prevent / env / end / after / maneuver). It does NOT record range, the opponent's strike, damage dealt/taken, or the opponent's name. Rounds are grouped into combats by an 8 s gap. **Recommendation R0:** emit one `combat-round` row (round n, range, opponent, my strike, dealt, taken, grapple/press flags) — the same class of gap as the eleven silent hand-spend sites fixed in v0.6.139.

## Per deck

### Nosferatu — "a dangerous combat deck once it gets into a fight"
71 combats, 90 rounds. 55 combats (77 %) end after one round; 14 reach round 2 (all from an opponent's press or an Underbridge Stray), 2 go longer.
- **Immortal Grapple ×17: 9 with Roundhouse, 8 with bare hands.** Confirms Johan's picture: the decision (`_resolveCombatRound`, "play unless it would cost me a non-hand strike/dodge") never asks what the hand holds or what the opponent plays. Half the Grapples are wasted on 1-damage fists.
- **Superior Grapple's optional press is never consumed** (documented since July, `_bestPressFor` excludes the bundled shape). This is the deck's ONLY press engine — Roundhouse superior 3 + Grapple press + Roundhouse 3 = 6 in two rounds torpors nearly any starter vampire. Without it the deck is structurally one-round, and the one-round fight is exactly what Majesty and Theft of Vitae are built to survive. **Biggest single fix for Nosferatu.**
- **Taste of Vitae ×12: 8 after bare hands**, 4 after a Roundhouse/Crows round. Johan's 21 Sep note holds unchanged (purpose = blood economy → pair with a big damage round).
- **Roundhouse ×25 in 90 rounds** (28 %); hand-limited (8 copies), plausible.
- **Carrion Crows ×9** (2 copies) — plays the first round it can, fine.
- **Rush: 2 landed in 12 matches** (6 Deep Song in the deck, played as bleed instead); 60 of 71 combats come from Nosferatu BLOCKING. The deck fights defensively. Johan's noted Fame → rush → torpor chain (21 Sep) still never runs.
- Torpors caused: Nosferatu combat put an opponent in torpor ~2 times in 12 matches (torpor rows within 4 s of a Roundhouse/Grapple). Own torpors: 1.
- Never dodges, never maneuvers (no such cards; Guard Dogs/Instinctive Reaction superior grant a maneuver on the block — never fired here). Correct for the list.

### Tremere — "a bleed/combat hybrid that nips at both pool and blood"
118 combats, 133 rounds — the table's most frequent fighter, mostly as a BLOCKER (93 blocks vs 40 blocked actions).
- **Theft of Vitae ×49 in 133 rounds** (37 %); 84 rounds with bare hands for 1. Hand-limited (10 copies).
- **ZERO maneuvers in 133 rounds.** Apportation ×14, all as PRESS ([tha]); the [THA] maneuver is never chosen because `_bestManeuverFor`'s `wantLong` needs a `req.rangeLong` strike in hand and Theft is "ranged" (usable at both ranges) — so the "vinka"/long-range posture Johan describes for Tremere does not exist in the bot. Going long with a ranged steal against a hand-striker is unanswerable damage; the bot never does it.
- **Press quality: 14 Apportation presses → next round Theft ×8, bare hands ×6.** The `blood > 1` threshold presses into a second round it has nothing to win in 43 % of cases.
- Own torpors 2 (one after a Roundhouse, one after a Grapple round — Nosferatu's fists do land when the fight lasts).

### Malkavian — stealth bleeder, should avoid fights
75 combats, 76 rounds, **zero combat plays.** Swallowed by the Night ×11 all spent as stealth; its [OBF] maneuver (the defensive "wave" to long range) never played — same `wantLong` root cause as Tremere. 19 of 76 rounds fought at blood ≤ 1 (the bot blocks/is blocked with empty vampires). 4 torpors.

### Ventrue — toolbox grinder, Majesty as the fight-ender
86 combats; Majesty ×24, ends every time it holds one (24/24). 62 combats fought WITHOUT Majesty (6 copies, hand-limited). Hidden Strength ×13 as prevent — and **×1 as a PRESS**: `_bestPressFor` accepts Hidden Strength [FOR] (`prevent 1 + press`) as a standalone press because it excludes maneuver/strike/steal bundles but not prevent bundles; the bot burned a prevention card to continue a fight the deck has no interest in, then struck with bare hands. Small bug, clear fix. 7 own torpors, none traceable to a named combat card (bare hands, Fame, or hunger).

### Table-wide
- **52 rounds fought at blood ≤ 1** (Malk 19, Tremere 19, Nos 14, Ventrue 10). Nobody dodged (no dodge cards in the four lists), and only Ventrue can end. Those rounds are decided in the BLOCK decision, not in combat — a blocker at 0–1 blood facing a Nosferatu should mostly not block; worth a look when the block doctrine is revisited, not in the combat release.
- Rounds/combat: 1 round in 295 of 350 combats (84 %). Multi-round exists only through Tremere's Apportation and the Stray.

## Findings → proposed combat release (bot ~v0.6.156, one release, knob `combatMind`, 0 = v0.6.155)
1. **Grapple gating** (Nosferatu): play Grapple when hand damage this round ≥ 3 (Roundhouse ± Preternatural Strength), OR the opponent has shown / statistically holds combat ends, dodge or a ranged strike (Majesty seen, Theft seen — the table model already counts opponents' combat cards). Bare hands → hold the Grapple.
2. **Superior Grapple's press consumed**: when Grapple POT was played this round, the press step may continue at close range (skip determine range next round, already built) — press when next round's expected damage (Roundhouse in hand) ≥ the opponent's expected return. Same "do I want to" term as 3.
3. **Press worth** (Tremere, Nosferatu): replace `blood > 1` with expected-value: press only when I hold a strike/steal card for the next round (or Roundhouse-class damage) AND my blood survives the opponent's shown average return; never press a Majesty/Theft deck into a round I'd fight with fists.
4. **`_bestPressFor` excludes prevent-bundled modes** (Hidden Strength [FOR]) — bug.
5. **Taste of Vitae** only after a round where my strike was a card (Roundhouse/Crows active), i.e. expected opponent blood loss ≥ 2; Johan's rule.
6. **Range posture per deck** in `_bestManeuverFor`: `chase` (Nosferatu: never leave close, follow a long-maneuver back when a maneuver is available), `snipe` (Tremere: go long when I hold a ranged strike/steal and the opponent has shown no ranged strike), `wave` (Malkavian/Ventrue: go long defensively when I hold no strike and the opponent's fists hurt). Reads the deck's `posture` the strategy layer already carries; today's `wantLong` becomes the `snipe` term.
7. **R0** — the `combat-round` trace row, so the next series can measure dealt/taken/range instead of inferring it.
Not in this release: dodge-vs-strike weighting (no dodge cards in the four lists), cancelling an incoming press, the before-range window for the other 82 cards, First Strike, strength weapons.

## Then
Balanced series serie-cmb2 on the same seeds with predictions (Grapple bare-hands share → < 15 %; Tremere maneuvers > 0; Tremere press → next-round card > 80 %; Taste after bare hands → 0; Nosferatu 2+-round combats up; Hidden Strength presses 0), compared against this file. Phase routine vs humans (`combatPhases`) and the client spec (strike quick-phrases in the bot's frozen grammar, `rng` in the tally) after that, as agreed.
