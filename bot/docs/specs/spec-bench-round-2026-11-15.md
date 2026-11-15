# Spec — the bench round: Toreador's guide proposals 2–8 and D-117 (15 November 2026)

Johan (14 Nov, STATUS "Next" 1): the bench round takes the Toreador guide check's proposals 2–8
(`reports/REPORT-toreador-guide-check-2026-11-13.md`) and D-117 (the Ball's turn), his "kör" on each. D-112: the guide is a check,
not law — where the line and the guide disagree, the line keeps what the bot's judgment and the sim say gives the deck the most VP,
and says why. This spec is the proposal (analysis, design, registered predictions); nothing is built before his "kör".
Status: **kör** — Johan, 15 Nov 01:16 ("Ja, kör :)"), on the recommendation of §11; recorded as RULINGS D-118.

## 1. The baseline (v0.6.228, main `c5852bc`)
The 600: `node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue,toreador --bench none` (every seating, a fresh deal
per match, the client profile). VP/match: Malkavian 2.01, Ventrue 1.03, **Toreador 0.84 ± 0.05**, Nosferatu 0.57, Tremere 0.55.
The counts below are Toreador's own rows (a scratch reader; the round commits it, §10).

| situation | count on the 600 |
|---|---|
| Grand Balls played | 308; on the Ball's turn the free Toreador calls its referendum 204 (66 %), an earlier actor called the card 51, the free one was kept home 41 (13 of them with two ready vampires at the unlock: after the lock it was the only body), another action 12 |
| the Ball in play | bars per Ball 0.80, a turn with a bar 220 (71 %); burned 286, after 0.52 rounds; 153 burns met a window at my unlocked body, 0 blocked (score 0.35 on average) |
| referendums | 2483 called, 509 blocked (20.5 %), 1943 passed, 31 failed; value × pass 2.75 on average |
| the referendum's place (1432 turns with a referendum and another action) | first 653 (26.5 % blocked), middle 497 (23.5 %), last 282 (17.7 %); a prince calling: first 23.5 %, last 15.7 %; another: 27.6 %, 13.4 % |
| Ventrue's referendums (the other political deck) | 1889 called, 37.2 % blocked; first 43.1 %, middle 38.7 %, last 38.3 % |
| the first influence | the biggest uncontrolled superior-[PRE] vampire first in 113 (19 %), a smaller one 419, none 68; superior Enchant Kindred stocks 0.35 a match; the third vampire at turn 4.42 |
| the first offensive action | with 1 ready vampire 480 (80 %), 2: 95, 3+: 25; a referendum 376, a bleed 224 |
| Scalpel Tongue | 10 plays (each a count-turning abstain); 1041 passed referendums with it in hand, 358 of them with my prey voting against, 140 of those with a bleed of mine to come that turn (196 bleeds, 76 blocked = 39 %) |
| Toreador's first window at a Malkavian bleed | 3079: calm and read as a stealth bleeder 964 (206 attempts, all bleeds of 2+), calm and not read 412 (171), at the edge 1703 (620); the attempts block 26–34 % |
| Villein | 971: calm 674 (the host left at 1 blood 324, at 2 284; 3.64 blood moved), on the edge 297 (every blood goes: 177 at 0) |

## 2. D-117 — the Ball's turn (ruled 14 Nov; to build)
Knob `ballTurn` (0 = v0.6.228). On a turn my Ball is in play and its free Toreador is ready and unlocked (the turn it is played
and any later one it survives — Claude's reading of "the Ball's turn"): (a) the minion queue moves the free one before the first
other actor whose finder holds a political action (the mandatory hunts keep the front); (b) until it has acted, the others leave the
political cards to it (`_actionCtxAdjust` nulls their `pol`, as the probe's reservation holds the heavy bleed); (c) the body the
posture keeps home is another — with (a) the free one is not the last body while another is there. The guard, in
`_grandBallPlan`: when after the lock the free one would be the only unlocked body and `_keepBlocker`'s last-body test holds (a
bleeding predator within reach), the Ball waits — the last-body test becomes one helper the two read. Pinned to Toreador.
Predictions: (B0) at 0 the 240, the V5 smoke and the 600 IDENTICAL; at 1 against the control: (B1) the free one calls its
referendum on ≥ 90 % of its Ball turns (66 %); (B2) an earlier caller 0 (51), the free one kept home ≤ 5 (41); (B3) 280–308
Balls (the guard); (B4) bars per Ball ≥ 0.95 (0.80), a turn with a bar ≥ 85 % (71 %); (B5) no loss.

## 3. Proposal 2 — the Ball's worth to its owner: recommended **no**
What the Ball still buys if a block saves it is my next referendum's protection: its value × the share of my referendums the table
blocks, about 2.75 × 0.205 ≈ 0.56 pool, less the locked Toreador's own action, which the burn gives back. Weighed as the Jack
worth is (worth ÷ 2 against T6's 0.3), it moves no weight at any of the 153 windows, so an honest worth changes nothing here; the guide's key block assumes a table
that blocks the key referendum (humans). The Ball's value is its own turn (D-117): it lives 0.52 rounds, and 133 of its 286 burns
met no unlocked body of mine. Instead: a BOARD line — my referendums' block rate read from the table (a political ledger beside
`_myHitRate`), so at a table that blocks politics the worth rises.

## 4. Proposal 3 — the key action last (general: every deck that calls referendums)
Knob `keyLast` (0 = v0.6.228). At the minion head (after `_probeOrder`; skipped when the probe order fired or D-117 governs): the
key actor K is the actor whose own scorer, asked as the look-ahead asks it (`_actionCtxFor` + `_actionCtxAdjust(…, true)` +
`_decide`), picks a referendum — the highest score, a tie to the one that is not the best blocker. The queue becomes the
0-blood hunts, the rest in today's order, K, then the best blocker (today's last) when it is not K: K acts after the cheap actions
that draw blocks, and the body the posture keeps home is another. The others leave the political cards to K until it has acted.
With `scalpelLock` on (§7), a referendum that will carry the lock opens the turn instead (the guide's point 10: the lock before
the offensive actions). Pinned to Toreador and to Ventrue (the two decks with referendums).
Predictions: (O0) at 0 IDENTICAL; (O1) Toreador's referendum is the last action, or the last before a body kept home, in ≥ 70 % of
the turns with another action (20 %), first ≤ 10 % (46 %); (O2) Toreador's referendums blocked ≤ 17 % (20.5 %), passed ones
+0.1 a match or more (3.24); (O3) Ventrue's blocked ≤ 36 % (37.2 %: its baseline shows a smaller place effect); (O4) no loss for
either deck.

## 5. Proposal 4 — the first influence (general: every deck with a superior stock action; D-43: measure it)
Knob `engineW` (0 = v0.6.228; the arm 4). `_planInfluence` adds `engineW × Y(first)`: Y(v) is the share of my other crypt
cards younger than v (capacity, the stock's law) when v can play a superior stock action my library holds four or more of
(Enchant Kindred [PRE], Govern the Unaligned [DOM]), else 0. At 4 the biggest such vampire wins against one about a turn faster,
never against one two turns faster (a turn of first rise is 3 points). Arms: the rotation (the variant in every seat: Malkavian,
Tremere and Ventrue have the engine too) and pinned to Toreador.
Predictions: (I0) at 0 IDENTICAL; (I1) pinned: the guide's pick first ≥ 50 % (19 %), stocks ≥ 0.6 a match (0.35), the first rise
≥ 0.2 turn later, the third within ±0.2 turn (4.42); (I2) rotation: the matches whose variant is Nosferatu (no stock card)
IDENTICAL, the first pick changed for the others, counted per deck; (I3) VP: my expectation is level or a loss — when the bot
already picked the guide's vampire Toreador scored 0.72 against 0.85 (confounded by the deal: the bench removes that); it flips
only with no loss in both arms.

## 6. Proposal 5 — three before the offence: recommended **no**
Toreador's first offensive action comes with one ready vampire in 480 of 600 matches and is a referendum in 376, and an unblocked
referendum passes 98 % (1943 of 1974). Holding it trades a Kine Resources Contested (value × pass ≈ 2.7 a call) for a bleed
of 1 (about 45 % of Toreador's bleeds are blocked) or a body at home; the build itself already comes first when a stock action
is there (the structural pick under three ready, `grinderReadyTarget`). The guide writes for tables where a lone early caller is outvoted or
blocked. The strategy line says so. If Johan prefers a measurement: a knob `buildTo` (the plan keeps every body home while fewer
than three are ready, a stock excepted), one arm pinned to Toreador; my expectation is a loss.

## 7. Proposal 6 — Scalpel Tongue's lock before my offence
Knob `scalpelLock` (0 = v0.6.228). In my referendum's polling step, after the count passes: when my prey has a ready, UNLOCKED
vampire that voted against, an actor of mine is still to act this turn, and my calling vampire can pay Scalpel Tongue (one
requirement [cel][pre], 1 blood, not its last), it plays the card on that vampire —
`_bestAbstainFor`'s target model (a vampire whose votes the seat's count names) with "unlocked" and "against" as conditions,
`_playAbstain` (votes against come off: the count only rises) and the frozen ABSTAIN line (no new line). Pinned to Toreador.
Predictions: (S0) at 0 IDENTICAL; (S1) Scalpel Tongue ≥ 50 plays (10), each lock on such a vampire with an action of mine to come;
(S2) in those turns my later bleeds blocked ≤ 30 % (39 %); (S3) no loss (a small effect: about 0.1 pool a match).

## 8. Proposal 7 — leave a stealth bleeder's bleeds (amends D-2 for a deck without bounce)
D-2 (Johan): no attempt on a stealth bleeder's bleed of 1 while the pool affords the pump; a front-heavy bleed gets an attempt so
it must spend stealth, "better still with a bounce after". Toreador holds no bounce card, and its calm attempts at Malkavian's
bleeds block a third (the rest cycle a stealth card). Knob `clogWide` (0 = D-2 as built): for a deck whose library holds no bounce,
the clog covers a read stealth bleeder's bleed of any size while I stay off the edge after it (pool − bleed > the critical level +
the pump seen); at the edge D-2 stands. Pinned to Toreador.
Predictions: (C0) at 0 IDENTICAL; (C1) calm attempts at a read stealth bleeder 206 → 0, the unread ones (171) and the edge's (620)
within ±10 %; (C2) Toreador's pool lost to Malkavian's bleeds +0.1 to +0.5 a match; (C3) my expectation is level or a small loss;
it flips only with no loss. (The 171 unread are the table model's early read — a BOARD line, not this round.)

## 9. Proposal 8 — Villein keeps the host's blood for two cards
Knob `villeinKeep` (0 = v0.6.228). In a calm Villein (not on the edge) the host keeps the blood for its two dearest blood-cost
cards in hand it could pay (cap 3) instead of the dearest one — Toreador's cost 1 each (Majesty, Aire of Elation, Perfect
Paragon, Resist Earth's Grasp, Scalpel Tongue). Villein only: Blood Doll's drain keeps its own reserve. Pinned to Toreador.
Predictions: (V0) at 0 IDENTICAL; (V1) calm Villeins leaving the host at 1 blood ≤ 160 (324); the edge's unchanged; (V2) the blood
moved per calm Villein falls by at most 0.5 (3.64), Villeins played within ±10 % (971); (V3) the hosts' blood-cost plays rise; no loss.

## 10. Method, the flip, the release
- Each arm: 600 matches, `--bench knob=K=1` (`engineW=4`), `--bench-deck DECK` when pinned, read paired against the control
  (`ana-sim-diff.py --vp`, about ±0.10 VP at 600) after the knob is proven to fire (a trace row per decision). Arms: D-117 (T), 3 (T,
  V), 4 (rotation, T), 6 (T), 7 (T), 8 (T) — eight, ~7 minutes each here. Then the flipped knobs together, pinned to Toreador, against
  the control (interactions; no loss).
- The flip: a knob goes to 1 in this PR when its arm shows no loss (the variant's 95 % interval reaches 0) and its mechanism held.
  A knob that loses is removed in the same PR (no dead branch: spec-cleanup C5); its measurement stays in the CHANGELOG, and
  `DECK_STRATEGY.toreador`'s line and the guide report say why the bot differs from the guide.
- One PR, bot v0.6.229: the knobs (flipped or removed), R-45's "no limit" notes in Eyes of the Wild's comment and cardfx note, the
  reader committed as a tool (`ana-guide-check.py`: the guide check's situations on a sim trace dir, so the next deck's check
  reproduces), RULINGS (each answer), the footprints (the 240, the V5 smoke, the 600), the gates, the egress review.

## 11. For Johan
"kör" or "nej" on each: D-117 (ruled: build), 2 (recommended no), 3, 4, 5 (recommended no), 6, 7 (amends D-2 for a deck without
bounce), 8. Recommended: kör D-117, 3, 4, 6, 7, 8; no 2 and 5 (the lines say why).

## 12. Amended before any arm (15 Nov, the build's mechanism smokes; the predictions above stand as registered)
- §4, keyLast's place: K goes after every other actor but the bodies the posture would keep home — asked at the minion head as if
  the best blocker were the last body (`_keepBlocker` with the unlocked count it will have then; the plan's quota keeps that many,
  `_homeBodies`) — and when K would be one of them another stays. The first draft's "just before the best blocker" left the
  referendum first in every two-actor turn. D-117's free Toreador takes the same guard (never among the home bodies), and the minion
  loop skips its keep test.
- §5, the arm is `engineW=6`, not 4: the planner probe (Catalina 8 / Bret 4 / Kathy 5 and Catalina / Kathy / Nik 3 in the uncontrolled
  region, pool 30) picks Kathy at 4 and Catalina from 6. Catalina's plan scores 2.8–3.4 under the faster picks (about a turn of first
  rise); the stated intent — the biggest wins against one about a turn faster, never against one two turns faster — needs 6
  (6 × ΔY ≤ 5.5, under two turns).
- §7, the 24-match smoke with `scalpelLock` alone: 0 locks in 92 Toreador referendums. The refusals: no actor of mine left 13, the votes
  against from another seat than my prey 7, the voter locked 3 (it acted on its own turn — a prey vampire that voted is usually
  locked during my turn), no payable Scalpel Tongue 3. The mechanism is right (174g–h); S1's 50 plays were counted without the
  unlocked condition and stand as registered.

## 13. What came out (bot v0.6.229; each arm 600 matches, paired against the knobs-at-0 control; the full reads: CHANGELOG v0.6.229)
| item | the mechanism | the registered predictions | Toreador's paired VP | verdict |
|---|---|---|---|---|
| D-117 `ballTurn` | the free one calls on 95 % of its Ball turns (66 %), an earlier caller 1 (51), kept home 1 (41), the guard waited 17 times | B1, B3, B4, B5 held; B2 half (1 earlier caller, not 0) | +0.01 [−0.02, +0.05] | on |
| 3 `keyLast` | the referendum first in 3 % of the turns (46 %), last in 67 % (20 %); Ventrue first 12 % (36 %) | O1 half (last < 70 %), O2 failed (17.4 % blocked, not ≤ 17 %; fewer referendums called: 2329 against 2483), O3, O4 held | +0.04 [−0.05, +0.14]; Ventrue +0.05 [−0.04, +0.15] | on |
| 4 `engineW` 6 | the guide's pick first in 67 % (19 %) | I1 half (stocks 0.50 a match, not 0.6; the third vampire 0.3 turn later), I2 held (Nosferatu SAME-PLAY), I3 level, not the loss expected | +0.04 [−0.07, +0.15]; every seat in turn +0.00 [−0.09, +0.10] | on |
| 6 `scalpelLock` | 71 locks (Scalpel Tongue 81 plays, 10) | S1, S3 held; S2 failed (the lock turns' later bleeds blocked 42 %, 39 % before) | +0.03 [+0.01, +0.05] | on |
| 7 `clogWide` | calm attempts at a read Malkavian 206 → 45, but every read stealth bleeder's bleeds let through (Tremere 161, Nosferatu 128, Ventrue 120) | C1, C2 failed | −0.04 [−0.10, +0.03] | removed; D-2 stands |
| 8 `villeinKeep` | a calm Villein leaves its host at 1 blood 104 times (324) | V1, V2 held; V3 failed (the blood-cost plays 2568, 2575) | +0.00 [−0.06, +0.06] | on |
| the five together | — | no loss | +0.09 [−0.03, +0.21] | the release |
