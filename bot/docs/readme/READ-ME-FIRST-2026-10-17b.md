# Elysium Bots — delivery 17 October 2026 (later): bot v0.6.206 → **v0.6.207** (Johan's two answers: the probe default 2, the chat beat built) — DEPLOY CANDIDATE

**What it is.** v0.6.206 (PR #26) was merged at 00:28. Johan answered its two proposals at 00:54: "Vi kan gå på dina
rekommendationer för 1 och 2". Those answers came after the merge, so they ship here as a release of their own. I first
told him they would go into #26, which had already been merged; this release corrects that. Everything else of the round
(the late bounce, the two window fixes, the probe lab, the chat-beat analysis) is in v0.6.206 and its READ-ME-FIRST
(`READ-ME-FIRST-2026-10-17.md`). The analysis and the measurements are in `docs/specs/spec-next-2026-10-17.md` §2–§3.
This file holds only what changed.

## 1. The probe default is 2 (Johan's bait read)
- **What 2 does:** the probe order puts the small bleeders first and the puncher last. With 2, the probers keep their hands
  off the heavy card (the Govern) only when my actors out-number my prey's unlocked bodies at the minion phase's start.
  With more actors than blockers, the 1-bleeds draw the blocks and the Govern goes last, with the best chance of an
  unblocked action.
- **Why** (the probe lab, v0.6.206's `lab-probe.js`: 360 tables, the same table in every arm, real bots defending):
  - when I out-number (91 tables), the pool landed per probe turn goes 1.92 → 2.73 (+0.80 ± 0.14; better on 43 tables,
    worse on 5), and the Govern lands 56 times instead of 8;
  - when I do not (116 tables), every bleed is blocked in every arm (0.00 → 0.00), so 2 does nothing there.
- **The rollback:** `--knob probeHold=0` plays as v0.6.143–206 did (the order, no reservation). 1 is the reservation
  everywhere, as first designed.
- **Johan on the five worse tables:** each was a prey with one unlocked body and a wake in hand. It blocked the prober
  with the body and woke for the punch. Counting the prey's wakes as blockers belongs to the knowledge layer, in two parts:
  - does the deck hold wakes at all (the deck read);
  - how likely is one in hand now, given how many cards it has cycled and how many wakes it has played.

  Recorded as `bot/CLAUDE.md` 65f and in the spec §2. Not built.
- **The guide** (`START-HERE-BOTS.html`, 'Posture') now says it: when a stealth-bleed bot has more vampires ready than you
  have blockers up, it probes with chump bleeds and keeps the big Govern for the last one.

## 2. The chat beat after a question (main's finding 1): built as proposal A
After a chat line, `_drain` made the next message wait the chat beat (4.96 s at the client's pace), whatever that message
was. That covered the verdict line, a counter write, the table button's line, a quick phrase, and the hold and resume
lines. Measured on the bot's own drain with a recording socket (section 153):

| | v0.6.206 | v0.6.207 |
|---|---|---|
| The verdict on the 3 s clock | 4.96 s | 3.04 s |
| The table button's line | 4.96 s | 0.20 s |
| A typed `+1` on the counter | 4.97 s | 0.20 s |
| A quick phrase | 4.96 s | 0.20 s |
| The hold line (Hold on at 1.6 s) | 4.96 s | 1.60 s |
| Two chat bubbles | 4.96 s | 4.96 s |

- **What was built** (main's first idea):
  - only a CHAT waits the beat, measured from the last chat on the wire (`_lastChatWireAt`). `say()` still stamps
    `_lastChatAt` at queue time, because that is what `_pace` reads.
  - everything else rides the 200 ms cascade since the last send;
  - a hold or resume line (`_holdTags`) skips the beat. It answers the human's own Hold on, and they are looking.
- **Unchanged:**
  - the bot's own acts still wait out the bubble in `_pace`, so Johan's v0.6.100 rule stands;
  - one queue keeps the order of the lines;
  - the arena (pace 0) is untouched;
  - the suite's pin on the beat (78d).

## 3. A correction: R4's window counts
v0.6.206's `ana-windows.py` counted a block contest that failed at the clock as a lost answer. The tool now splits a slow
window that saw a block attempt (blocked, or failed against the actor's stealth) from one that lost its answer. R4's
smokes are therefore 245 of 379 bleed-total windows and 14 of 97 modifier windows that lost their answer, not 253 and 22.
The two numbers are corrected wherever v0.6.206's docs gave them, with a note. The fix itself is unchanged: the merged
v0.6.206 smoke still shows 0 of 80 lost, with 5 contests, all blocked.

## 4. Tests
- **151a** runs 0 explicitly (the rollback). **151d:** the manifest without the option reads `probeHold` 2. **151e:** the
  default plays as 2 through the whole minion phase. Gelasia probes for 1 with the Govern reserved, and Colette punches for
  3 with it.
- **Section 153** (4): the scenarios above on the bot's own drain at `paceMs` 3100, six bots side by side, one recording
  socket each. Each assertion is checked:
  - the verdict at 3.04 s, and the counter write after it;
  - the button's line, a typed `+1` and a quick phrase within 0.7 s;
  - the hold line at 1.6 s, and the resume line and the verdict right after the Pass at 6.0 s;
  - two chat bubbles still a full beat apart.
- **Destructive, on the merged v0.6.206 bytes:** 151d–e 0/2; 153 1/3 (the green one is the chat-to-chat beat, unchanged by
  design).
- 2204 assertions (v0.6.206: 2199).

## Gates
- `node --check` on every changed file (`elysium-bot.js`, `test-bot-logic.js`); `ana-windows.py` compiles.
- **Suite 2204/0 ×3** — alone, each run in a frozen snapshot; `elysium-bot.js` 4ba3a5cf…, `test-bot-logic.js` 67e13d9d…,
  `elysium-cardfx.json` bea73088…. v0.6.206 had 2199; the five new are 151e and section 153 (151d changed).
- **Canary 69/0** (main's current client copies), **HB1 11/11**, **hotseat 11/0**. test-cardfx not run (cardfx unchanged).
- **check-versions** (from `client/`): everything agrees; the root's 21 files are byte copies.
- **Beside main's client v2.6.162:** the client suite 303/1. The one red is the embed drift (Help ▸ Bots embeds an older
  guide; a re-embed closes it). All 15 LIVE tests with the real bot are green, among them the two v2.6.162 verdict-timing
  tests the chat beat touches. Their canary 69/0.
- **The smoke** — seeds 9701, 9702, 9703 and 4003, the V5 table, on the v0.6.207 code before the version bump (the release
  bytes differ only in comments and the version line):
  - bleed 77/77 paired, VANISHED 0;
  - the reactions-only windows (`ana-windows.py`): 82, none lost its answer; 8 were block contests decided at the clock
    (5 blocked, 3 failed against the actor's stealth);
  - no `stale-answer` row;
  - the probe order fired 3 times and was reserved all 3 times (out-numbering each time), with 4 `probe-hold` rows;
  - handshake integrity, range and press 160/0, 160/0, 118/0, no wait in the safety net;
  - invariants 0 flags; the block audit 0 violations; no late bounce in 77 bleeds through; 3 fetches, no phantom window;
  - dealt ≠ taken in 19 rows, all explained: 8 the Murder of Crows Larissa Moreira bore, 7 her Guardian Angel, 3 Hidden
    Strength, 1 Carrion Crows; steal pairs 13 of 13 equal.
- **For comparison, v0.6.206's final smoke** (the same seeds, `probeHold` 0): bleed 77/77, 0 of 80 windows lost (5
  contests, all blocked), the probe order 6 times and reserved 0, one right `stale-answer` row, 188/0, 188/0, 150/0.

## For main
- Send `HANDOFF-to-main-2026-10-17-v0_6_207.md`:
  - nothing to build;
  - their finding 1, built as their first idea, with the measurement;
  - the probe default at their tables;
  - the guide re-embed (the version, and the probe sentence under 'Posture').

  v0.6.206's handoff stands for the rest.
- Deploy `elysium-bot.js` v0.6.207.

## Things I am not sure about
- **The probe default at a human table.** A stealth-bleed bot now often bleeds for 1 with its first vampires and keeps
  the Govern for the last. A human who holds a wake for the big one stops it anyway. Nobody has played against it.
- **How often 2 acts.** Arm 2's 'out-number' compares my actors with my prey's unlocked bodies at the minion phase's
  start. In the arena it was true 17 times in 19 (v0.6.206's probe series and the round's three smokes); in the lab's
  random tables, 4 in 9. So the reservation acts on most probe turns in real play. The lab's +0.80 is per such turn.
- **The lab measures one turn.** It covers a Malkavian actor, bot defenders and hands built to fire the order. It does not
  see the turn after, the combats' consequences or a human defender. Its five losses were all a prey holding a wake, and
  the sharper read (65f) is not built.
- **The chat beat at a human table.** A status line or a quick phrase now reaches the table about 0.2 s after a question,
  while the question's bubble is still up. The client shows up to three bubbles side by side, so they should read, but no
  human has seen it. If main's rig still shows the panel's next wait before the verdict line, their second idea (delay
  the panel) is the fallback.
- **The smoke ran on the code before the version bump.** The release bytes differ from the smoke's only in comments and
  the version line; the suite and every gate ran on the release bytes.
- **Still open from v0.6.206:**
  - the stale guard is a heuristic: a late answer that arrives after my opening line is on the wire is still taken;
  - every arena number since v0.6.144 carried the dead bleed-total clock, so the next re-measure needs a fresh baseline;
  - between bots a contested block's verdict waits for the actor's clock: 3.4–4.4 s from the line to the verdict in the
    final smoke.

## Next
1. In Johan's order (READ-ME-FIRST-2026-10-16e, "After R4"):
   - the 14 Oct play-test scenario in main's rig (`--dir` on a scratch copy of the root with the bot branch);
   - then the larger re-measure, against a baseline run on v0.6.207. Every arena number since v0.6.144 carried the dead
     bleed-total clock, and the probe default changed here. `dodgeOut` and `probeHold` can be benched there.
2. The knowledge layer, when its turn comes: the prey's wakes as blockers in the probe's 'out-number' (65f).
3. Parked, as in READ-ME-FIRST-2026-10-16f "Next" §6.
