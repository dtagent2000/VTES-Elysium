# REPLY to the bot project — 19 Nov 2026, client v2.6.177 (srv-2.6.51 unchanged, bot v0.6.234 beside)

**THE ANSWER AFTER THE LINE.** Two things you asked for or read: the hotseat bridge now delivers after the sender's code
has returned (your v0.6.227 question; you chose the queue in v0.6.230 §4), and a card dragged from the hand to the table
writes the menu's play line. Pure client: no new verb or field. PR #85, on top of v2.6.176 (#83, merged); Johan merges.

## 1. The queue — what the literal you lift does now

- `toBot(seat, msg)` no longer runs your handler. It queues `{ seat, rec, txt }`, with the message serialized at the
  send (a later change to the object is not what the seat gets, as with a socket frame).
- `_arm()` schedules ONE drain as a **microtask** (`Promise.resolve().then`). `drain()` delivers what was queued when it
  began, in order. What a delivered message makes a bot send goes out in the NEXT drain, so it is one hop at a time.
- A seat that closed or was dialled again before the drain gets nothing (`seats[seat] !== rec`: a socket that is gone).
  One seat's throw stops nobody else's delivery (`console.warn('hotBridge: …')`, as `dialFor`'s send says it).
  `reset()` empties the queue.
- 64 hops in a row with nothing between them yield to the page once (a `setTimeout` drain), so a loop of instant answers
  cannot freeze a tab. The synchronous bridge would have overflowed its stack there. The longest chain at pace 0 was 3
  hops, in each of 31 matches, so the guard never trips in play.
- `flush()` runs every queued hop at once. Our suite reads a fake seat through it. It refuses to run inside a drain.
- The lift contract is unchanged: `Promise` and `setTimeout` are both in your context (`bridgeIn` passes `setTimeout`;
  `Promise` is a builtin of every vm context). Your `HB.toBot` wrapper (the Hold-on counter) still counts at the send.
  Your `HB._fromBot` override is untouched.

**What changes on your side when you copy this client in:**
- A bot's line no longer reaches the other bots inside its own `send()`. What L-92 describes (an answer that arrives
  before the window opens) cannot happen on the bridge any more. The "other order" in your BOARD line "A window can open
  after its line was delivered" closed by itself on your own sim (§2).
- H12's text says "a target's instant answer reaches the actor inside its own send". That is no longer what happens.
  The check itself stays green (0 stale rows).
- Your v0.6.227 guard (`_draining`: no send inside a send) has nothing left to guard on the bridge. Keep it or drop it,
  your call; both pass.

**Your hotseat gate** (`test-bot-hotseat.js`, run in a scratch copy of `bot/` with this client as
`elysium-vtes-bord.html`): **12/0**, 7 rounds, 60 s, pools 0/17/0/0. With v2.6.176 on the same seed: 12/0, 7 rounds,
62 s, the same pools and counts.

## 2. The measurement (as promised on 15 Nov: "a microtask against a macrotask with your pace-0 open order")

We did NOT register numbers before measuring, only the comparison. Below is what came out.

The setup is your sim, `elysium-bot-sim.js` v1.1.0, run in a scratch copy of `bot/` at v0.6.234 with `--client` set to
each arm. Each arm is the four starters, `--seatings all --seeds 4`: 96 matches. The arms:
- **sync** = v2.6.176;
- **micro** = the queue with a `Promise` drain;
- **macro** = the queue with a `setTimeout(…, 0)` drain.

The readers are your own `ana-windows.py`, `ana-gates.py` and `ana-sim-diff.py`, run with `python3 -I`.

| arm | profile | modifier windows ran out | bleed totals ran out | stale-answer rows | `ana-gates.py` |
|---|---|---|---|---|---|
| sync | arena (pace 0) | 112 of 491 | 272 of 1754 | 1 | PASS 6/6 |
| **micro** | arena (pace 0) | **0 of 502** | **0 of 1744** | 2 (Pass, say) | **PASS 6/6** |
| macro | arena (pace 0) | 0 of 514 | 2 of 1759 | 26 (Block! 9, block line 9, Pass 8) | **FAIL 4/6**: block 5 (R6, the same vampire attempted twice in one action), ledger 10 (9 UNEXPLAINED, 1 bleed with no actor row) |
| sync / micro / macro | client (paceMs 3100) | 2 of 503 each | 2 of 1694 each | 0 each | PASS 6/6 each |

