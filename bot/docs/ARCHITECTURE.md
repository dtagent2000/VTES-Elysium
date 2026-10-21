# ARCHITECTURE — how the bot is built and where each decision lives (20 Oct 2026, bot v0.6.211)

For people and agents. The bot is one file, `elysium-bot.js` (~9,600 lines, one IIFE), loaded by Node (the arena, the sim, the
suites) and by the browser (hotseat; the export lands on `globalThis.ElysiumBot`). Everything the bot knows about the game it
reads from the table's lines and boards; the client enforces no rules.

## The layers (top down = wire in; bottom up = play out)
```
wire        ws / transport / the hotseat bridge  →  _dispatch(m)  →  _mkHandlers()  {board, log, chat, say, tally, fx, turn, dealt, …}
parse       _onLog / _onChat (the L12 frozen-line grammar; _parseCombatNarration on both tiers)  →  _evClassify (the event log)
table model this.opp[seat] via _scanOpp (boards) + _noteObserved + the L12 writers  →  oppCombat / oppStealth / oppForecast /
            turnsToOust / oppAxes / oppCombatCost / oppPosture ; this.table[seat].pub ; handIntel (reveals only)
knowledge   _twdExpect(seat) (the TWD profile's shares: combat, stealth, intercept, bounce, press; the archetype label) ;
            the priors behind _blockRisk, _expOppStrike, _pCat
plan        _strategize(tag) at unlock and at the minion head → this.plan {phase, posture, target, home, floor, wOff, wDef, reads}
tactics     the finders (_best*For: master, action, political, equip, fetch, stealth, intercept, wake, bounce, …), the
            windows (_askBlock, _reactWindow, the combat steps), the scorers per decision
decide      decide(q, ctx) → _decide(q, ctx): one row per real decision (q = action, block-as-target, spend-stealth,
            bleed-modifier, bleed-target, combat-strike, combat-end, act-again, income-drain, income-direction, master-play,
            block-bar, bank-in, spy-cancel, cancel-block, lock-*, give-lock, hunt-or-bleed, wave, react-delay, ashur-retrieve)
speech      note() (log tier, events) · chat() (questions and instructions to a human) · say() (the quick phrases) → the send
            queue (_drain: the 200 ms cascade, the chat beat, the hold) → wire
pacing      _pace(kind) / _afterBeat ; the tempo (_waitPlan) ; the hold (_holdFreeze / _holdThaw) ; status() / step() for the
            Bot button
trace       emit(kind, data) → the arena's / sim's match-NNNN.jsonl (manifest, snapshot, decide, play, plan, through, blocked,
            block-made, combat-round, wait, …; 84 kinds)
```
The three rules that keep the layers apart: tactics READ the plan and never recompute it; every read about an opponent goes
through `this.opp[seat]` (public evidence only); a decision knob gates decisions only (CLAUDE.md, binding rules).

## Where each decision lives
| Decision | Scorer / site | Reads | Row |
|---|---|---|---|
| What a minion does this phase | `decide('action')` ← `_decideAction`, the finders, the turn ledger (`_turnActs`), the probe (`_probe`) | plan, `_twdExpect`, `oppForecast`, the hand | `decide` q `action` (scores per candidate) |
| Who to bleed / bounce to | `bleed-target` | prey, the bounce rule (always my prey today) | `decide` |
| Pump a bleed | `bleed-modifier` | the total, the blocker's intercept history, `_pPump` | `play` window `bleed-mod`, `bleed-total` |
| Block or not (as target) | `block-as-target` ← `_blockRisk`, `_keepBlocker`, the threat classes T1–T6 | plan.home, `oppCombatCost`, the deck axes; `_actionClass` (offensive / economy / utility; the hit rate divides blocked by offensive only) | `block-eval`, `block-made`, `defence-plan` |
| Bounce timing | `_reactWindow`, `_bounceReserve` | the TOTAL after modifiers, the reserve | `play` window `react-bounce`; `bounce-total` / `bounce-kept` tags |
| Stealth on a contested action | `spend-stealth`, `_stealthStack`, `_stealthSecondLook`, the ahead rule | the counter, my stack, `_pCat` | `stealth-stack`, `stealth-ahead`, `play` |
| Intercept as blocker | `_commitBlock`, `_interceptSecondLook` | the counter, my hand | `intercept-stack`, `play` |
| Combat, each step | `_resolveCombat` (the seven steps), `_wantGrapple` / `_wantPress` / `_wantPressToEnd` / `_wantLong`, `combat-strike` (`_strikePick`, the dodge), `combat-end` | `DECK_STRATEGY.combat`, `_expOppStrike`, the known strike (peek) | `combat-round`, `combat-phase`, `play` windows `combat-*` |
| Rush | the rush targeter in the action finder, `_rushExpectation` | target blood, my kit, env damage | `rush-counterfactual`, `rushed` |
| Referendum | `_bestPoliticalFor`, `_callReferendum`, `_refDeltas`, the voter | `_refValue`, pass estimate, title votes | `referendum-called`, `referendum`, `ref-vote` |
| Influence | `_planInfluence` (`_deckFit`, the planner), `_riseFromUnc` | plan.floor, `_critPool`, the crypt | `influence-plan`, `influence-pick`, `raise` |
| Masters, income, banks | `master-play`, `income-drain`, `income-direction`, `bank-in`, `lock-income` | pool (≥ 1 left), the hand | `play`, `income-*`, `bank` |
| Act again | `act-again` (`_maybeActAgain`) | the ledger, `_keepBlocker`, `_critPool` | `act-again` |
| Set-up cards (Haven) | the look-ahead through `_actionCtxFor` + `_actionCtxAdjust(…, ahead)` + `_decide` | the real action ctx | `haven` |
| Waits on a human | `_waitPlan(kind, who)`; block / react / pq / vote / phase / damage / verdict | the tempo (`botcfg`), the hold | `wait`, `tempo` |

