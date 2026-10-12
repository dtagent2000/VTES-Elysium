# Elysium Bot — Table-Politics Theory (the P-track)

> **11 Sep 2026 pointer:** the undirected block window that political actions (undirected, +1 stealth) will ride is built (bot v0.6.107, B1) and documented in `elysium-bot-block-doctrine.md` — §2.6 (deals as a `noBlockDeal` hook), §2.7 (the meta-game and the toolbox `stance`), §3 (threat classes: a pool-burning referendum is T1). Read it before extending this document.

> **Created 16 July 2026** (bot v0.5.7 / client v2.6.41 / server v2.6.16). **Status: DISCUSSION** —
> the theoretical underlay for the politics ladder; nothing here is committed work. Promoted tasks go
> to `elysium-bot-training-backlog.md` through the normal ritual. Companions:
> `elysium-bot-strategy.md` (§6 table talk, §9 deck-read), `t9a-deck-read-verification.md` (the
> fairness-boundary result this doc leans on). §4 digests the community strategy literature
> (sources in §7, paraphrased — the originals are worth reading in full).

---

> **P0 SHIPPED — the engine's FIRST brick (26 July 2026, bot v0.6.65, suite
> 577/0 ×3):** the client's EXISTING vote referendum (tally mode 'vote', the
> v2.6.16 resolver family) IS the polling window — the same edge the M2-era
> abstain line already detected. Protected District's defensive votes now
> LAND in the table's SHARED against-counter (`tally {mode:'vote', b}` —
> srv-2.6.17's absent-field preserve carries `a` untouched, one field is the
> whole message), once per referendum, played by an UNLOCKED reactor whose
> PRINTED title satisfies req.title. Consumption standard = Rebel's titled
> trigger: real machinery, environmental condition. **Untouched Q-scope:**
> title votes themselves, bot-called referendums, vote archetypes, deals —
> Q1–Q6 stand. The abstain line survives (wording generalized).
> **Review seam (v0.6.66):** the future bot-caller MUST set `_callingReferendum`
> around its own tally-open, or District votes against itself (the tally verb
> carries no who). The Q-work contract's first line, written before Q-work.

## 1. The missing primitive: V(seat) — position evaluation, the political currency

All political reasoning is pricing: what is your vote worth, what does letting your action through
cost me, is a deal with you worth more than breaking it? None of those questions can be asked
without a common currency, and the currency is a **position evaluation function** V(seat) → scalar
(+ component breakdown, because every consumer needs the WHY, not just the number).

**Inputs — strictly relay-derivable (the fairness boundary, T9a):** pool level + trajectory over
recent turns; minion tempo (ready count, total capacity on board, locked ratio at turn end);
oust proximity in both directions (prey's pool vs our realized through-rate; our pool vs predator's);
permanents economy (income masters, hunting grounds, vote titles on board); pile counts (hand,
library, crypt — all relayed); crypt depth as late-game staying power.

**Structural prior with dynamic corrections (community-documented, §4):** a ring-distance term —
cross-table seats (grand-prey, grand-predator) are natural allies — but the weights SHIFT during
play: a weakened predator becomes a buffer worth preserving rather than a target, and a grand-prey's
alliance value decays as one's prey approaches the oust (their incentive to "help" becomes an
incentive to poach). V must be re-evaluated, not cached.

**Consumers (one primitive, five customers):** the P0 threat matrix; L2 tuning fitness; the T9
deck-read's lunge-odds weighting; `--explain` narration; and **self-heat** — the bot's OWN V is the
table's estimate of the bot as a threat, which drives the lay-low policy (§2 P2, §4).

**Open:** initial component weights are hand-set and journaled; L2 selection tunes them later.

## 2. The P-ladder

**P0 — Threat matrix.** V(seat) plus per-threat decomposition (the `fxThreatOf` embryo grown up):
who threatens whom, with what, how soon. Table-wide, refreshed every turn, cheap. *Metric:*
correlation between matrix rankings and the bot's subsequent choices (votes, blocks, targets).

