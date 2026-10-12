# Review: VTES-Player (DuelRevolvers), 11 Oct 2026 — what to take, what to leave

**Licence:** the repo has no licence file, so we take **ideas only, no code**. Paths below are theirs, for reference.

**The source.** Johan uploaded `VTES-Player-main` (634 files, 219 design docs). Four read-only reviews covered:
1. AI architecture and playstyles;
2. seat relations, politics and votes;
3. opponent modelling and the bench;
4. playtests, table UX and rules gaps.

**The verdict.** Their bots are simpler than ours as decision makers, and their methods are better than ours in places.

*How their bots decide:*
- A hand-tuned scoring policy: 75 default weights and a price list for effect types (`src/ai/heuristic.ts`).
- No plan layer, no trace rows, no opponent model.

*What did not work for them:*
- **A one-ply search agent** (`src/ai/search.ts`) **loses by 1.08 VP** (±0.24, 120 games of a Hecata mirror). With the lookahead off it matches the policy exactly, so they put the loss on the hand-made evaluation (`docs/ai-v2-design.md` §5).
- **Their meta layer is a fixed table** of prey/predator/cross-table weights (`src/ai/seats.ts`), with no leader or threat read. Bounce targets are effectively random: a seat choice scores the same for every seat, so the seeded tie-break picks.
- **Their six playstyles are weight overlays** picked from deck composition (`src/ai/playstyles.ts`). They change behaviour (Builder plays 41–61 % more permanents) but **none adds strength**: all five came out slightly negative, inside ±0.20, over 240 games each.

*Where they lead:* the gold is their **methods**.

## Take (ranked by value for effort)
1. **Pair the arms.** Analyse per-match differences on the same seeds instead of two independent intervals.
   - Their bench rotates the same deal through every seat and computes the margin per deal (`src/ai/bench.ts`, `docs/ai-bench-design.md`).
   - Ours today, re-run on the 11 Oct rows (48 + 48 matches):

     | Comparison | Unpaired | Paired by match |
     | --- | --- | --- |
     | `bcN2` − `negN2` (the knob against the control) | ±0.63 | ±0.51 |
     | `bcN2` − `bcN` (near-identical code; same sign in 40 of 48) | ±0.58 | ±0.43 |
   - Action: a paired mode in `ana-bench.py`, the default way to read an arm. Effort S.
2. **Count flips, not just fires.** Re-score each decision with the knob off and record whether the choice changed. A term that never flips anything is dead; one that flips but benches neutral stays at 0.
   - Sources: `docs/richer-options-design.md` §8, `docs/ai-block-action-value-design.md` §5.1. In their runs, two pool-pressure terms flipped 0 and 2 of 7,361 decisions, even at 5× strength.
   - This formalises our "prove the knob fires". Effort S: a `flip` field on the decide row.
