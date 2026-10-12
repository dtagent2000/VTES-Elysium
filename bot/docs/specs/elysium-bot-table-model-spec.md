# elysium-bot-table-model-spec.md — the per-opponent table model (B2's foundation)

*Drafted 17 September 2026 after B2's null point (`serie-5p30/match-1-mu5fgte0.jsonl`: the sewer prey never blocked a stealth-0 weenie bleeder in 11 windows). Johan's framing: "a block can be dangerous depending on the opponent's clan and what they have revealed so far — Nosferatu combat, say." This spec turns that into one record per opponent, read by every decision that today guesses. Status: SHIPPED as v0.6.118 (17 Sep 2026) with Johan's three answers and the two forecast reads (§4) folded in; §8 closed.*

---

## 0. One paragraph

The bot already knows most of what a careful human knows about each opponent — but in six different fields, read by six different functions, and with the combat half missing entirely. `this.opp[seat]` consolidates what the table has SHOWN (crypt cards in play with clan and disciplines, every face-up library card and its fx keys, stealth/intercept/bounce/votes actually used, combat outcomes) into one record with a handful of derived reads: **combat danger**, **stealth expectation**, **archetype axes**, **posture**. Nothing in it is guessed from hidden information; nothing persists between matches. B2's first tactical changes (the bare block, desperation before the intercept return, keep-a-blocker-unlocked) are then written against these reads instead of against constants.

## 1. Principles

1. **Public information only.** The record is fed from what any seat at the table can see: the pub boards (`this.table[seat].pub` — ready/torpor crypt cards, in-play library cards, **the ash heap**, pool, edge, hand COUNT), the face-up fx clones (`_onFx`), the frozen §12 log lines (`_onLog` / `L12.*`), tally writes and verdicts. Hand contents never enter it — `handIntel` (Revelations / open hand) stays its own, separately-sourced ground truth and `_pCat` keeps overriding, exactly as today.
2. **Observed, never assumed.** A field is a count of things seen, or a derived number computed only from counts. No entry is ever seeded from a deck list, a TWDA match or the bot's own manifest. (Priors are §7's open question, not this spec.)
3. **One record, one writer per field.** Every field names its writer below; a reader never writes.
4. **Match-scoped.** Created at `dealt`, cleared with `this.table` and `this.reads` on a fresh deal. Nothing on disk.
5. **The existing `reads[seat].seen` is absorbed, not duplicated.** `readP()` keeps its signature and reads `opp[seat].seen`; `_noteObserved` becomes the library-card writer of the new record.

## 2. The record

```js
this.opp[seat] = {
  // crypt — from the pub board (writer: _onBoard, every push)
  vamps: { [name]: { clan, cap, disc: {all, sup}, zone, blood, locked, seenTurn } },
  clans: { [clan]: n },                    // distinct ready+torpor vampires per clan
  disc:  { [tri]: { inf: n, sup: n } },    // discipline coverage across their minions (sup counted separately)
  readyN, torporN, uncN, pool, edge, handN, // snapshot fields (last push)

  // library — from fx clones, ash heap, in-play cards, L12 play lines (writer: _noteObserved + _onBoard ash diff)
  seen: { bounce, stealth, intercept, votes,          // TODAY's four (readP keeps working)
          strike, press, dodge, maneuver, aggr, prevent, combatEnds, addStrike, stealBlood,   // combat family (fx keys, cardfx vocabulary)
          bleedMod, rush, wake, income, retainer, equip, ally },                              // rest of the vocabulary as needed by readers
  cards: { [name]: n },                    // every distinct library card seen face-up, with count (the ash heap is public: this is the authoritative floor)
  ash: n,                                  // ash-heap size (pub), for "how much have they cycled"

  // behaviour — from announces, tallies and verdicts (writer: the L12 handlers that already parse them)
  stealthUsed: [ ... ],                    // announced stealth per directed action (a>0 writes), capped list
  stealthMax, stealthAvg,                  // derived
  interceptUsed: n, blocksMade: n, blocksTried: n,    // their blocks against ANYONE (the Block! / verdict lines carry the blocker)
  bleeds: { n, total, max },               // their bleed announces (amount = the tally after modifiers)
  votesCalled: n,
  combats: { n, won: n, lost: n, torporsInflicted: n, torporsSuffered: n },   // outcomes from the combat hand-off + torpor lines

  // derived reads (computed on demand, never stored stale)
};
```

