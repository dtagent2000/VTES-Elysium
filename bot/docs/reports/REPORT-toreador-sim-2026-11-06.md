# Toreador at the sim table — does it hold up? (6 Nov 2026, bot v0.6.217, sim v1.1.0)

**Question** (STATUS Next 1, Johan's go of 6 Nov): does the Toreador precon hold up beside the four starters, i.e. does it sit
inside the starters' span on VP and win share, so that it can join the client's menu (D-98: "a deck joins the menu when its rows are
playable and it holds up in the sim")? Every Toreador row is playable since v0.6.217 (`CARDS.md`; Creepshow Casino `unseen` in the
12-match smoke). The menu decision is Johan's; this report only reads the table. No bot change.

**Design.** `elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue,toreador --seatings all --seeds 2`: every seating of the
five decks (120 = every cyclic order × every starting seat) × deals 1–2 = **240 matches** at a five-seat table, the client profile
(paceMs 3100, askSecs 20, deckName) under the virtual clock, all seats expert, start pool 30. The starters are embedded in the bot;
toreador plays `deck-toreador.json` (`gen-precon.js`).

**Read (fixed before measuring).** Per deck VP/match ± SE and win share ± SE (binomial) over its 240 seats; the starters' span is
[lowest starter, highest starter] in this same run. The claim is read PAIRED: in every match all five decks sit at one table with one
deal, so per match Toreador's VP minus each starter's VP, the mean with its paired SE (and the same for wins). Toreador is *inside* the
span when its difference to the lowest starter is not significantly below 0 and its difference to the highest is not significantly
above 0 (95 %); *below* or *above* when the interval lies wholly on one side.

**Prediction, registered before measuring (6 Nov, 10:13, no trace of this design read; D-93):**
- *The run:* 240 matches, all last-standing; no stuck or crashed match; played at 0 pool 0.
- *The starters keep their four-seat order* (`REPORT-sim-table.md` §3: malkavian > ventrue > tremere > nosferatu by VP/match).
- *Toreador inside the span:* VP/match 0.5–0.9 (wave 4's 48-match smoke: 0.67, 6 wins), above nosferatu and below ventrue; win share
  8–17 % (a fifth of the table is 20 %).
- *Its cards:* the Ball played with its pair in many Toreador matches and its bar never before a bleed; Change of Target played;
  Toreador Justicar's title taken; Creepshow Casino (unseen in the smoke) played at least once.
- *Audits:* ana-block 0 violations; ana-ledger no `VANISHED` and no `UNEXPLAINED`; ana-inv no new flag kind; handshake integrity
  100 % (ana-combat2). ana-windows' ran-out count is the sim's known measurement debt (BOARD), recorded, not a gate here.
- *Falsified if:* Toreador's interval against the lowest starter lies wholly below 0, or against the highest wholly above 0 (the
  prediction fails, not the deck); a stuck or crashed match; a play at 0 pool; a block violation; a Ball bar before a bleed.
