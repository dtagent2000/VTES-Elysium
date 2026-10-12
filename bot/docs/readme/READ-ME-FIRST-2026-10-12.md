# Elysium Bots — delivery 12 October 2026: bot v0.6.197 → **v0.6.198** (Hold on stops every clock + the steal reads the taken line) — DEPLOY CANDIDATE

**What it is.** Main's reply to v0.6.195–197 (client v2.6.141, revised 12 Oct) had two things for us. Both are built.

## 1. A Hold on stops every clock that waits on a human
Your principle, agreed with main: a Hold on stops every bot clock that waits on a human, and the clock starts again from the beginning when the hold is released.

| Wait on a human | v0.6.197 under a hold | v0.6.198 |
| --- | --- | --- |
| Block / reaction question | stood (the holder's own pause) | stands |
| Vote poll | stood (the holder's own pause) | stands |
| Pool question | ran out: answered No, and the bot said No block | stands |
| The seven combat steps and the damage step | ran out: the step moved on | stand |
| Turn-based reminder and 4-minute give-up | kept running | stand |

- **The release** restarts every clock from the beginning: It resolves, Pass, No block, Release hold in the Bot Activity panel, or the holder leaving the table.
- **An answer still counts at once:** a card, a line, Pass, Yes / No, a vote.
- **The bot says the hold** when it waits inside its block question, a combat step or its vote poll: "⏸ Holding for Anna — say 'It resolves' when ready." The pool question stays silent, because every bot asks its own (debt 23c).
- **One behaviour change:** in a bot's vote poll, the holder's vote (or "No") is an answer, not a release. The poll waits until you say Pass, or It resolves, which still closes it at once.
- **Found on the way:**
  - a typed "hold on" now pauses the block question like the quick phrase;
  - a typed "it resolves" answers a combat step;
  - the "Any bleed modifiers?" grace stands under a hold;
  - a holder who leaves also frees the vote poll;
  - a release by anyone ends everyone's pause, and your "It resolves" in a bot's block question lets the action through (an independent review of the diff found that a pause outliving the release could leave a bot's vote poll with no clock and no button);
  - a question asked while the table is on hold says so instead of promising a clock;
  - the stopwatch does not ring on a held table.

## 2. The steal reads your taken line
- **The problem:** your client never applies combat damage to the board. So in round 2+ the board can still show the blood from before the damage.
- **The fix:** the bot's steal cap takes your own taken line ("Lisa takes 1 (loses 1 blood, now 2).") within the combat. When the board changes, the board wins again.

## A correction
I said yesterday that the ▶ stepped only the block and pool questions. It has been a filter since client v2.6.139. Main read their code right, and our 11 Oct handoff should not have listed it as open.

## Gates
- suite **1933/0** ×3 (section 137: 73 assertions; eighteen mutants of the new code, each caught; 96e rewritten for the behaviour change);
- an independent review of the diff: one serious finding and four minor ones, all fixed and pinned in section 137;
- canary 57/0 and hotseat 10/0 against client **v2.6.141**;
- the three data twins checked value for value;
- no line over 4000 chars.

## For main
- Send `HANDOFF-to-main-2026-10-12-v0_6_198.md`.
- Deploy `elysium-bot.js` v0.6.198. No wire change.
- The zip's `bundle/` folder holds the three data twins for their download bundle, unchanged data.

## Project files
- **Replace:** `elysium-bot.js`, `test-bot-logic.js`, `START-HERE-BOTS.html`, `CLAUDE.md`, `elysium-bot-CHANGELOG.md`, `elysium-bot-learnings.md`, `SKILLS.md`, `elysium-bot-session-journal.md`, `elysium-bot-project-context.md`.
- **New:** `HANDOFF-to-main-2026-10-12-v0_6_198.md`, this file, and `REVIEW-vtes-player-2026-10-11.md` if it is not in the project yet.

## Next
1. Your playtest with two bots. The review's checklist is at the end of the REVIEW file.
2. Your pick from the review. Suggested first: the paired bench read, flip counts, one bot asks the pool question.
3. **Open leads** (new):
   - the "Any bleed modifiers?" grace is a 4 s wait outside the tempo, so Turn-based does not wait for you there;
   - a hold during a bot-vs-bot combat can delay a prevention card past the other bot's 2 s window.

   Plus the three from 11 Oct.
