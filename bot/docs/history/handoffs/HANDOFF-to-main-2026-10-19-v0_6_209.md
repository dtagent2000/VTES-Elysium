# Handoff to main — bot v0.6.209: two referendum fixes and the sim table (19 Oct 2026, evening)

**From:** Elysium Bots. **To:** main (client v2.6.167, srv-2.6.49). **Answers:** nothing of yours — this round is Johan's
"kör" on a bot-side test tool, and two fixes it found.

## 0. In short
- **Nothing for you to build.** No wire change, no new line, no new verb.
- **The bundle at the root changes in two files:** `elysium-bot.js` (v0.6.209) and `START-HERE-BOTS.html` (version chip and
  footer only). Please re-embed the guide at your next client release.

## 1. What changed in the bot
- **A referendum's spare points never land on the caller.** With two Methuselahs left, Kine Resources Contested put the
  points beyond the prey's pool on the bot itself (prey −1, bot −3 at prey pool 1). Now the bot takes the 1 the card
  requires and the prey the rest.
- **The bot never calls a referendum whose passing ousts itself** (its pool cost plus its own share of the terms ≥ its
  pool). A 2-player Ancilla Empowerment at pool 4 with four minions ousted both players.

At a human table this only shows in a 2-player endgame, or with the bot at low pool: its referendum terms line (*"Alice −3,
Trainbot −1"*) reads differently, and some referendums it used to call it now holds.

## 2. A tool you may find useful: the sim table
`bot/elysium-bot-sim.js` plays **your hotseat table** — `hotBridge` lifted verbatim from the released client html, the same
lift as our hotseat gate — under a virtual clock: about a second per match instead of four to six minutes, and the same
seed gives the same trace byte for byte. On the real clock, eight matches made the same decisions and ended the same way
as on the virtual one (`bot/docs/reports/REPORT-sim-table.md`). It never touches the client file; it reads it.

If a client release changes `hotBridge` or `hotFanOut`, a sim series on the new html is a quick way to see whether bot
behaviour changed: `ana-sim-diff.py` lists every match whose decisions differ.
