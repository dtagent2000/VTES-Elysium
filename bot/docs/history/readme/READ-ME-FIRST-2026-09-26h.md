# Elysium Bots — delivery 26 September 2026 (h): bot v0.6.183 → **v0.6.184 PHASE B complete** — DEPLOY CANDIDATE

**The whole combat inflow is now read from the event log.** That covers the opponent's strike, press, maneuver, taken line, every-round damage (Carrion Crows) and name. The loose copies are gone and remain only as views, so the tests are unchanged.

**Step 4 (this delivery).**
- `opp-taken` events feed Taste of Vitae, the press decision and the rule that a wounded combatant ends the combat.
- `opp-env` events hold the opponent's every-round damage.

**Verified.**
- Suite 1731/0 ×3, canary 57/0, hotseat 10/0.
- Bot-only series pb5 (3 matches): handshake 124/124, names 122/122.
- Every path the change touches fired in the series:
  - Taste of Vitae ×4
  - Carrion Crows ×2
  - the wounded rule ended 3 combats
  - combat ends ×9 each way

**Known residue.** The invariant flags show the known residue: strike vs taken against Fortitude vampires, and pool −1 around Vessel. These are tracked for the next invariant pass and are not phase-B regressions.

**Deploy:** `elysium-bot.js` (v0.6.184).

**Replace:** `elysium-bot.js`, `elysium-bot-CHANGELOG.md`, `CLAUDE.md`.
