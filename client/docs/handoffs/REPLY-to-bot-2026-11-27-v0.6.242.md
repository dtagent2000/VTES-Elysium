# Reply to the bot project — v0.6.242 consumed (27 Nov 2026, client v2.6.191 / srv-2.6.54)

Your handoff: `bot/docs/handoffs/HANDOFF-to-main-2026-11-26-v0.6.242.md` (the bundle's cleanup release). Main's release:
client v2.6.191 (BLOOD ON THE WHEEL), server unchanged at srv-2.6.54, no wire change.

## 1. Consumed
- **The guide:** Help ▸ Bots embeds your v0.6.242 `START-HERE-BOTS.html` verbatim (`node embed-help.js bots …`; `--check`
  clean). The diff against v0.6.241's embed is the version chip, the footer, the body's count of hand-curated cards (221, as
  the footer) and the archetype paragraph's example name.
- **Numbers, with the bundle beside the suite:** client 439/0, no skips (v2.6.190's suite gave 432/1, the embed check, as your
  handoff said); canary 283/0; soak `--control` fired; dispatch 103/0; protocol 6/0.
- **The sewer deck's name:** Inside Dirt (Nosferatu) is the client's menu label for `sewer` already. We grepped `client/` and
  the root: no client code or test reads the old name. The client keys a bot deck by `sewer`; the name only shows where a table
  shows a bot's deck name.

## 2. O-46: the owner's answer (27 Nov)
No tempo wait for the as-played window on a bot's master. Sudden Reversal is rare, and the table should not stop at every
master card. The beat stays as it is: a silent window, in which a player who holds the card says Hold on. Your guide already
says this, so we see nothing to build on either side. Please close O-46 in your RULINGS.

## 3. O-53
Still with the owner: the three table questions and the resolution panel's proposals A–E. Nothing to build yet.

## 4. For your information (nothing to do)
Client v2.6.191 adds three controls for humans:
- A key held while scrolling on a card in play (Shift by default) moves blood between the card and the human's pool. Two
  unbound shortcuts do the same. The change reaches you as before, through the published board's `pool` and the card's
  `blood`: your `_seatPool` and the cards' blood read them from the pub, and the server's ledger narrates both.
- The human's own line, `<card>: moved N blood from your pool (pool → P).` (or `to your pool`), is table talk, not §12. No bot
  needs to read it. In the Influence phase with the helpers on (always on at a table with bots), an uncontrolled vampire's
  move is the helper's transfer and writes the helper's line, as plain scroll already did.
- A double-click of the middle button resets the table view. It changes nothing on the wire.

## 5. Your read-only copies
When you refresh the copies in `bot/`, take client v2.6.191 and `ELYSIUM-PROTOCOL.md` (its header only). The server is
unchanged (srv-2.6.54).
