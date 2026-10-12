# Elysium bot influence planner v2 — design spec

> **STATUS: IMPLEMENTED in bot v0.6.108 (12 Sep 2026).** Shipped as
> `_planInfluence` + `_influenceSchedule` / `_influenceSynergy` / `_simInfluence`
> / `_scorePlan` / `_genOrderings`, wired into `_influenceLoop` in place of
> `_pickRaise` (which is kept, unchanged, for test compatibility).
> Two deltas from the spec below, both deliberate:
> **(1)** `_simInfluence` takes a `cryptN` argument and spends surplus transfers
> on crypt draws (4 transfers + 1 pool) before counting anything as waste — see
> §4 note; the spec's original waste term punished exactly the weenie plans that
> want a fast crypt pipeline (measured: same plan, waste 23 → 3).
> **(2)** The synergy cap (supFit ≤ 2, reactFit ≤ 1.5, so ≤ 3.5 total) means the
> §4 "when synergy flips it" example cannot occur as written — a one-turn tempo
> edge is worth 3.0 and synergy tops out at 3.5. The weights are UNCALIBRATED
> against real play; this is the first thing an arena series should tune.

**Origin:** Johan, 12 Sep 2026. The v0.6.75 `_pickRaise` is a greedy single-vampire
scorer. It picks the best candidate RIGHT NOW but never looks ahead across turns.
The incremental transfer model (same session — `this.inf =` not `+=`, partial blood
placement) makes multi-turn planning both possible and necessary: you're investing
blood one turn at a time, and the ORDER you fill vampires in determines how many
transfers are wasted and how fast you get minions online.

## 1. The three axes (Johan's formulation)

1. **Tempo — how fast do I get a minion acting?**
   A vampire in ready can bleed, hunt, block. One in uncontrolled does nothing.
   The first rise is critical (zero-ready = zero offense + zero defense).

2. **Transfer efficiency — do my transfers fit the math?**
   Seat 1 in a 2-player game gets 1 → 3 → 4 → 4... transfers.
   A cap-4 syncs perfectly with that schedule (1+3 = 4, rises turn 2).
   A cap-6 "wastes" 2 transfers in turn 3 (1+3+4 = 8, but only need 6).
   The planner should prefer combinations where capacities align with the
   cumulative transfer curve.

