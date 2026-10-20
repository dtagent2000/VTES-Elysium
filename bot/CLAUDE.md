# CLAUDE.md — Elysium Bots (`bot/`): the session bootstrap (v3.0, 20 October 2026)

Automated V:TES opponents for the Elysium client — a free table that does not enforce the rules, so the bot carries its own
model of them (cardfx + the table model) and reads the table's lines. Claude writes and maintains the code; Johan rules and
merges. Chat in Swedish; code, commits and docs in English. This file carries the rules that bind a change. History lives in
git, `docs/elysium-bot-CHANGELOG.md` and `docs/history/`.

## Bootstrap (every session, in this order)
1. Root `CLAUDE.md` — the one rule for both halves, deploy = copy to the root, third-party data.
2. This file.
3. `docs/STATUS.md` — now: version, deploy state, open PRs, the last gate numbers, what is next.
4. `docs/BOARD.md` — the open asks; take one.
5. When the task touches them: `docs/RULINGS.md` (any rules or design question — check it before asking Johan), `docs/LESSONS.md`
   (before building anything with timing, tests or measurements), `docs/ARCHITECTURE.md` (where a decision lives),
   `docs/HOWTO.md` (running, debugging, analysing), `docs/HARNESS.md` (the round, the reviews, the release ritual).
6. `git checkout -b <topic>` — never work on `main`.

Run every suite and tool from inside `bot/`: the folder is flat on purpose, everything expects its inputs beside it.
`bot/README.md` maps the files. `tools/doc-budget.sh` checks the standing pages (run it before any docs PR).

## The one rule (ownership)
`bot/` never edits `client/` or the client/server files at the root. The copies of `elysium-server.js`, `ELYSIUM-PROTOCOL.md`,
`elysium-vtes-bord.html` and `elysium-hotseat-bots-plan.md` inside `bot/` are READ-ONLY release copies: replace them by copying a
release in, never patch. A need on main's side is a handoff (`docs/handoffs/HANDOFF-to-main-<date>-<version>.md`); main ships the
contract first and the bot consumes it next round, or the bot ships first when the change is backward compatible. Never both
halves in one PR. A bot release = bump `BOT_VERSION` (the line carries the version only; the note goes to the CHANGELOG), copy the
bundle (`elysium-bot.js`, `elysium-cardfx.json/.js`, `elysium-twd-profile.json/.js`, `elysium-twd-archetypes.json/.js`,
`START-HERE-BOTS.html`) to the repository root. Never edit the root in place.

## Gates (the bot's own battery; the numbers in STATUS are the last known green)
- `node --check` on every changed file.
- `node test-bot-logic.js` ×3, ALONE, each run in a frozen snapshot (HOWTO: "a frozen snapshot"). ~300–420 s a run: launch it
  detached with `timeout 600` and poll (`run_in_background`); never a foreground `timeout` that can cut a green run. Section 78c
  is a known timing flake (one rerun; not a reason to ship). The suite needs every owned file beside it — a missing
  `elysium-bot-arena.js` aborts and looks like a failure.
- `node test-bot-canary.js` — the §12 grammar contract against `elysium-vtes-bord.html` + `ELYSIUM-PROTOCOL.md` beside it (the
  read-only copies); without them it skips loudly, never fakes a pass. Run it a second time against the root's release.
- `node test-cardfx.js` when cardfx changed (needs `vtes.json` beside it — root `CLAUDE.md`, "Data that is not in git").
- `node diag-hb1-smoke.js` when the bot's browser surface changed (needs `elysium-bot-diag.html` beside it).
- `node test-bot-hotseat.js` when anything near the hotseat bridge changed.
- A new test is verified DESTRUCTIVELY against the pre-change file (`tools/run-section.sh`, HOWTO). A section that throws on the
  old bytes proves only that a method is new — say so.
