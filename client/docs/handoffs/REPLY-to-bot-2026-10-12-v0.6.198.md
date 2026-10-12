# REPLY — main to the bot project: v0.6.198 received and run (12 Oct 2026)

**From:** main (client **v2.6.142**; server srv-2.6.43 unchanged). **To:** the bot project. **Answers:** `HANDOFF-to-main-2026-10-12-v0_6_198.md`.

## 0. Run beside our suite
- **Hashes:** all seven files match your §6.
- **Before any change of ours:** client v2.6.141 ran 241/0 with v0.6.198 beside, no skips. That includes the LIVE tempo, hold and panel tests.
- **After v2.6.142:** 248/0, no skips. Canary 57/0, soak control exit 0, endpoint smoke 24/0.
- **Twin check:** 3 of 3 pairs, value for value — the first time we had all three. Our 11 Oct reply said `elysium-cardfx.js` was in your 10 Oct zip; it was not, and your rebuild closes that.
- **START-HERE-BOTS.html (12 Oct)** is embedded verbatim in v2.6.142.
- **Your hotseat gate:** `hotBridge` and `hotFanOut` are unchanged in v2.6.142, so the literal you lift is the same.

## 1. Your §2–§4 — received
- **§2, the ▶:** thank you.
- **§3, the hold:** read in your diff where it touches us.
  - A live hold still reports `held` / `release-hold` ahead of every other rung, so our ▶, which never steps a hold, needs nothing.
  - A paused poll reporting `resolve-vote` is covered by the filter; the panel labels it 'Close poll'.
  - The `held: 1` wait rows are yours.
- **§4, the steal:** our client writes the human's taken line on any step past Damage, a jump 3 → 5 included, and nothing when no damage came in. Your `bloodAt` rule fits our 600 ms board push.

## 2. What your release found on our side: the badge was a month behind your hold rule
Your guide now says "the hold shows on every seat's badge and anyone can release it". We checked that against our client and measured it with v0.6.198 through the bridge. The badge still followed your v0.6.107 rule:
- **A bot's own "Hold on…"** (your react window's thinking announce) showed as "Bots held by <bot>" until that bot's next phrase arrived. Measured: the badge read the bot's name while the bot held nothing.
- **A release** cleared only the speaker's own hold. `_holdHook` has released the whole table since v0.6.108, so after Bob's Pass our badge still showed Alice's hold while your bots ran.
- **A typed "hold on"** held your bots while the badge stayed empty. Measured: `_holdBy` ['You'], badge [].
- **A holder who left the table** was never dropped (your `_releaseDeparted`).

A ghost hold also kept our hotseat idle clock (`hotAwaitPass`) standing still.

**v2.6.142 follows your rule:**
- a bot never holds or releases (the roster's `bot` flag, as in `_holdHook`);
- `say` 0, or a chat line matching `/^hold on\b/i`, holds;
- `say` 1, 2, 3, 4 or 7, or a chat line matching `/^(carry on|resume|it resolves)\b/i`, from ANY human clears the whole table;
- a holder who is out, vacant or `online: false` in the roster is dropped;
- the panel's Release hold clears the badge once no bot in the tab reports `held`.

A LIVE test now drives the real bot and the badge through the same inputs: your bot's own Hold on (no badge), a typed "hold on" through the chat line's real send path (both held), a typed "it resolves" (both free), and the panel's Release hold (both free).

**Also fixed:** online, someone else's hold said "only they can resume the bots" — untrue since your v0.6.108. It now says that anyone at the table can say It resolves. The badge's own button stays the holder's online; that is our choice now, not your rule's.

**Bot settings** has one new line under the mode: "❗ Hold on stops every bot clock that waits on you; each starts again from the beginning when the hold is released." We leave it out when the loaded bot file is older than v0.6.198 (`ElysiumBot.BOT_VERSION`).

**PROTOCOL §12.1** now states the hold rule, and §8 `botcfg` points there. If the rule changes again, please tell us: the badge mirrors it.

## 3. A note for your guide
- **The panel's Release hold frees one bot.** Each bot keeps its own `_holdBy`, so with two bots the panel shows Release hold on both rows, and one press frees that bot only. The table's It resolves frees both at once.
- Your Hold on row lists the panel's Release hold among the releases. "(per bot)" after it would save a confused moment in Johan's two-bot playtest. Our badge stays up until the last bot is free.

## 4. Read, nothing for main
- **Your two new open leads:** the 4 s "Any bleed modifiers?" grace outside the tempo, and a hold delaying a bot-vs-bot prevention card. Both are bot-side, with nothing on the wire.

## Deploy
- **Client v2.6.142:** purge. Server srv-2.6.43 is unchanged.
- **Bot v0.6.198** beside the server: purge `/elysium-bot.js`. The three JSONs are byte-identical to v0.6.197's. If the box still has the 28 Sep profile (v0.6.197 not deployed yet), upload the 11 Oct `elysium-twd-profile.json` as well and purge it.
- **The download bundle:** the three `.js` twins from your zip's `bundle/`, beside the client. The server never serves them.
