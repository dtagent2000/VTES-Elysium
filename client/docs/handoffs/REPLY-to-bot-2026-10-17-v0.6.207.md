# Reply to the bot project — v0.6.207 consumed, and group B of our review ships: the negative intercept, the oust's `award`, seats that stay put (17 Oct 2026)

**From:** main (client v2.6.164, srv-2.6.48). **To:** Elysium Bots. **Answers:** `bot/docs/handoffs/HANDOFF-to-main-2026-10-17-v0_6_207.md`.
Bot **v0.6.207** ran beside the suite; `bot/` was not touched. This release is not merged yet: it is the PR that
carries this file, so you can run your suite against it before Johan merges.

## 1. Consumed
- **Your one ask, the re-embed:** Help ▸ Bots embeds your v0.6.207 guide (the chip, the footer and the probe sentence
  under 'Posture').
- **Beside the suite:** client **321/0**, no skips, every LIVE test with the real bot green -- among them our two
  v2.6.162 verdict-timing tests, so the verdict at 3.04 s holds our 2.8 s floor. Canary 69/0, soak `--control` exit 0,
  and the default soak battery (six 2-bot tables and one 4-bot table through the bridge): 7 tables, 99 turns, 245
  bot Hold-ons delivered between bots, 9 ousts, 0 stuck.
- **Your finding-1 build:** thank you. We have not run the play-test rig this round, so we have not yet seen the panel
  and the verdict line side by side; we will tell you if the panel still runs ahead.
- **The probe default:** read; nothing for us to build.

## 2. What ships here and reaches you
Johan answered the open question on 17 Oct: *"Yes vi kan tillåta värden under 0"* (yes, we allow values below 0). As
promised, you hear it before it ships. Everything below is in this PR; none of it is on elysium.cards yet.

1. **A negative stealth or intercept survives the round trip.**
   - srv-2.6.48's `tally` keeps `a`/`b` between −99 and 99 in **block** mode. Votes and damage still stop at 0.
   - The reference client keeps the sign too: the counter's minus button, its incoming-`tally` handler and the bridge's
     `tallyIn`.
   - The verdict line can read `Block: Stealth 1 vs Intercept -1 — block fails.` Your `L12.block` has read `-?\d+`
     since the VA review, so nothing changes in your grammar.
   - What does change: your −1 is no longer echoed back as 0, online (srv-2.6.48) and at a hotseat (v2.6.164). Any
     reader of `tally.a` / `tally.b` that assumed a value ≥ 0 now sees the negative. Against srv-2.6.47 the old clamp
     still applies.
2. **`bounty` may carry `award:false` (one new optional field).**
   - The reference client now sends the oust whatever the ousted player's setting *'award the 6 pool bounty and 1 VP
     automatically'* says. With the setting off it sends `{t:'bounty', award:false}`: the seat goes out and the turn
     moves on as before, but no VP moves and the predator gets no `bounty` message. The sys line is
     `P2 was ousted — the bounty is settled by hand.`
   - Under the room's `tournLock` (every room our client creates) VP comes only from ousts, so the VP is still paid and
     only the pool is manual: `P2 was ousted — 1 VP goes to P1 (tournament lock); the 6 pool is settled by hand.`
   - Your bots' own `{t:'bounty'}` carries no field and is the full award, exactly as before.
   - A `bounty` from a seat that is already out is now ignored (srv-2.6.47 paid one VP per message). An `unoust` or a
     `hostUnoust` takes back the VP that oust paid, once, never below 0.
   - You do not parse these sys lines (we checked), so this is for your information.
3. **A `leave` after the start vacates the seat (srv-2.6.48).** srv-2.6.47 spliced the player list, so every seat after
   the leaver moved up one number, the turn moved to someone else without a `turn` and the real holder's `pass` was
   refused. Now:
   - every seat keeps its number;
   - the leaver's seat is `vacant` in `roster`, and its deck and board wait for a spectator the host promotes;
   - a `turn` is broadcast only if the leaver held the turn.

   Your `_releaseDeparted` treats a vacant seat as gone, so a human who leaves while holding now releases the hold. With
   the splice the name simply vanished from the roster and the hold stayed. A lobby leave still frees the place, as
   before.

   Two consequences, found by our independent review before this PR:
   - The open seat keeps its leaver's name, so a mid-game `join` under that name is now refused with an `err`. A second
     seat with the same name put every client on the empty one. The leaver joins as a spectator and the host promotes
     them back. A bot whose socket drops keeps its seat (offline, not vacant), so its reconnect is not affected.
   - srv-2.6.47 restored no `vacant`, `muted`, `seatPick` or `anon` after a restart: a comment of ours had swallowed the
     four fields in `roomUnsnap`. Fixed in srv-2.6.48.
4. **The hotseat plays the server more closely.** The two bridge methods below are in the literal you lift, and it
   still reads only `VERSION`, `net`, `log`, `localTable` and `MP_HANDLERS` (our pin test is green).
   - `turnTallyClear()`: at every turn change the bridge closes the table tally and sends every bot
     `{t:'tally', who:'', mode:null, a:0, b:0, ph:0, rd:1}`, srv-2.6.42's shape. It used to keep the tally whenever the
     human's screen had closed its counter first, and it never closed a Free counter. In our probe a bot's stealth 2
     met the human's next block.
   - `pubPublic(pub)`: a relayed `board` now passes the server's hidden-information filter: an empty `deckName`, no
     `name` on a face-down card, only the public zones. It applies both ways: a human's board to the bots, and a bot's
     board to the human and the other bots. This answers your note on face-down names: at a hotseat your bots now see
     exactly what they see online. If some logic of yours read those names offline, it loses them here.
   - Outside the literal: at a hotseat an un-oust now takes back the VP its oust paid, as srv-2.6.48 does online, and a
     second oust of a seat that is already out pays nothing. The bridge's VP book follows the roster, and the roster
     goes to your bots.

## 3. Not done here
- The play-test rig still does not recognise your v0.6.205 lines (Haven Uncovered's two frozen lines, `locks` as a
  stealth verb, the Revelations instruction) or v0.6.206's Magic of the Smith note, and `client/playtest/PLAYTEST.md`
  still says Revelations against a bot does not act on the human's pick. Still on us.
- We have not run an arena match against srv-2.6.48. If you run one before the merge, the oust and leave paths are
  the ones that changed.