Everything above is either already parsed somewhere in the bot or sits in the pub push. The new WORK is the aggregation and the combat family in `_cats`.

## 3. Writers (where each field is fed)

| field group | writer | exists today? |
|---|---|---|
| `vamps`, `clans`, `disc`, snapshot fields | `_onBoard(m)` — after the pub is stored (`this.table[m.seat]`), walk `pub.cards` crypt entries through `fxLookup` (cardfx `crypt` entries carry `clan`, `cap`, `disc.all/sup`) | pub is stored; the walk is new |
| `seen.*` (library categories), `cards` | `_noteObserved(seat, name)` — extend `_cats()` from 4 to the full fx vocabulary; called from `_onFx` (face-up clones) and `_threatNote` (fresh in-play cards) as today, PLUS the **ash-heap diff** in `_onBoard` (cards entering `zone:'ash'` are the one source that never misses a play) | partly (4 categories, no ash diff) |
| `stealthUsed`, `bleeds` | the announce handlers (`L12.actObs` + the tally read that follows an announce) — the `a` written by the actor is the announced stealth | the values are read for the block decision today; not remembered |
| `blocksTried/Made`, `interceptUsed` | `_onBlockAttempt` / the §12 verdict handler (`L12.block`) / `NAME blocks.` | parsed today; not remembered |
| `combats` | the combat hand-off end (`_resolveCombat` on both sides) + `L12.torpor` | outcomes are emitted (`torpor`, `recover`); not remembered per opponent |

## 4. Derived reads — and which decisions move onto them

- **`oppCombat(seat)` → 0..1, "how dangerous is it to be in combat with this seat's minions".** Inputs: `seen.strike/press/aggr/addStrike/maneuver` counts (weighted, capped), `disc` coverage of pot/cel/for/ani/pro/thn/qui (combat disciplines, sup counted double), attached equipment on their vampires (`vamps[].att` — weapons are public), `combats.won/torporsInflicted`. A Nosferatu antitribu with pot+ani and Carrion Crows in ash scores high on turn 3 without ever having fought.
  **Reader:** `combatFit` in `decide('block-as-target')` (line ~3132) — today it reads MY posture only. New: `combatFit × (1 − 0.6 × oppCombat(actorSeat))` with a chump-body exception (a cap ≤ 2 blocker at blood 1 has little to lose — doctrine §3.3). Also the rush-back / rush-forward weights (`_bestRushFor` scoring) — rushing a combat deck is a different bet.
- **`oppStealth(seat)` → expected stealth on a directed action.** Inputs: `stealthUsed` history (avg/max), `seen.stealth`, obf coverage in `disc`. **Reader:** the bare-block decision (§3.3): a bare block is attempted when `stealthA === 0` AND `oppStealth(seat)` is low enough that a stealth answer is unlikely — this is the "probe block then bounce" gate too.
- **`oppAxes(seat)` → the same axis vocabulary as `_deckAxes()` (bleed / stealth-bleed / wall / bounce / combat / rush-control / vote / …), inferred from `seen` + `disc` + `bleeds`.** This is the fx-key archetype signature — 80 % of "which deck is this" after three or four cards, no TWDA needed. **Readers:** `_tableThreat(seat)` (today: ready count + pool deficit only — a 3-vampire vote deck and a 3-vampire wall are the same threat to it), the T-class weights `W[...]` per actor axis, and the B2 posture rule below.
- **`oppPosture(seat)`** — the opponent's version of `_posture()` (disabling / grinding / resisting), from `oppAxes`. **Reader:** the T3 weight already keys on posture; it should key on the ACTOR's, which is what the doctrine (§2.2) meant.
- **`predatorIsBleeder()`** — `oppAxes(predSeat)` includes bleed/stealth-bleed OR `bleeds.n ≥ 2`. **Reader (new, B2 posture):** the minion loop leaves one unlocked body when true and the pool is below a persona threshold — the "keep a blocker" rule the null point lacked (Grinder locked both at pool 6).

