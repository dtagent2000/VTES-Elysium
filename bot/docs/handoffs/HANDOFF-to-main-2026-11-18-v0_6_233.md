# Handoff to main — bot v0.6.233 (18 Nov 2026): V5 wave 6a, the block side of the 11 cards

Built on bot v0.6.232 (#79) and your v2.6.175 / srv-2.6.51. The handoffs of v0.6.230, v0.6.231 and v0.6.232 are still open on your
side; this one adds the items below.

## 1. The bundle
`elysium-bot.js` (v0.6.233), `elysium-cardfx.json` / `.js` (210 curated: + True Love's Face, Hunting the Quarry; Forced
Confessional's [dom]; the compiler v1.9.11 reads "during an action directed at you", a card's own capacity requirement, the locked
route's discipline cards and "reduce the acting minion's stealth to 0") and `START-HERE-BOTS.html` (the chip and the footer only:
version and counts). The TWD files and the server are unchanged. Deploy: purge `/elysium-bot.js`, `/elysium-cardfx.json`,
`/elysium-cardfx.js` and `/START-HERE-BOTS.html`. The guide's text is unchanged except the footer line; if your embed test
compares the whole page, re-embed it.

## 2. What changed (no protocol change; `log`, `chat`, `tally` as before)
- **A rules correction in the starters.** Eyes of Argus [aus] (malkavian, tremere) and The Warrens (nosferatu) are "Only usable during
  an action directed at you": the bots spent them at undirected actions (a political action, an equip, a hunt …) 568 times in the
  240-match design. They no longer do; at a human's undirected action a bot blocker may now say Block! without them, or pass.
- **The locked route** takes Sense the Savage Way [ANI], Sentry Signal, One With the Land [PRO] and Deep Ecology [pro]: a locked bot
  vampire unlocks with the card and attempts to block (the route's line as before, `VAMP plays CARD: unlocks.`).
- **One With the Land [PRO]**: its line gains the rider (below); if that block stands, neither combatant strikes in the first round
  of its combat — each bot writes the existing `VAMP gets no strike this round (One With the Land).` and a human actor is told in chat
  ("…neither X nor Y can strike in the first round of this combat."). The bot cannot write a human's strike.
- **True Love's Face [OBF][PRE]** (a bot's, at a bot blocker only): the card lands in the 'as played' window of v0.6.232 — `NAME is
  playing True Love's Face — on OWNER's VAMP.` (the vampire may read `blocking minion` when the card answers the shout before the
  attempt's line) — and the blocking bot may burn 1 pool to cancel it (line below); then the cancel line as before, or nothing.
- **Night Terrors** (a bot's, at a bot actor only): the blocking Ravnos's line below; the acting bot takes its stealth off the shared
  counter (its `a` goes to 0) and may play stealth again.
- **Forced Confessional [dom]**: a stealth line in the existing shape: `VAMP plays Forced Confessional (the blocking minion gets −1
  intercept): +1 stealth.` (Perfect Paragon's shape since v0.6.228: `plays X (…): +N stealth.`).

## 3. For §12 (your call; machine-read lines, `L12` in the bot)
- `VAMP plays CARD: unlocks; if they block, neither combatant strikes in the first round.` (`noStrikeR1`)
- `VAMP plays CARD: ACTOR's stealth is 0.` (`stealthZero`)
- `NAME burns N pool to cancel CARD.` (`payCancel`)
Straight apostrophes, as the other bot lines. None ends in `plays X.`; the first two are the reaction lines' `plays X: …` family
(as `plays X: +N intercept.`).

## 4. Run here
On the release bytes (`elysium-bot.js` sha256 `<release>`, `elysium-cardfx.json` `<release>`): see the PR body for the gate numbers
(your canary on `bot/`'s copies and on the root's client; your client suite in a scratch copy of `client/` with this bundle beside it;
the bot's suite ×3, the hotseat gate, HB1, the sim footprint, the arena smoke). The root is a byte copy of `bot/`'s bundle (your
`check-versions.js` reads it).
