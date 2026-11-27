# ARCHITECTURE — how the bot is built, where each decision lives and the rules of each area (20 Oct 2026; the rules 26 Nov 2026)

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
            queue (_drain: the 200 ms cascade, the chat beat, the floor, the hold) → wire
board       push() → buildPub at drain time (the cards; a card's named counters, else the bot's own tokens, _memoMap, D-113) → wire
pacing      _pace(kind) / _afterBeat ; the tempo (_waitPlan) ; the hold (_holdFreeze / _holdThaw) ; status() / step() for the
            Bot button
trace       emit(kind, data) → the arena's / sim's match-NNNN.jsonl (manifest, snapshot, decide, play, plan, through, blocked,
            block-made, combat-round, wait, game-over, combat-superseded, fizzled, game-resumed, memo, contract, …; 116 kinds)
```
The three rules that keep the layers apart: tactics READ the plan and never recompute it; every read about an opponent goes
through `this.opp[seat]` (public evidence only); a decision knob gates decisions only (CLAUDE.md, binding rules).

## Binding rules by area (moved from CLAUDE.md, D-142; they bind a change in their area)
### Lines and speech
- **The tier rule.** [D-64, L-55] `note()` for events (log tier, no bubble), `chat()` ONLY for questions and instructions to a human
  (D-137: the same question to a bot without the human's tail; one speaker at a time where `_floorOn`), `say()` for the quick phrases (the `SAY` table: Hold on, No block, Block! …). Before adding a `chat(...)`, ask whether an fx clone or a frozen log line already carries the
  event; if so it is a note or nothing. `fxClone` takes `{ actor: vamp }` for every minion play. A new `note()` text is a LOG line
  other bots' L12 parsers read: check it against `L12.actObs` (`^(.+?) (hunts|plays (.+?))[.!]`) and the frozen §12 shapes; never end
  a note with `plays X.` or `hunts.`.
- **The duplicate rule.** [D-64] Online the server's ledger (`ledgerLive`; not a helper, and never offline) narrates every
  pool / blood / zone / lock / face change — the bot
  writes no note for an event the play line, the fx clone or the ledger already shows; a note survives only where it explains a
  WHY the table cannot see (Jack ticks, does-not-unlock, Misdirection, an uncurated warning). What a human says aloud is one chat
  bubble in table words (`_influenceSentence`, `I vote N against.`, `No votes from me.`, `I take N. Pool: X.`). A line another
  bot must parse is never a duplicate (the combat handshake rule below: v0.6.114 deleted such lines and broke six days of series).
- **A new bot line.** [L-55] The machine-readable line goes out BEFORE the line that opens a window (the terms line, the block-bar line
  precedents), and a bot-emitted frozen line belongs in main's §12 with a canary case (a handoff when it is new).
- **The event log.** [L-56] A new frozen line gets its event kind in `_evClassify` in the same release as its parser. The
  classifier reads the line as SENT (`NAME (bot)` on the log tier; a chat has no prefix since D-137), specific shapes first.
- **The helper-gate rule.** [D-63, L-11] Nothing in the bot decides on `caps.tally` or any helper state: game logic is weighed on
  the merits; the structured narration (`Phase:` lines, own stealth / intercept on the shared tally, the §12 verdict at the clock)
  is the bot's own protocol and unconditional. `caps.tally` is diagnostic only. Before re-adding any gate read
  `docs/specs/elysium-bot-helper-gate-decision.md`.
- **Lines are the contract, fields the accelerator (main).** [D-27, D-94, L-57] Every combat decision taken from a tally field has a line
  fallback (range from `maneuvers to` / `sets range to`, press from `presses to`, strikes from the strike lines, damage from
  `takes N (…)`); prefer a HUMAN's field when it disagrees with the last line; never require the field. `combatPhases` is not
  built on `ph`.
### Combat
- **The combat handshake rule.** [R-28, R-29; L-34, L-35, L-55] Every combat EVENT the opposing bot must know (a maneuver, a press, Immortal Grapple,
  Carrion Crows, my strike, my taken line) is a frozen LINE on the log tier (`note()`), and `_parseCombatNarration` reads it from
  BOTH tiers. A new combat announcement gets its line, a parser in that one method and a section-125-style test through `_onLog`, or the
  other bot never hears it. `ana-combat2.py`'s handshake-integrity line is the gate: under 100 % on a bot-only table = a broken
  line. "Do I want to" lives in `_wantGrapple` / `_wantPress` / `_wantPressToEnd` / `_wantLong` reading `DECK_STRATEGY.combat`
  (chase / snipe / wave), never as a threshold at the play site. Per-round state resets at the round's start, per-combat state in
  `_resolveCombat`'s `finally`; a flag about a LATER step dies where its scope ends. Between bots the acting bot strikes first and
  the answering bot PEEKS (`_awaitOppStrikePeek`) before it chooses; the acting minion is one rule, `_combatIActing()`. Every
  await of a combat is followed by its token check (`stale()`, `sup(round)`, `ct !== this._combatTok`), and a new combat ends the
  waits of one still in flight: a combat a later one superseded says, writes, spends and waits nothing more [L-89].
### Cardfx
- **The cardfx cost rule.** [R-17, D-54; L-67] A curated entry without `cost` inherits the data's numeric cost; explicit curated
  cost wins; X is never inherited; the compile report's inherited / mismatch / X lists are read at every recompile. Every restored
  price is an unpaid cost until a finder reads `cost.blood` / `cost.pool` and its branch pays it. Costs are parked at announce and
  returned on a block (`_park` / `_returnParked`). A curated entry keyed by a printed variant is mirrored onto the printed name;
  never rename a key a bot list uses (`fxLookup(name).name` must equal the hand's own name). A new hand fx key on a library entry,
  or a backlog key on one more card, is answered in `cardfx-sharing.json` first: who else prints it [D-125; HOWTO].
- **`FX_NORM` is the client's `norm()`**, byte for byte (section 154f compares them over every cardfx name against the released
  client one level up). When main changes `norm()`, copy the table.
### Block
- **The block gate (the owner on the base rules).** [R-12, R-14, R-38] Stealth and intercept are spent only when needed: the actor plays stealth only
  after a block attempt and only while intercept ≥ stealth; the blocker plays intercept only while stealth > intercept (a card that says otherwise is its own exception: Creepshow Casino at the announce, D-104). Directed
  actions carry 0 stealth; the undirected +1 applies to BASIC actions only (hunt, equip, employ, recruit, political, rescue own
  vampire, leave torpor); an action card is at 0 unless it prints stealth, and its printed "+N stealth action" is the total
  (cardfx `actStealth`). Stealth and intercept can go below 0 (R-38). `ana-block.py` 0 violations.
- **The ahead rule.** [D-14, D-15, R-16] While the block counter reads a > b the actor plays NO stealth card; against a human it says
  `<vamp> currently has N stealth — …` once per (blocker, a, b) and waits for the counter. The first look against a human runs
  AFTER the reaction beat; second-look stealth, the blocker's intercept card and cancel-block land after the beat and are re-checked
  against the counter. Intercept by chat (bare `N` = total, `+N` = added) only while my action is contested.
### Timing
- **The window rule.** [L-25, L-26] A window opens in the SAME tick as the line it opens on — never an `await` between sending that
  line and `_askBlock`. A guard about what the table has SEEN keys on the line the answer answers (`_openLine`), not on my queue.
  A bot's answer that arrives while `_openLine` is still queued is a `stale-answer` row, never a human's; once the line has left the
  queue it is on the wire (a hotseat bridge before client v2.6.177 delivers inside the send, L-92); `_drain` never sends inside a send.
- **The beat rule.** [D-65, D-70; L-29, L-36] `_pace` waits paceMs from the LATEST visible event at the table (my own act or anybody
  else's say / log / chat / tally / fx; boards never re-anchor); `_afterBeat(kind, guard, fn)` for a synchronous handler that wants
  a visible act to follow; paceMs 0 runs everything at once (the suite; the arena adds the 'as played' grace, `asPlayedMs` 500, D-122). The chat beat separates
  two CHAT bubbles and nothing else (`_lastChatWireAt`); a hold or resume line skips it.
- **The tempo gate (`docs/specs/spec-bot-tempo-2026-09-27.md`).** [D-66, D-68, D-69; L-27, L-28] A wait on a HUMAN never reads `askSecs` / `phaseSecs`
  directly: it asks `_waitPlan(kind, who)` (block / react / pq / vote / phase / damage / verdict), writes a `wait` row, has its
  `t0`, its Turn-based reminder text and a `status()` / `step()` rung. Bot-vs-bot windows never read the tempo (`mode: 'bots'`).
  Adaptive's skip is RULES-strict (skipped only when the human has no legal answer; strike and press always asked). No botcfg = the
  clocks of old, byte for byte. A wait's clock starts when its question is ON THE WIRE (`_afterWire`); time the whole flow, not the
  wait you changed: a handshake wait after a tempo wait is `_lineGraceMs` against a human, and a shortened wait that was somebody's
  only window becomes an asked step (`_phaseStep(5, 'reply')`). Measure with `ana-wait.py` before claiming a tempo is faster.
- **The hold gate (the owner's principle, agreed with main).** [D-67, D-31; L-32] A Hold on stops EVERY clock that waits on a human and each
  starts again from the beginning on the release. A new wait on a human: its arm checks `_held()` and freezes (`_freezeWait`),
  `_holdFreeze` freezes it on a hold, `_holdThaw` re-arms it FRESH when `_holdBy` empties, `_holdAnnounce()` when nobody else can
  announce; one-shot timers through `_heldTimeout`. An ANSWER still ends a wait at once. A vote, a Yes or a No is an answer, never a
  release; only the flow phrases release (`_releasePauses` ends every holder's pause); completion (everyone has spoken) is
  not a clock; a question asked under a hold must not promise a clock (`_waitTail`). The stopwatch invariants: the ring
  never re-stamps a PAUSED window (`pausedBy.size`), `_restartAskTimer` re-arms it, and a window ends ≤ reactClockMs + reactSecs +
  grace after the last activity. Bots never operate the hold.
### Decisions
- **The look-ahead rule.** [D-58; L-13] A card that sets up a later decision is played only when that decision's OWN scorer would
  take the set-up option now: build the real ctx (`_actionCtxFor`), apply only the corrections that hold before the phase starts
  (`_actionCtxAdjust(…, ahead)`), ask `_decide` (the bare scorer, no trace row). Test a phase effect THROUGH the phase: a hook a
  unit test calls directly proves the hook, not that the turn calls it.
- **The self-price rule.** [R-19, D-37] A self-price mode (`selfDmg` / `selfAggr` / `selfTorpor`) is closed to every generic finder
  (`_modeUsableBy(mo, vamp, { selfPrice: true })` opens it); a new consumer pays through `_actingVamp.selfPrice` +
  `_settleSelfPrice`, which today runs at the end of the BLEED branch only.
- **The knowledge-layer rule.** [D-78, D-81, D-82, D-68] Every expectation about a seat comes from PUBLIC evidence only (its crypt, the cards
  it has shown, its lines); the TWD profile is a prior, observations take over. A knowledge knob ships at 0 and flips to 1 only
  after the sim's mirror bench (all seats, paired against the negative control) shows no loss. A rule only one deck's cards can trigger is benched PINNED
  to that deck against a pinned control on the same seeds; count the rule's own decisions per tag to prove it fired. An archetype
  LABEL is explanation, not a decision: only a confident label (margin ≥ 2, coverage ≥ 0.85) may inform a decision, benched like
  any knob. A new profile share is APPENDED (readers index `f[0..3]`); a rebuilt profile is first reproduced byte for byte by the
  old script. Bots look away from a seat that announced DEBUG mode.
- **The ledger gate.** [R-23; L-33, L-39] An effect that moves something between two bots and shows on only one side is a bug until
  explained. Resolve an effect at its RULES moment, not when its line arrives; pair the rows before accepting an explanation for a
  total; a bleed `through` that no seat took is `VANISHED` (gate 0).
- **Debug density.** The weighting log is dense by default (every `decide` branch renders a `why` except `react-delay`
  and hunt-or-bleed's empty return). If it looks sparse at the table, give the early return a `why`; never fabricate reasoning in
  `_logWeight`.

## Where each decision lives
| Decision | Scorer / site | Reads | Row |
|---|---|---|---|
| What a minion does this phase | `decide('action')` ← `_decideAction`, the finders, the turn ledger (`_turnActs`), the probe (`_probe`); a card on a minion (`_bestAttachFor`, host `_attachFight`) and the experiment's employ (`_bestAnimalEmployFor`; both employs ask `_retainerReqMet`); the queue's key referendum (`_minionKeyOrder`, `_polHold`, the Ball's keep skip `_ballFreeId`) | plan, `_twdExpect`, `oppForecast`, the hand | `decide` q `action` (scores per candidate), `key-order`, `pol-hold` |
| Who to bleed / bounce to | `bleed-target` | prey, the bounce rule (always my prey today) | `decide` |
| Pump a bleed | `bleed-modifier` | the total, the blocker's intercept history, `_pPump` | `play` window `bleed-mod`, `bleed-total` |
| Block or not (as target) | `block-as-target` ← `_blockRisk`, `_keepBlocker`, the threat classes T1–T6 | plan.home, `oppCombatCost`, the deck axes; `_actionClass` (offensive / economy / utility; the hit rate divides blocked by offensive only) | `block-eval`, `block-made`, `defence-plan` |
| Bounce timing | `_reactWindow`, `_bounceReserve` | the TOTAL after modifiers, the reserve | `play` window `react-bounce`; `bounce-total` / `bounce-kept` tags |
| Stealth on a contested action | `spend-stealth`, `_stealthStack` (`_actCondOk`), `_stealthSecondLook`, the ahead rule; a rider mode wins its card's tie (`riderTie`) | the counter, my stack, `_pCat` | `stealth-stack`, `stealth-ahead`, `play` |
| Intercept as blocker | `_commitBlock`, `_interceptSecondLook`, `_spendIntercept` (a card or a location's lock, `_lockInterceptFor`); Night Terrors (`_nightTerrorsFor`); every finder asks `_dirOk` (D-123, D-127) | the counter, my hand, my locations | `intercept-stack`, `stealth-zero`, `play` |
| Combat, each step | `_resolveCombat` (the seven steps), `_wantGrapple` / `_wantPress` / `_wantPressToEnd` / `_wantLong`, `combat-strike` (`_strikePick`, the dodge), `combat-end`; free first: a rush card's maneuver / press (`_rushGrantFor`), a card on the minion (`_eachManeuverFor`); the struck side's weapon nullifier (`_oppWeaponNulled`); Night Terrors' round-1 combat ends | `DECK_STRATEGY.combat`, `_expOppStrike`, the known strike (peek) | `combat-round`, `combat-phase`, `play` windows `combat-*` |
| Rush | `_bestRushFor`: a card (`_bestCardRushFor`: `rushTo`, its cost, its printed stealth), a Haven or a contract by key (`_grantOf`, `_bestHavenRushFor`), a granted rush; `_rushExpectation`; the rushed bot reads card and level from the line (`_rushLineMode`: a `ceBan` against it); a locked target unlocked at resolution fizzles (R-46); a cloak its rusher cannot pierce is skipped (D-124) | target blood, my kit, env damage | `rush-counterfactual`, `rushed`, `rush-grant`, `contract-pool` |
| Referendum | `_bestPoliticalFor`, `_callReferendum`, `_refDeltas`, the voter; Absolute Tyranny's cut (`_tyrannyCut`, `_tyrannyReactFor`) | `_refValue`, pass estimate, title votes | `referendum-called`, `referendum`, `ref-vote`, `vote-cut` |
| Influence | `_planInfluence` (`_deckFit`, `_engineY`, the planner), `_riseFromUnc` | plan.floor, `_critPool`, the crypt | `influence-plan`, `influence-pick`, `raise` |
| Masters, income, banks | `master-play` (`_bestMasterFor`: no `oot`, `_masterReqOk`, `_masterHold`), `income-drain`, `income-direction`, `bank-in`, `lock-income` (one lock, one effect) | pool (≥ 1 left), a ready vampire meeting the requirements, the hand | `play`, `income-*`, `bank`, `unc-blood` |
| Out-of-turn answers | `_archonFor` / `_playArchon` in the react window; Sudden Reversal (`_srFor`) in a master's 'as played' window (`_asPlayed`), True Love's Face's counter in the card's (`_cancelPayFor`); `_ootDebt` at my next turn | the bleed at me, a master, pool | `archon`, `archoned`, `oot-debt`, `sr-cancel`, `sr-cancelled`, `sr-decline`, `sr-late`, `sr-taken-back`, `pay-cancel` |
| Act again | `act-again` (`_maybeActAgain`; Monster is a board source); Shadow Cloak first (`_maybeCloak`) | the ledger, `_keepBlocker`, `_critPool` | `act-again`, `cloak` |
| Masters on a vampire | `_masterHostPlan` (the host or held, `_masterHostOk`; `_grandBallPlan`: the Ball's pair, its wait `_ballGuard` (D-117); a human's Ball: `_hMemoLog` → `_humanBallFree`, D-113); `_masterNoHost` makes an unhostable one a dead card | the hand, my crypt, `_titleOf`, `_discOf`, `_capOf` | `master-play`, `grand-ball`, `ball-wait`, `memo` |
| If blocked | `_ifBlockedStep`: Terrifying Visage, Mirror Walk [THA] (`blockedLockEnd`; a blocker hears it at the stealth line, `pending.riderLock`), Change of Target (`_cotWorth`; `_noteCotAct`) | the blocker's expected strike, my combat enders | `blocked-lock-end`, `change-of-target`, `visage` |
| Polling-step abstain | `_bestAbstainFor` / `_playAbstain` in `_callReferendum` (the poll reopens after it); the lock on my prey's voter (`_scalpelLockPlan`) | `rc.agBy`, the seat's title votes, my queue | `abstain` (`use: 'lock'`) |
| Burn a card in play (Jack D-114) | `burnCard` (`_bestBurnCardFor`; Jack `_jackBurnValue`); the owner's `_complyBurnCard`; my Jack's worth on `_burnWindowOpens` | the owner's votes; `_planJack`'s reads | `burn-card`, `card-burned` |
| Set-up cards (Haven, Priority Contract) | `_havenHostPick(card)`: the look-ahead through `_actionCtxFor` + `_actionCtxAdjust(…, ahead)` + `_decide` (the contract's chosen also by `_aheadNoAct`); the contract's 3 pool `_contractBurn` | the real action ctx | `haven`, `contract` |
| Waits on a human | `_waitPlan(kind, who)`; block / react / pq / vote / phase / damage / verdict | the tempo (`botcfg`), the hold | `wait`, `tempo` |

## Files
`bot/README.md` maps every file. Inside `elysium-bot.js`: `BOT_VERSION`; the decks (`*_DECK`, `ARCHETYPES`), `DECK_STRATEGY`,
`PERSONAS`, `L12` (the frozen-line grammar), `FX_NORM`, `prepCardfx`, `class Bot`, `BOT_EXPORTS`. The READ-ONLY copies of main's
releases beside it: "Shared with main" below.

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
- **Online** (the server, which the arena spawns): the ledger narrates every resource change; `tally` and `bounty` are relayed.
- **Hotseat** (the client's `hotBridge`, no server): the bot seat is a remote player inside one HTML file; the bridge fans
  `log` / `say` / `chat` / `board` / `fx` / `tally` / `bounty` (after the send since client v2.6.177); the no-server net (`joined.srv`
  starts `hotseat-bridge`) handles ousts and bounties, and the tally net rebuilds a missing foreign tally from the frozen lines
  (a belt timer of 60 % of askSecs, min 1.2 s). A bot spawned without `deckName` infers its deck (explicit wins). The browser load: `o.transport` injects the dial, `o.cardfxData` the
  parsed fx; suite section 75 is the browser gate (a vm sandbox with zero Node globals). The sim and the hotseat gate drive this
  bridge headless. A known asymmetry, left in deliberately (70g): with *Pool to predator* OFF a bot predator marks the human out
  and takes the 6 pool by itself offline (the no-server net keys on `joined.srv`), while online it does neither.
- **Human tables**: the tempo (Standard / Adaptive / Turn-based), the hold, the chat beat, the floor (D-137: a bubble waits until
  another seat's has left the screen; `_floorOn`: a 1.5 s pace, a 10 s ask clock, no clocked tempo with a human), one spokesbot, the debug hand. The arena never sees them
  (paceMs 0 zeroes every beat; bots never operate the hold); the sim's client profile (paceMs 3100) has the beats and the floor.

## Words a new session meets
**kör** — the owner's go-ahead word. **§12** — the protocol's section of frozen bot lines (main's). **L12** — the bot's table of parsers
for those lines. **HB1** — the browser battery (`elysium-bot-diag.html`). **R1–R4** — the rounds of the 14 Oct play-test review.
**CL n / 64a / 65f** — a debt number of the old bootstrap (the private data repo's `bot-history/CLAUDE-v2-2026-10-20.md`). **The stable** — the four V5
starters. **240 last-standing** — the sim's 240-match client design (every seating × 10 deals) all played to one survivor.
**Pinned** — a bench arm whose variant sits on one deck only. **Negative control** — A vs A, the bench's noise floor.
**Egress review** — a fresh-context agent's review of a round's diff (HARNESS). **Footprint** — the matches a change DIVERGED.

## Design canon (the standing specs in `docs/specs/`; a delivered round spec is in `docs/history/specs/`)
`elysium-bot-spec.md` (the original) · `elysium-bot-strategy.md` (the plan) · `elysium-bot-table-model-spec.md` ·
`elysium-bot-block-doctrine.md` · `elysium-bot-persona-spec.md` · `elysium-bot-politics-theory.md` + `spec-referendum-terms-2026-09-18.md` ·
`elysium-bot-combat-v2-plan.md` + `spec-client-combat-controls-2026-09-23.md` · `spec-bot-tempo-2026-09-27.md` ·
`spec-hotseat-bridge-relays-2026-09-11.md` · `elysium-cardfx-design.md` + `cardfx-sweep-audit.md` · `spec-knowledge-layer.md` ·
`spec-card-sweep-2026-11-18.md` (the V5 sweep: the active plan) · `spec-cardfx-sweep-sources-2026-09-25.md` (the sources mapped
onto the cardfx fields) · `spec-event-log-design-2026-09-25.md` · `spec-cleanup-2026-10-20.md` (the abstract model's place) ·
`spec-v5-wave1-2026-10-29.md` (the additional-strike protocol) · `spec-block-bar-2026-09-18.md` · the helper gate, the feedback
loop, the observability, influence and phase-income plans by their names.
