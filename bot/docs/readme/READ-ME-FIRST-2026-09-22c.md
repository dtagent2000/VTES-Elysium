# Elysium Bots — delivery 22 September 2026 (c): bot v0.6.155 → **v0.6.156 THE COMBAT MIND**, arena v1.4.3, three combat series

**Cumulative on top of 22b. Cardfx and hotseat tool unchanged.**

## The finding first — the v0.6.114 handshake regression
Since 16 Sep the bot's press / maneuver / Immortal Grapple / Carrion Crows lines were `note()`s (log tier) or deleted, while the opposing bot's parsers ran only on chat: **no bot heard another bot's press, maneuver, Grapple or Crows for six days** (a pressing bot fought round 2 alone, Theft stole from nobody). Every series since (bal1–bal8, home2, null4) has a one-sided combat layer. Fixed: `_parseCombatNarration` fed from both tiers, frozen phrases emitted as notes. Verified 338/338 rounds matched on both sides (cmb1b). New CLAUDE.md rule: the combat handshake rule.

## v0.6.156 — knob `combatMind` (0 = v0.6.155)
Johan's rulings per deck: Immortal Grapple only behind Roundhouse-class damage / active Carrion Crows / a strength bonus · superior Grapple's and Hidden Strength [FOR]'s bundled presses consumed (`_bundledPress`) · `_wantPress` (torpor shot from the opponent's own `takes N (loses P, now M)` line, card round, snipe counts a steal of 1, wave decks only the torpor shot, never into a downed opponent) · press-to-END cancels an incoming press; theirs cancels mine · `_bestPressFor` without prevent bundles · Taste of Vitae only after a 2+ loss · `DECK_STRATEGY.combat` chase (nosferatu) / snipe (tremere, wall) / wave (rest) in `_wantLong` · hand strikes deal 0 at long (fist `for 0` on strikeC, Roundhouse not offered) · steal at long even at capacity · pure stealth card before Swallowed by the Night · one `combat-round` trace row per round.

**Gates (final bytes):** `node --check` clean · suite **1632/0 ×3** (section 125, 32 asserts; 37h/i/k/n lock v0.6.155 under `combatMind: 0`) · canary **37/0** vs client v2.6.125 · hotseat gate **10/0**.

## Series (seeds 9981–9992, balanced design) — `REPORT-serie-cmb2.md`
cmb1 (v0.6.155, `REPORT-serie-cmb1.md`) → cmb1b (`combatMind=0`, the real baseline) → cmb2 (`serie-cmb2b/`, final bytes). All eight registered predictions hold (Grapple 0 of 10 wasted, Taste 12 of 14 after a card round, Tremere maneuvers 6, Malkavian waves 11, presses never into an empty round). Nosferatu loses damage to waving opponents because the starter has no maneuver — the deck's weakness, now visible; follow-up = the rush priority.

## Next
1. Client spec to main: strike quick-phrases in the bot's frozen grammar (`X strikes with Y for N.` / `dodges` / `combat ends`), `rng` (close/long, Set range) and `pr` (End/Continue) fields in the tally verb, a Combat submenu on the vampire. Bot reads them as data.
2. The bot-driven combat phases vs humans (`combatPhases`), once the client has the controls.
3. Nosferatu rush priority in `decide('action')`.
4. The cardfx sweep + inferior/superior definition, own chat.

## Replace
`elysium-bot.js` (v0.6.156) · `test-bot-logic.js` (section 125) · `elysium-bot-arena.js` (v1.4.3) · `elysium-bot-CHANGELOG.md` · `elysium-bot-session-journal.md` · `elysium-bot-learnings.md` · `elysium-bot-project-context.md` · `CLAUDE.md` · `SKILLS.md`
## Add
`REPORT-serie-cmb1.md` · `REPORT-serie-cmb2.md` · `ana-combat.py` · `ana-combat2.py` · `run-ser.sh` · this file
