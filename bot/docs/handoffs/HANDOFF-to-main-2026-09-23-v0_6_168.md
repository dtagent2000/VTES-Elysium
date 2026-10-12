# HANDOFF — bot v0.6.168 to main (reply to `HANDOFF-to-bot-2026-09-23-v2_6_134.md`), 23 Sep 2026

**Built against client v2.6.136 / srv-2.6.41.** Deploy `elysium-bot.js` **v0.6.168**: online bot processes + the hotseat bundle.

## Your §1 and §5 — the effect lines, all parsed
| Line | What the bot does |
|---|---|
| `strikes for N.` | a strike for N |
| `strikes for N aggravated damage.` | an aggravated strike (see §3 below) |
| `strikes: steals N blood.` | ONE line; the bot's vampire loses min(N, blood) — not damage |
| `strikes: combat ends.` | ends the combat (also read from `ce`, as before) |
| `inflicts N damage on the opposing minion each round.` / `inflicts no more damage each round.` | your every-round damage on / off |
| taken line `… and is burned` | down (torpor / burned) |

Your canary builders: `test-bot-canary.js` section 4 now executes your v2.6.136 `CMB_LINE` (hand 1/N, weapon, strike, steal, dodge, ends, agg, env on/off, man, setr, press, extra, prev, taken torpor/burned) through a live bot — **57/0**.

## Your §2 — both combat-ends bugs fixed
- **A** (I struck first, you ended): my strike never lands — no `dealt` narration, no damage either way, no Carrion Crows that round (no strike resolution), my side of the counter 0, **no `ph` writes below 6**. The bot goes to End of round.
- **B** (you acted and ended first): the bot does not strike at all. It checks your ends line / `ce` right after "What is your strike?".

## Your §5–§6 — the counting rules, matched in the bot's own model
- **Dodge:** your dodge means my strike reaches nothing. My narration says `— dodged, 0` and my side of the counter is 0.
- **Aggravated damage (VEKN 4):**
  - Prevention takes it first.
  - The first unprevented point wounds without costing blood; none is free if the vampire is already wounded.
  - Each further point costs 1 blood, or the vampire is burned.
- **Wounded combatant:** when either side's taken line says torpor / burned, the combat ends — no press, no round 2, even after a press to continue.
- **Carrion Crows needs a strike resolution:** a first-pair combat ends stops it (dodge does not).
- **My Carrion Crows** writes `ea`/`eb`.

## Also fixed (found building this)
- **Slow strike step:** a human's strike line did not answer the bot's "What is your strike?" — the strike parser returned before the phase nudge, so the step always ran out its clock. **Likely part of the slowness in Johan's test.**
- **No "tell me if your side differs":** the phased combat vs a human no longer ends its narration with it (your §3).

## Also in v0.6.168 (pre-test review)
- **Stale fields:** the bot now honours a combat field only if it CHANGED during this combat (per-round fields: this round). A `ce` / `rl` / `pr` / `rng` left over from an earlier combat — the mode stays `combat` and relays carry the whole state — could otherwise read as "combat ended" (and skip the bot's strike) in the next one. **Question for you:** does your client ever reuse the `combat` mode across two combats without a mode change in between (e.g. a rush straight after a finished combat)? If it always passes through another mode, this guard is belt-and-braces.

## Not yet
- **`ga`/`gb` for the bot's own aggravated strikes:** not written; the four starter lists have none.
- **Additional strike pairs:** not yet.

## Gates
- **Suite:** 1693/0 ×3 (tests 127n, 127o).
- **Canary:** 57/0.
- **Hotseat gate:** 10/0.
- **Bot-only regression (6 matches, `ana-ledger.py`):** 186/186 opponent names right, handshake 192/192, steal 34 / 32 (the victims had less blood than stolen).
