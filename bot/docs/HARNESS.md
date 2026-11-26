# HARNESS — the roles, the round, the reviews, the measurements, the release ritual (20 Oct 2026; 26 Nov 2026: D-139, D-140, D-142)

## Roles and tools (the owner, 26 Nov 2026: D-139, D-140; the models by task, D-131)
| who | does | model |
|---|---|---|
| the lead (the chat) | the design, the bot's code, the owner's questions, the docs, the PR; the one writer in the checkout | the chat's |
| `bot-card-reader` (`.claude/agents/`) | a batch of cards against KRCG's text and the rulings, zero-vtes a witness; verdicts to scratch | Sonnet |
| `bot-egress-reviewer` (`.claude/agents/`) | the egress review below; pass 1 on its own model (on Fable in a round without a bot change), every later pass a new instance on Fable that checks the earlier findings and the fixes | Opus, Fable |
| Explore (built in) | where a decision lives in `elysium-bot.js`; a search across many files | its own |
| CI (`.github/workflows/bot-gates.yml`) | the unattended gates and the suite ×3, the release gate (D-139) | — |

Scripts: `tools/setup.sh` (KRCG's data, zero-vtes at its pin), `tools/gates.sh` (the local gates, `--sim` the footprint,
`--smokes` the V5 smokes; one summary for the PR), `tools/release.sh` (the ritual's mechanics), `tools/ci-status.sh`
(CI's checks and each suite run's count and sha256), `tools/public-scan.py` (the name and quote scan, D-141). An agent costs more of
the owner's usage than the lead's own work: use one where it keeps a big read out of the lead's context or where independent eyes
are the point (the review), not for small jobs.

## One place for each fact (D-142)
STATUS holds the state: the versions, the deploy state, the open PRs, the last gate numbers on `main`'s bytes and what is next.
The CHANGELOG entry holds what a round changed and why, its predictions and its gates line, written once the review has ended.
The PR body holds what the round needs from the owner, a few lines on the change (the entry has the rest), the `tools/gates.sh`
table it ran, CI's counts, the `Egress:` line and the unsure items. The project's claude/HANDOFF.md points to STATUS and the open
PRs and holds only what is nowhere else: "Check first" and the chat's own notes (the owner's words not yet in a RULINGS line, a
question not yet answered). None restates another; a copy is a stale-doc finding waiting to happen.

## Sessions
One round a chat. Start: the bootstrap (CLAUDE.md), `bash tools/setup.sh`, a branch. The sandbox stops background work a few
minutes after a reply ends: a long run finishes inside the turn (detached and polled, never under a foreground `timeout` that can cut
a green run) or runs in CI. A series or a bench lives in
scratch, never in `bot/` (a 240-match sim is ~120 MB); `pkill -f` never (kill by PID); third-party data is fetched, never
committed. End: STATUS and the PR are the handoff; the claude.ai project keeps its instruction, START-HERE-BOTS-CHAT.md, one
handoff doc (claude/HANDOFF.md: the pointers, Check first and the chat's notes, rewritten by the lead with the Projects tool at the
end of every round) and the owner's reviews of other projects. A round's dated report goes to `docs/reports/` (D-140).

## The round
1. **Take a board line** (`BOARD.md`), or the owner's instruction; a red daily `bot gates` run on `main` comes first (HOWTO "CI"). Read
   the RULINGS lines it cites. A design question ("how should we do X"): analyse, propose (what · why · where · size · how it will be
   measured), wait for the go-ahead ("kör"); the round's decisions go to the owner together, in one question card, before the build (D-139). Fixes
   found on the way may ride when they fit (the combining rule, D-92); say so in the PR.
2. **Branch** from `main`. Never on `main`.
3. **Change.** Rules corrections never behind a knob; decision changes behind a knob with a 0-path (CLAUDE.md, knob hygiene).
   A new frozen line: its parser and its `_evClassify` kind in the same release; its §12 entry and canary case are main's (a
   handoff; ARCHITECTURE "Shared with main"). A new wait on a human: the tempo kind, the hold freeze / thaw, the `status()` /
   `step()` rung. A new combat event: its frozen line, its parser in `_parseCombatNarration`, its section through `_onLog`.
