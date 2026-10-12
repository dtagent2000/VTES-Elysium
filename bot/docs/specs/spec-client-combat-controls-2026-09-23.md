# SPEC — client combat controls for bot tables (to main) — 23 Sep 2026

**From:** the bot project (bot v0.6.162). **To:** main (client `elysium-vtes-bord.html` v2.6.125, server srv-2.6.38).
**Why:** a human fighting a bot today must TYPE the bot's frozen combat grammar or the bot guesses (the rulebook fist of 1, 0 at long range) and ends with "tell me if your side differs". Johan wants the combat counter and the vampire menu to carry range, press and strike as data, the way Block / Vote already do (v2.6.106). Everything below is designed so that **the bot needs no new parser for §2** — the client emits the phrases the bot already reads (verified against `_parseCombatNarration` and `L12`, bot v0.6.162). §3 (tally fields) and §4 (Set range) need a small bot follow-up, listed in §6.

## 1. Principles
1. **Menu = log line.** Every combat control writes ONE frozen line on the `log` relay (like `blocks.` / `casts N votes for.`), wording byte-exact as in §2. The bot parses the log tier since v0.6.156; other humans just read it.
2. **Counter = state.** The combat tally carries the round's RANGE and PRESS state as fields (§3), so every screen — and the bot — sees the same thing without parsing prose.
3. **Two entry points, one effect.** Johan's two surfaces — the combat counter and the vampire's right-click **Combat** submenu — call the same functions (write the line, update the tally).
4. **No enforcement.** The client records what the players declare; it never blocks an illegal play (house style since v1).

## 2. Frozen lines (the bot already parses all of these)
`NAME` = the vampire's card reference (`<b class=clog>` link as today; the bot strips tags). `CARD` = a card reference or plain text. All punctuation and the em-dash `—` are load-bearing.

| Control | Line to log | Bot reads it as |
|---|---|---|
| Strike → Hand | `NAME strikes (hands) for 1.` | a hand strike for 1 (strength 1) |
| Strike → Hand for N… (prompt) | `NAME strikes with hands for N.` | a hand strike for N (strength-boosted; N = 0 at long) |
| Strike → Weapon / card for N… (prompt card + N) | `NAME strikes with CARD for N.` | a strike for N damage |
| Strike → Steal blood… (prompt card + N) | two lines: `NAME strikes with CARD for 0.` then `NAME strikes with CARD: steals N blood (not damage).` | the strike (0 damage) **and** the steal — the bot's vampire loses min(N, blood), not damage (v0.6.160) |
| Strike → Dodge… (prompt card) | `NAME strikes: CARD — no damage either way this round.` | a dodge |
| Strike → Combat ends… (prompt card) | `NAME strikes: CARD — no damage either way this round.` then `Combat ends — CARD.` | combat ends at once (Majesty-class) |
| Maneuver → To long / To close (optional card) | `NAME maneuvers to long.` / `NAME maneuvers to close.` (optionally ` (CARD)` before the period) | a maneuver; range flips for this round |
| Press → Continue (optional card) | `NAME presses to continue.` (optional ` (CARD)`) | a press to continue |
| Press → End (optional card) | `NAME presses to end.` (optional ` (CARD)`) | a press to end — cancels a press to continue |
| Damage taken (optional, counter "Taken N") | `NAME takes N (loses P blood, now M).` | certain numbers for the bot's torpor-shot / Taste decisions |

Notes: the three prompts reuse `uiDialog` like `Bleed X…`. The Steal and Combat-ends two-line shapes are exactly what the bot itself emits, so two bots and a human read each other identically. `Hand for N` exists because the bot announces strength-boosted fists that way; a human with Preternatural Strength / Blythe-class modifiers needs it too.

## 3. Tally fields (server + client)
Add two fields to the `tally` verb for `mode:'combat'`, under the v2.6.17 merge rule (an ABSENT field preserves the room's current value while the mode is unchanged; a mode change starts fresh):

| Field | Values | Default at a fresh combat | Written by |
|---|---|---|---|
| `rng` | `'close'` \| `'long'` | `'close'` | the range control (§4), any seat; the bot after its range step |
| `pr` | `null` \| `'continue'` \| `'end'` | `null` | the press control, any seat; reset to `null` when the phase stepper wraps to a new round |

- Server `tally` validator: accept `rng` ∈ {close, long} and `pr` ∈ {null, continue, end}; store on `room.tally`; relay in the `s2c tally` whole-state message; late joiners get it.
- **Round wrap:** when `ph` goes 6 → 0 (Next after End of round) `rd` +1, `pr` → `null`, `rng` → `'close'` (the rulebook default each round; a Set range carry-over is §4).
- PROTOCOL §5 row + §12 lines updated with a version note.

## 4. The combat counter (client UI)
Existing: `avrPh` stepper `R<rd> · <phase>` with ◂ ▸, the a/b damage counters, duel names.
Add, combat mode only:
- **Range pill** beside the stepper: `Close` / `Long`, click toggles and writes `rng` + the maneuver line for the actor/defender chosen in a tiny two-button popover (`Acting ▸ long` / `Defending ▸ long` — the line needs a NAME; default to the duel vampire of the clicking seat). A **Set range…** item (Immortal Grapple, Sniper Rifle): prompts close/long + card and writes `rng` plus `NAME sets range to close (CARD).` — see §6 for the bot side.
- **Press pill:** `—` / `Continue` / `End`, writes `pr` + the press line (same NAME rule).
- **Strike button** (per side, visible at phase Strike): opens the §2 strike menu for that seat's duel vampire.
- Phase stepper unchanged; the pills are shown only in combat mode, like the stepper (`isC`).

## 5. The vampire's right-click menu
Beside `Actions`, for a minion in the ready region **while a combat tally is open**: `Combat ▸ Maneuver ▸ To long / To close / Set range…`, `Combat ▸ Strike ▸ Hand / Hand for N… / Weapon or card… / Steal blood… / Dodge… / Combat ends…`, `Combat ▸ Press ▸ Continue / End`, `Combat ▸ Took damage…` (optional taken line). Same functions as §4; no batch close, no autoLock (combat cards are not actions — the `actVote` pattern).

## 6. Bot follow-up (bot project, after main ships)
1. Read `rng` / `pr` from the tally as DATA: range after the opponent's step, press state at the press step (today it parses the lines; the fields remove timing races with humans).
2. Write `rng` after its own range step and `pr` at its press step (`_writeTally` partial writes, v2.6.17 rule).
3. Parse `NAME sets range to close|long (CARD).` — new frozen line (Immortal Grapple's "range is close next round", Sniper Rifle).
4. Canary: add the §2 lines + the two fields to `test-bot-canary.js` against the released client.
5. Then the **combat phase routine** (`combatPhases`): the bot drives the seven steps against a human with Johan's phrases, reading these controls instead of waiting on typed grammar.

## 7. Acceptance (main)
- Each §2 control produces its line byte-for-byte (a unit test per line, like v2.6.106's Block/Vote lines).
- `tally` round-trip: `rng` / `pr` set, preserved on partial writes, cleared on mode change, reset on round wrap; late joiner sees them.
- Hotseat: a human vs a bot combat using only the menus — the bot logs no "no strike line within the window" and no "tell me if your side differs".
