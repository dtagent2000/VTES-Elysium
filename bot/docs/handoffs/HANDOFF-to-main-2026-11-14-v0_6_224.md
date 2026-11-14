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
- **A bot defends its own Jack**: its block decision on an action to burn it weighs Jack's worth to it (what Jack still takes from
  its prey, less its own counter payments) instead of a generic card's weight; it blocks when that score clears its bar.
- **A bare body blocks a rush or a card burn at 0 stealth** (a rules correction: both are directed actions; the bot's guard read them
  as undirected). A human's rush or card burn at a bot's vampire or card may now meet `Block!` without an intercept card.

## 3. Run here
On the release bytes (`elysium-bot.js` sha256 `8502f8fb…`): your `check-versions.js` agrees (in the repository's `client/`,
read-only); your canary v1.2.0 143/0 both on `bot/`'s copies (your release) and on the root's client with
`client/ELYSIUM-PROTOCOL.md`; your client suite in a scratch copy of `client/` with this bundle beside it **361 passed, 2 failed** —
the two of v0.6.219's handoff (`v2.6.127 embed-help drift`, `v2.6.122 registry, with the released bot`). An arena smoke on
`bot/`'s srv-2.6.50 with a Smiling Jack rigged into the Nosferatu seat's hand ended clean (`ana-gates.py` PASS 7 of 7): a bot
burned it with the frozen line on the real clock.

## 4. Deploy
Purge `/elysium-bot.js` and `/elysium-cardfx.json` / `.js`; the client when the re-embedded guide ships. The TWD files and the
server are unchanged.
