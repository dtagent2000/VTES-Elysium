# Handoff to main — bot v0.6.200: the rules and deadlocks your play-test found, and what the bridge needs now (16 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.158, srv-2.6.46). **Follows:** `HANDOFF-to-main-2026-10-15-v0_6_199.md` (R0). Everything in its §3 (debug) is still open; this note adds to it rather than repeating it.

> **Corrected the same day by `HANDOFF-to-main-2026-10-16-v0_6_201.md`:** the debug hand goes to the whole table again, so the tooltip change in §3 and the `to:'humans'` wish are withdrawn; the §4 wish about a human's bleed reduction is now a concrete ask (a Reduce row on the Bleed menu). §2 (`edgeTake` in the bridge) and the rest still stand.

## 0. In short
- **v0.6.200 is R1 of our plan:** your points 8, 9, 1, 15, 20 and 22, the Creeping Sabotage count, the steal's wording, and debug for humans only (Johan, 16 Oct).
- **The bridge needs one relay now:** the bot sends `edgeTake` from this release (§2). Online it already works through your server. Offline the bridge drops it, and the human's Edge stays lit as before.
- **Two client texts are out of date:** the Debug tooltip and two lines in `PLAYTEST.md` (§3, §4).
- **No new wire verb.** `edgeTake` is your existing verb; the bot now also reads `edgePass` and `helperPolicy`.

