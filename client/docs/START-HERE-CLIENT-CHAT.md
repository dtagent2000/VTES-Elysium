# START HERE — a client/server session on the VTES-Elysium monorepo

*Written 12 October 2026 at the monorepo sync (PR `client-sync`). Keep the version block below current:
a release bumps it in the same commit.*

**Repository:** https://github.com/dtagent2000/VTES-Elysium — branch `main`. The repo is the truth; the Claude
project holds only `PROJECT-INSTRUCTIONS.md` and a version-free copy of this file that points here (rewritten 16 Oct 2026;
it had stood still at v2.6.142). The versions live in this file only.

## Where we stand

| What | Version | Where |
| --- | --- | --- |
| client | **v2.6.173** (THE WATCHED DOOR, ships with srv-2.6.50: the security handoff's client half -- the page's report-only CSP reports through the error telemetry as kind `csp`, no inline handler left (`clanImgError`), the help tab's script in `#helpNavJs`, the not-encrypted line (dialog + room bar), Help ▸ Local server's hosting checklist, the escrow wording corrected, the escrow crypto under known-answer tests; carries v2.6.172 TWENTY-ONE SECONDS, pure client: consumes bot v0.6.217 -- Help ▸ Bots embeds their v0.6.217 guide, which turns main's client gates green again (red since PR #48); nothing else changes; carries v2.6.171 THE LINES WE OWED, pure client: consumes bot v0.6.215–216 -- Help ▸ Bots embeds their v0.6.216 guide; PROTOCOL §12 and the canary's section 6 record every bot-emitted line owed since 20 Oct; nothing else in the client changes; carries v2.6.170 THE COPY YOU HAVE and its second pass, pure client, supersedes the never-deployed v2.6.168 and v2.6.169 in the same PR #44: the card loader after the independent review and the reviewer's check of the fixes -- From file with expansions.json alone keeps the cached copy's age and waits while the copy in use is unsaved, a failed refresh keeps the copy in use, Refresh no longer clears it first; a failed v5 download keeps the copy the browser has instead of caching KRCG's frozen v3 file over it for a week, and the hosted table's own `images/vtes.json` is used at once instead of waiting, with no time limit, for KRCG's `expansions.json`; Flight reads `FLIGHT` again; a deck's Legacy badge is decided by its cards; carries v2.6.168 THE NEW SETS ARRIVE, pure client: the card database is KRCG's v5 dump, `static.krcg.org/data/v5/vtes.json` -- the old v3 file stopped at Sabbat V5, so Julia Sowinski and the 62 other cards of Secrets of New York and Noites Brasileiras (31 Oct 2026) were missing; `expansions.json` names the sets and starters (a built-in copy for offline); the starters keep their names and the V5 group, v5 costs are read, a name two cards share goes to the card printed with it, every old spelling still resolves; Settings → From file takes expansions.json too; Help ▸ Bots embeds bot v0.6.214's guide; carries v2.6.167 THE LETTERS OF THEIR OWN, pure client: `norm()` transliterates ł ø œ æ ß đ ð þ ı the way KRCG does -- Przemysław, War Beast, Bolesław Gutowski, Clara Hjortshøj and Sacré-Cœur Cathedral, France were blank because the client asked for `przemysaw…`; carries v2.6.166 THE HAND YOU WATCH, pure client: an inspected open hand is live -- a Debug bot's hand repaints as it plays and draws, with the card that came lit and the card that went fading -- and 📌 Pin their hand keeps it on screen in a draggable strip; carries v2.6.165 THE QUIET TABLE: group C of the review, which closes it -- a board leaves only when it changed, and an open hand when it changed and on every roster (the Structured view echoed every board it received, and an open hand to four seats tripped the rate limit); the rejoin carries the server password (memory only); while reconnecting chat waits, every move that needs the server is refused out loud, the retries run every 2.5 s for the 30 s reconnect window and then back off, and a local game started meanwhile leaves the lost table; 60 saved decks, a full storage said and the game save trimmed instead of lost; carries v2.6.164 THE TABLE KEEPS ITS SEATS: group B of the review -- P only on your own turn; the hotseat bridge clears the counter at every turn change and relays boards through the server's filter; a hand-off no longer changes the phase; an oust always reaches the server; the Block counter goes below 0; Help ▸ Bots embeds bot v0.6.207's guide; carries v2.6.163 THE REVIEW'S THREE LOCKS: `escapeHtml` escapes both quotes -- a peer's name or clan ran script in another tab through an attribute; four toasts show raw text; Help ▸ Bots embeds bot v0.6.206's guide, Help ▸ Local server the new limits; carries v2.6.162 THE VERDICT WAIT: consumes bot v0.6.202–204 -- Help ▸ Bots embeds their v0.6.204 guide; the Bot Activity panel names their new rung, a bot that blocked your action and waits for your word: ▶ Declare verdict; carries v2.6.161 THE VISIT FROM ABOVE: a seat visit from the helicopter view stands on the Normal view, with the hand dock; v2.6.160 THE EYE: on every other seat's Structured mat an eye opens their open hand, ash heap and burned cards; v2.6.159 THE BRIDGE ANSWERS BOTH WAYS and earlier) | `client/elysium-vtes-bord.html`, copied to `/` |
| server | **srv-2.6.50** (THE WATCHED DOOR: passwords at rest as scrypt `s1` hashes -- one salt per server inside each hash, the old SHA-256 hashes wrapped at the first start, so a rollback needs the old data directory; the page's report-only CSP with hashes made from the bytes sent; a sandbox policy on `/images/`; `/client-error` keeps kind `csp`; srv-2.6.49 group C: `deriveIp` takes the rightmost `X-Forwarded-For` entry behind `--trust-proxy`, and `--trust-proxy xff` ignores `CF-Connecting-IP` for a proxy that is not Cloudflare; the frame reader keeps one growable buffer per connection instead of `Buffer.concat` per chunk; srv-2.6.48 group B: a mid-game `leave` vacates the seat; `bounty.award` -- false settles by hand, VP still paid under `tournLock`; a second bounty pays nothing and an un-oust takes the VP back; `tally` block range −99..99; saves keep open seats and the board style; srv-2.6.47 the review's three locks: names without `"`, card fields without `=`, clans/paths without quotes, every card id `cleanId`; RFC 6455 frame limits with pings and pongs in the rate bucket -- unmasked frames still accepted, logged; `hello{admin}` behind the admin routes' lockout; srv-2.6.46: the room option `tableLayout`; srv-2.6.45: the pub keeps `tn`/`rn`; srv-2.6.44: the room option `tableSetup`) | `client/elysium-server.js`, copied to `/` |
| bot (consumed) | **v0.6.217** beside the suite (3 Nov 2026; consumed 6 Nov at v2.6.172: the guide re-embedded; their §2 -- §12 and the canary for Change of Target, the abstain lines, the burn action and the widened rush line -- still owed: `docs/handoffs/REPLY-to-bot-2026-11-06-v0.6.217.md`. Before: v0.6.216 (2 Nov 2026, with v0.6.215 of the same day; consumed 3 Nov at v2.6.171: the guide re-embedded, §12 and the canary paid up, their four questions answered, the data repo's v5 pair in `VTES-Elysium-data` PR #1: `docs/handoffs/REPLY-to-bot-2026-11-03-v0.6.216.md`) | the 8-file bundle at `/` and in `bot/` — never edited here |
| protocol | `ELYSIUM-PROTOCOL.md` header v2.6.173 / srv-2.6.50 (no new verb or field; v2.6.173: §4.6 passwords at rest, §6.2 the `csp` kind, §6.4 the page policy and the image sandbox; v2.6.172: §12 unchanged -- bot v0.6.217's new lines are not recorded yet; v2.6.171: §12 -- the bots' 'nothing' lines get the fourth, a new block of bot-emitted lines the bots read from each other (block bar, referendum terms and result, leaving torpor, Haven Uncovered, Spying Mission, no strike this round, Archon Investigation, a location's intercept lock, the actor's stealth lines) and their table lines with no reader; v2.6.169–170: client-only; v2.6.168: a card the client names from its own data is written the way KRCG's v5 dump prints it; §2 the reconnect -- back-off, `srvPass` on the rejoin, chat queued, moves refused; §3 `join` takes `srvPass`; §6.1 which forwarding header `--trust-proxy` reads, and `--trust-proxy xff`; §7 `board` and `openHand` sent only on a change; v2.6.164: §7 `bounty.award`, the `leave` that vacates, un-ousts that return the VP, `tally`'s block range, saves; §8 `bounty` not sent on `award:false`; §12 a negative number in the verdict line; §12.2 the bridge's tally clear and board filter; v2.6.163: §1 frame limits, §2 the rate bucket counts pings, §4.2 the cleaning and a client MUST escape quotes in attributes, §4.3 the admin lockout; §12: the bots' three 'does nothing' combat lines, their combat-ends shape, who sends the Block verdict line -- now also a blocking bot; §12.0: the bots' log-tier moves and their two questions, not frozen; §12.2: the bridge's relays, v2.6.159) | `client/ELYSIUM-PROTOCOL.md` |
| last gates | client **362/0** (no skips, bot v0.6.217 beside; v2.6.172 against the new suite 355/7) · dispatch **94/0** (srv-2.6.49 88/6) · endpoint **36/0** (srv-2.6.49 31/5) · protocol 6/0 · canary 102/0 · soak `--control` · served-check **7/0** · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root and `SHA256SUMS` · headless Chrome: v2.6.173 15/15, v2.6.172 7/12, and the enforcing preview (v2.6.173 works, v2.6.172 loses the help tab's script) · v2.6.172's run: client **354/0** (no skips, bot v0.6.217 beside; v2.6.171 beside the same bundle 353/1, the embedded guide) · canary **102/0** (v1.1.0, beside bot v0.6.217; v2.6.171's run: against v2.6.170's protocol 90/12, beside bot v0.6.214 98/4) · dispatch 88/0 · protocol 6/0 · endpoint 24/0 · soak `--control` exit 0 (the trip-wire fired) · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root gate · headless Chrome: Help ▸ Bots shows v0.6.217 through the real menu, the ↗ page too, no page errors (v2.6.171: v0.6.216); v2.6.171's run: the watched-duel panel from injected bot tallies (the bot project's two questions) · v2.6.170's runs: headless Chrome 33/33 (the KRCG v5 load, the cache, the stopgap, the stale-copy case, the names-alone pick, Refresh, From file; v2.6.169: 32/33) and the hosted path 19/19 (the server's `images/vtes.json`, `expansions.json` held or never answered, the names-alone pick waiting; v2.6.169: 18/19) · `krcg-audit.js` v3 → v5: 0 names lost or moved | run from `client/` |

**Deploy v2.6.173 + srv-2.6.50 (THE WATCHED DOOR, 11 Nov):** back up `/opt/elysium/data` first (runbook §2: the stored password hashes become scrypt and an older server cannot read them), copy the server and restart, purge the client, copy `elysium-error-digest.js` (v1.5); one client purge covers v2.6.172 too. Optional: the repository secret `SERVED_CHECK_WEBHOOK` (runbook §7, §10).

**Live on elysium.cards:** server srv-2.6.45 + bot v0.6.198 since 13 Oct 16:47 (PR #7). Client v2.6.150/151 (PRs #9, #10) were merged that evening. Client v2.6.157 + server srv-2.6.46 were merged with PR #12 on 14 Oct (a client purge AND a server restart together). Client v2.6.158 (PR #13, with the play-test handoff) needs a client purge only. Bot v0.6.199–201 were merged on 15–16 Oct (PRs #14–16). Client v2.6.159 (PR #17) needs a client purge and a purge of `/elysium-bot.js`; the server is unchanged. Client v2.6.160 (PR #18, merged 16 Oct) needs a client purge only. Client v2.6.161 (PR #20) needs a client purge only; it carries v2.6.160, so one purge covers both. Bot v0.6.202–204 were merged on 16 Oct (PRs #19, #21, #22): purge `/elysium-bot.js` and `/elysium-cardfx.json` (cardfx changed in v0.6.202). Client v2.6.162 (PR #23) needs a client purge only; it carries v2.6.160–161. Bot v0.6.205–206 were merged on 16–17 Oct (PRs #25, #26): purge `/elysium-bot.js`, `/elysium-cardfx.json` and `/elysium-cardfx.js` (cardfx changed in v0.6.205). Client v2.6.163 + srv-2.6.47 (the security release, PR #27, merged 17 Oct) need a client purge AND a server restart. Client v2.6.164 + srv-2.6.48 (group B, with bot v0.6.207: purge `/elysium-bot.js`) need the same: a client purge AND a server restart; one deploy covers both releases. Client v2.6.165 + srv-2.6.49 (group C, PR #30, merged 17 Oct, with `.github/workflows/client-gates.yml`) need a client purge AND a server restart; no bot file changed. If #27 and #29 are not deployed yet, the same deploy covers them (then purge `/elysium-bot.js` too, for bot v0.6.207 from PR #28). The box keeps plain `--trust-proxy` (it sits behind a Cloudflare tunnel), not `xff`. Client v2.6.166 (the live open hand, PR #32) is a pure client release: a client purge only, and one purge covers it with v2.6.165. Client v2.6.167 (the letters `norm()` transliterates) is a pure client release: a client purge only; it carries v2.6.166. Client v2.6.168 (the KRCG v5 dump) is a pure client release too: a client purge, AND, if `/opt/elysium/images/vtes.json` exists on the box, the v5 dump in its place and a purge of that URL (`docs/elysium-ops-runbook.md` §6) -- the hosted table reads that file before KRCG and keeps the old card list until it is replaced. Client v2.6.171 (bot v0.6.215–216 consumed) is a pure client release: a client purge, and with bot v0.6.215–216 (PRs #45, #46) a purge of `/elysium-bot.js` and `/elysium-cardfx.json`; one client purge covers v2.6.170 too. Client v2.6.172 (bot v0.6.217 consumed) is a pure client release: a client purge, and with bot v0.6.217 (PR #47) a purge of `/elysium-bot.js` and `/elysium-cardfx.json`; one client purge covers v2.6.171 too.

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
node test-client-logic.js          # 354 passed, 0 failed (with the bundle beside)
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

## Open right now (11 Nov 2026)

- **The security plan, `docs/elysium-security-plan.md`** -- the handoff's four 'now' items shipped in v2.6.173 / srv-2.6.50;
  the rest has an order and a 'done when', item by item on Johan's 'kör'. Next: **enforce the CSP** once the digest's
  `CSP report-only` line has been quiet for a week of real traffic (the header becomes enforcing, and the page gets a
  `<meta>` with the same hashes for the `file://` client -- a tool writes them, check-versions guards them; Firefox and
  Safari need one look first). **For Johan:** read the box's log for unmasked frames (`sudo journalctl -u elysium --since
  2026-10-17 | grep unmasked`, plan item 5); Google Fonts (item 10); who reviews the code from outside (item 3).
- **The watchdog** (`.github/workflows/served-check.yml`) has not run against the real site yet: after the merge, run it
  once by hand (Actions ▸ served check ▸ Run workflow). 'COULD NOT CHECK' = Cloudflare challenged GitHub's runner (then it
  needs another home); a 'MISMATCH' on that first run most likely means a file on the box was never committed to `main`
  (a delivery from before the monorepo, or a hand edit) -- look at which file before thinking of a takeover.
- **For the bot project** (the reply): their console names hand cards at an online table (plan item 6); confirm their Node
  client masks its frames before item 5; a `bot/SHA256SUMS` if they want release hashes for the bundle; the arena's
  password joins cost ~40 ms once srv-2.6.50 is their copy.
- **Still owed from 6 Nov:** PROTOCOL §12 and the canary for bot v0.6.217's new lines (below).

## Open before 11 Nov (6 Nov 2026)

- **v2.6.172 (6 Nov) -- bot v0.6.217 consumed; main's client gates green again (red since #48).** Deploy: purge the client; if bot v0.6.217 (PR #47) is not live yet, purge `/elysium-bot.js` and `/elysium-cardfx.json` too. **Owed to the bot project (their v0.6.217 handoff §2):** PROTOCOL §12 and the canary for Change of Target, the polling-step abstain (both shapes), the action that burns a card in play and the widened rush line; the shapes are in `elysium-project-context.md` (6 Nov). Not in v2.6.172: Johan asked for the guide and a patch release. **CI:** when a bot release merges while a client PR is open, update ours from `main` before it is merged (SKILLS 'The gates in CI' §5). **Their guide** (their text; in the reply): the body says 144 curated beside the footer's 156, and the chip names client v2.6.170.
- **v2.6.171 (3 Nov) -- bot v0.6.215–216 consumed.** Deploy: purge the client; if bot v0.6.215–216 (PRs #45, #46) are not live yet, purge `/elysium-bot.js` and `/elysium-cardfx.json` too (the server never serves the `.js` twin). **For Johan:** merge `VTES-Elysium-data` PR #1 (KRCG's v5 dump of 3 Nov and `expansions.json`; the copy there was the 14 Oct dump with no `expansions.json`). **Not run:** elysium.cards; the panel answers came from injected bot tallies, not a live duel between two bots. **Theirs to decide** (the reply's §4): write `x<side>` and clear the labels at a new pair so a watched duel shows '+1 strike' and no stale label; whether `NET_LOCK_IC` stays pinned and `NET_STEALTH` unpinned.
- **v2.6.170 (2 Nov) -- the loader after the review and its second pass; deploy this one, not v2.6.168 or v2.6.169 (same PR #44).** Nothing extra to deploy: purge the client; the box's `images/vtes.json` step below stands. Not run: the client against static.krcg.org over the network in a browser (the browser runs serve KRCG's real files by route), and elysium.cards itself.
  Known and rare (the reviewer's third look): after a failed IndexedDB save (quota) the names-alone toast's "in a moment" cannot come true -- picking the files together still works; a second tab that saved a different copy gets the same toast and this tab keeps its own copy; a failed Refresh or a names-alone pick loads the database even when it is switched off (as before).
- **v2.6.168 (1 Nov, evening) -- the KRCG v5 dump.** After the deploy: on elysium.cards, Deck Lab → the catalog finds
  Julia Sowinski, and the starter list shows 'Fifth Edition :: Toreador' under V5 Starters. If it does not, the box's
  `images/vtes.json` is the old file (runbook §6; the docs disagree on whether the box has one: `client/CLAUDE.md`
  27 July says D5 ran, runbook §8 says the folder is empty). **Not run:** the client in a real browser against
  static.krcg.org (this sandbox reached KRCG only through Node; the suite and the audit ran the real code on KRCG's real
  files). The sandbox may now fetch static.krcg.org and api.krcg.org (Johan's setting, 1 Nov).
- **Closed 3 Nov:** the bot project's tools read KRCG's v5 dump since v0.6.216, and every client name resolves in cardfx
  (their v0.6.215–216; the 1 Nov reply's §5 is answered).
- **Owed to the bot project:** v0.6.217's §12 and canary lines (the v2.6.172 entry above); v2.6.171 paid everything owed before it. Still ours from October: the play-test
  rig does not know their v0.6.205–206 lines (see 'Open before 1 Nov').
- **Small, from the audit:** `DISC_NAMES` has no `str` (Striga), `mal` (Maleficia) or `viz`, so a library card
  needing them offers no superior marker (the same under v3; Flight reads `FLIGHT` again since v2.6.169); KRCG's v5 gives 15 library cards (19 name keys)
  no capacity where v3 had one (Abomination 4 -- it is in their text), so their preview line drops '· cap N'.

## Open before 1 Nov (17 Oct 2026)

- **v2.6.166 (18 Oct, morning):** the live open hand and the pinned strip, Johan's ask for following a Debug bot. Open: a hotseat HUMAN's open hand repaints at the hand-off (her board is stored then), not on each play; `net.openHandFrom` keeps a departed seat's grant (pre-existing); touch drag unproven; the bot project's guide does not mention the pin (asked in `docs/handoffs/REPLY-to-bot-2026-10-18-open-hand.md`).
- **Next, after PR #30 (17 Oct, evening):**
  - **After the deploy, a five-minute smoke test on elysium.cards** (no session has run anything there): two devices at
    one Structured table, idle for a minute (nothing changes); airplane mode for ~10 s on one, with a chat line typed
    meanwhile (it finds its seat by itself and the line arrives); Draw while offline (the toast says "Reconnecting —
    draw once the connection is back."). After a few days: grep the server log for `unmasked client frames`.
  - **Proposed next client round** (not started; wait for Johan's 'kör'): the play-test rig catches up with bot
    v0.6.205–206 (Haven Uncovered's two frozen lines, `locks` as a stealth verb, the Revelations instruction, Magic of the
    Smith's note; `playtest/PLAYTEST.md` still says Revelations against a bot does not act on the pick) -- promised in two
    replies to the bot project -- plus the three tests group C left (a drop on the pile while reconnecting, the silent
    `SecurityError`, the frame buffer's shrink).
  - **Waiting for Johan:** chat history for a player who reconnects (the server would keep the last lines and replay them
    on the rejoin -- new behaviour); CSP; the older calls below (Resume for anyone during a hold, the open hand by default,
    'Randomise seats' in the lobby); a Host Guide refresh.
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
