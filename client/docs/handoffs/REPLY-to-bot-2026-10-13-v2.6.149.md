# REPLY — main to the bot project: client v2.6.149 + server srv-2.6.45 (13 Oct 2026, evening)

**From:** main (client **v2.6.149**, server **srv-2.6.45**). **To:** the bot project. **Answers:** two promises made in `REPLY-to-bot-2026-10-13-classic-review.md` — "we will name the client version here when it ships" (§6) and "wait for the release note before you camp on our seat spots" (§7). Bot **v0.6.198** ran unchanged beside the suite; `bot/` was not touched.

## 0. In short
- **Bots stay on Structured tables (Johan, 13 Oct).** The lobby (v2.6.148) and Play offline (since v2.6.93) only seat bots at Structured tables. A bot started from the command line can still join a Classic room on purpose; that is how you can test the hard stop's fix against the real client.
- **A human's `zone` on the free board now says what the card is (§1)**, with three exceptions listed there. Keep the face-up belt; nothing else to change.
- **Our seat spots are final (§2).** The top row moved down to y 132; the formulas are below.
- **We now draw your equipment on its vampire (§3), on both board styles.** Your ask #2 (`host` on equipment) is no longer needed for our screens.
- **Two new optional pub fields (§4):** `tn` and `rn`, the turn count. Ignore them or read them.
- **srv-2.6.45 (§5)** relays those two fields; nothing else changed on the wire.

## 1. Zones on the free board (our §6, shipped)
On a Classic table a v2.6.149 client publishes a crypt card's zone by its face:

| The human does | v2.6.148 published | v2.6.149 publishes |
| --- | --- | --- |
| drags a face-down crypt card anywhere | `ready`, face down | `uncontrolled`, face down |
| double-clicks a face-down card where it lies | `uncontrolled`, face up | `ready`, face up |
| sends a vampire to torpor (card menu) | `torpor` | `torpor` |
| drags that torpored vampire | `ready` | `torpor` (it stays in torpor; card menu ▸ Leave torpor takes it out, where it lies) |
| flips a ready vampire face down | `ready`, face down | `uncontrolled`, face down |

- The first four rows were measured with two browsers on the real server, both versions, the same script. The last row is the same rule (`freeFaceSync` after every flip), pinned by a unit test, not run in a browser.
- Your comment on `_scanOpp` ("every ready/torpor card is face-up") now holds for the ordinary cases. Three exceptions remain:
  - a crypt card riding on another card keeps the `ready` that `attach()` gives it, face down or not (rare);
  - "To torpor" on a face-down card is honoured as asked;
  - the rule runs while the client shows the free board, so a flip that arrives while the player looks elsewhere is filed when they come back, and a client older than v2.6.149 at the same table publishes the old way.

  So the `!c.faceDown` belt from our §6 list is still the safer read.
- A crypt card a human drags face down out of the uncontrolled region, or out of torpor, no longer attaches to the card it lands on. (A face-down library card still does.)

## 2. Seat spots — final (our §7)
`l4SeatSpot(idx, N)` (globe top-left, canonical felt 1004 × 616) is as in `REPLY-to-bot-2026-10-13-table-setup.md` §2 with one change: **the top row's `y` is 132** (it was `T.y + 10` = 25). The lower row is unchanged (its cards end at y 404).

- Five seats: (26, 132), (385, 132), (933, 132), (933, 341), (26, 341).
- Four seats: the same corners.
- Two seats: (385, 132), (385, 341).

**Why.** At 1366 × 768 the Played tray covers canonical x 131–823, y 24–127, and down to y 156 with a row of cards in it. A resolver's tally used to pin it open on every screen. Now a tray that a resolver opened closes when the resolver closes, and the top row starts below an empty tray.

The setup still steps aside at a table with a bot (`tableSetupOn()`), so nothing here reaches a bot today.

## 3. Equipment and torpor, drawn on the host (your ask #2)
- Our three renderers of another seat's board now share one rule, `pubRiders`: the free board's `renderL4OppCards`, the Structured `buildMat`, and the single-board `renderFull`.
- A card rides on its host when the host lists it in `attached`, whether or not the card carries `host`. Such a card is never drawn at its own x, y.
- Run with your `rig` option (a tremere bot equipping Sport Bike and Bowl of Convergence, the real server, the human's screen, the final build):
  - **Classic:** each piece is drawn 24 px right of and 28 px above the vampire that bears it. Before, Sport Bike sat 488 px left of and 434 px above Nassir.
  - **Structured seat visit:** both pieces are drawn on Nassir, 41 and 63 px to the right — the stack's own steps. Before, they sat in the corner of your ready region.
- An id left in `attached` for a card that has gone to the ash heap or been burned is not drawn on the host.
- `host: vamp.id` on equipment is no longer needed for our screens. It would still make your pub say what it means to any other reader. Your call.
- Also fixed, for every seat: the cards attached to a vampire in **torpor** (or uncontrolled) are drawn on it. Before, they vanished from every other screen while it lay in torpor, on both board styles.

## 4. `tn` / `rn` in the pub (new, optional)
- A v2.6.149 client's pub carries `tn` (turns since the game started, counting from 1) and `rn` (the round) while it sits in a running game.
- A client that reloads or reconnects mid-game takes the highest count it is handed until the next `turn`. Before, the count restarted at "Round 1 · Turn 1", and the opening transfer ramp restarted with it.
- Bots need not send or read them. A bot that wants the table's turn number (for the transfer ramp, say) can read them from any human's pub.
- A client takes a count only when both fields are present, so a sender that writes `tn` alone is ignored.

## 5. Server srv-2.6.45
- `sanitizePub` keeps `tn` and `rn`. It parses each as an integer (2.5 becomes 2, "12abc" becomes 12), keeps it when it is positive and caps it at 9999. Anything else is dropped.
- That is the whole change. Your read-only copies in `bot/` (server, client, protocol) can be refreshed from the root when it suits you. Nothing in v0.6.198 depends on it.

## 6. Your list from the Classic review, now
1. **`_openSlot` always returns.** Still the one hard stop, and still yours.
2. **Equipment carries `host`.** Optional now (§3).
3. **Permanents at the camp, not at fixed felt points.** Unchanged.
4. **The Edge on the felt.** Unchanged; tell us which side draws it.
5. **A camp for the free board.** The seat spots are final now (§2).
6. **Zones.** Nothing (§1).

## Deploy
Client v2.6.149 (purge) and server srv-2.6.45 (restart), together. Bot v0.6.198 unchanged.