**P1 — Silent politics.** Politics expressed purely through actions — no text at all: vote
alignment against the matrix (punish the leader, spare the buffer); selective no-block on
cross-table actions that hurt one's prey/predator; bounce direction chosen politically; rush
targeting = table threat, not just adjacency; **lunge timing under parity** (see §3.3: prefer
lunges that restore even parity; a failed lunge at odd parity invites the ripple back next turn);
archetype-gated options like *hopping* (vote pressure on the grand-prey before the prey, exploiting
undirected actions against block-heavy decks) and *partial reverse* (crippling a too-strong
predator, priced against the +6 pool an oust feeds them). *Metrics:* vote–threat correlation,
leader win-rate damping across arena batches, parity-aware lunge success rate. **P1 is probably the
single largest playing-strength gain per hour in the politics track — a bot can be deeply political
without saying a word.**

**P2 — Signalling & deterrence.** One-way declarations rendered from intent state, delivered in the
**announce window** — the community's standard practice of announcing intentions before acting maps
1:1 onto Elysium's existing announce≠resolve machine, so the venue already exists in the protocol.
Content types: intentions ("I'll bleed for 2 unless someone objects"), deterrence ("block this and
I spend the rest of the game on you" — the *Finnish Politics* pattern: combat threat as an
extraction tool, §4), and **posture management** (shape the table narrative about who the real
threat is; never pose as the threat oneself; likability is an asset — aggression in tone recruits
the table against you). Two mechanical bot advantages here (§3.2): *credibility* (a grudge policy
that provably always fires makes deterrence cheap) and *timing opacity* (constant think-floors mean
the bot leaks no decision-timing tells — a discipline humans find genuinely hard). *Metrics:*
block-rate against the bot before/after deterrence declarations; extraction success (actions passed
after a threat); table-heat trajectory of the bot's own V.

**P3 — Bilateral deals.** The negotiation kernel, straight from the literature (§4): model, per
seat, **what they can offer** and **what they may desire** — the offer/desire model is the deal
generator. Deal-verb vocabulary from the community's actual catalog: no-bleed / no-block / no-rush
for a horizon; single-damage-combat agreements before a bounced-bleed block; letting a specific
action pass; lending a permanent; torpor rescue (directed, hence deal-friendly); contracting a rush
deck to remove a minion; alternating Ashur Tablets usage. Two doctrinal truths: **deals can always
be broken** (ledger + break-readiness are core state, not edge cases), and **one can sell what one
cannot do anyway** — the zero-cost deal (a wall trading away a block it never had). The counter to
zero-cost deals is capability estimation, i.e. **the T9 deck-read prices deals**: a "no block" from
a seat whose deck reads as 30% intercept is worth little. And the game supplies exactly ONE binding
instrument: **referendum terms** — negotiated during the announce, fixed only at resolution (the
designed betrayal window), but game-ENFORCED once passed; distributive referenda (KRC-class burn
distribution, Parity Shift-class transfers) let the table write side-payments into enforced state.
Deals about vote terms are therefore the closest thing to contracts in VTES and should be priced
higher than pure promises. Hard rule from the tournament rules: **at two remaining players all
deals are void** — every deal object carries a horizon, and the 2p boundary is an automatic expiry.
**Ruling (Johan, 16 July): deals are PUBLIC, and the default policy is honor-the-letter.**
Outright breaks poison the well — humans are emotion-driven and stop dealing with a known breaker,
and against a standing playgroup the bot plays an *iterated* game where reputation persists across
sessions (folk-theorem territory: cooperation equilibria dominate). But the letter is the whole
contract: **loopholes are sanctioned** — gaps deliberately drafted into one's own offers, or left
accidentally in the counterparty's terms, may be exploited without constituting a break. Two
consequences: *(a)* a rules-literal machine is NATURALLY strong at both drafting and finding
loopholes — specification gaming, normally a bug class, becomes a gameplay feature here; *(b)* the
deal OBJECT is the contract, so the rendered text must be its canonical serialization — the letter
has to be legible for letter-honoring to mean anything (§5). One honest calibration note:
spirit-violations cost goodwill even when the letter holds — a notorious loophole artist gets
offered fewer deals, so loophole use is priced against reputation, never treated as free. Persona
knob: `literalism`.
*Sequencing:* bots negotiate with each other in **pure JSON in the arena** long before any
human-facing text exists — the politics lab (§6). *Metrics:* deal keep-rate, realized deal-EV
(V-delta attributable to deals), exploitation resistance (an always-honoring bot gets milked; find
the knob equilibrium).

