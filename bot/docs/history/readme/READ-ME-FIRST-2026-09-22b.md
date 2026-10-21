# Elysium Bots — delivery 22 September 2026 (b): bot v0.6.153 → v0.6.154 → **v0.6.155**, new START-HERE-BOTS.html, handover to main

**Cumulative on top of 22a. Arena, cardfx, hotseat tool unchanged. Suite gains section 124.**

## v0.6.155 — THE RUSH BY CHAT (Johan's interim rule)
Found while writing START-HERE: as a DEFENDER the bot only recognised the bot-emitted Deep Song line (`L12.rush`); a HUMAN's rush (client line *"Lisa plays Bum's Rush. Target: Name's Tallyn."*) was a bare "plays X" — no lock, no combat, damage by hand. Only Deep Song carries `fx.rush` in cardfx. Johan's ruling: the real fix is a cardfx rush-tag sweep in its own 4-eyes chat (with the inferior/superior split of card effects); until then a chat reverse of the July command:

- `L12.aimAtVamp` reads the client's play / card-action line whose Target names one of my ready vampires → `_lastAim` (who, actor, card, vampire; 120 s).
- `rush` in chat from a human cashes it in exactly as the Deep Song line: block window first when I have an unlocked body or a wake (`_rushWindowOpens`, comply on my Pass), else the vampire locks and `_resolveCombat` runs against the named rusher. `rush <prefix>` names my vampire when the aim did not reach me; a bare `rush` with no aim goes to the sender's PREY bot; `@Name rush …` any bot; bots' chat is ignored; unresolvable → "which of my vampires? (…)". `help` lists the form.

**Gates (final bytes):** `node --check` clean · suite **1601/0 ×3** (section 124, 12 asserts) · **canary 37/0** and **hotseat gate 10/0** against client v2.6.125 · `test-grammar.js` 4/5 (Test 4 pre-existing stale red, see v0.6.154).

## v0.6.154 — text only
The `rush` chat reply (*"has no combat module yet (M2)"*, false since v0.4.0) removed. Superseded by v0.6.155's real handler.

## START-HERE-BOTS.html — rewritten from scratch (re-issued for v0.6.155)
Player-facing guide (English, standalone, collapsible): about the bots and their card knowledge, experience levels, setup offline-first then online, how a bot plays (incl. *Rushing a bot's vampire*), full controls reference (incl. the `rush` chat row). Written as if main's card-ctrl fix is in (card menu "both modes", 🔥 Burn) — Johan's call, main fixes it in parallel.

## Handover to main — `spec-bot-card-ctrl-2026-09-22.md`
Hotseat: card controls on a bot's card never reach the bot (`hotCtrl` returns early). Fix A: route `ctrl` via `hotBridge.toBot` for bot seats. Fix B: Burn item on the bot-card menu (bot side since v0.6.129, debt 26h). No bot change.

## Next
- Main's client with the card-ctrl fix → re-run canary + hotseat gate, add a gate assertion for `ctrl`/`burn`, close 26h.
- Separate chat: cardfx rush-tag sweep + 4-eyes review of tags across the bot decks, inferior/superior effect split. When rush cards carry `fx.rush`, the `rush` chat step becomes optional (keep the grammar as fallback) and START-HERE's *Rushing a bot's vampire* shrinks to "set the target, play the card".
- Then Johan's human table offline, then the knowledge layer.

## Replace
`elysium-bot.js` (v0.6.155) · `test-bot-logic.js` (section 124) · `elysium-bot-CHANGELOG.md`
## Add
`START-HERE-BOTS.html` (replaces the old one; bundle to main) · `spec-bot-card-ctrl-2026-09-22.md` (to main) · this file
