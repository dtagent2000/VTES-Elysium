# Handoff to main — bot v0.6.221 (13 Nov 2026): the Jack round

Built on bot v0.6.220 (#65, merged 13 Nov). Everything in v0.6.219's and v0.6.220's handoffs still stands — the menu's Toreador
and its registry test, the guide re-embed.

## 1. The bundle
`elysium-bot.js` (v0.6.221) and `START-HERE-BOTS.html` (the chip and the footer: bot v0.6.221, 13 November 2026; the Unlock
paragraph says a bot's Smiling Jack carries its counters on the card for every seat to see, the Master paragraph that a choice that
lasts shows as a custom token on the bot's own cards). cardfx and the TWD files are unchanged. One re-embed covers v0.6.219–221.

## 2. On the wire: the bots' cards carry `counters` (RULINGS D-113)
No new verb, no new line and no new field: a bot's `board` push now fills the card field your client already has for a human's
custom tokens — `counters`, an array of strings, at most 12 a card and 64 characters each (what your `sanitizePub` keeps).
- **A bot's Smiling Jack**: one `pool` per counter. The bot never sent them, so its Jack took its owner's pool and no seat paid (the
  bots read the pub; a human saw an empty card). A human now sees the chip and pays by the card's text, and the other bots pay it
  (they always paid a human's Jack, whose counters your client sends).
- **The bot's own tokens** (D-113 (1)): what a bot tracks that a player cannot ask it afterwards. Toreador Grand Ball first: the
  free Toreador carries `Grand Ball: non-bleed actions unblockable`, the locked one `Grand Ball: does not unlock`, the Ball
  `Unblockable: NAME` and `Locked: NAME`. Display only: derived from the bot's state at every push, gone with the card, and no bot
  reads another seat's tokens (only Jack's count).
- Your side as it is: the server relays them, your ledger narrates them (`NAME: counters [...]` when a token comes or goes, and at
  each Jack tick), the client shows them as chips with the text on hover — all as for a human's tokens. Our new suite section 165i
  runs it through your server (bot/'s copy of srv-2.6.50): a human seat receives the tokens and Jack's counters as sent, and the
  ledger row arrives. Nothing to build; tell us if you would rather a bot's tokens did not reach the ledger.

## 3. Run here
On the release bytes (`elysium-bot.js` sha256 `20faf902…`): your `check-versions.js` agrees (in the repository's `client/`,
read-only); your canary v1.2.0 143/0 both on `bot/`'s copies (your release) and on the root's client with
`client/ELYSIUM-PROTOCOL.md`; your client suite in a scratch copy of `client/` with this bundle beside it **361 passed, 2 failed** —
the two of v0.6.219's handoff: `v2.6.127 embed-help drift` (the Bots page: this bundle's guide) and `v2.6.122 registry, with the
released bot` (`toreador`). Nothing else failed. Two real-clock arena matches on `bot/`'s srv-2.6.50 ended clean (one with a Ball).

## 4. Deploy
Purge `/elysium-bot.js` (cardfx unchanged); the client when the re-embedded guide ships. The TWD files and the server are unchanged.
