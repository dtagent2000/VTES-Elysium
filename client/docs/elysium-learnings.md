# Elysium - Learnings & Working Notes

> **This doc reflects Elysium v2.6.129 (client v2.6.148 / server v2.6.44 / bot v0.6.198 tested beside the suite, last updated 13 October 2026).** Always work from the newest copy: if an older project snapshot disagrees with the chat's latest delivered output, the higher version number wins.

> **Compaction note (2026-09-09):** the June–July per-version learning sections (v1.5 … v2.5.x) are reduced to a title-only index at the end of this document; their full text, and the 25 July bot-harness recipe, live verbatim in `elysium-learnings-archive-2026-09-09.md` (NOT in the project — ask Johan for it when a title needs its story). Everything from the launch week onward, and the timeless sections (Technical learnings, pitfalls, how Johan works, the cheat sheet, the z-index map), is complete.

**v2.6.148 (13 Oct 2026, A SEAT FOR THE WATCHER):**
- **Guard a debounced send where it fires, not only where it is armed (13 Oct).** `schedulePush` returned early for a spectator and one board still went out: the timer had been armed inside `joined`, before the handler set `net.spect`. The condition belongs in the callback too.
- **Count frames, not symptoms (13 Oct).** 'No more notices' was checked by counting what the watcher's socket SENT (Playwright's `framesent`). The count said 1 when the log looked clean enough — and that one frame was the bug above.
- **A view entered from the wrong place can draw nothing (13 Oct).** A seat visit from the start view showed bare felt; the same visit from the home view showed the board. Land through the home frame, and look at the screenshot — `net.view` and the overlay's class were both 'right'.
- **A fix written, reverted and written again is three decisions, not waste (13 Oct).** The Add bot rule: fixed on the way, reverted because Classic is the default, restored when Johan chose Structured-only. The code is the same line; the difference is who decided.
- **Fixing an arrival path means running every arrival (13 Oct).** Spectator from the lobby, spectator mid-game, reload + Resume + Join, reload + Join + restore, automatic reconnect while visiting a seat — on both board styles. The reconnect case is the one a plain 'switch to the table on joined' would have broken.

**v2.6.147 (13 Oct 2026, THE PIN STANDS):**
- **An icon that must turn is drawn, not borrowed (13 Oct).** The pushpin emoji is tilted by its font, and each font tilts it differently. A rotation that means something (lying = loose, standing = pinned) has to start from a known angle: one SVG path drawn point down, turned by CSS.
- **Choose a small icon's angle on the pixel grid (13 Oct).** At 12 px on an ordinary-density screen a 45° needle is a smudge; 0° and 90° are crisp. Render the candidates at device scale 1 and enlarge them pixel for pixel (`image-rendering:pixelated`) before choosing — a 2× screenshot flatters every option.
- **When the words leave a button, three attributes take over (13 Oct).** `aria-label` names what the button does and never changes, `aria-pressed` carries the state, `title` says the state in words for the pointer. The setter then writes attributes only; rewriting `innerHTML` on every toggle would throw the icon away and restart its transition.
- **A proposal is better for an hour of reading the code it is about (13 Oct).** 'The welcome layer covers a spectator's table' was the finding. Reading the paths for the proposal showed the layer is the smallest part: a spectator's client pushes a board, the server refuses, the refusal is logged, and the log line starts the next push — 53 notices in 35 seconds of watching. Count what a watcher's client SENDS before describing what it shows.
- **An error reply that makes the client act again is a loop (13 Oct).** `err` → `log` → `scheduleSave` → `schedulePush` → `board` → `err`. Each step is reasonable alone. A client path that reacts to a refusal must not be able to produce the refused message.
- **'Fix it first?' has a different answer per item (13 Oct).** Of five findings one was a product decision that decides what the other project is asked for; four were independent client fixes. Sorting them by what they block answered the question better than a yes or a no.

**v2.6.146 / srv-2.6.44 (13 Oct 2026, THE TABLE IS SET):**
- **An `else` after a one-line `for … if …` belongs to the inner `if` (13 Oct).** `if(!freeBoard()) for(…) if(crypt.length) move(…); else if(tableSetupOn()) …` parsed, ran, and dealt no setup cards offline. Brace the outer branch whenever an `else` follows a loop written on one line. A unit test pins it.
- **A log line written before `dealt` is gone before anyone reads it (13 Oct).** `dealt` calls `clearTable()`, which empties the log. The old-server note logged at `joined` and the bot note logged at `started` were both wiped. Anything the player should read about the deal is written after the deal line: keep the fact in a flag, write the line there.
- **A checkbox row spans both columns of the dialog's grid (13 Oct).** `.mpcheck` is `grid-column:1/-1`; a description placed after it fell into the left column and pushed every later row out of step. A box that has its own description takes one cell (`#mpSetupRow{grid-column:auto}`). Screenshot the dialog in Full and in Lite after adding a row.
- **A room option has more senders than the recipe says (13 Oct).** `joined` is built in two places (players, spectators) and `took` in two (promote, loadMatch). loadMatch's `took` had never carried `boardMode`, and the client defaulted an absent one to Structured. Counting matches in the source is not a check — the spectator's `joined` matches too; assert each sender's own message.
- **A new optional field is safest when the old peer needs nothing from it (13 Oct).** The server stores `tableSetup` and deals as before; the client draws its four cards with the verb it always had. Both mixed pairs were run — an old client at a new table, a new client on an old server — and nobody loses a card.
- **Ask what a guard reads, then check that the other side sends it (13 Oct).** `netBotWhy` tests `net.lobbyData.boardMode`. The server's lobby message has never had that key, and the v2.6.99 test wrote the key into its fixture by hand. The rule on the button never applied online. A test that puts the field under test into the fixture proves the branch, not the wire.
- **A default nobody chose is still something people rely on (13 Oct).** That Add bot hole is a bug by the rule's own text — and Classic is the default board style, so it is also how hosts seat bots online today. The fix was written, then reverted before delivery and left with Johan. Removing something people can do is a decision, even when the code's intent is plain.
- **Run the real server with real browser clients before calling an online feature done (13 Oct).** The unit suites drive handlers with made messages. Five headless browsers against a spawned `elysium-server.js` showed what no handler test could: what an opponent's client renders (cards without names), that seats follow the claimed seats and not the join order, and what a reload looks like.
- **Measure the previous release before calling something a regression — or a finding (13 Oct).** Four odd things turned up around a reload and a spectator. Each was re-run on v2.6.145 + srv-2.6.43 first, and each was already there. Without that run they would have been reported as faults of the new option.
- **Follow the dialog to its end before measuring (13 Oct).** After a mid-game join the Join dialog stays open and the client stays on the start view; the first probe read an empty globe map and cards at (0,0) and nearly became a bug report. Do what a person does next (close the dialog, press Esc), then look.
- **The lower seats belong above the hand panel, not at the table's edge (13 Oct).** The open panel covers the bottom quarter of the felt (from canonical y 410–425 down on laptop windows), so seats at the edge sit under a pinned hand. Johan tried a compromise position and then chose everything above the panel; the worry that the rows would crowd on a laptop did not come true.
- **Mirror another project's layout only to measure it, never to depend on it (13 Oct).** The bot's camp formula was read from `bot/elysium-bot.js` to count overlaps with the seat spots (14 of 70). The client then got a guard on the roster's `bot` flag — not a copy of the formula. What the bot should do instead went into a handoff.

**12 Oct 2026 (no code, NOTHING OF THEIRS IN THE REPO):**
- **Hosting a third-party file and fetching it at run time are different acts, even for a public file (12 Oct).** The client has always fetched KRCG's `vtes.json` from KRCG; a copy committed to the repo is us redistributing it. Gitignore such inputs and write the fetch line where the gate that needs them is documented.
- **An onboarding page's file list drifts behind the help page embedded in the client (12 Oct).** `START-HERE.html` listed three bot files; the in-client help listed seven. Both describe the same download — grep both whenever the bundle changes.

