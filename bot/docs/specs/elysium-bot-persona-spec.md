> **NAMES (21 Sep 2026, bot v0.6.149, Johan): the levels are now Novice / Experienced / Expert — the toggle is simulated experience. Below, read `grinder` as EXPERIENCED and `shark` as EXPERT. Open for the persona pass: the knobs still mix temperament (`aggression`) into what is named experience.**

# elysium-bot-persona-spec.md — four layers of knowledge, and the persona as which of them are switched on

*Rewritten 18 September 2026 after Johan's four-layer model and his worked example. Status: DRAFT, agreed in conversation; no code. Companions: `elysium-bot-table-model-spec.md` (layer 2's data), `elysium-bot-block-doctrine.md` §4.1 (the B2 list this reorders). Supersedes the 17 Sep draft (information / bias / noise as three separate filters) — those three survive here as consequences of the layers, not as a mechanism of their own.*

---

## 0. The example (Johan, 18 Sep) — read this first

My prey has 6 pool and no vampires up. I have one vampire in play with superior Dominate, Govern the Unaligned and Conditioning in hand, a +2 stealth card, a Deflection and a Villein. My own pool is not great.

The obvious play: bleed for 6 with Conditioning and the stealth card — pool and a VP now.

But the table so far says: my prey blocks a lot, average intercept 2, and has shown bounce — and decks of that shape usually run 7–8 bounce. The locked vampires almost certainly sit on a wake and an intercept. My predator is a political deck that has passed every referendum with a cross-table ally's votes, and both of them see my deck as the long-term problem. If I get no pool back before my next turn, I am probably ousted.

Govern at superior is a +1 stealth action: 3 stealth against intercept 2, likely through, and it banks 3 blood on an uncontrolled vampire. Next influence phase that vampire comes up for free; Villein refills my pool; I have two minions, and the lunge — when it comes — has redundancy.

Same cards, same table. "Bleed for 6 now" and "fix my blood economy because the lunge probably fails and failing gets me ousted" are two different players. This spec is about which player the bot is, and why.

## 1. Four layers of knowledge (Johan's model)

| # | layer | the sentence | knows | today | becomes |
|---|---|---|---|---|---|
| 1 | **own deck** | *"Såhär spelar jag min lek"* | what my cards do together, influence order, the deck's strategy, goals and lines | cardfx reads of own cards, the influence planner, `DECK_STRATEGY` texts (unread by code) | playbooks per deck: opening book, influence order, named LINES (§3), phase transitions |
| 2 | **cards & archetypes** | *"Det här kan stå i vägen"* | what opponents' decks contain and do; the statistics of what they have shown | the table model `opp[seat]`, `readP`, `_oppPrior` | + the TWDA archetype baseline as prior; the per-minion / per-seat statistics |
| 3 | **meta** | *"Det här behöver jag göra för att vinna"* | threat and board assessment, who is the problem, table politics — strictly apart from the mechanics | `_tableThreat`, lunge arithmetic, role weights, threat classes | the game-phase variable, target choice, the political forecast (§5), later deals and table talk in the chat tier |
| 4 | **experience** | *"Hur ofta gör jag fel"* | which of the layers above I actually use, and how reliably I execute | the four multipliers (`aggression`, `blockShy`, `insight`, `bareBlock`) | the persona (§2) |

**Authority order when the layers disagree: 3 > 1 > 2.** The meta sets the goal ("survive the next round with the lunge threat intact"), the own-deck layer says how this deck reaches it (the Govern line), the archetype layer says what can go wrong (P(block) with 2 stealth ≈ high, bounce likely). Layer 2 never decides; it prices. In the example: L3's goal + L2's odds make the lunge's EV negative, and L1 has a line that meets L3's goal. Govern.

**One emit per layer.** Every decision writes `L1:`, `L2:`, `L3:` lines into the trace (`why` becomes structured), so the dossier can attribute a mistake to the layer that lacked or mis-weighed the information — and the shark reference (§4) can say *"novice lacked L3 here"*, not just *"a shark would have blocked"*.

