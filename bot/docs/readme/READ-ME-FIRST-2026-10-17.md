# Elysium Bots — delivery 17 October 2026: bot v0.6.205 → **v0.6.206** (the late bounce, the probe reservation measured, the chat beat analysed; two window fixes found by the release's own smoke) — DEPLOY CANDIDATE

**What it is.** Johan merged v0.6.205 (PR #25) and said go on with the next step: the three items we agreed on 16 Oct
(21:27). These were the probe reservation measured before and after, the chat beat after a question analysed properly,
and the late bounce found in R4's final smoke. The release's own smoke then found two more faults in the actor's block
windows. Both are fixed here, by the combining rule. The analysis, the measurements and the proposals are in
`docs/specs/spec-next-2026-10-17.md`. Two items wait for Johan: the probe default and the chat-beat change.

## 1. The late bounce — found and fixed
- **What R4's smoke showed:** a bot target bounced a bot's bleed after the actor had resolved it — twice in ~470 bleeds
  through, each right after a Magic of the Smith.
- **The cause:**
  - The fetch's note read `fetches X from the library and equips V (…).`, which matches `L12.uEquip`.
  - The actor's prey and predator opened a window for an equip that never happened and said Pass.
  - That Pass reached the actor while its next action — a bleed — was still in its send queue (the token bucket holds a
    busy turn's lines for about a second). The actor took it as the prey's answer to that bleed's `Block?` before the
    prey had seen the bleed.
  - From then on every answer fell one window late. The actor resolved, the prey's Deflection came after, and the
    actor's resolution line named the wrong seat.
- **Three layers, each enough alone** (checked on scratch copies with one layer each):
  1. The note says it otherwise: `X comes from the library onto V (…).` It was the only bot line with *equips* /
     *employs* outside a real equip announce.
  2. `_parseUndirected`: a bot's line that names no minion on that bot's public board opens no window. A human's line is
     untouched.
  3. `_askSeen` / `_staleAnswer`: a bot's answer that reaches me while the line that opened my window (`_openLine` — my
     announce, a modifier's add line, the bleed total; never a note) is still in my send queue answers an earlier window.
     It is ignored, with a `stale-answer` trace row. A bot answers on that line, so it cannot have seen what has not left
     my queue. A human's answer is never second-guessed: the fx clone can show the action before my line.
- **Found on the way:** the arena's knob whitelist never got v0.6.205's `dodgeOut`, so `--knob dodgeOut=0` was ignored
  with a warning. Arena v1.4.8 whitelists it and `probeHold`.

## 2. Found by the release's own smoke — fixed
**(a) Layer 3's first cut was too coarse.**
- It waited for *everything* I had queued before the question, not for the line that opens the window.
- A modifier's add line is followed by my board push. My prey answered the add line while the board was still queued,
  so its Pass was taken for stale.
- In seven matches (the probe series, below), 19 stale-answer rows, all in the window after a bleed modifier:
  - 17 Passes ignored, each window then running out its clock (3.3 s);
  - one Block! from a bounce's new target dropped. Seed 9701, match 1: Sully's bleed (1 + Bonding) bounced to the
    Nosferatu, Ryan blocked through Guard Dogs, the actor never took the attempt up, and the Nosferatu took 2 pool.
- Fixed: `announced` anchors on `_openLine`. On the final bytes it fired once in four matches, and rightly: my hunt's
  line sat in my queue while my prey was ousted, reached my NEW prey a second late, and its Pass arrived while my next
  bleed's announce was still queued. Without the guard that Pass would have answered the bleed.

**(b) An older race: a 150 ms sleep between a line and the window it opens** (since v0.6.144's bleed total).
- After a modifier's add line, and after the bleed total's `+0` line, the actor slept 150 ms before it opened the
  reactions-only window. A bot answers that line in ~50 ms at pace 0.
- A Pass that came in that gap found no ask open and was lost, so the window ran out its clock. In R4's smokes
  (v0.6.205 and its cuts) 253 of 379 bleed-total windows and 22 of 97 modifier windows did.
- And a bounce's new target's Block! was lost the same way, so the bleed landed on the blocker. Section 152 reproduces
  it: a Nosferatu at 1 pool blocks the bounced bleed and is ousted by it on v0.6.205.
- Fixed: both windows open in the same tick as their line.
- **Where it bit:** at pace 0, the arena. At a human table a bot answers after its reaction pace (seconds), long after
  150 ms, and a human cannot answer that fast. So both faults are arena faults — but every arena measurement since
  v0.6.144 carried ~3 s of dead clock per bleed total, and the odd lost block.

## 3. The probe reservation — built behind a knob, measured, default unchanged
- **The bug:** since v0.6.143 the minion phase set `this._probe` and reset it two lines later. The probe ORDER worked
  (the small bleeders first, the puncher last). The RESERVATION never did, so the first actor simply played the Govern.
- **The fix:** `_probeOrder(actors)` owns both. Knob `probeHold`:
  - 0 = as it has played (the default);
  - 1 = the reservation as designed;
  - 2 = only when my actors out-number my prey's unlocked bodies — Johan's bait read.
- **Trace rows:** `probe-order` gains `hold`, `outnumber` and `reserved`; `probe-hold` is new (the reservation took the
  heavy card from a prober). The reservation dies with the minion phase.
- **The measurement (spec §2):**
  - In the arena the order fires about once a match. Seven matches show the knob firing (reserved 3 of 3 at 1, 2 of 2 at
    2) and can weigh nothing.
  - In the lab (`lab-probe.js`): 360 random tables, the same table in every arm, one whole minion phase, real bots
    defending. The order fired on 207.
  - **When my actors out-number my prey's unlocked bodies** (91 tables), the pool landed per turn goes 1.92 → 2.73
    (+0.80 ± 0.14; better on 43 tables, worse on 5), and the Govern lands 56 times instead of 8.
  - **When they do not** (116 tables), every bleed is blocked in every arm: 0.00 → 0.00. Arm 1 holds the card there for
    nothing; arm 2 does not. Arms 1 and 2 land the same pool.
  - The five worse tables are a prey with one body and a wake: it blocks the prober with the body and wakes for the
    punch.
  - Blocks per turn are unchanged (2.08 / 2.09).
- **Proposal for Johan:** `probeHold` 2 as the default — your bait read, holding only where it pays. Now, in the next
  release (one default value), or with the larger re-measure's bench. Over a match it is worth under one pool for a
  stealth-bleed deck, far below what a bench can see.

## 4. The chat beat after a question (main's finding 1) — analysed, proposal for Johan
After a chat line, `_drain` makes the next message — whatever it is — wait the chat beat (4.96 s at the client's pace).
Measured on the bot's own drain with a recording socket:

| | Today | Proposal |
|---|---|---|
| The verdict on the 3 s clock | 4.96 s | 3.04 s |
| The button | 4.96 s | 0.20 s |
| A typed `+1` | 4.97 s | 0.20 s |
| The hold line | 4.96 s | 1.60 s |
| Two instruction lines | 4.96 s | 4.96 s |

- **The proposal (main's first idea):**
  - the beat separates two chat bubbles and nothing else;
  - a hold or resume line skips it;
  - the bot's acts still wait out the bubble in `_pace`, so Johan's v0.6.100 rule stands.
- **Unchanged:** the arena (it runs at `paceMs` 0) and the suite's pins on the beat (78d).
- **Not built.** Johan's "kör" first. The options and the risks are in the spec, §3.

## 5. Tests
- **Section 150** (10): the late bounce.
  - (a) A whole turn: the fetch opens a window for the fetch and nothing else.
  - (b) The parser guard, and its scope (a real announce, a human).
  - (c) The stale answer, and its scope (a human).
  - (e) The anchor: a Pass on a modifier's add line, and a Block! on an announce, with my board still queued behind.
  - (d) End to end on the bots' own send queues: the bleed resolves bounced and names the right seat.
- **Section 151** (5): the probe reservation through the whole minion phase at 0, 1 and 2 (out-numbering and not), and
  the knob in the manifest.
- **Section 152** (2): the reactions-only windows, a whole turn on the bots' own queues — a bounce's new target blocks
  at once and the block is taken up; a Pass on the total answers at once (not at the clock).
- **Destructive:**
  - on v0.6.205: 150 is 5/5 (the five green ones pin the scope), 151 0/5 (151a is red only for the trace row's new
    fields; at 0 it plays as v0.6.205 did, by design), 152 0/2;
  - on the first cut of v0.6.206: 150e 0/2; on the anchor without the race fix: 152 0/2.
- **Each layer alone, against 150d:**
  - only the stale-answer guard: green (150a is red: the phantom window still opens, and its Pass is now ignored);
  - only the parser guard: green (150a is green; the note text is red).

## Gates
- `node --check` on every changed file (`elysium-bot.js`, `test-bot-logic.js`, `elysium-bot-arena.js`, `lab-probe.js`; the
  Python tools compile).
- **Suite 2199/0 ×3** — alone, each run in a frozen snapshot; `elysium-bot.js` a9e38637…, `test-bot-logic.js` b6b35673…,
  `elysium-cardfx.json` bea73088…. v0.6.205 had 2182; the 17 new are sections 150–152.
- **Canary 69/0** (main's current client copies), **HB1 11/11**, **hotseat 11/0**. test-cardfx not run (cardfx unchanged).
- **check-versions** (from `client/`): everything agrees; the root's 21 files are byte copies.
- **Beside main's client v2.6.162:** the client suite 303/1 — the one red is the embed drift (Help ▸ Bots embeds an older
  guide; a re-embed closes it). Every LIVE test with the real bot is green. Their canary 69/0.
- **The final smoke** — seeds 9701, 9702, 9703 and 4003, the V5 table, the final code (the bytes differ only in the version
  comment):
  - bleed 77/77 paired, VANISHED 0;
  - the reactions-only windows: 0 of 80 ran out their clock and went through; 5 were blocks taken up, with the verdict at
    the clock;
  - one `stale-answer` row, and a right one (§2a);
  - handshake integrity, range and press 188/0, 188/0, 150/0, no wait in the safety net;
  - invariants 0 flags; the block audit 0 violations; no late bounce in 77 bleeds through; 2 fetches, no phantom window;
  - dealt ≠ taken in 24 rows, all explained: 18 Guardian Angel, 4 the Murder of Crows Larissa Moreira bore, 2 Carrion
    Crows.
- **The probe series:** seven matches on the first cut, then stopped. The knob fires, and their audits found §2a.
- **The lab:** 360 tables (seeds 1–3), the order fired on 207, 0 errors; arm 2's derivation matched on all 120 tables where
  arm 2 ran.

## For main
- Send `HANDOFF-to-main-2026-10-17-v0_6_206.md`:
  - nothing to build;
  - the fetch note's new wording, in case their rig matched the old one;
  - our measurement of their finding 1 and the proposal;
  - the two window fixes, for the record (pace 0 only — nothing changes at their tables);
  - the guide re-embed (the version only).
- Deploy `elysium-bot.js` v0.6.206.

## Things I am not sure about
- **The stale guard is still a heuristic about who answers what.** It holds an answer back only while the line that
  opened my window is still in my queue. A late answer that arrives after that line is on the wire is still taken. The one
  true positive in the final smoke (a hunt's line held back while my prey was ousted) was caught only because my next
  announce was still queued. How often that shape slips through, I do not know. It needs an oust in the middle of my turn.
- **The race fix moves the reactions-only question about 150 ms closer to its line.** At a human table `_drain` paces
  them anyway, and main's LIVE tests ran green beside it (Gates), but no human has played on these bytes.
- **Every arena number since v0.6.144 carried the dead clock**, about 3 s per bleed total and the odd lost block. The
  next re-measure needs a fresh baseline on v0.6.206; comparing it with older series mixes two timings.
- **The lab measures one turn.** It covers a Malkavian actor, bot defenders and hands built to fire the order. It does not
  see the turn after, the combats' consequences or a human defender. The five tables where arm 2 lost were all a prey
  holding a wake. A sharper read would count the prey's wakes as bodies (the knowledge layer), and I have not built it.
- **Arm 2's 'out-number' is my actors against my prey's unlocked bodies at the minion phase's start.** In the arena it was
  true 7 times in 8, in the lab 4 in 9. So the default 2 would hold most of the time in real play, and the arena's typical
  probe turn is the lab's good case. I read that as a point for 2, but it is a reading.
- **Between bots a contested block's verdict waits for the actor's clock** (the five 'blocked at the clock' windows,
  ~3.3 s). That is how the contest has always resolved between bots. It is not changed here, and it is time a human
  watching a bot-vs-bot block also waits.

## Next
1. Johan's call on the probe default (§3), and on the chat-beat proposal (§4, "kör" builds it).
2. In Johan's order (READ-ME-FIRST-2026-10-16e, "After R4"):
   - the 14 Oct play-test scenario in main's rig (`--dir` on a scratch copy of the root with the bot branch);
   - then the larger re-measure — `dodgeOut` and `probeHold` can be benched there. Re-measure against a baseline run
     on v0.6.206: every arena number since v0.6.144 carried the dead bleed-total clock (§2b).
3. Parked, as in READ-ME-FIRST-2026-10-16f "Next" §6.
