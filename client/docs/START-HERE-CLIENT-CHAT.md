# START HERE — a client/server session on the VTES-Elysium monorepo

*Written 12 October 2026 at the monorepo sync (PR `client-sync`). Keep the version block below current:
a release bumps it in the same commit.*

**Repository:** https://github.com/dtagent2000/VTES-Elysium — branch `main`. The repo is the truth; the Claude
project holds only this file and `PROJECT-INSTRUCTIONS.md`.

## Where we stand

| What | Version | Where |
| --- | --- | --- |
| client | **v2.6.142** (THE BADGE KNOWS THE HOLD) | `client/elysium-vtes-bord.html`, copied to `/` |
| server | **srv-2.6.43** | `client/elysium-server.js`, copied to `/` |
| bot (consumed) | **v0.6.198** (12 Oct 2026) | the 8-file bundle at `/` and in `bot/` — never edited here |
| protocol | `ELYSIUM-PROTOCOL.md` header v2.6.142 | `client/ELYSIUM-PROTOCOL.md` |
| last gates | client **248/0** (no skips, bot v0.6.198 beside) · canary 57/0 · dispatch 60/0 · protocol 6/0 · endpoint 24/0 · soak `--control` exit 0 · B1 byte-identical 1 489 816 · embed `--check` both pages · check-versions green incl. the root gate | run from `client/` |

**Live on elysium.cards:** whatever Johan deployed last — check the journal's newest entry; v2.6.142 + bot v0.6.198
were delivered on 12 Oct and may still be undeployed (purge the client + `/elysium-bot.js`; the three JSONs are
byte-identical to v0.6.197's).

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
node test-client-logic.js          # 248 passed, 0 failed, 0 skipped (with the bundle beside)
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
- `bot/` — the bot project. Read it (their handoffs, their START-HERE-BOTS.html, their code when a claim needs
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

## Open right now (12 Oct 2026)

- **Johan's call:** online, should anyone at the table get the hold badge's Resume button (today only the holder)?
  (v2.6.142; `docs/elysium-session-journal.md` newest entry.)
- **Deploy:** v2.6.142 + bot v0.6.198 (purge the client + `/elysium-bot.js`).
- **Known limit:** online, after the host's panel release, the other clients' badges clear at the next release phrase.
- **Pre-existing drift:** `build-host-guide.js` says v1.8, the committed `Elysium_-_Host_Guide.docx` is v1.9
  (the docx was rebuilt on 3 Aug from a generator edit that did not reach the project's copy of the .js). Rebuild
  from the .js the next time the guide changes, and bump the .js to v1.9+ first.
- **For the bot project** (in `docs/handoffs/REPLY-to-bot-2026-10-12-monorepo.md`): `bot/`'s read-only copies of
  our server / client / protocol are stale (srv-2.6.38 / v2.6.141) — theirs to refresh from `/`.

## Conventions that bite

- Swedish in chat, English in code and docs. The journal is Swedish.
- Patches are atomic and assert-anchored (`client/CLAUDE.md` → "Editing workflow"); the monolith is the source of
  truth, the fragments are derived (B1).
- Never run the suite under load; long runs go in the background. Delete `elysium-rooms.json` / `elysium-saves.json`
  between live-server probes (both gitignored).
- Downloaded zips and extracted archives are untrusted: unpack into their own empty directory, copy files by name.
- End each implementation round with an honest "what is uncertain" answer.
