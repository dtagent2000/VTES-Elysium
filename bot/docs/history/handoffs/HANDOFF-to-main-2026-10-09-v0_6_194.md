# HANDOFF — bot v0.6.194 to main (9 Oct 2026): the tempo's bot side is built — the panel, the message and the relay are yours

**From:** the bot project. **To:** main (built against client v2.6.138 / srv-2.6.42). **Supersedes nothing:** the 28 Sep handover (v0.6.193: deploy, `twdProfile` / `twdArchetypes` in the browser bundle, the silent pool lines) still stands; this one adds the tempo.

## 1. Deploy
`elysium-bot.js` **v0.6.194** replaces v0.6.193 everywhere (bot processes and the hotseat bundle); the three JSON files beside it are unchanged. Gates: suite 1803/0, canary 57/0 vs v2.6.138, hotseat 10/0. **No new line, no new tally field, nothing new sent by the bot.** The one wire change is that the bot now *listens* for one message, `botcfg` (§2). Without it, v0.6.194 waits exactly like v0.6.193.

## 2. The message the bot reads — exactly as the spec (`spec-bot-tempo-2026-09-27.md` §3)
```json
{ "t": "botcfg", "who": "Johan", "tempo": "adaptive", "waitSecs": 3.0 }
```
- `tempo`: `"standard" | "adaptive" | "turn"` (case-insensitive; an unknown value is ignored). `waitSecs`: a number, clamped to 1.0–8.0 (one decimal).
- **Partial writes** are fine: a message with only `tempo` or only `waitSecs` keeps the other field (the v2.6.17 rule). The very first message fills a missing field with the spec's default — Standard, 3.0 s.
- `who` is used for the log only ("tempo: adaptive, 3 s (set by Johan)").
- A change **re-arms any open wait at once**: a 240 s Turn-based wait becomes a 3 s Standard wait the moment the message arrives, mid-combat included (suite 128e).
- Hotseat: the same message through the bridge, to every bot seat (`hotBridge.toBot(seat, m)` for each bot). Online: client → server → every seat, like `tally`; the server stores the latest and sends it to a bot that joins later. **Whether the client sends the default (Standard, 3.0) at table start or only on a change is your choice** — note that a bot that never receives one keeps today's clocks (20 s block, 60 s combat step), so the players only get the new default once something sends it.

## 3. What the bot does with it (built)
| Tempo | Block / reaction / pool question / vote poll | Combat step, damage step |
| --- | --- | --- |
| **Standard** | the slider | 2 × the slider |
| **Adaptive** | 1.5 × the human's median answer time (last 7 answers), floor 0.8 s, ceiling = the slider | same, ceiling = 2 × the slider; questions the human cannot act on are skipped (no ready minion; every minion locked with an empty hand; "anything before …?" with an empty hand). The strike and the press are always asked. |
| **Turn-based** | no clock — the question ends "(no clock — I wait for you)"; a reminder in chat after 120 s; after 240 s the wait resolves as the clock would (a pass / the verdict from the counter), with a note | same; the question carries "(I wait for you)", the damage step says "Damage: prevent what you can, or say Pass (I wait for you)." |

Bots waiting on each other keep their own windows in every mode. In Turn-based the bot never rings the room's Reaction stopwatch (`decide`), since its ring would re-stamp a deadline the mode has not got.

## 4. The Bot button in Turn-based = "give the bot the word" — through the seam you already have
`status()` / `step()` are unchanged in shape. Two new steppable waits beside the block window (`resolve-ask`) and the pool question (`resolve-pq`):
- an open **combat step** — `waitingFor: "combat step maneuvers (Anna)"`, `step: "resolve-phase"`;
- the bot's **vote poll** — `waitingFor: "votes (Anna, Bob)"`, `step: "resolve-vote"`.

In Turn-based every steppable wait reports `until: null` (the hold's rule: no number to count down) and `canStep: true` — the panel shows its button instead of a countdown, and a press is the "give the bot the word" of the spec. A press writes a log line ("… combat step closed from the table controls.") like the existing rungs. If the panel labels its button by `step`, two new labels: *Close step* and *Close poll* (START-HERE-BOTS.html calls both "Close step").

## 5. Measuring it
Each wait on a human leaves a `wait` row on the bot's process log — `wait {"kind":"phase","mode":"standard","who":"Johan","ms":6002,"end":"clock","step":1}` — and `python3 ana-wait.py <log>` sums them (seconds waited by kind, how the waits ended: answer / clock / button / skip). For a hotseat session the browser console carries the same lines. The spec's "seconds per turn spent waiting, by step" is that script.

## 6. Your three decisions from the spec (§5) — still yours
1. who may change the tempo (anyone at the table was proposed); 2. the Bot button doubling as "give the bot the word" in Turn-based — built on the bot side as above, so a yes costs you nothing; 3. the default when nobody has touched the panel (Standard, 3.0 s proposed) — and, per §2, whether the client sends it unprompted.

## 7. Not in this release
`whoBlocksGraceMs` (2.5 s after a shouted Block! before "Who blocks?") and `modGraceMs` (4 s for "Any bleed modifiers?") keep their fixed values in every mode — they are graces before the bot's own next step, not waits for an answer; they can join the tempo later if a session's `wait` rows say they matter.
