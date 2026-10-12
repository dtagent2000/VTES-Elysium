# Elysium Bots — delivery 27 September 2026 (d): bot v0.6.187 → **v0.6.188** (`twdKnow` on by default) — DEPLOY CANDIDATE

**The bench decided.** Arm `twd` (the TWDA knowledge on the variant seat, 48 matches, every seat): **+0.21 ± 0.46 VP** against the negative control's +0.14 ± 0.45. No loss, no measurable gain at this size — expected, because the only decision change (the Tremere sniper's pacifist press) fires in a quarter of the matches. So the knowledge is on by default from v0.6.188; `twdKnow: 0` turns it off.

**Also:** `bench.sh` gains a deck-pinned variant (DECK) and a baseline knob (BASE) — see `REPORT-bench-controls.md`. A Tremere-pinned arm is running to measure the sniper rule itself.

**Gates:** suite 1742/0 · canary 57/0 · hotseat 10/0 (unchanged bytes but for the default).

**Deploy:** `elysium-bot.js` (v0.6.188) with `elysium-twd-profile.json` beside it.

**Replace:** `elysium-bot.js` · `bench.sh` · `REPORT-bench-controls.md` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`
