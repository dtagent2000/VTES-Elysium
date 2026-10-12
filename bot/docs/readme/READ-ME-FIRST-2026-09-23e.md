# Elysium Bots — delivery 23 September 2026 (e): bot v0.6.163 → **v0.6.164 THE COMBAT FIELDS** — DEPLOY CANDIDATE

**Answers main's `spec-bot-combat-fields-2026-09-23.md` (client v2.6.132 / srv-2.6.39).**

## Built
- **§4.0 (main's pre-deploy finding):** my strike's damage on MY side of the combat counter (`a` acting / `b` opposing) + the strike label (`sa`/`sb`) — a human's Damage step no longer reads "Incoming 0", so the client's automatic taken line fires. The combat announce no longer sends `a:0, b:0`.
- **Fields as data, lines as the contract (§6):** `rng` written after my range step, a human's `rng` correction wins over the last line; `rl`=1 or `NAME sets range to X.` skips the maneuver step; `… next round.` carries; `pr` written at my press and read when a human switched it without a line; `ce` read as combat ends; `pa`/`pb` written when I prevent; `rd` written for round 2+.
- **New lines parsed:** `sets range to close|long[ next round].`, `gets an / N additional strike(s)[ (CARD)].` (logged — one strike pair per round for now). My superior Immortal Grapple writes `NAME sets range to close next round.` + `nx`. A human's `maneuvers to close.` at close no longer flips the range.
- **START-HERE-BOTS.html** (§6.5): the vampire's `Combat ▸` menu, the automatic taken line and `Damage taken…` on a Classic table, steals.
- **Diagnostics:** every round row carries `strikeSeen` and `rejects` (combat lines the name filter refused); the row keeps the opponent's name even when the actor's next announce clears the live one (the "null opponent" rows were statistics, not play).

## Gates (final bytes)
Suite **1673/0 ×3** (tests 127k) · canary **52/0** vs client **v2.6.132** (new section 4: the client's own `CMB_LINE` builders extracted and every line fed through a live bot, 15 asserts) · hotseat gate **10/0** vs v2.6.132.

## Verification — serie-cmb15 (final bytes, seeds 9981–9992), `ana-ledger.py`
Opponent names **347 right, 0 null, 1 wrong** (cmb12: 7 null / cmb13: 19 null) · **0 refused combat lines** in 349 round-1 rows · handshake 358/359 · bleed 208 equal + 66 explained by modifiers · steal 64 / 57 (empty victims) · creep 10 placed, 17 burns visible.

## Next (main §4–§6)
1. Prove a whole combat on LINES alone (helper off), then ask main to release the helper lock for bots (main adds a hotseat test with the combat helper off).
2. The combat phase routine `combatPhases` — built on lines and Johan's seven phrases, never on `ph` (ph is an optional hint).
3. Additional strike pairs (`sp` / `xa` / `xb`).

**Deploy:** `elysium-bot.js` (v0.6.164) to main. Rollback: `combatMind: 0` (decisions only).
**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `test-bot-canary.js` · `START-HERE-BOTS.html` · `elysium-bot-CHANGELOG.md` · `elysium-bot-learnings.md` · `CLAUDE.md` · `ana-ledger.py`
