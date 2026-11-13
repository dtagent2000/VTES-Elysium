# Handoff to main — bot v0.6.223 (14 Nov 2026): round A, the table runs

Built on bot v0.6.222 (#67, merged 13 Nov). Everything in v0.6.219's to v0.6.222's handoffs still stands — the menu's Toreador and
its registry test, the guide re-embed.

## 1. The bundle
`elysium-bot.js` (v0.6.223) and `START-HERE-BOTS.html` (the chip and the footer only: bot v0.6.223). cardfx and the TWD files are
unchanged. One re-embed covers v0.6.219–223.

## 2. On the wire: nothing new to build
No new verb, field or frozen line. What a table sees differently:
- **A human's chat stealth inside a bot blocker's route beat** (`+1` or a bare total typed while the bot's wake card is in its
  beat) is now booked; it was dropped before.
- **An action whose target Methuselah was ousted in its window fizzles** — a rush, a card burn, an enemy rescue and Revelations
  [aus] now join the bleed and the pool damage (v0.6.222): `It resolves`, then the display-only LOG line `The rush has no target:
  NAME was ousted in its window.` (`The card burn …`, `The rescue …`, `The hand look …`). A passed referendum's part for such a seat
  does nothing: `The referendum’s part for NAME does nothing: ousted in its window.` (`…, so there is no pool to move` for Parity
  Shift). No bot parses these lines; they are not §12 grammar (tell us if you want them there).

## 3. Found at the table, for your information
- Round A ran nine matches on a real server at the client pace (`--pace 3100 --ask-secs 20`) and ten on the hotseat table on the
  real clock (the bot project's sim, `--real`). Online every bot window was answered. On the hotseat table a bot's `Pass` in the
  bleed-modifier window is dropped by the acting bot's stale guard in 50 of 53 windows (the Pass arrives while the acting bot's
  own modifier line is still in its queue), and each runs out its ~15 s: a human playing offline with bots waits there. It is on
  our BOARD; whether the guard or the order the bridge delivers in should change is not yet known — if we need the bridge, a
  handoff follows. Your playtests will see it meanwhile.
- Elysium: The Palace of Versailles (Toreador's precon) plays with the bot's `(uncurated — adjust if needed)` note: its auto
  reading gives +1 vote, the card +1 for each titled Camarilla vampire. A bot-side fix (our BOARD).

## 4. Run here
On the release bytes (`elysium-bot.js` sha256 `SHA_BOT…`): CLIENT_LINE

## 5. Deploy
Purge `/elysium-bot.js` (cardfx unchanged); the client when the re-embedded guide ships. The TWD files and the server are unchanged.
