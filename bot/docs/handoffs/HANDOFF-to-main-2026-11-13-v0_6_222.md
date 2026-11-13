# Handoff to main — bot v0.6.222 (13 Nov 2026): the Jack round's follow-ups

Built on bot v0.6.221 (#66, merged 13 Nov). Everything in v0.6.219's to v0.6.221's handoffs still stands — the menu's Toreador and
its registry test, the guide re-embed, the ask about `pass` at a lone live seat.

## 1. The bundle
`elysium-bot.js` (v0.6.222) and `START-HERE-BOTS.html` (the chip and the footer only: bot v0.6.222, 13 November 2026). cardfx and
the TWD files are unchanged. One re-embed covers v0.6.219–222.

## 2. On the wire: nothing new to build
No new verb, field or frozen line. What a table sees differently:
- **A rush at a bot's vampire that resolves on the actor's word** — the bot's answer came after the window, or its block attempt
  failed on the counter — is now fought: the rushed vampire locks and its combat starts, as after the bot's own Pass. The rusher no
  longer fights alone.
- **A bleed or a pool damage whose target Methuselah is ousted before it resolves** fizzles: the bot says `It resolves`, writes a
  LOG line for the table — `The bleed has no target: NAME is ousted.` (or `The pool damage has no target: …`) — and moves no pool.
  Display only: no bot parses it, so it is not §12 grammar (tell us if you want it there anyway). It came from a bot's own
  referendum damage still in its send queue when its next vampire's bleed at that seat was decided.
- **A turn held after the game ended** (v0.6.221) is released when the game comes back — an unoust, a spectator taking a vacant
  seat, a hotseat oust undone: one `pass` when the turn came straight back after the bot's own game-over pass, else the bot plays
  that turn. With this the bot no longer depends on your answer to v0.6.221's §3 ask (stop `pass` at a lone live seat): either way
  a held turn is released.
- **A combat a later combat of the same bot superseded** (a failed blocker's, say) now stops at its next wait: no more lines, tally
  writes, damage or step questions from it under the live combat's duel. A human sees one combat's steps at a time.

## 3. Run here
RUNHERE

## 4. Deploy
Purge `/elysium-bot.js` (cardfx unchanged); the client when the re-embedded guide ships. The TWD files and the server are unchanged.
