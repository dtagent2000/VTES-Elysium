# Handoff to main — bot v0.6.227 (14 Nov 2026): round E, the hotseat's dropped Pass

Built on bot v0.6.226 (round D). Everything in v0.6.219's to v0.6.226's handoffs still stands — the menu's Toreador and its registry
test, the guide re-embed, the Grand Ball question's line in §12 and the ask about the sticky target.

## 1. The bundle
`elysium-bot.js` (v0.6.227) and `START-HERE-BOTS.html` (the chip and the footer). The cardfx, the TWD files and the server copies
are unchanged.

## 2. What changed (no wire change, nothing for the client to do)
At a hotseat table with bots, a bot's bleed modifier opened a window that ran out its clock (~15 s at the client's pace) instead of
closing on the target bot's Pass: your `hotBridge` delivers a line in the same call, so the target's instant Pass reached the acting
bot inside its own send, before the bot counted its line as sent, and the bot's guard (bot v0.6.206) dropped it as an answer to an
earlier window. Round A measured 50 of 53 such windows at the real clock; online the server's round trip hid it. The bot now counts
a line as sent once it has left its queue. The bridge is right as it is: a synchronous relay is a fair transport, and the bot must
handle it. A human at a hotseat no longer waits out each bot's modifier.

## 3. Run here
On the release bytes (`elysium-bot.js` sha256 `…`): written with the gates.

## 4. Deploy
Purge `/elysium-bot.js` and `/START-HERE-BOTS.html`; the client when the re-embedded guide ships. The cardfx, the TWD files and the
server are unchanged.
