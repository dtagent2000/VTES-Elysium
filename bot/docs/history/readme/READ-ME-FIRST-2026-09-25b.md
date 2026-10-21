# Elysium Bots — delivery 25 September 2026 (b): bot v0.6.173 → **v0.6.174** + cardfx (Bowl of Convergence) — DEPLOY CANDIDATE

The cardfx sweep's pilot (`REPORT-cardfx-sweep-pilot.md`) found two things for the bot to fix.

1. **Bowl of Convergence [AUS].** The bearer can burn 1 blood during an action for an extra +1 intercept.
   - **cardfx:** the [AUS] mode now carries `interceptPaid` 1 at 1 blood. It is a curated entry, recompiled from `vtes.json`, and the only library entry that changed.
   - **Bot:** the blocker's second look uses the extra intercept before playing a card, and only when it is needed. It is used once per action, and the bearer keeps at least 1 blood.
2. **The Immortal Grapple ruling [TOM 19951217].** After the .44 Magnum's maneuver, Grapple leaves the bearer with no strike at all that round: no hand strike, no dodge and no combat ends.

**Stealth rule corrected.** The pilot also corrected the stealth rule's reason. An action card is at 0 stealth unless it prints stealth; the undirected +1 applies to the basic actions only. cardfx already followed this rule.

**Gates:**
- Suite: 1712/0 ×3 (tests 127s)
- test-cardfx: 256/0
- Canary: 57/0
- Hotseat: 10/0

**Deploy:**
- `elysium-bot.js` (v0.6.174) **and** `elysium-cardfx.json` (Bowl), both beside the client and on the bot processes.

**Replace:**
- `elysium-bot.js`
- `elysium-cardfx.json`
- `cardfx-curated.json`
- `test-bot-logic.js`
- `test-cardfx.js`
- `elysium-bot-CHANGELOG.md`
- `CLAUDE.md`

**Add:**
- `REPORT-cardfx-sweep-pilot.md`
- `sweep-pilot.py`
- this file
