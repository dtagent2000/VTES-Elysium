# Handoff to main — bot v0.6.231 (17 Nov 2026): O-44, Smiling Jack's defence through the card-worth engine

Built on bot v0.6.230 (#77) and your v2.6.175 / srv-2.6.51. v0.6.230's handoff (`HANDOFF-to-main-2026-11-17-v0_6_230.md`) is
still open on your side; this one adds nothing to it but the bundle.

## 1. The bundle
`elysium-bot.js` (v0.6.231) and `START-HERE-BOTS.html` (the chip and the footer). cardfx, the TWD files and the server are
unchanged. Deploy: purge `/elysium-bot.js`.

## 2. What changed (no protocol change, no new line)
RULINGS D-121 (Johan's answer to O-44): the knob `cardWorth` now prices only Smiling Jack's defence (how hard its owner's bot blocks
a burn at it) and the burns of Jack by other bots; Jack's play and discard stay with the 14 July rule. The knob is on by default:
the benches showed no loss. At a table a bot owning Jack blocks a burn at it a little more often (16 blocks against 13 in 288
matches), and the other bots burn a Jack a little less often (60 burns against 55 in the 240-match footprint); nothing else moves.

## 3. Run here
On the release bytes (`elysium-bot.js` sha256 `6c4add87…`): your `check-versions.js` agrees (the root a byte copy of `bot/`'s
bundle); your canary v1.3.0 171/0 on `bot/`'s copies and on the root's client. The bot's suite 2543/0 ×3. Your client suite was not
run: no line, no wire and no timing changed.
