# REPLY to the bot project — v0.6.230–234 consumed (19 Nov 2026, client v2.6.176 / srv-2.6.51 unchanged)

*Answers the five handoffs of 17–18 Nov (`bot/docs/handoffs/HANDOFF-to-main-2026-11-17-v0_6_230.md`, `…-v0_6_231.md`,
`HANDOFF-to-main-2026-11-18-v0_6_232.md`, `…-v0_6_233.md`, `…-v0_6_234.md`). v0.6.234 is the bundle consumed. Main read
them on 18 Nov, proposed a round, and Johan said yes on 19 Nov. Client v2.6.176 is a pure client release: no server change, no
new verb or field.*

## 1. v0.6.234 beside the suite

- **Your measurement reproduced first:** v2.6.175 beside your bundle, client suite 371/1 (the guide's embed), canary v1.3.0
  171/0, dispatch 95/0, protocol lint 6/0, endpoint 36/0.
- **After this round:** client suite 376/0 with v0.6.234 beside, no skips. Help ▸ Bots embeds v0.6.234's guide.
- **Your two timing notes** (the master's clone one beat earlier, v0.6.232; a voter's card before its casts line, v0.6.234):
  no LIVE test of ours went red on either.
- **The hotseat soak** (`elysium-soak-hotseat.js`, real v0.6.234 bots on the real bridge driven by the real sweep, no human
  seat): the control trips, and the full battery moved — 7 tables, 92 turns, 9 ousts, 0 stuck.

## 2. Your question (v0.6.232 §2): is the play clone sent on every path? Online yes. At a hotseat it never was.

**Online, read in the code:** every way a card leaves the hand for the table sends `fx` kind `play`.

| The human does | The clone carries |
|---|---|
| Play from the card's menu, the hand's toolbar, or a double click (`playFromHand`) | `actor` = the selected vampire if one is selected, `target` = the aim, `verb` = the level tag if one was chosen |
| Drags the card to the table | the same (`tagPlayed`) |
| Drags it onto a card of their own | `target` = that card |
| Play on the acting vampire (`playOnActive`) | `target` = that vampire |
| Plays or drags it onto another seat's board | `onto {seat, who}`, `target` = the card it lands on, `actor` |
| Play face down | the clone without a name (`card.name` is `''`, `faceDown: true`) |
| Drags it from the hand straight to the ash heap | **no clone**: a discard, with the line `X → the ash heap.` |

**Two things were wrong on our side. Both are fixed in v2.6.176.**

- **At a hotseat no bot ever received a human's clone.** The bridge passed a bot's `fx` on to the human and the other bots
  (v2.6.95) and never a human's: `cardFx` sent it only to a server. So offline, where bots are played most, your three readers
  of v0.6.232 could not fire against a human: a human's master, a human's Sudden Reversal inside your window, a human's frenzy
  card. Your second feed of cards shown (v0.6.186) was missing there too.
  - **Built:** `hotBridge.fxIn(who, seat, m)` is srv `fx` field for field (the kind list, `fxCard`, the conceal flip, `onto`,
    the cleaners and their cuts). It hands `{t:'fx', who, seat, kind, card, target, actor, onto, reveal, toName, verb}` to
    every bot seat. `cardFx` calls it through `hotFxSend` where it sends `fx` to the server online, and the board follows at
    once (`pushNow`), as online.
  - **The order a bot now receives at a hotseat is the online order:** the clone, the board that shows the card, the play
    line. Until v2.6.175 it was the line, then the board up to 600 ms later.
  - **All five kinds are relayed** (`play`, `lock`, `unlock`, `flip`, `rise`), as the server does. Your `_onFx` returns on
    everything but `play`.
  - **The literal you lift gained `fxIn`.** It is self-contained (no client function behind it), and our liftability test of
    v2.6.159 is green with it. Your own hotseat gate, run in a scratch copy of `bot/` with v2.6.176's client in place of your
    copy: 12/0, as with v2.6.175. Your harness needs nothing unless it wants to drive a human's clone.
  - **Delivery is synchronous, like every other relay today.** A bot that answers a human's clone at once answers inside the
    human's own `cardFx` call, and the clone leaves before the play line is written. Your Sudden Reversal against a human's
    master is on a timer, so its line lands after the human's. Meditative Grove's cancel line and the "too late" chat are not:
    on the human's screen they can stand above the human's own play line. The queued bridge (§5) lifts that for every relay.
- **A cross-board `target` said `kind: 'lib'` for every card.** `curTargetCard()` and the card-played-onto-a-target path built
  the target from the aim, which carries no kind, and wrote `'lib'`. Your readers want `target.kind === 'crypt'`
  (`_srOnHumanFx`: "aimed at a minion of mine"; `_groveOnHumanFx`: a frenzy card aimed at your vampire), so neither fired
  against a real client, online or offline.
  - **Probed with your released bot before building:** a human's Fame with your vampire as `target`, `kind: 'crypt'` → it
    plays Sudden Reversal; the same clone with `kind: 'lib'` → `sr-decline`, "no reading of it".
  - **Built:** `rtTargetInfo()` reads the aimed card's kind from that seat's public board. A location aimed at stays `lib`; a
    face-down vampire is `crypt` with no name; a pool aim is no card and stays `lib`.
  - **Your call:** a page still cached at v2.6.175 sends `kind: 'lib'` online. If the reading should survive it, match the
    target's name on your own board and leave the kind out.

**Pinned:**

- Four client tests, all red on v2.6.175 (371/5 with the embed). Twelve mutant clients: eleven caught, one equivalent (a pool
  aim looked up on the board finds no card either way). One test is LIVE: the client's own menu path plays Fame at a
  hotseat with your vampire aimed at, the bridge hands the clone to your real bot's `_dispatch`, and the bot answers with its
  frozen `srCancel` line and the chat to the owner.
- One is a twin: `fxIn` and the real server's `GAME_HANDLERS.fx` relay the same bytes for fourteen messages (nine relayed, five
  dropped).

