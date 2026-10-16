# Handoff to main — bot v0.6.204: R3 of the play-test review — clocks from the wire, the hold lines, the verdict wait, one spokesbot, the tempo levers (16 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.161, srv-2.6.46). **Follows:** `HANDOFF-to-main-2026-10-16-v0_6_203.md` (merged as PR #21). **Answers:** your play-test reply `REPLY-to-bot-2026-10-14-playtest.md` — the findings F2, F3, F4, F6, F10, F11 and the levers (a)–(d) of F12 / F13, as planned in `bot/docs/reviews/REVIEW-playtest-2026-10-14.md` (R3).

## 0. In short
- **v0.6.204 is R3 of our play-test review.** It is about time and order at a table with a human: when a bot's clock starts, where its hold lines go, what happens after a bot blocks you, which bot speaks for the table, and how long an empty turn or a quiet combat takes.
- **No new wire verb, no new frozen log line.** One new status rung (`resolve-verdict`), one new bot chat line (a question to a human), and a few bot lines move from the chat tier to the log tier (§2).
- **One test of yours goes red with v0.6.204 beside it:** v2.6.140 LIVE (the tempo meets the real bot). It reads the first moment the bot can be stepped, and that moment can now come before the question is sent, when `until` is null. A one-line change makes it green; we checked it in a scratch copy (§3).
- **Your rig needs one small change** for the new question (§3), and `PLAYTEST.md` has one sentence that is no longer true (§3).
- **Please re-embed `START-HERE-BOTS.html`** (§5).

## 1. What changed for you in v0.6.204
- **A clock starts when its question is on the wire (F3, F11).**
  - Before: every wait on a human (the block and reaction questions, the pool question, the vote poll, the seven combat steps, the damage step) armed when the bot QUEUED its question. At the client's pace each chat line ahead of it costs about 5 s, so in your play-test a 6 s combat step reached the table with 1.5 s left, and the block question added a "settle" for the queue to its clock: "3s" announced, 8.2 s real.
  - Now no clock arms while a line of the bot is still queued. Until the question has been sent, the wait has no deadline: `status()` says `until: null` (your panel shows the dash) and the step rung is there as usual. An answer in that time still counts.
  - The number a question announces is now its clock. The settle is gone. The bot's wait rows (`ana-wait.py`) and Adaptive's answer times count from the moment the question was sent.
- **The hold lines (F4).** "⏸ Holding for …" and "▶ Resuming." go to the head of the bot's queue, ahead of anything it had queued. A hold or resume line that the table has already moved past is dropped:
  - a resume that would arrive during the next hold;
  - a hold whose release came first;
  - a resume of a hold line the table never saw.
- **The verdict wait (F10).** When a bot blocks a human's action and it is the human's move, the bot now says so and waits on the tempo. Before, the bot logged "attempts to block." and then nothing happened: no clock, no rung, and your Pass was not read. A Standard table stood still for four minutes.
  - The question (§2) names the stealth and intercept on the counter.
  - The wait ends on the clock, on the actor's Pass / No / No reaction / It resolves (quick phrase or typed), or on the Bot button. The bot then declares the verdict from the counter, with the frozen §12 line `Block: Stealth A vs Intercept B — block succeeds|fails.`. Its own actions write that same line on the clock.
  - When the block succeeds, the bot fights. When it fails, the bot's block window opens again (another blocker, or Pass).
  - One exception: after the actor's It resolves, a failed block lets the action land at once. No second window opens after the actor's word.
  - The clock restarts on the actor's counter move, on stealth typed in chat (`+1`, `2`) and on the bot's own second intercept. A Hold on freezes it.
  - Your counter's own verdict line still ends the wait, as before.
  - In `status()` the wait shows as `state: 'asking'`, `waitingFor: 'block verdict (NAME)'` and `step: 'resolve-verdict'`. `until` is the deadline; it is null in Turn-based, and also while the question is still queued.
  - A bot actor declares every verdict itself, so there is no wait when a bot blocks another bot.
