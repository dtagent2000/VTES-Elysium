# REPORT — the table runs on the real clock (round A, 13–14 November 2026)

Johan, 13 Nov: table runs with Toreador seated, and v0.6.222's unsure list counted at the real clock — superseded combats, held
turns, rush complies, fizzles, actions against an ousted seat (CHANGELOG v0.6.222, PR #67, the BOARD lines). Bot v0.6.222 (main
`1e9f3fd`, `elysium-bot.js` `e595f4a5`) as released, before any change of round A. Two bot-only tables on the real clock, one at a time
(two cores here, and the counts are timing-sensitive); the counts come from `ana-rare.py` v1.0.0 (new: read-only), the audits from
`ana-gates.py`, the windows from `ana-windows.py`.

- **The online table** — the server arena on srv-2.6.50, the client pace (`--pace 3100 --ask-secs 20`), five Expert bots: the four
  starters and Toreador, random seating, start pool 30.
- **The offline table** — the hotseat table on the real clock (`elysium-bot-sim.js --real`, the client profile), the same five decks.

## Predictions (registered before any table run)
1. Every audit passes on both tables: `ana-gates.py` PASS; on the online table the windows gate is 0.
2. Superseded combats: 0–2 per table; no Change of Target record ends one.
3. Held turns: on the online table one per match whose survivor is handed a turn after the last oust (the server does that,
   v0.6.221), none released (nothing unousts at a bots-only table); on the offline table none (the sim table ends at the last oust).
4. Rush complies on the actor's word (the rushed bot meant to block): 0–2 per table (the sim: 1 in 240, 2 in 600).
5. Fizzles: 0–2 per table.
6. Resolutions at an ousted seat (a rush, a card burn, a referendum's deltas, a peek): 0.
7. The offline table runs out most bot-vs-bot reaction windows, as the sim does (BOARD: 403 of 467 bleed totals at pace 0; the
   sim matches the real-clock hotseat table): `RAN OUT, THROUGH` above half of the windows there, 0 on the online table.
8. No play line of Toreador's carries "(uncurated" (its library is curated: `docs/CARDS.md`).

## Results
(filled in after the runs)
