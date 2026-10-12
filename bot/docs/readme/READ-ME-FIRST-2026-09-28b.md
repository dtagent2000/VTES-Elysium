# Elysium Bots — delivery 28 September 2026 (b): bot v0.6.192 → **v0.6.193** (`dynFloor` on, after a real bench) — DEPLOY CANDIDATE

**The re-bench.** Arm `dyn2`, 48 matches, the variant in every seat, and this time the floor was proven to fire: 684 raises in 23 of 48 matches (`dyn-floor` trace rows). Result: −0.12 ± 0.39 VP, 11 wins of 48, against the negative control's +0.14 ± 0.45 and 12 — inside the noise, no loss shown. So "do not oust yourself" is on by default; `dynFloor: 0` turns it off.

**Noted for a follow-up arm:** the mean leans below the control, and the floor fires often. Counting only Creeping Sabotage and Fame (Smiling Jack drains every seat alike) may be the better rule; that is a bench of its own, not done.

**Gates:** suite 1749/0 · canary 57/0 · hotseat unchanged paths.

**Deploy:** `elysium-bot.js` (v0.6.193) with `elysium-twd-profile.json` and `elysium-twd-archetypes.json` beside it.

**Replace:** `elysium-bot.js` · `REPORT-bench-controls.md` · `make-bench-report.sh` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`
