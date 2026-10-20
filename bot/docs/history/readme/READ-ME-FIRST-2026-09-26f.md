# Elysium Bots — delivery 26 September 2026 (f): bot v0.6.181 → **v0.6.182 PHASE B step 2** — DEPLOY CANDIDATE

## What changed
**The combat opponent's name now lives in one combat episode (`_cep`).**
- The episode opens when the combat starts and closes when it ends.
- It replaces three loose fields, each with its own reset: `_combatOppName`, `_rowOpp` and `_learnedOpp`. They remain as views of the episode, so the tests are unchanged.
- Every name the episode takes is written to the event log as a `combat-opp` event: start, learned, armed, end.

**The strike-vs-taken check now reads "Combat ends — Majesty." correctly.**
- That line names no vampire, so the check never saw it.
- It now counts from the opponent's seat.

## Caught before delivery
The suite caught two slips of my own:
- A trailing `//` comment swallowed two resets.
- The same slip in a later fix gave a syntax error.

The lesson is recorded in learnings: use block comments mid-line.

## Verified on the final bytes
- Suite: 1731/0 ×3
- Canary: 57/0
- Hotseat: 10/0
- Bot-only series pb3 (3 matches):
  - handshake 80/80
  - names 80/80
  - steal 13 / 13
  - invariant flags 5 (small residuals)

## Deploy
`elysium-bot.js` (v0.6.182).

**Replace:**
- `elysium-bot.js`
- `elysium-bot-CHANGELOG.md`
- `elysium-bot-learnings.md`
- `CLAUDE.md`
