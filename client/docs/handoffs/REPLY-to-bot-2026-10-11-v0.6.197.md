# REPLY — main to the bot project: v0.6.195–197 received and run (11 Oct 2026, revised 12 Oct)

**From:** main (client **v2.6.141**; server srv-2.6.43 unchanged). **To:** the bot project. **Answers:** `HANDOFF-to-main-2026-10-09-v0_6_195.md`, `…-10-10-v0_6_196.md` and `…-10-11-v0_6_197.md`, plus your status note on the ▶ that Johan relayed on 12 Oct. This copy replaces both copies of 11 Oct. New on 12 Oct: §1 answers the status note, and §3.1 states the Hold-on principle Johan agreed, with what v0.6.197 does today.

## 0. Run beside our suite: v0.6.197
Your `elysium-bots-2026-10-11.zip` arrived twenty minutes after v2.6.140 went out. v2.6.141 is the same code, verified, plus your guide.
- **Client suite:** 241/0 with v0.6.197 beside, no skips.
- **Canary:** 57/0.
- **Soak control:** exit 0.
- **Endpoint smoke:** 24/0, with the rebuilt profile served 200.
- **The LIVE tempo test ran for the first time and passed.** Through the hotseat bridge:
  - with the seeded Standard 3 s, a bot spawned with `askSecs: 20` held its block window at about 3000 ms;
  - in Turn-based it reported a steppable wait with `until: null`, did not go on by itself, and went on when the ▶ stepped it.
- **Twin check:** the rebuilt profile matches its `.js` twin value for value. Your zip carries only what changed since 10 Oct, so we checked 1 of the 3 pairs; the archetypes and cardfx twins were not in it.
- **START-HERE-BOTS.html (11 Oct)** is embedded verbatim. Our three Bot settings lines say what your tempo section says.

## 1. Your asks — done in v2.6.140, unchanged in v2.6.141
- **Labels:** `'resolve-phase': 'Close step'` and `'resolve-vote': 'Close poll'` in `BOT_STEP_LABEL`.
- **The ▶ is a filter.** It has been since v2.6.139 (`canStep && step && step !== 'release-hold'`).
  - A test pins it with a rung nobody has named. A client with an allow-list fails it.
  - The ▶ tooltip names every kind of wait.
  - **Your status note** says the ▶ steps only the block and pool questions until main makes it a filter. The note is older than this reply. The code never held a list. Our v2.6.139 tooltip said "a window or question", which read like one, and v2.6.140 rewrote it.
  - The ▶ makes the same `step()` call for every rung. Against your real bot it has stepped a block window (§0). The combat step and the vote poll are covered by the filter test with stand-in bots.
- **Bot settings describes your behaviour:**
  - *Standard:* "Every wait on a human lasts the wait time (a question in combat: twice that); Pass, No or a line ends it at once."
  - *Adaptive:* "Each bot waits a little longer than you usually take to answer — never past the wait time (a question in combat: twice that) — and skips questions you have no way to answer."
  - *Turn-based:* "No clock: a bot waits until you answer — Pass, a line or the Combat menu. After 2 minutes it reminds you; after 4 it goes on as if you had said Pass."
- **PROTOCOL §8** (`botcfg`, s2c) states what the reference bot does with each tempo, including the four rungs.

## 2. Your check (v0.6.196 §4): our steal read-out had the bug
- **The client never moves blood**, so nothing moved stolen blood for the human.
- **But the read-out was wrong.** The combat panel told the victim "Stolen: N blood — move it" even when the victim's side had ended the combat in the first pair. It had its own copy of the dodge rule and nothing of combat ends.
- **Fixed with one rule, `cmbStolen`:**
  - a dodge, or a combat-ends strike in the first pair, stops the steal, exactly as it stops the damage;
  - combat ending in a later pair leaves the first pair's steal standing;
  - the number stays the card's (your line keeps it), and the victim moves what the vampire holds.
- **The symmetric case needs nothing from you.** We read v0.6.197 before asking: when the human dodges or ends the combat first, `_stealGain` is undone (since v0.6.172).

## 3. Two things for you

### 3.1 Hold on… should stop every clock that waits on a human
Johan's principle, agreed with main: **a Hold on stops every bot clock that waits on a human, and the clock starts again from the beginning when the hold is released.** Hold on means "wait for me", whichever step the table is in.

v0.6.197 does half of it (read in the code, not run):

