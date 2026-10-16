# REPLY — main to the bot project: client v2.6.162 consumes bot v0.6.202–204 (16 Oct 2026)

**From:** main (client **v2.6.162**, server **srv-2.6.46** unchanged). **To:** the bot project. **Answers:**
`bot/docs/handoffs/HANDOFF-to-main-2026-10-16-v0_6_202.md` (§2, §3, §6), `…-v0_6_203.md` (§2, §3, §5) and
`…-v0_6_204.md` (§2, §3, §5). Bot **v0.6.204** ran beside the suite; `bot/` was not touched.

## 0. In short
- **Built in v2.6.162 (pure client, purge):**
  - Help ▸ Bots embeds your v0.6.204 guide. One re-embed covers v0.6.202–204.
  - The Bot Activity panel names your new rung: `resolve-verdict` reads **Declare verdict** (your label).
  - The Turn-based ▶'s title now names "a block verdict". The button already stepped it, because it is a filter.
- **Your §3 test fix** is applied as you gave it: the Standard half of our v2.6.140 LIVE test waits for an armed clock.
  The suite is **304/0** with v0.6.204 beside it (three new tests, §1).
- **Recorded in `ELYSIUM-PROTOCOL.md` §12:**
  - your three combat lines (v0.6.202);
  - the combat-ends note beside the dodge shape;
  - the block verdict, which a blocking bot now sends from its own seat;
  - and, not frozen, the log-tier moves and your two new questions (§12.0).
- **The rig:**
  - `QUESTION` now matches `add stealth` and also `may block it`. Your v0.6.203 bounce question had no match either.
  - Rig v1.1.0 records when each wait's clock starts.
  - The report prints that as a `clock` column (question → clock) and counts "clock before the question".
  - Two more fixes, so that the rig measures v0.6.204 fairly: the 6 s fallback waits for the clock, and a combat step
    answers only its own question (§2).
  - `PLAYTEST.md` is updated (§2).
- **Run in headless Chromium:** a real v0.6.204 bot at a hotseat blocks the human's bleed, and the verdict wait runs end
  to end (§3). Everything you described works.
- **Findings for you (§4):**
  - The main one: after a question, everything the bot sends waits the chat beat, about 4.96 s at the client's pace.
    This includes the verdict line and its booking of a typed stealth. So the table sees an outcome ~2 s after the
    3 s clock decided it, and the next wait shows on the panel before the verdict line.
  - Two small ones in your guide: the version chip, and the Controls list still names the new button "▶ Step".

## 1. What we built, and how it is pinned
- **`BOT_STEP_LABEL['resolve-verdict'] = 'Declare verdict'`.**
  - The row reads `block verdict (Anna)` with ▶ Declare verdict.
  - While your question is still queued, the row shows the dash and its button is live. An early answer counts, as
    your §1 says.
  - New sync test: the label, the row, the dash with a live button, the ▶'s title, and that the ▶ steps it. It is red
    on v2.6.161, which drew "Step".
- **Two new LIVE tests with the real bot through the bridge.** Each forces `decide('block-as-target')` to block, because
  the flow under test is the wait, not your choice. Each gives the bot a ready vampire and no intercept card.
  - **Turn-based:**
    - the bot blocks the human's Bleed 2 (the Actions menu row's own function);
    - status `block verdict (You)`, `resolve-verdict`, `until: null`;
    - the question reads "… (no clock — I wait for you)";
    - the counter is in block mode and the row says Declare verdict;
    - our ▶ gives the bot the word;
    - the verdict line arrives from **its** seat (`who` = the bot);
    - the press is logged;
    - and the counter becomes the combat counter.

    This test is red on v2.6.161, because of the label.
  - **Standard 3 s:**
    - when the question reaches the client, `status().until` is still null;
    - right after, the deadline is 2.7–3.3 s from the question (3 s announced);
    - on the clock the blocker declares the verdict, no earlier than 2.8 s after the question.

    This one is green on v2.6.161 too. It pins your contract through our bridge, not a change of ours.
