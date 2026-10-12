# Elysium Bots — delivery 23 September 2026 (b): bot v0.6.161 → **v0.6.162 RULES OUT OF THE KNOB** — DEPLOY CANDIDATE

**Johan's pre-spec code review.** The one thing that had to change: `combatMind` gated rule corrections together with Johan's decisions, so the advertised rollback `combatMind: 0` would have re-introduced three rule bugs. Now unconditional: hand strikes at long (0 / not offered), silent opponent at long = 0, the continued-round race, the steal victim, Hidden Strength never a standalone press. `combatMind` gates decisions only. New CLAUDE.md rule: knob hygiene.

**Gates:** suite **1661/0 ×3** (126a / 127f reworded, 127i new), canary **37/0** vs client v2.6.125, hotseat gate **10/0**. No series: at `combatMind: 1` the decisions are unchanged.

**Watch items from the review (not changed — decided or deferred):** the wave posture is broad (`oppCombat ≥ 0.2`) — Malkavian's narrowing is Johan's open question, likely knowledge layer; `_wantPress` reads the seat's average damage, not the fighting vampire's; `_rushLikelyThrough` counts bodies, not reactions that unlock a blocker (Cats' Guidance); round 2+ waits two windows also against humans (slower, correct); the one Ryan / Brock Sterling opponent-name mismatch from cmb4.

**Deploy:** `elysium-bot.js` (v0.6.162) to main. Rollback: `combatMind: 0` (decisions only; all rule fixes stay).
**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `elysium-bot-learnings.md` · `CLAUDE.md`
