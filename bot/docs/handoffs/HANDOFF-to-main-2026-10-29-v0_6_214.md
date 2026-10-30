# HANDOFF to main — 29 Oct 2026, bot v0.6.214 (V5 wave 2: before range, range and press)

Nothing to build: the bot ships first, backward compatible (the one rule). It writes no new grammar your client must read; one bot
line from v0.6.174 is now read by the bots and belongs in §12. The protocol in full: `bot/docs/specs/spec-v5-wave2-2026-10-29.md` §2.

## 1. What changed on the wire
- **Between two bots a maneuver can now be answered, either way and by either side.** The acting bot speaks first as before; the
  other bot answers as before — or, when the acting bot went long, with `NAME combat — VAMPIRE maneuvers to close (CARD).` (the chase
  decks: Nosferatu, Brujah, Gangrel, Tzimisce, Path of Caine). Each maneuver can be answered by the other side's: the acting bot
  counters to close when the answering bot went long (and it is a chase deck), or back to long when it wanted long; the answering bot
  meets those in its before-strikes wait and counters again or says `NAME combat — VAMPIRE does not maneuver.` (v0.6.202's line, now
  also the answer to a counter). When the acting bot lets the range stand it says nothing more — its before-strikes line follows.
  Every line is your §12 `NAME maneuvers to close|long.` with the bot's prefix and card. A round in which nobody counters sends
  exactly the lines it sent before. The answering bot writes `rng` on the tally again when a late counter changes the range
  (a watched duel's counter can show the range moving twice in one step).
- **Against a human nothing changed in the range step:** the bot maneuvers to long only and does not answer a human's maneuver yet
  (its BOARD).
- **Before range** a bot may play strength cards and Hunger of Marduk; each is a fx clone and an informational log line (no parser on
  your side): `VAMP gets a strength of N this combat — Torn Signpost [AT].` · `VAMP gets +1 strength this combat[, with 1 optional
  press] — Form of the Wolf / Monstrous Form [AT].` · `VAMP gets +N damage on its hand strikes this combat — Rage of Apedemak [AT].` ·
  `VAMP can steal N blood at any range with its strike this round — Hunger of Marduk [AT].` (deliberately never a `plays` line).
  The strike then rides your existing lines (`strikes with hands for N.`, `strikes: steals N blood.`).
- **Slam [POT]**'s maneuver to close is played in the range step (`maneuvers to close (Slam).`) and its strike follows as
  `strikes with Slam for N.` — one card, played once.
- **The tally's strike label** (`sa` / `sb`) of a round in which the bot gets no strike is `No strike` (the gun-under-Grapple round
  wrote `Hand` there since v0.6.174).

## 2. Ask: §12 and the canary
- **A bot line to add to §12's bot-emitted block** (sent since v0.6.174, never read by anyone until now): `NAME gets no strike this
  round (committed to CARD by its maneuver; REASON).` — REASON `Immortal Grapple` (a gun's maneuver, then a Grapple: v0.6.174) or
  `long range` (a hand strike's maneuver, Slam [POT], then a maneuver back to long: v0.6.214). It is that combatant's strike: nothing
  lands from it. From v0.6.214 the bots read it as the strike step's answer (they used to wait out the safety net and take the
  rulebook's 1). A canary case can feed it through `_onLog` and check `_oppStrike` (`dealt: 0`).
- **§12's line on the "nothing" lines** (bot-emitted block, `does not maneuver.` …) could say that in the maneuver step the bots go
  back and forth: a maneuver may be answered by a maneuver, and `does not maneuver.` also answers a counter.
- **Re-embed `START-HERE-BOTS.html`** (`node embed-help.js bot`) at your next release: its combat paragraphs changed again (cards
  before range, Slam, counters between bots; against a human the bot does not answer your maneuver yet). Still owed: the v0.6.213
  re-embed and the lines in `HANDOFF-to-main-2026-10-20-docs-diet.md` ("Owed to §12").

## 3. Question
Your watched-duel panel (a seated human who is not fighting) reads `rng` from the tally: between two bots the answering bot may now
write it twice in one step (after its own answer, and again after a late counter). We found nothing keyed on a single write, but you
own the panel — does a second `rng` in the same step mislead it?
