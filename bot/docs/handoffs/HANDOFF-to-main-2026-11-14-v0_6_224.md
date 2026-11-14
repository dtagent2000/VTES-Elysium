# Handoff to main — bot v0.6.224 (14 Nov 2026): round B, the Jack burn (RULINGS D-114)

Built on bot v0.6.223 (round A). Everything in v0.6.219's to v0.6.223's handoffs still stands — the menu's Toreador and its registry
test, the guide re-embed.

## 1. The bundle
`elysium-bot.js` (v0.6.224), `elysium-cardfx.json` / `.js` (Smiling Jack gains its second mode: "Vampires can burn this card as a
(D) action") and `START-HERE-BOTS.html` (the chip and the footer only). The TWD files are unchanged.

## 2. On the wire: nothing new to build
No new verb, field or frozen line. What a table sees differently:
- **A bot may burn another Methuselah's Smiling Jack** as a (D) action, with the frozen line of v0.6.217 (§12, `burnAct`):
  `VAMP takes an action to burn NAME's Smiling Jack, The Anarch.` It weighs the burn against its best other action: what Jack will
  take from it over its runway against what Jack takes from its prey. A human's Jack: the human may block (a directed action);
  unblocked, the bot says `It resolves` and tells the human in chat `NAME: your Smiling Jack, The Anarch is burned.` — the human
  burns it (the same path as the Grand Ball's burn since v0.6.217). A bot's Jack is burned by its own bot on its Pass.
- **A bot defends its own Jack**: an action to burn it is blocked by its worth to the bot (what it still takes from the bot's prey).
- **A bare body blocks a rush or a card burn at 0 stealth** (a rules correction: both are directed actions; the bot's guard read them
  as undirected). A human's rush or card burn at a bot's vampire or card may now meet `Block!` without an intercept card.

## 3. Run here
On the release bytes (`elysium-bot.js` sha256 `SHA_BOT…`): CLIENT_LINE

## 4. Deploy
Purge `/elysium-bot.js` and `/elysium-cardfx.json` / `.js`; the client when the re-embedded guide ships. The TWD files and the
server are unchanged.
