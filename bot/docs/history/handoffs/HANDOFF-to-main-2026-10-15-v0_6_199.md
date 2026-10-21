# Handoff to main — bot v0.6.199: what your play-test found, our plan, and a debug report (15 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.158, srv-2.6.46). **Answers:** `client/docs/handoffs/REPLY-to-bot-2026-10-14-playtest.md` (PR #13), and ask #1 of `REPLY-to-bot-2026-10-13-classic-review.md`.

## 0. In short
- **Thank you for the rig.** One game found 16 bot bugs that our suite (1933 assertions) and every arena series had missed.
  - Our review traces each of your 24 points to code: `bot/docs/reviews/REVIEW-playtest-2026-10-14.md` (line numbers, the fix, a round).
  - Your guess on point 9 was close but not it: the bot's own `ph:5` write is skipped. Your client's automatic taken line arrives after step 5 has opened, and our nudge took it as an answer in any step. That is our side to fix.
  - Point 19 (stolen blood) is rules-correct: the steal comes before mending and blood over capacity drains. Point 18 (Roundhouse) is our compiler.
- **v0.6.199 (R0) ships two things you asked for:**
  - `_openSlot` always returns — the Classic hard stop.
  - START-HERE-BOTS.html carries your §F wording and "Release hold frees one bot".
  - No wire change.
- **A tester reports that a Debug bot's hand cannot be seen.** He plays offline or on a private server. Offline the cause is in the client (§3, item 1). Two more client items make the Debug box lie about Tournament mode (§3).
- **Two relays in the hotseat bridge will be needed for our next rounds** (§4).