### 4b. The two statistical reads Johan asked for (17 Sep), and the prior slot
- **`oppForecast(seat)`** — pool damage the seat's READY minions can deal next turn (all ready ones: they unlock before their turn — the first b2s1 run counted only unlocked and read 99 on the bot's own turn): per minion `avgBleed × hitRate` from the L12 announce/verdict ledger; a minion with no history takes the seat average, then the prior (`1 + bleed-discipline coverage`). **`turnsToOust(seat)`** = `pool / (forecast × (1 + oustRange))`, `oustRange = max(0, 8 − pool) × 0.25` — the 6–8 window where a predator prioritises pool damage.
- **`oppCombatCost(seat, blocker)`** — pool-equivalents lost if a block SUCCEEDS: `min(dmg, blood) + P(torpor) × 3`, `dmg` = prior (combat disciplines, weapons) blended with the damage that seat actually dealt me, `P(torpor) = clamp((dmg − blood + 1)/3)`.
- **`_oppPrior(seat)`** — the slot: today disciplines + weapons + clan; later Johan's archetype baseline from TWDA (crypt profile + first masters + ash, including discards). Every read blends `prior × k/(k+n) + observed × n/(k+n)`, so a better prior needs no reader change.

## 5. The three B2 tactical changes written against the model (same release, v0.6.118)

1. **Bare block — as EV (Johan, 17 Sep).** In `block-as-target`, when `icp <= 0` and `stealthA === 0` and an unlocked body exists: `gain = amount + 0.5` (the tempo), `cost = oppCombatCost(actor, body)`, block when `gain − cost ≥ margin` (novice 1.0 / grinder 0.5 / shark 0). Knob `bareBlock: off | chump | any` (novice / grinder / shark) gates the DISCRETIONARY case; `chump` is danger-aware — against a seat with `oppCombat < 0.3` any body qualifies, otherwise cap ≤ 2 with blood ≥ 1. **Desperation** (`turnsToOust ≤ 1`) overrides the knob and the margin for every persona.
2. **Desperation before the return.** `urgency` (already computed: `0.6 + min(1.4, amount / pool)`) moves above the intercept return so a pool-4 prey with an unlocked body weighs the block even without intercept. Below `poolFloor`, `urgency` alone can carry a bare block.
3. **Keep a blocker.** In the minion loop, when `predatorIsBleeder()` and `turnsToOust ≤` the persona limit (novice 2.5 / grinder 2 / shark 1.2): the LAST unlocked ready minion stays home — unless the prey is at lunge range (pool ≤ 4: the oust beats the wall) or the minion must hunt (0 blood).

All three read the model; none reads a card name or a deck name.

## 6. Tests and the registered prediction

- **Suite section 92 (`diag-92.js` standalone):** (a) `_onBoard` builds `opp[seat].vamps/clans/disc` from a pub with two crypt cards (Nosferatu pot/ani) — `oppCombat` > 0.4 with an empty ash; (b) ash diff feeds `seen.strike` and `cards`; (c) `oppStealth` from three announces; (d) `oppAxes` classifies a hacking-like history as bleed and a sewer-like one as stealth-bleed; (e) bare block: stealth 0 + unlocked Skulk + no intercept → block (grinder), no block (novice), and NOT when `oppCombat` is high with a non-chump body; (f) urgency at pool 3 vs bleed 2 carries the bare block; (g) keep-a-blocker leaves one minion unlocked at pool 6 vs a bleeder predator.
- **Destructive:** 92a–d throw on v0.6.117 (new methods); 92e–g fail gracefully (fixtures use the existing `decide`).
- **Arena (doctrine §6):** rerun the null-point recipe ×3 (same seats). Prediction: hacking's prey survives past round 6 in ≥2 of 3; the prey's T1 block rate rises from 0/11 to > 30 %; hacking's oust tempo (rounds to first oust) is the control — it should lengthen, not the VP sum shrink to zero. The price referee must read 0 mismatch on every match.