- A series or a bench runs on the sim table first (`elysium-bot-sim.js`, HOWTO); `python3 ana-sim-diff.py A B` before any win
  rate; after a series the audits: `ana-ledger.py`, `ana-block.py` (0 violations), `ana-inv.py`, `ana-windows.py` (lost
  answers 0), and the `zeroPool` count in SUMMARY.md (0). The sim is not a timing gate: the canary, the hotseat gate and the
  server arena stay; `--real` replays a spec on the real clock.
- An abort on the pre-change bot is NOT automatically the environment: find the last release the suite was green on and run THAT
  (LESSONS, "tests that lie"). Never claim a gate passed without having run it.

## The round
`docs/HARNESS.md` has it in full: take a BOARD line → analyse, propose, wait for "kör" on any "how should we do X" → change →
gates → a fresh-context egress review → STATUS rewritten, CHANGELOG entry, the BOARD line deleted (RULINGS / LESSONS when they
changed) → PR against `main` with the gate numbers and the review's line. Commit and push as soon as a step is green (context can
run out). Johan merges. End every implementation round with an honest "anything I'm unsure about" paragraph, unasked — it is a real
hunt, not a formality. Johan's combining rule (16 Oct 2026): a fix found during a round may ride in that round when it fits; say so
in the PR. A design question still gets an analysis, a proposal and a "kör" first.

## The goal and the layers (Johan)
- **The goal (20 Sep 2026):** not a chess engine — a COMPETENT THREAT at the table that fills a seat when players are short; bots
  that play their cards correctly with good priorities, judged by a well-founded feel from observation. Prefer decision-level reads
  with large effects over VP differences. No deck is held back: Malkavian plays as well as it can (RULINGS, personas & table).
- **Three layers (19 Sep 2026):** (1) STATISTICS, serving every bot's thinking; (2) GENERAL handling, serving every deck of that
  kind; (3) the DECK PERSONA, informing one list. Put a change in the lowest layer it belongs to.