4. **Tests first for the destructive proof:** a new section is run against the pre-change bot with `tools/run-section.sh` (red),
   then the new bytes (green). Then `bash tools/gates.sh` (`--sim` for a behaviour change, `--smokes` when cardfx or a deck
   changed) and CI's suite ×3: CI runs on a pull request, on its merge commit, so open the PR as a draft at the first push
   (`tools/ci-status.sh`: each run's count and the sha256 it ran). Every gate CLAUDE.md "Gates" lists for the change; never claim
   a gate passed without having run it; a gate that could not run is said so in the PR.
5. **Commit and push as soon as a step is green** — context can run out. Small commits, English messages, the version in the
   message when it is a release.
6. **Egress review** (fresh context, until clean: below). Its findings are fixed or listed in the PR body.
7. **Docs:** STATUS rewritten (version, gates, next); a CHANGELOG entry (one place for each fact, above); the BOARD line deleted, found lines added (a card problem:
   `SWEEP-REGISTER.md`, D-135); RULINGS when the owner ruled (by role, the words to the data repo: D-141) or a rules reading changed; LESSONS only for a new CLASS of lesson; a
   HANDOFF when main must act. `bash tools/doc-budget.sh` green.
8. **PR against `main`**: at the top what the round needs from the owner, then what changed and why in a few lines, the `tools/gates.sh`
   table and CI's suite counts, the sim footprint (IDENTICAL / SAME-PLAY / DIVERGED, outcomes changed, zeroPool), the release bytes' sha256 when it is a
   release, the `Egress:` line and "anything I'm unsure about". CI must be green before the owner merges (a flake, or a red the PR did
   not cause: re-run once and say so, HOWTO "CI").
9. **A match, in a round with a bot change** (D-140): before the merge, ask the owner whether to play a real match in the human seat
   (main's rig, `client/playtest/`); it finds what the 240 cannot. Its report goes to `docs/reports/`, its bugs to the register or
   BOARD, its questions for the owner to RULINGS, what it teaches about play to `.claude/skills/bot-play-notes/SKILL.md`: a docs
   commit in the PR, listed in its body. A fix to the round's own change goes back to step 3 and a new review pass.
10. The owner merges and deletes the branch.

**Unsure items** (D-141) get a verdict when they show up, not only at the end: **checked now** when the item bears on a
claim, a gate or a rule of the round and the tools at hand can settle it; **carried** to claude/HANDOFF.md's "Check first" with what
would settle it; or **dropped** with one line on why it does not matter. The PR's "anything I'm unsure about" shows all three.

## The egress review (every round; a fresh-context agent)
The reviewer (`bot-egress-reviewer`) gets: the commit range, the board line, the RULINGS lines it cites and the pages the change
named; from the second pass also the earlier passes' findings and the commits that fixed them — never the conversation.
It reports findings in classes: `stale-doc` (a page the change made wrong), `half-done` (a path built on one side only, a flag
without its reset, an emit without its reader), `test-weakened` (a guard that silently skips, all-negative cases, an assertion
loosened), `rule-missed` (a CLAUDE.md or RULINGS line the change contradicts), `unproven` (a claim with no gate behind it).
Three findings of one class across rounds become a rule in CLAUDE.md or a lesson. The PR body carries the line
`Egress: <n> findings (<classes>) in <p> passes, <fixed> fixed, <listed> listed`.

**Review until clean** (D-133, D-139, D-140, D-142). The lead fixes what a pass finds and the gates run again; then a NEW reviewer,
one that took no part in an earlier pass and did none of the work, checks only the earlier findings and the fixes' diff (the
commits after the reviewed head), plus `tools/public-scan.py --diff <base>..<head>` over the whole diff. Pass 1 runs on the reviewer's
own model and every later pass on a model other than the lead's (Fable, `model: fable`, while the lead is on Opus): a round with a
bot change ends only on a clean pass of the other model (D-139). A round without a bot change (no file of the bundle touched) runs
pass 1 on Fable too, and a clean pass 1 ends it (D-140). The loop ends at a clean pass or after three; what is open goes to the owner.
Where the rules or the text do not reach, it stops and asks the owner. KRCG's text, the rulings and zero-vtes stay the witnesses outside
every model. High-stakes work is also checked by an agent that has not seen it: facts against their sources, arithmetic by running
it, a document by opening it.

## Measurements (moved from CLAUDE.md, D-142; they bind every series, bench and trace read)
- **Count in the arena, weigh in a lab (v0.6.206).** [D-81; L-41, L-52] A decision the arena meets once a match is measured on the same table per arm
  (`lab-probe.js` + `ana-lab.py`); the arena proves the knob fires and carries the audits. Before reading a bench arm, prove the
  knob fires (a trace row, a counter, a test on the real line shape). A strength claim needs the mirror bench on the sim
  (`elysium-bot-sim.js --bench`: the variant in every seat, both controls; read PAIRED against the negative control with
  `ana-sim-diff.py --vp`, about ±0.27 VP at 96 matches; HOWTO); a 12-match series supports mechanism counts only. A
  once-a-match decision is weighed in a lab; a knowledge knob is still flipped only after the no-loss bench.
- **Determinism and footprints (v0.6.209).** [D-71; L-46] The same sim spec gives the same trace byte for byte; the matches that DIVERGED are the
  change's footprint — read them before any VP. Seating shapes the tactical choices, so a deck-level claim covers every seating.
- **Traces.** [L-79] Bot names rotate between matches: deck and seat come from the trace MANIFESTS (`manifest.seat`; older traces map
  the `--decks` order), never from a name, a name sort or emission order. VP facts (source-verified 4 Aug 2026, do not re-derive):
  1 VP per prey oust; sole survivor +1 full VP; ½ VP each to time-limit survivors when more than one remains; winner = MOST VP even
  if ousted (`deriveWinner`; tiebreak alive → latest-ousted); the ≥ 2-VP GW clause is tournament ranking, not the table rule.
  Winners from pre-arena-v1.2.5 traces are re-derived via `computeVp` / `deriveWinner`.

## Graded rules readings (card waves; the charter)
Each curated card reading is graded by a fresh read-only agent (`bot-card-reader`) against KRCG's text and vtes-rulings: **green**
(the reading does all the card prints, in every mode, with its costs and timing), **amber** (a printed mode or rider is missing and
the entry says so), **red** (the reading contradicts the text or a ruling). The round's PR lists the grades; only reds go to the owner.
A T2 list (a consumer made general, with the cards it reads) is graded card by card the same way; zero-vtes is a third witness, never
the judge (spec-card-sweep §3). The five playability layers are the checklist: source region legal · phase / type / actor gates ·
requirements met and costs payable · the timing window allows it · the player holds priority.

## The release ritual
1. `bash tools/release.sh X.Y.Z`: `BOT_VERSION` (the line carries the version only), STATUS's version line, START-HERE-BOTS.html's
   chip, footer version and date, the bundle copied to the root (CLAUDE.md "The one rule"; never an edit at the root), main's
   `check-versions.js` in `client/`, the release bytes' sha256 for the PR.
2. The round's own: the CHANGELOG note (newest first, with the gates and the sim footprint), the footer's counts, the rest of STATUS
   (`tools/doc-budget.sh` checks its versions against the code), a HANDOFF to main only when main must act (re-embed the guide, a
   new bot line in §12, a client change). README and START-HERE-BOTS-CHAT carry no versions.
3. Gates on the release bytes: CI's suite ×3 on the PR (`tools/ci-status.sh`).
4. The CHANGELOG entry and the PR body are the record: no READ-ME-FIRST, journal or context entry (spec-cleanup §5.5; its §8 Q2 / Q3
   are open, RULINGS O-28).

## When main must act
Write `docs/handoffs/HANDOFF-to-main-<date>-<version>.md`: the need, the frozen line or verb, the backward-compatibility
reading, what the bot already does; a purge names only what the box serves: `elysium-bot.js`, `elysium-cardfx.json`, the TWD pair.
Main replies in `client/docs/handoffs/REPLY-to-bot-*.md`; a reply is consumed in a bot round (its items built or declined) and the
handoff moves to docs/history/handoffs/ (`docs/history/README.md`). Never both halves in one PR.

## The handshake with the client's versions
The read-only copies in `bot/` are refreshed from main's release (where each lives: ARCHITECTURE "Shared with main"), as a
commit of their own ("copies: client vX / srv-Y"). The canary runs against both the copies and
main's release (`tools/gates.sh`: canary, canary-root). STATUS names both versions; `tools/doc-budget.sh` checks them.

## Upkeep (between rounds, or when a check says so)
- **When a page nears its budget:** cut history, never a binding rule; then raise the budget in `tools/doc-budget.sh` (D-101).
  LESSONS takes a new line only for a new class; BOARD lines that are done are deleted.
- **Every few rounds:** RULINGS' Open lines with the owner; BOARD top to bottom; the read-only copies refreshed when the root moved.
- **History comments** in `elysium-bot.js`: trim to a "why" + a rule id in the functions a round touches (spec-cleanup §8 Q6).
