# Elysium Arena Observability — the LLM-in-the-loop plan
*Drafted 26 July 2026, from Johan's five points. Status: PROPOSAL (A2–A5 unbuilt).*

## 1. The idea, elevated

Johan's framing: log enough that a strong reviewer (Claude, Sonnet 5, or a
future model) can read a match **with full facit** — every hand, every board
state, every decision *and its stated reason* — then compare the bots' play
against what the deck's strategy *should* have done, and emit concrete
adjustments.

The key insight is that **the actuator already exists**: `--knob` (arena
v1.2.2) turns a reviewer's recommendation into a runnable experiment
(`--knob 2:rushFwdWeight=2` = treatment-vs-control in one match), and the
persona table + finder scoring are small, named surfaces for logic PRs.
So the loop closes:

```
arena (traces) → dossier (one readable file per match) → LLM review
      ↑                                                      ↓
      └───────── knob sweep / persona PR / logic fix ────────┘
```

## 2. Johan's five points, mapped against what exists TODAY

| # | Point | Status | Gap |
|---|-------|--------|-----|
| 0 | Deck-strategy self-understanding | **MISSING** | No strategy model exists anywhere — it lives implicitly in cardfx + scoring. |
| 1 | Hands with cards | **≈DONE** (v0.6.70: every decide carries hand NAMES; `dealt` covers openings) | Reaction plays (bounce/reduce/wake/intercept/combat cards) splice between decides with **no emit** — the reviewer sees the hand shrink but not which card did what. |
| 2 | Board state & resources | **FRAGMENTS** (pool per decide; through/torpor/result carry pieces) | No periodic board snapshot — a reviewer must replay the whole event stream to know the table. |
| 3 | Decision chain (WHY) | **LARGELY PRESENT** — `decide` emits q + ctx (every candidate option) + `out.why` (harvest v1.0.5 now surfaces it: "blood #/#, urgency # × # ÷ aggr # = #") | The **score comparison** is not logged: we see the winner's why, not the losers' scores ("bleed 2.4 beat rush 2.1 beat master 1.9"). |
| 4 | Threat assessment & own place | **COMPUTED, NOT EMITTED** (`_tableThreat` feeds cf-triples only; `_predPressure` is bot-local) | No periodic self-read: "my threat map + where I think I stand". |

**Honest correction logged:** harvest v1.0.1 declared `why` absent — it lives
in `data.out.why`. Fixed (v1.0.5) before this plan was written.

## 3. Proposed emits (A2 — bot-side, one version)

All ride the existing `_emit(type, data)` → arena catch-all → jsonl pipeline.
Sizing target: ≤ ~300 bytes/emit; a 40-turn match adds ~15–25 kB.

**`manifest`** (once, at `dealt`) — point 0:
```json
{ "deck": "nosferatu", "persona": "grinder",
  "strategy": "Menace attrition: Fame/Creeping pool pressure + [ANI] rush control; win by bleed+drain, not combat volume.",
  "axes": ["stealth-bleed", "menace", "rush-control"],
  "knobs": { "rushFwdWeight": 1, "poolFloor": 6 } }
```
`strategy`/`axes` come from a new curated field in the arena's ARCHETYPES
registry — sourced from the deck-coverage docs + codex reading, ~3 lines per
deck. This is the reviewer's yardstick: decisions are judged *against intent*.

**`snapshot`** (each own unlock) — points 2+4 in one:
```json
{ "turn": 7, "pool": 6, "edge": false, "handN": 7,
  "ready": [{ "n": "Wauneka (G6)", "b": 3, "l": false, "att": ["Raven Spy"] }],
  "torpor": [], "unc": 2,
  "pubs": { "1": { "pool": 8, "ready": 2, "torpor": 1 }, "3": { "pool": 4, "ready": 3 } },
  "threat": { "tPred": 6.5, "tPrey": 9.0, "predPressure": 2, "famedSeen": ["Aisling Sturbridge"] } }
```
Each bot logs **its own sanitized view** (the relay IS the fairness boundary).
The omniscient facit = the UNION across 3–5 bots' snapshots + their private
hands — exactly Johan's "fullt facit", assembled by the dossier tool, never
by any single bot.

**`play`** (every commit that splices a card outside the action branch) — point 1's completion:
```json
{ "card": "Telepathic Misdirection", "window": "react-bounce", "vamp": "Aisling Sturbridge", "targetSeat": 1 }
```
Windows: react-bounce · react-reduce · wake · react-unlock · intercept ·
combat-strike · combat-press · combat-maneuver · dodge · master. One helper
(`_emitPlay`) called from the ~10 existing commit sites.

