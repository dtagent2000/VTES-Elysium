# START HERE — a client/server session on the VTES-Elysium monorepo

*Written 12 October 2026 at the monorepo sync (PR `client-sync`). Keep the version block below current:
a release bumps it in the same commit.*

**Repository:** https://github.com/dtagent2000/VTES-Elysium — branch `main`. The repo is the truth; the Claude
project holds only `PROJECT-INSTRUCTIONS.md` and a version-free copy of this file that points here (rewritten 16 Oct 2026;
it had stood still at v2.6.142). The versions live in this file only.

## Where we stand

| What | Version | Where |
| --- | --- | --- |
| client | **v2.6.165** (THE QUIET TABLE: group C of the review, which closes it -- a board leaves only when it changed, and an open hand when it changed and on every roster (the Structured view echoed every board it received, and an open hand to four seats tripped the rate limit); the rejoin carries the server password (memory only); while reconnecting chat waits, every move that needs the server is refused out loud, the retries run every 2.5 s for the 30 s reconnect window and then back off, and a local game started meanwhile leaves the lost table; 60 saved decks, a full storage said and the game save trimmed instead of lost; carries v2.6.164 THE TABLE KEEPS ITS SEATS: group B of the review -- P only on your own turn; the hotseat bridge clears the counter at every turn change and relays boards through the server's filter; a hand-off no longer changes the phase; an oust always reaches the server; the Block counter goes below 0; Help ▸ Bots embeds bot v0.6.207's guide; carries v2.6.163 THE REVIEW'S THREE LOCKS: `escapeHtml` escapes both quotes -- a peer's name or clan ran script in another tab through an attribute; four toasts show raw text; Help ▸ Bots embeds bot v0.6.206's guide, Help ▸ Local server the new limits; carries v2.6.162 THE VERDICT WAIT: consumes bot v0.6.202–204 -- Help ▸ Bots embeds their v0.6.204 guide; the Bot Activity panel names their new rung, a bot that blocked your action and waits for your word: ▶ Declare verdict; carries v2.6.161 THE VISIT FROM ABOVE: a seat visit from the helicopter view stands on the Normal view, with the hand dock; v2.6.160 THE EYE: on every other seat's Structured mat an eye opens their open hand, ash heap and burned cards; v2.6.159 THE BRIDGE ANSWERS BOTH WAYS and earlier) | `client/elysium-vtes-bord.html`, copied to `/` |
| server | **srv-2.6.49** (group C: `deriveIp` takes the rightmost `X-Forwarded-For` entry behind `--trust-proxy`, and `--trust-proxy xff` ignores `CF-Connecting-IP` for a proxy that is not Cloudflare; the frame reader keeps one growable buffer per connection instead of `Buffer.concat` per chunk; srv-2.6.48 group B: a mid-game `leave` vacates the seat; `bounty.award` -- false settles by hand, VP still paid under `tournLock`; a second bounty pays nothing and an un-oust takes the VP back; `tally` block range −99..99; saves keep open seats and the board style; srv-2.6.47 the review's three locks: names without `"`, card fields without `=`, clans/paths without quotes, every card id `cleanId`; RFC 6455 frame limits with pings and pongs in the rate bucket -- unmasked frames still accepted, logged; `hello{admin}` behind the admin routes' lockout; srv-2.6.46: the room option `tableLayout`; srv-2.6.45: the pub keeps `tn`/`rn`; srv-2.6.44: the room option `tableSetup`) | `client/elysium-server.js`, copied to `/` |
| bot (consumed) | **v0.6.207** (17 Oct 2026; read with group B: our finding 1 built, the probe default) | the 8-file bundle at `/` and in `bot/` — never edited here |
| protocol | `ELYSIUM-PROTOCOL.md` header v2.6.165 / srv-2.6.49 (no new verb or field: §2 the reconnect -- back-off, `srvPass` on the rejoin, chat queued, moves refused; §3 `join` takes `srvPass`; §6.1 which forwarding header `--trust-proxy` reads, and `--trust-proxy xff`; §7 `board` and `openHand` sent only on a change; v2.6.164: §7 `bounty.award`, the `leave` that vacates, un-ousts that return the VP, `tally`'s block range, saves; §8 `bounty` not sent on `award:false`; §12 a negative number in the verdict line; §12.2 the bridge's tally clear and board filter; v2.6.163: §1 frame limits, §2 the rate bucket counts pings, §4.2 the cleaning and a client MUST escape quotes in attributes, §4.3 the admin lockout; §12: the bots' three 'does nothing' combat lines, their combat-ends shape, who sends the Block verdict line -- now also a blocking bot; §12.0: the bots' log-tier moves and their two questions, not frozen; §12.2: the bridge's relays, v2.6.159) | `client/ELYSIUM-PROTOCOL.md` |
| last gates | client **333/0** (no skips, bot v0.6.207 beside) · canary 69/0 · dispatch 88/0 · protocol 6/0 · endpoint 24/0 · soak `--control` exit 0 and the full battery (7 tables, 0 stuck) · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root gate · the same gates in CI (`.github/workflows/client-gates.yml`) | run from `client/` |

**Live on elysium.cards:** server srv-2.6.45 + bot v0.6.198 since 13 Oct 16:47 (PR #7). Client v2.6.150/151 (PRs #9, #10) were merged that evening. Client v2.6.157 + server srv-2.6.46 were merged with PR #12 on 14 Oct (a client purge AND a server restart together). Client v2.6.158 (PR #13, with the play-test handoff) needs a client purge only. Bot v0.6.199–201 were merged on 15–16 Oct (PRs #14–16). Client v2.6.159 (PR #17) needs a client purge and a purge of `/elysium-bot.js`; the server is unchanged. Client v2.6.160 (PR #18, merged 16 Oct) needs a client purge only. Client v2.6.161 (PR #20) needs a client purge only; it carries v2.6.160, so one purge covers both. Bot v0.6.202–204 were merged on 16 Oct (PRs #19, #21, #22): purge `/elysium-bot.js` and `/elysium-cardfx.json` (cardfx changed in v0.6.202). Client v2.6.162 (PR #23) needs a client purge only; it carries v2.6.160–161. Bot v0.6.205–206 were merged on 16–17 Oct (PRs #25, #26): purge `/elysium-bot.js`, `/elysium-cardfx.json` and `/elysium-cardfx.js` (cardfx changed in v0.6.205). Client v2.6.163 + srv-2.6.47 (the security release, PR #27, merged 17 Oct) need a client purge AND a server restart. Client v2.6.164 + srv-2.6.48 (group B, with bot v0.6.207: purge `/elysium-bot.js`) need the same: a client purge AND a server restart; one deploy covers both releases. Client v2.6.165 + srv-2.6.49 (group C, the PR with `.github/workflows/client-gates.yml`) need a client purge AND a server restart; no bot file changed.

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
node test-client-logic.js          # 333 passed, 0 failed, 0 skipped (with the bundle beside)
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

## Open right now (17 Oct 2026)

- **The code review of 16 Oct is closed** (journal 17 Oct, 'GRANSKNINGENS TRE LÅS', 'BORDET BEHÅLLER SINA PLATSER' and
  'DET TYSTA BORDET'): A v2.6.163 / srv-2.6.47, B v2.6.164 / srv-2.6.48, C v2.6.165 / srv-2.6.49. Left from it: CSP
  (named 'later' in the review), and the unmasked frames below.
- **CI (v2.6.165):** `.github/workflows/client-gates.yml` runs every gate on PRs and pushes to main touching `client/`
  or the root release files. Watch the first runs: a timing test that is red only on the two-vCPU runner is a finding
  about its margin. `gh pr checks <n> -R dtagent2000/VTES-Elysium`; `gh run view <id> --log-failed`.
- **Group C's open ends (journal 'DET TYSTA BORDET'):** a chat line queued while reconnecting reaches whoever is at
  the table when its sender gets back (the server keeps no chat history); a counter (`tally`) written while
  reconnecting is not re-sent until the next click; the guided launchers now ask about a Cloudflare tunnel only, and a
  Caddy or nginx host without Cloudflare starts the plain command with `--trust-proxy xff` (the help says so); the frame
  buffer's shrink, a drop on the pile while reconnecting and the silent `SecurityError` have no test.
- **Group B's open ends (journal 'BORDET BEHÅLLER SINA PLATSER'):** a cached v2.6.163 tab at a mixed table writes a
  negative counter back as 0 (purge the client); an old client's `mySeat()` when the host promotes a spectator into a
  different open seat than the one bearing her name; a new name joining mid-game still gets a fresh empty seat, as before.
- **Unmasked WebSocket frames** are accepted and counted (`[ws] unmasked client frames … on N connection(s)`, at most
  one line a minute). After a while on elysium.cards: grep the server log; if it never appears, refuse them (RFC 6455
  §5.1).
- **Bot v0.6.207 (17 Oct):** consumed (the guide re-embedded); their finding-1 build (only the next chat bubble waits
  the beat) is in, our LIVE verdict tests are green beside it; the rig has not looked at the panel against the verdict
  line yet. **Bot v0.6.205–206 (17 Oct):** consumed. The play-test rig does not know their new lines yet (Haven Uncovered's two frozen lines,
  the `locks` stealth verb, the Revelations instruction -- not a wait -- and Magic of the Smith's new note), and
  `playtest/PLAYTEST.md` still says Revelations against a bot does not act on your pick.

- **v2.6.162 (16 Oct, evening):** the client half of bot v0.6.202–204 is built (`docs/handoffs/REPLY-to-bot-2026-10-16-v0.6.204.md`): the guide re-embedded, ▶ Declare verdict, our LIVE test waits for an armed clock, PROTOCOL §12, the rig v1.1.0 (the bots' two new questions, the `clock` column, the reflex waits for the clock and a combat step's own question; run against v0.6.204: every reflex after its own question, `clock` 0.0–0.3 s). Run in headless Chromium: the verdict wait at a hotseat, 45 of 45. **For the bot project (their call):** after a question everything a bot sends waits its chat beat (4.96 s at our 3.1 s): in Standard the clock decides at 3 s and the table sees the verdict at 5 s, a typed stealth is booked only once that beat has passed, and the panel shows the next wait before the verdict line; their guide's nav chip says v0.6.203 and its Controls list still names the rung "▶ Step" (our button reads ▶ Declare verdict). **Small, parked for the next client release (found by the review of v2.6.162):** `VERDICT_RE` matches `Intercept \d+`, so a bot's verdict with a negative intercept (a bare Christine Boscacci writes −1; the bots keep the raw intercept) gets no 'Block fails!' bubble. Presentation only: the line itself is right. **Next on their side:** R4 with the dodge (v0.6.205), then the 14 Oct play-test scenario re-run in our rig (`--dir` on a scratch copy) -- the report's `clock` column shows their clock fix.
- **v2.6.159–161 (16 Oct):** the client half of bot v0.6.199–201 is built (`docs/handoffs/REPLY-to-bot-2026-10-16-v0.6.201.md`). **v2.6.160:** the eye on every other seat's Structured mat (Johan's placement); run online afterwards (two humans on the real server, one with an emulated touch screen): 21 of 21, a tap and a long-press included. **v2.6.161:** a seat visit from the helicopter view stands on the Normal view, with the hand dock (it stood on the retired L1 stage, scaled while the side panel opened -- in headless Chromium 37 px under the panel and 37 px past the window at 1366×768); the side panel's settle no longer swallows a late transitionend, so a Classic visit settles at the right size too. **Decided (Johan, 16 Oct):** the '?' of your own pool (`#poolHelp`) in a seat visit stays as it is. **Still parked -- follow up when it becomes relevant:** the eye as a chip on Classic's pool globes (the globe's right-click already has the rows); new rows in the eye's menu as the bots need them; Reduce at a hotseat (while a bot acts the camera shows its board, so the Reduce row on your own minion needs ⌂ Home first; options when it matters: bring the camera home when a bot's action is aimed at you, or a Reduce entry in the quick-phrase menu). **For the bot project:** copy our canary §5; lift `AVR_CMB0` / `AVR_CMB_KEYS` / `tallyCombatMerge` if they want the combat fields in their hotseat tool.

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