- **Four checks (19–20 Oct 2026):** the abstract model (not built) → the sim table and the server arena → a bots-only browser
  table (HB1, main's playtest rig) → humans. One metric list across all four.

## Binding rules (one paragraph each; the stories are in LESSONS / history)
- **The plan rule (v0.6.119c).** Tactics READ `this.plan` (phase, posture, target, home, floor) and never recompute it; a new
  strategic read gets a field in the plan and a line in `docs/specs/elysium-bot-strategy.md`, never an ad-hoc test inside a
  tactic. No persona term inside `_strategize`; the persona filters after it.
- **The table-model rule (v0.6.118).** Every read about an opponent goes through `this.opp[seat]` (`oppCombat`, `oppStealth`,
  `oppCombatCost`, `oppForecast`, `turnsToOust`, `oppAxes`) — public information only, prior-blended; never a card name, a deck
  name or hidden information (`handIntel` is filled only by reveal messages and stays separate). New opponent facts get a writer
  in `_scanOpp` / `_noteObserved` / the L12 handlers, never an ad-hoc field.
- **The knowledge-layer rule (v0.6.187+).** Every expectation about a seat comes from PUBLIC evidence only (its crypt, the cards
  it has shown, its lines); the TWD profile is a prior, observations take over. A knowledge knob ships at 0 and flips to 1 only
  after a bench (48, all seats, vs the negative control) shows no loss. A rule only one deck's cards can trigger is benched PINNED
  to that deck against a pinned control on the same seeds; count the rule's own decisions per tag to prove it fired. An archetype
  LABEL is explanation, not a decision: only a confident label (margin ≥ 2, coverage ≥ 0.85) may inform a decision, benched like
  any knob. A new profile share is APPENDED (readers index `f[0..3]`); a rebuilt profile is first reproduced byte for byte by the
  old script. Bots look away from a seat that announced DEBUG mode.
- **The tier rule (v0.6.114).** `note()` for events (log tier, no bubble), `chat()` ONLY for questions and instructions to a human,
  `say()` for the frozen phrases. Before adding a `chat(...)`, ask whether an fx clone or a frozen log line already carries the
  event; if so it is a note or nothing. `fxClone` takes `{ actor: vamp }` for every minion play. A new `note()` text is a LOG line
  other bots' L12 parsers read: check it against `L12.actObs` (`^(.+?) (hunts|plays (.+?))[.!]`) and the frozen §12 shapes; never end
  a note with `plays X.` or `hunts.`.
- **The duplicate rule (v0.6.117).** Online the server's ledger narrates every pool / blood / zone / lock / face change — the bot
  writes no note for an event the play line, the fx clone or the ledger already shows; a note survives only where it explains a
  WHY the table cannot see (Jack ticks, does-not-unlock, Misdirection, an uncurated warning). What a human says aloud is one chat
  bubble in table words (`_influenceSentence`, `I vote N against.`, `No votes from me.`, `I take N. Pool: X.`).
- **The helper-gate rule (v0.6.113).** Nothing in the bot decides on `caps.tally` or any helper state: game logic is weighed on
  the merits; the structured narration (`Phase:` lines, own stealth / intercept on the shared tally, the §12 verdict at the clock)
  is the bot's own protocol and unconditional. `caps.tally` is diagnostic only. Before re-adding any gate read
  `docs/specs/elysium-bot-helper-gate-decision.md`.
- **Lines are the contract, fields the accelerator (main, 23 Sep).** Every combat decision taken from a tally field has a line
  fallback (range from `maneuvers to` / `sets range to`, press from `presses to`, strikes from the strike lines, damage from
  `takes N (…)`); prefer a HUMAN's field when it disagrees with the last line; never require the field. `combatPhases` is not
  built on `ph`.
- **The combat handshake rule (v0.6.156).** Every combat EVENT the opposing bot must know (a maneuver, a press, Immortal Grapple,
  Carrion Crows, my strike, my taken line) is a frozen phrase on the LOG tier, and `_parseCombatNarration` reads it from BOTH tiers.
  A new combat announcement gets its phrase, a parser in that one method and a section-125-style test through `_onLog`, or the
  other bot never hears it. `ana-combat2.py`'s handshake-integrity line is the gate: under 100 % on a bot-only table = a broken
  phrase. "Do I want to" lives in `_wantGrapple` / `_wantPress` / `_wantPressToEnd` / `_wantLong` reading `DECK_STRATEGY.combat`
  (chase / snipe / wave), never as a threshold at the play site. Per-round state resets at the round's start, per-combat state in
  `_resolveCombat`'s `finally`; a flag about a LATER step dies where its scope ends. Between bots the acting bot strikes first and
  the answering bot PEEKS (`_awaitOppStrikePeek`) before it chooses; the acting minion is one rule, `_combatIActing()`.
- **The cardfx cost rule (compile v1.6.14).** A curated entry without `cost` inherits the data's numeric cost; explicit curated
  cost wins; X is never inherited; the compile report's inherited / mismatch / X lists are read at every recompile. Every restored
  price is an unpaid cost until a finder reads `cost.blood` / `cost.pool` and its branch pays it. Costs are parked at announce and
  returned on a block (`_park` / `_returnParked`). A curated entry keyed by a printed variant is mirrored onto the printed name;
  never rename a key a bot list uses (`fxLookup(name).name` must equal the hand's own name).
- **`FX_NORM` is the client's `norm()`**, byte for byte (section 154f compares them over every cardfx name against the released
  client one level up). When main changes `norm()`, copy the table.
- **Knob hygiene (v0.6.162).** A decision knob gates DECISIONS only. A rules correction (what a card or strike legally does, what a
  message means, a timing race) is never behind a knob; when a release mixes the two, split them before shipping. Every decision
  knob has a 0-path that is the previous behaviour, documented in its line.
- **The event log (v0.6.176).** A new frozen line gets its event kind in `_evClassify` in the same release as its parser. The
  classifier reads the line as SENT (`NAME (bot)`), specific shapes before generic ones.
- **The ledger gate (v0.6.163).** An effect that moves something between two bots and shows on only one side is a bug until
  explained. Resolve an effect at its RULES moment, not when its line arrives; pair the rows before accepting an explanation for a
  total; a bleed `through` that no seat took is `VANISHED` (gate 0).
- **The block gate (v0.6.170, Johan: base rules).** Stealth and intercept are spent only when needed: the actor plays stealth only
  after a block attempt and only while intercept ≥ stealth; the blocker plays intercept only while stealth > intercept. Directed
  actions carry 0 stealth; the undirected +1 applies to BASIC actions only (hunt, equip, employ, recruit, political, rescue own
  vampire, leave torpor); an action card is at 0 unless it prints stealth, and its printed "+N stealth action" is the total
  (cardfx `actStealth`). `ana-block.py` 0 violations.
- **The ahead rule (v0.6.152).** While the block counter reads a > b the actor plays NO stealth card; against a human it says
  `<vamp> currently has N stealth — …` once per (blocker, a, b) and waits for the counter. The first look against a human runs
  AFTER the reaction beat; second-look stealth, the blocker's intercept card and cancel-block land after the beat and are re-checked
  against the counter. Intercept by chat (bare `N` = total, `+N` = added) only while my action is contested.
- **The window rule (v0.6.206).** A window opens in the SAME tick as the line it opens on — never an `await` between sending that
  line and `_askBlock`. A guard about what the table has SEEN keys on the line the answer answers (`_openLine`), not on my queue.
  A bot's answer that arrives while `_openLine` is still queued is a `stale-answer` row, never a human's.
- **The beat rule (v0.6.152, v0.6.207).** `_pace` waits paceMs from the LATEST visible event at the table (my own act or anybody
  else's say / log / chat / tally / fx; boards never re-anchor); `_afterBeat(kind, guard, fn)` for a synchronous handler that wants
  a visible act to follow; paceMs 0 runs everything at once (the suite and the arena are byte-identical). The chat beat separates
  two CHAT bubbles and nothing else (`_lastChatWireAt`); a hold or resume line skips it.
- **The tempo gate (v0.6.194, `docs/specs/spec-bot-tempo-2026-09-27.md`).** A wait on a HUMAN never reads `askSecs` / `phaseSecs`
  directly: it asks `_waitPlan(kind, who)` (block / react / pq / vote / phase / damage / verdict), writes a `wait` row, has its
  `t0`, its Turn-based reminder text and a `status()` / `step()` rung. Bot-vs-bot windows never read the tempo (`mode: 'bots'`).
  Adaptive's skip is RULES-strict (skipped only when the human has no legal answer; strike and press always asked). No botcfg = the
  clocks of old, byte for byte. A wait's clock starts when its question is ON THE WIRE (`_afterWire`); time the whole flow, not the
  wait you changed.
- **The hold gate (v0.6.198, Johan's principle agreed with main).** A Hold on stops EVERY clock that waits on a human and each
  starts again from the beginning on the release. A new wait on a human: its arm checks `_held()` and freezes (`_freezeWait`),
  `_holdFreeze` freezes it on a hold, `_holdThaw` re-arms it FRESH when `_holdBy` empties, `_holdAnnounce()` when nobody else can
  announce; one-shot timers through `_heldTimeout`. An ANSWER still ends a wait at once. A vote, a Yes or a No is an answer, never a
  release; only the flow phrases release (`_releasePauses` ends every holder's pause). Bots never operate the hold.
- **The look-ahead rule (v0.6.205).** A card that sets up a later decision is played only when that decision's OWN scorer would
  take the set-up option now: build the real ctx (`_actionCtxFor`), apply only the corrections that hold before the phase starts
  (`_actionCtxAdjust(…, ahead)`), ask `_decide` (the bare scorer, no trace row). Test a phase effect THROUGH the phase: a hook a
  unit test calls directly proves the hook, not that the turn calls it.
- **The pool rule (v0.6.210).** Every pool cost leaves ≥ 1 pool (the last pool paid is an oust); the turn engine ousts me at 0 pool
  on my own turn. Every own-turn pool loss has the oust check beside it.
- **Count in the arena, weigh in a lab (v0.6.206).** A decision the arena meets once a match is measured on the same table per arm
  (`lab-probe.js` + `ana-lab.py`); the arena proves the knob fires and carries the audits. Before reading a bench arm, prove the
  knob fires (a trace row, a counter, a test on the real line shape). A strength claim needs the mirror bench (48 matches, the
  variant in every seat, read against the negative control, ±0.5 VP at 48); a 12-match series supports mechanism counts only.
- **Determinism and footprints (v0.6.209).** The same sim spec gives the same trace byte for byte; the matches that DIVERGED are the
  change's footprint — read them before any VP. Seating shapes the tactical choices, so a deck-level claim covers every seating.
- **Traces.** Bot names rotate between matches: deck and seat come from the trace MANIFESTS (`manifest.seat`; older traces map
  the `--decks` order), never from a name, a name sort or emission order. VP facts (source-verified 4 Aug 2026, do not re-derive):
  1 VP per prey oust; sole survivor +1 full VP; ½ VP each to time-limit survivors when more than one remains; winner = MOST VP even
  if ousted (`deriveWinner`; tiebreak alive → latest-ousted); the ≥ 2-VP GW clause is tournament ranking, not the table rule.
  Winners from pre-arena-v1.2.5 traces are re-derived via `computeVp` / `deriveWinner`.
- **Debug density (v0.6.112).** The weighting log is dense by default (every `decide` branch renders a `why` except `react-delay`
  and hunt-or-bleed's empty return). If it looks sparse at the table, give the early return a `why`; never fabricate reasoning in
  `_logWeight`.
- **Evaluation doctrine (Johan, 4 Aug 2026).** Every shipped tactical change gets its OUTCOME evaluated in the next report against
  its registered prediction (change · prediction · observed · verdict: keep / tune / revert). Register falsifiable predictions
  BEFORE measuring; a failed half is a map, not a verdict.

## Personas and decks (facts a session needs)
- Personas: `novice` / `experienced` / `expert` (Johan, 21 Sep: the toggle is simulated experience; EXPERT is the default for
  client-spawned bots). `shark` = expert and `grinder` = experienced are aliases in old scripts and old traces. `new Bot({})` with
  no persona keeps the bare base knobs (hundreds of fixtures stand on it). Persona thresholds still live inside some tactics
  (BOARD); do not add more.
- Decks: the four V5 starters (`deck-malkavian/tremere/nosferatu/ventrue.json`) + `hacking` (the tournament benchmark) + `sewer`;
  `wall` is an archetype fixture only. `DECK_STRATEGY` carries each manifest (the reviewer's yardstick) and `combat` posture. Seven
  decks are also embedded in `elysium-bot.js` (duplicated; BOARD).
- The hidden-hand design (K0 discipline priors → K1 deck templates → K2 odds; the TWD profile and archetype labels) is
  `docs/specs/spec-knowledge-layer.md`.

## Pointers
`docs/STATUS.md` · `docs/BOARD.md` · `docs/RULINGS.md` · `docs/LESSONS.md` · `docs/ARCHITECTURE.md` · `docs/HOWTO.md` ·
`docs/HARNESS.md` · `docs/elysium-bot-CHANGELOG.md` · `docs/specs/` (design canon) · `docs/handoffs/` (to main, and main's
replies in `client/docs/handoffs/REPLY-to-bot-*.md`) · `docs/reports/` · `docs/reviews/` · `docs/coverage/` ·
`docs/history/` (the journal, every READ-ME-FIRST, the old CLAUDE.md's handshake and debts, the dated learnings, the old context).
