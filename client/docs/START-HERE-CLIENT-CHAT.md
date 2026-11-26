# START HERE — a client/server session on the VTES-Elysium monorepo

*Written 12 October 2026 at the monorepo sync (PR `client-sync`). Keep the version block below current:
a release bumps it in the same commit.*

**Repository:** https://github.com/dtagent2000/VTES-Elysium — branch `main`. The repo is the truth; the Claude
project holds only `PROJECT-INSTRUCTIONS.md` and a version-free copy of this file that points here (rewritten 16 Oct 2026;
it had stood still at v2.6.142). The versions live in this file only.

## Where we stand

| What | Version | Where |
| --- | --- | --- |
| client | **v2.6.189** (THE HANDOFFS ANSWERED, pure client: consumes bot v0.6.237–241 -- Help ▸ Bots embeds v0.6.241's guide; bot v0.6.237's rung `resolve-late` (the bot waits for a human actor's word on the bleed total) reads Close modifiers, the ring lights It resolves and No for it and the play button's title names it; PROTOCOL §12 and canary v1.7.0 record the bots' lines owed since 20 Nov, and the canary skips its card-library checks loudly without `elysium-cardfx.json`. v2.6.188 (THE RING AT THE POINTER, pure client, PR #104: at a table with bots, holding the right mouse button on the table for 450 ms opens the bot ring at the pointer -- released on a segment it picks it, elsewhere the ring stays for a click; its centre is the gear, which opens the bot box beside the ring; a short right-click keeps its menus, which on macOS and Linux now open at the release; Settings ▸ 'Bot ring at the pointer (tables with bots)' -- Hold the right mouse button / Off; the key list's 'Bot ring at the pointer', unbound, opens it where the mouse last was; the bot box can hide the hub, which comes out by itself while the table waits on this screen (never on touch, nor with the hold off and no key bound); the tutorial plays on the full panel whatever the player chose, the choice untouched. v2.6.187 (THE BOT RING, pure client, PR #102: the blue bot panel became the bot hub -- the robot in a circle each player drags where it suits their screen; hover (a tap on touch) opens a ring of quick answers: Hold on / Release, Yes, No, Block and reaction (Block! and who blocks, Any blocks?, No block, No reaction, Any reaction?), the blood drop (Bleed, +Bleed, Reduce, each 1/2/3/X, and Bounce), Pass, It resolves; open, the robot is a gear that opens the bot box (the rows, Run bot turns, the settings); Bounce writes `NAME bounces the bleed to WHO.` and the bleed re-announced at WHO's pool, then Pass (PROTOCOL §12, canary v1.6.0). v2.6.186 (THE TOUR CATCHES UP, pure client, PR #101: the tutorial driven chapter by chapter in a real browser and brought up to date -- the Overview key (V or the player's own binding, never §), the Edge button in the dock, the duel view's words, the room list and the password a save needs, All helpers on in the Structured chapters, Suggested table setup off for the tutorial's own table (put back after), the step counter, the seats by name, the bubbles clear of the stack and the tray, End tutorial clear of ⌂ Home; outside the tutorial the offline dialog and the hotseat line point at the Table panel. v2.6.185 (THE SEARCH IS TOLD, with srv-2.6.53, PR #100: on such a server the client writes no line of its own for a search, a fetch from it or a park from the top -- the server tells the table; the search dialog says the list is by name. v2.6.184 (THE SAVES HOLD, never deployed, same PR: saving under a name the room already has asks 'Overwrite?'; an empty name is the room and the local date and time; a room without a password says it cannot save; the Saved matches texts and Help > Local server follow the server -- name and password find a save, hands come back, the server is trusted like a dealer, the piles are on its disk too. v2.6.183 (THE NAME STACKS UP, pure client, on top of v2.6.181 and v2.6.182 in PR #98: a long name over a globe on the board wraps in a 92 px window that grows upward -- two lines, then an ellipsis, the full name as the globe's tooltip. v2.6.182 (THE EDGE IN THE PANEL, never deployed): on the Classic board the Edge button sits in the bottom panel's pool zone at its top right, as L2 has it in the pool zone on the mat; the globes on the board carry the Edge icon as a mark for every seat, yours included; the globe keeps the circle's width, the name centred over it. v2.6.181 (THE CENTRE IS A PLAYER'S, never deployed): nothing sits in the felt's centre -- Round + clock stand in the Table panel's top row, the Edge token starts above your globe (below it at the top edge); the middle button pans from anywhere in L3 and L4; the TABLE tab opens on its first click. Before: v2.6.180 (THE CAMERA PANS, pure client: the hand counter in the dock repaints the moment the max hand size changes -- the wheel and the menu moved the max in silence (Johan's 8/4); a seat move pans the table area (View Transitions) -- the bot sweep (to each bot, between, home), your own moves (arrows, Tab, a seat, Home / Esc) and the two-human hand-off, the next seat from the right, a step back from the left, none under reduced motion, with a dialog, menu or drag open, in the tutorial or at a Classic table; a pass never takes you out of the helicopter view (zoom kept, the acting bot's mat glows); Help ▸ Bots embeds bot v0.6.236's guide; carries v2.6.179 THE BADGE STANDS UP, pure client: in a seat visit the bot badge and its ▶ stand above the visited seat, under ⌂ Home -- they lay under it; supersedes the never-deployed v2.6.178 in the same PR #88 and carries it, TURN-BASED FROM THE START: a table with bots starts Turn-based -- the client's seed, at a hotseat and from the host online; 3 s kept for a switch; a room that has a tempo keeps it; carries v2.6.177 THE ANSWER AFTER THE LINE, pure client: the hotseat bridge delivers after the sender's code has returned, as the server does -- `hotBridge.toBot` queues, a drain delivers a microtask later, one hop at a time (bot v0.6.227's question; on the bot project's sim at pace 0 the synchronous bridge let 384 windows run out their clock, the queue none, every one of their gates green); a card dragged from the hand to the table writes the menu's play line, its level and its ` Target: …` suffix included, and a level is chosen for one play; carries v2.6.176 THE CARD THE BOTS SEE, pure client: consumes bot v0.6.230–234 -- Help ▸ Bots embeds their v0.6.234 guide; at a hotseat the bridge relays a human's card clone to the bot seats in the server's shape (`hotBridge.fxIn`), so the bots see what a human plays offline as they do online -- bot v0.6.232's Sudden Reversal and Meditative Grove against a human's card could not fire there; a card aimed at another seat's vampire names it as a crypt card in the clone (it said `lib` for every remote card, so 'aimed at my minion' never fired online either); carries v2.6.175 THE AIM LETS GO, ships with srv-2.6.51: consumes bot v0.6.219–229 -- Help ▸ Bots embeds their v0.6.229 guide and Toreador carries the label the other V5 starters have (the registry test reads their registry); every aim is per-action (a target that rode a line clears when that action resolves, as a pool aim has since v2.6.23) and a bleed line carries a pool aim only -- a card in a bleed's suffix made every bot read it as aimed at nobody; when every other seat is ousted the winner's pass is refused with a reason, online and at a hotseat; carries v2.6.174 THE DEFAULT MOVED, pure client: a copy of KRCG's data is judged by its shape, not by the address it came from -- since 8 Nov KRCG's default `data/vtes.json` IS the v5 dump, and v2.6.173 called a copy that came by it 'KRCG's older v3 file' and fetched it again; Help ▸ Bots embeds bot v0.6.218's guide; carries v2.6.173 THE WATCHED DOOR, ships with srv-2.6.50: the security handoff's client half -- the page's report-only CSP reports through the error telemetry as kind `csp`, no inline handler left (`clanImgError`), the help tab's script in `#helpNavJs`, the not-encrypted line (dialog + room bar), Help ▸ Local server's hosting checklist, the escrow wording corrected, the escrow crypto under known-answer tests; carries v2.6.172 TWENTY-ONE SECONDS, pure client: consumes bot v0.6.217 -- Help ▸ Bots embeds their v0.6.217 guide, which turns main's client gates green again (red since PR #48); nothing else changes; carries v2.6.171 THE LINES WE OWED, pure client: consumes bot v0.6.215–216 -- Help ▸ Bots embeds their v0.6.216 guide; PROTOCOL §12 and the canary's section 6 record every bot-emitted line owed since 20 Oct; nothing else in the client changes; carries v2.6.170 THE COPY YOU HAVE and its second pass, pure client, supersedes the never-deployed v2.6.168 and v2.6.169 in the same PR #44: the card loader after the independent review and the reviewer's check of the fixes -- From file with expansions.json alone keeps the cached copy's age and waits while the copy in use is unsaved, a failed refresh keeps the copy in use, Refresh no longer clears it first; a failed v5 download keeps the copy the browser has instead of caching KRCG's frozen v3 file over it for a week, and the hosted table's own `images/vtes.json` is used at once instead of waiting, with no time limit, for KRCG's `expansions.json`; Flight reads `FLIGHT` again; a deck's Legacy badge is decided by its cards; carries v2.6.168 THE NEW SETS ARRIVE, pure client: the card database is KRCG's v5 dump, `static.krcg.org/data/v5/vtes.json` -- the old v3 file stopped at Sabbat V5, so Julia Sowinski and the 62 other cards of Secrets of New York and Noites Brasileiras (31 Oct 2026) were missing; `expansions.json` names the sets and starters (a built-in copy for offline); the starters keep their names and the V5 group, v5 costs are read, a name two cards share goes to the card printed with it, every old spelling still resolves; Settings → From file takes expansions.json too; Help ▸ Bots embeds bot v0.6.214's guide; carries v2.6.167 THE LETTERS OF THEIR OWN, pure client: `norm()` transliterates ł ø œ æ ß đ ð þ ı the way KRCG does -- Przemysław, War Beast, Bolesław Gutowski, Clara Hjortshøj and Sacré-Cœur Cathedral, France were blank because the client asked for `przemysaw…`; carries v2.6.166 THE HAND YOU WATCH, pure client: an inspected open hand is live -- a Debug bot's hand repaints as it plays and draws, with the card that came lit and the card that went fading -- and 📌 Pin their hand keeps it on screen in a draggable strip; carries v2.6.165 THE QUIET TABLE: group C of the review, which closes it -- a board leaves only when it changed, and an open hand when it changed and on every roster (the Structured view echoed every board it received, and an open hand to four seats tripped the rate limit); the rejoin carries the server password (memory only); while reconnecting chat waits, every move that needs the server is refused out loud, the retries run every 2.5 s for the 30 s reconnect window and then back off, and a local game started meanwhile leaves the lost table; 60 saved decks, a full storage said and the game save trimmed instead of lost; carries v2.6.164 THE TABLE KEEPS ITS SEATS: group B of the review -- P only on your own turn; the hotseat bridge clears the counter at every turn change and relays boards through the server's filter; a hand-off no longer changes the phase; an oust always reaches the server; the Block counter goes below 0; Help ▸ Bots embeds bot v0.6.207's guide; carries v2.6.163 THE REVIEW'S THREE LOCKS: `escapeHtml` escapes both quotes -- a peer's name or clan ran script in another tab through an attribute; four toasts show raw text; Help ▸ Bots embeds bot v0.6.206's guide, Help ▸ Local server the new limits; carries v2.6.162 THE VERDICT WAIT: consumes bot v0.6.202–204 -- Help ▸ Bots embeds their v0.6.204 guide; the Bot Activity panel names their new rung, a bot that blocked your action and waits for your word: ▶ Declare verdict; carries v2.6.161 THE VISIT FROM ABOVE: a seat visit from the helicopter view stands on the Normal view, with the hand dock; v2.6.160 THE EYE: on every other seat's Structured mat an eye opens their open hand, ash heap and burned cards; v2.6.159 THE BRIDGE ANSWERS BOTH WAYS and earlier) | `client/elysium-vtes-bord.html`, copied to `/` |
| server | **srv-2.6.53** (THE SEARCH IS TOLD: a search lists the pile sorted by name, never in its order; the server tells the table about a search, a fetch (by name, the copy nearest the top) and a park from the top. srv-2.6.52 (THE SAVES HOLD, never deployed, same PR: the snapshot is written 250 ms after a pile, seat, turn, score or roster change and 2 s after a board or hand escrow -- kill -9 no longer gives a drawn card twice or loses a young room -- and keeps each seat's own board; a named save belongs to the room's name and password, a room without one cannot save, an existing save is replaced only with `overwrite`. srv-2.6.51 (THE AIM LETS GO: when every other seat is ousted a `pass` is ignored -- the game is over and the turn stays; a vacant seat beside the passer or a table of one still gets the turn back; srv-2.6.50 THE WATCHED DOOR: passwords at rest as scrypt `s1` hashes -- one salt per server inside each hash, the old SHA-256 hashes wrapped at the first start, so a rollback needs the old data directory; the page's report-only CSP with hashes made from the bytes sent; a sandbox policy on `/images/`; `/client-error` keeps kind `csp`; srv-2.6.49 group C: `deriveIp` takes the rightmost `X-Forwarded-For` entry behind `--trust-proxy`, and `--trust-proxy xff` ignores `CF-Connecting-IP` for a proxy that is not Cloudflare; the frame reader keeps one growable buffer per connection instead of `Buffer.concat` per chunk; srv-2.6.48 group B: a mid-game `leave` vacates the seat; `bounty.award` -- false settles by hand, VP still paid under `tournLock`; a second bounty pays nothing and an un-oust takes the VP back; `tally` block range −99..99; saves keep open seats and the board style; srv-2.6.47 the review's three locks: names without `"`, card fields without `=`, clans/paths without quotes, every card id `cleanId`; RFC 6455 frame limits with pings and pongs in the rate bucket -- unmasked frames still accepted, logged; `hello{admin}` behind the admin routes' lockout; srv-2.6.46: the room option `tableLayout`; srv-2.6.45: the pub keeps `tn`/`rn`; srv-2.6.44: the room option `tableSetup`) | `client/elysium-server.js`, copied to `/` |
| bot (consumed) | **v0.6.241** beside the suite (25 Nov 2026, the exactness round; consumed at v2.6.189 with the eight open handoffs of 19–25 Nov -- the guide, the `resolve-late` label, §12 and canary v1.7.0 for v0.6.236's and v0.6.241's lines, the canary's loud skip, the licence pointed at its 23 Nov answer: `docs/handoffs/REPLY-to-bot-2026-11-26-v0.6.241.md`; their public-repository handoff of 26 Nov is read and waits for its own round. Before: v0.6.236 (20 Nov 2026, the Banu Haqim pilot's lines; its guide embedded at v2.6.180, which turned main's client gates green again (red since v0.6.235's merge); the handoffs of v0.6.235, the guide for v2.6.179, v0.6.236, the licence and their 19 Nov reply are read and wait for a round of their own: `docs/handoffs/REPLY-to-bot-2026-11-23-camera.md` §4. Before: v0.6.234 (18 Nov 2026, V5 wave 6b; consumed at v2.6.176 with the five handoffs of v0.6.230–234 (17–18 Nov): the guide, §12 and canary v1.4.0 for their twenty lines, the canary's card-suffix control removed (v0.6.230's ask), their question on the play clone answered and built (v0.6.232): `docs/handoffs/REPLY-to-bot-2026-11-19-v0.6.234.md`. Before: v0.6.229 (15 Nov 2026, the bench round; consumed at v2.6.175 with the ten handoffs of v0.6.219–228 (12–14 Nov): the guide and the registry test, §12 and canary v1.3.0 for their lines, the per-action aim and the pool-only bleed suffix (v0.6.225's ask), the game-over pass (v0.6.221's ask), their bridge question answered: `docs/handoffs/REPLY-to-bot-2026-11-15-v0.6.229.md`. Before: v0.6.218 (11 Nov 2026, round C2, no behaviour change; consumed at v2.6.174 with v0.6.217's §2 -- §12 and canary v1.2.0 for Change of Target, the abstain lines, the burn action and the widened rush line -- and their 10 Nov KRCG handoff: `docs/handoffs/REPLY-to-bot-2026-11-11-v0.6.218.md`. Before: v0.6.217 (3 Nov 2026; consumed 6 Nov at v2.6.172: the guide re-embedded: `docs/handoffs/REPLY-to-bot-2026-11-06-v0.6.217.md`). Before: v0.6.216 (2 Nov 2026, with v0.6.215 of the same day; consumed 3 Nov at v2.6.171: the guide re-embedded, §12 and the canary paid up, their four questions answered, the data repo's v5 pair in `VTES-Elysium-data` PR #1: `docs/handoffs/REPLY-to-bot-2026-11-03-v0.6.216.md`) | the 8-file bundle at `/` and in `bot/` — never edited here |
| protocol | `ELYSIUM-PROTOCOL.md` header v2.6.189 / srv-2.6.53 (v2.6.189: §12 bot v0.6.236–241's lines, the Haven and stealth entries, the acting bot's re-announce; §8 `fx` and `given` -- no verb or field; v2.6.188: the header only; v2.6.187: §12 the client's bounce pair and the ring's Reduce in the bled Methuselah's name -- no verb or field; v2.6.186: the header only; srv-2.6.53: §7 `browse` / `pileTake` / `reveal` and s2c `sys` / `revealed` / `pileList` -- the sorted list, the server's lines, `pileTake` reads no `i`; srv-2.6.52: §5 the reference server's persistence; §7 `saveMatch` `overwrite`, the save group, `err` `code` / `name` / `savedAt`, `saveList` `needPass` -- no new verb; v2.6.183: no new verb or field; v2.6.183, v2.6.182 and v2.6.181: the header only; v2.6.180: the header only; v2.6.179: the header only; v2.6.178: §8 `botcfg` -- the reference client seeds Turn-based; v2.6.177: §12 the card-play line and that a drag writes it; §12.2 the queued bridge and its measurement; v2.6.176: §7 and §8 `fx` -- the shapes, every path that sends a play clone, who reads it; §12 a block for bot v0.6.230–234's twenty lines, the no-reader and chat lists, and a card target on a bleed line may be read as no target; §12.2 the bridge relays a human's clone; v2.6.175: §7 `pass` is ignored when every other seat is ousted; §12 the aim rule and the bleed's one suffix, a human's Toreador Grand Ball as the bots read it and their question, Smiling Jack's burn, Perfect Paragon, Eyes of the Wild, the crypt dodge, the fizzle and Phaibun lines; §12.2 the hotseat game over and the bridge's synchronous delivery; v2.6.174: v2.6.174: §12 records bot v0.6.217's lines -- Change of Target, the polling-step abstain, the burn action, the rush's new granting cards, the reused shapes, the wave's table and chat lines; v2.6.173: §4.6 passwords at rest, §6.2 the `csp` kind, §6.4 the page policy and the image sandbox; v2.6.172: §12 unchanged -- bot v0.6.217's new lines are not recorded yet; v2.6.171: §12 -- the bots' 'nothing' lines get the fourth, a new block of bot-emitted lines the bots read from each other (block bar, referendum terms and result, leaving torpor, Haven Uncovered, Spying Mission, no strike this round, Archon Investigation, a location's intercept lock, the actor's stealth lines) and their table lines with no reader; v2.6.169–170: client-only; v2.6.168: a card the client names from its own data is written the way KRCG's v5 dump prints it; §2 the reconnect -- back-off, `srvPass` on the rejoin, chat queued, moves refused; §3 `join` takes `srvPass`; §6.1 which forwarding header `--trust-proxy` reads, and `--trust-proxy xff`; §7 `board` and `openHand` sent only on a change; v2.6.164: §7 `bounty.award`, the `leave` that vacates, un-ousts that return the VP, `tally`'s block range, saves; §8 `bounty` not sent on `award:false`; §12 a negative number in the verdict line; §12.2 the bridge's tally clear and board filter; v2.6.163: §1 frame limits, §2 the rate bucket counts pings, §4.2 the cleaning and a client MUST escape quotes in attributes, §4.3 the admin lockout; §12: the bots' three 'does nothing' combat lines, their combat-ends shape, who sends the Block verdict line -- now also a blocking bot; §12.0: the bots' log-tier moves and their two questions, not frozen; §12.2: the bridge's relays, v2.6.159) | `client/ELYSIUM-PROTOCOL.md` |
| last gates | client **433/0** (v2.6.189: bot v0.6.241 beside, no skips; v2.6.188 against the new suite 430/3; seven mutants caught; canary 283/0 (without cardfx 276/0 + 7 SKIPPED, against v2.6.188's protocol 268/15, beside bot v0.6.236 279/4), dispatch 103/0, protocol 6/0, endpoint 40/0, soak `--control` fired and the battery (7 tables, 111 turns, 0 stuck), the bot project's hotseat gate in a scratch copy 12/0, both embed checks, B1 byte-identical; no browser. v2.6.188: 431/0, bot v0.6.236 beside; v2.6.187 against the new suite 423/8; fifty-seven mutants caught (twelve for the hold, nineteen for the hidden hub and the tutorial's full panel); dispatch 103/0, protocol 6/0, canary 247/0, endpoint 40/0, soak `--control` fired and the battery (7 tables, 109 turns, 0 stuck), the bot project's hotseat gate in a scratch copy 12/0, both embed checks, B1 byte-identical; Chromium (Linux, the press order): the hold, a short right-click on the felt and on a card, a hold on a card, the gear at the pointer, Off, the key, a table without bots; the hidden hub (out for a question and for Turn-based's ▶, back without a way in or on touch); the tutorial's full panel for a player who chose the discreet panel (v2.6.187: the pockets throughout). v2.6.187: 423/0, bot v0.6.236 beside; v2.6.186 against the new suite 401/22; twenty-six mutants caught; dispatch 103/0, protocol 6/0, canary 247/0, endpoint 40/0, served-check 7/0, soak `--control` fired and the battery (7 tables, 86 turns, 0 stuck), the bot project's hotseat gate in a scratch copy 12/0; Chromium: mouse, all four corners, a bleed arriving while open, bounce, a seat visit, the box, the keyboard, emulated touch; a real bot's bleed bounced to the other real bot went through on it. v2.6.186: bot v0.6.236 beside; v2.6.185 against the new suite 401/9; eighteen mutants caught; dispatch 103/0, protocol 6/0, canary 235/0, endpoint 40/0; Chromium: every chapter on the new client, the first-time chain included. v2.6.185: v2.6.184 against the new suite 400/1; dispatch 103/0 (srv-2.6.52 100/3); six server and four client mutants, all caught; Chromium 9/9 against 2/9 on the old pair, and both mixed pairs run. v2.6.184: bot v0.6.236 beside, no skips; v2.6.183 against the new suite 396/4 -- the three new tests and the embed drift; dispatch 100/0 (srv-2.6.51 94/6); the endpoint's live kill -9 section 40/0 (srv-2.6.51 36/4); fourteen server and six client mutants, all caught; Chromium 13/13 against 5/12 on the old pair. v2.6.183: bot v0.6.236 beside, no skips; v2.6.182 against the new suite 396/1 -- the new test; thirteen new mutants and v2.6.181/182's twenty-two, all caught; Chromium 25/25 for the names plus v2.6.182's 43/43. v2.6.182: 396/0; v2.6.181 against the new suite 393/3 -- the two new tests and the v2.6.151 pin; twenty-four mutants over v2.6.181 + v2.6.182, all caught; Chromium 43/43. v2.6.181: 395/0; v2.6.180 against it 389/6; seventeen mutants; Chromium 28/28 plus touch emulation. v2.6.180: 390/0; v2.6.179 against it 382/8; fourteen mutants, thirteen caught by the suite and the fourteenth, browser-only, by Chromium) · canary 235/0 · dispatch 95/0 · endpoint 36/0 · protocol 6/0 · soak `--control` and the battery (7 tables, 105 turns, 0 stuck) · the bot project's hotseat gate in a scratch copy 12/0 · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root and `SHA256SUMS` · headless Chromium: the counter under a real wheel, the pans per direction, the sweep from L2 and from L3, reduced motion, a dialog open, two real v0.6.236 bots through the Play offline dialog (L2: three pans, the turn back in 39 s; L3: no pan, 38 s). v2.6.179: client **384/0** (v2.6.179: v2.6.178 against the new suite 383/1, the badge pin; five mutants, five caught; Chromium at five window sizes: the badge, ▶ and gear on top in a visit, ⌂ Home too). v2.6.178: client **383/0** (v2.6.178: no skips, bot v0.6.234 beside; v2.6.177 against the new suite 379/4 -- the two seed pins and the two new tests; five mutants, five caught) · headless Chromium: the seed Turn-based through the real Play offline dialog, the bot's question with no clock, ▶ after ⌂ Home. v2.6.177: client **381/0** (v2.6.177: no skips, bot v0.6.234 beside; v2.6.176 against the new suite 376/5 -- the five new tests, each red on behaviour; fourteen mutants, thirteen caught, one equivalent) · canary **235/0** (v1.5.0; against v2.6.176's client and protocol 231/4) · the bot project's sim, 96 matches an arm (pace 0: windows run out 0 of 502 / 0 of 1744, gates 6 of 6; the client's pace: 95 of 96 play as before) · their hotseat gate in a scratch copy 12/0 · soak `--control` and the full battery (7 tables, 100 turns, 0 stuck) · headless Chromium: a real drag carries the aim, the level is asked, the bot's turn runs over the queue. v2.6.176: client **376/0** (no skips, bot v0.6.234 beside; v2.6.175 against the new suite 371/5 -- the four new tests and the embed drift; twelve mutants, eleven caught, one equivalent) · canary **231/0** (v1.4.0; against v2.6.175's client and protocol 198/33, beside bot v0.6.229 206/25) · dispatch **95/0** · endpoint 36/0 · protocol 6/0 · soak `--control` and the full battery (7 tables, 92 turns, 0 stuck) · served-check (after the commit) · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root and `SHA256SUMS` · headless Chromium (a hotseat with one real v0.6.234 bot): v2.6.176 -- the bot answers a human's master with Sudden Reversal, and a human's Sudden Reversal cancels the bot's master; v2.6.175 -- neither · v2.6.175's run: client **372/0** (no skips, bot v0.6.229 beside; v2.6.174 against the new suite 361/11 -- the nine new tests, the menu's key list and the embed drift) · canary **171/0** (v1.3.0; against v2.6.174's client and protocol 154/17, beside bot v0.6.218 167/4) · dispatch **95/0** (srv-2.6.50 94/1) · endpoint 36/0 · protocol 6/0 · soak `--control` · served-check (after the commit) · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root and `SHA256SUMS` · headless Chrome (a two-human hotseat, the real menus, phase bar and P key): v2.6.175 7/7, v2.6.174 shows the stale aim on the hunt and the bleed and lets the winner pass · v2.6.174's run: client **363/0** (no skips, bot v0.6.218 beside; v2.6.173 against the new suite 361/2 -- the new test and the embed drift) · canary **143/0** (v1.2.0; beside bot v0.6.216 121/22, against v2.6.173's protocol 132/11) · dispatch 94/0 · endpoint 36/0 · protocol 6/0 · soak `--control` · served-check 7/0 · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root and `SHA256SUMS` · headless Chrome (the real server, KRCG's real files by route): v2.6.174 10/10, v2.6.173 6/10 (the four of the v5-by-the-default-address case) · `krcg-audit.js` on the corrected recipe (`data/v4` → `data/v5`): 0 names lost or moved · v2.6.173's run: client 362/0 (v2.6.172 against that suite 355/7) · dispatch **94/0** (srv-2.6.49 88/6) · endpoint **36/0** (srv-2.6.49 31/5) · protocol 6/0 · canary 102/0 · soak `--control` · served-check **7/0** · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root and `SHA256SUMS` · headless Chrome: v2.6.173 15/15, v2.6.172 7/12, and the enforcing preview (v2.6.173 works, v2.6.172 loses the help tab's script) · v2.6.172's run: client **354/0** (no skips, bot v0.6.217 beside; v2.6.171 beside the same bundle 353/1, the embedded guide) · canary **102/0** (v1.1.0, beside bot v0.6.217; v2.6.171's run: against v2.6.170's protocol 90/12, beside bot v0.6.214 98/4) · dispatch 88/0 · protocol 6/0 · endpoint 24/0 · soak `--control` exit 0 (the trip-wire fired) · B1 byte-identical · embed `--check` both pages · check-versions green incl. the root gate · headless Chrome: Help ▸ Bots shows v0.6.217 through the real menu, the ↗ page too, no page errors (v2.6.171: v0.6.216); v2.6.171's run: the watched-duel panel from injected bot tallies (the bot project's two questions) · v2.6.170's runs: headless Chrome 33/33 (the KRCG v5 load, the cache, the stopgap, the stale-copy case, the names-alone pick, Refresh, From file; v2.6.169: 32/33) and the hosted path 19/19 (the server's `images/vtes.json`, `expansions.json` held or never answered, the names-alone pick waiting; v2.6.169: 18/19) · `krcg-audit.js` v3 → v5: 0 names lost or moved | run from `client/` |

**Deploy v2.6.189 (THE HANDOFFS ANSWERED, 26 Nov):** purge the client; nothing else changes (bot v0.6.237–241, PRs #103 and #106–#109, brought their own purges of `/elysium-bot.js` and `/elysium-cardfx.json`). If v2.6.188 (PR #104) is not live yet, one purge covers both.

**Deploy v2.6.188 (THE RING AT THE POINTER, 24 Nov):** purge the client; nothing else changes. If v2.6.187 (PR #102) is not live yet, one purge covers both.

**Deploy v2.6.187 (THE BOT RING, 24 Nov, PR #102):** purge the client; nothing else changes. A player's hub starts top right; where each player puts it is kept in their own browser.

**Deploy v2.6.186 (THE TOUR CATCHES UP, 24 Nov, PR #101):** purge the client; nothing else changes. If v2.6.185 + srv-2.6.53 (PR #100) are not live yet, deploy them as below first (one client purge covers both).

**Deploy v2.6.185 + srv-2.6.53 (THE SEARCH IS TOLD, 24 Nov, PR #100 -- it carries v2.6.184 + srv-2.6.52, THE SAVES HOLD, never deployed):** copy the server and restart, purge the client. A rollback to srv-2.6.51 reads the new files (it ignores the boards in the snapshot).

**Deploy v2.6.183 (THE NAME STACKS UP, 23 Nov, PR #98 -- it carries v2.6.181 and v2.6.182 too, neither deployed; stacked on #97, merge #97 first):** purge the client; nothing else changes.

**PR #99 (THE LICENCE, 23 Nov, on top of #98):** no deploy -- a root `LICENSE`, the README, PROTOCOL §13 and the gate lists; nothing a server serves changes.

**Deploy v2.6.180 (THE CAMERA PANS, 23 Nov, PR #97):** purge the client; nothing else changes (the server, the bot bundle and the TWD files are as merged; bot v0.6.235–236 brought their own purges of `/elysium-bot.js` and `/elysium-cardfx.json`).

**Deploy v2.6.179 (THE BADGE STANDS UP, 19 Nov, PR #88 -- carries v2.6.178, never deployed):** purge the client; nothing else changes. Rooms that already have a tempo keep it; new tables start Turn-based.

**Deploy v2.6.177 (THE ANSWER AFTER THE LINE, 19 Nov, PR #85):** purge the client; nothing else changes (the server, the bot bundle and the TWD files are as in v2.6.176). If v2.6.176 is not live yet, its bot purges below come first; one client purge covers both.

**Deploy v2.6.176 (THE CARD THE BOTS SEE, 19 Nov):** purge the client, and with bot v0.6.230–234 (PRs #77–#81) purge `/elysium-bot.js` and `/elysium-cardfx.json`; the server and the TWD files are unchanged, so no restart. If v2.6.175 + srv-2.6.51 are not live yet, deploy them as below first (one client purge covers both).

**Deploy v2.6.175 + srv-2.6.51 (THE AIM LETS GO, 15 Nov):** copy the server and restart (the automated deploy waits for an empty server), purge the client, and with bot v0.6.219–229 (PRs #64–#74) purge `/elysium-bot.js` and `/elysium-cardfx.json`; the TWD files are unchanged since 16 Oct, and the server never serves `/elysium-cardfx.js` or `/START-HERE-BOTS.html`. If v2.6.174 is not live yet, the one client purge covers it.

**Deploy v2.6.174 (THE DEFAULT MOVED, 11 Nov):** purge the client and `/elysium-bot.js` (bot v0.6.218, PR #61); cardfx, the TWD files and the server are unchanged. If v2.6.173 + srv-2.6.50 are not live yet, deploy them as below first (one client purge covers both).

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
node test-client-logic.js          # 384 passed, 0 failed (with the bundle beside)
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

## Open right now (26 Nov 2026, after v2.6.189)

- **Built in v2.6.189 (the inventory the owner asked for, then the proposed round, approved):** bot v0.6.237–241 consumed and
  eight of the bot project's nine open handoffs answered (`docs/handoffs/REPLY-to-bot-2026-11-26-v0.6.241.md`; journal:
  SVAREN IKAPP).
- **The public repository -- main's round, on the owner's go** (bot RULINGS D-141; their handoff of 26 Nov). The owner's
  scope for our half: the owner's name may stay in the files that exist; other people's names (players, testers, anyone in
  a relayed message) and private conversations (chat quotes, relayed messages) go, even where a decision rests on them --
  the decision stays, written in our own words. Their count over our half (main at `2f18daf`): about 2,000 occurrences of
  the owner's names in 61 files, about 90 Swedish lines outside the journal (about 60 of them quotes), 30 of our 34 replies;
  the largest files are the journal, the client html's comments and changelog, `client/CLAUDE.md`, the context doc, the
  client suite and the canary. Their `bot/tools/public-scan.py` checks the owner's names (as hashes), Swedish quotes and
  Swedish prose, and scans the bot's files only (`owned()`): run it from a copy. Other people's names it does not look for
  -- that is a search of its own. Open question for that round: where the private conversations' verbatim words go, if
  anywhere (the bot side keeps theirs in the private data repo). **From v2.6.189 on, new text carries no chat quotes and no
  names of private persons; the owner is named by role.**
- **Waiting on the owner (the bot project's questions, nothing to build yet):** O-53 -- the playtest's resolution panel,
  proposals A–E (the action in one line, 'Waiting for: you' with only the valid answers, an action timeline, a bot referee
  owns RESOLVE and ×, safe counts made automatic), main's to build after the go-ahead, plus three table questions;
  O-46 -- a human's window on a bot's master: the 3.1 s beat or a tempo wait.
- **On the bot side:** their cleanup release (v0.6.242) brings a new guide to embed; their Help ▸ Bots text for the hub,
  the ring and the hold; consuming our licence reply (`bot/README.md` → `LICENSE`); their guide's body says 218 curated
  beside its footer's 221.
- **Not run:** a browser this round.

## Open after v2.6.188 (24 Nov 2026)

- **Built in v2.6.188 (THE RING AT THE POINTER, Johan's idea while v2.6.187 waited, built after its merge):** at a table
  with bots a right-button hold on the table opens the bot ring at the pointer, a short right-click keeps its menus,
  Settings has Hold the right mouse button / Off, and the key list an unbound key (journal: RINGEN VID PEKAREN). Added
  while it was built (Johan): the bot box can hide the hub, which comes out by itself while the table waits on this
  screen; the tutorial plays on the full panel whatever the player chose. A notice to the bot project,
  `docs/handoffs/REPLY-to-bot-2026-11-24-ring-at-pointer.md`: nothing on the wire changed, and their next Help ▸ Bots
  text can name the hold and the hidden hub beside the hub.
- **Not run:** the Windows event order in a browser (the suite drives it with fake events; Chromium on Linux sends the
  press order), macOS with a trackpad or Ctrl-click, Firefox, Safari. At a table with bots on macOS and Linux a short
  right-click's menu now opens at the release, not the press; Off restores the press. Online, a player who is not the
  host gets no hub for a bot's question (the bots run in the host's tab, as the glow in v2.6.187), so a hidden hub comes
  out there only for a bleed at that player.

## Open after v2.6.187 (24 Nov 2026)

- **Built in v2.6.187 (THE BOT RING, Johan's 'kör'):** the hub, the ring and the bot box (journal: BOTTRINGEN). Asked of
  the bot project (`docs/handoffs/REPLY-to-bot-2026-11-24-bot-ring.md`): whether the ring's Bounce closes the human half of
  their sweep item 4.6 (a Deflection played from the hand still writes only the play line), and a new Help ▸ Bots text --
  theirs still describes the old 🤖 panel.
- **Added before the merge (Johan: 'yes det kan du göra'):** at a hotseat with several humans the ring answers from the
  seat the bot asked (another human's question glows the hub and says whose seat to take; Reduce and Bounce are grey), and
  a background tab's title starts with a dot while the table waits on this screen.
- **Not run:** a real touch screen (Chromium's emulation only), Firefox, Safari, an online table in a browser, a whole
  match (one real bot's bleed was bounced through the ring to the other real bot and went through on it), a real
  background tab (Chrome slows a hidden tab's timers, after five minutes to once a minute, so the dot can come that late).
- **Built in v2.6.188:** the ring at the pointer (above).

## Open after v2.6.186 (24 Nov 2026)

- **Built in v2.6.186 (round 1 of the tutorial audit, Johan's 'Dina förslag låter bra!'):** all twelve chapters were driven
  in headless Chromium and every stale text, default and placement found was fixed (journal: RUNDTUREN HINNER IKAPP).
- **Round 2, offered, not built:** a chapter replayed from the picker resumes through `startHotseat` (turn 1, the 1st seat
  acting), so Interacting with opponents' target and hand-off steps do not fit a replay, and the globes come back at their
  default spots (the opponent's globe lands on its crypt cards) -- the snapshot could restore the turn, the acting seat
  and the globes. The round's other part: short mentions of what the tour does not know yet -- Table layout, bot seats and
  Add bot, 📋 Invite, saved matches, the panel's mode button, 👁 on other play areas, the Lite | Full button, Help ▸.
- **Noted, not built:** a centre-stage card clone takes the pointer for its click-to-dismiss (about 1-1.7 s), so a drag
  started on a card under it does nothing; in the tutorial, Esc asks to end the tour (its capturing handler) where a seat
  visit would otherwise go Home. Not tested: touch, Firefox, Safari, real card images; the online chapters run against their
  demo lobby only.

## Open after v2.6.185 (24 Nov 2026)

- **Built in v2.6.184 + srv-2.6.52 (PR #100):** HeySteev's questions through Johan -- the snapshot after every change and
  the boards in it (A), no silent overwrite of a named save (E), saves per room name and password and none without a
  password (F), the stale hand and pile texts (D). The answer to Steev was drafted in chat for Johan to send.
- **Waiting for Steev's answer:** B -- an automatic checkpoint at each turn's start, kept on the server, that the host can
  rewind to (Lackey's 'Revert to Autosave' without its readable file); proposed as a live rewind for everyone. C -- the
  one-button transfer: with the helpers on and the phase bar on Influence, scrolling or Ctrl+clicking an uncontrolled
  vampire already moves pool to blood and counts the transfer; we asked which setup he played in.
- **Built in v2.6.185 + srv-2.6.53 (same PR #100), Johan's 'Ja kör G också':** a search lists the pile by name, and the
  server tells the table about a search, a fetch from it and a park from the top (the client stays quiet on such a
  server). The draft to Steev said 'not even your own' -- corrected in chat for Johan to send. Returns, draws and
  shuffles keep the client's own lines (their results show on the board).

## Open after v2.6.183 (23 Nov 2026)

- **Built in v2.6.181 + v2.6.182 + v2.6.183 (PR #98):** the open table's centre (Johan: '1. Bra i panelen 2. Den kan placeras
  ovanför spelarens glob på brädet om det går'), the middle-button pan, then (v2.6.182) the Edge button in the bottom panel's
  pool zone ('i globzonen i bottenpanelen precis som L2' -- v2.6.181 had put it on the globe on the felt) and the fixed-width
  globe, then (v2.6.183) long names stacked upward in a 92 px window. Merge #97 first; this PR carries its two commits until then.
- **Not built, could follow:** the Edge token stays put when you move your globe after taking the Edge.
- **Built (PR #99, on top of #98, no client release):** the repository's licence -- the root `LICENSE` (MIT, DTAgent2000),
  `LICENSE` a root file of its own in `check-versions.js` / `sha256sums.js` with a row that checks it, the README's 'License'
  and 'Credits', PROTOCOL §13 (the bot project's handoff of 20 Nov; reply `docs/handoffs/REPLY-to-bot-2026-11-23-licence.md`).
  Johan reads the README's 'does not cover' list. zero-vtes's page about us says 'no license file': telling its maintainer
  is Johan's call.
- **For the bot project (read, not built):** v0.6.236's §12 record and canary checks, and the canary's loud skip from their
  19 Nov reply. Answered in a round of their own.
- **Not reproduced:** Johan's 'no card, then two' on a double-click of the library. The one mechanism found: two `uiDialog`s open at
  once (it does not queue, so one OK answers both); nothing opened two in the runs. Johan tests again with the counter fixed.
- **Not built, offered earlier:** remembering the tempo a player chose last, for the next table.

## Open after v2.6.179 (19 Nov 2026)

- **Built in v2.6.179:** the 🤖 badge and its ▶ during a seat visit (they lay under the visited mat); they stand under ⌂ Home now.
- **For the bot project** (`docs/handoffs/REPLY-to-bot-2026-11-19-turn-based-default.md`): their guide's 'Every table with bots
  starts at Standard, 3 s' is wrong from v2.6.178; Help ▸ Bots shows it until they ship a new guide.
- **Not built, offered:** remembering the tempo a player chose last, for the next table.

## Open after v2.6.177 (19 Nov 2026)

- **Paid in v2.6.177:** the bridge's delivery order (the queue the bot project chose in v0.6.230 §4; measured on their sim
  table, a microtask) and the drag path's play line (the level and the aim on a drag, as from the menu).
- **For the bot project (the reply `docs/handoffs/REPLY-to-bot-2026-11-19-queued-bridge.md`):** their lift gets the queue
  with the next copy of our client; their H12 text ('a target's instant answer reaches the actor inside its own send') is no
  longer what happens; their BOARD line 'A window can open after its line was delivered' measured closed on their own sim;
  two stale-answer rows remain at pace 0 (their guard); a macrotask drain fails their block and ledger gates (their own
  'defer a window-opening line a macrotask' idea would meet the same); the canary's live checks need
  `elysium-cardfx.json` beside it (without it five fail instead of skipping).
- **Not built, for Johan:** a drag does not ask the hand-size reminder that the menu's Play asks ('Your hand is N/7 — draw
  a card before playing?'); the drag kept its own behaviour there.
- **Carried:** the box's log for unmasked frames (security plan item 5); the 'Unlock all cards?' idea.

## Open before v2.6.177 (19 Nov 2026)

- **The bridge's delivery order -- still main's next round, on Johan's go.** The plan is in the 15 Nov section below. The bot
  project confirmed on 17 Nov that they prefer the queue (v0.6.230 §4). v2.6.176 added one more relay under the same
  synchronous rule: a bot that answers a human's card clone at once (Meditative Grove's cancel, the 'too late' chat) answers
  inside the human's own `cardFx` call, before the human's play line is written.
- **Found, not built -- Johan's call: the drag path's play line.** A card dragged to the table writes `X was played.` or
  `VAMP plays X.` with no ` Target: …` suffix and no level tag; the menu's Play and a double click write both (`playFromHand`).
  So an aim set before a drag is not used by that line and rides the player's NEXT line (v2.6.175 clears a used aim only), and
  the bots read a human's Toreador Grand Ball pair from that suffix. The clone carries the aim on both paths. A change puts
  new content on a frozen line for one path.
- **For Johan (carried):** the box's log for unmasked frames (security plan item 5); the 'Unlock all cards?' idea.
- **For the bot project (the reply):** a page cached at v2.6.175 still names every cross-board target `kind: 'lib'` online
  (their readers could match the name on their own board); when a human's Sudden Reversal cancels their master no line says
  so; their deploy notes list two URLs the box never serves; their STATUS still lists items paid in v2.6.175.
- **Paid in v2.6.176:** PROTOCOL §12 and the canary for bot v0.6.230–234's lines; the canary's card-suffix control
  (v0.6.230 §4); the guide.

## Open before 19 Nov (15 Nov 2026)

- **The bridge's delivery order -- main's next round, on Johan's go.** `hotBridge.toBot` hands a message to a bot inside
  the sender's own call; the server delivers after the send returns. Plan: one first-in-first-out queue, drained after the
  sender's code has returned (a microtask against a macrotask, measured with the bot's pace-0 open order); `parityTable`
  and the fake-seat tests (about 45) need a flush; the literal the bot project lifts changes, so a handoff goes before it.
  Bot v0.6.227 handles both orders: nothing waits on it.
- **An idea for Johan, not built:** 'Unlock all cards?' also unlocks the Toreador a human's Grand Ball keeps locked (the bot
  project's v0.6.225 note). A card marked 'stays locked at the next unlock', which the prompt respects, would serve Mind
  Numb's family too.
- **For Johan:** the box's log for unmasked frames (security plan item 5) -- the bot project confirmed in v0.6.219 that
  their Node client masks every frame, so the log is the last condition.
- **For the bot project (the reply):** a cached v2.6.174 client still writes a card in a bleed's suffix (their prey test
  could read it as no target); their guide's '187 hand-curated' beside the database's 190.

## Open before 15 Nov (11 Nov 2026)

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
- **For Johan (v2.6.174):** merge `VTES-Elysium-data` PR #2 (KRCG's v5 TWDA as `twda.json`, the README for KRCG's v5
  default; `vtes-v5.json` there differs from KRCG's dump of 11 Nov only in one card's `rulings`, so it was left alone).
- **For the bot project (v2.6.174's reply):** a human's Change of Target is named in the client's card-play line only when
  that vampire is SELECTED (`activeAnchor()`; the right-click menus select nothing) -- otherwise `Change of Target was
  played.` or another card's name, which their `_onCot` does not read. Their call; read in code, not tried at a table.
  Their copy of the canary in `bot/` is v1.1.0; v1.2.0 (section 7) is ours.
- **Paid in v2.6.174:** PROTOCOL §12 and the canary for bot v0.6.217's lines (owed since 6 Nov); the 10 Nov KRCG handoff's
  four items.

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
