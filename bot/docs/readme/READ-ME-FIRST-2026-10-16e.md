# Elysium Bots — delivery 16 October 2026 (e): bot v0.6.203 → **v0.6.204** (R3 of the play-test review) — DEPLOY CANDIDATE

**What it is.** Johan merged v0.6.203 (PR #21). This is the second half of his "Kör på!" of 16 Oct: R3 proper of `docs/reviews/REVIEW-playtest-2026-10-14.md`, the round about time and order at a table with a human. It covers a clock that starts before its question can be seen (F3, F11), hold lines late or out of order (F4), the silence after a bot blocks a human (F10), two bots saying the same remark mid-contest (F2), a bot's "Hold on…" before the other bot's question (F6), and the levers (a)–(d) for an empty turn and a quiet combat (F12, F13). Lever (e), Adaptive's skip under Standard, stays out: Johan's decision 3 of 16 Oct.

## 1. A clock starts when its question is on the wire (F3, F11)
- **What it was:** every wait on a human armed when its question was QUEUED. At the client's pace each chat line ahead costs about 5 s (`_drain`'s chat beat), so a 6 s combat step reached the wire with 1.5 s left. The block question also added the queue to its own clock as a "settle": "3s" announced, 8.2 s real.
- **Now:** `_afterWire(fn)` runs `fn` once the last message queued so far has been sent. `_drain` fires the callbacks hung on an entry in its `finally`, after the re-entry is scheduled, and a dropped or failed frame fires them too.
- **`_wireWait(w, rearm)`** is the first question every arm function asks: the block and reaction window (`_restartAskTimer`), the pool question (`_pqArm`), the vote poll (`rc.arm`), the combat steps and the damage step (`pw.arm`), and the new verdict wait.
  - While a line of mine is queued, the wait has no deadline: `status()` says `until: null` and the step rung stays, and an answer still counts.
  - When the line is sent, the wait arms. `t0` starts there too, so the wait row and Adaptive's answer time count from the wire.
  - A newer arm supersedes a pending one (`_wireGen`).
  - No ws (a fixture, before connect) means arm at once, the old way.
- **Also moved to the wire:** the settle is gone from `_waitPlan`, the late-bounce grace starts from the wire too (`_lateGen`), and the bounce question's clock restarts after its line.
- **Adaptive records no answer time** for an answer that came before its question was on the table (`_wired`).

## 2. The hold lines (F4)
- `chat(msg, { hold: true | false })` → `_sendHold`: the line goes to the head of the queue (behind earlier hold lines, in order), tagged in a WeakMap with the hold state it describes.
- `_drain` drops a stale one (`_holdLineStale`): a line whose state the table has left, or a resume of a hold the table never saw (`_holdShown` = what the wire last carried).
- Five sites use it: Holding, Still holding, the two Resuming lines (the table's release, the panel's release) and the holder-left resume.

## 3. The verdict wait (F10)
- **What it was:** after "Trevon Parker attempts to block." nothing happened — no clock, no rung, and the actor's Pass was not read. Main's table stood for four minutes.
- **Now:** at the end of `_commitBlock` against a human actor, `_vwArm` says `X blocks (stealth A vs intercept B) — Anna, add stealth, or say Pass to resolve it (3s → the block succeeds)` and waits.
  - The wait is kind `verdict` on the tempo: Turn-based has no clock, a reminder and a give-up.
  - Status: `asking`, `block verdict (Anna)`, rung `resolve-verdict`.
- **What ends it:** the clock, the actor's Pass / No / No reaction / It resolves (`_onSay`, or typed in `_onChat`), and the Bot button. `_vwResolve` then declares the verdict from the counter with the §12 line (my log lines are not echoed back) and calls `_verdictAsTarget(ok)`. That is the old body of the table-verdict branch, now shared: combat when the block succeeds, the window again when it fails.
- **It resolves over a failed counter lands the action** at once (`_applyPending`): no second window after the actor's word, the rule v0.6.203 made for a bot actor.
- **When there is no counter to read,** `_vwResolve` returns false and the old paths handle the phrase.
- **What restarts the clock:** the actor's counter move (a tally from them in block mode), a stealth typed in chat (the bot books it itself and its own counter write is not heard as theirs), and my own second intercept.
- **What else ends or freezes it:** a hold freezes it (`_holdFreeze` / `_holdThaw` / `_tempoRearm`); a counter that closes or changes mode ends it; `_clearPending` ends it; the table's own verdict line ends it ('answer' when the actor sent it).
- A bot actor declares every verdict itself, so no wait is armed against one.

