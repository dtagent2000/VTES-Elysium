# SPEC — bot tempo: the gear in the Bot button (27 Sep 2026)

**From:** the bot project (Johan's design, 27 Sep). **To:** main. **Why:** "the timing when playing against bots is very frustrating" (player feedback). Every wait the bot makes on a human — block, reaction, vote, the seven combat steps — runs on fixed clocks today (`askSecs` 2–3 s, `phaseSecs` 6 s). The humans at the table should own those clocks and be able to change them mid-game.

## 1. What the player sees

A **gear icon in the Bot button** opens *Bot settings*. Any human at the table can change them, at any time, and the change applies to **every bot at the table at once**.

| Setting | Control | Meaning |
| --- | --- | --- |
| **Tempo** | three choices | *Standard* · *Adaptive* · *Turn-based* (below) |
| **Wait time** | slider, 1.0–8.0 s, default 3.0 | Standard: the base clock for every wait. Adaptive: the ceiling. Turn-based: unused (greyed) |

Optional later rows in the same panel: how talkative the bots are, whether they narrate their reasoning. The panel is the one place for bot preferences.

A change writes one log line: `Johan set bot tempo: Adaptive, 3 s.`

## 2. The three modes (the bot's side)

- **Standard.** Every wait uses the base clock: block window and reaction question = base; a vote window = base; a combat step (`phaseSecs`) = 2 × base. The clock restarts on the human's activity, as today. Pass / No / It resolves / a combat line still end a wait at once.
- **Adaptive.** The slider is the ceiling. The bot measures each human's actual response time (a running median over their last answers) and waits about 1.5 × that, never above the ceiling and never below 0.8 s. It also **skips a question the human cannot act on**: no ready, unlocked minion → no block question; an empty hand (hand size is public) → no "anything before …" question; a human who has answered "no press" the last three times still gets asked (that is a decision, not a capability).
- **Turn-based.** No clock. The bot writes what it waits for (`Waiting for your block decision — Pass or Block.`) and stands still until the human answers: Pass, a line, a combat-menu action, or **the Bot button itself** ("give the bot the word"). Safety net: after 120 s a chat reminder; after 240 s the wait resolves as a pass, so an abandoned table never hangs.

**Bot-vs-bot is untouched in every mode.** The bots' own handshake keeps its short windows; the tempo governs only waits on humans.

## 3. The message

Client → server → every client and bot (the same relay shape as `tally`):

```json
{ "t": "botcfg", "who": "Johan", "tempo": "adaptive", "waitSecs": 3.0 }
```

- `tempo`: `"standard" | "adaptive" | "turn"`. `waitSecs`: number, 1.0–8.0.
- The server **stores the latest** and sends it to a bot that joins later (a bot seated mid-game must get the current tempo).
- Partial writes allowed (only `tempo`, or only `waitSecs`); absent fields keep their value — the v2.6.17 rule.
- Hotseat: the same message through the bridge; the panel is the same.

## 4. What the bot does with it (the bot project's part)

- One tempo object replaces the fixed knobs in the five wait functions (block, reaction, vote, combat step, the damage step).
- `askSecs` / `phaseSecs` remain as start-up defaults for a table that never sends `botcfg` (bot-only arenas, old clients).
- New trace rows: `wait` per human wait (kind, mode, waited ms, how it ended), so a session can be measured: seconds per turn spent waiting, by step.

## 5. Please decide / confirm

1. **Who may change it:** anyone at the table (proposed), or the host only?
2. **The Bot button in Turn-based** doubles as "give the bot the word" — a second tap while the bot waits ends the wait. OK?
3. **Default when no one has touched the panel:** Standard, 3.0 s (proposed).

## 6. Order of work

Main: the panel, the message, the server store-and-relay, the log line. Bot: the tempo object, Adaptive's measurement and skips, Turn-based's safety net, the `wait` trace rows. Both sides can be built in parallel; the bot without a `botcfg` behaves exactly as today.
