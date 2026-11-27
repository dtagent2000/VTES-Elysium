# HARNESS — the roles, the round, the reviews, the measurements, the release ritual (D-139, D-140, D-142, D-145)

## Roles and tools (D-131, D-139, D-140)
| who | does | model |
|---|---|---|
| the lead (the chat) | the design, the bot's code, the owner's questions, the docs, the PR; the one writer in the checkout | the chat's |
| `bot-card-reader` (`.claude/agents/`) | a batch of cards against KRCG's text and the rulings, zero-vtes a witness; verdicts to a file | Sonnet |
| `bot-egress-reviewer` (`.claude/agents/`) | the egress review below; pass 1 on its own model (on Fable in a round without a bot change), every later pass a new instance on Fable that checks the earlier findings and the fixes | Opus, Fable |
| Explore (built in) | where a decision lives in `elysium-bot.js`; a search across many files | its own |
| CI (`.github/workflows/bot-gates.yml`) | the unattended gates and the suite ×3, the release gate (D-139) | — |

Scripts: `tools/setup.sh` (KRCG's data, zero-vtes at its pin), `tools/gates.sh` (the local gates, `--sim` the footprint,
`--smokes` the V5 smokes; the PR's table and the round record), `tools/round.py` (the round record's copies and their check),
`tools/release.sh` (the ritual's mechanics), `tools/ci-status.sh` (CI's checks and each suite run's count and sha256),
`tools/public-scan.py` (the name and quote scan, D-141). An agent costs more of the owner's usage than the lead's own work: use
one where it keeps a big read out of the lead's context or where independent eyes are the point (the review).

## One place for each fact (D-142, D-145)
- **The round record**, `docs/round-record.json`: a round's figures, written once by `tools/gates.sh`; `tools/round.py save` commits
  it with CI's suite runs and the egress line and renders its copies (STATUS's gates block, the CHANGELOG entry's *Gates:* and
  *Egress:* lines, the PR's gate section); `round.py check`, in `tools/doc-budget.sh`, fails on a copy that differs.
- **STATUS** holds the state: its versions and deploy blocks are generated (`round.py status`), Next and Not yet consumed are
  written by hand.
- **The CHANGELOG entry** says what the round changed and why, on its template, at most 1,500 bytes (`round.py check`).
- **The round's report**, `docs/reports/REPORT-<round>-<date>.md`, holds the details: what was built and measured, the
  predictions registered and the last round's read (D-93), the zero-vtes readings when the round read cards (D-144 (3)). A
  tool's output that a later round reads (a readers' verdicts, say) is a data file beside it, from the start.
- **The PR body**: what the round needs from the owner, a few lines on the change, the gate section, the unsure items.
  **claude/HANDOFF.md** (the project's): only what is nowhere else, Check first and the chat's own notes.
- **A spec** changes only when its plan changes, never to record results; a delivered round spec moves to `docs/history/specs/`.
None restates another: a copy written by hand is a stale-doc finding waiting to happen.

## Sessions
One round a chat. Start: the bootstrap (CLAUDE.md), `bash tools/setup.sh`, a branch. The sandbox stops background work a few
minutes after a reply ends: a long run finishes inside the turn (detached and polled) or runs in CI. A series or a bench lives in
scratch, never in `bot/`; `pkill -f` never (kill by PID). End: STATUS and the PR are the handoff; the claude.ai project keeps its
instruction, START-HERE-BOTS-CHAT.md, claude/HANDOFF.md (rewritten by the lead at the end of every round) and the owner's reviews
of other projects.

## The round
1. **Take a board line** (`BOARD.md`), or the owner's instruction; a red daily `bot gates` run on `main` comes first (HOWTO "CI"). Read
   the RULINGS lines it cites. A design question ("how should we do X"): analyse, propose (what · why · where · size · how it will be
   measured), wait for the go-ahead ("kör"); the round's decisions go to the owner together, in one question card, before the build
   (D-139). Fixes found on the way may ride when they fit (the combining rule, D-92); say so in the PR.
2. **Branch** from `main`. Never on `main`.
3. **Change**, by the binding rules: CLAUDE.md's for every change (rules corrections never behind a knob, a decision knob with
   its 0-path) and ARCHITECTURE "Binding rules by area" for the area's (a new frozen line, a new wait on a human, a new combat event).