## 2. The persona = which layers are on, and how far ahead they look

| | novice | grinder | shark |
|---|---|---|---|
| L1 own deck | full | full | full |
| L2 archetypes | prior only (disciplines, clan, weapons) — never the observed statistics | full | full |
| L3 meta | **off** — own prey and own predator only, no target choice, no phase | partial: prey + predator, the phase variable, no cross-table politics | full, including the political forecast and, later, deals |
| planning horizon (§3) | 1 turn — re-decides from scratch every turn | 2 turns — one line, own steps only; the predator's next turn as a forecast | 3+ turns — up to three candidate lines with EV, replanned every turn, the table's likely moves in between |
| execution reliability | forgets: an ability on a vampire in play, a card's timing, a reaction it holds (§2.1) | rarely | never |

That is Johan's description made mechanical: *novice is focused on itself and its own deck; grinder knows its deck well but has tunnel vision about the table; shark has full view including the meta.* The differences are what each persona can SEE and how far it PLANS — not multipliers on scores. Run the example through it:

- **novice** (L3 off, L2 prior only): sees 6 pool, a DOM vampire, Conditioning. *"Bleed for 6."* — the correct decision given what it sees, and exactly the mistake a beginner makes.
- **grinder** (L2 on, L3 partial): sees the block rate; plays the stealth card and probably lunges anyway, or governs without knowing why — the *"my predator ousts me next round"* is L3 and mostly missing, so the choice is a card question, not a survival question.
- **shark**: Govern, with the whole reasoning.

Three different games from one decision basis, with no bias list and no dice.

### 2.1 Execution reliability (the small remainder of "error")
The one place a persona *adds* rather than removes: a novice sometimes mis-handles a layer it has. Named, few, each the error it models, each tested: `forgetsAbility` (a printed ability on a ready vampire is not read this turn), `mistimesCard` (holds a reaction one window too long / plays a modifier one window too early), `trustsWrongNumber` (uses the prior where the observed statistic exists — the grinder's version of a novice error). Probability novice 0.1, grinder 0.03, shark 0; seeded from the bot's seed (the arena `--seed` reaches it), every slip emitted (`slip: {layer, what}`). If a persona's error rate depends on this, §2 is wrong — this is garnish.

Legality is never touched: novice plays badly, never illegally.

## 3. The plan memory — committed lines with replanning

What Johan called "bottminnet för viktade planeringsscenarier": not a search, a **line the bot carries across turns and re-checks**.

```js
this.plan = {
  goal:        'survive next round, keep the lunge threat',   // from L3
  line:        ['Govern (3 blood on X, stealth 3)', 'influence X for free', 'Villein on X', 'lunge with two minions'],   // from L1
  step:        0,
  horizon:     3,                                              // persona
  assumptions: { 'prey keeps 2 intercept up': true, 'predator keeps voting me': true },   // from L2/L3, re-checked each turn
  ev:          +2.4,
  alternatives: [ { line: ['bleed 6 with Conditioning + stealth'], ev: -1.8, why: 'P(through) 0.3' } ],   // shark keeps up to three
  revisedAt:   turn
};
```

- **Every turn**: re-check `assumptions` against the table model; if one fails, re-score the candidate lines and switch. The switch is spoken: *"prey got a third blocker up — the Govern line loses its assumption; stabilising instead."* That is the most human thing the bot can say at a table.
- **L1's playbooks ARE pre-written lines** (the opening book = the first turns' line per deck), so layer 1 and the plan memory share one structure.
- **Horizon is the persona's clearest dial**: novice `horizon 1` keeps no plan (the object is rebuilt every turn); grinder keeps one line of own steps; shark keeps the alternatives and the table's expected moves.
- No rollouts, no tree: three named lines with an EV each, compared. The bot stays explainable.

## 4. Shark as the reference

