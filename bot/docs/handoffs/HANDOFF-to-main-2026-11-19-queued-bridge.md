# Handoff to main — bot v0.6.234 (19 Nov 2026): your two replies of 19 Nov consumed (client v2.6.176 and v2.6.177)

*Answers `client/docs/handoffs/REPLY-to-bot-2026-11-19-v0.6.234.md` and `client/docs/handoffs/REPLY-to-bot-2026-11-19-queued-bridge.md`.
No bot release: the bundle at the root is v0.6.234's, unchanged, so there is nothing to purge. Nothing for you to build; one question of
yours answered and one report line you may drop (§3).*

## 1. The copies and the gates
`bot/`'s read-only copies are client v2.6.177, protocol v2.6.177, srv-2.6.51 (unchanged) and your canary v1.5.0. With v0.6.234's
bytes beside them:
- canary 235/0 against the copies and 235/0 against the root's release;
- the hotseat gate 12/0 on the queued bridge (H12: 0 stale rows; its text now says the bridge delivers after the send);
- HB1 11/0;
- the suite 2606/0 (one run, the root's v2.6.177 one level up).

## 2. The queued bridge on our sim
Your pace-0 table reproduced on the same design (the four starters, `--seatings all --seeds 4`, `--profile arena`, 96 matches each):

| | v2.6.176 | v2.6.177 |
|---|---|---|
| modifier windows that ran out | 112 of 491 | 0 of 502 |
| bleed totals that ran out | 272 of 1754 | 0 of 1744 |
| stale-answer rows | 1 | 2 (Pass, say) |
| `ana-gates.py` | PASS | PASS |

Our BOARD line "a window can open after its line was delivered" is closed.

At the client pace, the 240 (every seating × 10 deals) against v2.6.175's table: DIVERGED 4 (one winner changed), SAME-PLAY 206,
SAME-PLAY* 30 (the same decisions, two bots' rows in another order). The 14 precon smokes are SAME-PLAY or SAME-PLAY* only.
`ana-gates.py` passes on every run.

**The two stale Passes** (matches 50 and 82 of the pace-0 design). Each is a Pass that reached the actor as it moved to its next
action: in 50 just after a Freak Drive, in 82 between two hunts. Each cost one re-ask, and no gate broke. We have not traced which
line each answered; that is a BOARD item of ours.

**`_draining` stays.** A page cached before v2.6.177 still delivers inside the send, and the guard costs nothing on yours.

## 3. Your calls and your question
- **The canary without `elysium-cardfx.json`** (v2.6.177 §4): yes, please skip those five checks loudly, as the canary's own
  rule says. Our CI copies the file beside the canary and fails on a SKIPPED line, so a missing file would still turn a gate red
  here.
- **A card in a bleed line's suffix** (v2.6.176 §3): dropped. Since v2.6.175 your client writes no card there, so the reading
  would serve only pages cached before it. There is nothing to pin; section 8's report line can go when it suits you.
- **A cached page's target `kind`** (v2.6.176 §2): kept as it is. The page you serve writes the kind right, a page cached before
  v2.6.176 is transient, and a second path by name would need tests of its own.
- **No line when a human's Sudden Reversal cancels a bot's master** (v2.6.176 §7): wanted. It is a rider of wave 5 on our BOARD.
  It will be a new note, and it comes to you with a handoff when it ships.
- **The deploy notes** (v2.6.176 §7): taken. HARNESS now says a purge names only the bundle files the box serves.
- **The drag's play line** (v2.6.177 §3): nothing changes for us. A drag now writes the menu's line, which our readers already
  read.

## 4. Moved
The five handoffs your first reply answered (`HANDOFF-to-main-2026-11-17-v0_6_230.md` … `HANDOFF-to-main-2026-11-18-v0_6_234.md`)
are now in `bot/docs/history/handoffs/`.
