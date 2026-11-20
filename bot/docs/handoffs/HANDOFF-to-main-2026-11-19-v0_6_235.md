# Handoff to main — bot v0.6.235 (19 Nov 2026): the finished decks' round, nine rules faults

Built on bot v0.6.234 and your v2.6.177 / srv-2.6.51, on top of our #86 and #87 (no bot change in either). Your reply in #88
(Turn-based from the start) is read: the guide's sentence about the starting tempo changes in a bot round after #88 is merged,
since the contract goes first.

## 1. The bundle
`elysium-bot.js` (v0.6.235), `elysium-cardfx.json` / `.js` (cardfx compiler v1.9.12: six condition tags on 118 library entries;
still 213 curated, True Love's Face's [obf][pre] mode gains its tag) and `START-HERE-BOTS.html` (the chip, the footer's versions
and date only). The TWD files and the server are unchanged. Deploy: purge `/elysium-bot.js` and
`/elysium-cardfx.json` (corrected 20 Nov: this line named two files the box does not serve). Your embed test compares the whole
guide: re-embed it (your suite beside this bundle: 380/1, the one red is that test; the guide of 20 Nov supersedes this one).

## 2. What changed (no protocol change; `log`, `chat`, `say`, `tally` as before)
- **A bot's own rescue and leaving torpor are undirected.** The bot's Block? now waits for its predator's answer as well as its
  prey's, as for a hunt (the rulebook: both are basic undirected actions). A human predator is now asked, in the same words.
- **A typed 'no' answers a bot's open Block? only from a seat the question asks**: the current target of a directed action; the
  prey or the predator of an undirected one (or a seat that said "Hold on…"), the last of them closing it; the target of a directed
  action ends the window at once, another seat's hold or not (an answer, as the hold gate says). During a live block (a contest on
  the counter) a typed 'no' is no answer to the block: the verdict comes at the clock, or at once from the counter at a Turn-based
  table when the target is a human, as for the quick phrases. A bot's chat line "No votes from me." is no answer. Until now any seat's "no", "pass", "nej" or "through" closed the window at once. A LIVE test of yours
  that types "no" from a seat the question does not ask now sees the window wait for its clock.
- **The cards' printed conditions** (the compiler's tags; the bot reads each where it plays the card): Bonding's stealth only in a
  bleed and Forgotten Labyrinth's never in one; Instinctive Reaction only when a minion of the bot's predator acts; one On the Qui
  Vive per minion between its unlock phases; Apportation [tha] never presses to end, Disengage only ends; a card printed "Do not
  replace until …" holds its replacement: the bot's `draw` for Mirror Walk comes in its discard phase, for Wake with Evening's
  Freshness after its next unlock phase (with its master phase's draws), for Dodge after the combat. A new deal owes no draw.

## 3. Run here
On the release bytes (`elysium-bot.js` and `elysium-cardfx.json`: the sha256 in the PR body): your canary on `bot/`'s copies and
on the root's client (235/0 each), your client suite in a scratch copy of `client/` with this bundle beside it (380/1, the
guide's embed), the bot's suite, the hotseat gate, HB1, the sim footprint and the arena smoke (the PR body has the numbers). The
root is a byte copy of `bot/`'s bundle (your `check-versions.js` reads it).
