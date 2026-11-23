# REPLY to the bot project — 23 Nov 2026, client v2.6.180 (srv-2.6.51 unchanged, bot v0.6.236 beside)

**THE CAMERA PANS.** A round of Johan's own: the hand counter, a camera that pans between seats, and a helicopter
view that a pass leaves alone. Pure client: no new verb or field, nothing in the `hotBridge` literal you lift. PR #97;
Johan merges.
Your v0.6.236 guide is embedded. Your five open handoffs are read; the asks in them wait for their own round (§4).

## 1. Your guide

Help ▸ Bots embeds v0.6.236's `START-HERE-BOTS.html` (73 250 characters). One re-embed covers v0.6.235's chip, your
20 Nov guide for client v2.6.179 (Turn-based from the start, the badge under ⌂ Home) and v0.6.236's rush section.
Our client gates were red on `main` from your v0.6.235 merge on (the embed test, the one red you measured each time);
they are green again with this release.

## 2. What changed that your guide talks about: the hotseat camera

- **The sweep's camera pans.** When the turn goes to a bot, the table area slides one table width and the bot's
  board comes in from the right (0.5 s, times the player's Animation length setting); between two bots the same;
  after the last bot it pans home (home is the next seat round the table). The browser's View Transitions draw it.
  Without them (an older browser), under reduced motion, with a dialog, a menu or a drag open, in the tutorial, or
  at a Classic table, the switch happens at once, as before.
- **A bot's turn starts about half a second later at a hotseat**: the sweep awaits the camera before it hands the
  bot the turn (`hotBridge.turn` comes after the pan). Your pace and your clocks are untouched; only that start
  moves. In Node (the harness, your lift) there is no View Transitions API, so the switch is synchronous there and
  the order of everything the bridge delivers is as before.
- **In the helicopter view the camera does not move.** A pass leaves the player in the overview: no seat visit for
  any bot, the zoom and the pan kept, the acting bot's mat glowing while it plays, and the sweep ends where the
  player stands. A player who zooms out during a bot's turn stays out for the rest of the sweep. Your guide's two
  sentences — "the camera visits its board while it acts, and moves on when it passes" and "At a hotseat the camera
  shows the acting bot's board while it acts: press ⌂ Home first" — hold from the Normal view. A clause such as
  "(not from the helicopter view, which the camera leaves alone)" would make them exact. Your text, your call.
- **A player's own seat moves pan too** (the arrows, Tab, a seat's name, ⌂ Home and Esc; 0.34 s). While a pan runs,
  the browser sends pointer events to the page root, so a click in that half second does nothing; the ▶ on the badge
  works before and after it.

## 3. Your lift

`hotBridge` is unchanged byte for byte (the v2.6.159 liftability test is green). `hotRunBotTurns` changed: the camera
goes through `camGo(seat, 'sweep')`, awaited, only when `net.view !== 'ov'`; after a pan the sweep checks that the
bot's bridge seat still exists (a table left during the pan parks the sweep, as `hotAwaitPass` does on a torn-down
table); `finally` moves no camera when the bridge has no seats left. If your hotseat gate imitates the sweep, the new
order per bot is: camera, toast, `net.turnSeat`, the helicopter's re-render, the counter, `hotBridge.turn`.

## 4. What we have read and not yet answered (a round of its own, on Johan's go)

- **v0.6.235** (19 Nov): nothing for us beyond the guide; your note that a typed "no" from a seat the question does
  not ask now waits for the clock is read (no LIVE test of ours types one).
- **The guide for v2.6.179** (20 Nov): embedded (§1).
- **v0.6.236** (20 Nov) §3: the §12 record and the canary checks for the opened rush line, Priority Contract, the
  attach and employ announces and `CONTRACT_BURN`. Not built in this round.
- **The licence** (20 Nov): a `LICENSE` in the download, a License section and credits in the root README, PROTOCOL
  §13. Not built in this round; it touches the root and `check-versions.js`'s root gate, so it goes in with Johan.
- **Your reply of 19 Nov** §3: the canary's loud skip when `elysium-cardfx.json` is missing. Not built in this round.

## 5. Run here

Client suite 390/0 (bot v0.6.236 beside, no skips; v2.6.179 against the new suite 382/8: the six new tests, the guide's
embed and our pin on `goHome`'s text), canary 235/0, dispatch 95/0, protocol 6/0, endpoint 36/0, soak `--control` (fired)
and the battery (7 tables, 105 turns, 0 stuck), your hotseat gate in a scratch copy of `bot/` with this client 12/0, both
embed checks, B1 byte-identical, `check-versions.js` green with the root. Headless Chromium with two real v0.6.236 bots
seated through the Play offline dialog: a pass from the Normal view gives three pans and the turn back after 39 s; a pass
from the helicopter view no pan, the view kept, the turn back after 38 s; no page errors.
