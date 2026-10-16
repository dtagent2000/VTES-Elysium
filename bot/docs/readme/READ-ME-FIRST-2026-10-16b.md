# Elysium Bots — delivery 16 October 2026 (b): bot v0.6.200 → **v0.6.201** (Johan's answers to the R1 uncertainties) — DEPLOY CANDIDATE

**What it is.** A small round before R2. Johan merged R1 (v0.6.200, PR #15) and answered the uncertainties it ended with (16 Oct). This release carries his answers on debug and on a human's bleed reduction. His third answer, on targets, changes only the guide.

## 1. Debug: the whole table sees the hand, the other bots look away
- **Before (v0.6.200):** with another bot at the table, the debug hand went seat by seat to the human players. Spectators saw nothing.
- **Johan:** every human should see it, without patching around the base system. Use the open-hand function as it is, and let the bots never inspect a hand shown only by debug.
- **Now:**
  - one grant, `openHand {to:'all'}`, as the base system has it: players and spectators, online and offline;
  - a spectator who joins mid-game gets it at once: the roster's watcher list is part of the audience (found in my own review after the first suite run);
  - every other bot **looks away** from a seat that announced DEBUG mode (`_lookAway`). It keeps no hand intel from that seat's grants, and a debug grant never answers its Revelations [aus] reveal;
  - the announcement is the bot's frozen line `NAME (bot) is in DEBUG mode …`, keyed on its sender (an older bot's wording works too). `NAME (bot) leaves DEBUG mode …` ends the look-away;
  - **the one exception:** my own Revelations [AUS] on that seat, while the card is in play (`_myRevAus`). The view ends with the card.
- **Gone:** `_debugTargets`, `_openHandRetarget`, `_openHandTo`, and the re-send when Revelations leaves play under debug.

## 2. A human's bleed reduction
- **Before:** a human who reduced a bot's bleed with a card wrote only the card play. The bot kept its full number and took the Edge even at 0.
- **Johan:** an interim for every reduction card the bot does not know: a Reduce row on the client's Bleed menu. Curated reduction cards later.
- **Now:** the bot reads `NAME reduces the bleed by N.` (a card in brackets optional) from its bleed's target seat and lowers its total, never below 0.
  - A bleed at 0 goes through at 0 and moves no Edge.
  - Pool damage is not a bleed and is not reduced.
- **Main is asked for the row** (handoff §2). Until it exists, nothing changes at the table.
- **Found while building:** the first pattern also matched the bot's own reduce line (`… — reduces the bleed by 2 (now 1).`) and counted one reduction twice. The pattern now excludes it, and 140d guards it.

## 3. Targets, events, the guide
- **Targets (Johan: player education, nothing forced):** the guide's sentence is firmer: set the target first whenever the action is aimed at anyone but your prey.
- **Event kinds** `reduce` and `debug`, in the same release as their parsers.
- **The guide:** the debug passage, the Reduce sentence, the target sentence, and the versions.

## Gates
GATES-PLACEHOLDER

## For main
- Send `HANDOFF-to-main-2026-10-16-v0_6_201.md`:
  - the Debug tooltip is right again: ignore v0.6.200's request to change it; the `to:'humans'` wish is withdrawn;
  - **the ask:** a Reduce row on the Bleed menu writing `NAME reduces the bleed by N.`, with §12 and a canary case;
  - two bot-emitted lines for §12 (the debug announcement and its leave line);
  - still open: the bridge's `edgeTake` relay, the 15 Oct debug items, `PLAYTEST.md`.
- Deploy `elysium-bot.js` v0.6.201 and re-embed `START-HERE-BOTS.html`. The cardfx and twd files are unchanged.

## Next
R2, unchanged:
- the bot-vs-bot combat handshake (points 16, 17, 7);
- pacing bot-vs-bot combat when a human is seated;
- a hold stops the bot's own combat moves (5);
- the range correction only from my own human opponent;
- Roundhouse's damage (18).