- **One spokesbot (F2).** The archetype remark used to be a chat line from every bot: "I read Johan's deck as Lawfirm (7 of 8 cards typical)." In your play-test, two bots said it in the middle of a block contest.
  - Now one bot says it, on the log tier: `NAME (bot) reads Johan's deck as Lawfirm (7 of 8 cards typical).`
  - It waits until no question, contest, combat or live counter (block, vote, combat) is open.
  - The spokesbot is the lowest-seated live bot. An ousted bot no longer speaks for the table.
  - The pool question stays per bot (Johan, 16 Oct).
  - Three actor notes that repeated the actor's own Misdirection / Fame / Pentex play line are gone. The target's own note explains its side.
- **Hold on between bots (F6).** At the client's pace, a bot target's "Hold on…" against a bot actor now waits for the actor's question. In your play-test it came 0.2 s before the question. Against a human it is said at once, as before.
- **The tempo levers (F12 / F13), (a)–(d):**
  - (a) No second beat before `Phase: Unlock.` (the turn's own beat is enough).
  - (b) Each `Phase: X.` line rides a short beat (0.4 × the pace: 1.24 s at the client's 3.1 s). Every phase line is still sent, so the phase bar and the other bots follow as before. The act that follows a line still takes its full beat.
  - (c) In a combat against a human, the round summary, the dodge summary and the combat-ends summary go on the log tier, without "tell me if your side differs". As a chat line the summary held the next question about 5 s. Between two bots nothing changes.
  - (d) The "Anything before range?", "Anything before strikes?" and "Anything before ending combat?" steps wait 1× the slider. The maneuver, strike and press steps keep 2×.
  - (e), Adaptive's skip under Standard, is not built: it would redefine Standard, and that is Johan's call.

## 2. For §12 and the panel (nothing to build, one label to choose)
- **New bot chat line**, a question to a human (speech tier: your client needs no reader, and no bot parses it):
  - `NAME (bot): VAMPIRE blocks (stealth A vs intercept B) — HUMAN, add stealth, or say Pass to resolve it (3s → the block succeeds)`
  - The tail is the tempo's usual one: `(no clock — I wait for you)` in Turn-based, where a reminder follows after two minutes: `NAME (bot): Still waiting for HUMAN: add stealth, or say Pass to resolve the block (or press the Bot button).`
- **The verdict line from the blocker's seat.** `Block: Stealth A vs Intercept B — block succeeds|fails.` is the frozen §12 line, unchanged. What is new is that a blocking bot sends it too (before: only the acting bot's clock or a human's counter).
- **The Bot button's new rung `resolve-verdict`.** Its row reads `block verdict (Anna)`. `BOT_STEP_LABEL` has no entry for it, so your panel shows "▶ Step", which works. We suggest the label **"Declare verdict"**. `botGiveWordTargets` is a filter, so the ▶ beside the 🤖 in Turn-based already gives it the word. When stepped, the bot logs `<b>NAME</b>: block verdict declared from the table controls.` (the same shape as "polls closed from the table controls.").
- **Lines moved to the log tier** (explanation, no reader):
  - `NAME (bot) reads X's deck as Y (n of m cards typical).` replaces the chat line `NAME (bot): I read X's deck as Y …`.
  - `NAME combat — …`: the round, dodge and combat-ends summaries in a combat against a human, without the "tell me" tail.

## 3. Your suite, your rig and `client/playtest/PLAYTEST.md`
- **Your v2.6.140 LIVE test** (`test-client-logic.js`, "the tempo meets the REAL bot through the bridge") fails with v0.6.204 beside it:
  - Its `waitOnHuman` returns the first status that can be stepped. With v0.6.204 that is often the moment the bot has queued its block question but not sent it yet. `until` is null then, by design (§1), so `the seeded Standard 3 s is what the bot keeps` reads `left: none`.
  - In the Standard half, wait for an armed clock as well, for example `waitOnHuman(ms, armed)` with `… && (!armed || st.until != null)` and `waitOnHuman(10000, true)` for part 1. The Turn-based half needs no change.
  - We ran exactly that in a scratch copy of origin/main with this release beside it: the test passes, and your suite is 300/1 (the one red is the embed drift, §5). Nothing of yours is changed in this PR.
- **The reflex's anchor:**
  - The panel row `block verdict (NAME)` already maps to your kind `verdict` (`askKind`), and the reflex's `no` for it, SAY[7] Pass, is read as an answer.
  - But the new question does not match your `QUESTION` regex. The reflex therefore arms from the 6 s status fallback, and under Standard 3 s the bot will have declared the verdict first.
  - Adding `add stealth` to `QUESTION` fixes it.
- **One sentence in PLAYTEST.md is no longer true:** "When a bot blocks your action and needs no card, it waits for you without a clock: add stealth or `resolve`." It now waits on the tempo's clock (Standard: the slider; Turn-based: no clock, a reminder). The answers are: add stealth (`chat +1`, or the counter), `say pass`, `say it resolves`, `resolve`, or `give`.
- **Your report's numbers:**
  - The "lag" (wait opened → question in chat) is still the queue time. R3 does not shorten the queue, except in combat, where the round summary before the next question is now a log line without the 5 s chat beat.
  - What changed is the clock: it starts when the question is sent, so a wait stays open for at least its lag plus its clock. "QUESTION AFTER THE WAIT CLOSED" should no longer appear for a wait that ended on the clock. It can still appear when an answer comes before the question has been sent (our uncertainties, READ-ME-FIRST-2026-10-16e).
  - While the question is queued, the panel shows no countdown (the dash).
- **`say it resolves` after `resolve`:** unchanged. `say it resolves` *instead of* `resolve` now declares the verdict, and when the block fails it lands your action.

## 4. Known, not built
- Lever (e), Adaptive's skip under Standard: Johan's call.
- The tempo lever for a bot-vs-bot combat a human watches: Johan's answer 3 (16 Oct), wait and see whether players react.
- Older, unchanged: a human's bounce of a bot's bleed is not read by the acting bot (handoff v0.6.203, §3).

## 5. The bundle
- `elysium-bot.js` (v0.6.204) and `START-HERE-BOTS.html` changed and are copied to the root in this PR. `elysium-cardfx.json` / `.js` and the twd files are byte-identical to v0.6.203's.
- **START-HERE-BOTS.html — please re-embed** (`embed-help.js bots`). Your embedded copy is v0.6.201's, so one re-embed covers v0.6.202–204. This release adds:
  - the bot's move after it blocks you: the question, your answers, and It resolves landing a failed block;
  - the hold line said ahead of the queue;
  - the clock starting when the question appears;
  - the 1× / 2× combat steps;
  - the spokesbot's deck-reading line in the log;
  - the round summary in the log;
  - the ▶ Step on "block verdict";
  - the version.
- **Deploy:** purge `/elysium-bot.js`, and re-embed the guide at your next client release.

## Gates (v0.6.204, from `bot/`)
- `node --check` on every changed file; `test-bot-logic.js` **2112/0 ×3** (v0.6.203: 2077; section 145 is new); the canary **69/0** (your copy); `diag-hb1-smoke.js` **11/11**; `test-bot-hotseat.js` **11/0**; `test-cardfx.js` not run (cardfx unchanged); `client/check-versions.js` agrees after the root copy.
- Destructive: section 145 on v0.6.203 4/31 (four guards green on both, no abort).
- Beside your current client (a scratch worktree of origin/main = a714cb0, client v2.6.161, with this branch's `bot/` and root bundle laid over it): your suite 299/2 — the embed drift and your v2.6.140 LIVE test (§3); with the change §3 gives, in the scratch copy only, 300/1; your canary 69/0; check-versions agrees.
- The arena smoke (seed 4003, 3 matches, 4 Expert bots, pool 30, the final bytes): no timeouts; every bleed paired (69), none vanished; the combat handshake 96/0, range 96/0, press 70/0, no wait ran into the safety net; the invariant checks 0 flags; the block audit clean.
