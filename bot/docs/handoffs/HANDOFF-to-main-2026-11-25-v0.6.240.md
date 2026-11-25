# Handoff to main — bot v0.6.240 (25 Nov 2026): the chat round

Built on bot v0.6.239 and your v2.6.188 / srv-2.6.53 (#104: no wire change, so nothing of ours waited on it; the read-only
copies in `bot/` stay at v2.6.179 until the round that consumes v2.6.187). From Johan's D-137 (24 Nov): the bubbles stay and
keep their content; one speaker at a time; no "(bot):" prefix; a bot's question to a bot without the human's instruction tail.
No new verb or field: `chat`, `say`, `log`, `tally` as before. What changes is the bubbles' text and when they come. The bot
ships first: nothing on your side reads what changed (section 3 says how we checked).

## 1. The bundle
`elysium-bot.js` (v0.6.240) and `START-HERE-BOTS.html` (the chip, the footer, and one sentence under the tempo: the bots speak
one at a time). cardfx, the TWD files and the server are unchanged. Deploy: purge `/elysium-bot.js` (the box does not serve the
guide). Your embed test compares the whole guide: re-embed it (your suite beside this bundle: GATE_CLIENT, the one red is that test).

## 2. What changed in the bubbles
- **No "Name (bot): " prefix in a bot's chat** — your bubble names its speaker (`sayLabel`), the log line names the seat. The log
  tier keeps `NAME (bot)` (notes: the DEBUG announcement your canary pins, the deck reads).
- **A question to a bot carries no instruction tail**: `Colette hunts. Block?`; a human asked still gets `— say "block" or "no"
  (20s → no)`. A round's combat summary keeps `tell me if your side differs` only for a human or an unknown opponent.
- **One speaker at a time**, on a table paced for people (the bot's `paceMs` 1.5 s or more with an ask clock of 10 s or more;
  your client spawns its bots at 3.1 s and 20 s): a bot's bubble — a chat, a quick phrase, its verdict line — waits until another seat's bubble has left the screen. A chat
  holds the floor for your `sayBubbleMs` at multiplier 1.0 (the 180-character clamp included), a quick phrase or a verdict pulse
  1.5 s; on a tie the seats speak in ring order from the turn seat (250 ms a step). A bot's acts and a window's opening line wait
  for the floor too, so a question never shows after its own answer. A spectator's chat holds no floor (your `chatBubble` wants a
  seat). At the fast paces of your LIVE tests nothing waits.
- **Between bots at that pace, a round's combat summary is a log line**, not a bubble (Johan's ruling asked). As a bubble it
  would wait behind the other combatant's and the other bot's press step would miss it, so no switch brings it back under the
  floor; the bot's `chatFloor` 0 switches the floor off and with it this (v0.6.239's timing and tiers; the text stays as above). A thinking `Hold on…` that the floor held until the
  bot's own answer was queued is dropped.
- Measured on your hotseat bridge (four bots, seed 7, five rounds, your pace): bubbles over another seat's floor 79 → 0, cut short
  by the three-bubble limit 33 → 0, prefixes 28 → 0, tails 31 → 0, seconds a turn 34.9 → 39.7. The recorder is ours now:
  `bot/tools/chat-record.js` (lifts your `hotBridge` as the hotseat tool does) and `bot/tools/ana-chat.py`.

## 3. What we checked on your side
No reader of a bot's chat prefix or tail in your client, server, canary or tests (`grep '(bot)'`: the canary's DEBUG lines, on the
log tier, and a roster label in `playtest/playtest.js`); `sayBubbleMs` and `chatBubble` are the same in v2.6.179 and v2.6.188.

## 4. Asks
1. Re-embed the guide.
2. Nothing else is needed. One known limit, for your notes: the bot reads a bubble's time at multiplier 1.0; a player who sets
   another multiplier sees the bubbles longer or shorter than the bots assume.

## 5. Run here
On the release bytes (the sha256 in the PR body): GATE_LIST. The root is a byte copy of `bot/`'s bundle (your `check-versions.js`
reads it).
