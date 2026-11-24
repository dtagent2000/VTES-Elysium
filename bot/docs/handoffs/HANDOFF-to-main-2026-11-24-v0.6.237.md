# Handoff to main — bot v0.6.237 (24 Nov 2026): the playtest round

Built on bot v0.6.236 and your v2.6.179 / srv-2.6.51 (the canary also ran against v2.6.186 at the root). From Johan's hotseat of
24 Nov (four bots and a human) and his answer the same day (RULINGS D-136). No new verb or field: `give`, `fx`, `log`, `chat`, `say`
as before. The bot ships first: backward compatible (each item says why). One thing for you to build (section 1), one to record
(section 2), one to re-embed (section 4), one label for the table controls (section 5).

## 1. The bounce line your coming bot panel writes (Johan: "Johan bounces the bleed to Hanna")
- **What the bot reads**: a line from the player whose pool a bot is bleeding, in chat (Johan says the panel writes it there) or on
  the log tier, `NAME bounces the bleed to NAME` — a trailing period optional, `'s pool` after the second name tolerated. The first
  NAME is not checked against the sender beyond this: the sender must be the human the bot's bleed is aimed at. The second NAME is
  matched by any part of it that fits ONE live seat other than the bouncer's and the acting bot's (the whole name, a word of it, or
  three letters or more: the start of the name or of a word, or anywhere in it; case, accents and a `(bot)` tag ignored). Several
  fits, none, the acting bot itself, or no name: the bot asks the bouncer in chat (`Johan: which one — Hanna Bergström or Hannes?
  Type bounce <name> (…).`) and nothing moves. A line with a `?` is talk, never a bounce.
- **Typed, the same**: `bounce Hanna`, `bounce to Hanna`, `bounced it to Hanna`, `I bounce the bleed to Hanna`, `@Bot bounce Hanna`.
- **The card is not read** (Johan: many cards bounce, not only Deflection): the line is what moves the bleed.
- **When**: from the bot's `Block?` window until its `It resolves`. In one of its windows (the `Block?`, a reactions window after a
  modifier) the bounce lands at once. Between its windows (the window's clock just ran out, a beat after a `No block`, a modifier's
  pace) it waits for the bot's next step, which writes the re-announce and opens the new target's window together. After `It
  resolves`, or after a block, the bot answers `Johan: too late — VAMP's bleed has resolved.` (or `… was blocked`) and nothing moves.
  A bot that plays no modifier resolves its bleed about a beat after a `No block` (the human's bleed-total window, knob
  `askHumansTotal`, is still off: BOARD C5), so a panel that sends the line well after `No block` comes too late. Please send it
  from the `Block?` step, the panel's bounce standing for the decline.
- **What the bot does**: re-aims its bleed (no pump after it), writes its own re-announce (section 2), and gives the new target its
  block step (the bounce cards: "that Methuselah can attempt to block"); a human new target is asked in chat as before (`… now bleeds
  Hanna for N — Hanna may block it …`). Section 183f of the bot suite drives it.
- **Your side**: the panel, and the line frozen in §12 with a canary case once the client sends it. Backward compatible: until the
  panel ships, the typed form works; a client that never sends the line changes nothing.

## 2. The re-announce, now also from the acting bot
`VAMP bleeds for N. Target: NAME's pool.` — the shape a bot bouncer has written since v1.4.3, so every bot already arms from it. New:
after a human's bounce the ACTING bot writes it (the human cannot write a line for another seat's vampire). Bots read an acting
bot's re-announce of its own open bleed as the same action re-aimed (one action, one bleed in their table model). Nothing to change
on your side; §12 may note the second sender.

## 3. Shapes that changed on existing verbs (no change needed)
- **A bot's Fame arrives as a `give` with `attachTo`** = the famed vampire's card id (the path your `qrGiveToTarget` takes for a
  human's Fame), so your `given` handler attaches it — online and at a hotseat (`hotGivenToHuman`). Until now it was tabled on the
  bot's own mat. The frozen line `NAME plays Fame — on NAME's VAMP.` is unchanged and still comes first; your client then logs its
  own `… plays Fame on your board (on VAMP).` — two lines for one play, which the bots need (the frozen one is theirs).
  Haven Uncovered, Priority Contract and Pentex™ Subversion keep the tabling for now (the bot's SWEEP-REGISTER 10.14).
- **A bot's cardless minion action is an `fx` of kind `lock` with its verb** (`Colette bleeds for 2 → Johan`, `hunts`, `rescues …`,
  `leaves torpor`, `burns …`), the kind your own minion actions send; until now it was a `play` clone of the vampire, which your
  caption read as "<player> plays <vampire>" and lost the verb. Your server relays `lock` already.
- **Bot bubbles name a vampire without KRCG's group tag** (`Aunt Linda`, not `Aunt Linda (G6)`; `(ADV)` kept) in the influence
  sentence and the questions to the table; every frozen line keeps the card name.

- **A card another player gave a bot carries `owner` in the bot's pub** (the giver's name, as your own pub does since srv-2.6.47),
  so your mats and the other bots credit the giver: a bot's Fame on a bot's vampire names its giver. A bot holds its Fame when the
  famed vampire's seat is offline (your server refuses the give: "the card stays with you").

## 4. The guide
`START-HERE-BOTS.html` changed: the Bouncing paragraph (the bot waits for the actor's word under the tempo, and asks again after each
modifier), a new paragraph "Bouncing a bot's bleed" (typed today, your panel when it comes), and a chat-table row for `bounce
<name>`. Please re-embed it (your client suite's embed check is red until then, as with every guide change).

## 5. A step for the table controls
The bot's `status()` has a new step, `resolve-late`: the wait for a human actor's word on the bleed total (`asking`, `bleed
modifiers (Johan)`, the clock's deadline). The Bot button's `step()` gives the word for the human (the bot reacts to the total, as
the clock would). `BOT_STEP_LABEL` has no entry for it, so the button reads `Step`; a label such as `Close modifiers` would match
the others.
