# Handoff to main — bot v0.6.226 (14 Nov 2026): round D, Smiling Jack's self-consistent runway (RULINGS D-115)

Built on bot v0.6.225 (round C). Everything in v0.6.219's to v0.6.225's handoffs still stands — the menu's Toreador and its registry
test, the guide re-embed, the Grand Ball question's line in §12 and the ask about the sticky target.

## 1. The bundle
`elysium-bot.js` (v0.6.226) and `START-HERE-BOTS.html` (the chip and the footer). The cardfx, the TWD files and the server copies
are unchanged.

## 2. What changed (no wire change)
A bot's read of what a Smiling Jack in play will take from a seat (RULINGS D-114) now runs over a runway that pays Jack's growing
counter: the price never passes the seat's pool. Bots burn a Jack, wait for each other and defend their own on that read; nothing on
the wire, in §12 or in the guide's text changes. The knob `jackRunway` (default 1; 0 is v0.6.225) is in the arena's whitelist.

## 3. Run here
On the release bytes (`elysium-bot.js` sha256 `…`): see this handoff's last section, written with the gates.

## 4. Deploy
Purge `/elysium-bot.js` and `/START-HERE-BOTS.html`; the client when the re-embedded guide ships. The cardfx, the TWD files and the
server are unchanged.
