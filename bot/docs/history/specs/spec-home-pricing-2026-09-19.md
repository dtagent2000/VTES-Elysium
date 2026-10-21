# Spec — the home quota priced per body + the act-again weighting (release 2 of 2)
**19 September 2026 · proposal, NOTHING BUILT · bot v0.6.136 is the base · owner: Bots · awaits Johan's "kör"**

## 1. Why
Measured on 24 balanced matches (bal1 + bal2): `plan.home` was 0 at 168 of 172 nosferatu unlocks (malkavian 181 of 186); nosferatu ended 67 block
windows with *no unlocked body*. Two gates cause it:
1. `_homeQuota()` gives a design quota only to the **grinding** posture (tremere, ventrue). Nosferatu is **disabling** → 0.
2. The priced defence (v0.6.119b) starts only when `myTto <= 3` **and** one more body at home buys a **whole predator turn**.
Gate 2 exists for a reason: the first cut (v0.6.119) priced EV per body and held the RACING sewer deck home against a swarm that killed it on the same
turn anyway (use 89 → 70 %, through 44 → 25). That lesson stays.

Johan's rulings this release implements: the home quota follows the HAND and the STATISTICS (a wake in hand frees a body; a bleed of 1 is barely worth
a lost block, yet the prey's pool must still come down — a weight, not a ban) · Freak Drive with no action left is weighed: save for a lunge > the value
of an unlocked body (bounce / Second Tradition in hand × how often and how hard the predator attacks; wake + Freak Drive = two blocks) > de-clogging ·
the level may differ per bot / appetite — measure both · **no regression against the original outcomes.**

## 2. The three layers
### 2.1 Statistics (every bot) — two reads, no decisions
- `predHits()` → the predator's ready minions' EXPECTED hits, sorted descending: per minion `avg bleed × hit rate` (the forecast's own terms; unseen = prior).
- `myThrough()` → the share of my offensive actions that got through (table model: mine blocked / mine offensive; prior 0.75).

### 2.2 General (the strategy layer, `_strategize`) — pricing per body
For every ready body `v` with blood:
- **stay(v, k)** = pool I expect to keep if `v` is the k-th body at home = `pStop(v) × predHits[k]`, where `pStop` = the plan's block odds
  `clamp(0.5 + 0.35 × (intercept_v − predator stealth), 0.05, 0.9)`; **+ a bounce in hand** makes the FIRST stayer's stop `max(pStop, 0.9)` (a bounce needs an unlocked body).
- **Wakes in hand** fill the first slots (v0.6.120's rule, kept): with `w` wakes the first `w` predator hits are already covered by locked bodies → `stay(v, k)` is priced from slot `w + 1`.
- **act(v)** = the pool-equivalent of `v`'s best action this turn = `n × myThrough()` for a bleed / pool-damage / referendum-on-prey (n = pool the prey loses; +pool I gain), `1.0` for a permanent or a stock (economy is worth about a pool), `0` when the only legal action is nothing, the hunt excluded (a hunting body is not a candidate).
- **Exchange rate:** a pool saved is not a pool dealt. The plan already carries it: `wDef = 1 / myTto`, `wOff = 1 / preyTto`.
- **v stays when** `stay × wDef × homeWeight > act × wOff`, bodies taken in order of the largest margin, at most `min(predator's ready minions, my bodies − 1)` — never the whole bench.

**Which decks price, which keep the old gate (the regression guard):**
| posture | decks today | rule |
|---|---|---|
| resisting (race / swarm) | sewer, hacking, malkavian | UNCHANGED: v0.6.119b — only when `myTto <= 3` and a body buys a whole predator turn |
| grinding | tremere, ventrue | design quota as today (floor) **+** per-body pricing on top |
| disabling | nosferatu | per-body pricing (its quota was 0) |
| any | — | at or under `_critPool().crit` the pricing applies to EVERY posture (the edge is where a block is worth most) — scaled by `critRisk` |
Unchanged everywhere: a lunge sends everything forward · prey at <= 4 pool: nobody stays · a 0-blood body hunts · the last-body rule of `_keepBlocker`.

### 2.3 General — `decide('act-again')` (Freak Drive class)
Today: play whenever 1+ blood is left. New, in Johan's order:
1. **A legal, worthwhile action is left** → as today (play).
2. **No action left — save for the lunge?** If the prey is within 2 of my turns AND the hand holds a bleed card + a political for this vampire's kind of turn → HOLD (the card is worth a double action then).
3. **The unlocked body:** value = `stay(v, k)` for the next uncovered predator hit (k counts bodies already home AND wakes in hand — so wake + Freak Drive prices the SECOND block, which is smaller but real). Play when `stay × wDef >= 0.35 + 0.1 × blood cost` (the bot's standing card + blood prices).
4. **De-clog:** no offensive action and no reaction in hand → play (cycle), if 1+ blood is left.
Trace: `why` names the branch; `scores.unlockValue`.

### 2.4 Persona
None. `homeWeight` (1; **0 = the original** — per-body pricing off, act-again as today) and `critRisk` (release 1) are the two appetites; a persona or deck may carry its own later.

## 3. Edge cases decided here
- A body whose best action is a **permanent under `permFirst`** still prices `act = 1.0`: early, `wDef` is tiny (myTto large) and it builds; late it stays. No special case.
- **Hold vs race flip-flop:** the plan is rebuilt at unlock only (as today), so a body kept home stays kept for the turn.
- **Two-player endgame:** the predator is the prey; `predHits` and the through rate read the same seat — no change needed.
- **Unknown predator (turn 1–2):** priors only → `stay` is small, `wDef` tiny → nobody stays. Intended.
- **Tremere** (already holds 1–3): pricing can only ADD bodies above its quota when the margin is positive; watch its through-damage for a regression.

## 4. Measurement — paired, balanced, pre-registered
Balanced design (6 cyclic orders × 2, `--fixed-seats`, every deck starts 3 times), NEW seeds 7001–7012, all shark, three runs on the SAME seeds:
| run | knobs | purpose |
|---|---|---|
| A `serie-home-ctl` | `homeWeight=0` | **the original on these seeds — the regression baseline Johan asked for** |
| B `serie-home1` | defaults (`homeWeight 1`, `critRisk 1`) | the change |
| C `serie-home-r0` | `homeWeight 1`, `critRisk=0` | Johan's 'measure both' |
Predictions are registered before run A. Decision level: `plan.home` per deck · 'no unlocked body' windows · blocks made · pool damage dealt (the
price of staying home) · act-again branches · median oust turn. Result level, pooled with bal1 / bal2 for scale: VP per match per deck.
**Regression rule:** a deck whose pool damage dealt falls by more than 20 % while its median oust turn does not rise is a regression for that deck →
its posture goes back to the old gate. 36 matches ≈ three sessions in this sandbox (one match per call, detached + polled).

## 5. Not in this release
The rush priced in pool (CLAUDE.md 31c) · nosferatu's Fame → torpor → rescue endgame · weenie decks' deck-fit series (35c) · a per-persona `critRisk`.