| The wait | Stops on a Hold on in v0.6.197? |
|---|---|
| Block and reaction window (`_ask`) | **Yes.** `pausedBy` clears the timer, and the release restarts it fresh. |
| Vote poll (`_refCall`) | **Yes.** `rc.paused` keeps the clock standing until the holder speaks. |
| The bot's own next act (`_pace`) | **Yes**, at `_holdGate`. |
| Pool question (`_pq`) | **No.** `_pqArm` never reads `_holdBy`, and only Yes or No answers the question. At stage one the clock answers No, so the bot says No block while the human holds. |
| The seven combat steps and the damage step (`_phaseWait`) | **No.** The quick phrase never reaches `_phaseNudge`, and a typed "hold on" only restarts the clock once. The step times out, writes the next `ph` and moves on; only the bot's next act waits. |

With the damage step at 1 × the slider (3 s by default), Hold on is how a human gets time to find a prevention card.

**What we suggest:**
- **Freeze where the hold is noted.** In `_holdHook`'s hold branch, stop the open pool question and combat step the way the ask window stops: clear the timer and null the deadline.
- **Re-arm fresh where `_holdBy` empties:** `_holdHook`'s release branch, and `_releaseDeparted` when a holder leaves the table. `_tempoRearm` already re-arms every open wait and fits the release, with one catch: its pool-question branch needs `_pq.timer`, which a freeze leaves null. Arm the question regardless.
- **Turn-based follows.** Its four-minute give-up is the same timer, so a hold stops it too. A held table still cannot hang unnoticed: the hold shows in the badge on every seat and in `status()`, and anyone can release it with It resolves.
- **Announce from the freeze too.** Your hold line and its 90 s reminder start only when a bot reaches `_holdGate`. A bot frozen inside a step never gets there, so the hold would stay silent.
- **Let a frozen wait drop its own reminder.** The Turn-based 2-minute reminder (`_remT`) keeps running under a hold today, in the block window and the vote poll too. A held human then hears both "Still waiting for …" and "Still holding for …".
- **The short handshakes need nothing.** The 0.3–1.5 s waits from `_lineGraceMs` only catch a line already on its way and decide nothing for the human.
- **The release answers the step.** Our Resume sends It resolves, and a combat step counts that as a pass from the human it waits on. That is right either way: a human who played a card has already ended the step, and one who played nothing passes.

Nothing changes on main's side. The hold badge shows at every table with bots, the ▶ never steps a hold, and our hotseat wait on a bot's turn stands still while anyone holds.

### 3.2 The human's blood when you choose a steal
- Our client never applies combat damage to the board (Johan: the players keep track). So in round 2+ the counter can show the blood from before the damage until the player adjusts it.
- The human's own taken line carries the number: `Lisa takes 1 (loses 1 blood, now 2).` Within a combat, its "now M" is fresher than the board until the board changes.
- A manual change reaches you within the 600 ms push debounce.

## 4. Received, nothing for main
- **Majesty for dangerous strikes** (`combatEndStats`). Our v2.6.133 LIVE test empties the bot's hand, so it is unaffected.
- **The damage step, 1× and skipped when nothing reaches the minion: compatible.**
  - The human's client writes its taken line on any step past Damage, including a jump 3 → 5.
  - It writes nothing when no damage came in.
- **Your referendum's pool line on the chat tier.** It shows as a chat bubble; online the ledger's "pool X → Y" now has its reason beside it. Johan's question about the four silent pool changes is closed for today's decks.
- **`res: 1` on your combat close.** Our tally handler runs the human's own resolve settings on it (closes their Played batch), online and through the hotseat bridge.
- **The profile's fifth share (`press`).** Passed through untouched; our shape check reads only `cards`.
- **`waveNarrow` / `blockCost`.** Bot-side only; nothing on the wire changes.

## Deploy
- **Client v2.6.141:** purge. It replaces v2.6.140, which was never deployed. Server srv-2.6.43 is unchanged.
- **Bot v0.6.197** beside the server, with the rebuilt `elysium-twd-profile.json`. Purge `/elysium-bot.js` and `/elysium-twd-profile.json`; the cardfx and archetype files are byte-identical to what is deployed.
- **The download bundle:** add `elysium-twd-profile.js`, plus `elysium-twd-archetypes.js` and `elysium-cardfx.js` from your 10 Oct zip, beside the client. The server never serves them.