4. **Tests first for the destructive proof:** a new section is run against the pre-change bot with `tools/run-section.sh` (red),
   then the new bytes (green). Then `bash tools/gates.sh --out DIR` (`--sim` for a behaviour change, `--smokes` when cardfx or a
   deck changed) and CI's suite ×3: CI runs on a pull request, so open the PR as a draft at the first push. Every gate CLAUDE.md
   "Gates" lists for the change; never claim a gate passed without having run it; a gate that could not run is said so in the PR.
5. **Commit and push as soon as a step is green** — context can run out. Small commits, English messages, the version in the
   message when it is a release.
6. **Egress review** (fresh context, until clean: below). Its findings are fixed or listed in the PR body.
7. **Docs:** the CHANGELOG entry on its template with `*Gates:* (pending)` and `*Egress:* (pending)`; the round's report; STATUS's
   Next by hand; the BOARD line deleted, found lines added (a card problem: `SWEEP-REGISTER.md`, D-135); RULINGS when the owner
   ruled (by role, the words to the data repo: D-141) or a rules reading changed; LESSONS only for a new CLASS of lesson; a HANDOFF
   when main must act. Then, with CI green on the gates' head, `python3 tools/round.py save DIR --ci --egress "<line>"` (and
   `--note` for a FAIL the round explains): the record committed, its copies rendered. `bash tools/doc-budget.sh` green.
8. **PR against `main`**: at the top what the round needs from the owner, then what changed and why in a few lines, the gate
   section (`python3 tools/round.py render pr DIR`), the sim footprint when it ran, and "anything I'm unsure about". CI must be
   green before the owner merges (a flake, or a red the PR did not cause: re-run once and say so, HOWTO "CI").
9. **A match, in a round with a bot change** (D-140): before the merge, ask the owner whether to play a real match in the human seat
   (main's rig, `client/playtest/`); it finds what the 240 cannot. Its report goes to `docs/reports/`, its bugs to the register or
   BOARD, its questions for the owner to RULINGS, what it teaches about play to `.claude/skills/bot-play-notes/SKILL.md`: a docs
   commit in the PR, listed in its body. A fix to the round's own change goes back to step 3 and a new review pass.
10. The owner merges and deletes the branch.

**Unsure items** get a verdict when they show up (D-141 (2)): **checked now**, **carried** to claude/HANDOFF.md's "Check first"
with what would settle it, or **dropped** with one line on why; the PR's "anything I'm unsure about" shows all three.

## The egress review (every round; a fresh-context agent)
The reviewer (`bot-egress-reviewer`) gets: the commit range, the board line, the RULINGS lines it cites and the pages the change
named; from the second pass also the earlier passes' findings and the commits that fixed them — never the conversation. Its
effort goes to the code and the card data first; what the tools check (the round record's copies, the paths, the versions, the
budgets) it leaves to `tools/doc-budget.sh` (D-145). It reports findings in classes: `stale-doc` (a page the change made wrong
that no tool checks), `half-done` (a path built on one side only, a flag without its reset, an emit without its reader),
`test-weakened` (a guard that silently skips, all-negative cases, an assertion loosened), `rule-missed` (a CLAUDE.md or RULINGS
line the change contradicts), `unproven` (a claim with no gate behind it). Three findings of one class across rounds become a
rule in CLAUDE.md or a lesson. The record's egress line: `<n> findings (<classes>) in <p> passes, <fixed> fixed, <listed> listed`.

**Review until clean** (D-133, D-139, D-140, D-142). The lead fixes what a pass finds and the gates run again; then a NEW reviewer,
one that took no part in an earlier pass and did none of the work, checks only the earlier findings and the fixes' diff (the
commits after the reviewed head), plus `tools/public-scan.py --diff <base>..<head>` over the whole diff. Pass 1 runs on the reviewer's
own model and every later pass on a model other than the lead's (Fable, `model: fable`, while the lead is on Opus): a round with a
bot change ends only on a clean pass of the other model (D-139). A round without a bot change (no file of the bundle touched) runs
pass 1 on Fable too, and a clean pass 1 ends it (D-140). The loop ends at a clean pass or after three; what is open goes to the owner.
Where the rules or the text do not reach, it stops and asks the owner. KRCG's text, the rulings and zero-vtes stay the witnesses outside
every model.

