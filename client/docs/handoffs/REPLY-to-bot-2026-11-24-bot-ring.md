# REPLY to the bot project — 24 Nov 2026, THE BOT RING (client v2.6.187)

**A notice and two asks.** Johan asked for a modern bot control: the robot in a circle, a ring of quick answers.
Client v2.6.187 builds it. No verb or field changed. One new pair of log lines, the bounce, is in PROTOCOL §12.
Johan has already told you what the bounce sends; this records it.

## What changed in the client

1. **The blue Bot Activity panel is gone.** The 🤖 badge is now the **bot hub**: the robot in a brass circle. Each
   player drags it where it suits their own screen. Its place is saved in their browser and kept 90 px from every edge.
2. **Hover the hub (tap it on a touch screen) and a ring of answers opens:**
   - Hold on (Release while a hold stands), Yes, No, Pass, It resolves (a gavel).
   - **Block and reaction:** Block! (and which minion blocks), Any blocks?, No block, No reaction, Any reaction?
   - **The blood drop:** Bleed, +Bleed and Reduce, each 1 / 2 / 3 / X, and Bounce.

   Every one of the ten quick phrases is a segment. Each segment sends exactly what the phrase or the menu row sent
   before: the same `say{i}`, the same lines. The ring lights what your bots' `status()` says they wait on. Nothing in
   `status()` changed for this, and nothing new is read from it.
3. **Open, the robot is a gear.** The gear opens the **bot box**: the old panel's rows and step buttons, Run bot turns
   and the bot settings. The Turn-based play button (▶) sits on the hub's rim.
4. **A blocker from the ring** writes `NAME blocks.` and then says `Block!`. That is the menu's Block row followed by
   the phrase, the order PROTOCOL §12 settled on 15 Sep.
5. **Reduce from the ring** writes the Reduce line you read (`L12.reduceBy`). With no minion selected, NAME is the bled
   Methuselah's name. You read the sender and the number, so nothing changes for you.
6. **At a hotseat with several humans the ring answers from the seat you asked.** We read your rules: a decline counts
   only from the seat you asked (`_onSay`, `m.who === curTarget`), and a Reduce only from the seat you bleed. So when you
   ask Anna while another human's seat is being played, the hub glows and says 'Anna is asked. Take Anna’s seat in the
   Table panel to answer.', and Reduce and Bounce are grey until that seat is taken. Your rules are unchanged; the ring no
   longer sends answers you would ignore.

## The bounce (PROTOCOL §12, canary v1.6.0 section 11)

A human a bleed is aimed at can bounce it to another Methuselah: anyone but the acting minion's controller, and not the
one being bled. The client sends three things, in this order:

1. `NAME bounces the bleed to WHO.` — for the humans. Johan chose *bounces*, never *redirects*, because Redirection
   is a card. **None of your `L12` patterns matches it**, so it is neither an action nor a reaction to you. The canary
   pins that. Tell us if you ever want to read it.
2. `VAMP bleeds for N. Target: WHO's pool.` — the acting minion's bleed re-announced at the new target: exactly the
   shape your own `_commitBounce` writes. N is the bleed as the client saw it stand (the announce, every `adds +X`,
   every reduction by the target).
3. `say{i:7}` — `Pass`, as your own bounce says it.

**Checked against v0.6.236**, in the client suite (a LIVE test through the bridge) and in the canary:

- The acting bot follows its bleed: `_actingVamp.target` becomes the new seat and `bounced` is set (your steg 2 reads
  its own minion's re-announce whoever sends it).
- The new target arms the bleed from the minion's controller, not from the human who sent the line (your v1.4.3 lookup
  on the published boards): `pending.who` is the acting bot, `actingVampName` the minion, `amount` N.
- In Chromium at a hotseat with two real v0.6.236 bots: Hanna's Ryan (G6) bled the human for 1, the human bounced it
  through the ring to Viktor, Viktor said `Pass`, Hanna said `It resolves` and wrote `The bleed goes through: Viktor, -1
  pool (adjust yours).`, and Viktor wrote `I take 1. Pool: 26.` The human's pool was unchanged.

## Two asks

1. **Sweep register 4.6** ("A human's bounce of a bot's bleed is not read by the acting bot"). The ring's Bounce now
   sends the re-announce your acting bot already reads. Please judge whether that closes the human half of 4.6 for you.

   A Deflection played from the hand still writes only the card-play line (`VAMP plays Deflection. Target: WHO's
   pool.`), with no re-announce. If you build a reader for that line, a human may do both: play the card from the
   hand and then press Bounce. Reading the two must not count two bounces. The re-announce names the same target, so
   reading it twice changes nothing.
2. **Help ▸ Bots** is your text, embedded verbatim, and it still describes the old panel:
   - "the 🤖 badge top right";
   - "The Bot Activity panel" (`#controls-panel`);
   - "the ▶ beside the 🤖";
   - Run bot turns "in the Bot Activity panel";
   - Release hold "in the Bot Activity panel".

   In v2.6.187:
   - the hub is where each player put it (top right until moved);
   - hovering it opens the quick answers (Hold on / Release included);
   - the gear opens the bot box, which holds each bot's row and step button, Run bot turns and the bot settings;
   - the Turn-based ▶ sits on the hub's rim.

   When you next ship `START-HERE-BOTS.html` we embed it as usual (`embed-help.js`). Until then the embed check is
   green: the text is yours and unchanged.

## For your read-only copies

Refresh `bot/elysium-vtes-bord.html` and `bot/ELYSIUM-PROTOCOL.md` from the release whenever it suits you. The client's
hotseat bridge is unchanged. The client now also reads the bleed lines it relays, to know whether a bleed is aimed at
a human. It reads them and never alters them. `test-bot-hotseat.js` in a scratch copy with v2.6.187: see the PR.
