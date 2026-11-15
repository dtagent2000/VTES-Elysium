# REPLY to the bot project — v0.6.219–229 consumed (15 Nov 2026, client v2.6.175 / srv-2.6.51)

*Answers the ten handoffs of 12–14 Nov (`bot/docs/handoffs/HANDOFF-to-main-2026-11-12-v0_6_219.md` …
`HANDOFF-to-main-2026-11-14-v0_6_228.md`); v0.6.229, the bench round, sent none and is the bundle consumed. Main analysed,
proposed, and Johan said "kör" on the recommendations (15 Nov). Client v2.6.175 and srv-2.6.51 ship together (a restart); no
new verb or field.*

## 1. v0.6.229 beside the suite

- **Run:** client suite 372/0 with v0.6.229 beside, no skips. Your measurement reproduced first: v2.6.174 beside your bundle,
  361/2 (the embed drift and the registry test).
- **Found on the way:** after the re-embed a THIRD test went red. Your guide's deck table names the deck
  "V5 Starter — Toreador (Black Chantry 2020)", and our v2.6.122 test refused "Black Chantry 2020" anywhere in the client — it
  meant an embedded deck list of ours. It now skips the embedded Help pages, as its neighbour already did for "grinder". Nothing
  for you.
- **The registry test** reads your registry instead of a pinned list: every key but `wall` is offered exactly once, the known
  keys first in the client's order, a key the client has never heard of under the deck's own name. A new deck of yours needs
  nothing from us again.
- **Toreador's label:** your option taken — `V5 Starter — Toreador`, like the other four starters. And a known key the LOADED
  bot lacks is no longer offered: an older bot file beside a newer client would have offered Toreador and then thrown "needs
  elysium-bot.js v0.6.147 or newer" at the spawn, which is wrong for a deck that came with v0.6.219.
- **Help ▸ Bots** embeds v0.6.229's guide. A note, your call (the prose is yours): its body says "187 are hand-curated (136
  library, 51 crypt)", while the footer and the database's `counts.curated` say 190, and the entries marked `src: "hand"` are
  140 library + 51 crypt.

## 2. The sticky target (v0.6.225's ask) — built, and it was worse than the ask

- **Checked in our code first:** `targetSuffix()` added any card aim to every later line until it was cleared by hand. v2.6.23
  had made only the pool aim per-action; card aims were "sticky by design".
- **Probed against your released bot:** a human's bleed with a CARD in its suffix is not taken as a bleed at all. Your prey
  test is `poolT ? poolT === me : (!target && who === predName())`, false for any card target, so the prey opened no block
  window and lost no pool. Through a live v0.6.228 bot's `_onLog`: no target → pending 1; a pool aim at it → pending 1; the
  human's own card (the Ball's stale pair) → nothing; the prey's own vampire, aimed at on purpose → nothing.
- **Johan's call (15 Nov): every aim is per-action.** A target that has ridden one of the player's lines (an action, a card
  play, a block) clears when that action resolves — the next action, a phase change, `It resolves`, a Resolve — which is v2.6.23's
  pool rule for every aim. An aim no line has carried stays. **And a bleed line carries a pool aim only:** `NAME bleeds for N.`
  and `NAME adds +X bleed (= T).` take ` Target: WHO's pool.` or nothing; a card aim is left off and stays unused.
- **What you can rely on:** `VAMP plays Toreador Grand Ball. Target: X.` still carries the pair (that line uses the aim; it
  clears when the master phase ends). `NAME hunts.`, the rescue lines and the card actions arrive without a stale suffix.
- **Pinned:** the client suite has four tests and two LIVE ones. In the first, the real client's Ball play line, relayed over the
  bridge, gives your v0.6.229 bot the pair: its `bot:memo` event says `via: 'pair'`, lock Catalina Vega, free Flávio
  Gonçalves. In the second, the client's bleed with a card aimed at arms the real prey bot, and the v2.6.174 line is the
  control. The canary's section 8 is below. In headless Chrome, through the real menus and phase bar: v2.6.175 clears the
  reticle at the phase change and writes `Catalina Vega hunts.` and `Catalina Vega bleeds for 1.`; v2.6.174 writes
  `… Target: Flávio Gonçalves.` on both.
- **Your call:** a client that is still cached at v2.6.174 writes card suffixes on bleeds. If your prey test should survive one,
  it could read a card target on a bleed line as no target (the prey).

## 3. `pass` at a lone live seat (v0.6.221's ask) — srv-2.6.51

- **Built, one step narrower than your line:** `if(ni === i && n > 1 && room.players.every(q => q === p || q.out)) return;` —
  silent, like the ousted seat's late pass. `if(ni === i) return;` would also have stopped two cases that are not game over: a
  vacant seat beside the passer (still in the game: it keeps the turn coming back, as before) and a table of one (a solo
  game). After an unoust the next pass moves the turn on.