## Files
| File | Role |
|---|---|
| `elysium-bot.js` | the bot; `BOT_VERSION`; decks (`*_DECK`, `ARCHETYPES`), `DECK_STRATEGY`, `PERSONAS`, `L12` (the frozen-line grammar), `FX_NORM`, `prepCardfx`, `class Bot`, `BOT_EXPORTS` |
| `elysium-cardfx.json` / `.js` | the card-effect library (auto tier for the whole pool + 105 curated), built by `cardfx-compile.js` from `cardfx-curated.json` + `vtes.json` |
| `elysium-twd-profile.json` / `.js`, `elysium-twd-archetypes.json` / `.js` | the TWDA prior (per clan × group window × discipline signature: shares and labels), built by `twd-profile.py` / `twd-archetypes.py` |
| `deck-*.json`, `rig-a1.json`, `design-balanced-serie-bal1.txt` | the decks, a rig, the balanced seat design |
| `elysium-bot-sim.js` | THE SIM TABLE: the hotseat table under a virtual clock, deterministic, every seating |
| `elysium-bot-hotseat.js` | the client's real `hotBridge` lifted and driven headless (the hotseat gate; the sim's engine) |
| `elysium-bot-arena.js` | bots on a real spawned server (real clocks; the timing truth) |
| `elysium-bot-table.js` | seat bots at a live table |
| `elysium-bot-diag.html`, `diag-hb1-smoke.js` | the browser battery (HB1) |
| `test-bot-logic.js` | the suite (2,244 assertions at v0.6.211, sections numbered up to 157; live sections spawn the server) |
| `test-bot-canary.js` | the §12 grammar contract against the client html + protocol |
| `test-cardfx.js` | the compiler's contract (needs `vtes.json`) |
| `test-bot-hotseat.js` | the hotseat gate (H1–H11) |
| `gen-*.js`, `ana-*.py/js`, `lab-probe.js` | trace tools (HOWTO) |
| `tools/run-section.sh`, `tools/mutants/`, `tools/doc-budget.sh` | one suite section against any bot; mutant isolation; the docs budget |
| `elysium-vtes-bord.html`, `elysium-server.js`, `ELYSIUM-PROTOCOL.md`, `elysium-hotseat-bots-plan.md` | READ-ONLY copies of the client project's releases |

