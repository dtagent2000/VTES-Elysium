# Handoff to main — bot v0.6.234 (18 Nov 2026): V5 wave 6b, Shadow Cloak and Absolute Tyranny

Built on bot v0.6.233 (#80) and your v2.6.175 / srv-2.6.51. The handoffs of v0.6.230–v0.6.233 are still open on your side; this
one adds the items below.

## 1. The bundle
`elysium-bot.js` (v0.6.234), `elysium-cardfx.json` / `.js` (213 curated: + Shadow Cloak, Sleep Unseen, Absolute Tyranny; the
compiler unchanged, v1.9.11) and `START-HERE-BOTS.html` (the chip and the footer only: version and counts). The TWD files and the
server are unchanged. Deploy: purge `/elysium-bot.js`, `/elysium-cardfx.json`, `/elysium-cardfx.js` and `/START-HERE-BOTS.html`.
If your embed test compares the whole page, re-embed it.

## 2. What changed (no protocol change; `log`, `chat`, `tally` as before)
- **Shadow Cloak [OBL]**: after a bot vampire's successful action the bot may put the card on it — a card with `host` / `attached`
  on its board, as any card on a vampire — and say so for the humans: `VAMP plays Shadow Cloak on itself — minions without Auspex
  cannot perform actions directed at it until NAME's next unlock phase.` In its unlock phase it burns the card: `NAME burns Shadow
  Cloak from VAMP (unlock phase).` The bots never rush a cloaked vampire — any seat's, a human's included, read from that seat's
  board — with a vampire that lacks Auspex. A human's rush at a cloaked bot vampire is not refused (a rider).
- **Absolute Tyranny [POT][PRE]**: in a bot-called referendum the bot caller cuts one vote off each voting vampire not on the Path
  of Power and the Inner Voice when it plays the card or reads a bot's line; a human whose votes it cuts is told in chat. A bot
  voter may play the card as a reaction: its +3 against (District's existing line and the tally's `b`), or the cut (the line below,
  and the vote tally's `a` lowered by it — what a human caller resolves from).

## 3. For §12 (your call; a machine-read line, `L12` in the bot)
- `VAMP plays CARD: vampires not on the Path of PATH get -1 vote.` (`tyranny`) — a bot caller cuts its count.
The cloak's two lines are for the humans (the bots read the board). The "-1" is an ASCII hyphen-minus; straight apostrophes, as
the other bot lines.

## 4. Run here
On the release bytes (`elysium-bot.js` sha256 `<release>`, `elysium-cardfx.json` `<release>`): see the PR body for the gate numbers
(your canary on `bot/`'s copies and on the root's client; your client suite in a scratch copy of `client/` with this bundle beside it;
the bot's suite ×3, the hotseat gate, HB1, the sim footprint, the arena smoke). The root is a byte copy of `bot/`'s bundle (your
`check-versions.js` reads it).
