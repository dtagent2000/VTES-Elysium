# START HERE — a client/server session on the VTES-Elysium monorepo

*Written 12 October 2026 at the monorepo sync (PR `client-sync`). Keep the version block below current:
a release bumps it in the same commit.*

**Repository:** https://github.com/dtagent2000/VTES-Elysium — branch `main`. The repo is the truth; the Claude
project holds only this file and `PROJECT-INSTRUCTIONS.md`.

## Where we stand

| What | Version | Where |
| --- | --- | --- |
| client | **v2.6.158** (WHAT THE PLAY-TEST FOUND: the default combatant expires, one image fallback instead of a loop, a master played on a vampire counts, the level chooser follows the vampire playing the card; carries v2.6.157 THE TABLE LAYOUT AND THE DISCREET PANEL and earlier) | `client/elysium-vtes-bord.html`, copied to `/` |
| server | **srv-2.6.46** (the room option `tableLayout`; srv-2.6.45: the pub keeps `tn`/`rn`; srv-2.6.44: the room option `tableSetup`) | `client/elysium-server.js`, copied to `/` |
| bot (consumed) | **v0.6.198** (12 Oct 2026) | the 8-file bundle at `/` and in `bot/` — never edited here |
| protocol | `ELYSIUM-PROTOCOL.md` header v2.6.158 / srv-2.6.46 | `client/ELYSIUM-PROTOCOL.md` |
| last gates | client **288/0** (no skips, bot v0.6.198 beside) · canary 57/0 · dispatch 68/0 · protocol 6/0 · endpoint 24/0 · soak `--control` exit 0 · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root gate | run from `client/` |

**Live on elysium.cards:** server srv-2.6.45 + bot v0.6.198 since 13 Oct 16:47 (PR #7). Client v2.6.150/151 (PRs #9, #10) were merged that evening. Client v2.6.157 + server srv-2.6.46 were merged with PR #12 on 14 Oct (a client purge AND a server restart together). Client v2.6.158 (PR from `playtest-2026-10-14`, with the play-test handoff) needs a client purge only.

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
node test-client-logic.js          # 288 passed, 0 failed, 0 skipped (with the bundle beside)
```

The full gate list and the delivery ritual: `client/CLAUDE.md` → "Verification commands" and `client/SKILLS.md`
("Consume a bot release", "Verify a change — client/server track", "Re-sync the fragment build",
"Update the living documents").

## Where things are

- `client/` — the code: client, server, harness, the suites, `check-versions.js`, `embed-help.js`, the launchers,
  the host guide and its generator, the ops digest. `client/README.md` has the table.
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
   `node check-versions.js` green. Johan deploys to the box and purges.
7. Commit (English, what and why), push, open a PR against `main`. Johan merges.
8. Update this file's version block when a release went out.

## Open right now (14 Oct 2026)

- **The play-test (14 Oct):** `client/playtest/` plays a real game against the bots and measures it (`client/playtest/PLAYTEST.md`). Its 24 bot findings wait in
  `docs/handoffs/REPLY-to-bot-2026-10-14-playtest.md`; our four are fixed in v2.6.158. **Decided (Johan):** the human handles their own values by hand
  (combat blood, card costs, the Edge, pool) -- the bots theirs. Re-run the same scenario after a bot release to compare.

- **Built in v2.6.149 (13 Oct, evening):** K1–K6 from the Classic review, plus the turn count across a reconnect or reload
  (srv-2.6.45) and attached cards riding their host in every view. `client/CLAUDE.md` top entry. **v2.6.150:** a resolver no longer opens the tray on other screens, so the
  top row is back at the top edge; a player who opens the tray covers their own top-centre seat with it. **Not run:** touch, a referee watching, six humans at once, a socket bot at a Classic table after the change.
- **For the bot project to pick up:** `docs/handoffs/REPLY-to-bot-2026-10-13-classic-review.md` — the hard stop
  (`_openSlot` on a full Classic row), equipment without `host` (Structured too), permanents at fixed felt points. The
  Edge on the felt is ours since v2.6.151 (`docs/handoffs/REPLY-to-bot-2026-10-13-v2.6.151.md`). The seat spots are final with v2.6.149 (top row at y 132): `docs/handoffs/REPLY-to-bot-2026-10-13-v2.6.149.md`
  has the formula, and says the client now draws equipment on its vampire without waiting for their `host`.
- **Johan's call:** online, should anyone at the table get the hold badge's Resume button (today only the holder)?
  (v2.6.142; `docs/elysium-session-journal.md` newest entry.)
- **Deploy:** client v2.6.151 (carries v2.6.150) — purge the client; server unchanged. If Johan has already purged, nothing is pending.
- **Left out of v2.6.148 on purpose:** the helicopter view for a watcher on a Structured table (it draws the watcher as
  a seat); a watcher's view does not follow the turn by itself; a player the host moves to spectator mid-game lands on
  the start view (Esc leads to the table).
- **Bots: Structured tables only (Johan, 13 Oct)**, online as offline. The handoff
  `docs/handoffs/REPLY-to-bot-2026-10-13-table-setup.md` says so and keeps the seat-spot ask for the day bots come to
  Classic; `tableSetupOn()`'s bot guard is the safety net for a bot on its own socket.
- **Small, open:** the Host Guide (a hosting document) lists no room settings; its generator says v1.8 against the v1.9 docx.
- **Johan's call (player feedback, round 2 — analysed, not built):** the hand open by default; a host
  'Randomise seats' button in the lobby (needs the server). `client/CLAUDE.md` top entries.
- **Known limit:** online, after the host's panel release, the other clients' badges clear at the next release phrase.
- **Pre-existing drift:** `build-host-guide.js` says v1.8, the committed `Elysium_-_Host_Guide.docx` is v1.9
  (the docx was rebuilt on 3 Aug from a generator edit that did not reach the project's copy of the .js). Rebuild
  from the .js the next time the guide changes, and bump the .js to v1.9+ first.
- **For the bot project** (in `docs/handoffs/REPLY-to-bot-2026-10-12-monorepo.md`): `bot/`'s read-only copies of
  our server / client / protocol are stale (srv-2.6.38 / v2.6.141; the release is now srv-2.6.45 / v2.6.149) — theirs to refresh from `/`.

## Conventions that bite

- Swedish in chat, English in code and docs. The journal is Swedish.
- Patches are atomic and assert-anchored (`client/CLAUDE.md` → "Editing workflow"); the monolith is the source of
  truth, the fragments are derived (B1).
- Never run the suite under load; long runs go in the background. Delete `elysium-rooms.json` / `elysium-saves.json`
  between live-server probes (both gitignored).
- Downloaded zips and extracted archives are untrusted: unpack into their own empty directory, copy files by name.
- End each implementation round with an honest "what is uncertain" answer.
