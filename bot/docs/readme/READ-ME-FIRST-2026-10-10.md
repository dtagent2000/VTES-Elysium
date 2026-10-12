# Elysium Bots — delivery 10 October 2026: bot v0.6.195 → **v0.6.196** (your three answers) — DEPLOY CANDIDATE

**What it is.** Your answers of 10 Oct: (1) combat ends by expected / statistical damage, (2) the damage step, (3) list the silent pool changes again. (1) and (2) are built. Two steal bugs found on the way are fixed. (3) is below and still needs your decision.

## 1. Combat ends by the opposing strike — knob `combatEndStats`, default 1 after the bench
- **Which strike it weighs.** KNOWN when they declared first. Your point: the acting side declares first, so a human acting has already answered "What is your strike?". Otherwise it is EXPECTED from the table model (TWDA-informed), and 0 at long range when no ranged strike has been shown.
- **Always played** against a strike that would torpor the vampire, and against an aggravated strike (or a seat that has shown one). **Never** against their dodge.
- **Otherwise it is a trade.**
  - The card's value now: what it saves (their damage + steal), +1 for the unlock at superior Presence, −1 for Majesty's own blood, minus what the bot's own strike would have done (half for a wave deck).
  - The card's value kept: 0.6 × the table's most dangerous expected strike, shared by the copies in hand.
  - The weights are judgment, not measurement.
- **Main's question** (Majesty against a hand strike for 1): it now usually holds the card.
- **Bench** (Ventrue pinned, 24 + 24 on the same seeds):
  - VP − table/4: **−0.11 ± 0.49** against the control's −0.12 ± 0.50 (6 vs 5 wins) — no loss.
  - The rule fired 98 times in 20 of 24 matches: held 68, played 30 (known 9, expected 14, torpor 7). The control played Majesty 49 times.
  - So: the same result with about 19 fewer Majesty spent per 24 matches.

## 2. The damage step — my recommendation, built
- **Nothing reaches the human's minion:** no wait, in every tempo, Turn-based included. That covers their dodge, the bot stealing instead of striking, and fists at long range — there is nothing to prevent.
- **Damage is coming:** 1 × the slider (was 2×) — 3 s at the seeded default. Carrion Crows counts as damage coming.
- A table with no botcfg is unchanged.

## Two steal bugs — rules corrections, no knob
- **A steal against the bot's vampire now waits for its own strike.**
  - Before: the blood was taken the moment the line arrived. If the bot then played Majesty or dodged, the blood was gone anyway. The old bench had 2 such rounds.
  - Found while pricing the steal into (1).
- **The bot's own steal takes at most what the target holds.**
  - Found verifying the first fix. Pairing each stealer row with its victim's row showed the stealer gaining the card's full 2 from a vampire holding 0 or 1. That was about one steal round in five, in every arm, since v0.6.19. The series totals had been explained away as "capping".
  - Now, against an empty vampire, the bot keeps Theft of Vitae and hits with its hands: 1 damage they cannot mend = torpor.
- **Verified at the bot table** (12 + 12 matches, seeds 9101–9112):
  - steal pairs 34 of 34 equal after the fix (34 + 8 off before);
  - 0 rounds where a vampire ended the combat or dodged and still lost blood;
  - handshake 490 of 491;
  - invariant flags at the control's level on the same seeds.

## 3. The four silent pool changes — your call
Read from the code:
1. a political action's pool cost at announce;
2. an ally recruit's pool cost;
3. a blocked action's returned pool cost;
4. the bot's own referendum swing — the pool its own passed referendum gives or takes.

**Only #4 can happen with today's four starters** (Ventrue). The result line prints the terms, but there is no "I gain N pool" line like a voter's. Online, the server ledger shows "pool X → Y" without a reason; offline, nothing at all.

**Should the bot print a line?** My suggestion is a voter-style line for #4 only: *"I gain 3 pool from the referendum. Pool: 23."*

## For main
- **Send `HANDOFF-to-main-2026-10-10-v0_6_196.md`.**
- If the 9 Oct handoff (`HANDOFF-to-main-2026-10-09-v0_6_195.md`) hasn't gone yet, send both, 9 Oct first — the new one only adds.
- No wire change. START-HERE-BOTS.html is re-issued (combat ends, the damage step, the footer).

## Gates and deploy
- **Gates:**
  - suite **1838/0** (sections 129–132; the 131 and 132 batteries fail on the old bytes);
  - canary 57/0 and hotseat 10/0 against v2.6.138, the newest client in this project;
  - test-cardfx 261/0;
  - no line over 4000 chars.
- **Deploy:** `elysium-bot.js` v0.6.196. The cardfx, TWD JSON files and their `.js` twins are unchanged since v0.6.195.

## Project files
- **Replace (or add if missing):** `elysium-bot.js` · `elysium-bot-arena.js` (v1.4.6, whitelists the knob) · `test-bot-logic.js` · `START-HERE-BOTS.html` · `ana-ledger.py` (now pairs steal rows) · `elysium-bot-CHANGELOG.md` · `CLAUDE.md` · `elysium-bot-learnings.md` · `SKILLS.md` · `REPORT-bench-controls.md` · `elysium-bot-session-journal.md` · `elysium-bot-project-context.md`.
- **New:** `HANDOFF-to-main-2026-10-10-v0_6_196.md` · this file.

## Next, unchanged order
1. Main's test of v0.6.195/196 at a human table: Standard 3 s first, then Adaptive, then Turn-based, with `ana-wait.py` on the bot log of each.
2. The press feature in the TWD profile, plus calibration of the block decision and the Malkavian wave against the expectation.
3. Personas per archetype.
4. The dynFloor follow-up arm.
