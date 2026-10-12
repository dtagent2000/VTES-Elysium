# Elysium Bots — delivery 26 September 2026 (g): bot v0.6.182 → **v0.6.183 PHASE B step 3** — DEPLOY CANDIDATE

**What changed:** the opponent's press and maneuver now live in the event log.

- They follow the same model as the strike: one generic set of helpers marks each event as pending, consumed, replaced or dropped.
- `_oppPress` and `_oppManeuver` remain as views.
- The guardrail test 127m, lines only, drives the real press and maneuver paths from end to end.

**Verified:**

- Suite: 1731/0 ×3
- Canary: 57/0
- Hotseat: 10/0
- Bot-only series pb4 (3 matches):
  - handshake 96/96
  - opponent names 96/96
  - range disagreements 2 (earlier series had 0–2)
  - invariant flags: the known residue

**Left in phase B:** the opponent's taken line and Carrion Crows (`_oppLastTaken`, `_oppCarrionCrows`).

**Deploy:** `elysium-bot.js` (v0.6.183).

**Replace:**

- `elysium-bot.js`
- `elysium-bot-CHANGELOG.md`
- `CLAUDE.md`