## 1. What changed for you in v0.6.200
- **Point 8 — Turn-based deadlock.** A contested undirected block used to end only when the HUMAN passed last. When a bot passed last, the bot restarted a clock that Turn-based never arms, and the table stood still. Now whoever passes last ends it. The Turn-based reminder names only who is still awaited, and says nothing when nobody is.
- **Point 9 — the taken line.** Your client writes the human's taken line when the table steps past Damage resolution, which is after the bot's ph 5. The bot took that line as the answer to "Any presses?". Now taken and prevent lines answer the damage step only.
- **Point 1 — the right to block a directed action.**
  - The bot reads your client's ` Target: NAME's X.` suffix as the action's aim.
  - A card's own action row ("takes a card action.") inherits the aim of the play line just before it.
  - A directed action with no aim is taken to be aimed at the actor's prey.
  - Only the target of a directed action asks what it costs or may block it.
  - For every undirected action (not only a referendum), a seat that is neither prey nor predator says nothing.
- **Point 15 — a reduced bleed stays reduced.** Both sides were bots in your game.
  - The acting bot now reads its target's reduce line, `NAME plays CARD — reduces the bleed by N (now M).` (the bot's own shape since 25 Jul), and lowers its total.
  - A target that reduced counts the actor's `+N` on top of its own reduced amount.
  - A bleed of 0 moves no Edge, and its resolve line says "The bleed goes through at 0: NAME loses no pool."
  - Found while reviewing the change: a human's referendum that cost a bot pool also took the bot's Edge. An undirected action never moves the Edge now.
  - Found by our arena smoke: Larissa's +1-bleed discard did not reach the bot's own record of the bleed. A human target saw "bleeds for 2", then "−1 pool". Both lines now say 2.
- **Point 20 — the Edge is unique.**
  - The bot sends `edgeTake` when it gains the Edge (a bleed of 1 or more), so the human's client clears its own Edge.
  - It clears its own Edge on another seat's `edgeTake`, and accepts an `edgePass` to its seat.
- **Point 22 and Johan's report (Tremere threw away Theft of Vitae).** A card counted as dead when no READY vampire could use it. With no vampire out yet, the whole hand was dead and the first card went. Now ready, torpor and uncontrolled vampires all count; with none at all, the deck's crypt list judges.
- **Creeping Sabotage (our side find).** One tick reached the log as the predator's frozen line and also as its "ticks" note. The note is gone; the frozen line is unchanged byte for byte.
- **Point 19 — the steal's wording.** The round line says what drained off at capacity, for example "steals 2 blood; 1 drains off at capacity 6". The frozen line `NAME strikes: steals N blood.` is unchanged.
- **Debug is for the humans only** (Johan, 16 Oct).
  - With only humans beside it, the bot's open hand goes `to:'all'`, as before.
  - With another bot at the table, it goes `to:<seat>` for each human seat, so spectators see no hand then. (§3 has an optional wish.)
  - The audience follows the roster: a human who reconnects gets the grant again.
  - Revelations [AUS] still opens the hand to every player, since that is the card's text.
  - New on the command line: `--debug` and `--no-debug-weights`.
  - The bot reads the room's helper policy (`joined.helperPolicy`, the `helperPolicy` broadcast). It refuses debug at a Tournament table and leaves debug if the table turns Tournament.

## 2. The bridge: `edgeTake` (needed now)
- The bot sends `{t: 'edgeTake'}` when it gains the Edge.
- Your server answers with `{t: 'edgeTake', bySeat, clearOnly: false}` to every other seat. `hotBridge._fromBot` has no `edgeTake` case, so offline it is dropped.
- **Ask:** relay it the way the server does: `{t: 'edgeTake', bySeat: <the bot's seat>, clearOnly: !!m.clearOnly}` to the human's `MP_HANDLERS.edgeTake` and to the other bot seats.
- **Already fine (read in v2.6.158, 11874–11879):** a numeric `openHand` `to` routes to that bot or to the human. So offline the debug view reaches the human and not the other bots.

## 3. Debug: still open from 15 Oct, and two more
- **Still open (handoff of 15 Oct, §3, items 1–5):**
  - the offline hand item (`openHandCardsFor` reads the placeholder board);
  - `botDebugAllowed()` reading `#offHelpers` online;
  - the first offline toggle greying Debug;
  - `net.openHandFrom` cleared only at page load;
  - the wish for an ash pile or hand badge on the mat.
- **New: the Debug checkbox tooltip** (two places, 2417 and 2444) says "The bot opens its hand to EVERYONE at the table". From v0.6.200 that should read "to the human players". The guide says so (re-embed, §5).
- **Optional wish: `openHand` `to:'humans'`.** It would keep the debug view for spectators at a table with several bots.
  - Server: broadcast to players without `bot`, and to watchers.
  - Bridge: send it to the human only.
  - We are fine without it. If you build it, tell us the server version and the bot will use it there.

## 4. `client/playtest/PLAYTEST.md`
- Line 85, "Take the Edge after a successful bleed (`edge`); a bot never hands it over on the wire": online the bot now says `edgeTake` when it takes the Edge, and your client clears its own Edge. Offline that waits for §2.
- **A human's bleed reduction.** The client writes only the card play when a human reduces a bot's bleed, so the bot keeps its full number and takes the Edge even at 0. The human manages their own pool, so nothing is lost. If you ever want the bot to follow, a line in the bot's shape (`NAME plays CARD — reduces the bleed by N (now M).`) from the target's seat is read as-is. This is a wish, not a bug.

## 5. The bundle
- `elysium-bot.js` (v0.6.200) and `START-HERE-BOTS.html` changed and are copied to the root in this PR.
- The cardfx, twd-profile and twd-archetypes files are byte-identical to v0.6.199's.
- **START-HERE-BOTS.html — please re-embed** (`embed-help.js bots`):
  - the debug passage: the hand goes to the humans only; the command-line flags;
  - the Edge sentence: a bleed of 1 or more gives the bot the Edge; online your client clears yours; a bleed reduced to 0 says so and moves no Edge.
- **Deploy:** purge `/elysium-bot.js` and re-embed the guide at your next client release.

## 6. Our plan, updated
| Round | Content |
| --- | --- |
| R1 | **This release.** |
| R2 | The bot-vs-bot combat handshake (16, 17, 7); the range correction only from my own human opponent; a hold stops my own combat moves (5); Roundhouse's damage (18) |
| R3 | A clock starts when its question reaches the wire (3, 11); stale hold lines are dropped (4); a verdict wait when a bot blocks without a card (10); one spokesbot for table remarks (2), while the pool question stays per bot; tempo levers (12, 13) |
| R4 | The uncurated V5 masters (23); Revelations against a bot (21) |

After R3 we run your scenario ourselves in your rig with `--dir` and compare with the 14 Oct numbers.

## Gates (v0.6.200, from `bot/`)
- `node --check` on every changed file; `ana-ledger.py` compiles.
- Suite **1985/0 ×3** on the final bytes (srv-2.6.46).
- Section 139 run alone: 43/0. Against v0.6.199 in a scratch directory: 32 red, the 11 guards green on both, no abort.
- Canary **57/0** against v2.6.158 and protocol v2.6.158.
- HB1 **11/0**.
- Hotseat gate **10/0** against v2.6.158 (tally relayed, the net asleep).
- **Your** client suite with v0.6.200 beside it (copied in and removed again): 287 passed, 1 red — the expected embed drift for START-HERE-BOTS.html. All 11 LIVE bot tests green.
- `check-versions.js`, root row: "everything agrees".
- test-cardfx not run: the cardfx files are unchanged.
- **Arena smoke** (the four starters, Expert, pool 30): no timeouts.
  - v0.6.200 against v0.6.199 on seed 4001, 2 + 2 matches, then 2 more on the final bytes (seed 4002).
  - `ana-ledger.py` on the final bytes: every bleed pairs — equal, more by the actor's modifiers, or less by the target's own reduction. The steal pairs are equal. The seed-4001 arm had found one unexplained short bleed (Larissa's lost +1), fixed since.
  - `ana-inv.py`: 1 / 2 / 8 flags. Most are "my strike 1, the Ventrue opponent took 0", in both versions. The rest: one taken-above-dealt row in a Nosferatu fight (the combat round, R2), and one pool drift from an equipment's pool cost that has no event (`_doEquip`, older than this release).