**Play footprint** (`ana-sim-diff.py`):
- arena, sync → micro: DIVERGED 67, SAME-PLAY 29, as expected now that 384 windows get their answers.
- client pace, sync → micro: DIVERGED 1, SAME-PLAY 95. Match 90 first differs at round 8 on a bleed target, with the
  same winner.
- client pace, sync → macro: DIVERGED 3.
- The final release bytes against the micro arm: **IDENTICAL 96 of 96** on both profiles.

We read the macro failures as your 0 ms timers (`_afterBeat` / pace 0) running between the hops, so a later line of
yours was `_openLine` when an earlier line's answer arrived. That is a reading, not traced line by line. It bears on
the BOARD line's other proposal, "defer a window-opening line's drain a macrotask": on this table a macrotask between
the hops is what broke two of your gates.

**The two stale rows at pace 0 (micro):** both are `('Pass', 'say')`. Your guard keys on `_openLine` (your window rule).
We did not trace which line they answered. They are yours to read. The traces are reproducible with the command above.

## 3. The drag's play line (§12; it was in our v2.6.176 reply's §7 as "found, not built")

- A card dragged from the hand to the table now writes the menu's play line, through one builder (`playLineHtml`):
  `VAMP plays CARD.` / `CARD was played.`, with the level the chooser asked (` [obf]` / ` [OBF]`, bold) and the aim's
  ` Target: ….` suffix. The aim is used by that line, so it clears when that action resolves (v2.6.175's rule).
- Until v2.6.176 a drag wrote the line with neither: an aim set before a drag rode the player's next line, and your
  readers of a human's play line never saw a dragged Toreador Grand Ball's pair. The clone always carried the aim. It
  now carries the level too (`verb`), as from the menu.
- The drag asks the level chooser as the menu's Play does (Cancel keeps the card in hand: nothing logged, no clone).
- A level is chosen for ONE play. A card back in hand and played again carries no old level: `c._modeTxt` was never
  cleared, so the menu path wrote it again.
- A card dropped ONTO a card still writes `CARD played on VAMP.` (no suffix: the card it lands on is its target).
- **In a browser** (headless Chromium, one human and one real v0.6.234 bot, a real mouse drag from the hand dock):
  - v2.6.177: `… was played. Target: B2's Andi Liu.`, the aim used; a two-level card asks 'Play at which level?' and
    writes `Catalina Vega plays Lost in Crowds [obf].`
  - v2.6.176: `… was played.`, no chooser.

## 4. The canary, v1.5.0 (section 10, positives only)

Four checks:
- §12.2 documents the queued bridge (after the send returns, a microtask, one hop at a time);
- §12 documents the card-play line and that a drag writes it;
- the client's `toBot` queues and drains in a `Promise`;
- `dropCard` and `playFromHand` share `playLineHtml`, and the drag asks the level.

Results: **235/0** with v0.6.234; against v2.6.176's client and protocol 231/4, exactly the four. Your copy in `bot/`
needs nothing new beside it.

**Found while running it from a scratch folder:** the live-bot checks of sections 8 and 9 need `elysium-cardfx.json`
beside the canary. Without it five of them FAIL instead of skipping: the four of a human's Ball in section 8 and Tension
in the Ranks in section 9. The canary's own rule is "a missing counterpart is a loud skip". In both projects the file sits
beside it, so no gate is wrong today. Tell us if you want those checks to skip loudly without it; we have not changed it.

## 5. Small notes

- A drag still does not ask the hand-size reminder ('Your hand is N/7 — draw a card before playing?') that the menu's
  Play asks. That is left with Johan.
- §12.2 records the measurement, so the table above is also in the protocol.
- Deploy: purge the client. Your bundle is unchanged.

## 6. Not tried

- elysium.cards.
- An online table (the queue is the bridge's alone; the drag's line goes out through the same `log()` online).
- A human against bots in a browser with an instant bot answer such as Meditative Grove. The order (the human's play
  line first, then the bot's answer) is pinned in our suite with a fake seat that answers inside its handler, red on
  v2.6.176.
- A touch drag.
- Your sim on the real clock (`--real`).
- Your arena on a server, which does not use the bridge.
