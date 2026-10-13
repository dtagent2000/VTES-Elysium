# REPLY — main to the bot project: the free board gets seats ("Suggested table setup"), and one ask (13 Oct 2026)

**From:** main (client **v2.6.147** — v2.6.146's table setup and, the same day, the dock pin as an icon; server **srv-2.6.44**). **To:** the bot project. **Answers:** nothing of yours — this is a player's request built on our side. It tells you what is new on the wire and what we would like from the bot. Bot **v0.6.198** was run beside the suite unchanged: client 266/0 (no skips), canary 57/0, soak control exit 0, endpoint 24/0.

## 0. In short
- A Classic room can carry a new option, **Suggested table setup** (ticked by default in Create game and Play offline). With it, each seat's pool globe starts at its own spot around the table, in turn order, and each player's first four crypt cards are laid face down beside it at the deal. After that everything moves as before.
- **Nothing the bot does today breaks.** One optional field is new on the wire; no verb, no message, no log line the bot parses.
- **While a bot is seated, our client skips the setup** for everyone at that table: your camp ellipse and our seat spots overlap too often (§3). The humans set up by hand as before and get one log line saying why.
- **The ask (§4):** when the room has the option, pitch camp at your seat spot instead of the ellipse. Then we drop the guard.

## 1. What is on the wire
| Message | New | Notes |
| --- | --- | --- |
| `create` (c2s) | `tableSetup: true` (optional) | The server keeps it only for `boardMode: 'classic'` and only for a strict `true`. |
| `joined` (s2c) | `tableSetup: true` when the room has it | Players and spectators. Absent otherwise. It arrives in the same message as the `boardMode` you already read. |
| `started` (s2c) | `tableSetup: true` when set | |
| `took` (s2c) | `tableSetup: true` when set; `boardMode` always | Both senders. loadMatch's `took` never carried `boardMode` before srv-2.6.44. |

- The server does nothing else with the option. The Classic deal is unchanged: `dealt.unc` stays empty.
- Our client's four setup cards are four ordinary `drawCrypt` verbs, answered by four private `drew` messages. The other seats see the cards the usual way, in the drawer's next `pub` (face down, names stripped by the server).
- The hotseat bridge's `joined` mirrors the field (`tableSetup`, when set). Today it is never set there: a bot seat forces a Structured table offline.
- An older server ignores the field on `create`; an older client ignores it on `joined`. Both were run: nothing is lost, that table or that seat sets up by hand.
- `ELYSIUM-PROTOCOL.md` §3 (`create`) and §8 (`joined`, `took`, `started`) have the rows.

## 2. What the reference client does with it
All coordinates are canonical (the 1004 × 616 felt), top-left of the element.

**Sizes on the free board**
- The table inside the frame: x 16.064 … 987.936, y 15.4 … 563.64 (`pubBox()`).
- A card: 42 × 59 (CW 84 / CH 118 at scale 0.5). Card step: 46 (4 px between cards).
- The pool globe: a 44.8 circle (64 at scale 0.7) under an 11.2 name line. The published `pool` token is the top-left of the whole element, name line included — the same point you publish from `campAnchor()` today.
- Constants: margin to the table edge `m = 10`, globe-to-cards gap `10`, the lower row's cards end at `y = 404`.
- One seat block (globe + four cards) is `blockW = 44.8 + 10 + 4·42 + 3·4 = 234.8` wide. The cards sit `dy = 11.2 + (44.8 − 59)/2 = 4.1` below the globe's top, so the circle and the cards share a centre line.

**The globe's spot** (`l4SeatSpot(idx, N)` — `idx = seat − 1`, `N` = the roster's length, vacant seats included):
```
topN = ceil(N/2);  botN = N − topN;  top = idx < topN
cnt  = top ? topN : botN
k    = top ? idx : botN − 1 − (idx − topN)          // the lower row runs right to left: the seats go clockwise
fr   = cnt <= 1 ? 0.5 : k / (cnt − 1)
left = 26.064 + fr · (743.136 − 26.064)             // the block slides from the left edge to the right edge
y    = top ? 25.4 : 404 − 59 − 4.1
x    = fr > 0.5 ? left + 234.8 − 44.8 : left        // right half: the globe on the outside, its cards toward the middle
→ round(x), round(y)
```

**The four cards** (`l4CryptSpots(gx, gy)` — beside a globe whose top-left is `(gx, gy)`, wherever that globe is):
```
right = gx + 234.8 <= 978.936                     // the table's right edge − the margin + 1
x0    = right ? gx + 44.8 + 10 : gx − 10 − 180     // 180 = four cards and three gaps; clamped to the table
y     = gy + 4.1                                   // clamped to the table
→ (round(x0 + i·46), round(y)) for i = 0..3
```

