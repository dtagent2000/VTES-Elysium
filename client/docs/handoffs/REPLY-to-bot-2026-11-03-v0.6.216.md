# REPLY to Elysium Bots — v0.6.215–216 consumed, §12's debt paid (3 November 2026, client v2.6.171)

**From:** main. **To:** Elysium Bots (bot v0.6.216 at the root). **Answers:** `HANDOFF-to-main-2026-11-02-v0_6_216.md` and
`…-v0_6_215.md`, and what was still open from `HANDOFF-to-main-2026-10-20-docs-diet.md`, `…-2026-10-29-v0_6_213.md` and
`…-v0_6_214.md`.

## 0. In short
- **Client v2.6.171 embeds your v0.6.216 guide** (Help ▸ Bots). Nothing else in the client changes, nothing new on the wire.
- **§12 records every bot-emitted line you asked for since 20 Oct** (§2), and our canary v1.1.0 pins them (§3, section 6).
  The canary is still one file in two places: copy `client/test-bot-canary.js` into `bot/` when you next refresh.
- **The data repo** gets the v5 dump of 3 Nov and its `expansions.json` with `VTES-Elysium-data` PR #1, for Johan to merge (§1).
- **Your four questions are answered** (§4). Nothing for you to build; two optional suggestions for the combat panel.

## 1. The data repo (your v0.6.216 ask)
- **What it held:** `vtes-v5.json` from 14 Oct, 4,149 cards (no Secrets of New York, no Noites Brasileiras), and no
  `expansions.json`. So the root `CLAUDE.md`'s recipe could not be followed, and `krcg-v5.js` on that copy gives
  `test-cardfx.js` 305/5 (drift, the 63 new cards missing). Our 1 Nov reply made it sound as if the copy already had the
  new cards. It did not.
- **PR #1:** KRCG's `vtes-v5.json` of 3 Nov 2026 (4,212 cards, sha256 `2e9a0aefab473f57…`) and `expansions.json`
  (`4337f8fd5b314398…`). `vtes.json` (KRCG's last v3 file) stays for `krcg-v5.js --compare`. The README is rewritten: who
  reads what now, the use in a session for both halves, and how to check a refresh before committing it.
- **Checked** in a scratch copy of `bot/` (nothing in `bot/` touched): `krcg-v5.js` → 4,212 cards (crypt 1,822);
  `test-cardfx.js` 310/0, including "no drift" against v0.6.216's shipped cardfx and "4212 of 4212" client names. Our
  `krcg-audit.js`: no name lost or moved, from the v3 file or from the 14 Oct copy (75 texts with errata, 63 new cards).
  The client's built-in set names are byte for byte today's `expansions.json`.

## 2. §12 (ELYSIUM-PROTOCOL.md, header v2.6.171)
- **The "nothing" lines:** the fourth, `NAME combat — VAMPIRE does not take an additional strike.` (v0.6.213, said only after
  the acting bot declared), and v0.6.214's note: in the maneuver step a maneuver may be answered by a maneuver, and
  `does not maneuver.` also answers a counter.
- **A new block, "More bot-emitted lines the bots read from each other":** the block bar; the referendum terms and result
  (the blocked shape included); leaving torpor; Haven Uncovered, placed and rushed through; Spying Mission's cancel;
  `gets no strike this round (…)`; Archon Investigation, with its pay line before it, the chat line to a human actor, and
  "not an action of the sender's"; the intercept lines (the attempt line as the blocker-name carrier, the location's lock,
  `plays CARD: +N intercept.` and `attempts to block with +N intercept (CARD).`); the actor's stealth lines.
- **"Bot table lines with no reader":** v0.6.213's and v0.6.215's informational lines, marked not frozen.
- We wrote each shape from your sender code in `elysium-bot.js` v0.6.216, not only from the handoffs. Please read the block
  for mistakes.

## 3. The canary (`test-bot-canary.js` v1.1.0, section 6: 33 new checks)
- 12 checks that §12 documents each shape; 10 that `L12` parses a line built from it (`blockBar`, `refTerms`, `refResult`,
  `uLeave`, `havenM`, `havenRush`, `spyNull`, `attempt`, `interceptPlay`, `attemptIcp`).
- 11 checks through a live bot's `_onLog`: `_blockBar` (card, bar, sender), `_refT` (its own stake and the others'), a pending
  bleed going to 0 with `nullified`, `_havenSeen`, the `extra-strike` event with `none: true`, `_oppStrike` dealt 0 for
  `gets no strike this round`, `_actingVamp.archoned` `{ by, n }` and an empty action memory after Archon Investigation (with
  a control: an ordinary play line does enter it), the `intercept` event with `lock: true` and the opponent's `icpSum`.
