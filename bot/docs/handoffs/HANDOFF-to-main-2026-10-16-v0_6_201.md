# Handoff to main — bot v0.6.201: the debug hand to the whole table again, and the Reduce line we ask for (16 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.158, srv-2.6.46). **Follows:** `HANDOFF-to-main-2026-10-16-v0_6_200.md` (R1, merged as PR #15). This note **corrects** its debug item (§1) and §3, and turns its §4 wish into an ask. Everything else in it still stands.

## 0. In short
- **v0.6.201 carries Johan's answers to our R1 uncertainties** (16 Oct). It is a small round before R2.
- **Debug goes back to the whole table** (`openHand to:'all'`). Your Debug tooltip ("The bot opens its hand to EVERYONE at the table") is right again.
  - Please **ignore** v0.6.200 §3's request to change it to "to the human players".
  - The optional `to:'humans'` wish is **withdrawn**.
- **One ask: a Reduce row on the Bleed menu** that writes `NAME reduces the bleed by N.` (§2). The bot reads it from v0.6.201. It is backward compatible, so the bot ships first.
- **Two bot-emitted frozen lines for §12** (§3). Nothing to build on your side.
- **Still open from earlier:** the bridge's `edgeTake` relay (v0.6.200 §2), the 15 Oct debug items, and the `PLAYTEST.md` lines (§4).

## 1. Debug: the whole table again (Johan, 16 Oct)
- **What v0.6.200 did:** with another bot at the table, it sent the debug hand seat by seat to the human players, so spectators saw nothing.
- **Johan's answer:** every human should see a debug bot's hand. Do not patch around the base system. Use the open-hand function as it is, and let the bots never inspect a hand that is shown only by debug.
- **What v0.6.201 does:**
  - One grant, `openHand {to:'all'}`, exactly as before v0.6.200. Every human sees it: players and spectators, online and offline.
  - A spectator who joins mid-game gets it at once: the bot reads the roster's `watcherList` and sends the grant again when it changes (your server routes a grant only to the sockets that are there).
  - The **other bots look away** from a seat that announced DEBUG mode. They keep no hand intel from its grants, and a debug grant never answers a Revelations [aus] reveal they are waiting for. The target's private `revealHand` answers that, as the card says.
  - The one exception: a bot's own Revelations [AUS] on that seat, while the card is in play. The view ends with the card.
  - The look-away is keyed on the bot's frozen announcement and its sender (§3), so it also works against an older debug bot.
- **For you:** nothing to build.
  - The tooltip (2417 and 2444 in v2.6.158) is accurate again.
  - Offline, the bridge already routes `all` (to the human and fanned to the other bots). The other bots receive it and look away.

## 2. ASK: a Reduce row on the Bleed menu
- **The problem** (your play-test of 14 Oct, point 15; our v0.6.200 §4):
  - When a human reduces a bot's bleed with a card, the client writes only the card play.
  - The bot keeps its full number and says "−N pool". If the bleed was reduced to 0, it also takes the Edge.
  - The human manages their own pool, so nothing is lost, but the bot's line is wrong and the Edge moves.
- **Johan (16 Oct):** an interim for every reduction card the bot does not know yet: a Reduce row (−1, −2, N…) on the Bleed menu. The human uses it in the step where the bot asks for reactions. Later the bots learn curated reduction cards.
- **The line we ask for:** `NAME reduces the bleed by N.`
  - NAME is the reacting minion, the one whose menu was used. N is 1 or more.
  - You may add the card before the full stop, `NAME reduces the bleed by N (CARD).`, but it is optional. Your effect-line style (`NAME prevents N damage.`) names no card, so the bare form is fine.
  - It must come from the **target's seat**. The bot checks that the sender is the seat it is bleeding.
- **Where (a suggestion):** the reacting minion's Actions → Bleed submenu, beside "+X bleed…": for example `Reduce bleed −1 / −2 / −X…`. Any minion of the target's seat may use it.
- **The bot side (v0.6.201, shipped first):**
  - The acting bot lowers its bleed by N, never below 0.
  - A bleed at 0 says "The bleed goes through at 0: NAME loses no pool." and moves no Edge (as in v0.6.200).
  - A line from any other seat is ignored, and so is a line during a pool-damage action (it is not a bleed).
  - The bot's own reduce line, `NAME plays CARD — reduces the bleed by N (now M).`, is unchanged, and the bot does not confuse the two.
  - Pinned live in our suite (140h): a human target's Reduce line takes the bot's bleed of 1 to 0, and no `edgeTake` is sent.
- **Please:**
  - add the line to §12's client-emitted frozen lines, and a canary case;
  - tell us the client version when it ships, and we pin it in our canary.
- **Guide:** `START-HERE-BOTS.html` now tells the human to use the Reduce row "when your client's Bleed menu has it (asked of the client project)", and until then to adjust their own pool. When the row ships, we update the sentence.

## 3. Two bot-emitted frozen lines for §12
Both have existed since v0.6.112 and v0.6.200. From v0.6.201, other bots **read** them, so they are now part of the contract.
- `NAME (bot) is in DEBUG mode: open hand for the humans (the bots look away), crypt face up, decision weighting in the log.`
  - Without the weighting: `…, crypt face up.`
  - Older bots wrote `…: open hand, crypt face up…` (v0.6.112–199) and `…: open hand to the human players, …` (v0.6.200).
  - The bots match only the head, `NAME (bot) is in DEBUG mode`, and key on the sender.
- `NAME (bot) leaves DEBUG mode: the table is in Tournament mode now.`
- Both are log tier (no bubble). Please record them in §12's bot-emitted list. No client action is needed.

## 4. Still open (not changed by this release)
- **v0.6.200 §2: the bridge must relay `edgeTake`.** Online it works. Offline the human's Edge still stays lit when a bot takes it.
- **15 Oct handoff §3, items 1–5** (debug):
  - the offline hand item (`openHandCardsFor` reads the placeholder board);
  - `botDebugAllowed()` reading `#offHelpers` online;
  - the first offline toggle greying Debug;
  - `net.openHandFrom` cleared only at page load;
  - the wish for an ash pile or hand badge on the mat.
- **`client/playtest/PLAYTEST.md`:**
  - line 85 (the Edge) as in v0.6.200 §4;
  - the paragraph on a human's bleed reduction can now point to the Reduce row once it exists.

## 5. The bundle
- `elysium-bot.js` (v0.6.201) and `START-HERE-BOTS.html` changed and are copied to the root in this PR.
- The cardfx, twd-profile and twd-archetypes files are byte-identical to v0.6.200's.
- **START-HERE-BOTS.html — please re-embed** (`embed-help.js bots`):
  - the debug passage: the whole table sees the hand, the other bots look away;
  - a Reduce sentence: use the Bleed menu's Reduce row when it exists, until then adjust your own pool;
  - a firmer target sentence: set the target first whenever the action is aimed at anyone but your prey (Johan: player education, no forced targets).
- **Deploy:** purge `/elysium-bot.js` and re-embed the guide at your next client release.

## Gates (v0.6.201, from `bot/`)
GATES-PLACEHOLDER
