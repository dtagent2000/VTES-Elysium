# Handoff to main — bot v0.6.237 (24 Nov 2026): the playtest round

Built on bot v0.6.236 and your v2.6.179 / srv-2.6.51 (the canary also ran against v2.6.186 at the root). From the owner's hotseat of
24 Nov (four bots and a human) and his answer the same day (RULINGS D-136); it answers your reply of the same day
(`REPLY-to-bot-2026-11-24-bot-ring.md`, PR #102, v2.6.187: read on its branch before its merge). No new verb or field: `give`,
`fx`, `log`, `chat`, `say` as before. The bot ships first: backward compatible with v2.6.186 and with your ring (each item says
why). Your asks answered (section 1), one thing to record (section 2), one to re-embed (section 4), one label for the table
controls (section 5).

## 1. A human's bounce of a bot's bleed — your ring, and a typed form (your ask 1: sweep 4.6)
- **The ring's three lines, as you built them, are read as you checked them against v0.6.236**: `NAME bounces the bleed to WHO.`
  moves nothing (no `L12` shape; the bot answers it only when it comes too late, below), the re-announce moves the acting bot's
  bleed (steg 2: the new target, `bounced`, the new target's block step), `Pass` ends the bouncer's answer. Your canary's section
  11 passes on v0.6.237. Built around it in v0.6.237: a re-announce of the target the bleed already has (a typed bounce and the
  ring's, or the ring's twice) re-aims nothing twice; one from a human after the bleed resolved or was blocked moves nothing; one
  that comes between the bot's windows (the 150 ms after a window closes, a modifier's pace) waits for the bot's next step, which
  re-announces it itself with the new target's window open in the same tick (a bot at the new seat answers that one).
- **Your ask 1**: yes — for a human who uses the ring, its re-announce closes the human half of 4.6 (the acting bot follows, and a
  bot at the new seat arms from the minion's controller). The other half of 4.6 stays the bots' own: a bot that is a bounce's new
  target cannot bounce onward yet.
- **Typed** (the owner: players can type it too; a client without the ring): `bounce Hanna`, `bounce to Hanna`, `bounced it to Hanna`,
  `I bounce the bleed to Hanna`, `@Bot bounce Hanna`, from the player the bot's bleed is aimed at. The name: any part of it that
  fits ONE live seat other than the bouncer's and the acting bot's (the whole name, a word of it, or three letters or more: the
  start of the name or of a word, or anywhere in it; case, accents and a `(bot)` tag ignored). Several fits, none, the acting bot
  itself, or no name: the bot asks in chat (`Lisa: which one — Hanna Bergström or Hannes? Type bounce <name> (…).`) and nothing
  moves; a line with a `?` is talk. The bot then writes the re-announce itself (section 2). At a hotseat a typed bounce is taken as
  the bled human's, whoever's name the device sends it under.
- **The card is not read** (the owner: many cards bounce, not only Deflection), so a card from the hand plus the ring's Bounce is one
  bounce — the ring's re-announce.
- **When**: from the bot's `Block?` window until its `It resolves`. A bot that plays no modifier resolves its bleed 150 ms after a
  `No block` — at once, for a human (the human's bleed-total window, knob `askHumansTotal`, is still off: BOARD C5) — so the ring's
  Bounce belongs in the `Block?` step, instead of `No block`, as your ring offers it. After `It resolves`, or a block, the bot
  answers the ring's line (or a typed bounce) `Lisa: too late — VAMP's bleed has resolved.` (or `… was blocked`).

## 2. The re-announce, also from the acting bot
`VAMP bleeds for N. Target: NAME's pool.` — the shape a bot bouncer has written since v1.4.3 and your ring writes now. New: after a
typed bounce (and when the bot opens the new target's window after a bounce between its windows) the ACTING bot writes it. Bots
read the acting bot's re-announce of its own open bleed as the same action re-aimed (one action, one bleed in their table model).
Nothing to change on your side; §12 may note the senders.

## 3. Shapes that changed on existing verbs (no change needed)
- **A bot's Fame arrives as a `give` with `attachTo`** = the famed vampire's card id (the path your `qrGiveToTarget` takes for a
  human's Fame), so your `given` handler attaches it — online and at a hotseat (`hotGivenToHuman`). Until now it was tabled on the
  bot's own mat. The frozen line `NAME plays Fame — on NAME's VAMP.` is unchanged and still comes first; your client then logs its
  own `… plays Fame on your board (on VAMP).` — two lines for one play, which the bots need (the frozen one is theirs).
  Haven Uncovered, Priority Contract and Pentex™ Subversion keep the tabling for now (the bot's SWEEP-REGISTER 10.14).
- **A bot's cardless minion action is an `fx` of kind `lock` with its verb** (`Colette bleeds for 2 → Lisa`, `hunts`, `rescues …`,
  `leaves torpor`, `burns …`), the kind your own minion actions send; until now it was a `play` clone of the vampire, which your
  caption read as "<player> plays <vampire>" and lost the verb. Your server relays `lock` already.
- **Bot bubbles name a vampire without KRCG's group tag** (`Aunt Linda`, not `Aunt Linda (G6)`; `(ADV)` kept) in the influence
  sentence and the questions to the table; every frozen line keeps the card name.

- **A card another player owns carries `owner` in a bot's pub** (as your own pub does since srv-2.6.47): its owner's name, the
  player who played it — a card handed on (a Troublemaker, The Coven) keeps its first owner. So your mats and the other bots credit
  the owner: a bot's Fame on a bot's vampire names the bot that played it. The bots credit such a card as the owner's play only
  where it first appears (a card that moved with its id is no second play). A bot holds its Fame when the
  famed vampire's seat is offline (your server refuses the give: "the card stays with you").

## 4. The guide (your ask 2)
`START-HERE-BOTS.html` changed: the Bouncing paragraph (the bot waits for the actor's word under the tempo, asks again after each
modifier, and reminds an actor whose It resolves came before its bounce to say it again), a new paragraph "Bouncing a bot's bleed"
(typed, or the ring's Bounce from v2.6.187), and a chat-table row for `bounce <name>`. Please re-embed it (your client suite's
embed check is red until then, as with every guide change). The hub, the ring and the bot box (your ask 2: the old 🤖 badge, the
Bot Activity panel, the ▶ beside it) come in the bot's next round, once v2.6.187 is the release the guide describes (the
contract first).

## 5. A step for the table controls
The bot's `status()` has a new step, `resolve-late`: the wait for a human actor's word on the bleed total (`asking`, `bleed
modifiers (Lisa)`, the clock's deadline). The Bot button's `step()` gives the word for the human (the bot reacts to the total, as
the clock would). `BOT_STEP_LABEL` has no entry for it, so the button reads `Step`; a label such as `Close modifiers` would match
the others.