**In headless Chromium** (file://, the real Play offline dialog, one human and one real v0.6.234 bot; the bot rigged with a
card in hand and one vampire risen through its own `_riseFromUnc`):

| | v2.6.176 | v2.6.175 (the control) |
|---|---|---|
| The human plays Fame with the bot's vampire aimed at | the clone on the bridge names the vampire as `crypt`; the human's log shows `Fame was played. Target: B2's Andi Liu.`, then `B2 plays Sudden Reversal — cancels You's Fame (its cost is not paid).`, then your chat line | no clone on the bridge; no line; Sudden Reversal stays in the bot's hand |
| The bot writes `B2 is playing Vessel.`; the human answers with Sudden Reversal from the hand | your console: `as played: Vessel -- cancelled by You (a human)`, `master-play: Vessel is cancelled by You’s Sudden Reversal (nothing paid)`; no Vessel on your board | the bot pays for Vessel and plays it |
| The human passes; the bot plays its turn | back at the human in 35 s, no page error | the same |

## 3. The card-suffix control (v0.6.230 §4): gone

- **Your reading is yours to choose.** The canary v1.4.0 no longer checks what your prey test does with a CARD in a bleed's
  suffix. It prints one line that says which reading the bot beside it has, and counts nothing.
- **Our own LIVE test** of v2.6.175 pinned the same control; that assert is gone too, so your build stays green in our suite.
- **When you ship the reading** (a card target on a bleed line → the prey's bleed), we pin it as a positive in the round that
  consumes it. §12's bleed line says a reader may take it so.
- **What we take from it:** a check of ours that pins what your bot does NOT read stops you from widening that reading.
  Section 9 has positives only.

## 4. §12 and the canary v1.4.0 (section 9)

- **§12 records your twenty lines** in a block of their own, each with its `L12` key:
  - v0.6.230: a steal, Privileged Position, the referendum without a poll, Tension in the Ranks, the rush line's
    `(Frontal Assault)`, a hostage freed (U+2019 twice), a referendum to burn a card in play (terms and result);
  - v0.6.232: the 'as played' line in both shapes, Sudden Reversal's cancel and its late answer, Meditative Grove, the success
    line before a referendum, Yawp Court's two lines, Week of Nightmares' two lines;
  - v0.6.233: One With the Land's unlock line, Night Terrors, a cancel bought with pool;
  - v0.6.234: Absolute Tyranny, and the new order of a voter's card and its casts line.
- **Also in §12:** the shapes you reuse (Mob Connections' press, Garibaldi-Meucci's combat end, Forced Confessional's stealth
  line: listed, not pinned); in the no-reader list the lines whose wording you sent (the burn after a referendum, Week of
  Nightmares' three, Yawp Court's damage, Shadow Cloak's two); the chat lines by what they ask of a human, not by their words.
  Wave 5a's notes for a human are named without wording, because the handoff did not quote them.
- **§12 says where you read a human's cards:** from the play clone, not from a line. §7 lists the paths of section 2 above,
  §8 says the bots read the clone, §12.2 has the bridge's relay.
- **Section 9, 61 checks:** 31 documentation checks, 23 parser reads (every key above with the captures its reader keys on,
  and `combatEnds` for Garibaldi-Meucci), 5 through a live bot's `_onLog` (the prey pays Privileged Position's pool; the
  owner's Tension in the Ranks and a card burned by a referendum go to its ash heap, with its table line; the hostage of the
  sending seat is dropped, and only that one; another bot's cancel of a human's master sets `_srSeenHuman`), 2 client-source
  checks (the bridge's relay, the aim's kind).
- **Runs:** 231/0. Against v2.6.175's client and protocol 198/33 (the 31 documentation checks and the 2 source checks). Beside
  v0.6.229, 206/25: red lines, no crash.
- **Your copy in `bot/`** is v1.3.0. v1.4.0 needs the released client and protocol beside it, as before.

## 5. `hotBridge.toBot` (v0.6.230 §4)

Noted: you prefer the queue, and v0.6.227 handles both orders. It stays planned as a round of its own on Johan's go, with a
handoff before it ships. This release adds one relay and leaves the delivery rule as it was.

## 6. Checked on our side, nothing to build

- **The Coven's `give` "with its lock kept":** `locked` passes the server's `give`, the bridge's `give` case and the client's
  `given` handler (a human predator receives it locked).
- **`sup` in your pub** (Shadow Cloak): `sanitizePub` keeps a three-letter `sup`, and yours is one (`obl`). The bridge passes
  it. The client draws a card with `host` on its vampire.
- **A human's out-of-turn master** meets no gate in the client: `masterPlayGate` counts master actions only in the player's
  own master phase.

## 7. Small notes

- **The drag path's play line carries no target.** A card dragged to the table writes `X was played.` or `VAMP plays X.`
  without ` Target: …` and without a level tag; the menu's Play writes both. The clone carries the aim either way. One
  consequence is ours: an aim set before a drag is not used by that line, so it stays and rides the player's next line
  (v2.6.175's rule clears a used aim only). Not changed in this release; it is with Johan.
- **When a human's Sudden Reversal cancels your master, no line says so.** The table sees `B2 is playing Vessel.`, then the
  human's `Sudden Reversal was played.`, and then your next phase. The human's line does not name the master. Your call.
- **The human's window is your beat:** 3.1 s at the hotseat's pace. A human needs `Hold on…` to find the card in time. The
  script in section 2 answered within 120 ms.
- **Your deploy notes** list `/elysium-cardfx.js` and `/START-HERE-BOTS.html` again (v0.6.232–234). The box serves four bot
  files: `elysium-bot.js`, `elysium-cardfx.json`, `elysium-twd-profile.json`, `elysium-twd-archetypes.json`. For
  v0.6.230–234: purge `/elysium-bot.js` and `/elysium-cardfx.json`.
- **Your `STATUS.md`, "Owed by main":** paid with v2.6.175 are the guide re-embed and the registry test (v0.6.219), the Ball
  question's §12 line (v0.6.225) and v0.6.228's lines. With v2.6.176 nothing of v0.6.230–234 is owed.

## 8. Not tried

- elysium.cards, and the online path in a browser. Online, the clone's kind was checked through a fake socket, and the relay's
  shape by the twin test against the real server handler.
- A human against bots in a browser with Meditative Grove, Yawp Court, Week of Nightmares, Shadow Cloak, One With the Land,
  Night Terrors or Absolute Tyranny in play. The browser runs covered Sudden Reversal in both directions.
- The human's side of the window through the real hand dock: the script called `playFromHand`, which is what a double click on
  a hand card calls. Whether a human finds the card in the beat was not measured.
