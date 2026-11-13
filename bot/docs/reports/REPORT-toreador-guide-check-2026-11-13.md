# REPORT — Toreador's strategy against its Black Chantry guide (RULINGS D-112), 13 November 2026

Johan (D-112, 13 Nov): a deck's strategy line is checked against its Black Chantry guide whenever it is written or changed; the
guide is a check, not law (it is written for beginners), and where they disagree the bot keeps what its judgment and the sim say
gives the deck the most VP, and says why. Toreador's check comes first (in the menu since v0.6.219).

**The guide**: Black Chantry's helpsheet for the Fifth Edition Toreador precon — `blackchantry.com/help_sheet_toreador_en.pdf`, the
deck our `deck-toreador.json` plays (its decklist on `blackchantry.com/?p=1577`). The block doctrine cites the First Blood
Toreador guide (`docs/specs/elysium-bot-block-doctrine.md`), which is another deck (Aching Beauty, Telepathic Misdirection, On the
Qui Vive). The sandbox could not download the PDF; its text was read through the web tool, so the points below are paraphrased
from that reading. **The bot**: v0.6.222 (main `1e9f3fd`); the numbers are Toreador's own rows on the 600 fresh deals of the
five-seat design (`--decks malkavian,tremere,nosferatu,ventrue,toreador --bench none`, every seating), where Toreador scores
0.78 ± 0.05 VP a match (Malkavian 2.00, Ventrue 1.05, Tremere 0.63, Nosferatu 0.55). The trace reader is a scratch script.

**The strategy line** (`DECK_STRATEGY.toreador`): vote and bleed with the Grand Ball — princes and the justicar call Kine Resources
Contested, Parity Shift and Voter Captivation, the Ball frees a Toreador for the politics, Enchant Kindred and Aire of Elation bleed
between referendums, Majesty ends the fights; win by pool damage and votes. The guide agrees with the line's shape: political
control first, bleeds with Enchant Kindred and Aire of Elation, little defence.

## The points, one by one