**P4 — Coalitions & balance of power.** Feed-the-weak / starve-the-leader policies; recognizing and
pricing **table splits** (endgame VP-repartition deals among the leading players — commonplace in
tournament play, and a thing the bot must at least evaluate rationally: accept iff own VP-EV says
so); coalition breaking at the endgame; parity management as a group phenomenon. All under the
**play-to-win constraint** (§3.4): every P4 policy must be justifiable as own-VP expectation, never
spite — which conveniently is also what keeps a bot's politics legible and fun.

## 3. Theory anchors

**3.1 Cheap talk — plus exactly one binding instrument.** VTES deals are non-binding by rule, and
the tournament rules explicitly void all deals when two players remain (both must then play to win
on game state alone). The right frame is therefore Crawford–Sobel cheap talk — non-binding
communication is informative precisely when interests partially align, and the predator-prey ring
manufactures partial alignment cross-table by construction — plus the referendum-terms exception
(§2 P3): a passed referendum is enforced by the game, making vote terms the lone contract
instrument in an otherwise promise-based economy. Design consequences: horizon fields are
mandatory, the 2p expiry is hard-coded, and terms-deals price above promise-deals.

**3.2 Schelling — credibility, deterrence, focal points.** Threats work iff credible; commitment
devices make them cheap. The bot holds two natural commitment devices humans lack: **mechanical
consistency** (a published grudge policy that always fires is instantly credible — deterrence
becomes nearly free) and **timing opacity** (constant decision pacing leaks nothing; the literature
documents decision-timing as a real tell among humans, §4). Focal points: "everyone hits the
leader" is the table's standing convention — the bot should both exploit it (posture: point at the
leader) and defend against it (lay low, manage self-heat).

**3.3 Parity dynamics — the Predator-Prey Continuum (Gregory Williams, via the Codex).** Pressure
on a prey ripples around the ring: with an even player count the cross-table pairs reinforce each
other stably; with an odd count the pressure returns to its originator a turn later. The practical
theorem: **a lunge is a parity-restoring move** — succeed and the table returns to even (favorable);
fail at odd parity and you've amplified the ripple that lands on you next. So lunge-EV = f(kill
probability from the T9 deck-read's bounce/wake odds, current parity, V-deltas across the table).
This single formula ties T9, V(seat) and P1 together.

**3.4 Play-to-win doctrine.** The tournament rules' sportsmanship section requires goals aligned
with the game's goal — no crusades, no rating-based targeting. For the bot this is a feature, not a
constraint: grudges must clear a deterrence-EV bar, kingmaking is bounded, and every political
choice stays explainable as expected VP. (It also keeps `--explain` honest.)

**3.5 The Cicero split, restated for politics.** The strategy core PRICES (V, matrix, deal-EV); the
dialogue layer RENDERS intents. Never let rendered text drive decisions. Johan's live sessions
remain the human anchor — tuned politics that only beats bots is alien politics.

## 4. Community wisdom digest (paraphrased; sources §7)

- **The negotiation kernel:** figure out, for every seat, what they *can offer* and what they *may
  desire* — then almost anything is dealable. (→ P3's offer/desire model is lifted verbatim as a
  data structure.)
- **The deal catalog:** the six-plus common deal shapes listed in §2 P3 come straight from
  documented play — they are the deal-verb enum, not an invention.
- **The lightness doctrine:** always be ready for breakage, and remember the zero-cost deal —
  selling an incapability. (→ ledger + T9-priced capability beliefs.)
- **Announce-everything practice:** announcing intended actions gathers information (can they
  block/bounce?), opens a negotiation window, buys likability, and offers a deception channel via
  commentary. (→ P2's venue; Elysium's announce machine already is this.)
- **Decision timing is a tell:** players read hesitation; countermeasures are constant-time
  responses or precommitted reaction policies. (→ the bot's constant think-floors are a built-in
  countermeasure; conversely, human response latency is relay-visible and could be a weak P0
  signal — parked as a maybe, flagged low-value/possibly unsporting in feel.)
- **Posture & standing:** establish the threat/underdog narrative early, subtly, pleasantly; the
  agreed "threat" draws table pressure, the "underdog" gets ignored; never pose as the threat.
  (→ P2 posture management + self-heat.)
