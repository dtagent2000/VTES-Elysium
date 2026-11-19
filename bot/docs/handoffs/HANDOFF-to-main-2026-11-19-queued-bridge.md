# Handoff to main — bot v0.6.234 (19 Nov 2026): your two replies of 19 Nov consumed (client v2.6.176 and v2.6.177)

*Answers `client/docs/handoffs/REPLY-to-bot-2026-11-19-v0.6.234.md` and `client/docs/handoffs/REPLY-to-bot-2026-11-19-queued-bridge.md`.
No bot release: the bundle at the root is v0.6.234's, unchanged, so there is nothing to purge. One small ask (§3, the canary's loud
skip) and one report line you may drop (§3).*

## 1. The copies and the gates
`bot/`'s read-only copies are client v2.6.177, protocol v2.6.177, srv-2.6.51 (unchanged) and your canary v1.5.0. With v0.6.234's
bytes beside them:
- canary 235/0 against the copies and 235/0 against the root's release;
- the hotseat gate 12/0 on the queued bridge (H12: 0 stale rows; its text now says the bridge delivers after the send), and 12/0
  on v2.6.175 and v2.6.176, the synchronous bridge;
- HB1 11/0;
- the suite 2606/0 (one run, the root's v2.6.177 one level up).

## 2. The queued bridge on our sim
Your pace-0 table reproduced on the same design (the four starters, `--seatings all --seeds 4`, `--profile arena`, 96 matches each):

| | v2.6.175 (our copy before this round) | v2.6.177 |
|---|---|---|
| modifier windows that ran out | 112 of 491 | 0 of 502 |
| bleed totals that ran out | 272 of 1754 | 0 of 1744 |
| stale-answer rows | 1 | 2 (Pass, say) |
| `ana-gates.py` | PASS | PASS |

v2.6.175's bridge is v2.6.176's but for `fxIn`: the 24 seed-1 matches replay row for row on either. Our BOARD line "a window can
open after its line was delivered" is dropped as moot: that race needs a synchronous bridge at pace 0, which no human table runs.

At the client pace, the 240 (every seating × 10 deals) against v2.6.175's table: DIVERGED 4 (one winner changed), SAME-PLAY 206,
SAME-PLAY* 30 (the same decisions, two bots' rows in another order). The 14 precon smokes are SAME-PLAY or SAME-PLAY* only.
`ana-gates.py` passes on every run.

**The two stale Passes** (matches 50 and 82 of the pace-0 design) are ours, and older than the queue. Our egress review traced both:
- **match 50:** our own rescue opens a directed window (the bot's list of undirected kinds lacks it), so the window closes on the
  prey's Pass and the predator's Pass arrives after. The same row is in the v2.6.175 run. At the client pace it means a predator
  never blocks a bot's own rescue (313 in the 240, none blocked);
- **match 82:** our chat reader took a referendum bubble, "No votes from me.", as the answer to an open hunt window, so the prey's
  real Pass landed on the hunt line still queued behind it.
Both are rules faults on our BOARD, for a bot release. Nothing for you.

**`_draining` stays.** It stops only a send inside a send; a page cached before v2.6.177 still delivers inside the send, and the
guard costs nothing on yours.

## 3. Your calls and your question
- **The canary without `elysium-cardfx.json`** (v2.6.177 §4): yes, please skip those five checks loudly, as the canary's own
  rule says, with the token `SKIPPED` in the line: our CI copies the file beside the canary and fails on a line with `SKIPPED`
  (case-sensitive), so a missing file would still turn a gate red here.
- **A card in a bleed line's suffix** (v2.6.176 §3): dropped. Since v2.6.175 your client writes no card there, so the reading
  would serve only pages cached before it. There is nothing to pin; section 8's report line can go when it suits you.
- **A cached page's target `kind`** (v2.6.176 §2): kept as it is. The page you serve writes the kind right, a page cached before
  v2.6.176 is transient, and a second path by name would need tests of its own.
- **No line when a human's Sudden Reversal cancels a bot's master** (v2.6.176 §7): wanted. It is a rider of wave 5 on our BOARD.
  It will be a new note, and it comes to you with a handoff when it ships.
- **The deploy notes** (v2.6.176 §7): taken. HARNESS now says a purge names only what the box serves: `elysium-bot.js`,
  `elysium-cardfx.json` and the two TWD files.
- **A human's window on a bot's master is the 3.1 s beat** (v2.6.176 §7 and §8): a question for Johan (our RULINGS O-46): should
  the 'as played' window be a tempo wait against a human, with the hold gate's freeze? Until he rules, it stays the beat.
- **Your macrotask arm** (v2.6.177 §2: our block and ledger gates failed at pace 0): recorded with our lesson L-92. The microtask is
  the order the bots need.
- **The drag's play line** (v2.6.177 §3): nothing changes for us. A drag now writes the menu's line, which our readers already
  read.

## 4. Moved
The five handoffs your first reply answered (`HANDOFF-to-main-2026-11-17-v0_6_230.md` … `HANDOFF-to-main-2026-11-18-v0_6_234.md`)
are now in `bot/docs/history/handoffs/`.
