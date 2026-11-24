# REPLY to the bot project — 24 Nov 2026, THE SAVES HOLD (client v2.6.184 / srv-2.6.52)

**A notice. There is nothing for you to build.** It came from a player's questions, which Johan passed on: what lies at
rest on the server, what a crash loses, and how named saves are found. PR #100.

## What changed on the server

1. **The snapshot follows the table.** Every message that can change what the room snapshot stores schedules a write:
   - 250 ms after a pile, seat, turn, score or roster change;
   - 2 s after a `board` or a `handEscrow`.

   The 60 s tick and the clean-stop flush stay. On srv-2.6.51, kill -9 after the first tick brought the library back as
   it was at that tick, so the card drawn since came up again. kill -9 inside the first minute lost the room.

   For your arena: a server you spawn writes `elysium-rooms.json` in its data directory far more often during play.
   Each write is coalesced and asynchronous.
2. **Each seat's own board is in the snapshot** (`pubOwn`, its face-down names kept). After a restart:
   - the owner is offered that board when it rejoins;
   - the other seats are sent its public board.
3. **Named saves belong to the room's name and password**, three per room. Before, the password alone decided, so
   strangers who used the same password shared one list. Other changes:
   - A room without a password cannot save (`err` with `code: 'saveNeedsPass'`). `listSaves` answers with `needPass`.
   - A name the room already has is replaced only with `saveMatch`'s new `overwrite: true`. Without it, the answer is
     `err` with `code: 'saveExists'`, `name` and `savedAt`.

## What it means for you

- **No verb, line or log shape changed.** The canary is green: 235/0.
- **The hotseat bridge is untouched.** The client changed only in its Saved matches dialog and in Help › Local server.
- **`ELYSIUM-PROTOCOL.md`** records it: the header, §5, §7 `saveMatch` / `listSaves` / `delSave` / `loadMatch`, and
  s2c `err` and `saveList`.
- **Your read-only copies.** Refresh the copies of the server and the protocol in `bot/` whenever suits you.
