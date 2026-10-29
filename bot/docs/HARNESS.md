# HARNESS — the round, the reviews, the release ritual (20 Oct 2026)

## The round
1. **Take a board line** (`BOARD.md`), or Johan's instruction. Read the RULINGS lines it cites. If the line is a design question
   ("how should we do X"): analyse, propose (what · why · where · size · how it will be measured), wait for "kör". Fixes found on
   the way may ride in the round when they fit (the combining rule, RULINGS D-92); say so in the PR.
2. **Branch** from `main` (`git checkout -b <topic>`). Never on `main`.
3. **Change.** Rules corrections never behind a knob; decision changes behind a knob with a 0-path (CLAUDE.md, knob hygiene).
   A new frozen line: its parser and its `_evClassify` kind in the same release; its §12 entry and canary case are main's (a
   handoff; ARCHITECTURE "Shared with main"). A new wait on a human: the tempo kind, the hold freeze / thaw, the `status()` /
   `step()` rung. A new combat event: its frozen line, its parser in `_parseCombatNarration`, its section through `_onLog`.
4. **Tests first for the destructive proof:** a new section is run against the pre-change bot with `tools/run-section.sh` (red),
   then the new bytes (green). Then every gate CLAUDE.md "Gates" lists for the change (that list is the complete one). Never
   claim a gate passed without having run it; a gate that could not run is said so in the PR.
5. **Commit and push as soon as a step is green** — context can run out. Small commits, English messages, the version in the
   message when it is a release.
6. **Egress review** (fresh context, see below). Its findings are fixed or listed in the PR body.
7. **Docs:** STATUS rewritten (version, gates, next); a CHANGELOG entry; the BOARD line deleted, found lines added; RULINGS when
   Johan ruled or a rules reading changed; LESSONS only for a new CLASS of lesson (not every story); a HANDOFF when main must act.
   `bash tools/doc-budget.sh` green.
8. **PR against `main`** with: what changed and why, the gate numbers (assertion counts, canary, hotseat, HB1, cardfx), the sim
   footprint (IDENTICAL / SAME-PLAY / DIVERGED, outcomes changed, zeroPool), the release bytes' sha256 when it is a release, the
   `Egress:` line, and "anything I'm unsure about". Johan merges and deletes the branch.

## Working alone (sandbox habits)
- Long runs detached (`run_in_background`, or `setsid nohup … &` + a poll loop inside the same turn); never a foreground
  `timeout` that can cut a green run; one suite run per snapshot; `pkill -f` never (kill by PID).
- A series or a bench lives in scratch, never in `bot/` (a 240-match sim is ~120 MB).
- Third-party data (`vtes.json`, the TWDA) is fetched or copied from the private data repo; never committed.

## The egress review (every round; a fresh-context agent)
The reviewer gets: the diff, the board line, the RULINGS lines it cites, and the pages the change named — never the conversation.
It reports findings in classes: `stale-doc` (a page the change made wrong), `half-done` (a path built on one side only, a flag
without its reset, an emit without its reader), `test-weakened` (a guard that silently skips, all-negative cases, an assertion
loosened), `rule-missed` (a CLAUDE.md or RULINGS line the change contradicts), `unproven` (a claim with no gate behind it).
Three findings of one class across rounds become a rule in CLAUDE.md or a lesson. The PR body carries the line
`Egress: <n> findings (<classes>), <fixed> fixed, <listed> listed`.

For particularly high-stakes work the check is also done by a separate agent that has not seen the work being produced: facts
against their sources, arithmetic by running it, a document by opening it.

## Graded rules readings (card waves; the charter)
Each curated card reading is graded by a fresh read-only agent against KRCG's text and vtes-rulings: **green** (the reading does
all the card prints, in every mode, with its costs and timing), **amber** (a printed mode or rider is missing and the entry says
so), **red** (the reading contradicts the text or a ruling). The wave's PR lists the grades; only reds go to Johan. The five
playability layers are the checklist: source region legal · phase / type / actor gates · requirements met and costs payable ·
the timing window allows it · the player holds priority (jol-rebuild's `timing-windows.md`; v0.6.210's last pool and Second
Tradition's title were layer-3 misses).

## The release ritual
1. Bump `BOT_VERSION` (the line carries the version; the note goes to `elysium-bot-CHANGELOG.md`, newest first, with the gates
   and the sim footprint in it).
2. Gates on the release bytes (the ×3 in frozen snapshots; sha256 of `elysium-bot.js`, `test-bot-logic.js`,
   `elysium-cardfx.json` in the PR).
3. Copy the bundle from `bot/` to the repository root (`elysium-bot.js`, `elysium-cardfx.json/.js`, `elysium-twd-profile.json/.js`,
   `elysium-twd-archetypes.json/.js`, `START-HERE-BOTS.html`); never edit the root in place. `START-HERE-BOTS.html`'s version
   chip and footer.
4. STATUS rewritten (`tools/doc-budget.sh` checks its versions against the code); a HANDOFF to main only when main must act
   (re-embed the guide, a new bot line in §12, a client change). README and START-HERE-BOTS-CHAT carry no versions.
5. The PR body = the record. No READ-ME-FIRST and no journal or context entry, as spec-cleanup §5.5 lays out; their history is
   in `docs/history/`. Johan's answers to §8 Q2 / Q3 are open (RULINGS O-28): Q2 (b) would add a short Swedish decision log,
   ≤ 10 lines a round, outside the bootstrap.

## When main must act
Write `docs/handoffs/HANDOFF-to-main-<date>-<version>.md`: the need, the frozen line or verb, the backward-compatibility
reading, what the bot already does. Main replies in `client/docs/handoffs/REPLY-to-bot-*.md`; a reply is consumed in a bot
round (its items built or declined) and the handoff moves to `history/handoffs/`. Never both halves in one PR.

## The handshake with the client's versions
The read-only copies in `bot/` are refreshed from main's release, as a commit of their own ("copies: client vX / srv-Y"):
`elysium-vtes-bord.html` and `elysium-server.js` from the root, `ELYSIUM-PROTOCOL.md` and `test-bot-canary.js` from `client/`,
`elysium-hotseat-bots-plan.md` from `client/docs/` (ARCHITECTURE "Shared with main"). The canary runs against both the copies and
main's release (HOWTO). STATUS names both versions; `tools/doc-budget.sh` checks them.

## Upkeep (between rounds, or when a check says so)
- **Every docs change:** `bash tools/doc-budget.sh` green (budgets, named paths, the versions STATUS names); after changing
  the check itself, `bash tools/test-doc-budget.sh` (every failure class red, the baseline green).
- **When a page nears its budget:** cut what is history (it goes to `docs/history/` or stays in git), never a binding rule; when
  what remains still needs room, raise the budget in `tools/doc-budget.sh` (Johan, RULINGS D-101).
  LESSONS takes a new line only for a new class; BOARD lines that are done are deleted, not ticked.
- **Every few rounds:** read RULINGS' Open lines with Johan (an answer moves the line up as an R or D line with its date); read
  BOARD top to bottom and drop what no longer matters; refresh the read-only copies when the root has moved.
- **Three egress findings of one class** become a rule in CLAUDE.md or a LESSONS line (the ratchet).
- **History comments** in `elysium-bot.js`: trim to a "why" + a rule id in the functions a round touches (spec-cleanup §8 Q6).
