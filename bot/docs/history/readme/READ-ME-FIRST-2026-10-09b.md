# Elysium Bots — delivery 9 October 2026 (b): bot v0.6.194 → **v0.6.195** (main's reply reviewed) — DEPLOY CANDIDATE

**What happened.** Main answered the v0.6.193 handover (client v2.6.139 / srv-2.6.43): the knowledge layer is on in the browser, the tempo's wire and panel are built and every table with bots is seeded at Standard 3 s. This release checks v0.6.194 against what they built and fixes what the check found. It replaces the v0.6.194 handoff, which was never sent: send **`HANDOFF-to-main-2026-10-09-v0_6_195.md`** only.

**Their wire needed no change.** Their exact message shapes pass through the bot's parser. Their log line `NAME set bot tempo: …` moves nothing. Their panel check finds `_handlers.botcfg`.

**What the check found — 20 s gaps after the combat steps.** v0.6.194 put every combat step on the tempo, and the suite was green. But timing a whole round against a human who answers at once showed the handshake that follows a step still waiting `askSecs` (20 s at the client's spawn):
- after "No" to "Any presses?" (every combat);
- after "No" to "What is your strike?".

**What v0.6.195 does:**
- **The grace.** Under a tempo, against a human, that wait only catches a line already on its way: 0.3 / 1 / 1.5 s. One round went from 7.7 s to 3.0 s at `askSecs: 3`.
- **The press-to-end window.** That silent wait was also the human's only chance to press to end after the bot's own press, so it becomes a question ("Any presses?") on the tempo.
- **`res: 1` on the combat close.** This is the client's own convention: the humans' Played batches close with the combat.
- **Unchanged:** bot-vs-bot, and any table with no botcfg.

**For file:// tables (main's ask).** `twd-profile.py` and `twd-archetypes.py` now also write `elysium-twd-profile.js` and `elysium-twd-archetypes.js`, from the same serialize. Both were rebuilt here, and the JSONs are byte-identical to the benched files.

**START-HERE-BOTS.html**, all the stale points main listed:
- the footer;
- "No deck reading yet", now replaced by the TWDA reading;
- the four files and their `.js` twins;
- the tempo UI as main built it (the gear on 🤖, the ▶, the seeded Standard 3 s);
- the panel online;
- Close step / Close poll.

**Three things for you, Johan:**
1. **Majesty against a weak striker.** Main asked whether "Majesty against a hand strike for 1" is intended. Today it is: your provisional rule of 18 Sep, "combat ends when held". Your direction (save it for the opponent who statistically hits hard) can now be built on the knowledge layer. Do you want that next? It gets a Ventrue-pinned bench before it ships.
2. **The damage step's length.** It has no question (your phase list), and it waits 2 × the slider: 6 s at 3 s, silent, every round. Unless the human prevents, says Pass or steps the panel past Damage, that is dead air. Keep 2×, or make it 1× the slider?
3. **The four silent pool changes.** Still waiting for your decision; main has no work either way.

**Gates:** suite **1812/0** · canary 57/0 · hotseat 10/0 · test-cardfx 261/0 · no line over 4000 chars. Canary and hotseat ran against v2.6.138, the newest client in this project. Main runs them against v2.6.139 (or upload it here).

**Deploy:** `elysium-bot.js` v0.6.195, plus `elysium-twd-profile.js` and `elysium-twd-archetypes.js` beside the client. The JSON files are unchanged.

**Replace in the project:** `elysium-bot.js` · `test-bot-logic.js` · `START-HERE-BOTS.html` · `twd-profile.py` · `twd-archetypes.py` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md` · `elysium-bot-learnings.md` · `elysium-bot-session-journal.md` · `elysium-bot-project-context.md`. **New:** `elysium-twd-profile.js` · `elysium-twd-archetypes.js` · `HANDOFF-to-main-2026-10-09-v0_6_195.md` · this file. From v0.6.194 earlier today: `elysium-bot-table.js` (v1.2.0) · `ana-wait.py`.
