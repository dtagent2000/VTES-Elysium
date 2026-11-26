# HARNESS — the roles, the round, the reviews, the release ritual (20 Oct 2026; roles and sessions 26 Nov 2026, D-139)

## Roles and tools (Johan, 26 Nov 2026: D-139; the models by task, D-131)
| who | does | model |
|---|---|---|
| the lead (the chat) | the design, the bot's code, Johan's questions, the docs, the PR; the one writer in the checkout | the chat's |
| `bot-card-reader` (`.claude/agents/`) | a batch of cards against KRCG's text and the rulings, zero-vtes a witness; verdicts to scratch | Sonnet |
| `bot-egress-reviewer` (`.claude/agents/`) | the egress review below; pass 1 on its own model, every later pass a new instance on Fable | Opus, Fable |
| Explore (built in) | where a decision lives in `elysium-bot.js`; a search across many files | its own |
| CI (`.github/workflows/bot-gates.yml`) | the unattended gates and the suite ×3, the release gate (D-139) | — |

Scripts: `tools/setup.sh` (KRCG's data, zero-vtes at its pin), `tools/gates.sh` (the local gates, `--sim` the footprint,
`--smokes` the V5 smokes; one summary for the PR), `tools/release.sh` (the ritual's mechanics), `tools/ci-status.sh`
(CI's checks and each suite run's count and sha256). An agent costs more of Johan's usage than the lead's own work: use one where it keeps a big
read out of the lead's context or where independent eyes are the point (the review), not for small jobs.

## Sessions
One round a chat. Start: the bootstrap (CLAUDE.md), `bash tools/setup.sh`, a branch. The sandbox stops background work a few
minutes after a reply ends: a long run finishes inside the turn (detached and polled, never under a foreground `timeout` that can cut
a green run) or runs in CI. A series or a bench lives in
scratch, never in `bot/` (a 240-match sim is ~120 MB); `pkill -f` never (kill by PID); third-party data is fetched, never
committed. End: STATUS's Next and the PR are the handoff; the claude.ai project keeps its instruction, START-HERE-BOTS-CHAT.md
and one handoff doc (claude/HANDOFF.md), which the lead rewrites with the Projects tool at the end of every round.

## The round
1. **Take a board line** (`BOARD.md`), or Johan's instruction; a red daily `bot gates` run on `main` comes first (HOWTO "CI"). Read
   the RULINGS lines it cites. A design question ("how should we do X"): analyse, propose (what · why · where · size · how it will be
   measured), wait for "kör"; the round's decisions go to Johan together, in one question card, before the build (D-139). Fixes
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
7. **Docs:** STATUS rewritten (version, gates, next); a CHANGELOG entry; the BOARD line deleted, found lines added (a card problem:
   `SWEEP-REGISTER.md`, D-135); RULINGS when Johan ruled or a rules reading changed; LESSONS only for a new CLASS of lesson; a
   HANDOFF when main must act. `bash tools/doc-budget.sh` green.
8. **PR against `main`**: at the top what the round needs from Johan, then what changed and why, the `tools/gates.sh` table and CI's suite
   counts, the sim footprint (IDENTICAL / SAME-PLAY / DIVERGED, outcomes changed, zeroPool), the release bytes' sha256 when it is a
   release, the `Egress:` line and "anything I'm unsure about". CI must be green before Johan merges (a flake, or a red the PR did
   not cause: re-run once and say so, HOWTO "CI"). Johan merges and deletes the branch.

## The egress review (every round; a fresh-context agent)
The reviewer (`bot-egress-reviewer`) gets: the commit range, the board line, the RULINGS lines it cites and the pages the change
named; from the second pass also the earlier passes' findings — never the conversation.
It reports findings in classes: `stale-doc` (a page the change made wrong), `half-done` (a path built on one side only, a flag
without its reset, an emit without its reader), `test-weakened` (a guard that silently skips, all-negative cases, an assertion
loosened), `rule-missed` (a CLAUDE.md or RULINGS line the change contradicts), `unproven` (a claim with no gate behind it).
Three findings of one class across rounds become a rule in CLAUDE.md or a lesson. The PR body carries the line
`Egress: <n> findings (<classes>) in <p> passes, <fixed> fixed, <listed> listed`.

**Review until clean** (D-133, D-139). The lead fixes what a pass finds and the gates run again; then a NEW reviewer, one that took
no part in an earlier pass and did none of the work, checks the fixes and the whole diff. Pass 1 runs on the reviewer's own model;
every later pass on a model other than the lead's (Fable, `model: fable`, while the lead is on Opus). A round that
changes no bot behaviour may end on a clean pass 1 (Claude's reading of D-139, for Johan to confirm), said in the PR. The loop ends at a clean pass or
after three, and what is still open goes to Johan in the PR. Where the rules or the text do not reach, it stops and asks him.
KRCG's text, the rulings and zero-vtes stay the witnesses outside every model. High-stakes work is also checked by an agent that has
not seen it: facts against their sources, arithmetic by running it, a document by opening it.

## Graded rules readings (card waves; the charter)
Each curated card reading is graded by a fresh read-only agent (`bot-card-reader`) against KRCG's text and vtes-rulings: **green**
(the reading does all the card prints, in every mode, with its costs and timing), **amber** (a printed mode or rider is missing and
the entry says so), **red** (the reading contradicts the text or a ruling). The round's PR lists the grades; only reds go to Johan.
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
3. Gates on the release bytes: CI's suite ×3 on the PR (`tools/ci-status.sh`: each run's count and the sha256 it ran).
4. The PR body = the record: no READ-ME-FIRST, journal or context entry (spec-cleanup §5.5; its §8 Q2 / Q3 are open, RULINGS O-28).

## When main must act
Write `docs/handoffs/HANDOFF-to-main-<date>-<version>.md`: the need, the frozen line or verb, the backward-compatibility
reading, what the bot already does; a purge names only what the box serves: `elysium-bot.js`, `elysium-cardfx.json`, the TWD pair.
Main replies in `client/docs/handoffs/REPLY-to-bot-*.md`; a reply is consumed in a bot round (its items built or declined) and the
handoff moves to `history/handoffs/`. Never both halves in one PR.

## The handshake with the client's versions
The read-only copies in `bot/` are refreshed from main's release, as a commit of their own ("copies: client vX / srv-Y"):
`elysium-vtes-bord.html` and `elysium-server.js` from the root, `ELYSIUM-PROTOCOL.md` and `test-bot-canary.js` from `client/`,
`elysium-hotseat-bots-plan.md` from `client/docs/` (ARCHITECTURE "Shared with main"). The canary runs against both the copies and
main's release (`tools/gates.sh`: canary, canary-root). STATUS names both versions; `tools/doc-budget.sh` checks them.

## Upkeep (between rounds, or when a check says so)
- **Every docs change:** `bash tools/doc-budget.sh` green; after changing the check itself, `bash tools/test-doc-budget.sh`.
- **When a page nears its budget:** cut history, never a binding rule; then raise the budget in `tools/doc-budget.sh` (D-101).
  LESSONS takes a new line only for a new class; BOARD lines that are done are deleted.
- **Every few rounds:** RULINGS' Open lines with Johan; BOARD top to bottom; the read-only copies refreshed when the root moved.
- **History comments** in `elysium-bot.js`: trim to a "why" + a rule id in the functions a round touches (spec-cleanup §8 Q6).