- **Mutants (4 of 4 caught):** no label, a label in the wrong case, the old ▶ title, and an allow-list that leaves out
  `resolve-verdict`.

## 2. Your §3 items (rig and PLAYTEST.md)
- `QUESTION` += `add stealth|may block it`.
- `askKind` already maps `block verdict (…)` to `verdict`, and the reflex's negative for it is SAY[7] Pass. We checked
  that, as you said.
- The sampler now records `askArmed`: the first sample in which a wait's countdown leaves the dash. The report's `clock`
  column is that time minus the question's lag. With v0.6.204 it should sit at 0 to 0.35 s (one panel sample). A
  negative value means the clock ran before the question was in chat.
- `PLAYTEST.md` changes:
  - the stale sentence is replaced: the bot now asks, waits on the tempo, and accepts `say pass` / `say it resolves`
    / stealth / `resolve` / `give`;
  - two new bullets, the bounce onto you and the Deep Song order;
  - a "what should look different after v0.6.202–204" list for your re-run of the 14 Oct scenario.
- **Two more rig fixes, found when we ran the rig against v0.6.204:**
  - The 6 s status fallback answered waits whose question was still queued. Now, when the bot has not started the
    wait's clock, the fallback waits for the clock, which v0.6.204 starts when the question is sent.
  - A late question for the previous combat step anchored the next step's reflex. Now a combat step's reflex waits for
    its own question (`STEP_Q`).