## Measurements (they bind every series, bench and trace read; D-142)
- **Count in the arena, weigh in a lab.** [D-81; L-41, L-52] A decision the arena meets once a match is measured on the same table per arm
  (`lab-probe.js` + `ana-lab.py`); the arena proves the knob fires and carries the audits. Before reading a bench arm, prove the
  knob fires (a trace row, a counter, a test on the real line shape). A strength claim needs the mirror bench on the sim
  (`elysium-bot-sim.js --bench`: the variant in every seat, both controls; read PAIRED against the negative control with
  `ana-sim-diff.py --vp`, about ±0.27 VP at 96 matches; HOWTO); a 12-match series supports mechanism counts only. A
  once-a-match decision is weighed in a lab; a knowledge knob is still flipped only after the no-loss bench.
- **Determinism and footprints.** [D-71; L-46] The same sim spec gives the same trace byte for byte; the matches that DIVERGED are the
  change's footprint — read them before any VP. Seating shapes the tactical choices, so a deck-level claim covers every seating.
- **Traces.** [L-79] Bot names rotate between matches: deck and seat come from the trace MANIFESTS (`manifest.seat`; older traces map
  the `--decks` order), never from a name, a name sort or emission order. VP facts (source-verified 4 Aug 2026, do not re-derive):
  1 VP per prey oust; sole survivor +1 full VP; ½ VP each to time-limit survivors when more than one remains; winner = MOST VP even
  if ousted (`deriveWinner`; tiebreak alive → latest-ousted); the ≥ 2-VP GW clause is tournament ranking, not the table rule.
  Winners from pre-arena-v1.2.5 traces are re-derived via `computeVp` / `deriveWinner`.

## Graded rules readings (card waves; the charter)
Each curated card reading is graded by a fresh read-only agent (`bot-card-reader`) against KRCG's text and vtes-rulings: **green**
(the reading does all the card prints, in every mode, with its costs and timing), **amber** (a printed mode or rider is missing and
the entry says so), **red** (the reading contradicts the text or a ruling). The round's report lists the grades; only reds go to the
owner. A T2 list (a consumer made general, with the cards it reads) is graded card by card the same way; zero-vtes is a third
witness, never the judge (spec-card-sweep §3). The five playability layers are the checklist: source region legal · phase / type /
actor gates · requirements met and costs payable · the timing window allows it · the player holds priority.

## The release ritual
1. `bash tools/release.sh X.Y.Z` (its header lists what it sets: the version strings, the bundle copied to the root, main's
   `check-versions.js`, the release bytes' sha256). Never an edit at the root.
2. The round's own: the footer's counts in START-HERE-BOTS.html, a HANDOFF to main only when main must act (re-embed the guide,
   a new bot line in §12, a client change), then the docs of the round's step 7. README and START-HERE-BOTS-CHAT carry no versions.
3. The round record, the CHANGELOG entry, the report and the PR body are the record: no READ-ME-FIRST, journal or context entry
   (RULINGS O-28).

## When main must act
Write `docs/handoffs/HANDOFF-to-main-<date>-<version>.md`: the need, the frozen line or verb, the backward-compatibility
reading, what the bot already does; a purge names only what the box serves: `elysium-bot.js`, `elysium-cardfx.json`, the TWD pair.
Main replies in `client/docs/handoffs/REPLY-to-bot-*.md`; a reply is consumed in a bot round (its items built or declined) and the
handoff moves to docs/history/handoffs/ (`docs/history/README.md`). Never both halves in one PR.

## The handshake with the client's versions
The read-only copies in `bot/` are refreshed from main's release (where each lives: ARCHITECTURE "Shared with main"), as a
commit of their own ("copies: client vX / srv-Y"). The canary runs against both the copies and main's release (`tools/gates.sh`:
canary, canary-root). STATUS's versions block names both; `tools/doc-budget.sh` checks them.

## Upkeep (between rounds, or when a check says so)
- **The budget is a ceiling, one in, one out** (`tools/doc-budgets.txt`, D-145): a page that runs out borrows from another (one
  budget down, one up) or moves a line to `docs/history/archive-<page>.md`; never a binding rule cut. The total and the bootstrap
  rise only with a new D-line on their line (the owner's yes): `doc-budget.sh --base`, in `tools/gates.sh` and CI, fails otherwise.
  LESSONS takes a new line only for a new class; BOARD lines that are done are deleted.
- **Every few rounds:** RULINGS' Open lines with the owner; BOARD top to bottom; the read-only copies refreshed when the root moved.
- **History comments** in `elysium-bot.js`: trim to a "why" + a rule id in the functions a round touches (spec-cleanup §8 Q6).
