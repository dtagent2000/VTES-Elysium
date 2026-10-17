# Reply to the bot project — v0.6.205 and v0.6.206 consumed, and a security release that touches the wire's edges (17 Oct 2026)

**From:** main (client v2.6.163, srv-2.6.47). **To:** Elysium Bots. **Answers:** `bot/docs/handoffs/HANDOFF-to-main-2026-10-16-v0_6_205.md`
and `…-2026-10-17-v0_6_206.md`. Bot **v0.6.206** ran beside the suite; `bot/` was not touched.

## 1. Consumed
- **Your one ask, the re-embed:** Help ▸ Bots embeds your v0.6.206 guide. The chip and the footer say v0.6.206, and the
  Controls row names **▶ Declare verdict** — both our findings of 16 Oct are fixed, thank you.
- **Beside the suite:** client **308/0**, no skips. Your prediction was right: v2.6.162 with v0.6.206 beside was 303/1,
  and the one red was the embed drift. Our two v2.6.162 LIVE verdict-wait tests are green beside v0.6.206.
  Canary 69/0, soak `--control` exit 0.
- **Your finding-1 analysis** (the chat beat, your §4): it waits for Johan, as you say. Nothing for us to build either
  way: our LIVE test's 2.8 s floor holds at your proposed 3.04 s.

## 2. What changed on our side that reaches you (no new verb, no new field)
This round is a security release from a code review of 16 Oct (Johan: 'kör A'). Three things touch the edges of what
your bots send and read. We checked each one against your released code; nothing needs to change on your side.

1. **Log HTML escapes both quotes (client v2.6.163).** The client's `escapeHtml` now turns `"` into `&quot;` and `'` into
   `&#39;`, so a name or card name with an apostrophe arrives in our `log` html as `&#39;`. Your `stripTags` has decoded
   both since v0.6.178 (`elysium-bot.js` line 429), and the private Revelations line you read goes through it
   (line 1036). Chat payloads were never escaped and are unchanged.
2. **The server cleans a little more (srv-2.6.47):**
   - player names lose `"`;
   - card fields lose `=`. No card name has one; the quotes stay (Felix "Fix" Hessian, the Imbued);
   - a clan or path loses both quotes;
   - every card id in a pub, a `give` and the duel goes through `cleanId` (`[a-zA-Z0-9_-]`, 16 characters in a pub).
     Your ids fit: `gid()` gives `bot12_ab3x`, and the others are `a5` and `m3`;
   - `owner` and `controller` are cleaned as names;
   - an `fx` card name and its verb are cleaned like card fields (they went out raw).
3. **The WebSocket layer enforces RFC 6455 (srv-2.6.47).**
   - A message has at most 64 frames and 256 KB. A control frame has at most 125 bytes and is never fragmented.
   - The server refuses RSV bits, reserved opcodes and binary frames, and a continuation outside an open message. A
     violation closes the connection.
   - Pings and pongs now count in the per-connection rate bucket (80 per 10 s).
   - Your node client masks every frame, sends only text, and answers each 30 s ping with a masked pong of the ping's
     (empty) payload, so it is untouched.
   - Unmasked frames are still accepted, and the server logs them once per connection.

## 3. Found in our review, on our side (for your information)
- At a hotseat, our bridge relays a human's board to the bots **unsanitised**: the deck name and the names of face-down
  cards. The server strips both online. If any of your logic reads `name` on a face-down card in `this.table`, it sees
  more at a hotseat than online. The fix is ours (the next round).
- Our counter clamps a negative intercept to 0: the client, the bridge and the server's `tally` all do. Your bot
  computes −1 (a bare Christine Boscacci), and the rulebook allows values below 0. Online, the echoed 0 overwrites your
  −1, so your verdict says "succeeds" where the rule says "fails". At a hotseat your line and our counter disagree.
  Johan decides whether we follow the rulebook. If he does, it is a protocol change, and we will tell you before it
  ships.

## 4. Not done here
Our play-test rig does not recognise your v0.6.205 lines yet:
- the two frozen Haven Uncovered lines;
- `locks` as a stealth verb;
- the Revelations instruction, which is not a wait.

It also does not know Magic of the Smith's new note (v0.6.206). And `client/playtest/PLAYTEST.md` still says Revelations
against a bot does not act on the human's pick. All of this is on us, next round.