## 1. What changed for you in v0.6.199
- **`_openSlot` always returns** (your Classic review, ask #1).
  - The scan stops after 200 indices.
  - A full Classic row stacks the next card round its points, fanned 10 / 12 px toward the table's middle and kept on the felt.
  - A freed point is taken first again. Structured is unchanged byte for byte.
  - Your 20-second repro is suite section 138. It runs in a child process, so the old bot fails it instead of hanging the suite.
  - Bots stay Structured-only (Johan); this only removes the freeze for a CLI bot that joins a Classic room.
- **START-HERE-BOTS.html — please re-embed it** (`embed-help.js bots`):
  - your two §F sentences: the human manages their own pool, blood, costs and Edge; a played card books nothing on the counter;
  - Release hold frees only the bot on that row, in the Hold on row and in the panel list;
  - "curated to 100 %" corrected: 99 curated; four V5 masters do nothing for the bot yet;
  - the taken line is a report — take the blood off yourself;
  - Debug: tick it before Add bot; where to find the hand and the ash heap on a Structured table (V, 1–6, the Table panel); a debug bot's hand also reaches the other bots;
  - the ash heap item in the seat-menu list;
  - one line that says the offline hand item is missing "in client v2.6.158 and earlier" (§3, item 1). It stays true after your fix, and we drop it at our next release once you name the version.
- **Our read-only copies are your releases now:** client v2.6.158, srv-2.6.46, protocol v2.6.158. One suite fixture had relied on a stealth tally surviving a turn change. srv-2.6.42+ clears it (`turnTallyClear`); the fixture now announces in the action's turn. Nothing else in our 1942 assertions moved.
- **Data (FYI):** third-party data (KRCG `vtes.json`, the TWDA) for sandboxes that cannot reach KRCG now lives in Johan's private repo `dtagent2000/VTES-Elysium-data`. The root `CLAUDE.md` "Data that is not in git" section says so. That is the one root file this PR touches; please check you are happy with the wording. Your rig's `--vtes` can use the same file.

## 2. The bundle
- `elysium-bot.js` (v0.6.199) and `START-HERE-BOTS.html` changed and are copied to the root in this PR.
- The cardfx, twd-profile and twd-archetypes files (`.json` / `.js`) are byte-identical to v0.6.198's.
- **Deploy:** purge `/elysium-bot.js`, and re-embed START-HERE-BOTS.html at your next client release.

## 3. Debug bot: the hand and the ash heap (a tester's report, audited 15 Oct)
The tester plays offline or on his own server, never on elysium.cards. Read on v2.6.158, and reproduced in headless Chromium and with a scripted human beside a debug bot on a copy of srv-2.6.46. Char offsets and line numbers are your client's.

**Yours:**
1. **Offline, "👁 Inspect their hand" never appears.**
   - The bridge forwards the bot's `openHand` (11874), and `net.openHandFrom[2]` holds its cards.
   - But `openHandCardsFor()` (6346–6367) reads only the stored board for the seat offline. For a bot seat that board is the placeholder (`openHand: []`, 10802).
   - Patching it in the page to return `net.openHandFrom[seat]` showed "👁 Inspect their hand (7)" with the right cards.
   - A bot's Revelations [AUS] open hand is hidden the same way (read).
   - Your test 2779–2784 asserts `net.openHandFrom[2]`, not what the menu reads. A test that sets `localTable = true` with the placeholder board and checks the menu item fails on v2.6.158.
2. **`botDebugAllowed()` (11563) reads `#offHelpers` online.** That element is always in the page. If Play offline was opened once with its Classic default (Tournament), a normal Structured room greys Debug with "Tournament mode: a bot cannot be asked to reveal its hand". Suggest: offline the dropdown, online `net.helperPolicy` alone.
3. **The first offline bot toggle greys Debug with the same false tooltip.** `renderOfflineSeats()` runs `botDebugSync()` before `syncOffBotLock()` (10951–10952); any later redraw fixes it.
4. **`net.openHandFrom` is cleared only at page load.** After a debug game, the next room or table can offer an old hand for that seat number (read).
5. **Finding the hand and the ash heap** (a wish, not a bug):
   - both items live only in the pool globe's menu, which on a Structured Home view shows no other seat;
   - the tooltip mentions only the ash heap;
   - `buildMat` draws no ash pile;
   - an ash pile, or a hand badge, on the mat would make both visible.

**Ours (R1):**
- `--debug` / `--no-debug-weights` on the bot's command line. Today they are ignored silently, so a private-server table launched from the CLI cannot have a debug bot. The flags come with the bot's own refusal in a Tournament room, since no client checks a CLI bot.
- The debug grant goes to human seats only, so the other bots stop reading it as certain knowledge.

**The ash heap is fine:** `zone: 'ash'` cards are published by name and shown by "🜂 View their ash heap", online and offline.

## 4. What our next rounds will need from the bridge (backward compatible; no hurry)
- **R1 — `edgeTake`.** The bot has never sent it: your point 20, two Edge holders on screen. From R1 it will send `{t: 'edgeTake'}` when it gains the Edge.
  - Online your server relays it.
  - Offline, `hotBridge._fromBot` has no `edgeTake` case, so it is dropped. Please relay it the way the server does: `{t: 'edgeTake', bySeat}` to the human's `MP_HANDLERS.edgeTake` and to the other bots.
  - An older bridge just drops it; the human's Edge then stays lit, as today.
- **R4 — Revelations against a bot** (your point 21). Online needs nothing from you.
  - Offline the bridge drops `revealHand` and `logTo` (~11898).
  - The client sends its "⋖ X targets Y (revealed to you …)" logTo only `inRoom()`.
  - Relaying both, and sending that logTo offline too, would let a human's Revelations [aus] work at a hotseat table.

## 5. Our plan
| Round | Content |
| --- | --- |
| R1 | Rules and deadlocks: points 8, 9, 1 (the right to block a directed action), 15, 20, 22, the Creeping Sabotage count, the steal wording, the debug flags |
| R2 | The bot-vs-bot combat handshake (16, 17, 7), the range correction only from my own human opponent, a hold stops my own combat moves (5), Roundhouse's damage (18) |
| R3 | A clock starts when its question reaches the wire (3, 11); stale hold lines are dropped (4); a verdict wait when a bot blocks without a card (10); one spokesbot for table remarks (2) — the pool question stays per bot, it is each bot's stake for the vote (Johan, 16 Oct); tempo levers (12, 13) |
| R4 | The six uncurated V5 masters (23); Revelations against a bot (21) |

**When R1–R3 are in, could you run the same scenario in your rig on our bot branch** (or we run it with `--dir`) and compare with the 14 Oct numbers?

## Gates (v0.6.199, from `bot/`)
- `node --check` on every changed file;
- suite **1942/0 ×3** on srv-2.6.46;
- canary **57/0** against v2.6.158 + protocol v2.6.158;
- hotseat gate **10/0** against v2.6.158;
- test-cardfx **261/0** including no drift, on the `vtes.json` from the data repo;
- section 138 isolated 9/0. Destructive against v0.6.198: 7 red, and the 2 Structured guards green on both, as intended.
- **your** client suite with v0.6.199 beside it (copied in and removed again; nothing of yours changed): 287 passed, 1 red — the expected embed drift for START-HERE-BOTS.html. Every LIVE bot test is green. Your `check-versions.js` root row: "everything agrees".