3. **The §8 law, for the meta layer.** A term that is equal for every option cannot change the choice. Our `_tableThreat()` is only traced today (the rush counterfactual's dominance triple), with no decision reading it. When the meta layer wires it in, it must enter where options name DIFFERENT seats or compete with passing:
   - the bounce target;
   - the rush target;
   - the voter and the referendum terms;
   - keep-a-blocker and block-or-pass.

   Start from ONE shared seat valuation: relation weight × our threat read, plus an oust bonus on the net pool change (relations in `seats.ts`; `poolWeight` / `oustWeight` in `heuristic.ts`). Effort S–M.

   They applied the law themselves: the pool is the same for every candidate in an influence decision, so their pool brake there is a cliff that stops the phase, not a gradient (`docs/ai-pool-preservation-design.md` §3).
4. **Measure the meta layer at decision level, on decks padded with the cards a rule needs.**
   - **Their metrics:** flip rate, a fork audit (does the option list even hold opposite choices?), the vote-direction split, wrong-target audits, and "did it run" counters.
   - **Their test table:** padded with intercept and a vote toll, so the rules actually come up (`config/playtest-decks-politics.json`). Viable political block decisions went from 0 of 45 to 2 of 41 (it blocked both), and tolled vote decisions from 0 to 22, in 40 games.
   - **The cautionary result:** their bots voted 70 FOR / 0 AGAINST over 20 games, while the comment above the weights said "against everybody else's". Only a whole-game count of decisions caught it.
   - **Their instrument lesson:** a first probe said the bots aimed referendum terms at themselves in 7 of 15 decisions. The probe was wrong: it counted a Parity Shift gift to self as a hit (`docs/ai-referendum-terms-design.md` §5.1). An audit needs a known case before an alarming number is believed; our `ana-block` R6 count is the same shape.
   - VP in a mirror is a fixed pie, so it cannot show the meta layer working. Effort S–M.
5. **One bot asks each table-wide question; system notices go to the log tier.** Our known chorus: every bot asks "Will this action cause me to lose pool?" at a human's political action (debt 23c). Our spokesbot logic covers other prompts but not this one. Effort S, and it directly helps the feel at a human table.
6. **A leak test, plus an "every chair agrees" check.**
   - **Leak test:** walk everything the bot receives and stores against what its seat may not see, with a planted-leak control (`tests/ai/information-boundary.test.ts`).
   - **Every chair agrees:** `_twdExpect(seat X)` computed by each other bot must match, except where a bot was legitimately shown a card (`docs/ai-ash-heap-reading-design.md` §5).
   - Ours is enforced by convention today. Effort M.
7. **The pool floor at every spend site** (`docs/ai-pool-preservation-design.md`):
   - influence transfers;
   - costs net of pool gained;
   - taking counters back at the floor;
   - no brake for a seat with nothing in play.

   Check our dynamic floor's coverage. Effort S.
8. **Blood hunts.** Their voter is strongly against a hunt that burns its own vampire (−20), mildly for one on anyone else's (+6) (`heuristic.ts`, `referendumValue`; `docs/blood-hunt-answers-design.md`).
   - **Ours, checked:** `_refVoteDir` reads only pool terms, so a blood hunt reads "nothing in it for me" and the bot abstains.
   - **The case that matters:** our bots never diablerise, so the hunt is always on someone else's diablerist, usually a human's. Voting for it, harder when the diablerist is our predator or the leader, is the natural play. Effort S.
9. **Personas: overlays with tests, and expectations set by their bench.**
   - **The tests:** every overridden knob exists, every persona differs from the default, and the self-oust guard is untouched (`tests/ui/playstyles.test.ts`). Pairs of personas must disagree at fixed positions, for example a Turtle refuses a 2-pool card at 7 pool where a Bruiser plays it (`tests/ai/pool-preservation.test.ts`).
   - **Expectations:** judge personas by behaviour and feel, not VP. Their bench needed 240 seat-rotated games per style for ±0.20. To read a difference of ±0.20, ours would need about 250–300 matches per arm read paired, about 450 unpaired.
   - **Not measured by them:** a persona on a deck it does not fit. They benched each style only on its assigned deck, so whether matching persona to deck is worth anything is still open.

## Smaller checks
- **Value of stopping an action by type:**
  - in order: a lethal bleed (+50), diablerie (25), a bleed at me (3 + 3 per point), a political action (7), rescue (4), other action cards (3);
  - a hunt (0) ranks below passing (0.5);
  - a block toll is paid on the attempt;
  - never try a block that cannot succeed.

  Compare with our T-classes (`scoreBlock`; block-action-value §3).
- **Range:**
  - give the lethal bonus only to a strike that can reach;
  - value closing the range above opening it;
  - never cache range or round.
- **Table pacing:**
  - pause only after VISIBLE moves;
  - hold 2.5 s before the first bot move of the game (`OPENING_DELAY_MS`, `src/ui/settings.ts`);
  - show "X is deciding…" while a bot works;
  - a visible countdown chip, and a log line (not chat) when it runs out (`docs/pass-timeout-design.md`, `docs/debug-ui-design.md` §10).

  Partly ours already (the beats, Hold on, the panel's countdown).

## Leave
- **One-ply search with a hand-made evaluation:** it lost 1.08 VP.
- **Their diablerie choice:** a fixed score that beats rescue whoever owns the victim. Their engine offers both against any torpored vampire, its own included, and scores diablerie 9 against rescue 5 with no owner check. Read from the code, it would eat its own torpored vampire.
- **Their "referendum decided" flag** (`referendumDecided`, `src/engine/engine.ts`): it counts political cards in OTHER seats' hands as possible votes, so the flag carries hidden information. Their leak test walks card instances and cannot see a flag derived from them.
- **Fixed relation weights as the end state** of a meta layer. They are a start, not a model.

## Johan's playtest checklist (from their playtest lessons + our known weak spots)
- **Readability:** can you read each bot move before the next one? Did a bot move before you had looked at the opening board?
- **Clarity:** does every bot action say the card, target, amount and stealth?
- **Prompts:** count the prompts in a combat and mark the ones you had no way to answer. Do both bots ask the same question?
- **Waits:** were timeouts visible, and did one hit on your own turn or on a mandatory choice? Does "Hold on…" stop both bots?
- **Odd plays:** gifts, wrong targets, votes against their own interest, torpored vampires blocking or voting.
- **The Edge:** does it move after your successful bleed?
- **Timing:** note the time of each annoyance, so it can be found in the log afterwards.
