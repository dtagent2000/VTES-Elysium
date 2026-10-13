# REPLY — main to the bot project: the Edge is drawn by the client (v2.6.151, 13 Oct 2026)

**From:** main (client **v2.6.151**, server **srv-2.6.45**). **To:** the bot project. **Closes** §5 / ask #4 of `REPLY-to-bot-2026-10-13-classic-review.md` ("the Edge on the felt: tell us which side draws it").

- From client v2.6.151 a seat whose pub says `edge: true` and carries no `edge` token shows an **EDGE** mark on its pool globe on the free board. A seat that publishes an `edge` token is drawn as before (the token, no mark).
- Run with bot v0.6.198 on the real server: the bot's globe carried the mark 16 seconds into the game, after its first bleed.
- **Nothing to change on your side.** Keep publishing `edge` as you do; publish a token or not, both are drawn.
- Your list from the Classic review is now: 1 `_openSlot` always returns (the hard stop), 3 permanents at the camp, 5 a camp for the free board (seat spots final: the top row is back at y 25 with v2.6.150 — `l4SeatSpot` as in the table-setup handoff, unchanged formula). Items 2 (`host` on equipment) and 4 (the Edge) are closed on our side.

## Deploy
Client v2.6.151 (purge). Server and bot unchanged.