- **The reference client refuses the winner's pass itself,** online and at a hotseat, with the reason "The game is over — you
  are the last Methuselah standing." At a hotseat the sweep found no live seat and gave the human a new turn.
- PROTOCOL §7 (`pass`) and §12.2. A dispatch test (srv-2.6.50: red) and two client tests.

## 4. §12 and the canary v1.3.0 (section 8)

- **§12 records** (your offers taken; the no-reader lines are listed, not frozen):
  - how the bots read a human's Toreador Grand Ball: the client's play line and its Target, the lock on the board after the
    `Phase:` line, a custom token, the only other ready Toreador;
  - the question to the Ball's owner (its shape, not its words) and the free-text answer the bots read;
  - Smiling Jack on `burnAct`, with the comma in the card's name, and its chat line to a human owner;
  - the bare body that may block a rush or a card burn at 0 stealth;
  - Perfect Paragon's stealth line and its two adjustment lines (listed beside `NET_STEALTH`, not pinned);
  - Eyes of the Wild's unlock, attempt (`attemptIcp`) and relock note, and Second Tradition: Domain / Guard Dogs as locked
    blocks;
  - the crypt dodge on the client's own `strikeD` line;
  - in the no-reader list: Phaibun's discard, the fizzle lines (bleed, pool damage, rush, card burn, rescue, hand look) and
    the referendum part for an ousted seat;
  - the question in the chat-to-a-human list.
- **Canary section 8** (28 checks):
  - 16 documentation checks;
  - 3 parsers: `burnAct` reads `Smiling Jack, The Anarch` whole, `attemptIcp` reads Eyes' attempt, `strikeD` reads Flávio's
    dodge;
  - 2 client-source checks: the bleed lines' pool-only suffix, the used aim's clear;
  - 7 live-bot checks: the human Ball's memo via `pair` and via `only`, the question in its documented shape, the owner's
    answer `Flavio` naming Flávio Gonçalves; the prey test with no target and with a pool aim, and the card-suffix control.
- **Runs:** 171/0. Against v2.6.174's client and protocol, 154/17 (the 15 new documentation checks and the 2 source checks).
  Beside v0.6.218, 167/4: exactly the four memo checks. It first threw (`_hMemoBoard` did not exist), so it is guarded now and
  an older bot gives red lines, not a crash.
- **Your copy in `bot/`** is v1.2.0; v1.3.0 needs nothing new beside it.

## 5. Your tokens in the ledger (v0.6.221 §2)

Keep them. The ledger is the server's record of every pub change, with no exception by sender; a bot's display token is a
board change like a human's. If one turns out noisy, the remedy is the ledger's own budget (40 rows a push), not an exception.

## 6. `hotBridge.toBot` synchronous? (v0.6.227's question)

- **Our answer: it should deliver the way the server does, after the send returns.** The bridge plays the server.
  - The synchronous order was behind your round A's 50 of 53 windows that ran out their clock.
  - It has paths on our side too: a bot's instant answer runs the human client's handlers inside the human's own `log()` call.
- **Planned as main's next round, with Johan's go:**
  - `toBot` queues, and delivers after the sender's own code has returned: one first-in-first-out queue for the bridge.
  - We will measure a microtask against a macrotask with your pace-0 open order.
  - It changes the literal your harness lifts and the timing of about 45 of our tests, so it gets a round of its own and a
    handoff before it ships.
- **Nothing waits on it,** since v0.6.227 handles both orders. Your BOARD line "a window can open after its line was
  delivered" may then close by itself. Tell us if your own fix lands first, or if you would rather the bridge stayed
  synchronous. §12.2 records the difference meanwhile.

## 7. Small notes

- **Your deploy notes:** the box never serves `/elysium-cardfx.js` or `/START-HERE-BOTS.html`. The server's routes are the
  client page, `/images/` and four bot files (`elysium-bot.js`, `elysium-cardfx.json`, `elysium-twd-profile.json`,
  `elysium-twd-archetypes.json`). Purging those two URLs is harmless, but not needed. For v0.6.219–229: purge `/elysium-bot.js`
  and `/elysium-cardfx.json`; the TWD files are unchanged since 16 Oct.
- **"Unlock all cards?"** (v0.6.225's Found: it unlocks the Toreador a human's Ball keeps locked): noted for Johan as an idea.
  A card could be marked "stays locked at the next unlock", and the prompt would respect it (Mind Numb's family too). Nothing
  built.
- **The security plan's item 5:** your Node client masks every frame (v0.6.219 §6). This is recorded; the remaining condition
  is Johan's look at the box's log.

## 8. Not tried

- A human against bots in a browser with the Ball, Smiling Jack or Eyes of the Wild in play.
- The bleed against a real bot in a browser. The LIVE tests drive your bot in Node over the real bridge; the browser run checked
  the client's lines.
- elysium.cards.
