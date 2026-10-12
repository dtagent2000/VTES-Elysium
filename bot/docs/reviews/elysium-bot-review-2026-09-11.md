# Elysium Bot — Deep Review Ledger (11 September 2026, bot v0.6.102 / arena v1.2.7)

> **Status 11 Sep 2026, end of day:** A1 (v0.6.103: #1 #2 #4), A2 (v0.6.104: #8 #6 #10 #13), C (v0.6.105 + curated 90: Spying Mission, Foreshadowing, Blood Doll/Vessel), A3 (v0.6.106 + table v1.1.0: #3 #5 #7 #11 #12 #14), B1 (v0.6.107 + arena v1.2.8: #9 the undirected window, threat classes, block-eval) SHIPPED. Open: #15 (the `_runAction` template — B2), the T1 deck axes (B2), #16 (refresh the read-only copies before the next series), Haven Uncovered (B2, data + consumer).
>
> The review's findings lived only in a chat; this file is the durable record so the fix rounds can
> start cold from project files. Suites at review time: `test-bot-logic.js` 753/0, `test-cardfx.js`
> 207/0 (with `vtes.json` beside it). Companion: `elysium-bot-block-doctrine.md` (the design canon that
> grew out of the review). Conversation in Swedish, docs in English.

## Findings

| # | Sev | Where (v0.6.102) | Finding | Evidence | Fix (track) |
|---|---|---|---|---|---|
| 1 | **High** | `_onLog` strike lines, `_onChat` taken/press/maneuver/grapple parsers; the five `_awaitOpp*` stashes | Bystander contamination: strike/press/maneuver/grapple lines from ANY seat's combat are stashed; the next own combat consumes the stale stash first (line 2929 checks the stash before waiting). Stashes are never reset at combat start and never filtered by combatant. Each combat then consumes the previous combat's real line — a cascade. Bites every ≥ 3-seat table, arena and hotseat alike; at human tables it replaces the assume-1 fallback with a stale bot strike. | Offline repro (feed two foreign strike lines + a press, then `_awaitOppStrike/Taken/Press` return them). Real 3-bot arena (nosferatu/tremere/hacking, pool 15, 2 matches, prototype-instrumented): 5 stash consumptions, 2 contaminated — Grinder in combat vs Smudge consumed Mustafa Rahman's strike stashed while not in combat; Grinder's next combat then consumed Smudge's real strike. | A1: clear the stashes when the bot itself announces an action (actor side, in `_announceTallyA` next to `_lastBlockerName`) and when it commits a block (defender side); filter every stash by the known opponent vampire (`_combatOppName` defender side, `_lastBlockerName` actor side), accept unnamed lines only while `_inCombat`. Note the press regex captures `"Trainbot combat — Lisa"` as the vampire name — fix before filtering. Offline destructive test, not a full arena match (suite budget). |
| 2 | Medium | `_playTurn` minion phase, `const prey = this.decide('bleed-target')` computed once (line 4180); `_askBlock` preyOut | Stale prey after a mid-phase oust: actors 2..n bleed the ousted seat; `_askBlock` resolves 'no' at open, the `bleeds for N` line and "goes through" chat still go out, Edge taken, no damage. Swarm decks waste the rest of the phase. Deeper: at paceMs 0 the next actor's ask opens before the prey's `bounty`/`roster` can even be processed (no macrotask yield between 'It resolves' and the next `_askBlock`), so re-reading `preySeat()` per actor is not enough. | Code read; server `bounty` handler sends `bounty` to the predator, then `sys`, then `rosterUpd` (FIFO). | A1: per-actor prey; after a resolved bleed/pool damage that can oust (target pub pool ≤ amount) await the roster/bounty settle (bounded, e.g. 500 ms) before the next actor; the `bounty` handler sets a flag the loop reads. |
| 3 | Low | `roster` handler | Ghost-prey mid-ask hook is dead code: `p.seat === this.preySeat() && p.out` can never hold because `preySeat()` already skips `out` seats. | Code read. | A3: compare against `_actingVamp.target` (store the ask's target on `_ask`). |
| 4 | Medium | `interceptPotential` vs `_pickBlocker`; `_commitBlock` says `Block!` before picking | Decision/execution drift (the v0.4.1/v0.4.3 class again): the decision ignores `p.attempted`, the pick excludes it → `Block!` then `Pass` with no candidate; the actor may burn stealth on the phantom attempt and sits contested for a full askSecs. | Code read. | A1: pass `p.attempted` into `interceptPotential`; move `say('Block!')` after the blocker pick. |
| 5 | Medium | `_holdHook` / `_ask.pausedBy` | A human's Hold on… is never released when the holder disconnects or leaves; the bot freezes (only the 90 s reminder runs). | Code read. | A3: on `roster`, release holds/pauses for players `!online`, `vacant` or `out`. |
| 6 | Low | `_reactWindow` chip-saver | Reads `PERSONAS[this.o.persona]` instead of `this.persona` — object personas and knob overrides ignored (the v0.6.16 `grinderReadyTarget` class). | Code read. | A2 (sibling sweep with #10). |
| 7 | Low | line 71 | 10 kB of v0.6.9–0.6.21 history still rides the file after the "history extraction"; file is ~46 % comments (190 of 409 kB) and ships to every hotseat player. | `awk` byte count. | A3 (or any release). |
| 8 | Medium | `_menaceUnlockEngine` Smiling Jack victim side (line 1871) | Reads `this.players[].pub` — the roster never carries pubs (they live in `this.table[seat].pub`); no bot ever pays for an opponent's Jack. Test fixture at line 3936 codifies the wrong shape (false green). Same bug fixed in `_tableThreat`/`_rushCandidates` at v0.6.57; this sibling was missed. | Offline repro: opponent Jack with 3 counters in `table[2].pub` left pool 20 unchanged. | A2: read `this.table`, fix the fixture destructively. |
| 9 | Medium (tactical) | `_onLog` arm sites (bleed / poolDmg / peek only) | Bots never block undirected actions (hunt, equip, employ, recruit, stock, creep, Revelations [AUS]) or rushes from other bots: no pending is armed, so no react window; every such action burns the full askSecs at bot tables. Walls cannot "punish attempted actions". Johan (11 Sep): bots should block undirected actions; the prioritisation is the hard part — hence the doctrine. | `grep` of L12 keys and `_armPending` call sites. | B1 (doctrine §5). |
| 10 | Low | `_menaceUnlockEngine` Jack floor (line 1873) | Third `PERSONAS[this.o.persona]` site. | Code read. | A2. |
| 11 | Medium (online) | `connect()` `onClose` | No reconnect although the server supports token rejoin (server line 1338) and the bot keeps `this.token`; a network blip = dead seat for the rest of the game. | Code read. | A3: retry dial + rejoin with token while `started`. |
| 12 | Low | `elysium-bot-table.js` v1.0.0 | No `--decks`: every live-table bot plays DEFAULT_DECK. | Code read. | A3. |
| 13 | Low (tactical) | `_applyPhaseIncome` | Blood Doll / Vessel always drain, even the last blood → forced hunts; the cards are two-way (verified in vtes.json) and the Malkavian sheet says feed, not drain. | Code + card text. | C (curate `poolToBlood`) + A2/B2 (`income-direction` decide, last-blood floor). |
| 14 | Low | chat parsers | Every chat line is prefixed "Trainbot:" regardless of `o.name`; the B-55e-b blocker-name regex is hard-wired to that prefix (`^Trainbot: (.+?) attempts the block`) — renaming the prefix breaks the parser and #1's name filter with it. `bleed N`/`vote N` accepted from anyone (grief vector on public tables). | Code read. | A3 (change prefix and parser together, or move the blocker name to a frozen log line). |
| 15 | Structural | `_playTurn` (660 lines, twelve copies of announce→ask→block/resolve→flush); master loop card-specific branches (Misdirection, Fame, Jack, Pentex) despite `CARD_HANDLERS`; `DECK_STRATEGY.axes` emitted, read nowhere; `_liveCount`/`readyCrypt` read nowhere as phases | Sibling-drift surface grows with every new action kind; the manifest's strategy cannot steer play. | Code read. | B1/B2: `_runAction` template before new action kinds; axes + phase into `_decide`. |
| 16 | Process | read-only copies / CLAUDE.md handshake | Arena spawns srv-2.6.32 while main is at srv-2.6.35 / client v2.6.88 (handshake says v2.6.73); `test-bot-canary.js` skips here because the released client is not beside it. | Version greps. | Before A1: upload the current client, protocol and server releases; refresh the handshake. |

## Data corrections found while checking the V5 sheets against cardfx (verified in `vtes.json`, 11 Sep)

| Card | cardfx today | Printed | Effect today | Fix (track C) |
|---|---|---|---|---|
| Spying Mission [OBF] | `bleed:2` (auto) | the bleed becomes unsuccessful, burns no pool; card goes on the vampire; +2 on the next successful bleed vs the same Methuselah | offered as a +2 modifier on the bot's own successful bleed; announces `adds +2 bleed`; the prey takes phantom pool. Live on 4 of 12 Malkavian crypt cards (Norton, Colette, Silverson ×2). | curate `{bleedNullify:true, bleedBank:2}` + consumer (B2) |
| Foreshadowing Destruction [DOM] | `bleed:3` unconditional | +3 only if the target has ≤ 9 pool (limited) | +3 announced against a fat prey → phantom pool | curate `req:{targetPoolMax:9}`; finder reads the target's pub pool |
| Blood Doll / Vessel | `bloodToPool:1` only | move 1 blood vampire→pool **or pool→vampire** (Blood Doll at master, Vessel at unlock, Trifle) | always drains (#13) | curate `poolToBlood:1`; `income-direction` decide |
| Haven Uncovered | `master, persistent, stealth:1` (auto) | put on a ready vampire; minions may enter combat with it as a +1 stealth Ⓓ action | tabled unattached on the bot's own board — a wasted master action | curate `fx.rushGrant` with Fame's tabled-on-my-board + frozen-line target law; consume in `_bestRushFor` |

## Tracks and sequence (agreed shape, 11 Sep 2026)

- **A — hardening:** A1 = #1 + #2 + #4 (+ offline destructive tests, then a new 5p30 baseline);
  A2 = #8 + #6 + #10 + #13-floor (sibling sweep, fixture 3936 fixed destructively); A3 = #3 + #5 + #7 +
  #11 + #12 + #14. One release per session.
- **C — curation:** the four data corrections through `cardfx-curated.json` → `cardfx-compile.js` →
  `test-cardfx.js` (baseline 207/0). Touches only cardfx files, so it can sit between A rounds.
- **B — doctrine:** after A (B1 extends the react path A1/A3 touch): B1 undirected window + threat
  classes + `block-eval` + arena metrics; B2 phases, action order, opening book, per-deck playbooks and
  deck-default personas; B3 climate sensor consumption, stance, meta drift.
- Preconditions for A1: the current client / `ELYSIUM-PROTOCOL.md` / server releases beside the bot
  (canary runs, handshake refreshed); `vtes.json` beside `test-cardfx.js`; this ledger and the doctrine
  in the project.

## Repro recipes (for the destructive tests)

- **#1 offline:** `started=true`, three players, `_onLog('A', '<b>Zip</b> strikes with .44 Magnum for 3.')`,
  `_onLog('B', '<b>Lisa</b> strikes (hands) for 1.')`, `_onChat('B', 'Trainbot combat — Lisa presses to continue.')`
  → `_awaitOppStrike(50)` returns Lisa's strike, `_awaitOppPress(50)` returns `continue:true` for a bot that
  was never in combat. Post-fix: both must return null (timeout) unless the bot is in combat with that vampire.
- **#1 arena:** patch `Bot.prototype._onLog/_onChat/_awaitOpp*` to tag each stash with `{who, inCombat}` and
  log every consumption with `_combatOppName`/`_lastBlockerName`; `runArena({bots:3, decks:['nosferatu','tremere','hacking'], startPool:15, askSecs:1})`.
- **#8 offline:** `table[2].pub` with a Smiling Jack carrying counters, roster without pubs, `_menaceUnlockEngine()` → pool must drop.