- **Table balance shifts:** cross-table are natural allies, but a weak predator becomes a buffer
  worth keeping and a grand-prey's trustworthiness decays as your prey nears the oust.
  (→ V's dynamic ring corrections, §1.)
- **Hopping & going reverse:** vote decks can pressure the grand-prey before the prey (undirected
  actions dodge the blocker until adjacency); partial reverse can defang a dominant predator, full
  reverse is priced by the +6-pool-per-oust subsidy. (→ P1's archetype-gated target policies.)
- **Referendum terms at resolution:** negotiate during the announce, fix terms only at resolution —
  the designed betrayal window; stating terms clearly at resolution is also how the table verifies
  honesty. (→ §3.1's binding instrument + its treachery affordance.)
- **Archetype politics profiles:** vote decks live on table talk — low profile, many friends,
  votes as favors; rush decks practice *Finnish Politics* — combat threat as an extraction economy;
  walls are toll-keepers and the natural sellers of zero-cost deals; stealth-bleed lies low and
  misleads via commentary; toolbox demands the best table-reading of all. (→ the four personas get
  archetype-matched political styles for free.)

## 5. Deal objects & intent state (P3 schema sketch)

```json
{ "pv": 1, "kind": "offer|accept|decline|expire|kept|broken",
  "from": 3, "to": 5,
  "give": [ { "verb": "no-block", "scope": { "turns": 2 } } ],
  "get":  [ { "verb": "no-bleed", "scope": { "turns": 2 } } ],
  "horizon": { "turns": 2, "voidAt2p": true },
  "enforced": false }
```
Verb enum seeded from §4's catalog (`no-bleed`, `no-block`, `no-rush`, `let-pass`, `single-damage`,
`lend-permanent`, `torpor-rescue`, `contract-rush`, `alternate-usage`, `vote-terms` — the last with
`enforced: true` once the referendum passes). Intent-state additions beyond the deal ledger:
`postureNarrative` (who we're framing as the threat), `grudgeLedger` (deterrence follow-through),
`selfHeat` (own V + estimated table attention). Bot-to-bot JSON in the arena first; templated
human-facing rendering only after the politics lab shows the deals themselves are sound.
Per the public-deals ruling (§2 P3), every deal's human-facing text is generated verbatim from the
object — the object IS the contract, the text its canonical serialization, so the letter (and its
loopholes) stays legible to the whole table.

## 6. Evaluation program

Every rung ships with its metric (listed per rung in §2), all derivable from the existing `'bot:'`
telemetry plus V(seat). The **arena politics lab** is the centerpiece: seeded tables where bots
exchange deal objects in JSON — measure deal frequency, keep-rate, realized deal-EV, and run the
exploitation stress-test (always-honor vs opportunistic-defector populations; find where the
persona knobs settle). Human validation gates every promotion: a politics feature ships to human
tables only after a Johan session confirms it reads as politics, not noise.

## 7. Sources

- https://codex-of-the-damned.org/en/strategy/table-talk.html — negotiation kernel, deal catalog,
  lightness doctrine, table splits, announce practice, decision timing, posture, table balance,
  hopping/reverse, Predator-Prey Continuum (Gregory Williams' PDF linked from there)
- https://codex-of-the-damned.org/en/strategy/archetype-categories.html — per-archetype negotiation
  profiles, "Finnish Politics"
- https://codex-of-the-damned.org/en/strategy/fundamentals.html — referendum terms at resolution,
  vote lock, baiting, concealing/assessing defensive capability
- https://www.vekn.net/tournament-rules — deals void at two players; play-to-win sportsmanship;
  Public Information definition
- https://codex-of-the-damned.org/en/strategy/index.html — the wider strategy library (advanced
  articles unread as of this doc; candidates for a later digest round)

## 8. Open questions for Johan

1. **V(seat) v1 weights:** hand-set start values — want to sketch them together, or should the
   first draft come from me and get corrected in review?
   *Recommendation:* I draft v1 — a concrete target beats a blank whiteboard: 5–6 normalized
   components, each explainable in one sentence, near-equal starting weights. Acceptance = the
   ordering test: V's mid-game ranking matches Johan's gut ranking in live play AND correlates
   with final VP over arena batches. L2 tunes from there.
2. **Grudge budget:** how much VP-EV may deterrence follow-through cost before it stops being
   Schelling and starts being spite?
   *Recommendation:* certainty over magnitude — a certain small punishment out-deters an uncertain
   large one. Follow-through only on threats DECLARED before the offense (an undeclared grudge
   deters nothing; that is just spite). Small per-game budget, proportional response, hard stop
   once the offender is neutralized (play-to-win). Persona-scaled via `grudgeBudget`; the
   iterated-game frame licenses slight per-game "irrationality" since follow-through pays across
   the season.
3. **Private deals — ANSWERED (Johan, 16 July):** deals are PUBLIC; honor the letter by default
   (reputation in an iterated game against a standing playgroup); loopholes sanctioned — letter
   over spirit. Doctrine folded into §2 P3; canonical-serialization consequence in §5. Whisper
   channel: off the table for politics v1.
4. **Persona ↔ politics mapping:** adopt §4's archetype profiles 1:1 for the four bots?
   *Recommendation:* adopt 1:1 as v1 — the literature says the deck largely dictates viable
   politics (votes need friends, walls sell tolls) — but model deck-archetype and political
   temperament as two axes so they can be decoupled later (a chatty wall, a taciturn vote deck)
   once v1 personalities are proven.
5. **Voice:** should P2 declarations be in-character per persona, or plain strategic prose first?
   *Recommendation:* plain canonical prose first — and the Q3 ruling makes it near-mandatory:
   letter-honoring requires a legible letter, so the text is the object's serialization.
   In-character flavour becomes an optional WRAPPER around the canonical statement later, never a
   replacement (debuggability: decision failures must be separable from rendering failures).
6. **Sequencing:** the politics lab is essentially T3 + P3 — run P0/P1 inside the existing
   T-sequence (they're pure decide()-work), and gate P2+ behind the lab?
   *Recommendation:* yes. V(seat)+P0 right after T6 (`--explain` wants V to narrate, and T4's
   fitness needs V anyway); P1 policies land incrementally in decide(); P2+ gates behind the arena
   politics lab (T3-dependent). Merged order: T6 → T1 → V/P0 → T2 → T3 → P1 metrics in the
   scorecard → T4 → politics lab (P3 in JSON) → P2 → T9b → human-facing P3 → P4.
7. **Cross-game memory (opened by the Q3 ruling):** in a standing playgroup the iterated game is
   real — should deal/grudge ledgers PERSIST across games per player identity (perfect elephant
   memory, very vampire) or reset per table (cleaner, less creepy)? Affects storage and
   disclosure — "the bot remembers" should probably be announced to the group either way.

## 9. Research uncertainties (declared, not hidden)

**9.1 The theory anchors are inspiration, not derivations.** Crawford–Sobel is a two-party
sender-receiver model; VTES is n-player, dynamic, and communicates through actions as much as
messages. The *direction* holds (partial interest alignment → informative cheap talk becomes
possible) but nobody has formally modelled VTES table talk, and this doc should never pretend the
theorem "applies" strictly. Same honesty for the folk-theorem frame: the classical result needs
infinite repetition — finitely repeated games formally unravel by backward induction — and it is
*behavioral* reputation models, not pure theory, that rescue cooperation in practice. Good enough
for design intuition; not a proof.

**9.2 The 25% worked example is a naive lower model.** The hypergeometric assumes the hand is a
random sample of the unseen cards — but players HOLD bounce deliberately. Selection effects mean
real inference must condition on *behavior*, not just on cards seen. (This uncertainty is exactly
what §10.3 turns into a research thread.)

**9.3 The TWDA prior is a tournament prior.** A home meta can deviate systematically —
home-brews, house habits, pet cards. The flat-posterior fallback protects against crashes, not
against systematic misreads; the fix is a local tier (§10.4). Also unverified: the assumption that
`players_count` weighting improves the prior — big-tournament decks are not necessarily more
representative of *this* table.

**9.4 V(seat) as a linear scalar has a known ceiling.** Positional value in VTES is
matchup-contextual — pool is worth more against stealth-bleed, tempo more against walls. The v1
linearity is a deliberate floor to start measuring from, not a claim about the truth. Minor
residuals in the same spirit: Ossuary's seven archetype classes are ONE clustering with unknown
methodology (fine as seed labels, not ground truth), and twda.json's schema stability across
updates is unverified (build-time validation in `twda-compile.js` covers it).

## 10. Open research threads (what prior theory and literature haven't thought through)

**10.1 Mixed tables with published bot policies — a new game-theoretic object.** The entire VTES
strategy literature assumes all-human tables; essentially all game AI aims either to blend in or
to win. Our actual future table is *mixed*, where every player KNOWS which seats are bots — and
the bots' policies are *inspectable*. A human can never credibly publish their own source code;
the bot can. That is Schelling's commitment logic on steroids: asymmetric commitment games that,
as far as we know, nobody has studied in a board-game context. Second-order effect worth watching:
humans may start *using* the bot as trust infrastructure — "I'd rather route this deal through the
bot; its word is mechanically good."

**10.2 The bot as notary for human deals.** The extension of 10.1: public deals + perfect memory
+ timestamps means the table can invoke the bot as a *witness* to their own agreements. It does
not judge (sandbox ethos!) — it witnesses, and thereby makes human cheap talk a little less cheap.
A table notary. Zero rules enforcement, pure bookkeeping — squarely inside Elysium's philosophy.

**10.3 Negative evidence — the dog that didn't bark.** Deck-tracker literature conditions on
cards *seen*; almost nothing conditions on cards conspicuously *not played*. VTES's forced hand
cycling makes negative inference unusually strong: a player who declined to bounce a lethal bleed
probably lacks bounce NOW, whatever the deck-read says they run in total. A hand-state model where
*non-action is also observation* would be a genuine contribution to the tracker genre — and it is
the principled fix for 9.2's selection problem.

**10.4 The three-tier prior: TWDA → local meta → individual.** The bot's own game history (the T8
recordings!) as the second tier, and — Q7-adjacent — player-specific habits as the third ("Johan
always runs eight Deflection"). No tracker literature we found does individual priors across
sessions. Requires the Q7 ruling on cross-game memory, and the standing disclosure note applies.

**10.5 The arena as a falsification machine for strategy folklore.** The community literature is
distilled experience that has never been tested at scale. A seeded arena can test it: does "never
pose as the threat" actually measure in VP? Is the weak-predator-as-buffer correction real? What
is the true EV of table splits? Community wisdom → hypotheses → thousands of controlled games.
Computational strategy science for VTES has simply never existed; we would be first. Bonus seed
from the Q3 ruling: a **loophole grammar** — with canonical deal objects, loopholes become formal
objects, a small type theory over scope gaps, actor gaps and timing gaps. Contract law for
vampires.

## 11. Decision log

- **16 July 2026** — Doc created. V(seat) named as the missing primitive; P0–P4 formalized with
  per-rung metrics; theory anchors set (cheap talk + the referendum-terms binding instrument,
  Schelling with the bot's two commitment devices, parity dynamics via the Predator-Prey Continuum,
  play-to-win, the Cicero split); community literature digested into §4 (Codex table-talk page as
  primary source); deal-object schema sketched with the community's own verb catalog; P1
  ("silent politics") flagged as the highest value-per-hour rung.
- **16 July 2026 (late)** — **Q3 RULED by Johan:** deals public, honor-the-letter default,
  loopholes sanctioned (letter over spirit) — doctrine folded into §2 P3 and §5 (the object IS the
  contract; text = canonical serialization); `literalism` added as a persona-knob concept; Q7
  (cross-game ledger persistence) opened as a direct consequence of the iterated-game frame;
  recommendations recorded inline for Q1/Q2/Q4/Q5/Q6, awaiting Johan's rulings.
- **16 July 2026 (closing the day)** — §9 Research uncertainties + §10 Open research threads
  added on Johan's call: anchors declared as inspiration-not-derivation (Crawford–Sobel scope,
  folk-theorem finite-repetition caveat), the hypergeometric example marked as a naive lower model
  (selection effects → condition on behavior), the TWDA prior flagged as tournament-biased, V's
  linearity ceiling stated; five threads opened — mixed-table commitment games with inspectable
  policies, the bot-as-notary, negative-evidence hand inference (the dog that didn't bark),
  the TWDA→local→individual three-tier prior, and the arena as a folklore falsifier plus the
  loophole-grammar seed.