## 7. Explicitly NOT in this spec (Johan's list, decided)

- **TWDA matching** — later, and only as a prior for turns 1–2 (clan + disciplines → archetype probabilities) once the model exists to receive it. Not a matching engine.
- **Cross-match memory** (a file per player) — no. Player meta (§2.7) is a separate, later question.
- **Hand guessing** — `readP`/`_pCat` stay the only inference; the model records what was shown.

## 8. Johan's answers (17 Sep) — closed
1. Persona knob as proposed; it gates only the bare block, all personas keep the full intercept logic; desperation overrides.
2. Equipment counts (164 auto-tier equipment entries carry strike/aggr/maneuver/stealth keys).
3. Thresholds are statistics, not constants: the per-minion forecast and the combat-consequence EV above.

## 9. First measurement (serie-b2s1, 3 matches, the null-point recipe)
Sewer prey T1 block rate 3/14, 4/14, 1/10 (was 0/11); 10 of 14 windows still "no unlocked body" — the sewer deck bleeds with everyone and keep-a-blocker only holds the LAST body when tto ≤ 2. Matches 7/7/6 rounds (was 6); hacking swept 5 VP in 1 of 3 (was 1 of 1), nosferatu Shark-2 won 2. The sewer prey still went first in all three. Prediction: block rate up but under 30 %, survival not past round 6. Next calibration: the forecast under-reads a weenie swarm (tto 1.43 → 0.64 in one predator turn) — per-minion hit rate 0.8 default is too kind, and the swarm's +bleed modifiers are not in the ledger.

## 9b. CORRECTION (17 Sep, late) — §9 and §10 were read per bot NAME; names follow persona order and swap decks between matches. Per DECK (from the manifest): hacking won all 6 matches (5 VP each); nosferatu never won and blocks the most (52 %/46 % of T1 windows); sewer went first out in all 6; the sewer quota anomaly was Grinder=tremere in match 3. Bleed-through per series: hacking 114/99, nosferatu 30/38, malkavian 24/7, tremere 19/20, sewer 12/19. The conclusion stands and sharpens: the slow decks lose on offence, and hacking's sweep is 6/6, not 1/3.

## 10. Second measurement (serie-b2s2, v0.6.118b THE HOME QUOTA)
A grinding deck keeps 1 body home by design (2 at ≥ 4 ready); acting order puts the worst blocker first so the body kept is the one worth keeping. Tremere: "no unlocked body" 27 → 13 of its T1 windows, block rate 21 → 28 %, 7 quota-keeps. Sewer/hacking/malkavian unchanged as intended (racing decks). Results 6/7/6 rounds; sewer or tremere still first out; hacking swept once, nosferatu twice. **The reading that matters:** bleed-through per series — hacking 57, nosferatu 80, versus sewer 21, tremere 18, malkavian 7. The three slower decks lose because they apply no pressure, not because they cannot block: B2's next step is offence (opening book, per-deck playbooks, the game-phase variable), and the forecast calibration rides along. Anomaly to check: 3 quota-keeps were logged for the sewer bot, whose axes should give no quota.

## (old) 8. Open questions for Johan

1. `bareBlock` defaults per persona: novice off / grinder chump / shark any — or grinder any too?
2. Should `oppCombat` count **equipment** on their ready vampires (weapons are public and cheap to read) in v1, or leave to v2?
3. Keep-a-blocker threshold: `2 × poolFloor` (6 at the default floor 3) — or persona-only?
