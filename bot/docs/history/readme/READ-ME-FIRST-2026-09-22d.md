# Elysium Bots — delivery 22 September 2026 (d): bot v0.6.156 → **v0.6.157** — DEPLOY CANDIDATE

**Cumulative on top of 22c. Arena v1.4.3, cardfx and hotseat tool unchanged.**

## v0.6.157 — THE RUSH KIT + THE SILENT LONG (both behind `combatMind`, 0 = off)
1. **Silent opponent at long = 0.** A human who never types the strike: at LONG range their rulebook default is a hand strike, which deals 0. The old assume-1 stands only when `_oppHasRanged()` sees a ranged option (a gun on their vampire, a steal seen from the seat). Fixes the deploy caveat — v0.6.156 sends Tremere and the wave decks to long far more often.
2. **The rush kit** (Johan: rush only with real damage in hand, else bleed with Deep Song). `_rushExpectation` → `kit`, `grapple`, `strikeCard`, `crows`, `reach` (doubles with Grapple behind a damage source). Rush score × 1.5 / 1.15 / 0.75; the target chooser reads the same reach.

**Gates (final bytes):** `node --check` clean · suite **1642/0 ×3** (section 126) · canary **37/0** vs client v2.6.125 · hotseat gate **10/0**.

## serie-cmb3 (seeds 9981–9992) vs cmb2b — `ana-rush.py`
Handshake 282/283. The kit ranks rushes as designed (Grapple + Roundhouse vs a 1-blood target 6.05; no combat card × 0.75). But **`permFirst` decided 7 of 13 rush situations** (structural pick, score 98) — including that 6.05 torpor-certain rush, which lost to laying out Raven Spy. Rush chosen once (fists vs a 1-blood target). Table numbers are trajectory noise at n = 12. **Open question for Johan:** should a torpor-certain rush (kit ≥ 2, reach ≥ target blood) break permanents-first?

## Deploy
To main: `elysium-bot.js` (v0.6.157) — the client bundle and the online bots. Rollback without a new file: `combatMind: 0` in the bot's options (restores v0.6.155's combat decisions; the handshake fix stays).

## Replace
`elysium-bot.js` · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `elysium-bot-session-journal.md` · `elysium-bot-learnings.md` · `elysium-bot-project-context.md` · `CLAUDE.md` · `SKILLS.md`
## Add
`ana-rush.py` · this file
