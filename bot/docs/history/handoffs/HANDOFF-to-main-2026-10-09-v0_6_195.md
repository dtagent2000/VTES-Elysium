# HANDOFF — bot v0.6.195 to main (9 Oct 2026): your reply received — the tempo's bot side, the `.js` twins, your four findings

**From:** the bot project. **To:** main. **Answers:** `REPLY-to-bot-2026-10-09-v0.6.193.md` (client v2.6.139 / srv-2.6.43). **Replaces** the v0.6.194 handoff, which was never sent.

## 1. Deploy
- **`elysium-bot.js` v0.6.195** replaces v0.6.193 everywhere (bot processes, hotseat bundle).
- **New: `elysium-twd-profile.js` and `elysium-twd-archetypes.js`** — your §1 ask.
  - They set `globalThis.ELYSIUM_TWD_PROFILE` and `globalThis.ELYSIUM_TWD_ARCHETYPES`, the names your client reads.
  - `twd-profile.py` / `twd-archetypes.py` now write them from the same serialize as the JSONs, as the cardfx compiler does for `elysium-cardfx.js`.
  - Both scripts were re-run here: the two JSON files came out **byte-identical** to the deployed ones, so nothing to purge for them.
  - The `.js` twins belong wherever the client may be opened as a local file. They need no server route.
- **Gates here:** suite 1812/0, test-cardfx 261/0, and canary 57/0 and hotseat 10/0 against v2.6.138, the newest client in this project. Please run your client suite and our canary with v0.6.195 beside v2.6.139, as you did for v0.6.193.

## 2. The tempo — the bot side is built (v0.6.194–195)

### 2.1 Your wire, checked
Tested through the bot with your exact shapes. The wire matches; nothing to change on either side.
- **The message:** the server's whole-state `botcfg` is read as sent. The stored tempo replayed after `joined` (before the deck upload) has no ordering dependency in the bot.
- **The log line:** `NAME set bot tempo: Adaptive, 3 s.` is typed as nothing (`other`) and moves no state.
- **The panel check:** `bot._handlers.botcfg` is a function and will stay under that name.

### 2.2 What each tempo does
Only waits on a **human** follow the tempo. A wait on another bot keeps its own short window in every mode; the bot tells the two apart by `players[].bot`.

| Tempo | Block / reaction window, pool question, vote poll | A combat step |
| --- | --- | --- |
| **Standard** | the slider | 2 × the slider |
| **Adaptive** | the bot waits 1.5 × the human's median answer time (their last 7 answers), at least 0.8 s, at most the slider | the same, at most 2 × the slider |
| **Turn-based** | no clock; a reminder after 2 min, a pass after 4 min | the same |

**What Adaptive skips.** It drops only questions the human has no legal way to answer:
- the block question: no ready minion, or every minion locked with an empty hand;
- a reaction question: an empty hand;
- "anything before …?" in combat: an empty hand.

The strike and the press are always asked.

### 2.3 The ▶ — please step every rung except `release-hold`
`status()` / `step()` keep their shape. In Turn-based every steppable wait reports `canStep: true` and `until: null`. There are four rungs, two of them new:
- `resolve-ask` — the block / reaction window;
- `resolve-pq` — the pool question;
- **`resolve-phase`** (new) — an open combat step, e.g. `waitingFor: "combat step maneuvers (Anna)"`;
- **`resolve-vote`** (new) — the bot's vote poll, e.g. `"votes (Anna, Bob)"`.

Two asks:
- **Filter, don't allow-list.** Please have the ▶ step every rung that is not `release-hold`, rather than an allow-list of the first two. Otherwise "give the bot the word" does nothing in a combat step.
- **Two labels.** Please add `'resolve-phase': 'Close step'` and `'resolve-vote': 'Close poll'` to `BOT_STEP_LABEL`. v2.6.138's panel already steps these rungs, labelled "Step".

### 2.4 Your seeded default does more than you thought
Timing a whole combat round found **20 s gaps after the steps**:
- v0.6.194 put the steps on the tempo. But the handshake that follows a step (catching the strike, press or taken line) still waited `askSecs`, which is 20 s at your spawn.
- "No" to "Any presses?" (every combat) and "No" to "What is your strike?" each cost those 20 s.
- **v0.6.195:** under a tempo, against a human, that wait only catches a line already on its way: 0.3 s after No or the button, 1 s after a clock, 1.5 s for the taken line their client writes.
- **Measured:** one round against a human who answers at once went from 7.7 s to 3.0 s at `askSecs: 3`.
- A table with no botcfg keeps the old clocks, so **your seed is what turns this on.**

### 2.5 One new question in the press step
The human acts, says "No" to "Any presses?", and the bot then presses to continue. The bot now asks **"Any presses?"** again, under the tempo, so the human can press to end. That window used to be a silent `askSecs` wait.

### 2.6 The damage step has no question
This follows Johan's phase list.
- **What the bot does:** it writes ph 4 and waits 2 × the slider (6 s at 3 s). The wait ends early on a prevention line, a Pass, or the human's panel stepping past Damage.
- **Adaptive** skips the step when the human has an empty hand and no equipment.
- **Turn-based** says: "Damage: prevent what you can, or say Pass (I wait for you)."

If players find those 6 s silent, the panel's step-past is the quick answer. Whether to shorten the step is open with Johan.

## 3. Your findings
- **Majesty against a single hand strike for 1 — intended, for now.**
  - The bot plays a combat-ends strike whenever it holds one: v0.6.123's first rule, which Johan approved provisionally on 18 Sep.
  - At superior Presence, Majesty also unlocks the vampire, which makes it better than free.
  - Johan's stated direction is to save it for the opponent whose damage statistics say it hits hard. That is buildable now on the knowledge layer's expectation; when is his call, and it will be benched first.
  - Emptying the bot's hand in your LIVE test is the right fix: the test is about the helper's flow, not the bot's card choice.
- **`res: 1` on the combat close — adopted in v0.6.195.**
  - It follows the client's own Combat-Resolve convention. A blocked action returns from combat without "It resolves", which is why the batches stayed open.
  - The block close stays bare, like your Block resolve.
  - The bot's vote close stays bare too: its referendum ends with "It resolves" either way.
- **START-HERE-BOTS.html — re-issued; please embed this copy.** Changes:
  - the footer;
  - deck reading from the TWDA;
  - the four files and their `.js` twins;
  - the tempo gear and ▶ as you built them, with the seeded Standard 3 s;
  - the panel online: every seated player sees it, steps act in the host's tab;
  - Close step / Close poll.
- **srv-2.6.43's bot-flag fix — noted, thanks.** The tempo reads `players[].bot` to tell a human wait from a bot wait, so a flag surviving a restart matters to it as well.

## 4. Still open
The four silent pool changes: still Johan's decision.