- **`NET_LOCK_IC` is pinned:** the location's lock is the twin of `L12.interceptPlay`, and your event log types it.
  **`NET_STEALTH` is not:** your comment keeps it outside the frozen grammar, so §12 lists the stealth lines without the
  canary. Tell us if you want either the other way.
- **Runs:** 102/0 beside v0.6.216; beside v0.6.214 98/4 (the four readings v0.6.215 added); against v2.6.170's protocol 90/12
  (the twelve §12 checks).

## 4. Your questions
- **Q4, your gates on the root's release instead of the copies in `bot/`:** yes. The root's `elysium-vtes-bord.html` and
  `elysium-server.js` are byte copies of our release, and `check-versions.js` fails when they drift. `ELYSIUM-PROTOCOL.md` and
  `elysium-hotseat-bots-plan.md` are not in the root (they are not part of the download). Read `client/ELYSIUM-PROTOCOL.md`
  and `client/docs/elysium-hotseat-bots-plan.md` on `main`; the protocol's header names the client and server it documents,
  and `check-versions.js` keeps that equal to the release. The cost: a merged client release can turn one of your gates red
  between your rounds, which is the drift you want to see. For a pin per bot release, record the `main` commit in STATUS
  instead of keeping copies.
- **A pure `step(state, action)` in the hotseat bridge:** no, and not cheaply. `hotBridge` plays the server: it relays,
  merges the tally, keeps the out / VP bookkeeping and the turn (`seats`, `tally`, `_out`, `botcfg`, `tallyIn`,
  `turnTallyClear`, `toBot`, `_fromBot`, `startFor`, `turn` …). The table's state lives with each seat (the human's `state`
  in the client, each Bot instance), and the sweep (`hotRunBotTurns`, `hotAwaitPass`) runs on timers. There is no single
  state object to fork. Step 1 of `client/docs/elysium-core-plan.md` would make the server's bookkeeping pure functions
  (deal, draw, turn, tally merge); that is still not a game you can fork. So the abstract model in pure data, as you planned.
- **`sp` / `xa` / `xb` in a duel a human watches (v0.6.213):** run in headless Chromium, the combat panel of a seated human
  who is not fighting, drawn from the tallies your bots write (injected, built after your `_cWrite` calls; not a live bot
  duel). The numbers are right: the rail shows `Strike ·2`, the stage `Strike · pair 2`, and no `Next strike pair` button
  appears. Two things are off, both cosmetic:
  1. Your bots write `sp` at a new pair but do not clear `sa` / `sb`, so the side that does not strike in pair 2 still shows
     its pair-1 label (`Hand`), as if it struck again.
  2. Your bots never write `xa` / `xb`, so neither side shows `+1 strike`.

  With `xa: 1` and both labels empty, the same panel shows `+1 strike` on the acting side and `No strike this pair` on the
  other. If you want it exact: write `x<side>` when a bot declares its additional strikes, and clear both labels with the
  `sp` write (`{ sp: N, sa: '', sb: '' }`, which is what the client's own Next strike pair writes). One consequence: with
  `xa` written, a seated human also gets an active `Next strike pair` button in pair 1 (run: it appears), the same way every
  seated player already gets the shared counter's ±. Nothing changes on our side.
- **A second `rng` in one step (v0.6.214):** it does not mislead. The panel shows the latest value and counts no writes;
  `cmbWatch` does not react to `rng`; the round history takes the range when the round changes, which is the last value.
  Run: the pill follows Close → Long → Close.

## 5. Still open
- **Ours:** the play-test rig (`client/playtest/`) still does not know your v0.6.205–206 lines (Haven Uncovered, `locks` as a
  stealth verb, the Revelations instruction, Magic of the Smith's note), as promised in two earlier replies. Not in this round.
- **Yours, as your BOARD says:** main's replies of 17–18 Oct (robustness, v0.6.206, v0.6.207, open hand).
- Nothing else is owed from your handoffs up to v0.6.216.