Shark = all four layers, horizon 3+, no slips. Therefore:
- a `ref` emit on every non-shark decision: `{pick, sharkPick, delta, missingLayer}` — the dossier grades novice and grinder against shark, per layer.
- a persona's error rate is a measured number (share of decisions where pick ≠ sharkPick; mean Δ), calibrated in the arena on identical seats and seeds (`--seed`).
- when shark plays badly, the fault is in layers 1–3, never in a persona knob.

## 5. What has to exist before this ships (and in which order)

1. **The strategy layer = L3 as code**: the game-phase variable (V5 ark: build → three vampires: bleed → three Methuselahs: lunge/oust order), posture, target — a `plan.goal` the tactics read. **Includes the political forecast now, from the ask ladder** (Johan, 18 Sep): the number answered to "how much pool?" on a political action is an observation, so `opp[seat].politics = {called, passed, dmgToMe[]}` feeds `oppForecast` a `passRate × avgDmgToMe` term for a voting seat. The politics system (after blocks and combat) later *adds predictions before the announce*; it replaces the source, not the reader.
2. **Lines in L1**: playbooks per deck as named multi-turn lines; the opening book as the first line. The tactics score a *step of a line*, not a lone action.
3. **The plan memory (§3)** with horizon as a persona field. Shark-only first: behaviour must match today's where the four multipliers were 1.0 (suite proves it).
4. **Layer switches for novice and grinder** (§2) + the `ref` emit. Arena: novice vs shark on identical seeds; the dossier's first per-layer Δ table.
5. **Execution slips** (§2.1), last, small.

The four multipliers dissolve on the way: `aggression` → the phase sets pressure; `blockShy` → the persona's L2/L3 view (a novice that cannot see the forecast is cautious by ignorance, not by a divisor); `insight` → the layer switches; `bareBlock` → L2 (novice assumes 1 damage, so it bare-blocks *more* than today, and wrongly — which is right); `thinkMs` → removed.

## 6. Decided with Johan (17–18 Sep)
- Three personas are enough; variety comes from richer decks. Novice = self-focused, grinder = knows its deck but tunnel-visioned on the table, shark = full view including meta.
- No MCTS / search. Explainability is the product.
- The politics leg comes after blocks and combat; until then the ask ladder is L3's political source.
- The planning horizon is part of the persona; the plan memory holds weighted candidate lines, re-checked each turn.

## 8. Bluffing — a development point, not for now (Johan, 18 Sep)

A bluff is a behaviour that runs against the statistically or logically best action, taken so that the *opponent's* model draws the wrong conclusion: a wall deck leaves a vampire unlocked with no intercept and no combat card in hand, so that I fear the block and never take the action. Two sides for the bot, both later:

- **Reading a bluff** (L2/L3): the table model records what a seat *shows* (unlocked bodies, intercept seen) and what actually *happened* (blocks attempted, blocks made). A seat whose posture repeatedly promises a block that never comes gets a `bluffRate`, and `oppStealth`/the block odds discount its threats accordingly. Every read bluff is logged (`bluff-read: {seat, promised, delivered}`) so the dossier can grade it. This also guards the shark against the "farm the shark by looking like a wall" exploit (§9 of the 18 Sep review).
- **Making a bluff** (L3, and a persona question): when the theoretical payoff of the opponent *not* acting is high (a lunge I cannot stop, a rush I cannot survive), L3 may choose the posture that threatens without the cards — keep a body unlocked, decline to hunt. Only shark; only when the plan memory's EV says the bait beats the honest line; always logged as `bluff-made` so the arena can measure whether opponents took it.

The many other things one can bluff about (hand size, a held reaction, a "deal") belong with the politics leg. Until then the normal flow has to sit first; this section is the placeholder so the plan memory and the table model leave room for it (a `bluffRate` field, a `posture` that can be chosen against EV).

## 7. Open
- How bad should a *human-facing* novice be at a training table? A `horizon`/layer override per bot option would let a table choose.
- The `ref` grading needs shark's decision computed even when a novice is playing — same basis, filtered twice — cost is one extra scoring pass per decision (cheap).
- Table talk for line switches: which of the three tiers (say / chat / log)? Chat, probably — it is what a human says aloud.
