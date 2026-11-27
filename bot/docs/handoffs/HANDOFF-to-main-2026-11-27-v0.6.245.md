# Handoff to main — bot v0.6.245 (27 Nov 2026): one block attempt at a time

The sweep register's 11.11 (bot RULINGS D-149), from the C1b playtest at your rig: two bots blocked one human action (two combats),
and a human prey's Pass inside the human's own attempt let a bot predator attempt over it. Built on main `60c59e8`. No wire change
and no frozen line: the 240-match sim is IDENTICAL to v0.6.244's with the version put back (every changed path needs a human).

## 1. The bundle
- `elysium-bot.js`: the bot (the CHANGELOG's v0.6.245 entry; the round's report `bot/docs/reports/REPORT-11-11-2026-11-27.md`).
- `START-HERE-BOTS.html`: the version chip and the footer; the phrase table's **No** row (it now answers a bot's Block? too), the
  undirected paragraph (the prey blocks first, the predator once the prey has declined; one block attempt stands at a time) and the
  political-action row of the action-menu table (the pool question, then the prey first).
- cardfx and the TWD files are unchanged. Deploy: purge `/elysium-bot.js` (what the box serves).

## 2. What a human at your table now sees
- At a human's undirected action (the pool question's window too) the predator bot stays silent until the prey has declined; its
  panel row reads "reacting to <actor>" with no countdown meanwhile, as it already did for the bots' own undirected lines.
- At a bot's undirected action a human blocker's **Pass** inside the human's own attempt declares that attempt's verdict from the
  counter (at once in Turn-based), and a second attempt while one stands is not taken up: a human who tries gets one chat line,
  `Trainbot: <minion>’s block attempt is still standing — one block attempt at a time.` (a chat instruction no bot parses, not a §12
  line).
- A human's quick **No** answers a bot's block question.
- The turn-end note says nothing for an action with no pool at stake for the bot, and otherwise names it: `Note: <who>’s action
  (<card>) was still unresolved when the turn ended, with N pool at stake for me — if it cost me pool, tell me "bleed N".`
  ("referendum" and "vote N" for a political action; "@<bot> bleed N" when the actor is not that bot's predator, as the damage
  grammar needs). A human who never says It resolves and starts the next action with "Any blocks?" gets the same note at once
  for the record it ends, when pool was at stake (`Note: an unresolved bleed at me was overtaken by <who>’s next action — if it
  landed, tell me "bleed N".`; "…was still unresolved when their next action began…" for another action).

## 3. Asks
1. Re-embed the guide (your embed test compares the whole of it); the v0.6.244 handoff's re-embed is folded into this one.