**`decide.out.scores`** (action-q only, v1) — point 3's completion:
```json
{ "scores": { "bleed": 2.40, "rush": null, "rushWhy": "no sup-ANI actor", "master": 1.90, "enemyRescue": null } }
```
The scoring block already computes these serially — collect into an object,
attach to `out`. The reviewer sees the whole podium, not just the winner.

## 4. The dossier tool (A3 — `gen-match-dossier.js`)

Renders ONE match into one LLM-readable markdown file (~10–30 k tokens):

1. **Header:** seats, decks, personas, knobs (from `result`), each manifest.
2. **Per-round reconstruction:** merged snapshots (the omniscient table),
   then each bot's turn: decide (q → scores → why) → plays → outcome events
   (through/blocked/torpor/rescue) → reactions by others (play-emits).
3. **Endgame:** oust order, winner, doctrine tallies, pool trajectories
   (chart-as-table), the counterfactual triples.
4. **Review scaffold appended:** the rubric questions (below), so the dossier
   is a self-contained prompt.

## 5. The review rubric (A4 — first live pass)

Per match, the reviewer answers:
- Did each bot's play match its **manifest**? Cite 2–3 turn-refs where it
  deviated, and whether the deviation was persona-consistent or a logic gap.
- **Top-3 misplays** with the facit in hand (e.g. "T6: held Deflection while
  taking 4 — bounce finder null because X").
- **Missed windows:** blocks it could have contested (intercept-in-hand vs
  incoming stealth margins), rescues/rushes available but unscored.
- **Knob hypotheses:** concrete `--knob` lines to test, with expected effect.
- **Logic hypotheses:** finder/scoring changes, phrased against named code
  surfaces (the finders are small and greppable by design).

Output format is frozen (headings above) so review → backlog rows is mechanical.

## 6. Codex-crossed metrics (A5 — harvester derivations, no new emits)

From the strategy literature's evaluation vocabulary, derivable once A2 lands:
- **Cycling rate** (cards played+drawn per own turn — the classic skill metric).
- **Bleed pressure curve** (dealt per round, per bot).
- **Pool trajectory** (snapshot.pool over turns — bloat vs bleed-out shape).
- **Influence tempo** (turns to 1st/2nd/3rd ready minion — the poolFloor saga's metric!).
- **Block economy** (blocks made / block-capable windows; missed-block count).
- **Stealth-intercept margins** on contested actions.
- **Torpor time** (turns famed/unfamed vampires sit in torpor — the yo-yo's KPI).
- **Reaction efficiency** (bounces landed / bleeds received; reduce savings).

## 7. Decisions (Johan, 26 July — all five locked)

1. **Snapshot frequency:** react windows INCLUDED (shipped in A2) — "hela bilden, det känns värt."
2. **Dossier budget:** 100k allowance for 5p epics (Max 20x) — tiers `--full`/`--compact` shipped in A3.
3. **Strategy manifests:** Claude drafts, Johan reviews — six drafts live in DECK_STRATEGY (bot v0.6.73), open for his edits.
4. **Review cadence:** EVERY arena match, at least initially — "mycket basstrategi och taktik vi vill fånga upp."
5. **Format principle (Johan's refinement, now doctrine):** collected data is LLM-OPTIMAL (deterministic T-refs, one event per line, manifests first, per-turn FACIT hand union); the reviewer's OUTPUT is a frozen **battle-report template** (Summary / Strategy adherence / Top-3 misplays / Missed windows / Knob hypotheses / Logic hypotheses / Confidence notes) — drafts land for Johan's review, and reports stay comparable match-over-match.

## 7b. Manifest drafts ×6 — FOR JOHAN'S REVIEW (live in DECK_STRATEGY, bot v0.6.73)

- **hacking** — *Ashur-cycling swarm: cap-1/2 crypt floods the table fast, Leverage-class bleed pressure every turn, Ashur Tablets recycle the engine; win by tempo before the table organizes.* axes: swarm-bleed · cycling · tempo
- **wall** — *Intercept fortress: block-first posture, equipment intercept (Bowl/Bike class), punish attempted actions and grind; win late by outlasting. Pairs with LOW-aggression personas (recipe-B find: unlocked minions ARE the wall).* axes: wall · intercept · attrition
- **sewer** — *Weenie stealth-bleed: obfuscate swarm slips small bleeds through every turn; minimal combat, race the clock.* axes: stealth-bleed · swarm · race
- **malkavian** — *Stealth-bleed with intel: dem/obf bleed engine, Kindred Spirits class chip damage, Revelations-style hand reads; win by steady pressure and information.* axes: stealth-bleed · intel · pressure
- **tremere** — *Bounce-wall with THA reach: aus intercept + Deflection-class bounce redirects pressure, Theft tempo swings blood; win by deflected attrition.* axes: wall · bounce · blood-tempo
- **nosferatu** — *Menace attrition: Fame/Creeping pool pressure + [ANI] rush control keeps threats in torpor; win by bleed+drain, not combat volume.* axes: menace · rush-control · stealth-bleed

*(Edit freely — these are drafts; the bot reads whatever the table says.)*

## 9. The V-track — vampire special abilities (Johan's gap, 26 July: REAL)

Confirmed: the engine reads crypt **disc** (all/sup), **cap**, and **title** — but
the vampires' CARD TEXTS (special abilities) are unmodeled. That is a large
share of many decks' potential. Sequenced AFTER the A-steps per Johan:

- **V1 — audit:** the six registered decks' ~54 crypt cards' texts classified
  into ability families (unlock/intercept auras, bleed modifiers, combat
  abilities, income, vote effects beyond titles, directed-action riders).
- **V2 — schema:** crypt cardfx entries gain `modes[]` like lib cards
  (the three-tier methodology transfers wholesale).
- **V3 — engine consumers per family,** deck-driven depth: the families the
  six decks actually use land first; the scanner-lesson discipline applies
  (every settle engine reads KEYS, never names).

## 8. Step ladder

- **A2** — ✅ **SHIPPED 26 July** (bot v0.6.73, arena v1.2.3, suite 610/0 ×3, end-to-end trace-proven: manifest ×3 with curated strategy + effective knobs, snapshot ×24 unlock+react, scores riding every action decide). **A2b remainder:** bounce-card + combat play-windows (the helper exists, wiring is mechanical); first-unlock snapshot can show the pre-init nominal pool (dossier reads dealt.startPool or t2+).
- **A3** — ✅ **SHIPPED 26 July** (gen-match-dossier v1.0.1: tiers full/compact, T-refs, manifests-first, per-turn FACIT union, frozen battle-report scaffold appended; smoke 4k/3k tokens on the A2 trace; PRE-INIT flag on seat 1's first snapshot).
- **A4** — ✅ **SHIPPED 26 July** (battle-report-a4-match1.md: first live review on a FRESH fully-instrumented cross-clan match — the frozen template held; headline find: Deep Song's bleed mode outbids its own rush mode (scores podium proved it, T9/T17), Shark's hand froze all match (FACIT ×5 identical), wall manifest undersells its bleed leg. Two knob lines + two logic hypotheses delivered as drafts).
- **A5** — ✅ **SHIPPED 27 July** (harvest v1.1.0 + bot v0.6.77 turn-field: Metrics section — influence tempo EXACT via raise emits, cycling approx (honestly labeled undercount pending A2b), bleed pressure curves, torpor/reaction counts, gap notes. First story immediate: Novice raises 1/2/5 vs Shark/Grinder's single turn-2 raise — the SECOND-minion stall now has numbers; cycling correlates exactly with oust order; the Computer Hacking metronome visible as [2,2,2,2…]).
- **A4-followup** — ✅ **SHIPPED 26 July** (battle-report-a4b-followup.md: hand-starvation cure VERIFIED from the other side — no Deep Song drawn, Creeping tabled in the first window; the rescued podium visibly live in every scores line; expectation weighting unit-proven, production observation pending the next Deep-Song draw. New: the Baixinho bottleneck couples the superior gate to influence ORDER — sup-ani raise preference is the next logic hypothesis; wall×novice 3/3 → recipe B before any tuning).
- **A6** — ✅ **SHIPPED 27 July** (gen-batch-review v1.0.0: N traces → ONE comparative doc — per-match one-liners, cross-match A5-metric tables, frozen SERIES scaffold incl. version-deltas section + the deep-dive pick; smoke on serie-a4's three engine versions, ~1k tokens; pre-.76 raise columns honestly labeled). **THE A-LADDER IS COMPLETE.**
- **A2b** — ✅ **SHIPPED 27 July** (bot v0.6.78, dossier v1.0.5, 623/0 ×3, live: block-made ×5 + react-bounce + combat-strike/steal in the first match): PLAY emits for the combat window + the bounce card (region-found), BLOCK-MADE at _commitBlock (block economy's missing half), RECOVER at all three torpor→ready sites (torpor time derivable). Deliberately out: master play-emit (decide covers), income-SETTLE emit + line-2253 raise consolidation (noted for later).
