# Handoff to main — bot v0.6.225 (14 Nov 2026): round C, a human's Toreador Grand Ball (RULINGS D-113 (3)–(4))

Built on bot v0.6.224 (round B). Everything in v0.6.219's to v0.6.224's handoffs still stands — the menu's Toreador and its registry
test, the guide re-embed.

## 1. The bundle
`elysium-bot.js` (v0.6.225), `elysium-cardfx.json` / `.js` (Toreador Grand Ball carries a `memo` descriptor: the roles it keeps,
how a human's choice is read, and the question) and `START-HERE-BOTS.html` (the chip, the footer and a paragraph in "Where its
understanding ends": your Toreador Grand Ball). The TWD files are unchanged.

## 2. On the wire: one new bot line for §12
- **A question in chat** (the tier rule: a question to a human is a `chat()`), asked once by the bot that speaks for the table, after
  a human's master phase, when the bots cannot tell which Toreador a human's Grand Ball left free:
  `NAME, your Toreador Grand Ball: which Toreador acts unblocked — A or B?` (three or more candidates: `A, B or C`). Nothing parses
  it. The answer is the human's free text: a chat line from the Ball's owner that names exactly one candidate (its name, or its
  first word when no other candidate shares it) becomes every bot's memory. Unanswered, no bot blocks a non-bleed action of any of
  that human's Toreador while the Ball is in play (v0.6.217's rule). We ask that §12 lists the line (its shape, not its words).
- **What the bots read**, with no new verb or field: the client's play line `VAMP plays Toreador Grand Ball.` and its
  ` Target: X.` suffix (the pair), which of that human's Toreador turned locked by the end of their master phase, a custom token
  on a vampire naming the card, and their only other ready, unlocked Toreador. With the play line aimed at the other Toreador and
  one of the two locked, nobody asks.

## 3. Found at the human tables, for your information
Two tables in your play-test rig (client v2.6.174, srv-2.6.50; the human Toreador against Hanna and Viktor, Standard 3 s):
- The unlock phase's "Unlock all cards?" also unlocks the Toreador the Ball locked ("does not unlock as normal"); the human
  re-locks it by hand. The bots keep the lock they read either way, and block a non-bleed action of that Toreador as any other.
- The target aimed for the Ball's play line sticks and rides the next action line (`Catalina Vega hunts. Target: Flávio
  Gonçalves.`). It did not mislead the bots; a human may not expect it.

## 4. Run here
On the release bytes (`elysium-bot.js` sha256 `SHA_BOT…`): CLIENT_LINE

## 5. Deploy
Purge `/elysium-bot.js`, `/elysium-cardfx.json` / `.js` and `/START-HERE-BOTS.html`; the client when the re-embedded guide ships.
The TWD files and the server are unchanged.
