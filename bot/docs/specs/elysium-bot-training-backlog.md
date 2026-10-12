# Elysium Bot — Training-Track Backlog (T-items)

> **11 Sep 2026:** the block-priority design canon now lives in `elysium-bot-block-doctrine.md` (threat classes, per-deck playbooks from the BCP V5 sheets, the meta-game section from Loughman's *The Game of the Game*, the arena metrics of its §6). B1 (the undirected window) shipped as bot v0.6.107; B2/B3 items are listed in its §4.1/§5/§2.7. The deep-review ledger with the A/C/B track status is `elysium-bot-review-2026-09-11.md`.

> **Created 16 July 2026** (bot v0.5.7 / cardfx v1.4.2 / client v2.6.41 / server v2.6.16). The training
> track's OWN backlog, split out from `elysium-backlog.md` on Johan's call so parallel sessions can patch
> documentation without colliding — the main backlog now only points here. Discussion layer:
> `elysium-bot-strategy.md` (the L0–L4 ladder §4, metrics §5, deck-read §9). Same contract as the main
> backlog: every item carries **What / Why / How / Why deferred / Test**, written to be executable without
> re-deriving today's analysis. When an item ships: mark it here, journal it, update the living docs as usual.

---

## Revised roadmap (24 July 2026 — Johan + Claude, the evaluation round; supersedes the 16 July block below where they differ)

Agreed three-step sequence after the full-project evaluation (journal 24 July):

**Steg 1 — five decks to 100%** (the five REGISTERED archetypes; hacking/wall/sewer are 100% already, Malkavian 95%, Tremere 94%): *(a)* **Equipment v1** — the attached-equipment board-scan + fetch-equipment action; clears Tremere's .44 Magnum + Magic of the Smith AND one of combat-plan §9's cross-cutting gaps in the same build; *(b)* Misdirection + Pentex™ Subversion handlers (the TABLED-ONLY pair); *(c)* **Revelations LAST** — needs opponent-hand visibility via the existing reveal/grant protocol mechanics (NOT a bot sense; the relay-is-the-fairness-boundary rule) — costliest item, least play value per hour; Malkavian is functionally complete at 95% meanwhile. Hygiene rider: **hunting-ground per-VAMPIRE ledger** (Johan confirmed 24 July: the rule reads per vampire — Papillon + a clan HG may feed two different vampires the same turn; today's global flag is conservative-only, zero impact on the tracked single-HG decks, but wrong-shaped for multi-HG decks and T9b-read opponents).
**Order revised (Johan, 24 July, later the same day):** Revelations moves FIRST — the
Malkavian-100% push, with the three client features (mode chooser / chat bubbles / bot
signalling) as enablers; see `elysium-bot-revelations-plan.md` (the R-track: R0 spike
EXECUTED, R1 client -> R2 hand-intel -> R3 the card). Equipment v1 + the TABLED-ONLY
pair follow after. The human-backup constant (humans can always run the bot's elements
manually) is frozen as a stated principle in that plan's section 0.

**Steg 2 — the arena as simulation + training-data machine:** T1 ✅ DONE (below) → T2 seeded deals → T3 harness (duplicate seating also SEPARATES persona from deck — the conflation arena v1.1.4 now warns about) → **T6 as the step's backbone** (Johan's context-schema requirement, see T6 — the decide traces ARE the training data; VP outcomes alone are too sparse) → T4 persona search → T9b priors. P1 "silent politics" (V(seat)-aware targeting, politics-theory doc) may slot at the END of this step as mechanical strength; deals/table-talk stay in step 3. The human-anchor rule stands: periodic Johan live sessions per T4.

**Steg 3 — politics (P2+):** needs a VOTE deck (a new archetype — `votes` is tagged on 60 cards, zero consumed today) and the Ventrue-grinder deck file recovered into the project (`vtru-grinder-johan.json` is absent from the snapshot; 'grinder' is unregistered in ARCHETYPES — the superior-Govern path is rig-reachable only).

## Recommended priority (Claude's call, 16 July 2026)

**NOW — small, pays immediately, independent of the 4-archetype milestone:**
1. **T6 `--explain` decision traces** — the smallest build of the nine; upgrades every live test Johan
   already runs; its trace format is the foundation for T8 AND the intent model (strategy doc §6:
   build once, render twice). Do first.
2. **T1 arena benchmark spike** — an afternoon; produces the ONE number (games/hour) every L1/L2
   promise depends on.
3. **T9a deck-read VERIFICATION spike — ✅ DONE 16 July 2026, verdict GO** (see
   `t9a-deck-read-verification.md`): all three unknowns resolved, zero protocol changes needed.
- **T5 coverage-per-playbook** is a **standing rule**, not a queued task — runs whenever a playbook is
  authored or the bot's consumption code changes.

**AT/NEAR the 4-archetype milestone — the L1→L2 chain, strictly in dependency order:**
4. **T2 seeded deals** → 5. **T3 evaluation harness (L1)** → 6. **T4 persona parameter search (L2)**.
7. **T9b deck-read BUILD** — after T3, so the arena's known-deck games measure inference calibration
   from day one; also far more valuable once opponents play real archetypes.

**OPPORTUNISTIC / later:**
8. **T7 ghost seat** — schedule against a real game night; medium build, human-time-bound payoff.
9. **T8 replay fixtures** — highest long-term payoff, most design; wait until T6's trace format has
   survived a few live rounds unchanged.

Rationale in one line: T6/T1/T9a are cheap and de-risk everything else; the L1→L2 chain is ordered by
hard dependency; T7/T8 are valuable but gated on human sessions and format stability respectively.

**Standing discipline for the coding era: ONE rung per session.** The theory docs
(`elysium-bot-strategy.md`, `elysium-bot-politics-theory.md`) are reference material, never a
session's scope — a code session implements exactly one T/P item through the full ritual, and
resists the temptation to "also just add" V(seat) while T6 is open.

---

## T1 — Arena benchmark spike (games/hour) — ✅ DONE 24 July 2026 (arena v1.1.4)
**What/Why:** unchanged — the ONE number every L1/L2 promise depends on.
**EXECUTED** (sandbox hardware — Johan's machine will shift absolutes; magnitudes and knob
sensitivities transfer). Arena v1.1.4 added per-match wall-clock + event counts + a games/hour
summary line (no separate `--benchmark` mode needed), and lifted `--bots` to 2–5 (server
MAX_PLAYERS=6 source-verified). Matrix, deck `hacking` (100% coverage), pace 0:
- 3 bots · pool 12 (6 matches): **34.3 s/match · 3 743 ms/player-turn · ≈ 105 games/hour**
- 4 bots · pool 12: 49.3 s · 4 110 ms/turn · ≈ 73/h
- 5 bots · pool 12: 58.4 s · 4 072 ms/turn · ≈ 62/h — 5-seat runs CLEAN (full oust ladders, no hangs)
- 3 bots · pool 30: 79.1 s · **5 652 ms/turn** · ≈ 45/h — turns get LONGER as boards grow, not just more numerous
- ask-secs 4 vs 2: **FLAT** (3 566 vs 3 743 ms/turn) — bot-vs-bot handshakes resolve on ANSWER,
  not timeout; the expiring-window suspicion only applies against silent (human/ghost) tables.
  The other suspected driver, thinkMs, was killed in SOURCE before measuring: persona.thinkMs is
  structurally inert at paceMs 0 (the 40 ms react-delay branch) — no arena knob needed.
- **Addendum (same day, standing-question probe):** deck-mix matters — wall/sewer/wall (combat-heavy)
  measured **2 590 ms/player-turn** (≈97/h, spread 29.8–47.9 s/match), CHEAPER than hacking's 3 743 —
  so "stable ms/player-turn" holds across SEATS for a fixed deck, NOT across decks (±30% by mix).
  Direction favorable: the L2 arithmetic stands or improves with mixed tables. (The conflation
  warning also fired correctly on its first live mixed-deck run.)
**Conclusion for L2:** ms/player-turn is the stable unit (~3.7–4.1 s across 3–5 seats) ⇒
throughput ≈ f(total player-turns). A 20-candidate × 20-game generation ≈ 400 games ≈ **4 h**
at baseline — "a night", not "a month". Pool 12 stays the volume setting. Numbers recorded in
strategy doc §7 + the 24 July journal entry.

## T2 — Seeded / reproducible deals
**What:** identical shuffles on demand: same seed ⇒ same crypt/library order per seat, so a game (given
deterministic policies) is replayable and A/B-able.
**Why:** L1's duplicate seating (same seed, rotated personas) is the variance reduction that makes T4's
fitness signal affordable; without seeds, arena results stay directional only.
**How — OPEN DESIGN POINT (decide before building):** *(a)* server-side seeded RNG as a room/create
option (a field on an existing verb, not a new verb — verify against the seven-entry chain), vs *(b)*
arena-side scripted deals, extending the test suite's existing direct hand/board-mutation pattern to
full deck orders. *(b)* needs no server change and grows no restart backlog; *(a)* is cleaner for online
repro. Lean (b) first; (a) only if L1 outgrows it.
**Step 0 — VERIFIED 16 July 2026:** `elysium-bot.js` contains ZERO `Math.random` — decide() is
randomness-free today (the only random in the whole track is the arena's port pick). The seeding
assumption therefore already holds for randomness; any FUTURE stochastic persona element must
route through a seedable PRNG injected via bot options, never `Math.random`.
**Why deferred:** worthless until T3 exists to consume it.
**Test:** two runs, same seed + same personas ⇒ byte-identical decision traces (needs T6); rotated
seating ⇒ different outcomes, same deals.

## T3 — Arena evaluation harness (L1)
**What:** batch mode: N seeded games × M seatings; aggregate the existing `'bot:'` telemetry into a
per-run markdown scorecard (metrics per strategy doc §5: VP/GW, oust timing, bleed-through, block rates,
wasted-card rate, pool trajectories).
**Why:** turns the arena from mechanism validator (L0) into the measuring instrument every later rung
stands on. Duplicate seating additionally SEPARATES persona from deck — arena v1.1.4 (24 July) prints
an explicit conflation warning whenever decks differ, but this harness is the real fix.
**How:** consume the arena's JSONL in a separate `arena-scorecard.js` — same one-off-report culture as
`gen-sweep-audit`/`gen-deck-coverage` (derive from the artifact, never hand-mirror it). Duplicate
seating from T2. Every scorecard prints its own variance note (K games, spread) — "how many games is
enough" is MEASURED here, not assumed.
**Why deferred:** needs T1's throughput number (to size N) and T2 (to mean anything).
**Test:** scorecard reproduces hand-counted results on a tiny fixed run; K-sensitivity documented.

## T4 — Persona parameter search (L2)
**What:** selection over persona knob vectors (aggression/blockShy/insight + coming deal/vote/hunt
knobs): evaluate K seeded games per candidate via T3, keep the best, mutate, repeat. Output: tuned
per-archetype persona JSONs + a tuning journal.
**Why:** "self-play light" — the highest lever-per-hour toward personas that FEEL distinct (strategy
doc §4 L2); distinct local optima ARE the personalities.
**How:** a driver script over T3; fitness per §5 (open question 3: pure VP vs a composite with style
constraints). **Human-anchor rule:** every accepted profile gets at least one Johan live session before
it is called done — the Cicero lesson (§3.4) at hobby scale.
**Why deferred:** strictly downstream of T3, and dramatically better with 4 real archetypes to tune.
**Test:** tuned vs untuned profile over a fresh seed set shows a measurable, reproducible delta; plus
the live-session sanity pass. **Robustness probe:** re-run winners with decks swapped between
seats — an edge that survives the swap learned play, not deck memorization.

## T5 — Coverage report per archetype playbook (standing rule)
**What:** `node gen-deck-coverage.js <playbook>` the moment a playbook is authored or the bot's
consumption code changes; the report's Kurationskö IS the curation queue.
**Why:** deck-driven depth, never database completionism (strategy doc §2).
**How:** the SKILLS.md recipe exists; keep each report beside its playbook.
**Why deferred:** not deferred — continuous.
**Test:** the report is the test.

## T6 — `--explain` decision traces — the step-2 BACKBONE
**What:** every `decide()` emits a structured reason object on the existing JSONL/onEvent channel.
**Schema requirement (Johan, 24 July 2026) — a decision is only evaluable in the context of what
the choices WERE:** `rv:1` objects carry *(1)* `ctx` — the bot's own **hand** (card names), a
**board digest** (own ready/torpor vampires + blood, opponents' relayed pub: ready counts, visible
permanents, pool, Edge holder), and **resources** (own pool, acting vampire's blood, transfers/
actions remaining, hand-size baseline) — everything that enabled or constrained the choice;
*(2)* `options[]` — every candidate CONSIDERED with its score/inputs AND every candidate EXCLUDED
with the gate that excluded it (blood cost, discipline, req.*, once-per-action ledger, phase);
*(3)* `chosen` + the winning rule; *(4)* the persona knobs in force. A small renderer turns a
game's trace into readable prose ("Held intercept vs predator (threat 2.4) over blocking prey's
hunt (0.3)").
**Fairness note:** hand contents here are bot-LOCAL self-reporting into the trace channel — never
into table chat or any table-visible surface; the relay-is-the-fairness-boundary rule governs
SENSES (what the bot reads about others), not telemetry about itself. T7's ghost mode keeps the
same suppression.
**Why:** live tests go from "reconstruct from the log" to "read the bot's mind" — and it is ALSO the
embryo of the intent model (strategy doc §6: build once, render twice — debug now, table talk later),
the exact recording format T8 replays, AND the training data step 2 exists to collect (VP outcomes
alone are far too sparse to improve tactics; per-decision context is the signal).
**How:** the `decide()` seam is the single choke point — wrap it; reason objects carry a format version
(`rv:1`) so T8 fixtures survive format growth; the renderer is a separate one-off script, never bot
code.
**Why deferred until now:** decide() only recently carries enough real choices to be worth narrating.
**Test:** offline — every decide() path emits a reason with the mandatory fields; a rendered sample
game reads correctly against its known trace.

## T7 — Ghost seat (observe-and-suggest at a human table)
**What:** the bot joins as a non-acting observer bound to Johan's seat: the full decision loop runs but
nothing is sent to the table; suggestions (+T6 reasons) stream to a side channel (console/file first;
any client UI is a separate, later conversation).
**Why:** inverts the arena — more signal per HUMAN game instead of more bot games; the bot's judgment
gets audited live without being release-ready; doubles as a future coaching mode for new VTES players.
**How:** source-verify spectator capabilities FIRST (does a spectator receive the full §12 + board
stream the bot needs? the bot-elements exception and sanitizePub's reach are the things to check);
"suppress sends" is a mode flag over the existing pacer, not a fork.
**Why deferred:** payoff is bound to real game nights — build against a scheduled one.
**Test:** a recorded human game whose ghost suggestions are reviewed post-hoc; zero table-visible
traffic from the ghost, proven from the server log.

## T8 — Live sessions as replay fixtures
**What:** a record tap capturing a real session's inbound message stream. The bot is log-reactive, so
replaying the stream through its handlers re-produces its decisions deterministically — **no server
determinism needed**. Any "Johan saw something odd" freezes into a permanent regression fixture.
**Why:** extends the harness culture into the hardest domain — real human play; lekmannaobservationer
become tests instead of one-time fixes.
**How:** tap = serialize every inbound message (+timestamps) at the dispatch/onEvent layer; the
replayer feeds them to a fresh Bot with T6 traces on; assertions target reason objects, not full table
state. Decide at build time whether session logs get name-redacted (privacy of recorded friends).
**Known wrinkle (audited 16 July 2026):** decide() is randomness-free, but the CLOCK touches two
decision-adjacent spots — `gid()` suffixes generated ids with `Date.now()` and `_lastThreat`
stores a wall-clock `ts`. Byte-identical replay therefore needs an injectable clock seam (a bot
option, fed recorded timestamps) or an id/ts-normalized stream comparison. Decide at T8 build.
**Why deferred:** wants T6's trace format stable first, or fixtures rot on every format change.
**Test:** record an arena game, replay it, byte-compare the reason stream; then the first real-session
fixture.

## T9 — TWDA deck-read / insight v2 (opponent modelling) — strategy doc §9
**T9a — VERIFICATION spike — ✅ DONE 16 July 2026, verdict GO (`t9a-deck-read-verification.md`):**
*(1)* source SOLVED — `static.krcg.org/data/twda.json` (KRCG, MIT, ~4,500 decks, current through
spring 2026; per-deck `date` + `players_count` give recency weighting and tournament-size filtering
for free; api.krcg.org's /candidates endpoint is a living reference implementation of the inference);
*(2)* visibility SOLVED both halves — VEKN tournament rules name library count as Public Information
and the rulebook lets any Methuselah examine any ash heap, while Elysium's sanitizePub already relays
counts{hand,library,crypt} and the full ash/burned zones to every client ⇒ ZERO protocol changes (the
relay IS the fairness boundary, see learnings); *(3)* size SOLVED — raw ~8–12 MB compiling to a
sub-MB prior loaded exactly like elysium-cardfx.json (absent ⇒ flat posterior, insight v2 silently off).
Deferred to T9b as build details: id-space check vs vtes.json, VEKN banlist filter at compile,
clustering choice (Ossuary's seven-class taxonomy vs unsupervised co-occurrence).
**T9b — BUILD (after T3):** `twda-compile.js` → a compact archetype-prior artifact beside
`elysium-cardfx.json` (the exact offline-compiler pattern cardfx established). Runtime: match observed
opponent cards (crypt reveals weigh heaviest; rare cards weigh heaviest — the scarcity inversion,
strategy doc §9) → posterior over archetypes → expected remaining copies of the cards that matter
(Deflection-class) → odds-aware decide() adjustments (lunge timing, stealth spend). The **insight knob
gates depth** (novice: off; grinder: sloppy; shark: encyclopedic) — persona differentiation for free.
Graceful degradation: home-brew/unknown decks ⇒ flat posterior ⇒ today's heuristics, never a crash.
Recency-weight + banlist-filter the archive.
**Why:** the difference between "plays correctly" and "feels skilled" — especially the end-game lunge.
And a FREE eval loop: arena decks are known, so posterior convergence + copy-odds calibration become
automatically measurable in the T3 scorecard, zero human labels.
**Why deferred (T9b):** wants T3's harness to measure it and real archetypes to read.
**Test:** offline — posterior math on synthetic observation sequences; arena — calibration curves in
the T3 scorecard; live — `--explain` lines like "reading you as ~X (73%), 5/7 expected Deflections
seen → lunge".
