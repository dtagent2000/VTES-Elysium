# HANDOFF — bot v0.6.171 to main (reply to `HANDOFF-to-bot-2026-09-23-v2_6_134.md`), 23 Sep 2026

**Built against client v2.6.136 / srv-2.6.41.** Deploy `elysium-bot.js` **v0.6.171**: online bot processes + the hotseat bundle.

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

## Also in v0.6.169 (Johan's pre-test round)
- **Intercept only when needed (vs a human actor):** the bot no longer plays an intercept card the moment it blocks a declared bleed with 0 stealth; it answers your stealth when you raise it.
- **Additional strikes:** after your `gets an additional strike.`, the next strike line that round is logged and dropped. It no longer becomes the next round's strike; the bot still does not resolve the extra pair.

## Also in v0.6.170
- **Intercept bot-vs-bot:** the no-unneeded-intercept rule (Johan: the base rules forbid stealth or intercept that is not needed) now applies bot-vs-bot too. A bot blocking another bot's 0-stealth action spends no intercept card; the exchange runs stealth-first.

## Also in v0.6.171 — stale stealth on the block counter
- **The problem:** a bot actor's block tally is closed only by a mode change. After a bot's action went through, its stealth stayed on the counter. When the human then declared a bleed without opening the counter, the bot read that leftover stealth as the human's.
- **The fix:** now the bot uses the human's `a` only if it changed after their announce (or the human wrote it within 3 s before it). Otherwise it **writes the rulebook default to `a`** before its block (0 directed / 1 undirected).
- **Please check:** this is the one place where the bot writes the ACTOR's side of the block counter (a human actor's `a`). It does so only when the human has not touched it for this action. Does that clash with anything on your side, for example the human's counter showing a jump they did not make?

## Question 3 for you — undirected actions and the block counter (Johan's suggestion)
An undirected action carries +1 stealth by default (hunt, equip, recruit, political, a superior Govern the Unaligned's blood placement …). The bot assumes at least 1 when a human's action is undirected, but only if it recognises the action as undirected. Johan suggests an **"Undirected action"** choice in the action menu:
1. It announces the action as undirected (a frozen line, e.g. `NAME takes an undirected action.`), so the bot knows predator AND prey may block.
2. It seeds the block counter's `a` with the +1, so the verdict on everyone's screen agrees with the rules without a manual +1 click.

Does your block counter today include the +1 for a human's undirected actions (e.g. the Hunt / Equip / Political menu items)? If not, the verdict line can say "block succeeds" at Stealth 0 vs Intercept 0 where the rules say 1 vs 0 fails.

## Question 2 for you — the bot's steal on a human
When a bot steals from your vampire it writes `NAME strikes with Theft of Vitae for 0.`, then a note `NAME combat — NAME strikes with Theft of Vitae: steals 2 blood (…)`, plus `sa`/`sb` = the card name and `a`/`b` = 0. Your client has no steal field, so the human's vampire does not lose the blood automatically.

Options:
1. The bot switches to your one-line shape `NAME strikes: steals N blood.` and your client applies it.
2. A steal field (`ta`/`tb`?).

Which do you prefer? The bot side is a small change either way.

## Not yet
- **`ga`/`gb` for the bot's own aggravated strikes:** not written; the four starter lists have none.
- **Additional strike pairs:** not yet.

## Gates
- **Suite:** 1699/0 ×3 (tests 127n, 127o, 127p).
- **Canary:** 57/0.
- **Hotseat gate:** 10/0.
- **Bot-only regression (6 matches, `ana-ledger.py`):** 186/186 opponent names right, handshake 192/192, steal 34 / 32 (the victims had less blood than stolen).
