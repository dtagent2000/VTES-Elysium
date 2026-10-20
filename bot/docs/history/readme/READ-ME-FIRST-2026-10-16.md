# Elysium Bots — delivery 16 October 2026: bot v0.6.199 → **v0.6.200** (R1 of the play-test review) — DEPLOY CANDIDATE

**What it is.** R1 of `docs/reviews/REVIEW-playtest-2026-10-14.md`: the rules and deadlocks main's 14 Oct play-test found, Johan's Theft of Vitae report, and his ruling of 16 Oct that debug is for humans only. R0 (v0.6.199) is merged (PR #14).

## 1. Deadlocks and waits
- **Point 8, Turn-based.** A contested undirected block ended only when the human passed last. When a bot passed last, the bot restarted a clock that Turn-based never arms, and the table stood still.
  - Now whoever passes last ends it.
  - The Turn-based reminder is read when it fires, and says nothing when nobody is left to wait for.
- **Point 9.** The human's client writes its taken line when the table steps past Damage resolution, after the bot's ph 5. The bot took it as the answer to "Any presses?". Taken and prevent lines now answer the damage step only.

## 2. Rules
- **Point 1, the right to block a directed action.**
  - The bot records the aim: the client's ` Target: NAME's X.` suffix. A card's action row inherits it from the play line before it. With no aim, the actor's prey is the target.
  - The bot records whether the action is directed, from the verb or the played mode's `dir`.
  - Only the target asks what a directed action costs or may block it.
  - A seat that is neither prey nor predator says nothing about any undirected action.
- **Point 15, a reduced bleed stays reduced.**
  - The acting bot reads its target's reduce line and lowers its total.
  - The target that reduced counts the actor's `+N` on top of its own amount.
  - A bleed of 0 is not successful: no Edge, and the line says "The bleed goes through at 0".
  - Found in the review of this change: a human's referendum that cost the bot pool took the bot's Edge. An undirected action never moves the Edge now.
  - Found by the arena smoke (v0.6.200 against v0.6.199): Larissa's +1-bleed discard did not reach the bot's own record of the bleed, so a bot target took 1 on her announced 2. Fixed. `ana-ledger.py` now tells a reduced bleed from an unexplained one.
- **Point 20, the Edge.** Taking it is said on the wire (`edgeTake`). Another seat's `edgeTake` clears mine; an `edgePass` to my seat gives it to me. Online the human's client now clears its own Edge; offline that waits for main's bridge.
- **Point 22 and Johan's Tremere.** A card counted as dead when no READY vampire could use it. With no vampire out yet, the first card went (Theft of Vitae). Now every vampire of mine judges — ready, in torpor or uncontrolled — and with none at all, the deck's crypt.

## 3. Accounting and wording
- **Creeping Sabotage counted once.** The predator's "ticks" note is gone. The event log tells the frozen line, the note and an ack apart, and the known losses count the line only.
- **Point 19.** The steal is rules-correct; the round line now says what drained, e.g. "steals 2 blood; 1 drains off at capacity 6".

## 4. Debug for humans only (Johan, 16 Oct)
- **Who sees the hand:**
  - with only humans beside the bot: the whole table (`to:'all'`, spectators too), as before;
  - with another bot at the table: each human seat, one by one. Spectators then see no hand.
- **The audience follows the roster.** A human back online gets the grant again. A seat that leaves the audience is revoked on its own, so the humans' view never blinks.
- **Revelations [AUS]** still opens the hand to every player: that is the card's text.
- **Command line:** `--debug` and `--no-debug-weights`.
- **Tournament:** the bot reads the room's helper policy. It refuses debug at a Tournament table and leaves debug when the table turns Tournament.

## Gates
- `node --check` on every changed file; `ana-ledger.py` compiles.
- Suite **1985/0 ×3** on the final bytes (srv-2.6.46).
- Section 139 run alone: 43/0. Against v0.6.199 in a scratch directory: 32 red, the 11 guards green on both, no abort.
- Canary **57/0** against v2.6.158 and protocol v2.6.158.
- HB1 **11/0**.
- Hotseat gate **10/0** against v2.6.158 (tally relayed, the net asleep).
- Main's client suite with v0.6.200 beside it (copied in and removed again): 287 passed, 1 red — the expected embed drift for START-HERE-BOTS.html. All 11 LIVE bot tests green.
- `check-versions.js`, root row: "everything agrees".
- test-cardfx not run: the cardfx files are unchanged.
- **Arena smoke** (the four starters, Expert, pool 30): no timeouts.
  - v0.6.200 against v0.6.199 on seed 4001, 2 + 2 matches, then 2 more on the final bytes (seed 4002).
  - `ana-ledger.py` on the final bytes: every bleed pairs — equal, more by the actor's modifiers, or less by the target's own reduction. The steal pairs are equal. The seed-4001 arm had found one unexplained short bleed (Larissa's lost +1), fixed since.
  - `ana-inv.py`: 1 / 2 / 8 flags. Most are "my strike 1, the Ventrue opponent took 0", in both versions. The rest: one taken-above-dealt row in a Nosferatu fight (the combat round, R2), and one pool drift from an equipment's pool cost that has no event (`_doEquip`, older than this release).

## For main
- Send `HANDOFF-to-main-2026-10-16-v0_6_200.md`:
  - the bridge must relay `edgeTake` now;
  - the Debug tooltip and `PLAYTEST.md`'s Edge line are out of date;
  - the 15 Oct debug items are still open.
- Deploy `elysium-bot.js` v0.6.200 and re-embed `START-HERE-BOTS.html`. The cardfx and twd files are unchanged.

## Next
R2:
- the bot-vs-bot combat handshake (points 16, 17, 7);
- pacing bot-vs-bot combat when a human is seated;
- a hold stops the bot's own combat moves (5);
- the range correction only from my own human opponent;
- Roundhouse's damage (18).
