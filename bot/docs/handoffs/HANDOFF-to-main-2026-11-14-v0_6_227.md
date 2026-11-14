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
a line as sent once it has left its queue, and never sends inside its own send. **A question:** the bridge plays the server's role,
and the server delivers after a send returns, while `hotBridge.toBot` delivers inside it. Should it stay synchronous? The bot now
handles both; one order is still open on our side at pace 0 (a window that opens after its line was delivered, our BOARD).

## 3. Run here
On the release bytes (`elysium-bot.js` sha256 `8706fc5a…`): your `check-versions.js` agrees; your canary v1.2.0 143/0 on `bot/`'s
copies and on the root's client; your client suite in a scratch copy of `client/` with this bundle beside it **361 passed, 2
failed** — the two of v0.6.219's handoff. Your client's hotseat with three bots in headless Chromium (`bot/tools/hotseat-in-browser.js`,
eight sweeps): no answer dropped, the bot-vs-bot modifier windows closed at the target's Pass in 0.55 s (v0.6.226 dropped 2 Passes in
the same sweeps); the sim's hotseat table on the real clock: 21 modifier windows, none ran out (round A: 50 of 53).

## 4. Deploy
Purge `/elysium-bot.js` and `/START-HERE-BOTS.html`; the client when the re-embedded guide ships. The cardfx, the TWD files and the
server are unchanged.
