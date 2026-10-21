# HANDOFF — bot v0.6.197 to main (11 Oct 2026): a new spoken line, a rebuilt TWD profile, two calibrated decisions

**From:** the bot project. **To:** main. **Follows** `HANDOFF-to-main-2026-10-10-v0_6_196.md` (and 9 Oct before it). If those haven't reached you, read them first; this one only adds. **No wire change.**

## 1. Deploy
- **`elysium-bot.js` v0.6.197** replaces v0.6.196 (or older) everywhere: bot processes and the hotseat bundle.
- **`elysium-twd-profile.json` and `elysium-twd-profile.js` — rebuilt, please deploy both** (and purge the cache for them).
  - Each card and clan now carries a fifth share, `press`. It is appended, and the first four shares are unchanged value for value.
  - An older bot reads the new file fine. v0.6.197 with the old file treats `press` as unknown.
- **Unchanged:** the cardfx files and the archetype files.
- **START-HERE-BOTS.html — re-issued, please embed this copy.** It adds the referendum line, the narrowed wave, how a block weighs its fight, and the footer.
- **Gates here:**
  - suite 1859/0;
  - canary 57/0 and hotseat 10/0 against v2.6.138, the newest client in this project;
  - test-cardfx 261/0.

  Please run your client suite and our canary with v0.6.197 beside v2.6.139.

## 2. A new spoken line
When a bot's own referendum passes and moves its pool, it says so on the chat tier, in the exact words voter bots already use:
- `I gain 3 pool from the referendum. Pool: 23.`
- `I lose 2 pool to the referendum. Pool: 18.`

**Where it comes:** right after "The referendum passes, 5 to 2." and before "It resolves".

**What it closes:** Johan's question about the four silent pool changes. The other three cannot happen with today's four starter decks: a political action's pool cost, an ally's pool cost, and a blocked action's returned pool cost.

Nothing to parse on your side. Online, your ledger line "pool X → Y" now has its reason beside it.

## 3. Two decisions now lean on the TWDA expectation (no client impact)
Both are on by default after a bench against a control.
- **The wave.** A Malkavian maneuvers to long only when the expected strike could torpor its vampire, or when one maneuver ends a dangerous fight because the opponent probably cannot press. Otherwise it keeps Swallowed by the Night for stealth.
- **The block.** A block with an intercept card weighs what the fight would cost the blocker against the bleed it stops.
  - In practice: a vampire with 0 blood lets a small bleed through, and against a hard-hitting deck a weak blocker stays back.
  - Bench data: 0-blood blockers went to torpor 75–95 % of the time.
  - A bleed that would oust the bot is still blocked whatever it costs.

## 4. Still open from 9 Oct
- **The ▶:** please step every rung that is not `release-hold` (filter, not allow-list).
- **Two labels for `BOT_STEP_LABEL`:** `'resolve-phase': 'Close step'` and `'resolve-vote': 'Close poll'`.
