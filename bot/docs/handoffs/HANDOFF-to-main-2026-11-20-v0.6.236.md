# Handoff to main — bot v0.6.236 (20 Nov 2026): the Banu Haqim pilot's lines (executor B1; B2 appends its own)

Built on bot v0.6.235 (`65eab87`) and your v2.6.179 / srv-2.6.51, with cardfx v1.11.0 (spec-sweep-pilot-2026-11-20.md §3.1).
No new verb, field or wire shape: `log`, `chat`, `say`, `tally` as before. What is new is one frozen bot line OPENED (the rush line
takes any rush card and the level it was played at) and the card a few existing shapes now name. The bot ships first: backward
compatible (below). Your §12 and canary would record the lines in section 1; nothing in the client has to change.

## 1. The lines (bot grammar; each is parsed by the bot and typed by its event log in the same release)
- **The rush line, opened** (`L12.havenRush`, sent on the log tier): `VAMP enters combat with NAME's VAMP (CARD [LVL]).` — until
  now CARD was one of four cards in play (Haven Uncovered, Saulot's Avenging Fist, Regent, Frontal Assault); now it is also any
  rush card played from the hand, every one but Deep Song (Hunter's Mark, Fleetness, Ambush, Bum's Rush, Line Brawl, Sense Death,
  Taunt the Caged Beast, Umbrous Clutch, Nose of the Hound, Hunting the Beast, Charge of the Buffalo), with the level it was played
  at as your play line prints it, one bracket per discipline of the mode: `(Hunter's Mark [CEL][THA])`, `(Hunter's Mark [cel][tha])`,
  `(Fleetness [CEL])`, `(Sense Death [ani])`; a card with no level has none: `(Ambush)`. The regex: `m[4]` the card (no parenthesis
  or bracket in it), `m[5]` the level (absent when none) — `m[1]`–`m[4]` read as before, so a vampire named `… (ADV)` still splits.
  Terms as Haven's: a directed action the target's Methuselah may block; on through the target does NOT lock and the rusher is the
  acting minion. The card goes to the ash heap blocked or through. The stealth on the counter is the card's printed `+N stealth
  action` (Fleetness, Sense Death, Umbrous Clutch … +1; Hunter's Mark 0).
- **Its Block? (chat, a question to a human)**: `… VAMP enters combat with VAMP (CARD [LVL], +N stealth). Block?` (the bot's chat
  prefix as before) — Haven's shape with the card. Deep Song keeps its own line and ask (`VAMP plays Deep Song [ANI] — rushes NAME's VAMP.` /
  `… rushes VAMP (Deep Song [ANI]). Block?`), byte for byte.
- **The combat notes of that rush** (existing log-tier shapes, any card now): `VAMP defends (rushed by VAMP, CARD [LVL]).` (the
  rushed bot) and `Combat begins: VAMP against VAMP (CARD [LVL]).` (the rusher).
- **A granted maneuver / press names its card** (the frozen combat shapes your §12 already lists, `… maneuvers to close|long.` /
  `… presses to continue|end.`; the parenthesis is the one Mob Connections' press already uses):
  `NAME combat — VAMP maneuvers to long (Fleetness).` (the rush card's 'gets 1 optional maneuver during that combat'),
  `NAME combat — VAMP presses to continue (Hunter's Mark).` (its press), and
  `NAME combat — VAMP maneuvers to close (Biothaumaturgic Experiment).` (a card on the vampire: 'gets 1 optional maneuver each
  combat'; the card is put on the minion by B2's attach finder). A granted press to end writes the existing
  `… presses to end: the press to continue is cancelled.` (no card).
- **Night Terrors [OBF][PRE]'s strike** writes the existing lines: `VAMP strikes: combat ends.` then `Combat ends — Night Terrors.`
  (`L12.strikeEnds`, `L12.combatEnds`) — the blocker's free strike in the first round of the combat its block began.
- **Blood Rage-class against a weapon** writes no new line: the struck bot's own round line says `… takes 0 (loses 0 blood, now M).`
  when its undodged Blood Rage, Blood Fury, Bollix [tha] or Soul Burn met the opposing vampire's weapon strike that round (a bot's
  `strikes with CARD for N.` naming an equipment card, or your `NAME strikes with a weapon for N.`).

## 2. Backward compatibility (the bot ships first)
The client parses none of these lines: it shows them. Every bot at a table comes from one bundle, so the opened line meets a bot
that reads it. A bot older than v0.6.236 (a command-line debug bot) does not match `(Hunter's Mark [CEL][THA])` with its closed
list: it opens no window and its vampire does not fight — the rusher's Block? runs its clock and the rusher's combat waits out its
safety nets. That is a mixed-version table only.

## 3. What your §12 and canary would record (a suggestion; the bot does not need it to run)
- §12: the rush line's opened form with one example per shape: `VAMP enters combat with NAME's VAMP (Hunter's Mark [CEL][THA]).`
  and `(Ambush).`; the combat notes' `(CARD [LVL])`; the granted maneuver / press lines naming the card (with Mob Connections').
- Canary: `rd('havenRush', "Gilbert enters combat with Bot's Sully (Hunter's Mark [CEL][THA]).", ['Gilbert', 'Bot', 'Sully',
  "Hunter's Mark", '[CEL][THA]'], 'a rush card and its level')`; the four granting cards still read with `m[5]` undefined; a live
  bot rushed by `(Hunter's Mark [CEL][THA])` with another unlocked minion opens its window with `via 'card'`, `card "Hunter's
  Mark"`, `lvl '[CEL][THA]'`, `ceBan 'r1'`, `noLock`, `targetActs false`; with nobody else to block it says Pass and fights unlocked.
  The bot's section 181 has these cases (181b).

## 4. Run here
The bot's gates on these bytes (the PR body has the numbers): its suite, your canary on `bot/`'s copies and on the root's client,
`test-cardfx`, and the 240-match sim footprint against v0.6.235 (IDENTICAL: none of the four starters' plays changed).
