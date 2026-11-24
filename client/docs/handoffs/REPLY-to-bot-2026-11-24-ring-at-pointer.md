# REPLY to the bot project — 24 Nov 2026, THE RING AT THE POINTER (client v2.6.188)

**A notice, no ask of its own.** Client v2.6.188 adds a second way to open the bot ring. Nothing on the wire changed:
no verb, no field, no log line. The ring sends exactly what it sent in v2.6.187 (`REPLY-to-bot-2026-11-24-bot-ring.md`).
This note is for the Help ▸ Bots text we asked you for there, so it can describe both ways at once.

## What changed in the client

1. **Holding the right mouse button on the table opens the ring at the pointer.** This works only at a table with
   bots. The hold is 450 ms, the same as a touch long-press. The ring keeps 90 px from the window's edges, as the
   hub's ring does.
   - Release on a segment and it is picked, like a pie menu.
   - Release anywhere else and the ring stays open for a click.
   - The centre is the gear and opens the bot box beside the ring.
2. **A short right-click opens the same menus as before.** On macOS and Linux they now open when the button is
   released, not when it is pressed. Off (below) restores the old timing.
3. **Settings ▸ "Bot ring at the pointer (tables with bots)"** has two choices: "Hold the right mouse button" (the
   default) and "Off".
4. **The key list has "Bot ring at the pointer"**, unbound by default, for trackpads. The key opens the ring where the
   mouse last was and closes it on the next press. While it is open the arrow keys walk the ring.
5. **The hub works as before.** Hovering or tapping it opens the ring at the hub.
6. **The bot box can hide the hub** ('Hide the hub (hold the right button for the ring)'; off by default). A hidden hub
   comes back by itself while the table waits on this screen: when one of your bots asks a question, when a bleed is
   aimed at the player, and when Turn-based waits for ▶. It also shows while its own ring is open. It cannot be hidden
   on a touch screen, nor when the hold is off and no key is bound. The hub reads your bots' `status()` as before;
   nothing new is read.

## For the Help ▸ Bots text

Your next `START-HERE-BOTS.html` could say, in the quick answers part:

- hover the bot hub, or hold the right mouse button on the table, to open the quick answers;
- Settings can turn the hold off, and the key list can bind a key to it;
- the bot box can hide the hub, which comes back by itself while a bot waits on you.

The client describes it in its own Controls list ('Hold the right button (tables with bots)'). Your guide only needs
the lines above.

## For your read-only copies

Refresh `bot/elysium-vtes-bord.html` and `bot/ELYSIUM-PROTOCOL.md` from the release whenever it suits you. The protocol's
header is the only change there. The hotseat bridge is unchanged. `test-bot-hotseat.js` in a scratch copy with v2.6.188:
see the PR.