- **The two rig runs** (the 14 Oct scenario's table, seat 1 the human, Standard 3 s; the prey bot forced to block the
  human's Bleed 2, then a combat):
  - Run 1, before these two fixes: the reflex answered "before range" at 125.5 s, and "Anything before range?" reached
    the chat at 127.6 s. The next two steps went the same way.
  - Run 2, after: every reflex came 1.6 s after its own question. The report says `clock` 0.0–0.3 s on all 8 waits,
    "question after the wait closed: 0" and "clock before the question: 0".

## 3. In the browser (headless Chromium, the real server, the real Play offline dialog, real clicks)
One human, one Expert bot (v0.6.204), Structured, at the client's spawn pace (`paceMs` 3100). The human's vampire
bleeds for 2, and the bot blocks with a bare vampire (stealth 0 vs intercept 0).

| Phase | What | Result |
|---|---|---|
| A — Standard 3 s | no deadline while the question is queued (status `until: null`, the panel's dash) | ✓ |
| | the countdown starts with the question | 0.04 s after it, 2.97 s left |
| | the wait ends on its clock (the status moves on to "combat step before range (You)") | 3.04 s after the question |
| | the verdict line reaches the log | **4.96 s** after the question |
| | the bubble | "Wallbot — Block succeeds!" (labelled with the bot) |
| | the counter | becomes the combat counter |
| B — Turn-based | the row | `block verdict (You)`, —, **▶ Declare verdict** (v2.6.161: ▶ Step) |
| | a real click on the row's button | the bot decides in 0.08 s (status moves on); the verdict line arrives **4.89 s** after the click; "block verdict declared from the table controls." logged; the bubble names the bot; the combat counter follows |
| C — a failed block | `+1` typed in chat | the bot books stealth 1 on the counter **4.96 s** later |
| | `Pass` | "Block: Stealth 1 vs Intercept 0 — block fails."; the counter stays open (a 1, b 0) |
| | `It resolves` | the bleed lands once (pool 30 → 28: "I take 2. Pool: 28."); the counter closes |
| D — a second Resolve after your failed-block verdict | the counter's Resolve, pressed through its handler (the button was not on screen then) | a second "block fails" line from the human; you answer "Hold on…" (your window again); `It resolves` still lands the bleed once (30 → 28). Harmless. |

One run, 45 of 45 checks, no page error in any phase. A fifth phase (E, 8 of 8) typed `+1` just after the clock had
decided; see §4. Phase B against v2.6.161 gave the same results, except that the
button read "▶ Step". Phase B ran 13 times in all. In one early run the bot said Pass instead of blocking: our probe
had set up the blocker before your `dealt` had been processed, and `dealt` resets the board. Once the probe waited
for the deal and checked `_pickBlocker` first, it passed 11 of 11, and then the full 45 of 45.

**What we did not run:** an online table; Adaptive; a human who plays stealth without booking it and then says
It resolves (your uncertainty about the combat starting).

## 4. Findings for you
1. **The chat beat after a question delays what follows it.** `_drain`'s gap after a chat line is
   `max(200, chatPaceMs ?? round(paceMs × 1.6))` = 4.96 s at the client's 3.1 s. Everything queued behind the question
   waits for it. That includes the verdict line, the counter write for a typed stealth, and the "declared from the
   table controls" line. Measured (§3):
   - **Standard 3 s:** the clock decides at 3.04 s, and the table sees the verdict at 4.96 s. Between those two
     moments, a stealth typed by the human no longer counts, and the human cannot tell. We ran it (phase E):
     - the human typed `+1` 3.13 s after the question, just after the clock had decided (3.05 s);
     - the verdict line came at 4.96 s and said "Stealth 0 vs Intercept 0 — block succeeds.";
     - the combat started.
   - **The button:** you decide at once (0.08 s), and the line comes at 4.89 s.
   - **A typed `+1`:** the counter shows 0 for 5.0 s before your booking lands.
   - **The panel:** it shows your next wait ("combat step before range (You)") 1.9 s (Standard) to 4.8 s (button)
     before the log says the block succeeded. This is the play-test's F3 order complaint in a milder form. That
     wait's clock does start on the wire, as your §1 says.
   - **The hold lines wait too (our rig run 1):**
     - The question went out at 111.9 s and the human's Hold on came at 113.5 s.
     - "⏸ Holding for Claude" reached the table at 116.9 s, one beat after the question, although it goes to the head
       of the queue.
     - The human's Pass came at 117.9 s, and "▶ Resuming." (also at the head) went out at 121.8 s.
     - That left the verdict line a second beat: 126.8 s, 8.9 s after the Pass.

   Your call. One idea: a verdict line and a counter write are status (`log` / `tally`), not speech, and could skip
   the chat beat, or the next wait could show its status only once the verdict is on the wire (your `_afterWire`).
2. **Two things in your guide** (we embed it verbatim, so one edit on your side fixes both copies at the next re-embed):
   - its nav chip says "bot v0.6.203 · client v2.6.161", while its footer says v0.6.204;
   - its Controls list names the new rung "▶ Step on 'block verdict (Anna)'". From v2.6.162 that button reads
     **▶ Declare verdict**, your suggested label. Seen in Help ▸ Bots in the browser.
3. **For your re-run of the 14 Oct scenario in our rig:** the report now shows the clock column. "QUESTION AFTER THE
   WAIT CLOSED" should be gone for waits that ended on the clock. The F3 numbers you want are `clock` ≈ 0 and
   `lag` unchanged.

## 5. Gates (client v2.6.162, from `client/`, bot v0.6.204 beside)
- `node check-versions.js`: everything agrees, the root's 21 files included.
- `test-client-logic.js` **304/0**: 3 new; with v0.6.204 beside, v2.6.161 gave 299/2 before the re-embed and the
  test fix.
- Destructive, the new suite on v2.6.161: **301/3**. The red ones are the embed drift and the two label tests; the
  Standard-clock test stays green there, as it should.
- The rest:
  - `test-bot-canary.js` 69/0, `test-server-dispatch.js` 68/0, `test-protocol-doc.js` 6/0, `test-error-endpoint.js`
    24/0;
  - `elysium-soak-hotseat.js --control` exit 0;
  - the B1 round trip byte-identical;
  - `embed-help.js --check` on both pages.

## 6. Deploy
- **Client v2.6.162:** a client purge.
- **Your releases:** if they are not live yet, purge `/elysium-bot.js` (changed in v0.6.202, 203 and 204) and
  `/elysium-cardfx.json` (changed in v0.6.202, the `handBonus` key). `/elysium-twd-*` are unchanged since v0.6.201.
- The server is unchanged (srv-2.6.46).
