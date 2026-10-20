# A clean-up and methods spec for `bot/` (20 Oct 2026)

**Status:** a proposal. Nothing here is built. The work waits for Johan's choices in §8.
**Measured on:** `b009951` (bot v0.6.211, PR #37, now on main).
**Credits:** the ideas this spec borrows from other open VTES projects are credited where they are used and
listed in Appendix B. We take ideas and methods, not code.

---

## 0. In one paragraph

The Elysium client is a free table: it does not enforce the rules, so our bots carry their own model of them.
That is our niche and our hardest problem. Good practice for game bots, in the open VTES projects we learned
from and beyond, comes down to a few things: legal moves from one source of truth, determinism and replay, an
explicit and tested boundary for hidden information, a register of rulings, a card status ledger, and docs that
state what *is* rather than what *happened*. We have the determinism (the sim table). We lack the tested
information boundary, the rulings register and the card ledger, and our docs are heavy: the prescribed bootstrap
is about 700 KB, roughly 190k tokens, so a 200k-token context would be full before any work began. The code
itself is tight: a correctness lint finds no undefined name, only leftovers. The clean-up is therefore mostly
about documents, a few dead tools, three missing guards and a slow suite. It can be done in six small rounds
that change no bot behaviour, and it makes the next product steps cheaper: the V5 waves, the knowledge layer's
second half and the abstract model.

---

## 1. The lens: what we build, and what makes it hard

- **What we build.** Bots that fill seats at an Elysium table, online and offline. Offline means hotseat
  inside one HTML file: no server, no GPU, no network. Johan's goal (CLAUDE.md debt 43a): "a competent threat
  at the table that can fill a seat when players are short", not a chess engine. No deck is held back: Malkavian,
  the strongest starter, plays as well as it can even if it pulls away (64a). The immediate product goal
  (19 Oct): make the V5 preconstructed decks playable.
- **What makes it hard.** Elysium is a free table, like Lackey, JOL or Cockatrice: the client moves cards and
  lets people talk, but it does not enforce the rules. The bot reads the table's lines and carries its own model
  of the rules (cardfx plus the table model), so our correctness risk sits in two places: the card data (cardfx)
  and line parsing.
- **How we work.** Claude writes and maintains the code; Johan rules and merges. Johan (20 Oct): the repository
  may be written for the agent that works in it, and the direction from now on is to save tokens: "least fluff"
  between a fresh session and the context it needs. So the measure of a file here is: what does it cost an agent
  arriving cold, and does it help that agent find the binding rule at the moment it changes the code.

---

## 2. Practices we adopt, and where we stand

| # | Practice | Where we stand | Item | Credit |
|---|---|---|---|---|
| P1 | Legal moves come from one source | The client does not know the rules; cardfx + parsers model them | Structural; guard the model instead (P5) | zero-vtes, VTES-Player, tasha-morgan |
| P2 | Determinism; replay = seed + decisions | Sim table since v0.6.209: the same spec gives the same trace byte for byte | None; use it for the suite and the bench too | zero-vtes, VTES-Player, tasha-morgan |
| P3 | Hidden information is an explicit, tested object | A rule ("public evidence only"), a design (`handIntel` only from reveals) and targeted tests (41a, section 140); no whole-game test | **Leak test** (T5) | VTES-Player (`redactFor`), tasha-morgan (`Observation`), zero-vtes |
| P4 | Rulings live in one register, never guessed | In CLAUDE.md debts, the journal, specs and memory | **RULINGS.md** (T1) | tasha-morgan (`OPEN_QUESTIONS.md`, `DECISIONS.md`), zero-vtes (rules Q&A) |
| P5 | A card is "in" only when it does all it prints | cardfx tiers, coverage tool, sweeps; "covered is not curated" (15 Oct); Kevlar offered 429 times, never taken (19 Oct) | **Card ledger** (T2) | VTES-Player ("no partial cards"), zero-vtes (ledger rows tied to tests) |
| P6 | Docs say what *is*; history lives in git | Bootstrap ~700 KB, one release written ~8 times | **The bootstrap diet** (§5) | zero-vtes (three lifespans, shrinking boards), VTES-Player (a CLAUDE.md size rule) |
| P7 | A reviewer who did not write the change | "Anything I'm unsure about"; reviews when asked (main's 17 Oct round had an independent review find eight defects before its PR) | **Egress review** (T4) | zero-vtes (`egress-reviewer`), tasha-morgan (`rules-auditor`) |
| P8 | Strength is measured paired, with controls | Sim footprint + the mirror bench (48, both controls) | **Paired reads on the sim** (T6) | VTES-Player (seat-rotated deals, paired per deal), zero-vtes |
| P9 | Behaviour overlays change style, not strength | Novice inside the noise (`REPORT-bench-controls.md`) | Agreed; judge personas by feel | VTES-Player (playstyles) |
| P10 | Test through the boundary, not the hook | Learned twice (16 Oct: "a hook called by a unit test proves the hook") | Keep | zero-vtes ("tests at the boundary, no mocks"), VTES-Player, tasha-morgan |
| P11 | Fix what you meet, in the change at hand | Johan's combining rule (16 Oct) | Keep | zero-vtes ("scope grows in place") |

**One method to name.** Our cardfx auto tier parses card text for behaviour: 1,670 library entries with effects,
105 of them curated by hand. That is how we cover the whole pool without an engine, and it is also where our late
rules errors come from. The card ledger (T2) keeps it honest: it says which entries are only parsed.

---

## 3. Where we stand

**What we have.**
- Our bots play in a client people already use, online and offline (hotseat), at a table that does not enforce
  the rules. Reading a free table (frozen phrases, the canary, holds, the tempo) is the core skill.
- The sim table gives us deterministic replays of a client we do not own: about a second per match, every
  seating, 240 matches in minutes.
- The hidden-hand prior: the TWD profile, archetype labels and the measured feasibility of 65c.
- A measurement culture: gates per mechanism (ledger, invariants, block, windows), footprints, controls, and labs
  that weigh one decision (the probe lab, §6.1).
- Politics and table talk: referendum terms, chat, holds, tempo. That is the niche.

**What we lack.**
- No rules authority of our own. Our rules errors surface late, through play: Pentex under the wrong name,
  Kevlar never equipped, Second Tradition illegal for an untitled vampire (45b).
- The information boundary is designed (`handIntel` is filled only by reveal messages; bots look away from a
  debug seat) and has targeted tests (41a, section 140), but no test walks whole games for a leak.
- Johan's rulings have no single home.
- The docs (§5.2).
- There is no CI for `bot/`: "never claim a gate passed without having run it" rests on the agent alone. Main has
  run its gates in CI since 17 Oct (`.github/workflows/client-gates.yml`), and that file says the bot project
  "may add its own workflow beside this one".

**What that implies.** Keep the niche and spend effort on it: table reading, the knowledge layer, the abstract
model, politics. Do not build a rules engine, and do not split `elysium-bot.js` into modules now (the client
loads one file; the risk is larger than the gain). Borrow rules authority from the sources (KRCG, vtes-rulings)
through a card ledger that says what is known to be right.

---

## 4. What we take

### 4.1 The list (ranked by value for effort)

| # | What | Credit | Where | Effort | Done when |
|---|---|---|---|---|---|
| T1 | **The bootstrap diet.** Five standing pages (STATUS, BOARD, RULINGS, LESSONS, ARCHITECTURE), a CLAUDE.md that carries rules only, history moved out | zero-vtes (three lifespans, boards), VTES-Player (size rule) | `bot/docs/`, `bot/CLAUDE.md` | M | A session starts on ≤ 50 KB, every standing page together is ≤ 140 KB, and a budget check passes (§5) |
| T2 | **Card ledger.** One generated row per card: tier (auto / curated), modes, rulings count, the suite section that tests it, plays in the latest sim, status (playable / partial / inert / unknown) | VTES-Player (no partial cards), zero-vtes (rulings ledger), tasha-morgan | `gen-card-ledger.js` → `docs/CARDS.md` | M | Generated from cardfx + the suite + a sim dir; each V5 wave's done-condition reads it |
| T3 | **Graded rules readings for card waves.** Each curated reading graded green / amber / red against KRCG text and vtes-rulings by a fresh read-only agent; only red ones go to Johan | zero-vtes (`add-cards`), tasha-morgan (`rules-auditor`) | A charter in `docs/HARNESS.md` | S | A wave's PR lists the grades; Johan sees only the reds |
| T4 | **Egress review.** A fresh-context agent gets the diff, the board line and the pages the change named, never the conversation. Findings are classed (`stale-doc`, `half-done`, `test-weakened` …) and listed in the PR body; three of a class become a rule | zero-vtes (`egress-reviewer`, upkeep's ratchet) | `docs/HARNESS.md` | S | Every round's PR carries an `Egress:` line |
| T5 | **Leak test and "every chair agrees".** A static half: the bot reads no global except its own export, which is true today (one `globalThis`, the export; `hotBridge`, `window`, `document` appear only in comments), so pin it with a test, as VTES-Player's AI imports no `GameState` on purpose. A dynamic half: after a sim match, walk each bot's stored state for card names only another seat's hand or library ever held (the sim knows the true hands), with a planted leak as the positive control. And `_twdExpect(seat)` must agree across observers, except where a card was shown to one of them | VTES-Player (`information-boundary.test.ts`; the 11 Oct notes, item 6) | `test-bot-sim-boundary.js` | M | Green on 24 matches; the planted leak goes red |
| T6 | **Paired reads on the sim.** VP and win share per deck as per-match differences between two runs of the same design, with a paired SE | VTES-Player bench (11 Oct item 1) | `ana-sim-diff.py --vp` | S | v0.6.211's report would have printed paired SEs |
| T7 | **Flip counts.** When a knob is under test, re-score each decision with the knob at 0 and record `flip` on the `decide` row: a term that never flips anything is dead | VTES-Player (11 Oct item 2) | `_decide` behind an option; trace only | S–M | The `equipOverPlain` arm shows its flip count |
| T8 | **CI for `bot/`.** On every PR touching `bot/` or the bot bundle at the root: `node --check` and the correctness lint (§5.2, its config in `tools/`), canary, cardfx, HB1, hotseat, and the suite (or the suite on a label or nightly, if five minutes per PR proves too slow). CI runners have no ten-minute limit | main's `client-gates.yml` (17 Oct), tasha-morgan, zero-vtes | `.github/workflows/bot-gates.yml` beside main's, with its conventions (read-only permissions, every step even after a failure, one run per ref) | S | A red gate shows on the PR |
| T9 | **Knob and weight registry.** One table: name, default, kind (decision / timing / plumbing), what 0 means, the bench that set it. Today defaults live in at least five idioms (the constructor object; `== null ? 1 : +x` at the read; `?? 1`; `!== 0`; truthy opt-in). The persona thresholds inside the tactics (debt 2, which keeps growing: 32 persona reads, at least four of them hard cut-offs such as `P.aggression >= 1.2`) move into it as overlays. A value that is unproven but kept says so, with its bench number ("kept knowingly", VTES-Player) | VTES-Player (`Weights`, a doc line per weight) | `KNOBS` in `elysium-bot.js`, rendered into ARCHITECTURE | S–M | The manifest emits it; a test checks every decision knob has a 0-path |
| T10 | **One gate over a sim series.** `ana-gates.py <sim-dir>` runs the invariants, ledger, block and window audits and the 0-pool count, and prints PASS / FAIL per line | zero-vtes checks, tasha-morgan `invariants.py` | `ana-gates.py` | S | A release gate on the 240-match design |

**Still open from the 11 Oct notes**, kept as board lines: blood-hunt voting (item 8), the §8 law for the
meta layer (item 3), decision-level meta metrics on padded decks (item 4), personas as tested overlays
(item 9). Item 5 (one bot asks the pool question) is settled: Johan ruled on 16 Oct that every bot keeps
asking, because each needs its own stake to vote.

### 4.2 Ideas from jol-rebuild

jol-rebuild (the rebuild of the JOL platform) has no licence file, so we take its method and ideas, not its
data, unless its maintainers license the CSVs.

| # | What | Use for us | Effort |
|---|---|---|---|
| T11 | **The card-mode split** (`card-text-parsing.md`): every library card cut into declaration modes by its bracket headers, "As above" resolved with named transforms, and the unclear cases written to a review file. Their run: 2,364 cards → 3,553 modes, 158 "As above" cases left for review | Re-implement the method on KRCG's text and diff it against cardfx's modes. A card whose mode count or resolved text differs is a review row for the V5 waves | S–M |
| T12 | **The mechanic-block catalogue**: resolved mode text split on newlines, normalised and counted (3,676 distinct blocks; long-tailed, the top 300 cover 39 % of occurrences) | Classify blocks by pattern, one clause at a time, instead of whole cards by keyword. The commonest block, "+1 stealth action." (289 times), is an action's own stealth; a whole-text keyword search counts it as a stealth card, which is probably part of why our classifier called 625 cards stealth (65c). Clause-level classes are the clean class bank the knowledge layer is missing (64d) | S–M |
| — | **The five-layer playability check** (`timing-windows.md`): a mode is playable only if (1) its source region is legal, (2) the phase, type and actor gates pass, (3) requirements are met and costs payable, (4) the active timing window allows it, (5) the player holds priority | The checklist for T3's graded readings and the card ledger's columns. v0.6.210's last pool and Second Tradition's missing title check (45b) were both layer-3 misses | — |
| — | **The window taxonomy**: 38 named windows in six workflows (action, combat, combat- and action-caused diablerie, referendum, blood hunt), with a state diagram | The vocabulary for ARCHITECTURE's map of where each decision lives, and the state skeleton of the abstract model (§6.1) | — |

Its `CLAUDE.md` is 71 lines: a map of paired rules and implementation pages. That is the "least fluff" target in
practice. T11 and T12 belong to the V5 waves and the knowledge layer, not to the clean-up rounds.

---

## 5. The clean-up spec

### 5.1 Principles

1. **Measure a document by what it costs an agent arriving cold.** The bootstrap budget is a number and a check.
2. **Three lifespans.** Code says *how*. Standing pages say *what is* and *what was decided*. Plans, progress
   and reasoning belong to the round and live in the PR, the CHANGELOG and git.
3. **One fact, one home.** A release is written once: CHANGELOG for history, STATUS for now, the PR body for the
   evidence.
4. **Move documents, delete dead code.** Docs move to `docs/history/` verbatim (cheap, greppable). Dead code
   and dead tests are deleted (git keeps them).
5. **Clean-up rounds change no behaviour, and prove it.** The sim's 240-match design is IDENTICAL to v0.6.211,
   the gates are green, and any comment-only change is checked by stripped-output identity.

### 5.2 The starting point (measured on `b009951`)

| Item | Measured |
|---|---|
| Prescribed bootstrap (root + bot CLAUDE.md, newest READ-ME-FIRST, journal, context, learnings, SKILLS) | **700,636 bytes**, about 180–200k tokens at 3.5–4 bytes a token |
| `bot/CLAUDE.md` | 201,158 bytes, 460 lines. Claude Code loads it into the context as soon as a session works inside `bot/`: this session received all of it, about 55k tokens, each time it entered a fresh clone's `bot/` (twice) |
| — the version handshake (line 14) | One line of 45,340 bytes naming 86 version numbers, nearly all of them between v0.6.112 and v0.6.211. About nine binding rules are buried in it (the plan, table-model, duplicate, cardfx-cost, tier, timing, helper-gate and debug-density rules, and the sandbox's detached-series arena rule) |
| — "Known debts" (lines 173–454) | 116,657 bytes: items 1–70, mostly closed (item 71 has a section of its own, lines 455–460). Johan's rulings and the knowledge-layer design (64–65) sit in it |
| — stale instructions | "expect 701/0 … bot v0.6.88"; "suite ×3 SPLIT (`timeout 210`)" (the gate is now `timeout 600`); "cp to `/mnt/user-data/outputs/`, `present_files`"; "`elysium-server.js` (srv-2.6.32)", where README says srv-2.6.46 and the root has srv-2.6.49 |
| Journal | 264,422 bytes, 110 dated entries (~2.4 KB each), in Swedish |
| Learnings | 103,459 bytes, about 300 lessons (354 bold or bulleted lines, 47 of them group headers); its header still says "reflects bot v0.6.117" |
| Context | 76,978 bytes, 81 dated release blocks (a second changelog) |
| One release (v0.6.211) | ~120 changed lines of bot and compiler code; **10 doc files** touched besides the round's own spec and the guide's version chip. The story is written ~8 times: handshake, `BOT_VERSION` comment (1,358 chars), CHANGELOG, journal, context, READ-ME-FIRST (8 KB), README, START-HERE-BOTS-CHAT |
| `bot/docs/` | 152 files, 1.9 MB (55 READ-ME-FIRSTs, 29 handoffs, 27 specs, 18 reports) |
| `elysium-bot.js` comments (approximate scan) | ~1,900 `//` comments = ~297 KB (29 % of the file); ~1,200 of them cite a version, a date or "Johan" = ~222 KB (22 %); 177 versions cited 1,487 times |
| Dead code | One method with no caller (`_bumpTallyB`); five methods used only by the suite (`_beat`, `_chatSettleMs`, `cardsDiscarded`, `oppPosture`, and `_pickRaise`, "kept for test compat"). A correctness-only lint (ESLint 10, 26 rules, no style; 4 s over 28 files) finds no undefined name. It finds 8 unused assignments in the bot, all leftovers; two of them (`lastBlood`, `poolSafe` in `_applyPhaseIncome`) sit under a comment for the rule v0.6.134 replaced. In the tools, a duplicate key: `gen-deck-coverage.js`'s documented `handStrike: 'meta'` is silently overridden by a later `'paired'` (no effect on the output today). In the suite, two self-comparisons |
| Dead tools | 10 legacy tests "kept for history … known stale reds" (README). 8 scripts `cd /home/claude/w` (the chat-era sandbox): `run-bal`, `run-m`, `run-t`, `run-cmb`, `run-ser`, `poll-bal`, `make-bench-report`, and **`bench.sh`, the bench gate**. `bench.sh` reads `serie-cmb1/design.txt`, a gitignored path; the design itself is in git as `design-balanced-serie-bal1.txt`. So from a clone the mirror bench runs only after the path is fixed and that file is copied into place by hand |
| Suite runtime | ~300 s a run on the usual sandbox, ×3 per round. Measured here: 417 s wall, 55 s CPU (13 %), 2244/0 |

The lint's rules, for C2 and T8 to reuse: `no-undef`, `no-dupe-keys`, `no-dupe-class-members`, `no-dupe-else-if`,
`no-duplicate-case`, `no-unreachable`, `no-self-assign`, `no-self-compare`, `no-const-assign`, `no-func-assign`,
`no-redeclare`, `use-isnan`, `valid-typeof`, `no-unsafe-negation`, `no-cond-assign` (except-parens),
`no-sparse-arrays`, `no-unsafe-finally`, `getter-return`, `no-setter-return`, `no-loss-of-precision`,
`no-constant-binary-expression`, `no-unused-private-class-members`, `no-shadow-restricted-names`, `no-obj-calls`,
`no-fallthrough`, and `no-unused-vars` (args and caught errors ignored). CommonJS, ES latest, browser and Node
globals declared by name; files: the bot, the sim, `test-*`, `diag-*`, `gen-*`, `lab-*`.

### 5.3 The target layout

```
bot/CLAUDE.md          ≤ 25 KB  who/what · the one rule · bootstrap order · the loop (git era) · gate commands ·
                                 the binding rules (one short paragraph each, citing RULINGS / LESSONS ids) · pointers
bot/docs/STATUS.md     ≤  5 KB  now: version, deploy state, open PRs, last gate numbers, what is next (rewritten each release)
bot/docs/BOARD.md      ≤ 15 KB  a shrinking list of asks: "<ask>: <why>. Done when <condition>. Docs: <pages>." Done = deleted
bot/docs/RULINGS.md    ≤ 25 KB  one line each, numbered (never renumbered), dated, by mechanism, in two kinds (tasha-morgan's
                                 split): R-n rules readings (what the game says, with its source) and D-n design decisions
                                 (what our bot does and why: probeHold 2, combining fixes, the stealth / intercept rule).
                                 An "Open" section holds the questions waiting for Johan, with the sources consulted
                                 (tasha-morgan's OPEN_QUESTIONS); an answer moves the line up with its date. First open
                                 lines: v0.6.211's Spying Mission vs Swallowed by the Night tie, the bank's +2 before a
                                 reactions window, Pentex's two spellings to `_uniqueInPlay`
bot/docs/LESSONS.md    ≤ 20 KB  the ~300 lessons distilled to ~60 one-liners by theme (before you build · tests that lie ·
                                 timing · reading traces · tools), each pointing to its dated story in history/; "tests
                                 that lie" also takes the three of VTES-Player's that ours lack (a guard clause in a test
                                 is a silent skip; cases that are all negatives test the fixture; grep for the rule's verb)
bot/docs/ARCHITECTURE.md ≤ 15 KB for people and agents: the layers (wire → table model → knowledge → plan → tactics →
                                 decide → speech), where each decision lives, the files, how to run a game in three commands
bot/docs/HARNESS.md    ≤  8 KB  the round: board line → change → gates → egress review → PR; upkeep; the grading charter
bot/docs/elysium-bot-CHANGELOG.md   history, one entry per release (unchanged role; not part of the bootstrap)
bot/docs/specs/        standing design canon only; delivered round specs → history/
bot/docs/history/      verbatim: the journal, the 55 READ-ME-FIRSTs, consumed handoffs, CLAUDE.md's handshake
                                 history and debts 1–70, the "formerly CLAUDE-arena" sections, the dated learnings
SKILLS.md → bot/docs/HOWTO.md  ≤ 20 KB  running, debugging, analysing; the chat-era patching notes trimmed
```

**Bootstrap after:** root CLAUDE.md + bot CLAUDE.md + STATUS + BOARD ≤ 50 KB, about 13–14k tokens. RULINGS,
LESSONS, ARCHITECTURE and HOWTO are read when the task touches them (CLAUDE.md says when). A check script,
`tools/doc-budget.sh`, fails when a standing page passes its budget, a path named in a standing page does not
exist, or a version number in STATUS disagrees with `BOT_VERSION`.

### 5.4 What moves where (round C1)

| From | To |
|---|---|
| Handshake (line 14): current release | STATUS (one paragraph) |
| Handshake: older releases | `history/handshake-v0.6.112-v0.6.211.md` (they are already in CHANGELOG) |
| Rules embedded in the handshake (plan, table model, duplicate, cardfx cost, tier, timing invariants, helper gate, debug density, the detached-series arena rule) | CLAUDE.md rules (the arena rule rewritten for `run_in_background`, or retired with the sandbox it describes) |
| Binding rules block (lines 15–49), the Gates paragraph's "an abort on the pre-change bot is not automatically the environment" included | CLAUDE.md rules, tightened; examples and history → LESSONS / history |
| "(formerly) CLAUDE-arena" (HB track, expected state, the eight-step loop, CLI, emit vocabulary, deep review, open items) | the loop → HARNESS (git era: branch, PR, `run_in_background`); emit vocabulary + CLI → HOWTO; the evaluation doctrine and the "names rotate, read manifests" rules → CLAUDE.md rules; the rest → history |
| Debts 1–70 | open asks → BOARD; Johan's rulings → RULINGS; the knowledge-layer design (64–65) → `specs/spec-knowledge-layer.md`; the goal (43a) and Johan's three layers (31) → CLAUDE.md; the rest → history |
| Section 71 (the breath) | the beat, ahead and intercept-by-chat rules → CLAUDE.md |
| Journal | history (frozen); see §8 Q2 for what replaces it |
| Context | STATUS (the top block) + history (the rest) |
| Learnings | LESSONS (distilled) + history (verbatim) |
| READ-ME-FIRSTs | history; replaced by STATUS + the PR body (§8 Q3) |
| `START-HERE-BOTS-CHAT.md` | stays; points at the new bootstrap (Appendix A) |
| `REVIEW-vtes-player-2026-10-11.md` | its open items → BOARD, each credited; the text → Johan's private project notes |
| Johan's rulings in memory and in the journal | RULINGS, checked against the memory notes (they are a dated record of the same decisions) |
| Two design documents outside git (Claude Docs of 25 Sep: "Design: event log, shadow model, knowledge sources, bench" and "Cardfx sweep — source mapping") | linked from ARCHITECTURE; their standing parts copied into `specs/` |

### 5.5 The release ritual after C1

| Today (v0.6.211) | After |
|---|---|
| BOT_VERSION line with a release note | BOT_VERSION line, version only |
| Handshake, context, journal, READ-ME-FIRST, README version line, START-HERE-BOTS-CHAT, learnings | STATUS (rewritten) |
| CHANGELOG | CHANGELOG (unchanged) |
| Next steps written in four places | BOARD: the done line deleted, found lines added |
| — | RULINGS when Johan ruled; LESSONS only for a new *class* of lesson |
| Handoff | Handoff, only when main must act |
| Gate numbers in five docs | In the PR body (and CI, T8) |

From 11 doc files to 3–5, and one write-up instead of eight.

### 5.6 Code and tools

| Action | Files | Evidence | Round |
|---|---|---|---|
| Delete | `test-soft.js`, `test-planner.js`, `test-planner2.js`, `test-planner3.js`, `test-persona.js`, `test-handoff.js`, `test-eligible.js`, `test-fixes.js`, `test-grammar.js`, `test-bot-suffix.js` | README: "not gates … known stale reds … the suite covers those behaviours" | C2 |
| Delete | `_bumpTallyB`; the lint's 8 unused assignments and the stale comment over two of them; one of the two `handStrike` keys | No caller in the bot, the suite, any tool, `client/` or the root; the lint (§5.2) | C2 |
| Port, then delete | `bench.sh`, `run-bal.sh`, `poll-bal.sh`, `run-m.sh`, `run-t.sh`, `run-cmb.sh`, `run-ser.sh` | Hard-coded `/home/claude/w`, and a design path that is gitignored. The sim already "runs a series or a bench first" (CLAUDE.md, 19 Oct). The port: the mirror bench's arms, seats and both controls on the sim (T6), **including** `bench.sh`'s deck-pinned 6th argument and global-knob 7th argument; the controls re-validated (A vs A level, a crippled seat loses); then the scripts retired and **every rule that names them rewritten in the same round** (CLAUDE.md lines 36, 38, 360; SKILLS.md lines 31, 39, 193) | C3 |
| Keep (the sim's input) | `design-balanced-serie-bal1.txt` | The only copy in git of the 12 balanced seat orders behind bal1, cmb1 / cmb2 and every mirror-bench arm (debt 33a: "reuse this design for every deck-level claim"). The sim's default, every seating, is a different design, so the port must be able to read this one, or old arms can no longer be re-read on the same seats | C3 |
| Keep, mark one-off | `ana-combat-sum.py` (writes `REPORT-combat-series-table.txt`), `make-bench-report.sh` (writes `REPORT-bench-controls.md`, which the bench gate cites; fix its path or fold it into the port), `sweep-pilot.py`, `sweep-pass2.py`, `sweep-full.py`, `diag-give-probe.js`, `diag-a1-stash-probe.js`, `gen-plan-review.js`, `gen-sweep-audit.js` | Each reproduces a committed report or a debt measurement; listed as one-off tools in HOWTO | C1 |
| Keep, revive | `gen-forecast-calibration.js` | Not re-run since 18 Sep (debts 5, 11), and the seed of the abstract model's calibration gate (§6.1) | §6.1 |
| Retire or wire | Knobs that default off: `planFloor` (debt 9: computed, not consumed), `askHumansTotal` (57c: Johan wants it on; blocked by the suite's human harness), `crossRushWeight` 0 | Each gets a board line: wire it, or delete the dead branch | C5 |
| Decide | The read-only client copies in `bot/` (`elysium-vtes-bord.html` 1.6 MB, `elysium-server.js`, `ELYSIUM-PROTOCOL.md`, the hotseat plan) | They drift: v2.6.162 / srv-2.6.46 here, v2.6.167 / srv-2.6.49 at the root, while CLAUDE.md says srv-2.6.32 and README's line 36 says v2.6.158. In the monorepo the gates could read the root's release instead. This is a contract question for main (§8 Q4) | — |
| Later, optional | History comments in `elysium-bot.js` (222 KB) | Rewrite to trap comments ("why" + a rule id) in functions a round touches. A one-off pass is safe only if a minifier's output is identical before and after (§8 Q6) | — |
| Note for the V5 plan | Seven decks embedded in `elysium-bot.js`, six of them duplicated in `deck-*.json` (`WALL_DECK` has no file; debt 23e) | Before the V5 waves add ten or more decks, move decks and `DECK_STRATEGY` into a data file (§6.2) | V5 |

### 5.7 Guards: proving nothing was lost and nothing changed

- **Nothing lost (C1).** An extraction checklist in the PR lists every paragraph of the old CLAUDE.md with its
  new home (a rule, a ruling, a board line, a lesson, history). A fresh-context agent receives the old file, the
  new pages and the checklist, not the conversation, and reports any binding rule with no home.
- **Nothing changed (C1–C3).** `git diff --stat` shows docs only in C1. For C2 and C3 the sim's 240-match client
  design must be IDENTICAL to v0.6.211 (`ana-sim-diff.py`), with the usual gates green.
- **The suite's runtime.** One run on this 2-core sandbox (`b009951`, 2244/0): 417 s wall, 51 s user + 4 s
  system CPU. The suite spends about 87 % of its time waiting on its own timers, as the arena did (3 s of CPU in
  212 s). Three runs a release cost ~15 minutes of waiting. A rough scan of the suite's section markers: 29 of
  429 touch the spawned server; the other 400 hold 151 s of the suite's 158 s of literal `sleep`s, besides the
  bot's own pacing timers. So the promising remedy is a second runner that plays the no-server sections under the
  sim's virtual clock, while the live sections keep the real clock (a virtual clock cannot drive a real server).
  Sharding across processes is the fallback (`tools/run-section.sh` already runs one section, cut out by the
  one-liner in its header, against a fresh server). Pilot it before choosing: one runner, the same assertion count,
  green ×3. That is round C6 (§7).

---

## 6. What this means for the next design specs

### 6.1 The abstract model (agreed 19–20 Oct; its own spec follows)

- **Its place: the first of four checks** (agreed 19 Oct), each checked by the next with another kind of truth:
  (1) the abstract model, fast and only as true as its classes and odds; (2) the sim table and the server arena,
  the client's own rules (the arena for real clocks: v0.6.206's dead time showed only there); (3) a bots-only
  table in the browser (HB1 smoke, main's playtest rig: bubbles, timing, how it feels to play against);
  (4) humans. We have (2)–(4); what is missing is the cheapest, (1).
- **One metric list for all four.** Blocked, bounced, pool per bleed, played at 0 pool and the rest are counted the
  same way at every level (`ana-gates.py`, T10, and the sim's SUMMARY), so a number from (1) sits next to the same
  number from (2) without translation.
- **Ask main once** whether the hotseat bridge has, or could expose, a pure `step(state, action)`. Unlikely, and
  the answer costs one question. Even a forkable table runs at ~20 ms a step (a ~1 s match of ~50 decisions,
  an estimate), about 100× too slow for lookahead within a 3.1 s beat. In pure data a step costs microseconds (also
  an estimate). That is why the model is abstract.
- **Output probabilities, not decisions.** P(class in hand), expected copies left, P(block), as K2 of the knowledge
  layer. Tactics read them. Today's thresholds keep working, and a future search can sample from them.
- **Inventory first: what lifts in.** `_twdExpect(seat)` already gives a seat's expected shares (combat, stealth,
  intercept, bounce, press) from public evidence, and `_expStrikeDmg` / `_expOppStrike` the expected strike that
  Majesty and the dodge read. Both are expectations, not distributions: a share becomes P(at least one in hand) in
  one hypergeometric step over the cards left. The model's own spec opens with this inventory.
- **No position value function in v1.** A hand-made evaluation of whole positions cannot see tempo or position,
  and a one-ply search on one played worse than the policy it was meant to improve (VTES-Player documents this).
  A model that values whole positions is where we would repeat it.
- **Calibrate before any consumer.** Every probability the model prints is checked against the sim's traces
  (predicted P(block) against observed). The sim is the truth about our client; the model is a guess to be beaten.
- **One consumer at a time, benched paired** (T6), with its flips counted (T7). The first consumer stays the
  probe / pump split (64b, 65f), because the probe lab already holds its answer: +0.80 pool per probe turn when the
  actor out-numbers its prey's unlocked bodies, nothing otherwise (v0.6.206).
- **Its states come from the rules, not from us:** jol-rebuild's action, combat and referendum workflows (§4.2)
  are a ready skeleton; the model only needs the probabilities on the transitions. Table position is a state
  in the model, not a persona knob, which gives the meta layer its place.

### 6.2 The V5 plan

- **The card ledger (T2) is the definition of done** for a wave: curated, tested by a section, seen played in the
  sim, rulings graded (T3).
- **Decks and `DECK_STRATEGY` become data,** generated from KRCG's precon sets (the V5 plan's precon generator),
  before the deck count doubles.
- **Johan's open question** (19 Oct: 5 new decks at a time, all played against each other, or 1 at a time against
  the established decks) gets a cheaper answer once the ledger exists. A
  wave is then a list of rows that must turn "playable", whatever the batch size.

---

## 7. The order of work

| Round | Content | Changes behaviour? | Size |
|---|---|---|---|
| **C1** | The doc diet (§5.3–5.5), RULINGS extraction, ARCHITECTURE, HARNESS, the budget check, Appendix A | No (docs only) | One session |
| **C2** | Delete the legacy tests, `_bumpTallyB` and the lint's leftovers (§5.6); `ana-gates.py` (T10) | No (sim IDENTICAL) | Small |
| **C3** | The mirror bench on the sim with paired reads (T6); retire `bench.sh` and the chat-era scripts | No | Small–medium |
| **C4** | CI (T8), if Johan says yes | No | Small |
| **C5** | Leak test (T5), flips (T7), knob registry (T9), the off-by-default knobs | No (trace only) | Medium |
| **C6** | The faster suite: the no-server sections under the virtual clock (§5.7), piloted first | No (same assertions) | Medium; pays back every round, so it may move up |

Then the product line resumes in Johan's order: the knowledge layer's Kevlar and wakes (65f) → the abstract
model spec → the V5 waves on the ledger. C2–C6 can interleave with product rounds. C1 should come first,
because every later round pays the bootstrap.

---

## 8. Decisions for Johan

1. **Go on C1 as specified?** Recommended: yes.
2. **The journal.** (a) Stop it: CHANGELOG + STATUS + the PR carry the record. (b) Keep a short Swedish
   decision log, ≤ 10 lines a round, out of the bootstrap. (c) Keep it as it is, out of the bootstrap.
   Recommended: (b), if you read it; (a) if you do not.
3. **READ-ME-FIRST files.** Stop writing them; STATUS and the PR body replace them. Recommended: yes.
4. **The read-only client copies in `bot/`.** Ask main whether the bot's gates may read the root's released
   files instead (no drift, 1.8 MB fewer copies). Recommended: ask; keep the copies until main answers.
5. **CI for `bot/`** (`.github/workflows/bot-gates.yml` beside main's `client-gates.yml`, triggered only by
   `bot/**` and the bot bundle at the root). Main's workflow already invites it. Recommended: yes.
6. **History comments in the bot.** (a) Leave them. (b) Trim them in functions a round touches. (c) One
   mechanical pass, verified by identical minified output. Recommended: (b) now; (c) only if the bundle size
   ever matters to players.
7. **The project instruction** in claude.ai: paste Appendix A after C1 lands. It changes the bootstrap and the
   release ritual.

---

## 9. Anything I'm unsure about

- **Fact-checked.** A fresh-context agent checked the first draft (about 220 claims) and found 24 errors, 8 of
  them material; all are corrected here.
- **Token figures are estimates** (bytes ÷ 3.5–4). The 55k for CLAUDE.md is the same estimate, not a count.
- **The RULINGS extraction can miss a ruling.** The rulings are buried in debts and journal paragraphs and are
  sometimes superseded within a paragraph ("supersedes …"). That is why §5.7 has a fresh agent check it, and why
  the memory notes are a second source. A rough count (46 ruling-like mentions in CLAUDE.md, ~50 decision lines
  in the memory notes, several rulings in many of them) puts the register at 80–150 one-line rulings, which fits
  its 25 KB budget but makes C1 a careful session rather than a quick one.
- **Whether you read the journal.** It is the only Swedish document, so it may be yours rather than mine. Q2
  depends on that.
- **CI and the suite's runtime.** In CI the suite needs the client copies (or the root's release, Q4) and about
  five minutes a run. One run in CI is a guard; the local ×3 stays the release gate until C6 makes the suite
  fast enough to run three times anywhere.
- **The suite timing is one run on a 2-core sandbox,** with my other work beside it. The 13 % CPU share is the
  number to trust, not the 417 s. The remedy should be piloted, not assumed.
- **Human readers.** ARCHITECTURE serves both, but `elysium-bot.js` stays a 1 MB file written for an agent. That
  is the trade-off Johan chose, stated plainly.

---

## Appendix A — proposed project instruction (after C1)

```
SOURCE OF TRUTH: https://github.com/dtagent2000/VTES-Elysium — monorepo. bot/ is this project; client/ is the
client/server project; the root is the download. Chat in Swedish; code, commits and docs in English.

BOOTSTRAP (every new chat): clone → root CLAUDE.md → bot/CLAUDE.md → bot/docs/STATUS.md → bot/docs/BOARD.md.
Read RULINGS.md, LESSONS.md, ARCHITECTURE.md and HOWTO.md when the task touches them (CLAUDE.md says when).
Work on a branch from main, never on main.

THE RULE: bot/ never edits client/ or the client/server files at the root. A need on main's side is a handoff
(bot/docs/handoffs/); the contract ships first, or the bot first when backward compatible. Never both in one PR.

THE ROUND (bot/docs/HARNESS.md): take a BOARD line → change → gates (bot/CLAUDE.md) → a fresh-context egress
review → STATUS rewritten, CHANGELOG entry, BOARD line deleted (RULINGS / LESSONS when they changed) → PR with
the gate numbers and the egress line. Commit and push as soon as a step is green. Johan merges.

RELEASE: bump BOT_VERSION, copy the bundle from bot/ to the root (never edit the root in place).

WAYS OF WORKING: on "how should we do X", analyse, propose, wait for "kör". End every implementation round with an
honest "anything I'm unsure about". Never claim a gate passed without having run it.
```

## Appendix B — credits and references

The ideas credited above come from these open projects, with thanks. This spec copies no code or data from them.

- **zero-vtes**, https://github.com/lionel-panhaleux/zero-vtes: `README.md`, `CLAUDE.md` (harness, owner rules,
  working lessons), `DESIGN.md`, `docs/boards/engine.md`, `docs/engine.md` §5 (comment policy),
  `.claude/skills/{ship,intake,upkeep}`, `.claude/agents/egress-reviewer.md`.
- **VTES-Player**, https://github.com/DuelRevolvers/VTES-Player: `CLAUDE.md` (principles, lessons, no partial
  cards, testing), `src/ai/{heuristic,search,playstyles}.ts`, `docs/ai-v2-design.md` §5–6, the
  information-boundary test.
- **tasha-morgan**, https://github.com/gurchon-hall/tasha-morgan: `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`,
  `src/vtesbot/sim/invariants.py`, `.claude/agents/rules-auditor.md`.
- **jol-rebuild**, https://github.com/VTES-JOL/jol-rebuild: `docs/implementation/{card-text-parsing,timing-windows}.md`,
  `csv/modes/*.csv` (counted, not copied).
- **Data we build on:** KRCG's card data, the TWDA (VEKN), vtes-rulings and vtes-skill.
- **Ours:** `bot/CLAUDE.md`, `bot/README.md`, `bot/SKILLS.md`, the living docs, `elysium-bot.js`,
  `test-bot-logic.js`, `elysium-bot-sim.js`, git history.