**12 Oct 2026 (no code, THE REPO IS THE TRUTH — the monorepo sync):**
- **A "root equals the halves" gate must know which half owns each file (12 Oct).** The first root gate compared every root file against `bot/` first and `client/` second, so a stale root server passed because it matched `bot/`'s read-only copy of srv-2.6.38. The gate now names the eight bundle files as `bot/`'s and everything else as `client/`'s; a file nobody owns is a warning. A gate that accepts "matches something" is not a gate.
- **Suites that read neighbours from `__dirname` want the files copied, not the code changed (12 Oct).** The bot bundle lives at the root and in `bot/`; our suites, canary, soak and `embed-help.js --check` read it from beside themselves. Copying it into `client/` (gitignored) keeps the suites' lookup rule and the consume model intact; teaching every tool a second path would have been a change in eight places for one convenience.
- **`project_read` returns small text files inline and a .docx as extracted text (12 Oct).** Transcribe the text files verbatim and take binaries from a real copy (the repo root, Johan's own upload). `cmp` against a file that is MISSING locally prints "differ" too — a missing twin is not a changed one; test existence first.
- **A handoff can name a file that lands in a LATER PR (12 Oct).** `bot/docs/START-HERE-BOTS-CHAT.md` was in their handoff before it was on `main` (PR #2 brought it twenty minutes later). Before calling a named path missing, fetch `main` again; before writing a path into our docs, check it is there on the branch we rebase onto.

**v2.6.145 (12 Oct 2026, THE GROUP KNOWS THE ZONES):**
- **A list of exclusions written inline is only as complete as the day it was written (12 Oct).** `groupDrop` refused library cards in torpor and in uncontrolled, two lines; the hand was never added. A named predicate (`zoneRefuses`) that every path calls has one place to be wrong.
- **Rerun the audit that found the bug as the proof of the fix (12 Oct).** The 60-cell matrix went 8 → 0 differences. A unit test pins the rule; the matrix shows no third path was missed.
- **Players read an empty shared table as 'no seats' (12 Oct).** On the free board every globe starts in a ring in the middle and every seat's drawn crypt cards land on the same centre spot; the first thing five players did was drag everything apart. A free table still needs a starting arrangement.

**v2.6.144 (12 Oct 2026, ONE RULE FOR ONE AND FOR MANY):**
- **A group path that re-states a single-card rule will drift from it (12 Oct).** `groupDrop` had its own line for the face of a card landing in ready; the free-board exception was added to `dropCard` only. Two more of the same kind sit in the group paths (crypt cards into the hand, library cards into torpor). When a rule gets an exception, grep for every other place that states the rule; better, give the rule a name and call it.
- **'It works for me' and 'it broke for them' can both be true (12 Oct).** Johan click-drags crypt cards out (they land in `ready`); the player double-clicked the pile (they land in `uncontrolled`). Same cards on the same felt, different zone underneath. On the free board the zone is invisible, so behaviour that depends on it looks random.
- **Audit by matrix, not by reading alone (12 Oct).** Reading the two handlers side by side found the hand case; the browser matrix (every source × every target × single and group) confirmed it, cleared 52 other cells, and cost four minutes. Compare a card's outcome alone with its outcome in a group of two of the same kind.
- **Where the test pointer rests is part of the test (12 Oct).** Resting at the top centre opened the Played tab over the cards; two card kinds 'could not be dragged'. Park the pointer on empty felt, and treat 'nothing happened' as a tooling question before a product one.

**v2.6.143 (12 Oct 2026, THE TABLE LISTENS):**
- **A name several cards share needs an owner rule, not an insertion order (12 Oct).** `map.set(norm(name), …)` in a loop is last-wins. KRCG gives every card a `_name` that its siblings share (base and advanced, old printing and reprint) and says who the bare name means in `name_variants`. Read the source's own disambiguation field before inventing one, and test the index in both file orders.
- **'Unknown name' plus a gate that is on by default is a refusal, not a warning (12 Oct).** The unknown-name check was built for misspellings; with `Legal cards only` on from the first start, every gap in the name index is a deck that cannot be loaded. When the index changes, run real exports through it — `Name (ADV)` is in every deck builder's output and was in none of our fixtures.
- **A parser written for the new data shape must not leave the live shape behind (12 Oct).** `parseV5Card` read `name_variants`; `parseV3Card`, the one the live file still uses, did not. A dual-format reader needs each field decision made twice, and a fixture per shape for it.
- **A feature announced only by a tooltip is not a feature a first-time table finds (12 Oct).** The dock pin existed (click the empty background, a glowing edge, a title). Four players looked for a pin button and reported there was none. State that matters gets a control that shows it.
- **A default nobody chose (12 Oct).** The lobby die was a D6 because the button sent no `sides` and the server's fallback is 6. The server took 2–100 from the first day. Check what a button sends before deciding the feature is missing.
- **Player feedback names the symptom at the table; reproduce it before choosing the fix (12 Oct).** 'The import refused advanced cards' reproduced in one browser run with the real file, and the same run exposed the wrong-text bug nobody had reported. 'The shuffle looks wrong' did not reproduce: three million deals matched the hypergeometric odds. Both answers are worth giving.
- **One small sample is not a finding (12 Oct).** The first shuffle run (120 000 deals) showed the rare hand 27% less often than the exact odds, a 3σ miss; 900 000 and 3 000 000 deals put it back on the line. Rerun larger before believing a deviation in either direction.
- **The sandbox can drive the real client now (12 Oct).** Chromium and Playwright are installed; `file://` loads the client, `startHotseat([{name, deckText}], mode)` seats a table without the card database, and real mouse moves, clicks and screenshots work. 'Cannot verify rendered behaviour' is no longer true for layout, hover and click paths — it still is for touch, sound, animation feel and anything needing KRCG's images.

**v2.6.142 (12 Oct 2026, THE BADGE KNOWS THE HOLD):**
- **A mirror of another project's rule drifts silently; test it against the source (12 Oct).** The hold badge copied the bot's hold rule as of v0.6.107. The bot changed the rule at v0.6.108 (a release frees the whole table) and again at v0.6.198 (a chat line holds; a bot's own Hold on holds nothing), and every client test stayed green, because each tested the badge against the badge. Found only by reading the bot project's guide against our client. The new LIVE test drives the real bot and the badge through the same inputs and compares `_holdBy` with `hotHoldBy`, so the next change of the rule turns a test red instead of a table silent.
- **The same words can be a request or an announcement (12 Oct).** 'Hold on…' from a human asks the table to wait; from a bot it is the thinking announce before an answer and holds nothing. A filter that reads the phrase without the speaker gets one of the two wrong. Check who speaks before what is said; the roster's `bot` flag is the source the bot itself uses.
- **Extract a listener's body so the test drives the real path (12 Oct).** The chat line's send logic lived inside a `keydown` listener, and the harness keeps no listeners; a test would have had to re-implement the path, which proves nothing. `chatSendLine(v)` is now the body, the listener calls it, and the LIVE test calls the same function Enter does.
- **A test's failure message can carry a stale reason (12 Oct).** Two older tests explained their assert with the rule as it was ('only they can resume'). The asserts still held; the explanations had become wrong. When a rule changes, grep the test messages for its old wording as well as the asserts.

**12 Oct 2026 (no code, THE HOLD WAITS EVERYWHERE):**
- **Describe a filter by its rule, not by examples (12 Oct).** The v2.6.139 tooltip said the ▶ steps every bot "that waits on a window or question — never a hold". The code was a filter (`canStep && step && step !== 'release-hold'`), but the wording named two kinds of wait. The bot project asked for a filter the code already was (v0.6.195 handoff, 9 Oct), repeated it on 11 Oct, and on 12 Oct its status note still said the ▶ stepped only the block and pool questions. State the rule ("every wait but a hold"); a list of examples reads as the whole list.
- **A peer's status note can be older than our reply (12 Oct).** The note asked for work main had delivered on 11 Oct; the answer was one forward away. Before redoing what a peer asks for, check which of our replies they have seen.
- **Check a proposal's reassurances in the code, not in its comments (12 Oct).** Proposing "a hold freezes every clock", I told Johan an abandoned table still could not hang unnoticed because the bot reminds every 90 s — the comment beside `status()` says so. In v0.6.197 the hold line and its reminder start only when a bot reaches `_holdGate`; a bot frozen inside a step never gets there. The safety net covered the bot's own acts and none of the waits the proposal would freeze. Read the trigger of a safety net, not its description.

**v2.6.141 (11 Oct 2026, THE GUIDE CATCHES UP):**
- **Read the other project's released code before asking it a question (11 Oct).** Of the three questions v2.6.140's reply asked the bot project, the released v0.6.197 answered two: the symmetric steal case was handled since v0.6.172 (`_stealGain` undone on the human's dodge or combat ends), and the Hold-on gap is real (`_phaseWait` never reads `_holdBy`). A question the code can answer is homework for the other side; a finding with line numbers is a contribution.
- **A 'changed today' release zip is partial by design (11 Oct).** The bot project ships only what changed since its previous zip, so the unchanged `.js` twins were not in it. The twin test's 'N of 3 twin pairs checked' line is what keeps a partial bundle from reading as a complete check — print what a conditional test actually covered.
- **A note's head can carry its own parentheses (11 Oct).** The VERSION-move regex `\(([^)]*)\):` stopped at the '(purge)' inside v2.6.140's head; split at the first '): ' instead. The atomic assert caught it before anything was written.

**v2.6.140 (11 Oct 2026, THE BOTS KEEP TIME):**
- **A second reader of a rule needs the rule, not a re-derivation (11 Oct).** The 'Stolen: N blood — move it' read-out carried its own copy of the dodge rule (`!cmbDodged(...)`) and nothing of combat ends, while the damage path knew both — so a vampire whose side ended the combat in the first pair was still told to move blood that never left. Found only because the bot project fixed the same rule on its side and asked. The cure is the v2.6.136 one again: one pure function (`cmbStolen`) next to `cmbDodged` / `cmbEnvOf`, and the panel reads it.
- **Pin a filter with a value nobody has named (11 Oct).** 'Step every rung except a hold' and 'step these two rungs' agree on every rung that exists today; only an unknown rung tells a filter from an allow-list. The test feeds `resolve-later` and checks it is stepped — an allow-list mutant fails it, which the obvious test would not have caught.
- **A classic `<script>` vehicle is testable end to end (11 Oct).** The harness's document is a plain object: replace `__doc.createElement` and `__doc.head.appendChild`, run the file with `vm.runInThisContext` (the client's `typeof GLOBAL` resolves through the Function scope to Node's global), fire `onload` / `onerror` on a timer, and delete the globals in `finally`. That covered the file:// branch, which until now only had its file NAMES pinned in source.
- **A comparison of large values reports the first difference, never both values (11 Oct).** `eq()` on two re-serialized 50 kB JSONs dumps 64 kB into the log on a mismatch. Compare, then report the lengths and the first differing offset with context.
- **A gated LIVE test SKIPS, it does not return (11 Oct).** A test that needs a capability the file beside it lacks (a bot without a `botcfg` handler) throws `e.skip = true`; a bare `return` counts as a pass and hides that nothing was tested.
- **When the other project's files do not arrive, ship what is verified and name the rest (11 Oct).** Three handoffs reached main, the zip did not. Holding the client would have held Johan's test; delivering it with the bot-beside run and the guide embed named as open costs at most a small follow-up version (version = bytes) — and the reply says the same.

**v2.6.139 / srv-2.6.43 (9 Oct 2026, THE BOT TEMPO + THE KNOWLEDGE LAYER):**
- **A persistence mapping written inline rots field by field (9 Oct, srv-2.6.43).** `snapshot()` and `restore()` each spelled out the room's fields in place. Every later room field had to be added twice, by memory, and four never were: `boardMode` (a restored Classic table told rejoining clients it was Structured), `refHash`, `matchMins` and srv-2.6.22's `everPop` — and the squatter sweep reads `!everPop`, so the first 10-minute tick after a restart deleted every restored table nobody had rejoined yet. Found only because `botcfg` needed the same path. The cure is structural: ONE pure pair (`roomSnap` / `roomUnsnap`) and a JSON round-trip test that lists the fields; a new room field now fails a test until it is carried. Same shape as the stale-guard lesson: a mapping without a test is a promise nobody checks.
- **A test against a shuffled deck is a coin flip until the hand is controlled (9 Oct).** The v2.6.133 LIVE test passed at v0.6.171 and failed at v0.6.193 — not a regression: the Ventrue deck carries Majesty ×6 (about 54 % of opening hands), and the newer bot uses it, ending the combat before the round the test reads. The bot project calls this the hidden-randomness class; main had the same class in its own LIVE test. Pin what is not under test (here the bot's hand), and re-run a LIVE test several times before believing either colour.
- **When a contract change you asked for lands, the tests that read the end state must read the history (9 Oct).** Main asked the bot (24 Sep) to close its combat tally when the combat is over; bot v0.6.172 does. The LIVE test then asserted `avr.rd === 2` AFTER the close — reading a state the requested change now wipes. Assert on the observed sequence (`seen`), and assert the new contract itself (`avr.mode === null`).
- **Ask the other project's capability by the WIRE NAME, never by a version (9 Oct).** The panel must say whether a bot reads `botcfg`. The release that adds it does not exist yet, so a version floor would be a guess; the bot dispatches by `_handlers[m.t]`, so `typeof bot._handlers.botcfg === 'function'` is exactly "this bot can hear the verb". If the shape is not there at all, say nothing rather than something false.
- **Stored config never carries a one-shot action (9 Oct).** "Give the bot the word" could have ridden `botcfg` as a flag — and every late joiner would have replayed a stale "go". One-shot actions are `step()` in-process (or their own verb); stored table state is only state.
- **The tool layer turns backslash-u + four hex digits in TOOL INPUT into the character — even inside a quoted `cat << 'EOF'` (9 Oct).** The old CLAUDE.md note blamed Python heredocs; a plain `cat` proves it is earlier than any interpreter. A patch that must WRITE escape text (the client's JS strings use them; anchors must match them) writes a placeholder (`@u2014`) and converts it in the script (`chr(92) + 'u' + hex`). Two typed backslashes reach the shell as two.

**v2.6.138 / srv-2.6.42 (24 Sep 2026, RESCUE HAS TWO DIRECTIONS):**
- **A flag needs an end as well as a start (24 Sep, v2.6.138).** `_actUndir` was set when an action was chosen and cleared only when the NEXT action was chosen through the same menu. Actions also begin by playing a card, which never passes that menu, so the flag leaked into them. Tie a per-action flag to the action's END (`resolvePlayedActions`), not to the next time someone happens to start one the same way.
- **The owner of the event owns its cleanup (24 Sep, srv-2.6.42).** v2.6.137 made "the new turn's client" close the resolver at a turn change. Online, the new turn can belong to a bot, and then no human client sent anything. The server moves the turn, so the server clears the state tied to it, on every one of the six paths that move it (one helper, `turnTallyClear`, called before each `turn` broadcast).

**v2.6.137 (24 Sep 2026, NOTHING OUTLIVES ITS ACTION):**
- **A local clear is not a clear (24 Sep, v2.6.137).** Since v2.6.28 every client "killed" the Block counter locally when an action resolved, because every client ran the same trigger. But the server and the hotseat table hold the shared state too, and a bot reads THAT. A state that lives in several mirrors is cleared when the authoritative copy is cleared. Pick ONE writer for the clear (the actor, the new turn's player) and put it on the wire.
- **Know who performs a step before you automate it (24 Sep, v2.6.137).** I seeded the undirected +1 when the ACTOR opened the Block counter, but the BLOCKER opens it (it is their "Block!"), so that path never runs. The test passed anyway: the harness boots in the `free` resolver, so `avrOpen('block')` was a no-op and `a` read 0 or 1 for unrelated reasons. When a test of a new branch passes on the first run, check that the branch actually ran.
- **Lifecycle bugs hide at the boundaries: end of action, end of turn, end of combat (24 Sep, v2.6.137).** Each resolver mode had a way to open and a way to resolve, but no rule for "the world moved on without resolving me". Give every piece of shared state an owner-driven close AND a boundary sweep (the turn change) as the net.

**v2.6.136 (23 Sep 2026, CROWS NEED A STRIKE RESOLUTION):**
- **A rule applied at event time depends on event order; a rule applied at count time does not (23 Sep, v2.6.136).** The dodge zeroed the opponent's damage when the opponent picked AFTER the dodger through this client. The acting side picks first, so a human who acts and dodges is followed by the bot's write, and that write sailed past the dodge. Rules that relate two parties' choices belong where the result is COUNTED (`cmbDodged` inside `cmbSideDamage`), not in the click handler of whichever party happened to be second.
- **A new card's "when" matters as much as its "what" (23 Sep, v2.6.136).** v2.6.135 modelled Carrion Crows as "damage each round, cannot be dodged", but the card says "during strike resolution". That timing is what a combat-ends strike skips (forum rulings). When a card's text names a moment, model the moment.

**v2.6.135 / srv-2.6.41 (23 Sep 2026, AGGRAVATED, WOUNDED AND EVERY ROUND):**
- **One rule, one implementation — a third copy is where drift hides (23 Sep, v2.6.135).** The new-round rule existed in the server, in the client's twin (tested against each other) and in the client's own "Round 2 ▸" button, which carried a private copy. When every-round damage (Carrion Crows) arrived, the two twins kept it and the button's copy zeroed it, then SENT the zero, so the server faithfully stored the wrong value. The twin test could not see it, because the button was never part of the twin. `cmbNewRound` now calls `tallyCombatMerge`. When a rule has a shared implementation, every caller uses it; a "just this once" inline reset is a fork.
- **Unknown is not zero (23 Sep, v2.6.135).** `cmbBlood` returned 0 for a vampire this screen could not see; with the new wounded rule, 0 blood + any damage = "wounded", and a phantom torpor ended the combat. A lookup that can fail must return a distinct "unknown" (null), and every rule that reads it must decide what unknown means. Here it means never wounded and never burned.
- **A snapshot must not be retaken inside its window (23 Sep, v2.6.135).** The blood snapshot existed so the player could burn blood during Damage without skewing the count, but stepping BACK into Damage re-took it from the burned blood. Snapshot once per round, keyed by the round.
- **Check the rule text before you model it (23 Sep, v2.6.135).** "Aggravated damage cannot be mended" alone would have produced a wrong model. The rulebook's full text (the first unprevented point wounds without blood, further points on a wounded vampire cost 1 blood or burn it, normal damage is handled first, prevention may go on aggravated first) and one forum ruling (Crows + Ivory Bow on 1 blood) became seven test cases before the code shipped.

**v2.6.134 (23 Sep 2026, EFFECTS, NOT CARD NAMES):**
- **Log what the reader cannot already see (23 Sep, v2.6.134).** The combat menu asked for the card name and wrote it twice (the strike line, the combat-ends line) beside the card's own "plays" line: three near-identical lines for one Majesty. The table already SAW the card; what it and the bot lacked was the EFFECT. Before adding a log line, ask what it tells a reader that the log does not already say.
- **"It isn't there" can mean "it isn't reachable from here" (23 Sep, v2.6.134).** Johan could not find a strike choice in the Strike step. It existed, on YOUR combatant panel, and that panel only exists once you have joined. After a bot opened the combat he saw "Join as blocking" and nothing else. Check the path a user actually arrives by, not the state the feature was designed for.
- **A counterpart that misbehaves must not make you misbehave (23 Sep, v2.6.134).** The bot struck after the human's combat ends and stepped ph 4 → 5; the client then wrote a taken line for damage that never happened. The client's rule ("the round's damage is handled once") was right, but it only marked "handled" when damage had come in. Make the terminal states (`ce`) close the gate themselves, whatever the other side writes afterwards.

**v2.6.133 / srv-2.6.40 (23 Sep 2026, A NEW ROUND ZEROES THE DAMAGE):**
- **When you change a field's meaning, update every rule that resets it (23 Sep, v2.6.133).** v2.6.129 turned `a`/`b` from "damage this combat" into "damage this round" and wrote a new-round rule for the twelve new fields. `a`/`b` themselves stayed outside it, and only the human client's own Round 2 button zeroed them. The first writer that wrapped a round any other way (the bot writing `rd:2`) carried round 1's damage into round 2. A semantic change is a search task: find every writer AND every reset of the field, not just the code you are adding.
- **A random test must prove it meets the case (23 Sep, v2.6.133).** The first whole-tally twin passed against a mutant. Its generator took `seed % n` from an LCG, and a power-of-two-modulus LCG's low bits cycle with a tiny period (`rnd(4)` repeated every 4 calls), so 400 "random" writes hit the case once. Use the high bits (`seed >>> 16`), and ASSERT a minimum count of the interesting case inside the test. A twin that never meets the divergence proves agreement about nothing.
- **Script the counterpart before trusting "confirmed" (23 Sep, v2.6.133).** The bot asked for three confirmations. Answering from the code would have said "yes" to all three; scripting its exact writes found the a/b carry-over in one run. A LIVE test with the real bot then showed the full loop in its real timing: `2:0:1:1` under the old client, `2:0:0:0` now.

**v2.6.132 (23 Sep 2026, THE WINDOW THE MENU FORGOT):**
- **A second entry point inherits the first one's hidden assumptions (23 Sep, v2.6.132).** `avrOpen` never pinned the Played window because its only caller, the Combat button, sits INSIDE that window: the user is already looking at it. The right-click menu is a second way to start a combat, from outside the window, and it silently produced a combat with no visible panel. Every test passed, because none asked "can the user SEE it?". When you add an entry point to an existing flow, list what the old entry point gave for free (focus, visibility, a selection) and check that the new path supplies it.
- **Tutorials are UI too (23 Sep, v2.6.132).** The combat tutorial step still described the v2.6.18 stepper after the panel had been redesigned; its targets still resolved, so nothing failed. Grep the tutorial text for the feature's old vocabulary whenever a feature's UI changes, and pin the new wording with a test.

**v2.6.131 (23 Sep 2026, THE LINE WITHOUT THE HELPER):**
- **Name which channel is the contract and which is the accelerator — and test the no-accelerator path (23 Sep, v2.6.131).** The v2.6.129 handover told the bot "fields are the truth, lines are the announcement". That is true only while every writer has the combat helper on, and Johan's stated goal is bots on a Classic table without helpers. Reviewed with that goal in mind, one line the bot depends on (the taken line) existed ONLY through the helper. When a feature has an optional structured channel beside a universal one, write down which is the contract, then walk the path where the optional channel is absent. A test with the helper off is what found the gap real.
- **A harness's async background lines can land in a count (23 Sep, v2.6.131).** "Cancel writes nothing" counted every ring line, and the harness's card-DB load warning arrived in between. Count only the lines the assertion is about.

**v2.6.130 (23 Sep 2026, THE ROUND THAT SKIPPED MY LINE):**
- **A transition detector must survive the sender's coalescing (23 Sep, v2.6.130).** `cmbWatch` recognised "the table passed Damage" as a step 4 → 5 in the SAME round. But the sender coalesces steps (a 120 ms debounce), and its round wrap is sent at once and clears that debounce. A fast clicker's `ph 5` never left their screen, so every other screen saw `ph 4` then `rd 2` and waited for a crossing that could not come. When one side batches or debounces, detect STATE ("the damage round is behind us"), not the one intermediate message you expected to see. Reproduce the coalesced sequence in a test.
- **Review your own fresh code before it deploys, and say what you find (23 Sep, v2.6.130).** Johan's standing "anything you're unsure of?" found two faults in v2.6.129 that every gate had passed. Gates test what you thought of; the review is where you look for what you did not. Also check the other side: the bot never writes combat damage, which turns the best-looking new feature into "Incoming 0" at the table it was built for.

**v2.6.129 / srv-2.6.39 (23 Sep 2026, THE COMBAT STEPS CARRY STATE):**
- **Check the rulebook before redesigning around a list of steps (23 Sep, v2.6.129).** Johan listed seven combat steps from memory (Additional strikes as a step, no Damage resolution) and I built a first proposal on it — merging Damage into Strike. VEKN's 4. Detailed Turn Sequence showed the code's `AVR_PHASES` had been exactly right since v2.6.17: additional strikes are extra choose/resolve pairs INSIDE Strike, and damage is resolved once, after every pair. Keeping the rulebook's seven also kept `ph` meaning the same on the wire, which saved the bot a change. When a design is shaped by a rule sequence, read the rule at its source first; the existing code may already encode it.
- **A green `cmp` after a FAILED build proves nothing (23 Sep, v2.6.129).** `split_client.py` writes to `/home/claude/elysium-src`, `elysium-build.js` reads `./elysium-src`; the build died on a missing `shell.html`, wrote nothing, and `cmp /tmp/original.html elysium-vtes-bord.html` compared the file with itself — "byte-identical". Build to a SEPARATE target (`node elysium-build.js /tmp/rebuilt.html`, with `elysium-src` linked to the splitter's OUTDIR) and read the build's own output line before trusting the comparison.
- **When a lint cannot see an indirect read, teach the lint the indirection — from source (23 Sep, v2.6.129).** The protocol lint collects `m.field` from each handler; the combat fields are read by `tallyCombat(m, prev)` over a key list, so the documented fields came out "not read by code". Rewriting the handler to spell out `m.rng` etc. would have been code shaped by a test. Instead the lint follows exactly that call and parses the helper's key list from the source file, so dropping the call or changing the list still turns the doc red (verified both ways).
- **A rule that lives in two files needs a twin test, not two unit tests (23 Sep, v2.6.129).** The server's `tallyCombat` and the client's `tallyCombatMerge` (MP handler + hotseat bridge) must agree field for field. One test extracts the server function from its source and feeds both the same 400 seeded random writes, chaining their outputs as the next `prev`; a one-character mutant (a clamp of 8 instead of 9) failed it at once. Hand-written cases on each side would have passed that mutant.
- **Automatic log lines in a multi-client table: let each client speak only for what it owns (23 Sep, v2.6.129).** The taken line is written by every client for its OWN seat's combatant, keyed serial:round:seat — no coordination, no leader, no duplicates, and the same rule holds with bots in the seats (they speak for theirs). The ownership model (seat-based since v2.6.20) already answered "who writes this?".
- **Snapshot at the step boundary when the player may act inside the step (23 Sep, v2.6.129).** During Damage resolution the player burns blood by hand; computing the taken line from live blood afterwards would report the wrong loss. The blood is captured on ENTERING the step, and the line is computed from that.
- **A bot-dependent test written without the bot beside it can be wrong in the dark (23 Sep, v2.6.129).** v2.6.126's LIVE test waited for the bot's "is burned" note on `chat`; bot v0.6.114 had moved notes to the `log` tier two weeks earlier. It shipped as "NOT RUN" and was red the first time it ran. Run every `testB` once with the released bot before the test's assumptions become part of the record.

**v2.6.114 (15 Sep 2026, THE TIERS NEVER CROSS):**
- **Do not write the user's assumption into the record as a fact (15 Sep, v2.6.114).** Johan said quick phrases "have their own setting"; I repeated it in a VERSION note. They have none at all. He was recalling `conv.anim`'s three-way over CARD animations — the right pattern at the wrong layer, which is exactly the kind of near-miss that sounds verified. A claim about the code goes in the living docs only after it has been read in the code, no matter who said it first or how plausible it is.
- **Answer a "can X also do Y?" question with a test, not a reading (15 Sep, v2.6.114).** The question was reasonable and the answer was no; a reply alone would have left the next person to re-derive it, and left nothing to fail if someone later gives `showSay` a variant. A question worth asking about the code is usually worth an assertion.
- **A shared visual means a shared gate — name the sources before designing the control (15 Sep, v2.6.114).** The loud tier has two producers, quick phrases and resolver verdicts, pulsing through one bubble. Any future "hide quick phrases" setting has to decide whether verdicts follow, and that decision is invisible if you only look at the renderer. Count a component's CALLERS before adding a switch to it.

**v2.6.113 (15 Sep 2026, WHOSE BUBBLE):**
- **A policy decision inside a dispatcher cannot become a setting (15 Sep, v2.6.113).** "Don't bubble my own chat" lived as `if(m.who !== net.you)` in the `chat` handler from v2.6.50 — correct behaviour, wrong place. Making it configurable was not a matter of adding a control; it was a matter of moving the decision out of the message router into a pure function. When a feature request sounds like it needs plumbing, check first whether some hard-coded test is standing where the choice belongs.
- **Layer permissions so the local one can only subtract (15 Sep, v2.6.113).** Two gates guard the chat bubble: the table's (`hx('chatFx')`, host-lockable, tournament-absolute) and the player's (`conv.chatBubbles`). Asking the table's FIRST is what guarantees a personal preference can never reveal something the host locked away. The general rule: a narrower authority may always hide more, never show more, and the order of the guards is what enforces it — not a comment.
- **An unrecognised stored value should fail toward the safe default, not the permissive one (15 Sep, v2.6.113).** `chatBubbles` from a future or foreign build falls back to `others`, not to `all`. Settings are read from storage written by builds you cannot see; the fallback branch is a real code path with real consequences, and it should pick the conservative answer.

**v2.6.112 (15 Sep 2026, ABSENT IS NOT OFF):**
- **Absent, off, and unknown are three states — collapsing them silently kills features (15 Sep, v2.6.112).** `hx()` did `!!(settings[key])`, which makes "the table turned this off" and "the table has never heard of this key" identical. Because the server rebuilds a locked policy from its OWN key list, every helper newer than the running server lands in the second state and died in the first. `key in settings` is the whole fix. Any time one side rebuilds a map from its own schema, the reader must distinguish a missing key from a false one.
- **Fixing a bug can expose a second one the first was hiding (15 Sep, v2.6.112).** `chatFx` worked in testing precisely because v2.6.111's broadcast kept nulling the policy, sending `hx()` down its local branch. Repairing that made the locked policy stick — and the dead key became reachable. When a fix is followed immediately by a new symptom in the same area, check whether the old bug was masking, not whether the fix regressed.
- **A version-skew feature needs a skew test, not a same-version test (15 Sep, v2.6.112).** Every gate ran client and server from the same delivery, where `chatFx` is in both key lists, so nothing could see it. The new test builds the policy a PREVIOUS server would stamp — the current `HELPER_DEFS` minus the new key — and asserts the client still works against it. Any feature that spans both sides deserves one test that pretends the other side is older.
- **The comment trap, three for three (15 Sep, v2.6.112).** stopPropagation, netBotHelperUnlock, and now `bottom:64px`: every source census this session that matched prose was fooled by the comment explaining the very change it was checking. The rule is now unavoidable — slice to the code construct (a string literal, a call with its parens) or strip `//` runs first. The better a change is documented, the more certain its own explanation will satisfy its own check.

**v2.6.111 (15 Sep 2026, TWO NAMES FOR ONE THING):**
- **Our gates cannot see a field-name mismatch between the two sides of the wire (15 Sep, v2.6.111).** The protocol lint diffs the DOC against the CLIENT's handlers; the dispatch suite drives the SERVER; the canary drives a bot. Nothing compares what the server SENDS with what a client READS, so `{t:'helperPolicy', policy}` met a handler reading `m.helperPolicy` and survived every gate for months. A prototype general diff found it — along with 28 false positives, because relayed messages (`say`, `fx`, `decide`, `tally`) never have their fields named in server source. A real gate needs relay-awareness; until then, any s2c message whose payload the server CONSTRUCTS deserves a test that asserts the send site verbatim and drives that exact shape through the handler.
- **One message, two names, is a bug with a long fuse (15 Sep, v2.6.111).** The same object rode `joined` as `helperPolicy` and the broadcast as `policy`. The initial value therefore worked, and only the CONFIRMATION broke — so the feature looked correct until something re-pushed it, which in practice meant "until a bot was added". A payload that arrives by two routes must use one field name, and when it does not, the reader tolerates both: `m.policy || m.helperPolicy` fixes every deployed server from the client alone, where changing the server would have needed a restart everywhere.
- **A fallback that reads the same broken field hides the failure twice (15 Sep, v2.6.111).** `joined`'s legacy fallback re-sends the policy when `net.helperPolicy` is null — which, after the nulling broadcast, is exactly when it looks needed. The re-push then triggered another broadcast, which nulled it again. Self-healing code built on a broken read is a loop, not a repair.
- **When the code says it works and the user says it does not, instrument — do not re-read (15 Sep, v2.6.111).** The whole chain read correctly; a simulated round-trip through the deployed server's own logic returned the right answer. Three `console.log` lines from Johan's browser settled it in one message. Tracing is for understanding a known fault; for an unknown one, ask for the state.

**Reading another project's code (15 Sep 2026, from the feedback round's close):**
- **Do not grep for the line you predict, then call its presence a verdict (15 Sep).** Asked whether bot v0.6.112 had addressed the Vessel-cost report, I grepped `this.pool -= d.pick.cost`, found it unchanged, and reported the item as untouched. The fix was ten lines below it: an additive status line making the payment auditable. Confirming a hypothesis at its predicted location and stopping is the same error as testing only the path you already believe. Read the surrounding block, or diff the region — an unchanged line proves nothing about its neighbours.
- **Code / data is not an exhaustive split; observability is the third branch (15 Sep).** For "the bot doesn't seem to pay Vessel's cost" I reasoned: the deduction exists in code, therefore the cardfx entry must lack `cost.pool`. Both were fine. The real answer was that NOBODY COULD SEE the payment — the play line named the card and nothing else, and a trifle's bonus action often buys a second master whose income hands the pool straight back inside the same phase, for a visible net of zero. In any system where an agent mutates its own state privately and publishes only the result, "the mechanism is right and the report is missing" is the MOST likely shape of a symptom like this, not the last one to consider.
- **The user who owns the domain outranks your inference about it (15 Sep).** Johan checked the cardfx data himself and said plainly it was fine. That correction was worth more than my chain of reasoning about it, and it arrived only because the analysis had been stated explicitly enough to be contradicted. State the reasoning, not just the conclusion — it is what makes a domain owner able to correct you.

**v2.6.109 (15 Sep 2026, THE PANEL, REVIEWED):**
- **A suite full of correct functions says nothing about whether anyone calls them (15 Sep, v2.6.109).** 164/0 and the panel never mounted online: every test exercised `botPanelRead`, `botPanelSeats`, `botDebugAllowed` — the pure parts — and not one asked "who calls `hotBotBtnShow(true)`?" The mount lived on one of two spawn paths. For anything with a mount/unmount pair, a source test must pin BOTH call sites on BOTH paths; testing the function is the easy half and the half that was already right.
- **A pre-test review is a different instrument from a suite, and worth the hour (15 Sep, v2.6.109).** Three gaps in one delivered version, none reachable by the tests that existed, all reachable by reading the code with the question "what would a browser show me first?" The review is not a weaker browser check; it finds the class of bug a browser finds by accident, deliberately.
- **A DOM you rebuild on a timer is a DOM you cannot click (15 Sep, v2.6.109).** `innerHTML=` at 4 Hz replaced the buttons under the pointer. The fix shape is general: separate what CHANGES SHAPE (rebuild) from what changes VALUE (write in place), and keep the fast-moving value out of the shape signature or the guard is useless. Here the deadline *value* is excluded and only its *existence* is signed.
- **When the harness cannot render, say exactly what it did prove (15 Sep, v2.6.109).** The Proxy DOM let the panel mount and tick 60 times through hostile `status()` shapes without a throw — a real guarantee for a 4 Hz loop — and could not show one pixel. Both halves went in the journal; "tested" without the boundary is how the next session assumes the layout was checked.

**v2.6.108 (15 Sep 2026, THE BOT PANEL):**
- **Treat the other project's return value as hostile input, however good their code is (15 Sep, v2.6.108).** `botPanelRead()` wraps `status()` in a try, then checks every field, because the panel repaints four times a second and one throw would freeze it mid-game. Their implementation is excellent and that is beside the point: the failure mode is a version skew, not a bug — an older bot with no `status()` at all has to render as a readable row, not as a broken UI. Degrade per field; never trust a shape across a project boundary.
- **A guarantee inherited from someone else's invariant needs its own test (15 Sep, v2.6.108).** Debug mode must never run in a tournament, and it already could not: bots force helpers to `all` in both modes. The chain was sound — and this very session found a lock that had not locked for three versions. So the rule is stated where it is enforced and pinned by a test. "It is already impossible" is a claim about today's code, not a property of tomorrow's.
- **When the two error directions are asymmetric, do not branch — fail closed (15 Sep, v2.6.108).** The first `botDebugAllowed()` read `conv.tournament && !off`, a clever condition meant to decide which authority governed; a stubbed dropdown made `!off` false and the conventions check silently vanished. Refusing debug wrongly costs a debug aid; allowing it wrongly opens a player's hand to the table. Under that asymmetry the correct shape is a flat "refuse if anyone says tournament", with no mode branching for a subtlety nobody asked for.
- **A feature that replaces another must absorb it, not sit beside it (15 Sep, v2.6.108).** `step()` resolves a wait; it does not play a turn, so the offline ▶ sweep could not simply be deleted when the panel arrived. Two controls competing for one corner is worse than either alone, so the sweep became a row INSIDE the panel. Ask what the old affordance actually did before assuming the new one covers it.
- **Three of our rendering behaviours are now load-bearing for the bot project's debug mode (15 Sep, v2.6.108 — from their handover, verified by them against v2.6.107).** (a) A remote seat's crypt renders FACE UP when `faceDown` is absent from the pub — `addRCard` passes the pub card through verbatim — so their debug crypt works by omission; if remote rendering ever starts forcing uncontrolled cards face down, that half dies silently. (b) `sanRemote()` passes `<i>`, which their weighting lines use. (c) Our vote UI can now see `NAME casts N votes against.` from a BOT, not only from a human. None of these was designed as an interface and all three are now depended on across the boundary — record them before refactoring near any of them.
- **The shared constant proved itself on its first new member (15 Sep, v2.6.108).** Adding the panel to `BOARD_CHROME` was one line and it fixed both the wheel and the pan. Before v2.6.103 the same work would have been two edits in two handlers, and history says one of them gets forgotten. That is the return on centralising a rule: not the day you write it, the day somebody adds the next element.

**v2.6.107 / srv-2.6.37 (14 Sep 2026, THREE VOICES):**
- **The tiers a user asks for may already exist — as channels, just not as appearances (14 Sep, v2.6.107).** Johan described three levels of message and asked for a way to classify them. `log`, `chat` and `say{i}` had been exactly those three channels since long before the request; the only thing missing was that two of them rendered identically. Before building a classification mechanism, check whether the sender is already choosing and the renderer is simply not honouring the choice — the cheap fix is a stylesheet, the expensive one is a new taxonomy nobody needed.
- **Parameterise the one path; never mount a second (14 Sep, v2.6.107).** A separate `chatBubble()` mount would have duplicated the eviction queue, the slot layout, the duration rule and the relayout call — four places to drift, for one different font. A `variant` argument plus a CSS class overrides three declarations and shares everything else, and the shared 3-bubble budget keeps working by construction rather than by remembering to keep two counters in step.
- **Typography does not scale alone (14 Sep, v2.6.107).** Shrinking `.saytxt` from 58px to 24px would have left a 190px medallion and a 175px clan icon around a line a fraction of their size. Anything sized in fixed px relative to text has to move WITH the text; grep the whole component's rule block before changing one declaration in it.
- **A new key in a hand-mirrored list is a two-project change (14 Sep, srv-2.6.37).** `HELPER_DEFS` (client) and `HELPER_KEYS` (server) are two hand-written copies of one contract, and `cleanHelperPolicy` builds its settings map from the SERVER copy alone — so a client-only key vanishes from every host-locked policy with no error at either end. The same sibling-drift shape as the wheel handlers, one layer up. Both lists are now diffed in both directions by a test; that is the only thing that makes a hand-mirrored pair safe.
- **Put the feature gate where the decoration is, not where the content is (14 Sep, v2.6.107).** `chatFx` is checked inside `chatBubble`, never in the `chat` handler, so switching the animation off costs the animation and nothing else. A gate one level too high turns "I find this distracting" into "I stopped receiving messages".

**v2.6.106 (14 Sep 2026, THE CONTRACT ROUND):**
- **An index on the wire is append-only, forever (14 Sep, v2.6.106).** `say{i}` carries a position, not a phrase, and the bot keeps its own copy of the array. Inserting a phrase in the middle would renumber every entry for every peer on an older build — no error, no mismatch to detect, just a room where `Block!` arrives as `No reaction`. Append, never reorder, and write the rule down beside the table rather than trusting the next reader to infer it.
- **Freeze what you SAY before asking anyone to parse it (14 Sep, v2.6.106).** The bot's grammar table had carried the human client's action wording as "unverified (main-project ask)" since THE SPLIT — a cross-project dependency sitting in a code comment on the wrong side of the boundary. The fix was not a bot change; it was writing down what we already emit. When two projects meet, the side that PRODUCES a string owns documenting it, and a comment in the consumer's source is a bug report waiting to be found by accident.
- **A doc can be unit-tested against the code it describes (14 Sep, v2.6.106).** §12.1's phrase table is parsed out of the markdown and compared row for row with the live `SAY` array. Same trick as the v2 protocol lint, applied to a plain table: any spec that is a LIST of facts about the code can be diffed against the code, and one that cannot be diffed will rot.
- **Whether a thing is "an action" is a contract decision, not a UI one (14 Sep, v2.6.106).** Routing `Political action` through `act()` gave it locking, the batch close and the target suffix — which is what puts it on the bot's block-step path without the bot understanding politics at all. Casting votes deliberately did NOT go through `act()`: no lock, because a titled minion keeps its votes while locked. The menu looks like two neighbouring rows; underneath they are on opposite sides of the contract.

**v2.6.105 / srv-2.6.36 (14 Sep 2026, CLOSE TABLE):**
- **A flag that exists is not a fact the system knows (14 Sep, srv-2.6.36).** `p.bot` had been set on every bot join since 13 July, and the server still could not answer "is anyone human in here?" — the flag only ever travelled outward in the roster, never into a decision. Before designing around "the server knows X", check whether anything actually READS X; a field that is only ever published is data, not knowledge.
- **Choose the unit of a rule deliberately: seats or sockets (14 Sep, srv-2.6.36).** "No humans left" has two honest readings — none CONNECTED (a dropped Wi-Fi ends the game) and none in the ROSTER (a real leave is required). They differ only in the failure case, which is exactly where users live. Roster-counting plus a short grace for the offline case gives both: a reconnect always works, and an abandoned table still expires in ten minutes instead of an hour.
- **Ending something needs its own verb, not a loop of the verb that removes one (14 Sep, srv-2.6.36).** Closing a room by kicking everyone would have worked and been wrong: N broadcasts, N roster re-renders, the host left alone, and the actual deletion happening as a side effect of the emptiness rule. One verb, one log line, one intention — and it can then be raised by the SERVER itself for the bot-only cases, which a client-side loop could never have covered.
- **Say why before you shut the door (14 Sep, v2.6.105).** `closed{msg}` is broadcast before the sockets close and before the room is deleted, because after either of those the client has only a dead socket to explain itself with — and a dead socket means "reconnect" to every auto-reconnect loop ever written. The client half is the same lesson from the other side: set the session state to disconnected BEFORE the close event arrives, or the teardown races the rejoin.
- **Do not ask a question whose answers are the same (14 Sep, v2.6.105).** Once the server closes a room when the last human leaves, a host alone with bots gets an identical outcome from Leave and from Close. `mpCanCloseRoom()` therefore excludes bots from "company", and the three-way dialog only appears where the two paths genuinely diverge. A prompt whose branches converge is noise that teaches users to click through prompts.
- **A broadcast cannot reach the people a broadcast is for (14 Sep, srv-2.6.36).** `bcast` skips players whose socket is null — which is precisely the set that most needs a message explaining why their room vanished. Any "tell everyone X" that matters across a reconnect needs somewhere to LAND, not just a send: state the room outcome where a later join can read it, or accept (as here, deliberately) that the offline set gets the generic answer. The general form: broadcast reaches the connected, never the absent, and the absent are usually the ones who will ask.
- **Teardown noise is not teardown failure — but say which it is, in writing (14 Sep, srv-2.6.36).** Closing every socket in `closeRoomNow` sets off a cascade of `dropPlayer` → `sys('… disconnected.')` broadcasts into sockets that are already closing. Nothing depends on them and no client sees them, so the only cost is a noisy log. Worth recording as examined-and-accepted rather than left for a future reader to rediscover as a suspected bug: an unexplained oddity in a log costs more the second time somebody finds it.
- **Write-after-loop earned its keep again (14 Sep, v2.6.105).** The Host-menu patch anchor used `Host\\u2026` inside a heredoc, which is the literal escape rather than the character the file holds; the assert fired and nothing was written, so the file was never left half-patched. The standing rule stands: read the exact bytes with `repr()`/`ascii()` first, and never write on assert failure.

**v2.6.104 (14 Sep 2026, THE POLICY GOES BACK BEFORE THE DOOR):**
- **Making a no-op real promotes every dormant asymmetry around it into a bug (14 Sep, v2.6.104).** `netBotsTeardown` never restored the helper policy, and for three versions that was invisible because the 'lock' it left behind was `allowLocal:true` — the default. The moment v2.6.103 made the lock mean something, the same missing restore stranded a whole table. When fixing a setting that was previously ignored, walk every path that CLEARS or abandons it, not just the paths that set it.
- **A teardown function runs after the connection is gone — it cannot talk (14 Sep, v2.6.104).** The restore looks like it belongs in `netBotsTeardown`, and putting it there would have failed silently: `mpLeave` sends `leave` first, the server runs `dropPlayer(conn,true)`, and every GAME_HANDLER then answers 'Join a room first'. Anything that must reach the server on the way out belongs BEFORE the goodbye verb, and a test should pin the ORDER on the wire rather than the mere presence of the message.
- **A source census must read code, not prose (14 Sep, v2.6.104).** Twice in one session an assertion was fooled by a comment: the wheel census counted the word 'stopPropagation' inside a comment explaining stopPropagation, and the teardown census matched `netBotHelperUnlock` inside a comment explaining why `netBotHelperUnlock` is absent. Strip `//` runs from the slice, or match a call shape with its parens — the more carefully a change is commented, the more likely its own explanation trips the check.

**v2.6.103 (14 Sep 2026, ONE RULE FOR THE FELT):**
- **Two handlers on one element that both ask "is this bare surface?" must read ONE list (14 Sep, v2.6.103).** `#board` has a wheel handler and a pointerdown handler. The pan one carried an exclusion list; the wheel one carried none, so whether a wheel reached the zoom was decided entirely by whether the child under the pointer happened to `stopPropagation` — an implicit contract with nine separate enforcement points and no way to read it. Two of the nine did not hold. The fix is not the two missing calls; it is `BOARD_CHROME` + `isBoardChrome()`, read by both handlers, with the missing calls added as belt-and-braces afterwards. Tell for the class: a rule that exists only as the sum of what every child happens to do.
- **A symptom-shaped fix can be correct and still be the wrong layer (14 Sep, v2.6.103).** Adding `stopPropagation` to `#pool` and `#dockPool` would have closed the reported bug completely and left the next piece of board chrome to rediscover it. The question that found the real layer was not "why does this element leak?" but "who decides what counts as bare felt, and is there more than one answer?"
- **When excluding elements from a gesture, exclude CONTROLS, never SURFACES (14 Sep, v2.6.103).** The tempting reading of "only open board zooms" is to block everything that is not `#board` itself. In L3 the screen is mostly mats and zones — they ARE the table — so that reading leaves almost nowhere to zoom from. The list holds chrome and cards; `#z-ready`, `#z-uncontrolled`, `#z-torpor`, the mats and `#l3stage` are deliberately absent, and the suite pins both halves so a later addition cannot quietly swallow a surface.
- **A policy field that is silently ignored looks exactly like a policy that works (14 Sep, v2.6.103).** `netBotHelperLock` set every helper true and shipped `allowLocal:true` — and `allowLocal:true` makes `hx()` read each player's own Settings, so the whole `settings` map it had just filled was dead data. Nothing errored, the push succeeded, the room accepted it, and the lock locked nothing for three versions. When one field of a policy object gates whether the others are read at all, building the object by hand is how you get a well-formed no-op; call the constructor the other callers use (`helperPolicyFor`) so there is one place the shape can be wrong.
- **Gate at creation only what creation fixes (14 Sep, v2.6.103).** Johan offered a create-time helpers requirement, mirroring the Structured gate. `boardMode` needs that gate because no verb changes it after create; `setHelperPolicy` is a lobby verb, so the same gate there would refuse rooms that could be corrected in place. The shape of the constraint has to follow the server's actual mutability — the third time this exact distinction has decided a design (v2.6.99 named it first).
- **A test that pins a partner's bug is dated by that partner's version (14 Sep, v2.6.103).** The hotseat-hold end-to-end test asserted `false` on "was the hold announced", documenting a v0.6.107 gap. Bot v0.6.108 closed it, so the suite failed on a FIX. Reproducing against the pristine client with the same bot separated "I broke it" from "they fixed it" in one run. A known-gap assertion should carry the partner version in its message (this one did, which is why it was readable at a glance) — and it has to be revisited on every consumed release, not only when it goes red.

**v2.6.102 (13 Sep 2026, THE TABLE WAS NEVER FULL):**
- **A field named like a capacity is not a capacity (13 Sep, v2.6.102).** `seats` in the lobby snapshot is `room.players.length` — the seat-picker's range, not the table's ceiling. The name reads like a limit, the suite agreed with itself because the test invented `seats` values that happened to be plausible, and the bug only appeared in the one configuration nobody simulates: a host sitting alone. Before comparing against a server field, read where the SERVER sets it, and prefer to enforce a limit the same way the server enforces it (here: the same expression, against a mirrored constant).
- **Unit tests that supply their own fixtures can agree with a wrong model (13 Sep, v2.6.102).** The v2.6.99 gate test passed while the gate was broken, because it fed `seats: 3` with one player — a combination the server never produces. Fixtures should be shaped like real server output; when a test constructs the input, it can only check the code against the author's understanding, never against reality. The browser pass caught in one click what the suite could not.

**v2.6.101 (13 Sep 2026, THE HOLD BADGE FOLLOWS THE TABLE):**
- **Enabling an old feature in a new context re-opens every gap that context never had (13 Sep, v2.6.101).** v2.6.99 let bots into online rooms; every protection written for bots had been scoped to `localTable`, so the hold badge silently did not apply there. Nothing broke, nothing warned — the safeguard just was not present. When a feature gains a second habitat, walk the list of everything built FOR it and check each one's gate, rather than checking that the new path works.
- **Gate a safeguard on the condition it protects against, not on where it was first built (13 Sep, v2.6.101).** `localTable` was never the real condition — "this table has bots" was. Written that way from the start (`hotHoldTableHasBots`), v2.6.99 would have inherited the badge for free. The same applies to `hotBotSeat`, which is correctly written as bot-AND-connected-AND-local rather than just local.
- **Offer no control that cannot act (13 Sep, v2.6.101).** Online a hold is keyed to its speaker, so this client genuinely cannot clear someone else's. The badge shows the holder and hides Resume, rather than presenting a button that would silently fail. Showing the state without the affordance still solves the real problem — the freeze is explained.

**v2.6.100 (13 Sep 2026, THE POLICY SNAPSHOT READS THE ROOM):**
- **Snapshot the source of truth, not a view of it (13 Sep, v2.6.100).** The helper-policy lock remembered "what was there before" by reading the Settings checkboxes — a VIEW that is only populated when the dialog is opened. The room's live policy lives in `net.helperPolicy`, server-sent. A snapshot taken from a view restores whatever the view happened to show, which for an unopened dialog is the HTML default. Rule: when remembering state to restore it later, read it from where the system itself keeps it, never from a widget that mirrors it on demand.

**v2.6.99 (13 Sep 2026, ONLINE BOTS FROM THE LOBBY):**
- **When the platform already does the work, the feature is only a dial (13 Sep, v2.6.99).** Two days of hotseat work went into emulating the server's bus; online that bus already exists, so seating a bot needed a WebSocket, a join and a seat verb — no fan-out, no referee relay, no hold plumbing. Before building a local mechanism, check whether the networked path already provides it and whether the "missing" piece is just an entry point.
- **Gate on what CANNOT change, and say why on the control (13 Sep, v2.6.99).** `boardMode` is fixed at room creation and no verb alters it, so bots are offered only in Structured rooms — with the reason on the disabled button. `setHelperPolicy` IS a lobby verb, so the helper lock is applied dynamically instead. Two constraints that look alike ("the table's shape") behave differently, and the UI has to follow the server's actual mutability, not the mental model.
- **Remember-before-override must be idempotent, again (13 Sep, v2.6.99).** `netBotHelperLock` returns early if a policy is already remembered — the same guard as `hotTournBefore` (v2.6.92) and `_preBotVal` (v2.6.93). Third occurrence of the shape in a week: snapshot once, restore once, and never let the second call overwrite the memory with the override.
- **A test you could not finish is worth retrying when the plumbing changes (13 Sep, v2.6.99).** The 12 Sep attempt to prove online board delivery failed on the lobby handshake and had to ship as "read, not run". Building this feature required driving that same handshake correctly, which incidentally produced the proof. Leaving the caveat visible in the handoff doc is what made it obvious to go back and close it.

**v2.6.98 (12 Sep 2026, THE BOTS CAN SEE THE TABLE):**
- **A partially restored channel produces a confident-looking wrong measurement (12 Sep, v2.6.98).** v2.6.95 restored log/say/chat/fx and scoped board out as "a bigger payload, flag it as follow-up". The result played convincingly: bots bled, blocked, announced, passed — and were blind to every other seat, so their targeting and threat reads ran on nothing. Had the session gone to testing there, the test would have measured card play and been read as decision quality. When restoring a broken channel in stages, write down what each stage still cannot do, and say so before anyone tests on it.
- **Scope a deferral by what it disables, not by its payload size (12 Sep, v2.6.98).** Board was deferred for being heavy. The right question was what reads it: three separate behaviours, one of them a feature the user had specifically asked for in July. Cost of sending is the wrong axis; cost of NOT sending is the right one.
- **A new producer needs the joiner's catch-up too (12 Sep, v2.6.98).** The server does two things with boards: broadcast each push AND hand a joiner every existing pub. Mirroring only the broadcast leaves every bot blind until the human's first action, which at a hotseat can be a whole turn. When copying a server behaviour, copy the seeding as well as the streaming.

**v2.6.97 (12 Sep 2026, THE REFEREE VERBS REACH THE BOT):**
- **A rule can hold for one layer of a feature and silently lapse in another (12 Sep, v2.6.97).** "Any player may control a bot seat's elements" was true for every CARD verb and false for every SEAT-level one, and nothing in the code marked the boundary — the card menu checks the roster `bot` flag, the pool path never asks. When auditing whether a stated rule still holds, enumerate the layers the rule should cover rather than checking the first place it appears.
- **Writing to a projection of state that its OWNER republishes is a no-op with a delay (12 Sep, v2.6.97).** `hostSetPoolHot` wrote the stored pub; the bot owns `this.pool` and pushes it on every action, so the edit looked applied and then evaporated seconds later. That delay is what makes the class nasty: the immediate feedback is correct, so nothing looks broken until the owner next speaks. Whenever a local edit targets state some other process authors, the edit has to travel to the author — the same shape as the missing log fan-out one version earlier, and the second time today that the receiver already existed and only the sender was missing.
- **When a value change has a side effect at the boundary, route the boundary case through the path that owns it (12 Sep, v2.6.97).** `forceSetPool(0)` makes the bot oust itself (its own clamp-and-oust), which would have skipped the predator's bounty and the roster flag. Sending `forceOust` through the full oust path instead keeps one owner for the bookkeeping. The general form: if setting a value to N triggers a state transition elsewhere, do not send the value — invoke the transition.

**v2.6.95-96 (12 Sep 2026, THE HOTSEAT BUS + THE VISIBLE HOLD):**
- **Offline parity is about the TOPOLOGY, not just the handlers (12 Sep, v2.6.95).** hotBridge routed every message shape correctly and still produced a broken game, because online the SERVER is a broadcast bus and the bridge was a star: client<->bot only, never bot<->bot, and never human-log->bot. Everything looked wired; nothing was connected. When mirroring a networked feature locally, check what the SERVER does for the players, not only what each endpoint sends and receives. The tell: a feature that works online and silently does nothing offline, with no error anywhere.
- **A silent channel is worse than a missing one (12 Sep, v2.6.95).** The bots open by advertising `"bleed N"` / `"@Name bleed N"`, and offline `#chatRow` was hidden, so the very first thing a new player reads is an instruction they cannot follow. Worse, the send handler cleared the input and dropped the text when not `inRoom()` — a false confirmation. Any instruction text a component emits is a CONTRACT the host has to honour in every mode that component runs in.
- **Restoring a contract exposes whatever was hiding behind its absence (12 Sep, v2.6.95).** With the bus live, a 2-bot game deadlocked in round 3: the bot filters `players[].bot` in `_holdHook` ("bots never operate the hold") but NOT in the ask-window pause, so one bot parked another's undirected window forever. The fix belongs in the bot; the bus filters a bot's "Hold on…" until it lands there. Expect a batch of latent partner bugs the first time a dormant path starts carrying traffic — and soak for several rounds, because this one only appeared on round 3.
- **Measure the harness before believing the failure (12 Sep, v2.6.95).** A soak stalled at round 5 on BOTH the new and the pre-change client — same signature, `_ask` null, `_acting` false. It was the harness: the real `hotRunBotTurns` waits 900 ms after each pass, and without it the `turn` message arrives while the bot is still `_acting`, where the bot's own guard drops it with nothing to retrigger. Reproducing against the PREVIOUS build is the cheapest way to tell "I broke it" from "it was always so" — and the dropped-turn race is real, just masked by that beat.
- **An unbounded wait needs a visible state (12 Sep, v2.6.96).** `_pace()` is `while(_holdBy.size) await sleep(150)` and `hotRunBotTurns` awaits the pass with no ceiling, so a forgotten "Hold on…" stopped the table dead with NOTHING on screen — and v0.6.106's anti-flood gate means no bot even announces it unless one is on turn. Also: the bot keys holds by NAME, so at a hotseat, where the device moves between humans, Bob literally could not release Alice's hold. Any state that can block progress indefinitely needs (a) a visible indicator and (b) a release the CURRENT operator can reach, whoever created it.
- **A visual written for one content source will break on the next one (12 Sep, v2.6.96).** The say bubble's fixed 3 s (and its `white-space:nowrap`, fixed one version earlier) were both correct for `"Block!"` and wrong the moment bot chat sent 110-character instructions through the same component — two in the same millisecond. Same root as the nowrap spill: when a component gains a new producer, re-check every constant that was tuned for the old one.

**v2.6.94 (12 Sep 2026, THE SAY BUBBLE CLAMP):**
- **`white-space:nowrap` on a container with no max-width is a spill guarantee once content arrives that isn't a single word (12 Sep, v2.6.94).** The say-bubble was designed for short quick-phrases ('Block!', 'Pass') that are inherently single-line; when chat bubbles landed (v2.6.50) and then bot chat (v2.6.60+), the same CSS tried to hold a 120-char sentence on one line in 58px Cinzel. The JS guard (120-char clamp in `chatBubble`) was not enough — 120 chars at that font size on a 1366px viewport still overflows. The fix is CSS-only: drop `nowrap`, add `max-width:min(92vw,92%)` + `overflow-wrap:break-word`, and `clamp()` the font-size so it scales with the viewport. Rule: when a container that was `nowrap` starts receiving content from a new source, revisit the overflow assumption.

**v2.6.93 (12 Sep 2026, THE BOT LOCK):**
- **A select's `.disabled` does the gating — no need to remove the listener or guard the start path (12 Sep, v2.6.93).** When bots are present, `syncOffBotLock` sets `.disabled=true` on the Board and Helpers selects; their change listeners still exist but cannot fire. `startOfflineFromCfg` reads the select values as always, so the forced 'structured' / 'all' IS what the table starts with — no extra branch needed. The converse: when unlocking, restoring the `.value` before setting `.disabled=false` avoids a flicker where the re-enabled select shows the forced value for one frame.
- **A snapshot must be idempotent: don't overwrite the pre-override value with the override (12 Sep, v2.6.93).** `if(!board._preBotVal) board._preBotVal = board.value` — the guard ensures a second `syncOffBotLock` call (from a second bot being added) does not replace the player's original 'classic' with the already-forced 'structured'. Same pattern as `hotTournBefore` from v2.6.92 (if null → set, else keep).

**v2.6.92 (12 Sep 2026, THE TOURNAMENT OVERRIDE IS A SESSION):**
- **'Session-only, no saveConv' is not a session unless something writes the value BACK (12 Sep, v2.6.92).** `conv` is saved whole: a session override of one key stays in memory after the table closes, and the next `saveConv()` from anywhere (a Settings toggle, a mode switch, the welcome bubble) persists it as the player's preference. `helperAllOn` was done right in v2.6.51 (a separate flag, reset on leave); `conv.tournament` was written straight into the persisted object and never restored. Rule: a table-scoped override of a persisted key is a PAIR -- snapshot+set on entry (`hotTournSession`), restore on leave (`hotTournRestore`) -- and a deliberate edit of that key during the table updates the snapshot, or the restore undoes the player's choice.
- **A derived label is a leak detector (12 Sep, v2.6.92).** The v2.6.91 '(custom)' tag compares live state against defaults; the first thing it would have flagged in real use was not a preference but a leaked session value. When a new invariant check lands, ask what it will report in the ordinary flows before the users do -- the header made a three-week-old bug visible in one read of the code.
- **Sibling drift again: the resume path (12 Sep, v2.6.92).** The fresh Classic tutorial set tournament mode; the two `tutGameResume` paths did not (they relied on the leaked value from the fresh run). Fixing the fresh path alone would have broken the resumed one silently. The suite now counts the bare writes (5) so a sixth cannot slip in unnoticed.

**v2.6.91 (11 Sep 2026, THE SETTINGS HEADER + THE 1v1 FIND):**
- **A handler that writes state but never re-derives the UI is a stale-state bug waiting for the other click order (11 Sep, v2.6.91).** The offline deck dropdown set `offlineCfg[i].deckIdx` and stopped; only a full `renderOfflineSeats()` re-synced Start. Deck-then-bot worked (the toggle re-renders), bot-then-deck did not. The tell for this class: a feature that works in one click order and not another. Rule: every edit of a config row goes through ONE function that writes AND re-syncs (`offlineSeatSet`), and the sync function returns what it painted so the suite can read it without a DOM. Sibling of the innerHTML-listener class: state and its derived view drift apart at exactly one path.
- **A live reset is the UNION of the change handlers (11 Sep, v2.6.91).** Every Settings control has its own change handler with its own apply call (animMode, applyPco, applyTouchUI, applyHelper, rebuildKeymap, the edge token, loadCardDB…). A reset that only assigns and saves leaves the table painted with the old values until a reload — which is exactly what `importSettings` has done all along (it assigns, saves, and re-opens the dialog; half the apply chain never runs). `settingsApplyProfile` is the one place the chain lives now; the import path should call it next.
- **'Defaults for the mode' = the literal + the preset, and nothing else (11 Sep, v2.6.91).** The only per-mode defaults are `UI_PRESET`'s trio; everything else in Settings has one literal default (captured as `CONV_DEFAULTS` BEFORE localStorage is merged into `conv` — the literal is mutated in place at load, so a frozen copy at declaration is the only honest source). And 'reset to the mode's defaults' must not touch the mode's identity keys (uiMode, uiProf, modeHintDone, tutDone, dbDefault): the factory reset under Files & storage does, and needs a reload for it.
- **Compare EFFECTIVE values, not stored shapes (11 Sep, v2.6.91).** `conv.sfxIndiv` is sparse (only channels that differ from 100 are stored; the literal pre-fills three) — `{}` and `{unlock:150,lock:150,logEvent:125}` are the same sound profile. A '(custom)' tag that compared the maps would have flagged a fresh install. Read each channel through the same `?? def` the mixer reads, then compare; numbers with a hair of tolerance (animSpeed steps through `toFixed`).
- **A modal can watch its own controls from one delegated listener (11 Sep, v2.6.91).** input/change/click on `#settingsModal` fire AFTER each control's own handler (target phase before bubble), so the header re-reads finished state without touching ~50 handlers. The one edit that happens OUTSIDE the modal's event tree — a key rebinding via document keydown — is caught in `saveKeys()` instead. Rule: when a derived label depends on many controls, hook the container plus the out-of-tree paths, not every handler.

**v2.6.90 (11 Sep 2026, THE BUBBLE, CLAMPED):**
- **'It runs off the screen' has two meanings — ask which container before choosing the fix (11 Sep, v2.6.90).** v2.6.89 turned the bubble into a banner to keep it inside the card; Johan meant the browser window. The right shape was a fixed-position bubble clamped to the viewport, which needed one non-obvious move: out of the card, because `backdrop-filter` makes an ancestor the containing block for fixed descendants (the same trap as `transform`/`filter`).
- **A whitespace-prefixed closing tag is not unique (11 Sep, v2.6.90).** Searching for `'        </div>\n'` (8 spaces) matched inside the 10-space line first, so the moved block lost its own closer and landed outside `#empty`; the write-after-assert discipline caught it before any file was written. When slicing markup by indentation, search with the preceding newline (`'\n        </div>\n'`) and assert what the NEXT line is after the cut.

**v2.6.89 (11 Sep 2026, DIALOGS FIT THE WINDOW):**
- **A flex child will not shrink unless you say so (11 Sep, v2.6.89).** `.modal` has been a `max-height:84vh` flex column for a long time and every dialog still bled off a laptop screen, because `.mbody` kept its default `min-height:auto` — the cap applied to the container while the body grew to its content and pushed the footer out. `min-height:0` on the scrolling child is the whole fix; it was invisible on tall desktop screens for a year. Rule: every `overflow:auto` child of a capped flex column needs `min-height:0` (or `min-width:0` in a row), and 'test on a laptop' belongs on the browser-check list for any new dialog.
- **An absolutely positioned bubble anchored to a corner escapes the viewport as soon as content grows (11 Sep, v2.6.89).** The ? explainer got two paragraphs longer (Johan's wording) and immediately ran below the fold on a short screen. In-flow beats absolute for anything with variable text; keep absolute for fixed-size decorations (the pill) only.

**v2.6.86 (11 Sep 2026, SETTINGS OVERHAUL):**
- **Restructure markup around ids, never around listeners (11 Sep, v2.6.86).** Nine sections, ~56 rows and ~90 ids moved into a new order with folds, and not one line of wiring changed — because every control keeps its id and the JS only ever addressed ids. The suite pins that (each id exactly once). The corollary for any future move: if a restructure needs a listener change, the markup was addressing something by position, and that is the bug to fix first.
- **A description that carries version history is a changelog, not a description (11 Sep, v2.6.86).** 'on by default since v2.6.74', 'previously tied to Tournament mode' — true, and useless to a player. The rule now enforced by a test: one line ≤ 100 characters that says the effect; history goes to the changelog, explanation goes to the row's tooltip.

**v2.6.83 / srv-2.6.35 (11 Sep 2026, PER-ROOM REFEREE):**
- **When the user's misreading of a feature is a better design than the feature, build the misreading (11 Sep, v2.6.83).** Johan assumed 'Referee password' in Create game set the room's referee — it was the server's operator key. His model is the one tournaments actually run on (the organiser knows the tables; one password can cover several), needs no operator, and scopes powers to a table. The operator key survives only as an ops tool for `--create-policy admin`, renamed 'Server referee key' and buried in the Local server fold.
- **'Spectators may only chat' was a dispatch wall, not a permission check — and a role that is 'a spectator with host powers' has to be routed, not just gated (11 Sep, v2.6.83).** Adding `conn.ref` to the 15 host gates would have done nothing: watcher connections never reached `GAME_HANDLERS`. The fix is a whitelist (`REF_VERBS`) in the watcher branch plus a pseudo-p, and the suite proves it from both sides (the referee mutes; the plain spectator still hears 'only chat'; the referee's `draw` is refused). Rule: for a new role, trace the message from socket to handler and list every wall on the way.
- **A never-deployed wire field can simply be removed (11 Sep, v2.6.83).** srv-2.6.34's server-level `roomList.ref` lived one day in the outputs folder; replacing it with the per-room `rooms[].ref` before any deploy avoids carrying two meanings of one key. Check the deploy state before deciding whether a change is additive-only.

**v2.6.82 (11 Sep 2026, THE LIST REQUEST'S KEY):**
- **Automating a request means auditing every field it silently carries (11 Sep, v2.6.82).** The room-list hello had always sent whatever sat in the admin field; harmless while a human clicked List rooms, but v2.6.80 fires it on every Join open and moved the create-side field into a fold where a stale value is invisible. One wrong key there = one IP strike per open, and the throttle would have locked out an innocent player. A credential rides a request only when the UI that asked for it is the one that is showing. (Second instance of the v2.6.76 lesson 'an auto version inherits the manual path's latent bugs at a higher rate' — this one caught in self-review, not in the wild.)

**v2.6.80 / srv-2.6.34 (11 Sep 2026, CREATE / JOIN IN FULL + REFEREE):**
- **When a 'simple mode' turns out well, promote its structure to the full mode instead of keeping two dialogs (11 Sep, v2.6.80).** Lite's Create/Join halves were built as a Lite-only skin; a week later Johan wanted the same clarity in Full. Because the halves were classes on ONE dialog, promoting them meant dropping the `body.lite` prefix from two CSS rules and adding a second fold — the Lite skin became the design. Rule of thumb: build a simplified surface as a *subset* of the full one (classes hide, never a copy), so the day it wins it can simply become the default.
- **A folded field is a hidden field to the tutorial (11 Sep, v2.6.80).** The v2.6.52 audit test ('every $(#id) step target exists in the DOM') stays green when a target is behind a closed fold, because the element exists — the spotlight would just point at nothing. Every step that targets a folded field now opens the fold in `onEnter` via `mpFold`, and a suite test pins that the two online chapters call `mpFold`/`mpSetFlavor` and target only ids that live in the half they opened. The audit must follow the new structure whenever one is introduced.
- **Name roles by what the player experiences, keep the wire as it was (11 Sep, v2.6.80).** 'Admin password' meant nothing to a tournament judge; 'Join as referee' (watch with host powers) does. The client and the CLI (`--referee-pass`) say referee, the protocol's `admin` key is untouched — old servers and old clients keep working, and the protocol doc records the aliasing once.

**v2.6.79 (11 Sep 2026, THE LOBBY IS A LOBBY):**
- **'Idle' is a derived state — derive it in the ONE place layout already runs, and mirror it in JS, not in the DOM (11 Sep, v2.6.79).** Hiding in-game chrome at the start screen wanted a definition (empty table, no hotseat, no room) and a moment. Both already existed: `layout()` runs on every state change and `syncWelcome()` at every return to L0, so `syncIdleUI()` there covers boot, leave, resume and solo-load without a single new call site. The applied state lives in `_idleUI` because the harness's classList is write-only — reading `classList.contains` back would have made the rule untestable and, under the stubs, fire a resize on every layout.

**v2.6.78 / srv-2.6.33 (10 Sep 2026, FULL TABLES TAGGED):**
- **A simplified mode must never hide the shared world — tag, sort, never filter (10 Sep, v2.6.78).** The obvious Lite answer ("only list Lite-shaped rooms") would have shown Lite players an empty server while Full players were at the tables, and split the one player base Lite exists to grow. Tagging the deviation and sorting the fitting tables first keeps every table one click away and still spares the newcomer the surprise. The information had to come from the server (the list carried no board/helpers) — a two-key additive wire change, cheaper than any client-side guess.
- **'Deviates from the mode' is about EFFECT on the player, not about the create-time option (10 Sep, v2.6.78).** A 'local' helper policy looks unlike Lite's 'tournament' choice, but under it the Lite player's own tournament setting applies — nothing changes on their screen. Only 'all' forces helpers on everyone. Tagging by effect keeps the tags rare and therefore meaningful.

**v2.6.77 (10 Sep 2026, THE ? EXPLAINER):**
- **A one-time hint needs a permanent way back (10 Sep, v2.6.77).** The first-visit bubble explained Lite once and vanished with 'Got it'; anyone who clicked past it — or arrived in Full — had no way to read it again. Johan's `?` beside the pill turns the same bubble into an on-demand explainer, and the first-visit text shrinks to a welcome (his wording) with a link into the fuller one. Rule: onboarding copy is two things, a greeting you see once and a reference you can always reopen; do not make one bubble do both.

**v2.6.76 (9 Sep 2026, CACHE-FIRST CATALOG):**
- **Flipping a feature on by default multiplies its cost by the user base — re-read the fetch policy the day you flip it (9 Sep, v2.6.76).** The catalog's 'Auto-sync every start' was written for opt-in users; the moment v2.6.74 made the database default-on, every client everywhere would have pulled 3 MB from a volunteer-run KRCG on every boot. Johan's framing is the durable one: *"the load always lands on somebody"* — cache-first with a weekly freshness window keeps new sets flowing at one fetch per client per week. Rule: a default flip is also a review of every network call behind it.
- **An 'auto' version of a manual action inherits the manual action's latent bugs at a higher rate (9 Sep, v2.6.76).** Auto-listing rooms on Join replays exactly what List rooms does — including replacing a half-open rejoin socket during a reconnect, which nobody hit by hand because nobody clicks that button in the two-second window. Automate, then re-audit the states the manual path could reach.

**v2.6.75 (9 Sep 2026, TUTORIAL = FULL):**
- **A "presentation-only" mode override is a half-measure that produces a third state nobody designed (9 Sep, v2.6.75).** v2.6.74's lift showed Lite players the Full buttons for the tutorial but left Lite's trio (no animations, no colours) in force, so the tutorial described a clone "pulsing centre-screen" that never appeared. Johan's read was the right one: the tutorial IS the original client, so opening it performs a real `uiSetMode('full')` and the player simply stays in Full (one line in `openTutorial`, minus three lift sites and a flag). When a feature belongs to one mode, switch modes; do not invent an in-between where the state says one thing and the screen another. The v2.6.74 lesson below about auditing what points at hidden buttons still stands — the answer is just "switch", not "lift".

**v2.6.74 (9 Sep 2026, LITE MODE):**
- **A "lighter variant" is a mode, never a sister file (9 Sep, v2.6.74).** The pull to fork a Lite HTML was real ("just strip the file down"), and it would have recreated the exact parallel-lineage pain the merge had ended a week earlier: every fix twice, tooling keyed on ONE client (split/build/B1, harness, check-versions, one-file deploy), drift within days. A body class (`body.lite`) plus CSS that hides ENTRY POINTS, with JS gates (`uiLite()`) as belt-and-braces behind them, gave the whole Lite surface in ~200 lines — and Full is untouched by construction because every Lite rule is scoped to the class. Rule: differentiate presentation by state, not by file.
- **A UI mode that hides buttons must audit what else points at those buttons — and the cheap answer can be to LIFT the mode, not to fork the pointers (9 Sep, v2.6.74).** The tutorial spotlights Deck Lab, Play offline, the Play-online dialog's Server address — exactly what Lite hides; trimming chapters per mode would have doubled the tutorial. Instead the tutorial runs LIFTED (`_uiLift`: `uiMode()` reports 'full', `conv.uiMode` untouched) from BOTH launch sites (tutLaunch and tutStart — the resume/chained paths bypass tutLaunch) and drops the lift in the ONE teardown (tutEnd). A test asserts the lift at all three points and that the hidden ids are still tutorial targets, so the lift cannot quietly become decorative.
- **Defaults that change the DEFAULT visitor's first screen need a 'fresh install' detector that existing users cannot trip (9 Sep, v2.6.74).** `saveConv` writes the whole object, so every existing player has a stored `elysium.convenience`; the first-run rule keys on `getItem(KEY)===null` (never saved), so "first visit → Lite" cannot move a single existing player, while a one-time migration (`dbDefault`) keys on the ABSENCE of its own flag so it fires exactly once for old objects and never again after the next save. Two different questions ("never been here" vs "predates this flag"), two different detectors — a boolean on the stored object answers the second, its existence answers the first.
- **Turning a network-backed feature ON by default changes what every harness boot does (9 Sep, v2.6.74).** With `cardDB:true` the client's boot reached `fetch('https://static.krcg.org/data/vtes.json')` under Node 22's real fetch — invisible here (egress off → rejection → the existing fallback), but on a networked machine every `loadClient` would have downloaded 3 MB mid-suite and raced the mini-DB tests. The harness now SHADOWS `fetch` with a rejecting stub (injected as a Function parameter, so the global is never touched). Corollary: when a default flips, grep the boot path for I/O the harness silently inherited from the runtime.
- **Per-mode settings are a small map, not a second settings object (9 Sep, v2.6.74).** "Animations and colours off by default in Lite" could have meant a one-shot preset (clobbers the player's later tweaks) or a parallel conv (twice the surface). The middle: remember the three affected keys per mode (`conv.uiProf[from]` on leave, restore `[to]` or its preset on enter). Ten lines, and neither mode can ever overwrite what the player set in the other.
- **A default that the server enforces is a policy change, name it as one (9 Sep, v2.6.74).** Tournament lock checked by default reads as a checkbox tweak, but the server enforces 12+/60–90 and refuses New deal in every locked room — so every DEFAULT room now carries those rules. Johan chose it knowingly because the question was put as a consequence, not as a checkbox.

**v2.6.72 (9 Sep 2026):**
- **Living docs need a cutoff policy, not just a size cap (9 Sep).** Project knowledge hit ~98%: context and learnings had grown to 442 + 515 kB, two-thirds of it June–July history that newer state had superseded. The cut that loses nothing: keep everything from the launch week (24 July) and every timeless reference section verbatim; reduce older per-version sections to a TITLE-ONLY index (the bold rule sentences carry the value); move the full text to dated archive files kept beside the project. 957 → 325 kB. Recipes (a 56 kB "bot-harness recipe") do not belong in learnings at all — SKILLS-arena is their home.
- **open('w') truncates BEFORE the write can fail — never write a living document in place (9 Sep, v2.6.72).** A Python string carrying a surrogate pair (`\ud83e\udd16` instead of `\U0001F916`) raised UnicodeEncodeError inside the write; by then `open('w')` had already emptied the session journal, and the 2 kB remnant reached outputs before anyone looked. Rebuilt exactly from the two intact source journals. Rule: write to a temp file and `os.replace()` it over the target, and grep the entry count after every doc round (a journal with one header is a red flag, not a fresh file).
- **"Every X, ascending" is a special case that only looks like the rule (9 Sep, v2.6.72).** The bot sweep ran every bot seat in seat order after each human pass — correct for the one configuration ever tested (a lone human at seat 1) and wrong for every other (a bot at seat 1 played out of place; two humans replayed every bot per pass). The general rule was always "the seats strictly between this human and the next, around the circle"; the special case was the accident of the test table. When a feature ships tested on one seating, write the range form anyway — it costs a helper.
- **A UI gate needs its tutorial audit (9 Sep, v2.6.72).** Disabling Start until decks are chosen could strand any tutorial step that spotlights Start; the audit (all three chapters pass through Fill the table first) took one grep and belongs in the same commit as the gate.

**Merge round (9 Sep 2026):**
- **Measure the merge before doing it.** A dry run of the incoming patch chain against the other lineage's files (count each anchor: 1 = auto, else hand) turned "how bad is the merge?" into a number — 34 of 45 automatic, the rest exactly the designed VERSION/tail/header anchors — before a single byte was written. Rebase the smaller-context delta onto the larger-context base, never the reverse.
- **A green harness proof narrows the field; it does not close it.** The hotseat Hold on path was proven bot-side in the harness, which is precisely what told us the remaining candidates were things DOM stubs cannot see (a paint throw eating the relay) or tuning (askSecs 2). Order sensitive side effects "wire before picture" so a presentation miss can never swallow a protocol act.
- **Three brains is the disease, not the bots.** Every "sibling" bug in the bot track (unc vs uncontrolled, boardMode, MAX_PILE) was the same bug: a second implementation of game rules mirroring the first by hand. The cure is structural (one shared core), and the plan for it is its own document so it can start a fresh chat cold.
**B-63 round (11 Aug 2026):**
- **`|0` is not a safe integer coercion for timestamps.** The dump design spec said "coerce t|0" — but `|0` is int32 arithmetic: a ms epoch (~1.7e12) wraps NEGATIVE, and a multi-day `uptimeMs` (>~24.8 days) wraps too. Wrote `dInt()` (`Math.floor(+v)` + `Number.isFinite` guard) instead and unit-tested the exact case (`uptimeMs:3600000000` survives whole). Rule: `|0` only for values PROVEN small (seat indexes, counts); anything time-shaped gets dInt.
- **A degrade ladder needs its FLAGS whitelisted too.** The spec's §5 server whitelist listed the dump fields but not `dumpTrunc`/`dumpErr` — the client's honesty markers would have died at intake, making a truncated report indistinguishable from a dump-less one. When a protocol grows self-describing flags, grep the whitelist for them explicitly.
- **Snapshot drift applies to the HARNESS, not just the main files.** The project-snapshot `elysium-test-harness.js` predated the v2.6.57 suite (deckUnknownNames/deckUnknownText exposes missing), so pristine-suite-vs-pristine-client CRASHED — the destructive-verification run caught it before any B-63 code was suspected. The suite's own fail-loud guard (`throw` at line 717 when an expose is absent) is what made the drift visible instead of silent; keep writing those guards. Corollary: destructive verification doubles as a snapshot-consistency check — run it even when "nothing changed" in the area.
- **Suite-order coupling in assertions:** an earlier client test feeds `processCardData` a mini-DB, so `db.loaded` is TRUE by the time the buildDump test runs. Assert CONSISTENCY (`loaded === cards>0`), not absolute state, unless the test resets the world itself.
- **Client-side privacy filters must be stated honestly server-side.** The opponent-face-down-stub rule (T4) is enforced at capture because hotseat's buildPub shares names between local seats — the server CANNOT verify it. The manifest and protocol now both carry the honest sentence: the server never invents the field, a modified client could lie, the threat model already covers open-data clients.
- **Same-origin injected scripts land in YOUR error log — filter at the notice, not at the intake (8 Sep, v2.6.64).** Cloudflare's `/cdn-cgi/` scripts (beacon, challenge platform, Rocket Loader) are same-origin, so their exceptions arrive with full messages through window.onerror and look like ours — minified names (`t.entries.at`) are the tell, and `.src` on the row is the proof. Keep logging them (cheap, and `.src` makes them obvious with jq) but never alarm the player over them; the crash notice skips `Script error.` and `/cdn-cgi/` sources. Corollary: a foreign crash can still expose OUR gap — the missing `.at` would have taken us down on the first card draw; census every modern API the client uses whenever telemetry shows an old browser.
- **A browser that cannot PARSE the main script runs none of it — including the crash hooks — so the "expected crash" notice must live in a separate ES5 script (8 Sep, v2.6.64).** Syntax (optional chaining, class fields) cannot be polyfilled; the only signal is absence: the main script raises `window.__elysiumBooted` as its LAST statement and an ES5 guard in head shows a plain notice if it has not appeared after 6 s. Two hard-won details: the guard tag must carry an attribute (`id="legacyGuard"`) because split_client.py, elysium-build.js and the harness all key on the ONE attribute-less script tag — and the harness regex will happily match that tag spelled out inside a code COMMENT, so never write it literally in the guard.
- **A test double that discards writes hides a whole class of behaviour (8 Sep, v2.6.64).** The harness window Proxy's `set(){return true}` swallowed every assignment, so `window.__elysiumBooted=true` read back as a stub and the boot-flag test failed for a reason that did not exist in browsers. Doubles should model the real object's persistence unless a test needs otherwise; all six existing `window.x=` writes in the client were fine with the faithful trap.
- **Synthetic events dispatched FOR other listeners are heard by your OWN listeners too — flag them (19 Aug, v2.6.63).** cancelSingles() dispatched real pointercancel events so the felt-pan mirror and pile-drag cleanups would tear down (the v2.5.39 learning) — and the pinch tracker's own document-capture end() swallowed them, emptying pts at the exact moment of activation. Ten live iPad crashes, latent since v2.5.41, invisible to Pixel testing because only L3-on-touch exercises the path. Rule: a synthetic event intended for specific listeners carries a marker (`ev._synth=1`) and every listener in the SAME module that must not react checks it. Corollary: the alternating a[0].x/a[1].x 1:1 ratio in the digest was itself the diagnostic — crash-pair symmetry is a state-machine cycle signature, read it as such.
- **Kill a null-crash class at the SINK when the callers are many and the occurrences few (19 Aug, v2.6.63).** One live Firefox row ("can't access property replace, s is null") against a dozen escapeHtml callers: hardening the sink (String(s==null?'':s)) removes the whole class in one line, where caller-guessing would be grep-and-patch. The sink fix does not FIND the null's origin — if the raw row's stack points somewhere interesting, the upstream question stays open.
- **When the field set is CLIENT-defined and growing, whitelist the SHAPE, not the names (11 Aug, srv-2.6.30).** dump.env.settings mirrors conv, and conv gains keys every few versions — a name list on the server would silently drop every new setting until someone remembered to sync it (the serialize/restore drift class, on the wire). The contract became types and sizes instead: key pattern, scalar-only values, per-value caps, entry cap. Same nothing-unvetted-reaches-disk guarantee, zero sync burden. Name lists remain right where the server OWNS the schema (summary, board entries); shape lists where the client does.
- **HTML entities in authored strings are a latent mojibake bomb — the consumer decides, and consumers change (11 Aug, v2.6.61).** The tutorial chapter picker renders `desc` through `esc()` (correct for authored data), so `desc:'host&rsquo;s lobby controls'` double-escaped and the player read the raw entity — while the SAME entity in step text (innerHTML) rendered fine. Rule: authored JS strings must hold REAL characters; entities belong only in raw static HTML. Corollary for audits: the first manual grep found two of three carriers — the field-shaped sweep regex (`(?:name|desc):\s*'[^']*&[a-z]+;`) found the third; when a bug class is defined by a DATA SHAPE, audit with a shape-matching expression, not with the example string that surfaced it.
- **A delivery that lands one message before a bigger idea gets orphaned.** Digest v1.1 shipped 8 Aug with scp instructions as the direct answer to Johan's own morning question — and his NEXT message in the same chat was the thought that became B-63; the deploy step vanished in its shadow. The design spec's §0.3 open question ("did Johan scp v1.1?") is what surfaced it three days later, and the transcript search recovered the code verbatim. Rules distilled: track deploy-state PER ARTIFACT (delivered ≠ deployed), keep uncertainty questions alive across sessions until answered, and when a lost delivery resurfaces, recover it from the transcript rather than rebuilding from a one-line description — v1.1's ring render would have silently broken on v2.6.60's {t,m} entries, a detail only the verbatim code + the new wire shape together could reveal.


**A split fragment's tail is part of the build contract (8 Aug, v2.6.59):** split_client.py fingerprints each fragment's edges — hotseat.js must end with ");" — so inserting the bridge at the block's end tripped the assert, and the failed split had already cleared the fragment dir, cascading into a stale-fragment byte-diff at the VERSION line that pointed AWAY from the real cause. Two lessons in one: (a) when inserting at a fragment boundary, end with the fingerprinted shape — and make the appeasement honest (a real load-time `hotBridge.reset([]);`, not a decoy); (b) a trailing comment AFTER the `);` becomes the fragment's actual tail — rstrip strips whitespace, not comments — so the fingerprint comment must sit ABOVE the line it explains. The B1 gate caught all of it before delivery, which is exactly its job.

**Mirror a protocol from the SERVER's emissions, never from one observed message — and when one field bug appears, audit the whole class (8 Aug, v2.6.69):** the drew zone bug ('unc' — the DEALT field name — where the bot's handler matches the ZONE value 'uncontrolled') came from mirroring half-read shapes; Johan's sweep ask turned it into a full field audit: every bridge-synthesized message's fields versus the bot's handler reads (regex over each handler body) versus the server's actual emission sites. The audit acquitted drew/dealt/lobby/turn/deckok and startPool, and convicted exactly one sibling — joined.boardMode, a field the bot reads (classic flips its whole deal expectation) that the bridge never sent while startFor always dealt the Structured 4. The durable rule: a bridge that plays a server's role earns each message shape by READING the server's send site, and a found field bug is a class instruction, not an incident.

**Two classic scripts on one page share ONE global lexical scope — armor library files in an IIFE (8 Aug, bot v0.6.97):** Johan's client-page spawn failure survived every gate because no gate shared a page: the diag page was clean, the vm sandbox barren, and the suite require()s the bot into module scope. On the real client page, the bot's top-level `const net` met the client's own `const net` (line 2151; `SAY` collides too) and the whole second script died with a SyntaxError BEFORE its first line — while the script element still fired `load` (load = fetched, not error-free) and file:// muted the error past a filename-filtered capture. Three durable rules: (1) any file that will ever ride a <script> tag into a shared page wraps its ENTIRE body in an IIFE — two inserted lines, body byte-untouched, the only exported name chosen deliberately; (2) the regression guard must RECREATE the collision (a sandbox pre-declaring the page's real names), not merely load in isolation; (3) when a user's failure defies the prime hypothesis, ask for THEIR file — Johan's upload was byte-identical to the delivery, which killed the stale-file theory in one cmp and forced the real class into view.

**Search the phrase before building the behavior — a feature can already half-exist (8 Aug, v0.6.95):** "Hold on…" turned out to live on both sides with its own button and SFX, and the ask-window pause (pausedBy) had worked for months — only the general hold was missing. Finding the existing half changed the design from invention to MIRRORING: the new hold uses the same engage/release grammar the table already speaks, the same self-releasing shape that keeps bot thinking-announces deadlock-free, and one insight fell straight out of the discovery (bots SAY the pause phrase, so the trigger must be human-only via the roster flag). Corollary, now three times proven (75b, 76a, 76d/e): **negative assertions in destructively-verified sections must depend on the mechanism's existence** (typeof-check the new hook), or pristine code turns them trivially green and the "exactly the new set fails" claim quietly rots.

**Enumerate a wire contract at the CHOKE POINT, never at the call sites (8 Aug, HB2a):** the bot's board verb is born inside _drain — a queued `{__board:true}` sentinel becomes `{t:'board', pub: buildPub()}` at flush — so no literal `t:'board'` exists anywhere a call-site grep can see, and my published "18 sent verbs" was wrong (it is 19). The inbound side failed the same way twice over: indent-pattern regexes produced both false positives (library/crypt — fields of the deck-upload object) and misses (fx, forceOust). The ground truths are structural: outbound = every path into the single ws.send (the drain flush + the connect raw send); inbound = `Object.keys(b._handlers)` at runtime, one node -e away. A contract that a bridge will be BUILT against deserves the runtime enumeration, not the regex approximation — and when a published claim turns out wrong, the correction lives in a NEW journal entry while the old one stands as history.

**A diagnostic page should ship with its own headless smoke, run in the very sandbox that gates the code (8 Aug, HB1):** the spike page's battery lives DOM-free between explicit /*MARKERS*/ with the DOM glue separated behind a typeof-document guard, so diag-hb1-smoke.js can extract the SAME eleven tests and run them in the 75d no-Node sandbox before any browser opens the page. The division of labor becomes clean and honest: the smoke pre-verifies everything environment-independent, so a real browser can only disagree about genuinely browser-specific facts (script-tag loading, fetch/CORS, real timer clamping) — which is precisely the residue the spike exists to measure. Corollary from the same round: skips must count as FAILURES in the smoke (it supplies the database from disk, so nothing may skip there) while the same skip is an honest environment note in the browser (file:// cannot fetch) — one battery, two correct verdict policies.

**A vm sandbox with zero Node globals is a cheap, honest browser gate (8 Aug, bot v0.6.94):** the HB0 pattern — builtins become edge-only constants behind an IS_NODE ternary, typeof guards on require.main/module.exports, and then the SUITE loads the raw source in `vm.createContext({console, timers})` and constructs the real class through the injected seams (transport dial, cardfxData). Against the pristine file the gate names the exact blocker ("require is not defined"); against any FUTURE edit it will catch a Node-ism the moment it leaks into the core. Sibling of the format-battery principle: prove an environment claim by RUNNING in the environment, not by grepping for it. Corollary worth keeping: the seams that make a file browser-loadable (inject the transport, inject the data, guard the edges) are the same seams that make it deeply testable — the browser gate cost eleven asserts precisely because the injection points already carried the whole handshake.

**A contract guard inside the test file turns snapshot drift into a one-line diagnosis (8 Aug):** the project's harness copy had silently missed the v2.6.57 delivery, and the client suite's own hard guard — `throw new Error('deckUnknownNames/deckUnknownText not exposed (harness needs updating)')` — named the stale FILE and the missing NAMES before a single assertion ran. When a delivered round spans suite+harness+client, let the suite assert the harness contract explicitly: the check-versions family gates version STRINGS, but only a named in-suite guard gates the exposure SURFACE. Restoration, not invention: the test defined the contract, so the two-line repair carried zero guesswork.

**A setting that silently accretes a second job ends up lying in its own hint (7 Aug, v2.6.58):** "Tournament mode — turn all helpers off" was the toggle's whole self-description, yet since v2.6.55 it also hard-gated deck imports — invisible in the hint, discoverable only by hitting the refusal. Johan's rename request was really a split request: name settings for what they DO (Legal deck only / Legal cards only), and when splitting a live toggle, MIGRATE the effective state — seed the new switches from the old value so nobody's behavior changes at the upgrade (loadConv's fx/pcoHome migrations were the house pattern to copy). Suite corollary: the harness's live conv is mutated by earlier tests, so DEFAULTS are asserted off a fresh loadClient, never off end-of-suite state.

**A count gate can be satisfied by the very corruption it guards (7 Aug, v2.6.57):** the "9 times out of 10…" description line became a 9x ghost card and landed the deck at 12/72 — INSIDE the 60–90 band — so the legality gate passed BECAUSE of the ghost, not despite it. Gates that read aggregates (counts, sizes, sums) need a companion that reads identities whenever the input pipeline can inject entries. And an informative surface (the receipt's "1 unknown name", the Deck Lab ⚠) is not a guard: if the flow proceeds regardless, the corruption ships.

**A structural format rule beats a content heuristic, and the battery is the proof (7 Aug, v2.6.57):** "both section headers present ⇒ pre-header qty-lines are prose" is a rule about the FORMAT, verifiable against a format battery in minutes; "names longer than X are prose" is a guess about CONTENT, unverifiable without vtes.json on disk, and exactly the protective-cap anti-pattern that already bit at the 30-qty cap. When hardening a parser, prefer invariants of the format family over statistics of the payload — and run the battery BEFORE building, so the design is measured rather than argued. And the fixture is not the finish line: run the REAL trigger file through the shipped build — Tim's 28 preamble skips buried the ghost line under the receipt's 12-line sample cap, a UX gap no compact fixture could show (preamble lines now list first). Bonus fact worth keeping: because decks are stored as TEXT and re-parsed by every consumer, a parser fix retro-heals every saved deck for free.

**An affordance reachable only THROUGH a bug is a hard dependency on that bug (7 Aug, v2.6.56):** the roomBar's 📋 invite sits under the modal backdrop (z 20000) — the only way to reach the invite link while the lobby was up was to accidentally dismiss the lobby, i.e. exactly the bug being removed. Making the lobby dismiss-proof WITHOUT first moving an invite button into the lobby would have severed the whole invitation flow. The rule: before removing a "misbehaviour", inventory what users actually REACH via it — walk the affordances that are only accessible in the state the bug creates, and move them in first.

**Sibling drift is cured structurally by ONE pure decision function, not by grep (7 Aug, v2.6.56):** Esc got the lobby-aware rungs in v2.5.73; the backdrop click — the same semantic gesture — never did, and the drift lived for 13 versions across two protocol families. The grep lesson ("look for the sibling that already got the fix") DETECTS drift; the extraction (`dismissRoute`, every input an argument) makes it IMPOSSIBLE and suite-testable besides. When two call sites must reach the same decision: extract the decision, let the sites merely execute the verdict.

**A field-picking whitelist must be walked once per payload KIND that feeds it (7 Aug, srv-2.6.27, caught by the FIRST real report):** errRecord picked `ver` from the top level only; crash pings carry it there, but report payloads carry it inside `summary` — so the digest's version histogram answered '?' the moment Johan's first real report arrived. The fix is a one-line fallback mirroring `ua`'s handling. When an intake accepts several record kinds, check every picked field against the shape each kind ACTUALLY sends — the first live user will find the kind you skipped. Bonus fact worth keeping: the telemetry loop's first real use found a bug in the loop itself — which is the system working.

*The seven entries below are the 5–7 Aug 2026 round (v2.6.55 / srv-2.6.25–26 — B-53 import guards, B-54 telemetry, maintenance mode).*

**`log()`'s second argument is `localOnly`, NOT `privateLine`** — the signature is `log(msg, localOnly, privateLine, opts)`. The chat handler calls `log(m, true)`, which means chat DOES reach `curLines` and the autosave archive; only the third argument keeps a line out. The telemetry design's §5 claimed chat was excluded "by construction" — wrong, caught during implementation, fixed with the explicit `{noRing:true}` opt. Lesson: **verify a function's parameter ORDER at the call site before reasoning about any flag's effect** — a plausible- looking `true` in position 2 tells you nothing until you've read the signature.

**Diagnostic tools MUST isolate persistence and ports.** The first `diag-deck-lifecycle.js` run let a stale room snapshot from an earlier spawn poison the next scenario because the `--data-dir` was shared. Every spawning test/diag now uses `fs.mkdtempSync` + a random port (`test-error-endpoint.js` is the template).

**try/catch is dynamic, not lexical.** A callback registered INSIDE a guarded block runs unguarded when it later fires — the Resume click handler sat lexically inside the boot try but crashed naked on a corrupt autosave. Audit callbacks separately from their registration site.

**The caught-but-reported pattern:** contain the exception locally (honest toast, no wedge) AND call `onClientError` manually so the telemetry still gets the stack. Containment and observability are not a trade-off.

**A protective cap can fight the rules it protects.** The 30-per-line qty cap predated the legality gate; together they refused a legal deck with numbers the player never typed. When adding a gate, re-audit every earlier softening mechanism in the same pipeline — caps, truncations, coercions — because the gate now REPORTS what they silently changed.

**A new gate invalidates fixtures that exploited its absence.** The tournLock legality gate broke the mid-match-swap test — its 1/1 setup deck had always been illegal, just never checked. Fix the fixture, never soften the gate; and read the failure as confirmation the gate bites.

**The format-battery technique:** extract the REAL parser verbatim (brace-matched grab), run it against faithful samples of every wild format × environment variant (DB present/absent), and read the counts table. One run killed two theories (DB-dependence, era filter), acquitted four formats, convicted the qty-after format of loud (not silent) failure, and discovered two new silent-corruption classes. Empirical tables beat speculation at ~40 lines of harness.

**A placeholder is documentation, and it is read in exactly ONE context (28 July, v2.6.53→54):**
changing `#mpAddr`'s placeholder to `elysium.cards` looked like the safest of four text edits. But a
placeholder only shows when the field is EMPTY, which on the public instance never happens — it is
prefilled from `location.host`. The only readers are file:// and locally-served clients, and for
them `cleanAddr()` turns a bare host into `ws://host:8123`, a port no TLS front exposes. **Before
writing an example value, work out who actually sees it — and run that exact string through the
code that consumes it.** The corrected placeholder carries the scheme.

**A flag that is persisted but never read is a bug with a delay fuse (28 July):** `mpStore` had been
saving `sec` alongside the address since the tunnel work, and `openMP` never read it back — while
`cleanAddr` strips the `https://` prefix before storing. So a downloaded client that played on a
tunnel yesterday was prefilled with a bare host today and could not reconnect to the server it had
just been on. **When a stored field has no reader, that is not dead weight but a promise nobody
keeps:** grep every persisted key for its read site, and if there is none, either wire it up or
stop writing it.

**A tutorial is documentation, and documentation drifts silently (28 July):** nothing in the gate
chain had ever read the tutorial, so a step could point at a deleted id (`#btnPlay`) and a chapter
could describe a deployment model the project had left months earlier, both without a single test
going red. The cure is cheap and general: a static sweep asserting every `$('#id')` step target
exists in the DOM (83 ids, 12 chapters, one regex), plus behavioural assertions on any FIXTURE the
tutorial builds. **If a feature ships user-facing prose, ask what test reads that prose.**

**A demo fixture that feeds the real renderer can still lie about ROLE (28 July):** `tutDemoLobby()`
was honest about layout — it fed `renderLobby` and therefore could never drift from the real lobby
— but it seated the viewer as HOST, so the Join chapter showed guests a lobby with moderation
buttons and a Start game button while the text told them the host would start. **Feeding the real
renderer proves the pixels, not the perspective.** The fix is a role parameter, and the second
fixture is worth a test of its own so it cannot quietly disappear.

**Ship a public instance, audit the copy that describes the old one (28 July):** `elysium.cards`
had been live for days and was named nowhere in the client's user-facing text — not in the
tutorial, not in the connect dialog, not in START-HERE or the Host Guide, only in `og:url`. Nothing
broke, which is exactly why nobody noticed. **A deployment change is a documentation change with a
long tail: grep the user-facing strings for the OLD model (here `start-elysium`, `8123`,
`trycloudflare`) and count the hits — that number is the size of the drift.**

**Prefer one behaviour over a conditional one when the split can be a chapter (28 July):** the first
plan branched the Host chapter on `location.protocol==='https:'` to hide the self-host steps. Giving
self-hosting its own picker-selectable chapter removed the branch entirely and left a single step
explaining both worlds in two sentences. **A structural split the user can see beats a runtime
condition the user cannot** — and it halves what the gate has to cover.

**"Session-only" is a claim about the WHOLE object, not the field you touched (28 July):** the hotseat
set `helper[k]=true` in memory and the comment said the stored blob was untouched. It was — until the
next `afterHelperToggle()`, because `saveHelper()` serialises the ENTIRE `helper` object. Same shape
for `conv.tournament`, whose `saveConv()` is called from 42 sites. **Before writing "session-only",
find the save function and check what it writes: if it serialises the whole object, any in-memory
mutation is persisted by the next unrelated save.** The fix shape is a separate flag the reader
consults, never a write into the persisted structure — and it renders better too, since a UI painted
from the reader shows the truth for free.

**Retract a caution as loudly as you raised it (28 July):** a shared-harness change was flagged as a
risk to the bot track on the strength of the file's NAME and its own doc comment ("the single
canonical helper... test files require() this"). Four greps showed the bot suite never requires it at
all. Re-running the 629-assert suite was still right — verify, don't assume — but the warning itself
was manufactured from a label. **A caution is a claim and carries the same burden of proof as a fix.**

**Give a spawning test suite its own command (28 July):** `test-bot-logic.js` spawns a real server and
connects real WebSocket bots. Run at the end of a chained gate command it aborted at 13/1 (the
non-deterministic abort BOT_VERSION documents); run alone, three times, it was 629/0 every time.

**Dead code hides a WRONG default, not a missing one (28 July, the Helpers policy):** the client
carried a fallback that pushed `tournament:true` for new rooms with a confident comment saying so.
It could never fire — the server stamps `helperPolicy` onto every `joined`, so the guard
`if(!net.helperPolicy)` always failed — and the real live default was the opposite
(`allowLocal:true`, every helper on). Nobody noticed for the whole hosting track. **When a default
looks wrong in the field, check whether the code that sets it can actually RUN before believing the
comment next to it.** Read the receiving end: a server that always supplies a field turns every
client-side "if absent, seed it" branch into decoration.

**Look for the sibling that already got the fix (28 July, the Classic park fix):** `revealed()`
clamped online pile-drops to `zoneRect('ready')`, which in L4 is the top 44.5 % band. Both OFFLINE
park paths already carried the correct `l4on() ? whole-board : zoneRect('ready')` branch — the
online path simply never received it when the free board landed. Same shape as the recurring L4
dispatch-chain drift: **when one code path handles a view mode correctly, grep for its siblings
before assuming the mode is handled everywhere.** The offline/online split is as good a drift line
as the L0-L4 view split.

**Two thresholds, not one, when nudging things apart (28 July, the pile-park bounce):** "don't let
cards land on top of each other" and "where should the bounced card go" are separate numbers. One
number forces a bad trade: strict enough to prevent stacking means it also breaks the deliberate
tight packing of face-down rows. Splitting them — an overlap THRESHOLD of 0.55 (edge-to-edge sits
at 1.0 and is never touched) and a landing STEP of 1.02 (lands beside, not at 45 % overlap) — gives
both. **Ask what the user is doing on purpose before writing a rule that prevents it:** here the
deliberate act was attaching (a drag onto a card is `attach()`), which is why the bounce is scoped
to pile-park paths only.

**In Classic the felt is genuinely SHARED (28 July):** `renderL4OppCards` draws every other seat's
ready/uncontrolled/torpor cards into the same canonical space via `pubXform`. Any geometry that
reasons about "what is already on the table" must read `net.boards[seat].pub.cards` too, not just
`state.zones` — otherwise it is only half-aware of the board it is standing on.

**A red test is a hypothesis about the CODE that must be checked against the TEST first (28 July):**
two of three failures in this round were the fixture, not the change. (a) The DOM stub's
`classList.contains()` returns false unconditionally, so `l4on()` was OFF and the felt scale was 2
rather than the assumed 1 — measured by printing the boxes instead of re-reading the function.
(b) `move()` canonicalises `opts.x/y` for `ready` but stores them RAW for uncontrolled/torpor
(already canonical there), so a display-space assertion against canonical input missed a card that
was present all along. **Print the actual value before editing the implementation.**

**Renaming a DOM id is a sibling-audit job (28 July):** `#offTournament` became `#offHelpers` and
the element type changed from checkbox to select. Four TUTORIAL sites referenced the old id, two of
them calling `.checked=false` — which on a `<select>` fails silently rather than loudly. A
post-edit `grep` for the retired id is now part of the recipe.

**Compaction erases outputs (24 July, the arena-v1.1.5 loss):** delivered files do NOT
survive a context compaction — after one, the working dir is re-seeded from
/mnt/project alone, and any newer version that lived only in a delivered batch is GONE
until Johan re-syncs it. The session-start ritual's "use the newest version" check must
therefore compare the PROJECT snapshot against the versions the JOURNAL claims were
delivered — a mismatch means re-sync first, build second. (Found live: the journal said
arena v1.1.5; both workdir and outputs held only v1.0.0.)

**The bot-harness recipe (25 July, the live-diag chain)** — a 56 kB procedure, moved verbatim to `elysium-learnings-archive-2026-09-09.md` (it is a recipe; SKILLS-arena.md is its natural home).

**New working principle (14 July 2026): after a tool/environment outage, VERIFY what actually landed on disk before continuing — don't assume the last successful-looking edits were saved.** A genuine environment outage interrupted the Ashur Tablets table-wide watch mid-implementation. When tools recovered, the working directory and its files were still present, which could easily have been read as "nothing was lost" — but a `grep` for the specific new method names (`_checkAshurTableWide`, `_ashurResolve`) came back empty, and the CARD_HANDLERS entry was still the OLD, pre-refactor version. The code (and its 7 new tests) had to be rebuilt from the already-worked-out design, not assumed intact. Lesson: "the directory survived" and "my edits survived" are different claims — after any interruption, `grep`/`view` the SPECIFIC things you believe you just wrote and confirm they're actually there before trusting the gate gate's pass count or moving forward, rather than inferring file state from file timestamps or directory listings alone.

**New testing principle (14 July 2026): a live-integration test with TWO real bot instances at one table can be confounded by completely ORDINARY game mechanics between them, not just the specific feature under test.** A new 2-bot test for Ashur Tablets' collateral-loss path asserted that the bystander bot's pool stayed unchanged. It failed — not from an Ashur Tablets bug, but because the triggering bot's prey, in this seating, happened to BE the bystander bot: the triggering bot's completely ordinary minion-phase bleed took 1 pool from the bystander, entirely unrelated to Ashur Tablets. A debug script confirmed the exact mechanism (a normal successful-bleed pool loss) before the assertion was corrected to check for the ABSENCE of the specific trigger-only signals (a named log line, a `pileBulk` call) instead of the raw, confounded pool number. Lesson: the same "prefer the most direct, least-perturbable signal" principle already logged for `cryptN`-vs-`unc` applies with extra force once a test has TWO autonomous agents sharing a table — every OTHER thing either bot might ordinarily do (bleed, hunt, vote) is a potential confound on any shared resource (pool, blood) that isn't the specific mechanism being tested.

**New bug class (bot v1.4.3, caught by reasoning, not by testing): a "check the precondition" design for detecting another party's event can be defeated by that party's own handler resolving the precondition before anyone else looks.** The first design for cross-seat Ashur Tablets detection was "does any seat currently show ≥3 copies in `ready`". This is wrong: the triggering seat's OWN handler burns its 3 copies in the same tick it crosses the threshold, so the ≥3-in-ready state exists for a single internal step and is gone by the time it's a DIFFERENT seat's turn to observe it — a classic race between "the condition that causes an event" and "the event's own cleanup", where the cleanup reliably wins before any other observer's turn. Caught by re-deriving the turn sequence on paper before writing the live test, not by running anything. The fix was to track a PERSISTENT, one-way consequence of the event (a rising 'burned' count) instead of the TRANSIENT precondition — the same shape of fix as the `cryptN`-vs-`unc` lesson, but found at design time instead of via a failing test. Lesson: when one agent needs to detect that ANOTHER agent's event already happened, ask whether the signal being checked is the event's CAUSE (transient, likely already resolved) or its EFFECT (often more durable) — prefer the latter.

**New testing principle (14 July 2026): a test's own EXPECTED value can be wrong from a misremembered card fact just as easily as the code under test can be — verify the number, don't just trust recall, even for something as simple as a play cost.** A live-integration test for Ashur Tablets' new threshold handler asserted `pool === poolBefore - 2 + 3`, assuming the card costs 2 pool to play (unconsciously carried over from The Parthenon, curated the same session). It failed. A debug script instrumented to log `pool`/`edge` at every phase boundary showed the real trace: pool never dropped at all before the +3 threshold gain landed — because Ashur Tablets is entirely FREE to play (confirmed against the compiled cardfx entry: no `cost` field whatsoever). The handler code was correct throughout; only the test's own arithmetic was wrong. Lesson: when a live-integration assertion encodes a specific numeric expectation derived from a card's cost/amount/etc., re-check that number against the actual compiled data (or the source card_text) at the moment of writing the assertion — the same discipline already applied to card MECHANICS (read the rules text, don't assume) applies equally to the SPECIFIC NUMBERS a test bakes in, and misremembering one card's cost for a similar-seeming other card is an easy, otherwise-silent way to fail a test for the wrong reason.

**New testing principle (14 July 2026): when asserting on bot state after a REAL turn (not an isolated function call), prefer a stable/monotonic signal over a transient intermediate one, because unrelated pre-existing bot logic can consume the transient state later in the SAME turn.** A live-integration test for Effective Management's new `drawCrypt`-based handler asserted on `bot.unc` (the uncontrolled-vampire array) reaching length 1. It failed — not because the handler was broken (a debug run with full logging showed `cryptN` correctly decrementing 8→7, proving the real wire round-trip completed), but because the SAME turn's own, completely unrelated Influence-phase logic (this test's deck had 4 cheap uncontrolled vampires already and plenty of pool) swept an uncontrolled vampire into `ready` before the test's poll loop observed `unc`, draining the very state being asserted on. The fix was to assert on `cryptN` instead — a counter that only ever moves in one place (the `drew` message handler) and, once changed, stays changed, unlike an array that a dozen OTHER pieces of turn logic are entitled to mutate afterward. Lesson: in a system with multiple independent behaviors sharing one mutable board/array, a live test should identify the MOST DIRECT, hardest-to-accidentally-perturb signal for the thing it's actually trying to prove (here: "did the round-trip happen" — a counter delta — not "what does the array look like right now" — a snapshot any number of later steps could have already changed).

**New working principle (14 July 2026): "infrastructure no shipped card uses yet" is exactly the code most likely to have documentation drift, because nothing has ever exercised the gap between the prose and the implementation.** `actGrant` was documented in `elysium-cardfx-design.md` as per-mode from the day it was written, but `_recomputePhaseActs()` — the only code that ever read it — had ALWAYS read it entry-level (`h.e.actGrant`, never `h.e.modes[i].actGrant`), confirmed by the existing (passing) test fixture that constructs it that way. Nobody had ever noticed, because until this session no curated entry used the field at all — a doc claim with zero real consumers can be wrong indefinitely without any test ever failing. Curating The Parthenon at the documented-but-wrong nesting level would have compiled cleanly, passed JSON validation, and simply done NOTHING at runtime (the reader would never find it) — a silent failure, not a loud one. Lesson: before writing curated data for a field whose doc comment includes phrasing like "no shipped card uses this yet" or "pure infrastructure", grep the actual READER's code (not just its doc comment) for the exact property path it dereferences, and check any existing test fixture for that reader — trust the tested code over the aspirational prose, and fix the prose to match once confirmed, not the reverse.

**New bug class (cardfx v1.4.0): a boolean gate written for ONE flag silently drops every record whose only signal is a DIFFERENT, newer flag.** `libModes()`'s grouping step read `if(!Object.keys(d.fx).length) return` — correct the day only `fx` existed, but when `lock` was added as a sibling per-segment flag (same shape as the existing `dir`), a lock-only segment with zero recognized `fx` keys (The Parthenon: "lock this card to get +1 master phase action" — no fx pattern exists for phase-action grants) still hit the OLD gate and vanished before ever reaching output — the very fact the new tag existed to capture. The bug was invisible by inspection (the regex itself worked fine in isolation) and only surfaced by running the real compiler against the real card and looking at the actual output, not by reading the diff. Lesson: when adding a new per-mode/per-entry flag alongside an existing one, grep every place that asks "is there anything here worth keeping" (a length check, an `if(!x.length)`, a truthy guard) and confirm it was widened to OR-in the new flag — the old gate doesn't error, it just quietly returns nothing.

**New bug class (cardfx v1.4.0): a keyword regex without a leading word-boundary matches its own negating prefix as a substring.** `/lock this \w+/i` doesn't just match "lock this X" — it matches the tail end of "**un**lock this X" and "**b**lock this X" too, since regex has no concept of "the whole word starts here" without an explicit `\b`. A first real run produced 270 hits against an expected ~145 (verified independently via a from-scratch Python pass over the same file); the 125-card gap was entirely cards using "Unlock this minion" or "cannot block this action" — the OPPOSITE or an unrelated concept, not a near-miss. `\block this \w+` (leading boundary) recovered the expected count exactly, with zero cards lost. Lesson: any "verb this/that NOUN" keyword scan needs a leading `\b` as a matter of course, not just when a collision happens to be noticed — English has enough same-root prefixed verbs (lock/unlock/block, but also e.g. "un-tap"/"re-tap" patterns in other card games) that this class of bug is the rule, not the exception, whenever the base verb is short.

**New pattern (cardfx v1.4.0): inheriting a flag across an "As above" reference needs a real three-state (true/false/undefined), not a boolean — a segment's own explicit NEGATION must actively block inheritance, not just fail to assert.** Deflection's `[DOM]` mode reads "As above, but do not lock this vampire" — its own text negates exactly the property `[dom]`'s mode set. Treating "no positive match" and "an explicit negation" as the same `undefined` state would let the inheritance step (`if(lock === undefined) lock = src.lock`) silently pull the SUPERIOR mode's lock back from the inferior one, reproducing precisely the fact the negation exists to override (confirmed by testing: this is exactly what happened before the fix). Setting the negated case to `false` (not `undefined`) makes the inheritance guard's existing `=== undefined` check correctly refuse to override it. Devil-Channel: Throat is the mirror-image proof this generalizes correctly: inferior has NO lock, superior's own "As above, but lock that blocking minion" ADDS one — same three-state mechanism, opposite direction, both come out right. Lesson: any time a card-text sweep supports "As above" style inheritance for a NEW boolean/flag (not just numeric fx), check whether the source vocabulary includes a negating phrasing ("do not", "without", "unlike above") before assuming two states (present/absent) are enough — a real negation needs its own explicit state that inheritance treats differently from silence.

**New reference fact (cardfx v1.4.0, from Johan's own opening framing, confirmed against real data): some card properties are signaled by TYPE, not by PROSE, and a text-only sweep will systematically miss an entire category rather than a scattered few cards.** Equipment/Ally/Retainer/Event stay in play by RULE — the rulebook says so once, not on every individual card — so scanning `card_text` for "put this card in play" caught only 18/164 Equipment, 0/119 Allies, 0/54 Retainers, and 1/40 Events; the other ~350 cards simply never restate a fact their TYPE already guarantees. This was invisible in spot-checks of individual cards (each one looks "correctly" untagged in isolation, since nothing in ITS text was missed) and only surfaced from a type-by-type breakdown of the aggregate results — a reminder that a sweep's own summary statistics, sliced a different way (by type, by count, by expected-vs-actual), can surface a systematic gap that no amount of checking individual hits would reveal. Lesson: before trusting a prose-pattern sweep's coverage, ask whether the property being tagged might ALSO be a consequence of some other structured field (card type, in this case) that makes the prose redundant on most affected cards — and verify the CANDIDATE exception list (Power/Conviction were considered here and correctly rejected after reading actual samples, not assumed by category-adjacency to Equipment).

**New bug class (bot v0.5.2): a test that relies on `DEFAULT_DECK` implicitly (no explicit `deck:` option) is coupled to whatever the shipped default happens to be RIGHT NOW, and silently breaks the day that changes.** Sections 1-9 of `test-bot-logic.js` (the foundational connection/turn/bleed/combat/discard flow) never passed their own `deck:`, so they rode `DEFAULT_DECK` — including a discard-phase assertion that specifically needed a crypt with no Obfuscate access, true of the OLD sample deck but not of the new real playbook that replaced it (whose library has no Obfuscate-gated cards at all, so the assertion only passed when a Dominate-holder happened to not be ready — genuinely flaky, not imagined). Every OTHER test in the suite already passes its own explicit `deck:` for exactly this reason; this was the one foundational exception, presumably because it predates the convention. Fix: pin it to an explicit deck identical to what `DEFAULT_DECK` used to be. Lesson: ANY test whose assertions depend on specific card/discipline/capacity facts should pass its own explicit deck, full stop — never assume "whatever ships as default" is a stable test fixture, especially on a project where the default deck is expected to keep changing (the "four archetypes" backlog item guarantees more churn here).

**New working principle (14 July 2026): a domain expert's correction outranks a cited web search, even a careful one.** Search found "if you have the Edge, you may gain 1 pool" (accurate) and missed that this is a PASSIVE bonus that doesn't consume the Edge (Johan caught this mid-review). The citation wasn't wrong, it was just incomplete on the one detail that mattered most for a design decision already in flight (whether it conflicts with Leverage's Edge-burn cost). Lesson: treat a search-verified rule as a strong prior, not a closed question, especially when a person with direct domain knowledge is right there to check it against — and when corrected, verify the ACTUAL CODE before assuming a fix is needed (this time the code was already right; only the prose describing it was imprecise, and conflating the two would have caused a real regression by "fixing" working code).

**New reference fact (14 July 2026): a card's TYPE governs WHEN you may PLAY it; it does NOT govern when an already-in-play permanent's RECURRING ability fires — these are different questions, and two cards can share an identical type yet answer the second one differently.** Blood Doll and Vessel are both `t:["master"]` (type correctly says "play in the Master phase" for both) — but Blood Doll's own recurring transfer fires in the controller's Master phase while Vessel's fires a full phase later in Unlock. This is why `phase` had to become its own per-mode cardfx field (14 July) rather than being inferred from `t` — worth remembering before assuming any "type already tells you everything" shortcut for a new card mechanic.

**New architectural pattern (bot v0.5.1): a generalized phase-action economy (`phaseActs`/`phaseBonus`/`phaseUsed` → `_phaseAvail`), deliberately verified against and mirroring the CLIENT's own `state.phaseActs`/`phaseUsed`/`masterBonus` system (read `adjustPhaseAct`/`phaseActKey`/`resetPhaseAct` directly before building anything) rather than invented independently.** Permanent baseline (`phaseActs`, rebuilt each own turn from in-play cards via a new curated `actGrant{persist:'inplay'}`) and temporary this-turn bonus (`phaseBonus`, from `actGrant{persist:'turn'}` OR the Trifle keyword's own fixed +1/turn cap) are SEPARATE pools that both feed the same availability formula — this is what let Trifle (a universal rule) and a future bespoke card (Parthenon) contribute independently without one capping the other. Kept inline in the bot rather than extracted to a file the client could also import (Johan's call, 14 July): the arithmetic is small enough that duplication isn't a real maintenance cost yet — revisit only once the client grows its own cardfx-driven auto-Helpers.

**New reference fact (13 July 2026, prompted by Johan's question): L2/L3/L4 are NOT a responsive-breakpoint ladder — they're board-style + zoom-level view modes, and attached-card (`host`/`attached`) rendering is ALREADY mirrored across all of them.** `net.view` is `null`/a seat number (visiting)/`'ov'` (L3, Helicopter overview — reachable only FROM L2)/`'l2'` (Structured's Normal home view)/`'l4'` (Classic's Free Board home view — `freeBoard()` returns `net.boardMode==='classic'`). The phase bar (`#phases`) is a SHARED element gated by the general `hx('on')` helper toggle (`#phases.helperoff .phase:not(.pass){display:none}`), not board style — a Classic table with tournament off shows the same five phase buttons a Structured table does; only the DEFAULT differs (`syncOffTournament()`: Classic defaults tournament ON, Structured OFF), and a bot gating on observed `caps.tally` naturally follows the table's ACTUAL state either way, never the default. Card attachment specifically: `buildMat()` (shared by L2's neighbour columns, L3's mats, and the visit view) and `renderL4OppCards()` (L4's own parallel implementation, its own comment explicitly says "exactly like L4" when documenting buildMat, confirming the two were deliberately kept in sync) BOTH read `cards.filter(c=>c.zone==='ready'&&!c.host)` then `c.attached||[]` to offset child cards near their parent — identical shape, verified by reading both, not assumed from one. The established "L4 dispatch chain drift" bug class (`net.view` dispatch chains missing an `'l4'` branch) is real and worth checking for any NEW WIRE VERB, but does not apply to adding new FIELDS to an already-fully-wired existing verb (here: `host`/`attached` on the existing `board`/pub `cards` array) — worth distinguishing "new verb, needs new dispatch wiring" from "new field on an existing verb, rides the existing wiring" before assuming a gap exists.

**New bug class (bot v0.5.0): an early-exit (`continue`/`return`) added to ONE branch of a loop can skip shared cleanup code the OTHER branches still rely on.** The minion loop's bleed branch ends by draining `_drawOwed` (cards owed a replacement); adding a NEW branch (Hunt) that `continue`s past that point left a master-phase draw silently un-flushed whenever the acting vampire hunted instead of bleeding that turn — not wrong forever, just deferred indefinitely if no LATER vampire's bleed branch happened to reach the drain first. Caught by a live integration test, not by inspection, which is itself the lesson: a bug that only manifests as "state carries over silently, doesn't crash" won't show up in an offline unit that checks one function in isolation — it needs something that actually walks the whole turn. Fix pattern: extract the shared cleanup into its own method (`_flushDraws()`) and call it from EVERY branch that can leave the debt behind, not just the one that happened to be there first. Same family as "L4 dispatch chain drift" and "Vy-läges-syskondrift" — a new branch added to existing multi-path code needs the same audit: what does every OTHER branch already do before/after this point that the new one might be silently skipping?

**New working principle (bot v0.5.0): when asked to make the bot mimic a human-facing "helper" or convenience feature, check whether the feature ALSO encodes a real mechanical benefit, not just presentation.** Asked to make the bot "click the phase-bar buttons like a human," the buttons themselves turned out to be cosmetic (just a `log()` line) — but the SAME investigation into what the Unlock button's helper actually does turned up that it also offers +1 pool for holding the Edge, which the bot had never once claimed despite tracking Edge possession correctly since M2. The client-side `hx('...')`-gated helpers are a mix of pure UX narration and actual optional rules mechanics a human has to remember to use — don't assume "it's just a helper" means "it's just cosmetic" without checking the helper's own code for a state mutation (a `bumpPool`, a zone move) alongside the `log()`/`uiConfirm()` call.

**New technical fact (bot v0.5.0): `cardfx-compile.js`'s curated overlay (`cardfx-curated.json` → `elysium-cardfx.json`) is a whole-entry `Object.assign` passthrough with NO field whitelist.** Adding a brand-new key to a curated entry (here: a `phase` field on a mode) needs zero compiler changes to survive a real recompile — verified by reading `compile()`'s `overlay()` function directly rather than assuming, then confirmed for real once `vtes.json` became available same-day (a hand-mirrored hand-edit of the compiled JSON, made while `vtes.json` was still missing, matched a genuine recompile byte-for-byte in content — different whitespace only). Separately: this environment can lack `vtes.json` (the real card database `cardfx-compile.js`/`test-cardfx.js` need) — a curated-only change then has to be hand-mirrored into the shipped `elysium-cardfx.json` and `test-cardfx.js` cannot be run; flag this honestly rather than skip the gate silently, and re-run the real compiler + gate the moment the database is available.

**New bug class (bot v0.4.5): a zone's current POPULATION COUNT is not the same as its next FREE SLOT.** Any pure idx→{x,y} placement formula (the bot's `slot(zone,idx)`) has no memory of who's already there. Deriving `idx` from "how many cards currently occupy this zone" is only correct while the zone stays contiguous 0..N-1 — true only until a card LEAVES that zone out of turn (a combat torpor, a manual ctrl zone toggle) and frees a MIDDLE slot while everyone else keeps their original index; the next arrival then recomputes the same (now smaller) count into an index some OTHER card still occupies. This is not a "count harder" problem — it needs an actual occupancy check: `_openSlot(zone, exclude)` scans `slot(zone,0)`, `slot(zone,1)`, … and returns the first one no OTHER card in that zone already holds. The same defect recurred FOUR times in one file once found (the influence raise, combat's torpor placement — hardcoded to slot 0, so every KO'd vampire stacked on the first one — the ctrl torpor/untorpor toggle, which didn't reposition at all, and `_addUnc`'s own uncontrolled placement) — same audit instinct as "L4 dispatch chain drift" and "Vy-läges-syskondrift": once one instance of a bug class turns up, grep every OTHER place the same shape (`.filter(...).length` used as a fresh index, or a hardcoded slot index) could recur, in the same file, before considering the fix done.

**New pattern (bot v0.4.5): pace as a GATE, not a blind sleep.** A "pacing" delay implemented as `sleep(paceMs)` inserted at specific call sites only proves what those specific sites do — every OTHER phase transition or reaction step the same sweep didn't touch stays unpaced, and nothing single-call-site-shaped catches that. `_pace()` instead tracks `this._lastActAt` and waits only the REMAINING time since the last resolved action: cheap to call liberally before every visible bot command (a played card, a bleed, a block, an influence raise) without reasoning about whether enough real time already passed elsewhere (a slow human `_askBlock` reply, a network round trip) — it degrades to a no-op automatically when it has. Any function this needed to reach into (here: `_commitBlock`, `_resolveCombatRound`) had to become `async`; call sites already inside another `async` function (`_playTurn`) got a direct `await`, call sites in synchronous dispatch code (`_onLog`, a `setTimeout` callback) got the fire-and-forget `.catch(e => this.o.log(...))` shape `_playTurn().catch(...)` already established — never a bare unguarded call on a function that can now reject.

**Reinforced learning (v2.6.36):** the id-selector-beats-`[hidden]` footgun struck again, this time on `#avrLive` — the fourth known instance after `#avrDuel`/`#edge`/`#helpOverlay`. Whenever a new element gets its own `#id{display:...}` rule AND is toggled via the `.hidden` property/attribute from JS, add the matching `#id[hidden]{display:none}` rule in the SAME edit — the JS-side `el.hidden=true` will silently do nothing otherwise, and the failure mode (a stuck, non-interactive-looking panel) is easy to misdiagnose as a logic bug rather than a CSS specificity one. Also reconfirmed the TDZ discipline (`elysium-learnings.md`'s existing rule): a `const` used inside a function that is itself CALLED at module-load time (here, `avrRender()` via `applyHelper()`) must be declared BEFORE that call site, not just before the function's own definition — moving `AVR_DEFS`/`AVR_HKEYS`/`AVR_PHASES` next to the early `avr` declaration (v2.6.20's precedent) was required once `avrRender()` started actually dereferencing them on the load-time call (previously masked because `avr.mode` was always falsy at that point, so the ternary never touched `AVR_DEFS`).
>
> **Protocol for these two docs:** at the start of work on a game project, read the latest project-context and learnings docs *first* - before digging into the code or the rest of the files. After each implementation, update them where needed - a version bump, a new learning or pitfall, a changed convention.

Things worth remembering when working on Elysium: technical facts to respect, traps to avoid, and how Johan likes to collaborate. Pair with **elysium-project-context.md** (the orientation/reference). The collaboration notes apply across Johan's projects, not only Elysium.


## Soak-tool learnings: A SOAK THAT CAN FAIL (21 Sep 2026)
- **A detector built on the mechanism it checks fails SILENT — give it a second, independent clock.** The soak noticed a parked seat through `hotAwaitPass`. Break `hotAwaitPass` and the soak does not report a fault, it hangs with it. The watchdog stamps its own last-heard time and must not read `rec.lastAt`. General form: when a test harness reuses the production timeout, ask what happens to the harness when that timeout is the bug.
- **Ship the negative control WITH the tool, and put it in the gate.** 'N tables, 0 stuck' is only evidence if the tool has been seen to say 'stuck'. `--control` plus a mutant client took twenty minutes and converted every future clean run from hope into a measurement.
- **Three verdicts, not two.** fired / only the watchdog fired (client fault) / nothing fired (tool fault). The first draft printed 'this tool cannot detect a parked table' for the mutant — while it was detecting one. A wrong diagnosis in a failure message sends the next session to the wrong file.
- **`cmd | tail; echo $?` reports tail.** Two of my 'exit=0' lines were the pipe's. Redirect to a file, then read `$?`.
- **Promote a one-off the moment it decides something.** The `/tmp` script had already justified removing a guard. A script that carries a decision and then evaporates leaves the decision unrepeatable; it would have been the right instrument in round 3.
- **Let the tool print its own blind spots.** 'nobody was ousted — the oust path was NOT exercised' is in the summary line, so the number cannot be quoted without its limit.

## v2.6.128 learning: THE CLOSE THAT CLOSED SOMETHING ELSE (22 Sep 2026)
- **`$()` binds to the FIRST match -- grep for an id before you mint it, and let the suite forbid duplicates (22 Sep, v2.6.128).** The Help modal's Close was `#helpClose`; a `#helpClose` already existed, the shortcut overlay's ✕ inside `#tableArea`, 800 lines earlier. Nothing threw: the listener landed on a hidden button on the felt and the modal's Close was inert -- Johan's first click found it. I had checked my page-anchor ids for collisions (`about`, `setup`, …) and not the four ids of the modal itself, the ones actually queried by `$()`. Two fixes: the family name `helpDoc*` for everything the Help feature owns, and a suite test that every `id=` in the static markup is unique (destructive: red on v2.6.127). A duplicate id is a silent mis-wiring, never an error -- only a census catches it.

## v2.6.127 learnings: HELP INSIDE THE CLIENT (22 Sep 2026)
- **A document embedded in an app inherits the app's stylesheet — enumerate the leaks before styling (22 Sep, v2.6.127).** The client's `main{display:flex}`, `header{…}`, `.modal h3{uppercase Cinzel}` and `.modal .note` all reached the embedded page; each would have shown up as "the help page looks slightly wrong" in the browser with no test to name it. Grepping the client's bare element selectors and class names against the page's markup BEFORE writing the scoped block turned them into four explicit re-statements and one assertion (every rule in `#helpCss` scoped). Do the leak census first; a scoped stylesheet only protects the host, not the guest.
- **Never spell the bare `<script>`/`</script>` tag inside the client's own script — not even in a string (22 Sep, v2.6.127).** The HTML parser ends the script at the first `</script` regardless of JS context, the harness regex and `split_client.py` key on the one bare opening tag, and both failures are silent until B1 or the suite. `'<scr'+'ipt>'` costs nothing; the test pins that the builder's source contains neither literal. The v2.6.64 legacyGuard comment already carried the same rule for prose — it holds for code too.
- **Another project's prose is not our code: exclude it from code pins, do not edit it (22 Sep, v2.6.127).** The v2.6.122 "no grinder/shark outside comments" pin tripped on "a grinder keeps its design home quota" in START-HERE-BOTS.html — the bot project's archetype vocabulary, embedded verbatim. The wrong fixes were obvious and both bad: edit their text (ownership rule), or drop the pin (it guards real persona keys). The right one: the pin excludes the `<template id="helpDoc…">` blocks, because what it guards was never in there.
- **A copy of someone else's release needs a re-embed COMMAND and a drift TEST, or it will go stale by hand (22 Sep, v2.6.127).** The Host Guide generator in the project is v1.8 while the journal says v1.9 — a hand-synced copy drifting is the norm, not the exception. `embed-help.js` makes the embed one command and `--check` (also a suite test) makes drift a red line. The server page gets the same treatment against its own authoring source; the test REQUIRES that file beside the suite precisely so the source cannot quietly vanish from the project.
- **When a page's anchors live inside a modal, route them through the modal, never through `location.hash` (22 Sep, v2.6.127).** The client's URL is state (`?server=`, `?room=`, `?mode=`); a `href="#controls"` click would have added a hash, and `#hb-controls` would have stayed in the address bar after Close. Delegated click → `scrollIntoView` inside the scroll container (+ `scroll-padding-top` for the sticky nav, + opening the `<details>` ancestors, as the standalone script does) keeps the page's URL exactly as it was.

## v2.6.126 learnings: BOT-CARD CONTROLS AT A HOTSEAT (22 Sep 2026)
- **A guard that `return`s without a toast is a menu row that lies.** `hotCtrl`'s two early returns were each correct for what they protected (a human's own card, a readable blob) and together made every bot-card row a dead click for months — menu opens, nothing happens, no log line, nothing to grep in a crash dump. When a verb can legitimately be refused, make the refusal visible, or route the seat class it does not fit (bots) BEFORE the guards. And test the click's EFFECT, not that the row exists.
- **The v2.6.97 rule was stated too narrowly.** SKILLS said 'card-level verbs are different — the client is the author there'. That was only ever true for HUMAN seats; a bot owns its cards exactly as it owns its pool. Same predator (a bot republishes its own state), same medicine (send the verb, trust the push). When a rule carves out an exception, ask who owns the state in the exception — ownership, not verb level, decides the route.
- **A receiver without a sender is a feature that does not exist.** The bot has accepted `ctrl 'burn'` since v0.6.129; no client row ever sent it, online or offline. Their guide called the card menu 'online only' and Burn was not in it at all. Cross-project debts need a grep on BOTH sides: `t:'ctrl'` here found only `ctrlOnline`, and that was the whole finding.
- **`hotReRender` re-persists the ACTIVE human's own blob** (`net.hot.boards[mySeat()] = serializeGame()`). In a test, a human-seat fixture written straight into seat 1's blob is wiped by the very repaint the code under test triggers. Put the human-seat case on ANOTHER human's board (a 4th seat in `parityTable`) — which is also where it lives at the table.
- **The pub shape rules the fixture, offline too.** `renderStats` reads `pub.counts.library`; a hand-made pub without `counts` throws inside the optimistic repaint. Copy the pub shape from `buildPub`, not from memory.

## v2.6.125 learnings: THE LAST DIFFERENCE (21 Sep 2026)
- **Removing a workaround moves the load onto whatever the real fix reads — find that and pin it.** The bridge filter protected bots from each other's Hold on…; the bot's own fix reads `players[].bot`. The moment the filter goes, `rosterMsg()`'s `bot` field (added two releases ago as mere shape-parity) becomes the thing standing between the table and the old deadlock. Ask of every removed guard: what does its replacement depend on, and who owns that?
- **An implied floor is not a floor.** 'Needs bot ≥ v0.6.147' was true only for the menu keys that happened to fail readably. Once behaviour depends on the peer's version, compare the version — on every load, because a stale global survives a failed attempt.
- **A fixture with the wrong wire shape keeps a broken receiver green for months** (their `attachTo:'Ayelech'`). Both projects have now been bitten by the same thing from opposite sides. When a test feeds a handler, take the message from the SENDER's code (or a recorded one), never from what the receiver expects.
- **Verify the other project's fix through YOUR path.** Their unit test asserts the new match; ours drove a real bot's published card id back through `given` and watched the hook arm on 151 and not on 150. Where a dependency is missing (no cardfx database), stub the narrowest thing (`fxLookup`) and say so, rather than skip the check.
- **Two soaks with different blind spots beat one bigger soak.** Theirs: database on, games to last-standing, their imitation of our sweep. Ours: the real sweep, no database, nobody ousted. State each one's limit next to its number.
- **When another project imitates a piece of yours, that piece has a consumer — write it down.** Their tool copies the sweep's who-is-out rule. It is now a contract line in CLAUDE.md, not a private detail of `hotRunBotTurns`.

## v2.6.124 learnings: THE PRELOAD WAITS FOR INTENT (21 Sep 2026)
- **Review with a different QUESTION each pass, not the same one harder.** Pass one asked 'is the order right?', pass two 'is the server right?'. This one asked 'what does it cost to run, and what does a non-user of the feature pay?' and found a 700 kB download on every lobby in a change both earlier passes had read and approved. A review question is an instrument; rotate them: correctness, order, cost, the uninvolved user, the missing file.
- **Never start I/O from a render function.** Renders run as often as state changes; `renderLobby` runs per lobby push. Anything that fetches belongs on an event that expresses INTENT (a click, a focus, a toggle) or behind a once-flag — preferably both.
- **A retry-friendly loader plus a frequent caller is a request storm.** `hotLoadBotRes` forgetting a failed load is right for Start ('fix the host, press again'). Called from a hot path, the same kindness becomes a 404 per tick and a growing pile of dead `<script>` tags. When reusing a loader from a new call site, read its FAILURE policy, not only its success path.
- **A convenience must not tax people who do not use the feature.** The preload served a future deck that does not exist yet and billed every host for it today. 'The load always lands on somebody' (v2.6.76) is a standing design constraint here, not a one-off remark — check any new fetch against it.
- **Refresh the manifest when you touch its neighbours.** §E2 was updated two deliveries ago while §A still said v2.6.102 / srv-2.6.35 three lines above. A doc updated in one row advertises itself as current in all of them.

## srv-2.6.38 learnings: AN OUST PAYS THE LIVING AND MOVES THE TURN (21 Sep 2026)
- **A ring walk that skips the dead in one direction must skip them in the other.** `nextLiveSeat` has existed since the vacate work; its mirror was an inline `(i - 1 + n) % n` in two handlers. Whenever a helper encodes a table rule ('live seats only'), grep for the hand-written arithmetic that predates it.
- **The doc can promise what the code never did, and the lint will not notice.** The `bounty` row said 'advances the turn if needed' for months. test-protocol-doc diffs verb and field NAMES. A behavioural sentence in §8 is only as true as the dispatch test that exercises it — when editing a row, check there is one.
- **Fixing the server changes what a well-behaved client's old workaround looks like.** Bots pass by themselves after an own-turn oust (their fix for OUR gap). Once the server moves the turn, that courtesy becomes a refused verb. Found only by running real bots against the real server; decide whether the now-redundant message is an error or merely late (late → silent).
- **Skip `out`, not `vacant` — name the states a predicate covers.** `nextLiveSeat` skips both because a vacant seat cannot TAKE a turn; a predator does not need to act to be owed a VP. Reusing the 'live' word for both questions would have moved bounties off vacant seats, a behaviour change nobody asked for.
- **A server that persists beside itself poisons the next probe.** `DATA_DIR = __dirname`: `elysium-rooms.json` appeared in the workdir and the second run failed with 'That room name is taken' and seat 0. Clean both json files between live runs; check the delivery list never includes them.

## v2.6.123 learnings: THE ORDER WAS LUCK (21 Sep 2026)
- **A comment about message ORDER is a claim about the other side's scheduler — run it.** I wrote 'the roster goes out BEFORE the pool-0 board' having reasoned that the bot's publish is queued. It is queued AND drained in the same call while tokens last. `onEvent` on a real bot printed the true order in one run. Any 'X arrives before Y' across an in-process transport needs a live probe, because in-process 'async' is often synchronous.
- **A right answer produced by the other project's safety net is a bug with a green test.** The LIVE test asserted +6 exactly once and passed — through the bot's de-duplication, not our ordering. Assert the MECHANISM (the event order, `oust-inferred` absent), not only the outcome, whenever two independent paths can both produce it. (The 76-lesson from the bot project, arriving here.)
- **Fake-seat tests prove what we SEND; only a real peer proves what happens when it answers inside our call.** The host-oust test with recording stubs saw `bounty, roster` and was correct about that. The re-entrancy — a peer that publishes during `toBot()` — does not exist with a stub.
- **Before destroying a local object on the strength of a message, check the receiver's early returns.** `given` is fire-and-forget; the bot drops it when out / not started. Online the same hole exists in principle (the server checks only the socket). Read the receiver's guard clauses and mirror them at the sender when the send is irreversible.
- **A copied clamp carries its old verb's limit.** `slice(0,16)` came from the duel cid two cases above. When mirroring a whitelist, open the server's cleaner for EACH field (`cleanId` 32 + strip, `cleanCard`, the duel's 16) instead of pattern-matching the neighbour.

## v2.6.122 learnings: THE PARITY ROUND (21 Sep 2026)
- **An adapter that plays the server's role must OWN the server's state.** The bridge relayed messages and kept nothing, so everything the server does from memory — merge a partial tally, know who is out, find the live predator, tell everyone — had no home and was simply absent. The fix was not four relays; it was giving the bridge `tally/_out/_vp`. When mirroring a handler, list what it READS from the room before what it sends.
- **Write the mirrored code so the other project can lift it.** Their harness executes our `hotBridge` literal verbatim with no client behind it. A relay that reaches for `net.roster` works here and silently does nothing there — and their acceptance run is the one that certifies it. Self-contained core + `typeof`-guarded client hooks; verify by lifting it yourself in a bare `new Function`.
- **A timeout on a wait for an agent must ask, not act, when silence can be legitimate.** The obvious fix for an unbounded `await onPass` is a timer that moves on. A bot is silent for minutes while a human resolves a combat against it by hand, and a Hold has no timer by design; auto-advancing would hand the turn on mid-combat. Clock the agent's last MESSAGE (not the wall), stand still during a hold, and put a human decision at the end — which is what the online twin (`hostPass`) always was.
- **Pay a resource where it LIVES — the three-layer rule has a fourth layer now.** `awardBountyHot` wrote +6 into `net.hot.boards[pred]` for every predator: a placeholder for a bot (nobody reads it), STALE for the active human (overwritten at the next hand-off), correct only for a stored human. Bot seat → the verb; active seat → live `state`; stored seat → blob + pub. Any new cross-seat mutator needs all three branches.
- **Two senders of one fact: fix the ORDER on the path you control, lean on the receiver's de-duplication on the one you do not.** Bot v0.6.147 infers an oust from a published pool of 0 and collects. Human/host ousts: we push the roster synchronously, ahead of the debounced board, so the inference finds `out` already set. Bot self-oust: its board leaves before its `bounty`, so the inference wins and the bot's `_bountyFrom` set swallows our verb. Both orders were read in the bot's source AND asserted live (+6 exactly once) — reading alone would not have caught a double.
- **A destructive run against a FREEZE bug hangs — give it a timeout and count the hang as the proof.** The sweep test against v2.6.121 never returns; the first destructive run ate the 300 s tool limit and lost all output. `timeout 120 node … > file`, then run the remaining async tests from a copy of the suite with the hanging test cut out.
- **Select by key, not by index, the moment a list can grow from outside.** `botDeckIdx` was fine while the five decks were a literal; a menu extended by whatever the loaded bot registers makes an index mean different decks before and after the script loads.

## v2.6.121 learning: never let a style win by source order alone

A rule that overrides another at equal specificity is a dependency on line
numbers, and no reader of the CSS sees it. If an override must win, give it a
reason to: an id anchor, a data attribute, a longer chain — something the
cascade decides, not the file layout. A test that pins "A comes after B" is a
test of the fragility, not a fix for it.

## v2.6.120 learning: a corrected doc is not a corrected product — grep the HTML for the old claim

v2.6.114 corrected the record: quick phrases had no setting. The tooltip that
made the claim kept shipping for six releases, because the correction went to
the docs and nobody searched the source for the sentence. Rule: when a claim is
withdrawn, grep every user-facing string for it (tooltips, tutorial steps,
placeholders) in the same round. Second, smaller: when a visual gains a setting,
put the recipe on ONE class on ONE element and let a test assert what the
recipe does NOT touch (size clamps, sibling elements) — the negative space is
where "make the text crisper" quietly becomes "the medallion changed too".

## v2.6.119 learning: a global key binding must ask WHERE the focus is, not only WHETHER the target exists

Enter's gate checked that the chat line was on screen and nothing else. A focused
button also answers Enter, and a global handler that prevents first takes that
answer away from every keyboard user in the game. Rule for any key that has a
native meaning (Enter, Space, Tab, arrows): the `when()` gate reads
`document.activeElement` and yields to a control that owns the key. Corollary
for the suite: when a test counts side effects (`prevented`), re-derive the
count after every added case — the harness caught my miscount, which is the
whole point of running the new test on the new file before the destructive run.

## v2.6.118 learning: a "fixed" key is a hidden default, and a state left un-rotated makes a correct reader wrong

Three things from the feedback round. **(a) Check the keyboard before promising a
default key.** § was already the fixed view-cycle key, and its listed twin ` is a
dead key on Swedish keyboards — so for the players who asked, § was not "free",
it was the only way into the view cycle. A fixed key is a default nobody can
change; the honest move was to make BOTH bindings rebindable and let Johan pick
the defaults, not to silently steal one. **(b) A gate belongs before
preventDefault.** Moving Tab and Enter into the keymap would have eaten them
everywhere (solo, no chat line) if the dispatch had prevented first and asked
later; `when()` is checked before any side effect, so an inapplicable key is
invisible to the handler. **(c) Tab was correct and useless: `toggleActiveHome`
read `net.turnSeat` faithfully, and `pass()` never rotated it into the bot seat
during the sweep.** When a reader of shared state is "wrong", check whether the
WRITER ever produced the value the reader is waiting for — v2.6.67 made bot
turns count for the turn counter but not for the seat, and the two drifted apart
for a month with no test between them. The new sweep test reads `turnSeat`
INSIDE the stubbed bridge turn, where the truth is.

## v2.6.117 learning: a handler that changes state BEFORE delegating changes what the delegate can see

`closed` set `net.status='off'` before calling `mpLeave` -- correct for the socket
(no `leave` to a deleted room, no rejoin loop) and fatal for the felt, because
`mpLeave` asked `inRoom()` to decide whether the cards were an online game's.
The two facts sat in different functions, and the v2.6.105 test pinned the socket
ordering but never looked at the board afterwards. Rule: when a caller mutates
state to steer a delegate, audit every question the delegate asks of that state;
and decide "whose cards are these?" from a fact about the cards (`deckUp`), never
from a fact about the connection.


## v2.6.115 learning: closing a socket is a DISCONNECT, never a departure -- and it races any verb you sent on another socket

`netBotRemove` sent `kick` on the host's socket and closed the bot's in the same
breath. The server reads a bare close as `dropPlayer(conn,false)`: the seat stays
in the roster with `p.off` stamped, because that is the reconnect window a human
is entitled to -- and `kick` then REFUSES that very seat ("still reconnecting").
Two sockets, two orderings, and the losing one leaves a half-removed player.
The rule: a client that owns a peer's socket makes that peer LEAVE (`leave` =
`dropPlayer(conn,true)`, spliced out at once) and closes only after the roster
push confirms it. Never close first and verb afterwards.

## v2.6.115 learning: hiding something as a SIDE EFFECT of another rule breaks the day that rule becomes a choice

Your own chat line has two sources -- the sender-side paint and the server echo.
v2.6.50's `if(m.who !== net.you)` in the handler was written to hide your own
line, and silently also carried "an echo you already painted must not paint
again". v2.6.113 promoted that test to a three-way MODE, which kept the first
intention and dropped the second: "Show all" un-hid the echo and the bubble
doubled. When a hard-coded test is turned into a setting, enumerate every
invariant it was silently holding -- and give each one its own expression (here:
a `src` argument that is not a mode at all).


## Technical learnings (design facts to honour)

- **The serialization format is dual-purpose** - it is both the local autosave and (public-filtered) the multiplayer wire format, and it was designed that way on purpose. Keep new state forward-compatible; don't break the shape casually.
- **Hotseat and online are deliberately the same game, two transports.** Board model, serialization, public-board format, turn structure, victory points and oust rules are shared code. Diverge only where a transport forces it or a local-only shortcut is clearly better. Write a new table feature once against the shared model and it lights up in both.
- **Cards are positioned with a composite `transform`** (translate + rotate + scale on a shared parent). So you **cannot** animate `transform` directly without breaking placement - the entrance/flip animations use the separate CSS **`rotate`** property, which composes on top. **No `perspective`** is applied (the orthographic squash is the safe choice across the shared transform); true 3D would need a per-card inner wrapper that owns the perspective.
- **Victory points are clamped 0-10 in 0.5 steps**, the same way on client and server. The oust bounty is **+6 pool and +1 VP** to the predator.
- **Seating is turn order; predator = the previous live seat, prey = the next.** The bounty goes to the nearest non-ousted seat *backward* from the ousted player.
- **Oust bounty differs by transport, same outcome:** online is server-authoritative (+6 pool routed to the predator's client, +1 VP set server-side); hotseat resolves locally (it credits the predator's *stored* board's pool, and +1 VP in the roster). In hotseat the +6 lands on a stored board, so it is only seen once you switch to that player - worth saying out loud.
- **`VERSION` is informational on load** (no hard gate), so version bumps are save-safe. The join handshake warns on a **`verMM` (major.minor)** mismatch, not an exact string, so a client-only **patch** bump (2.5.0 → 2.5.1) against an unchanged server is silent — but keep client and server on the same **major.minor**, or the warning fires the moment a friend connects. (Pre-v2.5.0 the check was exact-string, so the drifted 2.4.x/2.3 pair would have warned on every connect.) **As of v2.5.30 the policy is major.minor lockstep** — client and server share the same major.minor, but the **patch may differ for client-only changes**. Both sides now compare `verMM` (the server’s `vWarn` was relaxed from exact-match in v2.5.30), so a client-only patch bump is silent and needs **no server restart**; a real major/minor gap still warns.
- **The server hosts the page AND the WebSocket on one origin, so the client builds its socket URL to match the page.** Over `http://` (direct LAN/localhost) a portless host gets the default `:8123`; over `https://` (a Cloudflare quick tunnel or any reverse proxy) it must **not** — the TLS front answers on 443 and Cloudflare never exposes 8123 publicly, so `wss://host:8123` goes nowhere. `cleanAddr()` strips a stray `:8123` over https. `mpConnect()` picks `wss://`/`ws://` by `location.protocol` (an https page can't open a `ws://` socket — mixed content). This pair is the whole tunnel fix.
- **Behind a tunnel every player looks like `127.0.0.1`, so per-IP logic must repoint or exempt loopback.** The connection cap and room-create cap exempt loopback (a tunnel legitimately multiplexes many connections through one loopback address). The password-fail throttle can't simply exempt it (that would leave brute-force unthrottled over the tunnel), so it keys by context: `failKey = loopback ? 'room:'+room.name : conn.ip` — per-room throttling over a tunnel keeps the protection while isolating rooms from each other. Any *new* per-IP limit added later must make the same loopback decision.
- **A 30s server WS ping keeps a quiet online game alive through a Cloudflare tunnel** (its idle timeout is ~100s); the 75s dead-connection reaper is deliberately >2 ping intervals so one missed ping is forgiven. Browsers answer pings at the protocol level — no client code. Auto-reconnect uses immediate 2.5s retries (intentional: reconnect the instant the host's laptop wakes), with a `net.ws!==ws` guard so a superseded socket's close can't tear down a live session.

- **When a VTES rule or game function is unclear, look it up - don't guess.** The official rulebook is at **vekn.net/rulebook** (the link Elysium ships in-app); card data and rules text come from KRCG (static.krcg.org).

- **L3 (helicopter) has TWO coordinate worlds, and most L3 bugs are a mismatch between them.** (a) **Opponent furniture** — every `.mat`, `#l3table`, `#l3timer` lives *inside* `#l3stage`, which carries `transform: translate(pan) scale(Z)` with `transform-origin:0 0`. They scale + pan as one rigid unit automatically; you set their *unscaled* slot coordinates and the stage does the rest. (b) **Your own live board** — `#z-ready`, `#poolWrap`, `#edge`, your cards live *outside* the stage on `#board`, and are placed manually by `setCenterFrameA`, which folds the same transform in by hand: `Px + Z*coord` for position **and** `scale(Z)` for size. The rule: an element either rides the stage (put it in `#l3stage`, touch nothing) or is hand-folded (then it needs BOTH the `Px+Z*coord` position fold AND a `scale(Z)` size fold — see the inverse-zoom pitfall).
- **`l2pub` already contains the L3 zoom.** `l2pub.s = baseS * Z` and `l2pub.ox = Px + Z*baseOx`. So anything placed through `pubXform`/`pubInv`/`l2pub.s` (ready cards, the pool globe, the Edge *token*) is automatically correct under pan+zoom — you do **not** multiply by `Z` again. Re-multiplying is the classic double-transform bug. Only hand-positioned elements that bypass `pubXform` (like the Edge *button*, positioned with raw `Px+Z*…`) must apply `Z` themselves.
- **`pubInv(pubXform(x)) === x` exactly** (verified): `pubXform` is `ox + s*(x-bx)`, `pubInv` is `bx + (x-ox)/s`. This is why the drag→drop→re-place round-trip for cards and tokens never snaps: drag draws at board-space `x`, drop stores `pubInv(x)` as canonical, re-place draws `pubXform(canonical)` = the same `x`. Trust this identity instead of adding correction fudge.
- **Geometric hit-testing beats `elementsFromPoint` across stacking contexts.** `opponentSurfaceAt(cx,cy)` / `readyZoneAt(cx,cy)` walk `.mat[data-seat]` (and `.matzone-r` for ready) comparing `getBoundingClientRect()` against the cursor. This is robust where `elementsFromPoint` fails — e.g. the Edge token lives on `#board` but the mats live in `#l3stage` (a different stacking context with `pointer-events:none` on the container), so `elementsFromPoint` returned the token or nothing. Card-give already used the geometric path; reuse it for any cross-board drop.
- **Mat-relative fractions are the coordinate-system-agnostic way to place something on another player's board.** When dropping onto an opponent's mat, never `pubInv` the drop point in *your* slot's space — that gives a wildly off canonical value (your slot and their mat are different screen regions). Instead take the drop point as a fraction `(clientX-matRect.left)/matRect.width` of the target mat, then map that fraction into the shared canonical box (`box.x + rx*box.w`). This is exactly how `giveTo` places cards (`rx/ry` 0–1) and how the Edge handoff lands the token inside the receiver's Ready.
- **Hotseat stores three layers per seat; a cross-seat change must touch all three.** (1) `net.hot.boards[seat]` is a **JSON string** (`serializeGame()`) for non-active seats — `JSON.parse` → mutate → `JSON.stringify`, never treat it as a live object. (2) `net.boards[seat].pub` is the rendered public mat view (what `buildMat` reads in the overview). (3) The **active** seat has neither — it is the live `state`, so skip its stored slot (it's stale while live) and mutate `state` directly. The Edge handoff/takeover writes edge-flag + token position into all applicable layers; missing one means the change shows in some views but not others.
- **A token only renders on its controller's mat if it's in `pub.tokens`.** Tokens (the Edge, and any future token) are live DOM on `#board` for the active player only. To make them visible on *every* board in the overview — and when you pass the turn in hotseat — `buildPub()` exports `tokens:[{type,x,y}]` and `buildMat()` draws them from `pub.tokens` with the same `X()/Y()/s` mapping as cards (read-only, `pointer-events:none`). Anything that should appear on opponents' boards has to flow through `pub`, not just the live token Map.
- **L2 Prey/Predator tabs: keep a single interaction model.** The tabs (`#l2preyTab`/`#l2predTab`, `position:fixed`, z:630) sit above the folded-out columns (`.l2pane2`, z:60) — the existing `toggleL2Fold` handler works in both directions. Hiding the tab when the column opens forces users to switch mental model from "click tab → open" to "click header strip → close". Showing the tab in both states keeps one consistent UX. The `l2tabon` class provides the open-state visual cue; the header strip (`l2hd`) remains as a parallel close path.
- **Token/globe drag in L4 must apply the same scale as placement.** `placeToken` and `placeL4Globe` multiply by `L4_TOKEN_S` (0.7), but the pointermove handlers originally used only `l2pub.s`. The missing multiplier caused a 1/0.7 ≈ 43% size jump at drag start — the token appeared to "lift" toward the cursor. Fix: `(l2pub.on?l2pub.s:1)*(l4on()?L4_TOKEN_S:1)` in both drag handlers, mirroring the card drag pattern (`L4_CARD_S`). General rule: any element scaled at placement must use the exact same scale expression during drag.
- **Hit-testing in L4 must use the visual scale, not the L2 base scale.** `attachTargetAt` computes card hit-boxes from `sc`; in L4, `sc` must include `L4_CARD_S` (0.5), otherwise the hit-box is 2× the visual card width and height. The same `(l2pub.on?l2pub.s:1)*(l4on()?L4_CARD_S:1)` pattern applies. Symptom: cards attach to targets that look far away, and "snap back" when the dropped card jumps to the false host's position.
- **L4 dock close AND scale should be deferred during hand-card drag.** In L3 the dock closes + card scales instantly at drag start (line of sight to the board matters). In L4 the board IS the dock area — closing and shrinking instantly removes context. Defer with `drag.l4DockDefer=true`: no `regrabAtScale` at start, card stays at s=1, dock stays open. Transition on cursor exit (`yd < H*0.66`): close dock, `regrabAtScale(c, drag, boardScale)`. Re-enter (`yd >= H-36`): `setL2Dock(true,true)`, `regrabAtScale(c, drag, 1)`. The transition checks must run BEFORE the x,y computation so that `regrabAtScale` offsets feed the same frame's coordinates — otherwise the card jumps one frame.
- **Stacked children should be invisible to placement logic.** Cards with `c.host` (attached to another card) should be filtered out of `attachTargetAt` and `nudgeFree`. Without the filter, children's hit-boxes cause false attachment triggers (the cursor overlaps a child, `topHost(t)` returns the host, and the dropped card attaches to the wrong minion), and `nudgeFree` pushes newly played cards away from the stack's visual footprint even though the children are "riding" their host. Children remain hoverable, previewable, and selectable — only their collision/overlap footprint is suppressed.
- **L3/L4 board AR is canonical (collapsed-panel proportions).** `l3canonAR` is computed once at enter-time based on the board width as if the aside panel were collapsed (+244px compensation if open). `l3geom()` letterboxes this AR into the current board dimensions: panel collapsed → fills edge-to-edge, panel open → dead space top/bottom. `_asideResize` flag distinguishes aside toggles (keep AR) from true window resizes (recompute AR). This keeps the `#l3table` marking proportionally fixed.
- **L3/L4 should use `l2cols` (fill `#tableArea`) to unify dead space.** The fixed 1004×616 canvas + CSS scale creates a letterboxed dead space with `#tableArea` background, separate from the board's felt-texture zoom dead space. Adding `l2cols` makes the board fill the container via CSS `inset:0; width:auto; height:auto; transform:none` — all dead space is inside the board. `l3geom()` returns the actual board dimensions; all L3/L4 layout is fraction-based and resolution-independent, so it adapts. `fitBoard` must return early for `l2cols` regardless of L3 mode (the old guard `l2cols && !l3mode` skipped L3). The resize handler must include `net.view==='l4'` → `renderL4()` — L4 was previously unhandled, leaving `l2pub` stale after a container resize.

- **Seats are array positions, not a stored field.** On the server a player object has **no `.seat`** - seats are computed only inside `roster()` as index+1. Address a seat by `room.players[seat-1]`, never `players.find(x => x.seat === n)` (that silently finds nothing). And the server **derives** the actor's seat from `room.players.indexOf(p)+1` rather than trusting a client-sent `bySeat`/`toSeat` - a client can lie about which seat it is.
- **You can drive the client's real functions in Node.** `elysium-test-harness.js` loads the whole `<script>` under a Proxy DOM stub (every property access returns a chainable stub; numeric-ish props return `0`) and exposes the functions. The monolith runs to completion because almost all DOM work lives inside function *bodies*, not at top level - so `serialize`/`restore`/`buildPub`/`pubXform`/`baseView`/`dbg` are all callable and assertable. `let l2pub` is a mutable object, so a test mutates its fields and the real `pubXform`/`pubInv` read them - no need to extract anything. This is what makes the refactor safe: the suite guards the *live* code, not a copy.
- **The client has a diagnostic channel now.** `dbg(tag, e)` feeds a capped ring buffer (the silent network/escrow catches + uncaught errors); **`elysiumDbg()`** dumps it from the browser console; `conv.debug:true` mirrors each new entry to `console.warn` live. When an online desync is reported, ask for `elysiumDbg()` output - the buffer records even with the flag off.

## Technical pitfalls (avoid these)

- **A project-knowledge `.docx` may be a TEXT EXTRACTION, not the real binary (2 July 2026).** `Elysium_-_Host_Guide__1_.docx` in `/mnt/project/` is plain UTF-8 markdown-ish text (~10 KB) -- `unzip` on it fails ("did not find end of central directory signature") because it simply isn't a zip/docx container. This is how Claude Projects appears to index an uploaded Word doc for search: the extracted text lands in the snapshot under the original filename. Lesson: if `unzip` fails on a `.docx` from project knowledge, don't fight it -- `cat`/`view` it as plain text (it reads as clean, faithful content) and treat that as your CONTENT SOURCE, then rebuild a fresh `.docx` with `docx`-js (see the next pitfall) rather than assuming the file is corrupt or that editing is impossible.
- **When the real generator (`build-docs-en.js`) isn't in snapshot, rebuild the `.docx` directly with `docx`-js instead of blocking.** CLAUDE.md's standing rule is to ask Johan rather than assume the generator is gone -- but when Johan has explicitly asked for the delivered file itself (not a generator edit), the right move is: extract the existing doc's full text (previous pitfall), diff every unchanged paragraph string against the original programmatically before shipping (`s in original_text` for every literal you did NOT intend to change -- catches transcription slips immediately, verified clean here: 0 unintended diffs across 54 paragraph/bullet strings + 23 table rows), assemble a fresh `Document` with matching heading levels (for a working `TableOfContents` field), a bullet `numbering` config, `ShadingType.CLEAR` table headers (never `SOLID`), and a `Footer` with a real `PageNumber.CURRENT` field. Verify by rendering to PDF + PNG per the docx skill and actually looking at every page -- caught nothing here, but it's the only way to know. State plainly in the delivery that exact original *visual* styling (fonts/colors from Johan's real template) couldn't be reverse-engineered from text alone, and that pasting the same new section content into the real generator, when Johan has it, re-establishes the authoritative pipeline.

- **"Wired but never live-tested" rots silently.** The `edgePass`/`edgeTake` online verbs shipped with four latent bugs (wrong seat lookup, dropped `pos` field, trusted the client's seat, missing `!room.started` guard) purely because hotseat is the primary transport and nobody exercised the online handoff. Treat any online-only path that isn't run regularly as suspect until proven - it's a prime candidate for the logic suite plus a live two-client check.

- **A stale guard inverts into a mask (v2.5.35).** The project snapshot's server (2.5.0) and BOTH test suites (expecting the pre-cross-board 39/45 handler counts) had lagged a month behind the delivered files. The stale server + the stale server-suite AGREED with each other → a false-green 5/0 in the sandbox; the current client against the stale client-suite produced a standing "15/16" that got explained away as a pre-existing quirk. Lessons: (1) when a guard-count assertion fails, first ask WHICH side is stale — the artifact or the guard; (2) sync delivered server/test files into the project with the same discipline as the client (the client habit held; the rest drifted); (3) a re-synced suite must be verified in BOTH directions — green against the current artifact AND red against the stale one, or it guards nothing.

- **A hand-written interface doc rots; a machine-guarded one cannot (v2.5.37, Batch 4).** ELYSIUM-PROTOCOL.md's verb/message indexes were GENERATED from the live handler tables at birth and are kept honest by `test-protocol-doc.js` (doc↔code set-diff, both directions, verified red on a broken copy before shipping). The generalisable pattern: when documenting any enumerable code surface (handlers, verbs, settings), (1) generate the index from the code, (2) embed machine-readable markers, (3) ship a lint that diffs them, (4) prove the lint fails on a mutilated copy. Prose can then evolve freely - only the indexes are load-bearing.

- **Once-attached listeners on a PERSISTED element must read live refs, not their creation closure (v2.5.36, from the A3b reconcile).** When a rebuild-style renderer becomes a reconcile (elements reused across renders), every listener attached once at creation still closes over the FIRST render's data object -- a later flip/rename makes "Set as target" (and the whole context menu) act on stale `faceDown`/`name`/`owner`. Fix: stamp `el._rc=c; el._ctx=ctx` on EVERY render and make the handlers read those. This class of bug is invisible in a teardown-rebuild world (elements never outlive their data) and appears the moment persistence is introduced -- audit every once-attached listener when converting a renderer.

- **A shared low-level primitive must own its global guard — callers can't be trusted to (v2.5.35).** `tickTone()` was the one Web-Audio primitive without the master-volume guard, and precisely its call sites (reaction ticks, the RESOLVE gong, the 💬 say-pop) are the BROADCAST ones — so every client heard them at volume 0. When adding any new shared sfx/fx primitive, put the master guard + slider scaling INSIDE it (the `sfxSweep` pattern), never rely on each caller remembering.

- **L4/Classic render-path drift, sub-class 2 (v2.5.35, from A1/A2).** Beyond the documented "missing `'l4'` dispatch branch" class, the branch can exist but call a THINNER parallel implementation: `renderL4OppCards`/`updateL4Opponents` had silently skipped opponent-visible fields that `buildMat` handles (non-pool tokens; the clan-icon refresh after the first pub). **Checklist: when adding/changing any opponent-visible state in `buildPub`/`buildMat`, also handle it in `renderL4OppCards`/`updateL4Opponents`; durable fix = consolidate L4 onto `buildMat`'s logic (pairs with the A3b reconcile).**

- **Python `\b` i strängar = backspace, inte regex word boundary.** I en Python heredoc-sträng () tolkas  som ASCII 0x08 (backspace), inte den bokstavliga texten . Resultatet i JS-filen blir  som aldrig matchar. Fix: använd raw strings () eller dubbla backslash (). Denna bugg drabbade sect-deriveringen — alla fem regex-tester returnerade null, och  var alltid false, vilket gömde hela Follow Path-menyn.
- **The `\u` / `\U` backslash trap** - inside a `'PYEOF'` heredoc, a single backslash produces the character; a double backslash produces literal `\u...` text in the file. This caused a literal-escape bug twice (the trophy emoji). After any edit that adds special characters, grep the output to confirm the real character landed.
- **Line-number drift** - every edit shifts subsequent line numbers. Re-grep before the next edit; never trust a remembered line number.
- **Fragile find-anchors** - don't put smart quotes, em-dashes or arrows in find-strings; pick plain-ASCII substrings that are unique, and keep the fancy characters in the replacement only.
- **Don't run the WebSocket test suites blind** - the sandbox network is usually off, so a failed connection is not a code failure. The syntax check + the load harness are the dependable gates.
- **Don't append `:8123` to a tunnel address.** A Cloudflare quick tunnel only exposes 443; the local 8123 is never reachable from the public side, so the address must stay portless over https (→ `wss://host` on 443). This was the entire reason remote friends couldn't join — the client was force-appending `:8123` in `cleanAddr`.
- **A shared identity key over a tunnel becomes a shared lockout.** Because all tunnel players are `127.0.0.1`, any per-IP counter (connection cap, create cap, password-fail throttle) silently becomes a *global* counter across every tunnel player. The connection/create caps exempt loopback; the fail throttle repoints to per-room. When adding any new rate limit, ask "what does this key to behind a tunnel?" before shipping.
- **Don't claim runtime/visual behaviour works** - the sandbox can't render or run the game, so animations, layout, turn flow, hotseat switching and every online path are unverified. State that plainly and let Johan test live.
- **Don't forget to copy the freshly built file** - `cp` to outputs and `present_files`, and verify the *new* version went across (a stale-docx copy slipped through once; the timestamps/sizes caught it).
- **Don't relitigate dismissed ideas** - when an idea is set aside, the reasoning is recorded (a habit carried over from Abyssal Survivors). Check before re-proposing.
- **Inverse-zoom is the tell that an element has position-fold but not size-fold.** If something in L3 *shrinks as you zoom in* and drifts relative to everything else, it has `left/top = Px+Z*coord` (position scales) but a fixed pixel size (no scale). Fix: add `transform: scale(Z)` with `transform-origin:0 0` so size scales too. This bit the Edge **button** — position rode the zoom but it stayed 32px, so it looked like it was counter-zooming. (The Edge *token* never had this because it goes through `pubXform`+`cardTransform(…,s)` which scales both.)
- **`transition: all` + per-frame JS `left/top` = glide-and-snap-back.** Any element you reposition every animation frame during an L3 pan must NOT have a CSS transition on position. `#edge` had `transition:all .25s`, so each pan frame animated toward the new spot with a 250ms lag — it floated behind the cursor and snapped back on release. Fix: restrict the transition to visual props only (`background, border-color, box-shadow`), never `left/top/transform`. Same root as the `.l3panning .card{transition:none}` rule.
- **A read of a token's position must happen BEFORE `removeEdgeToken()`.** In the handoff, reading `tokens.get('edge')` *after* removing it returns null and the drop position is lost. Capture coordinates first. And note `tok.x/tok.y` is **stale during a drag** — it's only refreshed by `placeToken` on the *next* frame — so derive the live drop position from the drag's own `d.x/d.y` (board-space), not from `tok.x`.
- **A CSS rule with no inline-style counterpart wins silently.** `#board.l3mode #poolWrap .plabel{ display:none }` (left over from before the pool zone existed) hid the "Pool" label no matter what JS set, because the JS only touched `font-size/left/top`, never `display`. When an element "won't show" and the JS looks right, grep the stylesheet for a leftover rule on that selector before debugging the JS.
- **Calling a non-existent function is a silent bug until exercised.** `convertCardKind()` called `updateClan()` (which didn't exist) — passed syntax check and load harness because the call was never reached. The fix was `updateMyClan()`. Lesson: the load harness catches top-level crashes but not errors inside unreached function bodies. When renaming or moving functions, grep for all call sites.
- **One DOM element can't be in two places.** `#poolWrap` was being driven both as your slot's pool zone AND as the dock-panel pool, so the two writers fought (right size for one, wrong for the other). The fix was a dedicated second element (`#dockPool`) for the dock, with `updatePool()` syncing both. If you're toggling the same node between two contexts on every layout, you probably need two nodes.

## How Johan likes to work (soft values)

- **Deliver fully realized proposals, not step-by-step approval.** Johan reacts to complete implementations or designs - build the whole thing, then let him respond. Don't pause to ask permission at each increment.
- **Use the creative latitude.** Independent creative judgment is welcome and expected; bring ideas, don't just execute literally.
- **Be honest, not flattering.** Critique, push back, and surface trade-offs constructively. Verification over guessing - if something is uncertain or unverified, say so.
- **End with honest caveats.** Because the environment can't render or run Elysium, close each change by flagging exactly what is left for Johan to eyeball or test live.
- **Swedish in chat, English in artifacts** (UI + docs).
- **External ideas get a curatorial eye.** Johan brings ideas from other AI tools and design articles and integrates them selectively - engage critically, don't just adopt.
- **Sweat the details.** Variable scope, visual timing, serialization design and edge cases all get careful attention here; match that bar.
- **Tone is positive and collaborative.** Keep it warm and direct.

## Prompt-complement cheat sheet

A compact block to paste into a prompt when starting a fresh session, so the assistant spins up correctly:

> Project: **Elysium** - a single-file vanilla-JS browser VTES table (client `elysium-vtes-bord.html`) + a zero-dependency Node server (`elysium-server.js`); hotseat + online; v1.99.x (2.0 reserved for a future refactor — keep using 1.99.x). Reply in **Swedish**; the UI and docs are in **English**.
>
> Constraints: the sandbox **can't render HTML or run the server**, so all visual / turn / hotseat / online behaviour is **unverified - I test it live**; bash networking is usually off (don't run the WS suites blind). Verify with the JS syntax check, `harness_faithful.js`, and `node test-client-logic.js` (8 client-logic assertions).
>
> Style: give me **fully realized proposals to react to** (not incremental approval), use creative latitude, be **honest** (verify, don't guess), and **end with the caveats** of what I still need to test.
>
> Edits: atomic Python `assert count`-first batches; unique ASCII anchors; single-backslash `\u` / `\U`; always `cp` to outputs + `present_files`.
>
> Protocol: **read the latest project-context + learnings first** (newest version wins), and **update both after each implementation**.
>
> Full picture in `elysium-project-context.md` and `elysium-learnings.md`.


## Z-index / stacking layer map (reference — current after the tutorial-engine v2 pass)

Quick rule: when something is "buried", find its band below, then check the **stacking-context traps** at the bottom — a child can never escape a raised/transformed ancestor's context no matter how high its own z-index.

### Top band — tutorial overlay + the few things that must sit above it (100000+)
- `100060` `#cardFxTop` — top-level clone/flip animation host, used ONLY while the tutorial is active (so card clones render above the dim). Normal host `#cardFx` (5900) is trapped inside `#board`'s transform context, hence this sibling.
- `100055` `#hoverCard` — Ctrl+hover card preview (raised so it reads over the tutorial).
- `100050` `#helpOverlay` — the `?` controls overlay (lives in `#tableArea`, which is NOT a stacking context, so the raise reaches root).
- `100044` `#submenu2` · `100040` `#submenu` · `100036` `#menu` (base) — right-click menus, raised above the tutorial so the menu + its `menuHi` glow read over a card's ring while navigating (Actions → Bleed). **Was 8000/8010/8020 before this pass.**
- `100003` `#tutEnd` — "End tutorial" button.
- `100002` `#tutBubble` — instruction bubble (draggable; its `::after` arrow is aimed by `tutArrow`).
- `100000` `#tutLayer` — spotlight layer; `#tutFenceT/B/L/R`, `#tutRing`, `#tutHole` live inside it.

### High band — toasts, tooltips, drag ghosts, full-screen FX, modals (3500–9999)
- `99999` cross-board drag ghost (set inline in JS during a drag).
- `9999` `#cardTip` (tooltip) · `9900` `#libDragGhost`/`#cryptDragGhost` (pile drag ghosts) · `9800` `.flycard` (fly-to-pile) · `9000` `.rhghost` + reaction HUD preview.
- `8600` `#logInspect` · `8500` `#logPeek`.
- `6050` `#turnFx` · `6000` `#decideFx` · `5900` `#cardFx` (trapped in `#board`) · `5800` `#sayFx`.
- `5000` `.card.dragging` (+ JS group-drag) — a card mid-drag jumps here.
- `800` `#overlay` — the modal backdrop AND every modal inside it (alerts/`#dialogModal`, Settings, Deck Lab). Modals are ~800, BELOW the tutorial — that is why `tutTick` only hides the tutorial for `#dialogModal` (transient alerts), not content modals.

### Card / dock / felt band (34–4800)
- Cards stack DYNAMICALLY: `c.z = ++state.topZ` on raise (same for tokens `tok.z`, pool globes `glob.z`).
- `4800` `.card.handhover` (`!important`), `#l2dock` (dock handle).
- `4700` `#edge`/`#pseat`/`#poolWrap`/`#poolHelp` (L2 chrome; `#poolWrap`→4700 when the dock is open so right-clicks hit the glob, not the dockbg).
- `4620/4619` `#readyTab`/`#readyPeek` · `4616/4615` `#handTab`/`#handPeek`.
- `4600` `#dockLog`, open-dock zones `#z-crypt/#z-library/#z-ash/#z-hand`, `#z-pool`.
- `4500` `#marquee`/`#poolWrap`(L3) · `4400` `#l2dockbg` · `4300` dock-open chrome · `4000` `#rvHand` · `3500` `#rview`.

### Base UI band (0–900)
- `900` `.matlab` · `760/759` `#playedTab`/`#playedOverlay` · `650` `#statsDock` (Table tab) · `630` `.l2peektab` · `600` `#toast` · `150` `.zcount`.
- `80` `#l1zoomWrap` (zoom/help toolbar — a stacking context, traps `#l1zoomCtl`), `#l3zoomCtl`, `#l4hint`, `#empty` (welcome screen).
- `72` `.l4globe` · `70` `#z-hand`(L3 open) · `1–6` within-card/component stacking (tokens, badges, tags, numerals).

### Stacking-context traps ("why my z-index didn't work")
- **`#board { will-change:transform }`** → stacking context → traps `#cardFx` (5900) and everything on the board. To float above the tutorial you need a TOP-LEVEL sibling (`#cardFxTop`).
- **`#l1zoomWrap` (absolute + z-index:80)** → stacking context → traps `#l1zoomCtl`; raising it alone can't lift it above the tutorial, so the bubble dodges it instead.
- **`#tableArea` (relative, NO z-index)** → NOT a stacking context → its children (`#helpOverlay`, `#l1zoomWrap`, `#board`) compete at root, so `#helpOverlay` could be raised to 100050 directly.
- **Top-level (after `</main>`):** `#menu`, `#cardFxTop`, `#hoverCard`, `#tutLayer` — all compete at root, so z-raises work directly.
- **CSS variables don't reliably reach `position:fixed` through stacking contexts** — set on `:root` via `document.documentElement.style.setProperty()`.


## Lesson index — June–July 2026 per-version sections (198 sections, 604 lessons; titles only, full text in the archive file)

## v1.5 learnings (the table-views interactivity pass)
- **`mpSend` is WebSocket-only - a no-op in hotseat.**
- **One give, two transports.**
- **Fan-rotated panel cards break drag-offset math.**
- **A z-coverage bug surfaces as the quick-phrase menu.**
- **The home-view abstraction.**
- **Syncing a new host-locked setting = mirror an existing one.**

## v1.7 learnings (Played-tab polish, tab-centering)
- **`avRenderCard` returns the wrapper — use it for event listeners.**
- **Ownership check in a Played overlay: `state.cards.get(c.id)`.**
- **Per-card "clear" = `avBaseline.add(id)`, not `snapshotPlayed()`.**
- **CSS variables for `position:fixed` elements must be set on `:root` via JS, not inherited from `body`.**
- **Disambiguate bulk vs. per-item actions in the UI.**
- **`showMenu(items, x, y)` in a contextmenu handler: always `e.preventDefault()` first.**

## v1.6 learnings (Played cards, the left-panel pass)
- **Scoped card CSS is a layout trap outside its scope.**
- **`showHoverFor` (the Ctrl-hover lupp) is name-based, not id-based.**
- **Find the *universal* mutation point before hooking a counter.**
- **ID-only keys survive hotseat take-control; composite keys don't.**
- **A custom pointer-drag needs `preventDefault()` or the browser steals it.**
- **The felt marquee must exclude every overlay that owns pointer drags.**
- **Sanitising relayed HTML while keeping one safe tag = placeholder-protect.**
- **The complete "refresh the current view" idiom has three arms:**
- **CSS-hide over DOM-remove when a handler must survive.**
- **A manual discard must re-check zone at move time.**

## v1.8–v1.10 learnings (auto-deal, discipline fix, anim speed, draw-click)
- **`dealOpening` uses setTimeout — not usable in a synchronous build loop.**
- **KRCG sends discipline names in two formats — trigram for old, full name for new.**
- **CSS `animation-duration` can be overridden per-element with inline style — no JS animation API needed.**
- **JS-timed side-effects inside an animation must be scaled together with the duration.**
- **Browser fires click→click→dblclick. The two clicks must be suppressed manually in dblclick-mode.**
- **Crypt draw is `influence()`, not `drawCard()`.**
- **`c.owner` and `c.controller` are runtime card fields, not deck data.**

## v1.11 learnings (click-cancel, actor FX, shuffle riffle)
- **`#cardFx` is `pointer-events:none` on the host, not on its children.**
- **`{ once: true }` is the clean pattern for single-fire cleanup listeners.**
- **`activeAnchor()` returns the anchor card object (or null), not just a boolean.**
- **`playOnActive` had actor and target roles swapped in the play-FX call.**
- **`row.insertBefore(newEl, referenceEl)` is the right tool for prepending into an existing flex row.**
- **Pile element IDs for future reference:**
- **CSS custom properties per nth-child are the right tool for staggered parametric animations.**
- **Guard against stacking animations on the same element.**
- **`animationend` fires per-element, not once for the whole subtree.**
- **Online shuffle: fire FX locally, don't wait for a server echo.**

## v1.12 learnings (SFX library wired to events)
- **`setLocked` is the one hook for lock/unlock SFX — not the call sites.**
- **`log()` SFX needs a cooldown, not a per-category gate.**
- **`bell()` was called by `pass()` but defined as a standalone primitive — safe to replace.**
- **Shared primitives go next to the SFX library, not duplicated in each function.**
- **The `heartbeat()` replacement keeps the same function signature.**
- **`showSay` "Hold on…" is SAY index 4.**
- **`sfxPlayCard()` goes in `tagPlayed`, not in `playFromHand` or drag handlers.**

## v1.13 learnings (SFX volume settings)
- **`sfxGain(ch, base)` = the single multiplier point for master × per-channel.**
- **Build the advanced grid dynamically in `openSettings`, not at page load.**
- **Per-channel sliders in a 2-column CSS grid via `sfx-adv-row:nth-child(even)` for the right-column indent.**
- **Gain multiplication applies to every individual value in the synthesis, not a master GainNode.**

## v1.18 learnings (lokal tournament mode)
- **Tournament mode är online-only i grunden — `conv.tournament` är ett lokalt lager ovanpå.**
- **`!inRoom()` är rätt guard för "lokal policy gäller".**
- **Greya ut lokala inställningar när online-policy gäller — visa inte motstridiga kontroller.**

## v1.17 learnings (hand zone contextmenu — djupare fix)
- **Alla kort-element är barn till `#board`, inte till `#z-hand`.**
- **`e.stopPropagation()` i capture stoppar inte andra capture-lyssnare på samma nod.**
- **Kortets `contextmenu`-bubble-lyssnare anropar `stopPropagation` — men det hindrar inte document-capture.**
- **`_menuPinnedHover` som global mutex för "meny öppen på handkort".**
- **Docken (L2/L3) stängs av `pointermove` på board + rview.**
- **`pointerout` på board tar bort `handhover` när musen lämnar kortets yta.**
- **`hideMenu()` är den enda stängningspunkten för alla menyer.**

## v1.16 learnings (hand zone contextmenu)
- **`_lastHandHover` = implicit "selected card".**
- **`_requireSelected(fn)` som guard-wrapper är renare än inline-null-checks.**
- **Tre-nivå undermenydjup fungerar i `showMenu`.**
- **`pushUndo()` ska anropas av anroparen, inte av `move()`/`burnCard()`.**
- **Ellipsis-konventionen är viktig att hålla.**
- **`net.isHost` sätts sent.**
- **Solo = `openImport()`, inte `openOffline()`.**
- **`pointermove` döljer `#hoverCard` vid `!ctrlKey` — dela den inte med logPeek.**
- **`s=2.619` i `logInspectRender` ger ~220×309px.**
- **Shift+scroll = horisontell scroll i webbläsaren.**
- **`pointer-events:none` ärvs inte "bakåt" via CSS-klass på förälder.**
- **`openSayMenu` är högerklicksmenyn för hela filten.**

## v1.19 learnings (conv TDZ-krasch)
- **`let`/`const` i temporal dead zone kraschar även med `typeof`-skydd.**
- **`applyHelper()` anropas top-level tidigt (fas-bar-bygg).**
- **Rätt fix: flytta deklarationen, inte skydda call-sites.**
- **`animMode=conv.anim; applyPco();` ska INTE följa med.**
- **Felet gav inga knappar alls — men Target och asideTab verkade fungera.**
- **`localStorage.clear()` hjälper inte vid JavaScript-krasch.**

## v1.19–v1.20 learnings (reveal, menus, log hover)
- **The context menu system was only 2 levels deep — one shared `#submenu` panel.**
- **Don't fix menu hover bugs with timers or pointer-events juggling.**
- **`.card.handhover` is `z-index:4800 !important` and `#poolWrap` in the L2 dock is 4700.**
- **`findInspect` keyed on `data-cid` (card ID) only — name-only log links didn't preview.**
- **All three log-hover paths must match the same selector.**
- **`log()` now takes a third `privateLine` arg.**
- **`cardFx` kind='handreveal' must NOT broadcast via `t:'fx'`.**
- **Hotseat has ONE shared table log — there is no per-seat log.**
- **Hotseat is the online testbed, but reveal is a known divergence point.**
- **A blocking `prompt()` loses the cursor position.**

## v1.21 learnings (pool glob z-index vs the collapsed dock)
- **A scoped z-index lift can leave the *other* state broken.**
- **The collapsed dock handle `#l2dock` (z-4410) is a click sink, and it's NOT in the board bail-list.**
- **`openSayMenu` wins by elimination, not by intent.**
- **There is exactly one pool glob.**
- **Pick the z-index that fixes the bug without changing unrelated stacking.**

## v1.22 learnings (own pool glob during a Visit)
- **A Visit keeps L2 mode, so L2-scoped `#poolWrap` rules apply there too.**
- **`body.invisit` is the precise hook for "visiting an opponent."**
- **Dock state is the right axis for "focus on them vs. act on myself."**

## v1.23 learnings (matching the opponent pool globe to your own)
- **Your live pool globe is 96px, fixed.**
- **Deriving a size from the zone rect with eyeballed ratios drifts from the real reference.**
- **`buildPub` always sends `bw:1004, bh:616`**
- **The visit mat scale ≈ your home frame scale only when both fill the same area.**

## v1.24 learnings (opponent pool menu + the pool authority model)
- **`.matpool` is a pure behavioural hook (no CSS).**
- **`zbox` now returns its element.**
- **The opponent-pool menu must read counts from `net.boards[seat].pub`, not own state.**
- **THE POOL AUTHORITY MODEL (important for any future host/pool work): pool is 100% client-authored.**
- **Host authority is gated by `p.token === room.hostToken` server-side**

## v1.25 learnings (host control over another seat)
- **Host actions on another seat split by authority: `out`/VP server-side, pool client-side.**
- **Reuse `ousted()` for host-forced oust via an `opts.forced` flag**
- **`awardBountyHot(oustSeat)` now takes an optional seat**
- **New host verbs must repeat the `p.token === room.hostToken` check**
- **Refresh the visited/L3 mat after a hotseat host edit**

## v1.26 learnings (Table-panel rows reuse the pool menu)
- **Extract a menu's item list before adding a second entry point.**
- **"What you may see" maps cleanly onto me vs opponent vs host.**
- **Own piles use the interactive `browse('ash'|'burned')`, opponents use the read-only `viewOppAsh/Burned`.**
- **`statRow` rows are the right hook; spectator rows are built separately.**

## v1.27 learnings (Table panel grid layout)
- **`display:grid` on the row itself (not `display:contents`) keeps hover backgrounds and border-radius working.**
- **Name truncation requires a min-width:0 flex/grid child.**
- **The col-1 pattern (turn indicator + dot OR seat number) is compact.**
- **Edge state was handled by swapping the pool cell class (`.spool` → `.sedge`), not adding a separate column.**

## v1.28 learnings (Table panel bug fixes)
- **When a grid cell should show X OR Y but not both, branch on the condition.**
- **Patch chains must build on the previous output, not the project source.**

## v1.29 learnings (play with open hand — standing grant)
- **A "standing reveal" is a subscription, not an event.**
- **`'all'` as a sentinel beside seat numbers keeps the grant list one-dimensional.**
- **Grants belong in the save blob but NOT in the undo snapshot.**
- **Hotseat reads the grant straight from the stored blob; online needs routing.**
- **Reusing the shared menu builder means new entry points come free.**
- **The open-hand grant is a scoped hole in the escrow secrecy — name it as such.**

## v1.37 learnings (fly-to-pile into the collapsed dock)
- **The collapsed dock hides ALL pile representations — the handle is the only visible target.**
- **The uniform-scale geometry already produces a pleasing "shrink into the bar" effect for a short, wide target.**
- **Factor the visibility test once when a second consumer appears.**

## v1.36 learnings (fly-to-pile animation)
- **Capture the source rect BEFORE `move()` — the card's DOM element is hidden/repositioned by `layout()` the instant it changes zone.**
- **A "fly from A to B" effect is a different mechanism from `cardFx`.**
- **`offsetParent!==null` is the cheap visibility test for "which representation is on screen".**
- **Double-`requestAnimationFrame` is the reliable "start frame paints, then transition" idiom.**
- **`opts.noFly` keeps drag-returns clean while sharing the function.**
- **`transitionend` + `setTimeout` safety net is the standard cleanup pair for CSS transitions.**

## v1.35 learnings (library pile drag)
- **`preventDefault()` on `pointerdown` suppresses downstream `click`/`dblclick` — compensate explicitly.**
- **`pendingRevealDrop` pattern: set before the network send, consume on first read.**
- **Ghost-card positioning: `transform:translate(-50%,-60%)` offsets the image up and to the left of the pointer.**
- **The 5 px threshold separates drag from click at the pointerdown level — not the click level.**
- **`setPointerCapture` ensures the ghost tracks the pointer even when leaving the element.**

## v1.34 learnings (discard/burn top X from library)
- **Keep the single-card shortcuts intact; add N-variants as separate functions.**
- **Server loops, client sends once — for N online operations of the same kind.**
- **`parseInt(undefined, 10) → NaN`; the `||1` fallback makes it wire-compatible.**
- **`pushUndo()` before a top-card operation makes sense.**

## v1.33 learnings (library browse: dblclick + always-reshuffle)
- **Branch the event listener type inside the card-builder loop, not outside.**
- **The reveal-prompt after a "secret" fetch should open centred, not at the cursor.**
- **"Keep secret" as the first item, reveal targets below a separator.**
- **Unconditional library reshuffle is the right VTES rule.**
- **Crypt's reshuffle rule was later made unconditional too (v1.41).**

## v1.38–v1.43 learnings (crypt feature parity + drag guards + attachment zones)
- **`netBrowseOpen` is a parallel browse path that must be kept in sync with `browse()`.**
- **`dropCard` (single drag) and `groupDrop` (multi-drag) are separate code paths — a fix in one doesn't propagate.**
- **`COUNTER_ZONES.includes(zone)` is the correct gate for "attachment should survive this zone transition".**
- **Children stay in `state.zones.ready`; they are rendered by whichever zone layout owns their host.**
- **Dock auto-close via `pointermove` doesn't fire during `setPointerCapture`.**

## v1.45 learnings (ash browse submenu consolidation)
- **Consistent dblclick for all destructive browse actions.**
- **`mode==='view'` arm with no listener is cleaner than a disabled cursor trick.**
- **Keyboard shortcuts bypass submenus — that's correct.**
- **Every ash entry point must be updated when changing the browse interaction model.**

## v1.44 learnings (ash heap browse dblclick)
- **Always use `cardRef`/`cardRefCap` for card names in the game log — never hand-roll `<b>` tags.**
- **Ash heap browse doesn't need a reveal-prompt.**
- **The `else`-branch split pattern (burn / ash / burned) mirrors the library/crypt split.**

## v1.50 learnings (cardFx actor mode)
- **`opts.actor` reversar visuell ordning i `cardFx`, inte ett nytt `kind`-värde.**
- **`row.insertBefore` i omvänd ordning för att prependa två element.**
- **Caption i actor-mode bör visa vampyrnamn + kortnamn, inte spelarnamn + "plays".**
- **`qrPhasePlayed.add(c.id)` ska anropas vid drag-to-ready med aktör.**
- **Actor-mode caption kräver att varken `actor.name` eller `c.name` är tomma.**

## v1.30 learnings (Ctrl+hover in browse modal)
- **`cardRef`/`cardRefCap` för face-down-kort**
- **Klick/hover på "a face-down card" i loggen**
- **Ctrl+hover på brädet**
- **`groupFlipUp` loggar med `cardRefCap(c)` efter att `faceDown=false` satts**
- **`findInspect`-guard:**

## v1.62–v1.67 learnings (stack-drag, sortering, torpor-bounce, KRCG-typer)

## v1.56–v1.61 learnings (session 14)

## v1.55 learnings (hand panel sort)
- **Sort the display array, never mutate the zone array.**
- **`cardTypes.get(norm(c.name))` returns an array — pick the lowest-rank type.**
- **Graceful fallback when DB is absent.**
- **Crypt cards in hand get priority -1**

## v1.51–v1.54 learnings (cardFx caption-system + interaktion)
- **`tagPlayed(c, actor)` är den enda rätta platsen att skicka aktör från alla play-vägar.**
- **`playFromHand` och `dropCard` måste båda skicka `a || undefined` till `tagPlayed`.**
- **Dubbelklick ska vara konsekvent med övriga play-vägar.**
- **`#cardFx` har `pointer-events:none` av god anledning**
- **Caption-blocket bör ha en gren per situation, inte ett generiskt `verb`-system.**
- **`toName` i handreveal-broadcast.**
- **Face-down-fallbacks i captions ska vara kontextspecifika.**

## v1.68 learnings (#poolHelp, delad overlay)

## v1.68 learnings (#poolHelp positionering)

## v1.69 learnings (sfxSilent guards)

## v1.68–v1.71 learnings (pool-zon, Visit, ljud, Table-tabb)

## v1.72 learnings (clan symbol system)

## v1.74 learnings (KRCG clan-data, verifierat mot OpenAPI)

## v1.77 learnings (publik loggning + paths-faktum)

## v1.78 learnings (badge-mall + offset + paths-faktum bekräftat)

## v1.79 learnings (vektorisering av symbol)

## v1.80–v1.82 learnings (Edge-token: vad som INTE funkar + Token-familjen)

## v1.83 learnings (Give control submenu)

## v1.85 learnings (settings export/import)

## v1.86 learnings (Search for first)

## v1.87 learnings (log-target + namnbaserat target)

## v1.88 learnings (logTo-verb)

## Phase 0 learnings (refactor groundwork: edge fixes, sweep #2, logic suite, ring buffer)

## v1.99.27 learnings (pre-2.0 dead-code sweep)

## v1.90–v1.99.26 learnings (L3 Overview build-out + the Edge token saga)

## Fas 1 learnings (handler-maps, modaler, B1-konkatenatorn)
- **Handler-map a dispatch, but don't flatten a *stepped* one.**
- **The B1 concatenator: one scope, dumb concat, `cmp` is the law.**
- **The modal system restores what was underneath.**
- **Async ripple: don't make a hot, broadly return-consumed function `async`.**
- **Lift UI confirms OUT of pure data functions.**
- **`keepLog` must gate `turnLogs` in BOTH `clearTable` AND `restoreGame`.**

## Fas 2 learnings (löv/feature-extraktion, helpers-registry, core-sömmar)
- **Registry-mönstret (HELPER_DEFS) — driv data + wiring från en array, lämna gating ifred.**
- **Klient↔server-uppräkningsdrift är exakt det registret ska fånga — och den fanns redan.**
- **Koden är skriven i ANVÄNDNINGS-ordning, inte modul-ordning.**
- **Relokering (att flytta funktioner för att gruppera) är säkrare än det låter — risken sitter i top-level, inte funktionerna.**
- **Byte-identitet och relokering är ömsesidigt uteslutande.**
- **Byggarens "(N bytes)"-utskrift är TECKEN, inte byte.**
- **Splitter-disciplin för flera fragment:**
- **Färsk dead-code-scan: funktioner som bara förekommer 1 gång = död.**
- **Dead-code-borttagning är beteende-neutral → ingen versionsbump, men en riktig filändring.**
- **State-kontrakt-testerna är relokeringens skyddsnät — pinna det en omflyttning kan bryta i tysthet.**

## Relokeringslearnings (concern-gruppering av monoliten)
- **Brace-counting-parsern måste hantera default-param-braces.**
- **`async function`-deklarationer hissas identiskt med `function`-deklarationer.**
- **Input-concernen är ihålig under disciplinregeln.**
- **`drag`/`giveDrag`/`tdrag` är `let`-satser, inte funktioner.**
- **Splitter-ankare som pekar på funktioner som relokeras bryts — planera bytet FÖRE flytten.**
- **Tre oberoende utvärderingar > en.**
- **Escrow → net.js är TDZ-säkert trots att `let escrowTimer` stannar efter.**

## Board Mode learnings (L4 Classic / Structured)
- **Board Mode är ett spelläge, inte en vy.**
- **"Classic" = Lackey-spelarens perspektiv.**
- **`freeBoard()` är gate-funktionen — inte `l4on()`.**
- **L4 + Tournament Mode = ren Lackey-upplevelse.**
- **Server validerar boardMode strikt.**
- **`cycleView()` och `stepLevel()` är no-ops i Classic**
- **L4 bygger PÅ L3, inte bredvid.**
- **`l3myslot` = hela filtet i L4.**
- **Pool-globerna är INTE tokens.**
- **I L4 delas bara library ut — crypt stannar i högen.**
- **`layoutZone('torpor'/'uncontrolled')` i L4 = fri placering.**
- **`pcoHome` skippar i L4 — `conv.pco` räcker.**
- **`poolGradient(hex)` skapar en konsekvent sfärisk gradient.**
- **L4 piggybackar `l3mode` → alla `l3on()` guards som triggar `renderL3()` måste ha `!l4on()`.**
- **L4 element scaling kräver konsekvent `L4_CARD_S`/`L4_TOKEN_S` överallt i drag-pipelinen.**
- **Zoom-clamp fångade initialt vår L4-zoom.**
- **Ghost-element (position:fixed) måste skalas med `fitScale × l2pub.s × L4_CARD_S`**
- **`dropZone()` i L4 måste bypassas**
- **Dock tvångsstängning var onödig**
- **`c.converted` flag behövs för revert-meny.**
- **KRCG Path-fält (PR #830, OPEN):**
- **Path vs Clan prioritet för pool-globikon:**
- **Sabbat-detektion i VTES: deriverad vid laddning, inte vid varje menyöppning.**
- **En meny för glob-ikon, inte två.**
- **`updateMyClan()` hanterar nu BÅDE klan och path-detektion.**
- **`displaySymbol()` är vad pool-globen visar; `activeClan()` är fortfarande den rena klan-detektionen.**
- **pathBlood helper gates till phase 3 (Influence).**

## v2.2 learnings (Path of Enlightenment, L4 polish)
- **Pile drag target functions are separate from `dropZone()`.**
- **`detectClan()` must skip face-down cards — same as all other detection functions.**
- **Pool globe hint: show-once pattern.**
- **"Special…" submenu consolidates non-generic actions.**
- **`chosenClan` can hold a path name.**
- **Click-outside-to-close needs an exclusion list.**

## Reflektiv analys — kodmognad efter refaktorn

## v2.3 learnings (Files, caching, UX polish)
- **`conv.imgCache` as a boolean guard in `imgUrl()` is the right pattern.**
- **IndexedDB keys for non-image metadata should use `_` prefix.**
- **SVG icons use `svg:clan/slug` / `svg:path/slug` keys in the same IndexedDB store.**
- **`.set-row[hidden]{display:none}` is required.**
- **`loadCardDB` should separate data processing from data fetching.**
- **Image sync is lightweight: Set iteration + Map.has.**
- **The `warmImgCache` cursor approach is memory-efficient.**
- **Download progress: hidden attribute needs CSS support.**
- **`--tab-mid` offset is constant regardless of `#phases` width.**
- **Merging a boolean setting into a dropdown works cleanly with migration.**
- **The `_lastBoardHover` tracker belongs in the existing `pointerover`/`pointerout` handlers.**
- **`cacheVtesJson` should store `size: raw.length * 2`**
- **`imgClearAll` → `localStorage.removeItem` order matters in "nuke all".**
- **HTML elements rendered before `<script>` must start hidden if the script decides their visibility.**
- **DOM cleanup functions must remove ALL child elements they create.**
- **One-shot hint flags must reset in `clearTable()`, not in the view-enter function.**
- **Dock hover guards must account for ALL drag states, not just the card drag.**
- **`restoreGame` must suppress the `.42s` card-transform transition.**
- **L0 must be exited BEFORE any `layout()` that involves cards.**
- **Batch downloads should collect failed names and retry once after a pause.**
- **Download name sets must match the image server's filename scheme.**
- **All game-teardown paths must enter L0.**
- **Online `dealt` handler must call `layout()`.**
- **Every drag mechanism needs a `pointercancel`/`lostpointercapture` safety net.**
- **L3 5-player layout: Bw expansion beyond the 3-band limit is safe because prey/pred sit on the flanks.**
- **The rigid band model is suboptimal for odd player counts (5p, 7p) but correct for even counts.**
- **Decoupling `clockCy` from prey/pred position prevents the Edge button and timer from drifting.**
- **L3 layout tuning is best done iteratively with the user.**
- **Dock z-index must be above `#poolWrap` (4700) when restyled as a solid panel.**
- **Dock-open state must hide pool/edge/help in L2 with `opacity:0`, not just z-index.**
- **L2/L3 dock consistency reduces cognitive load.**
- **Pile drag (ghost) and card drag (element) have separate dock-close paths.**
- **Pile drag ghost scale must be set AFTER `setL2Dock(false)`.**
- **Pile drag drop coordinates must use SCALED card dimensions in L3.**
- **`cryptDragTarget` must check L4 BEFORE uncontrolled.**
- **OPEN ISSUE — dock-to-board card centering under cursor.**

## v2.5.0 learnings (Online / Tunnel connectivity + security hardening)
- **The tunnel "page loads but join fails" signature points at the WebSocket URL, not the static serving.**
- **`cleanAddr` should decide the port by the page's own scheme.**
- **Default the address field to the live page host over https, not a stored value.**
- **Make `copyInvite` scheme-aware.**
- **Version-mismatch checks should compare major.minor, not the exact string.**
- **The password-fail throttle is the one per-IP limit you can't naively loopback-exempt.**
- **The split tool's source-order assert is a real guard — and it was already failing on the pristine monolith.**
- **Re-anchoring a fragment splitter is safe because it's self-verifying.**
- **Comment the non-obvious *why* at the decision point, and leave the self-evident alone.**
- **Expose internals from the test harness only as needed, and the regression test writes itself.**
- **Harness hygiene: the DOM stub must provide every `location` field the client reads.**
- **No exponential reconnect backoff.**
- **No caching of `CLIENT_FILE` at startup.**
- **The reviewer's deep network-stack pass found no bugs**

## Dock-to-board drag precision (post-v2.5.0)
- **CSS `translate` transitions freeze mid-animation when `transition:none` activates.**
- **`regrabAtScale` is mathematically correct but UX-wrong for large scale transitions.**
- **Ghost card `translate(-X%,-Y%)` percentages are relative to the element's CSS box, not the visual (scaled) size.**
- **`pointerup` must `await dropCard` BEFORE removing `.dragging`.**
- **`pointerover` for hand hover must guard against dragging cards.**
- **The perceived "card sinks on release" can have FOUR simultaneous causes**
- **RESOLVED: dock-to-board drag centering.**

## v2.5.1 — Panel & peek polish
- **Every `enterXxx` function should call `setAside` to declare the view's panel default.**
- **A comment stating intent is not a gate — add the guard too.**

## Tutorial spotlight & guided-flow learnings (v2.5.2)
- **Fence-rects beat z-index for a spotlight overlay.**
- **`<select>` and buttons work "through" the hole**
- **A greyed Continue needs a *polled* gate, not a one-time disable.**
- **Detecting "do it *again*" needs a delta, not a state check.**
- **The step counter must count shown steps, not array indices.**
- **Step-aside must target the dialog, not any overlay.**
- **Precons load lazily.**
- **Resolve async prerequisites *before* the layer comes up.**
- **Dynamically-rendered rows have no IDs.**
- **`scrollIntoView({behavior:'smooth'})` composes with the rAF reposition loop.**
- **Version-string drift is a real hazard.**
- **Sections that act on a control should begin on the welcome screen, not jump into the view.**
- **Put "advance into the next view" side effects on the NEXT step's `onEnter`, never the highlight step's `onExit`.**
- **Separate user-cancel from section-complete.**

## Classic gameplay tutorial + tutorial-game persistence (v2.5.2, slice 3a/3b)
- **An L4 / free-board tutorial step can't use the hard spotlight — it needs a coach-mark.**
- **To highlight *several* moving elements, frame a computed rect, not one `target`.**
- **In L4, `#handTab` is hidden and the dock handle is `#l2dock`.**
- **`#statsTab` is visually offset from its layout box (`translateY(-80px)`).**
- **The L4 free board routes a dragged vs double-clicked crypt card to *different* zones.**
- **Gate on the *result of the action you're teaching*, not a proxy.**
- **`closeOverlay()` leaves `#dialogModal.style.display` stale at `'flex'`.**
- **A gameplay tutorial must self-cancel when its table disappears.**
- **Clear a just-fired turn cue before showing a tutorial prompt.**
- **Auto-seating a tutorial game: `startHotseat` already restores per-seat from `boardJson`.**
- **Persist a tutorial game on its OWN key, independent of the autosave mode.**
- **Tag "which game is the tutorial game" at `tutStart`, untag at `startHotseat`.**
- **Document the fidelity trade-off where it bites.**

## Tutorial-engine v2 learnings (slice 3c + onboarding/Crypt rework, v2.5.2)
- **`skip:()=>bool` is the clean branch primitive.**
- **A greyed Continue needs a persistent state to poll, not an event.**
- **All gated steps must be `freeInteract`**
- **Draggable tip boxes: pin by step index.**
- **The bubble arrow must follow the box, not the step's `place`.**
- **Collision-avoidance + `avoidRect`.**
- **Highlighting menu items: match `.mi` textContent.**
- **Context menus and the hover preview had to be raised ABOVE the tutorial.**
- **Discard hotkey: zone-agnostic hover beats selection by default.**
- **The action clone caption is vampire-centric, not player-centric.**
- **A step's `text` can be a function (general engine addition).**

## L4 shared-felt model + slice 3d (Interacting with opponents) + linear gating (v2.5.3)
- **L4 (the Classic table) is effectively a SHARED felt, not just your own board.**
- **Hotseat `setActivePlayer` SWAPS the live state; the previous player persists as a pub.**
- **L4 outline fix — `isPlayZone` must include `uncontrolled` on L4.**
- **L4 drag must not auto-flip uncontrolled cards — that was L2 logic leaking.**
- **Attach/stack tutorial: relative gates survive pre-existing attachments.**
- **`qrPhasePlayed` is the clean "played a card from hand this phase" signal.**
- **Played-tab tutorial touch-points.**
- **Linear section unlocking.**
- **A terminal section step that hands off control must REQUIRE the handoff action, not offer a Continue escape.**
- **Dynamic step copy with an "already done on entry" variant must choose from the LATCHED entry state, not the live state.**
- **A tip bubble pointed at a control that unfolds a panel should be placed PERPENDICULAR to the unfold direction — the dodge list alone isn't enough.**
- **In hotseat, `state.turn` is PER-PLAYER and swaps with `setActivePlayer` — don't use it to detect that a turn was passed.**
- **Dock-pile highlight for a draw/discard step: glow the pile via `onEnter`/`onExit`, on top of the target ring.**
- **The dragged-bubble pin is keyed by `tut.idx` alone, so it leaks across sections that share an index.**
- **Two pile element sets exist — highlight the `#z-*` board zones, not the `#dock*` peek piles, in the L4 Classic view.**
- **Opening the main Menu inside a tutorial step: call `#btnMenu`'s click handler and highlight items with `menuHi`.**
- **Per-seat live state that isn't in `serializeGame` is wiped on every hotseat hand-off (and lost on undo if not in `snapshot`).**
- **Tripped over the documented `/tmp/original.html`-precedes-split rule myself this session — a live example of why it's a hard rule, not a suggestion.**
- **Reaction/signal/seat-swap UI state in the tutorial is best detected by small breadcrumb flags set inline at the real call sites, not by new tutorial-engine plumbing.**
- **`qrPhasePlayed` is a single un-seat-scoped module-level `Set`, not per-player.**
- **`clearTable()` resetting a "show-once" flag is correct for a genuinely new game, but `restoreGame()` also calls `clearTable()` unconditionally — so every hotseat seat-swap silently re-triggers any flag reset there too.**
- **`refreshRTargetView()` (and any other view-keyed refresh dispatcher) must enumerate every render mode, including L4 — it's easy to write the `if/else` chain against the modes that existed when the function was first written and forget the newer one.**
- **Off-board UI chrome (the peek-dock) has its own, separate sizing logic from the canonical-board scale (`l2pub.s`) — don't assume one scale factor governs everything on screen.**
- **Correction to the above: I patched the wrong (retired) dock at first.**
- **`l3HandHover()` (L3's separate "hover the hand panel to peek" overlay, independent of the full dock) is also PARKED/dead.**
- **A per-card scale baked into a fixed-size UI region requires updating THREE layers in lockstep, not just the resting-state CSS: the box size, the resting-state per-card render scale, AND any drag/gesture math that assumes a specific old scale.**
- **Regression from the dock-scaling fix: scaling factor was computed against the wrong dimension.**
- **All of L2/L3/L4 set `l2cols` on `#board`**
- **The dock backing (`#l2dockbg`) height is best tied to the zone geometry, not a fixed percentage, once the zones scale.**
- **Reducing the dock backing height does NOT require touching the hover-to-close hysteresis, but it does loosen it slightly — a tradeoff worth surfacing rather than silently "fixing".**
- **The `l4`-missing-from-a-view-dispatch pattern recurred in FOUR places, not one — it's worth auditing every such chain whenever a new render mode is added.**
- **`refreshRTargetMarks()` queried only `#rvCards`, but the remote-card HOST differs per view**
- **`net.rtarget` (cross-board target) had to be added to `serializeGame`/`restoreGame` to be per-seat in hotseat — `state.target` was already there, but the two targets live in different places and only one was being persisted.**
- **`targetersOf()`'s `if(!inRoom())` guard was unnecessarily online-only — the hotseat infra already has everything it needs.**
- **Archiving the "dead" legacy hand dock (#handTab/#handPeek/#dockBody) was NOT a clean lift — dead and live code were physically interleaved, and the safe move was a no-op stub + leaving guarded refs, not a wholesale delete.**
- **`avRank` sort in `renderPlayed()` was inherited from the retired Reaction Window and caused Played-tab instability.**
- **`+/−` keyboard shortcuts can be made context-aware by checking `state.selected` before deciding what to bump.**
- **When a sort order is "wrong for one use-case but right for another", make it a `conv.*` toggle instead of hard-coding a winner.**
- **`box-shadow` is the right choice for a secondary visual indicator on an element that already uses `outline` for another purpose.**
- **Adding an optional boolean parameter to a shared lambda is cleaner than duplicating it or branching outside.**
- **A shared global counter (`_avSeq`) stamped onto cards at play time (not stored in `state.zones` order) is the right way to get cross-seat chronological ordering.**
- **Dynamic help overlay sections: use a hidden div + show/hide in the open handler, not static HTML.**
- **A per-client incrementing counter is NOT globally orderable online — use a `Date.now()` timestamp when you need cross-client chronological order with no coordination.**
- **When a new sortable field is added to cards, audit ALL the paths that reconstruct a card, not just serialize/restore + buildPub.**

## Cross-board card lifecycle learnings (v2.5.20–2.5.26)
- **Snapshot-based undo cannot reverse a cross-board move.**
- **`destroyLocal(c, opts)` gained a `keepUndo` flag**
- **`makeCard(name, kind, fid)` takes an optional id.**
- **A recall's destination is owner-side, so Burn is a free variant of recall.**
- **In-place edits on a card you control but don't hold use one generic `ctrl` message.**
- **`buildPub` already exports `owner`, `controller`, and `blood` per card.**
- **Opponent-card interactivity is gated by `if(ctx)` in `addRCard`.**
- **There are two give drag-systems; both funnel through `giveTo`.**
- **Double-click plays, drag gives.**

## v2.5.27 learnings (dock peek-log fix + robust tutorial gates)
- **`--dock-s` is height-derived, but width is what constrains the dock.**
- **A zone whose *width* scales but whose *gap* to its neighbour is fixed will eventually overlap.**
- **`max-width:calc(Npx * var(--dock-s))` + a retained `right:Npx` tames an edge-anchored panel proportionally**
- **Robust tutorial gate = poll a monotonic signal that only the target action moves.**

## v2.5.28 learnings (tutorial: menu auto-open pitfall + leaving without saving)
- **Don't open a menu inside a tutorial step and expect the next click to land on a highlighted item.**
- **Leaving the tutorial game without saving it:**
- **A capturing keydown handler that opens a modal needs a re-entry guard.**

## v2.5.29 learnings (Shift-to-peek vs Shift+click)
- **A bare-modifier keydown that shows an interactive overlay clashes with click-gestures using that same modifier.**

## v2.5.30 learnings (undo hover, auto-captured undo labels, major.minor lockstep)
- **An inline `style.translate` silently overrides a CSS `translate`-property lift.**
- **Auto-capturing an undo label from the action’s own log line avoids labelling every caller.**
- **Relaxing the server `vWarn` to `verMM` ends the restart-on-every-client-patch tax.**

## v2.5.31 learnings (Clan/Path auto-detect: printed KRCG path never fed the detectors)
- **A menu-gating check and a detection function can silently drift apart when a new data source appears.**

## v2.5.33 learnings (dock Hand/Log proportional split)
- **A "scale some siblings, fix others, let one fill the remainder" layout guarantees the filler absorbs 100% of any growth.**
- **Clamp proportional siblings together, against a REAL measured bound, not a proxy.**
- **New JS-computed dock sizes go on `:root` as custom properties, mirroring `--dock-s` itself**
- **Setting an explicit `width` on an absolutely-positioned element that also has `left`+`right` set is safe and simply overrides `right`**

## v2.5.34 learnings (End Tutorial wiped per-chapter snapshots)
- **When a new mechanism is built on top of an existing cleanup routine, the cleanup must be updated to respect the new data.**
- **Simulate the ACTUAL exit path, not an approximation.**

## v2.5.39 learnings (touch batch T0+T1)
- **Synthetic-event bridging reaches frozen inline handlers - the old "touch requires handler-body extraction first" claim is superseded.**
- **`touch-action` evaluation stops at the nearest scroll container - an ancestor's `none` does NOT block a descendant scroller.**
- **A synthetic `pointercancel` event does NOT fire `lostpointercapture`**
- **`-webkit-touch-callout:none` on `body` also kills the iOS *paste* callout inside text fields**
- **CSS `transform:scale()` enlarges the hit box, not just the pixels**
- **Window/document-level gesture listeners must be pointerId-scoped or a second finger warps them.**

## v2.5.40 learnings (touch batch T2 - steppers)
- **A hold-to-repeat driving an `async` action needs a modal guard in the tick.**
- **Replace, don't wrap, when converting click-driven buttons to pointer-driven repeat.**
- **Route element-specific taps through the existing gesture pipeline instead of intercepting in capture phase.**
- **Every new hold/repeat control must join the long-press engine's skip-list.**
- **A menu-embedded control needs an item type that skips the leaf bindings.**

## v2.5.41 learnings (touch batch T3 - pinch/pan/dock)
- **A multi-pointer gesture owns its pointers via capture-phase `stopPropagation`.**
- **Teardown routing recap, now with three tiers (extends the v2.5.39 learning):**
- **Two handlers on the same element can hand a gesture off through a module global + registration order.**
- **Anchor a floating affordance to the element whose geometry it must track, as a child.**
- **On precision touchpads, pinch arrives as `ctrlKey` wheel events with fine-grained deltas**
- **"Pan closes it" is usually better implemented as "touch-down on the surface closes it".**

## v2.5.42 learnings (touch batch T4+T5 - roadmap complete)
- **When a touch path performs an action a native listener might also synthesize, give the touch path a yield window instead of trying to predict the browser.**
- **A touch double-tap helper needs two guards, not one:**
- **Compatibility mouse events after touch make hover-tooltips sticky.**
- **An inline-transform-positioned element gets its coarse sizing by folding the factor into the SAME placement math - and the anchor constant tells you how.**
- **A privacy rule expressed as an absent attribute gates features for free.**

## v2.5.43 learnings (the desktop-regression audit)
- **Replace-not-wrap has a keyboard blind spot: converting `click` handlers to `pointerdown` silently drops Enter/Space activation.**
- **`navigator.maxTouchPoints` lies on some Windows driver stacks**
- **Any proportional-from-deltaY wheel math needs `deltaMode` normalization or Firefox breaks quietly**
- **Audit method that worked:**

## v2.5.44 learnings (the L3 pentagon width constraint)
- **An interlocking layout's clearance must be an EXPLICIT constraint, not an emergent property.**
- **Slice-and-run beats read-and-reason for geometry bugs.**
- **A user's pinpoint observation is a binary-search probe.**
- **Fallback branches that approximate the normal path drift into being a separate (buggy) mode.**
- **"Perfect on my machine" can mean "6 pixels from the cliff".**

## v2.5.45 learnings (uniform L3 scaling)
- **"Everything just visually bigger" is a testable theorem, not a vibe: assert `layout(s*window)/s == layout(reference)`.**
- **Converting px constants to fractions needs a CALIBRATION reference, stated in the code.**
- **`max(floor, fraction)` clamps are hidden non-uniformity when the floor binds at the reference.**
- **Pure proportionalization can beat a base-scale (k-clamp) rearchitecture.**
- **Residual differences between physically different screens are the L2-equivalent contract, not a bug.**

## v2.5.46 learnings (the undo coverage audit)
- **Audit undo the same way you audit transport: diff MUTATIONS against CAPTURE, programmatically.**
- **`log()` is load-bearing infrastructure, not cosmetics.**
- **When a flag and its numeric effect are set together, capture both.**
- **A restore function that mirrors another restore function must mirror ALL of it.**
- **Self-healing consumers lower severity but don't excuse asymmetric capture.**
- **Document the declined scope with the decision-maker.**

## v2.5.47 learnings (L3 chrome relocation)
- **A mode-gating check is not exclusive just because it reads like one.**
- **A new module-global flag driving a HIDE must default to the pre-change behaviour, and only the ONE function with new knowledge may flip it.**
- **Persistent DOM elements need explicit hide-reset on mode exit; elements the mode already destroys don't.**
- **Gate the OUTER shell of an existing code block, not its internals, when the internals are calibrated/delicate.**
- **A hardcoded `target:()=>$('#selector')` in tutorial/coachmark code is a hidden dependency on that element always being visible.**
- **When relocating a HUD element into an existing options panel, insert as a sibling OUTSIDE the panel's own full-rewrite region.**

## v2.5.48 learnings (the aside-transition race)
- **A synchronous flag update + a CSS width transition = two clocks; never mix a post-toggle flag with a pre-transition measurement.**
- **Sticky capture vs live derivation decides whether a transition race is a bug or a cosmetic blink.**
- **`dispatchEvent` runs handlers synchronously - a flag cleared on the line AFTER a dispatch is still SET during the handlers.**
- **"Toggling away and back fixes it" is a fingerprint for enter-path state capture racing a transition.**
- **A comment asserting ordering ("X must run first") deserves a why - and gets inverted wholesale when the ordering flips.**

## v2.5.49 learnings (the [hidden] CSS footgun)
- **Any element with its own explicit `display` CSS property (via id/class) silently defeats the `hidden` attribute unless reinforced.**
- **New checklist item for any future `el.hidden=...` toggle: does the element's own CSS set `display`? If yes, add `#id[hidden]{display:none}` in the same patch, or the JS logic will be correct and silently do nothing visually.**
- **A user's precise, oddly-specific-sounding request ("remove the button now") can be a signal that a previous fix didn't actually take effect - take it as a prompt to re-verify your own recent work, not just implement the literal ask.**
- **When fixing a footgun, grep for siblings sharing the same exposure and consider including them defensively even without a confirmed report**

## v2.5.50 learnings (reordering a shared-budget flex row)
- **A width-sharing formula (`avail = total - fixed_stuff`) is order-independent by the commutativity of addition — reordering the ROW doesn't require touching the MATH, only the position formulas.**
- **When two elements share a flexible budget, moving one AWAY from the other doesn't break the split — it just means the shared budget occupies two separate row-gaps instead of one contiguous one.**
- **Reordering N absolute-positioned siblings sharing one coordinate baseline is a single shared-prefix insertion, not N independent recomputations.**
- **A numeric proof harness (compute both old and new arrangements, assert identical total + no overlap) is cheap insurance for a "just reorder it" request that turns out to touch a shared-budget system.**
- **When the person offers a follow-on idea "but let's see how this feels first," record the idea in project-context under On the horizon and stop there.**

## v2.5.51 learnings (pseat scaling - a fix without a free reference point)
- **Not every anchor-constant fix gets a provably-exact reference point.**
- **A function's default/most-common mode matters more than its edge cases when picking a verification reference.**
- **A comment claiming symmetry ("mirrors Edge") can be aspirational rather than descriptive - verify, don't inherit trust.**

## v2.5.52 learnings (aside-aware dock width; a caught patch-script slip)
- **A position formula that unconditionally reserves space for a conditionally-rendered sibling wastes that space whenever the sibling is absent.**
- **Match an existing codebase pattern (`#dockLog`'s own base-hidden/aside-collapsed-shown split) rather than inventing a new one.**
- **A shared-budget split (`avail = total - fixed`) generalizes cleanly to "N-way sharing becomes 1-way sharing when N-1 participants are absent"**
- **Verify a multi-edit CSS/JS patch by grep-checking the RESULT structure, not just the gate outputs.**

## v2.5.53 learnings (the other half of the anchor-math class; offsetWidth ignores transform)
- **`transform-origin` anchor-math has TWO independent drift sources, and fixing only the additive offset's scaling isn't the whole fix.**
- **`offsetWidth`/`offsetHeight` reflect an element's own LAYOUT box, unaffected by any CSS `transform` currently applied to it (transforms are a paint-time operation, not a layout one).**
- **When an element's size varies by content (here: seat-letter length) rather than being a known constant, measure it live rather than assuming a fixed number**
- **A user re-reporting the SAME symptom after a fix means the fix addressed a REAL but INCOMPLETE cause - re-derive from first principles rather than tweaking the same formula further.**

## v2.5.54 learnings (anchor the edge the spec references)
- **When an alignment spec names a specific edge, make THAT edge the transform-origin - drift becomes impossible by construction, and compensation terms retire.**
- **A `literal/scale` offset inside a scaled wrapper is scale-invariant on screen - and the codebase already documents these ("offset stays literal").**
- **The user's eyeball estimate can be a precision instrument - check it against the code before rounding it away.**

## v2.5.55 learnings (ratio redistribution)
- **A well-factored shared-budget system makes "resize A, give it to B" a two-number change.**

## v2.5.56 learnings (the small backlog batch)
- **A backlog item scoped to one surface ("L4 give hit-test") may have siblings on every parallel surface - grep the shared mechanism, not the named symptom.**
- **Protocol fields added for error-targeting should degrade gracefully across version drift**
- **A machine-check added to close a documented gap should be EXPECTED to fail on first run - that failure is the deliverable.**
- **Brace-walking verb branches out of raw source text (backlog option b) matches Function.toString() extraction perfectly for lint purposes**

## v2.5.57–60 learnings (the backlog sweep, part 2)
- **A well-written backlog entry is executable months later**
- **A generic router with value-typed verbs extends without protocol change**
- **Optimism over FULL-snapshot sync is self-healing by construction**
- **Debounces exist for a reason - know which reason before bypassing**
- **Impersonation-based dev tools must restore in `finally`**
- **When reusing panels, exit paths KEEP their teardown**

## v2.5.61–62 learnings
- **A dedup rule enforced on one join path but not its sibling is a latent identity bug**
- **"Both parties can end the arrangement" is a cleaner interaction contract than one-sided rights**
- **Routing-only server verbs need message-capture to test, and a 20-line WS-frame decoder on a fake socket is all it takes**
- **A docs diet is a straight verbatim cut, not a rewrite**

## v2.5.63 learnings (the path-badge leak)
- **A data field can mean different things per record KIND - a shared accessor must not flatten that distinction.**
- **An icon-load error handler that hides only the <img> leaves the decorated CONTAINER visible**
- **The user's precise wording encodes the diagnosis**

## v2.5.64 learnings (badge only what the card doesn't already say)
- **UI indicators should mark DELTAS from what's already visible, not restate the artefact**
- **Before simplifying an accessor call to a raw field, verify the states are mutually exclusive by construction**
- **Scope a semantic change to the one consumer it concerns**

## v2.5.65 learnings (animation curve surgery)
- **"X shows too briefly" in a multi-phase animation is usually a KEYFRAME-PERCENTAGE problem, not a duration problem**
- **Percentage-based keyframes compose for free with duration-scaling controls**
- **Quantify the change against the user's number**

## v2.5.66 learnings (why the v2.5.65 nudge was imperceptible)
- **What reads as "the face is showing" is the FLAT, STATIC phase - a slowly-settling rotation does not count perceptually.**
- **"Keep phase X's length, grow phase Y" across a total-duration change = recompute percentages to preserve ABSOLUTE times**
- **When a per-kind duration table exists (BASE), a CSS duration change must update it in the same patch**

## v2.5.67 learnings (iterating animation feel with the user)
- **Preserving a phase's absolute speed is a spec choice, not a law - re-ask when the user's next report contradicts the feel.**
- **Once an animation is decomposed into named phases with one keyframe-percentage each, every future adjustment is a one-number change**

## v2.5.68 learnings (per-segment easing demands symmetric motion segments)
- **CSS `animation-timing-function` applies PER KEYFRAME SEGMENT - uneven segment lengths inside one continuous motion produce visible speed hitches.**
- **The user's "hackar till" (it hitches) is a per-segment-easing fingerprint**
- **Three feel-iterations (v2.5.65-68) converged because each round restated the phase table in ms and let Johan point at what to change**

## v2.5.69 learnings (knowing when to revert)
- **A feel-iteration loop that hasn't converged after a few rounds should offer FULL REVERT as a first-class outcome, not a failure**
- **Revert to the DOCUMENTED original, character-exact, and grep-verify each restored value**

## v2.5.72 learnings (the branch merge)
- **Two branches that both "continued" from one point merge cleanly when their journals are good**
- **A user-reported "regression" may be a fix living in a PARALLEL timeline**
- **Infrastructure branch × calibration branch is the ideal merge**
- **Slice-transplant beats patch-replay for additive features; keep the branch with surgical rewires as base**
- **Before "restructuring" anything during a merge, check whether the structure already exists**
- **A design decision made LATER in one branch governs the other branch's parallel feature**
- **Bytes ≠ chars in UTF-8 baselines**

## v2.5.73 learnings (the online sweep: whitelist drift, fx coupling, modal stranding)
- **`sanitizePub` is the server-side twin of the state.X serialization rule — any new `buildPub` field must be added to the whitelist in the SAME patch, or the feature works in hotseat and silently dies online.**
- **The fx verb and the board push must travel together.**
- **`openOverlay()` is EXCLUSIVE by design (hides every other modal + nulls labDuo) — any flow reachable from a lobby needs a return ticket, or Close strands the player on the welcome screen.**
- **A pub field with zero receive-side consumers is a liability, not a freebie**

## v2.5.74 learnings (the fx relay's enum hole; transport follows the target)
- **The whitelist-drift class has (at least) two members: `sanitizePub` AND the `fx` relay's kind-enum + field list.**
- **Cosmetic relays can relax privacy invariants where state relays cannot — but scope it to one provable case.**
- **Socket security follows the TARGET, not the page.**
- **Per-origin storage is a design constraint to route around, not to fight:**

## v2.5.75 learnings (the dock pin machine; eval-scope harness rule; the chip→background-click iteration)
- **Gate the auto-closers, centralize the release.**
- **One-shot flags for mode transitions:**
- **The reopen sliver explains why start-close never flickers:**
- **eval scope rule for verbatim harnesses:**
- **Settings hints should name the deliberate exceptions.**
- **A large background element as a click target needs `e.target===el`, not `closest()`.**
- **Any element that becomes independently clickable must be re-audited against existing "don't spawn a marquee / don't clear selection" exclusion lists.**
- **`box-shadow` sidesteps CSS specificity fights that overriding an already-set property can't.**
- **A UI micro-iteration can happen entirely within one delivered version.**

## v2.5.76 learnings (a "fixed elsewhere" parity gap is a distinct bug class; two CSS root-causes hiding behind cosmetic symptoms)
- **A parity fix that only touches ONE branch of an `if(l4on()){…}else{…}` leaves the other branch exactly as broken as before, even when both branches looked like they were "the same feature."**
- **A value computed once at gesture-start and never revisited is a bug waiting for any state that can change mid-gesture.**
- **Unicode "emoji-presentation-by-default" characters (`Emoji_Presentation=Yes`) render larger/coloured even under identical CSS to their siblings.**
- **A guessed-duration `setTimeout` standing in for "a CSS transition finished" is a race, not a fix, even when the guess comfortably exceeds the transition's declared duration.**
- **Two adjacent CSS rules that both touch a shared property can combine in a way that's invisible at one call site's ambient styling and glaring at another's.**
- **A colour/identity lookup keyed on a parameter that one call site always sends as a sentinel value silently degrades ONLY at that call site.**

## v2.5.77 hotfix learning (the defensive fallback shipped one call site too late)
- **Defending a lookup against a bad parameter doesn't help if a DIFFERENT parameter, one hop upstream, is the one actually wrong.**
- **`state.playerName` vs. `net.you` is a recurring solo/hotseat identity fork already documented at three other call sites (`clanLogName()`, the pool-oust log line, the stats row) — a fourth, brand-new call site (`saySend`) used the wrong one on first write despite the pattern being established elsewhere in the same file.**
- **A live-test report phrased as a question ("does it only work online?") is often more precise than it sounds — take the phrasing literally as a diagnostic clue.**

## v2.5.78 learning (a decorative pattern that works at one scale can fail when reused at another)
- **A "watermark behind a large surface" treatment (`.clansym-pool`: faint icon + tinted circle, both sized to the ELEMENT itself) doesn't transplant cleanly onto "decoration behind a much bigger neighbour."**
- **Recolouring text to a variable (per-player) colour removes a piece of implicit contrast design the original fixed colour was quietly providing.**

## v2.5.79 learning (a two-part complaint has an implicit "keep this part" the person didn't spell out)
- **"X and Y are both too small" does not mean "replace the X+Y composition" — it can mean "keep the composition, scale up its parts."**
- **A revert should restore the exact prior structure (HTML shape + CSS selectors), not reconstruct an approximation of it from memory of "what it looked like."**

## v2.5.80 learning (two sibling elements sized in different units against different reference frames are never guaranteed proportional)
- **A percentage size is only meaningful relative to ITS OWN containing block — two sibling elements sized as "90%" and a fixed "190px" are not proportional to EACH OTHER unless their containing blocks happen to match.**
- **v2.5.79's fix (bump the percentage and opacity) treated the symptom (icon looks small) without diagnosing the mechanism (percentage-of-the-wrong-box) — it happened to look better on whatever test phrase was tried, but Johan's report ("still only fills about half") on a real, probably-shorter phrase re-exposed the same unit mismatch at a new pair of numbers.**
- **When a person says "same as before, just recoloured," the safest implementation is a literal diff against the pre-feature rule, not a fresh restyle that merely evokes the old look.**

## v2.5.81 learning (colour-coding the same identity twice on one surface can cancel itself out)
- **Applying the same colour signal to two overlapping/adjacent elements doesn't reinforce it — a same-hued foreground can visually merge into a same-hued background instead of standing out against it.**

## v2.5.82 learning: a THIRD recurring bug class — derived-cache staleness with incomplete trigger coverage
- **A derived value cached in `state.X` and refreshed only by explicit `updateX()` calls at specific mutation sites is only as complete as the audit of EVERY way `X`'s underlying inputs can change.**
- **A bug that "fixes itself" after an unrelated action is a strong signal of exactly this pattern — a stale cache that happens to get refreshed by a DIFFERENT trigger later.**
- **This class also silently reaches into undo and reset paths, not just the live mutation site.**

## v2.5.83 learning: tutorial sections that build the game DURING the tutorial need a delayed safety guard
- **A tutTick safety guard that kills the tutorial when "the table is gone" must not fire during the lobby steps that PRECEDE the table.**
- **Tutorial sections that set lobby controls programmatically (`onEnter`) should use the same helper chain the UI uses**

## v2.5.84 learning: informational tutorials that don't start a game need no guard or persistence
- **Not every tutorial section touches game state.**
- **Corollary: a tutorial that opens a modal overlay in `onEnter` must close it in a later step's `onEnter`**

## v2.5.85 learning: `enterL0()` must reset ALL transient UI — panels, tabs, overlays
- **Any floating panel, tab, or overlay that can be opened during gameplay must be closed in `enterL0()`.**
- **Close the visual state, but don't overwrite saved preferences.**
- **`tutEnd()` must close overlays too.**

## v2.5.86 learning: mock-data demo views for informational tutorials
- **Any UI that reads from a state object can be shown in a tutorial by mocking the state.**
- **Neutralise interactive buttons AFTER the render.**
- **Save and restore mocked state in a backup object.**
- **Design mock data for pedagogic contrast.**

## v2.5.87 learning: an external data source's version bump can be absorbed with a format-detection branch instead of a hard migration
- **When an upstream API you consume announces a breaking format change, "support both, detect per-record" beats "replace and hope the switch lines up."**
- **Don't guess a third-party schema from an announcement or its own OpenAPI file — pull a live sample.**
- **A defensively-written fallback can turn out to already be future-proof — check before assuming a translation table needs new entries.**
- **When a field's populated shape is unconfirmed by any sample seen so far, read it defensively rather than block on it.**
- **A migration-readiness patch is exactly the kind of change worth locking in with permanent tests, not just a one-off verification.**
- **A process note, kept because it's the kind of failure that's easy to miss:**

## v2.5.88 learning: reported bug fixes from elsewhere still get re-derived, not transcribed
- **A bug report that comes with a root cause and a fix already attached (from another session/chat) is still an input to verify, not a patch to transcribe.**
- **This is the same disease as the A3b reconcile-renderer class (SKILLS.md), just on a single element instead of a list.**
- **`if(!el.firstChild)` is a cheap, sufficient "has this been built before" check**
- **DOM-listener-survival bugs like this one are outside what the Node test harness can catch**

## v2.5.89 learning: a text-format parser's real enemy is cosmetic variance, not structural variance
- **Multiple "formats" from different export tools are often the same two structural facts (a crypt list, a library list, each `{qty} {name}`) wrapped in different, mostly-irrelevant punctuation.**
- **A genuinely new case (no section headers at all) still needs new logic, and the safe design defers classification instead of guessing eagerly.**
- **When a card database is already loaded for another purpose (here: `cardTypes`, built for `isMinion()`), reusing it to resolve a SEPARATE ambiguity (which section does this line belong to) is often more robust than any positional/textual heuristic, and it's nearly free**
- **Prove the fallback's priority ordering with an adversarial case, not just an agreeing one.**
- **When multiple real files describe the same underlying deck, parsing all of them to an IDENTICAL result is stronger evidence than separate per-file assertions**

## v2.5.90 learning: documentation can describe an intended feature that was never actually wired up — check the code, not just the help text
- **"The docs say it works" is not evidence that it works — it's a claim to verify like any other.**
- **When a bug report has no supplied diagnosis, grep for the absence of something before hunting for a broken version of it.**
- **A feature description that spans multiple surfaces (board pool, dock pool, L4 globe) needs the fix applied to all of them, verified by name.**

## v2.5.91 learning: a UI transition that only hides the old screen, rather than actually leaving the old state, will eventually collide with a guard that checks the state directly
- **"Show screen B" and "leave state A" are two different responsibilities, and a function named/commented as the first can quietly skip the second for a long time before it matters.**
- **When a guard silently no-ops instead of failing loudly, trace forward from the guard, not just backward from the symptom.**
- **The fix belongs at the shared choke point (`tutShowWelcome()`), not at the one call site the report happened to hit.**
- **This is the same design principle as the v2.5.87 KRCG dual-format branch and `effPath(c)=c.path||krcgPath(c)`, applied to a full state transition instead of a data field: one shared function should fully own a transition (leave-or-don't-leave, old format or new), so every caller gets the correct behaviour by construction instead of needing to remember to ask for it.**
- **A design ask ("these two things shouldn't require unlocking, and shouldn't be auto-suggested") is really two separate code changes — a picker-time check and a completion-time check — that are easy to conflate into one because they're both gated on the same list membership.**

## v2.5.92/2.5.64 learnings (the referee-kit delivery)
- **The dispatch harness's wire shapes must match the CLIENT's, not intuition — two test-side mistakes on first run.**
- **A one-off `node -e` debug against the harness-loaded server hangs forever without `process.exit(0)`.**
- **Field-level protocol lint bites in BOTH directions, by design.**
- **Gate placement inside a handler is part of the design, not a detail.**

## v2.5.93/2.5.65 learnings (the resource ledger)
- **The pub round-trip is a free change-detection substrate.**
- **Client display constraints can be inherited, not invented.**

## Operational learning (6 July 2026, caught by a user question): the working directory can silently roll back between turns — /mnt/user-data/outputs is the durable copy

## v2.5.94/2.5.66 learning: when the server takes over a line, look for the codebase's OWN muting convention before inventing a mechanism

## v2.5.95/2.5.67 learning: implementing a small feature on a path is the best audit of that path

## v2.5.96/2.5.68 learnings (the lobby delivery)
- **A helper's parameter list is a contract — check it before adding a line that reads the wire message.**
- **Make deployment flags a mutable CFG object, not const primitives.**
- **argv can be parsed before crypto helpers exist thanks to function hoisting — but if you defer anyway, resolve the deferred values immediately after the helper's definition,**
- **The loopback⇒global throttle bucket is the tunnel-without-proxy compromise, by design:**

## v2.5.97 micro-learning: a fallback timer's job ends the moment the server says ANYTHING

## v2.5.98 learning: a new modal doesn't have to join the existing modal-management system to look and behave like one

## v2.5.99 learning: an existing uiAlert call in the SAME handler is proof a uiDialog-family prompt is safe to add there too

## v2.6.0 learning: board CSS classes on this element are additive tiers, not mutually exclusive states — check the JS class-list calls, not just the CSS selectors, before trusting "L-mode" naming

## v2.6.0 learning: an isolated, unreferenced z-index constant is a standing invitation for a future cluster to grow past it unnoticed

## v2.6.1 learning: "flag it visibly" beats "guess it away" when the ambiguity is genuinely irresolvable

## v2.6.1 learning: identical duplicated code blocks need a wider, uniquely-scoped match, not a wider blast radius

## v2.6.2 learning: a capture-phase interceptor is the right tool when N existing call sites each own DIFFERENT fallback logic for the same event

## v2.6.2 learning: `norm()`'s alphanumeric-only output is what makes it possible to reuse as a filename-safety guarantee, not just a display-normalisation step

## v2.6.3 learning: a per-ELEMENT retry guard (dataset flag) is not the same thing as a per-CARD memory across renders — asking "does this scale?" out loud is what surfaced it

## v2.6.4 learning: "what covers this asset" is worth a full inventory pass before designing the fix, not just extending the first mechanism found

## v2.6.4 learning: verify a new regex dispatch against concrete examples BEFORE trusting it in the running app

## v2.6.5 learning: after several incremental patches to the same feature, re-read it as ONE continuous block before calling it done

## v2.6.6 learning: read your own verification printouts as EVIDENCE, not as ceremony

## v2.6.6 learning: replacing a declarative preload (CSS url) with lazy JS loading silently drops the preload — and a top-level browser API needs a typeof-guard under the Node harness

## v2.6.7 learning: external news ("there's a zip") doesn't just simplify a plan — it can invalidate an implementation ASSUMPTION the plan was quietly compensating for

## v2.6.7 learning: negative memory (missing) sometimes needs a positive twin (wrong-format) to avoid re-paying a discovery cost per render

## Pre-release learning: `tail -3` on a gate's output is self-inflicted blindness — the gate spoke, I muted it

## Pre-release learning: a "cosmetic" version-string drift can be a live user-facing bug — check what actually READS the string

## v2.6.8 learning: persist user INTENT at the moment of the click, not at the completion of the work it starts

## v2.6.8 learning: a count-assert can be tripped by your OWN replacement text — the safety net works both ways

## v2.6.9 learning: adding a new caller to an un-guarded async initializer is what turns "it never overlapped before" into a race

## v2.6.9 learning: when a Q&A answer leans on a mechanism ("X tops it up"), verify the mechanism's GATE before shipping the claim

## v2.6.10 learning: a memory keyed on "the current setting" must be invalidated when that setting changes — fmt-relative Sets inverted their meaning on a mid-session format switch

## v2.6.10 learning: promise-memoization needs a failure policy, not just a re-entry guard

## v2.6.11 learning: a dispatch suite that drives the server directly can mask a missing CLIENT surface — feature-completeness needs one end-to-end trace per feature

## v2.6.11 learning: cleanup that lives only inside a debounced/scheduled path leaks on quiet systems

## srv-2.6.9 learning: graceful-shutdown handlers written during development listen for the DEVELOPER's signal, not the DEPLOYMENT's

## v2.6.12 learning: "the tutorial is outdated" splits into WRONG vs INCOMPLETE — and the fix differs completely

## v2.6.12 learning: when a proposed client option would set SERVER policy, the authority model is the tiebreaker

## v2.6.13 learning: batch-patch anchors must match the ORIGINAL file, never the output of an earlier rep in the same batch

## v2.6.13 learning: macOS still ships bash 3.2 — `"${ARR[@]}"` on an EMPTY array aborts under set -u there, and a newer dev-container bash will hide it

## v2.6.14 learning: <img src> and fetch() have DIFFERENT file:// privileges — an asset strategy that works for images can silently not work for data

## v2.6.14 learning: widening a security regex vs adding an exact-name whitelist branch — prefer the branch

## v2.6.15 learning: the file PICKER is the transport file:// always allows — the once-and-done pattern (load + cache on one click) turns it from a workaround into a feature

## bot-0.1.0 learning: `pkill -f` sees your OWN wrapper's command line — a cleanup that names its target pattern kills itself

## bot-0.1.0 learning: an ordered-consumption waitFor silently skips a companion message that arrived BEFORE the line you matched

## bot-0.1.0 learning: a third-party client's `v` is a WIRE version, not its artifact version

## v2.6.16 learning: the fx `verb` field is 40 chars of FREE TEXT — a ready-made side-channel for amounts in clones

## v2.6.16 learning: adding a wire verb is a SIX-file chain — treat it as one atomic checklist

## v2.6.17 learning: a sender-side hook is INVISIBLE to remote clients — audit batch-affecting signals in BOTH endpoints

## v2.6.18 learning: a `//` comment inside a replacement string EATS the rest of a ONE-LINE function

## v2.6.18 learning: protocol section HEADINGS carry handler counts the lint never checks

## v2.6.20 learning: card ids are per-client sequential -- ownership/identity checks must be SEAT-scoped, never bare id lookups

## v2.6.26 learning: the tutorial engine DOCUMENTS its step schema in a header comment -- read it before writing steps

## cardfx-v1 learning: KRCG card_text is a structured format in disguise — but "As above" starves a naive extractor's superior modes

## cardfx-v1 learning: in a derived-facts database, a WRONG tag beats a missing tag as the failure to fear — conservatism + provenance is the quality model

## cardfx-v1 learning: unicode_escape over a string that already holds real UTF-8 text is a mojibake machine

## cardfx-v1.1 learning: a data-format version question is a data-quality audit in disguise — and the client's parser is the contract to mirror, not re-derive

## Servern STÄNGER anslutningen över RATE_N — headless klienter behöver utbounds-pacing (12 juli 2026)

## Cursor-baserad waitFor: vänta i KAUSAL ankomstordning (12 juli 2026)

## Timer-debounce omordnar wiren — kö-koalescera i stället (12 juli 2026)

## Flaky failure-punkt som VANDRAR = mättnad, inte logikfel (12 juli 2026)

## __dirname-förankrad persistens besegrar cwd-isolering — testa mot en KOPIA (12 juli 2026)

## Väntor måste knytas till LIVHET — och tracelagret betalade sig dag ett (12 juli 2026)

## B1-falsk-pass, token bucket och skuggade handlers — tre snabba (12 juli 2026)

## Stora spann patchas med index-kirurgi mot filens egna bytes (12 juli 2026)

## Rekognoscera med användarens vokabulär och UI-strängarna — inte begreppssynonymer (12 juli 2026)

## Verifiera regeltext mot källa, inte minne — särskilt när symmetrin ser för enkel ut (13 juli 2026)

## Cursor-baserad waitFor: skriv testets väntor i SÄNDNINGSORDNING, inte önskad läsordning (13 juli 2026)

## Ett rimligt regelantagande kan ändå vara farligt om exekveringen inte kollar sitt eget facit (13 juli 2026)

## Beslut och exekvering måste läsa samma facit (13 juli 2026)

## Kodkommentarer är inte dokumentation — journalposten ÄR ritualen (13 juli 2026)

## Regelboks-bokföring (lås, kostnader) granskas separat från lyckliga-vägen-logik (13 juli 2026)

## Ett "read-only" system kan vara en outnyttjad generisk mekanism, inte ett nytt behov (13 juli 2026)

## Vy-läges-syskondrift: en fix till L3/L4 som aldrig speglades till L2 (13 juli 2026)

## Bot-mot-bot-handshakes löser på SVAR — och en pacing-hypotes fälls billigast i källan (24 juli 2026)

## En patch vars GAMLA sida är dina NUVARANDE filer är en omvänd överskrivning, inte ett delta (27 juli 2026, merge-sessionen)

## Uppladdningskatalogen ACKUMULERAR — en blank-kopia därifrån är en tidsmaskin bakåt (27 juli 2026, botsynk-sessionen)

## Ett föråldrat MÄTINSTRUMENT rapporterar regression som aldrig hänt (27 juli 2026, vtes.json-körningen)
