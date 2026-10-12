# Elysium Bot — Strategy & Training Roadmap (living brainstorm doc)

> **Created 16 July 2026** against bot v0.5.7 / cardfx v1.4.2 (fxv 1) / client v2.6.41 / server v2.6.16.
> **Status: DISCUSSION.** Nothing in here is committed work — anything promoted to a real task moves
> to `elysium-bot-training-backlog.md` — the track's own backlog — and ships through the normal ritual (`elysium-backlog.md` just points there). This doc exists so the "how do the
> bots get GOOD?" thinking has a home that isn't the implementation spec.
> Companion docs: `elysium-bot-spec.md` (implementation status/roadmap), `elysium-cardfx-design.md`
> (schema), `cardfx-persistent-lock-design-decisions.md` (§8 vocabulary-follows-the-consumer),
> `ELYSIUM-PROTOCOL.md` (§12 bot contract), `elysium-backlog.md` (priorities).
> Tooling introduced with this doc: **`gen-deck-coverage.js`** — see §2.3.

---

## 1. The goal ladder (Johan, 16 July 2026)

Card-by-card least-common-denominator tagging + qualitative database sweeps **until four working
bots with distinct archetype decks exist**. THEN go deep: per-persona strategy and tactics, and
possibly table talk / the table-political game. This doc's job is to (a) sanity-check that plan,
(b) digest the Discord ML thread honestly, and (c) lay out the practical training ladder.

## 2. Verdict on the current methodology

### 2.1 Why the three-tier model is right
VTES's effect space is **compositional**: 4149 cards, but ~25 `fx` primitives already cover 1621
of 2364 library entries at the auto tier. The three-tier ladder (auto pattern-compilation →
curated JSON → bespoke `CARD_HANDLERS`) matches the actual distribution of card complexity, and
the sweep-audit culture has caught real edge cases sampling never would (the Deflection /
Devil-Channel lock mirror; the Gift of Sleep negation-wins miss). Nothing in the ML discussion
below invalidates any of this — see §3.1 for why it is the *prerequisite* for every future,
including the deep-learning one.

### 2.2 The one discipline to keep
**Deck-driven depth, never database completionism.** The auto sweep over the full DB is a
compiler run — effectively free. Curation and handlers are *budgeted work* and should be spent
strictly on (a) cards the four archetype decks contain, and (b) cards the bots must *react* to
correctly when opponents play them. "Done" for the tagging era = "the four archetype decks are
playable", not "X% of the database is curated". Audit ceremony scales with how load-bearing the
tag is for decisions (persistent/lock earned the full 525-row table; not every future tag will).

### 2.3 The instrument: `gen-deck-coverage.js` (shipped with this doc)
Makes "can the bot play this deck?" a mechanical check. For a playbook it reports, per card:
knowledge tier (auto/curated/handler), whether any mode carries an fx key the bot's play paths
*actually read* (the consumed set is **scanned out of `elysium-bot.js`'s source at runtime**, not
hand-maintained — it cannot drift), and whether any vampire in the deck's own crypt meets the
discipline gates. Verdict ladder: HANDLER / FULL / PARTIAL / UNREACHABLE / TABLED-ONLY / INERT /
NAME-ONLY / UNRESOLVED. Output: qty-weighted summary + a self-prioritizing curation queue.