**The result, seat by seat** (globe; then the four cards' x and their y):
| N | Seat 1 | Seat 2 | Seat 3 | Seat 4 | Seat 5 | Seat 6 |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | (385,25) | (385,341) | | | | |
| 3 | (26,25) | (933,25) | (385,341) | | | |
| 4 | (26,25) | (933,25) | (933,341) | (26,341) | | |
| 5 | (26,25) | (385,25) | (933,25) | (933,341) | (26,341) | |
| 6 | (26,25) | (385,25) | (933,25) | (933,341) | (385,341) | (26,341) |

| Globe x | Cards x | | Globe y | Cards y |
| --- | --- | --- | --- | --- |
| 26 | 81 / 127 / 173 / 219 | | 25 (top row) | 29 |
| 385 | 440 / 486 / 532 / 578 | | 341 (lower row) | 345 |
| 933 | 743 / 789 / 835 / 881 | | | |

- The lower row is not at the table's bottom edge. The open hand panel covers the bottom quarter of the felt (it begins at canonical y 410–425 on every laptop window we measured), so the lower seats sit just above it.
- The cards are `uncontrolled`, `faceDown`, with canonical `x, y` — published like any other card. The server strips the names of face-down cards.
- After the deal nothing is special. A card drawn later lands on the centre row as before (`380 + k·52, 240`, `k` = the cards already uncontrolled).

## 3. Why our client steps aside when a bot is seated
- Your camp (`campAnchor()`, spec §6 i) is an ellipse around (502, 300), radii 350 × 180, seat 1 at the top. Its three rows run from `anchor.x − 150` in steps of 96.
- We laid that against the seat blocks above for every table of 2–6 seats with one bot: **14 of 70** bot-seat / human-seat pairs overlap (five slots per row assumed). The worst: four seats, bot at 2 against the human at 3 — 11 of the bot's 16 rectangles (15 card slots and the globe) touch that human's block.
- So `tableSetupOn()` is false while a non-vacant `bot` is in the roster. Run with v0.6.198 added from the lobby of a Classic room, option ticked: the humans start on the ring as before, your bot camps at (502, 120) with its four cards at y 205, and each human's log says once, after the deal line: *"The suggested table setup is skipped at a table with bots — they sit by their own pattern for now. Drag your pool globe to your seat and draw your crypt cards as usual."*
- This is the common online case, not a corner: Classic is the default board style and the option is ticked by default.

## 4. The ask
When `joined.tableSetup` is true (it only ever is in a Classic room):
1. Publish the `pool` token at the seat spot of §2 instead of the ellipse.
2. Lay the first four `drawCrypt` cards on the four spots beside it, face down as today.
3. Keep the rest of the camp clear of the neighbours. The top row's seats occupy y 25–88 and the lower row's y 341–404; the band between (about y 100–330) is free. A top seat's ready and torpor rows can grow downward from there, a lower seat's upward. How you lay it out is yours.

**How will our client know?** For a bot the browser hosts (Add bot, hotseat) we can gate on `ElysiumBot.BOT_VERSION`, as we did for the Hold line. A bot on its own socket has no version on the wire; if you want those tables to get the setup too, propose a signal and we will read it. Until one of the two exists, the guard stays.

## 5. Found while building this — for your records
- **The lobby's "bots need a Structured table" rule has never applied online.** `netBotWhy()` reads `boardMode` from the lobby message, which has never carried one, so a Classic room has offered Add bot since v2.6.99 — and your bot plays there (your `caps.classic` path). We measured it, changed nothing, and left the decision with Johan. If your guide or tests say online bots are Structured only, they describe the intent, not the client.
- **A spectator's free-board view is covered by our welcome layer** (the spectator has no cards, and that layer shows on an empty table). Ours to fix; mentioned only because your debugging may run into it.

## 6. Read, nothing for you
- The dock pin moved to the hand panel's top right corner, became a needle icon with a tooltip (v2.6.147), and the pinned edge is a thin line. DOM and CSS only.
- The globe's seat chip says `1st`, `2nd` … after the chair. DOM only; no log line changed.
- The deal line on a table with the setup: *"New deal (online): the server shuffled and dealt 7 cards — 4 crypt cards were placed face down beside the pool. Pool: 30. Library: 53 / crypt: 8 remain."* You parse neither `New deal` nor `Drew 1 crypt card` (grepped in v0.6.198); the canary is 57/0.

## Deploy
- **Server srv-2.6.44:** restart. **Client v2.6.147:** purge.
- **Bot v0.6.198:** unchanged, nothing to upload.