## 4. One spokesbot (F2) and the cosmetic F6
- **The archetype read:**
  - `_isSpokesBot` skips ousted seats, and an ousted bot is never one.
  - `_archetypeSay` hands a confident read to `_arkTell` (the spokesbot only, knob `arkChat` as before). `_arkPump` writes it as a note, `NAME (bot) reads X's deck as Y (n of m cards typical).`, once `_arkQuiet()` holds: no question, pending, pool question, combat step, combat, verdict wait or vote poll, and no live counter (block / vote / combat). A resting `free` counter holds nothing.
  - It is re-checked every 1.5 s, and `close()` clears the timer.
  - Every bot still traces the `archetype` row.
- **Three actor notes removed:** "Clearing the lane.", "… torpor will cost them." and "… cannot block." each repeated the actor's own Misdirection / Fame / Pentex play line; the target's own note explains its side.
- **F6:** in `_reactWindow`, against a BOT actor at paceMs > 0 the target's "Hold on…" waits for the actor's question (`p._thinkQ`, said in `_onChat` when the actor's line arrives). It is dropped when my answer goes out first. Against a human, and at paceMs 0, nothing changes.

## 5. The tempo levers (F12, F13)
- (a) `_announcePhase('Unlock', 'none')`: no second beat at turn start, the hold gate only.
- (b) Every other phase line rides the fx beat (0.4 × paceMs). The line is still sent; the act after it takes its own beat.
- (c) In a phased combat (against a human), the round summary, the dodge summary and the combat-ends summary are notes on the log tier without "tell me if your side differs". Between bots they are chat, as before.
- (d) `_waitPlan(kind, who, step)`: the combat steps 0, 2 and 6 ("Anything before …?") wait 1× the slider; the maneuver, strike and press steps keep 2×.

## 6. Tests
- **Section 145, 35 assertions:**
  - 145a–e on a recorded-wire fixture (paceMs 300, a transport stub that stamps each frame): the clocks, the pool question, the vote poll, an early answer, the hold lines;
  - 145f the verdict wait;
  - 145g the spokesbot;
  - 145h F6;
  - 145i the levers.
- **Destructive:** on v0.6.203 **4/31** (four guards green on both, no abort). The three late assertions are each red on the bytes before their own change: It resolves over a failed counter and the resting counter (32/2), and the typed stealth (34/1).
- **Old tests moved to the new rules:** 127n, 127z, 128e, 128i, 139g and 141g. They pinned a chat summary, the old archetype chat, step 0 at 2× and a strike count that included a summary.

## Gates
All from `bot/`, on the final bytes (`elysium-bot.js` 4201f7f0…, `test-bot-logic.js` b590e7c9…):
- `node --check` on every changed JS file (the bot, the suite, the guide's script).
- `test-bot-logic.js` **2112/0 ×3**, alone, detached (v0.6.203: 2077; +35 = section 145).
- `test-bot-canary.js` **69/0** (main's copy, against the client v2.6.161 copy beside it).
- `diag-hb1-smoke.js` **11/11**.
- `test-bot-hotseat.js` **11/0**.
- `test-cardfx.js` not run: cardfx and the twd files are byte-identical to v0.6.203's.
- `client/check-versions.js` after the root copy: everything agrees (the root's 21 files, each a byte copy of `client/` or `bot/`).
- Destructive: section 145 on v0.6.203 **4/31** (four guards green on both, no abort); the three late assertions are red on the bytes before their own change (It resolves over a failed counter and the resting counter: 32/2; the typed stealth: 34/1).
- Beside main's current client (a scratch worktree of origin/main = a714cb0, client v2.6.161, with this branch's `bot/` and root bundle laid over it):
  - the client suite **299/2**: the embed drift (Help ▸ Bots embeds v0.6.201's guide), and their v2.6.140 LIVE tempo test, which reads the first steppable status — with this release often the moment the question is still queued (`until: null`);
  - with the one-line change of the handoff §3 in the scratch copy (wait for an armed clock in the Standard half), the suite is **300/1** (only the embed drift);
  - the client's canary **69/0**, and check-versions agrees.
- **The arena smoke** on the final bytes (seed 4003, 3 matches, 4 Expert bots: malkavian, tremere, nosferatu, ventrue; pool 30): no timeouts (9, 7 and 11 rounds; 184–256 s a match).
  - `ana-ledger.py`: every bleed paired (69 equal), **VANISHED 0**; the combat names 94 right; dealt = taken in 89 rows, and the 5 others explained (4 Carrion Crows, 1 Hidden Strength); steal pairs 10 of 10 equal (15 stolen = 15 lost).
  - `ana-combat2.py`: handshake integrity 96/0, range agreement 96/0, press agreement 70/0, no wait ran into the safety net.
  - `ana-inv.py`: **0 flags**. `ana-block.py`: no violation (154 actions, 47 blocked).
  - `ana-wait.py` has nothing to read in a bot-only arena (a wait on bots writes no row). The clock change shows at a table with a human: main's rig, the next step.

## For main
- **Their v2.6.140 LIVE test goes red with v0.6.204 beside it** (299/2 in the courtesy run; the other red is the old embed drift). The test reads the first status that can be stepped, and with this release that is often the moment the question is still queued (`until: null`, the review's F3 rule). The handoff gives the one-line change (wait for `until != null` in the Standard half); in a scratch copy of origin/main with that change the suite is 300/1. Nothing of theirs is changed in this PR.
- Send `HANDOFF-to-main-2026-10-16-v0_6_204.md`. It covers the new question line, the new rung (`resolve-verdict`: please name it, we suggest "Declare verdict"), the lines moved to the log tier, the rig's `QUESTION` regex (add `add stealth`), PLAYTEST.md's sentence "waits for you without a clock", and the clock now starting on the wire.
- Deploy `elysium-bot.js` v0.6.204 and re-embed `START-HERE-BOTS.html` (their embedded copy is v0.6.201's). cardfx and twd unchanged.

## Things I am not sure about
- **The clock now runs while the question's bubble is on screen.** It starts when the question is sent, not when the bubble has finished its animation. v0.6.100's settle waited for the bubble too. At 3 s that leaves a little less time to read than the number says. The fix would be a short fixed lead-in, if Johan wants one.
- **An answer that arrives before the question reaches the wire still closes the wait.** The question is then sent anyway, after its own answer: the order the play-test complained about, in a rarer form. Dropping a question whose wait has ended would need a tag like the hold lines'.
- **A wire deferral behind unrelated lines.** A re-arm (a human's chat restarts the clock) waits for everything the bot has queued at that moment, not only the question. A wait can therefore stand without a deadline a little longer than its question needs. Measured in the tests only.
- **The verdict comes from the blocker.** The blocking bot declares the §12 verdict line from its own seat. Main's client reads that line only for its bubble (`maybeVerdictPulse`, labelled with the sending seat), so the "Block succeeds!" bubble now names the blocking bot. I read this in the client; I did not run it in a browser.
- **It resolves over a counter that says the block succeeds starts the combat.** A human who played stealth without booking it on the counter will see the fight start. The old behaviour ("A block was announced but never resolved…") was not better, but it was different.
- **Lever (b) applies to every phase line,** not only an empty phase: a phase where the bot then plays still gets the full beat before its act, but the line itself comes sooner.
- **Lever (c) goes further than the review's text:** the dodge and combat-ends summaries go on the log tier as well as the round summary.
- **F6 only in `_reactWindow`;** I found no other window where a bot target speaks before the bot actor's question.
- **An ousted bot is no longer the spokesbot** (the review said "skip ousted seats"; the bot itself checks `this.out` too).

## Next
R4 of the review: the uncurated V5 masters (Haven Uncovered as Johan decided) and Revelations against a bot (F21). Then the scenario in main's rig with `--dir`, compared with the 14 Oct numbers, and the larger re-measure Johan asked for once every fix is in.