**First run (the bot's own DEFAULT_DECK, 62 library copies): 69% automated, 31% dead.** Two
genuine findings on the very first execution:
- **Dodge ×10 is INERT** — combat v1 reads `fx.strike`/`fx.prevent` only; `fx.dodge` is read
  nowhere in the bot. A sixth of the default deck is dead weight in the bot's own hands.
- **Leverage ×9 is INERT** — `bleed` without `bleedAct` is a +bleed action *modifier*, and the
  attacker-side modifier window is exactly the already-parked "step 2" from the bounce-fix
  session (14 July). The coverage report independently rediscovered the top of the bot roadmap.
This is the tool working as intended: coverage gaps converge with the roadmap, quantified.

## 3. The ML question (the Discord thread, digested honestly)

### 3.1 The false dichotomy: "tag cards by hand" vs "train a DLM"
Zero-family agents do not learn *rules*. AlphaZero was handed a perfect, fast simulator and
learned *policy*. For VTES, **building that simulator is the overwhelming majority of the work**
— and a simulator needs machine-readable card semantics. The cardfx library IS that substrate.
The thread's own admission ("building the cohesive engine will be a bitch") is the part to take
seriously: our tagging work is not an alternative to the DLM path, it is its prerequisite.
Whatever future arrives, none of this work is wasted.

### 3.2 Why AlphaZero doesn't transfer as-is
- **Imperfect information** (hidden hands, decks, face-down cards): AlphaZero/MuZero assume
  perfect information. The relevant family is CFR-descendants — DeepStack/Libratus, Pluribus
  (6-max poker, 2019), ReBeL, DeepNash (Stratego, 2022), Student of Games. Far heavier machinery,
  built by research labs.
- **3–5 players, non-zero-sum in practice**: two-player zero-sum has clean theory; multiplayer
  self-play can converge to brittle mutual conventions that collapse against humans, and
  kingmaking makes the reward signal genuinely political.
- **Simulation budget**: hundreds of decisions per game; zero-style training wants millions of
  self-play games. A JS engine could plausibly be made fast, but nobody should assume it.
What survives the critique: VTES's *reward* structure (VP/GW/oust) is unusually clean, and the
predator–prey ring gives the politics real structure. The problem is hard, not ill-posed.

### 3.3 Deck-data scarcity (their TWDA numbers)
Median 3 decks per crypt card, 43.5% of crypt in ≤2 decks; library median 5. That is a real
blocker for **supervised deckbuilding models** (their CNN/TDA project) — and **irrelevant to
self-play**, which needs no human data at all ("zero"). It matters again only for behavioural
cloning or human-anchored evaluation. Two different problems; the thread conflates them.

### 3.4 Diplomacy, corrected — and the actual lesson
Cicero (Meta) is **Nov 2022**, not "10 years ago" (no-press agents like DipNet are ~2019). More
importantly: Cicero was **not pure self-play** — it anchored planning in human game data (piKL)
precisely because pure self-play in a negotiation game drifts into conventions humans can't
cooperate with. Its architecture — strategy core + intent-conditioned dialogue — is the right
*shape* for VTES table talk. And its lesson applies to our tuning too, at hobby scale: **keep
Johan-in-the-loop live sessions as the human anchor**, or the bots will optimize for beating
each other in ways that feel alien at a real table.

### 3.5 The restricted-pool reframe (the one that changes the calculus)
Self-play over *all of VTES* is science fiction at hobby scale. Self-play over **exactly the
four archetype decks** — maybe 150–250 unique cards, fixed decklists — is orders of magnitude
smaller and merely "ambitious lab experiment". If a Zero-style itch ever needs scratching, this
is the shape. The thread's 2p-first instinct is fine as proof of concept, with the caveat that
2p removes bounce (rulebook: needs "another Methuselah" — already encoded in `_modeUsableBy`)
and neuters politics, so 2p results validate tactics, never the political layer.

### 3.6 JOL records
Best use: **validation corpus** for a future engine (replay logs, assert legality/state
consistency) — genuinely valuable, exactly the test-vector instinct from the thread. As training
data it is small and meta-biased, and the parsing is a project of its own. **Parked.**

## 4. The training ladder (the practical path, zero-dependency)

**L0 — mechanism validation (exists).** The arena already earns its keep here: the ghost-prey
rule was its first trace-diagnosed catch. Continue as-is while M-passes ship.

**L1 — evaluation harness.** Batch N games; **seeded/reproducible deals** (open design point:
the server's shuffle has no seed knob today — either a seeded-RNG room option server-side, or
arena-side scripted deals the way the test suite already mutates hands directly); **duplicate
seating** (same seed, personas rotated across seats) to cut multiplayer variance; metrics
aggregated from the **existing `'bot:'` telemetry channel** (decide/dealt/through/blocked/
took-bleed/ousted — explicitly built as "the evaluation DATA LAYER" in v0.3.5). Deliverable: a
per-run markdown scorecard, same culture as every other gate.

**L2 — persona parameter search.** Personas are already knob vectors (aggression / blockShy /
insight; coming: deal-propensity, vote alignment, hunt thresholds, block budgets…). Fitness = a
metric bundle over K seeded games; optimizer = hill-climb or a small evolutionary loop (keep
the best vectors, mutate, repeat). This is **self-play light: policy improvement by selection,
not gradients** — fully inspectable, journalable, zero-dep, runs overnight on Johan's machine.
Distinct local optima ARE personalities: this is precisely the "beslutsunderlag för strategi och
taktik per persona" the goal ladder asks for.

**L3 — feature-conditioned tactics (optional).** Knobs grow into small decision tables /
bandit-style selection between discrete tactics conditioned on table features (threat level,
pool differentials, hand mix). Still no NN. Only if L2 plateaus below "fun opponent".

**L4 — restricted-pool self-play RL (explicit NON-GOAL for Elysium proper).** Requires a
forward simulator: today's bot is a log-reactive *client*; a simulator is a state-owning
*engine* — a different artifact sharing the cardfx substrate. If ever attempted, it is a
separate lab (external tooling allowed there), per §3.5's restricted pool. The insurance we
already hold: **the `decide()` seam** keeps policy code separated from I/O, so a future
simulator can drive the same decision logic without the network. Cost of keeping the door open:
zero. Cost of walking through it: months. Decision: keep the seam clean, walk later or never.

## 5. Metrics catalogue (draft — argue with it)

Per game & seat: VP, GW, survival (turns alive), oust timing (turn of each oust), pool
trajectory. Offense: bleeds attempted / through / bounced-away, avg bleed size, stealth spent.
Defense: blocks attempted / won, bleeds eaten, bounce usage. Economy: cards played per turn,
wasted-card rate (dead-hand discards — INERT copies show up here), master income realized.
Politics (later): referenda called / passed / votes swung. Variance handling: many games +
duplicate seating; K per configuration is an **empirical unknown** — measure before promising
(see §7). Every metric must be derivable from existing `'bot:'` events or cheap new ones on the
same channel.

## 6. Table talk (Cicero-in-miniature — much later, sketched now)

Order of construction matters: **intent model first, words second.**
1. Intent state the bot already half-has: threat assessment (`fxThreatOf`), pending/announce
   model, telemetry. Formalize into a small table-politics state: who threatens me, who do I
   want blocked/unblocked, what deal would I offer (structured objects, not prose).
2. **Templated rendering** of intents to say-lines ("If you don't block my Govern, I won't
   block your hunt next turn"). Zero-dep, deterministic, testable — and already useful/fun.
3. Deals as protocol verbs vs plain prose: sandbox ethos says **prose + honour system first**;
   verbs only if enforcement ever proves necessary (it may never — humans play deals as prose).
4. Optional external LLM side-car for flavour rendering LAST, and only if ever wanted; the
   zero-dependency default stays templates. (Small local LMs make this cheaper every year —
   still a rendering layer over the intent model, never the strategy core. Cicero's split.)
5. **Theory underlay (16 July 2026):** the politics ladder (P0–P4), the V(seat) currency, deal
   objects with the community's own verb catalog, and the strategy-literature digest live in
   `elysium-bot-politics-theory.md` — read it before building anything in this section.

## 7. Risks & honest uncertainties

- **Arena throughput — MEASURED 24 July 2026 (T1, arena v1.1.4):** ≈ **105 games/hour** at the
  3-bot/pool-12 baseline on sandbox hardware (≈73/h at 4 seats, ≈62/h at 5, ≈45/h at pool 30);
  ms/player-turn is the stable unit (~3.7–4.1 s across seats), and ask-window length measured FLAT
  (bot-vs-bot handshakes resolve on answer, not timeout). L2 arithmetic: a 20-candidate × 20-game
  generation ≈ 400 games ≈ **4 h — "a night"**. Caveat: Johan's hardware will shift absolutes;
  magnitudes and knob sensitivities transfer. Full matrix in the training backlog's T1 entry.
- **Fitness noise magnitude unknown.** Multiplayer + kingmaking may need hundreds of games per
  configuration for a stable signal even with duplicate seating. Measure, then design K.
- **Bot-vs-bot overfitting.** Selection tunes personas to beat *each other*; without a human
  anchor they may drift from human-meaningful play (§3.4's lesson). Mitigation: periodic Johan
  live sessions as calibration, and style-constraint terms in fitness if needed.
- **Coverage tool's stated approximations** (play-context not simulated; 2p bounce deadness out
  of scope; income requires `phase`) — documented in the tool header and every report.
- **Seeding is unsolved** (L1's open design point). Until it exists, arena results are
  directional, not reproducible.

## 8. Open questions for Johan

1. **Which four archetypes?** This decides every curation queue. (Classic spread to react to:
   stealth-bleed / vote-pressure / wall-intercept / combat-rush — but your table, your call.)
2. **Seeding:** server-side seeded-RNG room option, or arena-side scripted deals?
3. **Fitness:** pure VP rate, or a composite (VP + survival + persona style constraints)?
4. **Where do tuned persona profiles live** — a JSON per archetype next to its playbook?
5. **Default-deck hygiene:** Dodge ×10 / Leverage ×9 are INERT today — swap them out of the
   default playbook, or keep them deliberately as the modifier-window's (step 2) test cards?
6. **Table-talk voice:** in-character flavour per persona, or plain strategic prose?

## 9. Deck-read / insight v2 — opponent modelling on TWDA priors (Johan, 16 July)

**The idea (Johan's):** connect the bot to the tournament/community deck archives so that what
opponents REVEAL (influenced vampires, played cards, public ash heaps) updates a posterior over which
archetype they are on — and from that, expected remaining copies of the cards that matter: "this deck
class runs ~7 Deflection; 5 are visibly spent; odds a 6th sits in hand right now ≈ 25%" (worked
example: 2 copies among 52 unseen cards of which 7 are the hand ⇒ 1 − C(50,7)/C(52,7) ≈ 0.25).
Odds-aware play — WHEN to lunge, when stealth is worth spending — is the difference between "plays
correctly" and "feels skilled", especially in the end game.

**Why VTES suits this unusually well:** *(1)* the crypt leaks openly — influenced vampires show
name/clan/disciplines, and star-vampire decks are often near-uniquely identified by ONE reveal;
*(2)* ash heaps are public (the bot publishes its own since v0.3.8), so "copies already seen" is
countable from data we already parse; *(3)* **the scarcity INVERSION:** the same TWDA sparsity that
ruins NN training (§3.3 — 43.5% of crypt cards in ≤2 decks) is GOLD for identification — the rarer a
card is across the archive, the more a single sighting narrows the posterior. Same dataset, opposite
problem, opposite value.

**Precedent, not speculation:** digital-TCG deck trackers have run exactly this inference for a
decade (observed cards → archetype archive → remaining-copy probabilities), with early public demos
showing high next-card prediction accuracy within a few turns; it is the same muscle as range-reading
in poker.

**Architecture fit:** a `twda-compile.js` crunching the archive into a compact prior artifact beside
`elysium-cardfx.json` — the exact offline-compiler pattern cardfx established; name matching is
already solved (the FX_NORM/alias ladder); everything is bot-LOCAL (reads only what the server
already relays), so LIKELY zero protocol changes — with the §T9a caveats below. The **insight knob
gates depth for free**: novice doesn't count cards, grinder counts sloppily, shark has encyclopedic
archive memory — persona differentiation with no new machinery. Not cheating: exactly what skilled
human players do.

**The free eval loop:** in the arena we KNOW the decks. Inference quality (posterior convergence
speed, copy-odds calibration) becomes an automatically measurable metric in the L1 scorecard — an
evaluation loop with zero human labels. Downstream it feeds `--explain` ("reading you as ~X (73%),
5/7 expected Deflections seen → lunge"), gives table talk real substance, and opens the BLUFF horizon
(playing against one's own read) — the road back to the Diplomacy thread (§3.4) for real.

**Open points — RESOLVED by the T9a spike (16 July 2026, verdict GO, `t9a-deck-read-verification.md`):**
source = `static.krcg.org/data/twda.json` (KRCG, MIT, ~4,500 decks, current through spring 2026;
`date` + `players_count` per deck give recency weighting and tournament-size filtering for free);
visibility = double-confirmed — the VEKN tournament rules name library count as Public Information
and the rulebook lets any Methuselah examine any ash heap, while Elysium's sanitizePub already relays
counts{hand,library,crypt} and the full ash/burned zones to every client, so the bot needs ZERO
protocol changes (the relay IS the fairness boundary); size = raw ~8–12 MB compiling to a sub-MB
prior artifact loaded exactly like elysium-cardfx.json. **Risks:** the archive
spans decades ⇒ recency-weighting + banlist-filtering are mandatory; home-brew decks match nothing ⇒
flat posterior ⇒ fall back to today's heuristics (graceful degradation, never a crash). Terminology
note on the Discord thread: their "TDA" was topological data analysis (a deckbuilding-clustering
project) — unrelated machinery, though its clusters could one day FEED these archetype priors.
Promoted to **T9a/T9b** in `elysium-bot-training-backlog.md`.

## 10. Decision log

- **16 July 2026** — Doc created. Methodology verdict recorded (§2: three-tier stays; deck-driven
  depth as the standing discipline). The L0–L4 ladder adopted as the working frame; L4 declared
  an explicit non-goal for Elysium proper. `gen-deck-coverage.js` v1.0.0 shipped as the
  deck-driven-depth instrument; first run quantified the default deck at 69% automated and
  surfaced Dodge/Leverage as INERT.
- **16 July 2026 (later the same day)** — the T-items moved to the track's OWN backlog
  (`elysium-bot-training-backlog.md`, T1–T9 with a recommended priority order: T6→T1→T9a now, the
  T2→T3→T4→T9b chain at the 4-archetype milestone, T7/T8 opportunistic); §9 deck-read / insight v2
  added on Johan's TWDA-priors proposal (T9a verification spike queued before any build); the main
  backlog now only points here. Split-out rationale: parallel-session patch separation.
- **16 July 2026 (evening)** — T9a verification spike executed: **verdict GO**. Archive source
  (KRCG twda.json, MIT, ~4,500 decks), visibility (VEKN tournament rules: library count is Public
  Information; rulebook: any ash heap examinable — and Elysium's relay already delivers all of it),
  and size budget (sub-MB compiled prior) all resolved; findings + primary sources in
  `t9a-deck-read-verification.md`. T9b stays queued after T3 — the spike removed the risk, not the
  sequencing.
- **16 July 2026 (night)** — `elysium-bot-politics-theory.md` created: V(seat) named the missing
  primitive, P0–P4 formalized with per-rung metrics, theory anchors set (cheap talk + the
  referendum-terms binding instrument, Schelling with the bot's two commitment devices, parity
  dynamics via the Predator-Prey Continuum, play-to-win, the Cicero split), and the Codex
  table-talk literature digested in. P1 "silent politics" flagged as the highest value-per-hour
  rung; the announce≠resolve machine identified as P2's ready-made venue — zero protocol changes.
- **24 July 2026** — The evaluation round (bot v0.6.42): full-project review with live gate
  re-verification (cardfx 186/0 incl. disk-matches-fresh-compile, bot-logic 401/0 ×3, coverage
  reproduced exactly; library scope: 2,364 entries / 1,518 fx-tagged / 54 curated / 3 handlers out
  of 4,149 cards). The three-step roadmap agreed with Johan (five decks 100% → arena/data era →
  politics) recorded in the training backlog as the superseding priority block; **T6 gained Johan's
  context-schema requirement** (hand + board digest + resources + considered-AND-gate-excluded
  options per reason object — the decide traces ARE step 2's training data). **T1 executed** —
  arena v1.1.4 (per-match timing, games/hour summary, --bots 2–5, persona↔deck conflation warning):
  ≈105 games/h baseline, §7's first risk resolved. Evaluation finds queued: hunting-ground
  per-VAMPIRE ledger (Johan-confirmed rule; today's global flag is conservative-only), spec §1
  staleness at v0.6.10, the grinder deck file absent from the project.
