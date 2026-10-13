# REPLY — main to the bot project: your Classic (free-board) path, read and run from the client's side (13 Oct 2026)

**From:** main (client **v2.6.148**, server **srv-2.6.44**; nothing of ours was changed for this). **To:** the bot project. **Answers:** nothing of yours. Johan asked us to read your Classic path with the client's eyes and say whether anything stands in the way of bots at Classic tables. Bot **v0.6.198** (`0f816dd9…`) was read and run unchanged; `bot/` was not touched.

## 0. In short
- **Johan's decision stands: bots sit at Structured tables only for now.** v2.6.148 enforces it in the lobby. Nothing below is urgent for you; it is the list for the day bots come to Classic tables.
- **One hard stop (§2).** On a Classic table `_openSlot` never returns once a camp row has used its distinct slots: 4 at the right-hand seats, 5 to 11 elsewhere — and sooner when a hosted master still holds one. The bot's process spins. A bot on its own socket looks online for about a minute and a half, then the server drops it; the turn stays with its seat until the host passes it, round after round, or ousts it. A lobby bot freezes the host's tab instead, and there the other players see every seat online for as long as that tab stays open. Run five ways, including live tables on the real server and lobby bots in the host's tab.
- **Three things that make a Classic table hard to read (§3–§5):** permanents at fixed felt coordinates (every bot's pile lands on the same corner, the one our seat 1 uses at tables of three to six), a camp laid out for the Structured card size and for neither of the free board's two panels, and no Edge token.
- **One of them is on Structured tables too (§3.2):** equipment is not drawn on the vampire that bears it. The card carries no `host`.
- **One thing is ours (§6):** on the free board a human's `zone` does not say what the card is. Your reads of `zone` are right for Structured and wrong there. We have proposed a client fix to Johan; you need not change anything for it.
- **Our own seat spots may still move (§7).** Do not build on the formulas of the 13 Oct table-setup handoff yet.
- **What ran fine (§8):** the Classic deal, the turn loop, the asks. Seven of eight guarded Classic soak tables never asked for more slots than a row has — but which deck sits at which seat decides that, and three rows peaked exactly at their limit.

## 1. How we looked
- **Read:** `campAnchor`, `slot`, `_openSlot` and its thirteen callers, every fixed coordinate, the reads of another seat's `zone`, `buildPub`, the `joined` / `dealt` / `ctrl` handlers.
- **Run (each claim below says which):**
  1. *Unit:* a `Bot` built without a socket, `caps.classic` set, a roster of 2–6.
  2. *Soak:* our `elysium-soak-hotseat.js` (`runTable`, real bots, the client's bridge), one table per process, the board style set through the bridge's own `_boardMode`. Eight tables × two styles with a **measuring guard** (the scan gives up after 200 steps, records it and returns slot 0), then seven tables with **no guard**.
  3. *Live:* the real server, headless Chromium with client v2.6.148 as host (a human at seat 1 who draws four crypt cards, drags his globe and cards to the corner our seat-1 spot uses, and passes), and three bots on their own sockets, each in its own Node process (`new Bot({ server, room, seat, deck: ARCHETYPES[…], paceMs: 400, askSecs: 3 })`; the room's own tempo applied — Standard, 3 s, seeded by the host's client). A Classic room with the setup option ticked; with a bot seated our client skips the setup. Three runs. In the third, a wrapper in our process wrote a line before and after every `_openSlot` call; the function itself ran unchanged.
  4. *Lobby:* main's files as they are today (client v2.6.145 + srv-2.6.43, byte-identical copies), a Classic room, two bots added with the lobby's own controls. Two runs; in the second a second human sat at the table and watched.
  5. *Zones:* the real server, two browsers and one in-process bot. Drags and double-clicks by real mouse; the four draws are the `influence()` the pile's double-click calls, and To torpor is the card menu item's own two statements (the menu itself was clicked in a separate two-human run). The second table's bot column is the frames the other human's client received, replayed into an offline bot.
- Scratch scripts only. Nothing was added to either suite.

## 2. The hard stop: `_openSlot` does not return when a Classic row is full
**The code.** `slot()` clamps a Classic camp's x to 12 … 908, so every index past the clamp returns the same point. `_openSlot` scans `for(idx = 0; ; idx++)` for a point no card of that zone holds. When all distinct points are held, no index is ever free.

**Any card of that zone holds a point, not only a vampire.** A hosted master is created at its host's x, y in zone `ready`, and nothing moves it when the host goes to torpor: it keeps the slot. So the stop can come before the row's vampires fill it. Read, plus a unit simulation of those two writes (the checker's script, not a played game): at seat 2 of 4, with two ready vampires, a third in torpor and its Blood Doll left on the old point, the next vampire takes the last free point and the scan for the one after it does not return — one vampire short of the row's four.

**Twenty seconds to see it** (beside your `elysium-bot.js`; prints `702,225  798,225  894,225  908,225`, then never returns):
```js
const BOT = require('./elysium-bot.js');
const b = new BOT.Bot({ name: 'B', room: 'x', deck: BOT.ARCHETYPES.hacking, log(){} });
b.caps.classic = true; b.seat = 2; b.players = [1, 2, 3, 4].map(s => ({ seat: s, name: 'P' + s }));
for(let i = 0; i < 4; i++){ const p = b._openSlot('ready'); b.board.push({ id: 'c' + i, name: 'V' + i, kind: 'crypt', zone: 'ready', x: p.x, y: p.y }); }
console.log(b.board.map(c => c.x + ',' + c.y).join('  '));
b._openSlot('ready');   // the fifth
```

**Distinct slots per row** (run: `slot(zone, 0…59)`; the three rows of a seat have the same count):

| Table | Seat 1 | Seat 2 | Seat 3 | Seat 4 | Seat 5 | Seat 6 |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | 7 | 7 | | | | |
| 3 | 7 | **4** | 10 | | | |
| 4 | 7 | **4** | 7 | 11 | | |
| 5 | 7 | **4** | **5** | 9 | 11 | |
| 6 | 7 | **4** | **4** | 7 | 10 | 10 |

- At a four-seat table seat 2's row is x 702, 798, 894, 908: the last two slots are 14 px apart, and a free-board card is 42 wide.
- A right-hand bot's four opening crypt cards fill its uncontrolled row before its first turn.

**What asks for a slot:** a vampire brought out or rescued (`ready`), a crypt card drawn (`uncontrolled`: the influence fetch, Effective Management, New Blood's draw), a combat loss or a self-torpor card (`torpor`) — and a **human's** right-click "Send to torpor" / "Leave torpor" on one of your vampires: the `ctrl` handler calls `_openSlot` too (run as a unit with a full torpor row: the handler does not return).

**Run:**
- *Unit.* Fill a row and ask once more, in a child process: no return, killed after 4 s — four seats, seat 2, uncontrolled (4 cards); two seats, seat 1, ready (7); four seats, seat 4, ready (11).
- *Soak with the guard, 8 Classic tables.* Seven never saturated. The six-bot table (ventrue, hacking, sewer, malkavian, tremere, nosferatu; pool 20) did seven times: seat 3 `uncontrolled` with 4 in the row, then seat 2 `ready` with 5, 6, 6, 7, 8 and 9.
- *Soak without the guard.* That table, three tries: the process last breathed 40 s, 37 s and 39 s in, and was killed at 300 s. The same six decks on a **Structured** table: 29 turns, five ousts, done in 170 s. A four-bot Classic table (sewer, hacking, malkavian, tremere; pool 30), three tries: last breath at 50 s, 44 s and 27 s.
- *Live, run A* (hacking at seat 2, nosferatu at 3, tremere at 4). About 85 seconds into the game, in its third own turn, the hacking bot's lines stopped; it burned 0.86 of a core. Its last state was 4 ready vampires (its row's four slots) and 2 uncontrolled, with its Influence phase next: the fifth vampire is our reading, no line records it. A minute later its process had used 59 s of CPU, the header still read "Bot2-hacking's turn" and the roster showed all four seats online.
- *Live, run A again, traced and watched longer.* This time it stopped in its **first** turn, 20 seconds into the game: it played Effective Management with four uncontrolled cards in its four-slot row. The trace's last line is `_openSlot('uncontrolled')` asked with 4 cards in the row; no answer follows. **What the table saw:** nothing for about a minute and a half, every seat online. Then the log said "Bot2-hacking disconnected." and the roster marked the seat offline — your socket answers pings in JavaScript, and our server drops a socket that has been silent for 75 s. (The log line shows in the hand panel when that is open; the offline mark is in the Table panel only. The globe on the felt carries no sign of it.) The turn stayed with seat 2. The host's ⏭ Pass their turn… moved it on; one round later it was back at seat 2. 💀 Oust this player… ended it, and the table played on (ten turns watched). The bot's process kept a core busy through the 140 s watch. (Ours, seen in the same run: when the roster changed, our free board dropped every other seat's cards from the human's screen. They come back with the next board message from anyone, or when the viewer moves a card of his own. A client bug, on main as well; it is with Johan.)
- *Live, run B* (tremere at 2, nosferatu at 3, malkavian at 4): eight minutes, no stop; two bots ousted. Tremere at the four-slot seat never held more than four cards in a row.
- *Lobby, main's files today* (§1.4; hacking at seat 2 of 3, tremere at seat 3, the lobby's own pace). The host's page answered until 262 s (hacking: 4 ready). From 272 s it answered nothing: not 20 s later, not 60 s later, and it could not be photographed. Its renderer went from 40 s to 115 s of CPU in 73 s. **A lobby bot runs in the host's tab, so the loop freezes the host's whole client.**
- *Lobby again, with a second human at the table* (hacking at seat 2 of 4). The bot played Effective Management in its first turn and the host's page stopped answering. **The other human saw nothing change for the 150 seconds we watched: the turn on seat 2 and every seat online, host and both bots.** A browser answers the server's pings by itself, frozen page or not, so nobody is dropped. When we closed the host's tab, the host and both bots went offline together; the turn stayed on seat 2 and the other human was not made host in the 90 seconds we watched. Nobody at the table had a tool left.

**Not on Structured:** that branch of `slot()` has no clamp, so every index is a new point.

**How a bot reaches a Classic table.** From v2.6.99 to v2.6.147 our lobby offered Add bot in a Classic room (our bug; `REPLY-to-bot-2026-10-13-table-setup.md` §5). v2.6.148 closes it; that version is in an open pull request and not on main yet. A bot on its own socket can still join a Classic room.

**What the client needs:** a placement that always returns. Cards may overlap on the free board; humans stack theirs.

## 3. Cards at fixed coordinates
### 3.1 On the free board they are points on the shared felt (run)
Read in v0.6.198: equipment and retainers (`_doEquip`), allies, Creeping Sabotage, Fame, Smiling Jack, Pentex Subversion and every card given to you enter at **x 64, y 64**; Revelations at 60, 60; a master with no host at `x = 100 + (board.length × 20) % 800, y = 40`.

- On a Structured table those are coordinates inside your own mat, and our mat clamps a ready card into your ready region.
- On the free board every seat publishes in one coordinate space, 1004 × 616. All bots' piles land on the same corner.

Live run B, read off the human's client:
- Seat 3 (nosferatu): Smiling Jack and two Creeping Sabotage, all three at (64, 64). The Labyrinth at (180, 40), Guardian Angel at (220, 40).
- Seat 4 (malkavian): Elder Library at (180, 40) — the point seat 3's Labyrinth holds — and Revelations at (60, 60).
- Seat 2 (tremere): Chantry at (280, 40).
- The human had taken the corner our seat-1 spot uses at a four-seat table (dragged there by mouse): globe at (26, 25), four crypt cards at x 81–261, y 29–88. The corner pile lay across his globe and first card; the y 40 row lay across his third and fourth.
- In the guarded soak, 5 of 28 Classic bot seats had a loose permanent at the corner (3 at most), 14 had one in the y 40 row (3 at most).

**What the client needs:** a permanent at its owner's camp. Any spot there will do.

### 3.2 Equipment is not drawn on its vampire — Structured too (run)
`_doEquip` pushes the card at 64, 64 **without `host`** and adds its id to the vampire's `attached`. Your Blood Doll / Vessel path sets both.

- Our client draws every `ready` card without `host` at its own x, y. It draws a vampire's `attached` ids on the vampire first; when the loop reaches the equipment card itself, the same element moves to 64, 64. There is one element per seat and id.
- Run (your `rig` option, a tremere bot with four equipment cards in hand, the real server, the human's screen):
  - **Classic:** Sport Bike, borne by Nassir, drawn at the felt's top-left corner, 488 px left of and 434 px above Nassir (screen px at 1366 × 768, here and below). A Vessel (with `host`) on Chrysanthemum in the same picture: drawn on her.
  - **Structured, a seat visit:** Sport Bike and Bowl of Convergence drawn on top of each other in the corner of your ready region, 80–167 px left of and 123–142 px above the vampires that bear them. The log says "Chrysanthemum now bears Bowl of Convergence"; the board does not show it.

**The ask:** `host: vamp.id` on the equipment card, as on a hosted master. Nothing is needed on our side; the card then rides on its vampire in every view.

## 4. The camp and the free board's furniture
- **Card size (read + run).** The free board draws a card 42 × 59 (the Structured size is 84 × 118). Your rows step 96 px, so a row of seven is 618 px wide and a seat owns as few as four slots. With a 50 px step the same clamp gives 13 slots where there are 7, and 6 or 7 where there are 4.
- **Rows that coincide (run).** A seat whose anchor is at y 480 (seat 2 of 2, seat 3 of 4, seat 4 of 6) has its torpor row at y 485 and its uncontrolled row at y 486: the clamp at `bh − 130` folds them together. A torpored vampire and a face-down crypt card in the same column cover each other. At five seats, seats 3 and 4 have the two rows 35 px apart.
- **Under the hand panel (run).** Every player's hand panel opens over the lower part of the felt, from canonical y 413–416 down (measured at 1366 × 768, 1536 × 864 and 1920 × 1080). It can be pinned open (by a button since v2.6.143). In the live runs the bottom bot's globe and its two lower rows were behind the human's open panel; the left and right bots' uncontrolled rows (y 385) were cut by its top edge.
- **Under the Played tray (run).** The tray opens from the top centre and is 880 px wide on screen. On a 1366 × 768 window it covers canonical x 131–823, y 24–127, and down to y 156 with a row of cards in it (1920 × 1080: x 244–725, y 20–91, to 111 with cards). A resolver's tally **pins it open** on every client that has that helper on, and it stays pinned after the resolver closes (run with two humans). Your block tally does the same: in the first two live runs the tray stood open over the human's seat. Seat 1's ready row (y 45) lies under it.
- **So:** on a laptop window, what every player sees with both panels open is roughly y 156–413.
- **The globe.** Your `pool` token is the top-left of an element whose name line is wider than its 44.8 px circle; at the anchor it touches the third slot of the torpor row (seen at the bottom seat in the live pictures).

**The ask (later):** on a Classic table, lay the camp out for the 42 × 59 card, keep it out of the two bands, and — when the room carries `tableSetup` — start from the seat spot (§7).

## 5. The Edge (run)
After a bleed you publish `edge: true`. On the free board we show another seat's Edge only as a token (`pub.tokens`, type `edge`), and your `tokens` holds the pool alone. In the first two live runs a bot held the Edge within the first minute and nothing on the felt showed it. The Table panel still marks the pool cell (read).

**Either side can close this.** You publish an `edge` token at the camp while you hold it, or we draw the Edge beside a globe when `pub.edge` is set and no token came. Say which you prefer.

## 6. Ours: what a human's `zone` means on the free board today
The free board has no zone boxes. Our client changes a card's `zone` on some gestures and not on others, so it drifts from what the card is.

Run on v2.6.148; the last column is your model of that seat (`_scanOpp`, `_preyUnlockedN`, `_tableThreat`, `_rushCandidates`, `_seatCanBlock`):

| The human does | His client publishes | The bot concludes |
| --- | --- | --- |
| draws four crypt cards | `uncontrolled`, face down | `uncN` 4, no minions — right |
| drags one of them, still face down, to his corner | **`ready`**, face down, no name | `readyN` 1, one unlocked body at the prey, threat +2, a rush candidate named `undefined`, "can block" |
| double-clicks a face-down card where it lies (brings the vampire out) | **`uncontrolled`**, face up, named | no vampire: it is counted as uncontrolled |
| sends a vampire to torpor from the card menu | `torpor` | torpor — right |
| drags that torpored vampire aside | **`ready`** | a ready, unlocked vampire |

- With the Suggested table setup (v2.6.146) the four cards start beside the globe, so "double-click where it lies" is now the ordinary way to bring a vampire out.
- Our own counts read the same field and are wrong the same way: the phase bar's Minion number, the Table panel's 🧛, the clan symbol, the transfer count.
- A rush candidate without a name scores 0 in `_rushScore`, so it is not picked. `fxLookup(undefined)` did not throw.

**What we do.** We have proposed to Johan that on the free board a crypt card's face decides its zone: face down is `uncontrolled`, face up is `ready` unless it was sent to torpor, and a drag changes neither. If he says yes, your comment on `_scanOpp` ("every ready/torpor card is face-up") holds on Classic as well, and you change nothing. We will name the client version here when it ships.

**If you want a belt as well:** `!c.faceDown` where you count another seat's ready crypt cards. Among the reads without it in v0.6.198: `_preyUnlockedN` (line 1467), the block-bar's `blockers` (2969), `actorUnlocked` (2540, 3428, 7036), `_tableThreat` (3663), `_rushCandidates` (3672), `_seatCanBlock` (4191), the snapshot's count (2581), and `readyN` in `_scanOpp` (counted on line 1834, one line before its own face test). Line 2888 has it.

## 7. Our seat spots are not final
`REPLY-to-bot-2026-10-13-table-setup.md` §2 gives the seat formulas of v2.6.146. This review found that the Played tray covers our own top row (§4): on a two-seat table seat 1's globe and all four cards are behind it once any resolver has pinned it. We have put that to Johan. **The formulas may change before the release; wait for the release note before you camp on them.**

## 8. What ran fine
- **The deal.** On a Classic table the server deals no uncontrolled cards, and the bot draws four by verb before its first turn — against the real server and through the bridge.
- **The turn loop, the asks, the announcements** ran in every table that did not stop. No live Structured twin was run. A socket bot at a Classic table is not under the lobby's helper lock; nothing depended on it in these runs.
- **The soak.** With the guard, 8 of 8 Classic tables finished and none stuck; rounds, turns and ousts were of the same size as their Structured twins'. Read that with its seating: the weenie deck sat at a seven-slot seat in four of its five tables, and three rows peaked exactly at their slot count (ready 7 of 7 twice, ready 4 of 4 once). Without the guard, all six Classic tables we tried stopped.
- **Opening tempo.** No difference shown: two paired runs of hacking against sewer, turn by turn — ready vampires after own turns 1–5 were 1, 4, 5, 6, 6 and 1, 3, 5, 6, 7 on Structured, 1, 3, 5, 6, 6 and 1, 3, 4, 4, 5 on Classic. The spread inside a style is as large as the gap between them.
- **`give`.** A card you play on a human's board (`rx 0.5, ry 0.5`) lands mid-felt on the free board. Read, not run.

## 9. Not looked at
- A human's `ctrl` verbs on your cards at a Classic table, beyond reading the handler and the unit run of `torpor` in §2.
- Reconnect of a socket bot at a Classic table, Turn-based tempo, the debug mode.
- Touch, and windows smaller than 1366 × 768.
- Whether a lobby bot at a Classic table froze anyone's tab in real play. The path was open from v2.6.99; we have no report either way.

## 10. The asks, in order
1. **`_openSlot` always returns** (§2). The only hard stop.
2. **Equipment carries `host`** (§3.2). Structured tables gain from it today.
3. **Permanents at the camp, not at fixed felt points**, on a Classic table (§3.1).
4. **The Edge on the felt** (§5): tell us which side draws it.
5. **A camp for the free board** (§4, §7): later, once our seat spots are final.
6. **Zones** (§6): nothing, unless you want the belt.

## Deploy
Nothing. No deployable file of ours or yours changed; this handoff and our living docs are the only writes.
