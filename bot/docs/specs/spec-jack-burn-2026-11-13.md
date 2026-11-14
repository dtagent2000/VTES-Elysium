# Spec — burning a Smiling Jack (RULINGS D-114), 13 November 2026

Johan's principle (D-114, answering O-39): a burn of Smiling Jack is weighed against the price it pays — what the acting vampire's
best other action would gain or deal — and against how my pool stands under Jack and the table's expected pool damage to me. His
"kör" (13 Nov 20:13) on Claude's proposal of the same day, and his "Yes kör" (21:45) on the six questions of the round proposal:
the order A (table runs) → B (this spec) → C (a human's Grand Ball); the block guard corrected for both directed windows as its own
step; the owner's defence in the same PR behind the same knob; the knob to 1 in the same PR when the mirror bench shows no loss.
Built as round B: its own PR, its own registered prediction, the mirror bench.

## 1. The card
Smiling Jack, The Anarch (unique master; KRCG is the text): at its owner's unlock phase a counter moves from the owner's pool to
the card; at each other Methuselah's unlock phase that Methuselah burns 1 pool or 1 blood from a vampire they control per counter
(D-32 the payment order); vampires can burn the card as a (D) action. It leaves play with its owner.

## 2. The price of letting Jack stand (for a seat X that is not the owner)
- `c1` — the counter at X's next unlock (one more each round: the owner's unlock adds it).
- `runway(X)` — X's pool ÷ (`c1` + the table model's expected pool damage to X a round: `oppForecast(predator of X)`, the
  public prior-blended forecast; for me it is `plan.reads.predFc`).
- `H(X)` — min(`runway(X)`, the rounds left). The rounds left are Jack's own expected life: its owner's runway under its own
  predator (it leaves play with its owner) — Claude's reading of "the rounds the match is expected to have left".
- `price(X) = H·c1 + H(H−1)/2` — `c1 + (c1+1) + …` over H rounds. For the owner: `H` (the counter it pays itself each round).
- *Amended 14 Nov (RULINGS D-115, answering O-40; bot v0.6.226, the knob `jackRunway`):* the runway above takes a flat `c1 + fc`
  a round while Jack's counter grows, so its price could pass X's pool (5 of 56 burns on the 240). It is now the self-consistent
  runway: R solves `R·(c1 + fc) + R(R−1)/2 = pool(X)`, the positive root `R = √(b² + 2·pool) − b` with `b = c1 + fc − ½`; the price
  over R is `pool − R·fc`, never above the pool. A runway of a round or more is never longer than the flat one (under a round it is
  a little longer, its price a little higher: the R(R−1)/2 term is negative there), R = 1 exactly when the pool is `c1 + fc` (§4's
  "a round" threshold stays), and the owner's life (its own flat 1 + fc a round) is unchanged.

## 3. The value of a burn, in the scorer's currency
- `value = P(success) × [wDef · price(me) − offW · price(my prey)] × P.aggression` — the same unit as a bleed (`n · P.aggression ·
  offW` for n pool), so the comparison with the best other action is in pool: aggression cancels.
- My prey's price counts AGAINST the burn: Jack's take from my prey works for me (an oust by Jack is my VP). When my prey is the
  owner, its price is its own counter payments (`H`).
- `wDef` — 1, doubled when my runway is shorter than my turns to oust my prey (`plan.reads.preyTto`): the tempo is against me.
- `P(success)` — 1 − P(the owner blocks): from the table model, the owner's unlocked ready minions and their intercept against
  the acting vampire's stealth (0 for this directed action unless the actor plays some); no unlocked minion = 1.
- The burn wins only when it beats the best other action (a bleed of 2 is `2 · P.aggression · offW`); never as a forced pick.

## 4. Coordination
Jack charges every seat but its owner. Among the BOTS that are not the owner and have a vampire that can act, the one with the
shortest runway burns first: a bot waits one round while a bot with a shorter runway acts before its own next unlock, so the table
does not spend several actions on one Jack. A bot does not wait for a human. Ties go to the seat that acts first from now.

## 5. The owner's defence (21:45, Q5)
A (D) action to burn MY card is weighed by the card's worth to me, not by T6's generic weight (0.3–0.6; today the score stays
under the block bar for every starter). For my Jack: the price it takes from my prey over its life (`offW · price(my prey)`), the
same formula seen from the owner, less my own counter payments. Behind the same knob. *Amended 14 Nov (D-115):* my prey's loss runs
over min(her runway, Jack's life) — since D-115 her runway pays the growing counter, so it is at most her pool — while my payments
run over Jack's whole life; where my pool is at least hers at a quiet predator, my Jack is worth 0 to me (RULINGS O-41). The Grand Ball's worth comes from the D-112
check's proposal (round A's report), not from this spec.

## 6. The block guard (21:45, Q4) — a rules correction, its own step first
The undirected classes' block path refuses any block without an intercept card ("undirected actions carry +1 stealth; a bare body
cannot reach it"). The burn window (T6) and the rush window (T5) are DIRECTED: 0 stealth plus what the actor plays (R-12), so an
unlocked bare body may block. The guard reads the action's real stealth for a directed window. No knob (a rules correction); its
own footprint and prediction before the burn step, verified by a section that fails on the old bytes.

## 7. Building blocks
- Jack's cardfx gets a burn mode (`fx.burnCardAction`, vampires only); today only Toreador Grand Ball has one.
- `_bestBurnCardFor` reaches Jack at any seat (the Ball stays at prey and predator); each candidate carries its own value: the
  Ball's present formula (its 0-path), Jack's §3.
- The runway is a strategic read: a plan field (`plan.reads`, the plan rule) and a line in `elysium-bot-strategy.md`.
- Knob `jackBurn` — 0 is today (no Jack burn; T6 for a burn at my Jack). In the arena's and the sim's knob lists. Flipped to 1
  in the same PR when the mirror bench shows no loss (Q6); otherwise shipped at 0 with the reading.

## 8. The prediction (Johan's three, made measurable; registered before any run)
1. Nosferatu's +0.17 VP of v0.6.221 shrinks: on the 240-match design Nosferatu's paired VP, B against A's release, is below 0.
2. Jack lives shorter where it is played: the median rounds from its play to its leaving play fall against A's release.
3. The mirror bench (`jackBurn=1` in every seat against the negative control, the four starters, every seating): no loss — the
   paired difference's 95 % interval is not wholly below 0.
The guard step registers its own (§6) in the round's CHANGELOG entry.

## 9. Measurement
The knob proven to fire (decide rows whose pick is a Jack burn, per deck), footprints on the 240 design, the V5 smoke and the
Toreador 600, the mirror bench read paired against the negative control (`ana-sim-diff.py --vp`), Jack's lifetime from the
traces, and an arena smoke (the burn action between bots on the real clock).
