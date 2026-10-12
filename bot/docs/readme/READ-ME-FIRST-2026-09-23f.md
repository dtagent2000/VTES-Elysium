# Elysium Bots — delivery 23 September 2026 (f): bot v0.6.164 → **v0.6.166 THE COMBAT PHASES (+ the Damage step)** — DEPLOY CANDIDATE

**Johan's combat-phase routine (22 Sep), built for Structured + helpers on, without painting the Classic table into a corner (23 Sep).**

- Against a **human** combat opponent the bot drives the seven steps. Human acting → it asks *Anything before range? · Any maneuvers? · Anything before strikes? · What is your strike? · Any presses? · Anything before ending combat?* and waits, then plays. Bot acting → it plays or says *I have nothing before range. · I have no maneuver. · I have nothing before strikes. · I have no press. · I have nothing before ending combat.* and waits for the human.
- The wait ends on the human's combat line, a quick phrase (chat *no / pass / go on / done …* or the No, Pass, No reaction, It resolves buttons), a human stepping `ph` past the step, or the clock (`phaseSecs`, default max(6, 3 × askSecs), restarted by the human's activity).
- **Built on lines; `ph` is only written as a hint** (main §6). Knob `combatPhases` (0 = off). Bot-vs-bot untouched (serie-cmb16: 0 phase rows, 72/72 names right).
- **Guardrail 127m:** a whole round vs a human from LINES ONLY (no tally) must resolve — any future field dependency turns the suite red.
- START-HERE-BOTS.html: how the bot walks the steps and how to answer.
- **v0.6.166 (pre-test review):** the Damage step — `ph` 4 opens it (you may prevent), then the bot steps past it so YOUR client writes its automatic taken line (the bot's Taste of Vitae / torpor-shot press read it). No question is chatted for damage.
- Known limits for the test: one exchange per step (if the bot answers your play with a card, your further answer is not awaited); a silent step costs up to `phaseSecs`; no *Any additional strikes?* yet.

**Gates:** suite **1683/0 ×3** · canary **52/0** vs v2.6.132 · hotseat gate **10/0**.
**Deploy:** `elysium-bot.js` (v0.6.166) to main. Rollback: `combatPhases: 0` (phases) / `combatMind: 0` (decisions).
**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `START-HERE-BOTS.html` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`
**Test tip:** fight a bot with your vampire and answer each question with the `Combat ▸` menu or No / Pass; `phaseSecs` can be raised if the clock feels short.
