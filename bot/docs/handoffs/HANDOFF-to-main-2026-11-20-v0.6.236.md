# Handoff to main — bot v0.6.236 (20 Nov 2026): the Banu Haqim pilot's lines

Built on bot v0.6.235 (`65eab87`) and your v2.6.179 / srv-2.6.51, with cardfx v1.11.4 (spec-sweep-pilot-2026-11-20.md §3.1, §6).
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
  The card group refuses a crypt group suffix (`G5`, `G2 ADV`, `ANY`; the pilot's review, K6): Yawp Court's own line `ME locks Yawp
  Court — SABBAT (G6) enters combat with NAME's VAMP (G5).` is no rush line (with the client's real names the opened regex read it as a
  rush with the card `G5`; `L12.yawp` is still tried first, in the bot's `_onLog` and `_evClassify`).
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
  combat'; the card is put on the minion by the attach finder, below). A granted press to end writes the existing
  `… presses to end: the press to continue is cancelled.` (no card).
- **A rush at a locked minion that fizzles** (the pilot's review, K5; [ANK 20210124]: Fleetness [CEL], Ambush, Nose of the Hound — the
  target unlocked before the unblocked action resolved): the rusher writes an explanation on the log tier, `Trainbot: CARD has no
  effect: VAMP is not locked as it resolves (no combat).` (not parsed: the rushed bot reads its own vampire at its comply); no combat.
- **A human target of Hunter's Mark [CEL][THA]** (the pilot's review, K3) is told, on through, in a chat instruction (the tier rule;
  One With the Land's precedent): `OWNER: Hunter's Mark [CEL][THA] — VAMP cannot strike: combat ends in the first round of this combat.`
- **Night Terrors [OBF][PRE]'s strike** writes the existing lines: `VAMP strikes: combat ends.` then `Combat ends — Night Terrors.`
  (`L12.strikeEnds`, `L12.combatEnds`) — the blocker's free strike in the first round of the combat its block began.
- **Blood Rage-class against a weapon** writes no new line: the struck bot's own round line says `… takes 0 (loses 0 blood, now M).`
  when its undodged Blood Rage, Blood Fury, Bollix [tha] or Soul Burn met the opposing vampire's weapon strike that round (a bot's
  `strikes with CARD for N.` naming an equipment card, or your `NAME strikes with a weapon for N.`).
- **The masters' and the action side's lines** (spec-sweep-pilot §3.2 items 4, 6, 8; each parsed by the bot and typed by its event log in the same release):
  - **Priority Contract placed** (new, `L12.contractM`, log tier, after the existing as-played line `ME is playing Priority Contract —
    on OWNER's HOST.`): `ME plays Priority Contract — on OWNER's HOST, chosen: VAMP.` — `m[1]` the Methuselah, `m[2]` the card,
    `m[3]` the host's owner (always the placer's prey), `m[4]` the host, `m[5]` the chosen Banu Haqim (only it may enter combat with the
    host through the card). Haven Uncovered keeps its own line (`L12.havenM`) byte for byte. Every bot records it; the host's owner
    reads the chosen as a rush its cloak may stop.
  - **The rush through it** is the opened rush line with a card in play: `VAMP enters combat with OWNER's HOST (Priority Contract).` (no
    level), its Block? `… enters combat with HOST (Priority Contract, +1 stealth). Block?`; terms as Haven's (the host does not lock,
    the rusher acts); the rushed bot's notes name it (`… defends (rushed by VAMP, Priority Contract).`).
  - **Priority Contract burned for its pool** (new, `CONTRACT_BURN`, a log-tier explanation, not in `L12`): `ME burns Priority Contract
    and gains 3 pool (WHY).` — WHY is `OWNER's HOST went to torpor` / `OWNER's HOST was burned` / `OWNER's HOST left the ready
    region` / `HOST left the game with OWNER`. The card's move and the pool show on the board (your ledger narrates them online); the
    line says why. Read by the bot's event log (kind `contract-burn`) and by every other bot's `_onLog`, which ends its record of
    that contract (the pilot's review, P2).
  - **A card put on a minion** (new, `L12.uAttach`, an undirected announce: the actor's prey and predator may block):
    `VAMP plays CARD [LVL] — on HOST.` (`on themselves` for the acting vampire) — Biothaumaturgic Experiment [THA], Shadow of the Beast
    [pro], New Moon Sigil [spi]; its Block? `… plays CARD [LVL] — on HOST (+N stealth). Block?`. Preternatural Strength keeps
    `VAMP plays Preternatural Strength [pot] — on themselves (+1 strength).` (`L12.uStrength`, read first).
  - **Biothaumaturgic Experiment [tha]'s employ** (new, `L12.uEmployVia`, an undirected announce): `VAMP plays Biothaumaturgic
    Experiment [tha] — employs RETAINER.` (an animal retainer employed ignoring requirements); its Block? `… plays Biothaumaturgic
    Experiment [tha] — employs RETAINER (+1 stealth). Block?`. Read before `L12.uEquip` (which would take `VAMP plays … —` as the
    vampire).
  - The `… maneuvers to DIR (Biothaumaturgic Experiment).` above is reached in play: the attach puts the card on the minion.

## 2. Backward compatibility (the bot ships first)
The client parses none of these lines: it shows them. Every bot at a table comes from one bundle, so the opened line meets a bot
that reads it. A bot older than v0.6.236 (a command-line debug bot) does not match `(Hunter's Mark [CEL][THA])` with its closed
list: it opens no window and its vampire does not fight — the rusher's Block? runs its clock and the rusher's combat waits out its
safety nets. That is a mixed-version table only. The masters' and the action side's lines the same way: an older bot records no Priority Contract (its cloak
does not see the chosen coming), and opens no block window on `… — on HOST.` or `… — employs RETAINER.` (its `L12.uEquip` takes
`VAMP plays Biothaumaturgic Experiment [tha] —` as the vampire, which names no minion on the actor's board: no window) -- the actor's
Block? runs its clock. The contract's own rush line, `VAMP enters combat with OWNER's HOST (Priority Contract).`, is the opened line
with a fifth card in play: a v0.6.235 bot's `L12.havenRush` knows four (Haven Uncovered, Saulot's Avenging Fist, Regent, Frontal
Assault), so it does not match it either -- the host's bot opens no window and its host does not fight, the rusher's Block? runs its
clock and its combat waits out its safety nets (the pilot's review, P9). A mixed-version table only, as above.

## 3. What your §12 and canary would record (a suggestion; the bot does not need it to run)
- §12: the rush line's opened form with one example per shape: `VAMP enters combat with NAME's VAMP (Hunter's Mark [CEL][THA]).`
  and `(Ambush).`; the combat notes' `(CARD [LVL])`; the granted maneuver / press lines naming the card (with Mob Connections').
- Canary: `rd('havenRush', "Gilbert enters combat with Bot's Sully (Hunter's Mark [CEL][THA]).", ['Gilbert', 'Bot', 'Sully',
  "Hunter's Mark", '[CEL][THA]'], 'a rush card and its level')`; the four granting cards still read with `m[5]` undefined; a live
  bot rushed by `(Hunter's Mark [CEL][THA])` with another unlocked minion opens its window with `via 'card'`, `card "Hunter's
  Mark"`, `lvl '[CEL][THA]'`, `ceBan 'r1'`, `noLock`, `targetActs false`; with nobody else to block it says Pass and fights unlocked.
  The bot's section 181 has these cases (181b).
- The masters' and the action side's (section 182b, 182c, 182f, 182g, 182h has them): §12 the three new shapes and the explanation; canary `rd('contractM',
  "Hanna plays Priority Contract — on Viktor's Anxo Vilela (G6), chosen: Kasim Bayar (G6).", ['Hanna', 'Priority Contract', 'Viktor',
  'Anxo Vilela (G6)', 'Kasim Bayar (G6)'])` with a live bot that records the contract and its chosen; `uAttach` on `Kasim Bayar (G6)
  plays Biothaumaturgic Experiment [THA] — on Bijou (G6).` (m[3] `THA`, m[4] `Bijou (G6)`) with a live bot of the actor's prey opening
  its undirected window, and Preternatural Strength's line still read by `uStrength`, not `uAttach`; `uEmployVia` on `Kasim Bayar (G6)
  plays Biothaumaturgic Experiment [tha] — employs Dog Pack.` (m[4] `Dog Pack`), the prey's window weighing Dog Pack.
  `CONTRACT_BURN` on `Hanna burns Priority Contract and gains 3 pool (Viktor's Anxo Vilela (G6) went to torpor).` (m[1] `Hanna`,
  m[2] `Priority Contract`, m[3] `3`, m[4] the why), with a live observer whose record of the contract ends.

## 4. Run here
The bot's gates on these bytes (the PR body has the numbers): its suite, your canary on `bot/`'s copies and on the root's client,
`test-cardfx`, your client suite beside the bundle (red once by design: `START-HERE-BOTS.html` changed, so its embed wants
re-embedding), and the 240-match sim footprint against v0.6.235 (the version normalized): DIVERGED 14, SAME-PLAY 5, IDENTICAL 221.
None of the pilot's new lines appears there (no starter holds its cards); every difference is a rules correction the round found
(RULINGS R-46): Aunt Linda (Nosferatu, no Animalism) no longer employs Raven Spy or Murder of Crows, and a card's discipline is asked
of a mode with no level (two drain decisions' context in one match). No line changed shape for them.
- The guide (`START-HERE-BOTS.html`): the rush section says the bots play their own rush cards (yours still go by `rush` in chat), and
  a paragraph under "Where its understanding ends" shows Priority Contract's placement, rush and burn lines, a rush card's line with
  its level, Hunter's Mark's chat and the line for a card put on a vampire.