3. **Synergy — which vampires unlock my hand?**
   Already measured by `supFit` (discipline-gated modes no current ready
   vampire can use) and `reactFit` (defense cards, weighted only at
   zero-ready). A future title axis (Prince/Justicar for political decks)
   belongs here too but is out of scope for v2 (titles are untracked
   bot-wide, same as `_bestBloodStockFor`'s existing exclusion).

## 2. The transfer schedule — known, deterministic

The bot knows its seat, the player count, and its own turn counter.
The VTES rulebook says: "during the first four turns of the game, each
Methuselah receives transfers limited to the number of game turns that
have passed." After game turn 4, every Methuselah gets the full amount.

```
tableTurn(ownTurn) = (ownTurn - 1) * nPlayers + seat
transfers(ownTurn) = min(availInf, min(4, tableTurn(ownTurn)))
```

For seat 1 in a 2-player game:

| ownTurn | tableTurn | transfers |
|--------:|----------:|----------:|
|       1 |         1 |         1 |
|       2 |         3 |         3 |
|       3 |         5 |         4 |
|       4 |         7 |         4 |

Cumulative: **1, 4, 8, 12, 16, ...**

For seat 2 in a 2-player game: **2, 6, 10, 14, ...**

These curves are the bin-packing targets. A vampire's `need` (cap − blood)
must fit into consecutive segments of the curve.

## 3. The simulation — plan over a horizon

### 3.1 Inputs

- `unc[]` — uncontrolled vampires, each with `{name, cap, blood}`
- `schedule[]` — transfer amounts for ownTurn 1..H (horizon, e.g. 6 turns)
- `pool` — current pool
- `poolFloor` — minimum pool to keep (survival)
- `synergyScore(vamp)` — the existing supFit + reactFit score per vampire

### 3.2 Algorithm — greedy-ordered simulation

The planner does NOT need full combinatorial search. The key decision is
the FILL ORDER — which vampire to invest in first, second, etc. With
typically 2–4 candidates, there are at most 4! = 24 orderings; in
practice the bot commits to one at a time and re-plans each turn, so
only the top few orderings matter.

```
function planInfluence(unc, schedule, pool, poolFloor, synergy):
    // Generate candidate orderings (top-K by synergy, pruned)
    candidates = unc.filter(raiseable)
    if candidates.length <= 1: return candidates[0] or null

    // Score a few plausible orderings
    orderings = generateOrderings(candidates, maxOrderings=12)
    bestPlan = null

    for each ordering in orderings:
        plan = simulate(ordering, schedule, pool, poolFloor)
        plan.synScore = synergy(ordering[0])  // first-to-rise synergy
        score = planScore(plan)
        if score > bestPlan.score: bestPlan = { ordering, plan, score }

    return bestPlan.ordering[0]  // invest in this one NOW
```

### 3.3 Simulation of a single ordering

```
function simulate(ordering, schedule, pool, poolFloor):
    rises = []          // [{name, riseTurn}]
    waste = 0           // total unused transfers
    cursor = 0          // index into ordering (current vampire being filled)
    simPool = pool

    for turn = 1..schedule.length:
        transfers = schedule[turn]
        while transfers > 0 and cursor < ordering.length:
            vamp = ordering[cursor]
            need = vamp.cap - vamp.simBlood
            canSpend = min(transfers, need, max(0, simPool - poolFloor))
            if canSpend <= 0: break  // pool floor
            transfers -= canSpend
            simPool -= canSpend
            vamp.simBlood += canSpend
            if vamp.simBlood >= vamp.cap:
                rises.push({name: vamp.name, turn})
                cursor++
        waste += transfers  // leftover this turn

    return { rises, waste, totalTurns: schedule.length }
```

### 3.4 Scoring a plan

```
function planScore(plan):
    // First rise turn is CRITICAL — the primary axis
    firstRise = plan.rises[0] ? plan.rises[0].turn : 99
    secondRise = plan.rises[1] ? plan.rises[1].turn : 99

    // Tempo: earlier is better, diminishing returns after first
    tempoScore = (7 - firstRise) * 3.0      // first rise: heavy weight
                + (7 - secondRise) * 1.0     // second rise: lighter

    // Efficiency: fewer wasted transfers = better
    totalAvail = sum(schedule)
    effScore = (totalAvail - plan.waste) / totalAvail  // 0..1

    // Synergy: from the existing supFit/reactFit scorer
    synScore = plan.synScore                 // 0..~3.5

    return tempoScore + effScore * 2.0 + synScore * 1.5
```

The weights (3.0 / 1.0 / 2.0 / 1.5) are tuning knobs. The priorities:
1. Get the FIRST vampire up as fast as possible (tempo dominates)
2. Don't waste transfers (efficiency is the tiebreaker)
3. Prefer vampires that unlock hand cards (synergy tips equal-tempo ties)

### 3.5 Generating orderings (pruning)

With ≤4 candidates, all permutations are feasible (24 max).
With 5+, prune:
- Always try "cheapest first" and "best synergy first"
- Always try "the one that rises this turn" first (if any)
- Sort remaining by a quick score and try top-3 first positions
- Cap at 12 orderings total

## 4. Worked example

Seat 1, 2-player game. Schedule: [1, 3, 4, 4, 4, 4].
Uncontrolled: Cap-7 "Prince" (supFit=2), Cap-4 "Scout" (supFit=0.5).
Pool = 30, poolFloor = 3.

### Ordering A: Scout (4) → Prince (7)

| Turn | Xfers | Invest          | State                  |
|-----:|------:|:----------------|:-----------------------|
|    1 |     1 | 1 on Scout      | Scout 1/4, Prince 0/7  |
|    2 |     3 | 3 on Scout      | **Scout RISES**, P 0/7 |
|    3 |     4 | 4 on Prince     | Prince 4/7             |
|    4 |     4 | 3 on Prince + 1 | **Prince RISES**, waste 1 |

First rise: **turn 2**. Second rise: turn 4. Waste: 1.
tempoScore = (7−2)×3 + (7−4)×1 = 15+3 = 18
effScore = (1+3+4+4−1)/(1+3+4+4) = 11/12 = 0.92
synScore = 0.5 (Scout's supFit)
**Total = 18 + 0.92×2 + 0.5×1.5 = 20.59**

### Ordering B: Prince (7) → Scout (4)

| Turn | Xfers | Invest          | State                  |
|-----:|------:|:----------------|:-----------------------|
|    1 |     1 | 1 on Prince     | Prince 1/7, Scout 0/4  |
|    2 |     3 | 3 on Prince     | Prince 4/7, Scout 0/4  |
|    3 |     4 | 3 on Prince + 1 | **Prince RISES**, S 1/4 |
|    4 |     4 | 3 on Scout + 1  | **Scout RISES**, waste 1 |

First rise: **turn 3**. Second rise: turn 4. Waste: 1.
tempoScore = (7−3)×3 + (7−4)×1 = 12+3 = 15
effScore = 11/12 = 0.92
synScore = 2.0 (Prince's supFit)
**Total = 15 + 0.92×2 + 2.0×1.5 = 19.84**

**Result: Ordering A wins** (20.59 > 19.84). Even though the Prince has
much better synergy (2.0 vs 0.5), getting ANY vampire online one turn
earlier is worth more. The planner picks the Scout.

### When synergy flips it

If Prince's supFit were 4.0 (hypothetically — lots of Prince-only cards):
Ordering B total = 15 + 1.84 + 4.0×1.5 = **22.84** > 20.59 → Prince first.
The weights let synergy override tempo when it's strong enough.

## 5. Integration into the bot

### 5.1 Where it lives

Replace or enhance `_pickRaise(cands)` with `_planInfluence(cands)`.
The function returns the single best vampire to invest in RIGHT NOW
(same contract as `_pickRaise`). Internally it runs the simulation
and picks the first element of the best ordering.

### 5.2 Re-planning every turn

The plan is recomputed every influence phase — it's not a stored
commitment. This is correct because:
- The hand changes (drawn/discarded cards shift synergy)
- Govern may have pre-stocked blood (changes need)
- A vampire may have been ousted/torpored (changes the candidate set)
- Pool changed (affects what's affordable)

### 5.3 Existing `_influenceLoop` unchanged

The loop already handles incremental investment correctly (the same-session
patch). `_planInfluence` just tells it WHICH vampire to invest in; the loop
handles the mechanics (deduct pool/inf, add blood, rise when full, push).

### 5.4 The `_emit` trace

Emit `'influence-plan'` with the top orderings, their scores, and the
parts breakdown — same spirit as the existing `'influence-pick'` emit,
same consumer (gen-match-dossier, arena traces).

## 6. Horizon and complexity

- **Horizon:** 6 own turns is plenty (by turn 6, cumulative transfers ≥ 20
  regardless of seat; any realistic crypt is fully deployed).
- **Orderings:** at most 24 (4! with 4 candidates), pruned to 12 for 5+.
- **Per simulation:** O(horizon × candidates) ≈ 6 × 4 = 24 steps.
- **Total:** ≤ 12 × 24 = 288 arithmetic steps. Negligible.

## 7. What this does NOT cover (deliberate non-goals)

- **Title synergy**: titles (Prince, Justicar, etc.) are untracked bot-wide.
  When they become tracked (politics engine), add a `titleFit` axis to the
  synergy score — same shape as supFit but checking `req.title` on hand
  cards against the candidate's title in cardfx crypt data.
- **Cross-vampire blood movement** (e.g., moving blood from an uncontrolled
  back to pool to invest elsewhere): legal per the rulebook but rarely
  optimal; out of scope.
- **Govern interaction planning** ("I should hold Govern to stock blood
  next minion phase instead of bleeding with it"): the action scorer's
  existing `grinderReadyTarget` threshold already handles this at the
  minion-phase level; the influence planner just sees the resulting blood.
- **Information Highway / transfer bonuses**: already handled — `availInf`
  includes bonuses from `_phaseAvail('influence')`, and the schedule
  computation uses it.
