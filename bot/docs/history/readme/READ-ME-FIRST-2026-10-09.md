# Elysium Bots — delivery 9 October 2026: bot v0.6.193 → **v0.6.194** (THE TEMPO) — DEPLOY CANDIDATE

**What it is.** The bot side of Johan's tempo design (`spec-bot-tempo-2026-09-27.md`): every wait a bot makes on a human — the block question, the reaction question, its pool question, its vote poll, the seven combat steps and the damage step — now reads **one tempo object** that the table sets with a `botcfg` message. Three modes: **Standard** (the slider is the clock; a combat step twice it), **Adaptive** (the slider is the ceiling; the bot waits ~1.5 × the human's measured median answer time and skips questions the human cannot act on), **Turn-based** (no clock; the Bot button gives the bot the word; reminder after 2 min, pass after 4). A bot that never receives a `botcfg` behaves **exactly as today**; bot-vs-bot windows are untouched in every mode.

**The number behind the complaint.** The client spawns bots with `askSecs: 20`, and a combat step's clock was `max(6, askSecs × 3)` = **60 s** per step. With Standard at the proposed default (3 s) a step waits 6 s, a block 3 s.

**What main needs to do (handoff `HANDOFF-to-main-2026-10-09-v0_6_194.md`):** the gear in the Bot button, the `botcfg` message relayed client → server → every seat (and stored for late joiners), the log line — the spec's §1, §3, §6. The bot needs nothing else: it parses `{ t: 'botcfg', who, tempo, waitSecs }` (partial writes allowed) and re-arms any open wait at once. Until the client ships it, a terminal-launched table can set the tempo with `--tempo standard:3` (both `elysium-bot.js` and `elysium-bot-table.js` v1.2.0).

**Adaptive's skip, read strictly.** The spec said "no ready, unlocked minion → no block question". A locked vampire can still block with a wake card, so the bot skips only when the human has **no legal way** to answer: no ready minion at all, or every minion locked **and** an empty hand; a reaction question or an "anything before …?" only with an empty hand; a maneuver / damage wait only with an empty hand and no equipment on the minion. The strike and the press are always asked. A legal option is never taken from a human.

**Observability.** One `wait` row per human wait (kind, mode, who, ms, how it ended: answer / clock / button / skip) — on the trace and on the process log, since a human table writes no trace. `python3 ana-wait.py <log or trace>` sums them: seconds waited by kind, how the waits ended. That is how a tempo claim gets measured.

**The Bot Activity panel.** Two new steppable rows beside the block window and the pool question: an open **combat step** ("combat step maneuvers (Anna)") and the bot's **vote poll** ("votes (Anna, Bob)"); `step()` closes them the way the clock would. In Turn-based they carry no countdown (`until: null`, the hold's rule) — the button is how the human gives the bot the word. Main's widget already reads `status()` / `step()`; the two new `step` names are `resolve-phase` and `resolve-vote`.

**Not in this release (known, documented in the CHANGELOG):** the two short graces (`whoBlocksGraceMs` 2.5 s after a shouted Block!, `modGraceMs` 4 s for "Any bleed modifiers?") keep their fixed values in every mode.

**Gates:** suite **1803/0** (new section 128, 54 assertions: botcfg partial writes and clamps, the three modes, the skips, the safety net, the Bot button, a botcfg mid-combat, the wait rows; the battery aborts on v0.6.193) · canary 57/0 vs client v2.6.138 · hotseat 10/0 (bot-only: the tempo never applies, as designed) · test-cardfx 261/0 (cardfx unchanged) · no line over 4000 chars.

**Deploy:** `elysium-bot.js` (v0.6.194) — with `elysium-cardfx.json`, `elysium-twd-profile.json` and `elysium-twd-archetypes.json` beside it as before. Nothing else changed on the wire except that the bot now LISTENS for `botcfg`.

**Replace in the project:** `elysium-bot.js` · `elysium-bot-table.js` (v1.2.0) · `test-bot-logic.js` · `START-HERE-BOTS.html` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md` · `elysium-bot-learnings.md`. **New:** `ana-wait.py` · `HANDOFF-to-main-2026-10-09-v0_6_194.md` · this file.

**Next (unchanged order):** main's test of v0.6.193/194 at a human table (Standard 3 s first, then Adaptive, then Turn-based — `ana-wait.py` on the bot log of each) → the press feature in the TWD profile + calibration of the block decision and the Malkavian wave against the expectation → personas per archetype → the dynFloor follow-up arm (Creeping Sabotage + Fame only). Still awaiting Johan: whether the bot should print a line for the four silent pool changes.
