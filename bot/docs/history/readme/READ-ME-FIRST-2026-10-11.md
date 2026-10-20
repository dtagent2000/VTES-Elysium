# Elysium Bots — delivery 11 October 2026: bot v0.6.196 → **v0.6.197** (the referendum line + the calibration) — DEPLOY CANDIDATE

**What it is.** Your go-ahead on the referendum line, together with the next step from the agreed order: the press share in the TWD profile plus the calibration of the block decision and the Malkavian wave against the expectation. All three are built, and both calibrated decisions are on by default after their benches.

## 1. The bot speaks its own referendum swing
- **When:** after "The referendum passes, 5 to 2." the caller says what the voter bots already say: *"I gain 3 pool from the referendum. Pool: 23."* (or *"I lose 2 pool to the referendum. Pool: 18."*).
- **Ledger:** the line is typed into the event log, so it is the ledger record itself — no double count.
- **The other three silent changes** cannot happen with today's four starters.

## 2. The press share
- **What:** the TWD profile has a fifth share per card and clan, `press` — cards with a press mode, or an ally that grants one, like Underbridge Stray.
- **Compatibility:** it is appended, so the first four shares are unchanged value for value, and an older bot reads the new file fine.
- **What the bot does with it:** estimates P(a seat can press) — 0.9 with a Stray on their board, otherwise from what they have shown over their hand.

## 3. The calibration (your ruling of 28 Sep: these are calibration, not new bricks)

**What the traces said** (72 matches: 1,842 blocks and 653 Malkavian combats):
- **The wave.** Swallowed by the Night went 50 times as a maneuver and 45 as stealth. Two thirds of the waves came at 4+ blood against a hand strike for 1.
- **The block.** A block with an intercept card never weighed the fight it buys. Torpor by the blocker's blood:

  | Blocker's blood | Against | Torpor |
  | --- | --- | --- |
  | 0 | any deck | 75–95 % |
  | 1 | Nosferatu | 50 % |
  | 1 | the others | 10–14 % |
  | 2 | Nosferatu | 35 % |
  | 4+ | any deck | ~1 % |

**`waveNarrow` — on.**
- **The rule:** the Malkavian waves only when the expected strike would torpor the vampire, or when one maneuver ends a dangerous fight because the opponent probably cannot press. Never against a seat that has shown a ranged strike.
- **Bench** (Malkavian pinned, 24 + 24): +1.36 against the control's +1.53, inside the noise.
- **Proof it fired:** 23 decisions. Maneuvers fell from 15 to 7.

**`blockCost` — on.**
- **The rule:** a block with an intercept card — a locked vampire raised by a wake included — weighs the expected cost of the fight against the bleed it stops (+0.5). The cost comes from a damage model fitted to the 1,842 blocks. It never applies when desperate.
- **The first arm was inert, found and fixed.** It vetoed nothing in 48 matches: the cost was never computed for a locked blocker, and a hunt counted as desperate at low pool.
- **Re-bench** (48 + 48): −0.11 against the control's +0.28. This is not a loss:
  - the same seeds with the rule inert (identical decisions) gave −0.09 against +0.20;
  - the active arm against the inert one, paired match by match, is −0.03 ± 0.43.
- **What changed in play:** 19 blocks let through, and the variant seat's torpors fell from 41 to 36.

## Open leads found on the way (not fixed; in `REPORT-bench-controls.md`)
1. **A late steal line.** If the steal line arrives after the victim's round has moved on, it can be lost (1–4 % of steals).
2. **Missed maneuver lines.** A maneuver line can miss the other bot's 200 ms window, so the two sides read different ranges (2–6 times per 48 matches).
3. **`ana-block`'s R6 count.** It is almost certainly the audit's own window; it is present in every recent series, the old control included.

## For main
- **Send `HANDOFF-to-main-2026-10-11-v0_6_197.md`.**
- If the 9 and 10 Oct handoffs haven't gone yet, send them first, in date order — each one only adds.
- **Deploy:** `elysium-bot.js` v0.6.197 plus the rebuilt `elysium-twd-profile.json` and `elysium-twd-profile.js`.
- No wire change.

## Gates
- suite **1859/0** (sections 133–136);
- canary 57/0 and hotseat 10/0 against v2.6.138;
- test-cardfx 261/0;
- no line over 4000 chars.

## Project files
- **Replace (or add if missing):**
  - `elysium-bot.js`, `elysium-bot-arena.js` (v1.4.7), `test-bot-logic.js`, `START-HERE-BOTS.html`;
  - `twd-profile.py`, `elysium-twd-profile.json`, `elysium-twd-profile.js`;
  - `elysium-bot-CHANGELOG.md`, `CLAUDE.md`, `elysium-bot-learnings.md`, `SKILLS.md`, `REPORT-bench-controls.md`, `elysium-bot-session-journal.md`, `elysium-bot-project-context.md`.
- **New:** `HANDOFF-to-main-2026-10-11-v0_6_197.md` · this file.

## Next, the agreed order
1. Main's test at a human table.
2. Personas per archetype.
3. The dynFloor follow-up arm.

The open leads above can go in between, whenever you want them.
