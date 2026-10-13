# START HERE — a client/server session on the VTES-Elysium monorepo

*Written 12 October 2026 at the monorepo sync (PR `client-sync`). Keep the version block below current:
a release bumps it in the same commit.*

**Repository:** https://github.com/dtagent2000/VTES-Elysium — branch `main`. The repo is the truth; the Claude
project holds only this file and `PROJECT-INSTRUCTIONS.md`.

## Where we stand

| What | Version | Where |
| --- | --- | --- |
| client | **v2.6.151** (THE EDGE ON THE GLOBE: a seat's Edge on its globe when no token lies out, ordinals on every seat chip, the help pages mention the table setup; carries v2.6.150 THE TAB SAYS SO and v2.6.149 THE FACE DECIDES) | `client/elysium-vtes-bord.html`, copied to `/` |
| server | **srv-2.6.45** (the pub keeps `tn`/`rn`, the turn count; srv-2.6.44: the room option `tableSetup`) | `client/elysium-server.js`, copied to `/` |
| bot (consumed) | **v0.6.198** (12 Oct 2026) | the 8-file bundle at `/` and in `bot/` — never edited here |
| protocol | `ELYSIUM-PROTOCOL.md` header v2.6.151 / srv-2.6.45 | `client/ELYSIUM-PROTOCOL.md` |
| last gates | client **279/0** (no skips, bot v0.6.198 beside) · canary 57/0 · dispatch 65/0 · protocol 6/0 · endpoint 24/0 · soak `--control` exit 0 + a three-bot Structured soak · B1 byte-identical 1 531 407 · embed `--check` both pages · check-versions green incl. the root gate | run from `client/` |

**Live on elysium.cards:** whatever Johan deployed last — check the journal's newest entry. v2.6.148 + srv-2.6.44 were
merged on 13 Oct (PR #6). v2.6.149 + srv-2.6.45 were delivered the same evening and need BOTH steps: **restart the server** and purge the client (against srv-2.6.44 the new client works, but a reload mid-game counts turns from 1 as before). Bot v0.6.198 is unchanged.

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
node test-client-logic.js          # 278 passed, 0 failed, 0 skipped (with the bundle beside)
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

## Open right now (13 Oct 2026)

- **Built in v2.6.149 (13 Oct, evening):** K1–K6 from the Classic review, plus the turn count across a reconnect or reload
  (srv-2.6.45) and attached cards riding their host in every view. `client/CLAUDE.md` top entry. **v2.6.150:** a resolver no longer opens the tray on other screens, so the
  top row is back at the top edge; a player who opens the tray covers their own top-centre seat with it. **Not run:** touch, a referee watching, six humans at once, a socket bot at a Classic table after the change.
- **For the bot project to pick up:** `docs/handoffs/REPLY-to-bot-2026-10-13-classic-review.md` — the hard stop
  (`_openSlot` on a full Classic row), equipment without `host` (Structured too), permanents at fixed felt points. The
  Edge on the felt is ours since v2.6.151 (`docs/handoffs/REPLY-to-bot-2026-10-13-v2.6.151.md`). The seat spots are final with v2.6.149 (top row at y 132): `docs/handoffs/REPLY-to-bot-2026-10-13-v2.6.149.md`
  has the formula, and says the client now draws equipment on its vampire without waiting for their `host`.
- **Until v2.6.148 or later is deployed** the lobby offers Add bot in a Classic room, and a lobby bot whose camp row fills
  freezes the host's tab (run twice on main's pair, 13 Oct; the other player sees every seat online and the turn
  on the bot, and has no tool).
- **Johan's call:** online, should anyone at the table get the hold badge's Resume button (today only the holder)?
  (v2.6.142; `docs/elysium-session-journal.md` newest entry.)
- **Deploy:** v2.6.149 + srv-2.6.45 (it carries v2.6.148 + srv-2.6.44) — restart the server, purge the client. (Bot v0.6.198 from 12 Oct, if not yet up: purge `/elysium-bot.js`.)
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