## Shared with main (who owns what, and where the release lives)
| Artefact | Owner | Release lives at | In `bot/` |
|---|---|---|---|
| `elysium-vtes-bord.html` (the client, `hotBridge`) | main | the root (= `client/`'s release) | read-only copy |
| `elysium-server.js` | main | the root | read-only copy |
| `ELYSIUM-PROTOCOL.md` (§12: the frozen bot lines) | main | `client/` | read-only copy |
| `elysium-hotseat-bots-plan.md` | main | `client/docs/` | read-only copy |
| `test-bot-canary.js` (pins §12 against the client) | main | `client/` | an identical copy, refreshed with the others |
| The bot bundle (`elysium-bot.js`, cardfx, the TWD files, `START-HERE-BOTS.html`) | bot | `bot/` → copied to the root | the source |
| Root `CLAUDE.md` | shared: each side edits its own lines | the root | — |

## The three environments
- **Online** (the server): the ledger narrates every resource change; `tally` and `bounty` are relayed; the bot is a remote
  player. The arena spawns this server.
- **Hotseat** (the client's `hotBridge`, no server): the bot seat is a remote player inside one HTML file; the bridge fans
  `log` / `say` / `chat` / `board` / `fx` / `tally` / `bounty` (parity since client v2.6.124); the no-server net (`joined.srv`
  starts `hotseat-bridge`) handles ousts and bounties, and the tally net rebuilds a missing foreign tally from the frozen lines
  (a belt timer of 60 % of askSecs, min 1.2 s). A bot spawned without `deckName` infers its deck from the object / printed name /
  exact list (explicit wins; the built-in default gets none). The browser load: `o.transport` injects the dial, `o.cardfxData` the
  parsed fx; suite section 75 is the browser gate (a vm sandbox with zero Node globals) and 75d pins the IIFE against a client-page
  top-level collision. The sim and the hotseat gate drive this bridge headless. A known asymmetry, left in deliberately (70g):
  the no-server net keys on `joined.srv`, not on what the bridge relays, so with *Pool to predator* OFF a bot predator marks the
  human out and takes the 6 pool by itself offline, while online it does neither; revisit if main or a tester objects.
- **Human tables**: the tempo (Standard / Adaptive / Turn-based), the hold, the chat beat, one spokesbot, the debug hand.
  Nothing here reaches the arena or the sim (paceMs 0 zeroes every beat; bots never operate the hold).

## Running a game in three commands
```
node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue --seeds 1 --trace /tmp/sim-x      # one seating set, ~1 s a match
node elysium-bot-arena.js --matches 1 --bots 4 --decks malkavian,tremere,nosferatu,ventrue --start-pool 30 --seed 4003 --trace /tmp/serie-x
node elysium-bot.js --server ws://HOST:8123 --room R --pass P [--persona expert] [--debug]              # seat one bot at a live table
```

## Words a new session meets
**kör** — Johan's go-ahead. **§12** — the protocol's section of frozen bot lines (main's). **L12** — the bot's table of parsers
for those lines. **HB1** — the browser battery (`elysium-bot-diag.html`). **R1–R4** — the rounds of the 14 Oct play-test review.
**CL n / 64a / 65f** — a debt number of the old bootstrap (`history/CLAUDE-v2-2026-10-20.md`). **The stable** — the four V5
starters. **240 last-standing** — the sim's 240-match client design (every seating × 10 deals) all played to one survivor.
**Pinned** — a bench arm whose variant sits on one deck only. **Negative control** — A vs A, the bench's noise floor.
**Egress review** — a fresh-context agent's review of a round's diff (HARNESS). **Footprint** — the matches a change DIVERGED.

## Design canon (the standing specs in `docs/specs/`)
`elysium-bot-spec.md` (the original) · `elysium-bot-strategy.md` (the plan) · `elysium-bot-table-model-spec.md` ·
`elysium-bot-block-doctrine.md` (B1–B3) · `elysium-bot-persona-spec.md` (four layers, the final filter) ·
`elysium-bot-politics-theory.md` + `spec-referendum-terms-2026-09-18.md` · `elysium-bot-combat-v2-plan.md` +
`spec-client-combat-controls-2026-09-23.md` · `spec-bot-tempo-2026-09-27.md` (the tempo) · `spec-hotseat-bridge-relays-2026-09-11.md`
(parity) · `elysium-cardfx-design.md` + `cardfx-persistent-lock-design-decisions.md` + `cardfx-sweep-audit.md` (cardfx) ·
`spec-knowledge-layer.md` (K0–K2, the TWD prior) · `elysium-bot-helper-gate-decision.md` · `elysium-bot-feedback-loop-spec.md` ·
`elysium-arena-observability-plan.md` · `elysium-bot-influence-planner-spec.md` · `elysium-bot-phase-income-v2-plan.md` ·
`spec-cleanup-2026-10-20.md` (the four projects' review, the clean-up, the abstract model's place) · `spec-block-bar-2026-09-18.md`
(the block-bar line, still owed to main's §12) · `spec-event-log-design-2026-09-25.md` (the event log, episodes in shadow mode,
real-time invariants, the bench; a status table on top) and `spec-cardfx-sweep-sources-2026-09-25.md` (KRCG, vtes-rulings and
vtes-skill mapped onto the cardfx fields; the method for graded readings) — both copied from Johan's Claude Docs of 25 Sep
([event log design](https://claude.ai/artifact/S5PiF7x5PhpU4JSSQgp9Dx), [sweep mapping](https://claude.ai/artifact/AGzYhap2bMyc4vwhRFzUUj)).
