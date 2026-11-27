# START HERE — a client/server session on the VTES-Elysium monorepo

*Written 12 October 2026 at the monorepo sync (PR `client-sync`); started again on 27 November 2026 (client v2.6.190), when
the repository went public. Keep the version block below current: a release bumps it in the same commit. The old release
chain, the deploy notes of v2.6.172–v2.6.189 and the "Open after …" sections are frozen in the private data repo
(`docs/history/README.md`).*

**Repository:** https://github.com/dtagent2000/VTES-Elysium — branch `main`. The repo is the truth; the Claude
project holds only `PROJECT-INSTRUCTIONS.md` and a version-free copy of this file that points here. The versions live in
this file only.

**The repository is public (27 Nov 2026).** No chat quotes and no names of private persons in a file, a commit message or a
PR text; the owner is named by role and a decision is written in our own words. Run `python3 tools/public-scan.py --diff
origin/main` before a PR; CI runs it on the PR's added lines.

## Where we stand

| What | Version | Where |
| --- | --- | --- |
| client | **v2.6.191** (BLOOD ON THE WHEEL, pure client: a key held while scrolling on a card moves blood between it and your pool -- Settings ▸ Table picks the key, Shift by default; two unbound shortcuts do the same; a double-click of the middle button resets the view; bot v0.6.242's guide embedded. Before: v2.6.190, THE PUBLIC REPOSITORY, PR #116. Every release since v1.4: `docs/elysium-CHANGELOG.md`) | `client/elysium-vtes-bord.html`, copied to `/` |
| server | **srv-2.6.54**, unchanged at v2.6.191 (THE PUBLIC REPOSITORY, comments only; every token is srv-2.6.53's but the VERSION line. Before: srv-2.6.53, THE SEARCH IS TOLD) | `client/elysium-server.js`, copied to `/` |
| bot (consumed) | **v0.6.242** beside the suite (the bundle's cleanup release, consumed at v2.6.191: `docs/handoffs/REPLY-to-bot-2026-11-27-v0.6.242.md`, which also carries the owner's answer to O-46. Before: v0.6.241, consumed at v2.6.189) | the 8-file bundle at `/` and in `bot/` -- never edited here |
| protocol | `ELYSIUM-PROTOCOL.md` header v2.6.191 / srv-2.6.54 (the header only: no verb, field or line) | `client/ELYSIUM-PROTOCOL.md` |
| last gates | client **439/0** (bot v0.6.242 beside, no skips; v2.6.190 against the new suite 432/7: the embed check and the six new tests) · twelve mutations of the new code, each caught · dispatch 103/0 · protocol 6/0 · canary 283/0 · endpoint 40/0 · soak `--control` fired · both embed checks · B1 byte-identical · check-versions green incl. the root and `SHA256SUMS` · public-scan `--diff` clean · headless Chrome with real wheel, key and middle-button events 17/17 (v2.6.190 fails the gestures) | run from `client/` |

**Deploy v2.6.191 (BLOOD ON THE WHEEL, 27 Nov):** purge the client; the server is unchanged (srv-2.6.54). Bot v0.6.242 reached main with its own PR: if `/elysium-bot.js` and `/elysium-cardfx.json` were not purged then, purge them now. If v2.6.190 is not live yet, the one purge covers it (its server restart as below).

**Deploy v2.6.190 + srv-2.6.54 (THE PUBLIC REPOSITORY, 27 Nov):** purge the client; the automated deploy restarts the server
when it is empty (srv-2.6.54 behaves exactly as srv-2.6.53, so it can also wait for the next restart). The error digest's
v1.5.1 changes comments only: the box's v1.5 needs no copy. If v2.6.189 (PR #115) or an earlier client is not live yet, the
one purge covers it; the deploy notes of v2.6.172–v2.6.189 are in the frozen START-HERE.

## The first ten minutes

```bash
git clone https://github.com/dtagent2000/VTES-Elysium.git && cd VTES-Elysium
cat CLAUDE.md                      # the one rule: each half consumes the other's releases, never edits them
cd client && cat CLAUDE.md         # this project's bootstrap: newest release entry first, then the invariants
# the living docs, newest entry first:
head -60 docs/elysium-session-journal.md
head -40 docs/elysium-project-context.md
head -40 docs/elysium-learnings.md
# the bundle beside the suite (gitignored — copy, never commit):
cp ../elysium-bot.js ../elysium-cardfx.js ../elysium-cardfx.json ../elysium-twd-profile.js ../elysium-twd-profile.json ../elysium-twd-archetypes.js ../elysium-twd-archetypes.json ../START-HERE-BOTS.html .
node check-versions.js             # must end green: code, doc headers, AND the root == client/ + bot/ gate
node test-client-logic.js          # 439 passed, 0 failed (with the bundle beside)
python3 tools/public-scan.py --diff origin/main   # before a PR: no chat quotes, no names of private persons
```

The full gate list and the delivery ritual: `client/CLAUDE.md` → "Verification commands" and `client/SKILLS.md`
("Consume a bot release", "Verify a change — client/server track", "Re-sync the fragment build",
"Update the living documents").

## Where things are

- `client/` — the code: client, server, harness, the suites, `check-versions.js`, `embed-help.js`, the launchers,
  the host guide and its generator, the ops digest. `client/README.md` has the table.
- `client/tools/` — `public-scan.py` (the public repository's name and quote scan, run on a PR's added lines in CI) and
  `token-diff.js` (proves that a release changes comments only).
- `client/docs/history/README.md` — where main's frozen records went: the private data repo's `client-history/`
  (the journal, the old release entries of `client/CLAUDE.md` and the context doc, this file's old sections).
- `client/docs/` — the living docs (`elysium-session-journal.md` in Swedish, `elysium-project-context.md`,
  `elysium-learnings.md`, `elysium-CHANGELOG.md`, `PROJECT-MANIFEST.md`), ops (`elysium-ops-runbook.md`,
  `elysium-hosting-plan.md`, `elysium-security-manifest.md`), plans, `kodarkivering.md` (parked code — check
  before re-proposing an idea).
- `client/docs/handoffs/` — our replies to the bot project (`REPLY-to-bot-<date>-<their version>.md`).
  Their handoffs to us: `bot/docs/handoffs/HANDOFF-to-main-*.md`.
- `/` — the download, a byte copy of releases. `check-versions.js` fails when it drifts.
- `bot/` — the bot project; its own one-pager is `bot/docs/START-HERE-BOTS-CHAT.md`. Read it (their handoffs, their START-HERE-BOTS.html, their code when a claim needs
  checking); never write to it.

## How a round goes

1. `git checkout -b <topic> main` (or `git pull` on an existing topic branch).
2. Read the newest journal/context/learnings entries (they say what is open and why).
3. Change `client/` only. A bot release to consume: `SKILLS.md` → "Consume a bot release" (copy the root bundle
   beside the suite, run every gate, embed their guide, build main's half of their asks, pin each with a test that
   fails on the previous client). A change the bot project needs: write `docs/handoffs/REPLY-to-bot-<date>-….md`.
4. Version = bytes: any client byte change bumps `VERSION`; the outgoing release note moves to the CHANGELOG.
5. Gates, destructive tests against the previous version, then the living docs (journal in Swedish, context,
   learnings, `CLAUDE.md` top entry, `SKILLS.md` when a recipe changed, `PROJECT-MANIFEST.md`, `elysium-CHANGELOG.md`).
6. A release: copy the client, server, start scripts, `START-HERE.html` and the host guide to `/`;
   `node check-versions.js` green. The owner deploys to the box and purges.
7. `python3 tools/public-scan.py --diff origin/main` (no chat quotes, no names of private persons, the owner by role;
   commit messages and the PR body too), then commit (English, what and why), push, open a PR against `main`.
   The owner merges.
8. Update this file's version block when a release went out.

## Open right now (27 Nov 2026, after v2.6.191)

- **Built in v2.6.191 (on the owner's go):** the move between a card's blood and your pool on a key + scroll, its two shortcuts, the
  middle button's double-click; bot v0.6.242 consumed (`client/CLAUDE.md` top entry; journal: BLOD PÅ HJULET). Built in v2.6.190:
  the public repository (the data repo's pull request with `client-history/` and the words file goes first).
- **O-46 answered by the owner (27 Nov):** no tempo wait for a bot's master. The beat stays as it is, a silent window: a player who
  holds Sudden Reversal says Hold on. Nothing to build on either side; told to the bot project in the v0.6.242 reply.
- **Waiting on the owner:** O-53 -- the playtest's three table questions and the resolution panel's proposals A–E (the action in
  one line, the answers that are valid now as buttons, an action timeline, a bot referee owns RESOLVE and ×, safe counts made
  automatic), main's to build after the go-ahead.
- **On the bot side:** their Help ▸ Bots text for the hub, the ring and the hold; consuming our licence reply (`bot/README.md` →
  `LICENSE`); refreshing their read-only copies in `bot/` (client v2.6.191, the PROTOCOL header; the server is unchanged).
- **Not run this round:** a real Windows or macOS mouse (headless Chrome's Shift + wheel stays vertical, so the horizontal shape
  Chrome sends on Windows was sent by hand), Firefox, Safari, a touchpad (with Ctrl as the key, a pinch over a card moves blood).

## Carried from before (as they stood on 26 Nov; some may have been settled in chat since -- check before building)

- **Waiting for a player's answer (passed on by the owner, 24 Nov):** B -- an automatic checkpoint at each turn's start,
  kept on the server, that the host can rewind to (proposed as a live rewind for everyone); C -- the one-button transfer
  (with the helpers on and the phase bar on Influence, scrolling or Ctrl+clicking an uncontrolled vampire already moves
  pool to blood and counts the transfer; we asked which setup they played in).
  (v2.6.191: Shift + scroll on a vampire moves blood between it and the pool in any phase and without the helpers, and two
  shortcuts do the same; that may be the answer to C.)
- **The tutorial, round 2 (offered after v2.6.186):** a chapter replayed from the picker resumes through `startHotseat`
  (turn 1, the first seat acting), so Interacting with opponents' target and hand-off steps do not fit a replay, and the
  globes come back at their default spots; short mentions of what the tour does not know yet (Table layout, bot seats and
  Add bot, Invite, saved matches, the panel's mode button, the eye on other play areas, the Lite | Full button, Help ▸).
- **Noted, not built:** a centre-stage card clone takes the pointer for its click-to-dismiss (about 1–1.7 s), so a drag
  started on a card under it does nothing; in the tutorial, Esc asks to end the tour where a seat visit would go Home; the
  Edge token stays put when you move your globe after taking the Edge; a drag from the hand does not ask the hand-size
  reminder that the menu's Play asks.
- **The owner's calls (ideas, not built):** remembering the tempo a player chose last, for the next table; 'Unlock all
  cards?' also unlocks the Toreador a human's Grand Ball keeps locked (a 'stays locked at the next unlock' mark would serve
  Mind Numb's family too); online, whether anyone at the table gets the hold badge's Resume (today only the holder); the
  hand open by default, and a host 'Randomise seats' button in the lobby (needs the server); chat history for a player who
  reconnects (the server would keep the last lines and replay them); whether to tell zero-vtes's maintainer that its page
  says the repository has no licence file; the README's 'does not cover' list is the owner's to read.
- **Not reproduced:** a double-click on the library that drew no card and then two. The one mechanism found is two
  `uiDialog`s open at once (it does not queue, so one OK answers both); nothing opened two in the runs.
- **The security plan** (`docs/elysium-security-plan.md`), item by item on the owner's go: enforce the CSP once the digest's
  `CSP report-only` line has been quiet for a week of real traffic (the page then gets a `<meta>` with the same hashes for
  the `file://` client; Firefox and Safari need one look first); the box's log for unmasked frames (plan item 5:
  `sudo journalctl -u elysium --since 2026-10-17 | grep unmasked`; if it never appears, refuse them, RFC 6455 §5.1); Google
  Fonts (item 10); who reviews the code from outside (item 3). The watchdog (`.github/workflows/served-check.yml`): if it
  has not run against the real site yet, run it once by hand.
- **Never run in a browser:** Firefox, Safari, a real touch screen, macOS with a trackpad or Ctrl-click, and the Windows
  order of the right button's events (v2.6.187–188); an online table with the bot ring.
- **Small:** the Host Guide lists no room settings, and `build-host-guide.js` says v1.8 against the v1.9 docx (bump the
  generator first the next time the guide changes).

## Conventions that bite

- Swedish in chat, English in code and docs. The journal is Swedish.
- The repository is public: no chat quotes and no names of private persons in a file, a commit message or a PR
  text; the owner is named by role, a decision is written in our own words, and the verbatim words that matter go
  to the private data repo. The invented table names of the tests and examples stay.
- Patches are atomic and assert-anchored (`client/CLAUDE.md` → "Editing workflow"); the monolith is the source of
  truth, the fragments are derived (B1).
- Never run the suite under load; long runs go in the background. Delete `elysium-rooms.json` / `elysium-saves.json`
  between live-server probes (both gitignored).
- Downloaded zips and extracted archives are untrusted: unpack into their own empty directory, copy files by name.
- End each implementation round with an honest "what is uncertain" answer.