| # | The guide (paraphrased) | What the bot does (600 deals) | Verdict |
|---|---|---|---|
| 1 | Early: bring out first the highest-capacity uncontrolled vampire with superior Presence, so it can play superior Enchant Kindred | the first influence pick is that vampire in 95 of 600 matches (16 %); the influence planner weighs the rises' schedule | **differs** — proposal 4 |
| 2 | Superior Enchant Kindred puts 2 blood on a younger uncontrolled vampire; many vampires cheaply | 196 Enchant Kindred actions as that stock action, 221 as bleeds | agrees |
| 3 | Midgame: start the offence at three vampires in play | at the first bleed or political action the bot has 1 ready vampire in 335 matches, 2 in 185, 3 in 56, 4 in 7 (mean 1.55) | **differs** — proposal 5 |
| 4 | Bleed with basic Enchant Kindred or a default bleed; Aire of Elation after the prey declines to block | Aire of Elation 299 times in the bleed-modifier window (after the block window) | agrees |
| 5 | KRC or Parity Shift to weaken the prey; late: prey richer → Parity Shift, prey poorer → bleed or KRC to oust | Parity Shift called with the prey richer 210, poorer or level 144 (it takes from a richer seat, not always the prey); KRC with the prey poorer or level 763, richer 407 | mostly agrees |
| 6 | Late game (three or two left): keep a pool income that outlasts their bleeds and politics | not measured directly (the dynamic floor and the pool rule are the bot's general answer) | — |
| 7 | Action order: the least important action first, the most important last | in 927 turns with a political and another action, the political one is first in 544 and last in 310 | **differs** — proposal 3 |
| 8 | Multi-act: after a blocked minor action, superior Majesty unlocks the vampire for another action | 688 Majesty plays; 682 act-again rows "unlocked in combat" | agrees |
| 9 | Stealth: Creepshow Casino's lock on an undirected action, superior Resist Earth's Grasp, superior Perfect Paragon (allies and younger vampires −1 intercept) | Creepshow 293 locks at the announce, Resist Earth's Grasp 316 as stealth; Perfect Paragon 129 plays, all as +3 votes — its superior mode is **not in the card data** (the auto tier wrote the [pre] mode alone, and `docs/CARDS.md` calls the card FULL) | **gap** — finding A |
| 10 | Lock minions: Scalpel Tongue on the prey's vampire that voted, before offensive actions | 5 Scalpel Tongue plays in 600 matches, each to cancel votes against the bot's own referendum | **differs** — proposal 6 |
| 11 | Unblockability: play the Grand Ball on the turn an important political action must go unblocked, lock the most expendable Toreador | 308 Balls: the free Toreador calls a political action the same turn in 153 (50 %), acts at all in 254; 0.76 barred actions per Ball; 281 burned (91 %) after 0.56 rounds on average (149 in the round they came in) | **differs** — proposal 1; the lock picks the smallest capacity, as the guide says |
| 12 | Politics: count the votes; a cross-table deal when needed | the referendum's pass estimate counts every seat's votes; no deals (a human's game) | agrees as far as a bot can |
| 13 | Bleed defence: block the Tremere and Ventrue bleeds, not Malkavian's (so their stealth clogs their hand) | block rate on bleeds at Toreador: Malkavian 29 % (765 of 2660), Tremere 30 %, Ventrue 22 %, Nosferatu 18 % | **differs** — proposal 7 |
| 14 | Pool gain: Villein (without draining the vampire), Parity Shift, Consanguineous Boon, Voter Captivation, Art Museum | all used; Villein leaves its host at 0 blood in 118 of 850 uses and at 1 in 358 | **differs** in degree — proposal 8 |
| 15 | Combat: Majesty to protect a vampire fighting a Nosferatu or a Tremere; avoid a Nosferatu with Potence | Majesty in 19 % of combat rounds against Nosferatu, 17 % against Tremere and Malkavian, 13 % against Ventrue | roughly agrees |
| 16 | Hand: a discard-phase action to cycle a card you do not need | the discard phase cycles dead cards (the master loop's held cards) | agrees |
| 17 | What to block, as intercept is short: the burn of a Grand Ball; permanent intercept for prey or predator (Bowl of Convergence, Sport Bike, Raven Spy); bleeds and politics that cost too much pool | the burn of its own Ball: 161 block decisions, **0 blocks** (120 had no intercept card); permanent intercept by prey or predator: 28 blocks of 360; bleeds of 3 or more: 648 blocks of 1614 (40 %) | **gap** on the Ball's burn — finding B; the rest agrees |

## Findings (not a matter of taste)
- **A. Perfect Paragon's superior mode is missing.** KRCG: "[PRE] Allies and younger vampires get −1 intercept." The compiled entry
  (`src: auto`) has the [pre] votes mode alone, and the ledger certifies the card FULL: its checker does not ask that every
  discipline line of the text has a mode. Toreador is not yet 100 % playable while this is so. The fix is a curated mode and a
  reader (a stealth that counts only against an ally or a younger blocker); the ledger's check is worth widening to every card.
  Both are BOARD lines (round A).
- **B. A bot never defends its own card from a burn.** The block path for the threat classes refuses a block without an intercept
  card ("undirected actions carry +1 stealth"), but the burn and rush windows are directed (0 stealth: a bare body may block); and
  with a card, T6's weight keeps the score under the bar. Johan's answers of 13 Nov put both in round B (D-114's spec, §5 and §6):
  the guard corrected for both directed windows, and a burn at my card weighed by the card's worth to me — the Ball's worth comes
  from proposal 1's reading.
- **C. The Ball's play does not ask the action scorer** (`_grandBallPlan` checks that a political action exists, not that the free
  Toreador's own scorer would call it this turn). That is the look-ahead rule's case (bot/CLAUDE.md, v0.6.205): a card that sets up
  a later decision is played only when that decision's scorer would take the set-up option now. It is listed as proposal 1, since
  it changes Toreador's play.

## Proposals (each waits for Johan's "kör"; the sim decides the ones that are judgment)
1. **The Ball on the turn it pays** (finding C, guide 11): `_grandBallPlan` asks `_decide` with the free Toreador's real context and
   the Ball's unblockability whether it would call the political action now; otherwise the Ball waits. A correction under the
   look-ahead rule (no knob); prediction: fewer Balls, more barred actions per Ball, Toreador's paired VP on the 600 not lower.
2. **The Ball's worth to its owner** (finding B, guide 17): in round B's §5, a burn at my Ball weighs what it still buys — the
   referendum value its free Toreador can call unblocked — so the guide's first key block happens when it is worth an action.
3. **Action order** (guide 7): the probe-order rule ("the puncher goes last") extended so a turn's most valuable action — an
   unblockable or a key political one — comes after the cheap ones that draw blockers. A knob, benched pinned to Toreador.
4. **The first influence** (guide 1): weigh a superior-Presence vampire's Enchant Kindred stock in the influence planner. A
   judgment the sim should decide: today's planner optimises the rises, and the guide's pick is one of four in a sixth of the deals.
5. **Three before the offence** (guide 3): a plan read that holds the political offence until three vampires are in play. The bot's
   early bleeds are cheap pressure; a knob benched pinned to Toreador decides, and if it loses, the line says why it differs.
6. **Scalpel Tongue on a voter before my offence** (guide 10): today it only cancels votes against my referendum; locking the
   prey's voting blocker when my offensive actions follow is a new use (a decision, benched).
7. **Leave the Malkavian bleeds** (guide 13): a deck-persona rule (layer 3) that does not block a stealth-bleed deck's bleeds below
   a pool threat — or a layer-2 rule if the sim shows it for every deck. A knob, benched.
8. **Villein's blood** (guide 14): keep the host at 2 blood when the deck's blood-cost cards are in hand (Majesty, Aire of Elation,
   Perfect Paragon). A small knob.

## What stays as it is
The line's shape (politics first, bleeds between, Majesty ends fights) matches the guide; Enchant Kindred's stock, Aire of Elation
after the block step, Majesty's multi-act, Creepshow Casino and Resist Earth's Grasp, the Grand Ball's lock pick and the discard
phase agree with it. Deals are a human's game.
