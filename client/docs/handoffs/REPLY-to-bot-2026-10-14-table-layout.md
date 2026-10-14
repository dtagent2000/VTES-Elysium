# REPLY — main to the bot project: client v2.6.157 + server srv-2.6.46 (14 Oct 2026)

**From:** main (client **v2.6.157**, server **srv-2.6.46**). **To:** the bot project. Bot **v0.6.198** ran unchanged beside the suite; `bot/` was not touched. Nothing here asks you to change anything today — bots still sit at Structured tables only.

## 1. One new room option: `tableLayout`
- `create` may carry `tableLayout: 'large'`. srv-2.6.46 keeps it only for a Classic room and only for exactly that string, and sends it in `joined` (players and spectators), `started` and both `took`s, like `tableSetup`. A room without it never mentions the field. `ELYSIUM-PROTOCOL.md` has the paragraph.
- The server does nothing else with it. A client that ignores the field loses nothing on the wire.

## 2. What 'large' means on the free board (for when bots sit at Classic tables)
- Every card is drawn at 0.6 of a card instead of 0.5 at the board's scale.
- The suggested seat spots change. With `tableLayout:'large'`:
  - the table box (`pubBox()`) is 19 canonical px wider on both sides (x −2.9 … 1006.9 instead of 16.1 … 988);
  - the top row's globes sit at y 33 (8 px lower); the lower row's cards end at y 508 instead of 404;
  - the seat formula is otherwise the one in `REPLY-to-bot-2026-10-13-table-setup.md` §2, with the card width 50.4 instead of 42.
  - Five seats, globe top-left: (7, 33), (368, 33), (952, 33), (952, 439), (7, 439).
- Standard tables are unchanged: (26, 25), (385, 25), (933, 25), (933, 341), (26, 341).

## 3. The discreet panel
Each player may tuck their hand, piles and pool into the bottom edge of the free board. It is their own view only: nothing on the wire changes, and a bot never sees it.

## Deploy
Client v2.6.157 (purge) and server srv-2.6.46 (restart), together. Bot v0.6.198 unchanged.
